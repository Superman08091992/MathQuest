# Math Quest 3.4.0 home-screen release verification

Scope: home-screen layout and appearance, visible 3D character previews, responsive navigation, version/launcher reporting, cached web assets. This release does **not** change academic question banks, game rewards, or pet survival mechanics.

## Independently inspected behavior

- `npm test`: 60/60 passing in the local build.
- Chromium browser regression: responsive home-screen at 360, 390, 768, 1100 and 1440 px; no horizontal overflow; both 3D models render actual pixels using the software renderer; Wave and Play change animation state; Start navigates to profile creation; leaving the home releases both renderers; returning restarts them; profile creation updates the home greeting and button text. `tests/browser_home.py`.
- Character model/browser regressions and gameplay flows remain passing in the local browser run.
- `npm run build`: succeeds, emits updated `www/index.html` and `www/css/home.css` with matching revision.
- `bash launch-linux.sh --check`: emits version, source directory, 3D availability, and adventure home availability without opening Chromium.

The verification environment did not provide hardware accelerated WebGL. Tested 3D rendering uses the local software Canvas renderer. Desktop AppImage, Android APK installation and hosted-service-worker offline reload remain unverified.

## To see the release on ARKlinux

Run `bash launch-linux.sh --check` in the updated Git checkout; the result must include `Math Quest 3.4.0` and `Adventure home: present`. Then close older Math Quest windows and run `bash launch-linux.sh` from that directory. An independently packaged AppImage is not updated by `git pull`; rebuild it separately.
