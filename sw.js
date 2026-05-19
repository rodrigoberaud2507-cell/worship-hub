importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([
  { url: '/', revision: 'v2' },
  { url: '/index.html', revision: 'v2' },
  { url: '/css/style.css', revision: 'v2' },
  { url: '/js/app.js', revision: 'v2' },
  { url: '/manifest.json', revision: 'v2' }
]);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({ cacheName: 'api-data', networkTimeoutSeconds: 5 })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'style',
  new workbox.strategies.CacheFirst({ cacheName: 'static-assets' })
);
