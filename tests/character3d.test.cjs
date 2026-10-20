const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const Character3D = require('../js/character3d.js');
const source = fs.readFileSync(path.join(root, 'js/character3d.js'), 'utf8');

function catalogue() {
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/save-manager.js'), 'utf8') +
    ';globalThis.items=SaveManager.CATALOGUE;', sandbox);
  return sandbox.items;
}

test('Every obtainable pet has a distinct authored 3D animal definition', () => {
  const all = catalogue().pets;
  assert.equal(all.length, 8);
  for (const p of all) {
    const shape = Character3D.getDefinition('pet', p.id);
    assert.ok(shape, `Missing 3D animal ${p.id}`);
    assert.equal(typeof shape.body, 'string');
    assert.ok(shape.ears);
    assert.ok(shape.tail);
    assert.equal(shape.name, p.name);
  }
  assert.equal(Character3D.getDefinition('pet', 'not-a-pet'), null);
});

test('Every obtainable avatar skin has a 3D outfit/body definition', () => {
  const c = catalogue();
  const all = [...c.regularSkins, ...c.legendarySkins];
  assert.equal(all.length, 16);
  for (const skin of all) {
    const shape = Character3D.getDefinition('avatar', skin.id);
    assert.ok(shape, `Missing 3D avatar ${skin.id}`);
    assert.ok(shape.model);
    assert.match(shape.skin, /^#[0-9a-f]{6}$/i);
    assert.match(shape.outfit, /^#[0-9a-f]{6}$/i);
  }
  assert.equal(Character3D.getDefinition('avatar', 'not-a-skin'), null);
});

test('3D implementation includes real geometry, perspective and GPU-free depth sorting', () => {
  for (const symbol of ['aPosition', 'aNormal', 'gl.drawElements',
      'perspective(.72', 'drawSoftwareMesh', 'softwareFaces.sort',
      'pointermove', 'prefers-reduced-motion']) {
    assert.ok(source.includes(symbol), `Missing 3D rendering requirement: ${symbol}`);
  }
  assert.equal(Character3D.activeCount, 0);
});

test('The real character renderer is loaded after pet state and before the UI', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  const a = html.indexOf('js/pet-manager.js');
  const b = html.indexOf('js/character3d.js');
  const c = html.indexOf('js/ui-manager.js');
  assert.ok(a >= 0 && a < b && b < c);
  for (const name of ['pet-model-stage', 'shop-model-stage', 'hub-avatar-stage', 'profile-model-stage', 'study-pet-stage']) {
    assert.ok(html.includes(`id="${name}"`), `${name} missing from game`);
  }
  assert.ok(sw.includes(`js/character3d.js?v=${require('../package.json').version}`));
});


test('Landing menu exposes real interactive 3D models and version-verified launcher', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'js/ui-manager.js'), 'utf8');
  assert.ok(html.includes('id="welcome-avatar-stage"'));
  assert.ok(html.includes('id="welcome-pet-stage"'));
  assert.ok(html.includes('YOUR ADVENTURE CREW'));
  assert.ok(ui.includes('this.renderMainMenu()'));
  const proc = spawnSync('bash', [path.join(root, 'launch-linux.sh'), '--check'], {encoding:'utf8'});
  assert.equal(proc.status, 0, proc.stderr);
  assert.ok(proc.stdout.includes(`Math Quest ${require('../package.json').version}`));
  assert.match(proc.stdout, /3D renderer: present/);
  assert.ok(proc.stdout.includes(root));
});

test('The 3.5 adventure home has its own offline stylesheet and working navigation', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'css/home.css'), 'utf8');
  const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'js/ui-manager.js'), 'utf8');
  assert.ok(html.includes('id="start-game"') && html.includes('id="profiles"') && html.includes('id="settings"'));
  assert.ok(html.includes('id="welcome-avatar-stage"') && html.includes('id="welcome-pet-stage"'));
  assert.ok(html.includes('YOUR MIND') && html.includes('IS THE <em>MAGIC.</em>'));
  assert.ok(html.includes(`css/home.css?v=${require('../package.json').version}`));
  assert.ok(worker.includes(`'./css/home.css?v=${require('../package.json').version}'`));
  assert.ok(css.includes('@media (max-width: 420px)'));
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(ui.includes("'Continue Your Quest'"));
});
