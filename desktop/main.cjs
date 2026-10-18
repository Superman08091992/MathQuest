/* Native Electron wrapper for the same Math Quest web build. */
const { app, BrowserWindow, shell, protocol, net } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Give the packaged game a normal, persistent origin for browser storage.
// Register this before Electron's `ready` event.
protocol.registerSchemesAsPrivileged([{
  scheme: 'mathquest',
  privileges: { standard: true, secure: true, supportFetchAPI: true }
}]);

const gameRoot = path.resolve(__dirname, '../www');

function registerGameProtocol() {
  protocol.handle('mathquest', request => {
    let url;
    try { url = new URL(request.url); } catch { return new Response('Bad request', { status: 400 }); }
    if (url.host !== 'game') return new Response('Not found', { status: 404 });

    // Only serve files from the bundled game folder; block path traversal.
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return new Response('Bad request', { status: 400 }); }
    const target = path.resolve(gameRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(gameRoot, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return new Response('Forbidden', { status: 403 });
    }
    return net.fetch(pathToFileURL(target).toString());
  });
}

function createWindow() {
  const gameWindow = new BrowserWindow({
    width: 1100,
    height: 850,
    minWidth: 360,
    minHeight: 580,
    backgroundColor: '#1a1a2e',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  gameWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  gameWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  gameWindow.loadURL('mathquest://game/index.html');
}

app.whenReady().then(() => {
  registerGameProtocol();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
