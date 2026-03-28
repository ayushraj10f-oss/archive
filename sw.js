const CACHE_NAME = 'archive-v2';

// INSTALL — no heavy pre-caching
self.addEventListener('install', event => {
  self.skipWaiting();
});

// ACTIVATE — clean old caches
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

// FETCH STRATEGY
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(url.pathname);

  if (isImage) {
    // 🟢 CACHE-FIRST (fast, stable)
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
    // 🔵 NETWORK-FIRST (always get latest updates)
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
