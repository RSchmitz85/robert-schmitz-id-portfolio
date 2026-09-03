# Quality review — hiring manager pass

Reviewed against typical ID hiring lenses: needs analysis, design, develop, tech, assessment, explain decisions. Weak spots found were fixed in the site before ship.

## Rubric & findings

### Needs analysis
- **Pass.** Case studies open with real performance gaps (representation fluency, disconnected worksheets, assessment drift, sit-and-get PD, AI risk).
- **Fix applied:** Curriculum and assessment pages explicitly ground analysis in REM / classroom / DPMA-style work rather than generic textbook scenarios.

### Design
- **Pass.** Objectives, sequencing, GRR/Gagné/ARCS/Mayer/UDL/QM called out with *how* they shaped decisions—not buzzword lists alone.
- **Fix applied:** REM framed as Activate→Model→Guide→Apply→Reflect→Extend **architecture** and practice **systems** (Punchline, Color By Number, Scavenger Hunt, Error Analysis Detective)—not product SKUs or TPT copy.

### Develop
- **Pass.** Storyline, LMS delivery, document/visual systems, templates described as production craft.
- **Fix applied:** Artifact placeholders labeled by type (Storyline slide, student page, teacher key, cover system, curriculum map) + README Operator path from `Desktop\Real Engagement with Mathematics` and `Desktop\Algebra 1 Storyline`.

### Technology
- **Pass.** Storyline, Canvas/Schoology, HTML/CSS, AI-under-judgment. No fake LMS admin claims.
- **Fix applied:** AI page stresses human critique gates; no “AI built my course” claim.

### Assessment
- **Pass.** Blueprints, alignment, formative engines, teacher keys for interpretation.
- **Fix applied:** Explicit “no fabricated metrics” language; DPMA-style contribution stated without invented scores.

### Explain decisions
- **Pass.** Decision lists with rationale on every case study; reflections translate teaching → ID language.
- **Fix applied:** Home + about copy updated so REM is visible as ID evidence; project subnav added for scanability.

## Tone & brand checks
- [x] Corporate ID / edtech / higher ed tone (navy, neutrals, teal/orange)
- [x] No chalkboard / apple / pencil / cartoon teacher aesthetic
- [x] No TPT shop framing; no Scribble-as-hero branding
- [x] Poppins, generous whitespace, relative paths
- [x] Facts-only; email correct; LinkedIn TBD placeholder
- [x] Resume PDF drop-in documented (no fake PDF binary)

## Accessibility
- Skip link, semantic landmarks, `aria-current`, focus styles, alt text on placeholders, keyboard-dismissible mobile nav, contrast-conscious navy/cream palette.

## Remaining polish notes
1. Resume PDF is live at `resume/Robert-Schmitz-Resume.pdf` with working download on `resume.html`.
2. Curriculum, assessment, and Storyline case studies now use real REM / Storyline PNGs under `assets/images/`.
3. PD and AI workflow pages may still use labeled SVG placeholders until anonymized artifacts are available.
4. Add LinkedIn URL on `contact.html` when ready.
5. Punchline/CBN/SH full-page PNGs still scarce on disk (PDF-heavy). v1.1 added lesson roadmap, Partner AB student/teacher pages, and EAD casebook interiors; keep looking for SH/CBN/Punchline page exports.

## Verdict
Site is shippable as a polished static ID portfolio. Placeholders are intentional and labeled; copy centers real REM + Storyline evidence in instructional-design language.
