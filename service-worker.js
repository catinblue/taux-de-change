// FX Weather Service Worker
// Strategy:
//   same-origin assets (HTML/SVG/JSON) → cache-first (offline-ready app shell)
//   api.exchangerate-api.com         → network-first with cache fallback (graceful offline)
//   everything else                  → passthrough (no interception)

const CACHE = 'fx-weather-v28';

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
