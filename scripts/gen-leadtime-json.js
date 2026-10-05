#!/usr/bin/env node
/*
 * Publishes lead-time-index.json from voltfield-catalog-data.js.
 *
 * The file is advertised on the page as a citable dataset, and in the page's
 * schema as a DataDownload on a Dataset, under a licence that asks for
 * attribution and a link back. It is the site's main link-earning asset.
 *
 * It was hand-maintained, and drifted: "lastUpdated" read 2026-07 while
 * "reviewCadence" promised monthly, and it carried only the 14 curated
 * headline rows while the page itself published 234. Both are the kind of
 * thing a reporter checks before citing.
 *
 * What this script does and does not touch:
 *
 *   PRESERVED, because it is editorial and not derivable -- the curated
 *   `sectors` blocks. Those 14 rows carry market colour the structured data
 *   has no field for ("Sold out through 2028", "2029+ delivery slots",
 *   "$110-140/kWh") plus a hand-assigned trend and basis. A generator cannot
 *   invent those, so it leaves them alone.
 *
 *   GENERATED -- `lastUpdated`, and a `fullIndex` array holding every family
 *   that carries a lead time, straight from the catalog. That is the part that
 *   was missing, and the part that cannot be allowed to drift again.
 *
 * Run it from the repo root:  node scripts/gen-leadtime-json.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataFile = path.join(root, 'voltfield-catalog-data.js');
const jsonFile = path.join(root, 'lead-time-index.json');

/* voltfield-catalog-data.js is a browser script: it declares FAM and SECTORS
   with const, derives ct, and touches no DOM beyond a couple of guards. Eval
   it with minimal globals and read FAM back, rather than re-implementing a
   parser that would drift from the real file. */
function loadFamilies() {
  global.window = global;
  global.document = {
    createElement: () => ({ getContext: () => null }),
    addEventListener() {},
  };
  const src = fs.readFileSync(dataFile, 'utf8');
  /* Both come back from one eval: a second eval gets its own scope and cannot
     see the const bindings the first one created. */
  const got = eval(src + '\n; ({ FAM: typeof FAM !== "undefined" ? FAM : null,' +
                         '     SECTORS: typeof SECTORS !== "undefined" ? SECTORS : null })');
  const FAM = got.FAM;
  const SECTORS = got.SECTORS;
  if (!Array.isArray(FAM) || !FAM.length) {
    throw new Error('FAM did not evaluate to a non-empty array');
  }
  FAM.forEach((f) => {
    if (f.ct == null) f.ct = f.ax.reduce((n, a) => n * (a.length - 1), 1);
  });
  return { FAM, SECTORS };
}

const { FAM, SECTORS } = loadFamilies();

const existing = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
if (!Array.isArray(existing.sectors)) {
  throw new Error('existing lead-time-index.json has no sectors array to preserve');
}

const withLead = FAM.filter((f) => typeof f.lw === 'number' && f.lw > 0);

/* Sector order follows SECTORS so the file reads in the same order as the
   page. Any sector key the data uses but SECTORS does not describe still gets
   emitted, at the end, rather than silently dropped. */
const sectorOrder = SECTORS ? Object.keys(SECTORS) : [];
const seen = new Set();
const orderedKeys = sectorOrder
  .filter((k) => withLead.some((f) => f.s === k))
  .concat(withLead.map((f) => f.s).filter((k) => !sectorOrder.includes(k)))
  .filter((k) => (seen.has(k) ? false : seen.add(k)));

const fullIndex = [];
for (const key of orderedKeys) {
  const label = (SECTORS && SECTORS[key] && SECTORS[key].label) || key;
  withLead
    .filter((f) => f.s === key)
    .sort((a, b) => b.lw - a.lw || a.n.localeCompare(b.n))
    .forEach((f) => {
      fullIndex.push({
        equipment: f.n,
        category: f.c,
        sector: label,
        sectorKey: key,
        weeks: f.lw,
        value: f.lw + ' wk',
        /* Everything in this array is derived from the catalog, which is what
           basisTypes already defines "modeled" as. Nothing here is a reported
           or published figure; those live in the curated sectors above. */
        basis: 'modeled',
      });
    });
}

const now = new Date();
const stamp = now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0');

/* Key order is spelled out so a regeneration produces a stable diff and the
   preserved editorial keys keep their place in the file. */
const out = {
  source: existing.source,
  url: existing.url,
  region: existing.region,
  lastUpdated: stamp,
  reviewCadence: existing.reviewCadence,
  license: existing.license,
  basisNote: existing.basisNote,
  basisTypes: existing.basisTypes,
  headlineNote:
    'The sectors below are the curated headline figures shown at the top of the ' +
    'page. Several carry market context that has no equivalent in the structured ' +
    'data, so they are maintained by hand. fullIndex holds every family that ' +
    'carries a lead time, generated from the same catalog that drives the site.',
  sectors: existing.sectors,
  fullIndexCount: fullIndex.length,
  familiesTotal: FAM.length,
  fullIndex,
};

fs.writeFileSync(jsonFile, JSON.stringify(out, null, 2) + '\n');

const curated = existing.sectors.reduce((n, s) => n + ((s.items || []).length), 0);
console.log('lead-time-index.json written');
console.log('  lastUpdated:   ' + stamp);
console.log('  curated rows:  ' + curated + ' (preserved)');
console.log('  fullIndex:     ' + fullIndex.length + ' of ' + FAM.length + ' families');
console.log('  weeks range:   ' + Math.min(...withLead.map((f) => f.lw)) +
            ' to ' + Math.max(...withLead.map((f) => f.lw)));
