/* ============================================================
   VOLTFIELD — site configuration: SEO helpers + ad monetization
   Loaded by every page (small, no dependencies).

   TO GO LIVE:
   1. Set SITE_URL to your real production domain (no trailing slash).
      This enables canonical URLs and correct Open Graph links.
   2. To turn on ads, sign up for Google AdSense (or another network),
      then set ads.provider='adsense' and paste your publisher ID
      (looks like 'ca-pub-1234567890123456') into ads.client.
      Also update ads.txt in this folder — see the comments there.
   3. While ads.client is empty, slots render as labeled placeholders
      when ads.preview=true (so you can see placements) and render
      nothing at all when ads.preview=false.
   ============================================================ */
'use strict';

const SITE_CONFIG = {
  /* production domain (no trailing slash) — update if you attach a custom domain */
  siteUrl: 'https://ornate-queijadas-cb9933.netlify.app',

  ads: {
    provider: 'none',      /* 'none' | 'adsense' */
    client: '',            /* AdSense publisher ID, e.g. 'ca-pub-XXXXXXXXXXXXXXXX' */
    slots: {               /* per-placement AdSense slot IDs (create in AdSense UI) */
      leaderboard: '',
      incontent: '',
      footer: '',
    },
    preview: true,         /* show placeholder boxes until a real client ID is set */
  },

  /* Part identification (voltfield-identify.html).
     v1 runs fully on-device: OCR (Tesseract.js) + token matching against the
     catalog/EOL data. To upgrade to full photo recognition (no label needed),
     stand up a backend that accepts an image and returns candidate keywords
     (e.g. Azure Function -> Claude/GPT-4o vision), then set its URL here.
     The page will POST {image: dataURL} and expects {keywords: [...], text: ''}. */
  vision: {
    endpoint: '',          /* e.g. 'https://<your-app>.azurestaticapps.net/api/identify' */
  },

  /* Subscriptions (see voltfield-account.html + README §9).
     Create Payment Links in your Stripe dashboard and paste them here —
     until then the plan buttons fall back to a sales-contact email. */
  billing: {
    proMonthlyUrl: '',     /* e.g. 'https://buy.stripe.com/xxxx' */
    proAnnualUrl: '',
    portalUrl: '',         /* Stripe customer-portal login link */
    salesEmail: 'Sales@voltfield.com',
  },
};

/* ---------- PWA: service-worker registration (https/localhost only) ---------- */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* non-fatal */ });
  });
})();

/* ---------- canonical + og:url injection (works on any host once siteUrl is set) ---------- */
(function () {
  if (!SITE_CONFIG.siteUrl) return;
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const href = SITE_CONFIG.siteUrl + path + location.search.replace(/([?&])(quote|qty)=[^&]*/g, '').replace(/^&/, '?');
  if (!document.querySelector('link[rel="canonical"]')) {
    const l = document.createElement('link'); l.rel = 'canonical'; l.href = href;
    document.head.appendChild(l);
  }
  if (!document.querySelector('meta[property="og:url"]')) {
    const m = document.createElement('meta'); m.setAttribute('property', 'og:url'); m.content = href;
    document.head.appendChild(m);
  }
})();

/* ---------- ad slots ----------
   Place <div class="ad-unit" data-ad="leaderboard|incontent|footer"></div>
   anywhere in the page; this renders them on DOMContentLoaded. */
(function () {
  const CSS = `
  .ad-unit{max-width:1240px;margin:18px auto;padding:0 20px}
  .ad-unit .ad-box{position:relative;min-height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .ad-unit .ad-lbl{position:absolute;top:4px;left:8px;font:500 8.5px/1 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#8896A6;text-transform:uppercase}
  .ad-unit .ad-ph{width:100%;min-height:90px;border:1px dashed #A7B6C6;background:repeating-linear-gradient(45deg,#E8EDF3,#E8EDF3 12px,#DDE5EC 12px,#DDE5EC 24px);display:flex;align-items:center;justify-content:center;font:500 11px/1.5 'IBM Plex Mono',monospace;color:#8896A6;text-align:center;padding:14px}
  @media(max-width:720px){.ad-unit .ad-box,.ad-unit .ad-ph{min-height:60px}}
  @media print{.ad-unit{display:none!important}}`;

  function boot() {
    const units = document.querySelectorAll('.ad-unit[data-ad]');
    if (!units.length) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const A = SITE_CONFIG.ads;
    const live = A.provider === 'adsense' && A.client;

    if (live && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(A.client);
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }

    units.forEach(u => {
      const kind = u.dataset.ad;
      if (live) {
        const slot = A.slots[kind] || '';
        u.innerHTML = `<div class="ad-box"><span class="ad-lbl">Advertisement</span>
          <ins class="adsbygoogle" style="display:block;width:100%"
               data-ad-client="${A.client}" ${slot ? `data-ad-slot="${slot}"` : ''}
               data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
      } else if (A.preview) {
        u.innerHTML = `<div class="ad-ph">AD SLOT — ${kind.toUpperCase()}<br>responsive display ad renders here once a publisher ID is set in voltfield-site-config.js</div>`;
      } else {
        u.remove();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
