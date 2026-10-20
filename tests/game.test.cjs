const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {test}=require('node:test');
const root=path.resolve(__dirname,'..');
const files=['utils','question-templates','question-templates-advanced','question-templates-extended-fixed','college-curriculum','college-procedural','question-catalogue','math-engine','readiness-lab','save-manager','audio','profile-system','progression-system','reward-system','shop-system','pet-manager','game-manager'];
function setup(prior=null){
  const storage=new Map();if(prior)storage.set('mathQuestData',JSON.stringify(prior));
  let timerTick=null;
  let now=Date.now();
  class FakeDate extends Date { static now(){return now;} }
  const sandbox={console,Math,Date:FakeDate,JSON,alert:()=>{},confirm:()=>true,window:null,AudioContext:class{},
      localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,val)=>storage.set(key,String(val)),removeItem:key=>storage.delete(key)},
      setTimeout(fn){ return 1 },clearTimeout(){},setInterval(fn){timerTick=fn;return 1;},clearInterval(){timerTick=null;}};
  sandbox.window=sandbox;
  sandbox.UIManager={updateTimerUI(){}, submitAnswer(answer){const result=sandbox.GameManager.submitAnswer(answer);if(result.isLastQuestion){sandbox.GameManager.endGame();sandbox.GameManager.quit();}}};
  vm.createContext(sandbox);
  for(const file of files) vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),sandbox,{filename:file+'.js'});
  sandbox.SaveManager.init();sandbox.ProfileSystem.init();sandbox.ProgressionSystem.init();sandbox.RewardSystem.init();
  return {g:sandbox,storage,get timerTick(){return timerTick},advance(ms){now+=ms;timerTick?.();}};
}
test('13 grade banks generate exactly one unique correct option', () => {
  const {g}=setup();
  let tested=0;
  for(let grade=0;grade<=12;grade++){
    g.MathEngine.setGrade(grade);
    for(let i=0;i<1000;i++){
      const q=g.MathEngine.generateQuestion();
      assert.equal(q.grade,grade);
      assert.ok(q.answers.length>=3,`Few answers: ${grade} ${q.type}`);
      assert.equal(new Set(q.answers.map(String)).size,q.answers.length,`Repeated options: ${grade} ${q.type}`);
      assert.equal(q.answers.filter(answer=>g.MathEngine.validateAnswer(q,answer)).length,1,`Incorrect options: ${grade} ${q.type}`);
      tested++;
    }
  }
  assert.equal(tested,13000);
});
test('profile creation, correct play, single XP award, achievement and shop inventory', () => {
  const {g}=setup();
  const created=g.ProfileSystem.createProfile('Learner'); assert.equal(created.success,true);
  assert.equal(g.ProfileSystem.isGradeUnlocked(0),true);
  assert.equal(g.ProfileSystem.isGradeUnlocked(2),true);
  assert.equal(g.ProfileSystem.isGradeUnlocked(3),false);
  g.MathEngine.setGrade(0);
  g.GameManager.initGame(0,'relaxed',5);
  g.GameManager.startGame();
  for(const question of g.GameManager.currentGame.questions){
    const answered=g.GameManager.submitAnswer(question.answer);
    assert.equal(answered.correct,true);
  }
  const earned=g.GameManager.endGame();
  const profile=g.ProfileSystem.getCurrentProfile();
  assert.equal(profile.stats.totalQuestions,5);
  assert.equal(profile.stats.correctAnswers,5);
  assert.equal(profile.stats.gamesPlayed,1);
  assert.equal(profile.stats.perfectGames,1);
  assert.equal(profile.stats.xp,earned.stats.xp); // no duplicate XP
  assert.ok(profile.achievements.includes('first_game'));
  assert.deepEqual(Object.values(g.ShopSystem.getShopItems()).map(arr=>arr.length),[10,6,8]);
  assert.ok(g.SaveManager.export().includes('Learner'));
});
test('profile purchases are isolated and old saves are migrated without losing records', () => {
  const older={version:'2.0.0',settings:{sfxVolume:70,musicVolume:50,questionsPerGame:10},currentProfileId:'abc',
    profiles:[{id:'abc',name:'Older',avatar:'👤',stats:{level:2,xp:0,points:500,crystals:0,totalQuestions:0,correctAnswers:0,gamesPlayed:0,bestStreak:0},unlockedGrades:[0],achievements:[],pets:[]}],
    shopInventory:{regularSkins:[{id:'default',name:'Default',emoji:'👤',price:0,owned:true}],legendarySkins:[],pets:[]}};
  const {g}=setup(older);
  assert.equal(g.ProfileSystem.getCurrentProfile().stats.perfectGames,0);
  assert.equal(g.ShopSystem.getShopItems().pets.length,8);
  assert.equal(g.ShopSystem.purchaseItem('cat').success,true);
  assert.equal(g.ShopSystem.getShopItems().pets.find(p=>p.id==='cat').owned,true);
  assert.equal(g.ProfileSystem.getCurrentProfile().pets.length,1);
  g.ProfileSystem.createProfile('Other');
  assert.equal(g.ShopSystem.getShopItems().pets.find(p=>p.id==='cat').owned,false);
  assert.equal(g.ShopSystem.purchaseItem('cat').success,false); // new profile cannot afford it
  g.ProfileSystem.selectProfile('abc');
  assert.equal(g.ShopSystem.getShopItems().pets.find(p=>p.id==='cat').owned,true);
});
test('timed-mode timeout advances to next question and resets countdown', () => {
  const scenario=setup();const {g}=scenario;
  g.ProfileSystem.createProfile('Timer');
  g.MathEngine.setGrade(0);
  g.GameManager.initGame(0,'timed',2);
  g.GameManager.startGame();
  g.GameManager.timeRemaining=1;
  g.GameManager.startTimer();
  assert.equal(typeof scenario.timerTick,'function');
  scenario.advance(1000);
  assert.equal(g.GameManager.currentGame.currentQuestionIndex,1);
  assert.equal(g.GameManager.timeRemaining,30);
  assert.equal(g.GameManager.currentGame.results.answers[0].timedOut,true);
  assert.equal(scenario.timerTick,null);
  // The real UI waits for Continue rather than timing the next question in the background.
  g.GameManager.startTimer();
  assert.equal(typeof scenario.timerTick,'function');
  g.GameManager.timerDeadline -= 29_000; // Simulate elapsed wall time on second question.
  scenario.advance(1000);
  assert.equal(g.GameManager.currentGame,null);
  assert.equal(g.ProfileSystem.getCurrentProfile().stats.gamesPlayed,1);
  assert.equal(g.ProfileSystem.getCurrentProfile().stats.correctAnswers,0);
});
test('web build manifest and offline cache include every required local asset',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons){const actual=path.join(root,icon.src);assert.ok(fs.existsSync(actual),actual);}
  const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
  const paths=[...worker.matchAll(/'\.\/([^']+)'/g)].map(x=>x[1]);
  for(const p of paths) assert.ok(fs.existsSync(path.join(root,p.split('?')[0])),p);
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  // HTML and PWA cache must use the same release token to prevent mixed code.
  const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
  const assets=[...html.matchAll(/(?:src|href)="((?:css|js)\/[^\"]+)"/g)].map(match=>match[1]);
  assert.ok(assets.length>=16);
  for(const asset of assets) assert.ok(asset.endsWith(`?v=${version}`),`Stale URL: ${asset}`);
  for(const asset of assets) assert.ok(worker.includes(`'./${asset}'`),`Not offline-cached: ${asset}`);
  assert.ok(worker.includes(`math-quest-v${version}`));
  assert.ok(html.includes(`Version ${version}`));
  assert.ok(!html.includes('https://fonts.googleapis.com'));
  assert.ok(!html.includes('https://cdnjs.cloudflare.com'));
});

