/* Service Worker — caches the splash page and icons so the gateway
   loads instantly even on slow connections. The config.json is always
   fetched fresh (no caching) so the redirect always uses the latest URL. */
var CACHE = 'gescom-gateway-v1';
var PRECACHE = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './manifest.json'
];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  /* Always fetch config.json fresh — never serve from cache */
  if (e.request.url.indexOf('config.json') !== -1) return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request);
    })
  );
});
