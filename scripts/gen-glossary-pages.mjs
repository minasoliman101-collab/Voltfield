#!/usr/bin/env node
/*
 * One page per glossary term: glossary/<id>.html.
 *
 *   node scripts/gen-glossary-pages.mjs
 *
 * The definition on each page is read out of glossary.html, so the two cannot
 * drift apart: edit the term there and re-run. The rest of the page -- how the
 * term is used in practice, the points worth knowing, where to go next --
 * comes from scripts/glossary-terms.mjs. A term with no entry in that file gets
 * no page, on purpose (see the note at the top of it).
 *
 * This script also keeps the things that have to agree with the set of pages:
 * the "More on ..." link under each glossary entry, sitemap.xml, the
 * extensionless redirects, and the glossary entries in search-index.json.
 * All of it is idempotent.
 */
import fs from 'node:fs';
import path from 'node:path';
import { TERMS } from './glossary-terms.mjs';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const TEMPLATE = 'calculators/ohms-law.html';
const DATE_ISO = '2026-11-11', DATE_LONG = 'November 11, 2026';
const BASE = 'https://voltfield.org/';

const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&').replace(/&sup2;/g, '²')
  .replace(/&deg;/g, '°').replace(/&times;/g, '×').replace(/&divide;/g, '÷').replace(/&rsquo;|&#39;/g, '’').replace(/&ldquo;|&rdquo;|&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
const attr = (s) => plain(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/* ---- read the glossary ---- */
let gl = fs.readFileSync('glossary.html', 'utf8');
const glNl = gl.includes('\r\n') ? '\r\n' : '\n';
const entries = [...gl.matchAll(/<div class="term" id="([a-z0-9-]+)">\s*<h2>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g)]
  .map(m => ({ id: m[1], name: m[2].trim(), def: m[3].trim() }));
if (entries.length < 40) throw new Error('glossary parse found only ' + entries.length + ' terms');
const byId = Object.fromEntries(entries.map(e => [e.id, e]));
for (const id of Object.keys(TERMS)) if (!byId[id]) throw new Error('glossary-terms.mjs has "' + id + '" but glossary.html does not');
const paged = entries.filter(e => TERMS[e.id]);

/* The definition as it appears on a term page: links made root-absolute, and
   links into the noindexed spec library unwrapped to plain text. A closing
   "See X." that pointed only there is dropped with it. */
function defFor(e) {
  let d = e.def.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (m, href, text) => {
    if (/voltfield-supply-catalog|voltfield-suppliers|oil-gas|industrial-supply/.test(href)) return text;
    const h = /^(https?:|\/|#|mailto:)/.test(href) ? href : '/' + href;
    return `<a class="inline" href="${h}">${text}</a>`;
  });
  d = d.replace(/\s*See [^.<]*\.\s*$/, '').replace(/\s+—\s+see [^.<]*\.\s*$/i, '.');
  return d.trim();
}
/* Sentences end at a full stop followed by a space and a capital. Splitting on
   every full stop cut "1.2 cal/cm2" in half. */
const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z"])/);
function metaDesc(text) {
  let out = '';
  for (const s of sentences(text)) { if ((out + ' ' + s).trim().length > 158) break; out = (out + ' ' + s).trim(); }
  if (out.length >= 110 || text.length <= 158) return out.length >= 110 ? out : text;
  /* One short sentence is a thin description. Take as much of the rest as fits. */
  const cut = text.slice(0, 154);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:—–-]+$/, '') + '…';
}

const STYLE = `<style>
.gt-def{font-size:19px;line-height:1.6;color:var(--ink);border-left:3px solid var(--signal);padding:4px 0 4px 18px;margin:6px 0 26px}
.gt-def a.inline{font-weight:500}
.gt-points{padding-left:22px;margin:10px 0 6px}
.gt-points li{margin-bottom:9px}
.gt-back{font-family:var(--mono);font-size:12px;margin-top:26px}
</style>`;