test('fresh profile has no phantom pet; purchase equips real pet and restores state from storage', () => {
  const {g,storage}=setup();
  g.ProfileSystem.createProfile('Pet learner');
  const p=g.ProfileSystem.getCurrentProfile();
  assert.equal(g.PetManager.getCurrentPet(),null);
  assert.equal(p.pets.length,0);
  p.stats.points=600;
  assert.equal(g.ShopSystem.purchaseItem('cat').success,true);
  assert.equal(g.PetManager.getCurrentPet().level,1);
  assert.equal(g.ShopSystem.purchaseItem('dog').success,true);
  assert.equal(g.ShopSystem.getShopItems().pets.find(x=>x.id==='dog').equipped,true);
  assert.equal(g.ShopSystem.selectPet('cat'),true);
  g.PetManager.getCurrentPet().level=3;
  g.PetManager.getCurrentPet().xp=37;
  g.SaveManager.save();
  const persisted=JSON.parse(storage.get('mathQuestData'));
  const restored=setup(persisted).g;
  assert.equal(restored.PetManager.getCurrentPet().id,'cat');
  assert.equal(restored.PetManager.getCurrentPet().level,3);
  assert.equal(restored.PetManager.getCurrentPet().xp,37);
});

test('legacy unselected pet is automatically selected and keeps its level and XP', () => {
  const older={version:'2.2.0',currentProfileId:'lost-selection',profiles:[
    {id:'lost-selection',name:'Old pet owner',avatar:'🐺',stats:{level:4,xp:7,points:900,crystals:3,
      totalQuestions:40,correctAnswers:30,gamesPlayed:8,bestStreak:10},ownedItems:['default','fox'],
      pets:[{id:'fox',name:'Fox',emoji:'🦊',level:7,xp:97,happiness:45,hunger:22}],selectedPet:'deleted-pet'}
  ]};
  const {g,storage}=setup(older);
  const pet=g.PetManager.getCurrentPet();
  assert.equal(pet.id,'fox');
  assert.equal(pet.level,7);
  assert.equal(pet.xp,97);
  assert.equal(pet.happiness,45);
  assert.equal(pet.hunger,22);
  assert.equal(g.ProfileSystem.getCurrentProfile().avatar,'🐺');
  assert.equal(JSON.parse(storage.get('mathQuestData')).profiles[0].selectedPet,'fox');
});

