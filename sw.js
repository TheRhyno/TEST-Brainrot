const CACHE_NAME = 'brainrot-v3';
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


self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIF') {

    setTimeout(() => {
      self.registration.showNotification("Brainrot TCG", {
        body: "Ça fait 20 secondes ! Reviens tenter ta chance !",
        icon: "https://i.postimg.cc/fbKwpCBG/LOGO.png", // Ton logo
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
    clients.openWindow('/') // Ouvre ton jeu
  );
});
