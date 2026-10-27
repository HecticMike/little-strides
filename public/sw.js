const CACHE = 'little-strides-__CACHE_ID__';
const ASSETS = /*__ASSETS__*/[];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  // Do not replace a worker while an active workout may be using its assets.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('little-strides-') && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const request = event.request.mode === 'navigate' ? new URL('./index.html', self.registration.scope).href : event.request;
    // Only our own fixed build assets enter this cache. Their bytes do not vary
    // by Origin, even when the static server adds Vary: Origin for module loads.
    return await cache.match(request, { ignoreVary: true }) || fetch(event.request);
  })());
});
