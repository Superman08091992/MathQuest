# Math Quest 2.3.0 — investigated defects, corrections, and limitations

## Explanation of the Level 3 phantom pet

Version 2.2 had literal, prefilled HTML statistics in the Pet Room:
`Lv3 (210/350)`, `75/100` happiness and `45/100` hunger. No pet is created by that HTML.
When `selectedPet` was null/invalid, Pet Room's renderer returned early, leaving
those values visible and never rendering the owned-pet thumbnails. Thus *the
numbers did not establish that a Level 3 pet existed in the saved game*.

The UI now displays an honest empty state, hides all pet statistics when there is
no pet, enables Browse Pets in the shop, and **always renders existing pets**.
Old saves with owned pets and a missing/invalid selection auto-select their first
real pet. Real level/XP/mood/hunger are preserved. If the save includes ownership
but no pet record at all, the known pet is reconstructed as **level 1 with unknown
adoption date** instead of fabricating an advanced level.

## Additional defects repaired

- Owned avatar skins were unclickable: they can now be re-equipped at no extra cost.
- Pet catalogue entries had no selection control after purchase: select owned pets
  from either shop or Pet Room, with per-profile ownership, accessible buttons,
  and a visibly selected state.
- Toy icons suggested an interaction but had none: toys now perform the normal
  paid Play interaction, and disable if there is no pet or insufficient points.
- Unrecognized pet actions could deduct an undefined price and corrupt balances:
  inputs and money debits are validated.
- Pet experience advancement applied only one level per interaction: overflow
  is carried correctly across multiple levels.
- Achievement filters had no event handlers: filters now actually filter the list.
- Achievements were advertised as “75+” even though 19 were implemented: the
  UI now accurately counts the 19 existing achievements.
- Newly earned achievements and player level-ups were not surfaced on the results
  screen: both are now reported there. Award processing is idempotent.
- Topic stats and total spending were empty/unpopulated. Newly answered questions
  are now categorized and their correct/incorrect totals displayed, with tracked
  points/crystal spending shown. Available balances are labeled as balances,
  **not** misrepresented as lifetime earnings.
- Timed **Play Again** incorrectly switched to relaxed mode: replay retains mode.
- Timed scoring advertised a base multiplier but did not apply it: it now uses
  1.5x base points. Wall-clock countdowns are resilient to tab throttling and
  preserve time remaining when paused. Paused/finished games reject stray answers.
- Timed and hint visibility now respect the HTML `hidden` attribute despite CSS.
- Filters silently substituted all topics for an unavailable subject: grade/topic
  controls are disabled when no templates exist. A Physics-only control with
  **zero** implemented physics questions is no longer advertised.
- Grade 7 percentage-change questions rounded the changed value before computing
  the displayed amount: questions now retain the exact change to two decimals.
- Some Grade 2 “within 100” problems could exceed 100: the generator is constrained.
- Grade 10 trig problems had three answer choices: now four distinct choices.
- Initializing the engine with Kindergarten grade 0 was incorrectly treated as
  grade 1: explicit grade 0 now remains 0.
- Imported save data and profile records lacked recovery/sanitization: migration
  handles missing fields, invalid selection and preserved pet records, while bad
  imports are rejected without replacing the active profiles; names are escaped.
  Failed saves display a warning. Unparseable stored JSON is copied to a recovery
  localStorage key when possible, rather than silently discarded.
- A missing/broken browser AudioContext could stop button handlers: audio now
  degrades without blocking gameplay.
- Persisted purchases and pet interactions now roll back when the browser refuses
  storage writes, instead of reporting unpersisted purchases as completed.
- Service-worker cache version was bumped, so upgrades pick up new JS/CSS instead
  of staying on stale cached assets.

## Verified in this environment

- Node.js 22: **21/21 unit tests passed**, including 13,000 randomly generated
  questions across 13 grades checked for exactly one unique correct answer option.
  The 13,000 checks establish option uniqueness, **not a proof of mathematical
  validity for every possible generated question**. Other targeted math tests
  validate the percent-change and within-100 corrections.
- Playwright / Chromium: old and new profile flows, empty pet display, purchase,
  select, switch, replay, filters, stats, preserved real Level 3 pet, saved pet
  selection and imported-name injection check passed.
- Chromium browser smoke: full ten-question game, timed timeout, pause, results.
- Static web build: JS, CSS, manifest, icons and worker are copied into `www/`.
- Electron protocol unit test: validates local-origin handling and sandbox
  configuration; this is **not an Electron binary/package test**.

## Not yet verified / known constraints

- A hosted PWA offline-refresh test was attempted but Chromium's access to
  loopback HTTP is blocked by the execution environment (ERR_BLOCKED_BY_ADMINISTRATOR).
  The test file `tests/browser_offline.py` is included to run on a normal host.
- Native Electron AppImage and Capacitor Android APK were **not** compiled/tested
  on their target platforms here. Build configurations are included, but install,
  signing, platform permissions and device behavior require their toolchains.
- Existing localStorage is local to each origin/app profile. Migrating from a
  file-based Chromium launcher to Electron/Android/PWA requires JSON export/import.
- Historical topic performance and prior spending cannot be reliably inferred
  from versions that did not record it. Stats explicitly begin tracking on upgrade.
- There are 29 active question templates and 19 achievements. Additional curriculum
  coverage and content accuracy review remain independent of these functional fixes.

## Run locally

```bash
npm test
npm run build
CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_smoke.py
CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_regression.py
# For hosts that allow loopback HTTP in Chromium:
CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_offline.py
```

No code was pushed to GitHub, no native installer is claimed, and no stored
profiles outside the supplied source archive were modified.
