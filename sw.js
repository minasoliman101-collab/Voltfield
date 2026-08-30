/* VOLTFIELD service worker — offline-first app shell.
   Same-origin assets use stale-while-revalidate (see fetch handler below),
   so a forgotten VERSION bump self-heals within one extra page load instead
   of serving a stale file indefinitely. Still bump VERSION for an instant,
   forced cache-wide reset (e.g. an urgent fix) — activate() below wipes
   every cache bucket that doesn't match it. */
/* v93: the repositioning and personality pass. Same reason as the v92 bump --
   stale-while-revalidate normally degrades gracefully (one load of slightly
   old JS), but when a change moves the visual system inside
   voltfield-core.css, a returning visitor gets the new pages painted with the
   old stylesheet for one full load, which reads as a broken page rather than
   a stale one. Bump VERSION on any change to core.css or the shared nav:
   activate() wipes every non-matching bucket, so nobody sees the half-state. */
const VERSION = 'voltfield-v96';

const CORE = [
  './',
  './index.html',
  './guides.html',
  './voltfield-supply-catalog.html',
  './voltfield-suppliers.html',
  './voltfield-bom-generator.html',
  './voltfield-sandbox.html',
  './voltfield-pod-designer.html',
  './voltfield-rack-builder.html',
  /* Shape library for the 3D views in the three practice tools. Three.js is
     now served from this origin too (vendor/three/), but it is 1.2 MB and only
     the 3D pages need it, so it is left to the runtime cache rather than
     precached -- same reasoning as the data files below. */
  './voltfield-3d.js',
  './voltfield-progress.js',
  './voltfield-component-viz.js',
  './voltfield-component-viz.css',
  './voltfield-pcb-layout.html',
  './voltfield-core.css',
  './voltfield-parts.css',
  './voltfield-insights.html',
  './voltfield-part.html',
  './voltfield-eol.html',
  './voltfield-pcb.html',
  './voltfield-identify.html',
  './voltfield-eol-data.js',
  './privacy-policy.html',
  './404.html',
  /* The big data files are deliberately NOT precached.

     voltfield-catalog-data.js (96 KB), voltfield-bom-engine.js (73 KB) and
     voltfield-cat-icons.js (45 KB) are 214 KB that every first-time visitor
     was downloading in the background regardless of where they landed -- and
     only five pages load any of them (the catalog, part, BOM generator,
     identify and insights pages). Nobody arriving on a guide or a calculator
     needs a byte of it.

     They are not uncached, just not PREcached: the stale-while-revalidate
     handler below stores each one the first time a page actually asks for it,
     so the second visit to those pages is still instant. The trade is that
     they are unavailable offline until visited once, which is the right way
     round for files most visitors never touch.

     voltfield-oem-data.js was also listed here and does not exist -- it was
     deleted from the repo. allSettled kept that from bricking the install, so
     it failed silently on every single one. */
  './voltfield-site-config.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  /* tolerant precache: one missing file must not brick the whole install.
     fetch() here (not cache.add()) with cache:'reload' so a fresh install
     always pulls real bytes from the network instead of the browser's own
     HTTP cache, which can otherwise sit in front of this entirely and serve
     a stale file no matter how many times the underlying source changes. */
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(CORE.map(u =>
        fetch(u, { cache: 'reload' }).then(r => c.put(u, r))
      )))
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
  if (url.pathname.startsWith('/.netlify/identity/')) return;

  /* HTML pages: network-first (so deployed updates show), cache fallback for offline.
     cache:'reload' forces a genuine network round-trip -- without it, "network-first"
     can still be silently satisfied by the browser's own HTTP cache underneath. */
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req, { cache: 'reload' })
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

  /* same-origin assets: stale-while-revalidate -- serve the cached copy
     instantly if there is one (catalog data is big, so this matters), but
     always kick off a background fetch to refresh the cache for next time.
     A page open right now can still be running old JS against fresh HTML,
     same as any SWR/cache-first setup -- but the very next load anywhere
     gets the current file, with no VERSION bump required.
     Two things make that actually true instead of theoretical:
     - waitUntil(net) -- without it, the browser is free to kill this worker
       the instant respondWith()'s promise resolves (right after a cache hit),
       which can abort the background fetch before cache.put() ever runs.
     - cache:'reload' on the fetch -- without it, this "fresh" network fetch
       can itself be silently satisfied by the browser's own HTTP cache for
       this exact URL, which sits underneath Cache Storage and doesn't care
       that the file changed server-side. Both together are what make a
       forgotten VERSION bump actually self-heal on the next load. */
  if (url.origin === location.origin) {
    const net = fetch(req, { cache: 'reload' }).then(r => {
      const copy = r.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return r;
    });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(caches.match(req).then(hit => hit || net));
    return;
  }

  /* cross-origin (Google Fonts): stale-while-revalidate, same reasoning as above */
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    const net = fetch(req, { cache: 'reload' }).then(r => {
      const copy = r.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return r;
    });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(caches.match(req).then(hit => hit || net));
  }
});
