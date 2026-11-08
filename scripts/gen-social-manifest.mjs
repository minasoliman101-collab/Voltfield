/* Builds scripts/social-cards.json: the text for every Open Graph card.
 *
 * Each card's words come from the page that references it -- its og:title and
 * og:description -- so the artwork and the page cannot drift apart. Where
 * several pages share a card (21 share social-generic.jpg), the owner is the
 * page whose filename matches the card slug; social-generic and social-index
 * describe the whole site rather than one page, so their text is set here.
 *
 * Run this, then scripts/gen-social-cards.ps1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
/* Which pages point at which card. Skips the asset directories so a filename
   mentioned inside a script or a vendored file can't be mistaken for a page
   reference. */
function collectRefs() {
  const found = {};
  const SKIP = new Set(['node_modules', '.git', 'social', 'images', 'vendor',
                        'fonts', 'icons', 'scripts', 'app-wrapper', 'netlify']);
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!e.name.endsWith('.html')) continue;
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(/social\/(social-[a-z0-9-]+\.jpg)/g)) {
        const rel = p.split(path.sep).join('/').replace(/^\.\//, '');
        (found[m[1]] = found[m[1]] || new Set()).add(rel);
      }
    }
  })('.');
  return Object.fromEntries(Object.entries(found).map(([k, v]) => [k, [...v]]));
}

const refs = collectRefs();

const dec = (s) => s
  .replace(/&amp;/g, '&').replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
  .replace(/&middot;/g, '\u00b7').replace(/&hellip;/g, '\u2026').replace(/&rsquo;/g, '\u2019')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').trim();

const meta = (html, prop) => {
  const m = html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`));
  return m ? dec(m[1]) : null;
};

// Which page owns a card: the one whose filename matches the card slug,
// otherwise the only page that references it.
function owner(card, pages) {
  const slug = card.replace(/^social-/, '').replace(/\.jpg$/, '');
  const exact = pages.find(p => p === `${slug}.html`);
  if (exact) return exact;
  if (pages.length === 1) return pages[0];
  const base = pages.find(p => path.basename(p) === `${slug}.html`);
  return base || null;
}

function eyebrow(page, slug) {
  if (!page) return 'ENGINEERING REFERENCE';
  if (page.startsWith('guide-')) return 'FIELD GUIDE';
  if (page.startsWith('calculators/') || slug.includes('calculator')) return 'CALCULATOR';
  if (page.startsWith('data-centers')) return 'DATA CENTERS';
  if (page.startsWith('renewables')) return 'RENEWABLES';
  if (page.startsWith('battery-storage')) return 'BATTERY STORAGE';
  if (slug === 'glossary') return 'GLOSSARY';
  if (slug === 'free-tools') return 'FREE TOOLS';
  if (slug === 'about') return 'ABOUT';
  return 'ENGINEERING REFERENCE';
}

const out = [];
const problems = [];

for (const [card, pages] of Object.entries(refs).sort()) {
  const slug = card.replace(/^social-/, '').replace(/\.jpg$/, '');

  // The homepage og:title runs 76 characters, which fills three lines on the
  // card and leaves room for only one line of subtitle. The h1 says the same
  // thing in 53, so the card uses that and keeps both lines of description.
  if (slug === 'index') {
    const html = fs.readFileSync('index.html', 'utf8');
    out.push({
      file: card, eyebrow: 'ENGINEERING REFERENCE',
      title: 'Electrical Calculators for Data Centers, Solar & BESS',
      subtitle: meta(html, 'og:description') || '',
      url: 'voltfield.org', shared: pages.length,
    });
    continue;
  }

  if (slug === 'generic') {
    out.push({
      file: card, eyebrow: 'ENGINEERING REFERENCE',
      title: 'Electrical Power Reference for Data Centers, Solar & BESS',
      subtitle: 'Free calculators that show their method, in-depth guides, and practice boards. Nothing on this site is for sale.',
      url: 'voltfield.org', shared: pages.length,
    });
    continue;
  }

  const page = owner(card, pages);
  if (!page || !fs.existsSync(page)) { problems.push([card, 'no owner page', pages.join(' ')]); continue; }

  const html = fs.readFileSync(page, 'utf8');
  let title = meta(html, 'og:title') || dec((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  let sub = meta(html, 'og:description') || meta(html, 'description') || '';

  title = title.replace(/\s*[|\u2014]\s*Voltfield\s*$/i, '').trim();
  if (!title) { problems.push([card, 'no title', page]); continue; }

  out.push({
    file: card, eyebrow: eyebrow(page, slug), title, subtitle: sub,
    // The homepage is "voltfield.org", not "voltfield.org/index" -- the site
    // canonicalises to the bare root and /index.html 301s to it.
    url: page === 'index.html' ? 'voltfield.org' : 'voltfield.org/' + page.replace(/\.html$/, ''),
    shared: pages.length,
  });
}

// Referenced but absent from disk -- must still be generated.
const onDisk = new Set(fs.readdirSync('social'));
const missing = out.filter(c => !onDisk.has(c.file));

console.log(`${out.length} cards to generate (${missing.length} currently missing from disk)`);
if (missing.length) console.log('  missing: ' + missing.map(m => m.file).join(', '));
if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ' + p.join(' | '))); }

console.log('\nlongest titles (wrapping risk):');
out.slice().sort((a, b) => b.title.length - a.title.length).slice(0, 6)
  .forEach(c => console.log(`  ${String(c.title.length).padStart(3)}  ${c.title}`));

console.log('\nsample:');
out.slice(0, 3).forEach(c => console.log(`  ${c.file}\n    eyebrow: ${c.eyebrow}\n    title:   ${c.title}\n    sub:     ${c.subtitle.slice(0, 90)}\n    url:     ${c.url}`));

fs.writeFileSync(path.join(root, 'scripts', 'social-cards.json'), JSON.stringify(out, null, 1));
console.log('\nwrote scripts/social-cards.json');
