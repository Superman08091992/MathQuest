/* Cache Math Quest's own static game files; offline play, no account or network. */
const CACHE_NAME = 'math-quest-v3.5.1';
const PRECACHE = [
    './', './index.html', './manifest.webmanifest',
    './css/style.css?v=3.5.1', './css/icons.css?v=3.5.1', './css/home.css?v=3.5.1', './css/hub.css?v=3.5.1',
    './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
    './js/utils.js?v=3.5.1', './js/question-templates.js?v=3.5.1', './js/question-templates-advanced.js?v=3.5.1',
    './js/question-templates-extended-fixed.js?v=3.5.1', './js/college-curriculum.js?v=3.5.1', './js/college-procedural.js?v=3.5.1', './js/question-catalogue.js?v=3.5.1', './js/math-engine.js?v=3.5.1',
    './js/readiness-lab.js?v=3.5.1', './js/save-manager.js?v=3.5.1', './js/audio.js?v=3.5.1', './js/profile-system.js?v=3.5.1',
    './js/progression-system.js?v=3.5.1', './js/reward-system.js?v=3.5.1', './js/shop-system.js?v=3.5.1',
    './js/pet-manager.js?v=3.5.1', './js/character3d.js?v=3.5.1', './js/game-manager.js?v=3.5.1', './js/ui-manager.js?v=3.5.1',
    './js/main.js?v=3.5.1', './js/pwa.js?v=3.5.1'
];
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
        .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith('math-quest-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    // Never cache cross-origin requests.
    if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
        return;
    }
    event.respondWith(caches.match(event.request)
        .then(cached => cached || fetch(event.request)));
});