test('legacy owned pet without object is reconstructed conservatively; not given imaginary level 3', () => {
  const older={version:'2.2.0',profiles:[{id:'p',name:'Purchase owner',stats:{level:1,points:90},
    ownedItems:['default','cat'],pets:[],selectedPet:'cat'}],currentProfileId:'p'};
  const {g}=setup(older);
  assert.equal(g.PetManager.getCurrentPet().id,'cat');
  assert.equal(g.PetManager.getCurrentPet().level,1);
  assert.equal(g.PetManager.getCurrentPet().adoptedAt,null);
});

test('pet interactions charge correct balance, reject unknown actions and level repeatedly', () => {
  const {g}=setup();g.ProfileSystem.createProfile('Pet owner');
  const profile=g.ProfileSystem.getCurrentProfile();
  profile.stats.points=300;profile.stats.crystals=2;
  g.ShopSystem.purchaseItem('cat');
  const original=profile.stats.points;
  assert.equal(g.PetManager.interact('not-an-action').success,false);
  assert.equal(profile.stats.points,original);
  const before=g.PetManager.getCurrentPet().xp;
  const result=g.PetManager.interact('pet');
  assert.equal(result.success,true);
  assert.equal(g.PetManager.getCurrentPet().xp,before+3);
  assert.equal(profile.stats.points,original-5);
  assert.equal(profile.stats.pointsSpent,205);
  assert.equal(g.PetManager.interact('treat').success,true);
  assert.equal(profile.stats.crystalsSpent,1);
  const animal=g.PetManager.getCurrentPet();
  assert.equal(g.PetManager.addPetXP(animal,500),4);
  assert.equal(animal.level,5);
  assert.ok(animal.xp>=0 && animal.xp<animal.level*50);
});

