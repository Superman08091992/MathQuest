#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if command -v chromium >/dev/null 2>&1; then
  BROWSER=chromium
elif command -v google-chrome >/dev/null 2>&1; then
  BROWSER=google-chrome
elif command -v chromium-browser >/dev/null 2>&1; then
  BROWSER=chromium-browser
else
  printf 'Math Quest requires Chromium or Google Chrome for the lightweight Linux launcher.\n' >&2
  printf 'Alternative: open index.html in an existing browser, or build the Electron AppImage.\n' >&2
  exit 127
fi
mkdir -p "${XDG_DATA_HOME:-$HOME/.local/share}/math-quest-browser"
exec "$BROWSER" --app="file://$ROOT/index.html" \
  --user-data-dir="${XDG_DATA_HOME:-$HOME/.local/share}/math-quest-browser" \
  --no-first-run --no-default-browser-check
