const CACHE_NAME = 'archive-final-v1';

// Install
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate (clear ALL old caches)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — SAFE navigation handling
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => fetch('/archive/index.html'))
    );
  }
});