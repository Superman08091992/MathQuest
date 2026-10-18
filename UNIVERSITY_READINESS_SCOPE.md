# University-readiness quality contract — 3.0

## Outcome

A learner who completes every relevant strand should acquire transferable foundational knowledge and practice in reasoning, scientific inquiry, reading, persuasive writing, quantitative analysis, and self-directed university-level exploration. This is a **preparation target**. The software cannot establish a change in admissions probability without controlled longitudinal evidence and cannot confer admission eligibility or qualifications.

## Existing operational features

1. The K–12 question catalogue is playable with grade-aware category filtering.
2. The readiness diagnostic assembles 40 distinct multiple-choice questions, 10 per broad domain, from advanced-grade content, preserving ordinary grade/category selection.
3. Checkpoints generate a multi-category review with at least 20 items when content is available. A local practice checkpoint requires >=90% on two attempts separated by >=7 days and at least 20 distinct question keys; the badge explicitly says **unverified**.
4. Selected question answers, hints, categories, skill IDs, timestamps, and portfolio text are retained per profile and exported with its game data.
5. A saved portfolio can contain essays, investigations, designs, independent feedback, and evidence descriptions; the game does not claim to grade these automatically.
6. Diagnostic/checkpoint sessions do not provide normal game currency, XP, or leaderboard-style inflation.

## Missing evidence required before claiming admission-readiness effectiveness

- Documented learning objectives, grade progression, prerequisite dependencies, correct model solutions, authoritative citations, and review by qualified subject specialists.
- Extended practice depth across every subject, distinguishing substantive problems from superficial numeric variants.
- Rigorous writing and oral explanation assessments independently scored by humans using published rubrics.
- Secure unseen assessment items, assessment integrity, accessible accommodations, delayed retesting, and independent measurement of retention/transfer.
- Validity and reliability studies with diverse student cohorts and a monitored baseline comparison, including standardized assessment alignment where legal.
- Explicit mapping to the *current* requirements of each university, qualification system, and chosen undergraduate course; these change and cannot be represented by one universal admissions certificate.
- Clear learner consent, privacy controls, age-sensitive handling, and safeguards for minors before public deployment.

## Release acceptance checks

- Run all Node tests and browser integration checks.
- Show exact content counts and sampling methods; never equate generator calls to distinct validated questions.
- Confirm the playable web build contains matching source scripts and can enter each existing subject.
- Verify a diagnostic never grants XP/currency and that checkpoint results are not claimed as a credential.
- Test save migration, backups, exports, and restore behavior independently of academic progress.
- Test failure paths (missing question files, invalid save input, unsupported templates, interruptions and corrupt data).
- Native platform claims require real native builds, install, launch, save, and offline recovery tests.

## Next content milestone

Develop subject-by-subject mastery maps with reviewable content provenance, real-world case studies, and multi-step proof/writing tasks. Add a teacher/instructor review workflow with rubric versioning and evidence exports. Track skill-level mastery from first attempts and delayed unseen retests, not only quiz accuracy. Calibrate difficulty empirically and conduct an externally reviewed curriculum and safety audit before public admissions-effectiveness claims.
