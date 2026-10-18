# Math Quest 3.4 — Adventure home

The previous home screen was a plain stack of buttons and a limited-size 3D preview. The **3.4 home screen** is a visual opening scene designed for desktop and phone sizes. This release changes the home screen only; academic progression and the pet simulation retain their existing behavior.

## Visible changes

- A full-width game-inspired sky, animated starlight, large typography, and layered depth gradients made entirely from local CSS. No remote dependencies.
- Your existing real, rotatable 3D avatar and pet appear in the primary opening scene. The renderer uses WebGL when available and its CPU-rendered Canvas fallback when not.
- Wave and Play buttons trigger real 3D reactions, not cosmetic labels.
- Clear **Enter the Quest** and profile-selection actions; existing navigation IDs and save logic are unchanged.
- A non-clickable, informational four-stage path through Kindergarten–Grade 12 that does **not** claim academic completion or award progress.
- An existing profile is greeted by name and given a **Continue Your Quest** button, while its owned avatar and selected living pet appear in the models. Without a pet the cat is labeled as a preview.
- A visible version and a launch check to identify stale desktop copies.
- Phone layouts keep both characters visible in a two-column preview and avoid horizontal scrolling. Keyboard focus outlines and reduced-motion CSS are included.

## Verify on ARKlinux

Before updating, export your save data in the game Settings. Then from an existing Git clone:

```bash
cd ~/Projects/mathquest
git pull --ff-only origin main
bash launch-linux.sh --check
npm test
npm run build
bash launch-linux.sh
```

`--check` must report `Math Quest 3.4.0`, `3D renderer: present`, `Adventure home: present` and the absolute source path. `npm run build` updates the web/Android asset directory; `launch-linux.sh` opens the **source** `index.html` in Chromium with the same persistent browser profile. Rebuild an independently installed AppImage separately.

## Tests

Run `npm test` and `CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_home.py`. Browser tests enforce mobile/desktop render visibility, two software-3D canvases with actual pixels, animations, responsive layout, profile-aware home text, navigation, and proper model disposal after leaving the screen. All tests are local and work without a network server.

This remains a low-poly rendering system, not high-fidelity rigged character artwork.
