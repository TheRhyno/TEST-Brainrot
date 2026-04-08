const CACHE_NAME = 'brainrot-v2';
const ASSETS = [
  'index.html',
  'manifest.json'
];

// Installation du service worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Gestion des requêtes
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
