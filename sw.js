
// Service Worker désactivé pour éviter les conflits
console.log('Service Worker désactivé');

// Désinstaller le service worker s'il existe
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Laisser passer toutes les requêtes sans interférence
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes
  return;
});
