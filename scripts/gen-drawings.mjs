#!/usr/bin/env node
/* Generates the drawings library: drawings.html (hub, with a symbol legend and
 * a table of drawing types) and drawings/<slug>.html, one typical single-line
 * diagram per page.
 *
 *   node scripts/gen-drawings.mjs
 *
 * The diagrams are drawn here, as SVG, from a small set of symbol primitives,
 * so every drawing uses the same symbols as the legend and can be downloaded
 * as a clean vector file. They are TYPICAL ARRANGEMENTS FOR LEARNING. They
 * carry no ratings on purpose and each page says so: a single-line with
 * plausible-looking numbers on it gets copied into real work.
 *
 * Strokes use currentColor so the drawings follow the light and dark themes.
 * New slugs go into sitemap.xml, _redirects and search-index.json by hand.
 */
import { page, crumbNav, write } from './lib-shell.mjs';

const DATE_ISO = '2026-11-15';
const DATE_LONG = 'November 15, 2026';

/* ------------------------------------------------------------ symbols ---- */
/* Each symbol is drawn on a vertical trunk at x, starting at y, and returns
   the height it used. Wires in and out are part of the symbol. */
function Canvas(W) {
  let o = '', maxY = 0;
  const see = y => { if (y > maxY) maxY = y; };
  const ln = (x1, y1, x2, y2, w) => { o += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${w ? ` stroke-width="${w}"` : ''}/>`; see(Math.max(y1, y2)); };
  const tx = (x, y, t, a = 'start', cls = '') => { o += `<text x="${x}" y="${y}" text-anchor="${a}"${cls ? ` class="${cls}"` : ''}>${t}</text>`; see(y); };
  const label = (x, y, it, off = 22) => {
    if (!it.l) return;
    const two = it.s ? -3 : 4;
    tx(x + off, y + two, it.l);
    if (it.s) tx(x + off, y + two + 14, it.s, 'start', 'sub');
  };
  const sym = (x, y, it) => {
    switch (it.t) {
      case 'src': case 'gen': {
        o += `<circle cx="${x}" cy="${y + 16}" r="16"/>`;
        tx(x, y + 21, it.t === 'gen' ? 'G' : '~', 'middle', 'in');
        ln(x, y + 32, x, y + 46); label(x, y + 16, it, 26); return 46;
      }
      case 'brk': ln(x, y, x, y + 14); o += `<rect x="${x - 8}" y="${y + 14}" width="16" height="16"/>`; ln(x, y + 30, x, y + 44); label(x, y + 22, it); return 44;
      case 'sw': {
        ln(x, y, x, y + 12); ln(x, y + 32, x + 11, y + 13);
        o += `<circle cx="${x}" cy="${y + 12}" r="2" class="dot"/><circle cx="${x}" cy="${y + 32}" r="2" class="dot"/>`;
        ln(x, y + 32, x, y + 44); label(x, y + 22, it); return 44;
      }
      case 'xf': {
        ln(x, y, x, y + 10);
        o += `<circle cx="${x}" cy="${y + 22}" r="12"/><circle cx="${x}" cy="${y + 38}" r="12"/>`;
        ln(x, y + 50, x, y + 60); label(x, y + 30, it, 24); return 60;
      }
      case 'box': {
        ln(x, y, x, y + 10);
        o += `<rect x="${x - 24}" y="${y + 10}" width="48" height="34" rx="2"/>`;
        tx(x, y + 32, it.in, 'middle', 'in');
        ln(x, y + 44, x, y + 54); label(x, y + 27, it, 34); return 54;
      }
      case 'bat': {
        ln(x, y, x, y + 12);
        ln(x - 13, y + 12, x + 13, y + 12); ln(x - 7, y + 18, x + 7, y + 18, 3);
        ln(x - 13, y + 24, x + 13, y + 24); ln(x - 7, y + 30, x + 7, y + 30, 3);
        label(x, y + 21, it); return 34;
      }
      case 'pv': {
        ln(x, y, x, y + 10);
        o += `<rect x="${x - 20}" y="${y + 10}" width="40" height="26"/>`;
        ln(x - 20, y + 10, x, y + 23); ln(x + 20, y + 10, x, y + 23);
        label(x, y + 23, it, 30); return 40;
      }
      case 'load': {
        ln(x, y, x, y + 18);
        o += `<path d="M${x - 7} ${y + 18}H${x + 7}L${x} ${y + 30}Z" class="fill"/>`; see(y + 30);
        if (it.l) { tx(x, y + 46, it.l, 'middle'); if (it.s) tx(x, y + 60, it.s, 'middle', 'sub'); }
        return it.s ? 64 : 50;
      }
      case 'wire': ln(x, y, x, y + (it.h || 20)); return it.h || 20;
      default: throw new Error('symbol ' + it.t);
    }
  };
  const chain = (x, y, items) => {
    for (const it of items) {
      if (it.bus) {
        ln(x + it.bus[0], y, x + it.bus[1], y, 5);
        tx(x + it.bus[0], y - 9, it.l);
        let end = y;
        for (const tap of it.taps) end = Math.max(end, chain(x + tap.dx, y, tap.items));
        y = end;
      } else y += sym(x, y, it);
    }
    see(y); return y;
  };
  const raw = s => { o += s; };
  const svg = (title, desc) => {
    const H = maxY + 24;
    return `<svg class="sld" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="sldT sldD" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="IBM Plex Sans, Arial, sans-serif" font-size="12.5"><title id="sldT">${title}</title><desc id="sldD">${desc}</desc><style>text{fill:currentColor;stroke:none}text.sub{font-size:11px;opacity:.72}text.in{font-size:12px;font-weight:600}.dot,.fill{fill:currentColor}</style>${o}</svg>`;
  };
  return { ln, tx, sym, chain, raw, svg, see };
}

/* ----------------------------------------------------------- drawings ---- */
const brk = (l, s) => ({ t: 'brk', l, s });
const D = [];

D.push((() => {
  const c = Canvas(760);
  c.chain(380, 24, [
    { t: 'src', l: 'Transmission line', s: 'Utility source' },
    { t: 'sw', l: 'Line disconnect switch' },
    brk('High-voltage circuit breaker', 'Device 52'),
    { t: 'sw', l: 'Transformer disconnect' },
    { t: 'xf', l: 'Power transformer', s: 'With surge arresters and tap changer' },
    brk('Main secondary breaker'),
    { t: 'wire', h: 26 },
    { bus: [-320, 320], l: 'Medium-voltage bus', taps: [
      { dx: -260, items: [brk('Feeder breaker'), { t: 'load', l: 'Feeder 1' }] },
      { dx: -90, items: [brk('Feeder breaker'), { t: 'load', l: 'Feeder 2' }] },
      { dx: 80, items: [brk('Feeder breaker'), { t: 'load', l: 'Feeder 3' }] },
      { dx: 250, items: [{ t: 'sw', l: 'Fused switch' }, { t: 'xf', l: 'Station service' }, { t: 'load', l: 'Control house', s: 'and battery charger' }] },
    ] },
  ]);
  return {
    slug: 'substation-single-line', badge: 'SUB', short: 'Substation single-line diagram',
    h1: 'Substation Single-Line Diagram: A Typical Arrangement',
    title: 'Substation Single-Line Diagram (Typical, Free SVG) | Voltfield',
    desc: 'A typical distribution substation single-line diagram, explained from the transmission line to the feeders, with a free SVG download and notes on what a real one adds.',
    card: 'One transmission line, one power transformer, a medium-voltage bus and three feeders, with station service.',
    dek: 'A single-transformer distribution substation, drawn from the incoming line down to the feeders, with each element explained.',
    svg: c.svg('Typical distribution substation single-line diagram', 'A transmission line feeds through a disconnect switch, a high-voltage breaker and a second disconnect to a power transformer, then through a main breaker to a medium-voltage bus with three feeder breakers and a station service transformer.'),
    read: [
      ['Transmission line', 'The source. Power arrives at transmission or subtransmission voltage.'],
      ['Line disconnect switch', 'Gives a visible break so the station can be isolated from the line. It is operated only when no current is flowing.'],
      ['High-voltage circuit breaker', 'Interrupts load and fault current on the high side. On drawings it carries ANSI device number 52. See <a class="inline" href="/guide-ansi-device-numbers.html">ANSI device numbers</a>.'],
      ['Transformer disconnect', 'With the line disconnect, isolates the breaker on both sides so it can be maintained.'],
      ['Power transformer', 'Steps the voltage down. Surge arresters sit close to its terminals, and a tap changer adjusts the ratio to hold secondary voltage.'],
      ['Main secondary breaker', 'Protects the bus and lets the transformer be separated from it.'],
      ['Medium-voltage bus', 'The common connection for all feeders. A fault here takes out the whole station, which is why larger stations split it.'],
      ['Feeder breakers', 'One per outgoing circuit, each with its own overcurrent protection, so a fault on one feeder does not interrupt the others.'],
      ['Station service', 'A small transformer that powers the control house, the battery charger, lighting and heaters. The battery is what trips the breakers if AC is lost.'],
    ],
    adds: ['Voltage, MVA, impedance and connection for the transformer, and continuous and interrupting ratings for every breaker', 'Current and voltage transformers with their ratios, and the relays they feed, by device number', 'Revenue metering', 'Grounding of the transformer neutral', 'A second transformer and a bus tie, in any station that must ride through the loss of one unit', 'Capacitor banks or voltage regulators on the bus'],
    related: [['/power-generation/transmission-substations.html', 'Transmission and substations reference'], ['/guide-switchgear-compartments.html', 'Switchgear compartments'], ['/guide-short-circuit-studies-breaker-coordination.html', 'Short-circuit studies and breaker coordination'], ['/calculators/fault-current.html', 'Fault current calculator']],
  };
})());

D.push((() => {
  const c = Canvas(820);
  const block = (l) => [brk('Feeder breaker'), { t: 'xf', l: 'Pad-mounted transformer' }, { t: 'box', in: '= / ~', l: 'Inverter' }, { t: 'box', in: 'DC', l: 'Combiners', s: 'String fuses' }, { t: 'pv', l }];
  c.chain(330, 24, [
    { t: 'src', l: 'Point of interconnection', s: 'Utility transmission system' },
    { t: 'sw', l: 'Disconnect switch' },
    brk('High-voltage circuit breaker', 'With revenue metering'),
    { t: 'xf', l: 'Main power transformer', s: 'Collector voltage to transmission voltage' },
    brk('Main collector breaker'),
    { t: 'wire', h: 26 },
    { bus: [-270, 380], l: 'Medium-voltage collector bus', taps: [
      { dx: -220, items: block('PV array, block 1') },
      { dx: 20, items: block('PV array, blocks 2 to n') },
      { dx: 290, items: [{ t: 'sw', l: 'Fused switch' }, { t: 'xf', l: 'Station service' }, { t: 'load', l: 'Auxiliary loads', s: 'Trackers, SCADA, lighting' }] },
    ] },
  ]);
  return {
    slug: 'solar-plant-single-line', badge: 'PV', short: 'Solar plant single-line diagram',
    h1: 'Utility-Scale Solar Plant Single-Line Diagram: A Typical Arrangement',
    title: 'Solar Plant Single-Line Diagram (Typical, Free SVG) | Voltfield',
    desc: 'A typical utility-scale solar plant single-line diagram, from PV array through inverter, collector system and main transformer to the point of interconnection. Free SVG.',
    card: 'PV arrays, inverters and pad-mounted transformers on a collector bus, stepped up once more to the grid.',
    dek: 'A utility-scale photovoltaic plant drawn from the grid down to the modules, with each step in voltage explained.',
    svg: c.svg('Typical utility-scale solar plant single-line diagram', 'The point of interconnection feeds through a disconnect and high-voltage breaker to a main power transformer and a medium-voltage collector bus. Each feeder on the bus has a breaker, a pad-mounted transformer, an inverter, DC combiners and a PV array. A station service transformer supplies auxiliary loads.'),
    read: [
      ['Point of interconnection', 'Where the plant meets the utility. Ownership, metering and the grid operator&rsquo;s requirements all change here. See the <a class="inline" href="/guide-grid-interconnection-process.html">interconnection process</a>.'],
      ['Disconnect switch and high-voltage breaker', 'The utility needs a visible, lockable means of isolating the plant, and the breaker clears faults on either side. Revenue metering sits at this level.'],
      ['Main power transformer', 'Steps the collector voltage, commonly 34.5 kV, up to transmission voltage. One of the longest-lead items on the project.'],
      ['Collector bus', 'Gathers the feeders. Each feeder is a string of pad-mounted transformers daisy-chained on underground cable.'],
      ['Pad-mounted transformer', 'Steps the inverter&rsquo;s low AC voltage up to collector voltage. See <a class="inline" href="/guide-pad-mount-vs-gsu-transformers.html">pad-mount vs. GSU transformers</a>.'],
      ['Inverter', 'Converts DC from the array to AC. The ratio of array DC power to inverter AC power is the <a class="inline" href="/calculators/dc-ac-ratio.html">DC/AC ratio</a>.'],
      ['Combiners', 'Parallel many strings of modules, each string fused, into the few large conductors that feed the inverter.'],
      ['PV array', 'Modules in series form a string whose voltage must stay under the system limit on the coldest day: see the <a class="inline" href="/calculators/solar-string.html">solar string calculator</a>.'],
      ['Station service', 'Feeds tracker motors, plant controls, communications and lighting. The plant draws this even at night.'],
    ],
    adds: ['Voltage, MVA and impedance for each transformer, and the number and rating of inverters per feeder', 'Protection relays and their device numbers at the main breaker and each feeder', 'Grounding method for the collector system, often a grounding transformer', 'Capacitor banks or other reactive support if the interconnection study requires them', 'The plant controller and its measurement point', 'DC-side details: string counts, combiner ratings and disconnects, which usually go on a separate DC single-line'],
    related: [['/renewables.html', 'Solar and hybrid plant reference'], ['/guide-inverter-clipping-ratio.html', 'Inverter clipping and DC/AC ratio'], ['/guide-nec-705-supply-side-vs-load-side.html', 'NEC 705: supply-side vs. load-side connections'], ['/calculators/voltage-drop.html', 'Voltage drop calculator']],
  };
})());

D.push((() => {
  const c = Canvas(820);
  const block = (l) => [brk('Feeder breaker'), { t: 'xf', l: 'Pad-mounted transformer' }, { t: 'box', in: '~ / =', l: 'Power conversion', s: 'system (PCS)' }, { t: 'sw', l: 'DC disconnect', s: 'and fuses' }, { t: 'bat', l, s: 'With BMS' }];
  c.chain(330, 24, [
    { t: 'src', l: 'Point of interconnection', s: 'Utility system' },
    { t: 'sw', l: 'Disconnect switch' },
    brk('High-voltage circuit breaker', 'With revenue metering'),
    { t: 'xf', l: 'Main power transformer' },
    brk('Main breaker'),
    { t: 'wire', h: 26 },
    { bus: [-270, 380], l: 'Medium-voltage bus', taps: [
      { dx: -220, items: block('Battery block 1') },
      { dx: 20, items: block('Battery blocks 2 to n') },
      { dx: 290, items: [brk('Auxiliary breaker'), { t: 'xf', l: 'Auxiliary transformer' }, { t: 'load', l: 'Auxiliary loads', s: 'Cooling, BMS, fire system' }] },
    ] },
  ]);
  return {
    slug: 'bess-single-line', badge: 'BESS', short: 'Battery storage single-line diagram',
    h1: 'Battery Energy Storage (BESS) Single-Line Diagram: A Typical Arrangement',
    title: 'BESS Single-Line Diagram (Typical, Free SVG) | Voltfield',
    desc: 'A typical battery energy storage system single-line diagram, from the point of interconnection through the transformer and PCS to the battery, with auxiliary power. Free SVG.',
    card: 'Battery blocks behind bidirectional converters on a medium-voltage bus, with the auxiliary supply that keeps them cool.',
    dek: 'A grid-connected battery plant drawn from the interconnection down to the cells, including the auxiliary power it cannot run without.',
    svg: c.svg('Typical battery energy storage system single-line diagram', 'The point of interconnection feeds through a disconnect and breaker to a main power transformer and a medium-voltage bus. Each battery block connects through a feeder breaker, a pad-mounted transformer, a power conversion system and a DC disconnect to the battery. An auxiliary transformer supplies cooling, battery management and fire systems.'),
    read: [
      ['Point of interconnection', 'Power flows both ways here. A storage plant is a load when charging and a generator when discharging, and it is studied as both.'],
      ['Main power transformer', 'Sized for the plant&rsquo;s power rating in MW, not its energy in MWh. Duration changes the number of battery containers, not the transformer.'],
      ['Medium-voltage bus', 'Collects the blocks. Larger plants split it into sections.'],
      ['Pad-mounted transformer', 'Matches the converter&rsquo;s AC voltage to the collector voltage. Frequently one transformer serves two converters.'],
      ['Power conversion system', 'A bidirectional inverter: it rectifies to charge and inverts to discharge. Whether it is grid-following or <a class="inline" href="/guide-grid-forming-vs-grid-following.html">grid-forming</a> decides what services the plant can provide.'],
      ['DC disconnect and fuses', 'Isolate each battery container from the converter and clear DC faults, which do not have the current zeros that help an AC breaker.'],
      ['Battery', 'Racks of modules in series and parallel, supervised by a battery management system. Power against energy is the <a class="inline" href="/guide-bess-c-rate.html">C-rate</a>.'],
      ['Auxiliary transformer and loads', 'Cooling, controls, and fire detection and suppression. These loads are large, run in every state and count against round-trip efficiency. Many sites give them a backup supply.'],
    ],
    adds: ['Power and energy ratings, voltages and impedances', 'Protection on both the AC and DC sides, including ground-fault detection on the DC bus', 'The plant controller and energy management system', 'Backup supply to the auxiliary bus so that cooling and fire systems survive a grid outage', 'Fire alarm and emergency shutdown interfaces required by <a class="inline" href="/guide-bess-fire-safety-nfpa-855.html">NFPA 855</a>', 'Any co-located solar, which may share the transformer and the interconnection'],
    related: [['/battery-storage.html', 'Battery storage reference'], ['/calculators/bess-sizing.html', 'BESS sizing calculator'], ['/guide-bess-augmentation.html', 'BESS augmentation'], ['/guide-bess-fire-safety-nfpa-855.html', 'BESS fire safety and NFPA 855']],
  };
})());

/* Data center drawing: built separately because the UPS has an output path
   beside its battery, which the simple chain cannot express. */
D.push((() => {
  const c = Canvas(760);
  const yA = c.chain(250, 24, [{ t: 'src', l: 'Utility service' }, { t: 'xf', l: 'Service transformer' }, brk('Main breaker')]);
  const yB = c.chain(510, 24, [{ t: 'gen', l: 'Standby generator' }, brk('Generator breaker')]);
  c.ln(510, yB, 510, yA);
  c.raw(`<rect x="210" y="${yA}" width="340" height="36" rx="2"/>`);
  c.tx(380, yA + 23, 'Automatic transfer switch (ATS)', 'middle', 'in');
  const yBus = yA + 36 + 34;
  c.ln(380, yA + 36, 380, yBus);
  c.ln(60, yBus, 700, yBus, 5);
  c.tx(60, yBus - 9, 'Low-voltage main switchboard');
  /* UPS branch */
  let y = yBus;
  y += c.sym(160, y, brk('UPS input breaker'));
  const yUps = y;
  y += c.sym(160, y, { t: 'box', in: 'UPS', l: '' });
  c.tx(126, yUps + 31, 'UPS', 'end', 'sub');
  /* battery off the side of the UPS */
  c.ln(184, yUps + 27, 250, yUps + 27); c.sym(250, yUps + 27, { t: 'bat', l: 'Battery' });
  y += c.sym(160, y, brk('UPS output breaker'));
  y += c.sym(160, y, { t: 'xf', l: 'PDU transformer' });
  c.sym(160, y, { t: 'load', l: 'IT racks', s: 'Critical load' });
  c.chain(430, yBus, [brk('Mechanical breaker'), { t: 'load', l: 'Cooling plant', s: 'Chillers, pumps, CRAHs' }]);
  c.chain(620, yBus, [brk('House breaker'), { t: 'load', l: 'Lighting and', s: 'building loads' }]);
  return {
    slug: 'data-center-single-line', badge: 'DC', short: 'Data center single-line diagram',
    h1: 'Data Center Single-Line Diagram: A Typical Power Path',
    title: 'Data Center Single-Line Diagram (Typical, Free SVG) | Voltfield',
    desc: 'A typical data center single-line diagram: utility and standby generator through a transfer switch to the switchboard, UPS, PDU and racks, with the cooling plant. Free SVG.',
    card: 'Utility and generator through a transfer switch, then UPS, PDU and racks, with the cooling plant on the same board.',
    dek: 'One power path of a data center, from the utility and the generator to the rack, and where the cooling plant fits.',
    svg: c.svg('Typical data center single-line diagram, one power path', 'A utility service with transformer and main breaker, and a standby generator with its breaker, feed an automatic transfer switch. The switch feeds a low-voltage main switchboard. One branch runs through a UPS with battery, an output breaker and a PDU transformer to the IT racks. Other branches feed the cooling plant and building loads.'),
    read: [
      ['Utility service and transformer', 'The normal source. The service transformer steps utility medium voltage down to the building&rsquo;s distribution voltage, 480 V or 415 V in North America: see <a class="inline" href="/guide-415v-vs-480v-distribution.html">415 V vs. 480 V</a>.'],
      ['Standby generator', 'The alternate source. It has to carry the IT load and the cooling that keeps it alive. See <a class="inline" href="/guide-generator-sizing.html">generator sizing</a>.'],
      ['Automatic transfer switch', 'Senses loss of utility, signals the generator to start and moves the load to it. The load sees a short break. Larger sites use breaker pairs in switchgear to do the same job. See <a class="inline" href="/guide-ats-vs-sts-vs-static-bypass.html">ATS vs. STS vs. static bypass</a>.'],
      ['Main switchboard', 'Divides power between the critical load, the mechanical plant and the building.'],
      ['UPS and battery', 'Carries the IT load through the seconds between utility failure and the generator taking over, and cleans up the supply the rest of the time. See <a class="inline" href="/guide-ups-topologies.html">UPS topologies</a> and <a class="inline" href="/guide-ups-sizing.html">UPS sizing</a>.'],
      ['PDU transformer', 'Steps down to the voltage the rack power supplies use and distributes it to rack-level branch circuits.'],
      ['IT racks', 'The critical load. Nearly every watt delivered here becomes heat the cooling plant must remove.'],
      ['Cooling plant', 'Usually not on the UPS, so it stops when utility fails and restarts on generator. That gap is a design decision in its own right at high rack densities.'],
    ],
    adds: ['A second, independent path. This drawing is a single path (N). Real facilities duplicate some or all of it: see <a class="inline" href="/guide-n-plus-1-vs-2n-redundancy.html">N+1 vs. 2N</a> and <a class="inline" href="/guide-uptime-institute-tiers.html">Uptime Institute tiers</a>', 'UPS static bypass and maintenance bypass', 'Ratings: transformer kVA and impedance, breaker frame and trip, bus ampacity and short-circuit rating', 'Ground-fault protection on the main, and surge protection', 'Protective relays and metering, including the meters behind a PUE figure', 'Static transfer switches or dual-corded loads at the rack'],
    related: [['/data-centers.html', 'Data center equipment reference'], ['/voltfield-sandbox.html', 'One-line sandbox: build your own'], ['/guide-rack-power-density.html', 'Rack power density'], ['/calculators/pue.html', 'PUE calculator']],
  };
})());

/* ------------------------------------------------------------- legend ---- */
function legend() {
  const c = Canvas(760);
  const items = [
    [{ t: 'src' }, 'Utility or grid source'], [{ t: 'gen' }, 'Generator'], [{ t: 'xf' }, 'Transformer'], [{ t: 'brk' }, 'Circuit breaker'],
    [{ t: 'sw' }, 'Disconnect switch'], [{ t: 'box', in: '= / ~' }, 'Inverter or converter'], [{ t: 'bat' }, 'Battery'], [{ t: 'pv' }, 'PV array'],
    [{ t: 'load' }, 'Load or feeder'],
  ];
  items.forEach(([it, name], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 70 + col * 250, y = 24 + row * 92;
    c.sym(x, y, it);
    c.tx(x + 46, y + 30, name);
  });
  const yb = 24 + 3 * 92 + 16;
  c.ln(46, yb, 150, yb, 5); c.tx(170, yb + 4, 'Bus: a common conductor that several circuits connect to');
  c.see(yb + 10);
  return c.svg('Single-line diagram symbols used in this library', 'Symbols for a utility source, generator, transformer, circuit breaker, disconnect switch, inverter, battery, PV array, load and bus.');
}

/* --------------------------------------------------------------- pages ---- */
const DL = `<script>
(function(){var b=document.querySelector('[data-dl]');if(!b)return;b.addEventListener('click',function(){
var s=document.querySelector('svg.sld').cloneNode(true);s.setAttribute('style','color:#111;background:#fff');
var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['<?xml version="1.0" encoding="UTF-8"?>'+new XMLSerializer().serializeToString(s)],{type:'image/svg+xml'}));
a.download='voltfield-'+b.getAttribute('data-dl')+'.svg';document.body.appendChild(a);a.click();a.remove();});
var p=document.querySelector('[data-print]');if(p)p.addEventListener('click',function(){window.print();});})();
</script>`;
const STYLE = `.sld{display:block;width:100%;height:auto;color:var(--ink)}
.sld-frame{background:var(--card);border:1px solid var(--line-dark);border-radius:var(--r-lg);padding:18px;margin:8px 0 10px;overflow-x:auto}
.sld-frame .sld{min-width:620px}
.artwrap.dwgwrap{max-width:1000px}
.artwrap.dwgwrap > *{max-width:720px}
.artwrap.dwgwrap > .sld-frame,.artwrap.dwgwrap > .tpl-actions,.artwrap.dwgwrap > .gdgrid,.artwrap.dwgwrap > .tt-wrap{max-width:none}
.artwrap p.sld-cap{font-size:14px;color:var(--slate)}
@media print{header.site,footer,.artban,.ad-unit,.skip-link,.web-only,.dwgwrap > :not(.sld-frame):not(.sld-cap){display:none !important}
  .sld-frame{border:0;padding:0}.sld{color:#000}.artwrap.dwgwrap{max-width:none;padding:0}}`;

function render(d) {
  const crumbs = [['Drawings', 'drawings.html'], [d.short, `drawings/${d.slug}.html`]];
  const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>${d.h1}</h1>
    <p class="dek">${d.dek}</p>
  </div>
</section>

<div class="artwrap dwgwrap">
  <div class="tpl-actions web-only" role="group" aria-label="Drawing actions">
    <button type="button" class="btn btn-primary" data-dl="${d.slug}">Download SVG</button>
    <button type="button" class="btn btn-ghost" data-print>Print or save as PDF</button>
  </div>
  <div class="sld-frame">
${d.svg}
  </div>
  <p class="sld-cap">A typical arrangement for learning. It carries no ratings on purpose and is not a design. Symbols are explained in the <a class="inline" href="/drawings.html#symbols">legend</a>.</p>

  <h2 id="reading">Reading it from the top</h2>
  <dl class="tnotes">
${d.read.map(([a, b]) => `    <dt>${a}</dt><dd>${b}</dd>`).join('\n')}
  </dl>

  <div class="ad-unit" data-ad="incontent"></div>

  <h2 id="real">What a real single-line adds</h2>
  <p>A single-line diagram for construction is a controlled document that an engineer is responsible for. Compared with this one it would also show:</p>
  <ul>
${d.adds.map(a => `    <li>${a}</li>`).join('\n')}
  </ul>

  <h2 id="related">Related</h2>
  <ul>
${d.related.map(([h, l]) => `    <li><a class="inline" href="${h}">${l}</a></li>`).join('\n')}
    <li><a class="inline" href="/drawings.html">All drawings</a></li>
  </ul>
  <p class="provenance">Published ${DATE_LONG}. Free to use and adapt with a link back to this page. Spotted an error? <a class="inline" href="/contact.html">Tell us</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>
${DL}`;
  const faq = [[`What does this ${d.short.replace(' single-line diagram', '').toLowerCase()} single-line diagram show?`, d.svg.match(/<desc[^>]*>([^<]*)</)[1]]];
  return page({ url: `drawings/${d.slug}.html`, title: d.title, desc: d.desc, crumbs, faq, dateISO: DATE_ISO, css: ['/voltfield-templates.css'], style: STYLE, body });
}

const TYPES = [
  ['Single-line diagram (one-line)', 'The whole power system with one line standing for all three phases: sources, transformers, breakers, buses and loads, with ratings.', 'Everyone. It is the first drawing made and the one every study starts from.'],
  ['Three-line diagram', 'The same circuit with every phase and the neutral drawn, showing instrument transformer connections and phasing.', 'Protection engineers, and the people wiring CTs, VTs and meters.'],
  ['Schematic (elementary) diagram', 'How a control circuit works, laid out by function: what closes a breaker, what trips it, what interlocks it.', 'Controls engineers and commissioning technicians.'],
  ['Wiring (connection) diagram', 'Every wire and terminal as physically installed, device by device.', 'Panel builders and electricians.'],
  ['General arrangement and outline', 'Physical size, weight, anchoring, cable entry and clearances of one piece of equipment.', 'Civil and structural design, logistics and the installing contractor.'],
  ['Layout and plan drawings', 'Where equipment sits in a room or yard, with working space and egress.', 'Design coordination and the authority having jurisdiction.'],
  ['Cable and conduit schedule', 'Every cable: from, to, size, type, length and route.', 'Estimators, purchasers and installers.'],
  ['Grounding plan', 'The grounding electrode system, grid conductors and bonding connections.', 'Electrical and civil crews, and the testing firm.'],
  ['P&amp;ID', 'Piping and instrumentation diagram: process piping, valves and instruments for cooling water, fuel and other fluid systems.', 'Mechanical and controls engineers.'],
  ['Nameplate and bill of materials drawings', 'What the nameplate will state and every component in the assembly.', 'Whoever checks the delivery against the order.'],
];

function hub() {
  const crumbs = [['Drawings', 'drawings.html']];
  const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>Electrical Drawings Library: Typical Single-Line Diagrams</h1>
    <p class="dek">Typical single-line diagrams you can read, download and adapt, the symbols they use, and a plain guide to the kinds of drawing an equipment order produces.</p>
  </div>
</section>

<div class="artwrap dwgwrap">
  <p><b>A single-line diagram shows an entire power system on one sheet by drawing one line for all three phases.</b> It is the drawing that engineers size equipment from, that purchasers read to see what is being bought, and that everyone points at in a meeting. Each drawing here is a typical arrangement with every element explained, free to download as a vector file.</p>

  <h2 id="diagrams">Typical single-line diagrams</h2>
  <div class="gdgrid">
${D.map(d => `    <a class="gdcard has-thumb" href="/drawings/${d.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${d.badge}</span><h3>${d.short}</h3><p>${d.card}</p></a>`).join('\n')}
  </div>
  <p>To build and check one of your own, use the <a class="inline" href="/voltfield-sandbox.html">one-line sandbox</a>.</p>

  <h2 id="symbols">Symbols used here</h2>
  <div class="sld-frame">
${legend()}
  </div>
  <p class="sld-cap">Symbol conventions vary between companies and between North American and IEC practice. A real drawing set includes its own legend sheet, and that legend governs. Relay and device numbers are covered in <a class="inline" href="/guide-ansi-device-numbers.html">ANSI device numbers</a>.</p>

  <div class="ad-unit" data-ad="incontent"></div>

  <h2 id="types">Kinds of drawing, and who needs each</h2>
  <div class="tt-wrap"><table class="reftable">
    <tr><th scope="col">Drawing</th><th scope="col">What it shows</th><th scope="col">Who uses it</th></tr>
${TYPES.map(([a, b, c]) => `    <tr><td><b>${a}</b></td><td>${b}</td><td>${c}</td></tr>`).join('\n')}
  </table></div>

  <h2 id="in-an-order">Drawings in an equipment order</h2>
  <p>When equipment is bought, drawings move in a fixed sequence, and each step is a point where schedule is won or lost.</p>
  <ul>
    <li><b>Approval drawings.</b> The vendor submits outline, nameplate, single-line and schematic drawings after the order. Nothing should be built until the buyer releases them. Put the due date and the buyer&rsquo;s turnaround in the <a class="inline" href="/templates/purchase-order.html">purchase order</a>.</li>
    <li><b>Review status.</b> Drawings come back approved, approved as noted, or revise and resubmit. Each resubmittal costs weeks. Track them in the <a class="inline" href="/templates/expediting-log.html">expediting log</a>.</li>
    <li><b>Certified for construction.</b> The released set that the factory builds to and the site designs foundations and cable entries from.</li>
    <li><b>As-built.</b> The final set, corrected for every change made in the factory and at the <a class="inline" href="/guide-fat-vs-sat.html">factory acceptance test</a>. It is a deliverable, and worth tying to the last payment.</li>
  </ul>
  <p class="provenance">Published ${DATE_LONG}. The drawings are free to use and adapt with a link back. Want a drawing that is not here? <a class="inline" href="/contact.html">Tell us which</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>`;
  return page({ url: 'drawings.html', title: 'Electrical Drawings Library: Single-Line Diagrams & Symbols | Voltfield',
    desc: 'Typical single-line diagrams for a substation, solar plant, battery storage plant and data center, free as SVG, with a symbol legend and a guide to drawing types.',
    crumbs, dateISO: DATE_ISO, css: ['/voltfield-templates.css'], style: STYLE, body });
}

for (const d of D) write(`drawings/${d.slug}.html`, render(d));
write('drawings.html', hub());
