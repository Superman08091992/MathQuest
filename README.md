# Math Quest 3.2 — Academic Pathway & Persistent Pet Care

Math Quest is a local-first educational game with 13 grade levels (Kindergarten to Grade 12), adaptive procedural questions, subject selection, games, profiles, pets, achievements, and an optional university application workshop. Grade-specific cumulative assessments and applied assignments are part of the **core K–12 curriculum**.

**Purpose:** broaden foundational academic knowledge, practice higher-order reasoning, and build an inspectable portfolio. **It is not accredited, proctored, or an admissions qualification, and does not predict an applicant's chance of admission.** A strong learner may still need external qualifications, course-specific admissions tests, interviews, written work, and references.


### Academic versus game progression

Game XP provides access for exploration, **not academic mastery**. At each grade, learners can view target competencies, take a cumulative no-hint checkpoint revisiting earlier grades, and submit an open-ended applied assignment. Two qualifying checkpoints at least seven days apart and a submitted grade project are recorded as in-app evidence. The K–12 pathway is not complete until **all 13 grades** have both forms of evidence; reported results remain unproctored and assignments ungraded. See [ACADEMIC_PATHWAY_3.1.md](ACADEMIC_PATHWAY_3.1.md).

## Included in 3.1 and 3.2

- 526 registered question definitions across all 13 grades, including 233 newly authored fixed questions and 94 new procedural generators (at the current checkout).
- Expanded reading, writing, science, mathematics, economics, history, government, statistics, computing, research, and logic coverage. The [actual curriculum map](K12_CURRICULUM_MAP.json) records available definitions per grade and marks small subject banks (all grades still have some underrepresented categories).
- Optional application workshop: balanced 40-question diagnostic, five preparatory tracks, category-level practice summaries, grade-level 20-plus-question checkpoints, retesting after seven days, portfolio assignments and manual review notes.
- Practice diagnostics and checkpoints are scored in-game without granting XP or currency; no deceptive academic certification.
- Offline-first web/PWA source, Android/Capacitor and Linux/Electron build configurations.

## New in 3.2: persistent pet care

Pet hunger rises 2/100 per hour, and happiness drops 1.25/100 per hour even when the application is closed. Once hunger reaches 100, a continuous 36-hour starvation period ends in death; remaining at zero happiness for 48 consecutive hours causes a pet to run away. Feeding, petting, playing, and treats can interrupt those clocks. Each loss is preserved in the player's individual save history, and a new animal can be adopted. Existing pet XP and levels remain intact. Older saves start the care clock when they are first upgraded, rather than losing pets retroactively. See [PET_CARE.md](PET_CARE.md) for timing formulas, examples, and limitations.

## Run locally

Prerequisites: Node.js 22+ and Python 3.11+ (for the local HTTP server). No online services are required to run the source.

```sh
npm test
npm run build
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/` and create a profile. The optional application workshop is accessible from the main hub; foundational preparation happens within every grade. For a Linux application window with Chromium available, run `./launch-linux.sh`.

## Test and audit

```sh
npm test
npm run audit:questions
npm run audit:curriculum
npm run build
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_college.py
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_regression.py
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_grade_subjects.py
```

Browser regressions require Python Playwright and Chromium; binary paths vary by system. Diagnostic flows in browser tests use inline scripts to avoid this test environment's localhost restriction; hosted service worker install/reload and native Android/Desktop packaging have **not** been certified by those tests.

## Packaging

See [APP_BUILD_GUIDE.md](APP_BUILD_GUIDE.md). Run `npm run build` before Capacitor sync or Electron packaging. Rebuild the native installer separately when shipping changes.

## Scope and limitations

Current development is the **first curriculum expansion**, not an exhaustive education across all university majors. Question definitions count templates, not verified learning outcomes. A grade-level pass is recorded as unverified in-app practice; editing local saves, receiving hints, or recognizing repeated questions can invalidate it as independent evidence. Open-ended portfolio tasks are stored for human review but are not automatically authenticated or graded. The readiness lab is not a substitute for admissions requirements.

For a production curriculum, add externally reviewed learning standards per course and jurisdiction, more unseen problem families and long-form responses, a source-backed reading library with licensing checks, accessible assessments, human-scored rubrics, and an independent validation study of learning and admission outcomes. See [UNIVERSITY_READINESS_SCOPE.md](UNIVERSITY_READINESS_SCOPE.md).