function mainHTML(e, t, def) {
  const first = sentences(plain(def))[0];
  const see = (t.see || []).filter(id => TERMS[id] && byId[id]);
  return `<main id="main" tabindex="-1">

<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <a href="/glossary.html" style="color:var(--slate);text-decoration:none">Glossary</a> / <span style="color:var(--ink)">${e.name}</span></nav>
    <div class="eyebrow">Glossary</div>
    <h1>${e.name}</h1>
    <p class="dek">${first}</p>
  </div>
</section>

<div class="artwrap">
  <h2 id="definition">Definition</h2>
  <p class="gt-def">${def}</p>

  <h2 id="in-practice">In practice</h2>
${t.more.map(p => `  <p>${p}</p>`).join('\n')}

  <h2 id="worth-knowing">Worth knowing</h2>
  <ul class="gt-points">
${t.points.map(p => `    <li>${p}</li>`).join('\n')}
  </ul>

  <div class="ad-unit" data-ad="incontent"></div>

  <h2 id="go-further">Tools and guides</h2>
    <div class="rel">
${t.links.map(([h, l]) => `      <a href="/${h}">${l}</a>`).join('\n')}
    </div>
${see.length ? `
  <h2 id="related-terms">Related terms</h2>
    <div class="rel">
${see.map(id => `      <a href="/glossary/${id}.html">${byId[id].name}</a>`).join('\n')}
    </div>
` : ''}
  <p class="gt-back"><a class="inline" href="/glossary.html">&larr; All ${entries.length} glossary terms</a></p>

  <aside class="provenance" aria-labelledby="prov-h">
    <h2 id="prov-h">Scope &amp; sources</h2>
    <dl>
      <dt>What this covers</dt>
      <dd>What ${plain(e.name)} means, how the term is used in practice, and where it is covered in more depth on Voltfield.</dd>
      <dt>What it is not</dt>
      <dd>A definition for orientation, not a specification, a code interpretation or professional advice. Standards and regulations are summarized; the published text governs, and editions change.</dd>
      <dt>Provenance</dt>
      <dd>Last reviewed ${DATE_LONG}. Written and maintained by the Voltfield editorial team. The definition is the one in the <a class="inline" href="/glossary.html#${e.id}">Voltfield glossary</a>.</dd>
    </dl>
  </aside>

</div>
<div class="ad-unit" data-ad="footer"></div>
</main>`;
}

function stamp(tpl, o) {
  let s = tpl;
  const one = (re, to, label) => { if (!re.test(s)) throw new Error(o.file + ': no match for ' + label); s = s.replace(re, to); };
  const url = BASE + o.file;
  one(/<title>[^<]*<\/title>/, `<title>${attr(o.title)} | Voltfield</title>`, 'title');
  one(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  one(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  one(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(o.desc)}">`, 'description');
  one(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(o.h1)}">`, 'og:title');
  one(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(o.desc)}">`, 'og:description');
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${BASE}social/social-glossary.jpg">`)
       .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${BASE}social/social-glossary.jpg">`);
  one(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">\n${JSON.stringify(o.ld)}\n</script>`, 'json-ld');
  one(/<\/head>/, STYLE + '\n</head>', 'head end');
  one(/<main id="main" tabindex="-1">[\s\S]*<\/main>/, () => o.main, 'main');
  s = s.replace(/<script src="\/voltfield-calculators\.js" defer><\/script>\r?\n/, '').replace(/<script src="\/voltfield-updates\.js" defer><\/script>\r?\n/, '')
       .replace(/<link rel="stylesheet" href="\/voltfield-calculators\.css">\r?\n/, '');
  return s;
}

/* ---- pages ---- */
const tpl = fs.readFileSync(TEMPLATE, 'utf8').replace(/\r\n/g, '\n');
fs.mkdirSync('glossary', { recursive: true });
const report = [];
for (const e of paged) {
  const t = TERMS[e.id], def = defFor(e), file = `glossary/${e.id}.html`, url = BASE + file;
  const title = t.t || `${plain(e.name)}: Definition`;
  const desc = metaDesc(plain(def));
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Glossary', item: BASE + 'glossary.html' },
      { '@type': 'ListItem', position: 3, name: plain(e.name), item: url } ] },
    { '@type': 'DefinedTerm', '@id': url + '#term', name: plain(e.name), description: plain(def), url,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Voltfield Glossary', url: BASE + 'glossary.html' } },
    { '@type': 'WebPage', name: plain(title), description: desc, url, dateModified: DATE_ISO, inLanguage: 'en-US', mainEntity: { '@id': url + '#term' },
      isPartOf: { '@type': 'WebSite', name: 'Voltfield', url: BASE }, publisher: { '@type': 'Organization', name: 'Voltfield', url: BASE } },
  ] };
  const main = mainHTML(e, t, def);
  fs.writeFileSync(file, stamp(tpl, { file, title, desc, h1: e.name, ld, main }));
  report.push([e.id, (title + ' | Voltfield').length, desc.length, plain(main).split(' ').length]);
}

