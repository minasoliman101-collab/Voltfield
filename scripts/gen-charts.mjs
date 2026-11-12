#!/usr/bin/env node
/*
 * Generates the reference chart pages under charts/ and their hub,
 * reference-charts.html.
 *
 *   node scripts/gen-charts.mjs            # all pages
 *   node scripts/gen-charts.mjs awg-wire-size-chart   # just these slugs
 *
 * WHY THESE AND NOT OTHERS. Every number on these pages is computed here, from
 * a formula the page states, so a reader can check any cell and the chart
 * cannot drift from the calculator that uses the same formula. That is also
 * the line the site already draws in its guides: explain a code table's method,
 * do not reproduce the table.
 *
 * TWO EXCEPTIONS, added Nov 2026 at the owner's request: wire-ampacity-chart
 * and motor-full-load-current-chart. Those carry values that correspond to
 * NEC Tables 310.16, 430.248 and 430.250. They are DATA, typed in below, not
 * computed, so they are the two charts here that can be wrong in a way the
 * script cannot catch. Each is marked `codeTable: true`, which swaps the
 * "computed from a formula" wording on the page for a statement of where the
 * values come from and an instruction to check them against the adopted code.
 * Check them against the code book before changing anything, and again when a
 * new edition is adopted.
 *
 * The page shell (head boilerplate, header, footer) is taken from an existing
 * calculator page, the same way gen-guides.mjs stamps guides from a guide, so
 * the chrome cannot drift from the rest of the site.
 *
 * METRIC. A table may carry a `metric` twin (same shape, metric values). Both
 * are written into the page; the metric one starts hidden and the US / Metric
 * switch swaps them, using the same remembered choice as the calculators
 * (localStorage vf_units, or ?units=metric). Metric values are computed here
 * from the same formulas, not converted from the rounded US cells, so a
 * metric cell is not a rounding of a rounding. Tables with no unit to switch
 * (amps against kW, breaker ratings) have no twin and show in both modes.
 *
 * After running: node scripts/trust-and-ads-pass.mjs is NOT needed (the shell
 * already carries the footer row and the pages emit their own ad slots), but
 * new slugs still have to go into sitemap.xml, _redirects and search-index.json.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const TEMPLATE = 'calculators/ohms-law.html';
const DATE_ISO = '2026-11-11';
const DATE_LONG = 'November 11, 2026';
const BASE = 'https://voltfield.org/';
const R3 = Math.sqrt(3);

/* ------------------------------------------------------------ numbers ---- */
const f = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const sig = (v) => v >= 100 ? f(v, 0) : v >= 10 ? f(v, 1) : v >= 1 ? f(v, 2) : f(v, 3);

/* Conductor areas in circular mils: the standard values, the same ones the
   voltage drop and wire resistance calculators use. */
const WIRE = [
  ['18 AWG', 1620, 18], ['16 AWG', 2580, 16], ['14 AWG', 4110, 14], ['12 AWG', 6530, 12], ['10 AWG', 10380, 10],
  ['8 AWG', 16510, 8], ['6 AWG', 26240, 6], ['4 AWG', 41740, 4], ['3 AWG', 52620, 3], ['2 AWG', 66360, 2],
  ['1 AWG', 83690, 1], ['1/0 AWG', 105600, 0], ['2/0 AWG', 133100, -1], ['3/0 AWG', 167800, -2], ['4/0 AWG', 211600, -3],
  ['250 kcmil', 250000], ['300 kcmil', 300000], ['350 kcmil', 350000], ['400 kcmil', 400000], ['500 kcmil', 500000],
  ['600 kcmil', 600000], ['750 kcmil', 750000], ['1000 kcmil', 1000000],
];
const K_CU = 12.9, K_AL = 21.2;
/* 75 degC copper, with the small-conductor limits applied. Used ONLY to blank
   out voltage-drop cells where the current would overload the wire. */
const AMP_LIMIT = { '14 AWG': 15, '12 AWG': 20, '10 AWG': 30, '8 AWG': 50, '6 AWG': 65, '4 AWG': 85, '3 AWG': 100, '2 AWG': 115, '1 AWG': 130, '1/0 AWG': 150, '2/0 AWG': 175, '3/0 AWG': 200, '4/0 AWG': 230 };
const STD_OCPD = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200];

/* Allowable ampacities, not more than three current-carrying conductors in a
   raceway, cable or earth, 30 degC ambient. [60, 75, 90 degC]. The same values
   the cable ampacity calculator has always carried (voltfield-calculators.js,
   NEC_AMPACITY); keep the two in step. Stops at 500 kcmil because that is as
   far as the checked data goes. */
const AMPACITY = [
  ['14 AWG', [15, 20, 25], null],
  ['12 AWG', [20, 25, 30], [15, 20, 25]],
  ['10 AWG', [30, 35, 40], [25, 30, 35]],
  ['8 AWG', [40, 50, 55], [35, 40, 45]],
  ['6 AWG', [55, 65, 75], [40, 50, 55]],
  ['4 AWG', [70, 85, 95], [55, 65, 75]],
  ['3 AWG', [85, 100, 115], [65, 75, 85]],
  ['2 AWG', [95, 115, 130], [75, 90, 100]],
  ['1 AWG', [110, 130, 145], [85, 100, 115]],
  ['1/0 AWG', [125, 150, 170], [100, 120, 135]],
  ['2/0 AWG', [145, 175, 195], [115, 135, 150]],
  ['3/0 AWG', [165, 200, 225], [130, 155, 175]],
  ['4/0 AWG', [195, 230, 260], [150, 180, 205]],
  ['250 kcmil', [215, 255, 290], [170, 205, 230]],
  ['300 kcmil', [240, 285, 320], [195, 230, 260]],
  ['350 kcmil', [260, 310, 350], [210, 250, 280]],
  ['400 kcmil', [280, 335, 380], [225, 270, 305]],
  ['500 kcmil', [320, 380, 430], [260, 310, 350]],
];
/* Ambient correction, 30 degC base: ambient -> [60, 75, 90 degC insulation]. */
const AMB_CORR = [[30, [1.00, 1.00, 1.00]], [35, [0.91, 0.94, 0.96]], [40, [0.82, 0.88, 0.91]], [45, [0.71, 0.82, 0.87]], [50, [0.58, 0.75, 0.82]], [55, [0.41, 0.67, 0.76]], [60, [null, 0.58, 0.71]]];
/* Adjustment for more than three current-carrying conductors. */
const CCC_ADJ = [['4 to 6', 80], ['7 to 9', 70], ['10 to 20', 50], ['21 to 30', 45], ['31 to 40', 40], ['41 and above', 35]];
/* Three-phase induction motors, full-load current in amperes: hp -> [208, 230, 460, 575 V]. */
const FLC3 = [
  [0.5, [2.4, 2.2, 1.1, 0.9]], [0.75, [3.5, 3.2, 1.6, 1.3]], [1, [4.6, 4.2, 2.1, 1.7]], [1.5, [6.6, 6.0, 3.0, 2.4]], [2, [7.5, 6.8, 3.4, 2.7]],
  [3, [10.6, 9.6, 4.8, 3.9]], [5, [16.7, 15.2, 7.6, 6.1]], [7.5, [24.2, 22, 11, 9]], [10, [30.8, 28, 14, 11]], [15, [46.2, 42, 21, 17]],
  [20, [59.4, 54, 27, 22]], [25, [74.8, 68, 34, 27]], [30, [88, 80, 40, 32]], [40, [114, 104, 52, 41]], [50, [143, 130, 65, 52]],
  [60, [169, 154, 77, 62]], [75, [211, 192, 96, 77]], [100, [273, 248, 124, 99]], [125, [343, 312, 156, 125]], [150, [396, 360, 180, 144]],
  [200, [528, 480, 240, 192]], [250, [null, null, 302, 242]], [300, [null, null, 361, 289]], [350, [null, null, 414, 336]], [400, [null, null, 477, 382]],
  [450, [null, null, 515, 412]], [500, [null, null, 590, 472]],
];
/* Single-phase motors: hp -> [115, 230 V]. */
const FLC1 = [['1/6', [4.4, 2.2]], ['1/4', [5.8, 2.9]], ['1/3', [7.2, 3.6]], ['1/2', [9.8, 4.9]], ['3/4', [13.8, 6.9]], ['1', [16, 8]], ['1-1/2', [20, 10]], ['2', [24, 12]], ['3', [34, 17]], ['5', [56, 28]], ['7-1/2', [80, 40]], ['10', [100, 50]]];
/* Sanity checks the data can be given: the table itself is built so that the
   230 V column is twice the 460 V column and the 208 V column is 1.1 times the
   230 V one. A typing slip in one cell breaks the pattern and stops the build. */
