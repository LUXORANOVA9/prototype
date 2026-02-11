const CACHE_NAME = 'luxor9-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Only intercept requests to the same origin (app assets)
  // This ensures external API calls (Gemini, Google) are not interfered with by the SW
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached response if found, otherwise fetch from network
          return response || fetch(event.request);
        })
    );
  }
});