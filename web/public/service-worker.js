const CLEANUP_CACHE_PREFIX = 'fan-global-2026-cleanup';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

      const windows = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      for (const client of windows) {
        client.navigate(client.url);
      }

      await self.registration.unregister();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === CLEANUP_CACHE_PREFIX) {
    self.registration.unregister();
  }
});
