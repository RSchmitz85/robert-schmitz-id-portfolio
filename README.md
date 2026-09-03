# Robert Schmitz — Instructional Design ePortfolio

Static multi-page portfolio for **instructional design / curriculum development / eLearning** roles (edtech, higher ed, corporate L&D tone).

**Live entry point:** [`index.html`](index.html)

## Positioning

> An instructional designer and curriculum developer who combines deep classroom experience, learning science, assessment design, and modern development tools to create clear, practical, scalable learning experiences.

**Site title line:** Instructional Designer | Curriculum Developer | eLearning Designer

This is **not** a K–12 teacher aesthetic site and **not** a Teachers Pay Teachers shop page. Real Engagement with Mathematics (REM) materials are framed as **curriculum architecture, instructional asset systems, and eLearning development evidence**.

## Architecture

```
/index.html
/about.html
/resume.html
/contact.html
/projects/
  storyline.html              ← Algebra 1 Storyline eLearning
  curriculum-system.html      ← REM Activate–Extend architecture + practice systems
  assessment-design.html      ← Item banks, DPMA-style, REM formative engines
  professional-development.html
  ai-workflow.html
/assets/css/styles.css
/assets/js/main.js            ← mobile nav only
/assets/images/placeholders/  ← labeled SVG stand-ins
/resume/                      ← drop in PDF here
README.md
QUALITY_REVIEW.md
```

All paths are **relative** (GitHub Pages ready).

## Case study ↔ real local evidence

| Case study | Source on SchmitzPC (Operator) |
|------------|--------------------------------|
| Storyline Algebra 1 | `Desktop\Algebra 1 Storyline` (+ storyboards) |
| Curriculum architecture | `Desktop\Real Engagement with Mathematics` — lesson engine Activate/Model/Guide/Apply/Reflect/Extend; Punchline Math; Color By Number; Scavenger Hunt; Error Analysis Detective as **reusable instructional asset systems** |
| Assessment design | Item banks / DPMA-style work; standards alignment in REM engines & worksheets |
| PD / adult learning | Mentor, lead teacher, PD facilitation (process-based) |
| AI workflow | Optional modern ID practice under human judgment |

## Replace screenshot placeholders

Placeholders live in `assets/images/placeholders/` and are **labeled by artifact type** in each case study (student page, teacher key, cover system, Storyline slide, curriculum map diagram, etc.).

**Asset refresh steps:**

1. Copy real PNG/PDF samples from:
   - `Desktop\Real Engagement with Mathematics`
   - `Desktop\Algebra 1 Storyline`
2. Prefer exporting PDF pages to PNG for web.
3. Save into `assets/images/` (e.g. `assets/images/rem-student-page-01.png`).
4. Update the corresponding `<img src="...">` in the case study HTML (and keep meaningful `alt` text).
5. Do **not** center Scribble mascot / marketplace branding as the hero aesthetic; choose pages that show instructional structure, layout systems, keys, and Storyline screens.

Suggested captures:

- Storyline: menu/nav slide, worked-example interaction, feedback slide
- REM: curriculum/phase diagram if available, student page, teacher key, cover system (as production system evidence)
- Assessment: blueprint or alignment view, sample item/engine page, teacher key

## Resume PDF

See [`resume/README.md`](resume/README.md). PDF is in place at:

`resume/Robert-Schmitz-Resume.pdf`

The download button on `resume.html` links to that file.

## LinkedIn

Contact page uses a **LinkedIn TBD** placeholder. Replace when the public URL is confirmed.

## Deploy on GitHub Pages

1. Create a repo; push this folder contents to the default branch (or `/docs`).
2. Settings → Pages → Deploy from branch → `/` (root) or `/docs` as configured.
3. Confirm `index.html` loads; check project subpaths and CSS/JS.

Local preview:

```bash
cd robert-schmitz-id-portfolio
python3 -m http.server 8080
# open http://localhost:8080/
```

## Stack

HTML + CSS + light JS only. Google Fonts (Poppins). Navy + soft neutral + teal/orange accent.

## Facts policy

Copy uses only stated professional facts (years teaching, courses, lead/mentor/PD, curriculum mapping, DPMA-style assessment contribution, Master’s 4.0, UCF ID certificate, Ed.D. in progress, models/tools listed). **No invented metrics, jobs, or outcome percentages.**
