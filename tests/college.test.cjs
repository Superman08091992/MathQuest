const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function setup(){
    const store=new Map(),s={console,Math,Date,JSON,window:null,confirm:()=>true,alert:()=>{},
        localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
        AudioContext:class{},setInterval:()=>1,clearInterval:()=>{},setTimeout:()=>1,clearTimeout:()=>{}};
    s.window=s;s.UIManager={updateTimerUI(){}};vm.createContext(s);
    const files=['utils','question-templates','question-templates-advanced','question-templates-extended-fixed',
        'college-curriculum','college-procedural','question-catalogue','math-engine','readiness-lab',
        'save-manager','audio','profile-system','progression-system','reward-system','shop-system','pet-manager','game-manager'];
    for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,'js',file+'.js'),'utf8'),s,{filename:file+'.js'});
    s.SaveManager.init();s.ProfileSystem.init();s.RewardSystem.init();return {s,store};
}
const asJSON=x=>JSON.parse(JSON.stringify(x));
test('526 distinct definitions include 233 original evidence and literacy items and 94 procedures',()=>{
    const {s}=setup();
    assert.equal(s.CollegeCurriculum.count,233);
    assert.equal(s.CollegeProcedural.count,94);
    const types=new Set();
    let count=0;
    for(let grade=0;grade<=12;grade++){
        const q=s.QuestionCatalogue.getQuestionsForGrade(grade);
        assert.ok(q.length>=30);
        assert.ok(new Set(q.map(x=>x.category)).size>=6);
        for(const t of q){types.add(t.type);count++;}
    }
    assert.equal(types.size,526);
    assert.ok(count>=900);
});
test('Every college item has one keyed choice and an explanation, including uppercase spelling items',()=>{
    const {s}=setup();let trials=0;
    for(let g=0;g<13;g++){
        s.MathEngine.setGrade(g);
        for(const t of s.QuestionCatalogue.getQuestionsForGrade(g).filter(t=>t.type.startsWith('college_'))){
            for(let i=0;i<100;i++){
                const q=s.MathEngine.fromTemplate(t);
                assert.equal(q.answers.length,4);
                assert.equal(new Set(q.answers.map(String)).size,4,`${t.type}`);
                assert.equal(q.answers.filter(ans=>s.MathEngine.validateAnswer(q,ans)).length,1,`${t.type} ${q.text}`);
                assert.ok(q.explanation.length>=18,`${t.type}`);
                trials++;
            }
        }
    }
    assert.ok(trials>49000);
    const cap=s.CollegeCurriculum.items.find(x=>x.skill==='capitalization').generate();
    assert.equal(s.MathEngine.validateAnswer(cap,cap.answer.toLowerCase()),false);
});
test('Fractions are mathematically unambiguous, not merely different strings',()=>{
    const {s}=setup();
    const types=['add_like_fractions','multiply_unit_fraction','probability_marbles','relative_frequency','conditional_percentage'];
    for(let grade=0;grade<13;grade++){
        s.MathEngine.setGrade(grade);
        for(const t of s.QuestionCatalogue.getQuestionsForGrade(grade).filter(t=>types.includes(t.skill)&&t.type.startsWith('college_'))){
            for(let i=0;i<400;i++){
                const q=s.MathEngine.fromTemplate(t);
                const numeric=v=>{const m=/^(-?\d+)\/(-?\d+)$/.exec(v);return m?+m[1]/+m[2]:null;};
                for(const option of q.answers){if(option!==q.answer)assert.notEqual(numeric(option),numeric(q.answer),`${t.type}: ${q.text}, options ${q.answers}`);}
            }
        }
    }
});
test('40-question diagnostic balances four domains and does not grant game rewards',()=>{
    const {s,store}=setup();s.ProfileSystem.createProfile('Ready');
    s.MathEngine.init(4,'arithmetic');const originalGrade=s.MathEngine.currentGrade,originalCat=s.MathEngine.currentCategory;
    const qs=s.ReadinessLab.buildDiagnostic();
    assert.equal(qs.length,40);assert.equal(new Set(qs.map(q=>s.MathEngine.questionKey(q))).size,40);
    assert.equal(s.MathEngine.currentGrade,originalGrade);assert.equal(s.MathEngine.currentCategory,originalCat);
    for(const cats of Object.values(s.ReadinessLab.DOMAINS))assert.equal(qs.filter(q=>cats.includes(q.category)).length,10);
    s.GameManager.initDiagnostic(qs);s.GameManager.startGame();
    for(const q of qs) assert.equal(s.GameManager.submitAnswer(q.answer).correct,true);
    const results=s.GameManager.endGame();
    assert.equal(results.stats.xp,0);assert.equal(results.stats.crystals,0);assert.equal(results.stats.points,0);
    assert.equal(s.ProfileSystem.getCurrentProfile().stats.gamesPlayed,0);
    const entries=s.ProfileSystem.getCurrentProfile().readiness.diagnosticResults;
    assert.equal(entries.length,1);assert.equal(entries[0].total,40);assert.equal(entries[0].correct,40);
    assert.equal(s.GameManager.endGame(),results);
    assert.equal(entries.length,1);
    const restored=JSON.parse(store.get('mathQuestData'));
    assert.equal(restored.profiles[0].readiness.diagnosticResults.length,1);
});
test('Practice evidence is independent of purchased hints and is never described as verified admission readiness',()=>{
    const {s}=setup();s.ProfileSystem.createProfile('Evidence');const p=s.ProfileSystem.getCurrentProfile();
    const state=s.ReadinessLab.ensure(p);
    const now=Date.now();
    state.sessions=[0,1,2].map(day=>({time:now-(8-day*4)*86400000,mode:'relaxed',answers:Array.from({length:10},(_,i)=>({
        category:'algebra',skill:'linear_equations',correct:true,hinted:false,key:`q${day}${i}`,grade:11
    }))}));
    const summary=s.ReadinessLab.categorySummary(p).find(x=>x.category==='algebra');
    assert.equal(summary.days,3);assert.equal(summary.unique,30);
    assert.equal(summary.status,'Sustained practice (unverified)');
    state.sessions[0].answers[0].hinted=true;
    assert.equal(s.ReadinessLab.categorySummary(p).find(x=>x.category==='algebra').independent,29);
    assert.ok(!s.ReadinessLab.categorySummary(p).find(x=>x.category==='algebra').status.startsWith('Sustained'));
});
test('Original portfolio writing is saved, exportable and remains self-recorded',()=>{
    const {s}=setup();s.ProfileSystem.createProfile('Writer');const p=s.ProfileSystem.getCurrentProfile();
    const response=s.ReadinessLab.addPortfolio(p,'analytical_essay','My provisional thesis addresses a question and evaluates several counterexamples.', 'Reviewed by a peer');
    assert.equal(response.success,true);
    assert.equal(p.readiness.portfolio.length,1);
    assert.equal(p.readiness.portfolio[0].feedback,'Reviewed by a peer');
    assert.ok(s.SaveManager.export().includes('My provisional thesis'));
    assert.equal(s.ReadinessLab.addPortfolio(p,'nonsense','A'.repeat(45)).success,false);
    assert.equal(s.ReadinessLab.addPortfolio(p,'analytical_essay','Too short').success,false);
    assert.equal(s.ReadinessLab.addPortfolio(p,'analytical_essay','A'.repeat(15000)).success,false);
});
test('Legacy profile migration creates separate readiness state without losing previous progress',()=>{
    const {s}=setup();s.ProfileSystem.createProfile('Old');
    const profile=s.ProfileSystem.getCurrentProfile();profile.stats.xp=237;profile.stats.points=820;
    delete profile.readiness;s.SaveManager.migrateProfiles();
    assert.equal(profile.stats.xp,237);assert.equal(profile.stats.points,820);
    assert.equal(profile.readiness.track,'balanced');assert.equal(profile.readiness.sessions.length,0);
});

