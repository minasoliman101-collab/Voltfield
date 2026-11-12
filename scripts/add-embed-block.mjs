/* Puts the "Embed this calculator" block (scripts/tpl/calc-embed.html) on every
   calculator page, just before Related. The page generator writes the same
   block on pages it builds; this is for the pages that already exist, which
   are not regenerated because that would drop the passes run on them since.
   Safe to re-run: an existing block is replaced, not repeated. */
import fs from 'node:fs';

const tpl = fs.readFileSync('scripts/tpl/calc-embed.html', 'utf8').replace(/\r\n/g, '\n');
const widget = fs.readFileSync('embed/calculator-widget.js', 'utf8');
let n = 0;
for (const f of fs.readdirSync('calculators').filter(x => x.endsWith('.html'))) {
  const slug = f.slice(0, -5);
  if (!widget.includes('"' + slug + '":{"t":')) continue;          // not a tool the widget carries
  const file = 'calculators/' + f;
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = raw.includes('\r\n');
  let h = raw.replace(/\r\n/g, '\n');
  const h1 = h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!h1) throw new Error(slug + ': no h1');
  const title = h1[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const block = tpl.split('{{SLUG}}').join(slug).split('{{TITLE}}').join(title);
  const old = h.match(/  <h2[^>]*>Embed this calculator<\/h2>[\s\S]*?(?=  <h2>Related<\/h2>)/);
  if (old) h = h.replace(old[0], () => block);
  else {
    if (!h.includes('  <h2>Related</h2>')) throw new Error(slug + ': no Related heading to insert before');
    h = h.replace('  <h2>Related</h2>', () => block + '  <h2>Related</h2>');
  }
  if (h !== raw.replace(/\r\n/g, '\n')) { fs.writeFileSync(file, crlf ? h.replace(/\n/g, '\r\n') : h); n++; }
}
console.log('embed block written on', n, 'calculator pages');
