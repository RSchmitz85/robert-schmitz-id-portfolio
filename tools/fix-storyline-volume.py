"""Normalize the seven exported Storyline audio renditions; leave video untouched.

Run once against a fresh pre-fix export. Native .story files are not modified.
Requires ffmpeg/ffprobe. Original files stay in git history.
"""
from pathlib import Path
import hashlib, json, re, subprocess, tempfile, shutil

ROOT = Path(__file__).resolve().parents[1]
COURSES = ['service-recovery', 'support-ticket']

def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout

def measure(path):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af',
                        'loudnorm=I=-16:TP=-2:LRA=11:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True, check=True)
    return json.loads(re.search(r'\{\s*"input_i".*?\}', p.stderr, re.S)[0])

def audio_input(playlist):
    return 'concat:' + '|'.join((playlist.parent / line).as_posix()
        for line in playlist.read_text(encoding='utf-8-sig').splitlines()
        if line and not line.startswith('#'))

def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-of', 'json', str(path)]))['format']

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def decoded_duration(path):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1',
                          '-ar', '48000', '-f', 's16le', '-'],
                         check=True, capture_output=True).stdout
    return len(pcm) / 96000

def main():
    report = {'scope': 'Web exports only; reapply after native Storyline republishing.', 'clips': []}
    for slug in COURSES:
        course = ROOT / 'courses' / slug
        video_hashes = {str(p): digest(p) for p in course.rglob('stream_[123]data*.ts')}
        for playlist in sorted(course.rglob('stream_0.m3u8')):
            original = audio_input(playlist)
            before = measure(original)
            assert float(before['input_i']) < -21, 'Already normalized or unexpected input; refusing double processing'
            with tempfile.TemporaryDirectory(prefix='storyline-audio-') as temp:
                dest = Path(temp)
                filt = ('loudnorm=I=-16:TP=-2:LRA=11:'
                    f"measured_I={before['input_i']}:measured_TP={before['input_tp']}:"
                    f"measured_LRA={before['input_lra']}:measured_thresh={before['input_thresh']}:"
                    f"offset={before['target_offset']}:linear=false")
                run(['ffmpeg', '-hide_banner', '-y', '-i', original, '-vn', '-af', filt,
                     '-ar', '48000', '-ac', '1', '-c:a', 'aac', '-b:a', '96k',
                     '-f', 'hls', '-hls_time', '2', '-hls_playlist_type', 'vod',
                     '-hls_segment_filename', str(dest / 'stream_0data%06d.ts'),
                     str(dest / 'stream_0.m3u8')])
                fixed = audio_input(dest / 'stream_0.m3u8')
                after = measure(fixed)
                old_info, new_info = probe(original), probe(fixed)
                delta = decoded_duration(fixed) - decoded_duration(original)
                assert abs(float(after['input_i']) + 16) < 1
                assert float(after['input_tp']) < -0.9
                assert abs(delta) < .1, delta
                assert abs(float(new_info['start_time']) - float(old_info['start_time'])) < .05
                for p in dest.iterdir():
                    shutil.copy2(p, playlist.parent / p.name)
                report['clips'].append({'course': slug, 'asset': playlist.parent.name,
                    'before_lufs': float(before['input_i']), 'after_lufs': float(after['input_i']),
                    'true_peak_dbtp': float(after['input_tp']), 'duration_delta_seconds': delta,
                    'audio_sha256': {p.name: digest(p) for p in dest.iterdir()}})
        changes = 0
        for p in (course / 'html5/data/js').glob('*.js'):
            content = p.read_bytes()
            updated, count = re.subn(rb'"kind":"set_volume","volume":75',
                                     b'"kind":"set_volume","volume":100', content)
            if count:
                p.write_bytes(updated)
                changes += count
        assert changes == (4 if slug == 'service-recovery' else 3), changes
        assert all(digest(Path(p)) == h for p, h in video_hashes.items())
    assert len(report['clips']) == 7
    report['video_renditions_unchanged'] = True
    out = ROOT / 'asset-management/storyline-audio-verification.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps([{k:v for k,v in r.items() if k != 'audio_sha256'} for r in report['clips']], indent=2))

if __name__ == '__main__':
    main()
