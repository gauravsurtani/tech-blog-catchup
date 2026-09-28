// Only immutable build assets are cached. Never HTML, API, sessions, or audio.
const CACHE_NAME = "b2p-static-v3";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=="GET" || url.origin!==self.location.origin || !url.pathname.startsWith("/_next/static/"))return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached=await cache.match(request);if(cached)return cached;
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
  }));
});
