#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="$(sed -n 's/^[[:space:]]*"version": "\([^"]*\)".*/\1/p' "$ROOT/package.json" | head -n 1)"
if [[ -z "$VERSION" || ! -s "$ROOT/js/character3d.js" || ! -s "$ROOT/css/home.css" || ! -f "$ROOT/index.html" ]]; then
  printf 'ERROR: incomplete Math Quest source in %s; expected the game, home screen styles and 3D renderer.\n' "$ROOT" >&2
  exit 1
fi
printf 'Math Quest %s | source: %s\n' "$VERSION" "$ROOT"
printf '3D renderer: present\n'
printf 'Adventure home: present\n'
if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'Git commit: %s\n' "$(git -C "$ROOT" rev-parse --short HEAD)"
fi
if [[ "${1:-}" == "--check" ]]; then
  exit 0
fi
if [[ "${1:-}" != "" ]]; then
  printf 'Usage: bash launch-linux.sh [--check]\n' >&2
  exit 2
fi
if command -v chromium >/dev/null 2>&1; then
  BROWSER=chromium
elif command -v google-chrome >/dev/null 2>&1; then
  BROWSER=google-chrome
elif command -v chromium-browser >/dev/null 2>&1; then
  BROWSER=chromium-browser
else
  printf 'Math Quest requires Chromium or Google Chrome.\n' >&2
  exit 127
fi
# Keep the exact same Chromium profile to preserve saved players and pets.
# Version the launch URL so Chromium does not silently restore an old app page.
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/math-quest-browser"
GAME_URL="file://$ROOT/index.html?version=$VERSION"
printf 'Opening: %s\n' "$GAME_URL"
exec "$BROWSER" --new-window --app="$GAME_URL" \
  --user-data-dir="${XDG_DATA_HOME:-$HOME/.local/share}/math-quest-browser" \
  --no-first-run --no-default-browser-check