for (const [hp, [v208, v230, v460]] of FLC3) {
  if (v230 != null && Math.abs(v230 - 2 * v460) > 0.051) throw new Error('FLC3 230 V is not 2 x 460 V at ' + hp + ' hp');
  if (v208 != null && Math.abs(v208 - 1.1 * v230) > 0.51) throw new Error('FLC3 208 V is not 1.1 x 230 V at ' + hp + ' hp');
}
for (const [hp, [v115, v230]] of FLC1) if (Math.abs(v115 - 2 * v230) > 0.051) throw new Error('FLC1 115 V is not 2 x 230 V at ' + hp + ' hp');
for (const [n, cu, al] of AMPACITY) {
  if (!(cu[0] <= cu[1] && cu[1] <= cu[2])) throw new Error('ampacity not rising with temperature at ' + n);
  if (al && !(al[0] < cu[0] && al[2] < cu[2])) throw new Error('aluminum not below copper at ' + n);
}
const hpLabel = (h) => h === 0.5 ? '1/2' : h === 0.75 ? '3/4' : h === 1.5 ? '1-1/2' : h === 7.5 ? '7-1/2' : String(h);
const dash = (v, d = 0) => v == null ? '&mdash;' : f(v, d);
const amp1 = (v) => v == null ? '&mdash;' : (v % 1 ? f(v, 1) : f(v));

