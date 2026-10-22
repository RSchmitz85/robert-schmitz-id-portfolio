# Robert Schmitz — Instructional Design ePortfolio

Static portfolio for instructional design, curriculum development, and eLearning roles. The visual direction is editorial and professional; REM materials serve as evidence of learning design and production systems.

## Local working copy

This directory contains the site source but has no Git metadata. It is not a checkout that can be pushed directly. The pages contain GitHub Pages metadata; local completion does not establish the state of the published site.

Entry point: [index.html](index.html). All site navigation uses relative paths, including the case-study collection at [index.html#projects](index.html#projects).

## Site structure

- Home, About, Resume, Contact.
- Five case studies under 'projects/': curriculum system, Storyline, assessment design, professional development, and AI workflow.
- Shared visual system: 'assets/css/styles.css', using Inter and Space Grotesk with a navy, white, and orange palette.
- Progressive enhancement: 'assets/js/main.js' handles mobile navigation and the native artifact dialog. Image links and navigation remain usable without JavaScript.
- Artifact PNGs and video posters: 'assets/images/'. Videos: 'assets/video/'.
- Downloadable resume: [resume/Robert-Schmitz-Resume.pdf](resume/Robert-Schmitz-Resume.pdf).

## Evidence and factual boundaries

- Guided Notes student/teacher pages, practice-system artifacts, and Rally Coach / Partner AB pages are displayed as inspectable evidence. Retain complete source pages and descriptive captions.
- U04-L06 packaging appears in the curriculum case study under Facilitator handoff. It demonstrates packaging decisions, not storefront status or measured learner outcomes.
- The Storyline case study presents a storyboard and design specification. Production and learner testing remain planned unless a completed build and evidence become available.
- Preserve approved professional titles, dates, degrees, and resume facts. Do not infer outcomes from production counts or marketing assets.
- Contact already includes a LinkedIn profile link; it is not a placeholder. External profile availability is separate from local link correctness.
- Older material under 'fable-redesign/' is historical working material, outside the nine-page site reviewed for this job.

## Algebra 1 course draft (October 22, 2026)

- Portfolio entry: `projects/canvas-algebra1.html`, linked from `projects.html`.
- Public content preview: `courses/algebra1/index.html`. This is a static preview, not a Canvas instance; it saves no grades or submissions.
- Import candidate: `assets/downloads/algebra1/algebra1-canvas-course.imscc`.
- Instructor guidance, answer keys, and import checklist: `assets/downloads/algebra1/instructor-guide.html`.
- Editable original content: `tools/algebra1_content.py`.
- REM branding uses the existing Scribble artwork, navy/orange palette, and a portable inline banner in imported Canvas content. The account-level Canvas theme is separate and has not been configured.
- Rebuild with `python tools/build_algebra1_course.py`; validate with `python tools/validate_algebra1_course.py`.
- Ten units contain 40 core lessons, 120 explained practice questions, 40 misconception checks, 12 QTI quizzes with 68 questions, and 10 application assignments. The assignments include readable rubrics; native SpeedGrader rubric associations are not configured.
- The 36-week pacing map is a planning draft with selected Common Core connections. Additional teacher-led practice and local standards review are required for full-year classroom use.
- Offline checks and selected browser behaviors have been reviewed. Live Canvas import and native quiz scoring have been verified; complete accessibility validation and learner testing remain pending. Do not present the preview as proof of successful Canvas implementation.
- The YouTube collection is at `projects/youtube-videos.html`, also linked from Projects. The first supplied video is private; its title is unverified and it uses a neutral label.

## Local preview and handoff

From this directory, run 'python -m http.server 8080 --bind 127.0.0.1' only if that port is free. Leave other jobs and servers running.

The assigned overnight job, changelog, doer verdict, backups, and PNG/browser evidence are stored beside the job in:

'C:/Users/trebo/Desktop/Printable Adventure Line/jobs/'

- 'JOB-eportfolio-astra-iterate.md'
- 'CHANGELOG-OVERNIGHT.md'
- 'DONE-eportfolio-astra-iterate.md'
- 'eportfolio-evidence/'

Consult the latest dated verdict and matching source hashes before relying on older screenshots. Doer verification does not replace independent QA Judge / Human Look or Operator sign-off. Publication remains a separate lifecycle state.

## Live Canvas handoff (October 22, 2026)

- Course: https://canvaslite.instructure.com/courses/28678 (published with public visibility).
- Branded front page selected; 40 lessons, 12 quizzes / 68 questions, and 10 application assignments verified.
- Quiz import produced empty shells despite completed migration jobs. All 68 questions were entered through the native quiz editor; the 48 empty generated assignment/quiz records were removed.
- A cumulative preview with one deliberately wrong answer scored 9/10 and displayed explanations. Application 1 accepts text entry or file uploads and displays its 12-point rubric.
- Native backup created in Canvas Content Exports; the in-app browser blocked its CDN download. The generated source `.imscc` remains an import candidate, not a verified one-step backup.
- Do not reimport the generated candidate over this course: it could overwrite the repaired quizzes. Use the native Canvas export for backup or migration.
- Full accessibility, Student View, and learner-pilot review remain pending.

- Published October 22, 2026: all 12 modules and their items, plus the course map. Public course visibility enabled; public course-index listing remains off. Projects links to the branded case study and live course.
