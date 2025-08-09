<!-- ======================================================================= -->
<!-- FICHIER 3 : sw.js (Service Worker, à sauvegarder dans le même dossier) -->
<!-- ======================================================================= -->
```javascript
const CACHE_NAME = 'compagnon-spirituel-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  '[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)',
  '[https://cdn.jsdelivr.net/npm/chart.js](https://cdn.jsdelivr.net/npm/chart.js)',
  '[https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js](https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js)',
  '[https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/fr.js](https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/fr.js)',
  '[https://cdn.jsdelivr.net/npm/moment-hijri@2.1.2/moment-hijri.min.js](https://cdn.jsdelivr.net/npm/moment-hijri@2.1.2/moment-hijri.min.js)',
  '[https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lato:wght@300;400;700&display=swap](https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lato:wght@300;400;700&display=swap)'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
