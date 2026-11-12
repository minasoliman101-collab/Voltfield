#!/usr/bin/env node
/*
 * Nov 2026: the site now covers the cooling side of a data center as well as
 * the electrical side (pumps, chillers, airflow, containment), and neither the
 * home page nor the header said so. This brings the wording into line.
 * Idempotent; re-run after adding pages that were stamped from an old shell.
 *
 *   node scripts/add-cooling-positioning.mjs
 *
 * SITEWIDE (every page with the shared header, and scripts/tpl/chrome-top.html):
 *   - wordmark tagline
 *   - Tools menu: calculator count, plus Reference charts and Practice
 *     questions, neither of which had a route from the header
 *   - footer blurb
 * HOME PAGE ONLY: hero, descriptions, structured data, the first two entry
 * cards, a cooling section, and two stale counts.
 *
 * The home page <title> is deliberately NOT changed. It was tuned for search
 * and is at its length limit; there is no room for "cooling" without dropping
 * one of the terms it already ranks on.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files -co --exclude-standard "*.html"').toString().trim().split('\n')
  .filter(f => !/^(embed|app-wrapper|vendor|scripts\/(category-bodies|tool-seo|retired))\//.test(f));
const n = { tagline: 0, count: 0, charts: 0, practice: 0, footer: 0 };

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  const before = s;

  if (s.includes('Engineering reference &amp; equipment data')) {
    s = s.split('Engineering reference &amp; equipment data').join('Power &amp; cooling engineering reference'); n.tagline++;
  }

  // Tools menu, whatever path prefix this page uses for its links
  s = s.replace(/(<a href="([^"]*)engineering-calculators\.html"><b>Engineering calculators<\/b><em>)[^<]*(<\/em><\/a>)/, (m, a, pfx, c) => {
    n.count++;
    let out = a + '43 tools, electrical and cooling' + c;
    if (!s.includes(`href="${pfx}reference-charts.html"><b>Reference charts</b>`)) {
      const ind = (s.slice(0, s.indexOf(m)).match(/[ \t]*$/) || [''])[0];
      out += (s.includes('\r\n') ? '\r\n' : '\n') + ind + `<a href="${pfx}reference-charts.html"><b>Reference charts</b><em>Printable tables: wire, breakers, cooling load</em></a>`;
      n.charts++;
    }
    return out;
  });
  s = s.replace(/<a href="([^"]*)voltfield-rack-builder\.html"><b>Rack elevation builder<\/b><em>[^<]*<\/em><\/a>/, (m, pfx) => {
    if (s.includes(`href="${pfx}practice-questions.html"><b>Practice questions</b>`)) return m;
    const ind = (s.slice(0, s.indexOf(m)).match(/[ \t]*$/) || [''])[0];
    n.practice++;
    return m + (s.includes('\r\n') ? '\r\n' : '\n') + ind + `<a href="${pfx}practice-questions.html"><b>Practice questions</b><em>64 questions with worked solutions</em></a>`;
  });

  if (s.includes('for electrical power equipment in data centers')) {
    s = s.split('for electrical power equipment in data centers').join('for electrical power and cooling equipment in data centers'); n.footer++;
  }
  if (s !== before) fs.writeFileSync(f, s);
}
console.log(files.length + ' files scanned', n);

/* ------------------------------------------------------------- home page */
let ix = fs.readFileSync('index.html', 'utf8');
const nl = ix.includes('\r\n') ? '\r\n' : '\n';
const rep = (a, b, label) => { if (ix.includes(b)) return; if (!ix.includes(a)) { console.log('  home: not found -> ' + (label || a.slice(0, 60))); return; } ix = ix.split(a).join(b); };

const DESC = 'Free electrical and cooling calculators, charts, guides and practice questions for data center, solar and battery-storage projects. Methods shown. No signup.';
rep('Free electrical power calculators, guides and practice tools for data center, solar and battery-storage projects. Every calculator shows its method. No signup.', DESC, 'description');
rep('Free electrical power calculators, guides and practice tools for data center, solar and battery-storage projects.', 'Free electrical and cooling calculators, charts, guides and practice questions for data center, solar and battery-storage projects.', 'website description');
rep('content="Electrical Power Calculators &amp; Practice Tools for Data Centers, Solar &amp; BESS"', 'content="Electrical &amp; Cooling Calculators and Practice Tools for Data Centers, Solar &amp; BESS"', 'og/twitter title');
rep('Free calculators, guides and practice boards for the electrical side of data center, solar and battery-storage projects. Every calculator shows its method; every board checks your work.',
    'Free calculators, charts, guides and practice questions for the electrical and cooling side of data center, solar and battery-storage projects. Every calculator shows its method.', 'og description');
rep('Free calculators, guides and practice boards for data center, solar and battery-storage power. No signup.', 'Free calculators, charts and practice questions for data center, solar and battery-storage power and cooling. No signup.', 'twitter description');
rep('"Battery energy storage systems","Transformers"', '"Battery energy storage systems","Data center cooling","Transformers"', 'knowsAbout');

