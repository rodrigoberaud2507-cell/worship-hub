importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const CACHE_VERSION = 'v1';

// Precaching de archivos esenciales
workbox.precaching.precacheAndRoute([
  { url: '/', revision: CACHE_VERSION },
  { url: '/index.html', revision: CACHE_VERSION },
  { url: '/css/style.css', revision: CACHE_VERSION },
  { url: '/js/app.js', revision: CACHE_VERSION },
  { url: '/js/ui.js', revision: CACHE_VERSION },
  { url: '/js/airtable.js', revision: CACHE_VERSION },
  { url: '/js/db.js', revision: CACHE_VERSION },
  { url: '/js/sync.js', revision: CACHE_VERSION },
  { url: '/manifest.json', revision: CACHE_VERSION }
]);

// Estrategia: Network First para API (datos frescos cuando hay conexión)
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-data',
    networkTimeoutSeconds: 5,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 3600 // 1 hora
      })
    ]
  })
);

// Estrategia: Cache First para imágenes y estilos
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'style',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 604800 // 1 semana
      })
    ]
  })
);

// Estrategia: Stale While Revalidate para el resto
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'js-cache'
  })
);

// Mensaje cuando hay actualización disponible
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
