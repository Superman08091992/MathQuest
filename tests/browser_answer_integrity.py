"""Exercise the reported 'just before 12' error in the real Math Quest UI.

Run: CHROMIUM_BINARY=/usr/bin/chromium python tests/browser_answer_integrity.py
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_college import make_html

ROOT = Path(__file__).resolve().parents[1]


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=os.environ.get('CHROMIUM_BINARY') or None)
        try:
            for directory in (ROOT, ROOT / 'www'):
                page = browser.new_page(viewport={'width': 390, 'height': 844})
                errors = []
                page.on('pageerror', lambda err: errors.append(str(err)))
                page.evaluate('''() => {
                   const data = new Map();
                   Object.defineProperty(window, 'localStorage', {configurable: true, value: {
                       getItem: k => data.get(k) ?? null,
                       setItem: (k, v) => data.set(k, String(v)),
                       removeItem: k => data.delete(k), clear: () => data.clear()
                   }});
                }''')
                page.set_content(make_html(directory), wait_until='load')
                page.locator('#start-game').click()
                page.locator('#new-profile-name').fill('Answer integrity')
                page.locator('#create-profile').click()
                page.locator('.grade-card:not(.locked)').first.click()
                page.locator('.mode-card[data-mode="relaxed"] button').click()
                def set_question():
                    return page.evaluate('''() => {
                        const bank=QuestionCatalogue.getQuestionsForGrade(0);
                        const template=bank.find(q=>q.type==='number_before');
                        const old=Utils.randomInt;
                        Utils.randomInt=()=>12;
                        let q;
                        try {q=MathEngine.fromTemplate(template);} finally {Utils.randomInt=old;}
                        GameManager.currentGame.questions[0]=q;
                        UIManager.renderQuestion();
                        return {text:q.text, answer:q.answer, id:q.id};
                    }''')
                question = set_question()
                assert question['text'] == 'What number comes just before 12?', question
                assert question['answer'] == 11, question
                assert page.locator('#question-text').inner_text() == question['text']
                page.evaluate('''() => {
                    window.previousButton=Array.from(document.querySelectorAll('#answers-grid .answer-btn'))
                        .find(el=>el.textContent.trim()==='11');
                }''')
                page.locator('#answers-grid .answer-btn').filter(has_text='11').click()
                assert page.locator('#answer-feedback').is_visible()
                assert page.locator('#answer-feedback-title').inner_text() == 'Correct! 11'
                assert page.evaluate('GameManager.currentGame.results.answers[0].correct') is True
                assert page.evaluate('GameManager.currentGame.results.answers[0].selected') == '11'
                assert page.locator('#answer-continue').is_visible()
                assert page.locator('#answers-grid .answer-btn:not(:disabled)').count() == 0
                page.locator('#answer-continue').click()
                assert page.locator('#answer-feedback').is_hidden()
                assert page.evaluate('GameManager.currentGame.currentQuestionIndex') == 1
                # An event still aimed at a stale detached button must not answer the new question.
                page.evaluate('window.previousButton.click()')
                assert page.evaluate('GameManager.currentGame.results.answers.length') == 1
                assert page.evaluate('GameManager.currentGame.currentQuestionIndex') == 1
                page.locator('#pause-game').click()
                page.locator('#quit-game').click()
                page.locator('.grade-card:not(.locked)').first.click()
                page.locator('.mode-card[data-mode="timed"] button').click()
                question = set_question()
                # In one browser task, set an already-expired deadline and dispatch
                # the click before the periodic timer callback can consume it.
                page.evaluate('''() => {
                    GameManager.timerDeadline=Date.now()-1000;
                    Array.from(document.querySelectorAll('#answers-grid .answer-btn'))
                       .find(el=>el.textContent.trim()==='11').click();
                }''')
                assert page.locator('#answer-feedback').is_visible()
                assert 'Time expired' in page.locator('#answer-feedback-title').inner_text()
                assert '11' in page.locator('#answer-feedback-title').inner_text()
                result = page.evaluate('GameManager.currentGame.results.answers[0]')
                assert result['timedOut'] is True and result['attempted'] == '11', result
                assert result['selected'] == '(Time expired)', result
                assert page.evaluate('GameManager.timer === null && GameManager.timerDeadline === 0')
                page.locator('#answer-continue').click()
                assert page.evaluate('GameManager.currentGame.currentQuestionIndex') == 1
                assert page.evaluate('GameManager.timerDeadline > Date.now()')
                assert errors == [], errors
                print('PASS:', directory.name, 'right answer 11, explicit feedback, stale tap rejected, timeout distinguished')
                page.close()
        finally:
            browser.close()


if __name__ == '__main__':
    run()
