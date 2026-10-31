HIT YOUR MARK — SELF-CONTAINED LESSON WEB OBJECT, v7

ENTRY AND SCOPE
Import this entire folder as a local Storyline Web Object, including assets/,
media/, modules, styles, and index.html. Publish and host the complete Storyline
output. ES modules require HTTP(S); file:// launch is unsupported. This source
component is also usable standalone from an HTTP(S) server. No framework, CDN,
telemetry, third-party API, or network dependency is used. The only requests are
to this folder's own modules, assets, manifest, and media.
No native .story assembly, import test, or screen-reader validation is implied.

ROUTES
index.html
index.html?presenter=1
index.html?section=cue
index.html?presenter=1&section=7
Section IDs: choose, predict, parameters, worked, guided, diagnose, cue,
independent, transfer, evidence. Numeric section links are 1-based.
Only presenter and section are inherited from a readable same-origin parent
query when absent from the child's own URL. Cross-origin parents are ignored.
Jumping sections does not create records. Missing context can be selected before
returning to the requested activity. Presenter controls never appear to students.

CORE EVIDENCE
Storage key: HYM-v7-progress (isolated from v6).
Core record keys: predict, roles, guided, diagnose, cue, independent, transfer.
Each valid submission preserves immutable first, latest, history, attempts,
supports at submission, response, result, and timestamp. The supported flag means
mathematical help was used at submission; usedWorkedComparison separately marks
the explicit worked completion route. Hints do not prevent that later route.
Ungraded mini previews and explicit worked completion routes have assessed:false
and correct:null at snapshot and result level. Earlier v7 metadata is normalized on restore/download without
changing responses, supports lists, history positions, or timestamps.
Blank/invalid number
fields are input errors, not attempts. Strict signed-decimal/fraction parsing
never evaluates input. Any mathematically equivalent valid second point with a
distinct x-value is accepted, even when outside the graph's clipped viewport.
Prediction seconds are numeric or null for Not sure. Explanation/reflection
prose is retained for self-comparison and is never automatically graded.
Completion requires a setting and seven submitted core records, including
labelled supported routes. It does not mean mastery or passing.
Hints and requested/played mathematical help are recorded separately from first
attempts. Choosing an equivalent text access modality is not counted as a hint.

SIX OPTIONAL FORMATIVE MINI-CHECKS
Saved under miniRecords and miniDrafts, separate from records/drafts and core
completion. Each mini has immutable first/latest/history using the same record
contract. IDs and buttons:
rateMeaning         Check sign and rate unit
nextPoint           Check my next point
interceptMeaning    Check both intercept meanings
originalCue         Check original timing
transferSegment     Save my predicted segment
horizontalCrossing  Check my crossing prediction
nextPoint, interceptMeaning, and originalCue open by default on first visit;
learner close/open state persists. The original cue check uses a compact strip
above the linked model columns. The next-point response records whether the
worked reveal was already seen. Original-cue classification records whether a
plan was already edited. The transfer preview derives only from the learner's
entered start and arrival; it reveals no model answer and is saved as UNGRADED.
Optional A/B/C construction records remain separate core-adjacent keys practiceA,
practiceB, practiceC. Their submissions never increase required core progress.

MEDIA MANIFEST
The runtime reads media/availability.json before rendering. Format:
{
  "version": 7,
  "ready": ["pool-intro"],
  "captions": ["pool-intro"],
  "transcripts": ["pool-intro"],
  "posters": {"pool-intro":"assets/pool-context.png"}
}
List a clip in ready only when media/ID.mp4 exists. List captions only when
media/ID.vtt exists; transcripts only when media/ID-transcript.txt exists. Poster
paths must refer to actual relative assets/ or media/ files. Initialization uses
empty arrays to hide the copied v6 media until final replacements are integrated.
Missing clips show a clean unavailable notice and written lesson alternative;
no nonexistent video/caption/transcript link is fabricated.
Supported IDs: lesson-hook, pool-intro, stage-intro, rate-and-sign, shared-graph, intercepts,
slope-swap, cue-change, positive-slope, horizontal-line.

