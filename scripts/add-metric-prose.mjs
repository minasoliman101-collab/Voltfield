#!/usr/bin/env node
/*
 * Metric versions of the text under the calculators that have a US / Metric
 * switch: the hint under the tool's heading, the opening paragraphs where they
 * quote a number, the formula with its variables, and the worked example.
 *
 *   node scripts/add-metric-prose.mjs
 *
 * WHY A POST-PASS AND NOT THE GENERATOR. Several of these pages carry hand
 * edits that gen-calc-pages.ps1 has no record type for (voltage-drop's NEC
 * 3%/5% section and FAQ, corrections on arc-flash), so regenerating them to
 * add a metric twin would lose more than it added. This wraps what is already
 * on the page and puts the metric text beside it. It is idempotent, and it has
 * to be re-run on any page that IS regenerated.
 *
 * HOW IT SHOWS. Both versions are in the HTML. US text sits in an element with
 * data-u="us", metric in data-u="metric" hidden; the units layer in
 * voltfield-calculators.js swaps them with the fields. (data-u, not
 * data-units: the switch's own buttons already use data-units.) Without
 * JavaScript the reader gets the US text.
 *
 * THE NUMBERS. Every figure in a metric example is computed below with the
 * same constants the calculator uses, expressed in metric, so the example
 * agrees with what the tool returns for the same inputs. Do not type a result
 * in by hand.
 */
import fs from 'node:fs';
import path from 'node:path';
process.chdir(path.resolve(import.meta.dirname, '..'));

const f = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const R3 = Math.sqrt(3);
/* K in ohm-cmil/ft -> resistivity in ohm-mm2/m: the same constant, in metric. */
const RHO_CU = 12.9 * 5.067075e-4 / 0.3048, RHO_AL = 21.2 * 5.067075e-4 / 0.3048;
const MM2 = (cmil) => cmil * 5.067075e-4;
const AIR = 3412.142 * 1.699011 / (1.08 * 1.8);          // m3/h per kW per K
const WATER = 24 / 1.8 * 0.0630902 / 3.516853;           // L/s per kW per K
const PUMP = 0.7457 / (0.0630902 * 0.3048 * 3960);       // kW per (L/s x m)

const vd = (mult, rho, I, L, A) => mult * rho * I * L / A;
const P = {};

