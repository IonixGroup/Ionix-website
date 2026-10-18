// Service worker minimo: serve solo a far riconoscere l'app come
// installabile da Chrome/Android (richiede un fetch handler registrato).
// Non fa caching, quindi l'app resta "online-only" come oggi.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
