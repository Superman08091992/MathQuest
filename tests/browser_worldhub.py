"""Actual player-home regression. Launch: CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_worldhub.py.
Checks responsive pixels, real profile and grade actions, pet/shop destinations, and accessibility.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import make_page_source

ROOT = Path(__file__).resolve().parents[1]

def run():
    with sync_playwright() as playwright:
        args = {'headless': True}
        if os.getenv('CHROMIUM_BINARY'):
            args['executable_path'] = os.getenv('CHROMIUM_BINARY')
        browser = playwright.chromium.launch(**args)
        for width, height in ((390, 844), (768, 920), (1440, 930)):
            page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1,
                                    reduced_motion='reduce')
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.evaluate("""() => {
                const saved = new Map();
                Object.defineProperty(window, 'localStorage', {configurable: true, value: {
                    getItem: name => saved.get(name) ?? null,
                    setItem: (name,value) => saved.set(name, String(value)),
                    removeItem: name => saved.delete(name), clear: () => saved.clear()
                }});
                const original = HTMLCanvasElement.prototype.getContext;
                HTMLCanvasElement.prototype.getContext = function(name,...args) {
                    return name === 'webgl' || name === 'webgl2' ? null : original.call(this,name,...args);
                };
            }""")
            page.set_content(make_page_source(), wait_until='load')
            page.locator('#start-game').click()
            page.locator('#new-profile-name').fill('World Tester')
            page.locator('#create-profile').click()
            assert page.locator('#world-hub.active').is_visible()
            assert page.locator('#hub-next-grade').inner_text() == 'Kindergarten'
            assert page.locator('#hub-available-grades').inner_text().startswith('3 of 13')
            assert page.locator('.grade-card:not(.locked)').count() == 3
            assert page.locator('.grade-card.locked').count() == 10
            assert page.locator('#world-hub .hub-diorama').is_visible()
            assert page.locator('#hub-avatar-stage canvas.available').count() == 1
            assert page.locator('#hub-pet-stage canvas.available').count() == 1
            assert page.locator('#hub-pet-name').inner_text() == 'Pet preview'
            assert page.locator('#hub-companion-action').inner_text() == 'Adopt a Pet'
            assert page.evaluate('''() => {
                const canvas = document.querySelector('#hub-avatar-stage canvas');
                const context = canvas.getContext('2d');
                const pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
                let filled=0; for(let i=3;i<pixels.length;i+=4) if(pixels[i]>0) filled++;
                return filled>500;
            }'''), 'Avatar drawn pixels missing'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'horizontal overflow {width}'
            if width in (390, 1440) and os.getenv('WORLDHUB_SCREENSHOT_DIR'):
                out = Path(os.environ['WORLDHUB_SCREENSHOT_DIR'])
                out.mkdir(parents=True,exist_ok=True)
                page.screenshot(path=str(out / f'world-hub-{width}.png'), full_page=True, animations='disabled')
            page.locator('#hub-continue').click()
            assert page.locator('#mode-selection.active').is_visible()
            assert page.locator('#grade-title').inner_text().startswith('Kindergarten')
            page.locator('#mode-selection .btn-back').click()
            assert page.locator('#world-hub.active').is_visible()
            page.locator('.grade-card:not(.locked)').nth(1).click()
            assert page.locator('#grade-title').inner_text().startswith('Grade 1')
            page.locator('#mode-selection .btn-back').click()
            page.locator('#hub-companion-action').click()
            assert page.locator('#shop.active').is_visible(), 'Adopt button should open Shop when no pet owned'
            page.locator('#shop .btn-back').first.click()
            assert page.locator('#world-hub.active').is_visible()
            page.locator('#achievements-btn').click()
            assert page.locator('#achievements.active').is_visible()
            page.locator('#achievements .btn-back').click()
            assert not errors, errors
            print(f'PASS {width}px: actual world-hub, 3D pixels, grade lessons and destinations')
            page.close()
        browser.close()

if __name__ == '__main__':
    run()