{ // voltage drop
  const A = MM2(66360), v1 = vd(R3, RHO_CU, 100, 45, A), v2 = vd(R3, RHO_CU, 100, 120, A);
  P['voltage-drop'] = {
    sub: `&rho; = ${f(RHO_CU, 4)} (copper) or ${f(RHO_AL, 4)} (aluminum) &Omega;&middot;mm&sup2;/m &mdash; approximate, ignores conductor reactance. Best for runs under about 75 m.`,
    formula: 'VD = (2 &times; &rho; &times; I &times; L) / A&nbsp; [single-phase]<br>VD = (1.732 &times; &rho; &times; I &times; L) / A&nbsp; [three-phase]',
    vars: [['&rho;', `Resistivity: ${f(RHO_CU, 4)} for copper, ${f(RHO_AL, 4)} for aluminum, in &Omega;&middot;mm&sup2;/m at about 75&deg;C. These are the K factors 12.9 and 21.2 expressed in metric units`],
           ['I', 'Load current in amperes'], ['L', 'One-way circuit length in metres'],
           ['A', 'Conductor cross-section in mm&sup2;. AWG sizes are not round numbers in metric: 2 AWG is 33.6 mm&sup2; and 4/0 is 107 mm&sup2;'],
           ['2 or 1.732', 'Accounts for the return path: two conductors single-phase, the square root of three for three-phase']],
    example: [`A 100 A three-phase load at 480 V, 45 m away, on 2 AWG copper (${f(A, 1)} mm&sup2;):`,
              `VD = (1.732 &times; ${f(RHO_CU, 4)} &times; 100 &times; 45) / ${f(A, 1)} = ${f(v1, 2)} V`,
              `As a percentage: ${f(v1, 2)} / 480 = ${f(v1 / 480 * 100, 2)}%. Comfortably inside 3%.`,
              `Move the same load to 120 m and it becomes ${f(v2, 1)} V, or ${f(v2 / 480 * 100, 1)}% &mdash; still inside the limit, but with nothing left for the branch circuit beyond it.`],
  };
}
{ // wire resistance
  const A = MM2(6530), r = RHO_CU * 30 / A, loop = 2 * r;
  P['wire-resistance'] = {
    sub: `&rho; = ${f(RHO_CU, 4)} (copper) or ${f(RHO_AL, 4)} (aluminum) &Omega;&middot;mm&sup2;/m. DC resistance at about 75&deg;C.`,
    formula: 'R = &rho; &times; L / A',
    vars: [['R', 'Resistance in ohms'], ['&rho;', `${f(RHO_CU, 4)} for copper, ${f(RHO_AL, 4)} for aluminum, in &Omega;&middot;mm&sup2;/m at about 75&deg;C`],
           ['L', 'Length in metres. One way, or doubled for a two-wire circuit'], ['A', 'Conductor area in mm&sup2;. 12 AWG is 3.31; 4/0 AWG is 107']],
    example: ['30 m of 12 AWG copper, one way:',
              `R = ${f(RHO_CU, 4)} &times; 30 / ${f(A, 2)} = ${f(r, 4)} &Omega;`,
              `That is ${f(RHO_CU * 1000 / A, 2)} &Omega; per km.`,
              `For a two-wire circuit the current passes through 60 m of conductor, so the resistance is ${f(loop, 4)} &Omega;. At 16 A that drops 16 &times; ${f(loop, 4)} = ${f(16 * loop, 1)} V, which on a 120 V circuit is ${f(16 * loop / 120 * 100, 1)} percent, well past the 3 percent usually recommended for a branch circuit.`],
  };
}
{ // airflow
  const q = AIR * 10 / 11, q2 = AIR * 10 / 17;
  P['airflow-cfm'] = {
    sub: `m&sup3;/h = kW &times; ${f(AIR, 0)} &divide; &Delta;T in kelvin. Sensible heat, standard air at sea level.`,
    intro: [`<b>The airflow needed to carry away a heat load, in cubic metres per hour, is the load in kilowatts times ${f(AIR, 0)}, divided by the air temperature rise in kelvin.</b> For 10 kW of IT equipment and an 11 K rise that is about ${f(q)} m&sup3;/h, or ${f(q / 10)} m&sup3;/h per kW. Halve the temperature rise and the airflow doubles.`,
            'This is the sum behind every question about whether a rack, a row or a room has enough air. Almost all the electrical power going into IT equipment leaves as heat, so the heat load in kW is the electrical load in kW.'],
    formula: `Q (m&sup3;/h) = P (kW) &times; ${f(AIR, 0)} / &Delta;T (K)<br>Q (m&sup3;/s) = P (kW) / (1.2 &times; 1.006 &times; &Delta;T)`,
    vars: [['Q', 'Airflow, in cubic metres per hour or per second'], ['&Delta;T', 'Temperature rise of the air across the equipment, in kelvin. One kelvin is the same step as one degree Celsius'],
           [f(AIR, 0), 'A constant for standard air: 3,600 seconds divided by density 1.2 kg/m&sup3; and specific heat 1.006 kJ/kg&middot;K'], ['P', 'Sensible heat load, which for IT equipment is its electrical input']],
    example: ['A rack drawing 10 kW, with air entering at 24&deg;C and leaving at 35&deg;C:',
              `Q = 10 &times; ${f(AIR, 0)} / 11 = ${f(q)} m&sup3;/h, or ${f(q / 10)} m&sup3;/h per kW`,
              `The same rack with a 17 K rise needs ${f(q2)} m&sup3;/h. Wider temperature rise is the reason high-density equipment can be cooled with less air than its power suggests, and it is also why hot-aisle temperatures have climbed.`],
  };
}
{ // chilled water
  const l = WATER * 350 / 5.5, l2 = WATER * 350 / 9;
  P['chilled-water-flow'] = {
    sub: `L/s = kW &divide; (${f(1 / WATER, 2)} &times; &Delta;T in kelvin). Plain water.`,
    intro: [`<b>Chilled water flow in litres per second is the load in kilowatts divided by ${f(1 / WATER, 2)} times the temperature difference in kelvin.</b> At a 5.5 K difference that is ${f(WATER / 5.5, 3)} L/s for each kW; at 7 K it is ${f(WATER / 7, 3)} and at 9 K it is ${f(WATER / 9, 3)}.`,
            'The temperature difference is the lever. A wider one moves the same heat with less water, which means smaller pipes and less pump energy. It is why chilled water systems for data centers are designed with wider differences than the old comfort-cooling rule of thumb.'],
    formula: `Q (L/s) = P (kW) / (${f(1 / WATER, 2)} &times; &Delta;T)`,
    vars: [['Q', 'Water flow in litres per second'], ['&Delta;T', 'Difference between return and supply water temperature, in kelvin'],
           [f(1 / WATER, 2), 'The specific heat of water in kJ/kg&middot;K, with one litre taken as one kilogram'], ['P', 'Cooling load in kW. One ton of refrigeration is 3.517 kW']],
    example: ['A 350 kW load with water supplied at 7&deg;C and returning at 12.5&deg;C:',
              `Q = 350 / (${f(1 / WATER, 2)} &times; 5.5) = ${f(l, 1)} L/s`,
              `Widen the difference to 9 K and the same load needs ${f(l2, 1)} L/s. Because pump power falls much faster than flow, the saving in pumping energy is larger than the ${f((1 - l2 / l) * 100)} percent cut in flow suggests.`],
  };
}
{ // pump power
  const hyd = 30 * 24 * PUMP, shaft = hyd / 0.75, inp = shaft / 0.93;
  P['pump-power'] = {
    sub: 'Water power in kW = L/s &times; head in metres &times; SG &divide; 102. One duty point; check the motor against the whole pump curve.',
    intro: ['<b>Pump power in kilowatts is flow in litres per second times head in metres, divided by 102, and divided again by the pump\'s efficiency.</b> Flow times head over 102 gives the power delivered to the water. Dividing by pump efficiency gives the power the shaft has to supply, and dividing that by motor efficiency gives the electrical input.',
            'Head is the pressure the pump adds, expressed as the height of a column of the liquid. It is not the height the water is lifted, unless the system is open. In a closed chilled water loop the static heights cancel and the head is all friction: pipe, fittings, valves, the coil and the chiller.'],
    formula: 'Water kW = Q (L/s) &times; H (m) &times; SG / 102<br>Shaft kW = water kW / pump efficiency<br>Input kW = shaft kW / motor efficiency',
    vars: [['Q', 'Flow in litres per second'], ['H', 'Total dynamic head in metres of liquid'], ['SG', 'Specific gravity. 1.0 for water'],
           ['102', 'A constant for water: 1,000 divided by the acceleration of gravity, 9.81 m/s&sup2;'], ['Pump efficiency', 'From the pump curve at the duty point, as a fraction'], ['Motor efficiency', 'From the motor nameplate, as a fraction']],
    example: ['A chilled water pump delivering 30 L/s against 24 m of head, with a pump efficiency of 75 percent and a motor efficiency of 93 percent:',
              `Water kW = 30 &times; 24 &times; 1.0 / 102 = ${f(hyd, 1)} kW`,
              `Shaft kW = ${f(hyd, 1)} / 0.75 = ${f(shaft, 1)} kW`,
              `Input kW = ${f(shaft, 1)} / 0.93 = ${f(inp, 1)} kW`,
              `The next standard IEC motor at or above ${f(shaft, 1)} kW is 11 kW. Running all year, ${f(inp, 1)} kW is about ${f(Math.round(inp * 8760 / 100) * 100)} kWh.`],
  };
}
{ // pipe velocity
  /* v = Q / A, with Q in L/s and d in mm: (Q/1000) / (pi/4 x (d/1000)^2) = 1273.24 x Q / d^2 */
  const k = 4000 / Math.PI, v = k * 15 / (102.3 * 102.3), v2 = k * 15 / (77.9 * 77.9);
  P['pipe-velocity'] = {
    sub: 'v = 1,273 &times; L/s &divide; d&sup2;, with d in millimetres. Use the inside diameter, not the nominal size: DN 100 Schedule 40 steel is 102.3 mm.',
    intro: [`<b>Water velocity in metres per second is 1,273 times the flow in litres per second, divided by the square of the pipe's inside diameter in millimetres.</b> Because diameter is squared, one pipe size makes a large difference: the same 15 L/s runs at ${f(v, 1)} m/s in DN 100 pipe and ${f(v2, 1)} m/s in DN 80.`,
            'Velocity is the quick test of whether a pipe is the right size. Too fast, and the pipe is noisy, erodes at elbows and tees, and loses a great deal of pressure. Too slow, and air and dirt drop out of the flow instead of being carried to where they can be removed.'],
    formula: 'v = 1,273 &times; Q / d&sup2;',
    vars: [['v', 'Velocity in metres per second'], ['Q', 'Flow in litres per second'], ['d', 'Inside diameter of the pipe in millimetres, which is not the nominal size'],
           ['1,273', 'From the area of a circle: 4 / &pi;, with the units converted']],
    example: ['15 L/s in DN 100 (4 inch) Schedule 40 steel pipe, which has an inside diameter of 102.3 mm:',
              `v = 1,273 &times; 15 / 102.3&sup2; = ${f(1273 * 15, 0)} / ${f(102.3 * 102.3, 0)} = ${f(v, 2)} m/s`,
              `The same flow in DN 80 (3 inch) Schedule 40, inside diameter 77.9 mm, runs at ${f(v2, 2)} m/s, which is on the fast side for a closed hydronic system.`],
  };
}
{ // arc flash: same equations, distances in mm
  P['arc-flash'] = {
    example: ['At 480 V in an enclosure, with 22.6 kA bolted fault current and a 457 mm working distance, the Doughty equation gives 4.3 cal/cm&sup2; at 0.1 s clearing and 8.5 cal/cm&sup2; at 0.2 s. Double the time, double the energy: incident energy is directly proportional to arcing time.',
              'The arc-flash boundary grows less, from about 1.1 m to 1.7 m, because energy falls off steeply with distance. A breaker setting change that shaves 100 ms off clearing can move a task into a lower PPE category without touching the hardware.',
              'The equations themselves are written with distance in inches. The calculator converts the millimetres you enter; 457 mm is the customary 18 in working distance for low-voltage equipment.'],
  };
}
{ // generator runtime
  const tank = 3785, r75 = 98, r25 = 42;
  P['generator-runtime'] = {
    formula: 'Runtime (h) = Fuel tank capacity (L) / Fuel consumption rate (L/h)',
    vars: [['Tank capacity', 'Usable fuel volume, which is less than nominal capacity once the unusable heel is excluded'], ['Consumption rate', 'Litres per hour at the expected load, from the genset spec sheet']],
    example: [`A 500 kW diesel set with a ${f(tank)} litre tank, consuming ${r75} L/h at 75% load:`,
              `Runtime = ${f(tank)} / ${r75} = ${f(tank / r75, 1)} hours`,
              `At 25% load the same set might burn ${r25} L/h, giving about ${f(tank / r25)} hours &mdash; more than twice as long from the same tank.`],
  };
}

