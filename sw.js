importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Precaching de los archivos principales
workbox.precaching.precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/index.html', revision: '1' },
  { url: '/css/style.css', revision: '1' },
  { url: '/js/app.js', revision: '1' },
  { url: '/manifest.json', revision: '1' }
]);

// Cache primero para imágenes
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({ cacheName: 'images' })
);

// NetworkFirst para API (datos)
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxAgeSeconds: 3600 })]
  })
);
