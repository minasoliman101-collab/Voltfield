#!/usr/bin/env node
/*
 * Practice questions: practice/<topic>.html and the hub practice-questions.html.
 *
 *   node scripts/gen-practice.mjs
 *
 * Every numerical answer is COMPUTED here from the same formulas the
 * calculators use, and the worked solution is written from those computed
 * values. A question cannot state one number and solve to another. The wrong
 * choices are computed too, each from a specific mistake (forgetting the
 * square root of three, using one-way length, dividing where one should
 * multiply), which is what makes them worth choosing between.
 *
 * Questions and solutions are in the HTML itself, with each solution in a
 * <details>, so the page is complete without JavaScript and readable by a
 * search engine. The script on the page only adds answer checking and a score.
 *
 * Nothing here quotes a code table. Where a question touches the NEC it tests
 * the method (125 percent, next standard size), not a table lookup. The one
 * exception is a set flagged `code: true`, which tests code RULES (thresholds
 * and settings stated in a section's text). Those are typed in, not computed,
 * so they carry an edition note and need checking against the code book.
 *
 * Every question also gets its own page, practice/questions/<slug>.html, with
 * the choices, the answer and the worked solution. People search for single
 * exam-style questions, and a page that answers exactly one is what matches.
 * The slug comes from the question text, so rewording a question moves its URL.
 */
import fs from 'node:fs';
import path from 'node:path';
import moreSets from './practice-sets-2.mjs';
import WHY from './practice-why.mjs';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const TEMPLATE = 'calculators/ohms-law.html';
const DATE_ISO = '2026-11-13', DATE_LONG = 'November 13, 2026';
const BASE = 'https://voltfield.org/';
const R3 = Math.sqrt(3);
const f = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const STD_OCPD = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800];
const nextStd = (a) => STD_OCPD.find(x => x >= a - 1e-9);

/* num(): a numerical question. `ans` and each of `wrong` are numbers; they are
   formatted to `d` decimals with `unit`. con(): a conceptual question, correct
   choice first. Both get their choices shuffled deterministically. */
const num = (stem, ans, wrong, unit, d, sol, link, why) => ({ stem, choices: [ans, ...wrong].map(v => `${f(v, d)}${unit ? ' ' + unit : ''}`), sol, link, why });
/* `why` is optional: three short reasons, one per wrong choice, in the order
   the wrong choices are given. They are shown on the question's own page. */
const con = (stem, right, wrong, sol, link, why) => ({ stem, choices: [right, ...wrong], sol, link, why });
const C = (slug, t) => [`calculators/${slug}.html`, t];
const G = (slug, t) => [`${slug}.html`, t];
const T = (slug, t) => [`glossary/${slug}.html`, t];

