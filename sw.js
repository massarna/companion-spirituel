const CACHE_NAME = 'compagnon-spirituel-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

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
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Lato:wght@300;400;700&display=swap",
  "/manifest.json",
  "/bridge.js",
  "/storage.js",
  "/config.js",
  "/notification-system.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

const DYNAMIC_CACHE_PATTERNS = [
  '/data/lectures/',
  '/data/mois.json',
  '/data/special.json',
  '/data/retraite.json',
  '/data/programme.json'
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache statique créé');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Stratégie Cache First pour les fichiers statiques
  if (urlsToCache.some(path => request.url.includes(path))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stratégie Network First avec fallback cache pour les données dynamiques
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => request.url.includes(pattern))) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Stratégie Network First pour tout le reste
  event.respondWith(
    fetch(request).catch(() => {
      // Fallback vers la page principale si hors ligne
      if (request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});

// Cache First - Pour les fichiers statiques
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Erreur réseau:', error);
    throw error;
  }
}

// Network First avec fallback cache - Pour les données dynamiques
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Données mises en cache:', request.url);
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Utilisation du cache pour:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Nettoyage périodique du cache dynamique
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanDynamicCache();
  }
});

async function cleanDynamicCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
  const now = Date.now();

  for (const request of requests) {
    const response = await cache.match(request);
    const cachedTime = response.headers.get('sw-cache-time');

    if (cachedTime && (now - parseInt(cachedTime)) > maxAge) {
      await cache.delete(request);
      console.log('[SW] Cache expiré supprimé:', request.url);
    }
  }
}