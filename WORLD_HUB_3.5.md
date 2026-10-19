# Math Quest 3.5 — Real Player Home (World Hub)

## Why this release exists

3.4 changed the title/welcome screen but **did not redesign the World Hub** players see after selecting a profile. This release changes that actual screen. The old World Hub was a plain profile header, a repetitive grid of grade cards, and a row of navigation buttons.

## Actual interactive improvements

- A large, locally rendered landscape behind the **player's owned avatar and selected living pet**. When no pet is owned, a clearly labeled **pet preview** appears, with an **Adopt a Pet** action leading to the shop.
- The character models remain real rotatable 3D meshes with a WebGL/Canvas software renderer; the Wave control triggers an actual character reaction.
- A high-contrast **Continue Learning** action opens the appropriate **unlocked** grade, resetting the selected subject to All Topics. When a future academic focus grade is locked, it selects the highest unlocked grade at or below that focus.
- All thirteen grade buttons remain playable under their existing XP unlock conditions; locked grades cannot be opened. New cards visually distinguish available, featured, completed-practice, and locked stages. Each still shows the real registered subject/question-definition count.
- The grade progression strip displays **recorded in-app practice** only. It does not present XP as academic mastery or claim external accreditation.
- Pet Room, Shop, Achievements, Statistics, Optional Application Workshop, and Switch Profile are genuine navigation actions on the player home, not decorative tiles.
- Responsive layouts for 390, 768 and 1440 pixel browser viewports, reduced-motion support and keyboard/focus affordances.
- `bash launch-linux.sh --check` verifies the CSS, JavaScript, markup and version of the actual World Hub, as well as the 3D renderer.
- `bash launch-linux.sh --home` deep-links to the World Hub when a saved profile exists; if no profile exists it retains the title screen. The same Chromium data directory is used to preserve player progress.

## Install/update on ARKlinux

1. In the game Settings, export the current save as a backup and close all Math Quest windows.
2. Update from GitHub:

```bash
cd ~/Projects/mathquest
git pull --ff-only origin main
bash launch-linux.sh --check
npm test
npm run build
bash launch-linux.sh --home
```

Expected check: **Math Quest 3.5.0**, **3D renderer: present**, **Adventure home: present**, **Player home: World Hub 3.5 verified in source**.

If your screen is still old, verify the exact folder and Git SHA printed by `--check`, and check whether you opened a separately installed AppImage/desktop shortcut. `npm run build` updates `www/`, while the lightweight Chromium launcher loads this checkout's source `index.html` directly. It does not replace an existing AppImage.

## Verification

- `npm test` checks game logic and source-level contracts.
- `CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_worldhub.py` checks rendered pixels, mobile/tablet/desktop sizes, real profile creation, grade navigation, and pet/shop/achievement actions.
- Other existing Chromium suites cover game play, K–12 assignments, pet death/runaway, and 3D character ownership/rotation.

The local Chromium sandbox policy blocks direct file-URL navigation, so browser tests use actual game source with inlined local CSS/JS rather than verifying that Chromium opened a `file://` URL on a real ARKlinux desktop. Native AppImage/Android installation is not certified by these tests.
