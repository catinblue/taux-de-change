// FX Weather Service Worker
// Strategy:
//   same-origin /api/*               → passthrough (dynamic; never cache geo/LLM)
//   other same-origin assets         → cache-first (offline-ready app shell)
//   api.exchangerate-api.com         → network-first with cache fallback
//   everything else                  → passthrough

const CACHE = 'fx-weather-v39';

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(Promise.all([
        self.clients.claim(),
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE).map(k => caches.delete(k))
        ))
    ]));
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);

    if (url.origin === self.location.origin) {
        // Vercel Serverless endpoints must hit the network every time — caching
        // a Geo response would pin the banner to an old city for offline reopens.
        if (url.pathname.startsWith('/api/')) return;
        e.respondWith(cacheFirst(e.request));
    } else if (url.hostname === 'api.exchangerate-api.com') {
        e.respondWith(networkFirst(e.request));
    }
});

function cacheFirst(request) {
    return caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) putInCache(request, response.clone());
        return response;
    }));
}

function networkFirst(request) {
    return fetch(request).then(response => {
        if (response.ok) putInCache(request, response.clone());
        return response;
    }).catch(() => caches.match(request));
}

function putInCache(request, response) {
    caches.open(CACHE).then(cache => cache.put(request, response));
}
