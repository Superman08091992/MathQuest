/** Inspect actual K–12 registries, outcome statements and assignments.
 * This is a content inventory, NOT accreditation, pedagogy assessment or proof of mastery.
 */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:null,Math,console};context.window=context;
vm.createContext(context);
for(const name of ['utils','question-templates','question-templates-advanced','question-templates-extended-fixed',
  'college-curriculum','college-procedural','question-catalogue','math-engine','readiness-lab']){
  vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),context,{filename:name+'.js'});
}
const {QuestionCatalogue,ReadinessLab}=context;
const gradeMap=[];
for(let grade=0;grade<=12;grade++){
  const definitions=QuestionCatalogue.getQuestionsForGrade(grade);
  const categories=Object.fromEntries([...new Set(definitions.map(t=>t.category))].sort().map(category=>{
    const items=definitions.filter(t=>t.category===category);
    return [category,{definitions:items.length,procedural:items.filter(t=>!t.isFixed).length,
      fixed:items.filter(t=>t.isFixed).length,
      skills:[...new Set(items.map(t=>t.skill||t.type))].sort()}];
  }));
  const work=ReadinessLab.GRADE_PROJECTS[grade];
  gradeMap.push({grade,displayName:grade===0?'Kindergarten':`Grade ${grade}`,
    subjectCount:Object.keys(categories).length,definitionCount:definitions.length,
    goals:[...ReadinessLab.GRADE_GOALS[grade]],
    appliedAssignment:{title:work.title,prompt:work.prompt,minimumCharacters:work.minimum,rubric:[...work.rubric]},
    categories,underrepresentedSubjects:Object.entries(categories).filter(([_,c])=>c.definitions<3).map(([k])=>k)});
}
const output={version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,
  evidenceType:'Actual registered subject types and drafted learning outcomes',
  limitations:'The counts are templates, not vetted unique lessons, independently validated skills or curriculum standards. Small banks are marked underrepresented. Project submissions are not automatically graded.',
  assessmentContract:{checkpointPasses:2,daysBetween:7,overallMinimum:0.90,currentGradeMinimum:0.90,
    earlierGradeMinimum:0.75,minimumCurrentQuestions:20,earlierGradeReviewQuestions:8,
    minimumSubjects:6,appliedProjectRequired:true,independentlyGraded:false},
  grades:gradeMap};
process.stdout.write(JSON.stringify(output,null,2)+'\n');