test('owned skins can be equipped again without being charged twice and profile ownership is isolated', () => {
  const {g}=setup();g.ProfileSystem.createProfile('A');
  const a=g.ProfileSystem.getCurrentProfile();a.stats.points=200;
  assert.equal(g.ShopSystem.purchaseItem('boy_student').success,true);
  assert.equal(a.stats.points,100);
  assert.equal(g.ShopSystem.equipSkin('default'),true);
  assert.equal(g.ShopSystem.equipSkin('boy_student'),true);
  assert.equal(a.stats.points,100);
  assert.equal(g.ShopSystem.purchaseItem('boy_student').success,false);
  g.ProfileSystem.createProfile('B');
  assert.equal(g.ShopSystem.equipSkin('boy_student'),false);
  assert.equal(g.ShopSystem.getShopItems().regularSkins.find(s=>s.id==='boy_student').owned,false);
});

test('save import rejects malformed data without destroying current profile', () => {
  const {g}=setup();g.ProfileSystem.createProfile('Retain this');
  const save=g.SaveManager.export();
  assert.equal(g.SaveManager.import(JSON.stringify({profiles:[{id:'bad',name:'No stats'}]})).success,false);
  assert.equal(g.SaveManager.import(JSON.stringify({profiles:[{id:'dup',name:'A',stats:{}},
    {id:'dup',name:'B',stats:{}}]})).success,false);
  assert.equal(g.ProfileSystem.getCurrentProfile().name,'Retain this');
  assert.equal(g.SaveManager.export().includes('Retain this'),true);
  assert.equal(g.SaveManager.import(save).success,true);
});

test('game rewards and global/topic statistics are recorded exactly once', () => {
  const {g}=setup();g.ProfileSystem.createProfile('Stats');
  g.MathEngine.init(0,'arithmetic');
  assert.equal(g.MathEngine.currentGrade,0);
  g.GameManager.initGame(0,'relaxed',5);
  const questions=g.GameManager.currentGame.questions;
  for(let i=0;i<questions.length;i++) {
    const ans=g.GameManager.submitAnswer(i===0?null:questions[i].answer);
    assert.equal(ans.accepted,true);
  }
  const once=g.GameManager.endGame();
  const twice=g.GameManager.endGame();
  assert.equal(once,twice);
  const p=g.ProfileSystem.getCurrentProfile();
  assert.equal(p.stats.gamesPlayed,1);
  assert.equal(g.SaveManager.data.globalStats.gamesPlayed,1);
  assert.equal(p.categoryStats.arithmetic.totalQuestions,5);
  assert.equal(p.categoryStats.arithmetic.correctAnswers,4);
  assert.equal(p.stats.totalQuestions,5);
  assert.ok(once.achievements.some(a=>a.id==='first_game'));
  assert.equal(g.GameManager.submitAnswer(1).accepted,false);
});

test('paused game rejects answers; timed scoring really uses an enhanced base', () => {
  const {g}=setup();g.ProfileSystem.createProfile('Pause');
  const grade=0;g.MathEngine.setGrade(grade);
  const q=g.MathEngine.generateQuestion();
  assert.ok(g.MathEngine.calculatePoints(q,0,true,0)>g.MathEngine.calculatePoints(q,0,false,0));
  g.GameManager.initGame(grade,'timed',5);g.GameManager.pause();
  assert.equal(g.GameManager.submitAnswer(1).accepted,false);
  g.GameManager.resume();
  assert.equal(g.GameManager.submitAnswer(g.GameManager.currentGame.questions[0].answer).accepted,true);
  g.GameManager.quit();
  assert.equal(g.GameManager.resume(),undefined);
});

test('question category fails visibly if no templates exist rather than quietly ignoring filter', () => {
  const {g}=setup();g.MathEngine.setGrade(0);g.MathEngine.setCategory('physics');
  assert.throws(()=>g.MathEngine.generateQuestion(),/No questions/);
  g.MathEngine.setCategory('all');
  assert.ok(g.MathEngine.generateQuestion());
});

test('grade 7 percent-change arithmetic matches the displayed values',()=>{
  const {g}=setup();
  const template=g.QuestionTemplates.grade7.find(x=>x.type==='percent_change');
  for(let i=0;i<1000;i++){
    const q=template.generate();
    const match=q.text.match(/^(\d+) increased to (\d+\.\d+)\./);
    assert.ok(match,q.text);
    const real=100*(Number(match[2])-Number(match[1]))/Number(match[1]);
    assert.ok(Math.abs(real-q.answer)<1e-8, `${q.text} correct should be ${real}, displayed ${q.answer}`);
  }
});

