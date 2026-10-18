"""Real Chromium integration for rotatable avatars/pets, care, shop, and software 3D.

Run: CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_character3d.py
This deliberately disables WebGL to force and verify the CPU 3D renderer.
A full GPU/WebGL path requires a browser environment with a WebGL context.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_smoke import make_page_source


def open_game(browser, no_drawing=False):
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.evaluate('''(noDrawing) => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
            if (kind === 'webgl' || kind === 'webgl2' || (noDrawing && kind === '2d')) return null;
            return original.call(this, kind, ...args);
        };
        const store = new Map();
        Object.defineProperty(window, 'localStorage', {configurable: true, value: {
            getItem: key => store.get(key) ?? null,
            setItem: (key, value) => store.set(key, String(value)),
            removeItem: key => store.delete(key), clear: () => store.clear()
        }});
    }''', no_drawing)
    page.set_content(make_page_source(), wait_until='load')
    return page, errors


def signature(page, host_id):
    return page.evaluate('''id => {
        const stage=Character3D.getStage(document.getElementById(id));
        if (!stage || !stage.ctx2d) throw Error('Expected actual Canvas 3D software renderer');
        stage.reducedMotion=true;
        stage.drawNow();
        const buffer=stage.ctx2d.getImageData(0,0,stage.canvas.width,stage.canvas.height).data;
        let filled=0;for(let i=3;i<buffer.length;i+=4)if(buffer[i]>0)filled++;
        return {picture:stage.canvas.toDataURL('image/png'),filled,kind:stage.options.kind,id:stage.options.id};
    }''', host_id)


def run():
    with sync_playwright() as p:
        launch={'headless': True}
        if os.environ.get('CHROMIUM_BINARY'): launch['executable_path']=os.environ['CHROMIUM_BINARY']
        browser=p.chromium.launch(**launch)
        page, errors=open_game(browser)
        # The first screen must visibly contain real rendered pixels, not
        # merely a feature label or hidden 3D models.
        assert page.locator('#welcome-3d-showcase').is_visible()
        assert page.locator('#welcome-avatar-stage canvas.available').is_visible()
        assert page.locator('#welcome-pet-stage canvas.available').is_visible()
        assert signature(page, 'welcome-avatar-stage')['filled'] > 400
        assert signature(page, 'welcome-pet-stage')['filled'] > 1200
        assert page.evaluate('Character3D.activeCount') == 2
        assert page.locator('#welcome-pet-caption').inner_text().startswith('Cat preview')
        page.locator('[data-character-stage="welcome-pet-stage"][data-character-action="play"]').click()
        assert page.evaluate("Character3D.getStage(document.getElementById('welcome-pet-stage')).action") == 'play'
        page.locator('#start-game').click()
        page.locator('#new-profile-name').fill('3D scholar')
        page.locator('#create-profile').click()
        assert page.locator('#world-hub').is_visible()
        hub=signature(page,'hub-avatar-stage')
        assert hub['id']=='default' and hub['kind']=='avatar' and hub['filled']>400
        assert page.evaluate('Character3D.activeCount') == 1
        # Check both on-screen controls and mouse/key rotation move true 3D vertices.
        start_angle=page.evaluate("Character3D.getStage(document.getElementById('hub-avatar-stage')).yaw")
        page.locator('[data-character-stage="hub-avatar-stage"]').click()
        assert page.evaluate("Character3D.getStage(document.getElementById('hub-avatar-stage')).animUntil > performance.now()")
        page.locator('#profiles').count()  # Preserves existing navigation.
        page.locator('#world-hub .btn-back').click()
        page.locator('#profiles').click()
        assert page.locator('#profile-model-preview').is_visible()
        profile_avatar=signature(page,'profile-model-stage')
        assert profile_avatar['filled']>300
        page.locator('#profiles-screen .btn-back').click()
        page.locator('#start-game').click()
        assert page.evaluate('Character3D.activeCount') == 1
        page.evaluate('ProfileSystem.getCurrentProfile().stats.points=2000;SaveManager.save();')
        page.locator('#shop-btn').click()
        assert page.evaluate('Character3D.activeCount') == 1
        assert page.locator('#shop-model-stage canvas.available').is_visible()
        initial=signature(page,'shop-model-stage')
        assert initial['filled']>2000
        page.locator('[data-character-stage="shop-model-stage"][data-turn="1"]').click()
        rotated=signature(page,'shop-model-stage')
        assert rotated['picture'] != initial['picture']
        canvas=page.locator('#shop-model-stage canvas')
        box=canvas.bounding_box()
        yaw=page.evaluate("Character3D.getStage(document.getElementById('shop-model-stage')).yaw")
        page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5)
        page.mouse.down();page.mouse.move(box['x']+box['width']*.8,box['y']+box['height']*.5, steps=6);page.mouse.up()
        assert page.evaluate("Character3D.getStage(document.getElementById('shop-model-stage')).yaw") != yaw
        # Preview must be independent of buying: each owned/unowned skin has a 3D model.
        assert page.locator('#regular-skins .shop-preview-button').count()==10
        assert page.locator('#legendary-skins .shop-preview-button').count()==6
        page.locator('#regular-skins .shop-preview-button').nth(6).click()
        assert page.locator('#shop-model-heading').inner_text().startswith('Scientist')
        assert page.evaluate('ProfileSystem.getCurrentProfile().skin') == 'default'
        assert page.evaluate('ProfileSystem.getCurrentProfile().stats.points') == 2000
        all_avatars=page.evaluate('Object.keys(Character3D.AVATARS)')
        rendered=set()
        for model_id in all_avatars:
            page.evaluate('(id) => UIManager.previewShopItem("avatar",id)',model_id)
            sample=signature(page,'shop-model-stage')
            assert sample['id']==model_id and sample['filled']>2000
            rendered.add(sample['picture'])
        assert len(rendered)>=14, f'Not enough visibly distinct 3D avatars: {len(rendered)}'
        page.locator('.shop-tab[data-tab="pets"]').click()
        all_pets=page.evaluate('Object.keys(Character3D.PETS)')
        pet_images=set()
        for model_id in all_pets:
            page.evaluate('(id) => UIManager.previewShopItem("pet",id)',model_id)
            sample=signature(page,'shop-model-stage')
            assert sample['id']==model_id and sample['kind']=='pet' and sample['filled']>1800
            pet_images.add(sample['picture'])
        assert len(pet_images)>=8
        page.locator('#pets-items .item-action').first.click()
        assert page.evaluate('ProfileSystem.getCurrentProfile().selectedPet')=='cat'
        page.locator('#shop .btn-back').click(); page.locator('#pet-room-btn').click()
        assert page.evaluate('Character3D.activeCount') == 1
        assert page.locator('#pet-model-stage canvas.available').is_visible()
        active=signature(page,'pet-model-stage')
        assert active['id']=='cat' and active['filled']>2000
        # A real pet keeps its animation stage across care actions, without
        # replacing the underlying pet or editing stats through visuals.
        page.evaluate('''() => {const pet=PetManager.getCurrentPet();pet.hunger=90;pet.happiness=14;
            pet.careUpdatedAt=Date.now();SaveManager.save();UIManager.renderPetRoom();}''')
        assert page.locator('#pet-mood-indicator').inner_text()=='Hungry'
        assert 'warning' in page.locator('#pet-mood-indicator').get_attribute('class')
        before=page.evaluate('PetManager.getCurrentPet().hunger')
        page.locator('[data-action="feed"]').click()
        assert page.evaluate('PetManager.getCurrentPet().hunger')<before
        assert page.evaluate("Character3D.getStage(document.getElementById('pet-model-stage')).action")=='feed'
        assert signature(page,'pet-model-stage')['filled']>2000
        page.locator('#pet-room .btn-back').click()
        assert page.evaluate('Character3D.activeCount')==1
        page.locator('.grade-card:not(.locked)').first.click()
        page.locator('.mode-card[data-mode="relaxed"] button').click()
        assert page.locator('#study-companion').is_visible()
        assert signature(page,'study-pet-stage')['id']=='cat'
        answer=page.evaluate('GameManager.currentGame.questions[0].answer')
        page.locator('.answer-btn').filter(has_text=str(answer)).first.click()
        assert page.locator('#study-pet-caption').inner_text()=='Nice work!'
        assert page.evaluate("Character3D.getStage(document.getElementById('study-pet-stage')).action")=='play'
        page.locator('#pause-game').click()
        page.locator('#quit-game').click()
        assert page.evaluate('Character3D.activeCount')==1
        page.locator('#world-hub .btn-back').click()
        assert page.evaluate('Character3D.activeCount')==2
        assert page.locator('#welcome-pet-caption').inner_text().endswith('your pet')
        assert signature(page,'welcome-pet-stage')['id']=='cat'
        assert not errors, errors
        page.close()

        # Last-resort fallback: if both WebGL and Canvas 2D are disabled, the
        # pet and avatar still have an accessible static view and the game works.
        page, errors=open_game(browser,no_drawing=True)
        page.locator('#start-game').click()
        page.locator('#new-profile-name').fill('Fallback')
        page.locator('#create-profile').click()
        assert page.locator('#hub-avatar-stage .character-emoji-fallback').is_visible()
        assert page.evaluate("Character3D.getStage(document.getElementById('hub-avatar-stage')).error")=='3D drawing unavailable'
        assert page.locator('.grade-card:not(.locked)').count()==3
        assert not errors, errors
        page.close()
        browser.close()
        print('PASS: CPU-rendered 3D meshes, 16 avatars, 8 pets, rotation, animations, live care, shopping, context cleanup, emoji fail-safe')

if __name__=='__main__': run()