MEDIA HELP GATES
The optional lesson-hook is a compact collapsed banner on the setting page. It
uses the same manifest, has a written hook alternative, reveals no graph answer,
and counts as neither mathematical support nor core progress. It never autoplays
or gates selection. Intro clips show only the selected context. All video playback
is learner-controlled.
rate-and-sign, shared-graph, and intercepts are worked instructional help.
slope-swap unlocks after a valid diagnosis submission or explicit help request.
cue-change unlocks after originalCue classification AND a first cue-plan
submission, or an explicit help request.
positive-slope unlocks after the independent first submission or explicit help.
horizontal-line unlocks after practiceC first submission or explicit help.
Locked panels show neutral titles and no hidden written answer. Playing math
help records video:ID support. Explicit help requests record video-request:ID.
Opening a transcript or equivalent written access alternative alone is not
counted as video playback. Local mediaUsage records first/latest play and count;
there is no third-party analytics call or LMS-gradebook claim.

ACCESSIBILITY / INTERACTION
Native controls, visible keyboard focus, numeric equivalent for graph clicking,
reflow, optional VTT captions, transcripts, exact spoken fraction equations,
reduced-motion behavior, no autoplay, no timed viewing gate, and no drag-only
interaction. Cue range updates linked graph/equation/scene in place to retain
pointer capture and keyboard focus. Run/Pause/Replay and time scrubbing are in
'Rehearse or scrub this plan'. The physical actor stops at arrival. A blue dashed
x=6 cue guide makes early/on/late timing visible. Actual screen-reader review
and hosted native Storyline checks remain separate QA tasks.

PERSISTENCE AND DOWNLOAD
Restart uses an in-lesson alertdialog, not a browser pop-up. Keep my work has
initial focus; Escape/cancel preserves work and returns focus to Restart. Only
Restart and erase progress clears this lesson's storage, after an active request.
The dependency-free restart.mjs module implements that two-step gate and must
remain in the imported folder. Reset-state regressions are included in the 58
passing automated checks; final browser focus/activation verification is pending
because the IAB input helper became unresponsive during the earlier modal test.
Saving errors fail gracefully with a visible notice. Reset erases only this
lesson's storage key after confirmation. Download my work saves the full local
record, including core, mini, optional practice, supports, and explanations.
There is no cross-device sync or durable teacher/LMS analytics. First versus
latest evidence stays separate. Transient feedback clears when inputs change;
submitted evidence remains intact. Working feedback links return to the relevant
worked step or exact activity. Evidence never appears merely from visiting.

OPTIONAL STORYLINE BRIDGE (UNCHANGED NAMES / TYPES)
Create these parent variables if using parent.GetPlayer().SetVar mirroring:
HYM_Context                 Text        empty
HYM_Section                 Number      1
HYM_Completed               True/False  False
HYM_SubmittedCount          Number      0
HYM_PredictionSubmitted     True/False  False
HYM_PredictionNotSure       True/False  False
HYM_PredictionSeconds       Number      0
HYM_EvidenceJSON            Text        {}
PredictionSeconds is meaningful only when Submitted=true and NotSure=false.
Zero is a valid numerical prediction. Section is 1-based. EvidenceJSON summarizes
only the seven core records; optional mini-checks do not inflate it. Full mini
responses are in the JSON download. Missing/cross-origin parent is safe.

SOURCE AND ASSET PROVENANCE
app.mjs: interaction/UI, feedback, local media manifest, persistence, bridge.
model.mjs: pure mathematics, safe parsing, core/mini records, media-help gates.
styles.css: responsive layout, palette, focus and reduced-motion rules.
assets/rigs.mjs: original video actor SVG definitions for exact functional diagrams.
assets/pool-context.png and stage-context.png: new ImageGen scene artwork supplied
by the main agent. They introduce the setting and are not measurement diagrams.
Existing actor diagrams remain functional mathematical models. Source v6 was
copied into this isolated v7 directory and was not edited.

VERIFICATION
Unit/math/state/gate/manifest results: qa/interactive-v7/unit-test-results.json.
Main agent owns live IAB testing, media integration, final package and native
assembly instructions. Refer to the final kit verification status for actual
browser, playback, listening, hosted Storyline, and screen-reader evidence.
