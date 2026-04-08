const CACHE_NAME = 'brainrot-v6';
const ASSETS = [
  'index.html',
  'manifest.json'
];

// Installation du service worker
self.addEventListener('install', (e) => {
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
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Gestion des requêtes
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

// Notifications (Uniquement sur commande précise désormais)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIF') {
    
    // On récupère uniquement ce qui est envoyé, pas de texte automatique "20s"
    const delai = event.data.delay;
    const titre = event.data.title;
    const message = event.data.body;

    // On ne lance la notification que si on a au moins un titre et un délai
    if (delai && titre) {
      setTimeout(() => {
        self.registration.showNotification(titre, {
          body: message || "",
          icon: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
          badge: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
          vibrate: [200, 100, 200]
        });
      }, delai);
    }
  }
});

// Action quand on clique sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope);
      }
    })
  );
});