const IEC_MM2 = [0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
function awgTable() {
  return {
    id: 'awg', title: 'AWG and kcmil wire sizes',
    caption: 'Diameter is that of a solid round conductor of the stated area. A stranded conductor of the same size is slightly larger overall. Resistance is DC, at about 75&deg;C.',
    head: ['Size', 'Diameter (in)', 'Diameter (mm)', 'Area (cmil)', 'Area (mm&sup2;)', 'Copper (&Omega;/1000 ft)', 'Aluminum (&Omega;/1000 ft)'],
    rows: WIRE.map(([n, cm]) => {
      const dIn = Math.sqrt(cm) / 1000;
      return [n, f(dIn, 4), f(dIn * 25.4, 2), f(cm), sig(cm * 5.067075e-4), f(K_CU * 1000 / cm, cm >= 100000 ? 4 : 3), f(K_AL * 1000 / cm, cm >= 100000 ? 4 : 3)];
    }),
    metric: {
      title: 'AWG and kcmil wire sizes in metric units',
      caption: 'Diameter is that of a solid round conductor of the stated area. The last column is the next standard IEC conductor size at or above the AWG area, which is the usual choice when a metric cable replaces an AWG one. Resistance is DC, at about 75&deg;C.',
      head: ['Size', 'Diameter (mm)', 'Area (mm&sup2;)', 'Copper (&Omega;/km)', 'Aluminum (&Omega;/km)', 'Next IEC size (mm&sup2;)'],
      rows: WIRE.map(([n, cm]) => {
        const mm2 = cm * 5.067075e-4, perKm = (K) => K * 1000 / cm / 0.3048;
        const iec = IEC_MM2.find(x => x >= mm2 - 1e-9);
        return [n, f(Math.sqrt(cm) / 1000 * 25.4, 2), sig(mm2), sig(perKm(K_CU)), sig(perKm(K_AL)), iec == null ? '&mdash;' : String(iec)];
      }),
    },
  };
}
function vdTable(volts, mult, label, amps) {
  const sizes = WIRE.filter(([n]) => AMP_LIMIT[n]);
  return {
    id: 'vd' + volts, title: `Maximum one-way length for 3% drop: ${label}`,
    caption: `Copper conductors, in feet, rounded down. A dash means that current is more than the conductor may carry, so no length is given.`,
    head: ['Wire size', ...amps.map(a => a + ' A')],
    rows: sizes.map(([n, cm]) => [n, ...amps.map(a => a > AMP_LIMIT[n] ? '&mdash;' : f(Math.floor(0.03 * volts * cm / (mult * K_CU * a))))]),
    metric: {
      title: `Maximum one-way length for 3% drop: ${label}`,
      caption: `Copper conductors, in metres, rounded down. A dash means that current is more than the conductor may carry, so no length is given.`,
      head: ['Wire size', ...amps.map(a => a + ' A')],
      rows: sizes.map(([n, cm]) => [n, ...amps.map(a => a > AMP_LIMIT[n] ? '&mdash;' : f(Math.floor(0.3048 * 0.03 * volts * cm / (mult * K_CU * a))))]),
    },
  };
}

/* -------------------------------------------------------------- specs ---- */
const L = (h, t) => `<a class="inline" href="${h}">${t}</a>`;
const CHARTS = [
{
  slug: 'awg-wire-size-chart', badge: 'AWG',
  h1: 'AWG Wire Size Chart', title: 'AWG Wire Size Chart (Diameter, Area, Resistance)',
  card: 'Diameter, area in cmil and mm&sup2;, and resistance per 1000 ft for 18 AWG through 1000 kcmil.',
  desc: 'AWG wire size chart: diameter in inches and mm, area in circular mils and mm&sup2;, and copper and aluminum resistance per 1000 ft, from 18 AWG to 1000 kcmil.',
  dek: 'Every standard size from 18 AWG to 1000 kcmil, with its diameter, its area in circular mils and square millimetres, and its resistance in copper and aluminum.',
  lead: '<b>In the American Wire Gauge system a smaller number is a larger wire, and every three sizes the area doubles.</b> A 10 AWG conductor has about twice the copper of a 13 AWG and half the resistance; go up six sizes and the diameter doubles. Above 4/0 the gauge numbers stop and sizes are given directly by area, in thousands of circular mils (kcmil).',
  tables: () => [awgTable()],
  how: [
    'Area in circular mils is the diameter in thousandths of an inch, squared. A wire one mil across is one circular mil; a wire 100 mils across is 10,000. It is a unit invented to avoid &pi; in the arithmetic.',
    'Square millimetres are circular mils times 0.0005067. AWG sizes do not land on the standard metric sizes: 12 AWG is 3.31 mm&sup2;, between the IEC sizes of 2.5 and 4 mm&sup2;. When a metric cable replaces an AWG one, the next size up is the safe choice.',
    'Resistance is K &times; 1000 / area, with K = 12.9 for copper and 21.2 for aluminum in ohm-circular mils per foot. That is the same approximation the voltage drop calculator uses, and it tracks the 75&deg;C figures in NEC Chapter 9, Table 8 closely.',
  ],
  formula: 'Area (cmil) = (diameter in mils)&sup2;<br>Area (mm&sup2;) = cmil &times; 0.0005067<br>R (&Omega;/1000 ft) = K &times; 1000 / cmil',
  limits: 'This chart gives geometry and resistance. It does not give ampacity, which depends on insulation temperature rating, how many conductors share a raceway, the ambient temperature and the terminations, and has to come from the adopted code. Resistance is DC; on large conductors carrying AC, skin effect raises the effective figure.',
  faqs: [
    ['Why does a smaller AWG number mean a bigger wire?', 'The gauge number originally counted the drawing steps used to make the wire. Each pass through a die made it thinner, so more passes, a higher number, meant a finer wire. The modern system keeps that direction and fixes the sizes by formula.'],
    ['What comes after 4/0 AWG?', 'Sizes larger than 4/0 are given by area in thousands of circular mils: 250 kcmil, 300 kcmil and upward. 4/0 is 211,600 circular mils, so 250 kcmil is the next standard size. The older abbreviation MCM means the same as kcmil.'],
    ['How do I convert AWG to mm&sup2;?', 'Multiply the area in circular mils by 0.0005067. 12 AWG is 6,530 cmil, which is 3.31 mm&sup2;. Because AWG and metric sizes do not line up, a metric replacement is normally the next standard size above that figure.'],
  ],
  related: [['calculators/awg-to-mm2.html', 'AWG to mm&sup2; Converter'], ['calculators/wire-resistance.html', 'Wire Resistance Calculator'], ['calculators/wire-size.html', 'Wire Size Calculator'], ['calculators/voltage-drop.html', 'Voltage Drop Calculator'], ['charts/voltage-drop-chart.html', 'Voltage Drop Chart']],
  basedOn: ['ASTM B258 &mdash; nominal diameters and cross-sectional areas of AWG sizes', 'NEC Chapter 9, Table 8 &mdash; conductor properties, for comparison of the resistance figures'],
},
{
  slug: 'kva-to-amps-chart', badge: 'kVA',
  h1: 'kVA to Amps Chart', title: 'kVA to Amps Chart (Transformer Full-Load Amps)',
  card: 'Full-load amps for standard transformer sizes at 208, 240, 480 and 600 V.',
  desc: 'kVA to amps chart: full-load current for standard single-phase and three-phase transformer sizes at 120, 208, 240, 480 and 600 V, with the formula.',
  dek: 'Full-load current for the standard transformer sizes at the common voltages, three-phase and single-phase.',
  lead: '<b>Three-phase amps are kVA times 1,000, divided by 1.732 times the line voltage.</b> A 75 kVA transformer delivers 208 A at 208 V and 90 A at 480 V. There is no power factor in the conversion: kVA is already volts times amps.',
  tables: () => [
    { id: 'kva3', title: 'Three-phase', caption: 'Full-load amps per phase at the stated line-to-line voltage.',
      head: ['kVA', '208 V', '240 V', '480 V', '600 V'],
      rows: [15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500, 3000].map(k => [f(k, k % 1 ? 1 : 0), ...[208, 240, 480, 600].map(v => sig(k * 1000 / (R3 * v)))]) },
    { id: 'kva1', title: 'Single-phase', caption: 'Full-load amps at the stated voltage.',
      head: ['kVA', '120 V', '240 V', '480 V'],
      rows: [1, 3, 5, 10, 15, 25, 37.5, 50, 75, 100, 167].map(k => [f(k, k % 1 ? 1 : 0), ...[120, 240, 480].map(v => sig(k * 1000 / v))]) },
  ],
  how: [
    'Find the transformer rating in the first column and read across to the voltage of the winding you are interested in. Each winding has its own current: a 500 kVA unit stepping 480 V down to 208 V carries 601 A on the primary and 1,388 A on the secondary.',
    'These are full-load currents at rated kVA. A transformer serving a 400 kVA load carries 80 percent of the figure shown for 500 kVA.',
  ],
  formula: 'I = kVA &times; 1000 / (1.732 &times; V)&nbsp; [three-phase]<br>I = kVA &times; 1000 / V&nbsp; [single-phase]',
  limits: 'Full-load current is the starting point for sizing conductors and overcurrent protection, not the answer. NEC 450.3 sets transformer protection as a percentage of this current, conductors are sized under Article 310 with the 125 percent continuous-load factor where it applies, and the figure says nothing about inrush or the fault current the transformer can deliver.',
  faqs: [
    ['How many amps is a 75 kVA transformer?', 'At full load, a three-phase 75 kVA transformer carries 208 A at 208 V, 180 A at 240 V and 90 A at 480 V. A single-phase 75 kVA unit carries 313 A at 240 V.'],
    ['Do I need power factor to convert kVA to amps?', 'No. kVA is apparent power, which is voltage times current, so current follows directly. Power factor only enters when converting between kVA and kW.'],
    ['Is the primary current the same as the secondary current?', 'No. The kVA is the same on both sides, but the current is inversely proportional to voltage. Look up each winding at its own voltage.'],
  ],
  related: [['calculators/kva-to-amps.html', 'kVA to Amps Calculator'], ['calculators/transformer-sizing.html', 'Transformer Sizing Calculator'], ['calculators/amps-to-kva.html', 'Amps to kVA Calculator'], ['guide-transformer-nameplate.html', 'How to Read a Transformer Nameplate'], ['guide-kw-vs-kva.html', 'kW vs. kVA Explained']],
  basedOn: ['The definition of apparent power', 'IEEE C57.12.00 and C57.12.01 &mdash; standard kVA ratings for liquid-immersed and dry-type transformers'],
},
{
  slug: 'kw-to-amps-chart', badge: 'kW',
  h1: 'kW to Amps Chart', title: 'kW to Amps Chart (Three-Phase and Single-Phase)',
  card: 'Current for 1 kW to 1,000 kW at 208, 240, 480 and 600 V three-phase, and 120 and 240 V single-phase.',
  desc: 'kW to amps chart for three-phase loads at 208, 240, 480 and 600 V and single-phase loads at 120 and 240 V, with the formula and how power factor changes it.',
  dek: 'Current for a given real power at the common three-phase and single-phase voltages.',
  lead: '<b>Three-phase amps are kW times 1,000, divided by 1.732 times the voltage times the power factor.</b> At 480 V and a power factor of 0.9, each kW draws about 1.34 A, so 100 kW is 134 A. The three-phase table below is worked at 0.9; the note under it says how to adjust for any other value.',
  tables: () => [
    { id: 'kw3', title: 'Three-phase, power factor 0.9', caption: 'Amps per phase. For another power factor, multiply by 0.9 and divide by yours: at 0.8, the figures are 12.5 percent higher.',
      head: ['kW', '208 V', '240 V', '480 V', '600 V'],
      rows: [1, 2, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500, 750, 1000].map(k => [f(k, k % 1 ? 1 : 0), ...[208, 240, 480, 600].map(v => sig(k * 1000 / (R3 * v * 0.9)))]) },
    { id: 'kw1', title: 'Single-phase, power factor 1.0', caption: 'Amps for a resistive load such as a heater. For a load with a lower power factor, divide by it.',
      head: ['kW', '120 V', '240 V'],
      rows: [0.5, 1, 1.5, 2, 3, 4, 5, 7.5, 10, 15, 20].map(k => [f(k, k % 1 ? 1 : 0), ...[120, 240].map(v => sig(k * 1000 / v))]) },
  ],
  how: [
    'Find the load in the first column and read across to the system voltage. The three-phase figures are line current, the current in each of the three conductors.',
    'Power factor matters. The same 100 kW at 480 V draws 120 A at unity power factor, 134 A at 0.9 and 150 A at 0.8. If you do not know the power factor of a motor load, 0.85 is a more cautious assumption than 0.9.',
  ],
  formula: 'I = kW &times; 1000 / (1.732 &times; V &times; PF)&nbsp; [three-phase]<br>I = kW &times; 1000 / (V &times; PF)&nbsp; [single-phase]',
  limits: 'This is steady-state current at the stated power factor. It is not the current to size a conductor or a breaker from: a continuous load is taken at 125 percent, motors are sized from the code tables and not from nameplate power, and starting current is several times the running figure.',
  faqs: [
    ['How many amps is 100 kW at 480 V?', 'About 134 A per phase at a power factor of 0.9, on a three-phase supply. At unity power factor it is 120 A, and at 0.8 it is 150 A.'],
    ['How many amps is 1 kW?', 'It depends on the voltage. On single-phase, 1 kW is 8.3 A at 120 V and 4.2 A at 240 V for a resistive load. On three-phase at 0.9 power factor it is 3.1 A at 208 V and 1.3 A at 480 V.'],
    ['Why is the three-phase current lower than single-phase for the same power?', 'Three conductors share the power, and the factor of 1.732 in the formula reflects that. For the same voltage and power, the current in each three-phase conductor is the single-phase current divided by 1.732.'],
  ],
  related: [['calculators/kw-to-amps.html', 'kW to Amps Calculator'], ['calculators/amps-to-kw.html', 'Amps to kW Calculator'], ['calculators/watts-to-amps.html', 'Watts to Amps Calculator'], ['charts/kva-to-amps-chart.html', 'kVA to Amps Chart'], ['guide-kw-vs-kva.html', 'kW vs. kVA Explained']],
  basedOn: ['The definitions of real power in single-phase and balanced three-phase systems'],
},
{
  slug: 'breaker-size-chart', badge: 'OCPD',
  h1: 'Breaker Size Chart', title: 'Breaker Size Chart (80% Continuous Load)',
  card: 'Each standard breaker rating with the continuous load it can carry and what that is in kW.',
  desc: 'Breaker size chart: every standard rating from 15 A to 1200 A with its 80 percent continuous load in amps and the equivalent kW at 120, 240, 208 and 480 V.',
  dek: 'Every standard breaker rating from 15 A to 1,200 A, the continuous load it may carry, and what that load is in kilowatts.',
  lead: '<b>A standard breaker may carry a continuous load of 80 percent of its rating.</b> That is the 125 percent sizing rule read backwards: a 20 A breaker takes 16 A of continuous load, a 100 A breaker takes 80 A. A continuous load is one expected to run at its maximum for three hours or more.',
  tables: () => [
    { id: 'bk', title: 'Standard ratings and continuous load', caption: 'kW figures are the continuous load at unity power factor. For a non-continuous load the full rating applies.',
      head: ['Breaker (A)', 'Continuous load (A)', 'kW at 120 V 1&phi;', 'kW at 240 V 1&phi;', 'kW at 208 V 3&phi;', 'kW at 480 V 3&phi;'],
      rows: STD_OCPD.map(a => { const c = a * 0.8; return [f(a), f(c, c % 1 ? 1 : 0), sig(c * 120 / 1000), sig(c * 240 / 1000), sig(c * 208 * R3 / 1000), sig(c * 480 * R3 / 1000)]; }) },
  ],
  how: [
    'To size a breaker for a load, find the first row whose continuous-load figure is at or above your load. A 52 A continuous load is more than a 60 A breaker allows (48 A), so it needs 70 A.',
    'The kW columns answer the opposite question: how much a circuit can supply. A 20 A, 120 V circuit carries 1.92 kW continuously, which is why a 1,500 W heater is close to the limit of one.',
    'Where a load is partly continuous and partly not, add 125 percent of the continuous part to the rest and choose the next standard rating at or above the total. The breaker size calculator does that sum.',
  ],
  formula: 'Continuous load = breaker rating &times; 0.80<br>Minimum breaker = (continuous load &times; 1.25) + non-continuous load',
  limits: 'The chart sizes a breaker from a load. It does not size the conductor, and the breaker must also protect the conductor at its ampacity. It does not apply to motor circuits, where NEC Article 430 sets protection by its own percentages, or to breakers in assemblies listed for operation at 100 percent of rating. It says nothing about interrupting rating, which is set by the available fault current.',
  faqs: [
    ['How many amps can a 20 amp breaker handle?', 'A 20 A breaker can carry 20 A of non-continuous load, or 16 A of continuous load, meaning a load that runs at its maximum for three hours or more. On a 120 V circuit, 16 A is 1.92 kW.'],
    ['What size breaker do I need for 50 amps?', 'If the 50 A load is continuous, multiply by 1.25 to get 62.5 A and take the next standard size, 70 A. If it is non-continuous, a 50 A breaker is enough. The conductor has to be sized to match.'],
    ['Why can a breaker only be loaded to 80 percent?', 'A standard breaker is tested in open air and is used in an enclosure, where it runs hotter. The 125 percent rule keeps a continuous load within what the breaker can carry in an enclosure without nuisance tripping. Assemblies specifically listed for 100 percent operation are exempt.'],
  ],
  related: [['calculators/breaker-size.html', 'Breaker Size Calculator'], ['guide-continuous-load-80-percent-rule.html', 'The 80% Rule &amp; Continuous Loads'], ['calculators/wire-size.html', 'Wire Size Calculator'], ['guide-fuse-vs-breaker.html', 'Fuse vs. Circuit Breaker'], ['guide-interrupting-rating-vs-sccr.html', 'Interrupting Rating vs. SCCR']],
  basedOn: ['NEC 240.6(A) &mdash; standard ampere ratings', 'NEC 210.20(A) and 215.3 &mdash; the 125 percent requirement for continuous loads'],
},
{
  slug: 'voltage-drop-chart', badge: 'VD',
  h1: 'Voltage Drop Chart', title: 'Voltage Drop Chart (Max Wire Length for 3%)',
  card: 'The longest run each copper wire size can make at 3% drop, for 120 V, 240 V and 480 V circuits.',
  desc: 'Voltage drop chart: maximum one-way wire length for a 3 percent drop, by copper wire size and current, for 120 V and 240 V single-phase and 480 V three-phase.',
  dek: 'How far each copper wire size can run before it loses 3 percent of the voltage, at common currents and voltages.',
  lead: '<b>For a 3 percent drop, the longest one-way run is 0.03 times the voltage times the wire area, divided by the current and a constant.</b> At 120 V, 12 AWG copper carrying 20 A reaches the 3 percent mark at 45 ft. The same wire on a 240 V circuit goes twice as far, because the allowed drop in volts is twice as large.',
  tables: () => [
    vdTable(120, 2, '120 V single-phase', [5, 10, 15, 20, 30, 40, 50]),
    vdTable(240, 2, '240 V single-phase', [15, 20, 30, 40, 50, 60, 80, 100]),
    vdTable(480, R3, '480 V three-phase', [20, 30, 50, 60, 80, 100, 150, 200]),
  ],
  how: [
    'Pick the table for your voltage, find the current across the top, and read down to the first wire size whose length is at least the length of your run. Lengths are one way, from source to load.',
    'A dash means the current is more than that conductor may carry, so the wire is ruled out before voltage drop is even considered. On short runs ampacity decides the wire size; on long runs voltage drop does.',
    'For a 5 percent limit, multiply any length by 1.67. For aluminum, multiply by 0.61. For a different voltage on the same kind of circuit, scale the length in proportion: a 208 V single-phase run is 208/240 of the 240 V figure.',
  ],
  formula: 'L = (0.03 &times; V &times; cmil) / (2 &times; 12.9 &times; I)&nbsp; [single-phase]<br>L = (0.03 &times; V &times; cmil) / (1.732 &times; 12.9 &times; I)&nbsp; [three-phase]',
  limits: 'The K-factor method uses resistance only. It ignores reactance, which matters on large conductors and long runs, so the lengths for the biggest sizes are optimistic. It assumes copper at about 75&deg;C and a load at the far end. The 3 percent figure is a recommendation in the NEC informational notes for a branch circuit or a feeder, not a requirement, though some equipment and some local codes do require it.',
  faqs: [
    ['How far can I run 12 gauge wire on a 20 amp circuit?', 'At 120 V, 12 AWG copper carrying a full 20 A reaches a 3 percent voltage drop at about 45 ft one way. At 16 A, the continuous limit for that circuit, it reaches about 57 ft. Beyond that, go up to 10 AWG.'],
    ['Is 3 percent voltage drop a code requirement?', 'In the NEC it is a recommendation, given in informational notes: 3 percent for a branch circuit or a feeder and 5 percent for the two combined. It becomes a requirement where a local code adopts it, and for some specific equipment such as fire pumps.'],
    ['Why does a higher voltage allow a longer run?', 'The allowed drop is a percentage of the voltage. Three percent of 240 V is 7.2 V, twice the 3.6 V allowed at 120 V, and for the same power the current is lower as well. That is the main reason long feeders are run at higher voltage.'],
  ],
  related: [['calculators/voltage-drop.html', 'Voltage Drop Calculator'], ['calculators/wire-size.html', 'Wire Size Calculator'], ['calculators/wire-resistance.html', 'Wire Resistance Calculator'], ['charts/awg-wire-size-chart.html', 'AWG Wire Size Chart'], ['guide-cable-ampacity-derating.html', 'Cable Ampacity Derating']],
  basedOn: ['The K-factor voltage drop method, with K = 12.9 ohm-circular mils per foot for copper', 'NEC 210.19 and 215.2 informational notes &mdash; the 3 and 5 percent recommendations', 'Conductor ampacity at 75&deg;C, used only to exclude overloaded cells'],
},
{
  slug: 'motor-speed-chart', badge: 'RPM',
  h1: 'Motor Speed Chart', title: 'Motor Speed Chart (Poles, RPM and Torque)',
  card: 'Synchronous speed for 2 to 12 poles at 60 and 50 Hz, with the torque each horsepower produces.',
  desc: 'AC motor speed chart: synchronous rpm for 2 to 12 poles at 60 Hz and 50 Hz, and the full-load torque per horsepower and per kW at each speed.',
  dek: 'Synchronous speed for each pole count at 60 Hz and 50 Hz, and how much torque a horsepower is worth at that speed.',
  lead: '<b>An AC motor\'s synchronous speed is 120 times the frequency divided by the number of poles.</b> At 60 Hz that is 3,600 rpm for two poles and 1,800 for four. An induction motor runs a few percent below these figures at full load; the shortfall is its slip.',
  tables: () => [
    { id: 'rpm', title: 'Synchronous speed and torque', caption: 'Torque per horsepower is at the 60 Hz synchronous speed; torque per kW is at the 50 Hz speed. Actual full-load torque is slightly higher, because the motor runs slightly slower.',
      head: ['Poles', '60 Hz (rpm)', '50 Hz (rpm)', 'lb-ft per hp at 60 Hz', 'N&middot;m per kW at 50 Hz'],
      rows: [2, 4, 6, 8, 10, 12].map(p => { const n60 = 7200 / p, n50 = 6000 / p; return [p, f(n60), f(n50), f(5252 / n60, 2), f(9549.3 / n50, 2)]; }) },
  ],
  how: [
    'A nameplate speed of 1,750 or 1,775 rpm means a four-pole motor on 60 Hz, since the nearest synchronous speed above it is 1,800. The difference, 25 to 50 rpm, is the slip at full load.',
    'Torque rises as speed falls. A 10 hp motor delivers about 15 lb-ft at two poles and about 58 lb-ft at eight. That is why a slow motor of the same horsepower is physically larger.',
    'On a variable speed drive, synchronous speed follows the output frequency: a four-pole motor at 30 Hz has a synchronous speed of 900 rpm.',
  ],
  formula: 'N = 120 &times; f / poles<br>T (lb-ft) = 5,252 &times; hp / rpm<br>T (N&middot;m) = 9,549 &times; kW / rpm',
  limits: 'These are synchronous speeds. The speed an induction motor actually runs at depends on its load and its design, and comes from the nameplate. Torque figures are running torque at rated power; starting and breakdown torque are separate values set by the motor\'s design letter.',
  faqs: [
    ['What rpm is a 4 pole motor?', 'Its synchronous speed is 1,800 rpm at 60 Hz and 1,500 rpm at 50 Hz. A four-pole induction motor at full load typically runs between about 1,725 and 1,780 rpm on 60 Hz.'],
    ['How do I tell how many poles a motor has?', 'From the nameplate speed. Find the synchronous speed just above it in the chart: about 3,500 rpm is two poles, about 1,750 is four, about 1,150 is six and about 870 is eight, all at 60 Hz.'],
    ['Why does a slower motor have more torque?', 'Power is torque times speed. For the same power, halving the speed doubles the torque. The motor needs a larger rotor and frame to produce that torque, which is why low-speed motors are bigger and more expensive.'],
  ],
  related: [['calculators/motor-speed.html', 'Motor Speed &amp; Slip Calculator'], ['calculators/motor-torque.html', 'Motor Torque Calculator'], ['charts/hp-to-kw-chart.html', 'HP to kW Chart'], ['guide-vfd-vs-soft-starter.html', 'VFD vs. Soft Starter'], ['guide-pump-and-fan-affinity-laws.html', 'Pump and Fan Affinity Laws']],
  basedOn: ['The relation between supply frequency, pole count and rotating field speed', 'NEMA MG 1 and IEC 60034-1 &mdash; nameplate speed and ratings'],
},
{
  slug: 'hp-to-kw-chart', badge: 'HP',
  h1: 'HP to kW Chart', title: 'HP to kW Chart (Standard Motor Sizes)',
  card: 'Standard NEMA horsepower ratings in kW, and standard IEC kW ratings in horsepower.',
  desc: 'HP to kW conversion chart for standard NEMA motor sizes from 1/2 to 500 hp, and kW to HP for standard IEC motor sizes from 0.37 to 315 kW.',
  dek: 'Standard motor ratings converted both ways: NEMA horsepower sizes in kilowatts, and IEC kilowatt sizes in horsepower.',
  lead: '<b>One horsepower is 0.7457 kW, so kW is horsepower times 0.746 and horsepower is kW times 1.341.</b> A 50 hp motor is 37.3 kW. This is output power at the shaft; the electrical input is higher, by the motor\'s losses.',
  tables: () => [
    { id: 'hp', title: 'NEMA horsepower ratings in kW', caption: 'Shaft output power.',
      head: ['hp', 'kW', 'hp', 'kW', 'hp', 'kW'],
      rows: (() => { const a = [0.5, 0.75, 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500]; const n = Math.ceil(a.length / 3), r = []; for (let i = 0; i < n; i++) { const row = []; for (let c = 0; c < 3; c++) { const v = a[i + c * n]; row.push(v == null ? '' : f(v, v % 1 ? (v === 0.75 ? 2 : 1) : 0), v == null ? '' : sig(v * 0.7457)); } r.push(row); } return r; })() },
    { id: 'kw', title: 'IEC kW ratings in horsepower', caption: 'Shaft output power. The nearest NEMA size is usually the next one above the figure shown.',
      head: ['kW', 'hp', 'kW', 'hp', 'kW', 'hp'],
      rows: (() => { const a = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315]; const n = Math.ceil(a.length / 3), r = []; for (let i = 0; i < n; i++) { const row = []; for (let c = 0; c < 3; c++) { const v = a[i + c * n]; row.push(v == null ? '' : String(v), v == null ? '' : sig(v / 0.7457)); } r.push(row); } return r; })() },
  ],
  how: [
    'NEMA and IEC motors come in different standard sizes, and the two series were chosen to correspond closely: 0.75 kW is 1 hp, 7.5 kW is 10 hp, 37 kW is 50 hp, 75 kW is 100 hp.',
    'To find the electrical power a motor draws, divide the kW shown by its efficiency. A 50 hp motor at 93 percent efficiency draws 37.3 / 0.93 = 40.1 kW at full load.',
  ],
  formula: 'kW = hp &times; 0.7457<br>hp = kW &times; 1.341<br>Input kW = output kW / efficiency',
  limits: 'The conversion is exact for mechanical horsepower. It gives shaft output, not electrical input, and it does not give current: full-load amps depend on voltage, efficiency and power factor, and for sizing conductors and protection the NEC requires the values in its motor tables, not a calculated figure. Metric horsepower, used on some European nameplates, is slightly smaller at 0.7355 kW.',
  faqs: [
    ['How many kW is 1 hp?', 'One mechanical horsepower is 0.7457 kW, usually rounded to 0.746. So 10 hp is 7.46 kW and 100 hp is 74.6 kW.'],
    ['Is motor horsepower the input or the output?', 'The output. A motor nameplate gives the mechanical power available at the shaft. The electrical power drawn from the supply is larger, by the motor\'s losses: output divided by efficiency.'],
    ['What is the IEC equivalent of a 50 hp motor?', 'A 37 kW motor. 50 hp converts to 37.3 kW, and 37 kW is the standard IEC rating that corresponds to it.'],
  ],
  related: [['calculators/hp-to-kw.html', 'Motor HP to kW Calculator'], ['calculators/motor-torque.html', 'Motor Torque Calculator'], ['charts/motor-speed-chart.html', 'Motor Speed Chart'], ['guide-nec-430-250-motor-fla.html', 'NEC 430.250 Motor Full-Load Current'], ['calculators/pump-power.html', 'Pump Power Calculator']],
  basedOn: ['The definition of mechanical horsepower, 550 foot-pounds per second', 'NEMA MG 1 and IEC 60072 &mdash; standard motor output ratings'],
},
{
  slug: 'cooling-load-chart', badge: 'BTU',
  h1: 'Cooling Load Chart', title: 'Cooling Load Chart (kW to BTU, Tons, CFM, GPM)',
  card: 'IT load in kW as BTU/h and tons, with the airflow and chilled water flow each needs.',
  desc: 'Cooling load chart: kW to BTU/h and tons of cooling, CFM per kW by air temperature rise, and chilled water GPM per ton by temperature difference.',
  dek: 'A heat load in kilowatts expressed as BTU per hour and tons, and the airflow and chilled water flow needed to carry it away.',
  lead: '<b>One kilowatt of heat is 3,412 BTU per hour, and one ton of cooling is 12,000 BTU per hour, or 3.517 kW.</b> Nearly all the electricity an IT load draws leaves as heat, so a 100 kW room needs about 28.4 tons of sensible cooling before any allowance for other loads or redundancy.',
  tables: () => [
    { id: 'load', title: 'Heat load', caption: 'Sensible heat. For IT equipment, the electrical load in kW is the heat load in kW.',
      head: ['kW', 'BTU/h', 'Tons'],
      rows: [1, 5, 10, 20, 50, 100, 250, 500, 1000, 2000, 5000].map(k => [f(k), f(k * 3412.142), sig(k * 3412.142 / 12000)]) },
    { id: 'cfm', title: 'Airflow per kW', caption: 'Standard air at sea level. A wider temperature rise across the equipment needs less air.',
      head: ['Air temperature rise', 'CFM per kW', 'CFM for 10 kW', 'CFM for 100 kW'],
      rows: [10, 15, 20, 25, 30, 35, 40].map(d => { const c = 3412.142 / (1.08 * d); return [d + '&deg;F', f(c), f(c * 10), f(c * 100)]; }),
      metric: { title: 'Airflow per kW', caption: 'Standard air at sea level. A wider temperature rise across the equipment needs less air. One kelvin is the same step as one degree Celsius.',
        head: ['Air temperature rise', 'm&sup3;/h per kW', 'L/s per kW', 'm&sup3;/h for 100 kW'],
        rows: [5, 8, 10, 12, 15, 18, 20].map(k => { const c = 3412.142 / (1.08 * k * 1.8) * 1.699011; return [k + ' K', f(c), f(c / 3.6, 1), f(c * 100)]; }) } },
    { id: 'gpm', title: 'Chilled water flow per ton', caption: 'Plain water. A wider difference between supply and return needs less flow.',
      head: ['Water temperature difference', 'GPM per ton', 'GPM for 100 tons', 'GPM for 500 tons'],
      rows: [8, 10, 12, 14, 16, 18, 20].map(d => { const g = 24 / d; return [d + '&deg;F', f(g, 2), f(g * 100), f(g * 500)]; }),
      metric: { title: 'Chilled water flow per kW', caption: 'Plain water. A wider difference between supply and return needs less flow.',
        head: ['Water temperature difference', 'L/s per kW', 'L/s for 100 kW', 'm&sup3;/h for 100 kW'],
        rows: [4, 5, 6, 7, 8, 10, 12].map(k => { const l = 24 / (k * 1.8) * 0.0630902 / 3.516853; return [k + ' K', f(l, 4), f(l * 100, 2), f(l * 100 * 3.6, 1)]; }) } },
  ],
  how: [
    'Start with the IT load in kW and read off the tons. Then use the second table for the air that load needs at your design temperature rise, and the third for the chilled water serving the cooling units.',
    'The airflow and water flow tables show the same thing from two directions: the wider the temperature difference a system is designed for, the less fluid it has to move. Since fan and pump power fall with the cube of flow, this is where much of a cooling system\'s efficiency is decided.',
  ],
  formula: 'BTU/h = kW &times; 3,412<br>Tons = BTU/h / 12,000<br>CFM = BTU/h / (1.08 &times; &Delta;T)<br>GPM = tons &times; 24 / &Delta;T',
  limits: 'These are design-point figures for sensible heat. They leave out lighting, people, heat gain through the building, humidification and the cooling plant\'s own losses, and they include no redundancy. The air constant of 1.08 applies at sea level; at altitude more air is needed. The water constant applies to plain water, and a glycol mix needs more flow.',
  faqs: [
    ['How many tons of cooling per kW?', 'One kW of heat needs 0.284 tons of cooling, because a ton is 3.517 kW. Put the other way, each ton of cooling removes 3.517 kW of heat. A 100 kW IT load needs about 28.4 tons.'],
    ['How many CFM per kW of IT load?', 'It depends on the temperature rise across the equipment. At a 20&deg;F rise it is about 158 CFM per kW; at 30&deg;F it is about 105. Modern servers are often designed for the wider rise.'],
    ['How many GPM per ton of chilled water?', '24 divided by the temperature difference in &deg;F. At the traditional 10&deg;F difference that is 2.4 GPM per ton; at 12&deg;F it is 2.0 and at 16&deg;F it is 1.5.'],
  ],
  related: [['calculators/btu-to-tons.html', 'BTU to Tons Converter'], ['calculators/airflow-cfm.html', 'Airflow (CFM) Calculator'], ['calculators/chilled-water-flow.html', 'Chilled Water Flow Calculator'], ['guide-crac-vs-crah.html', 'CRAC vs. CRAH'], ['guide-hot-aisle-vs-cold-aisle-containment.html', 'Hot Aisle vs. Cold Aisle Containment']],
  basedOn: ['The definitions of the BTU and the ton of refrigeration', 'ASHRAE Handbook &mdash; the sensible heat equation for air and the heat-transfer relation for water'],
},
{
  slug: 'wire-ampacity-chart', badge: 'AMP', codeTable: true,
  h1: 'Wire Ampacity Chart', title: 'Wire Ampacity Chart (Copper & Aluminum)',
  card: 'Allowable ampacity for copper and aluminum, 14 AWG to 500 kcmil, at 60, 75 and 90&deg;C, with the correction factors.',
  desc: 'Wire ampacity chart for copper and aluminum conductors from 14 AWG to 500 kcmil at 60, 75 and 90&deg;C, with ambient temperature and bundling correction factors.',
  dek: 'Allowable ampacity for copper and aluminum conductors at the three insulation temperature ratings, and the factors that reduce it.',
  lead: '<b>Ampacity is the current a conductor can carry continuously without exceeding its temperature rating, and it depends on the insulation rating as much as on the wire size.</b> A 6 AWG copper conductor is good for 55 A at 60&deg;C, 65 A at 75&deg;C and 75 A at 90&deg;C. Those figures hold for not more than three current-carrying conductors together at an ambient of 30&deg;C (86&deg;F). Anything hotter or more crowded reduces them.',
  tables: () => [
    { id: 'cu', title: 'Copper', caption: 'Amperes. Not more than three current-carrying conductors in a raceway, cable or directly buried, at 30&deg;C ambient.',
      head: ['Size', '60&deg;C', '75&deg;C', '90&deg;C'], rows: AMPACITY.map(([n, cu]) => [n, ...cu.map(v => f(v))]) },
    { id: 'al', title: 'Aluminum and copper-clad aluminum', caption: 'Amperes, on the same basis. A dash means the size is not used in that material.',
      head: ['Size', '60&deg;C', '75&deg;C', '90&deg;C'], rows: AMPACITY.map(([n, , al]) => [n, ...(al || [null, null, null]).map(v => dash(v))]) },
    { id: 'ambient', title: 'Ambient temperature correction', caption: 'Multiply the ampacity by the factor for the insulation rating when the ambient is above 30&deg;C. A dash means the conductor may not be used at that ambient.',
      head: ['Ambient', '60&deg;C insulation', '75&deg;C insulation', '90&deg;C insulation'],
      rows: AMB_CORR.map(([t, fs]) => [t + '&deg;C (' + Math.round(t * 9 / 5 + 32) + '&deg;F)', ...fs.map(v => dash(v, 2))]) },
    { id: 'bundling', title: 'More than three current-carrying conductors', caption: 'Multiply the ampacity by this percentage when more than three current-carrying conductors share a raceway or cable.',
      head: ['Current-carrying conductors', 'Percent of ampacity'], rows: CCC_ADJ.map(([n, p]) => [n, p + '%']) },
  ],
  how: [
    'Find the wire size and read across to the column for the temperature rating that governs. That is usually not the insulation rating. Equipment terminals are rated 60&deg;C or 75&deg;C, and the conductor must not carry more than its ampacity in the column matching the lowest-rated termination. In general, circuits of 100 A or less use the 60&deg;C column unless the equipment is marked for 75&deg;C, and larger circuits use 75&deg;C.',
    'A 90&deg;C conductor earns its higher figure in a different way. Its 90&deg;C ampacity is the starting point for the correction factors, so it absorbs a hot ambient or a crowded raceway better. Take 4 AWG copper with 90&deg;C insulation at 40&deg;C ambient with six current-carrying conductors: 95 &times; 0.91 &times; 0.80 = 69.2 A, which is then compared with the 85 A the 75&deg;C termination column allows. The smaller figure, 69.2 A, is the ampacity.',
    'The smallest sizes have a further limit that the table does not show. Whatever their ampacity, the overcurrent device is generally limited to 15 A for 14 AWG copper, 20 A for 12 AWG and 30 A for 10 AWG.',
    'A continuous load is taken at 125 percent before any of this, so a conductor for an 80 A continuous load needs an ampacity of 100 A.',
  ],
  calcTitle: 'Where the values come from',
  source: 'The ampacities correspond to NEC Table 310.16, the ambient correction factors to Table 310.15(B)(1), and the adjustment factors to Table 310.15(C)(1). They are reproduced here for reference and are not computed by Voltfield. Editions of the code differ, table numbers have changed between editions, and local amendments apply, so check any value you intend to rely on against the edition your jurisdiction has adopted.',
  limits: 'The chart covers conductors in a raceway, cable or directly buried, up to 500 kcmil. It does not cover conductors in free air, which carry more; cables in tray, flexible cords, or conductors rated above 2,000 V, which have their own tables; or the rooftop and other special conditions the code treats separately. It does not tell you the overcurrent device, and it does not check voltage drop, which on a long run sets the size before ampacity does.',
  faqs: [
    ['What size wire do I need for 100 amps?', 'For a 100 A circuit on 75&deg;C terminations, 3 AWG copper (100 A) or 1 AWG aluminum (100 A) meets the ampacity before any correction. If the 100 A is a continuous load, the conductor needs 125 A, which is 1 AWG copper or 2/0 aluminum. Hot ambient or bundled conductors can push the size up further.'],
    ['Why are there three ampacities for the same wire?', 'Each column is for an insulation temperature rating. Insulation that tolerates more heat lets the same copper carry more current. Which column you may use depends on the insulation and, more often, on the temperature rating of the terminals it lands on.'],
    ['Can I use the 90&deg;C column?', 'Only for applying correction and adjustment factors, in most installations. Terminals are rarely rated above 75&deg;C, so the final ampacity cannot exceed the 60&deg;C or 75&deg;C figure for that size. The 90&deg;C value is the starting point for derating, not the answer.'],
    ['How much does bundling reduce ampacity?', 'With four to six current-carrying conductors together, ampacity falls to 80 percent. With seven to nine it is 70 percent, and with ten to twenty it is 50 percent. A neutral that carries only unbalanced current is generally not counted.'],
  ],
  related: [['calculators/wire-size.html', 'Wire Size Calculator'], ['guide-cable-ampacity-derating.html', 'Cable Ampacity Derating'], ['calculators/ampacity.html', 'Cable Ampacity &amp; Conduit Fill'], ['charts/awg-wire-size-chart.html', 'AWG Wire Size Chart'], ['charts/voltage-drop-chart.html', 'Voltage Drop Chart'], ['glossary/ampacity.html', 'Glossary: Ampacity']],
  basedOn: ['NEC Table 310.16 &mdash; allowable ampacities of insulated conductors', 'NEC 310.15 &mdash; ambient correction and adjustment factors', 'NEC 110.14(C) &mdash; temperature limitations of terminations', 'NEC 240.4(D) &mdash; overcurrent protection of small conductors'],
},
{
  slug: 'motor-full-load-current-chart', badge: 'FLC', codeTable: true,
  h1: 'Motor Full-Load Current Chart', title: 'Motor Full-Load Current Chart (FLA by HP)',
  card: 'Full-load current by horsepower for three-phase motors at 208, 230, 460 and 575 V, and single-phase at 115 and 230 V.',
  desc: 'Motor full-load current chart: amps by horsepower for three-phase induction motors at 208, 230, 460 and 575 V and single-phase motors at 115 and 230 V.',
  dek: 'Full-load current by horsepower for three-phase and single-phase motors, as used to size motor circuit conductors and protection.',
  lead: '<b>For sizing a motor circuit, the full-load current comes from the code table for the motor\'s horsepower and voltage, not from its nameplate.</b> A 50 hp three-phase motor is taken as 65 A at 460 V and 130 A at 230 V. The table figure is used for the conductors, the short-circuit protection and the disconnect; the nameplate current is used only for the overload protection.',
  tables: () => [
    { id: 'three', title: 'Three-phase induction motors', caption: 'Full-load current in amperes, for squirrel-cage and wound-rotor induction motors running at usual speeds with normal torque characteristics. A dash means that size is not listed at that voltage.',
      head: ['hp', '208 V', '230 V', '460 V', '575 V'], rows: FLC3.map(([hp, v]) => [hpLabel(hp), ...v.map(amp1)]),
      metric: { title: 'Three-phase induction motors', caption: 'Full-load current in amperes. The table is defined by horsepower; the kW figure is the same rating converted at 0.7457 kW per hp, and is not an IEC standard motor size.',
        head: ['kW (hp)', '208 V', '230 V', '460 V', '575 V'], rows: FLC3.map(([hp, v]) => [sig(hp * 0.7457) + ' (' + hpLabel(hp) + ')', ...v.map(amp1)]) } },
    { id: 'single', title: 'Single-phase motors', caption: 'Full-load current in amperes.',
      head: ['hp', '115 V', '230 V'], rows: FLC1.map(([hp, v]) => [hp, ...v.map(amp1)]),
      metric: { title: 'Single-phase motors', caption: 'Full-load current in amperes. The kW figure is the horsepower rating converted at 0.7457 kW per hp.',
        head: ['kW (hp)', '115 V', '230 V'], rows: FLC1.map(([hp, v]) => { const n = hp.includes('/') ? hp.split('-').reduce((a, p) => a + (p.includes('/') ? p.split('/')[0] / p.split('/')[1] : +p), 0) : +hp; return [sig(n * 0.7457) + ' (' + hp + ')', ...v.map(amp1)]; }) } },
  ],
  how: [
    'Find the motor\'s horsepower and read across to its voltage. The 230 V column also serves motors rated 220 to 240 V, the 460 V column those rated 440 to 480 V, and the 575 V column those rated 550 to 600 V.',
    'Branch-circuit conductors for a single motor are sized at 125 percent of this current. For a 50 hp, 460 V motor that is 65 &times; 1.25 = 81.3 A, and the conductor is then chosen from the ampacity table.',
    'The same current is the base for the short-circuit and ground-fault protective device, which is sized as a percentage of it that depends on the type of device, and is deliberately well above the running current so that the motor can start.',
    'Overload protection is the one thing sized from the nameplate. It protects the motor itself, so it follows the current that particular motor draws.',
  ],
  calcTitle: 'Where the values come from',
  source: 'The three-phase currents correspond to NEC Table 430.250 and the single-phase currents to Table 430.248. They are reproduced here for reference and are not computed by Voltfield. The figures are the same pattern throughout: the 230 V current is twice the 460 V current, and the 208 V current is ten percent higher than the 230 V one. Check any value you intend to rely on against the edition of the code your jurisdiction has adopted.',
  limits: 'These are code values for sizing, and they are deliberately conservative. An actual motor, particularly a high-efficiency one, usually draws less. The tables do not cover low-speed motors of 1,200 rpm or less, high-torque motors or multispeed motors, which can draw more and are sized from the nameplate. They do not give locked-rotor current, and they do not size the overload device.',
  faqs: [
    ['How many amps does a 10 hp motor draw?', 'For circuit sizing, a 10 hp three-phase motor is taken as 14 A at 460 V, 28 A at 230 V and 30.8 A at 208 V. A single-phase 10 hp motor at 230 V is taken as 50 A.'],
    ['Why not just use the nameplate current?', 'A motor can be replaced with another of the same horsepower that draws more. Sizing the conductors and short-circuit protection from the table means the circuit remains adequate for any standard motor of that rating. The nameplate current is used for overload protection, which is matched to the motor actually installed.'],
    ['What size wire for a 50 hp motor at 460 V?', 'The table current is 65 A. At 125 percent the conductor needs an ampacity of 81.3 A, which 4 AWG copper provides in the 75&deg;C column at 85 A. Ambient temperature, bundling and voltage drop can require a larger size.'],
    ['Is full-load current the same as starting current?', 'No. A motor started across the line draws roughly six times its full-load current for a few seconds, and more for some designs. That is why the short-circuit protection is set well above full-load current while the overload protection is set close to it.'],
  ],
  related: [['guide-nec-430-250-motor-fla.html', 'NEC 430.250 Motor Full-Load Current'], ['charts/wire-ampacity-chart.html', 'Wire Ampacity Chart'], ['calculators/hp-to-kw.html', 'Motor HP to kW Calculator'], ['calculators/motor-start.html', 'Motor Starting Voltage Dip Calculator'], ['charts/hp-to-kw-chart.html', 'HP to kW Chart'], ['practice/motors.html', 'Practice Questions: Motors']],
  basedOn: ['NEC Table 430.250 &mdash; full-load current, three-phase alternating-current motors', 'NEC Table 430.248 &mdash; full-load current, single-phase alternating-current motors', 'NEC 430.6(A) &mdash; use of table values and nameplate values', 'NEC 430.22 &mdash; conductors for a single motor'],
},
];

