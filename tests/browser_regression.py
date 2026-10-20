"""Integration regression: real Chromium DOM flow, profile and saved-pet recovery.

Run: CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_regression.py
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import make_page_source


def launch_page(browser, initial=None, size=None):
    page = browser.new_page(viewport=size or {"width": 390, "height": 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.evaluate("""(initial) => {
      const d = new Map();
      if (initial) d.set('mathQuestData', JSON.stringify(initial));
      Object.defineProperty(window, 'localStorage', {configurable: true, value: {
        getItem: key => d.get(key) ?? null,
        setItem: (key, val) => d.set(key, String(val)),
        removeItem: key => d.delete(key),
        clear: () => d.clear()
      }});
    }""", initial)
    page.set_content(make_page_source(), wait_until='load')
    return page, errors


def current(page):
    return page.locator('.screen.active').get_attribute('id')


def run():
    with sync_playwright() as p:
        args = {'headless': True}
        if os.environ.get('CHROMIUM_BINARY'):
            args['executable_path'] = os.environ['CHROMIUM_BINARY']
        browser = p.chromium.launch(**args)

        # Fresh user: no phantom Level 3; clear acquisition path.
        page, errors = launch_page(browser)
        page.locator('#start-game').click()
        page.locator('#new-profile-name').fill('Learner')
        page.locator('#create-profile').click()
        page.locator('#pet-room-btn').click()
        assert current(page) == 'pet-room'
        assert page.locator('#current-pet-name').inner_text() == 'No Pet Selected'
        assert page.locator('#pet-empty-state').is_visible()
        assert not page.locator('#pet-stats').is_visible()
        assert not page.locator('#pet-interactions').is_visible()
        assert page.locator('#level-display').inner_text() == '—'
        assert page.locator('.pet-thumbnail').count() == 0
        assert 'No pets owned' in page.locator('#pets-list').inner_text()
        page.locator('#adopt-pet-btn').click()
        assert current(page) == 'shop' and page.locator('#pets-tab').is_visible()
        assert page.locator('#pets-items .item-action').first.is_disabled()
        # Fund a test profile to exercise actual purchasing and pet-selection DOM.
        page.evaluate('ProfileSystem.getCurrentProfile().stats.points = 1200; SaveManager.save(); UIManager.renderShop();')
        page.locator('#pets-items .item-action').first.click()
        assert page.evaluate('ProfileSystem.getCurrentProfile().selectedPet') == 'cat'
        assert page.locator('#pets-items .item-action').first.inner_text() == 'Selected pet'
        assert page.evaluate('ProfileSystem.getCurrentProfile().stats.pointsSpent') == 200
        page.locator('#pets-items .item-action').nth(1).click()
        assert page.evaluate('ProfileSystem.getCurrentProfile().selectedPet') == 'dog'
        page.locator('#shop .btn-back').click()
        page.locator('#pet-room-btn').click()
        assert page.locator('.pet-thumbnail').count() == 2
        assert page.locator('#current-pet-name').inner_text() == 'Dog'
        assert page.locator('#level-display').inner_text() == 'Lv1 (0/50)'
        assert page.locator('#pet-stats').is_visible()
        page.locator('.pet-thumbnail').first.click()
        assert page.locator('#current-pet-name').inner_text() == 'Cat'
        assert page.locator('.pet-thumbnail').first.get_attribute('aria-pressed') == 'true'
        page.locator('[data-action="pet"]').click()
        assert page.locator('#level-display').inner_text() == 'Lv1 (3/50)'
        assert page.evaluate('ProfileSystem.getCurrentProfile().stats.pointsSpent') == 405
        page.locator('#pet-room .btn-back').click()
        page.locator('#shop-btn').click()
        page.locator('.shop-tab[data-tab="skins"]').click()
        page.locator('#regular-skins .item-action').nth(1).click()
        assert page.locator('#regular-skins .item-action').nth(1).inner_text() == 'Equipped'
        page.locator('#regular-skins .item-action').first.click()
        assert page.locator('#regular-skins .item-action').first.inner_text() == 'Equipped'
        assert page.locator('#regular-skins .item-action').nth(1).inner_text() == 'Equip'
        page.locator('#regular-skins .item-action').nth(1).click()
        assert page.locator('#regular-skins .item-action').nth(1).inner_text() == 'Equipped'
        assert page.evaluate('ProfileSystem.getCurrentProfile().stats.pointsSpent') == 505
        page.locator('#shop .btn-back').click()
        page.locator('#stats-btn').click()
        assert page.locator('#stat-total-spent').inner_text() == '505'
        assert page.locator('#stat-total-points').inner_text() == '695'
        page.locator('#stats .btn-back').click()
        page.locator('#achievements-btn').click()
        assert page.locator('#total-count').inner_text() == '19'
        page.locator('.filter-btn[data-filter="streak"]').click()
        assert page.locator('.achievement-card').count() == 3
        page.locator('.filter-btn[data-filter="all"]').click()
        assert page.locator('.achievement-card').count() == 19
        assert errors == [], errors
        page.close()

        # Old record: preserve a real level 3 pet when selectedPet is missing.
        old = {'version': '2.2.0', 'currentProfileId': 'legacy', 'profiles': [
          {'id': 'legacy', 'name': '<img src=x onerror=alert(1)>', 'avatar': '👤',
           'stats': {'level': 3, 'xp': 11, 'points': 150, 'crystals': 4,
                     'totalQuestions': 20, 'correctAnswers': 12, 'gamesPlayed': 3, 'bestStreak': 5},
           'pets': [{'id': 'fox', 'name': 'Fox', 'emoji': '🦊', 'level': 3, 'xp': 20,
                     'happiness': 64, 'hunger': 43}], 'ownedItems': ['default', 'fox'],
           'selectedPet': None}
        ]}
        page, errors = launch_page(browser, old)
        page.locator('#profiles').click()
        assert page.locator('.profile-card img').count() == 0  # Imported names are escaped.
        page.locator('#profiles-screen .btn-back').click()
        page.locator('#start-game').click()
        assert current(page) == 'world-hub'
        page.locator('#pet-room-btn').click()
        assert page.locator('#current-pet-name').inner_text() == 'Fox'
        assert page.locator('#level-display').inner_text() == 'Lv3 (20/150)'
        assert page.locator('#happiness-value').inner_text() == '64/100'
        assert page.locator('#hunger-value').inner_text() == '43/100'
        assert page.locator('.pet-thumbnail').count() == 1
        assert page.evaluate('JSON.parse(localStorage.getItem("mathQuestData")).profiles[0].selectedPet') == 'fox'
        assert errors == [], errors
        page.close()

        # Mode/filter/progression integration and play-again fidelity.
        page, errors = launch_page(browser)
        page.locator('#start-game').click()
        page.locator('#new-profile-name').fill('Timer')
        page.locator('#create-profile').click()
        page.locator('.grade-card:not(.locked)').first.click()
        assert page.locator('.category-btn[data-category="physics"]').count() == 0  # no physics templates advertised
        assert page.locator('.category-btn[data-category="algebra"]').is_disabled()
        assert not page.locator('.category-btn[data-category="arithmetic"]').is_disabled()
        assert 'question types selected' in page.locator('#question-coverage').inner_text()
        assert not page.locator('.category-btn[data-category="geometry"]').is_disabled()
        page.locator('.mode-card[data-mode="timed"] button').click()
        assert page.locator('.timer-container').is_visible()
        page.locator('#pause-game').click()
        assert page.locator('.screen.active').get_attribute('id') == 'gameplay'
        assert page.evaluate('GameManager.submitAnswer(1).accepted') is False
        page.locator('#resume-game').click()
        for _ in range(10):
            ans = page.evaluate('GameManager.currentGame.questions[GameManager.currentGame.currentQuestionIndex].answer')
            page.locator('.answer-btn').filter(has_text=str(ans)).first.click()
            page.locator('#answer-continue').click()
        assert current(page) == 'results'
        assert page.locator('#achievements-unlocked').is_visible()
        assert 'First Steps' in page.locator('#achievements-unlocked').inner_text()
        page.locator('#play-again').click()
        assert current(page) == 'gameplay'
        assert page.evaluate('GameManager.currentGame.mode') == 'timed'
        assert page.locator('.timer-container').is_visible()
        page.locator('#pause-game').click()
        page.locator('#quit-game').click()
        page.locator('#stats-btn').click()
        assert 'Arithmetic' in page.locator('#category-stats').inner_text()
        assert errors == [], errors
        page.close()

        # Connected non-math subject: finite fixed facts cap the round length.
        page, errors = launch_page(browser)
        page.locator('#start-game').click()
        page.locator('#new-profile-name').fill('Science')
        page.locator('#create-profile').click()
        page.locator('.grade-card:not(.locked)').nth(1).click()
        assert page.locator('.category-btn[data-category="science"]').is_enabled()
        page.locator('.category-btn[data-category="science"]').click()
        count = page.evaluate('MathEngine.getAvailableTemplates().length')
        assert count >= 2
        assert f'{count} question types selected' in page.locator('#question-coverage').inner_text()
        page.locator('.mode-card[data-mode="relaxed"] button').click()
        expected = min(10, count)
        assert page.evaluate('GameManager.currentGame.questionsPerGame') == expected
        for _ in range(expected):
            ans = page.evaluate('GameManager.currentGame.questions[GameManager.currentGame.currentQuestionIndex].answer')
            page.locator('.answer-btn').filter(has_text=str(ans)).first.click()
            page.locator('#answer-continue').click()
        assert current(page) == 'results'
        assert page.evaluate('ProfileSystem.getCurrentProfile().categoryStats.science.totalQuestions') == expected
        assert errors == [], errors
        page.close()

        browser.close()
        print('PASS: four Chromium flows: profiles/pets/shop, migrations, gameplay, connected science categories')

if __name__ == '__main__':
    run()
