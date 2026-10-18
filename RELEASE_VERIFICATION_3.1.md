# Math Quest 3.1 verification report

Date: 2026-10-18. Runtime: Node.js 22.16.0; Chromium via `/usr/bin/chromium`; local source and generated `www/` copy.

| Check | Result | What it establishes |
|---|---|---|
| `npm test` | 44/44 PASS | Regression tests for calculations, pet/shop, Grade 4 category routing, curriculum registry, cumulative assessments and open-ended drafts |
| `npm run build` | PASS | Asset build outputs consistent source to `www/` |
| `node scripts/audit-k12-pathway.cjs \| cmp - K12_CURRICULUM_MAP.json` | PASS | Machine-generated curriculum inventory matches registered source definitions |
| `npm run audit:questions` | PASS | 65,000 seeded generated samples, 15,701 distinct question records observed across grades; this is not the maximum possible or a validity score |
| `tests/browser_checkpoint.py` | PASS source 390px, built 1000px | Grade 4 cumulative no-hint quiz, current/prior content mix, no XP rewards, recorded checkpoint and grade assignment |
| `tests/browser_k12_pathway.py` | PASS source 390px, built 1000px | Grade goals and assignment validation, cross-profile isolation, saved-draft restoration, Grade 12 capstone visible |
| `tests/browser_grade_subjects.py` | PASS source and built | Category controls render and launch matching content across 13 grades |
| `tests/browser_college.py` | PASS source and built | Optional workshop diagnostic, portfolio and study-track flows |
| `tests/browser_regression.py` | PASS | Existing saved pet migration, profile, shop and gameplay flows |

The repository has **526 question-template definitions**. The Grade 1–12 pathway is still an evolving educational product; the `K12_CURRICULUM_MAP.json` inventory shows underrepresented subjects in every grade. The current grade-level assignments are locally stored text submissions, **not automatically assessed or externally verified**. Checkpoint results are unproctored, easily replayable, and cannot establish a diploma or university admission eligibility.

Native Android and Linux package compilation, a hosted PWA offline reload, accessibility conformance, external curriculum review, pedagogical outcomes and admissions acceptance-rate effects were not established. `npm install --package-lock-only` could not reach the npm registry from this environment (`EAI_AGAIN`), so no lockfile or reproducible third-party dependency installation claim is made.

Release policy: Grade progression for academic evidence is distinct from game XP. A completed K–12 in-app record requires two qualifying cumulative, no-hint checkpoints separated by seven days **plus one saved applied assignment per grade**, but still requires independent academic review to support competency claims.
