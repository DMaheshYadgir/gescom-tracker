/* Service Worker — caches splash page, icons, AND config.json
   so the gateway works offline after first visit. */
var CACHE = 'gescom-gateway-v2';
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
  var url = e.request.url;

  /* config.json — network first, fall back to cache.
     This means the gateway can redirect offline using the last known URL. */
  if (url.indexOf('config.json') !== -1) {
    e.respondWith(
      fetch(e.request.url.split('?')[0] + '?v=' + Date.now())
        .then(function(response) {
          var cloned = response.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request.url.split('?')[0], cloned); });
          return response;
        })
        .catch(function() {
          return caches.match(e.request.url.split('?')[0]) ||
                 caches.match('./config.json');
        })
    );
    return;
  }

  /* Everything else — cache first */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request);
    })
  );
});
