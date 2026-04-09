const CACHE_NAME = 'brainrot-v13'; // Change la version ici pour forcer la mise à jour chez les joueurs
const ASSETS = [
  'index.html',
  'manifest.json'
];

// --- 1. INSTALLATION ---
self.addEventListener('install', (e) => {
  // Force le nouveau Service Worker à s'activer immédiatement
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
  // Permet au SW de prendre le contrôle des pages ouvertes tout de suite
  return self.clients.claim();
});

// --- 3. GESTION DES REQUÊTES ---
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

// --- 4. GESTION DES NOTIFICATIONS ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIF') {
    const { delay, title, body } = event.data;

    if (delay && title) {
      // event.waitUntil empêche le navigateur de tuer le SW trop vite
      event.waitUntil(
        new Promise((resolve) => {
          setTimeout(() => {
            self.registration.showNotification(title, {
              body: body || "",
              icon: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
              badge: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
              vibrate: [200, 100, 200]
            }).then(resolve);
          }, delay);
        })
      );
    }
  }
});

// --- 5. ACTION AU CLIC SUR NOTIFICATION ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si le jeu est déjà ouvert, on met le focus dessus
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Sinon on ouvre une nouvelle fenêtre
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
