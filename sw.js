// Version 1.0 | 8 MAR 2026 | Siam Palette Group
// BC Order — Service Worker (network-first, fallback cache)
const CACHE = 'spg-bc-v8';
const ASSETS = [
  '/spg-bc-order/',
  '/spg-bc-order/index.html',
  '/spg-bc-order/styles.css',
  '/spg-bc-order/app.js',
  '/spg-bc-order/screens.js',
  '/spg-bc-order/screens2.js',
  '/spg-bc-order/admin.js',
  '/spg-bc-order/admin2.js',
  '/spg-bc-order/icon-192.png',
  '/spg-bc-order/icon-512.png',
  '/spg-bc-order/apple-touch-icon.png',
  '/spg-bc-order/favicon.ico'
];

// Install — pre-cache core assets
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip API calls (Supabase) — always network
  if (e.request.url.includes('supabase') || e.request.url.includes('functions')) return;
  // Skip non-GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Update cache with fresh response
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
