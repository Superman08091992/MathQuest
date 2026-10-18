# Math Quest 3.0 validation record

Source checkout: local 3.0.0 worktree on 2026-10-18. Tests run using Node.js 22.

- `npm test`: 38/38 passing.
- `npm run build`: successful, regenerated `www/` from current source.
- `CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_college.py`: passed on 390px source and 1000px generated build; exercised 40-question diagnostic, results, no XP, saved feedback portfolio, study-track selection and linked practice.
- `CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_regression.py`: passed baseline regression flows.
- `CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_grade_subjects.py`: passed Grade 4 subject flows for source and built assets.
- `npm run audit:questions`: completed (reproducible sample counts are in `QUESTION_COVERAGE.json`).

Not verified: native Android APK or Linux AppImage packaging, hosted PWA offline reload, external or proctored mastery, and any effect on actual university admissions rates.
