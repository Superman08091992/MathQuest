# Math Quest 3.5.0 — source and testing evidence

## Scope

This is a redesign of the **logged-in World Hub**, the screen users reach after selecting a profile. The title screen was redesigned in 3.4 but was not the same surface. The redesigned home is functional, responsive, and uses the existing character rendering and save systems.

## What is verified locally

- 62 of 62 Node automated tests pass (`npm test`).
- Browser World Hub functional tests pass at 390, 768 and 1440 pixels, including actual Canvas pixel sampling of the rendered avatar, separate pet stage, zero horizontal overflow, grade selection, resume button, Shop and Achievement navigation (`tests/browser_worldhub.py`).
- CPU 3D integration regression tests pass: all 16 avatar skins and 8 pet models render distinctly with rotations, care actions, and safe lifecycle cleanup (`tests/browser_character3d.py`).
- Existing browser smoke, title screen, K–12 pathway, pet care, subject selector, and cumulative checkpoint regression tests pass with the World Hub updates.
- `npm run build` generates `www/` assets matching `css/hub.css`, `js/ui-manager.js`, and `index.html` source.
- The source-only launch `--check` verifies the World Hub file and required CSS reference, package version, and 3D renderer presence.

## What has not been verified

- Direct Chromium file-URL navigation on the user's ARKlinux machine: the test environment blocks `file://` navigation (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). The browser tests therefore load exact source code/assets in a local test document.
- Actual Linux desktop process behavior with an already-running Chromium user-data directory or older independently installed AppImage.
- The `--home` option's persistence behavior on physical ARKlinux hardware, although its launch URL and in-app query path are implemented.
- Native Android builds, native Electron AppImage, hosted PWA reload, and GPU/WebGL graphics on the user hardware.

## Code-level invariants

- Original SaveManager storage keys, profile IDs, pet life/death rules, and academic checkpoints are untouched.
- Title screen remains available; World Hub has new visual treatment, not a replacement academic model.
- Grade buttons enforce `ProfileSystem.isGradeUnlocked()` and route to the real mode-selection screen. Locked grades cannot be opened.
- World Hub progress displays recorded practice milestones; this does not claim third-party academic certification.
- The pet preview is clearly labeled as a preview when the player does not own a living pet.
