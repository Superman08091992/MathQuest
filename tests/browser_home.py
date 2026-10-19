"""Home-screen visual and navigation integration; no network or GPU required.

    CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_home.py
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import make_page_source


def local_game(browser, width, height):
    page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.evaluate('''() => {
        const store = new Map();
        Object.defineProperty(window, 'localStorage', {configurable:true, value: {
            getItem: k => store.get(k) ?? null,
            setItem: (k, v) => store.set(k, String(v)),
            removeItem: k => store.delete(k), clear: () => store.clear()
        }});
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(name, ...args) {
            return name === 'webgl' || name === 'webgl2' ? null : original.call(this, name, ...args);
        };
    }''')
    page.set_content(make_page_source(), wait_until='load')
    page.wait_for_function("() => document.querySelectorAll('#welcome-3d-showcase canvas.available').length === 2")
    return page, errors


def run():
    with sync_playwright() as pw:
        args={'headless':True}
        if os.getenv('CHROMIUM_BINARY'): args['executable_path']=os.getenv('CHROMIUM_BINARY')
        browser=pw.chromium.launch(**args)
        for width, height in [(360,780),(390,844),(768,900),(1100,900),(1440,970)]:
            page,errors=local_game(browser,width,height)
            assert page.locator('#main-menu.active').is_visible()
            assert page.locator('#main-menu h1').inner_text().find('MAGIC') >= 0
            assert page.locator('#start-game').is_visible()
            assert page.locator('#welcome-3d-showcase').is_visible()
            assert page.locator('.home-realm').count() == 4
            assert page.locator('.home-topbar-version').inner_text() == 'v' + __import__('json').loads((Path(__file__).resolve().parents[1] / 'package.json').read_text())['version']
            assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'),f'overflow at {width}'
            assert page.evaluate('''() => {
                const stage=Character3D.getStage(document.getElementById('welcome-avatar-stage'));
                const pet=Character3D.getStage(document.getElementById('welcome-pet-stage'));
                stage.reducedMotion=pet.reducedMotion=true;
                stage.drawNow();pet.drawNow();
                const filled=s => {const data=s.ctx2d.getImageData(0,0,s.canvas.width,s.canvas.height).data;
                    let result=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)result++;return result;};
                return filled(stage)>500 && filled(pet)>1000;
            }''')
            page.locator('[data-character-stage="welcome-avatar-stage"][data-character-action="wave"]').click()
            assert page.evaluate("Character3D.getStage(document.getElementById('welcome-avatar-stage')).action === 'wave'")
            page.locator('[data-character-stage="welcome-pet-stage"][data-character-action="play"]').click()
            assert page.evaluate("Character3D.getStage(document.getElementById('welcome-pet-stage')).action === 'play'")
            # Start and return to home; no losing the character canvases or user navigation.
            page.locator('#start-game').click()
            assert page.locator('#profiles-screen.active').is_visible()
            assert page.evaluate('Character3D.activeCount') == 0
            page.locator('#profiles-screen .btn-back').click()
            assert page.locator('#main-menu.active').is_visible()
            assert page.locator('#welcome-avatar-stage canvas.available').is_visible()
            assert not errors,errors
            page.close()
        page,errors=local_game(browser,1100,900)
        page.locator('#start-game').click()
        page.locator('#new-profile-name').fill('Learner')
        page.locator('#create-profile').click()
        assert page.locator('#world-hub.active').is_visible()
        page.locator('#world-hub .btn-back').click()
        assert page.locator('#home-returning-player').is_visible()
        assert 'Learner' in page.locator('#home-returning-player').inner_text()
        assert 'Continue Your Quest' in page.locator('#start-game').inner_text()
        assert not errors,errors
        page.close()
        browser.close()
    print('PASS: responsive 3D adventure home, all controls, saved-player personalization')

if __name__ == '__main__': run()
