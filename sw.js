const CACHE_NAME = 'archive-v1';

// Core shell files that must be cached on install
const SHELL = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/essays/essay-001.html',
  '/essays/essay-002.html',
  '/essays/essay-003.html',
  '/essays/essay-004.html',
  '/essays/essay-005.html',
  '/reviews/movie-001.html',
  '/reviews/movie-002.html',
  '/notes/historiography.html',
  '/notes/personal.html',
  '/posters/index.html',
  '/ideology/index.html',
  '/ideology/AjitDoval/index.html',
  '/ideology/LKY/index.html',
  '/ideology/savarkar/index.html',
  '/taste/index.html',
  '/form/index.html',
];

// Install: cache the shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate: delete old caches
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

// Fetch: network first, fall back to cache
// Images use cache-first (they rarely change and are large)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(url.pathname);

  if (isImage) {
    // Cache-first for images
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  } else {
    // Network-first for HTML/CSS (so updates propagate)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
