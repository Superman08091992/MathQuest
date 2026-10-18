# K–12 academic pathway — release 3.1.0

## Goal and placement of university preparation

Grades Kindergarten through 12 are the **core educational pathway**. University preparation is an intended *outcome* of mastering this progressively demanding school curriculum, not a separate substitute for it. The optional University Application Workshop provides additional course-specific exploration, personal projects, and independent diagnostic practice. It does not grant a qualification or determine admission chances.

## Game state versus academic evidence

- XP, coins, unlocks, pets, cosmetics, and achievements are game state. XP allows exploratory access; **it is not a mastery score or grade-completion certificate**.
- Every grade presents age-appropriate academic goals, all registered playable subject choices, a cumulative assessment, and a written/practical assignment prompt.
- A grade's *practice checkpoint* is earned only after two no-hint in-app cumulative assessments at least seven days apart, with **90% or better overall and in that grade's material**, at least 75% on previous-grade review, at least 20 current-grade questions, at least eight review questions when grade > K, and at least six assessed subject categories. Assessments must use unique question identities within the attempt. All results are explicitly unverified practice.
- Every grade provides an **open-ended applied assignment** (observation, writing, experiment, modeling or research as appropriate). The game records a draft locally but cannot determine whether it is correct, independently authored, ethically obtained, or rigorous. The rubric is provided so a human reviewer can evaluate the work. Grades K–12 demand increasingly substantial reasoning and documentation.
- K–12 *in-game pathway completion* requires **all 13 grade practice checkpoints AND all 13 submitted applied-assignment drafts**. This is a private progress record, **not a high-school diploma, transcript, accreditation, independent competency verification, or admissions prediction**. Real proficiency additionally requires externally reviewed writing, practical tasks, tests, and authentic academic evidence.

## Dependencies and curricular quality targets

The planned full program needs competency mappings to independently inspectable learning standards, authentic content at each grade, prerequisite and misconception maps, accessible instructions, guided worked examples, formative feedback, spaced retention practice, cumulative unseen assessments, and externally reviewable essays/projects. Current grade goals are guiding targets, not externally mapped standard-by-standard coverage. The existing 526 question definitions and 13 assignments are an initial content base, **not a complete K–12 curriculum**. A generated [K–12 curriculum map](K12_CURRICULUM_MAP.json) exposes each grade's actual subjects, definitions, skills, and thin areas. Every grade currently has at least one subject with fewer than three definition types, requiring expansion and subject-matter review.

## Defects addressed

- Grade-0 questions inside later-grade cumulative assessments previously lost their original grade when answers were recorded due to a falsy-zero fallback. Preserved zero explicitly.
- XP progression could be mistaken for academic completion. The grade map now displays its distinct mastery evidence.
- Prior-grade retention was not tested by checkpoints. Every grade above Kindergarten now includes eight earlier-grade review questions.
- Former checkpoint summaries did not record grade-specific and review correctness separately. They now do, and legacy records are retained but cannot automatically qualify for the new cumulative requirement.
- Open-ended applied assignments were contained only in a separate college feature. Every grade now offers its own prompt, rubric and locally persisted response; no automatic grading is claimed.

## Evidence required to characterize this as operational

1. `npm test` must pass all generator, save, grade-route, and scoring invariants.
2. `npm run build` must produce a matching web asset tree and PWA cache token.
3. Chromium interface tests must pass for source and built copies of grade selection, checkpoints, assignments, and profile save restoration.
4. Native app builds, network-disconnected PWA reload, accessibility audits, subject-matter accuracy, externally proctored assessments, and empirically measured effects on admission chances require separate evidence; **none are inferred** from local Node or browser tests.

## Installation / synchronization

For an existing local Git checkout, back up profiles using Settings > Export Save Data before replacing a deployed application. When synchronizing locally built output into a staging directory, use:

```bash
rsync -a --delete --exclude='.git/' ./ /path/to/staging/math-quest/
```

Never delete another user's save data as part of an application update.
