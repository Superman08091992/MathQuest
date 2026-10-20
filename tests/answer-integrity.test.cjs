/** Reproduce the exact 12 -> 11 case and reject stale touchscreen taps. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const names = ['utils','question-templates','question-templates-advanced',
 'question-templates-extended-fixed','college-curriculum','college-procedural',
 'question-catalogue','math-engine','readiness-lab','save-manager','audio',
 'profile-system','progression-system','reward-system','shop-system','pet-manager','game-manager'];
function setup(){
 let now=Date.now();
 const data = new Map();
 const s = {console, Math, Date:class extends Date { static now(){return now;}}, window:null,
   alert(){},confirm:()=>true,AudioContext:class{},
   localStorage:{getItem(k){return data.get(k)||null},setItem(k,v){data.set(k,v)},removeItem(k){data.delete(k)}},
   setInterval(){return 1},clearInterval(){},setTimeout(){return 1},clearTimeout(){}};
 s.window=s;s.UIManager={updateTimerUI(){},submitAnswer(answer,id){return s.GameManager.submitAnswer(answer,id)}};
 vm.createContext(s);
 for(const name of names)vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),s,{filename:name+'.js'});
 s.SaveManager.init();s.ProfileSystem.init();s.ProgressionSystem.init();s.RewardSystem.init();
 s.ProfileSystem.createProfile('Answer validator');
 s.MathEngine.init(0,'arithmetic');
 return {s,advance(n){now+=n}};
}
function beforeTwelve(s) {
 const template = s.QuestionCatalogue.getQuestionsForGrade(0).find(t=>t.type==='number_before');
 assert.ok(template);
 const old=s.Utils.randomInt;s.Utils.randomInt=()=>12;
 try {return s.MathEngine.fromTemplate(template);} finally {s.Utils.randomInt=old;}
}
test('Just before 12 is always 11, both in generator and actual game grading',()=>{
 const {s}=setup();
 for(let k=0;k<120;k++) {
   const question=beforeTwelve(s);
   assert.equal(question.text,'What number comes just before 12?');
   assert.equal(question.answer,11);
   assert.equal(question.answers.filter(a=>s.MathEngine.validateAnswer(question,a)).length,1);
   assert.ok(question.answers.some(a=>String(a)==='11'));
   assert.equal(s.MathEngine.validateAnswer(question,'11'),true);
   assert.equal(s.MathEngine.validateAnswer(question,12),false);
 }
 s.GameManager.initGame(0,'relaxed',2);
 const question=beforeTwelve(s);
 s.GameManager.currentGame.questions[0]=question;
 const response=s.GameManager.submitAnswer('11',question.id);
 assert.equal(response.accepted,true);
 assert.equal(response.correct,true);
 assert.equal(response.expected,11);
 assert.equal(s.GameManager.currentGame.stats.correct,1);
 assert.equal(s.GameManager.currentGame.results.answers[0].selected,'11');
 assert.equal(s.GameManager.currentGame.results.answers[0].expected,'11');
});
test('A stale click cannot grade the next question or alter player score',()=>{
 const {s}=setup();
 s.GameManager.initGame(0,'relaxed',2);
 const first=beforeTwelve(s);s.GameManager.currentGame.questions[0]=first;
 const second={...beforeTwelve(s),id:'new-question',answer:12,answers:[12,11,10,13]};
 s.GameManager.currentGame.questions[1]=second;
 assert.equal(s.GameManager.submitAnswer(11,first.id).correct,true);
 const before=JSON.stringify(s.GameManager.currentGame.stats);
 assert.equal(s.GameManager.submitAnswer(11,first.id).accepted,false);
 assert.equal(JSON.stringify(s.GameManager.currentGame.stats),before);
 assert.equal(s.GameManager.currentGame.results.answers.length,1);
 assert.equal(s.GameManager.submitAnswer(12,second.id).correct,true);
});
test('After deadline, even a correct tap is labeled expired rather than mathematically wrong',()=>{
 const {s,advance}=setup();
 s.GameManager.initGame(0,'timed',2);
 const question=beforeTwelve(s);s.GameManager.currentGame.questions[0]=question;
 s.GameManager.timeRemaining=1;s.GameManager.startTimer();advance(1001);
 const response=s.GameManager.submitAnswer(11,question.id);
 assert.equal(response.accepted,true);
 assert.equal(response.correct,false);
 assert.equal(response.timedOut,true);
 assert.equal(response.expected,11);
 assert.equal(s.GameManager.currentGame.results.answers[0].selected,'(Time expired)');
 assert.equal(s.GameManager.currentGame.results.answers[0].attempted,'11');
 assert.equal(s.GameManager.currentGame.results.answers[0].timedOut,true);
});
