#!/usr/bin/env node
/* Generates formulas.html: one page of the formulas used across power
 * generation, distribution, storage and cooling, each with its variables and,
 * where the site has one, the calculator that runs it.
 *
 *   node scripts/gen-formulas.mjs
 *
 * Every entry is a standard textbook relation. Constants that depend on an
 * assumption (1.08 for standard air, 500 for water) say so in the note.
 * f: [name, equation (HTML), variables, note, calculator slug or guide path, link label]
 */
import { page, crumbNav, write } from './lib-shell.mjs';

const DATE_ISO = '2026-11-15';
const DATE_LONG = 'November 15, 2026';
const R3 = '&radic;3';

const S = [
{ id: 'circuits', h: 'Circuit basics', f: [
  ['Ohm&rsquo;s law', 'V = I &times; R', 'V volts, I amps, R ohms', 'Rearranged: I = V / R and R = V / I.', 'ohms-law', 'Ohm&rsquo;s law calculator'],
  ['Power in a DC or resistive circuit', 'P = V &times; I = I&sup2; &times; R = V&sup2; / R', 'P watts', 'The I&sup2;R form is the one that explains conductor heating and line losses.', 'ohms-law', 'Ohm&rsquo;s law calculator'],
  ['Energy', 'E = P &times; t', 'E in kWh, P in kW, t in hours', 'Cost is energy times the rate: kWh &times; $/kWh.', 'electricity-cost', 'Electricity cost calculator'],
  ['Conductor resistance', 'R = &rho; &times; L / A', '&rho; resistivity, L length, A cross-section', 'Resistivity rises with temperature, so resistance tables state the temperature they are for.', 'wire-resistance', 'Wire resistance calculator'],
  ['Resistors in series and parallel', 'R<sub>s</sub> = R<sub>1</sub> + R<sub>2</sub> &nbsp;&nbsp; 1/R<sub>p</sub> = 1/R<sub>1</sub> + 1/R<sub>2</sub>', '', 'Two in parallel: R<sub>p</sub> = R<sub>1</sub>R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>).'],
  ['Reactance and impedance', 'X<sub>L</sub> = 2&pi;fL &nbsp;&nbsp; X<sub>C</sub> = 1 / (2&pi;fC) &nbsp;&nbsp; Z = &radic;(R&sup2; + (X<sub>L</sub> &minus; X<sub>C</sub>)&sup2;)', 'f hertz, L henries, C farads, Z ohms', 'In an AC circuit Ohm&rsquo;s law uses Z in place of R.'],
] },
{ id: 'ac-power', h: 'AC and three-phase power', f: [
  ['Single-phase real power', 'P = V &times; I &times; PF', 'P watts, PF power factor', '', 'watts-to-amps', 'Watts to amps calculator'],
  ['Three-phase real power', `P = ${R3} &times; V<sub>LL</sub> &times; I &times; PF`, 'V<sub>LL</sub> line-to-line volts, I line amps', `${R3} is about 1.732.`, 'three-phase-power', 'Three-phase power calculator'],
  ['Three-phase apparent power', `S = ${R3} &times; V<sub>LL</sub> &times; I`, 'S in VA; divide by 1,000 for kVA', 'Equipment is rated in kVA because its heating depends on current, whatever the power factor.', 'amps-to-kva', 'Amps to kVA calculator'],
  ['Current from kW, three-phase', `I = kW &times; 1000 / (${R3} &times; V<sub>LL</sub> &times; PF)`, '', '', 'kw-to-amps', 'kW to amps calculator'],
  ['Power triangle', 'S&sup2; = P&sup2; + Q&sup2; &nbsp;&nbsp; PF = P / S', 'P kW, Q kVAR, S kVA', 'kW = kVA &times; PF.', 'kva-to-kw', 'kVA to kW calculator'],
  ['Power factor correction', 'Q<sub>c</sub> = P &times; (tan &phi;<sub>1</sub> &minus; tan &phi;<sub>2</sub>)', 'Q<sub>c</sub> kVAR of capacitors, &phi; = arccos(PF) before and after', '', 'power-factor', 'Power factor calculator'],
  ['Line and phase voltage, wye', `V<sub>LL</sub> = ${R3} &times; V<sub>LN</sub>`, '', 'Which is why 480Y/277 V and 208Y/120 V come in pairs.', '/guide-delta-vs-wye.html', 'Delta vs. wye guide'],
] },
{ id: 'conductors', h: 'Conductors and protection', f: [
  ['Voltage drop, single-phase', 'VD = 2 &times; I &times; R &times; L / 1000', 'R ohms per 1,000 ft, L one-way feet', 'The 2 accounts for the return conductor.', 'voltage-drop', 'Voltage drop calculator'],
  ['Voltage drop, three-phase', `VD = ${R3} &times; I &times; R &times; L / 1000`, 'R ohms per 1,000 ft, L one-way feet', 'This resistance-only form is close for small conductors. Large conductors need reactance included.', 'voltage-drop', 'Voltage drop calculator'],
  ['Percent voltage drop', '%VD = VD / V<sub>source</sub> &times; 100', '', 'Common design targets are 3% on a branch or feeder and 5% overall.', 'voltage-drop', 'Voltage drop calculator'],
  ['Continuous load', 'OCPD &ge; 1.25 &times; I<sub>continuous</sub> + I<sub>noncontinuous</sub>', 'A continuous load runs three hours or more', 'The same thing seen from the other side: a standard breaker carries 80% of its rating continuously.', 'breaker-size', 'Breaker size calculator'],
  ['Corrected ampacity', 'I<sub>allowed</sub> = I<sub>table</sub> &times; F<sub>temperature</sub> &times; F<sub>bundling</sub>', 'Factors from the adopted electrical code', '', 'ampacity', 'Ampacity calculator'],
  ['Conduit fill', 'Fill % = &Sigma; conductor area / conduit internal area &times; 100', 'Areas include insulation', '', 'conduit-fill', 'Conduit fill calculator'],
  ['Voltage unbalance', '% unbalance = max deviation from average / average &times; 100', 'Using the three line-to-line voltages', 'The NEMA definition. A few percent of unbalance causes a much larger current unbalance in a motor.', 'voltage-unbalance', 'Voltage unbalance calculator'],
] },
{ id: 'transformers', h: 'Transformers and fault current', f: [
  ['Full-load current, three-phase', `I<sub>FL</sub> = kVA &times; 1000 / (${R3} &times; V<sub>LL</sub>)`, '', 'Single-phase: I = kVA &times; 1000 / V.', 'kva-to-amps', 'kVA to amps calculator'],
  ['Turns ratio', 'V<sub>p</sub> / V<sub>s</sub> = N<sub>p</sub> / N<sub>s</sub> = I<sub>s</sub> / I<sub>p</sub>', 'p primary, s secondary, N turns', 'Voltage goes with turns, current goes against them.'],
  ['kVA needed for a load', 'kVA = kW / PF', '', 'Then add margin and round up to a standard rating.', 'transformer-sizing', 'Transformer sizing calculator'],
  ['Fault current at the secondary', 'I<sub>SC</sub> = I<sub>FL</sub> &times; 100 / %Z', '%Z nameplate impedance', 'Assumes an infinite source, so it is the upper bound. A 5.75% unit lets through about 17 times full-load current.', 'fault-current', 'Fault current calculator'],
  ['Efficiency', '&eta; = P<sub>out</sub> / (P<sub>out</sub> + P<sub>no-load</sub> + P<sub>load</sub>)', 'Load loss scales with the square of loading', 'Peak efficiency falls where load loss equals no-load loss.'],
] },
{ id: 'motors', h: 'Motors, pumps and fans', f: [
  ['Synchronous speed', 'n<sub>s</sub> = 120 &times; f / p', 'n rpm, f hertz, p number of poles', 'A 4-pole motor on 60 Hz: 1,800 rpm.', 'motor-speed', 'Motor speed calculator'],
  ['Slip', 's = (n<sub>s</sub> &minus; n) / n<sub>s</sub>', 'n actual shaft speed', ''],
  ['Torque', 'T = 5252 &times; hp / rpm', 'T in lb&middot;ft', 'Metric: T (N&middot;m) = 9550 &times; kW / rpm.', 'motor-torque', 'Motor torque calculator'],
  ['Horsepower to kilowatts', 'kW = hp &times; 0.746', '', 'That is shaft power. Electrical input is shaft power divided by efficiency.', 'hp-to-kw', 'hp to kW calculator'],
  ['Motor input current, three-phase', `I = hp &times; 746 / (${R3} &times; V &times; &eta; &times; PF)`, '&eta; efficiency as a decimal', 'For sizing conductors and protection, codes use table currents, not this figure.'],
  ['Affinity laws', 'Q &prop; N &nbsp;&nbsp; H &prop; N&sup2; &nbsp;&nbsp; P &prop; N&sup3;', 'Q flow, H head or pressure, P power, N speed', 'At 80% speed a fan or pump draws about half the power. Static head weakens the cube law.', 'affinity-laws', 'Affinity laws calculator'],
  ['Pump power', 'bhp = GPM &times; head &times; SG / (3960 &times; &eta;)', 'head in feet, SG specific gravity, &eta; pump efficiency', '', 'pump-power', 'Pump power calculator'],
  ['Pipe velocity', 'v = 0.4085 &times; GPM / d&sup2;', 'v ft/s, d inside diameter in inches', '', 'pipe-velocity', 'Pipe velocity calculator'],
] },
{ id: 'generation', h: 'Power generation', f: [
  ['Capacity factor', 'CF = energy produced / (rated power &times; hours in the period)', '', 'A 100 MW plant that makes 350,400 MWh in a year ran at a 40% capacity factor.'],
  ['Heat rate and efficiency', '&eta; = 3412 / heat rate', 'Heat rate in Btu per kWh', 'A heat rate of 6,824 Btu/kWh is 50% efficient. Lower is better.'],
  ['Fuel input', 'MMBtu/h = MW &times; heat rate / 1000', 'Heat rate in Btu per kWh', ''],
  ['Generator frequency', 'f = n &times; p / 120', 'n rpm, p poles', 'A 2-pole machine makes 60 Hz at 3,600 rpm, a 4-pole machine at 1,800 rpm.', 'motor-speed', 'Speed and poles calculator'],
  ['Generator runtime', 'hours = usable fuel / fuel burn rate', 'Burn rate at the actual load, not at nameplate', '', 'generator-runtime', 'Generator runtime calculator'],
  ['Wind turbine power', 'P = &frac12; &times; &rho; &times; A &times; v&sup3; &times; C<sub>p</sub>', '&rho; air density (about 1.225 kg/m&sup3;), A swept area m&sup2;, v wind speed m/s', 'Power goes with the cube of wind speed. C<sub>p</sub> cannot exceed the Betz limit of 0.593.'],
  ['Hydro power', 'P = &eta; &times; &rho; &times; g &times; Q &times; H', '&rho; 1,000 kg/m&sup3;, g 9.81 m/s&sup2;, Q flow m&sup3;/s, H net head m', 'In kW: about 9.81 &times; &eta; &times; Q &times; H.'],
  ['Solar array output', 'P = P<sub>STC</sub> &times; (G / 1000) &times; [1 + &gamma; &times; (T<sub>cell</sub> &minus; 25)]', 'G irradiance W/m&sup2;, &gamma; power temperature coefficient per &deg;C (negative)', 'Before inverter, wiring and soiling losses.'],
  ['Maximum string voltage', 'V<sub>max</sub> = N &times; V<sub>oc</sub> &times; [1 + &beta; &times; (T<sub>min</sub> &minus; 25)]', 'N modules in series, &beta; V<sub>oc</sub> temperature coefficient per &deg;C (negative)', 'Voltage is highest on the coldest morning, which sets the string length.', 'solar-string', 'Solar string calculator'],
  ['DC/AC ratio', 'ILR = P<sub>DC, array</sub> / P<sub>AC, inverter</sub>', '', 'Also called inverter loading ratio.', 'dc-ac-ratio', 'DC/AC ratio calculator'],
  ['Levelized cost of energy', 'LCOE = &Sigma; [cost<sub>t</sub> / (1 + r)<sup>t</sup>] / &Sigma; [energy<sub>t</sub> / (1 + r)<sup>t</sup>]', 'r discount rate, t year', 'Costs are capital, fuel and O&amp;M over the plant life.', 'project-finance', 'Project finance calculator'],
] },
{ id: 'storage', h: 'Battery storage', f: [
  ['Amp-hours to energy', 'kWh = Ah &times; V / 1000', 'V nominal voltage', '', 'ah-to-kwh', 'Ah to kWh calculator'],
  ['C-rate', 'C = P / E', 'P power in kW, E energy in kWh', 'Duration at full power is 1 / C. A 0.25C system is a four-hour system.', '/guide-bess-c-rate.html', 'C-rate guide'],
  ['Runtime', 't = E &times; DoD &times; &eta; / P', 'DoD usable depth of discharge, &eta; discharge efficiency', '', 'battery-runtime', 'Battery runtime calculator'],
  ['Round-trip efficiency', 'RTE = energy out / energy in', 'Measured at the same point, AC to AC', ''],
  ['Nameplate energy for a required delivery', 'E<sub>nameplate</sub> = E<sub>required</sub> / (DoD &times; &eta; &times; end-of-life fraction)', '', 'Capacity fades, so the day-one system is larger than the contract figure or is augmented later.', 'bess-sizing', 'BESS sizing calculator'],
] },
{ id: 'cooling', h: 'Cooling and data center', f: [
  ['Electrical load to heat', 'BTU/h = W &times; 3.412', '', 'Essentially all power drawn by IT equipment ends up as heat in the room.', 'btu-to-tons', 'BTU to tons calculator'],
  ['Tons of refrigeration', 'tons = BTU/h / 12,000', '1 ton = 3.517 kW of heat', '', 'btu-to-tons', 'BTU to tons calculator'],
  ['Airflow for a heat load', 'CFM = BTU/h / (1.08 &times; &Delta;T)', '&Delta;T air temperature rise in &deg;F', '1.08 is for standard air at sea level. Per kW that is about 3,160 / &Delta;T.', 'airflow-cfm', 'Airflow (CFM) calculator'],
  ['Chilled water flow', 'GPM = BTU/h / (500 &times; &Delta;T)', '&Delta;T water temperature rise in &deg;F', '500 is for plain water. From tons: GPM = tons &times; 24 / &Delta;T.', 'chilled-water-flow', 'Chilled water flow calculator'],
  ['PUE', 'PUE = total facility energy / IT equipment energy', '', '1.0 would mean every watt reaches the IT load.', 'pue', 'PUE calculator'],
] },
];