test('grade 2 sums stay within 100 and all grade 10 trig questions offer four answers',()=>{
  const {g}=setup();
  const add=g.QuestionTemplates.grade2.find(t=>t.type==='addition_within100');
  for(let i=0;i<500;i++) assert.ok(add.generate().answer<=100);
  const trig=g.QuestionTemplates.grade10.find(t=>t.type==='trigonometry_sohcahtoa');
  for(let i=0;i<500;i++) assert.equal(trig.generate().answers.length,4);
});

test('disabled or missing audio hardware never interrupts the game and invalid debits are rejected', () => {
  const {g}=setup();g.ProfileSystem.createProfile('Silent');
  delete g.AudioContext;
  assert.doesNotThrow(()=>g.AudioSystem.playClick());
  g.AudioContext=class {constructor(){throw new Error('Audio device unavailable');}};
  assert.doesNotThrow(()=>g.AudioSystem.playIncorrect());
  const p=g.ProfileSystem.getCurrentProfile();
  p.stats.points=50;
  assert.equal(g.ProfileSystem.deductPoints(-20),false);
  assert.equal(g.ProfileSystem.deductCrystals(-1),false);
  assert.equal(g.ProfileSystem.addXP(-100).leveledUp,false);
  assert.equal(p.stats.points,50);
  assert.equal(p.stats.xp,0);
});

test('wall-clock timer catches delayed background interval ticks and preserves pause time', () => {
  const scenario=setup();const {g}=scenario;g.ProfileSystem.createProfile('Clock');
  g.MathEngine.setGrade(0);g.GameManager.initGame(0,'timed',2);g.GameManager.startTimer();
  scenario.advance(10_000);
  assert.equal(g.GameManager.timeRemaining,20);
  g.GameManager.pause();
  scenario.advance(100_000);
  assert.equal(g.GameManager.timeRemaining,20);
  g.GameManager.resume();
  scenario.advance(21_000);
  assert.equal(g.GameManager.currentGame.currentQuestionIndex,1);
  assert.equal(g.GameManager.timeRemaining,30);
  g.GameManager.quit();
});

test('purchases and pet interactions roll back when persistent save fails',()=>{
  const {g}=setup();g.ProfileSystem.createProfile('Quota');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=500;
  const setter=g.localStorage.setItem;
  g.localStorage.setItem=()=>{throw new Error('Simulated storage quota failure')};
  const purchase=g.ShopSystem.purchaseItem('cat');
  assert.equal(purchase.success,false);
  assert.equal(profile.stats.points,500);
  assert.equal(profile.pets.length,0);
  assert.equal(profile.ownedItems.includes('cat'),false);
  g.localStorage.setItem=setter;
  assert.equal(g.ShopSystem.purchaseItem('cat').success,true);
  const pet=g.PetManager.getCurrentPet();const before=JSON.stringify(pet);
  const balance=profile.stats.points;
  g.localStorage.setItem=()=>{throw new Error('Simulated storage quota failure')};
  assert.equal(g.PetManager.interact('pet').success,false);
  assert.equal(JSON.stringify(pet),before);
  assert.equal(profile.stats.points,balance);
  g.localStorage.setItem=setter;
});

test('incomplete legacy statistics retain known correct-answer history',()=>{
  const old={profiles:[{id:'old',name:'History',stats:{correctAnswers:15,level:2},pets:[]}]};
  const {g}=setup(old);const stats=g.ProfileSystem.getCurrentProfile().stats;
  assert.equal(stats.correctAnswers,15);
  assert.equal(stats.totalQuestions,15); // safest consistent lower bound, not zeroing history
});