/* ------------------------------------------------------------ builders ---- */
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&sup2;/g, '²').replace(/&sup3;/g, '³')
  .replace(/&deg;/g, '°').replace(/&times;/g, '×').replace(/&Omega;/g, 'Ω').replace(/&middot;/g, '·').replace(/&phi;/g, 'φ').replace(/&Delta;/g, 'Δ').replace(/&pi;/g, 'π')
  .replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
const attr = (s) => plain(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const up = (h) => '/' + h;   // charts live one folder down; every link is root-absolute

const STYLE = `<style>
.chart-actions{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 4px}
.chart-actions button{font:600 12px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;padding:10px 14px;min-height:40px;
  background:var(--card);color:var(--ink);border:1px solid var(--line-dark);border-radius:var(--r-s,6px);cursor:pointer}
.chart-actions button:hover{border-color:var(--signal)}
.chart-units{display:inline-flex;margin-left:auto;border:1px solid var(--line-dark);border-radius:999px;overflow:hidden}
.chart-units[hidden]{display:none}
.chart-actions .chart-units button{border:0;border-radius:0;background:transparent;color:var(--slate);min-height:40px}
.chart-actions .chart-units button[aria-pressed="true"]{background:var(--signal);color:#101B2D}
@media(max-width:520px){.chart-units{margin-left:0}}
.chartwrap{overflow-x:auto;margin:14px 0 6px;border:1px solid var(--line);border-radius:var(--r-m,8px)}
.chartwrap:focus-visible{outline:2px solid var(--signal);outline-offset:2px}
.charttbl{width:100%;border-collapse:collapse;font-size:14.5px;font-variant-numeric:tabular-nums}
.charttbl th,.charttbl td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}
.charttbl tr:last-child td,.charttbl tbody tr:last-child th{border-bottom:0}
.charttbl thead th{background:var(--sunk);font-family:var(--mono);font-size:11px;letter-spacing:.03em;color:var(--ink);position:sticky;top:0}
.charttbl th:first-child,.charttbl td:first-child{text-align:left}
.charttbl tbody th{font-weight:600;color:var(--ink);background:var(--card);position:sticky;left:0}
.charttbl tbody td{color:var(--ink-2)}
.charttbl tbody tr:hover td,.charttbl tbody tr:hover th{background:var(--sunk)}
.chartcap{font-size:13.5px;color:var(--slate);margin:6px 0 22px}
@media print{
  header.site,footer,.chart-actions,.ad-unit,.rel,.provenance,.skip-link,.totop,#themeToggle{display:none!important}
  .chartwrap{overflow:visible;border:0}
  .charttbl{font-size:10.5pt}.charttbl th,.charttbl td{padding:4px 8px;white-space:normal}
  .charttbl thead th,.charttbl tbody th{position:static}
  body{background:#fff!important;color:#000!important}
}
</style>`;

function tableHTML(t) {
  if (!t.metric) return oneTable(t);
  return `  <div data-units="us">
${oneTable(t)}
  </div>
  <div data-units="metric" hidden>
${oneTable({ ...t.metric, id: t.id + '-m' })}
  </div>`;
}
function oneTable(t) {
  const head = t.head.map((h, i) => `<th scope="col">${h}</th>`).join('');
  const rows = t.rows.map(r => '      <tr>' + r.map((c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`).join('') + '</tr>').join('\n');
  return `  <h2 id="${t.id}">${t.title}</h2>
  <div class="chartwrap" tabindex="0" role="region" aria-labelledby="${t.id}">
    <table class="charttbl" data-chart="${t.id}">
      <thead><tr>${head}</tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
  <p class="chartcap">${t.caption}</p>`;
}

function mainHTML(c, tables) {
  const faq = c.faqs.map(([q, a]) => `  <details style="background:var(--card);border:1px solid var(--line-dark);padding:14px 18px;margin-bottom:10px">
    <summary style="font-family:var(--disp);font-weight:600;font-size:15.5px;cursor:pointer">${q}</summary>
    <p style="margin-top:10px">${a}</p>
  </details>`).join('\n');
  return `<main id="main" tabindex="-1">

<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <a href="/reference-charts.html" style="color:var(--slate);text-decoration:none">Reference charts</a> / <span style="color:var(--ink)">${c.h1}</span></nav>
    <div class="eyebrow">Reference Chart &middot; Free to Print</div>
    <h1>${c.h1}</h1>
    <p class="dek">${c.dek}</p>
  </div>
</section>

<div class="artwrap">
  <p>${c.lead}</p>
  <div class="chart-actions">
    <button type="button" data-chart-print>Print this chart</button>
    <button type="button" data-chart-csv="${c.slug}">Download as CSV</button>${tables.some(t => t.metric) ? `
    <span class="chart-units" role="group" aria-label="Units" hidden><button type="button" data-units-btn="us" aria-pressed="true">US</button><button type="button" data-units-btn="metric" aria-pressed="false">Metric</button></span>` : ''}
  </div>${tables.some(t => t.metric) ? `
  <p class="chartcap" data-units="metric" hidden>Metric tables are shown. The worked examples and formulas further down the page are in US units.</p>` : ''}

${tables.map(tableHTML).join('\n\n')}

  <div class="ad-unit" data-ad="incontent"></div>

  <h2>How to read it</h2>
${c.how.map(p => `  <p>${p}</p>`).join('\n')}

  <h2>${c.calcTitle || 'How the values are calculated'}</h2>
${c.codeTable ? `  <p>${c.source}</p>
    <div class="callout"><b>These are code values, not Voltfield\'s.</b> NEC and National Electrical Code are trademarks of the National Fire Protection Association, which publishes the code. Voltfield is not affiliated with it. The published code, in the edition adopted where you are, is the authority.</div>` : `    <div class="formula">${c.formula}</div>
  <p>Every figure in the chart comes from the formulas above. Nothing is copied from a published table, so any cell can be checked by hand.</p>`}

  <h2>What this chart does not tell you</h2>
  <p>${c.limits}</p>
    <div class="callout"><b>This is a reference, not a design.</b> It is here to give you the right order of magnitude and a figure to check against. It does not replace the adopted code or a calculation by a qualified engineer.</div>

  <h2>Frequently asked questions</h2>
${faq}

  <h2>Related</h2>
    <div class="rel">
${c.related.map(([h, t]) => `      <a href="${up(h)}">${t}</a>`).join('\n')}
      <a href="/reference-charts.html">All reference charts</a>
    </div>

  <aside class="provenance" aria-labelledby="prov-h">
    <h2 id="prov-h">Scope &amp; sources</h2>
    <dl>
      <dt>What this covers</dt>
      <dd>${c.desc}</dd>
      <dt>Based on</dt>
      <dd><ul>${c.basedOn.map(b => `<li>${b}</li>`).join('')}</ul></dd>
      <dt>What it is not</dt>
      <dd>${c.limits}</dd>
      <dt>Provenance</dt>
      <dd>Last reviewed ${DATE_LONG}. ${c.codeTable ? 'Values correspond to the code tables named above and were checked for internal consistency when the page was built; they are not a substitute for the code.' : 'Computed by Voltfield from the formulas shown on the page.'} Maintained by the Voltfield editorial team. Free to print, cite and link to.</dd>
    </dl>
  </aside>

</div>
<div class="ad-unit" data-ad="footer"></div>
</main>`;
}

const SCRIPT = `<script>
/* Print, and a CSV of every table on the page. No dependencies. */
(function(){
  /* US / Metric. Both sets of tables are in the page; this shows one. The
     switch itself is hidden until this runs, so without JavaScript the reader
     gets the US tables and no control that does nothing. */
  var box=document.querySelector('.chart-units');
  if(box){
    var metric=false;
    try{metric=localStorage.getItem('vf_units')==='metric';}catch(e){}
    try{var q=new URLSearchParams(location.search).get('units');if(q==='metric'||q==='us'){metric=q==='metric';try{localStorage.setItem('vf_units',q);}catch(e){}}}catch(e){}
    var paint=function(){
      document.querySelectorAll('[data-units]').forEach(function(el){el.hidden=(el.getAttribute('data-units')==='metric')!==metric;});
      box.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',((b.getAttribute('data-units-btn')==='metric')===metric)?'true':'false');});
    };
    box.hidden=false;
    box.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click',function(){
        var want=b.getAttribute('data-units-btn')==='metric';
        if(want===metric)return;
        metric=want;
        try{localStorage.setItem('vf_units',metric?'metric':'us');}catch(e){}
        paint();
        if(window.vfGtag)window.vfGtag('event','units_toggle',{to:metric?'metric':'us',page:location.pathname});
      });
    });
    paint();
  }
  var p=document.querySelector('[data-chart-print]');
  if(p)p.addEventListener('click',function(){window.print();});
  var c=document.querySelector('[data-chart-csv]');
  if(c)c.addEventListener('click',function(){
    var out=[];
    [].filter.call(document.querySelectorAll('table.charttbl'),function(t){return !t.closest('[hidden]');}).forEach(function(t,i){
      if(i)out.push('');
      var h=t.closest('.chartwrap').previousElementSibling;
      if(h)out.push('"'+h.textContent.replace(/"/g,'""')+'"');
      t.querySelectorAll('tr').forEach(function(r){
        out.push([].map.call(r.children,function(x){
          var v=x.textContent.trim().replace(/\\u2014/g,'');
          var n=v.replace(/,/g,'');
          return /^-?\\d+(\\.\\d+)?$/.test(n)?n:'"'+v.replace(/"/g,'""')+'"';
        }).join(','));
      });
    });
    out.push('','"Source: voltfield.org'+location.pathname+'"');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\\ufeff'+out.join('\\r\\n')],{type:'text/csv'}));
    a.download='voltfield-'+c.getAttribute('data-chart-csv')+'.csv';
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
    if(window.vfGtag)window.vfGtag('event','chart_csv',{chart:c.getAttribute('data-chart-csv')});
  });
})();
</script>`;

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
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${BASE}social/${o.card}">`)
       .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${BASE}social/${o.card}">`);
  one(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(o.ld)}\n</script>`, 'json-ld');
  one(/<\/head>/, STYLE + '\n</head>', 'head end');
  one(/<main id="main" tabindex="-1">[\s\S]*<\/main>/, () => o.main, 'main');
  s = s.replace(/<script src="\/voltfield-calculators\.js" defer><\/script>\r?\n/, '').replace(/<script src="\/voltfield-updates\.js" defer><\/script>\r?\n/, '')
       .replace(/<link rel="stylesheet" href="\/voltfield-calculators\.css">\r?\n/, '');
  one(/<\/body>/, SCRIPT + '\n</body>', 'body end');
  return s;
}

/* ----------------------------------------------------------------- run ---- */
const tpl = fs.readFileSync(TEMPLATE, 'utf8').replace(/\r\n/g, '\n');
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
fs.mkdirSync('charts', { recursive: true });
let made = 0;
for (const c of CHARTS) {
  if (only.length && !only.includes(c.slug)) continue;
  const file = `charts/${c.slug}.html`, url = BASE + file, tables = c.tables();
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Reference charts', item: BASE + 'reference-charts.html' },
      { '@type': 'ListItem', position: 3, name: plain(c.h1), item: url } ] },
    { '@type': 'WebPage', name: plain(c.h1), description: plain(c.desc), url, dateModified: DATE_ISO, inLanguage: 'en-US',
      isPartOf: { '@type': 'WebSite', name: 'Voltfield', url: BASE }, publisher: { '@type': 'Organization', name: 'Voltfield', url: BASE } },
    { '@type': 'FAQPage', mainEntity: c.faqs.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) },
  ] };
  fs.writeFileSync(file, stamp(tpl, { file, title: c.title, desc: c.desc, h1: c.h1, card: `social-${c.slug}.jpg`, ld, main: mainHTML(c, tables) }));
  console.log('  wrote ' + file + '  (' + tables.reduce((n, t) => n + t.rows.length, 0) + ' rows)');
  made++;
}

if (!only.length) {
  const cards = CHARTS.map(c => `    <a class="gdcard has-thumb" href="charts/${c.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${c.badge}</span><h3>${c.h1}</h3><p>${c.card}</p></a>`).join('\n');
  const desc = `${CHARTS.length} electrical and cooling reference charts: wire sizes, ampacity, voltage drop, breakers, motor current, kW and kVA to amps, cooling load. Printable.`;
  const main = `<main id="main" tabindex="-1">

<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <span style="color:var(--ink)">Reference charts</span></nav>
    <div class="eyebrow">Reference Charts &middot; Free to Print</div>
    <h1>Electrical &amp; Cooling Reference Charts</h1>
    <p class="dek">The tables people look up again and again, on pages built to be printed, downloaded and checked. Every figure is computed from a formula shown on the page.</p>
  </div>
</section>

<div class="artwrap">
  <p><b>Each chart here answers one lookup question and shows how its numbers were worked out.</b> They sit beside the ${L('engineering-calculators.html', 'calculators')}: a calculator gives one answer for your inputs, a chart shows the whole range at once, which is what you want on a wall, in a truck or in a submittal.</p>

  <div class="gdgrid">
${cards}
  </div>

  <h2>Two kinds of chart</h2>
  <p>Most of the charts here are computed: every figure comes from a formula shown on the page, so any cell can be checked by hand. Two are different. The ${L('charts/wire-ampacity-chart.html', 'wire ampacity chart')} and the ${L('charts/motor-full-load-current-chart.html', 'motor full-load current chart')} carry values that correspond to tables in the National Electrical Code. Those pages say so, and the figures that apply to an installation are the ones in the edition your jurisdiction has adopted, with its correction factors applied. The guides to ${L('guide-cable-ampacity-derating.html', 'ampacity derating')} and ${L('guide-nec-430-250-motor-fla.html', 'NEC 430.250')} explain the method behind each.</p>

  <h2>US and metric</h2>
  <p>Four of the charts also come in metric: voltage drop, wire sizes, cooling load and motor current. Each has a US / Metric switch beside its print button, and the choice is remembered and shared with the calculators. The rest have no unit to switch, because amps, volts and kilowatts are the same in both systems.</p>

  <h2>Using and sharing these charts</h2>
  <p>Print them, download the data as CSV, and link to them freely. If you reproduce a chart, a link back to the page is appreciated. If you find a figure you can show is wrong, the ${L('contact.html', 'contact page')} says how to report it.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>
</main>`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Reference charts', item: BASE + 'reference-charts.html' } ] },
    { '@type': 'CollectionPage', name: 'Electrical & Cooling Reference Charts', description: desc, url: BASE + 'reference-charts.html', dateModified: DATE_ISO, inLanguage: 'en-US' },
    { '@type': 'ItemList', itemListElement: CHARTS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: plain(c.h1), url: BASE + 'charts/' + c.slug + '.html' })) },
  ] };
  fs.writeFileSync('reference-charts.html', stamp(tpl, { file: 'reference-charts.html', title: 'Electrical Reference Charts (Free, Printable)', desc, h1: 'Electrical & Cooling Reference Charts', card: 'social-reference-charts.jpg', ld, main }));
  console.log('  wrote reference-charts.html');
  fs.writeFileSync('scripts/charts-manifest.json', JSON.stringify(CHARTS.map(c => ({ slug: c.slug, h1: plain(c.h1), card: plain(c.card), badge: c.badge })), null, 1));
}
console.log('charts written: ' + made);
