/** End-to-end template contract tests across every registered grade/subject. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname,'..');
function engine() {
    const s = { console, window: null, Math, Date };
    s.window = s;
    vm.createContext(s);
    for (const f of ['utils','question-templates','question-templates-advanced',
        'question-templates-extended-fixed','college-curriculum','college-procedural','question-catalogue','math-engine']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8'),s,{filename:f+'.js'});
    }
    return s;
}
function invariant(s,q,template) {
    assert.ok(typeof q.text === 'string' && q.text.length>4, `No text: ${template.type}`);
    assert.ok(q.hint && typeof q.hint === 'string', `No hint: ${template.type}`);
    assert.equal(q.answers.length,4,`Four options: ${template.type}`);
    assert.equal(new Set(q.answers.map(String)).size,4,`Repeated options: ${template.type} ${q.text}`);
    assert.equal(q.answers.filter(a=>s.MathEngine.validateAnswer(q,a)).length,1,`Wrong answer: ${template.type} ${q.text}`);
    assert.ok(q.answers.every(a=>a !== null && a !== undefined), `Null options: ${template.type}`);
}

test('All 13 grades, extended procedural questions and academically focused fixed facts are registered',()=>{
    const s=engine();
    assert.equal(s.QuestionTemplatesAdvanced.count,118);
    assert.equal(s.QuestionCatalogue.staticCount,52+s.CollegeCurriculum.count);
    assert.ok(s.CollegeCurriculum.count>=200);
    assert.ok(s.CollegeProcedural.count>=90);
    for (let grade=0;grade<=12;grade++) {
        const templates=s.QuestionCatalogue.getQuestionsForGrade(grade);
        assert.ok(templates.length>=30,`Grade ${grade} has too little coverage`);
        assert.ok(new Set(templates.map(t=>t.category)).size>=6,`Grade ${grade} lacks topic diversity`);
        assert.ok(new Set(templates.map(t=>t.type)).size===templates.length,`Duplicate template IDs in grade ${grade}`);
    }
    assert.equal(s.QuestionCatalogue.getQuestionsForGrade(-1).length,0);
    assert.equal(s.QuestionCatalogue.getQuestionsForGrade(13).length,0);
});

test('Every new, old and fixed question template generates four unambiguous choices',()=>{
    const s=engine();let samples=0;
    for(let grade=0;grade<=12;grade++) {
        s.MathEngine.setGrade(grade);
        for(const template of s.MathEngine.getAvailableTemplates(grade,'all')) {
            for(let k=0;k<120;k++) {
                const q=s.MathEngine.fromTemplate(template);
                invariant(s,q,template);
                assert.equal(q.grade,grade);
                assert.equal(q.category,template.category);
                samples++;
            }
        }
    }
    assert.ok(samples>30_000,`Only ${samples} samples`);
});

test('20-question games cover varied question keys and obey subject filters',()=>{
    const s=engine();
    for(let grade=0;grade<=12;grade++) {
        s.MathEngine.init(grade,'all');
        for(let trial=0;trial<20;trial++) {
            const questions=s.MathEngine.generateQuestions(20);
            assert.equal(questions.length,20);
            assert.equal(new Set(questions.map(q=>s.MathEngine.questionKey(q))).size,20,
                `Duplicate prompt+answer in grade ${grade}, trial ${trial}`);
        }
        for(const category of [...new Set(s.MathEngine.getAvailableTemplates().map(q=>q.category))]) {
            s.MathEngine.setCategory(category);
            for(let trial=0;trial<12;trial++) {
                const q=s.MathEngine.generateQuestion();
                assert.equal(q.category,category,`Category leak: ${grade}/${category}`);
                invariant(s,q,{type:q.type});
            }
        }
    }
    assert.equal(s.MathEngine.validateAnswer({answer:0},null),false);
    assert.equal(s.MathEngine.validateAnswer({answer:0},''),false);
    assert.equal(s.MathEngine.validateAnswer({answer:0},'0'),true);
});

test('New formulas match independent calculations, not merely option self-consistency',()=>{
    const s=engine(); const get=(grade,type)=>s.QuestionCatalogue.getQuestionsForGrade(grade).find(t=>t.type===type);
    const run=(grade,type,parse,expected)=>{
        const t=get(grade,type);assert.ok(t,type);
        s.MathEngine.setGrade(grade);
        for(let i=0;i<150;i++) {
            const q=s.MathEngine.fromTemplate(t);
            const values=parse(q.text);
            assert.ok(values,`Cannot parse ${type}: ${q.text}`);
            assert.equal(Number(q.answer),expected(values),`${type}: ${q.text}`);
        }
    };
    run(7,'proportion_missing_value',text=>/If (\d+) items cost \$(\d+), what do (\d+) items/.exec(text),m=>Number(m[2])*Number(m[3])/Number(m[1]));
    run(5,'calculate_average',text=>/scores are (\d+), (\d+), and (\d+)/.exec(text),m=>(+m[1]+ +m[2]+ +m[3])/3);
    run(5,'calculate_mean',text=>/median of (\d+), (\d+), and (\d+)/.exec(text),m=>[+m[1],+m[2],+m[3]].sort((a,b)=>a-b)[1]);
    run(10,'circle_sector_pi',text=>/radius (\d+)\. For a (\d+)° sector/.exec(text),m=>(+m[1])**2*(+m[2])/360);
    run(12,'derivative_sum_constant',text=>/f\(x\) = (\d+)x² \+ \((-?\d+)\)x \+ 9, find f′\((-?\d+)\)/.exec(text),m=>2*(+m[1])*(+m[3])+(+m[2]));
    run(10,'cylinder_volume_pi',text=>/radius (\d+) cm and height (\d+) cm/.exec(text),m=>(+m[1])**2*(+m[2]));
    run(10,'prism_surface_area',text=>/(\d+) × (\d+) × (\d+) rectangular prism/.exec(text),m=>2*(+m[1]*+m[2]+ +m[2]*+m[3]+ +m[1]*+m[3]));
    run(10,'cone_volume_coefficient_pi',text=>/radius (\d+) cm and height (\d+) cm/.exec(text),m=>(+m[1])**2*(+m[2])/3);
    run(10,'sector_arc_length_pi',text=>/radius (\d+) cm. For an arc spanning (\d+)°/.exec(text),m=>2*(+m[1])*(+m[2])/360);
    run(6,'triangle_area',text=>/base (\d+) cm and height (\d+) cm/.exec(text),m=>(+m[1])*(+m[2])/2);
});


test('Finite subject-only quizzes are capped to distinct facts, not padded with repeats',()=>{
    const s=engine();s.MathEngine.init(1,'science');
    const facts=s.MathEngine.getAvailableTemplates();
    assert.ok(facts.every(t=>t.isFixed));
    assert.ok(facts.length>=2);
    const generated=s.MathEngine.generateQuestions(20);
    assert.equal(generated.length,Math.min(20,facts.length));
    assert.equal(new Set(generated.map(q=>s.MathEngine.questionKey(q))).size,generated.length);
});

test('Grade 4 exposes six actual playable subjects with measured counts',()=>{
    const s=engine();
    const expected={arithmetic:9,geometry:1,reading:16,science:4,history:1,astronomy:2}; // previous minimum coverage
    const templates=s.MathEngine.getAvailableTemplates(4,'all');
    assert.ok(templates.length>=70);
    const counts={};
    for(const t of templates) counts[t.category]=(counts[t.category]||0)+1;
    for(const [category,count] of Object.entries(expected)) assert.ok(counts[category]>=count);
    for(const [subject,count] of Object.entries(expected)) {
        s.MathEngine.init(4,subject);
        assert.ok(s.MathEngine.getAvailableTemplates().length>=count);
        const questions=s.MathEngine.generateQuestions(10);
        assert.equal(questions.length, Math.min(10,s.MathEngine.getAvailableTemplates().every(t=>t.isFixed)?counts[subject]:10));
        assert.ok(questions.every(q=>q.category===subject));
    }
});

test('Missing question catalogue is an explicit error, not a silent arithmetic-only fallback',()=>{
    const s={window:null,Math,Date,console};s.window=s;
    vm.createContext(s);
    for(const file of ['utils','question-templates','math-engine'])
        vm.runInContext(fs.readFileSync(path.join(ROOT,'js',file+'.js'),'utf8'),s,{filename:file+'.js'});
    assert.throws(()=>s.MathEngine.getAvailableTemplates(4,'all'),/catalogue failed to load/);
});