/* ---------------------------------------------------------------- questions */
const TOPICS = [];
{ // 1
  const vd = 2 * 12.9 * 100 * 16 / 6530;
  TOPICS.push({ slug: 'ohms-law-and-power', badge: 'V=IR', name: "Ohm's Law and Power",
    title: "Ohm's Law Practice Questions (With Solutions)",
    blurb: 'Voltage, current, resistance, power and energy on DC and resistive AC circuits.',
    intro: "Eight questions on the relationships everything else is built from: V = I &times; R, P = V &times; I, and what follows when one of them changes. No calculator is needed for most of them, but the working matters more than the answer.",
    q: [
      num('A resistor of 8 &Omega; is connected across a 120 V supply. What current flows?', 120 / 8, [120 * 8, 8 / 120 * 100, 120 - 8], 'A', 1,
        `Ohm's law: I = V / R = 120 / 8 = <b>${f(15, 1)} A</b>. Multiplying voltage by resistance, or dividing the wrong way round, are the two usual slips.`, C('ohms-law', "Ohm's Law Calculator")),
      num('A current of 2 A flows through a 30 &Omega; resistor. How much power does the resistor dissipate?', 2 * 2 * 30, [2 * 30, 2 * 30 * 30, 30 / 2], 'W', 0,
        `P = I&sup2; &times; R = 2&sup2; &times; 30 = <b>${f(120)} W</b>. The answer 60 is I &times; R, which is the voltage across the resistor, not the power.`, C('ohms-law', "Ohm's Law Calculator")),
      num('A 1,500 W heater is connected to a 120 V circuit. What current does it draw?', 1500 / 120, [120 / 15, 15, 1500 / 120 * 1.5], 'A', 1,
        `I = P / V = 1,500 / 120 = <b>${f(12.5, 1)} A</b>. A heater is a resistive load, so no power factor is involved.`, C('watts-to-amps', 'Watts to Amps Calculator')),
      num('A heating element is rated 2,000 W at 240 V. Its resistance does not change. What power does it produce on a 120 V supply?', 2000 / 4, [1000, 2000, 250], 'W', 0,
        `Power goes with the square of the voltage when resistance is fixed: P = V&sup2; / R. Halving the voltage gives one quarter of the power, 2,000 / 4 = <b>${f(500)} W</b>. Halving the power is the common wrong answer.`, C('ohms-law', "Ohm's Law Calculator")),
      num('What is the resistance of a 1,500 W, 120 V heating element at its operating temperature?', 120 * 120 / 1500, [1500 / 120, 120 / 1500 * 1000, 120 * 120 / 1500 * 10], '&Omega;', 1,
        `R = V&sup2; / P = 120&sup2; / 1,500 = 14,400 / 1,500 = <b>${f(9.6, 1)} &Omega;</b>. The figure 12.5 is the current in amps, not the resistance.`, C('ohms-law', "Ohm's Law Calculator")),
      num('A two-wire 120 V circuit runs 100 ft, one way, in 12 AWG copper (6,530 circular mils) and carries 16 A. Using K = 12.9, what is the voltage drop?', vd, [vd / 2, vd * 2, 12.9 * 1000 / 6530], 'V', 2,
        `The current travels out and back, so the conductor length is 200 ft. VD = 2 &times; K &times; I &times; L / cmil = 2 &times; 12.9 &times; 16 &times; 100 / 6,530 = <b>${f(vd, 2)} V</b>, which is ${f(vd / 120 * 100, 1)} percent of 120 V. Using the one-way length alone gives half the true figure.`, C('voltage-drop', 'Voltage Drop Calculator')),
      con('A 10 kW load runs 24 hours a day. At an energy rate of $0.12 per kWh, what does it cost per day?', '$' + f(10 * 24 * 0.12, 2), ['$' + f(2.88, 2), '$' + f(288, 2), '$' + f(12, 2)],
        `Energy = 10 kW &times; 24 h = 240 kWh. Cost = 240 &times; 0.12 = <b>$${f(28.8, 2)}</b> per day, or about $${f(240 * 365 * 0.12)} over a year.`, C('electricity-cost', 'Electricity Cost Calculator')),
      con('On an AC circuit with a power factor below 1.0, which statement is true?',
        'The volt-amperes are greater than the watts.',
        ['The watts are greater than the volt-amperes.', 'Watts and volt-amperes are always equal.', 'Power factor affects voltage but not current.'],
        'Volt-amperes are voltage times current. Watts are that product multiplied by the power factor, so with a power factor below one the watts are always the smaller number. The two are equal only at unity power factor.', G('guide-kw-vs-kva', 'kW vs. kVA Explained')),
    ] });
}
{ // 2
  const i1 = 75000 / (R3 * 480 * 0.9), kva = R3 * 480 * 100 / 1000;
  const t1 = Math.tan(Math.acos(0.75)), t2 = Math.tan(Math.acos(0.95)), kvar = 400 * (t1 - t2);
  TOPICS.push({ slug: 'three-phase-and-power-factor', badge: '3&#966;', name: 'Three-Phase Power and Power Factor',
    title: 'Three-Phase Power Practice Questions',
    blurb: 'Line current, kVA, kW, kvar, power factor correction and the square root of three.',
    intro: 'Most wrong answers in three-phase work come from one of two places: leaving out the square root of three, or mixing up kW and kVA. Each question below has a wrong choice built from exactly those mistakes.',
    q: [
      num('A balanced three-phase load draws 75 kW at 480 V with a power factor of 0.9. What is the line current?', i1, [75000 / (480 * 0.9), 75000 / (R3 * 480), 75000 / 480], 'A', 1,
        `I = kW &times; 1,000 / (1.732 &times; V &times; PF) = 75,000 / (1.732 &times; 480 &times; 0.9) = <b>${f(i1, 1)} A</b>. Leaving out the 1.732 gives ${f(75000 / (480 * 0.9), 1)} A, and leaving out the power factor gives ${f(75000 / (R3 * 480), 1)} A.`, C('kw-to-amps', 'kW to Amps Calculator')),
      num('A three-phase feeder carries 100 A per phase at 480 V. What is the apparent power?', kva, [480 * 100 / 1000, 3 * 480 * 100 / 1000, kva * 0.9], 'kVA', 1,
        `kVA = 1.732 &times; V &times; I / 1,000 = 1.732 &times; 480 &times; 100 / 1,000 = <b>${f(kva, 1)} kVA</b>. No power factor is needed: apparent power is volts times amps.`, C('amps-to-kva', 'Amps to kVA Calculator')),
      num('A load draws 400 kW at a power factor of 0.8. What is its apparent power?', 400 / 0.8, [400 * 0.8, 480, 420], 'kVA', 0,
        `kVA = kW / PF = 400 / 0.8 = <b>${f(500)} kVA</b>. Multiplying by the power factor goes the wrong way and gives a kVA smaller than the kW, which is never possible.`, C('kva-to-kw', 'kVA to kW Converter')),
      num('The same 400 kW load at a power factor of 0.8 draws how much reactive power?', 400 * Math.tan(Math.acos(0.8)), [240, 500, 100], 'kvar', 0,
        `kvar = kW &times; tan(arccos PF). At 0.8 the tangent is 0.75, so kvar = 400 &times; 0.75 = <b>${f(300)} kvar</b>. It also follows from the power triangle: &radic;(500&sup2; &minus; 400&sup2;) = 300.`, C('kva-to-kw', 'kVA to kW Converter')),
      num('A 480 V three-phase wye system has what voltage from any line to neutral?', 480 / R3, [240, 208, 480 * R3], 'V', 0,
        `Line-to-neutral voltage is line-to-line voltage divided by 1.732: 480 / 1.732 = <b>${f(480 / R3)} V</b>. That is why the system is written 480Y/277.`, G('guide-delta-vs-wye', 'Delta vs. Wye')),
      num('A 400 kW load runs at a power factor of 0.75. How much capacitance is needed to raise it to 0.95?', kvar, [400 * 0.2, 400 * t1, 400 * t2], 'kvar', 1,
        `kvar = kW &times; (tan &theta;&#8321; &minus; tan &theta;&#8322;) = 400 &times; (${f(t1, 4)} &minus; ${f(t2, 4)}) = <b>${f(kvar, 1)} kvar</b>. Multiplying the kW by the difference in power factors, 0.20, is not a valid shortcut.`, C('power-factor', 'Power Factor Correction Calculator')),
      con('In a delta-connected winding, how does line current compare with the current in each winding?',
        'Line current is 1.732 times the winding current.',
        ['Line current equals the winding current.', 'Line current is the winding current divided by 1.732.', 'Line current is three times the winding current.'],
        'In a delta, each line is fed by two windings, and the two currents are 120 degrees apart, so they add to 1.732 times either one. Voltage is the quantity that is equal in a delta: line voltage is winding voltage. In a wye it is the other way round.', G('guide-delta-vs-wye', 'Delta vs. Wye')),
      num('What is the full-load current of a 50 kVA three-phase supply at 208 V?', 50000 / (R3 * 208), [50000 / 208, 50000 / (R3 * 360), 3 * 50000 / (R3 * 208)], 'A', 1,
        `I = kVA &times; 1,000 / (1.732 &times; V) = 50,000 / (1.732 &times; 208) = <b>${f(50000 / (R3 * 208), 1)} A</b>.`, C('kva-to-amps', 'kVA to Amps Calculator')),
    ] });
}
{ // 3
  const vd3 = R3 * 12.9 * 100 * 150 / 211600, vd1 = 2 * 12.9 * 16 * 100 / 6530, L = Math.floor(0.03 * 120 * 6530 / (2 * 12.9 * 20)), r = 12.9 * 500 / 66360;
  TOPICS.push({ slug: 'conductors-and-voltage-drop', badge: 'AWG', name: 'Conductors and Voltage Drop',
    title: 'Voltage Drop & Wire Sizing Practice Questions',
    blurb: 'Circular mils, resistance, voltage drop by the K-factor method and the 125 percent rule.',
    intro: 'These use the K-factor method, with K = 12.9 for copper and 21.2 for aluminum, the same approximation the voltage drop calculator uses. Conductor areas are given in each question, so nothing has to be looked up.',
    q: [
      con('In the AWG system, what happens to the cross-sectional area of a conductor every three sizes larger (for example from 6 AWG to 3 AWG)?',
        'It doubles.', ['It increases by half.', 'It triples.', 'It increases tenfold.'],
        'The gauge steps are a geometric series in which area doubles every three sizes and diameter doubles every six. Since resistance is inversely proportional to area, it halves every three sizes.', ['charts/awg-wire-size-chart.html', 'AWG Wire Size Chart']),
      num('A three-phase 480 V feeder runs 150 ft in 4/0 AWG copper (211,600 circular mils) and carries 100 A. What is the voltage drop?', vd3, [2 * 12.9 * 100 * 150 / 211600, vd3 / R3, vd3 * R3], 'V', 2,
        `Three-phase: VD = 1.732 &times; K &times; I &times; L / cmil = 1.732 &times; 12.9 &times; 100 &times; 150 / 211,600 = <b>${f(vd3, 2)} V</b>, which is ${f(vd3 / 480 * 100, 2)} percent. The multiplier is 1.732 for three-phase and 2 for single-phase.`, C('voltage-drop', 'Voltage Drop Calculator')),
      num('A 120 V circuit has a voltage drop of 6.32 V. What is that as a percentage?', vd1 / 120 * 100, [3.0, vd1 / 240 * 100, 6.3], '%', 2,
        `${f(vd1, 2)} / 120 &times; 100 = <b>${f(vd1 / 120 * 100, 2)} percent</b>. That is above both the 3 percent usually recommended for a branch circuit and the 5 percent recommended overall.`, C('voltage-drop', 'Voltage Drop Calculator')),
      num('A continuous load of 80 A is to be supplied. Before any adjustment for temperature or bundling, what ampacity must the conductor have?', 80 * 1.25, [80, 80 * 0.8, 120], 'A', 0,
        `A continuous load is taken at 125 percent: 80 &times; 1.25 = <b>${f(100)} A</b>. Multiplying by 0.8 applies the rule backwards.`, G('guide-continuous-load-80-percent-rule', 'The 80% Rule &amp; Continuous Loads')),
      num('For a 3 percent voltage drop, what is the longest one-way run of 12 AWG copper (6,530 circular mils) carrying 20 A on a 120 V two-wire circuit?', L, [L * 2, Math.floor(L / 2), 60], 'ft', 0,
        `Allowed drop = 0.03 &times; 120 = 3.6 V. L = VD &times; cmil / (2 &times; K &times; I) = 3.6 &times; 6,530 / (2 &times; 12.9 &times; 20) = <b>${f(L)} ft</b>, rounded down.`, ['charts/voltage-drop-chart.html', 'Voltage Drop Chart']),
      num('What is the resistance of 500 ft of 2 AWG copper (66,360 circular mils), one way?', r, [r * 2, r / 2, r * 10], '&Omega;', 4,
        `R = K &times; L / cmil = 12.9 &times; 500 / 66,360 = <b>${f(r, 4)} &Omega;</b>.`, C('wire-resistance', 'Wire Resistance Calculator')),
      con('A conductor with 90&deg;C insulation is terminated on equipment whose terminals are rated 75&deg;C. Which ampacity governs the size of the conductor at the termination?',
        'The 75&deg;C ampacity, because the circuit is limited by its lowest-rated termination.',
        ['The 90&deg;C ampacity, because that is the rating of the insulation.', 'The average of the 75&deg;C and 90&deg;C values.', 'The 60&deg;C ampacity in every case.'],
        'The termination limit governs. The higher 90&deg;C rating can still be used as the starting point for ambient and bundling corrections, but the conductor must not carry more than its 75&deg;C ampacity where it lands on a 75&deg;C terminal.', C('wire-size', 'Wire Size Calculator')),
      con('Compared with a copper conductor of the same size, an aluminum conductor has about how much resistance?',
        'About 1.6 times as much.', ['About the same.', 'About half as much.', 'About three times as much.'],
        'With K = 12.9 for copper and 21.2 for aluminum, the ratio is 21.2 / 12.9 = 1.64. That is why an aluminum conductor is normally one or two sizes larger than the copper one it replaces.', T('ampacity', 'Glossary: Ampacity')),
    ] });
}
{ // 4
  TOPICS.push({ slug: 'overcurrent-protection', badge: 'OCPD', name: 'Overcurrent Protection',
    title: 'Breaker Sizing Practice Questions',
    blurb: 'Continuous loads, the 125 percent rule, standard ratings, interrupting rating and SCCR.',
    intro: 'The sizing questions use the standard ampere ratings: 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200 and upward. The rest test the difference between ratings that are often confused.',
    q: [
      con('A feeder supplies a continuous load of 52 A and nothing else. What is the smallest standard breaker that may be used?',
        `${nextStd(52 * 1.25)} A`, ['60 A', '80 A', '90 A'],
        `Minimum rating = 52 &times; 1.25 = ${f(65)} A. There is no 65 A standard rating, so the next one up applies: <b>${nextStd(65)} A</b>. A 60 A breaker allows only 48 A of continuous load.`, C('breaker-size', 'Breaker Size Calculator')),
      con('A feeder supplies 40 A of continuous load and 20 A of non-continuous load. What is the smallest standard breaker?',
        `${nextStd(40 * 1.25 + 20)} A`, ['60 A', '80 A', '90 A'],
        `Minimum rating = (40 &times; 1.25) + 20 = ${f(70)} A, which is itself a standard rating: <b>${nextStd(70)} A</b>. Only the continuous part takes the 125 percent factor.`, C('breaker-size', 'Breaker Size Calculator')),
      num('What is the largest continuous load a standard 20 A breaker may carry?', 20 * 0.8, [12, 18, 20], 'A', 0,
        `A standard breaker may carry 80 percent of its rating continuously: 20 &times; 0.8 = <b>${f(16)} A</b>. It may carry the full 20 A for a load that is not continuous.`, ['charts/breaker-size-chart.html', 'Breaker Size Chart']),
      con('A calculation gives a minimum rating of 112 A. What is the next standard ampere rating?',
        `${nextStd(112)} A`, ['110 A', '115 A', '120 A'],
        `The standard ratings around this value are 100, 110, 125 and 150 A. 110 A is below the minimum, and 115 and 120 A are not standard ratings, so the answer is <b>${nextStd(112)} A</b>.`, ['charts/breaker-size-chart.html', 'Breaker Size Chart']),
      con('What must a circuit breaker\'s interrupting rating be compared with?',
        'The fault current available at the point where it is installed.',
        ['The full-load current of the circuit it protects.', 'The ampacity of the conductor it protects.', 'The continuous current rating of the breaker itself.'],
        'Interrupting rating is the largest fault current the device can clear safely, so it has to be at least the available fault current at its terminals. That current depends on the supply, mainly the size and impedance of the upstream transformer, and has nothing to do with the load.', T('interrupting-rating', 'Glossary: Interrupting Rating')),
      con('How does a short-circuit current rating (SCCR) differ from an interrupting rating?',
        'SCCR applies to a whole assembly; interrupting rating applies to a single protective device.',
        ['They are two names for the same rating.', 'SCCR applies to fuses and interrupting rating to breakers.', 'SCCR is the continuous current an assembly can carry.'],
        'An assembly such as a control panel contains many components in the fault path, and its SCCR is set by the weakest of them unless a current-limiting device protects it. A panel with a 65 kA main breaker can still be a 5 kA panel.', G('guide-interrupting-rating-vs-sccr', 'Interrupting Rating vs. SCCR')),
      con('In a selectively coordinated system, what happens when a fault occurs on a branch circuit?',
        'Only the protective device nearest the fault opens.',
        ['Every device between the fault and the source opens.', 'The main breaker opens first to protect the system.', 'The device with the highest rating opens first.'],
        'Coordination means each upstream device is slower than the one below it across the range of fault currents, so the fault is cleared locally and everything else stays energized. It is checked by comparing time-current curves.', T('selective-coordination', 'Glossary: Selective Coordination')),
      con('A breaker and its enclosure are listed for operation at 100 percent of rating. For a continuous load of 400 A and no other load, what is the smallest standard breaker?',
        '400 A', ['450 A', '500 A', '600 A'],
        'For an assembly listed for 100 percent operation the continuous load is taken at 100 percent, so the minimum is 400 A and a <b>400 A</b> breaker is sufficient. A standard breaker would need 400 &times; 1.25 = 500 A. The listing has to say 100 percent; it is not implied by frame size.', G('guide-continuous-load-80-percent-rule', 'The 80% Rule &amp; Continuous Loads')),
    ] });
}
{ // 5
  const fla = 500000 / (R3 * 480), fla2 = 1500000 / (R3 * 480), isc = fla2 / 0.0575, s = 75000 / (R3 * 208);
  TOPICS.push({ slug: 'transformers', badge: 'kVA', name: 'Transformers',
    title: 'Transformer Practice Questions (With Solutions)',
    blurb: 'Full-load current, impedance and fault current, sizing from load, and nameplate terms.',
    intro: 'Full-load current and available fault current are the two transformer calculations that come up most, and the second follows directly from the first. The later questions cover terms found on every nameplate.',
    q: [
      num('What is the full-load secondary current of a 500 kVA three-phase transformer at 480 V?', fla, [500000 / 480, fla / R3, 3 * fla], 'A', 0,
        `I = kVA &times; 1,000 / (1.732 &times; V) = 500,000 / (1.732 &times; 480) = <b>${f(fla)} A</b>.`, C('kva-to-amps', 'kVA to Amps Calculator')),
      num('A 1,500 kVA, 480 V three-phase transformer has an impedance of 5.75 percent. Assuming an unlimited supply on the primary, what fault current is available at its secondary terminals?', isc, [fla2, fla2 * 5.75, 1500000 / 480 / 0.0575], 'A', 0,
        `Full-load current = 1,500,000 / (1.732 &times; 480) = ${f(fla2)} A. Fault current = full-load current / (%Z / 100) = ${f(fla2)} / 0.0575 = <b>${f(isc)} A</b>, about ${f(isc / 1000, 1)} kA. Multiplying by the impedance, or leaving out the 1.732, gives the wrong choices.`, C('fault-current', 'Fault Current Calculator')),
      con('A three-phase load of 300 kW has a power factor of 0.9. Which standard transformer size is the smallest that will carry it?',
        '500 kVA', ['225 kVA', '300 kVA', '750 kVA'],
        `kVA = kW / PF = 300 / 0.9 = ${f(300 / 0.9)} kVA. A 300 kVA unit is too small, and the next standard three-phase size above it is <b>500 kVA</b>. Sizing on kW alone, and choosing 300 kVA, is the mistake the question is built around.`, C('transformer-sizing', 'Transformer Sizing Calculator')),
      num('A 75 kVA three-phase transformer steps 480 V down to 208 V. What is its full-load secondary current?', s, [75000 / (R3 * 480), 75000 / 208, s / R3], 'A', 0,
        `On the 208 V side, I = 75,000 / (1.732 &times; 208) = <b>${f(s)} A</b>. The primary carries ${f(75000 / (R3 * 480))} A. The kVA is the same on both sides; the current is not.`, ['charts/kva-to-amps-chart.html', 'kVA to Amps Chart']),
      con('Two transformers have the same kVA and voltage. One has 4 percent impedance and the other 6 percent. Which statement is correct?',
        'The 4 percent unit delivers more fault current and has better voltage regulation.',
        ['The 6 percent unit delivers more fault current.', 'Impedance has no effect on fault current.', 'The 4 percent unit delivers less fault current and worse regulation.'],
        'Fault current is full-load current divided by the impedance as a fraction, so lower impedance means more fault current: 25 times full load at 4 percent against about 17 times at 6 percent. Lower impedance also means less voltage drop under load.', T('impedance', 'Glossary: Transformer Impedance')),
      con('A transformer nameplate shows the vector group Dyn11. What does it describe?',
        'Delta high-voltage winding, wye low-voltage winding with neutral, low voltage leading by 30 degrees.',
        ['Wye high-voltage winding, delta low-voltage winding, eleven taps.', 'A dry-type transformer with a neutral and eleven percent impedance.', 'Delta on both windings with an eleven-degree phase shift.'],
        'The capital letter is the high-voltage connection, the small letter the low-voltage connection, n means the neutral is brought out, and the number is a clock position where each hour is 30 degrees. Eleven o\'clock is 30 degrees leading.', T('vector-group', 'Glossary: Vector Group')),
      con('What is a K-rated transformer designed to do?',
        'Carry loads rich in harmonic current without overheating.',
        ['Remove harmonics from the system.', 'Operate at a higher ambient temperature.', 'Withstand a higher short-circuit current.'],
        'Harmonic currents cause extra eddy-current heating in the windings. A K-rated transformer is built to carry a load of a stated K-factor at full nameplate current. It tolerates the harmonics; it does not filter them out.', T('k-factor', 'Glossary: K-Factor')),
      con('What does a transformer\'s BIL rating describe?',
        'The peak impulse voltage its insulation can withstand, as from lightning or switching.',
        ['The maximum continuous voltage it can operate at.', 'The fault current it can withstand for two seconds.', 'The highest ambient temperature it is rated for.'],
        'Basic insulation level is an impulse rating, established with a standard 1.2 by 50 microsecond wave and stated as a peak in kilovolts. It is much higher than the working voltage because it describes a brief surge, not steady operation.', T('bil', 'Glossary: BIL')),
    ] });
}
{ // 6
  const slip = (1800 - 1750) / 1800 * 100, tq = 5252 * 50 / 1775, kw = 50 * 0.7457, avg = (460 + 467 + 450) / 3, ub = 9 / avg * 100;
  TOPICS.push({ slug: 'motors', badge: 'RPM', name: 'Motors',
    title: 'Electric Motor Practice Questions',
    blurb: 'Synchronous speed, slip, torque, horsepower and kW, voltage unbalance and the affinity laws.',
    intro: 'Speed follows from frequency and poles, torque from power and speed, and the rest from those. The last question brings in the affinity laws, which decide what a variable speed drive saves on a fan or pump.',
    q: [
      con('What is the synchronous speed of a four-pole motor on a 60 Hz supply?', '1,800 rpm', ['1,200 rpm', '1,500 rpm', '3,600 rpm'],
        'N = 120 &times; f / poles = 120 &times; 60 / 4 = <b>1,800 rpm</b>. 3,600 rpm is two poles, 1,200 rpm is six poles, and 1,500 rpm is four poles at 50 Hz.', C('motor-speed', 'Motor Speed &amp; Slip Calculator')),
      num('A four-pole, 60 Hz induction motor runs at 1,750 rpm at full load. What is its slip?', slip, [50 / 1750 * 100, 1750 / 1800 * 100, 5], '%', 2,
        `Slip = (synchronous speed &minus; actual speed) / synchronous speed = (1,800 &minus; 1,750) / 1,800 = <b>${f(slip, 2)} percent</b>. Dividing by the actual speed instead of the synchronous speed gives ${f(50 / 1750 * 100, 2)} percent.`, C('motor-speed', 'Motor Speed &amp; Slip Calculator')),
      num('What torque does a 50 hp motor deliver at 1,775 rpm?', tq, [tq * 2, tq / 2, 50 / 1775 * 1000], 'lb-ft', 1,
        `T = 5,252 &times; hp / rpm = 5,252 &times; 50 / 1,775 = <b>${f(tq, 1)} lb-ft</b>. The constant comes from the definition of horsepower, 33,000 foot-pounds per minute, divided by 2&pi;.`, C('motor-torque', 'Motor Torque Calculator')),
      num('What is the output of a 50 hp motor in kilowatts?', kw, [50 / 0.7457, 50, 44.2], 'kW', 1,
        `kW = hp &times; 0.7457 = 50 &times; 0.7457 = <b>${f(kw, 1)} kW</b>. This is shaft output. Dividing by 0.7457 converts the wrong way.`, ['charts/hp-to-kw-chart.html', 'HP to kW Chart']),
      num('That 50 hp motor has a full-load efficiency of 93 percent. What electrical power does it draw at full load?', kw / 0.93, [kw * 0.93, kw, 50 / 0.93], 'kW', 1,
        `Input = output / efficiency = ${f(kw, 1)} / 0.93 = <b>${f(kw / 0.93, 1)} kW</b>. The input is always larger than the output, so multiplying by the efficiency must be wrong.`, C('hp-to-kw', 'Motor HP to kW Calculator')),
      con('What is the synchronous speed of a six-pole motor on a 50 Hz supply?', '1,000 rpm', ['750 rpm', '1,200 rpm', '1,500 rpm'],
        'N = 120 &times; 50 / 6 = <b>1,000 rpm</b>. The same motor on 60 Hz would have a synchronous speed of 1,200 rpm.', ['charts/motor-speed-chart.html', 'Motor Speed Chart']),
      num('The three line-to-line voltages at a motor are 460 V, 467 V and 450 V. By the NEMA method, what is the voltage unbalance?', ub, [(467 - 450) / avg * 100, 3 / avg * 100, 8 / avg * 100], '%', 2,
        `Average = (460 + 467 + 450) / 3 = ${f(avg)} V. The reading furthest from the average is 450 V, a deviation of 9 V. Unbalance = 9 / ${f(avg)} = <b>${f(ub, 2)} percent</b>. Using the spread between highest and lowest, 17 V, overstates it.`, C('voltage-unbalance', 'Voltage Unbalance Calculator')),
      con('A centrifugal fan in a system with no static head is slowed to 80 percent of its speed. About what fraction of its original power does it now draw?',
        'About 51 percent.', ['80 percent.', '64 percent.', '40 percent.'],
        'By the affinity laws, flow goes with speed, pressure with its square and power with its cube: 0.8&sup3; = 0.512. The 64 percent figure is the pressure, and 80 percent is the flow.', G('guide-pump-and-fan-affinity-laws', 'Pump and Fan Affinity Laws')),
    ] });
}
{ // 7
  const tons = 200 * 3412.142 / 12000, cfm = 10 * 3412.142 / (1.08 * 20);
  TOPICS.push({ slug: 'data-center-power-and-cooling', badge: 'PUE', name: 'Data Center Power and Cooling',
    title: 'Data Center Power & Cooling Practice Questions',
    blurb: 'PUE, redundancy, cooling load in tons, airflow per kW and chilled water flow.',
    intro: 'Almost all the electricity an IT load draws becomes heat, which is why the electrical and mechanical sides of a data center are sized from the same number. These questions move between the two.',
    q: [
      num('A data center draws 1,500 kW in total, of which 1,000 kW reaches the IT equipment. What is its PUE?', 1.5, [1000 / 1500, 2.5, 0.5], '', 2,
        `PUE = total facility power / IT power = 1,500 / 1,000 = <b>${f(1.5, 2)}</b>. The inverse, 0.67, is the older DCiE metric expressed as a fraction.`, C('pue', 'PUE Calculator')),
      num('In that facility the overhead is 500 kW. If it holds for a whole year, how much energy is that?', 500 * 8760, [500 * 8.76, 1500 * 8760, 500 * 876], 'kWh', 0,
        `A year has 8,760 hours. 500 kW &times; 8,760 h = <b>${f(500 * 8760)} kWh</b>.`, C('electricity-cost', 'Electricity Cost Calculator')),
      num('How many tons of sensible cooling does a 200 kW IT load require, before any redundancy?', tons, [200 / 12, 200 * 3.517, 200 * 3412.142 / 10000], 'tons', 1,
        `BTU/h = 200 &times; 3,412 = ${f(200 * 3412.142)}. Tons = BTU/h / 12,000 = <b>${f(tons, 1)} tons</b>. One ton of cooling is 3.517 kW, so dividing kW by 3.517 gives the same answer.`, C('btu-to-tons', 'BTU to Tons Converter')),
      num('A rack dissipates 10 kW, and the air passing through it rises by 20&deg;F. What airflow is needed?', cfm, [cfm * 2, cfm / 10, 10 * 3412.142 / 20], 'CFM', 0,
        `CFM = BTU/h / (1.08 &times; &Delta;T) = 34,121 / (1.08 &times; 20) = <b>${f(cfm)} CFM</b>, or about 158 CFM per kW. Leaving out the 1.08 gives ${f(10 * 3412.142 / 20)} CFM.`, C('airflow-cfm', 'Airflow (CFM) Calculator')),
      num('A 100 ton cooling load is served by chilled water with a 10&deg;F difference between supply and return. What flow is needed?', 240, [200, 24, 2400], 'GPM', 0,
        `GPM = tons &times; 24 / &Delta;T = 100 &times; 24 / 10 = <b>${f(240)} GPM</b>, which is the familiar 2.4 GPM per ton. A wider temperature difference needs less flow.`, C('chilled-water-flow', 'Chilled Water Flow Calculator')),
      con('A cooling load needs three chillers to carry it. How many chillers does a 2N design install?', '6', ['4', '5', '8'],
        'N is three. 2N is two complete, independent systems of N, so <b>six</b> chillers. Four would be N+1 and five would be N+2.', G('guide-n-plus-1-vs-2n-redundancy', 'N+1 vs. 2N Redundancy')),
      con('With hot aisle containment, what is the condition of the open room outside the contained aisle?',
        'Cool: the room is the supply air path.',
        ['Hot: the room is the return air path.', 'The same temperature as the hot aisle.', 'Unaffected by the containment.'],
        'Hot aisle containment encloses the exhaust side of the racks and ducts that air back to the cooling units, leaving the room filled with supply air. Cold aisle containment is the reverse: the cold aisle is enclosed and the room runs hot.', G('guide-hot-aisle-vs-cold-aisle-containment', 'Hot Aisle vs. Cold Aisle Containment')),
      con('What is the essential difference between a CRAC and a CRAH?',
        'A CRAC has its own compressor; a CRAH uses chilled water from a separate plant.',
        ['A CRAC cools with water and a CRAH with refrigerant.', 'A CRAH is for high-density racks and a CRAC for low-density.', 'They are two names for the same unit.'],
        'A computer room air conditioner is a complete refrigeration machine in a cabinet. A computer room air handler has only a coil, fans and a valve, and depends on a chiller plant for its cooling.', G('guide-crac-vs-crah', 'CRAC vs. CRAH')),
    ] });
}
{ // 8
  const kwp = 240 * 540 / 1000, rt = 100 * 48 * 0.8 * 0.9 / 1000, np = 2000 / (0.9 * 0.9);
  TOPICS.push({ slug: 'solar-and-storage', badge: 'PV', name: 'Solar and Storage',
    title: 'Solar & Battery Storage Practice Questions',
    blurb: 'Array capacity, DC/AC ratio, clipping, amp-hours and kWh, C-rate and runtime.',
    intro: 'Solar and storage sizing is mostly ratios: array to inverter, power to energy, usable to nameplate. Each question gives every figure it needs.',
    q: [
      num('An array has 240 modules rated 540 W each. What is its DC capacity?', kwp, [kwp / 10, kwp * 10, 54], 'kWp', 1,
        `240 &times; 540 W = 129,600 W = <b>${f(kwp, 1)} kWp</b>.`, C('dc-ac-ratio', 'DC/AC Ratio Calculator')),
      num('That 129.6 kWp array is connected to a 100 kW inverter. What is the DC/AC ratio?', kwp / 100, [100 / kwp, 1.03, 29.6], '', 2,
        `DC/AC ratio = array DC capacity / inverter AC rating = 129.6 / 100 = <b>${f(kwp / 100, 2)}</b>. Dividing the other way gives ${f(100 / kwp, 2)}, the inverse.`, C('dc-ac-ratio', 'DC/AC Ratio Calculator')),
      con('What is inverter clipping?',
        'The inverter limiting its output to its AC rating when the array could supply more.',
        ['Energy lost as heat in the DC cables.', 'The inverter shutting down in low light.', 'Damage to the inverter caused by overvoltage.'],
        'When the array offers more than the inverter can convert, the inverter moves off the maximum power point and the output flattens at its rating. The energy is never produced; nothing is damaged. It is usually a deliberate consequence of a DC/AC ratio above 1.0.', T('clipping', 'Glossary: Inverter Clipping')),
      num('A battery is rated 100 Ah at a nominal 48 V. What is its nameplate energy?', 4.8, [100 / 48, 48, 0.48], 'kWh', 2,
        `kWh = Ah &times; V / 1,000 = 100 &times; 48 / 1,000 = <b>${f(4.8, 2)} kWh</b>. Amp-hours cannot be converted to energy without the voltage.`, C('ah-to-kwh', 'Ah to kWh Calculator')),
      con('A storage project is rated 100 MW and 400 MWh. What is its C-rate?', '0.25C', ['4C', '0.4C', '2.5C'],
        'C-rate is power divided by energy: 100 / 400 = <b>0.25C</b>. The inverse, four, is the duration in hours, which is how such a project is usually described.', T('c-rate', 'Glossary: C-Rate')),
      con('A battery system is discharged at a steady 0.5C. About how long does a full discharge take?', '2 hours', ['30 minutes', '1 hour', '4 hours'],
        'Duration in hours is one divided by the C-rate: 1 / 0.5 = <b>2 hours</b>. At 1C it is one hour, and at 0.25C four.', G('guide-bess-c-rate', 'BESS C-Rate Explained')),
      num('A 100 Ah, 48 V battery may be discharged to 80 percent depth and feeds a 1,000 W load through an inverter that is 90 percent efficient. Estimate the runtime.', rt, [4.8, 100 * 48 * 0.8 / 1000, 100 * 48 * 0.9 / 1000], 'hours', 2,
        `Usable energy = 100 &times; 48 &times; 0.80 &times; 0.90 = ${f(rt * 1000)} Wh. Runtime = ${f(rt * 1000)} / 1,000 = <b>${f(rt, 2)} hours</b>. Leaving out the inverter loss gives 3.84, and leaving out the depth of discharge gives 4.32.`, C('battery-runtime', 'Battery Runtime Calculator')),
      num('A system must deliver 2,000 kWh of usable energy. With a 90 percent depth of discharge and 90 percent round-trip efficiency, what nameplate energy is needed?', np, [2000 * 0.81, 2000 / 0.9, 2000], 'kWh', 0,
        `Nameplate = usable / (DoD &times; efficiency) = 2,000 / (0.90 &times; 0.90) = <b>${f(np)} kWh</b>. Multiplying by the two factors instead of dividing gives a nameplate smaller than the usable energy, which cannot be right.`, C('bess-sizing', 'BESS Sizing Calculator')),
    ] });
}
{ // 9  CODE RULES: typed in from NEC 230.95, 215.10, 517.17 and 695.6. Check against the code book.
  const GF = G('guide-ground-fault-protection', 'Ground-Fault Protection &amp; NEC 230.95');
  TOPICS.push({ slug: 'ground-fault-protection', badge: 'GFPE', name: 'Ground-Fault Protection of Equipment', code: true,
    title: 'NEC 230.95 Ground-Fault Practice Questions',
    desc: '10 practice questions on NEC 230.95 ground-fault protection of equipment, with worked answers: the 1,000 A threshold, settings, exceptions and testing.',
    blurb: 'When NEC 230.95 requires GFPE, how the disconnect rating is judged, the maximum settings, the exceptions and the on-site test.',
    intro: 'Ground-fault protection of equipment is a short rule that produces a lot of exam questions, because almost every word in it can be tested: the system type, the voltage to ground, the ampere rating and how that rating is judged. These ten questions cover each of those in turn. They follow the wording of the 2023 National Electrical Code.',
    q: [
      con('Which of these services requires ground-fault protection of equipment under NEC 230.95?',
        'A 480Y/277 V solidly grounded wye service with a 1,200 A service disconnect.',
        ['A 208Y/120 V solidly grounded wye service with a 2,000 A service disconnect.', 'A 480 V ungrounded delta service with a 1,600 A service disconnect.', 'A 480Y/277 V solidly grounded wye service with an 800 A service disconnect.'],
        'Three conditions must all be met: a solidly grounded wye system, more than 150 volts to ground (and not more than 1,000 volts phase-to-phase), and a service disconnect rated 1,000 amperes or more. Only the 480Y/277 V, 1,200 A service meets all three.', GF,
        ['A 208Y/120 V system has 120 volts to ground, which is not more than 150, so the rule does not apply at any ampere rating.', 'The rule covers solidly grounded wye systems. An ungrounded delta is outside it.', 'The voltage and system type qualify, but 800 A is below the 1,000 A threshold.']),
      con('At what service disconnect rating does NEC 230.95 begin to require ground-fault protection of equipment?',
        '1,000 amperes or more', ['800 amperes or more', '1,200 amperes or more', '2,000 amperes or more'],
        'The requirement applies to each service disconnecting means rated <b>1,000 amperes or more</b>, on a solidly grounded wye service of more than 150 volts to ground.', GF,
        ['800 A is a common frame size but it is below the threshold.', '1,200 A is the maximum pickup setting of the protection, not the rating at which it becomes required.', '2,000 A is well above the threshold; the rule starts at 1,000 A.']),
      con('What is the maximum setting permitted for the ground-fault protection required by NEC 230.95?',
        '1,200 amperes', ['1,000 amperes', '3,000 amperes', '600 amperes'],
        'The maximum setting of the ground-fault protection is <b>1,200 amperes</b>. Lower settings are allowed and are often needed to coordinate with devices downstream.', GF,
        ['1,000 A is the disconnect rating at which the protection becomes required, not its maximum setting.', '3,000 A is the fault current at which the maximum time delay is specified.', '600 A is a permitted setting, but it is not the maximum.']),
      con('For ground-fault currents of 3,000 amperes or more, what is the maximum time delay NEC 230.95 permits?',
        'One second', ['Ten seconds', 'One minute', 'One-tenth of a second'],
        'The maximum time delay is <b>one second</b> for ground-fault currents equal to or greater than 3,000 amperes. An arcing ground fault does a great deal of damage in that time, which is why shorter delays are normally set where coordination allows.', GF,
        ['Ten seconds is ten times the permitted maximum.', 'One minute would let an arcing fault destroy the equipment.', 'One-tenth of a second is permitted, but it is not the maximum.']),
      con('A 480Y/277 V service has a 1,200 A fused switch as its service disconnect, fitted with 800 A fuses. Is ground-fault protection of equipment required?',
        'Yes, because the rating is that of the largest fuse the switch can accept.',
        ['No, because the fuses installed are rated below 1,000 A.', 'No, because the rule applies only to circuit breakers.', 'Only if the calculated load is more than 1,000 A.'],
        'The rating of the service disconnect is taken as the rating of the largest fuse that can be installed. A 1,200 A switch can accept 1,200 A fuses, so it is a 1,200 A disconnect for this rule and protection is required, whatever fuses are fitted today.', GF,
        ['The fuses fitted today do not set the rating; the largest fuse the switch can take does.', 'The rule applies to fused switches and circuit breakers alike.', 'The calculated load does not enter into it. The rating of the disconnect does.']),
      con('A service disconnect is a circuit breaker whose continuous-current trip can be adjusted up to 1,200 A. It is set to 800 A. On a 480Y/277 V service, how is its rating judged for NEC 230.95?',
        'As 1,200 A, the highest setting to which the trip can be adjusted.',
        ['As 800 A, the setting in use.', 'As the calculated load on the service.', 'As the ampacity of the service conductors.'],
        'For a circuit breaker the rating is the highest continuous-current trip setting for which the installed overcurrent device is rated or can be adjusted. A breaker that can be turned up to 1,200 A is a 1,200 A disconnect, so ground-fault protection is required.', GF,
        ['Turning the trip down does not take the breaker out of the rule, because it can be turned back up.', 'The load is not the test; the rating of the disconnect is.', 'Conductor ampacity is a separate matter from the rating of the disconnect.']),
      con('To which of these does the ground-fault protection requirement of NEC 230.95 NOT apply?',
        'A service disconnect for a continuous industrial process where a non-orderly shutdown would introduce additional or increased hazards.',
        ['A service disconnect in a building with an automatic sprinkler system.', 'A service disconnect supplied by an underground service lateral.', 'A service disconnect located outdoors.'],
        'The exception covers a service disconnect for a continuous industrial process where a non-orderly shutdown will introduce additional or increased hazards. In that case tripping on a ground fault could be more dangerous than the fault.', GF,
        ['Sprinklers have no bearing on the requirement.', 'Whether the service is overhead or underground makes no difference.', 'The location of the disconnect does not change the requirement.']),
      con('When must the ground-fault protection system required by NEC 230.95 be performance tested?',
        'When it is first installed on site, with a written record kept.',
        ['Only at the factory, before shipment.', 'Only if the inspector asks for it.', 'Only after the first ground fault occurs.'],
        'The system must be performance tested when first installed on site, in accordance with the instructions provided with the equipment, and a written record of the test must be made available to the authority having jurisdiction. Wiring errors, especially at the neutral sensor, are normally found by this test.', GF,
        ['A factory test cannot find field wiring errors, which are the usual cause of failure.', 'The test is a requirement in itself, not something done on request.', 'Waiting for a fault means finding out the protection does not work when it is needed.']),
      con('How does ground-fault protection of equipment (GFPE) differ from a ground-fault circuit interrupter (GFCI)?',
        'GFPE protects equipment and is set in hundreds of amperes; a GFCI protects people and trips at a few milliamperes.',
        ['They are two names for the same device.', 'GFPE protects people; a GFCI protects equipment.', 'GFPE is for DC circuits and a GFCI is for AC circuits.'],
        'A Class A GFCI is a personnel protection device that trips at about 5 milliamperes. GFPE exists to limit damage to equipment from arcing ground faults, with pickups that may be as high as 1,200 amperes. Neither can do the other\'s job.', GF,
        ['They differ by a factor of many thousands in the current at which they act.', 'This has the two the wrong way round.', 'Both are used on AC systems; the difference is purpose and sensitivity.']),
      con('In a health care facility, where ground-fault protection is provided on the service disconnect, what else does the NEC require?',
        'An additional step of ground-fault protection on the next level of feeder disconnects, under 517.17.',
        ['Nothing further; protection at the service is sufficient.', 'Ground-fault protection on every branch circuit.', 'Removal of the protection from the service disconnect.'],
        'NEC 517.17 requires an additional step of ground-fault protection in the next level of feeder disconnecting means downstream toward the load, and the two levels must be selective. A ground fault on a feeder then opens the feeder device and leaves the rest of the facility energized.', GF,
        ['With protection only at the service, any downstream ground fault blacks out the whole facility.', 'The second level is at the feeders, not at every branch circuit.', 'The protection stays at the service; a second level is added below it.']),
    ] });
}