rep('<span class="dot"></span> Free electrical power tools &middot; no signup', '<span class="dot"></span> Free electrical &amp; cooling tools &middot; no signup', 'eyebrow');
rep('<h1>Electrical calculators for <em>data centers, solar &amp; BESS</em></h1>', '<h1>Electrical &amp; cooling calculators for <em>data centers, solar &amp; BESS</em></h1>', 'h1');
rep('Free calculators, guides and practice tools for the electrical side of data center, solar and battery-storage projects. Every calculator shows its method; every practice board checks what you built.',
    'Free calculators, charts, guides and practice questions for the electrical and cooling side of data center, solar and battery-storage projects. Every calculator shows its method; every practice board checks what you built.', 'lede');
rep('          <a href="guide-feoc-compliance.html">FEOC compliance</a>', '          <a href="guide-feoc-compliance.html">FEOC compliance</a>' + nl + '          <a href="charts/cooling-load-chart.html">Cooling load chart</a>', 'hint chip');
rep('Forty-three calculators &mdash; voltage drop, transformer sizing, arc-flash incident energy, cable ampacity, fault current &mdash; each showing the method, not just the answer.',
    'Forty-three calculators &mdash; voltage drop, transformer sizing, fault current, arc-flash incident energy, pump power, airflow and chilled water flow &mdash; each showing the method, not just the answer.', 'card A');
rep('how a nameplate reads, what an arc-flash boundary is, why PUE lies to you &mdash;', 'how a nameplate reads, what an arc-flash boundary is, how a CRAC differs from a CRAH, why PUE lies to you &mdash;', 'card B');
rep('<h2>Three sectors of power equipment</h2>', '<h2>Three sectors of power and cooling equipment</h2>', 'sector heading');
rep('<p>Transformers, switchgear, generators, UPS, CDUs and busway for hyperscale and colo builds.</p>', '<p>Transformers, switchgear, generators, UPS and busway, and the chillers, air handlers and CDUs that cool them, for hyperscale and colo builds.</p>', 'data center card');
rep('All 52 guides and 17 equipment references', 'All 55 guides and 17 equipment references', 'guide count');

if (!ix.includes('id="cooling"')) {
  const anchor = '<!-- ==================== PRACTICE FEATURE ====================';
  if (!ix.includes(anchor)) console.log('  home: no anchor for the cooling section');
  else {
    const card = (h, b, t, p) => `    <a class="gdcard has-thumb" href="${h}"><span class="gd-thumb is-badge" aria-hidden="true">${b}</span><h3>${t}</h3><p>${p}</p></a>`;
    const sec = [
      '<!-- ==================== COOLING ====================',
      '     Added Nov 2026. The site grew a mechanical side -- airflow, chilled water,',
      '     pumps, containment -- and the home page still read as electrical only.',
      '     Nearly every watt an IT load draws leaves as heat, so the two sides are',
      '     sized from the same number, which is the point this section makes. -->',
      '<div class="section" id="cooling">',
      '  <div class="section-head">',
      '    <div class="section-eyebrow">Cooling &amp; mechanical</div>',
      '    <h2>Every kilowatt in comes out as heat</h2>',
      '    <p>The electrical load and the cooling load of a data hall are the same number seen from two sides. These take it from kW to tons, to air, to chilled water and to the pump that moves it.</p>',
      '  </div>',
      '  <div class="gdgrid">',
      card('calculators/airflow-cfm.html', 'CFM', 'Airflow (CFM) Calculator', 'The air a heat load needs at a given temperature rise, with CFM per kW.'),
      card('calculators/chilled-water-flow.html', 'GPM', 'Chilled Water Flow Calculator', 'Flow from tons or kW and the supply-return temperature difference.'),
      card('calculators/pump-power.html', 'kW', 'Pump Power Calculator', 'Shaft power and motor size from flow, head and efficiency, in US or metric units.'),
      card('charts/cooling-load-chart.html', 'BTU', 'Cooling Load Chart', 'kW as BTU/h and tons, with airflow per kW and water flow per ton.'),
      card('guide-crac-vs-crah.html', 'CRAH', 'CRAC vs. CRAH', 'One has a compressor, the other borrows cooling from a chiller plant. What follows from that.'),
      card('guide-hot-aisle-vs-cold-aisle-containment.html', 'HAC', 'Hot Aisle vs. Cold Aisle Containment', 'How each stops supply and exhaust air mixing, and which to choose.'),
      '  </div>',
      '  <a class="section-more" href="engineering-calculators.html">All cooling and electrical calculators <span class="ar" aria-hidden="true">&rarr;</span></a>',
      '</div>',
      '', ''].join(nl);
    ix = ix.replace(anchor, sec + anchor);
  }
}
fs.writeFileSync('index.html', ix);

/* ------------------------------------------------------ the rest that names the scope */
const swap = (f, pairs) => { let s = fs.readFileSync(f, 'utf8'), c = 0; for (const [a, b] of pairs) if (s.includes(a) && !s.includes(b)) { s = s.split(a).join(b); c++; } if (c) fs.writeFileSync(f, s); return c; };
swap('about.html', [['the electrical side of data center, solar and battery-storage projects', 'the electrical and cooling side of data center, solar and battery-storage projects']]);
swap('llms.txt', [['the electrical side of data center, solar and battery-storage projects', 'the electrical and cooling side of data center, solar and battery-storage projects']]);
swap('scripts/tpl/chrome-bot.html', [['for electrical power equipment in data centers', 'for electrical power and cooling equipment in data centers']]);
console.log('home page and scope wording updated');
