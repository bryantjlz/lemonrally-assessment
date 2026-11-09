const CACHE_NAME = 'lemon-rally-assessment-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.json',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});
