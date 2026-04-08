const CACHE_NAME = 'brainrot-v5'; // Passe en v5 pour que le changement soit pris en compte
const ASSETS = [
  'index.html',
  'manifest.json'
];

// Installation du service worker
self.addEventListener('install', (e) => {
  // FORCE LA MISE À JOUR : Le nouveau SW s'installe sans attendre
  self.skipWaiting(); 
  
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activation : NETTOYAGE DES ANCIENS CACHES
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Si le cache trouvé n'est pas celui qu'on vient de définir, on le supprime
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prend le contrôle des pages immédiatement
  );
});

// Gestion des requêtes
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

// Notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIF') {
    setTimeout(() => {
      self.registration.showNotification("Brainrot TCG", {
        body: "Ça fait 20 secondes ! Reviens tenter ta chance !",
        icon: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
        badge: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
        vibrate: [200, 100, 200]
      });
    }, 20000);
  }
});

// Action quand on clique sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    // On cherche si une fenêtre du jeu est déjà ouverte
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si oui, on remet juste le focus dessus au lieu d'en ouvrir une nouvelle
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Si aucune fenêtre n'est ouverte, on ouvre l'URL précise du jeu (le scope)
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope);
      }
    })
  );
});
