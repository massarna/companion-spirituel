const CACHE_NAME = 'compagnon-spirituel-v1';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js',
  'https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/fr.js',
  'https://cdn.jsdelivr.net/npm/moment-hijri@2.1.2/moment-hijri.min.js',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lato:wght@300;400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