test('Every grade builds a distinct, category-spanning 20–60 question practice checkpoint',()=>{
    const {s}=setup();
    s.ProfileSystem.createProfile('Checkpoint');
    s.MathEngine.init(5,'arithmetic');
    for(let grade=0;grade<=12;grade++){
        const savedGrade=s.MathEngine.currentGrade,savedCategory=s.MathEngine.currentCategory;
        const questions=s.ReadinessLab.buildCheckpoint(grade);
        assert.ok(questions.length>=20&&questions.length<=60,`grade ${grade} size ${questions.length}`);
        assert.equal(new Set(questions.map(q=>s.MathEngine.questionKey(q))).size,questions.length,`grade ${grade}`);
        assert.ok(new Set(questions.map(q=>q.category)).size>=6,`grade ${grade} category coverage`);
        assert.ok(questions.every(q=>q.grade===grade&&q.answers.length===4&&q.explanation),`grade ${grade} question metadata`);
        assert.equal(s.MathEngine.currentGrade,savedGrade);assert.equal(s.MathEngine.currentCategory,savedCategory);
    }
});

test('Checkpoint grades need two qualifying passes separated by seven days and no game rewards',()=>{
    const {s,store}=setup();s.ProfileSystem.createProfile('Checkpoint Learner');
    const profile=s.ProfileSystem.getCurrentProfile();s.MathEngine.init(4,'all');
    const questions=s.ReadinessLab.buildCheckpoint(4);
    s.GameManager.initCheckpoint(4,questions);s.GameManager.startGame();
    for(const q of questions)assert.equal(s.GameManager.submitAnswer(q.answer).correct,true);
    const result=s.GameManager.endGame();
    assert.equal(result.stats.xp,0);assert.equal(result.stats.points,0);assert.equal(result.stats.crystals,0);
    assert.equal(profile.stats.gamesPlayed,0);
    assert.equal(s.ReadinessLab.gradeStatus(profile,4).complete,false);
    assert.equal(profile.readiness.checkpoints.length,1);
    const previous=profile.readiness.checkpoints[0];
    previous.time=Date.now()-8*86400000;
    s.GameManager.initCheckpoint(4,s.ReadinessLab.buildCheckpoint(4));s.GameManager.startGame();
    for(const q of s.GameManager.currentGame.questions) s.GameManager.submitAnswer(q.answer);
    s.GameManager.endGame();
    assert.equal(profile.readiness.checkpoints.length,2);
    assert.equal(s.ReadinessLab.gradeStatus(profile,4).complete,true);
    assert.match(s.ReadinessLab.gradeStatus(profile,4).status,/unverified/);
    assert.equal(JSON.parse(store.get('mathQuestData')).profiles[0].readiness.checkpoints.length,2);
    assert.equal(s.ReadinessLab.gradeStatus(profile,5).complete,false);
});
