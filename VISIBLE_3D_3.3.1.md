# Math Quest 3.3.1 — 3D visibility and version verification

The original 3.3 character engine was present but not visible on the first screen. This release adds two continuously animated, rotatable 3D characters to the landing screen. The avatar and pet reflect the currently selected profile when one exists, while unowned pets are explicitly marked as previews.

## Validate a tower install

```bash
cd ~/Projects/mathquest
bash launch-linux.sh --check
npm test
npm run build
bash launch-linux.sh
```

Expected output from `--check`: Math Quest 3.3.1 and `3D renderer: present` plus the absolute source path. If a previously installed AppImage or stale browser tab is showing 3.2 or earlier, close that window; `launch-linux.sh` opens the local source. The launcher uses a versioned URL but retains the existing Chromium user-data directory (and saved profiles). `npm run build` produces `www/` for Android and the Electron app; the lightweight Linux launcher intentionally opens the source `index.html` for existing profile compatibility.

### Verification

Check the first menu for two rotatable character previews, then Pet Room and Shop for persistent 3D rendering. This is an interactive low-poly 3D renderer with Canvas software fallback, not an imported realistic rig or explorable habitat.