/* ---- glossary.html: a link from each entry to its page ---- */
let linked = 0;
for (const e of paged) {
  const marker = `href="glossary/${e.id}.html"`;
  if (gl.includes(marker)) continue;
  const re = new RegExp(`(<div class="term" id="${e.id}">[\\s\\S]*?</p>)(\\s*</div>)`);
  if (!re.test(gl)) { console.log('  could not link', e.id); continue; }
  gl = gl.replace(re, (m, a, b) => `${a}${glNl}      <p class="term-more"><a class="inline" ${marker}>More on ${plain(e.name).replace(/&/g, '&amp;')} &rarr;</a></p>${b}`);
  linked++;
}
if (linked) fs.writeFileSync('glossary.html', gl);

/* ---- sitemap, redirects, search ---- */
let sm = fs.readFileSync('sitemap.xml', 'utf8');
const urls = paged.filter(e => !sm.includes(`/glossary/${e.id}.html<`)).map(e => `  <url>\n    <loc>${BASE}glossary/${e.id}.html</loc>\n    <lastmod>${DATE_ISO}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`).join('');
if (urls) {
  sm = sm.replace('</urlset>', urls + '</urlset>').replace(/(<loc>https:\/\/voltfield\.org\/glossary\.html<\/loc>\s*<lastmod>)[^<]+/, '$1' + DATE_ISO);
  fs.writeFileSync('sitemap.xml', sm);
}
let rd = fs.readFileSync('_redirects', 'utf8');
const rl = paged.filter(e => !rd.includes(`/glossary/${e.id} `)).map(e => `/glossary/${e.id}`.padEnd(36) + ` /glossary/${e.id}.html 301!\n`).join('');
if (rl) {
  rd = rd.replace('# ---- END generated ----', rl + '# ---- END generated ----');
  if (!rd.includes('/glossary/ ')) rd = rd.replace('/charts                             /reference-charts.html', '/glossary/                          /glossary.html                          301!\n/charts                             /reference-charts.html');
  fs.writeFileSync('_redirects', rd);
}
let si = fs.readFileSync('search-index.json', 'utf8'), swapped = 0, added = 0;
for (const e of paged) {
  const old = `"url": "glossary.html#${e.id}"`;
  if (si.includes(old)) { si = si.split(old).join(`"url": "glossary/${e.id}.html"`); swapped++; }
  else if (!si.includes(`"url": "glossary/${e.id}.html"`)) {
    const d = metaDesc(plain(defFor(e))).replace(/"/g, '\\"');
    si = si.replace(/"items": \[\r?\n/, m => m + `    {"title": "${plain(e.name).replace(/"/g, '\\"')}", "url": "glossary/${e.id}.html", "category": "Glossary", "description": "${d}"},\n`);
    added++;
  }
}
JSON.parse(si); fs.writeFileSync('search-index.json', si);

const long = report.filter(r => r[1] > 60), thin = report.filter(r => r[3] < 250);
console.log(`term pages written: ${paged.length} of ${entries.length} glossary terms`);
console.log(`glossary links added: ${linked}; sitemap urls added: ${urls ? urls.split('<url>').length - 1 : 0}; search swapped ${swapped}, added ${added}`);
console.log('words: min ' + Math.min(...report.map(r => r[3])) + ', max ' + Math.max(...report.map(r => r[3])));
if (long.length) console.log('titles over 60:', long.map(r => r[0] + ' ' + r[1]).join(', '));
if (thin.length) console.log('under 250 words:', thin.map(r => r[0] + ' ' + r[3]).join(', '));