const count = S.reduce((n, s) => n + s.f.length, 0);
const href = h => h.startsWith('/') ? h : `/calculators/${h}.html`;
const card = ([name, eq, vars, note, link, label]) => `      <div class="fx">
        <h3>${name}</h3>
        <div class="fx-eq" tabindex="0" role="math" aria-label="${name} formula">${eq}</div>
        ${vars ? `<p class="fx-vars">${vars}</p>` : ''}${note ? `<p>${note}</p>` : ''}
        ${link ? `<a class="fx-go" href="${href(link)}">${label} <span aria-hidden="true">&rarr;</span></a>` : ''}
      </div>`;

const crumbs = [['Formulas', 'formulas.html']];
const faq = [
  ['What is the formula for three-phase power?', 'Real power is P = &radic;3 &times; line-to-line voltage &times; line current &times; power factor. Leave out the power factor and you have apparent power in VA.'],
  ['How do you convert kW to amps?', 'For three-phase: amps = kW &times; 1000 / (&radic;3 &times; volts &times; power factor). For single-phase: amps = kW &times; 1000 / (volts &times; power factor).'],
  ['How much airflow does 1 kW of IT load need?', 'About 3,160 divided by the air temperature rise in &deg;F, in CFM, for standard air at sea level. At a 20&deg;F rise that is roughly 158 CFM per kW.'],
];
const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>Engineering Formulas for Power, Generation and Cooling</h1>
    <p class="dek">${count} formulas on one page, each with its variables and what it assumes. Where there is a calculator that runs it, the link is on the card.</p>
  </div>
