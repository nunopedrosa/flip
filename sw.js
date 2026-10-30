/* Service worker release constants — keep in sync with version.js */
var APP_VERSION = '1.1.0';
var RELEASE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './engine.js',
  './i18n.js',
  './storage.js',
  './pwa-client.js',
  './version.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './assets/flag-en.svg',
  './assets/flag-pt.svg',
  './assets/icons.svg',
  './sw.js',
];

var RUNNING = 'laura-flipbook-running-' + APP_VERSION;
var PENDING = 'laura-flipbook-pending-' + APP_VERSION;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(PENDING).then(function (cache) {
      return cache.addAll(RELEASE_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    }),
  );
});

function allCached(cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return Promise.all(RELEASE_ASSETS.map(function (url) {
      return cache.match(url);
    })).then(function (matches) {
      return matches.every(Boolean);
    });
  });
}

function broadcast(message) {
  return self.clients.matchAll({ includeUncontrolled: true }).then(function (clients) {
    clients.forEach(function (client) {
      client.postMessage(message);
    });
  });
}

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('laura-flipbook-') === 0 && k !== RUNNING && k !== PENDING;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return allCached(PENDING);
    }).then(function (pendingReady) {
      if (!pendingReady) return caches.delete(PENDING);
      return caches.has(RUNNING).then(function (hasRunning) {
        if (hasRunning) {
          return broadcast({ type: 'UPDATE_READY' });
        }
        return caches.open(RUNNING).then(function (running) {
          return running.addAll(RELEASE_ASSETS);
        }).then(function () {
          return caches.delete(PENDING);
        }).then(function () {
          return broadcast({ type: 'OFFLINE_READY' });
        });
      });
    }).then(function () {
      return self.clients.claim();
    }),
  );
});

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    allCached(PENDING).then(function (ready) {
      if (!ready) return;
      return caches.open(RUNNING).then(function (running) {
        return running.addAll(RELEASE_ASSETS);
      }).then(function () {
        return caches.delete(PENDING);
      }).then(function () {
        return self.skipWaiting();
      });
    });
  }
  if (data.type === 'VERIFY_OFFLINE') {
    allCached(RUNNING).then(function (ready) {
      if (ready) broadcast({ type: 'OFFLINE_READY' });
    });
  }
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(RUNNING).then(function (running) {
      return running.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response && response.status === 200 && url.pathname.indexOf('.') >= 0) {
            running.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(function () {
      return fetch(event.request);
    }),
  );
});