/* batch 2: sets 10 to 17, in their own file */
TOPICS.push(...moreSets({ num, con, f, R3, C, G, T }));

/* reasons for the wrong choices of the first eight sets, kept in practice-why.mjs */
{
  const txt = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&deg;/g, '°').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const hit = new Set();
  for (const t of TOPICS) for (const q of t.q) {
    if (q.why) continue;
    const m = WHY.filter(([k]) => txt(q.stem).startsWith(txt(k)));
    if (m.length !== 1) throw new Error((m.length ? 'more than one' : 'no') + ' practice-why.mjs entry for: ' + txt(q.stem));
    q.why = m[0][1]; hit.add(m[0][0]);
  }
  const unused = WHY.filter(([k]) => !hit.has(k)).map(([k]) => k);
  if (unused.length) throw new Error('practice-why.mjs entries that match no question: ' + unused.join(' | '));
}

/* ----------------------------------------------------------------- builders */
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&sup2;/g, '²').replace(/&sup3;/g, '³')
  .replace(/&deg;/g, '°').replace(/&times;/g, '×').replace(/&minus;/g, '−').replace(/&Omega;/g, 'Ω').replace(/&Delta;/g, 'Δ').replace(/&theta;/g, 'θ').replace(/&radic;/g, '√').replace(/&pi;/g, 'π')
  .replace(/&#966;/g, 'φ').replace(/&#8321;/g, '₁').replace(/&#8322;/g, '₂').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
const attr = (s) => plain(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const LET = ['A', 'B', 'C', 'D'];
/* Deterministic order: the correct choice moves round by topic and question so
   it is not always A, and a rebuild does not reshuffle the page. */
function arrange(q, ti, qi) {
  /* A small seeded shuffle. A fixed rotation put the answers in the order
     A, B, C, D down every page, which is its own kind of answer key. */
  const order = [0, 1, 2, 3];
  let seed = (ti + 1) * 7919 + (qi + 1) * 104729 + q.choices.join('').length * 31;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  for (let i = 3; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const choices = order.map(i => q.choices[i]);
  if (new Set(choices.map(plain)).size !== 4) throw new Error('duplicate choices in: ' + plain(q.stem));
  if (q.why && q.why.length !== 3) throw new Error('why needs three entries in: ' + plain(q.stem));
  return { choices, correct: order.indexOf(0), whyBy: q.why ? order.map(i => (i === 0 ? null : q.why[i - 1])) : null };
}

/* One URL per question, taken from its wording. */
const used = new Set();
function slugFor(stem) {
  const words = plain(stem).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ');
  let s = '';
  for (const w of words) { if ((s + '-' + w).length > 72) break; s = s ? s + '-' + w : w; }
  let out = s, n = 2;
  while (used.has(out)) out = s + '-' + n++;
  used.add(out);
  return out;
}
const clipH = (s, n) => attr(clip(s, n));
const clip = (s, n) => { s = plain(s); if (s.length <= n) return s; const c = s.slice(0, n - 1); return c.slice(0, c.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '') + '…'; };

const STYLE = `<style>
.pq-bar{position:sticky;top:var(--vf-header-h,64px);z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin:18px 0 8px;padding:10px 14px;
  background:var(--card);border:1px solid var(--line-dark);border-radius:var(--r-m,8px);font-family:var(--mono);font-size:12px;color:var(--ink-2)}
.pq-bar b{color:var(--ink)}
.pq-bar button,.pq button{font:600 11px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;padding:9px 12px;min-height:36px;cursor:pointer;
  border-radius:var(--r-s,6px);border:1px solid var(--line-dark);background:transparent;color:var(--ink-2)}
.pq-bar button{margin-left:auto}
.pq{border:1px solid var(--line);border-radius:var(--r-m,8px);padding:18px 20px 16px;margin:18px 0;background:var(--card)}
.pq h2{font-size:13px;font-family:var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--slate);margin:0 0 8px}
.pq .pq-stem{font-size:17px;line-height:1.5;color:var(--ink);margin:0 0 12px}
.pq fieldset{border:0;padding:0;margin:0 0 12px;display:grid;gap:8px}
.pq legend{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.pq label{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;min-height:44px;border:1px solid var(--line);border-radius:var(--r-s,6px);cursor:pointer;color:var(--ink-2)}
.pq label:hover{border-color:var(--line-dark)}
.pq input[type=radio]{margin-top:3px;accent-color:var(--signal)}
.pq label.is-right{border-color:#2E7D4F;background:rgba(46,125,79,.12);color:var(--ink)}
.pq label.is-wrong{border-color:#B4452C;background:rgba(180,69,44,.10)}
.pq .pq-check{background:var(--signal);color:#101B2D;border-color:var(--signal)}
.pq .pq-fb{font-family:var(--mono);font-size:12.5px;margin:10px 0 0;min-height:1.2em}
.pq .pq-fb.ok{color:#2E7D4F}.pq .pq-fb.no{color:#B4452C}
[data-theme="dark"] .pq .pq-fb.ok{color:#7FCC9B}[data-theme="dark"] .pq .pq-fb.no{color:#F0A08C}
.pq details{margin-top:10px;border-top:1px solid var(--line);padding-top:10px}
.pq summary{cursor:pointer;font-family:var(--mono);font-size:12px;letter-spacing:.03em;color:var(--link)}
.pq details p{margin:10px 0 0;font-size:15px}
.pq .pq-ans{font-family:var(--mono);font-size:12.5px;color:var(--slate)}
.pq .pq-own{margin:10px 0 0;font-family:var(--mono);font-size:12px}
.pq-one h1{font-size:clamp(22px,3.4vw,30px);line-height:1.25;letter-spacing:-.02em}
.pq-why{margin:10px 0 0;padding-left:20px}
.pq-why li{font-size:15px;margin-bottom:6px;color:var(--ink-2)}
.pq-list{margin:10px 0 0;padding-left:22px}
.pq-list li{margin-bottom:7px;font-size:15px}
.pq-list li.is-here{color:var(--slate)}
.pq-nav{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 0}
.pq-nav a{flex:1 1 220px;padding:12px 14px;min-height:44px;border:1px solid var(--line-dark);border-radius:var(--r-s,6px);text-decoration:none;color:var(--ink);font-size:14.5px;background:var(--card)}
.pq-nav a span{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--slate);margin-bottom:4px}
@media print{.pq-bar,.pq-check,.ad-unit{display:none!important}.pq details{display:block}.pq details>*{display:block}}
</style>`;

const SCRIPT = `<script>
/* Answer checking and a running score. The questions, choices and solutions are
   all in the page already; without this script the reader opens each solution
   to see the answer. Progress is kept in this browser only. */
(function(){
  var qs=[].slice.call(document.querySelectorAll('.pq')); if(!qs.length)return;
  var key='vf_pq_'+location.pathname, bar=document.getElementById('pqBar'), state={};
  try{state=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){state={};}
  function score(){
    var done=0,right=0;
    qs.forEach(function(q,i){if(state[i]!=null){done++;if(String(state[i])===q.getAttribute('data-answer'))right++;}});
    if(bar)bar.querySelector('span').innerHTML='<b>'+done+'</b> of '+qs.length+' answered &middot; <b>'+right+'</b> correct';
    return {done:done,right:right};
  }
  function mark(q,i,pick,announce){
    var ans=q.getAttribute('data-answer'), fb=q.querySelector('.pq-fb'), ok=String(pick)===ans;
    q.querySelectorAll('label').forEach(function(l){
      var v=l.querySelector('input').value; l.classList.remove('is-right','is-wrong');
      if(v===ans)l.classList.add('is-right'); else if(v===String(pick))l.classList.add('is-wrong');
    });
    q.querySelectorAll('input').forEach(function(r){r.checked=r.value===String(pick);});
    fb.className='pq-fb '+(ok?'ok':'no');
    fb.textContent=ok?'Correct.':'Not quite. The answer is '+'ABCD'.charAt(+ans)+'. The worked solution is below.';
    if(!ok||announce)q.querySelector('details').open=true;
  }
  qs.forEach(function(q,i){
    var btn=document.createElement('button');btn.type='button';btn.className='pq-check';btn.textContent='Check answer';
    var fb=document.createElement('p');fb.className='pq-fb';fb.setAttribute('role','status');fb.setAttribute('aria-live','polite');
    var det=q.querySelector('details');q.insertBefore(btn,det);q.insertBefore(fb,det);
    btn.addEventListener('click',function(){
      var c=q.querySelector('input:checked');
      if(!c){fb.className='pq-fb';fb.textContent='Choose an answer first.';return;}
      state[i]=+c.value;try{localStorage.setItem(key,JSON.stringify(state));}catch(e){}
      mark(q,i,state[i],false);
      var s=score();
      if(window.vfGtag){window.vfGtag('event','practice_answer',{page:location.pathname,q:i+1,correct:String(state[i])===q.getAttribute('data-answer')});
        if(s.done===qs.length)window.vfGtag('event','practice_complete',{page:location.pathname,score:s.right});}
    });
    if(state[i]!=null)mark(q,i,state[i],false);
  });
  if(bar){
    bar.hidden=false;
    bar.querySelector('button').addEventListener('click',function(){
      state={};try{localStorage.removeItem(key);}catch(e){}
      qs.forEach(function(q){
        q.querySelectorAll('label').forEach(function(l){l.classList.remove('is-right','is-wrong');});
        q.querySelectorAll('input').forEach(function(r){r.checked=false;});
        var fb=q.querySelector('.pq-fb');fb.className='pq-fb';fb.textContent='';q.querySelector('details').open=false;
      });
      score();window.scrollTo({top:0,behavior:'smooth'});
    });
  }
  score();
})();
</script>`;

function stamp(tpl, o) {
  let s = tpl;
  const one = (re, to, label) => { if (!re.test(s)) throw new Error(o.file + ': no match for ' + label); s = s.replace(re, to); };
  const url = BASE + o.file;
  one(/<title>[^<]*<\/title>/, `<title>${attr(o.title)}${o.bareTitle ? '' : ' | Voltfield'}</title>`, 'title');
  one(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  one(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`, 'og:url');
  one(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(o.desc)}">`, 'description');
  one(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(o.h1)}">`, 'og:title');
  one(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(o.desc)}">`, 'og:description');
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${BASE}social/social-practice-questions.jpg">`)
       .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${BASE}social/social-practice-questions.jpg">`);
  one(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">\n${JSON.stringify(o.ld)}\n</script>`, 'json-ld');
  one(/<\/head>/, STYLE + '\n</head>', 'head end');
  one(/<main id="main" tabindex="-1">[\s\S]*<\/main>/, () => o.main, 'main');
  s = s.replace(/<script src="\/voltfield-calculators\.js" defer><\/script>\r?\n/, '').replace(/<script src="\/voltfield-updates\.js" defer><\/script>\r?\n/, '')
       .replace(/<link rel="stylesheet" href="\/voltfield-calculators\.css">\r?\n/, '');
  if (o.script) one(/<\/body>/, () => SCRIPT + '\n</body>', 'body end');
  return s;
}

/* ---------------------------------------------------------------------- run */
const tpl = fs.readFileSync(TEMPLATE, 'utf8').replace(/\r\n/g, '\n');
fs.mkdirSync('practice/questions', { recursive: true });
let total = 0;
const QDIR = 'practice/questions/';
/* arrange and name every question first, so set pages can link to them */
const SETS = TOPICS.map((t, ti) => t.q.map((q, qi) => ({ ...q, ...arrange(q, ti, qi), slug: slugFor(q.stem) })));
const written = new Set();
const PROV = (t) => (t.code
  ? `Last reviewed ${DATE_LONG}. Written by the Voltfield editorial team. These questions test rules stated in the 2023 National Electrical Code, and each solution names the section it comes from. Other editions word some of these rules differently, and an examination is marked against the edition it names, so check the one you are working to. If you can show an answer is wrong, the <a class="inline" href="/contact.html">contact page</a> says how to report it.`
  : `Last reviewed ${DATE_LONG}. Written by the Voltfield editorial team. Every numerical answer is computed from the formula shown in its solution, and the wrong choices are computed from specific common mistakes. If you can show an answer is wrong, the <a class="inline" href="/contact.html">contact page</a> says how to report it.`);
TOPICS.forEach((t, ti) => {
  const file = `practice/${t.slug}.html`, url = BASE + file;
  const qs = SETS[ti];
  total += qs.length;
  const desc = t.desc || `${qs.length} ${plain(t.name).toLowerCase()} practice questions with solutions: ${plain(t.blurb).replace(/\.$/, '').toLowerCase()}.`;
  const next = TOPICS[(ti + 1) % TOPICS.length];
  const main = `<main id="main" tabindex="-1">

<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <a href="/practice-questions.html" style="color:var(--slate);text-decoration:none">Practice questions</a> / <span style="color:var(--ink)">${t.name}</span></nav>
    <div class="eyebrow">Practice Questions &middot; ${qs.length} With Solutions</div>
    <h1>${t.name}: Practice Questions</h1>
    <p class="dek">${t.blurb}</p>
  </div>
</section>

<div class="artwrap">
  <p>${t.intro}</p>
  <div class="pq-bar" id="pqBar" hidden><span></span><button type="button">Start over</button></div>

${qs.map((q, i) => `  <section class="pq" data-answer="${q.correct}" aria-labelledby="q${i + 1}">
    <h2 id="q${i + 1}">Question ${i + 1}</h2>
    <p class="pq-stem">${q.stem}</p>
    <fieldset>
      <legend>Choices for question ${i + 1}</legend>
${q.choices.map((c, k) => `      <label><input type="radio" name="q${i + 1}" value="${k}"><span><b>${LET[k]}.</b> ${c}</span></label>`).join('\n')}
    </fieldset>
    <details>
      <summary>Show the worked solution</summary>
      <p class="pq-ans">Answer: ${LET[q.correct]}. ${q.choices[q.correct]}</p>
      <p>${q.sol}</p>
      <p>Related: <a class="inline" href="/${q.link[0]}">${q.link[1]}</a></p>
      <p class="pq-own"><a class="inline" href="/${QDIR}${q.slug}.html">This question on its own page</a></p>
    </details>
  </section>${i === 3 ? '\n\n  <div class="ad-unit" data-ad="incontent"></div>' : ''}`).join('\n\n')}

  <h2>Keep going</h2>
    <div class="rel">
      <a href="/practice/${next.slug}.html">Next set: ${next.name}</a>
      <a href="/practice-questions.html">All practice questions</a>
      <a href="/engineering-calculators.html">Calculators</a>
      <a href="/reference-charts.html">Reference charts</a>
    </div>

  <aside class="provenance" aria-labelledby="prov-h">
    <h2 id="prov-h">Scope &amp; sources</h2>
    <dl>
      <dt>What this covers</dt>
      <dd>${qs.length} multiple-choice questions on ${plain(t.name).toLowerCase()}, each with a worked solution and a link to the calculator or guide it draws on.</dd>
      <dt>What it is not</dt>
      <dd>An official examination, or questions taken from one. These are original questions for study and self-testing. They are not affiliated with any licensing body, and passing them is not evidence of competence to do electrical work.</dd>
      <dt>Provenance</dt>
      <dd>${PROV(t)}</dd>
    </dl>
  </aside>

</div>
<div class="ad-unit" data-ad="footer"></div>
</main>`;
  const crumbs = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Practice questions', item: BASE + 'practice-questions.html' },
      { '@type': 'ListItem', position: 3, name: plain(t.name), item: url } ];

  /* one page per question */
  qs.forEach((q, i) => {
    const qfile = `${QDIR}${q.slug}.html`, qurl = BASE + qfile;
    const prev = qs[(i + qs.length - 1) % qs.length], nxt = qs[(i + 1) % qs.length];
    const isCalc = q.link[0].startsWith('calculators/'), isChart = q.link[0].startsWith('charts/');
    const tryIt = isCalc ? `The <a class="inline" href="/${q.link[0]}">${q.link[1]}</a> runs the same calculation with any values you give it, and shows the formula it used. Change one input at a time to see which way the answer moves.`
      : isChart ? `The <a class="inline" href="/${q.link[0]}">${q.link[1]}</a> lists the values this question draws on, so you can check neighbouring cases.`
      : `<a class="inline" href="/${q.link[0]}">${q.link[1]}</a> covers the background to this question in full.`;
    let qdesc = clip(`Answer: ${plain(q.choices[q.correct])}. ${plain(q.sol)}`, 156);
    if (qdesc.length < 100) { const add = ` A ${plain(t.name).toLowerCase()} practice question with its worked solution.`; qdesc += (qdesc.length + add.length <= 158 ? add : ' A practice question with its worked solution.'); }
    const qmain = `<main id="main" tabindex="-1">

<section class="artban pq-one">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <a href="/practice-questions.html" style="color:var(--slate);text-decoration:none">Practice questions</a> / <a href="/practice/${t.slug}.html" style="color:var(--slate);text-decoration:none">${t.name}</a> / <span style="color:var(--ink)">Question ${i + 1}</span></nav>
    <div class="eyebrow">Practice Question &middot; With Worked Solution</div>
    <h1>${q.stem}</h1>
    <p class="dek">Question ${i + 1} of ${qs.length} in the set on ${plain(t.name).toLowerCase()}. Choose an answer, then open the solution to see the working.</p>
  </div>
</section>

<div class="artwrap">
  <section class="pq" data-answer="${q.correct}" aria-labelledby="q1">
    <h2 id="q1">Choose an answer</h2>
    <fieldset>
      <legend>${attr(q.stem)}</legend>
${q.choices.map((c, k) => `      <label><input type="radio" name="q1" value="${k}"><span><b>${LET[k]}.</b> ${c}</span></label>`).join('\n')}
    </fieldset>
    <details>
      <summary>Show the answer and worked solution</summary>
      <p class="pq-ans">Answer: ${LET[q.correct]}. ${q.choices[q.correct]}</p>
      <p>${q.sol}</p>${q.whyBy ? `
      <p><b>Why the other choices are wrong</b></p>
      <ul class="pq-why">
${q.choices.map((c, k) => (k === q.correct ? '' : `        <li><b>${LET[k]}. ${c}</b> ${q.whyBy[k]}</li>`)).filter(Boolean).join('\n')}
      </ul>` : ''}
    </details>
  </section>

  <h2>${isCalc ? 'Try it with your own numbers' : 'Read more on this'}</h2>
  <p>${tryIt}</p>

  <div class="pq-nav">
    <a href="/${QDIR}${prev.slug}.html"><span>Previous question</span>${clipH(prev.stem, 90)}</a>
    <a href="/${QDIR}${nxt.slug}.html"><span>Next question</span>${clipH(nxt.stem, 90)}</a>
  </div>

  <h2>All ${qs.length} questions in this set</h2>
  <ol class="pq-list">
${qs.map((x, k) => (k === i ? `    <li class="is-here">${clipH(x.stem, 120)} (this question)</li>` : `    <li><a class="inline" href="/${QDIR}${x.slug}.html">${clipH(x.stem, 120)}</a></li>`)).join('\n')}
  </ol>
  <div class="rel">
    <a href="/practice/${t.slug}.html">Take the whole set with a score</a>
    <a href="/practice-questions.html">All practice questions</a>
  </div>

  <aside class="provenance" aria-labelledby="prov-h">
    <h2 id="prov-h">Scope &amp; sources</h2>
    <dl>
      <dt>What this is</dt>
      <dd>An original practice question written for study, with its answer and working. It is not taken from any licensing or certification examination and is not affiliated with one.</dd>
      <dt>Provenance</dt>
      <dd>${PROV(t)}</dd>
    </dl>
  </aside>

</div>
<div class="ad-unit" data-ad="footer"></div>
</main>`;
    const qld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [...crumbs, { '@type': 'ListItem', position: 4, name: 'Question ' + (i + 1), item: qurl }] },
      { '@type': 'Quiz', name: clip(q.stem, 110), description: qdesc, url: qurl, dateModified: DATE_ISO, inLanguage: 'en-US',
        educationalLevel: 'intermediate', learningResourceType: 'Practice problem', about: { '@type': 'Thing', name: plain(t.name) },
        isPartOf: { '@type': 'Quiz', name: plain(t.name) + ': Practice Questions', url },
        publisher: { '@type': 'Organization', name: 'Voltfield', url: BASE },
        hasPart: [{ '@type': 'Question', eduQuestionType: 'Multiple choice', text: plain(q.stem),
          suggestedAnswer: q.choices.map((c, k) => ({ '@type': 'Answer', position: k, text: plain(c) })).filter((a, k) => k !== q.correct),
          acceptedAnswer: { '@type': 'Answer', position: q.correct, text: plain(q.choices[q.correct]), answerExplanation: { '@type': 'Comment', text: plain(q.sol) } } }] },
    ] };
    fs.writeFileSync(qfile, stamp(tpl, { file: qfile, title: clip(q.stem, 60), bareTitle: true, desc: qdesc, h1: clip(q.stem, 90), ld: qld, main: qmain, script: true }));
    written.add(q.slug + '.html');
  });

  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: crumbs },
    { '@type': 'Quiz', name: plain(t.name) + ': Practice Questions', description: desc, url, dateModified: DATE_ISO, inLanguage: 'en-US',
      educationalLevel: 'intermediate', learningResourceType: 'Practice problem', about: { '@type': 'Thing', name: plain(t.name) },
      publisher: { '@type': 'Organization', name: 'Voltfield', url: BASE },
      hasPart: qs.map((q) => ({ '@type': 'Question', eduQuestionType: 'Multiple choice', text: plain(q.stem),
        suggestedAnswer: q.choices.map((c, k) => ({ '@type': 'Answer', position: k, text: plain(c) })).filter((a, k) => k !== q.correct),
        acceptedAnswer: { '@type': 'Answer', position: q.correct, text: plain(q.choices[q.correct]), answerExplanation: { '@type': 'Comment', text: plain(q.sol) } } })) },
  ] };
  fs.writeFileSync(file, stamp(tpl, { file, title: t.title, desc, h1: `${t.name}: Practice Questions`, ld, main, script: true }));
  console.log(`  wrote ${file}  (${qs.length} questions, title ${(t.title + ' | Voltfield').length}, desc ${desc.length}, answers ${qs.map(q => LET[q.correct]).join('')})`);
});

