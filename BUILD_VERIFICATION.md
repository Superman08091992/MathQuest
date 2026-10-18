# Math Quest 2.4.1 — Build and Test Record

This is a patch of 2.4.0 that corrects visibility, discoverability, and filtering of the existing grade-specific question bank. It does not add question definitions or claim a complete K–12 curriculum.

## Observed results

| Check | Result |
| --- | --- |
| `npm test` (`node --test tests/*.test.cjs`) | **29 / 29 passed** |
| `npm run build` | **Passed**; rebuilt `www/` |
| `CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_smoke.py` | **Passed**; profile, grade, timed mode, pause, complete quiz |
| `CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_regression.py` | **Passed**; profiles, pet selection/migration, purchases, quiz play, Science |
| `CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_grade_subjects.py` | **Passed**; all 13 grades' selectors, Grade 4 six subject buttons and category-specific quiz launches, both source and built assets |
| `npm run --silent audit:questions` | **Passed**; 65,000 question samples, 14,875 distinct observed (same results as 2.4.0; not the number of questions in total) |
| Local Chromium navigation test (`file://`, loopback/HTTP, HTTPS) | **Blocked by browser administrator policy**, not tested |
| Offline PWA install/reload | **Not verified** (navigation blocked) |
| Android APK / Electron AppImage native compilation | **Not verified** (requires platform toolchains) |

Assets in `www/` are compared byte-for-byte to the canonical source during archive preparation. The `index.html` and PWA asset references share the `?v=2.4.1` revision, and precache cache name is `math-quest-v2.4.1`.

The browser tests inline exact source and built HTML/CSS/JS bytes because navigation is blocked in this environment. This verifies rendered DOM interactions and subject-filtered gameplay, not a real host or installed application.

See `GRADE4_SUBJECT_VISIBILITY_FIX.md` for subject counts and user update steps.
