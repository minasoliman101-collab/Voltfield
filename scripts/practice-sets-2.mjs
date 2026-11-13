/*
 * Practice question sets, batch 2 (added 2026-11-13). Imported by gen-practice.mjs.
 *
 * Same rule as the first batch: every numerical answer, and every wrong choice,
 * is COMPUTED here from the formula its solution shows. Each wrong choice comes
 * from one named mistake, and the `why` list says which, in the same order as
 * the wrong choices. Nothing is typed in from a code table; where a question
 * needs a conductor area or a table current it states the figure itself.
 *
 * Several questions share a formula on purpose. People search for the specific
 * case ("150 kVA to amps", "18.5 kW to amps"), and each case has its own page.
 */
export default function ({ num, con, f, R3, C, G, T }) {
  const TOPICS = [];
  const n0 = (v) => f(v, 0), n1 = (v) => f(v, 1), n2 = (v) => f(v, 2);
  const K = (kva) => (Number.isInteger(kva) ? f(kva) : String(kva));
  const dec = (v) => (v >= 100 ? 0 : 1);
  const fmt = (v) => f(v, dec(v));

  { // 10 ------------------------------------------------ transformer full-load current
    const link = C('kva-to-amps', 'kVA to Amps Calculator'), chart = ['charts/kva-to-amps-chart.html', 'kVA to Amps Chart'];
    const three = (kva, v, side, lk) => {
      const i = kva * 1000 / (R3 * v), d = dec(i / R3);
      return num(`What is the full-load ${side}current of a ${K(kva)} kVA three-phase transformer at ${f(v)} V?`, i, [kva * 1000 / v, kva * 1000 / (3 * v), 3 * i], 'A', d,
        `I = kVA &times; 1,000 / (1.732 &times; V) = ${f(kva * 1000)} / (1.732 &times; ${f(v)}) = <b>${f(i, d)} A</b>. The kVA is the same on both windings, so the current is found from whichever voltage the question asks about.`, lk || link,
        [`${f(kva * 1000 / v, d)} A leaves out the 1.732. That is the formula for a single-phase transformer.`, `${f(kva * 1000 / (3 * v), d)} A divides by 3 where it should divide by 1.732.`, `${f(3 * i, d)} A multiplies by 1.732 where it should divide.`]);
    };
    const single = (kva, v) => {
      const i = kva * 1000 / v, d = dec(i / 2);
      return num(`What is the full-load current of a ${K(kva)} kVA single-phase transformer at ${f(v)} V?`, i, [i / R3, i / 2, i * R3], 'A', d,
        `I = kVA &times; 1,000 / V = ${f(kva * 1000)} / ${f(v)} = <b>${f(i, d)} A</b>. A single-phase transformer has no 1.732 in its formula.`, link,
        [`${f(i / R3, d)} A uses the three-phase formula, dividing by 1.732.`, `${f(i / 2, d)} A halves the current, as though the two legs of the winding shared it.`, `${f(i * R3, d)} A multiplies by 1.732.`]);
    };
    TOPICS.push({ slug: 'transformer-full-load-current', desc: '8 practice questions on transformer full-load current, with worked answers: kVA to amps at common sizes, single-phase and three-phase, primary and secondary.', badge: 'FLA', name: 'Transformer Full-Load Current',
      title: 'Transformer Full-Load Amps Practice Questions',
      blurb: 'kVA to amps at common transformer sizes and voltages, single-phase and three-phase, primary and secondary.',
      intro: 'One formula covers every question here: current is kVA times 1,000, divided by the voltage, and for three-phase also by 1.732. The wrong choices are what the formula gives when the 1.732 is left out, doubled up or turned upside down, which is where nearly every mistake in this calculation comes from.',
      q: [
        three(45, 208, 'secondary ', chart), three(112.5, 208, 'secondary '), three(150, 480, ''), three(300, 208, 'secondary ', chart),
        three(750, 480, 'secondary '), three(2000, 480, 'secondary ', chart), three(1000, 4160, 'primary '), single(25, 240),
      ] });
  }

  { // 11 ------------------------------------------------ kW to amps
    const link = C('kw-to-amps', 'kW to Amps Calculator'), chart = ['charts/kw-to-amps-chart.html', 'kW to Amps Chart'];
    const three = (kw, v, pf, what, lk) => {
      const i = kw * 1000 / (R3 * v * pf), d = dec(kw * 1000 * pf / (R3 * v));
      return num(`${what} draws ${String(kw)} kW from a ${f(v)} V three-phase supply at a power factor of ${pf}. What is the line current?`, i, [kw * 1000 / (v * pf), kw * 1000 / (R3 * v), kw * 1000 * pf / (R3 * v)], 'A', d,
        `I = kW &times; 1,000 / (1.732 &times; V &times; PF) = ${f(kw * 1000)} / (1.732 &times; ${f(v)} &times; ${pf}) = <b>${f(i, d)} A</b>.`, lk || link,
        [`${f(kw * 1000 / (v * pf), d)} A leaves out the 1.732, which makes it the single-phase formula.`, `${f(kw * 1000 / (R3 * v), d)} A leaves out the power factor. It would be right only at unity power factor.`, `${f(kw * 1000 * pf / (R3 * v), d)} A multiplies by the power factor where it should divide. A lower power factor means more current, not less.`]);
    };
    const onePf = (kw, v, pf, what) => {
      const i = kw * 1000 / (v * pf), d = 1;
      return num(`${what} draws ${String(kw)} kW from a ${f(v)} V single-phase supply at a power factor of ${pf}. What current does it draw?`, i, [kw * 1000 / v, kw * 1000 / (R3 * v * pf), kw * 1000 * pf / v], 'A', d,
        `I = kW &times; 1,000 / (V &times; PF) = ${f(kw * 1000)} / (${f(v)} &times; ${pf}) = <b>${f(i, d)} A</b>.`, link,
        [`${f(kw * 1000 / v, d)} A leaves out the power factor.`, `${f(kw * 1000 / (R3 * v * pf), d)} A divides by 1.732, which belongs only in the three-phase formula.`, `${f(kw * 1000 * pf / v, d)} A multiplies by the power factor where it should divide.`]);
    };
    const oneRes = (kw, v, what) => {
      const i = kw * 1000 / v, d = 1;
      return num(`${what} is rated ${String(kw)} kW at ${f(v)} V, single-phase. What current does it draw?`, i, [i / R3, i / 2, i / 0.8], 'A', d,
        `A resistance heater has a power factor of 1.0, so I = W / V = ${f(kw * 1000)} / ${f(v)} = <b>${f(i, d)} A</b>.`, C('watts-to-amps', 'Watts to Amps Calculator'),
        [`${f(i / R3, d)} A divides by 1.732, which belongs only in the three-phase formula.`, `${f(i / 2, d)} A halves the current, as though two legs each carried half of it.`, `${f(i / 0.8, d)} A applies a power factor of 0.8 to a load that is purely resistive.`]);
    };
    const i48 = 5000 / 48;
    TOPICS.push({ slug: 'kw-to-amps', desc: '8 practice questions on converting kW to amps, with worked answers: single-phase, three-phase and DC circuits, with and without power factor.', badge: 'kW', name: 'kW to Amps',
      title: 'kW to Amps Practice Questions (With Solutions)',
      blurb: 'Converting kilowatts to amperes on single-phase, three-phase and DC circuits, with and without power factor.',
      intro: 'Kilowatts cannot be turned into amperes without knowing three things: the voltage, whether the circuit is single-phase or three-phase, and the power factor. Each question gives all three. The wrong choices are what you get by dropping one of them.',
      q: [
        three(18.5, 400, 0.85, 'A motor'), onePf(2.2, 240, 0.8, 'A pump motor'), three(250, 480, 0.9, 'A chiller', chart), oneRes(10, 240, 'A resistance heater'),
        oneRes(1, 120, 'A resistance heater'), three(50, 208, 0.85, 'A panel'), three(100, 415, 0.95, 'A group of server racks', chart),
        num('A DC load draws 5 kW from a 48 V battery system. What current flows?', i48, [i48 / R3, i48 / 0.9, i48 / 10], 'A', 1,
          `On DC there is no power factor and no 1.732: I = W / V = 5,000 / 48 = <b>${n1(i48)} A</b>. Low-voltage DC systems carry large currents for modest power, which is why their conductors are so heavy.`, C('watts-to-amps', 'Watts to Amps Calculator'),
          [`${n1(i48 / R3)} A divides by 1.732, which applies only to three-phase AC.`, `${n1(i48 / 0.9)} A applies a power factor of 0.9. A DC circuit has none.`, `${n1(i48 / 10)} A is a slip of the decimal point: 5 kW is 5,000 W, not 500 W.`]),
      ] });
  }

  { // 12 ------------------------------------------------ amps to kW and kVA
    const kwL = C('amps-to-kw', 'Amps to kW Calculator'), kvaL = C('amps-to-kva', 'Amps to kVA Calculator');
    const kw3 = (v, a, pf, what) => {
      const p = R3 * v * a * pf / 1000, d = 1;
      return num(`${what} carries ${f(a)} A per phase at ${f(v)} V, three-phase, with a power factor of ${pf}. What real power is it delivering?`, p, [v * a * pf / 1000, R3 * v * a / 1000, 3 * v * a * pf / 1000], 'kW', d,
        `kW = 1.732 &times; V &times; I &times; PF / 1,000 = 1.732 &times; ${f(v)} &times; ${f(a)} &times; ${pf} / 1,000 = <b>${f(p, d)} kW</b>.`, kwL,
        [`${f(v * a * pf / 1000, d)} kW leaves out the 1.732.`, `${f(R3 * v * a / 1000, d)} is the apparent power, in kVA. It leaves out the power factor, so it is not kilowatts.`, `${f(3 * v * a * pf / 1000, d)} kW multiplies by 3. That would be right only if the voltage given were line-to-neutral.`]);
    };
    const kva3 = (v, a, what) => {
      const s = R3 * v * a / 1000, d = 1;
      return num(`${what} carries ${f(a)} A per phase at ${f(v)} V, three-phase. What is the apparent power?`, s, [v * a / 1000, 3 * v * a / 1000, s * 0.8], 'kVA', d,
        `kVA = 1.732 &times; V &times; I / 1,000 = 1.732 &times; ${f(v)} &times; ${f(a)} / 1,000 = <b>${f(s, d)} kVA</b>. No power factor is needed for apparent power.`, kvaL,
        [`${f(v * a / 1000, d)} kVA leaves out the 1.732.`, `${f(3 * v * a / 1000, d)} kVA multiplies by 3, which would need the line-to-neutral voltage.`, `${f(s * 0.8, d)} applies a power factor of 0.8, which turns kVA into kW. The question asks for kVA.`]);
    };
    const pf = 85000 / (R3 * 480 * 120);
    TOPICS.push({ slug: 'amps-to-kw-and-kva', desc: '8 practice questions on converting amps to kW and kVA, with worked answers: real power, apparent power and power factor from a measured current.', badge: 'kVA', name: 'Amps to kW and kVA',
      title: 'Amps to kW & kVA Practice Questions',
      blurb: 'Working from a measured current to real power, apparent power and power factor, single-phase and three-phase.',
      intro: 'A clamp meter gives amperes. Turning that into kilowatts or kVA takes the voltage, the number of phases and, for kilowatts only, the power factor. These questions run the conversion in that direction, and the last two work back to the power factor itself.',
      q: [
        kw3(480, 200, 0.85, 'A feeder'), kva3(208, 150, 'A panel feeder'), kw3(415, 63, 0.9, 'A busway tap-off'), kva3(480, 800, 'A switchboard main'), kw3(600, 100, 0.8, 'A motor control center feeder'),
        num('A single-phase 240 V circuit carries 40 A to a resistance heater. What power is the heater drawing?', 9.6, [9.6 / R3, 9.6 * R3, 9.6 * 0.8], 'kW', 2,
          `For a resistive load, kW = V &times; I / 1,000 = 240 &times; 40 / 1,000 = <b>${n2(9.6)} kW</b>.`, kwL,
          [`${n2(9.6 / R3)} kW divides by 1.732, which has no place in a single-phase calculation.`, `${n2(9.6 * R3)} kW multiplies by 1.732, which is the three-phase formula.`, `${n2(9.6 * 0.8)} kW applies a power factor of 0.8 to a purely resistive load.`]),
        num('A three-phase load draws 120 A at 480 V, and a power meter shows 85 kW. What is its power factor?', pf, [85000 / (480 * 120), 1 / pf, 85000 / (3 * 480 * 120)], '', 2,
          `kVA = 1.732 &times; 480 &times; 120 / 1,000 = ${n1(R3 * 480 * 120 / 1000)} kVA. Power factor = kW / kVA = 85 / ${n1(R3 * 480 * 120 / 1000)} = <b>${n2(pf)}</b>.`, C('power-factor', 'Power Factor Correction Calculator'),
          [`${n2(85000 / (480 * 120))} leaves out the 1.732. A power factor above 1.0 is impossible, which is the warning sign.`, `${n2(1 / pf)} is kVA divided by kW, the ratio upside down. It is also above 1.0.`, `${n2(85000 / (3 * 480 * 120))} divides by 3 where it should divide by 1.732.`]),
        num('A 120 V single-phase circuit carries 15 A at a power factor of 0.9. What real power is it delivering?', 120 * 15 * 0.9, [120 * 15, 120 * 15 / 0.9, R3 * 120 * 15 * 0.9], 'W', 0,
          `W = V &times; I &times; PF = 120 &times; 15 &times; 0.9 = <b>${n0(1620)} W</b>.`, C('amps-to-watts', 'Amps to Watts Calculator'),
          [`${n0(1800)} VA is the apparent power. It leaves out the power factor.`, `${n0(2000)} W divides by the power factor where it should multiply. Real power is never more than volts times amps.`, `${n0(R3 * 1620)} W multiplies by 1.732, which belongs to three-phase circuits.`]),
      ] });
  }

  { // 13 ------------------------------------------------ motor current and power
    const kwIn = 25 * 0.7457 / 0.91, fla = 100 * 746 / (R3 * 460 * 0.94 * 0.86), sp = 1200 * (1 - 0.03), tnm = 9550 * 15 / 1460, hp = 150 * 1750 / 5252;
    TOPICS.push({ slug: 'motor-current-and-power', desc: '8 motor practice questions with worked answers: input power from horsepower, full-load current, slip and speed, poles, torque and the affinity laws.', badge: 'HP', name: 'Motor Current and Power',
      title: 'Motor Current & Power Practice Questions',
      blurb: 'Input power from horsepower and efficiency, full-load current from first principles, speed, poles and torque.',
      intro: 'A motor nameplate gives output, in horsepower or kilowatts. What the supply has to deliver is more than that, by the efficiency and the power factor. These questions work between the two, then move on to speed and torque. Where a current comes from a table, the question states it.',
      q: [
        num('A 25 hp motor has a full-load efficiency of 91 percent. What electrical power does it draw at full load?', kwIn, [25 * 0.7457, 25 * 0.7457 * 0.91, 25 / 0.91], 'kW', 1,
          `Output = 25 &times; 0.7457 = ${n2(25 * 0.7457)} kW. Input = output / efficiency = ${n2(25 * 0.7457)} / 0.91 = <b>${n1(kwIn)} kW</b>.`, C('hp-to-kw', 'Motor HP to kW Calculator'),
          [`${n1(25 * 0.7457)} kW is the shaft output. It leaves out the efficiency.`, `${n1(25 * 0.7457 * 0.91)} kW multiplies by the efficiency. The input is always larger than the output.`, `${n1(25 / 0.91)} is horsepower divided by efficiency, with no conversion to kilowatts.`]),
        num('Estimate the full-load current of a 100 hp, 460 V three-phase motor with an efficiency of 94 percent and a power factor of 0.86.', fla, [100 * 746 / (R3 * 460), 100 * 746 / (460 * 0.94 * 0.86), 100 * 746 * 0.94 * 0.86 / (R3 * 460)], 'A', 1,
          `I = hp &times; 746 / (1.732 &times; V &times; efficiency &times; PF) = 74,600 / (1.732 &times; 460 &times; 0.94 &times; 0.86) = <b>${n1(fla)} A</b>. This is an estimate from the motor's own figures. For sizing conductors and protection the code uses its table value for the horsepower, not the nameplate current.`, ['charts/motor-full-load-current-chart.html', 'Motor Full-Load Current Chart'],
          [`${n1(100 * 746 / (R3 * 460))} A leaves out both efficiency and power factor, so it is the current for the shaft output alone.`, `${n1(100 * 746 / (460 * 0.94 * 0.86))} A leaves out the 1.732.`, `${n1(100 * 746 * 0.94 * 0.86 / (R3 * 460))} A multiplies by efficiency and power factor where it should divide.`]),
        num('A six-pole, 60 Hz induction motor runs with 3 percent slip. What is its shaft speed?', sp, [1200, 1200 * 1.03, 1800 * 0.97], 'rpm', 0,
          `Synchronous speed = 120 &times; 60 / 6 = 1,200 rpm. Shaft speed = 1,200 &times; (1 &minus; 0.03) = <b>${n0(sp)} rpm</b>.`, C('motor-speed', 'Motor Speed &amp; Slip Calculator'),
          ['1,200 rpm is the synchronous speed. An induction motor always runs a little below it.', `${n0(1200 * 1.03)} rpm adds the slip. Slip makes the rotor slower than the field, not faster.`, `${n0(1800 * 0.97)} rpm starts from 1,800 rpm, which is the synchronous speed of a four-pole motor.`]),
        con('A 60 Hz motor has a synchronous speed of 900 rpm. How many poles does it have?', '8', ['4', '6', '12'],
          'Poles = 120 &times; f / N = 120 &times; 60 / 900 = <b>8</b>.', ['charts/motor-speed-chart.html', 'Motor Speed Chart'],
          ['Four poles give 1,800 rpm at 60 Hz.', 'Six poles give 1,200 rpm at 60 Hz.', 'Twelve poles give 600 rpm at 60 Hz.']),
        num('What torque does a 15 kW motor deliver at 1,460 rpm, in newton-metres?', tnm, [9550 * 15 / 1500, 5252 * 15 / 1460, 15000 / 1460], 'N&middot;m', 1,
          `T = 9,550 &times; kW / rpm = 9,550 &times; 15 / 1,460 = <b>${n1(tnm)} N&middot;m</b>. The constant 9,550 is 60,000 divided by 2&pi;.`, C('motor-torque', 'Motor Torque Calculator'),
          [`${n1(9550 * 15 / 1500)} N&middot;m uses 1,500 rpm, the synchronous speed, where the question gives the shaft speed.`, `${n1(5252 * 15 / 1460)} uses 5,252, the constant for horsepower and pound-feet, with kilowatts.`, `${n1(15000 / 1460)} divides watts by rpm, leaving out the conversion from revolutions per minute to radians per second.`]),
        num('A motor delivers 150 lb-ft of torque at 1,750 rpm. What is its output in horsepower?', hp, [hp * 0.7457, 150 * 1750 / 9550, 150 * 1750 / 33000], 'hp', 1,
          `hp = torque &times; rpm / 5,252 = 150 &times; 1,750 / 5,252 = <b>${n1(hp)} hp</b>.`, C('motor-torque', 'Motor Torque Calculator'),
          [`${n1(hp * 0.7457)} is the same output in kilowatts, not horsepower.`, `${n1(150 * 1750 / 9550)} uses 9,550, the constant for kilowatts and newton-metres, with pound-feet.`, `${n1(150 * 1750 / 33000)} hp divides by 33,000 and leaves out the 2&pi; that turns revolutions into distance travelled.`]),
        num('A motor has a table full-load current of 65 A. Its branch-circuit conductors must have an ampacity of at least what value?', 65 * 1.25, [65, 65 * 0.8, 65 * 1.5], 'A', 2,
          `Conductors supplying a single motor are sized at 125 percent of the motor's full-load current: 65 &times; 1.25 = <b>${n2(81.25)} A</b>. The next conductor size with at least that ampacity is then chosen.`, C('wire-size', 'Wire Size Calculator'),
          ['65 A is the full-load current itself, with no margin.', `${n2(52)} A multiplies by 0.8, which applies the 125 percent rule backwards.`, `${n2(97.5)} A uses 150 percent, which is not the conductor rule.`]),
        con('A centrifugal pump in a system with no static head is slowed to half speed. About what fraction of its original power does it draw?',
          'About 12.5 percent.', ['50 percent.', '25 percent.', '75 percent.'],
          'By the affinity laws power goes with the cube of speed: 0.5&sup3; = 0.125, or <b>12.5 percent</b>. Flow falls to 50 percent and head to 25 percent.', C('affinity-laws', 'Affinity Laws Calculator'),
          ['50 percent is the flow, which goes directly with speed.', '25 percent is the head, which goes with the square of speed.', '75 percent has no basis in the affinity laws.']),
      ] });
  }

  { // 14 ------------------------------------------------ voltage drop calculations
    const link = C('voltage-drop', 'Voltage Drop Calculator');
    const a = 2 * 12.9 * 30 * 120 / 10380, b = R3 * 12.9 * 60 * 200 / 41740, c = 2 * 21.2 * 100 * 150 / 105600, cm = 2 * 12.9 * 15 * 150 / 3.6;
    const L = Math.floor(14.4 * 66360 / (R3 * 12.9 * 90)), dc = 2 * 12.9 * 40 * 25 / 26240;
    TOPICS.push({ slug: 'voltage-drop-calculations', desc: '8 voltage drop practice questions with worked answers, by the K-factor method: single-phase, three-phase and DC, copper and aluminum.', badge: 'VD', name: 'Voltage Drop Calculations',
      title: 'Voltage Drop Practice Questions (K-Factor)',
      blurb: 'Voltage drop in volts and percent, single-phase, three-phase and DC, copper and aluminum, and sizing a conductor to a limit.',
      intro: 'These all use the K-factor method: K = 12.9 for copper and 21.2 for aluminum, with the conductor area in circular mils given in each question. The multiplier is 2 for single-phase and DC, because the current goes out and back, and 1.732 for three-phase.',
      q: [
        num('A single-phase 240 V circuit runs 120 ft, one way, in 10 AWG copper (10,380 circular mils) and carries 30 A. What is the voltage drop?', a, [a / 2, a * R3 / 2, 2 * 21.2 * 30 * 120 / 10380], 'V', 2,
          `VD = 2 &times; K &times; I &times; L / cmil = 2 &times; 12.9 &times; 30 &times; 120 / 10,380 = <b>${n2(a)} V</b>, which is ${n2(a / 240 * 100)} percent of 240 V.`, link,
          [`${n2(a / 2)} V uses the one-way length without the factor of 2. The current returns along a second conductor.`, `${n2(a * R3 / 2)} V uses 1.732, the three-phase multiplier, on a single-phase circuit.`, `${n2(2 * 21.2 * 30 * 120 / 10380)} V uses K = 21.2, the value for aluminum.`]),
        num('A three-phase 208 V feeder runs 200 ft in 4 AWG copper (41,740 circular mils) and carries 60 A. What is the voltage drop as a percentage?', b / 208 * 100, [b / 208 * 100 * 2 / R3, b / 120 * 100, b / 208 * 100 / R3], '%', 2,
          `VD = 1.732 &times; 12.9 &times; 60 &times; 200 / 41,740 = ${n2(b)} V. As a percentage of 208 V that is <b>${n2(b / 208 * 100)} percent</b>, above the 3 percent usually recommended for a feeder.`, link,
          [`${n2(b / 208 * 100 * 2 / R3)} percent uses a multiplier of 2, which is for single-phase.`, `${n2(b / 120 * 100)} percent divides by 120 V, the line-to-neutral voltage. The drop was worked line-to-line.`, `${n2(b / 208 * 100 / R3)} percent leaves out the 1.732 altogether.`]),
        num('A single-phase 240 V feeder runs 150 ft in 1/0 AWG aluminum (105,600 circular mils) and carries 100 A. What is the voltage drop?', c, [2 * 12.9 * 100 * 150 / 105600, c / 2, c * R3 / 2], 'V', 2,
          `Aluminum takes K = 21.2. VD = 2 &times; 21.2 &times; 100 &times; 150 / 105,600 = <b>${n2(c)} V</b>, or ${n2(c / 240 * 100)} percent.`, link,
          [`${n2(2 * 12.9 * 100 * 150 / 105600)} V uses K = 12.9, the value for copper.`, `${n2(c / 2)} V leaves out the factor of 2 for the return conductor.`, `${n2(c * R3 / 2)} V uses the three-phase multiplier.`]),
        num('A 120 V two-wire circuit carries 15 A over a one-way distance of 150 ft. What is the smallest copper conductor area that keeps the drop to 3 percent?', cm, [cm / 2, cm * 21.2 / 12.9, cm * 3.6 / 6], 'circular mils', 0,
          `Allowed drop = 0.03 &times; 120 = 3.6 V. cmil = 2 &times; K &times; I &times; L / VD = 2 &times; 12.9 &times; 15 &times; 150 / 3.6 = <b>${n0(cm)} circular mils</b>. A 10 AWG conductor has 10,380, which is too small, so 8 AWG at 16,510 is the size to use.`, C('wire-size', 'Wire Size Calculator'),
          [`${n0(cm / 2)} leaves out the factor of 2 for the return path.`, `${n0(cm * 21.2 / 12.9)} uses K = 21.2, the value for aluminum.`, `${n0(cm * 3.6 / 6)} allows a 5 percent drop, 6 V, where the question asks for 3 percent.`]),
        num('For a 3 percent drop on a 480 V three-phase feeder carrying 90 A in 2 AWG copper (66,360 circular mils), what is the longest run?', L, [Math.floor(L * R3 / 2), Math.floor(L * R3), Math.floor(L * 5 / 3)], 'ft', 0,
          `Allowed drop = 0.03 &times; 480 = 14.4 V. L = VD &times; cmil / (1.732 &times; K &times; I) = 14.4 &times; 66,360 / (1.732 &times; 12.9 &times; 90) = <b>${n0(L)} ft</b>, rounded down.`, ['charts/voltage-drop-chart.html', 'Voltage Drop Chart'],
          [`${n0(Math.floor(L * R3 / 2))} ft uses a multiplier of 2, which is for single-phase.`, `${n0(Math.floor(L * R3))} ft leaves out the 1.732.`, `${n0(Math.floor(L * 5 / 3))} ft allows a 5 percent drop where the question asks for 3 percent.`]),
        num('A 48 V DC circuit runs 25 ft, one way, in 6 AWG copper (26,240 circular mils) and carries 40 A. What is the voltage drop as a percentage?', dc / 48 * 100, [dc / 48 * 100 / 2, dc / 48 * 100 * R3 / 2, dc / 12 * 100], '%', 2,
          `VD = 2 &times; 12.9 &times; 40 &times; 25 / 26,240 = ${n2(dc)} V. As a percentage of 48 V that is <b>${n2(dc / 48 * 100)} percent</b>. The same drop in volts would be a much smaller percentage on a higher-voltage system.`, link,
          [`${n2(dc / 48 * 100 / 2)} percent leaves out the factor of 2 for the return conductor.`, `${n2(dc / 48 * 100 * R3 / 2)} percent uses 1.732, which applies only to three-phase AC.`, `${n2(dc / 12 * 100)} percent divides by 12 V, not the 48 V of this system.`]),
        con('A circuit has too much voltage drop. The conductor is replaced with one of twice the cross-sectional area. What happens to the voltage drop?',
          'It halves.', ['It falls to one quarter.', 'It is unchanged.', 'It doubles.'],
          'Voltage drop is inversely proportional to conductor area, so doubling the area <b>halves</b> the drop. In AWG terms, twice the area is three sizes larger.', ['charts/awg-wire-size-chart.html', 'AWG Wire Size Chart'],
          ['One quarter would need four times the area, six AWG sizes larger.', 'The drop depends directly on conductor resistance, which changes with area.', 'A larger conductor has less resistance, so the drop falls.']),
        con('A load is moved from 120 V to 240 V and draws the same power. With the same conductors and distance, what happens to the percentage voltage drop?',
          'It falls to one quarter.', ['It halves.', 'It is unchanged.', 'It doubles.'],
          'At twice the voltage the same power takes half the current, so the drop in volts halves. That smaller drop is then measured against twice the voltage, so as a percentage it is <b>one quarter</b>. This is the main reason long runs are fed at the highest practical voltage.', link,
          ['Halving is the change in volts dropped. As a percentage of the higher voltage it is smaller still.', 'Both the current and the base voltage change.', 'A higher voltage reduces the drop.']),
      ] });
  }

  { // 15 ------------------------------------------------ fault current
    const link = C('fault-current', 'Fault Current Calculator');
    const sc = (kva, v, z) => {
      const fla = kva * 1000 / (R3 * v), isc = fla / (z / 100);
      return num(`A ${K(kva)} kVA, ${f(v)} V three-phase transformer has an impedance of ${z} percent. Assuming an unlimited supply on the primary, what fault current is available at its secondary terminals?`, isc, [fla, fla * z, kva * 1000 / v / (z / 100)], 'A', 0,
        `Full-load current = ${f(kva * 1000)} / (1.732 &times; ${f(v)}) = ${n0(fla)} A. Fault current = full-load current / (%Z / 100) = ${n0(fla)} / ${z / 100} = <b>${n0(isc)} A</b>, about ${n1(isc / 1000)} kA.`, link,
        [`${n0(fla)} A is the full-load current. The fault current is that figure divided by the impedance.`, `${n0(fla * z)} A multiplies the full-load current by the impedance percentage where it should divide by the impedance as a fraction.`, `${n0(kva * 1000 / v / (z / 100))} A leaves out the 1.732 when finding the full-load current.`]);
    };
    const f1 = 50000 / 240, i1 = f1 / 0.025, mva = 1000 / 0.0575 / 1000, big = 1500000 / (R3 * 480) / 0.0575;
    TOPICS.push({ slug: 'fault-current-calculations', desc: '8 fault current practice questions with worked answers: available fault current from transformer kVA and percent impedance, and equipment ratings.', badge: 'kA', name: 'Fault Current Calculations',
      title: 'Fault Current Practice Questions (%Z Method)',
      blurb: 'Available fault current from transformer kVA and impedance, the infinite-bus method, and comparing it with equipment ratings.',
      intro: 'The quickest estimate of available fault current assumes the supply ahead of the transformer is unlimited, so the transformer impedance is the only thing holding the current back. It gives the highest figure the transformer could deliver, which is the safe side for choosing interrupting ratings. Every question here uses that method.',
      q: [
        sc(750, 480, 5.75), sc(2000, 480, 5.75), sc(500, 208, 4.5), sc(75, 208, 3.5),
        con('A transformer has an impedance of 5 percent. Assuming an unlimited primary supply, its secondary fault current is how many times its full-load current?',
          '20 times', ['5 times', '50 times', '95 times'],
          'The multiplier is 100 divided by the impedance percentage: 100 / 5 = <b>20 times</b>. At 4 percent it is 25 times, and at 5.75 percent about 17.4 times.', T('impedance', 'Glossary: Transformer Impedance'),
          ['5 is the impedance percentage itself, not the multiplier.', '50 would correspond to an impedance of 2 percent.', '95 comes from subtracting the impedance from 100, which has no meaning here.']),
        num('A 50 kVA, 240 V single-phase transformer has an impedance of 2.5 percent. Assuming an unlimited primary supply, what fault current is available at its secondary?', i1, [f1, i1 / R3, f1 * 2.5], 'A', 0,
          `Full-load current = 50,000 / 240 = ${n0(f1)} A. Fault current = ${n0(f1)} / 0.025 = <b>${n0(i1)} A</b>. A small transformer with low impedance can still deliver several thousand amperes.`, link,
          [`${n0(f1)} A is the full-load current, before dividing by the impedance.`, `${n0(i1 / R3)} A divides by 1.732, which does not apply to a single-phase transformer.`, `${n0(f1 * 2.5)} A multiplies by the impedance percentage where it should divide by the impedance as a fraction.`]),
        num('A 1,000 kVA transformer has an impedance of 5.75 percent. What is its short-circuit capacity in MVA, assuming an unlimited primary supply?', mva, [1000 * 5.75 / 1000, 1000 / 5.75 / 1000, mva * R3], 'MVA', 1,
          `Short-circuit MVA = transformer MVA / (%Z / 100) = 1.0 / 0.0575 = <b>${n1(mva)} MVA</b>. Working in MVA avoids the voltage and the 1.732 until the last step.`, link,
          [`${n1(5.75)} multiplies the kVA by the impedance percentage.`, `${n1(1000 / 5.75 / 1000)} divides by 5.75 where it should divide by 0.0575.`, `${n1(mva * R3)} multiplies by 1.732, which is not needed when working in MVA.`]),
        con(`A panelboard with a short-circuit current rating of 22 kA is to be connected directly to the secondary of a 1,500 kVA, 480 V transformer with 5.75 percent impedance. Is the rating adequate?`,
          `No. About ${n1(big / 1000)} kA is available, which is more than 22 kA.`,
          ['Yes, because the full-load current is under 2,000 A.', 'Yes, because 22 kA is a standard rating.', 'It cannot be determined without the load.'],
          `Full-load current = 1,500,000 / (1.732 &times; 480) = ${n0(1500000 / (R3 * 480))} A. Available fault current = ${n0(1500000 / (R3 * 480))} / 0.0575 = ${n0(big)} A, about <b>${n1(big / 1000)} kA</b>. That exceeds 22 kA, so the panelboard is not adequate at that point without a higher rating or a current-limiting device ahead of it. Conductor length between the two reduces the figure, and that has to be calculated, not assumed.`, G('guide-interrupting-rating-vs-sccr', 'Interrupting Rating vs. SCCR'),
          ['Full-load current says nothing about fault current, which is many times larger.', 'A rating being standard does not make it sufficient for a given location.', 'Fault current depends on the supply, not on the load.']),
      ] });
  }

  { // 16 ------------------------------------------------ energy, demand and efficiency
    const kwh = 75 * 24 * 30, bill = 500 * 15 + 200000 * 0.08, lf = 200000 / (500 * 720), loss = 500 / 0.96 - 500, yr = loss * 8760 * 0.10, tot = 1000 * 1.4 * 8760, btu = loss * 3412.142;
    TOPICS.push({ slug: 'energy-demand-and-efficiency', desc: '8 practice questions on energy, demand and efficiency, with worked answers: kWh, demand charges, load factor, UPS losses and their yearly cost.', badge: 'kWh', name: 'Energy, Demand and Efficiency',
      title: 'Energy, Demand & Efficiency Practice Questions',
      blurb: 'Kilowatt-hours, demand charges, load factor, UPS losses and what they cost over a year.',
      intro: 'Power is a rate and energy is that rate held over time, and an electricity bill charges for both: the kilowatt-hours used and the highest kilowatts drawn. These questions keep the two apart, then look at what a few percent of loss costs when it runs all year.',
      q: [
        num('A load draws a steady 75 kW around the clock. How much energy does it use in a 30-day month?', kwh, [75 * 30, 75 * 24, kwh / 1000], 'kWh', 0,
          `Hours = 24 &times; 30 = 720. Energy = 75 kW &times; 720 h = <b>${n0(kwh)} kWh</b>.`, C('electricity-cost', 'Electricity Cost Calculator'),
          [`${n0(75 * 30)} multiplies by days and leaves out the 24 hours in each.`, `${n0(75 * 24)} kWh is one day, not a month.`, `${n0(kwh / 1000)} is the same energy in MWh, not kWh.`]),
        con('A facility uses 200,000 kWh in a month with a peak demand of 500 kW. Energy costs $0.08 per kWh and demand costs $15 per kW. What is the bill, before taxes and fixed charges?',
          '$' + n0(bill), ['$' + n0(200000 * 0.08), '$' + n0(500 * 15), '$' + n0(200000 * 0.08 + 15)],
          `Energy charge = 200,000 &times; 0.08 = $16,000. Demand charge = 500 &times; 15 = $7,500. Total = <b>$${n0(bill)}</b>. The demand charge is nearly a third of the bill, and it is set by the single highest interval in the month.`, C('electricity-cost', 'Electricity Cost Calculator'),
          ['$16,000 is the energy charge alone, with no demand charge.', '$7,500 is the demand charge alone.', '$16,015 adds the demand rate once, without multiplying it by the 500 kW of demand.']),
        num('A facility used 200,000 kWh in a 720-hour month, with a peak demand of 500 kW. What was its load factor?', lf, [500 * 720 / 200000, 1 - lf, 500 / 720], '', 2,
          `Load factor = energy used / (peak demand &times; hours) = 200,000 / (500 &times; 720) = <b>${n2(lf)}</b>. On average the facility ran at about 56 percent of its peak. A higher load factor spreads the demand charge over more kilowatt-hours.`, C('electricity-cost', 'Electricity Cost Calculator'),
          [`${n2(500 * 720 / 200000)} is the ratio upside down. A load factor cannot exceed 1.0.`, `${n2(1 - lf)} is the unused share, one minus the load factor.`, `${n2(500 / 720)} divides demand by hours and leaves out the energy.`]),
        num('A UPS supplies a 500 kW load at an efficiency of 96 percent. How much power is lost in the UPS?', loss, [500 * 0.04, 500 * 0.96, 500 / 0.96], 'kW', 1,
          `Input = 500 / 0.96 = ${n1(500 / 0.96)} kW. Loss = input &minus; output = ${n1(500 / 0.96)} &minus; 500 = <b>${n1(loss)} kW</b>. Efficiency is output divided by input, so the loss is 4 percent of the input, not of the output.`, C('pue', 'PUE Calculator'),
          [`${n1(20)} kW takes 4 percent of the output. The loss is 4 percent of the larger input figure.`, `${n1(480)} kW multiplies the load by the efficiency, which is not a loss at all.`, `${n1(500 / 0.96)} kW is the input power, not the loss.`]),
        con(`A UPS loses ${n1(loss)} kW continuously. At $0.10 per kWh, what does that loss cost over a year?`,
          '$' + n0(yr), ['$' + n0(loss * 365 * 0.10), '$' + n0(loss * 8760), '$' + n0(yr / 10)],
          `Energy = ${n1(loss)} kW &times; 8,760 h = ${n0(loss * 8760)} kWh. Cost = ${n0(loss * 8760)} &times; 0.10 = <b>$${n0(yr)}</b> a year, before counting the cooling needed to remove that heat.`, C('electricity-cost', 'Electricity Cost Calculator'),
          [`$${n0(loss * 365 * 0.10)} multiplies by 365 days and leaves out the 24 hours in each.`, `$${n0(loss * 8760)} is the energy in kWh, not multiplied by the price.`, `$${n0(yr / 10)} is a slip of the decimal point in the price.`]),
        num('A data center has an IT load of 1,000 kW and a PUE of 1.4. How much energy does the whole facility use in a year?', tot, [1000 * 8760, 1000 * 0.4 * 8760, 1000 / 1.4 * 8760], 'kWh', 0,
          `Total power = IT power &times; PUE = 1,000 &times; 1.4 = 1,400 kW. Energy = 1,400 &times; 8,760 = <b>${n0(tot)} kWh</b>.`, C('pue', 'PUE Calculator'),
          [`${n0(8760000)} kWh is the IT load alone, with no overhead.`, `${n0(1000 * 0.4 * 8760)} kWh is the overhead alone, without the IT load.`, `${n0(1000 / 1.4 * 8760)} kWh divides by the PUE where it should multiply.`]),
        num(`A UPS loses ${n1(loss)} kW as heat. What is that in BTU per hour?`, btu, [loss * 1000, loss * 12000, loss * 3.412142], 'BTU/h', 0,
          `BTU/h = kW &times; 3,412 = ${n1(loss)} &times; 3,412 = <b>${n0(btu)} BTU/h</b>, a little under six tons of cooling. Every kilowatt lost in the electrical system has to be removed by the mechanical one.`, C('btu-to-tons', 'BTU to Tons Converter'),
          [`${n0(loss * 1000)} is the loss in watts, not BTU per hour.`, `${n0(loss * 12000)} multiplies by 12,000, which is the BTU per hour in a ton of cooling.`, `${n0(loss * 3.412142)} uses 3.412, the figure for one watt. A kilowatt is 3,412 BTU per hour.`]),
        con('Two UPS systems carry the same load. One is 94 percent efficient and the other 97 percent. How do their losses compare?',
          'The 94 percent unit loses about twice as much.', ['The 94 percent unit loses about 3 percent more.', 'They lose the same amount.', 'The 97 percent unit loses more.'],
          'Loss is roughly 100 minus the efficiency: about 6 percent against about 3 percent of the power passing through. Three points of efficiency sounds small, but it <b>halves the loss</b>, and the heat that has to be cooled away.', G('guide-ups-topologies', 'UPS Topologies'),
          ['Three points is the difference in efficiency. The losses differ by a factor of two.', 'A difference in efficiency is a difference in loss.', 'Higher efficiency means lower loss.']),
      ] });
  }

  { // 17 ------------------------------------------------ cooling load calculations
    const b50 = 50 * 3412.142, cfm = 5 * 3412.142 / (1.08 * 25), gpm = 500 * 3412.142 / (500 * 12), dT = 8 * 3412.142 / (1.08 * 1000), kwt = 150 * 3.51685, lpm = 80 / (4.186 * 10) * 60;
    TOPICS.push({ slug: 'cooling-load-calculations', desc: '8 cooling load practice questions with worked answers: kW to BTU per hour and tons, rack airflow, chilled water flow and liquid cooling flow.', badge: 'BTU', name: 'Cooling Load Calculations',
      title: 'Cooling Load Practice Questions (kW, BTU, Tons)',
      blurb: 'Kilowatts to BTU per hour and tons, airflow for a rack, chilled water flow, and liquid cooling flow in metric units.',
      intro: 'Almost every watt an IT load draws leaves the room as heat, so the cooling load starts from the electrical load. The constants do the rest: 3,412 BTU per hour in a kilowatt, 12,000 BTU per hour in a ton, 1.08 for air and 500 for water in US units. Each question gives the temperature difference it needs.',
      q: [
        num('How much heat does a 50 kW IT load reject, in BTU per hour?', b50, [50 * 3.412142, 50 * 12000, 50000 / 3.412142], 'BTU/h', 0,
          `BTU/h = kW &times; 3,412 = 50 &times; 3,412 = <b>${n0(b50)} BTU/h</b>.`, C('btu-to-tons', 'BTU to Tons Converter'),
          [`${n0(50 * 3.412142)} uses 3.412, the figure for one watt. A kilowatt is 3,412 BTU per hour.`, `${n0(600000)} multiplies kilowatts by 12,000, which is the BTU per hour in a ton.`, `${n0(50000 / 3.412142)} divides the watts by 3.412 where it should multiply.`]),
        con('A cooling load is 360,000 BTU per hour. How many tons is that?', '30 tons', ['36 tons', '105 tons', '3 tons'],
          'One ton of cooling is 12,000 BTU per hour: 360,000 / 12,000 = <b>30 tons</b>.', ['charts/cooling-load-chart.html', 'Cooling Load Chart'],
          ['36 tons divides by 10,000 where it should divide by 12,000.', '105 tons divides by 3,412, which converts BTU per hour to kilowatts, not tons.', '3 tons is a slip of the decimal point.']),
        num('A rack dissipates 5 kW, and the air passing through it rises by 25&deg;F. What airflow does it need?', cfm, [5 * 3412.142 / 25, cfm * 25 / 20, 5000 / (1.08 * 25)], 'CFM', 0,
          `CFM = BTU/h / (1.08 &times; &Delta;T) = 17,061 / (1.08 &times; 25) = <b>${n0(cfm)} CFM</b>, about ${n0(cfm / 5)} CFM per kW. A wider temperature rise needs less air.`, C('airflow-cfm', 'Airflow (CFM) Calculator'),
          [`${n0(5 * 3412.142 / 25)} CFM leaves out the 1.08 constant for air.`, `${n0(cfm * 25 / 20)} CFM uses a 20&deg;F rise where the question gives 25&deg;F.`, `${n0(5000 / (1.08 * 25))} CFM uses watts where BTU per hour are needed.`]),
        num('A rack dissipates 8 kW and receives 1,000 CFM of air. By how much does the air temperature rise across it?', dT, [8 * 3412.142 / 1000, 8000 / (1.08 * 1000), dT * 1.08 * 1.08], '&deg;F', 1,
          `&Delta;T = BTU/h / (1.08 &times; CFM) = 27,297 / (1.08 &times; 1,000) = <b>${n1(dT)}&deg;F</b>.`, C('airflow-cfm', 'Airflow (CFM) Calculator'),
          [`${n1(8 * 3412.142 / 1000)}&deg;F leaves out the 1.08 constant.`, `${n1(8000 / (1.08 * 1000))}&deg;F uses watts where BTU per hour are needed.`, `${n1(dT * 1.08 * 1.08)}&deg;F multiplies by 1.08 where it should divide.`]),
        num('Chilled water has to carry away 500 kW of heat with a 12&deg;F difference between supply and return. What flow is needed?', gpm, [500 * 3412.142 / 12 / 1000, gpm * 12 / 10, 500 * 24 / 12], 'GPM', 1,
          `BTU/h = 500 &times; 3,412 = 1,706,071. GPM = BTU/h / (500 &times; &Delta;T) = 1,706,071 / (500 &times; 12) = <b>${n1(gpm)} GPM</b>.`, C('chilled-water-flow', 'Chilled Water Flow Calculator'),
          [`${n1(500 * 3412.142 / 12 / 1000)} divides by 1,000 where the constant for water is 500.`, `${n1(gpm * 12 / 10)} GPM uses a 10&deg;F difference where the question gives 12&deg;F.`, `${n1(1000)} GPM applies the tons formula, tons &times; 24 / &Delta;T, to kilowatts.`]),
        num('A chiller is rated 150 tons. What is that in kilowatts of cooling?', kwt, [150 / 3.51685, 150 * 12, 150 * 3.412142], 'kW', 1,
          `One ton of cooling is 3.517 kW: 150 &times; 3.517 = <b>${n1(kwt)} kW</b>. This is the heat the chiller removes, not the electricity it uses.`, C('btu-to-tons', 'BTU to Tons Converter'),
          [`${n1(150 / 3.51685)} divides by 3.517 where it should multiply.`, `${n1(1800)} multiplies by 12, taken from the 12,000 BTU per hour in a ton.`, `${n1(150 * 3.412142)} uses 3.412, the BTU per hour in a watt, as though it were kilowatts per ton.`]),
        num('A liquid-cooled rack rejects 80 kW to water, which warms by 10 K as it passes through. What flow is needed, in litres per minute?', lpm, [lpm / 60, 80 / (4.186 * 10) * 10, lpm * 4.186], 'L/min', 1,
          `Mass flow = kW / (4.186 &times; &Delta;T) = 80 / (4.186 &times; 10) = ${f(80 / 41.86, 3)} kg/s. Water is close to one kilogram per litre, so that is ${f(80 / 41.86, 3)} L/s, or <b>${n1(lpm)} L/min</b>.`, C('chilled-water-flow', 'Chilled Water Flow Calculator'),
          [`${n1(lpm / 60)} is the flow in litres per second, not per minute.`, `${n1(80 / (4.186 * 10) * 10)} multiplies by 10 where there are 60 seconds in a minute.`, `${n1(lpm * 4.186)} L/min leaves out the specific heat of water, 4.186 kJ per kilogram per kelvin.`]),
        con('A cooling load of 900 tons is served by chillers of 300 tons each. How many chillers does an N+1 design install?', '4', ['3', '5', '6'],
          'N is the number needed to carry the load: 900 / 300 = 3. N+1 adds one spare, so <b>four</b> chillers are installed, and any one can be out of service.', G('guide-n-plus-1-vs-2n-redundancy', 'N+1 vs. 2N Redundancy'),
          ['Three chillers is N, with no spare.', 'Five chillers is N+2.', 'Six chillers is 2N, two complete systems.']),
      ] });
  }

  return TOPICS;
}