{ // hub
  const cards = TOPICS.map(t => `    <a class="gdcard has-thumb" href="practice/${t.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${t.badge}</span><h3>${t.name}</h3><p>${t.blurb} ${t.q.length} questions.</p></a>`).join('\n');
  const desc = `${total} free electrical practice questions with worked solutions, in ${TOPICS.length} sets: Ohm's law, three-phase power, voltage drop, breakers, transformers, motors and more.`;
  const A = (h, x) => `<a class="inline" href="${h}">${x}</a>`;
  const main = `<main id="main" tabindex="-1">

<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <span style="color:var(--ink)">Practice questions</span></nav>
    <div class="eyebrow">Practice Questions &middot; Free, No Signup</div>
    <h1>Electrical Practice Questions</h1>
    <p class="dek">${total} multiple-choice questions in ${TOPICS.length} sets, each with a worked solution that shows where the wrong answers come from.</p>
  </div>
</section>

<div class="artwrap">
  <p><b>Pick a set, answer the questions, and check each one as you go.</b> Every question has four choices, and the wrong ones are not random: each is what you get from a particular mistake, such as leaving out the square root of three or using a one-way length where the current goes out and back. The solution names the mistake as well as the method.</p>

  <h2 class="vf-sr-only">Question sets</h2>
  <div class="gdgrid">
${cards}
  </div>

  <h2>How to use them</h2>
  <p>Work each question on paper before looking at the choices. If your answer is not among them, that tells you something before you have checked anything. When you get one wrong, read the solution and then try the linked calculator with different numbers until the method is familiar. Your answers are kept in your browser, so you can leave a set and come back to it.</p>

  <h2>What these are and are not</h2>
  <p>These are original questions written for study. They are not taken from any licensing or certification examination and are not affiliated with one. Where a question touches the National Electrical Code it tests a method, such as taking a continuous load at 125 percent, and not a table lookup, so it does not depend on which edition you are working to. The one exception is the set on ground-fault protection, which tests rules stated in the code itself and says which edition it follows. Every question also has a page of its own, linked from its solution, if you want to send one to somebody. For the terms themselves there is also a ${A('voltfield-glossary-quiz.html', 'glossary quiz')}, and the ${A('voltfield-sandbox.html', 'one-line practice sandbox')} lets you build a system and have it checked.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>
</main>`;
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Practice questions', item: BASE + 'practice-questions.html' } ] },
    { '@type': 'CollectionPage', name: 'Electrical Practice Questions', description: desc, url: BASE + 'practice-questions.html', dateModified: DATE_ISO, inLanguage: 'en-US' },
    { '@type': 'ItemList', itemListElement: TOPICS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: plain(t.name) + ': Practice Questions', url: BASE + 'practice/' + t.slug + '.html' })) },
  ] };
  fs.writeFileSync('practice-questions.html', stamp(tpl, { file: 'practice-questions.html', title: 'Electrical Practice Questions With Solutions', desc, h1: 'Electrical Practice Questions', ld, main, script: false }));
  console.log(`  wrote practice-questions.html (desc ${desc.length})`);
  fs.writeFileSync('scripts/practice-manifest.json', JSON.stringify(TOPICS.map(t => ({ slug: t.slug, name: plain(t.name), blurb: plain(t.blurb), n: t.q.length })), null, 1));
}
/* question pages that no longer have a question behind them */
for (const fn of fs.readdirSync(QDIR)) if (fn.endsWith('.html') && !written.has(fn)) { fs.unlinkSync(QDIR + fn); console.log('  removed stale ' + QDIR + fn); }

