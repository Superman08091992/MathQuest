/* Cache Math Quest's own static game files; offline play, no account or network. */
const CACHE_NAME = 'math-quest-v3.0.0';
const PRECACHE = [
    './', './index.html', './manifest.webmanifest',
    './css/style.css?v=3.0.0', './css/icons.css?v=3.0.0',
    './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
    './js/utils.js?v=3.0.0', './js/question-templates.js?v=3.0.0', './js/question-templates-advanced.js?v=3.0.0',
    './js/question-templates-extended-fixed.js?v=3.0.0', './js/college-curriculum.js?v=3.0.0', './js/college-procedural.js?v=3.0.0', './js/question-catalogue.js?v=3.0.0', './js/math-engine.js?v=3.0.0',
    './js/readiness-lab.js?v=3.0.0', './js/save-manager.js?v=3.0.0', './js/audio.js?v=3.0.0', './js/profile-system.js?v=3.0.0',
    './js/progression-system.js?v=3.0.0', './js/reward-system.js?v=3.0.0', './js/shop-system.js?v=3.0.0',
    './js/pet-manager.js?v=3.0.0', './js/game-manager.js?v=3.0.0', './js/ui-manager.js?v=3.0.0',
    './js/main.js?v=3.0.0', './js/pwa.js?v=3.0.0'
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