</section>

<div class="artwrap fxwrap">
  <p><b>This is the page to keep open while reading a data sheet or checking someone else&rsquo;s number.</b> The formulas run from the circuit basics through distribution, motors, generation by turbine, wind, water and sun, battery storage and cooling. Constants that hide an assumption, such as 1.08 for air and 500 for water, say what they assume.</p>

  <label class="web-only" for="fxFilter" style="display:block;font-size:14px;font-weight:600;color:var(--ink);margin-top:20px">Find a formula</label>
  <input class="fx-filter web-only" type="search" id="fxFilter" placeholder="e.g. voltage drop, torque, heat rate" autocomplete="off">
  <p class="fx-count web-only" id="fxCount" role="status"></p>

  <nav class="fx-jump" aria-label="Sections" style="margin-top:18px">
${S.map(s => `    <a href="#${s.id}">${s.h}</a>`).join('\n')}
  </nav>

${S.map((s, i) => `  <section class="fx-sec" aria-labelledby="${s.id}">
    <h2 id="${s.id}">${s.h}</h2>
    <div class="fx-grid">
${s.f.map(card).join('\n')}
    </div>
  </section>${i === 2 ? '\n  <div class="ad-unit" data-ad="incontent"></div>' : ''}`).join('\n\n')}

  <h2 id="use">Using these</h2>
  <ul>
    <li><b>Check the units before the arithmetic.</b> Most wrong answers come from kW where kVA was meant, line-to-neutral voltage where line-to-line was meant, or a one-way length where the formula wants the round trip.</li>
    <li><b>A formula gives a number, a code gives a requirement.</b> Conductor and breaker sizes are set by the adopted electrical code and its tables. These relations explain the tables; they do not replace them.</li>
    <li><b>Want the whole range at once?</b> The <a class="inline" href="/reference-charts.html">reference charts</a> tabulate several of these, and the <a class="inline" href="/practice-questions.html">practice questions</a> work them with numbers.</li>
  </ul>
  <p class="provenance">Published ${DATE_LONG}. Spotted an error, or a formula that should be here? <a class="inline" href="/contact.html">Tell us</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>
<script>
(function(){var i=document.getElementById('fxFilter'),c=document.getElementById('fxCount');if(!i)return;
var cards=[].slice.call(document.querySelectorAll('.fx')),secs=[].slice.call(document.querySelectorAll('.fx-sec'));
i.addEventListener('input',function(){var w=i.value.toLowerCase().split(' ').filter(Boolean),n=0;
cards.forEach(function(k){var t=k.textContent.toLowerCase(),ok=w.every(function(x){return t.indexOf(x)>-1;});k.classList.toggle('fx-hide',!ok);if(ok)n++;});
secs.forEach(function(s){s.hidden=!s.querySelector('.fx:not(.fx-hide)');});
c.textContent=w.length?(n+' of '+cards.length+' formulas shown'):'';});})();
</script>`;

write('formulas.html', page({ url: 'formulas.html', title: `Engineering Formulas: Electrical, Power Generation, Cooling | Voltfield`,
  desc: `${count} engineering formulas with variables and assumptions: three-phase power, voltage drop, transformers, motors, wind, hydro, solar, battery storage and cooling.`,
  crumbs, faq, dateISO: DATE_ISO, css: ['/voltfield-templates.css'], body }));
console.log('formulas:', count);
