/* Shared page shell for the hand-specified hub pages (templates, formulas).
 * Uses the same three chrome fragments the calculator generator stamps from
 * (scripts/tpl), so header and footer cannot drift from the rest of the site. */
import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '..');
export const BASE = 'https://voltfield.org/';
const read = f => fs.readFileSync(path.join(root, 'scripts/tpl', f), 'utf8').replace(/\r\n/g, '\n');
const headTail = read('head-tail.html');
const top = read('chrome-top.html');
const bot = read('chrome-bot.html');

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

/* p: {url, title, desc, crumbs:[[name,url]], faq:[[q,a]], css:[], js:[], style, body, dateISO} */
export function page(p) {
  const canon = BASE + p.url;
  const crumbs = [['Home', '']].concat(p.crumbs || []);
  const graph = [{
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: BASE + c[1] }))
  }];
  if (p.faq && p.faq.length) graph.push({
    '@type': 'FAQPage', dateModified: p.dateISO,
    mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } }))
  });
  const extra = (p.css || []).map(h => `<link rel="stylesheet" href="${h}">`).join('\n') +
    (p.style ? `\n<style>\n${p.style}\n</style>` : '');
  const scripts = (p.js || []).map(h => `<script src="${h}" defer></script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)}</title>
<link rel="canonical" href="${canon}">
<meta property="og:url" content="${canon}">
<meta name="description" content="${esc(p.desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Voltfield">
<meta property="og:title" content="${esc(p.title.replace(/ \| Voltfield$/, ''))}">
<meta property="og:description" content="${esc(p.desc)}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}
</script>
${headTail.replace('</head>', extra + '\n</head>')}${top}
<main id="main" tabindex="-1">
${p.body}
</main>
${bot.replace('</body>', scripts + '\n</body>')}`;
}

export function crumbNav(crumbs) {
  const parts = [['Home', '/']].concat(crumbs.map(c => [c[0], '/' + c[1]]));
  return '<nav aria-label="Breadcrumb" class="crumbnav">' + parts.map((c, i) =>
    i === parts.length - 1 ? `<span aria-current="page">${esc(c[0])}</span>` : `<a href="${c[1]}">${esc(c[0])}</a>`
  ).join(' / ') + '</nav>';
}

export function write(rel, html) {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html.replace(/\r?\n/g, '\r\n'));
  console.log('wrote', rel, (html.length / 1024).toFixed(1) + ' kB');
}
