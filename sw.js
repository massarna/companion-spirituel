
const CACHE_NAME = 'compagnon-spirituel-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/bridge.js',
  '/storage.js',
  '/notification-system.js',
  '/config.js',
  '/firebase.js',
  '/data/mois.json',
  '/data/special.json',
  '/data/lectures/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    });
  }
});
