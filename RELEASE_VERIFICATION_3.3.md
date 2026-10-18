# Math Quest 3.3 — evidence and limitations

This release upgrades avatars and pets to interactively rotatable, animated procedural 3D models in the existing app.

## Verified functions

| Scope | Verified result |
| --- | --- |
| Existing game | `npm test`: 58/58 passed (including four new 3D-contract tests). |
| Character catalogue | All 8 shop pet species and all 16 purchasable/default avatar skins have unique 3D model descriptions and visible rendered model differences. |
| Browser model rendering | Chromium `browser_character3d.py`: software 3D rendering produces non-empty painted pixels, 3D turning changes pixels, mouse drag changes yaw, screen switches dispose renderers, and no-canvas fallback remains safe. |
| Existing pet economy | Shop model previews are free and do not charge points or equip/award ownership. Actual paid interactions retain costs and persistent effects. |
| Welfare integration | A starving/sad pet alters its in-game model mood, while simulated feeding updates both the save-owned pet state and stage reaction. |
| During schoolwork | Owned living pet appears during questions, reacts to correct/incorrect answers, and disappears if no live pet is selected. |
| Old flows | Chromium regression, pet-care (death, running away), K–12 pathway, Grade 4 subjects, checkpoint, college diagnostic and smoke tests completed. |
| Web build | `npm run build`: `www/js/character3d.js` byte-identical to `js/character3d.js`, updated JS/CSS and v3.3 cache paths present. |
| Project state | Existing pet/profile save schema and game/economy rules preserved. |

## Verification boundaries

- Chromium in this container does not expose WebGL, so **GPU/WebGL shader compilation and actual hardware-rendered frames were not verified**. The Canvas 2D software 3D backend was verified visually and programmatically. There is a separate last-resort static emoji when neither backend works.
- `browser_offline.py` cannot complete here because browser navigation to local loopback addresses is blocked (`ERR_BLOCKED_BY_ADMINISTRATOR`). Offline source asset registration is verified, but installed PWA offline reload is **not** independently verified.
- No Android APK or native Linux AppImage was built and installed in a physical/emulated target during these checks.
- The figures are low-poly original procedural characters, not production-grade rigged 3D animation packs or external GLTF models. No independently traversable pet home, multiplayer interactions or collision physics are included.

## Commands

```bash
npm test
npm run build
CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_character3d.py
CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_pet_care.py
CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_regression.py
```
