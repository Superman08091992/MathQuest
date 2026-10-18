"""Optional DOM-level browser smoke test without running a network server.

Requires: pip install playwright; python -m playwright install chromium
Run: python tests/browser_smoke.py
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def make_page_source():
    html = (ROOT / 'index.html').read_text()
    html = re.sub(r'<script src="js/[^"]+"\s*></script>', '', html)
    html = re.sub(r'<link rel="stylesheet" href="css/[^"]+">', '', html)
    css = (ROOT / 'css/style.css').read_text() + (ROOT / 'css/icons.css').read_text() + (ROOT / 'css/home.css').read_text()
    html = html.replace('</head>', '<style>' + css + '</style></head>')
    scripts = ['utils', 'question-templates', 'question-templates-advanced',
               'question-templates-extended-fixed', 'college-curriculum', 'college-procedural', 'question-catalogue', 'math-engine', 'readiness-lab', 'save-manager',
               'audio', 'profile-system', 'progression-system', 'reward-system',
               'shop-system', 'pet-manager', 'character3d', 'game-manager', 'ui-manager', 'main']
    source = '\n'.join('<script>' + (ROOT / 'js' / (name + '.js')).read_text() + '</script>'
                       for name in scripts)
    return html.replace('</body>', source + '</body>')


def run():
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_BINARY')
        launch = {'headless': True}
        if executable:
            launch['executable_path'] = executable
        browser = p.chromium.launch(**launch)
        page = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.evaluate("""() => {
          const d = new Map();
          Object.defineProperty(window, 'localStorage', {configurable: true, value: {
            getItem: key => d.get(key) ?? null,
            setItem: (key, val) => d.set(key, String(val)),
            removeItem: key => d.delete(key),
            clear: () => d.clear()
          }});
        }""")
        page.set_content(make_page_source(), wait_until='load')
        assert page.locator('.screen.active').get_attribute('id') == 'main-menu'
        page.locator('#start-game').click()
        assert page.locator('.screen.active').get_attribute('id') == 'profiles-screen'
        page.locator('#new-profile-name').fill('Student')
        page.locator('#create-profile').click()
        assert page.locator('.screen.active').get_attribute('id') == 'world-hub'
        assert page.locator('.grade-card:not(.locked)').count() == 3

        # Timed mode should advance when the countdown expires.
        page.locator('.grade-card:not(.locked)').first.click()
        page.locator('.mode-card[data-mode="timed"] button').click()
        assert page.locator('.screen.active').get_attribute('id') == 'gameplay'
        page.evaluate('GameManager.timeRemaining = 1; GameManager.timerDeadline = Date.now() + 1000')
        page.wait_for_function('GameManager.currentGame.currentQuestionIndex === 1', timeout=2500)
        assert page.evaluate('GameManager.timeRemaining') >= 29
        page.locator('#pause-game').click()
        assert page.locator('#pause-menu').evaluate("el => el.classList.contains('active')")
        page.locator('#quit-game').click()
        assert page.locator('.screen.active').get_attribute('id') == 'world-hub'

        # Complete a relaxed game via its actual UI buttons.
        page.locator('.grade-card:not(.locked)').first.click()
        page.locator('.mode-card[data-mode="relaxed"] button').click()
        for _ in range(10):
            answer = page.evaluate('GameManager.currentGame.questions[GameManager.currentGame.currentQuestionIndex].answer')
            page.locator('.answer-btn').filter(has_text=re.compile('^' + re.escape(str(answer)) + '$')).first.click()
        assert page.locator('.screen.active').get_attribute('id') == 'results'
        assert page.locator('#correct-count').inner_text() == '10'
        assert page.evaluate('ProfileSystem.getCurrentProfile().stats.perfectGames') == 1
        assert page.evaluate('ProfileSystem.getCurrentProfile().stats.gamesPlayed') == 1

        page.locator('#back-to-hub').click()
        page.wait_for_timeout(450)
        if 'MATH_QUEST_SCREENSHOT' in os.environ:
            page.screenshot(path=os.environ['MATH_QUEST_SCREENSHOT'])
        assert not errors, errors
        print('PASS: browser UI profile, 3 unlocked grades, timeout, pause, 10-answer game and results')
        browser.close()


if __name__ == '__main__':
    run()
