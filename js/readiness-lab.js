/** College Readiness Lab — practice diagnostics and self-authored portfolio; no admission predictor. */
const ReadinessLab = (() => {
    const TRACKS = Object.freeze({
        balanced: { label:'Broad university preparation', categories:['algebra','statistics','reading','writing','research','science','history','economics','computer_science'] },
        stem: { label:'STEM / engineering', categories:['algebra','geometry','trigonometry','calculus','statistics','physics','chemistry','computer_science','research'] },
        humanities: { label:'Humanities / languages', categories:['reading','writing','history','logic','research','civics','economics'] },
        social: { label:'Economics / politics / social sciences', categories:['statistics','algebra','economics','history','civics','research','writing','reading'] },
        health: { label:'Health / life sciences', categories:['biology','chemistry','statistics','physics','reading','writing','research'] }
    });
    const DOMAINS = Object.freeze({
        'Quantitative reasoning':['arithmetic','algebra','geometry','statistics','trigonometry','calculus'],
        'Reading and writing':['reading','writing','logic'],
        'Experimental sciences':['science','biology','chemistry','physics','astronomy'],
        'Research and society':['research','history','civics','politics','economics','computer_science']
    });
    const CAPSTONES = Object.freeze([
        {id:'analytical_essay', title:'Argument and counterargument', prompt:'Write 700–1,200 words defending a precise, arguable claim. Use at least four credible sources; present the strongest counterargument; distinguish evidence from assumptions; finish with limits of your conclusion.', rubric:['Specific thesis and coherent reasoning','Independent sources and accurate citations','Fair counterargument with evidence','Acknowledged uncertainty and limitations']},
        {id:'quant_research', title:'Reproducible quantitative investigation', prompt:'Choose a real question, define measurable variables, collect or find permitted data, describe provenance, calculate and graph results, test a competing explanation, and provide enough steps to reproduce the analysis.', rubric:['Operational variables and documented data provenance','Correct calculations and readable visuals','Bias, uncertainty and limitations discussed','Reproducible method and independent validation']},
        {id:'science_design',title:'Scientific investigation plan', prompt:'Formulate a testable hypothesis, identify control and intervention, specify sample size considerations, measurements, ethics, confounders, and what outcome would falsify your prediction.',rubric:['Falsifiable hypothesis and comparison groups','Clear measurement and confounding controls','Ethics and practical feasibility','Replicable protocol and appropriate inference']},
        {id:'subject_exploration',title:'University-subject exploration',prompt:'Choose a prospective major, read two substantive university-level works, compare their methods or arguments, formulate an original question, and explain what would change your mind about your position.',rubric:['Relevant course-specific depth','Accurate synthesis of multiple materials','Original question and independent thinking','Reasoned response to possible criticism']},
        {id:'engineering_project',title:'Engineering or computing portfolio', prompt:'Build a small working system. Publish a specification, dependency inventory, test cases, real execution evidence, identified failure modes and a reproducible run procedure. Explain design trade-offs.',rubric:['Explicit measurable functional requirements','Implemented system tested with real dependencies','Negative tests and failure case coverage','Versioned evidence and reproducible instructions']}
    ]);
    const newState = () => ({ track:'balanced', sessions:[], portfolio:[], diagnosticResults:[], checkpoints:[] });
    const ensure = (profile) => {
        if (!profile) return null;
        const state = profile.readiness;
        if (!state || typeof state !== 'object' || Array.isArray(state)) profile.readiness = newState();
        const s = profile.readiness;
        if (!Object.hasOwn(TRACKS,s.track)) s.track='balanced';
        if (!Array.isArray(s.sessions)) s.sessions=[];
        if (!Array.isArray(s.portfolio)) s.portfolio=[];
        if (!Array.isArray(s.diagnosticResults)) s.diagnosticResults=[];
        if (!Array.isArray(s.checkpoints)) s.checkpoints=[];
        // Confine save growth even for imports with enormous nested arrays.
        s.sessions = s.sessions.filter(x=>x&&typeof x==='object'&&Number.isFinite(x.time)&&Array.isArray(x.answers)).slice(-120).map(x=>({
            time:x.time, mode:String(x.mode||'relaxed').slice(0,20),
            answers:x.answers.filter(a=>a&&typeof a.category==='string'&&typeof a.skill==='string').slice(0,100).map(a=>({
                category:a.category.slice(0,32),skill:a.skill.slice(0,80),correct: a.correct===true,
                hinted:a.hinted===true,key:String(a.key||'').slice(0,20),grade:Number.isInteger(a.grade)?a.grade:0
            }))
        }));
        s.portfolio=s.portfolio.filter(x=>x&&typeof x==='object'&&typeof x.text==='string').slice(-20).map(x=>({
            id:String(x.id||'').slice(0,64), assignment:String(x.assignment||'').slice(0,64),
            text:x.text.slice(0,12000), feedback:String(x.feedback||'').slice(0,4000),time:Number.isFinite(x.time)?x.time:Date.now()
        }));
        s.diagnosticResults=s.diagnosticResults.filter(x=>x&&typeof x==='object'&&Number.isFinite(x.time)&&x.domains&&typeof x.domains==='object').slice(-30).map(x=>({
            time:x.time, total:Number(x.total)||0, correct:Number(x.correct)||0,
            domains:Object.fromEntries(Object.entries(x.domains).filter(([k,v])=>Object.hasOwn(DOMAINS,k)&&v&&typeof v==='object').map(([k,v])=>[k,{correct:Number(v.correct)||0,total:Number(v.total)||0}]))
        }));
        s.checkpoints=s.checkpoints.filter(x=>x&&typeof x==='object'&&Number.isInteger(x.grade)&&x.grade>=0&&x.grade<=12&&Number.isFinite(x.time)).slice(-90).map(x=>({
            grade:x.grade,time:x.time,total:Math.max(0,Number(x.total)||0),correct:Math.max(0,Number(x.correct)||0),
            keys:Array.isArray(x.keys)?x.keys.filter(key=>typeof key==='string'&&key.length<=20).slice(0,80):[],
            categories:Array.isArray(x.categories)?x.categories.filter(c=>typeof c==='string'&&c.length<=32).slice(0,25):[]
        }));
        return s;
    };
    function buildDiagnostic() {
        // Balanced sampling across four competency domains; independent from grade locks.
        // This is a 40-question internal practice check, NOT SAT, ACT, UCAS or Oxford scoring.
        const saveGrade=MathEngine.currentGrade,saveCat=MathEngine.currentCategory;
        const questions=[],used=new Set();
        try {
            for(const cats of Object.values(DOMAINS)) {
                const pool=[];
                for(let g=9;g<=12;g++) {
                    for(const t of QuestionCatalogue.getQuestionsForGrade(g)) {
                        if(t.type.startsWith('college_') && cats.includes(t.category) && (!Number.isInteger(t.gradeMin) || t.gradeMin>=9) && !pool.includes(t)) pool.push(t);
                    }
                }
                // Pick distinct skill definitions when possible, then variants.
                let remaining=Utils.shuffleArray(pool),seenSkills=new Set(),tries=0;
                while(questions.filter(q=>cats.includes(q.category)).length<10 && tries++<1000) {
                    if(!remaining.length) remaining=Utils.shuffleArray(pool);
                    if(!remaining.length) break;
                    remaining.sort((a,b)=>Number(seenSkills.has(a.skill||a.type))-Number(seenSkills.has(b.skill||b.type)));
                    const template=remaining.shift();
                    const grade=Math.max(9,Math.min(12,Number.isInteger(template.gradeMin)?template.gradeMin:11));
                    MathEngine.setGrade(grade);
                    const q=MathEngine.fromTemplate(template), key=MathEngine.questionKey(q);
                    if(used.has(key)) continue;
                    used.add(key);seenSkills.add(template.skill||template.type);questions.push(q);
                }
            }
        } finally { MathEngine.setGrade(saveGrade); MathEngine.setCategory(saveCat); }
        if (questions.length !== 40) throw new Error(`Diagnostic requires 40 distinct questions; found ${questions.length}.`);
        return Utils.shuffleArray(questions);
    }
    function buildCheckpoint(grade) {
        if(!Number.isInteger(grade)||grade<0||grade>12)throw new RangeError('Invalid checkpoint grade');
        const savedGrade=MathEngine.currentGrade,savedCategory=MathEngine.currentCategory;
        // Mastery checks use original explained material only; older trivia with generic hints remains available in casual play.
        const selected=[],used=new Set(),pool=QuestionCatalogue.getQuestionsForGrade(grade).filter(t=>t.type.startsWith('college_'));
        try{
            MathEngine.setGrade(grade);
            for(const cat of [...new Set(pool.map(t=>t.category))]) {
                const templates=Utils.shuffleArray(pool.filter(t=>t.category===cat));
                const skillSet=new Set();
                let count=0,attempts=0;
                while(count<3 && attempts++<120) {
                    const sorted=Utils.shuffleArray(templates).sort((a,b)=>Number(skillSet.has(a.skill||a.type))-Number(skillSet.has(b.skill||b.type)));
                    const chosen=sorted[0];if(!chosen)break;
                    const q=MathEngine.fromTemplate(chosen),key=MathEngine.questionKey(q);
                    if(used.has(key))continue;
                    used.add(key);selected.push(q);skillSet.add(chosen.skill||chosen.type);count++;
                }
            }
            let tries=0;
            while(selected.length<20&&tries++<1000) {
                const t=Utils.randomPick(pool);const q=MathEngine.fromTemplate(t),key=MathEngine.questionKey(q);
                if(used.has(key))continue;
                used.add(key);selected.push(q);
            }
        }finally {MathEngine.setGrade(savedGrade);MathEngine.setCategory(savedCategory);}
        if(selected.length<20||selected.length>60)throw new Error(`Checkpoint requires 20–60 distinct questions, found ${selected.length}`);
        return Utils.shuffleArray(selected);
    }
    function gradeStatus(profile,grade){
        const s=ensure(profile);const qualifying=(s?.checkpoints||[]).filter(x=>x.grade===grade&&x.total>=20&&x.correct/x.total>=.9).sort((a,b)=>a.time-b.time);
        for(let i=0;i<qualifying.length;i++)for(let j=i+1;j<qualifying.length;j++){
            if(qualifying[j].time-qualifying[i].time>=7*86400000&&new Set([...qualifying[i].keys,...qualifying[j].keys]).size>=20)
                return {status:'Repeated practice checkpoint complete (unverified)',complete:true,passes:qualifying.length};
        }
        return {status:qualifying.length?'One practice pass — repeat after 7 days':'No qualifying checkpoint yet',complete:false,passes:qualifying.length};
    }
    function getDomainOf(category) {
        return Object.keys(DOMAINS).find(domain=>DOMAINS[domain].includes(category))||'Other';
    }
    function recordGame(game,profile) {
        const s=ensure(profile);
        if(!s || !game?.results?.answers?.length)return null;
        const answers=game.results.answers.map((a,i)=>({
            category:String(game.questions[i]?.category||''),skill:String(game.questions[i]?.skill||game.questions[i]?.type||''),
            correct:a.correct===true,hinted:game.hintsUsed?.includes(i)===true,
            key:a.key || MathEngine.questionKey(game.questions[i]),grade:game.questions[i]?.grade||game.grade
        }));
        const session={time:Date.now(),mode:game.mode,answers};
        s.sessions.push(session);s.sessions=s.sessions.slice(-120);
        if(game.mode==='checkpoint'){
            s.checkpoints.push({time:session.time,grade:game.grade,total:answers.length,correct:answers.filter(a=>a.correct).length,
                keys:answers.map(a=>a.key),categories:[...new Set(answers.map(a=>a.category))]});
            s.checkpoints=s.checkpoints.slice(-90);
        }
        if(game.mode==='diagnostic'){
            const domains={}; for(const name of Object.keys(DOMAINS))domains[name]={correct:0,total:0};
            for(const a of answers){const name=getDomainOf(a.category);if(!domains[name])continue;domains[name].total++;if(a.correct)domains[name].correct++;}
            const report={time:session.time,total:answers.length,correct:answers.filter(a=>a.correct).length,domains};
            s.diagnosticResults.push(report);s.diagnosticResults=s.diagnosticResults.slice(-30);
        }
        SaveManager.save();
        return session;
    }
    function categorySummary(profile,minimumGrade=0) {
        const s=ensure(profile), buckets=new Map();
        for(const session of (s?.sessions||[])){
            const day=new Date(session.time).toISOString().slice(0,10);
            for(const a of session.answers){
                if(a.grade<minimumGrade)continue;
                if(!buckets.has(a.category)) buckets.set(a.category,{category:a.category,total:0,correct:0,independent:0,correctIndependent:0,days:new Set(),keys:new Set()});
                const b=buckets.get(a.category);b.total++;if(a.correct)b.correct++;b.days.add(day);b.keys.add(a.key);
                if(!a.hinted){b.independent++;if(a.correct)b.correctIndependent++;}
            }
        }
        return [...buckets.values()].map(b=>({category:b.category,total:b.total,correct:b.correct,unique:b.keys.size,days:b.days.size,
            independent:b.independent,independentAccuracy:b.independent?Math.round(100*b.correctIndependent/b.independent):null,
            // A demonstrated in-app practice pattern, NOT proctored / externally validated fluency.
            status: b.independent>=30 && b.keys.size>=20 && b.days.size>=3 && b.correctIndependent/b.independent>=.9 ?
                'Sustained practice (unverified)' : b.total>=10 ? 'Developing' : 'Insufficient evidence'
        })).sort((a,b)=>a.category.localeCompare(b.category));
    }
    function recommendations(profile){
        const s=ensure(profile),focus=TRACKS[s.track].categories,actual=new Map(categorySummary(profile,9).map(x=>[x.category,x]));
        return focus.map(category=>{
            const x=actual.get(category);
            return {category,status:!x?'Not started':x.independent<10?'Need more attempts':x.independentAccuracy<80?'Review fundamentals':x.unique<20?'Needs new problems':x.days<3?'Review on later days':'Maintain and extend',
                score:x?.independentAccuracy??null,unique:x?.unique??0,attempts:x?.independent??0};
        }).sort((a,b)=> (a.score??-1)-(b.score??-1));
    }
    function addPortfolio(profile,assignment,text,feedback=''){
        const s=ensure(profile);
        if(!s||!CAPSTONES.some(c=>c.id===assignment))return {success:false,error:'Choose a valid assignment'};
        if(typeof text!=='string'||text.trim().length<40||text.length>12000)return {success:false,error:'Write 40–12,000 characters of original work.'};
        if(typeof feedback!=='string'||feedback.length>4000)return {success:false,error:'Feedback is too long.'};
        const item={id:Utils.generateId(),assignment,text:text.trim(),feedback:feedback.trim(),time:Date.now()};
        s.portfolio.push(item);s.portfolio=s.portfolio.slice(-20);SaveManager.save();return {success:true,item};
    }
    return Object.freeze({TRACKS,DOMAINS,CAPSTONES,ensure,buildDiagnostic,buildCheckpoint,gradeStatus,getDomainOf,recordGame,categorySummary,recommendations,addPortfolio});
})();
window.ReadinessLab=ReadinessLab;
