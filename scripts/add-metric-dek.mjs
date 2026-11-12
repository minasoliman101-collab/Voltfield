/* Metric twin of the headline description on the calculators whose description
   names US units. The description has no figures in it, so the automatic
   equivalents in voltfield-site-config.js have nothing to convert there.
   Run after add-metric-prose.mjs on any of these pages that is regenerated.
   Safe to re-run: a page that already has a metric description is skipped. */
import fs from 'node:fs';

const DEK = {
  'airflow-cfm': 'Find the airflow needed to remove a heat load: kW and air temperature rise to m³/h, with m³/h per kW for server and rack cooling.',
  'chilled-water-flow': 'Calculate chilled water flow in L/s from cooling load in kW and the supply-return temperature difference.',
  'pipe-velocity': 'Calculate water velocity in a pipe from flow in L/s and inside diameter, with a check against common hydronic design limits.',
  'pump-power': 'Calculate pump shaft power and motor kW from flow in L/s, head in metres and efficiency, and pick the next standard motor size.',
  'wire-resistance': 'Find the resistance of a copper or aluminum conductor from its size and length, one way or out and back, in ohms and ohms per km.'
};

let done = 0;
for (const [slug, text] of Object.entries(DEK)) {
  const file = `calculators/${slug}.html`;
  let h = fs.readFileSync(file, 'utf8');
  if (h.includes('<p class="dek" data-u="metric"')) continue;
  const m = h.match(/<p class="dek">([\s\S]*?)<\/p>/);
  if (!m) throw new Error(slug + ': description not found');
  h = h.replace(m[0], () => `<p class="dek" data-u="us">${m[1]}</p><p class="dek" data-u="metric" hidden>${text}</p>`);
  fs.writeFileSync(file, h);
  done++;
}
console.log('metric descriptions added:', done);