test('short fixed-content games never pad repeated questions or award farmable perfect bonuses',()=>{
  const {g,storage}=setup();
  g.ProfileSystem.createProfile('Science learner');
  g.MathEngine.init(0,'civics');
  g.GameManager.initGame(0,'relaxed',20);
  assert.equal(g.GameManager.currentGame.questions.length,1);
  assert.equal(g.GameManager.currentGame.questionsPerGame,1);
  const keys=new Set(g.GameManager.currentGame.questions.map(q=>g.MathEngine.questionKey(q)));
  assert.equal(keys.size,1);
  for(const q of g.GameManager.currentGame.questions)assert.equal(g.GameManager.submitAnswer(q.answer).correct,true);
  const result=g.GameManager.endGame();
  assert.equal(result.isPerfect,true);
  assert.equal(result.stats.crystals,0);
  assert.ok(result.stats.xp<50);
  const p=g.ProfileSystem.getCurrentProfile();
  assert.equal(p.stats.totalQuestions,1);
  assert.equal(p.categoryStats.civics.totalQuestions,1);
  assert.equal(p.recentQuestionKeys.length,1);
  assert.equal(setup(JSON.parse(storage.get('mathQuestData'))).g.ProfileSystem.getCurrentProfile().recentQuestionKeys.length,1);
});

const PET_HOUR = 60 * 60 * 1000;

test('pet hunger and happiness decay by elapsed wall time and persist without player interaction', () => {
  const {g,storage,advance}=setup();
  g.ProfileSystem.createProfile('Offline care');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=500;
  assert.equal(g.ShopSystem.purchaseItem('cat').success,true);
  const adoptedAt=g.PetManager.getCurrentPet().careUpdatedAt;
  advance(12*PET_HOUR);
  assert.equal(g.SaveManager.save(),true);
  const pet=g.PetManager.getCurrentPet();
  assert.equal(pet.hunger,74);
  assert.equal(pet.happiness,65);
  assert.equal(pet.careUpdatedAt,adoptedAt+12*PET_HOUR);
  assert.equal(pet.xp,0);
  g.SaveManager.save(); // Idempotent at the same instant.
  assert.equal(pet.hunger,74);
  assert.equal(pet.happiness,65);
  const persisted=JSON.parse(storage.get('mathQuestData'));
  const loaded=setup(persisted).g.PetManager.getCurrentPet();
  assert.equal(loaded.hunger,74);
  assert.equal(loaded.happiness,65);
  assert.equal(loaded.level,1);
});

test('pet dies only after continuous starvation grace; loss persists, cannot be selected and species can be adopted again', () => {
  const {g,storage,advance}=setup();
  g.ProfileSystem.createProfile('Starvation');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=1000;
  assert.equal(g.ShopSystem.purchaseItem('cat').success,true);
  const pet=g.PetManager.getCurrentPet();pet.level=5;pet.xp=22;
  advance(60*PET_HOUR);
  g.SaveManager.save();
  assert.equal(pet.hunger,100);
  assert.equal(profile.petHistory.length,0);
  assert.match(g.PetManager.getPetStatus(pet).text,/Starving/);
  advance(2*PET_HOUR);
  g.SaveManager.save();
  assert.equal(g.PetManager.getCurrentPet(),null);
  assert.equal(profile.pets.length,0);
  assert.equal(profile.selectedPet,null);
  assert.equal(profile.petHistory.length,1);
  assert.equal(profile.petHistory[0].fate,'died');
  assert.equal(profile.petHistory[0].reason,'starvation');
  assert.equal(profile.petHistory[0].level,5);
  assert.equal(profile.petHistory[0].xp,22);
  assert.equal(g.ShopSystem.selectPet('cat'),false);
  assert.equal(g.PetManager.interact('feed').success,false);
  assert.equal(g.ShopSystem.getShopItems().pets.find(p=>p.id==='cat').owned,false);
  assert.equal(profile.ownedItems.includes('cat'),false);
  const saved=JSON.parse(storage.get('mathQuestData'));
  saved.profiles[0].ownedItems.push('cat'); // Simulate an old stale ownership record.
  const restored=setup(saved).g;
  assert.equal(restored.ProfileSystem.getCurrentProfile().pets.length,0);
  assert.equal(restored.ProfileSystem.getCurrentProfile().petHistory.length,1);
  assert.equal(restored.ShopSystem.getShopItems().pets.find(p=>p.id==='cat').owned,false);
  assert.equal(restored.ShopSystem.purchaseItem('cat').success,true);
  assert.equal(restored.PetManager.getCurrentPet().level,1);
  assert.equal(restored.ProfileSystem.getCurrentProfile().petHistory.length,1);
});

