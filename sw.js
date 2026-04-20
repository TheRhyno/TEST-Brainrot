const CACHE_NAME = 'brainrot-v49';
const ASSETS = [
  'index.html',
  'manifest.json'
];

// --- 1. INSTALLATION ---
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// --- 2. ACTIVATION (Nettoyage des anciens caches) ---
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Ancien cache supprimé :", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// --- 3. GESTION DES REQUÊTES (Stratégie Network First pour l'installabilité) ---
self.addEventListener('fetch', (e) => {
  e.respondWith(
    // On essaie d'abord de récupérer le fichier sur Internet (Réseau)
    fetch(e.request).catch(() => {
      // Si on est hors ligne, on utilise le cache
      return caches.match(e.request);
    })
  );
});
