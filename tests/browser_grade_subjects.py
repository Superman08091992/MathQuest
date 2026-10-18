"""Run actual file-URL (not inline/injected) Grade 4 category & topic gameplay tests.
Usage: CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_grade_subjects.py
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {'arithmetic': 9, 'geometry': 1, 'reading': 16,
            'science': 4, 'history': 1, 'astronomy': 2}


def run():
    with sync_playwright() as p:
        kwargs = {'headless': True}
        if os.environ.get('CHROMIUM_BINARY'):
            kwargs['executable_path'] = os.environ['CHROMIUM_BINARY']
        browser = p.chromium.launch(**kwargs)
        try:
            for path in [ROOT / 'index.html', ROOT / 'www/index.html']:
                for width in ([390] if path.parent == ROOT else [1000]):
                    ctx = browser.new_context(viewport={'width': width, 'height': 844})
                    page = ctx.new_page()
                    page.set_default_timeout(3500)
                    errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    # Chromium navigation to file/loopback URLs is policy-blocked in
                    # this sandbox. Inline the *actual* source/build assets instead.
                    home = path.parent
                    html = path.read_text()
                    html = re.sub(r'<script src="js/[^"]+"\s*></script>', '', html)
                    html = re.sub(r'<link rel="stylesheet" href="css/[^"]+">', '', html)
                    css = (home/'css/style.css').read_text() + (home/'css/icons.css').read_text()
                    html = html.replace('</head>', '<style>' + css + '</style></head>')
                    scripts = ['utils', 'question-templates', 'question-templates-advanced',
                               'question-templates-extended-fixed', 'college-curriculum', 'college-procedural', 'question-catalogue',
                               'math-engine', 'readiness-lab', 'save-manager', 'audio', 'profile-system',
                               'progression-system', 'reward-system', 'shop-system',
                               'pet-manager', 'game-manager', 'ui-manager', 'main']
                    html = html.replace('</body>', '\n'.join('<script>' +
                        (home/'js'/f'{name}.js').read_text() + '</script>' for name in scripts) + '</body>')
                    page.evaluate("""() => {
                      const data = new Map();
                      Object.defineProperty(window,'localStorage',{configurable:true, value:{
                        getItem:k=>data.get(k)??null,
                        setItem:(k,v)=>data.set(k,String(v)),
                        removeItem:k=>data.delete(k),clear:()=>data.clear()
                      }});
                    }""")
                    page.set_content(html, wait_until='load')
                    page.add_style_tag(content='*{animation:none!important;transition:none!important}')
                    page.wait_for_function("typeof UIManager !== 'undefined' && typeof QuestionCatalogue !== 'undefined'")
                    assert page.locator('.version-info').inner_text().startswith('Version 3.2.0')
                    assert page.locator('#app-error').is_hidden()
                    assert page.evaluate('QuestionCatalogue.getQuestionsForGrade(4).length') >= 70
                    page.locator('#start-game').click()
                    page.locator('#new-profile-name').fill('Grades Test')
                    page.locator('#create-profile').click()
                    page.evaluate('ProfileSystem.getCurrentProfile().stats.level = 11; SaveManager.save(); UIManager.renderWorldHub()')
                    # Test all thirteen grade selectors against the real catalogue.
                    for grade in (range(13) if path.parent == ROOT else [4]):
                        page.locator('.grade-card').nth(grade).click()
                        assert page.locator('#grade-title').inner_text().startswith('Grade '+str(grade)) if grade else page.locator('#grade-title').inner_text().startswith('Kindergarten')
                        assert page.evaluate('MathEngine.currentCategory') == 'all', 'Old grade topic filter persisted'
                        available = page.evaluate('(grade) => [...new Set(QuestionCatalogue.getQuestionsForGrade(grade).map(t=>t.category))].sort()', grade)
                        visible = page.locator('.category-btn:not([hidden]):not([data-category="all"])').evaluate_all('(buttons) => buttons.map(b=>b.dataset.category).sort()')
                        assert available == visible, f'{path.name} viewport={width} Grade{grade} expected {available} rendered {visible}'
                        assert page.locator('.btn-select-mode').first.is_enabled()
                        if grade == 4:
                            assert len(visible) >= 13
                            assert 'subjects available' in page.locator('#available-subjects').inner_text()
                            for subject, count in EXPECTED.items():
                                btn = page.locator(f'.category-btn[data-category="{subject}"]')
                                assert btn.is_visible() and btn.is_enabled(), f'Grade 4 {subject}'
                                assert int(btn.locator('.topic-count').inner_text()) >= count
                            first_topic = page.locator('.category-filter').bounding_box()
                            assert first_topic['y'] < 500, 'Topics hidden below the game-mode cards'
                            if width == 390:
                                page.screenshot(path=str(ROOT.parent / f'grade4_v241_{path.parent.name}_{width}.png'), full_page=True)
                            for subject, count in (EXPECTED.items() if path.parent == ROOT else [('science',4), ('history',1)]):
                                page.locator(f'.category-btn[data-category="{subject}"]').click()
                                assert page.locator(f'.category-btn[data-category="{subject}"]').get_attribute('aria-pressed') == 'true'
                                assert int(page.locator(f'.category-btn[data-category="{subject}"] .topic-count').inner_text()) >= count
                                page.locator('.mode-card[data-mode="relaxed"] button').click()
                                result = page.evaluate('''() => ({grade:GameManager.currentGame.grade,
                                  category: GameManager.currentGame.category,
                                  questions: GameManager.currentGame.questions.map(q=>q.category)})''')
                                assert result['grade'] == 4 and result['category'] == subject
                                assert result['questions'] and all(x == subject for x in result['questions'])
                                if subject in ('science', 'history', 'astronomy', 'reading'):
                                    assert 1<=len(result['questions'])<=10, subject
                                page.locator('#pause-game').click()
                                page.locator('#quit-game').click()
                                page.locator('.grade-card').nth(4).click()
                        page.locator('#mode-selection .btn-back').click()
                    assert not errors, f'Javascript errors: {errors}'
                    print(f'PASS: {path.relative_to(ROOT)} | {width}px | Grade 4 expanded visible subjects and matching quizzes',flush=True)
                    ctx.close()
        finally:
            browser.close()


if __name__ == '__main__':
    run()
