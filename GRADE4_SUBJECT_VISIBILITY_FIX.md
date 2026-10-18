# Math Quest 2.4.1 — Grade 4 subjects and update instructions

## What was wrong / what is now corrected

Math Quest 2.4.0 **registered** six Grade 4 subjects, but the category picker appeared *after* two long game-mode panels. In a 390px-wide mobile browser capture it started more than a screen below the grade header. A retained topic filter could also continue showing only Arithmetic after navigating to another grade. A previously installed 2.3.0 AppImage/source did not contain the new non-math category buttons at all. We cannot inspect the user's local running program from this archive, so do not claim which of these happened on their machine.

2.4.1 moves subject selection to the top of the Grade screen; shows only eligible subject buttons, with a question-definition count for each; visibly states how many subjects are available; and resets topic selection to **All Topics** when a grade is selected. The grade-selection tiles show subject and question-type counts even before opening the grade (locked grades remain locked as before).

The app now fails with a visible *incomplete question bank* warning rather than silently substituting an Arithmetic-only fallback when modules are missing. CSS/JavaScript URLs and the offline cache are versioned at 2.4.1, to avoid mixing old and new web assets during an update. The main menu clearly displays **Version 2.4.1**.

**The amount of question content was not expanded in this 2.4.1 patch.** The repair exposes previously registered material and prevents accidental filter carryover. Question definition counts are not counts of independently written questions or distinct generated problems.

## Actual Grade 4 question definitions

| Subject | Definitions | Kind |
| --- | ---: | --- |
| Arithmetic | 9 | Procedural |
| Geometry | 1 | Procedural |
| Reading | 16 | Fixed |
| Science | 4 | Fixed |
| History | 1 | Fixed |
| Astronomy | 2 | Fixed |
| **Total** | **33** | 10 procedural, 23 fixed |

The existing bank remains comparatively thin for Grade 4 History and Geometry. Other subjects are introduced at different grades; not every subject is offered at every grade.

## Update on ARKlinux / Arch Linux

Export your game data using **Settings → Export Save Data** in the current game, and keep the downloaded JSON file. Close all existing Math Quest windows, including any old AppImage. Place `math-quest-app-project-v2.4.1.zip` in `~/Downloads` and run:

```bash
mkdir -p ~/Projects
cd ~/Projects
unzip -o ~/Downloads/math-quest-app-project-v2.4.1.zip
cd math-quest
npm test
npm run build
chmod +x launch-linux.sh
./launch-linux.sh
```

This starts **the updated source from the same location**, instead of a possibly stale desktop shortcut or old AppImage. Verify **Version 2.4.1** on the main menu. A saved profile in a different Chromium profile/URL origin may need to be imported with **Settings → Import Save Data**. Do **not** delete Chromium user-data directories or uninstall the old program before exporting data.

To rebuild a previously installed Electron or Android binary, use the platform commands in `APP_BUILD_GUIDE.md`; updating source files does not modify an old AppImage or APK automatically.

## Verification record

- Source: `npm test` — **29/29 passing**, including explicit Grade 4 category counts, eligibility and subject-filtered questions.
- Chromium DOM regression: `tests/browser_regression.py` — passed profiles, pets, migrated saves, quiz gameplay and fixed Science quizzes.
- Chromium grade/topic integration: `tests/browser_grade_subjects.py` — passed category selection, Grade 4 subject launch and generated-question category checks. This tests all 13 grades on the source view at a 390px viewport, plus Grade 4 on the built `www/` copy at a 1000px viewport.
- Built web assets: `npm run build` — rebuilt `www/`. The release process checks built source/script hashes and re-extracts archives for verification.
- Network-based PWA offline reload and native installed APK/AppImage tests: **not verified here**. This environment blocks Chromium navigation to HTTP, HTTPS and file URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`), although direct offline DOM interactions are testable.

Neither 28 passing tests nor subject visibility constitutes full K–12 curriculum coverage. The 2.4.0 65,000-question sampling audit is still a sample, not the number of unique possible questions.
