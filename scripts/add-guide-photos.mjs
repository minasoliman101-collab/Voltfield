// Adds a reference illustration beside each guide's headline.
//
// Why: the guides were the only long pages on the site with no picture at all,
// while images/parts/ already held an illustration of most of the equipment
// they discuss. A photo of the thing being explained, before the explanation,
// is the cheapest orientation a reader can get.
//
// Only where PHOTO below names one. The policy and process guides (BABA, FEOC,
// the interconnection queue and the three regional timelines) get none: no
// picture in the library shows "a queue" or "a sourcing rule", and the rule in
// voltfield-component-viz.js applies here too -- better no picture than a
// picture of something else. Also avoid any of the 62 library files that are
// byte-identical copies of the transformer render, except where the subject
// really is a large oil-filled transformer.
//
// Idempotent: a guide whose banner already has class="artban-in has-photo" is
// skipped. Styles: ".artban-in.has-photo" in voltfield-core.css.
//
// Usage: node scripts/add-guide-photos.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

// guide -> [image basename in images/parts/, caption, alt text]
const PHOTO = {
  'guide-415v-vs-480v-distribution.html': ['dc-floor-pdu-rpp', 'Floor-standing PDU', 'A floor-standing power distribution unit cabinet'],
  'guide-arc-flash-boundary-basics.html': ['dc-lv-switchgear', 'Low-voltage switchgear', 'A low-voltage switchgear section with breaker doors'],
  'guide-arc-flash-ppe-categories.html': ['mro-head-eye-face-protection', 'Head and face protection', 'A hard hat with a clear face shield'],
  'guide-bess-augmentation.html': ['bess-modular-battery-racks', 'Battery modules in racks', 'Lithium battery modules stacked in a rack'],
  'guide-bess-c-rate.html': ['bess-containerized-enclosures', 'Containerized battery system', 'A containerized battery energy storage enclosure'],
  'guide-bess-fire-safety-nfpa-855.html': ['bess-aerosol-clean-agent-suppression', 'Fire-suppression agent cylinder', 'A red fire-suppression agent cylinder'],
  'guide-cable-ampacity-derating.html': ['dc-lv-power-cable', 'Low-voltage power cable', 'Coils of insulated low-voltage power cable'],
  'guide-continuous-load-80-percent-rule.html': ['dc-molded-case-breakers-mccb-15-1200a', 'Molded-case circuit breaker', 'A molded-case circuit breaker'],
  'guide-fully-rated-vs-series-rated.html': ['mro-electrical-distribution-equipment', 'Panelboard with branch breakers', 'A panelboard with rows of branch circuit breakers'],
  'guide-generator-sizing.html': ['dc-diesel-gensets', 'Diesel standby generator set', 'A diesel engine generator set on a skid'],
  'guide-grid-forming-vs-grid-following.html': ['bess-grid-forming-pcs', 'Battery power conversion system', 'A battery power conversion system cabinet'],
  'guide-ground-fault-protection.html': ['dc-air-circuit-breakers', 'Air circuit breaker', 'A draw-out air circuit breaker'],
  'guide-grounding-bonding-basics.html': ['dc-ground-bars-kits', 'Copper ground bar', 'A copper ground bar with lugs and insulated standoffs'],
  'guide-harmonics-ieee-519.html': ['mro-motor-controls-drives', 'Variable-frequency drive', 'A variable-frequency motor drive with a keypad'],
  'guide-inverter-clipping-ratio.html': ['re-central-inverters-utility', 'Utility-scale central inverter', 'A utility-scale central solar inverter enclosure'],
  'guide-kw-vs-kva.html': ['dc-power-meters-bms', 'Panel power meter', 'A panel-mounted digital power meter'],
  'guide-liquid-vs-air-cooling.html': ['dc-coolant-distribution-units-cdu', 'Coolant distribution unit', 'A coolant distribution unit with piping connections'],
  'guide-n-plus-1-vs-2n-redundancy.html': ['dc-static-transfer-switches', 'Static transfer switch', 'A static transfer switch cabinet'],
  'guide-pad-mount-vs-gsu-transformers.html': ['dc-pad-mount-transformers', 'Pad-mount transformer', 'A green pad-mounted transformer enclosure'],
  'guide-pue-explained.html': ['dc-crah-crac-units', 'Computer-room air handler', 'A computer-room air handler unit'],
  'guide-short-circuit-studies-breaker-coordination.html': ['dc-protective-relays', 'Protective relay', 'A protective relay with a display and keypad'],
  'guide-switchgear-compartments.html': ['dc-mv-switchgear-5-38kv', 'Switchgear lineup', 'A lineup of switchgear sections'],
  'guide-transformer-impedance.html': ['dc-dry-type-cast-resin-transformers', 'Cast-resin dry-type transformer', 'A cast-resin dry-type transformer core and coils'],
  'guide-transformer-lead-times.html': ['dc-large-power-transformers', 'Large power transformer', 'A large oil-filled power transformer with bushings and radiators'],
  'guide-transformer-nameplate.html': ['dc-isolation-k-rated-transformers', 'Ventilated dry-type transformer', 'A ventilated dry-type transformer enclosure'],
  'guide-ups-sizing.html': ['dc-ups-systems-static', 'Static UPS cabinet', 'A static UPS cabinet with a front display panel'],
  'guide-ups-topologies.html': ['dc-ups-systems-static', 'Static UPS cabinet', 'A static UPS cabinet with a front display panel'],
};

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const report = [];
for (const [f, [img, cap, alt]] of Object.entries(PHOTO)) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) throw new Error('missing guide: ' + f);
  for (const ext of ['jpg', 'webp']) if (!fs.existsSync(path.join(root, 'images/parts', `${img}.${ext}`))) throw new Error(`missing images/parts/${img}.${ext}`);
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  if (s.includes('class="artban-in has-photo"')) { report.push(`skip ${f} (already has a photo)`); continue; }
  const ban = s.match(/<section class="artban">\n  <div class="artban-in">\n([\s\S]*?)\n  <\/div>\n<\/section>/);
  if (!ban) throw new Error(`${f}: artban markup not recognised`);
  const inner = ban[1].split('\n').map((l) => '  ' + l).join('\n');
  s = s.replace(ban[0], `<section class="artban">
  <div class="artban-in has-photo">
    <div class="artban-text">
${inner}
    </div>
    <figure class="artban-photo">
      <picture><source srcset="images/parts/${img}.webp" type="image/webp"><img src="images/parts/${img}.jpg" width="340" height="340" alt="${esc(alt)}" decoding="async" fetchpriority="high"></picture>
      <figcaption>${esc(cap)} (illustration)</figcaption>
    </figure>
  </div>
</section>`);
  if (s.split('<div').length !== s.split('</div>').length) throw new Error(`${f}: div balance`);
  report.push(`${DRY ? 'would add' : 'added'} ${img} to ${f}`);
  if (!DRY) fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
}
const all = fs.readdirSync(root).filter((f) => /^guide-.*\.html$/.test(f));
report.push(`no photo (by design): ${all.filter((f) => !PHOTO[f]).join(', ')}`);
console.log(report.join('\n'));
