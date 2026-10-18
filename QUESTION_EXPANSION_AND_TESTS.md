# Math Quest 2.4.1 — Question Expansion, Provenance and Test Report

## Why this update exists

The prior release's “13,000 questions” figure was a **test count**: 1,000 randomly generated questions per grade × 13 grades. It was not a count of stored or distinct playable questions. The prior game actually loaded 29 mathematical generator definitions; the extended subject files were present but not connected to the entry page. Grade 10 had only two generator definitions, with at most 18 distinct visible question texts using their bounded inputs.

## What is now operational

- **29 legacy procedural math templates** remain playable without changing the saved-question schema.
- **118 new procedural templates** span Kindergarten to Grade 12, 14 on Grade 10 alone when combined with the legacy templates. They include real-world problems, algebra, fractions, geometry, probability, statistics, trigonometry and introductory calculus. Unlike fixed trivia, inputs vary within grade-scoped bounds.
- **52 curated fixed multiple-choice questions** from the bundled extended *fixed-format* file are wired into the game for reading, science, history, economics, civics and astronomy. The older extended file with numeric-in-prompt choices is archived at `docs/legacy/deprecated-question-templates-extended.js`, not loaded or packaged into the runtime. The obsolete HTML test pages that depended on old APIs are also archived under `docs/legacy/obsolete-tests/`.
- The unified question catalogue filters by grade and subject. The Mode screen shows the number of **question types**, not a fictional count of distinct questions.
- A game rotates its question templates, avoids duplicated prompt/answer combinations while variants remain, and prefers questions absent from the profile's last 250 answered items. Recent-history keys are locally stored, bounded and migrated without discarding existing profiles, pets, stats or purchases.
- Fixed-only categories never pad a game with repeated facts. If the requested 20-question game only has two facts, it becomes a two-question activity. These short rounds cannot earn the normal perfect-round XP/crystal bonuses.
- A null or blank response no longer counts as numeric zero.

## Empirical quantity audit

`QUESTION_COVERAGE.json` contains a seeded, reproducible enumeration of **5,000 generated questions per grade** (65,000 question samples). The file reports the number of **distinct observed question displays and answers**, per grade, and a total. A distinct observed count is a *lower bound* from random sampling, not the theoretical total, a measure of curricular depth, or an independent proof that each answer is mathematically correct. Do not present the sampled total as an exact question-bank size.

Run the exact audit again with:

```bash
npm run --silent audit:questions > QUESTION_COVERAGE.json
```

## Verification

- `npm test` verifies legacy mechanics, inventory and pet migration, save safety, existing arithmetic fixes, and the expanded question system.
- `tests/questions.test.cjs` individually exercises **every registered question definition on every eligible grade**, checks four unique displayed answer choices with exactly one recognized correct answer, enforces grade/category coverage and tests twenty-question variety.
- Independent formula regression calculations cover proportional cost, median, arithmetic mean, triangle area, cylinder volume, surface area, cone volume, arc length, derivatives and sector area. Answer-choice self-consistency is not misrepresented as independent proof for every formula.
- `tests/browser_regression.py`, `tests/browser_grade_subjects.py` and `tests/browser_smoke.py` exercise the actual game UI in Chromium: profiles, pets, purchase state, gameplay, category selection, fixed-content quizzes, and statistics.
- PWA precache contains new local scripts and has a bumped version; native APK/AppImage compilation has **not** been completed as part of this verification. Hosted PWA offline reload was attempted but the execution environment blocked Chromium's requests to localhost (`ERR_BLOCKED_BY_ADMINISTRATOR`). That test remains unverified.

## Known scope limitations

This is an engineering expansion, **not a complete K–12 textbook or a certified standards-aligned curriculum**. In particular:

1. Fixed subjects have only 52 distinct facts shared across overlapping grade ranges. For example, Grade 1 science has only two eligible facts, so its activity will be short. Editorially vetted additions are needed before treating these categories as comprehensive.
2. There is no concept-level learner mastery model yet. Grade selection and random variation are not a diagnostic assessment, adaptive spaced-repetition engine, or mastery guarantee.
3. A number of older fixed facts are simplified educational definitions. The included fixes improve several ambiguous prompts, but an independent subject-matter review is needed before educational publication.
4. The random sampling reports distinct displays encountered, not the count of possible variants, and no generation process can guarantee indefinite novelty in a finite skill domain.
5. A profile's save data is local to its browser/app origin. Export from Settings before changing package type or storage location; import inside the new package.

## Next development priorities

Increase substantive skill coverage for each grade, add independently edited nonmath curricula, include worked solutions and misconception-specific distractors, map to a published grade-standard framework, and add learner mastery diagnostics. Measure question repetition and answer reliability separately from the number of templates or test runs.
