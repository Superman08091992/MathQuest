"""Grade-specific, browser-operated academic checkpoint regression; actual source and web build."""
from pathlib import Path
import os,re
from playwright.sync_api import sync_playwright
from browser_college import ROOT, make_html


def main():
    with sync_playwright() as p:
        kw={'headless':True}
        if os.environ.get('CHROMIUM_BINARY'):kw['executable_path']=os.environ['CHROMIUM_BINARY']
        browser=p.chromium.launch(**kw)
        try:
            for home,width in ((ROOT,390),(ROOT/'www',1000)):
                page=browser.new_page(viewport={'width':width,'height':850})
                errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                page.evaluate("""() => {const data=new Map();Object.defineProperty(window,'localStorage',
                    {configurable:true,value:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}})}""")
                page.set_content(make_html(home),wait_until='load')
                page.add_style_tag(content='*{transition:none!important;animation:none!important}')
                page.locator('#start-game').click()
                page.locator('#new-profile-name').fill('Practice student')
                page.locator('#create-profile').click()
                page.evaluate('ProfileSystem.getCurrentProfile().stats.level=11;SaveManager.save();UIManager.renderWorldHub()')
                assert '0/13 cumulative grade checkpoints' in page.locator('#academic-pathway-summary').inner_text()
                assert page.locator('.grade-academic-status').count()==13
                page.locator('.grade-card').nth(4).click()
                assert page.locator('#grade-competencies li').count()==3
                assert 'community' in page.locator('#grade-project-prompt').inner_text().lower()
                project_text='I want to study a local creek. My first source is a public monitoring report, while my second is an independent field observation. I would measure temperature on several days with the same instrument and location, then compare the results and discuss weather as a confounding factor.'
                page.locator('#grade-project-response').fill(project_text)
                page.locator('#grade-project-save').click()
                assert 'Project draft saved' in page.locator('#grade-project-message').inner_text()
                assert 'not independently evaluated' in page.locator('#grade-project-status').inner_text()
                assert page.evaluate('ReadinessLab.pathwayReport(ProfileSystem.getCurrentProfile()).submitted')==1
                assert project_text in page.evaluate('SaveManager.export()')
                assert 'Not assessed' in page.locator('#grade-checkpoint-status').inner_text()
                page.locator('#start-grade-checkpoint').click()
                assert page.locator('.screen.active').get_attribute('id')=='gameplay'
                assert page.evaluate('GameManager.currentGame.mode')=='checkpoint'
                total=page.evaluate('GameManager.currentGame.questions.length')
                assert 20<=total<=60,total
                assert page.locator('#hint-btn').is_hidden()
                assert page.locator('.timer-container').is_hidden()
                assert len(page.evaluate('Array.from(new Set(GameManager.currentGame.questions.map(q=>q.category)))'))>=6
                assert page.evaluate('GameManager.currentGame.questions.filter(q=>q.grade<4).length')==8
                for i in range(total):
                    answer=page.evaluate('GameManager.currentGame.questions[GameManager.currentGame.currentQuestionIndex].answer')
                    pick=page.locator('#answers-grid .answer-btn').filter(has_text=re.compile('^'+re.escape(str(answer))+'$'))
                    assert pick.count()==1, (i,answer,page.locator('#answers-grid .answer-btn').all_inner_texts())
                    pick.click()
                assert page.locator('.screen.active').get_attribute('id')=='results'
                assert page.locator('#correct-count').inner_text()==str(total)
                assert page.locator('#xp-earned').inner_text()=='+0'
                assert page.locator('#points-earned').inner_text()=='+0'
                assert page.locator('.review-item').count()==total
                assert page.evaluate('ProfileSystem.getCurrentProfile().stats.gamesPlayed')==0
                assert page.evaluate('ProfileSystem.getCurrentProfile().readiness.checkpoints.length')==1
                page.locator('#back-to-hub').click()
                assert '0/13 cumulative grade checkpoints' in page.locator('#academic-pathway-summary').inner_text()
                page.locator('.grade-card').nth(4).click()
                assert 'repeat after 7 days' in page.locator('#grade-checkpoint-status').inner_text()
                page.locator('#mode-selection .btn-back').click()
                page.locator('#college-lab-btn').click()
                assert '0/13 grade checkpoints' in page.locator('#college-route').inner_text()
                assert errors==[],errors
                print(f'PASS: {home.name}, {width}px: {total}-question Grade 4 checkpoint, all correct, no rewards, one pass recorded',flush=True)
                page.close()
        finally:browser.close()

if __name__=='__main__':main()
