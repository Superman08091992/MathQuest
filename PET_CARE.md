# Persistent pet care — Math Quest 3.2.0

## Operational contract

Every active pet has its own wall-clock timestamp (`careUpdatedAt`) and care statistics. Real elapsed time changes those statistics, even when Math Quest is closed. This implementation is entirely offline; it does **not** require background processes, push notifications, or a network connection. On opening the application, changing screens, resuming the window, saving, and at intervals while the application is open, elapsed time is reconciled and the result is stored in the same profile save.

- **Hunger**: 0 means full, 100 means starving. It **increases by 2 points per hour**.
- **Happiness**: 100 means happy, 0 means miserable. It **decreases by 1.25 points per hour**.
- **Starvation**: reaching hunger 100 starts a 36-hour continuous deadline. Remaining at 100 when this deadline expires results in **death by starvation**.
- **Running away**: reaching happiness 0 starts a 48-hour continuous deadline. Remaining at 0 until this deadline results in the pet **running away**.
- **Both risks**: whichever deadline occurs first determines the outcome. A long jump while the game is closed calculates the actual earlier event rather than choosing based on the final numbers.
- **Interruption**: feeding or a treat lowers hunger and resets the starvation deadline. Petting, playing, or a treat raises happiness and resets the runaway deadline. Training reduces happiness. Playing also increases hunger.
- **Cost**: care interactions retain the existing points/crystals economy and continue awarding their existing pet XP amounts. Waiting produces no XP.

An adopted animal starts with **hunger 50** and **happiness 80**. Without any interaction, its hunger reaches 100 at **25 hours** and death follows at **61 hours**. Happiness would reach 0 at **64 hours**; without feeding, starvation normally occurs first. Feeding regularly while never offering attention can lead to running away at about **112 hours**.

## What happens when a pet is lost

1. The specific pet is removed from `profile.pets` and the current selected pet switches to another living pet (or becomes `null`).
2. A dated snapshot of the lost pet, including its individual XP, level, name, type, reason and fate (`died` or `ran_away`), is appended to `profile.petHistory`.
3. The lost pet is removed from active `ownedItems`. Its shop species becomes available to buy again at normal cost, creating a **new level-1 pet**, **not resurrecting the old individual**.
4. The Pet Room shows a dated **Pets lost** section. Losses remain in saved games and exports and do not become selectable.
5. Multiple profiles and multiple pets are tracked independently, including profiles that are not currently selected.

## Older saves and backups

Existing **3.1.0 and earlier** pets keep their legitimately earned XP, level, status and ownership. They receive their initial `careUpdatedAt` **at first upgrade**; the software does not apply negative time for months when these rules did not exist. A 3.2.0 save **already containing a timestamp** does accumulate offline elapsed time on the next load/import. A lost pet in the history is not revived by an old `ownedItems` value on re-import. Existing settings and academic records remain separate.

**Before updating**, export your game through Settings → Export Save Data. Imported saves fully replace current profiles; export the active save before importing another.

## User-facing warnings

The hub includes an alert when active pets are hungry/unhappy, and the Pet Room shows critical states, live hunger/happiness bars, estimated time remaining to loss, living selectable pets, and a record of lost pets. The application checks its saved timestamps again on focus, resume and once per minute in the foreground.

## Verification

```bash
npm test
npm run build
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_pet_care.py
CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_regression.py
```

Checks include chronological time advancement, one-shot versus incremental updates, offline saves, legacy upgrades, backwards-clock behavior, feeding rescue, pet death, continued feeding with runaway from sadness, independent profiles, shop re-adoption, persistence, and visible UI outcomes.

## Limitations

This is a **local-first simulation** that trusts the device's system clock and local save data. Deliberate date changes, file edits, or restoring older backups can bypass consequences; an offline application cannot enforce trusted time without a trusted external service. The engine refuses to reverse time on a single pet if the clock moves backwards, but forward clock jumps still advance welfare. This simulation does **not** model real-world animal care and should not be used as animal-welfare advice. There are no background notifications while the application is closed: warnings appear when it is reopened. All timing constants are defined in `js/pet-manager.js`.
