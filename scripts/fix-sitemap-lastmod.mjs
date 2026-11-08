/* Re-point sitemap.xml <lastmod> at each page's OWN declared dateModified.
 *
 * Why this exists. sync-sitemap-lastmod.sh sets lastmod from the file's last
 * COMMIT date, which is correct by construction and wrong in practice: a
 * commit touching a file is not a change to what the page says. A vendored
 * asset, a 3D model, a nav tweak or a sitewide find-and-replace all move it.
 * Measured 2026-11-08, 93 of 113 entries claimed a date newer than the date
 * the page itself gives -- several by over two months, on pages printing
 * "last updated August 23, 2026" to the reader.
 *
 * That is worse than useless. lastmod is a hint a crawler decides whether to
 * trust, and a feed that marks 76 pages fresh on a day none of them changed
 * teaches it not to. It also contradicts the page: the guide says August, the
 * sitemap says November.
 *
 * So: where a page declares its own dateModified, that wins. Every page
 * carries exactly one (verified), so the first match is unambiguous. Pages
 * that declare none are left alone -- there is nothing better to use, and
 * guessing would recreate the problem this is undoing.
 *
 *   node scripts/fix-sitemap-lastmod.mjs            # dry run, prints the diff
 *   node scripts/fix-sitemap-lastmod.mjs --apply    # writes sitemap.xml
 *
 * sync-sitemap-lastmod.sh calls this as its second pass, so running that
 * script alone is safe and this file does not have to be remembered. The git
 * date it writes survives only on the ~3 pages that state no date of their
 * own; everywhere else the page's own date overwrites it. It is idempotent:
 * a second run reports nothing to change.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smPath = path.join(root, 'sitemap.xml');
const apply = process.argv.includes('--apply');

// The homepage has no Article node of its own, so it is passed in explicitly
// when index.html is edited by hand.
const HOMEPAGE_LASTMOD = '2026-11-08';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
                'august', 'september', 'october', 'november', 'december'];

/* A page states its own last-change date in its Article schema. Two things
   make that harder to read than it sounds.

   The JSON-LD is not formatted consistently: ~96 pages are minified
   ("dateModified":"2026-..."), ~17 are pretty-printed ("dateModified":
   "2026-..."). An earlier version of this matched only the minified form and
   silently concluded those 17 pages had no Article node at all -- they all
   do. Hence \s* here, and never assume absence from one spelling.

   The visible byline is the fallback, for a page with a date on the screen
   but none in its markup. On every page checked the two agree, so this is a
   safety net rather than a second source of truth. */
function pageDate(html) {
  const schema = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/);
  if (schema) return schema[1];

  const visible = html.match(/(?:last )?updated\s+([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})/i);
  if (!visible) return null;
  const mi = MONTHS.indexOf(visible[1].toLowerCase());
  if (mi < 0) return null;
  return `${visible[3]}-${String(mi + 1).padStart(2, '0')}-${visible[2].padStart(2, '0')}`;
}

let sm = fs.readFileSync(smPath, 'utf8');
const changed = [];
const noDate = [];

sm = sm.replace(
  /<url>\s*<loc>https:\/\/voltfield\.org\/([^<]*)<\/loc>\s*<lastmod>([0-9-]{10})<\/lastmod>/g,
  (block, slug, lastmod) => {
    const swap = (to) => block.replace(`<lastmod>${lastmod}</lastmod>`,
                                       `<lastmod>${to}</lastmod>`);

    if (slug === '') {
      if (lastmod === HOMEPAGE_LASTMOD) return block;
      changed.push([slug || '/', lastmod, HOMEPAGE_LASTMOD]);
      return apply ? swap(HOMEPAGE_LASTMOD) : block;
    }

    const file = path.join(root, slug);
    if (!fs.existsSync(file)) return block;

    const declared = pageDate(fs.readFileSync(file, 'utf8'));
    if (!declared) { noDate.push([slug, lastmod]); return block; }
    if (declared === lastmod) return block;

    changed.push([slug, lastmod, declared]);
    return apply ? swap(declared) : block;
  }
);

const back = changed.filter(([, was, now]) => now < was).length;

console.log(`${changed.length} entr${changed.length === 1 ? 'y' : 'ies'} ${apply ? 'changed' : 'would change'}`);
for (const [slug, was, now] of changed) {
  console.log(`  ${(slug || '/').padEnd(48)} ${was} -> ${now}`);
}
console.log(`\n  ${back} moved earlier (lastmod ran ahead of the content), ${changed.length - back} moved later.`);
console.log(`  ${noDate.length} entr${noDate.length === 1 ? 'y' : 'ies'} left alone (page declares no dateModified).`);

if (apply) {
  fs.writeFileSync(smPath, sm);
  console.log('\nsitemap.xml written.');
}
