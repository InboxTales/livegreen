// Bump this version on every deploy-shape change to purge old caches.
const CACHE_NAME = 'lgh-cache-v2';
const OFFLINE_SHELL = '/index.html';

// Install — precache the app shell.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(['/', OFFLINE_SHELL, '/manifest.json']))
    );
    self.skipWaiting();
});

// Activate — drop old caches.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Skip non-GET and API calls entirely.
    if (req.method !== 'GET' || req.url.includes('/api/')) return;

    const url = new URL(req.url);
    // Only handle same-origin requests.
    if (url.origin !== self.location.origin) return;

    // HTML navigations: ALWAYS network-first so the served index.html references
    // the current (hashed) JS/CSS chunks. Stale HTML pointing at deleted chunks
    // is what produced blank pages after a deploy. Fall back to cached shell only
    // when offline.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then(res => {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(OFFLINE_SHELL, clone));
                    return res;
                })
                .catch(() => caches.match(OFFLINE_SHELL).then(r => r || caches.match('/')))
        );
        return;
    }

    // Hashed build assets are immutable — cache-first for speed.
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.match(req).then(cached => cached || fetch(req).then(res => {
                if (res.status === 200) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, clone));
                }
                return res;
            }))
        );
        return;
    }

    // Everything else (images, fonts, etc.): network-first, fallback to cache.
    event.respondWith(
        fetch(req)
            .then(res => {
                if (res.status === 200) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, clone));
                }
                return res;
            })
            .catch(() => caches.match(req))
    );
});

// Allow the page to trigger an immediate SW takeover after an update.
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || { title: 'Live Green Honey', body: 'You have a new update!' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/favicon.png',
            badge: '/favicon.png',
            vibrate: [100, 50, 100],
        })
    );
});