test('regular feeding prevents starvation but prolonged sadness leads to running away', () => {
  const {g,advance}=setup();
  g.ProfileSystem.createProfile('Feed only');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=2500;
  assert.equal(g.ShopSystem.purchaseItem('dog').success,true);
  const adoptedAt=g.PetManager.getCurrentPet().careUpdatedAt;
  for(let i=0;i<11;i++) {
    advance(10*PET_HOUR);
    assert.equal(g.PetManager.interact('feed').success,true);
  }
  assert.equal(profile.pets.length,1);
  assert.equal(g.PetManager.getCurrentPet().happiness,0);
  assert.equal(g.PetManager.getCurrentPet().hunger,50);
  assert.match(g.PetManager.getPetStatus(g.PetManager.getCurrentPet()).text,/run away/);
  advance(3*PET_HOUR);
  g.SaveManager.save();
  assert.equal(profile.pets.length,0);
  assert.equal(profile.petHistory.length,1);
  assert.equal(profile.petHistory[0].fate,'ran_away');
  assert.equal(profile.petHistory[0].reason,'neglect');
  assert.ok(Math.abs(profile.petHistory[0].lostAt - (adoptedAt + 112*PET_HOUR)) < 2);
  assert.equal(profile.petHistory[0].id,'dog');
});

test('feeding a starving pet clears its death clock, and attention clears its runaway clock', () => {
  const {g,advance}=setup();
  g.ProfileSystem.createProfile('Recovery');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=1000;
  g.ShopSystem.purchaseItem('rabbit');
  advance(30*PET_HOUR);g.SaveManager.save();
  const pet=g.PetManager.getCurrentPet();
  assert.equal(pet.hunger,100);
  assert.ok(pet.starvingSince);
  assert.equal(g.PetManager.interact('feed').success,true);
  assert.equal(pet.hunger,80);
  assert.equal(pet.starvingSince,null);
  // At t=61h the pet would have died without care; it is still alive.
  advance(31*PET_HOUR);g.SaveManager.save();
  assert.ok(g.PetManager.getCurrentPet());
  assert.equal(profile.petHistory.length,0);
  // Petting a miserable animal interrupts its separate departure countdown.
  const hourAfter=g.PetManager.getCurrentPet();
  advance(5*PET_HOUR);g.SaveManager.save();
  assert.equal(hourAfter.happiness,0);
  assert.ok(hourAfter.unhappySince);
  assert.equal(g.PetManager.interact('pet').success,true);
  assert.equal(hourAfter.unhappySince,null);
  assert.equal(hourAfter.happiness,10);
});

test('all profiles age independently even while another profile is selected', () => {
  const {g,advance}=setup();
  g.ProfileSystem.createProfile('First');
  const first=g.ProfileSystem.getCurrentProfile();first.stats.points=200;
  g.ShopSystem.purchaseItem('cat');
  g.ProfileSystem.createProfile('Second');
  const second=g.ProfileSystem.getCurrentProfile();
  advance(65*PET_HOUR);
  g.SaveManager.save();
  assert.equal(first.petHistory.length,1);
  assert.equal(first.petHistory[0].fate,'died');
  assert.equal(first.pets.length,0);
  assert.equal(second.pets.length,0);
  assert.equal(second.petHistory.length,0);
  assert.equal(g.ProfileSystem.selectProfile(first.id),true);
  assert.equal(g.PetManager.getCurrentPet(),null);
});

