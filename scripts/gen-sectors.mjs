#!/usr/bin/env node
/* Generates the power generation and grid sector pages:
 *   power-generation.html (hub) and power-generation/<slug>.html
 *
 *   node scripts/gen-sectors.mjs
 *
 * These are reference pages in the same spirit as the guides: how the plant
 * makes power, the main equipment and what a specification has to pin down,
 * the numbers worth knowing, and what is distinctive about buying and
 * shipping it. Figures are typical ranges stated as such, not data for any
 * particular machine. New slugs go into sitemap.xml, _redirects and
 * search-index.json by hand.
 */
import { page, crumbNav, write } from './lib-shell.mjs';

const DATE_ISO = '2026-11-15';
const DATE_LONG = 'November 15, 2026';
const C = (slug, name, d) => [`/calculators/${slug}.html`, name, d];

const P = [
{
  slug: 'gas-turbines', badge: 'GT', short: 'Gas turbines and combined cycle',
  h1: 'Gas Turbine and Combined-Cycle Power Plants: Equipment Reference',
  title: 'Gas Turbine & Combined-Cycle Plant Equipment Reference | Voltfield',
  desc: 'How simple-cycle and combined-cycle gas plants make power, the main equipment and what to specify, heat rate and efficiency, ambient derating, and what drives procurement.',
  card: 'Simple cycle and combined cycle, heat rate, ambient derating, and the generator-to-grid electrical chain.',
  dek: 'How a gas plant turns fuel into megawatts, what the main equipment is and what a specification has to pin down, and why a turbine makes less power on a hot afternoon.',
  intro: '<b>A gas turbine burns fuel in compressed air and expands the hot gas through a turbine that drives a generator. Run on its own that is a simple-cycle plant. Add a boiler on the exhaust and a steam turbine, and it is a combined-cycle plant that gets roughly half as much power again from the same fuel.</b> Simple-cycle units start fast and are used for peaking. Combined-cycle plants are more efficient and run for longer hours.',
  how: [
    'The measure that matters is <b>heat rate</b>: the fuel energy needed to make one kilowatt-hour, in Btu per kWh. Efficiency follows directly from it.',
    ['&eta; = 3412 / heat rate'],
    'A heat rate of 9,750 Btu/kWh is 35% efficient. A heat rate of 6,200 is 55%. Modern simple-cycle machines fall broadly between 35% and 42%, and combined-cycle plants between about 55% and a little over 60%, on a lower-heating-value basis. Always check whether a quoted heat rate is on a lower or a higher heating value basis: for natural gas the two differ by about 10%, and comparing one bidder&rsquo;s LHV figure with another&rsquo;s HHV figure is a classic error.',
    ['Fuel input (MMBtu/h) = MW &times; heat rate / 1000'],
    'A 250 MW block at 6,400 Btu/kWh burns 1,600 MMBtu of gas an hour.',
  ],
  equip: [
    ['Gas turbine', 'Compressor, combustor and turbine on one shaft. Sets the plant rating.', 'Output and heat rate at site conditions, fuel, emissions, start time, turndown'],
    ['Generator', 'Converts shaft power to electrical power, typically at 13.8 to 25 kV.', 'MVA, power factor, voltage, cooling method (air, hydrogen, water), short-circuit ratio'],
    ['Heat recovery steam generator (HRSG)', 'Boiler on the turbine exhaust in a combined cycle.', 'Pressure levels, duct firing, cycling capability'],
    ['Steam turbine', 'Expands HRSG steam for the extra output of a combined cycle.', 'Inlet conditions, condenser type, shaft arrangement'],
    ['Generator step-up transformer (GSU)', 'Raises generator voltage to transmission voltage.', 'MVA, voltage ratio, impedance, losses, cooling class, taps'],
    ['Isolated-phase bus and generator breaker', 'Carries generator current to the GSU; the breaker lets the plant be started from the grid through the GSU.', 'Continuous and momentary current, enclosure cooling'],
    ['Unit auxiliary and station service transformers', 'Feed the plant&rsquo;s own pumps, fans and controls.', 'MVA for starting the largest motor, voltage, impedance'],
    ['Excitation system and protection', 'Controls generator voltage and reactive power; protects the machine.', 'Response, limiters, grid code requirements, relay scheme'],
    ['Balance of plant', 'Fuel gas conditioning, inlet air filtration, emissions control (SCR), cooling system, black-start supply.', 'Fuel pressure, site air quality, permit limits, water availability'],
  ],
  numbers: [
    '<b>Ratings are quoted at ISO conditions:</b> 15&deg;C (59&deg;F), sea level, 60% relative humidity. A site is rarely at ISO conditions.',
    '<b>Output falls as ambient temperature rises,</b> because hot air is less dense and the compressor moves less mass. A rough guide is a fraction of a percent per degree Fahrenheit, which adds up to a double-digit loss on a very hot day. Inlet cooling recovers some of it.',
    '<b>Output falls with altitude</b> for the same reason, by roughly 3% to 4% per 1,000 ft.',
    '<b>Part-load efficiency is worse than full-load efficiency.</b> A heat rate guarantee is for a stated load point.',
    '<b>The plant consumes some of its own output.</b> Net output is gross output less auxiliary load, and guarantees should say which is meant.',
  ],
  buy: 'The turbine, the GSU transformer and the HRSG are the long-lead items and set the project schedule, so they are often ordered before the rest of the design is complete. Performance is bought on guarantees: output and heat rate at defined site conditions, proven by a performance test with agreed correction curves, with damages for a shortfall. Most owners also sign a long-term service agreement covering scheduled maintenance of the hot gas path, which over the life of the plant can cost as much as the machine. Transport is a project in itself: turbines, generators and GSUs are among the heaviest loads that move by road and rail.',
  links: [C('transformer-sizing', 'Transformer sizing', 'kVA for a load, to the next standard rating'), C('fault-current', 'Fault current', 'Available fault current at a transformer secondary'), C('generator-runtime', 'Generator runtime', 'Hours from stored fuel at a given load'), ['/guide-pad-mount-vs-gsu-transformers.html', 'Pad-mount vs. GSU transformers', 'What makes a step-up transformer different'], ['/guide-generator-sizing.html', 'Generator sizing', 'Sizing standby generators for a load'], ['/formulas.html#generation', 'Generation formulas', 'Heat rate, capacity factor, fuel input']],
  faq: [
    ['What is the difference between simple cycle and combined cycle?', 'A simple-cycle plant is a gas turbine driving a generator, with the exhaust heat released to the air. A combined-cycle plant captures that exhaust heat in a heat recovery steam generator and uses the steam to drive a second, steam turbine, which raises efficiency from roughly 35 to 42 percent to roughly 55 to 60 percent or a little more.'],
    ['What is heat rate?', 'The fuel energy a plant uses to produce one kilowatt-hour of electricity, usually in Btu per kWh. Lower is better. Efficiency equals 3,412 divided by the heat rate.'],
    ['Why does a gas turbine produce less power on a hot day?', 'A gas turbine moves a fixed volume of air. Hot air is less dense, so less mass flows through the machine and less fuel can be burned, which reduces output and worsens heat rate. High altitude has the same effect.'],
  ],
  basedOn: ['ISO 2314 and ASME PTC 22 &mdash; gas turbine acceptance and performance testing, including ISO reference conditions', 'ASME PTC 46 &mdash; overall plant performance', 'IEEE C50.13 &mdash; cylindrical-rotor synchronous generators', 'IEEE C57.116 &mdash; guide for transformers directly connected to generators'],
},
{
  slug: 'wind', badge: 'WTG', short: 'Wind power',
  h1: 'Wind Power Plants: Turbines, Collector Systems and Substations',
  title: 'Wind Farm Equipment Reference: Turbines to Substation | Voltfield',
  desc: 'How a wind plant makes power, the turbine power equation and power curve, turbine types, the collector system and substation equipment, and what makes wind logistics hard.',
  card: 'The cube law for wind, the power curve, turbine types 3 and 4, and the collector system to the substation.',
  dek: 'Why wind speed matters three times over, what is inside a turbine and between the turbines and the grid, and why the blades decide the delivery plan.',
  intro: '<b>A wind turbine converts the kinetic energy of moving air into shaft power, and a generator converts that into electricity. The power available rises with the cube of the wind speed, which is the single most important fact in wind energy.</b> Double the wind speed and there is eight times the power in it. That is why siting and hub height matter so much, and why a turbine spends most of its life well below its rating.',
  how: [
    ['P = &frac12; &times; &rho; &times; A &times; v&sup3; &times; C<sub>p</sub>'],
    'Here &rho; is air density, about 1.225 kg/m&sup3; at sea level, A is the area swept by the rotor in m&sup2;, v is wind speed in m/s, and C<sub>p</sub> is the fraction of the wind&rsquo;s power the rotor captures. C<sub>p</sub> cannot exceed 0.593, the Betz limit, and good modern rotors reach somewhat under 0.5.',
    'A rotor 150 m in diameter sweeps 17,671 m&sup2;. In an 8 m/s wind, with C<sub>p</sub> of 0.45, it captures 0.5 &times; 1.225 &times; 17,671 &times; 512 &times; 0.45, about 2.5 MW. At 10 m/s the same rotor would capture nearly twice that.',
    'Because swept area goes with the square of the diameter, a longer blade pays twice. Because of the cube law, a small error in the wind resource estimate becomes a large error in energy.',
  ],
  equip: [
    ['Rotor and blades', 'Capture the wind. Pitch control turns the blades to limit power above rated wind speed.', 'Diameter, wind class, noise and icing provisions'],
    ['Nacelle and drivetrain', 'Houses the gearbox (or a direct-drive generator), brake and yaw system.', 'Geared or direct drive, service access, condition monitoring'],
    ['Generator and converter', 'Type 3 is a doubly-fed induction generator with a partial-scale converter. Type 4 puts all the power through a full-scale converter.', 'Grid code capability: fault ride-through, reactive range, frequency response'],
    ['Tower and foundation', 'Carry the nacelle to hub height.', 'Hub height, site soil data, transport limits on section diameter'],
    ['Turbine transformer', 'Steps the generator voltage, often 690 V, up to collector voltage. In the nacelle, the tower base or on a pad.', 'kVA, voltage, impedance, fluid type, duty cycle'],
    ['Collector system', 'Underground cable circuits, typically 34.5 kV, that gather turbines into feeders.', 'Cable size and ampacity, grounding, feeder protection'],
    ['Collector substation', 'Feeder breakers, the main power transformer and the high-voltage breaker at the point of interconnection.', 'MVA, voltage, impedance, breaker ratings, relaying'],
    ['Reactive compensation', 'Capacitor banks, reactors or a STATCOM to meet voltage requirements at the interconnection.', 'Set by the interconnection study'],
    ['SCADA and met mast', 'Plant control, and measurement of the wind itself.', 'Interfaces with the grid operator'],
  ],
  numbers: [
    '<b>Cut-in wind speed</b> is roughly 3 to 4 m/s. Below it the turbine does not generate.',
    '<b>Rated wind speed</b> is roughly 11 to 13 m/s. Above it, pitch control holds output at the rating.',
    '<b>Cut-out wind speed</b> is around 25 m/s, where the turbine shuts down to protect itself.',
    '<b>Capacity factor</b> for onshore wind commonly falls between about 25% and 45% depending on the site and the machine. A 3 MW turbine at 35% produces about 9,200 MWh a year.',
    '<b>Air density matters.</b> Cold, dense air at sea level carries more power than warm air at altitude at the same speed.',
  ],
  buy: 'Turbines are bought under a turbine supply agreement, usually with a long-term service agreement and a guaranteed power curve and availability. The buyer&rsquo;s balance-of-plant scope is the foundations, collector system, substation and interconnection. Logistics shape everything: blades tens of meters long and tower sections at the limit of road clearances need route surveys, permits, escorts and sometimes road modifications, and deliveries have to be sequenced to the crane. A blade damaged in transit is expensive and slow to replace, so receiving inspection and clear records at handover matter more here than almost anywhere.',
  links: [C('voltage-drop', 'Voltage drop', 'Drop on a collector or feeder circuit'), C('transformer-sizing', 'Transformer sizing', 'kVA for a load, to the next standard rating'), C('power-factor', 'Power factor', 'kVAR needed to correct power factor'), ['/guide-grid-forming-vs-grid-following.html', 'Grid-forming vs. grid-following', 'How converter-based plants behave on the grid'], ['/guide-grid-interconnection-process.html', 'Grid interconnection process', 'Studies, queue and agreements'], ['/templates/proof-of-delivery.html', 'Proof of delivery template', 'Receiving inspection at the truck']],
  faq: [
    ['How is wind turbine power calculated?', 'Power equals one half times air density times rotor swept area times wind speed cubed times the power coefficient. With density in kg per cubic meter, area in square meters and speed in meters per second, the result is in watts.'],
    ['What is the Betz limit?', 'The theoretical maximum fraction of the wind&rsquo;s kinetic energy a rotor can extract, 16/27 or about 59.3 percent. Real turbines achieve somewhat less than 50 percent.'],
    ['What is the difference between a Type 3 and a Type 4 wind turbine?', 'A Type 3 turbine uses a doubly-fed induction generator: the stator connects directly to the grid and a converter rated at roughly a third of the machine feeds the rotor. A Type 4 turbine passes all of its power through a full-scale converter, which decouples the generator from the grid.'],
  ],
  basedOn: ['IEC 61400-1 &mdash; wind turbine design requirements and wind classes', 'IEC 61400-12-1 &mdash; power performance measurement', 'IEEE 2800 &mdash; interconnection of inverter-based resources with transmission systems'],
},
{
  slug: 'hydro', badge: 'HYD', short: 'Hydropower',
  h1: 'Hydropower Plants: Turbines, Generators and Electrical Equipment',
  title: 'Hydropower Plant Equipment Reference: Turbines & Generators | Voltfield',
  desc: 'How a hydro plant makes power from head and flow, Pelton, Francis and Kaplan turbines, low-speed generators, pumped storage, and what is distinctive about buying hydro equipment.',
  card: 'Head times flow, which turbine suits which head, slow many-pole generators, and pumped storage.',
  dek: 'Power from falling water comes down to two numbers, head and flow. They decide the turbine, the generator speed and most of what follows.',
  intro: '<b>A hydro plant converts the potential energy of water at a height into shaft power in a turbine, and then into electricity in a generator. The power depends on how far the water falls, the head, and how much of it flows.</b> Hydro units are efficient, last for generations and can change output in seconds, which makes them valuable for balancing the grid far beyond their share of energy.',
  how: [
    ['P = &eta; &times; &rho; &times; g &times; Q &times; H'],
    'With water density &rho; of 1,000 kg/m&sup3; and g of 9.81 m/s&sup2;, flow Q in m&sup3;/s and net head H in meters, this simplifies to a form worth memorizing:',
    ['P (kW) &asymp; 9.81 &times; &eta; &times; Q &times; H'],
    'A plant with 50 m&sup3;/s of flow and 100 m of net head, at an overall efficiency of 90%, produces 9.81 &times; 0.90 &times; 50 &times; 100, about 44,100 kW, or 44 MW. Net head is the gross height difference less the friction losses in the intake, tunnel and penstock, so pipe sizing is part of the power calculation.',
  ],
  equip: [
    ['Intake, gates and penstock', 'Bring water to the turbine under pressure. Gates isolate the unit.', 'Head loss, pressure rise on load rejection (water hammer)'],
    ['Pelton turbine', 'Impulse turbine: jets strike buckets on a wheel. Suits high head and low flow.', 'Head roughly above 300 m, number of jets'],
    ['Francis turbine', 'Reaction turbine with fixed runner blades. The most common type, for medium head.', 'Head roughly 30 to 500 m, runner design for the site'],
    ['Kaplan and bulb turbines', 'Propeller turbines with adjustable blades. Suit low head and high flow.', 'Head roughly below 40 m, blade and gate control'],
    ['Generator', 'Salient-pole synchronous machine, usually on a vertical shaft, turning slowly with many poles.', 'MVA, speed, inertia, voltage, thrust bearing'],
    ['Governor', 'Controls water flow to hold speed and frequency.', 'Response time against water-hammer limits'],
    ['Excitation system', 'Controls generator voltage and reactive power.', 'Static or brushless, grid code requirements'],
    ['Generator step-up transformer and switchyard', 'Raise the voltage and connect to the grid.', 'MVA, voltage, impedance; often a difficult site to deliver to'],
    ['Station service and black start', 'Auxiliary power for the plant, and the means to start with no grid.', 'Hydro units are often the designated black-start resource'],
  ],
  numbers: [
    '<b>Speed follows from frequency and poles:</b> n = 120 &times; f / p. A 60 Hz generator with 48 poles turns at 150 rpm. Slow turbines need many poles, which is why hydro generators are wide and short.',
    '<b>Turbine efficiency</b> at the design point is commonly above 90%. Overall plant efficiency, water to wire, is somewhat lower.',
    '<b>Capacity factor</b> depends on water, not on the machine. Run-of-river plants follow the river; storage plants are dispatched.',
    '<b>Pumped storage</b> uses reversible pump-turbines to move water uphill when power is cheap and generate when it is needed. Round-trip efficiency is typically around 70% to 80%.',
    '<b>Service life is long.</b> Civil works last a century or more, and generating equipment is commonly refurbished after several decades. Much of today&rsquo;s hydro procurement is rehabilitation.',
  ],
  buy: 'Hydro equipment is custom. Each runner is designed for one site&rsquo;s head and flow, often proven with a model test before manufacture, and efficiency is guaranteed and verified by a field test. Lead times are long and the supplier base is small. Rehabilitation work adds its own difficulty: new equipment has to fit embedded parts and concrete that are decades old, drawings may be incomplete, and the outage window is fixed by the river. Sites are frequently remote, with access roads, tunnels and powerhouse cranes that set hard limits on the size and weight of anything delivered, so shipping dimensions belong in the specification from the start.',
  links: [C('motor-speed', 'Speed and poles', 'Synchronous speed from frequency and pole count'), C('pump-power', 'Pump power', 'Power from flow and head'), C('pipe-velocity', 'Pipe velocity', 'Velocity from flow and diameter'), C('affinity-laws', 'Affinity laws', 'Flow, head and power against speed'), ['/formulas.html#generation', 'Generation formulas', 'Hydro power, capacity factor'], ['/templates/packing-list.html', 'Packing list template', 'Dimensions and weights per package']],
  faq: [
    ['How is hydropower calculated?', 'Power equals efficiency times water density times gravitational acceleration times flow times net head. In practical units, kilowatts are about 9.81 times efficiency times flow in cubic meters per second times head in meters.'],
    ['What is the difference between Pelton, Francis and Kaplan turbines?', 'They suit different heads. A Pelton is an impulse turbine for high head and low flow. A Francis is a reaction turbine for medium head and is the most widely used. A Kaplan is a propeller turbine with adjustable blades for low head and high flow.'],
    ['What is pumped storage hydropower?', 'A plant with an upper and a lower reservoir and reversible pump-turbines. It pumps water uphill using surplus electricity and releases it through the turbines to generate when demand is high, returning roughly 70 to 80 percent of the energy used.'],
  ],
  basedOn: ['IEC 60041 &mdash; field acceptance tests of hydraulic turbines, storage pumps and pump-turbines', 'IEC 60193 &mdash; model acceptance tests', 'IEEE C50.12 &mdash; salient-pole synchronous generators', 'IEEE 1010 &mdash; guide for control of hydroelectric power plants'],
},
{
  slug: 'nuclear', badge: 'NUC', short: 'Nuclear power',
  h1: 'Nuclear Power Plants: Electrical Systems and Equipment Qualification',
  title: 'Nuclear Plant Electrical Systems & Equipment Qualification | Voltfield',
  desc: 'How a nuclear plant makes power, PWR and BWR, the electrical systems from main generator to Class 1E safety power, and why nuclear-grade procurement is different.',
  card: 'From reactor heat to the grid, offsite and onsite power, Class 1E, and what nuclear-grade procurement requires.',
  dek: 'The turbine hall of a nuclear plant looks like any large steam plant. What sets it apart is the electrical system that must keep cooling running whatever happens, and the paperwork behind every part in it.',
  intro: '<b>A nuclear plant uses the heat of fission to make steam, and from there it is a steam power plant: turbine, generator, step-up transformer, grid.</b> The difference is that a reactor keeps producing decay heat after it is shut down, so the plant needs reliable electrical power for cooling even when it is generating none. Much of the electrical design, and nearly all of what is distinctive about procurement, follows from that requirement.',
  how: [
    'In a <b>pressurized water reactor</b> (PWR), water in the reactor circuit is kept under pressure so it does not boil, and passes its heat through steam generators to a separate circuit that drives the turbine. In a <b>boiling water reactor</b> (BWR), water boils in the reactor vessel and the steam goes directly to the turbine. Most operating reactors are one of the two.',
    'Steam conditions are modest compared with a fossil plant, so thermal efficiency is lower, typically around a third.',
    ['Electrical output = thermal power &times; efficiency'],
    'A reactor rated 3,400 MW thermal at 33% produces about 1,120 MW electrical. The rest is rejected through the condenser, which is why these plants sit beside large bodies of water or cooling towers. What nuclear plants lack in efficiency they make up in running hours: capacity factors above 90% are normal for the United States fleet.',
  ],
  equip: [
    ['Main generator', 'Large synchronous machine, often above 1,000 MVA, hydrogen and water cooled. Four-pole machines at 1,800 rpm are common because of the steam conditions.', 'MVA, voltage, cooling, excitation'],
    ['Isolated-phase bus and main transformers', 'Carry output to the switchyard, often as banks of single-phase units with a spare.', 'MVA, impedance, losses, spare strategy'],
    ['Unit auxiliary transformers', 'Feed plant loads from the generator while the unit is running.', 'MVA, impedance for motor starting and fault duty'],
    ['Startup or reserve transformers', 'Feed plant loads from the grid: the offsite power source.', 'Independent circuits from the switchyard'],
    ['Class 1E distribution', 'Safety-related switchgear, load centers and motor control centers, in redundant, physically separated divisions.', 'Qualification, separation, independence'],
    ['Emergency diesel generators', 'Onsite standby source for each safety division. Start and accept load automatically within seconds.', 'Rating for the sequenced safety loads, start reliability, fuel storage'],
    ['Station batteries and DC systems', 'Supply control power, breaker operation and vital instrumentation when AC is lost.', 'Duty cycle, capacity margin, qualification'],
    ['Vital AC inverters', 'Uninterruptible supply for reactor protection and instrumentation.', 'Redundancy, transfer behavior'],
    ['Reactor coolant and feedwater pump motors', 'Among the largest motors on site, at medium voltage.', 'Starting duty, inertia, environment'],
  ],
  numbers: [
    '<b>Class 1E</b> is the safety classification of electrical equipment essential to emergency reactor shutdown, containment isolation, core cooling and heat removal.',
    '<b>Redundancy is by division.</b> Each safety division has its own switchgear, diesel generator and battery, separated physically and electrically so that one failure cannot disable both.',
    '<b>Two offsite circuits</b> plus the onsite diesel generators is the usual basis. Loss of all of them is a station blackout, which plants are required to be able to cope with for a defined time.',
    '<b>Capacity factor</b> is typically above 90%, with refueling outages every 18 to 24 months as the main planned downtime.',
    '<b>Small modular reactors</b> are designs of up to roughly 300 MW electrical per module, intended to be factory-built. Several rely more on passive cooling and so on less safety-related AC power.',
  ],
  buy: 'Safety-related equipment is bought under a nuclear quality assurance program: in the United States, 10 CFR Part 50 Appendix B, normally implemented through ASME NQA-1. Suppliers are audited and placed on an approved list before they can be used. The equipment itself must be qualified, with documented evidence that it will perform through its service life and under accident conditions (IEEE 323) and during and after an earthquake (IEEE 344). Defects must be reportable under 10 CFR Part 21. Where no qualified supplier exists, a commercial item can be accepted through commercial-grade dedication, which verifies its critical characteristics by test and inspection. All of this means the documentation is a deliverable as real as the hardware, traceability runs to the individual part, and lead times and prices are well beyond those of the commercial equivalent. Non-safety equipment on the same site is bought much like that of any large power plant.',
  links: [C('battery-runtime', 'Battery runtime', 'Runtime from capacity and load'), C('generator-runtime', 'Generator runtime', 'Hours from stored fuel at a given load'), C('motor-start', 'Motor starting', 'Starting current and voltage dip'), ['/guide-vendor-qualification.html', 'How to qualify an equipment vendor', 'Approved lists, audits and scorecards'], ['/templates/inspection-test-plan.html', 'Inspection and test plan template', 'Hold, witness and review points'], ['/guide-n-plus-1-vs-2n-redundancy.html', 'N+1 vs. 2N redundancy', 'The same idea in data center terms']],
  faq: [
    ['What is Class 1E equipment?', 'The safety classification for electrical equipment and systems that are essential to emergency reactor shutdown, containment isolation, reactor core cooling and containment and reactor heat removal, or otherwise essential in preventing a significant release of radioactive material.'],
    ['What is the difference between a PWR and a BWR?', 'In a pressurized water reactor the water in the reactor is kept under high pressure so it does not boil, and it heats a separate circuit through steam generators. In a boiling water reactor the water boils in the reactor vessel and that steam drives the turbine directly.'],
    ['What is commercial-grade dedication?', 'A process for accepting an item that was not made under a nuclear quality assurance program for use in a safety-related application. The item&rsquo;s critical characteristics are identified and verified by inspection, testing or supplier survey, after which it is treated as a basic component.'],
  ],
  basedOn: ['10 CFR Part 50, Appendix A (General Design Criterion 17, electric power systems) and Appendix B (quality assurance criteria)', '10 CFR Part 21 &mdash; reporting of defects and noncompliance', 'ASME NQA-1 &mdash; quality assurance requirements for nuclear facility applications', 'IEEE 308, IEEE 323 and IEEE 344 &mdash; Class 1E power systems, equipment qualification and seismic qualification'],
},
{
  slug: 'transmission-substations', badge: 'T&amp;D', short: 'Transmission and substations',
  h1: 'Transmission and Substations: Equipment Reference',
  title: 'Substation & Transmission Equipment Reference | Voltfield',
  desc: 'Why power is transmitted at high voltage, what each piece of substation equipment does and what to specify, common bus arrangements, and what drives lead time.',
  card: 'Why high voltage, what each piece of substation equipment does, and the common bus arrangements.',
  dek: 'Every generator and every large load meets the grid at a substation. This is what is inside the fence, why it is arranged the way it is, and what a specification has to say.',
  intro: '<b>Transmission moves bulk power at high voltage, and substations are where voltage is changed, circuits are switched and faults are cleared.</b> A generating plant, a data center campus and a battery project all connect through one, and the substation is frequently the item that sets the project schedule, since it holds the equipment with the longest lead times.',
  how: [
    'The reason for high voltage is in two formulas. Power delivered on a three-phase line is',
    ['P = &radic;3 &times; V &times; I &times; PF'],
    'and the power lost as heat in the conductors is',
    ['P<sub>loss</sub> = 3 &times; I&sup2; &times; R'],
    'For the same power, doubling the voltage halves the current, and halving the current cuts the loss to a quarter. Moving 100 MW at 0.95 power factor takes about 4,400 A at 13.8 kV and about 440 A at 138 kV. The higher voltage needs taller structures and more insulation, and that cost is what is traded against losses when a transmission voltage is chosen.',
  ],
  equip: [
    ['Power transformer', 'Changes voltage between transmission, subtransmission and distribution levels.', 'MVA and cooling stages, voltage ratio, impedance, losses, tap changer, sound level'],
    ['Circuit breaker', 'Interrupts load and fault current. SF<sub>6</sub> gas at high voltage, vacuum at medium voltage, with SF<sub>6</sub>-free designs increasingly available.', 'Voltage, continuous current, interrupting rating, operating duty'],
    ['Disconnect switch', 'Provides a visible isolating gap for maintenance. Does not interrupt fault current.', 'Voltage, current, motor or manual operation, grounding blades'],
    ['Instrument transformers', 'Current and voltage transformers scale primary quantities for relays and meters.', 'Ratio, accuracy class, burden, relaying or metering duty'],
    ['Surge arresters', 'Clamp lightning and switching overvoltages to protect insulation.', 'Rating, continuous operating voltage, energy class, location'],
    ['Bus and structures', 'Rigid or strain bus that ties the equipment together.', 'Ampacity, short-circuit forces, clearances'],
    ['Protection and control', 'Relays that detect faults and trip breakers, plus SCADA and communications.', 'Protection scheme, redundancy, utility requirements'],
    ['Capacitor banks and reactors', 'Supply or absorb reactive power to hold voltage.', 'MVAR, switching steps, set by system studies'],
    ['Grounding grid', 'Buried conductor network that limits step and touch voltages during a fault.', 'Soil resistivity, fault current and clearing time'],
    ['Control house and DC system', 'Houses relays and the station battery that trips breakers when AC is lost.', 'Battery duty cycle, redundancy'],
  ],
  numbers: [
    '<b>Voltage classes</b> in North America: distribution up to about 35 kV, subtransmission 46 to 69 kV, transmission 115 kV to 345 kV, and extra-high voltage at 500 kV and 765 kV.',
    '<b>Bus arrangements</b> trade cost against reliability. A <b>single bus</b> is cheapest, and a bus fault or breaker maintenance takes everything out. A <b>ring bus</b> gives each circuit two breakers with one breaker per circuit overall. <b>Breaker-and-a-half</b> uses three breakers for every two circuits and is standard at large transmission stations. <b>Double bus, double breaker</b> is the most reliable and the most expensive.',
    '<b>Transformer impedance sets fault current.</b> Available fault current on the secondary is about the full-load current times 100 divided by the percent impedance.',
    '<b>Air-insulated or gas-insulated.</b> Gas-insulated switchgear takes a fraction of the land of an air-insulated yard and costs considerably more, so it is used where space is tight.',
    '<b>HVDC</b> is used for very long lines, submarine cables and ties between grids that are not synchronized.',
  ],
  buy: 'Large power transformers and high-voltage breakers are the long-lead items, and a substation schedule is built backward from their delivery dates. Transformers are evaluated on total owning cost, not price, with losses capitalized. The interconnecting utility&rsquo;s standards usually govern ratings, relay types and approved manufacturers, so obtain them before writing a specification. A large transformer ships partly disassembled and without oil, with an impact recorder, on specialized rail or road equipment under permit; it is then assembled, vacuum-filled and tested on site, which is a scope someone has to own in the order.',
  links: [C('fault-current', 'Fault current', 'Available fault current at a transformer secondary'), C('kva-to-amps', 'kVA to amps', 'Full-load current of a transformer'), C('grounding', 'Grounding', 'Grounding calculations'), ['/guide-ansi-device-numbers.html', 'ANSI device numbers', 'The relay numbers on a one-line'], ['/guide-transformer-impedance.html', 'Transformer impedance', 'What %Z means and what it sets'], ['/guide-how-to-compare-equipment-bids.html', 'How to compare equipment bids', 'Loss evaluation with A and B factors'], ['/guide-transformer-lead-times.html', 'Transformer lead times', 'Why they are long and what moves them'], ['/drawings/substation-single-line.html', 'Substation single-line diagram', 'A typical arrangement, drawn']],
  faq: [
    ['Why is electricity transmitted at high voltage?', 'For a given power, higher voltage means lower current, and line losses rise with the square of the current. Doubling the voltage halves the current and cuts the resistive loss to a quarter, which makes long-distance transmission economic.'],
    ['What is the difference between a circuit breaker and a disconnect switch?', 'A circuit breaker can interrupt load current and fault current. A disconnect switch cannot: it is opened only after the breaker has interrupted the current, to give a visible isolating gap so equipment can be worked on safely.'],
    ['What is a breaker-and-a-half scheme?', 'A substation bus arrangement with two main buses and three breakers in series between them for every two circuits, so each circuit is served by one and a half breakers. Any breaker or either bus can be taken out of service without interrupting a circuit.'],
  ],
  basedOn: ['IEEE C57.12.00 &mdash; general requirements for liquid-immersed power transformers', 'IEEE C37.04 and C37.06 &mdash; ratings for high-voltage circuit breakers', 'IEEE 80 &mdash; guide for safety in AC substation grounding', 'IEEE 605 &mdash; guide for bus design in air-insulated substations'],
},
];

