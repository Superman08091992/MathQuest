"""Run real Chromium UI tests for local College Readiness Lab and its save paths.

Runs via inlined exact source/build assets because container navigation policy blocks localhost.
Not a hosted/PWA install test.
"""
from pathlib import Path
import os, re
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
SCRIPTS=['utils','question-templates','question-templates-advanced','question-templates-extended-fixed',
         'college-curriculum','college-procedural','question-catalogue','math-engine','readiness-lab',
         'save-manager','audio','profile-system','progression-system','reward-system','shop-system',
         'pet-manager','game-manager','ui-manager','main']

def make_html(home):
    html=(home/'index.html').read_text()
    html=re.sub(r'<script src="js/[^"]+"\s*></script>','',html)
    html=re.sub(r'<link rel="stylesheet" href="css/[^"]+">','',html)
    css=(home/'css/style.css').read_text()+(home/'css/icons.css').read_text()
    html=html.replace('</head>','<style>'+css+'</style></head>')
    return html.replace('</body>','\n'.join('<script>'+(home/'js'/f'{name}.js').read_text()+'</script>' for name in SCRIPTS)+'</body>')

def main():
    with sync_playwright() as p:
        kw={'headless': True}
        if os.environ.get('CHROMIUM_BINARY'): kw['executable_path']=os.environ['CHROMIUM_BINARY']
        browser=p.chromium.launch(**kw)
        try:
            for home,width in [(ROOT,390),(ROOT/'www',1000)]:
                page=browser.new_page(viewport={'width':width,'height':850})
                errors=[]
                page.on('pageerror',lambda e: errors.append(str(e)))
                page.evaluate("""() => {
                  const data = new Map();
                  Object.defineProperty(window,'localStorage',{configurable:true,value:{
                    getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),
                    removeItem:k=>data.delete(k),clear:()=>data.clear()
                  }});
                }""")
                page.set_content(make_html(home),wait_until='load')
                page.add_style_tag(content='*{animation:none!important;transition:none!important}')
                assert page.locator('#app-error').is_hidden(),page.locator('#app-error').inner_text()
                page.locator('#start-game').click()
                page.locator('#new-profile-name').fill('Academic Learner')
                page.locator('#create-profile').click()
                page.locator('#college-lab-btn').click()
                assert page.locator('.screen.active').get_attribute('id')=='college-lab'
                assert 'No diagnostic completed' in page.locator('#college-latest-diagnostic').inner_text()
                page.locator('#college-track').select_option('stem')
                assert page.evaluate('ProfileSystem.getCurrentProfile().readiness.track')=='stem'
                assert 'Calculus' in page.locator('#college-track-plan').inner_text()
                page.locator('#college-start-diagnostic').click()
                assert page.locator('.screen.active').get_attribute('id')=='gameplay'
                assert page.evaluate('GameManager.currentGame.mode')=='diagnostic'
                assert page.evaluate('GameManager.currentGame.questions.length')==40
                assert page.locator('#hint-btn').is_hidden()
                assert page.locator('.timer-container').is_hidden()
                domain_counts=page.evaluate('''() => Object.fromEntries(Object.entries(ReadinessLab.DOMAINS).map(([d,cats])=>
                    [d,GameManager.currentGame.questions.filter(q=>cats.includes(q.category)).length]))''')
                assert list(domain_counts.values())==[10,10,10,10],domain_counts
                # Solve 35 and intentionally miss five, using the real on-screen answer controls.
                for k in range(40):
                    answer=page.evaluate('GameManager.currentGame.questions[GameManager.currentGame.currentQuestionIndex].answer')
                    buttons=page.locator('#answers-grid .answer-btn')
                    pick=buttons.filter(has_text=re.compile('^'+re.escape(str(answer))+'$'))
                    assert pick.count()==1,f'{k}, {answer}: {buttons.all_inner_texts()}'
                    if k<35: pick.click()
                    else: buttons.filter(has_not_text=re.compile('^'+re.escape(str(answer))+'$')).first.click()
                assert page.locator('.screen.active').get_attribute('id')=='results'
                assert page.locator('#correct-count').inner_text()=='35'
                assert page.locator('#incorrect-count').inner_text()=='5'
                assert page.locator('#xp-earned').inner_text()=='+0'
                assert page.locator('#points-earned').inner_text()=='+0'
                assert page.locator('.review-item').count()==40
                assert page.evaluate('ProfileSystem.getCurrentProfile().stats.gamesPlayed')==0
                assert page.evaluate('ProfileSystem.getCurrentProfile().readiness.diagnosticResults.length')==1
                page.locator('#back-to-hub').click()
                page.locator('#college-lab-btn').click()
                assert '35/40' in page.locator('#college-latest-diagnostic').inner_text()
                assert page.locator('.college-recommendation').count()>=7
                page.locator('#college-assignment').select_option('quant_research')
                assert 'data' in page.locator('#college-assignment-prompt').inner_text()
                original='I will investigate how study time relates to completed tasks. Data sources, confounders and reproducible code will be documented.'
                page.locator('#college-writing').fill(original)
                page.locator('#college-feedback').fill('Review pending; do not claim independent verification.')
                page.locator('#college-save-portfolio').click()
                assert page.locator('.portfolio-item').count()==1
                assert original in page.evaluate('SaveManager.export()')
                assert 'Original work saved' in page.locator('#college-portfolio-message').inner_text()
                page.locator('.college-recommendation button').first.click()
                assert page.locator('.screen.active').get_attribute('id')=='mode-selection'
                assert page.locator('.category-btn.active').count()==1
                assert page.evaluate('MathEngine.currentGrade')>=9
                page.locator('.mode-card[data-mode="relaxed"] button').click()
                assert page.evaluate('GameManager.currentGame.mode')=='relaxed'
                assert page.evaluate('GameManager.currentGame.questions.length')>0
                assert errors==[],errors
                if width==390:
                    page.locator('#pause-game').click();page.locator('#quit-game').click();page.locator('#college-lab-btn').click()
                    page.screenshot(path=str(ROOT.parent/'mathquest-college-v3-mobile.png'),full_page=True)
                print(f'PASS: {home.name} {width}px — readiness diagnostic, no rewards, mastery record, portfolio, recommended practice',flush=True)
                page.close()
        finally:
            browser.close()

if __name__=='__main__':main()
