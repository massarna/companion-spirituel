// Service Worker - Compagnon Spirituel v21
const CACHE_NAME = 'compagnon-spirituel-v21';

// Assets à pré-cacher
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './data/lectures/manifest.json',
  './data/lectures/surah-1-al-fatiha.ar.json',
  './data/lectures/surah-18-al-kahf.ar.json',
  './data/lectures/surah-32-as-sajda.ar.json',
  './data/lectures/surah-36-yasin.ar.json',
  './data/lectures/surah-44-dukhan.ar.json',
  './data/lectures/surah-56-waqiah.ar.json',
  './data/lectures/surah-67-mulk.ar.json',
  './data/lectures/surah-76-insan.ar.json',
  './data/lectures/surah-85-buruj.ar.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pour les JSON de lectures, autoriser no-store
  if (url.pathname.includes('/data/lectures/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-then-network pour le reste
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});