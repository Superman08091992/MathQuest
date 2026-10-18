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
    // Grade-by-grade learning outcomes, shown where the student actually studies.
    // They describe target competencies, not claims of externally verified mastery.
    const GRADE_GOALS = Object.freeze([
        ['Recognize numbers and quantities', 'Explain observations using words or pictures', 'Identify basic shapes, patterns, and story meaning'],
        ['Add, subtract and reason with place value', 'Read and explain a short passage', 'Record and compare observations'],
        ['Work with two-digit operations, fractions and measurements', 'Write explanatory sentences', 'Interpret evidence in simple charts'],
        ['Explain multiplication and division strategies', 'Compare sources and claims', 'Plan a controlled observation'],
        ['Reason with fractions, area and multi-step problems', 'Summarize informational texts accurately', 'Describe scientific evidence and community decisions'],
        ['Solve decimal, fraction and measurement problems', 'Write structured arguments with examples', 'Use evidence to test hypotheses'],
        ['Analyze ratios, negative numbers and basic statistics', 'Distinguish evidence from opinion', 'Explain systems in science and history'],
        ['Solve proportional and algebraic relationships', 'Evaluate competing explanations', 'Interpret data and research methods'],
        ['Apply linear functions and geometry', 'Assess source reliability and statistical claims', 'Write evidence-based conclusions'],
        ['Model functions and scientific systems', 'Critique historical and economic arguments', 'Use computational reasoning and documented methods'],
        ['Analyze quadratics, probability and experimental error', 'Construct sustained written arguments', 'Evaluate causal claims and complex evidence'],
        ['Use advanced algebra, chemistry and physics models', 'Interpret primary sources and quantitative studies', 'Design and document reproducible investigations'],
        ['Integrate calculus, statistics and scientific reasoning', 'Write and defend rigorous cross-disciplinary analyses', 'Independently investigate unfamiliar problems and limitations']
    ].map(x=>Object.freeze(x)));
    const GRADE_PROJECTS = Object.freeze([
        {title:'Explain a pattern',prompt:'Find a simple pattern in shapes, sounds or numbers. Describe or dictate what repeats. Draw it on paper and describe what comes next.',minimum:20,rubric:['Shows a real repeating pattern','States or records a prediction','Explains why the next item follows']},
        {title:'Measure and describe',prompt:'Choose three objects, predict which is longest, measure or compare them safely, then write or dictate how your prediction compared with the result.',minimum:40,rubric:['Makes a clear prediction','Records comparable measurements','Explains what happened']},
        {title:'A question from everyday life',prompt:'Ask a measurable question, collect five observations or counts, summarize the findings and explain one limitation of your method.',minimum:70,rubric:['Defines one measurable question','Uses at least five observations','Describes the evidence and a limitation']},
        {title:'Explain an investigation',prompt:'Compare two plausible explanations for an observation in nature. Identify what evidence would distinguish them and write a connected paragraph.',minimum:100,rubric:['Compares two explanations fairly','Gives a testable observation','Provides a reasoned conclusion']},
        {title:'A community and environment study',prompt:'Choose an issue affecting your community or local environment. Research two distinct sources, describe a measurable feature and propose a fair way to test one improvement.',minimum:140,rubric:['Identifies the issue precisely','Uses and distinguishes two sources','Proposes a fair comparison']},
        {title:'A quantitative decision',prompt:'Collect or find data about a real decision, use fractions or decimals to compare options, show your calculations and defend a conclusion including uncertainty.',minimum:180,rubric:['Documents a relevant data source','Shows correct calculations','Explains trade-offs and uncertainty']},
        {title:'Evaluate an evidence claim',prompt:'Select a claim from science, history or economics. Find independent evidence for and against it, calculate a relevant ratio or rate, and explain what evidence would change your conclusion.',minimum:220,rubric:['States a falsifiable or contestable claim','Uses at least two independent sources','Computes and explains a quantitative comparison']},
        {title:'Model a system',prompt:'Choose a real-world process. Represent two related variables in an equation, chart or table; test whether the model predicts observations; identify assumptions and weaknesses.',minimum:280,rubric:['Defines variables and units','Documents tested predictions','Describes when the model fails']},
        {title:'Compare competing arguments',prompt:'Take a question in literature, science or public policy. Present the strongest argument on each side, assess at least three pieces of evidence and propose a justified position.',minimum:350,rubric:['Accurately represents disagreement','Assesses provenance of three sources','Acknowledges a serious counterargument']},
        {title:'Reproducible inquiry',prompt:'Design and document a small investigation. State a testable hypothesis, explain sampling, build a data table, discuss bias and show how somebody could reproduce the results.',minimum:450,rubric:['Testable hypothesis and sampling method','Documented observations and calculations','Reproducible procedure and limitations']},
        {title:'Causal and statistical reasoning',prompt:'Analyze a dataset that seems to support a causal claim. Describe the variables, alternative explanations, statistics, uncertainty, limitations and a more credible follow-up design.',minimum:550,rubric:['Correct numerical analysis','Alternative explanations and confounders','Responsible causal interpretation']},
        {title:'Cross-disciplinary research argument',prompt:'Investigate a question requiring at least two school subjects. Review at least four credible sources, articulate an original argument, test a competing explanation and disclose your methods.',minimum:650,rubric:['Integrates two academic fields','Accurate source citations and counterargument','Clear, inspectable methods']},
        {title:'Grade 12 independent capstone',prompt:'Investigate an original, advanced research or engineering problem. Define specifications or a research question; cite appropriate sources; provide calculations, tests or analyses; discuss negative results and competing explanations; include reproducibility and a substantial written conclusion.',minimum:800,rubric:['Independent, well-scoped research question','Evidence, calculations and transparent methods','Counterevidence and failure analysis','Reproducible artifacts and defensible conclusions']}
    ].map((x,grade)=>Object.freeze({grade,...x,rubric:Object.freeze(x.rubric)})));
    const newState = () => ({ track:'balanced', sessions:[], portfolio:[], diagnosticResults:[], checkpoints:[], gradeProjects:[] });
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
        if (!Array.isArray(s.gradeProjects)) s.gradeProjects=[];
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
            // Older saves remain intact, but cannot certify cumulative proficiency without per-grade evidence.
            gradeTotal:Number.isInteger(x.gradeTotal)?Math.max(0,Math.min(60,x.gradeTotal)):null,
            gradeCorrect:Number.isInteger(x.gradeCorrect)?Math.max(0,Math.min(60,x.gradeCorrect)):null,
            reviewTotal:Number.isInteger(x.reviewTotal)?Math.max(0,Math.min(60,x.reviewTotal)):null,
            reviewCorrect:Number.isInteger(x.reviewCorrect)?Math.max(0,Math.min(60,x.reviewCorrect)):null,
            hinted:Number.isInteger(x.hinted)?Math.max(0,Math.min(60,x.hinted)):null,
            categories:Array.isArray(x.categories)?x.categories.filter(c=>typeof c==='string'&&c.length<=32).slice(0,25):[]
        }));
        s.gradeProjects=s.gradeProjects.filter(x=>x&&typeof x==='object'&&Number.isInteger(x.grade)&&
            x.grade>=0&&x.grade<=12&&typeof x.text==='string').slice(-65).map(x=>({
            grade:x.grade,text:x.text.slice(0,12000),time:Number.isFinite(x.time)?x.time:Date.now()
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
            // Spiral review: every higher grade revisits earlier material under exam conditions.
            // It cannot become a substitute for passing the earlier grades themselves.
            if (grade>0) {
                const reviewGrades=[...new Set([grade-1,Math.floor((grade-1)/2),0])];
                const reviewPool=reviewGrades.map(g=>({grade:g,items:Utils.shuffleArray(
                    QuestionCatalogue.getQuestionsForGrade(g).filter(t=>t.type.startsWith('college_'))
                )}));
                let reviews=0,attempts=0;
                while(reviews<8 && attempts++<200) {
                    const choice=reviewPool[reviews%reviewPool.length];
                    const template=choice.items.shift();
                    if(!template){reviewPool.splice(reviews%reviewPool.length,1);if(!reviewPool.length)break;continue;}
                    MathEngine.setGrade(choice.grade);
                    const question=MathEngine.fromTemplate(template),key=MathEngine.questionKey(question);
                    if(used.has(key))continue;
                    used.add(key);selected.push(question);reviews++;
                }
            }
        }finally {MathEngine.setGrade(savedGrade);MathEngine.setCategory(savedCategory);}
        if(selected.length<20||selected.length>60)throw new Error(`Checkpoint requires 20–60 distinct questions, found ${selected.length}`);
        if(grade>0 && selected.filter(q=>q.grade<grade).length<8)throw new Error('Cumulative checkpoint review unavailable');
        return Utils.shuffleArray(selected);
    }
    function gradeStatus(profile,grade){
        if(!Number.isInteger(grade)||grade<0||grade>12)throw new RangeError('Invalid academic grade');
        const s=ensure(profile);
        const all=(s?.checkpoints||[]).filter(x=>x.grade===grade);
        const qualifying=all.filter(x=>
            x.total>=20 && x.total<=60 && x.correct/x.total>=.9 &&
            x.gradeTotal>=20 && x.gradeCorrect/x.gradeTotal>=.9 &&
            x.reviewTotal===(x.total-x.gradeTotal) &&
            (grade===0 ? x.reviewTotal===0 : x.reviewTotal>=8 && x.reviewCorrect/x.reviewTotal>=.75) &&
            x.hinted===0 && x.categories.length>=6 && new Set(x.keys).size===x.total
        ).sort((a,b)=>a.time-b.time);
        for(let i=0;i<qualifying.length;i++)for(let j=i+1;j<qualifying.length;j++){
            if(qualifying[j].time-qualifying[i].time>=7*86400000 &&
               new Set([...qualifying[i].keys,...qualifying[j].keys]).size>=20)
                return {status:'Academic practice checkpoint complete (unverified)',complete:true,passes:qualifying.length};
        }
        if (qualifying.length) return {status:'First qualifying pass — repeat after 7 days with new questions',complete:false,passes:qualifying.length};
        return {status:all.length?'No qualifying cumulative checkpoint yet — review results and retry':'Not assessed — take a cumulative checkpoint',complete:false,passes:0};
    }
    function gradeProjectStatus(profile,grade){
        if(!Number.isInteger(grade)||grade<0||grade>12)throw new RangeError('Invalid project grade');
        const projects=(ensure(profile)?.gradeProjects||[]).filter(x=>x.grade===grade&&x.text.trim().length>=GRADE_PROJECTS[grade].minimum);
        const latest=projects.at(-1)??null;
        return {submitted:!!latest,count:projects.length,latest,
            status:latest?'Draft submitted — not independently evaluated':'Applied assignment not submitted'};
    }
    function submitGradeProject(profile,grade,text){
        if(!profile)return {success:false,error:'Select a profile first'};
        if(!Number.isInteger(grade)||grade<0||grade>12)return {success:false,error:'Invalid grade'};
        const project=GRADE_PROJECTS[grade];
        if(typeof text!=='string'||text.trim().length<project.minimum||text.length>12000)
            return {success:false,error:`Write at least ${project.minimum} characters and no more than 12,000.`};
        const state=ensure(profile);const record={grade,text:text.trim(),time:Date.now()};
        state.gradeProjects.push(record);state.gradeProjects=state.gradeProjects.slice(-65);
        SaveManager.save();
        return {success:true,record};
    }
    function pathwayReport(profile){
        const grades=Array.from({length:13},(_,grade)=>({grade,...gradeStatus(profile,grade),
            goals:GRADE_GOALS[grade],project:gradeProjectStatus(profile,grade)}));
        const mastered=grades.filter(x=>x.complete).length;
        const submitted=grades.filter(x=>x.project.submitted).length;
        const complete=grades.every(x=>x.complete&&x.project.submitted);
        const next=grades.find(x=>!x.complete||!x.project.submitted)?.grade ?? null;
        return {grades,mastered,submitted,total:grades.length,next,complete,
            label:`${mastered}/13 cumulative grade checkpoints; ${submitted}/13 applied assignments recorded`+
                (complete?' — K–12 in-game pathway complete (unverified; independent evaluation required)':
                 ` — next academic focus: ${next===0?'Kindergarten':`Grade ${next}`}`)};
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
            key:a.key || MathEngine.questionKey(game.questions[i]),grade:Number.isInteger(game.questions[i]?.grade)?game.questions[i].grade:game.grade
        }));
        const session={time:Date.now(),mode:game.mode,answers};
        s.sessions.push(session);s.sessions=s.sessions.slice(-120);
        if(game.mode==='checkpoint'){
            const current=answers.filter(a=>a.grade===game.grade),review=answers.filter(a=>a.grade<game.grade);
            s.checkpoints.push({time:session.time,grade:game.grade,total:answers.length,correct:answers.filter(a=>a.correct).length,
                gradeTotal:current.length,gradeCorrect:current.filter(a=>a.correct).length,
                reviewTotal:review.length,reviewCorrect:review.filter(a=>a.correct).length,
                hinted:answers.filter(a=>a.hinted).length,
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
    return Object.freeze({TRACKS,DOMAINS,CAPSTONES,GRADE_GOALS,GRADE_PROJECTS,ensure,buildDiagnostic,buildCheckpoint,gradeStatus,
        gradeProjectStatus,submitGradeProject,pathwayReport,getDomainOf,recordGame,categorySummary,recommendations,addPortfolio});
})();
window.ReadinessLab=ReadinessLab;