test('legacy pets keep actual levels and start decay on upgrade; backward clocks do not reverse decay', () => {
  const oldDate=Date.now()-2*365*24*PET_HOUR;
  const older={version:'3.1.0',currentProfileId:'p',profiles:[{
    id:'p',name:'Previous player',stats:{points:200},ownedItems:['cat','default'],
    pets:[{id:'cat',name:'Cat',emoji:'🐱',adoptedAt:oldDate,level:7,xp:19,hunger:99,happiness:1}],
    selectedPet:'cat'
  }]};
  const {g,advance}=setup(older);
  const pet=g.PetManager.getCurrentPet();
  assert.equal(pet.level,7);
  assert.equal(pet.xp,19);
  assert.equal(pet.hunger,99);
  assert.equal(pet.happiness,1);
  const initial=pet.careUpdatedAt;
  assert.ok(initial>oldDate);
  advance(2*PET_HOUR);g.SaveManager.save();
  assert.equal(pet.hunger,100);
  assert.ok(pet.happiness>=0);
  const atTwoHours=pet.careUpdatedAt;
  advance(-6*PET_HOUR);g.SaveManager.save();
  assert.equal(pet.careUpdatedAt,atTwoHours);
  assert.equal(pet.hunger,100);
  advance(7*PET_HOUR);g.SaveManager.save();
  assert.equal(pet.careUpdatedAt,initial+3*PET_HOUR);
  assert.equal(g.ProfileSystem.getCurrentProfile().petHistory.length,0);
});

test('pet care cannot be bypassed via arbitrary shop stat updates', () => {
  const {g}=setup();g.ProfileSystem.createProfile('No cheats');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=500;
  g.ShopSystem.purchaseItem('cat');
  assert.equal(g.ShopSystem.updatePet('cat',{hunger:0,happiness:100}),false);
  assert.equal(g.PetManager.getCurrentPet().hunger,50);
  assert.equal(g.ShopSystem.updatePet('cat',{name:'Mittens'}),true);
  assert.equal(g.PetManager.getCurrentPet().name,'Mittens');
});

test('large offline jumps and hourly updates produce the same chronological death instant', () => {
  const {g}=setup();
  const start=Date.now();
  const pet={id:'cat',hunger:50,happiness:80,careUpdatedAt:start,starvingSince:null,unhappySince:null};
  const huge=JSON.parse(JSON.stringify(pet));
  const one=g.PetManager.advancePet(huge,start+80*PET_HOUR);
  assert.equal(one.loss.fate,'died');
  const gradual=JSON.parse(JSON.stringify(pet));
  let loss;
  for(let hour=1;hour<=80;hour++) {
    const res=g.PetManager.advancePet(gradual,start+hour*PET_HOUR);
    if(res.loss) { loss=res.loss;break; }
  }
  assert.equal(loss.fate,'died');
  assert.ok(Math.abs(loss.lostAt-one.loss.lostAt)<3);
  assert.equal(huge.hunger,100);
  assert.equal(gradual.hunger,100);
});

test('when one pet dies, the selected pet switches to a surviving animal', () => {
  const {g,advance}=setup();
  g.ProfileSystem.createProfile('Multiple pets');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=1000;
  g.ShopSystem.purchaseItem('cat');
  advance(40*PET_HOUR);g.SaveManager.save();
  g.ShopSystem.purchaseItem('dog');
  g.ShopSystem.selectPet('cat');
  advance(25*PET_HOUR);g.SaveManager.save();
  assert.equal(profile.petHistory.length,1);
  assert.equal(profile.petHistory[0].id,'cat');
  assert.equal(profile.pets.length,1);
  assert.equal(profile.selectedPet,'dog');
  assert.equal(g.PetManager.getCurrentPet().id,'dog');
});

test('v3.2 saved pet age is honored on import, unlike older untimed saves', () => {
  const {g,storage}=setup();
  g.ProfileSystem.createProfile('Import aging');
  const profile=g.ProfileSystem.getCurrentProfile();profile.stats.points=200;
  g.ShopSystem.purchaseItem('cat');
  const saved=JSON.parse(storage.get('mathQuestData'));
  saved.profiles[0].pets[0].careUpdatedAt -= 90*PET_HOUR;
  const restored=setup(saved).g.ProfileSystem.getCurrentProfile();
  assert.equal(restored.pets.length,0);
  assert.equal(restored.petHistory.length,1);
  assert.equal(restored.petHistory[0].fate,'died');
});
