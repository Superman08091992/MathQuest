"""Chromium end-to-end K–12 grade goals and applied assignments (real DOM and save state).
Source and built assets are inlined because loopback navigation is sandbox restricted.
"""
import os
from playwright.sync_api import sync_playwright
from browser_college import ROOT, make_html


def run():
    with sync_playwright() as playwright:
        kwargs={'headless': True}
        if os.environ.get('CHROMIUM_BINARY'):
            kwargs['executable_path']=os.environ['CHROMIUM_BINARY']
        browser=playwright.chromium.launch(**kwargs)
        try:
            for home,width in [(ROOT,390),(ROOT/'www',1000)]:
                page=browser.new_page(viewport={'width':width,'height':900})
                errors=[]
                page.on('pageerror',lambda err:errors.append(str(err)))
                page.evaluate('''() => {let data=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{
                   getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()
                }})}''')
                page.set_content(make_html(home),wait_until='load')
                page.add_style_tag(content='*{transition:none!important;animation:none!important}')
                page.locator('#start-game').click()
                page.locator('#new-profile-name').fill('Primary learner')
                page.locator('#create-profile').click()
                primary_id=page.evaluate('ProfileSystem.getCurrentProfile().id')
                assert '0/13 cumulative grade checkpoints; 0/13 applied assignments' in page.locator('#academic-pathway-summary').inner_text()
                page.locator('.grade-card').nth(1).click()
                assert page.locator('#grade-competencies li').count()==3
                assert 'Measure and describe' in page.locator('#grade-project-title').inner_text()
                page.locator('#grade-project-response').fill('Short')
                page.locator('#grade-project-save').click()
                assert 'at least 40' in page.locator('#grade-project-message').inner_text()
                text='I predicted that the book was the longest object and compared it with the spoon and pencil. I measured carefully and found the pencil was shorter. I repeated the test.'
                page.locator('#grade-project-response').fill(text)
                page.locator('#grade-project-save').click()
                assert 'Project draft saved' in page.locator('#grade-project-message').inner_text()
                assert page.evaluate('ReadinessLab.gradeProjectStatus(ProfileSystem.getCurrentProfile(),1).submitted')
                page.locator('#mode-selection .btn-back').click()
                assert '1/13 applied assignments' in page.locator('#academic-pathway-summary').inner_text()
                page.evaluate("ProfileSystem.createProfile('Other learner');UIManager.showScreen('world-hub')")
                page.locator('.grade-card').nth(1).click()
                assert page.locator('#grade-project-response').input_value()==''
                page.locator('#mode-selection .btn-back').click()
                page.evaluate('(id)=>{ProfileSystem.selectProfile(id);UIManager.showScreen(\'world-hub\')}',primary_id)
                page.locator('.grade-card').nth(1).click()
                assert page.locator('#grade-project-response').input_value()==text
                assert 'Draft submitted' in page.locator('#grade-project-status').inner_text()
                page.locator('#mode-selection .btn-back').click()
                page.evaluate('ProfileSystem.getCurrentProfile().stats.level=12; SaveManager.save(); UIManager.renderWorldHub()')
                page.locator('.grade-card').nth(12).click()
                assert 'independent capstone' in page.locator('#grade-project-title').inner_text().lower()
                assert '800' in page.locator('#grade-project-status').inner_text()
                assert '1/13 applied assignments' in page.evaluate('ReadinessLab.pathwayReport(ProfileSystem.getCurrentProfile()).label')
                assert not errors,errors
                print(f'PASS: {home.name} {width}px K–12: goals, grade writing, validation, cross-profile isolation, restore, Grade 12 capstone',flush=True)
                page.close()
        finally: browser.close()

if __name__=='__main__':run()
