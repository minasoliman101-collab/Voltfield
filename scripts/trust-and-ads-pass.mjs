// Nov 2026 pass: sitewide trust links, static og:url, ad slots on the pages
// that had none. Idempotent -- safe to re-run after adding or regenerating a
// page (gen-calc-pages.ps1 and gen-category-pages.ps1 do not emit these).
//
//   node scripts/trust-and-ads-pass.mjs
//
// 1. FOOTER LEGAL BAR. Only index, about and methodology linked to the privacy
//    policy or the About page; the other ~120 pages had no route to either.
//    Every page now ends its footer with the same row: About, Methodology,
//    Contact, Privacy, Terms. Hrefs are root-absolute so one snippet is right
//    at any depth. Styled by `.foot-legal` in voltfield-core.css.
// 2. og:url. It was only ever injected by voltfield-site-config.js, and link
//    scrapers (LinkedIn, Slack, Facebook) do not run JavaScript.
// 3. AD SLOTS. The calculator and category pages -- the pages search traffic
//    lands on -- carried no .ad-unit at all. Slots render nothing until
//    ads.provider is set in voltfield-site-config.js.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files -co --exclude-standard "*.html"').toString().trim().split('\n')
  .filter(f => !/^(embed|scripts|app-wrapper|vendor)\//.test(f));

const LEGAL = `<nav class="foot-legal" aria-label="About this site">
    <a href="/about.html">About</a>
    <a href="/methodology.html">Methodology</a>
    <a href="/contact.html">Contact</a>
    <a href="/privacy-policy.html">Privacy policy</a>
    <a href="/terms.html">Terms of use</a>
  </nav>
`;
// Pages that should never carry an ad: utility pages and the legal pages.
const NO_ADS = new Set(['404.html', 'site-search.html', 'privacy-policy.html', 'terms.html', 'contact.html']);
const INCONTENT = '  <div class="ad-unit" data-ad="incontent"></div>\n\n';
const FOOTER_AD = '<div class="ad-unit" data-ad="footer"></div>\n';

const n = { legal: 0, ogurl: 0, incontent: 0, footerAd: 0 };
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  if (!s.includes('class="foot-legal"')) {
    const i = s.lastIndexOf('</footer>');
    if (i !== -1) { s = s.slice(0, i) + '  ' + LEGAL + s.slice(i); n.legal++; }
    else {
      const m = s.lastIndexOf('</main>');
      if (m !== -1) { s = s.slice(0, m + 7) + '\n<footer>\n  ' + LEGAL + '</footer>' + s.slice(m + 7); n.legal++; }
    }
  }

  const canon = s.match(/<link rel="canonical" href="([^"]+)">/);
  if (canon && !/property="og:url"/.test(s)) {
    s = s.replace(canon[0], canon[0] + '\n<meta property="og:url" content="' + canon[1] + '">');
    n.ogurl++;
  }

  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(s);
  if (!noindex && !NO_ADS.has(f) && !s.includes('class="ad-unit"')) {
    if (f.startsWith('calculators/')) {
      // Below the tool and the method, above the FAQ or the Related block:
      // never between the reader and the calculator they came for.
      const anchor = ['  <h2>Frequently asked questions</h2>', '  <h2>Related</h2>'].find(a => s.includes(a));
      if (anchor) { s = s.replace(anchor, INCONTENT + anchor); n.incontent++; }
    }
    const m = s.lastIndexOf('</main>');
    if (m !== -1) { s = s.slice(0, m) + FOOTER_AD + s.slice(m); n.footerAd++; }
  }

  if (s !== before) fs.writeFileSync(f, s);
}
console.log(`${files.length} pages scanned`, n);
