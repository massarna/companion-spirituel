
const CACHE_NAME = "compagnon-spirituel-v16";
const urlsToCache = [
  "/",
  "/index.html",
  "/data/lectures/manifest.json",
  "/data/lectures/surah-1-al-fatiha.ar.json",
  "/data/lectures/surah-18-al-kahf.ar.json",
  "/data/lectures/surah-36-yasin.ar.json",
  "/data/lectures/surah-44-dukhan.ar.json",
  "/data/lectures/surah-56-waqiah.ar.json",
  "/data/lectures/surah-67-mulk.ar.json",
  "/data/lectures/surah-76-insan.ar.json",
  "/data/lectures/surah-85-buruj.ar.json",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js",
  "https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/fr.js",
  "https://cdn.jsdelivr.net/npm/moment-hijri@2.1.2/moment-hijri.min.js",
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Mise en cache des ressources');
        return cache.addAll(urlsToCache.map(url => {
          if (url.startsWith('http')) {
            return new Request(url, { mode: 'cors' });
          }
          return url;
        }));
      })
      .catch((error) => {
        console.error('[SW] Erreur de mise en cache:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Firebase requests for real-time functionality
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('[SW] Depuis cache:', event.request.url);
          return response;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If offline and no cache, return a basic offline page
          if (event.request.destination === 'document') {
            return new Response(
              '<html><body><h1>Application hors ligne</h1><p>Veuillez vérifier votre connexion.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
