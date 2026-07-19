/* VOLTFIELD service worker — offline-first app shell.
   Bump VERSION whenever you redeploy changed files so clients update. */
const VERSION = 'voltfield-v7';

const CORE = [
  './',
  './index.html',
  './voltfield-supply-catalog.html',
  './voltfield-suppliers.html',
  './voltfield-bom.html',
  './voltfield-bom-generator.html',
  './voltfield-insights.html',
  './voltfield-part.html',
  './voltfield-rfq.html',
  './voltfield-account.html',
  './voltfield-eol.html',
  './voltfield-pcb.html',
  './voltfield-eol-data.js',
  './privacy-policy.html',
  './404.html',
  './voltfield-catalog-data.js',
  './voltfield-bom-engine.js',
  './voltfield-site-config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  /* tolerant precache: one missing file must not brick the whole install */
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(results => {
        const failed = results.filter(r => r.status === 'rejected').length;
        if (failed) console.warn('[sw] precache: ' + failed + ' of ' + CORE.length + ' files failed; continuing');
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* never intercept ad-network traffic or auth endpoints */
  if (/googlesyndication|doubleclick|adsbygoogle/.test(url.host)) return;
  if (url.pathname.startsWith('/.auth/')) return;

  /* HTML pages: network-first (so deployed updates show), cache fallback for offline */
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
          return r;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true })
            .then(r => r || caches.match('./index.html'))
        )
    );
    return;
  }

  /* same-origin assets: cache-first (catalog data is big — serve instantly once cached) */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        const copy = r.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return r;
      }))
    );
    return;
  }

  /* cross-origin (Google Fonts): stale-while-revalidate */
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(r => {
          const copy = r.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
          return r;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
