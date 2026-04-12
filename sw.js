// --- CONFIGURATION FIREBASE (Nécessaire pour le réveil à distance) ---
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD4H_pdAZSLrixwH-1NDRpEd537X-Gnvik",
  authDomain: "brainrot-tcg-6d0ae.firebaseapp.com",
  projectId: "brainrot-tcg-6d0ae",
  messagingSenderId: "622979343428",
  appId: "1:622979343428:web:b8499811ce8379b0f84811"
});

const messaging = firebase.messaging();

// --- 1. INSTALLATION ---
const CACHE_NAME = 'brainrot-v30';
const ASSETS = [
  'index.html',
  'manifest.json'
];

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

// --- 3. GESTION DES REQUÊTES ---
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});

// --- 4. GESTION DES NOTIFICATIONS (ANCIENNE MÉTHODE LOCALE) ---
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIF') {
        const { timestamp, title, body } = event.data;
        if ('showTrigger' in Notification.prototype) {
            event.waitUntil(
                self.registration.showNotification(title, {
                    body: body || "",
                    icon: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
                    badge: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
                    tag: "lucky-block-notif",
                    showTrigger: new TimestampTrigger(timestamp)
                })
            );
        } else {
            console.warn("L'API NotificationTrigger n'est pas supportée.");
        }
    }
});

// --- 4.1 GESTION DES NOTIFICATIONS (NOUVELLE MÉTHODE FIREBASE / PUSH) ---
// C'est ce bloc qui recevra le message envoyé par ton serveur ou la console Firebase
messaging.onBackgroundMessage((payload) => {
  console.log("Message reçu de Firebase en arrière-plan :", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
    badge: "https://i.postimg.cc/fbKwpCBG/LOGO.png",
    tag: "lucky-block-notif"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- 5. ACTION AU CLIC SUR NOTIFICATION ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
