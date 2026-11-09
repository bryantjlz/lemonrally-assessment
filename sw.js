const CACHE_NAME = 'lemon-rally-assessment-v3';
// Do NOT cache config.json or app.js — always fetch fresh so changes take effect immediately
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never serve config.json or app.js from cache — always fetch live
  if (url.pathname.endsWith('config.json') || url.pathname.endsWith('app.js')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
