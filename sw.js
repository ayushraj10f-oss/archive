const CACHE_NAME = 'archive-v3';

// Minimal shell (DO NOT over-expand this)
const SHELL = [
  '/archive/',
  '/archive/index.html',
  '/archive/style.css',
  '/archive/manifest.json'
];

// INSTALL — cache only core shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ACTIVATE — remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// FETCH — correct separation of concerns
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only same-origin
  if (url.origin !== location.origin) return;

  // ✅ 1. Navigation requests (CRITICAL FIX)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then(res => res || caches.match('/archive/index.html'))
      )
    );
    return;
  }

  // ✅ 2. Images → cache-first
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;

        return fetch(req).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        });
      })
    );
    return;
  }

  // ✅ 3. Everything else → network-first (no history interference)
  event.respondWith(
    fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      return res;
    }).catch(() => caches.match(req))
  );
});