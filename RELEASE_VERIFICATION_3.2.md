# Math Quest 3.2.0 — Pet-care verification

## Scope

Added real-time hunger/happiness decay; offline catch-up based on persisted timestamps; starvation death and unhappiness departures; critical warnings, care countdowns, hub alerts and loss history; independent per-profile care; legacy save migration; pet re-adoption with separate identity; locked down arbitrary direct care-stat updates; PWA cache/version updates.

## Verification completed (2026-10-18)

- `npm test`: **54 tests passed, 0 failed**, including 10 new pet-care and persistence scenarios.
- `npm run build`: completed; generated `www/` assets from the corrected source.
- `node scripts/audit-k12-pathway.cjs | cmp - K12_CURRICULUM_MAP.json`: matched.
- Chromium `tests/browser_pet_care.py`: passed; includes visible hunger/happiness decay, starvation warnings, feeding rescue, death history, shop re-adoption, and separate runaway event.
- Chromium `tests/browser_regression.py`: passed; pre-existing profile/shop/legacy/gameplay regression.
- Chromium `tests/browser_smoke.py`: passed; timer, gameplay, and result screen.
- Chromium `tests/browser_college.py`: passed, both source and built web assets.
- Chromium `tests/browser_grade_subjects.py`: passed, source and built web assets.
- Chromium `tests/browser_checkpoint.py`: passed, source and built web assets.
- Chromium `tests/browser_k12_pathway.py`: passed, source and built web assets.

## Not verified

- `tests/browser_offline.py` (hosted service-worker reload) fails before any app request because this environment blocks Chromium `http://127.0.0.1` navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. It is **not a game-specific regression**.
- Native Android APK, Linux AppImage and packaged installer were **not built or tested** in this environment.
- Local wall-clock timestamps and local saves are not tamper-proof; read `PET_CARE.md`.

## Source release contract

- All playable pets are defined in `profile.pets` and must have a valid, persistent `careUpdatedAt`.
- Every loss appends an immutable-in-normal-play archived snapshot to `profile.petHistory`, removes active ownership, and updates the selection.
- Older saves start pet decay on their first 3.2.0 migration, while 3.2.0 timestamps survive saves and imports.
- Loss events are selected by **earliest chronological deadline**, not final stat values.
- Profile switching, data export/import, app resume and normal saves reconcile elapsed care time without granting XP for waiting.
- `www/` is built output; application code is the authoritative source.