/* sitemap: one entry per set and per question, dated today; stale question entries removed */
{
  const raw = fs.readFileSync('sitemap.xml', 'utf8'), crlf = raw.includes('\r\n');
  let x = raw.replace(/\r\n/g, '\n');
  const entry = (loc, pr) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${DATE_ISO}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${pr}</priority>\n  </url>\n`;
  x = x.replace(/  <url>\n    <loc>https:\/\/voltfield\.org\/practice\/questions\/[^<]*<\/loc>[\s\S]*?<\/url>\n/g, '');
  const want = [[BASE + 'practice-questions.html', '0.7'], ...TOPICS.map(t => [BASE + 'practice/' + t.slug + '.html', '0.7']), ...[...written].sort().map(fn => [BASE + QDIR + fn, '0.5'])];
  let added = 0;
  for (const [loc, pr] of want) {
    const re = new RegExp('(<loc>' + loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</loc>\\n\\s*<lastmod>)[^<]*');
    if (re.test(x)) x = x.replace(re, '$1' + DATE_ISO);
    else { x = x.replace('</urlset>', () => entry(loc, pr) + '</urlset>'); added++; }
  }
  fs.writeFileSync('sitemap.xml', crlf ? x.replace(/\n/g, '\r\n') : x);
  console.log(`  sitemap: ${want.length} practice URLs, ${added} newly listed since the last question-page set`);
}
console.log('practice sets: ' + TOPICS.length + ', questions: ' + total + ', question pages: ' + written.size);
