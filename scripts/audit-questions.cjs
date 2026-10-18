/** Reproducible empirical question-coverage census. No npm packages needed.
 * Warning: Samples count observed distinct prompts, not the theoretically
 * possible finite/unbounded space and not guaranteed curriculum accuracy. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
let seed=0x20241017;
function random(){ seed+=0x6D2B79F5;let x=seed;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296; }
const randomMath=Object.create(Math);randomMath.random=random;
const context={window:null,Math:randomMath,console};context.window=context;
vm.createContext(context);
for(const name of ['utils','question-templates','question-templates-advanced','question-templates-extended-fixed','college-curriculum','college-procedural','question-catalogue','math-engine']) {
  vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),context,{filename:name+'.js'});
}
const {MathEngine,QuestionCatalogue,QuestionTemplatesAdvanced,CollegeCurriculum,CollegeProcedural}=context;
const grades=[];
for(let grade=0;grade<=12;grade++) {
  MathEngine.init(grade,'all');
  const templates=MathEngine.getAvailableTemplates();
  const seen=new Set();
  for(let i=0;i<5000;i++){
    const q=MathEngine.generateQuestion();
    seen.add(JSON.stringify([q.grade,q.category,q.text,q.visual||'',q.answer]));
  }
  grades.push({grade,templateCount:templates.length,proceduralTypes:templates.filter(t=>!t.isFixed).length,
    fixedTypes:templates.filter(t=>t.isFixed).length,categories:[...new Set(templates.map(t=>t.category))].sort(),
    sampled:5000,distinctObserved:seen.size});
}
const audit={version:'3.1.0',method:'Seeded independent sampling: 5000 generated questions per grade (65000 total)',
  caution:'Distinct observed is only a sampling lower bound, not total available questions or a proof of mathematical/curricular correctness.',
  originalProceduralTemplates:29,addedProceduralTemplates:QuestionTemplatesAdvanced.count, collegeProceduralTemplates:CollegeProcedural.count, newFixedQuestions:CollegeCurriculum.count,
  curatedFixedQuestions:QuestionCatalogue.staticCount,
  distinctTemplateDefinitions:29+QuestionTemplatesAdvanced.count+CollegeProcedural.count+QuestionCatalogue.staticCount,
  samples:65000,distinctObservedAcrossGrades:grades.reduce((n,g)=>n+g.distinctObserved,0),grades};
process.stdout.write(JSON.stringify(audit,null,2)+'\n');