function render(p) {
  const crumbs = [['Power generation and grid', 'power-generation.html'], [p.short, `power-generation/${p.slug}.html`]];
  const how = p.how.map(x => Array.isArray(x) ? `  <div class="fx-eq" role="math">${x[0]}</div>` : `  <p>${x}</p>`).join('\n');
  const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>${p.h1}</h1>
    <p class="dek">${p.dek}</p>
  </div>
</section>

<div class="artwrap secwrap">
  <p>${p.intro}</p>

  <h2 id="how">How it makes power</h2>
${how}

  <h2 id="equipment">Main equipment</h2>
  <div class="tt-wrap"><table class="reftable">
    <tr><th scope="col">Equipment</th><th scope="col">What it does</th><th scope="col">What a specification pins down</th></tr>
${p.equip.map(([a, b, c]) => `    <tr><td><b>${a}</b></td><td>${b}</td><td>${c}</td></tr>`).join('\n')}
  </table></div>

  <div class="ad-unit" data-ad="incontent"></div>

  <h2 id="numbers">Numbers worth knowing</h2>
  <ul>
${p.numbers.map(n => `    <li>${n}</li>`).join('\n')}
  </ul>

  <h2 id="buying">Buying and shipping it</h2>
  <p>${p.buy}</p>

  <h2 id="tools">Calculators, guides and templates</h2>
  <div class="gdgrid">
${p.links.map(([h, n, d]) => `    <a class="gdcard" href="${h}"><h3>${n}</h3><p>${d}</p></a>`).join('\n')}
  </div>

  <h2 id="questions">Questions</h2>
${p.faq.map(([q, a]) => `  <details class="tfaq"><summary>${q}</summary><p>${a}</p></details>`).join('\n')}

  <h2 id="sources">Scope and sources</h2>
  <p>This page is a general reference. Figures are typical ranges for orientation, not data for any particular machine or site, and nothing here replaces a manufacturer&rsquo;s data or an engineering study. It draws on:</p>
  <ul>
${p.basedOn.map(b => `    <li>${b}</li>`).join('\n')}
  </ul>
  <p class="provenance">Published ${DATE_LONG}. Other sectors: ${P.filter(o => o !== p).map(o => `<a class="inline" href="/power-generation/${o.slug}.html">${o.short.toLowerCase()}</a>`).join(', ')}. Spotted an error? <a class="inline" href="/contact.html">Tell us</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>`;
  return page({ url: `power-generation/${p.slug}.html`, title: p.title, desc: p.desc, crumbs, faq: p.faq, dateISO: DATE_ISO, css: ['/voltfield-templates.css'], body });
}

function hub() {
  const crumbs = [['Power generation and grid', 'power-generation.html']];
  const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>Power Generation and Grid: Equipment by Sector</h1>
    <p class="dek">How each kind of plant makes power, what its main equipment is, and what is different about specifying, buying and shipping it.</p>
  </div>
</section>

<div class="artwrap">
  <p><b>Every power plant ends the same way: a generator or an inverter, a step-up transformer, a breaker and a line to the grid.</b> What comes before that differs a great deal, and so do the numbers that matter, the standards that apply and the things that go wrong in procurement. Each page here covers one sector in the same order: how it makes power, the main equipment and what a specification has to pin down, the figures worth knowing, and what is distinctive about buying it.</p>

  <h2 id="generation">Generation and grid</h2>
  <div class="gdgrid">
${P.map(p => `    <a class="gdcard has-thumb" href="/power-generation/${p.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${p.badge}</span><h3>${p.short}</h3><p>${p.card}</p></a>`).join('\n')}
  </div>

  <h2 id="more">Also on Voltfield</h2>
  <div class="gdgrid">
    <a class="gdcard" href="/renewables.html"><h3>Solar and hybrid plants</h3><p>Modules, inverters, trackers and balance of system.</p></a>
    <a class="gdcard" href="/battery-storage.html"><h3>Battery storage</h3><p>DC blocks, power conversion, BMS and fire safety.</p></a>
    <a class="gdcard" href="/data-centers.html"><h3>Data centers</h3><p>Transformers, switchgear, UPS, generators and cooling.</p></a>
  </div>

  <h2 id="common">What they have in common</h2>
  <ul>
    <li><b>The formulas.</b> Heat rate, capacity factor, wind and hydro power are in the <a class="inline" href="/formulas.html#generation">formula reference</a>.</li>
    <li><b>The drawings.</b> Typical single-line diagrams for a substation, a solar plant and a battery plant are in the <a class="inline" href="/drawings.html">drawings library</a>.</li>
    <li><b>The paperwork.</b> A request for quotation, a bid tabulation, a purchase order and the rest are in the <a class="inline" href="/templates.html">templates</a>.</li>
    <li><b>The connection.</b> Every one of these plants goes through the <a class="inline" href="/guide-grid-interconnection-process.html">interconnection process</a>.</li>
  </ul>
  <p class="provenance">Published ${DATE_LONG}. A sector missing? <a class="inline" href="/contact.html">Tell us which</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>`;
  return page({ url: 'power-generation.html', title: 'Power Generation & Grid Equipment by Sector | Voltfield',
    desc: 'Equipment references for gas turbine and combined-cycle plants, wind, hydropower, nuclear, and transmission and substations: how each makes power and what to specify.',
    crumbs, dateISO: DATE_ISO, css: ['/voltfield-templates.css'], body });
}

for (const p of P) write(`power-generation/${p.slug}.html`, render(p));
write('power-generation.html', hub());