/* ------------------------------------------------------------------ patch */
const twin = (us, metric, tag = 'div', pad = '  ') => `${pad}<${tag} data-u="us">\n${us}\n${pad}</${tag}>\n${pad}<${tag} data-u="metric" hidden>\n${metric}\n${pad}</${tag}>`;
let done = 0;
for (const [slug, m] of Object.entries(P)) {
  const file = `calculators/${slug}.html`;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('data-u="metric"')) { console.log('  already has metric text: ' + file); continue; }
  const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  const section = (heading) => { const i = s.indexOf(`<h2>${heading}</h2>`); if (i < 0) return null; const a = s.indexOf('\n', i) + 1, b = s.indexOf('\n  <h2', a); return b < 0 ? null : [a, b]; };

  if (m.example) {
    const r = section('Worked example'); if (!r) throw new Error(file + ': no Worked example');
    const us = s.slice(r[0], r[1]).replace(/\s+$/, '');
    s = s.slice(0, r[0]) + twin(us, m.example.map(p => `  <p>${p}</p>`).join('\n')) + '\n' + s.slice(r[1]);
  }
  if (m.formula) {
    const r = section('The formula'); if (!r) throw new Error(file + ': no formula');
    const us = s.slice(r[0], r[1]).replace(/\s+$/, '');
    const met = `    <div class="formula">${m.formula}</div>\n    <div class="tblwrap"><table class="famtable"><tbody>\n` +
      m.vars.map(([k, v]) => `      <tr><td class="num"><b>${k}</b></td><td>${v}</td></tr>`).join('\n') + '\n    </tbody></table></div>';
    s = s.slice(0, r[0]) + twin(us, met) + '\n' + s.slice(r[1]);
  }
  if (m.intro) {
    const a0 = s.indexOf('</section>', s.indexOf('class="calc-tool"')), b = s.indexOf('  <h2>The formula</h2>');
    if (a0 < 0 || b < 0) throw new Error(file + ': intro bounds');
    const a = s.indexOf('\n', a0) + 1;
    const us = s.slice(a, b).trim().split('\n').map(l => '  ' + l.trim()).join('\n');
    s = s.slice(0, a) + '\n' + twin(us, m.intro.map(p => `  <p>${p}</p>`).join('\n')) + '\n\n' + s.slice(b);
  }
  if (m.sub) {
    const mm = s.match(/<div class="sub">([\s\S]*?)<\/div>/);
    if (!mm) throw new Error(file + ': no sub');
    s = s.replace(mm[0], `<div class="sub"><span data-u="us">${mm[1]}</span><span data-u="metric" hidden>${m.sub}</span></div>`);
  }
  fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
  done++;
  console.log('  metric text added: ' + file + '  (' + Object.keys(m).join(', ') + ')');
}
console.log('pages patched: ' + done);
