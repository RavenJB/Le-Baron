const CACHE_NAME = 'le-baron-shell-v1';
const BASE_URL = new URL(self.registration.scope);
const OFFLINE_URL = new URL('offline.html', BASE_URL).href;
const SHELL = [
  BASE_URL.href,
  OFFLINE_URL,
  new URL('manifest.webmanifest', BASE_URL).href,
  new URL('pwa-icon.svg', BASE_URL).href,
  new URL('favicon.svg', BASE_URL).href,
  new URL('data/projects.json', BASE_URL).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('le-baron-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(BASE_URL.href)) || caches.match(OFFLINE_URL)));
    return;
  }
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  }).catch(async () => (await caches.match(request)) || Response.error()));
});
