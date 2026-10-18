const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { URL, pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');

test('Electron registers persistent offline origin and restricts file access', async () => {
  let privileged = null;
  let handler;
  let openedUrl;
  const browserEvents = new Map();
  const electron = {
    protocol: {
      registerSchemesAsPrivileged(value) { privileged = value; },
      handle(scheme, callback) { assert.equal(scheme, 'mathquest'); handler = callback; }
    },
    net: { fetch(url) { openedUrl = url; return Promise.resolve(new Response('ok')); } },
    shell: { openExternal() {} },
    app: { whenReady() { return Promise.resolve(); }, on() {}, quit() {} },
    BrowserWindow: class {
      static getAllWindows() { return []; }
      constructor(options) {
        assert.equal(options.webPreferences.nodeIntegration, false);
        assert.equal(options.webPreferences.contextIsolation, true);
        assert.equal(options.webPreferences.sandbox, true);
        this.webContents = {
          setWindowOpenHandler() {},
          on(name, fn) { browserEvents.set(name, fn); }
        };
      }
      loadURL(url) { assert.equal(url, 'mathquest://game/index.html'); }
    }
  };
  const dependencies = { electron, 'node:path': path, 'node:url': require('node:url') };
  const source = fs.readFileSync(path.join(root, 'desktop/main.cjs'), 'utf8');
  const context = { require(name) { return dependencies[name]; }, __dirname: path.join(root, 'desktop'),
    console, process, URL, Response };
  vm.runInNewContext(source, context, { filename: 'desktop/main.cjs' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(privileged[0].scheme, 'mathquest');
  assert.equal(privileged[0].privileges.standard, true);
  assert.equal(privileged[0].privileges.secure, true);
  assert.equal(typeof handler, 'function');
  const fileResponse = await handler({ url: 'mathquest://game/js/main.js' });
  assert.equal(fileResponse.status, 200);
  assert.equal(openedUrl, pathToFileURL(path.join(root, 'www/js/main.js')).toString());
  assert.equal(handler({ url: 'mathquest://unknown/index.html' }).status, 404);
  let prevented = false;
  browserEvents.get('will-navigate')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});
