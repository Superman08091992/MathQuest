const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const read=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');

test('real player World Hub is visually integrated and offline',()=>{
  const html=read('index.html');
  const css=read('css/hub.css');
  const sw=read('service-worker.js');
  for(const id of ['world-hub','hub-continue','hub-next-grade','hub-avatar-stage','hub-pet-stage',
      'hub-companion-action','grade-grid','hub-pathway-progress','pet-room-btn','shop-btn',
      'achievements-btn','stats-btn','college-lab-btn','switch-profile-btn']) {
    assert.ok(html.includes(`id="${id}"`), `Missing operational home component ${id}`);
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`Duplicate id ${id}`);
  }
  assert.ok(html.includes('css/hub.css?v='));
  assert.ok(sw.includes("'./css/hub.css?v="));
  assert.ok(css.includes('.hub-diorama') && css.includes('.hub-world-card'));
  assert.ok(css.includes('@media (max-width: 540px)'));
  assert.ok(css.includes('prefers-reduced-motion'));
});

test('player World Hub grade actions, pet ownership and launcher are source-backed',()=>{
  const ui=read('js/ui-manager.js');
  assert.ok(ui.includes('openGrade(grade)'));
  assert.ok(ui.includes('ProfileSystem.isGradeUnlocked(grade)'));
  assert.ok(ui.includes('MathEngine.setCategory(\'all\')'));
  assert.ok(ui.includes('PetManager.getCurrentPet()'));
  assert.ok(ui.includes('Character3D.render(document.getElementById(\'hub-pet-stage\')'));
  assert.ok(ui.includes("get('screen') === 'world-hub'"));
  const res=spawnSync('bash',[path.join(root,'launch-linux.sh'),'--check'],{encoding:'utf8'});
  assert.equal(res.status,0,res.stderr);
  assert.match(res.stdout,/Player home: World Hub 3\.5 verified in source/);
  assert.match(res.stdout,/Math Quest 3\.5\.0/);
});
