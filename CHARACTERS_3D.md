# Math Quest 3.3 — interactive 3D pets and avatars

## What is implemented

The game now renders actual three-dimensional procedural meshes. Characters are built from colored spheres, cones, cylinders, boxes and double-sided wings, transformed in XYZ space through a perspective camera. They are not flat GIFs, photographs, imported stock illustrations or emoji substitutes.

- **Eight pet species:** cat, dog, rabbit, fox, panda, lion, dragon, and phoenix. Faces, ears, tails, paws, wings, horns and plumage differ by species.
- **Sixteen avatars:** the default player plus all existing normal/legendary shop skins, with different faces, body proportions, hair, uniforms, helmets, masks, coats, crowns, horns, wings or other accessories.
- **Gameplay companion:** the selected living pet accompanies the learner into questions and reacts differently to correct and incorrect answers, without changing welfare or rewards.
- **Pet Room:** owned pet occupies a character stage and idles, blinks, breathes and moves. Starvation or severe unhappiness reduce movement and posture. Feeding, playing, petting, training and treating trigger visible reactions while still deducting their existing in-game costs.
- **Avatar presentation:** 3D characters appear in the world hub, the profile-picker preview, and a larger shop studio. The 3D preview is free and does not grant ownership or charge currency.
- **Controls:** drag/swipe horizontally to rotate; left/right arrow keys rotate a focused stage; Space or Enter triggers a harmless visual reaction. On-screen left/right buttons and Animate/Wave controls work without dragging.
- **Accessibility:** descriptive labels and keyboard focus on canvases; reduced-motion preferences limit idle animation; motion is paused in background tabs.

## Renderer and compatibility

The renderer is in `js/character3d.js` and has **no third-party runtime dependencies**. It uses WebGL for shaded, perspective, 3D meshes when a WebGL context is available. When unavailable, the same 3D geometry is transformed, projected, depth-sorted and shaded in Canvas 2D. Only when *both* canvas options are unavailable does it show a labeled static emoji. This final safety net does not represent successful 3D operation.

Only stages on the active game screen remain allocated. Changing screens disposes buffers, listeners, render loops and ResizeObservers. Animation caps are approximately 30 frames/second in WebGL and 10 frames/second in the Canvas fallback to reduce work on battery-powered devices. Render resolution is capped and device-pixel ratio is limited.

Character geometry and animation belong to the presentation layer. Existing pet IDs, hunger, happiness, XP, inventory, purchases, history, death and running-away records remain owned by PetManager/SaveManager. **A pet is not brought back by previewing its model.** Old profiles and ownership data migrate exactly as before; no cosmetic rendering state is saved in those records.

All runtime assets are shipped inside the application and added to the v3.3 service-worker precache; the renderer makes no network fetches. Browser-based offline reload still needs verification on a real HTTPS host; this environment blocks local HTTP navigation, so we did not claim a hosted PWA test passed.

## Verification evidence

- `npm test` checks avatar/pet catalogue parity, script load order, offline asset registration and all existing game invariants.
- `CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_character3d.py` forces Canvas-3D fallback and verifies actual painted pixels, rotation by button/drag, 16 avatar models, 8 pet models, shop preview without purchase, context cleanup, care-state updates, and the no-canvas emoji last resort.
- Run `CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_pet_care.py` for the unchanged starvation, death and runaway behavior.
- Run `npm run build` and compare `js/character3d.js` with `www/js/character3d.js` to prove the published Android/web bundle uses the tested source.

## Honest remaining limitations

The initial models are **procedural low-poly artwork**, not photorealistic sculpted assets, facial motion capture or skeletal animations from a professional animation studio. No full 3D explorable room or obstacle physics is included. WebGL's shader pipeline requires testing on a GPU-enabled desktop/phone because the available Chromium runtime provides no WebGL context; Canvas-based 3D rendering and all gameplay paths were tested here. Android APK and Electron/AppImage packaging still require actual platform builds. Timing of care continues to depend on the user's local device clock, just as in 3.2.
