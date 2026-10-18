"""Browser-facing pet simulation: offline time, loss, history, re-adoption, runaway.

Run: CHROMIUM_BINARY=/usr/bin/chromium python3 tests/browser_pet_care.py
"""
import os
from playwright.sync_api import sync_playwright
from browser_regression import current, launch_page


def start_player(page, name):
    page.locator('#start-game').click()
    page.locator('#new-profile-name').fill(name)
    page.locator('#create-profile').click()
    assert current(page) == 'world-hub'
    page.evaluate('ProfileSystem.getCurrentProfile().stats.points = 1500; SaveManager.save()')
    page.locator('#shop-btn').click()
    assert current(page) == 'shop'


def run():
    with sync_playwright() as p:
        args = {'headless': True}
        if os.getenv('CHROMIUM_BINARY'):
            args['executable_path'] = os.getenv('CHROMIUM_BINARY')
        browser = p.chromium.launch(**args)

        page, errors = launch_page(browser)
        start_player(page, 'Pet caretaker')
        page.locator('.shop-tab[data-tab="pets"]').click()
        page.locator('#pets-items .item-action').first.click()
        assert page.evaluate('PetManager.getCurrentPet().id') == 'cat'
        page.locator('#shop .btn-back').click()
        page.locator('#pet-room-btn').click()
        assert page.locator('#pet-care-policy').is_visible()
        assert page.locator('#pet-history').is_hidden()
        assert page.locator('#hunger-value').inner_text() == '50/100'
        # Backdate a last-update timestamp to simulate a 27-hour offline return.
        page.evaluate('''() => {
            const pet=PetManager.getCurrentPet();
            pet.careUpdatedAt=Date.now()-27*3600000;
            SaveManager.save(); UIManager.renderPetRoom();
        }''')
        assert page.locator('#hunger-value').inner_text() == '100/100'
        assert 'Starving!' in page.locator('#pet-status').inner_text()
        assert page.locator('#pet-status').get_attribute('class').endswith('critical')
        page.locator('#pet-room .btn-back').click()
        assert 'Care needed' in page.locator('#pet-care-alert').inner_text()
        page.locator('#pet-room-btn').click()
        page.locator('[data-action="feed"]').click()
        assert page.locator('#hunger-value').inner_text() == '80/100'
        assert not page.evaluate('PetManager.getCurrentPet().starvingSince')
        # More time passes unattended; the original individual dies.
        page.evaluate('''() => {
            const pet=PetManager.getCurrentPet();
            pet.level=4;pet.xp=19;
            pet.careUpdatedAt=Date.now()-80*3600000;
            SaveManager.save(); UIManager.renderPetRoom();
        }''')
        assert page.locator('#pet-empty-state').is_visible()
        assert page.locator('#pet-interactions').is_hidden()
        assert page.locator('#pet-history').is_visible()
        assert 'died of starvation' in page.locator('#pet-history-list').inner_text()
        assert 'level 4' in page.locator('#pet-history-list').inner_text()
        assert page.locator('#pets-list .pet-thumbnail').count() == 0
        assert page.evaluate('ProfileSystem.getCurrentProfile().selectedPet') is None
        assert page.evaluate('ProfileSystem.getCurrentProfile().pets.length') == 0
        assert page.evaluate('ProfileSystem.getCurrentProfile().petHistory.length') == 1
        assert page.evaluate('ProfileSystem.getCurrentProfile().petHistory[0].xp') == 19
        page.locator('#pet-room .btn-back').click()
        assert '1 pet lost' in page.locator('#pet-care-alert').inner_text()
        page.locator('#pet-room-btn').click()
        page.locator('#adopt-pet-btn').click()
        assert page.locator('#pets-items .item-action').first.inner_text().startswith('Buy for')
        page.locator('#pets-items .item-action').first.click()
        assert page.evaluate('PetManager.getCurrentPet().level') == 1
        assert page.evaluate('ProfileSystem.getCurrentProfile().petHistory.length') == 1
        # Re-entering the room keeps the death record separate from the new pet.
        page.locator('#shop .btn-back').click()
        page.locator('#pet-room-btn').click()
        assert page.locator('#pet-history').is_visible()
        assert page.locator('#current-pet-name').inner_text() == 'Cat'
        assert page.locator('#pets-list .pet-thumbnail').count() == 1
        assert not errors, errors
        page.close()

        # Being well-fed is not enough: sadness alone can cause running away.
        page, errors = launch_page(browser)
        start_player(page, 'Only feeds pets')
        page.locator('.shop-tab[data-tab="pets"]').click()
        page.locator('#pets-items .item-action').nth(1).click()
        page.locator('#shop .btn-back').click()
        page.locator('#pet-room-btn').click()
        page.evaluate('''() => {
            const pet=PetManager.getCurrentPet();
            pet.hunger=0;pet.happiness=0;
            pet.careUpdatedAt=Date.now()-50*3600000;
            pet.unhappySince=pet.careUpdatedAt;
            SaveManager.save();UIManager.renderPetRoom();
        }''')
        assert page.locator('#pet-history').is_visible()
        assert 'ran away' in page.locator('#pet-history-list').inner_text()
        assert page.evaluate('ProfileSystem.getCurrentProfile().petHistory[0].fate') == 'ran_away'
        assert page.evaluate('ProfileSystem.getCurrentProfile().petHistory[0].hunger') < 100
        assert page.locator('#pet-empty-state').is_visible()
        assert not errors, errors
        page.close()
        browser.close()
        print('PASS: Chromium pet-care starvation warnings, recovery, death, archive, re-adoption and runaway')


if __name__ == '__main__':
    run()
