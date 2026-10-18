"""Verify hosted PWA asset caching and saved profile survive network loss and reload."""
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def run():
    server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as p:
            args = {'headless': True}
            if os.environ.get('CHROMIUM_BINARY'):
                args['executable_path'] = os.environ['CHROMIUM_BINARY']
            browser = p.chromium.launch(**args)
            context = browser.new_context(service_workers='allow')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_address[1]}/', wait_until='networkidle')
            page.evaluate('navigator.serviceWorker.ready')
            page.wait_for_function("async () => !!(await caches.keys()).find(x => x === 'math-quest-v3.0.0')")
            page.locator('#start-game').click()
            page.locator('#new-profile-name').fill('Offline Player')
            page.locator('#create-profile').click()
            assert page.locator('#player-name').inner_text() == 'Offline Player'
            context.set_offline(True)
            page.reload(wait_until='load')
            page.locator('#start-game').click()
            assert page.locator('#player-name').inner_text() == 'Offline Player'
            page.locator('#pet-room-btn').click()
            assert page.locator('#pet-empty-state').is_visible()
            assert errors == [], errors
            context.close()
            browser.close()
            print('PASS: PWA precache, offline reload, persisted profile and pet empty state on HTTP localhost')
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
