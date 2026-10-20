# Math Quest 3.5.1 — answer integrity and feedback

## Reported reproduction

The player selected **11** for **“What number comes just before 12?”** but observed an incorrect response. The source's Kindergarten `number_before` template computes `n - 1`, so its keyed result for `n = 12` is indeed **11**. Both the existing numeric validator and a new independent regression confirm that result. The original player session was not available for forensic inspection, so the precise original trigger remains unverified.

## Confirmed failure conditions and changes

- A timed question could advance while a delayed mobile tap was still destined for an older answer button; its click callback passed only the answer, not a question identity. Now buttons submit their original question ID. Stale clicks are refused **before any statistics or save data changes**.
- A tap arriving after the deadline could be silently changed to `null` and scored as incorrect. Such an attempt is now explicitly labelled **Time expired** with the true answer and (when applicable) the late attempted option captured in the result record.
- Immediately replacing questions obscured what was actually marked. Each answered question now stays on screen with **Correct**, **Not quite**, or **Time expired** feedback, the keyed answer, an explanation, and a deliberate Next question button. The next timed countdown begins only after that action.
- The end-of-game review distinguishes time expiry from an incorrect mathematical answer.
- Existing profile saves, subjects, grades, pet state, and rewards remain unchanged.

## Reproducible verification

Run from the repository root:

```sh
npm test
npm run build
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_answer_integrity.py
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_smoke.py
```

The Node suite includes `tests/answer-integrity.test.cjs`, which forces `n = 12` over 120 randomized answer layouts, checks the keyed answer and actual game scoring, refuses stale callbacks, and audits a late timed tap. The Chromium regression runs both original source and generated `www` assets, makes a real on-screen selection of **11**, inspects saved answer records and feedback, and reproduces the expired-deadline path.

## Interpretation

This repair addresses reproducible interaction and timeout faults. It does not prove which specific circumstance occurred in the user's earlier play session, nor does it independently certify every other academic answer key.
