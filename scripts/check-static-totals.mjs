/* Guards the catalog totals that are baked into HTML.
 *
 * voltfield-supply-catalog.html and voltfield-insights.html carry the SKU,
 * family and category counts as literal text so a crawler sees real numbers
 * instead of the "0" placeholders they used to ship with. Those literals are a
 * copy of data that lives in voltfield-catalog-data.js, so they can drift the
 * moment the taxonomy changes -- and drift silently, because the page's own
 * script overwrites them on load, meaning a human viewing the page always sees
 * the right value while the crawler keeps getting the stale one.
 *
 * Run:  node scripts/check-static-totals.mjs
 * Exits non-zero (and prints the corrected values) if any literal is stale.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

/* Evaluate the catalog data the same way a browser would. It is a plain script
   of const declarations, so appending an export expression is enough. */
const dataSrc = read('voltfield-catalog-data.js');
const { GRAND_TOTAL, FAM } = await import(
  'data:text/javascript;base64,' +
  Buffer.from(dataSrc + '\nexport { GRAND_TOTAL, FAM };').toString('base64')
);

const fmt = (n) => n.toLocaleString('en-US');
const expected = {
  total: fmt(GRAND_TOTAL),
  families: fmt(FAM.length),
  categories: String(new Set(FAM.map((f) => f.c)).size),
};

const checks = [
  ['voltfield-supply-catalog.html', /<b id="mTotal">([\d,]+)<\/b>/, expected.total, 'SKU total'],
  ['voltfield-supply-catalog.html', /<b id="mFam">([\d,]+)<\/b>/, expected.families, 'family count'],
  ['voltfield-supply-catalog.html', /<b id="mCat">([\d,]+)<\/b>/, expected.categories, 'category count'],
  ['voltfield-insights.html', /<b id="fTotal">([\d,]+)<\/b>/, expected.total, 'SKU total'],
  ['voltfield-insights.html', /<b id="fFam">([\d,]+)<\/b>/, expected.families, 'family count'],
];

let bad = 0;
for (const [file, re, want, label] of checks) {
  const m = read(file).match(re);
  if (!m) {
    console.error(`MISSING  ${file}: could not find the ${label} literal (${re})`);
    bad++;
  } else if (m[1] !== want) {
    console.error(`STALE    ${file}: ${label} says ${m[1]}, data says ${want}`);
    bad++;
  } else {
    console.log(`ok       ${file}: ${label} = ${m[1]}`);
  }
}

if (bad) {
  console.error(`\n${bad} stale or missing literal(s). Update the HTML to match the values above.`);
  process.exit(1);
}
console.log('\nAll baked-in catalog totals match voltfield-catalog-data.js.');
