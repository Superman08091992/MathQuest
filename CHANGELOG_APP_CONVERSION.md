# Math Quest 2.4.1 — Grade 4 subject selection repair

See `GRADE4_SUBJECT_VISIBILITY_FIX.md` for changes, measured counts and verification. The 2.4.0 curriculum improvements are preserved in `QUESTION_EXPANSION_AND_TESTS.md`.

# Math Quest 2.4.0 — Curriculum expansion

- Connected a combined playable registry containing 29 original + 118 new procedural mathematics question generators and 52 fixed facts across six other subjects.
- Added grade- and subject-aware availability, a real question-type count in the mode selector, and new category buttons.
- Added per-profile bounded recent-question history and no-repeat generation when capacity exists.
- Prevented repeated filler questions in fixed-only topics; reduced rounds to available unique facts and disabled extra perfect-game bonuses for short rounds.
- Repaired blank numeric answer handling and corrected ambiguity in existing general-science, history, economics, and astronomy prompts.
- Added reproducible 65,000-question sampling audit and category/formula regression tests.
- Upgraded PWA cache version to `math-quest-v2.4.0` and rebuilt the bundled `www` assets.
- Moved obsolete, nonfunctional legacy HTML test pages and the incompatible original extended-question file into `docs/legacy/` so the runnable project contains only supported sources.
- The previous 2.3.0 test and change reports are preserved under `docs/legacy/` and must not be mistaken for 2.4.0 verification.
