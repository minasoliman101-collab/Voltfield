#!/usr/bin/env node
/*
 * Stamps a guide page from an existing one, so the chrome, head boilerplate,
 * nav, share bar, email form and footer are byte-identical to a page already
 * known good.
 *
 * WHY THIS EXISTS: the 33 guides were hand-authored, with helper scripts
 * (add-guide-provenance, add-guide-category-links, add-guide-photos) run over
 * them afterwards. That works, but writing a 325-line file by hand to add one
 * guide invites exactly the drift those helpers were written to repair. This
 * takes the content and leaves everything structural alone.
 *
 * It replaces only well-delimited regions: the head metas, the JSON-LD graph,
 * the banner, key takeaways, the on-this-page list, the body, next steps, the
 * citation line, the signup form's source field, and the provenance block.
 * Everything else in TEMPLATE is copied through untouched.
 *
 * Run from the repo root:  node scripts/gen-guides.mjs
 *
 * NOT a replacement for the helper scripts. add-guide-photos.mjs still owns the
 * policy on which guides get a picture; the specs here name one explicitly, and
 * a guide with nothing honest to show should set photo: null.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const TEMPLATE = 'guide-grid-forming-vs-grid-following.html';
const DATE_ISO = '2026-11-03';
const DATE_LONG = 'November 3, 2026';

/* ---------------------------------------------------------------- specs ---- */

const GUIDES = [
{
  slug: 'guide-delta-vs-wye',
  eyebrow: 'Transformers',
  crumb: 'Delta vs. Wye',
  h1: 'Delta vs. Wye: Three-Phase Connections Explained',
  title: 'Delta vs. Wye Connections Explained',
  headline: 'Delta vs. Wye: Voltage, Neutrals, Harmonics and the 30-Degree Shift',
  dek: 'Two ways to connect three windings, and almost every practical difference in a three-phase system follows from which one you picked: whether you have a neutral, what your line-to-ground voltage is, where harmonics go, and whether two transformers can be paralleled at all.',
  description: 'Delta vs. wye three-phase connections explained: line and phase voltage, the square root of three, neutrals and grounding, triplen harmonics, Dyn11 vector groups and the 30-degree shift.',
  ogDesc: 'Line and phase voltage, neutrals and grounding, triplen harmonics, and why vector group decides whether two transformers can be paralleled.',
  keywords: 'delta vs wye, wye vs delta, three phase connections, delta wye transformer, Dyn11, vector group, line voltage phase voltage, triplen harmonics, 480Y 277',
  photo: { src: 'images/parts/dc-dry-type-cast-resin-transformers', alt: 'A dry-type cast-resin transformer', caption: 'Dry-type transformer (illustration)' },
  takeaways: [
    'In delta, line voltage equals winding voltage and line current is the square root of three times winding current. In wye it is the other way round.',
    'Wye gives you a neutral and a ground reference. Delta gives you neither, which is why a delta system needs a deliberate grounding scheme.',
    'Triplen harmonics circulate inside a delta winding and add up in a wye neutral. That decides whether the neutral needs oversizing.',
    'A delta-wye transformer shifts phase by 30 degrees. Two transformers cannot be paralleled unless their vector groups match.',
  ],
  sections: [
    { id: 'the-two-connections', h2: 'The two connections', html: `
  <p>Three-phase equipment has three windings. There are only two useful ways to join them. Connect each winding end-to-end in a closed triangle and you have a <b>delta</b>. Connect one end of each to a common point and you have a <b>wye</b>, also called a star. Everything else follows from that choice.</p>
  <p>The arithmetic matters because it is where most mistakes start. In a delta, each winding sees the full line-to-line voltage, so winding voltage and line voltage are the same number &mdash; but the line current splits between two windings, so line current is 1.732 times the winding current. In a wye, each winding sees line-to-neutral voltage, so line voltage is 1.732 times winding voltage, while line current passes straight through one winding and the two are equal.</p>` },
    { id: 'neutrals-and-grounding', h2: 'Neutrals and grounding', html: `
  <p>This is the difference that shows up on a drawing. A wye has a physical fourth point, and bringing it out gives you a neutral: 480Y/277 V means 480 V between any two phases and 277 V from any phase to neutral, which is where the lighting circuits come from. A 480 V delta has three wires and no neutral at all, so there is no line-to-neutral voltage to use and nothing to reference ground to.</p>
  <p>That absence has to be dealt with deliberately. A delta system is either left ungrounded, corner-grounded on one phase, or given an artificial neutral with a zig-zag or wye-delta grounding transformer. Ungrounded delta keeps running through a first ground fault, which is why it survived in process plants &mdash; and also why the second fault is the one that takes the plant down. The wye neutral, bonded once at the service, is what makes ground-fault current large enough and predictable enough for a protective device to see.</p>` },
    { id: 'harmonics-and-the-neutral', h2: 'Harmonics and the neutral', html: `
  <p>Third-harmonic currents, and their odd multiples, are in phase with each other across all three phases. They are called triplen harmonics, and they behave very differently in the two connections.</p>
  <p>In a wye with a neutral, triplens do not cancel. They add. A four-wire wye feeding a floor of switch-mode power supplies can carry more current in the neutral than in any phase, which is why NEC 220.61 stops allowing a reduced neutral once the load is largely non-linear, and why data-center panelboards are specified with a 200 percent neutral.</p>
  <p>In a delta there is nowhere for them to go, so they circulate inside the closed triangle instead of travelling upstream. That is the real reason distribution transformers are usually delta on the primary: the delta winding keeps the triplens generated downstream out of the utility's system.</p>` },
    { id: 'vector-groups-and-the-30-degree-shift', h2: 'Vector groups and the 30-degree shift', html: `
  <p>A delta-wye transformer does not just change voltage. It rotates the phase relationship by 30 degrees. That is not a defect and cannot be designed out; it is a consequence of referencing a line-to-line winding on one side and a line-to-neutral winding on the other.</p>
  <p>The nameplate records it as a vector group: Dyn11 means a delta primary, a wye secondary with the neutral brought out, and the secondary lagging the primary by 30 degrees. The number is a clock position, not a count. Dy1 and Dy11 are both delta-wye and they are 60 degrees apart.</p>
  <p>The practical consequence is paralleling. Two transformers can share a bus only if their vector groups match. Put a Dyn11 in parallel with a Dyn1 and the 60-degree difference drives circulating current between them with no load connected at all. This is the single most expensive thing on this page to get wrong, and it is a nameplate check, not a calculation.</p>` },
    { id: 'where-each-one-is-used', h2: 'Where each one is used', html: `
  <table class="reftable">
    <tr><th scope="col">Delta</th><th scope="col">Wye</th></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Neutral available</td></tr>
    <tr><td>No</td><td>Yes, if the star point is brought out</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Line vs winding voltage</td></tr>
    <tr><td>Equal</td><td>Line is 1.732 &times; winding</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Line vs winding current</td></tr>
    <tr><td>Line is 1.732 &times; winding</td><td>Equal</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Triplen harmonics</td></tr>
    <tr><td>Circulate within the winding</td><td>Add in the neutral</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Typically used for</td></tr>
    <tr><td>Transformer primaries, motor windings, generator stators where no neutral is wanted</td><td>Distribution secondaries, anywhere single-phase loads or a ground reference are needed</td></tr>
  </table>
  <p>The common distribution transformer is delta on the primary and wye on the secondary for both reasons at once: the delta keeps downstream harmonics contained, and the wye secondary provides the neutral and the ground reference the premises wiring needs.</p>
  <p>One variant worth knowing: an <b>open delta</b> runs on two transformers instead of three. It will deliver three-phase power, but only about 57.7 percent of the capacity the same two units would give in another configuration, and with unbalanced regulation. It exists as a way to restore service after a unit fails, not as a design.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Expecting a neutral on a delta.</b> There is no line-to-neutral voltage on a three-wire delta. A 480 V delta cannot feed a 277 V load, whatever the panel schedule says.</li>
    <li><b>Paralleling across vector groups.</b> Dyn1 and Dyn11 look interchangeable on a one-line and are 60 degrees apart. Check the nameplate before the bus is tied.</li>
    <li><b>Reducing the neutral on a four-wire wye.</b> Fine on linear load, wrong on non-linear load, where triplens can push neutral current above phase current.</li>
    <li><b>Applying the square root of three in the wrong place.</b> It belongs on voltage in a wye and on current in a delta. Using it on both, or neither, is the usual source of an answer off by 73 percent.</li>
    <li><b>Treating an ungrounded delta as safe because it rides through a fault.</b> It rides through the first one. The point of a ground-detection scheme is to find it before the second.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is the main difference between delta and wye?', a: 'A delta joins three windings in a closed triangle with no common point, so there is no neutral. A wye joins one end of each winding to a common star point, which can be brought out as a neutral and used as a ground reference. Delta has line voltage equal to winding voltage; wye has line voltage 1.732 times winding voltage.' },
    { q: 'Does a delta system have a neutral?', a: 'No. A three-wire delta has no neutral and no line-to-neutral voltage. If a ground reference is needed, it has to be created deliberately &mdash; by corner-grounding one phase, or by adding a zig-zag or wye-delta grounding transformer to derive an artificial neutral.' },
    { q: 'Why are distribution transformers usually delta-wye?', a: 'Two reasons at once. The delta primary keeps triplen harmonics generated downstream circulating inside the winding instead of passing into the utility system. The wye secondary provides the neutral that single-phase loads need and the ground reference that makes ground-fault protection work.' },
    { q: 'Can I parallel a delta-wye transformer with a wye-wye one?', a: 'No. A delta-wye connection shifts phase by 30 degrees and a wye-wye does not, so paralleling them drives circulating current between the two units with no load connected. Transformers can only be paralleled when their vector groups match, which is a nameplate check rather than a calculation.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/transformers.html">data center transformers</a> reference covers the families this applies to, and <a class="inline" href="guide-transformer-nameplate.html">how to read a transformer nameplate</a> covers where the vector group is written.',
  calcs: [
    ['calculators/kva-to-amps.html', 'kVA to Amps Calculator', 'Full-load amps on either winding, with no power factor term.'],
    ['calculators/transformer-sizing.html', 'Transformer Sizing Calculator', 'A kW load to the kVA rating and the nearest standard nameplate.'],
  ],
  guides: [
    ['guide-transformer-nameplate.html', 'How to Read a Transformer Nameplate'],
    ['guide-grounding-bonding-basics.html', 'Grounding &amp; Bonding Basics'],
    ['guide-harmonics-ieee-519.html', 'Harmonics &amp; IEEE 519 Limits'],
    ['guide-pad-mount-vs-gsu-transformers.html', 'Pad-Mount vs. GSU Transformers'],
  ],
  covers: 'How delta and wye connections differ, the relationship between line and winding voltage and current, what a neutral gives you and what a delta system needs instead, how triplen harmonics behave in each, vector groups and the 30-degree shift, and why vector group governs paralleling.',
  basedOn: ['ANSI/IEEE C57.12.00 &mdash; general requirements for liquid-immersed distribution and power transformers', 'ANSI/IEEE C57.12.70 &mdash; terminal markings and connections', 'IEC 60076-1 &mdash; power transformers, general, for vector group notation', 'NEC Article 250 for grounding and bonding, and NEC 220.61 for neutral load'],
  notThis: 'A transformer specification or a protection study. Grounding scheme selection depends on the system, the loads and the local authority, and paralleling requires checking impedance and tap range as well as vector group.',
},

{
  slug: 'guide-ground-vs-neutral',
  eyebrow: 'Grounding',
  crumb: 'Ground vs. Neutral',
  h1: 'Ground vs. Neutral: Why They Bond Once and Never Again',
  title: 'Ground vs. Neutral Explained',
  headline: 'Ground vs. Neutral: One Bonding Point, and What Goes Wrong With Two',
  dek: 'They are tied together at the service, which is why they get confused, and they must not be tied anywhere else. The neutral carries load current every second the system runs. The equipment grounding conductor carries current only when something has already gone wrong.',
  description: 'Ground vs. neutral explained: the grounded conductor against the equipment grounding conductor, the single bonding point at the service, why a second bond is dangerous, separately derived systems and subpanels.',
  ogDesc: 'The grounded conductor against the equipment grounding conductor, the single bonding point, and what a second bond actually does.',
  keywords: 'ground vs neutral, neutral vs ground, equipment grounding conductor, grounded conductor, main bonding jumper, NEC 250.24, subpanel neutral ground, separately derived system, objectionable current',
  photo: { src: 'images/parts/dc-ground-bars-kits', alt: 'A ground bar and bonding kit', caption: 'Ground bar and bonding kit (illustration)' },
  takeaways: [
    'The neutral is a circuit conductor that carries load current continuously. The equipment grounding conductor carries current only during a fault.',
    'They are bonded at exactly one point: the main bonding jumper at the service disconnect, or at each separately derived system.',
    'A second bond puts normal neutral current onto equipment enclosures and onto every parallel metallic path in the building.',
    'The ground rod does not clear faults. The equipment grounding conductor does. Earth is far too poor a conductor to open a breaker.',
  ],
  sections: [
    { id: 'two-conductors-two-jobs', h2: 'Two conductors, two jobs', html: `
  <p>The <b>neutral</b> &mdash; the code calls it the grounded conductor &mdash; is part of the circuit. On a single-phase branch circuit it returns every amp the load draws. It is insulated, it is sized for load, and it is expected to have current on it whenever anything is switched on.</p>
  <p>The <b>equipment grounding conductor</b>, or EGC, is not part of the circuit. In normal operation it carries nothing. Its one job is to give fault current a deliberate low-impedance path back to the source so that enough current flows to open the overcurrent device quickly, and to hold every metal enclosure it touches at the same potential while that happens.</p>
  <p>They are sized by different rules for that reason. The neutral is sized from load, under NEC 220.61. The EGC is sized from the rating of the overcurrent device ahead of it, under NEC 250.122, because what it has to survive is the fault, not the load.</p>` },
    { id: 'the-single-bonding-point', h2: 'The single bonding point', html: `
  <p>At the service disconnect the two are deliberately connected, by the main bonding jumper, under NEC 250.24 and 250.28. That connection is what makes a line-to-enclosure fault into a line-to-neutral fault electrically, which is what makes the fault current large enough for a breaker to see.</p>
  <p>It happens once. A separately derived system &mdash; most commonly a transformer secondary, also a generator with a switched neutral &mdash; gets its own bond at the transformer or at the first disconnect, under NEC 250.30, because it is a new source with its own neutral. One source, one bonding point.</p>` },
    { id: 'what-a-second-bond-does', h2: 'What a second bond actually does', html: `
  <p>Bond neutral to ground a second time &mdash; typically by leaving the bonding screw in a subpanel &mdash; and the neutral now has two paths back to the source: its own conductor, and the EGC. Current divides between them by impedance, so a share of normal load current flows on the EGC from that moment on.</p>
  <p>That has four consequences, and none of them announce themselves:</p>
  <ul>
    <li><b>Enclosures carry current.</b> Conduit, panel cans, equipment frames and any bonded metal in the path become current-carrying parts under normal conditions.</li>
    <li><b>Ground-fault protection stops working properly.</b> A GFCI or a GFP scheme measures the difference between outgoing and returning current. Neutral current on the EGC is exactly the imbalance it is built to trip on, so it either trips for no reason or has its margin quietly eaten.</li>
    <li><b>The fault path is no longer predictable.</b> The thing the EGC exists for &mdash; a known low impedance back to the source &mdash; now shares its path with load current.</li>
    <li><b>It is hard to find.</b> Everything works. Lights come on, loads run, and nothing fails until someone measures current on a ground conductor or a GFCI starts tripping on a circuit with nothing wrong with it.</li>
  </ul>
  <p>NEC 250.6 names this directly as objectionable current over grounding conductors, and requires the arrangement to be altered to stop it.</p>` },
    { id: 'subpanels', h2: 'Subpanels', html: `
  <p>A subpanel is where this goes wrong most often, because a panelboard ships ready to be a service panel. It arrives with a bonding screw or strap that ties the neutral bar to the can, which is correct in exactly one place and wrong everywhere else.</p>
  <p>Fed as a subpanel, the panel needs four wires &mdash; two or three ungrounded conductors, a neutral and an EGC &mdash; the neutral bar isolated from the enclosure, a separate ground bar bonded to the enclosure, and that bonding screw removed. Neutrals land on the isolated bar, grounds land on the bonded bar, and the two never touch again downstream of the service.</p>` },
    { id: 'the-ground-rod-does-not-clear-faults', h2: 'The ground rod does not clear faults', html: `
  <p>This is the most persistent misunderstanding in the subject, and it is worth being blunt about. A driven ground rod might present 25 ohms to earth on a good day. At 120 V that is under 5 amps &mdash; nowhere near enough to open a 20 A breaker, and quite enough to kill someone. Earth is not a fault-clearing path.</p>
  <p>The grounding electrode system exists for different reasons: to reference the system to earth so its voltage to ground is defined, to give lightning and switching surges somewhere to go, and to limit the voltage imposed by a higher-voltage line contacting a lower-voltage one. Clearing faults is the EGC's job, through metal, back to the source, every time.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Leaving the bonding screw in a subpanel.</b> The default state of a new panelboard, and wrong anywhere but the service.</li>
    <li><b>Using the EGC as a neutral.</b> Running a three-wire feeder to a subpanel and landing neutrals on the ground bar is the same fault with extra steps.</li>
    <li><b>Assuming a ground rod protects anything.</b> It does not clear faults and never did.</li>
    <li><b>Sizing the EGC from load.</b> It is sized from the overcurrent device, under NEC 250.122, because the fault is what it has to carry.</li>
    <li><b>Treating a generator as always separately derived.</b> It depends on whether the neutral is switched. A generator with a solid neutral is not an SDS, and bonding it as one creates the second bond.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is the difference between ground and neutral?', a: 'The neutral is a circuit conductor that carries load current back to the source whenever the load is on. The equipment grounding conductor carries no current in normal operation; it exists to give fault current a low-impedance path back to the source so the overcurrent device opens, and to keep metal enclosures at the same potential. They are sized by different rules because one carries load and the other carries faults.' },
    { q: 'Can neutral and ground be connected in a subpanel?', a: 'No. They are bonded at exactly one point, the main bonding jumper at the service disconnect, or at each separately derived system such as a transformer secondary. Bonding them again in a subpanel puts normal load current onto the equipment grounding conductor and onto every bonded metal enclosure in that path, and interferes with ground-fault protection. NEC 250.6 calls this objectionable current and requires it to be corrected.' },
    { q: 'Why is the neutral bonded to ground at all?', a: 'Because that bond is what turns a line-to-enclosure fault into a line-to-neutral fault electrically. Without it, a fault to a metal enclosure would not draw enough current to open the breaker, and the enclosure would simply sit energized. The single bond is what makes overcurrent protection work for ground faults.' },
    { q: 'Does a ground rod clear a fault?', a: 'No. A driven rod may present around 25 ohms to earth, which at 120 V passes only a few amps &mdash; far too little to open a 20 A breaker and more than enough to be lethal. Faults are cleared by the equipment grounding conductor back through metal to the source. The electrode system exists to reference the system to earth and to handle surges.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/grounding-bonding.html">grounding and bonding</a> reference covers the hardware, and <a class="inline" href="guide-ground-fault-protection.html">ground-fault protection</a> covers what the EGC makes possible.',
  calcs: [
    ['calculators/grounding.html', 'Ground Rod Resistance Calculator', 'Resistance to earth from soil resistivity and rod length.'],
    ['calculators/fault-current.html', 'Available Fault Current Calculator', 'The current the EGC has to carry at a transformer secondary.'],
  ],
  guides: [
    ['guide-grounding-bonding-basics.html', 'Grounding &amp; Bonding Basics'],
    ['guide-ground-fault-protection.html', 'Ground-Fault Protection &amp; NEC 230.95'],
    ['guide-arc-flash-boundary-basics.html', 'Arc-Flash Boundary Basics'],
    ['guide-delta-vs-wye.html', 'Delta vs. Wye Connections'],
  ],
  covers: 'The difference between the grounded conductor and the equipment grounding conductor, why they are bonded at exactly one point, what a second bond does to enclosures and to ground-fault protection, how subpanels and separately derived systems are handled, and why the grounding electrode is not a fault-clearing path.',
  basedOn: ['NEC Article 250, in particular 250.6, 250.24, 250.28, 250.30 and 250.122', 'NEC 220.61 for neutral load calculation', 'IEEE Std 142 (the Green Book) &mdash; grounding of industrial and commercial power systems'],
  notThis: 'A design or an inspection. Grounding requirements are enforced by the local authority having jurisdiction, system grounding arrangements vary, and the code edition in force where you are may differ from the sections cited.',
},

{
  slug: 'guide-fuse-vs-breaker',
  eyebrow: 'Protection',
  crumb: 'Fuse vs. Breaker',
  h1: 'Fuse vs. Circuit Breaker: Clearing Time, Let-Through and Coordination',
  title: 'Fuse vs. Circuit Breaker Compared',
  headline: 'Fuse vs. Circuit Breaker: Clearing Time, Let-Through Energy and Coordination',
  dek: 'Both interrupt a fault. They do it on different timescales, pass different amounts of energy to whatever is downstream, and coordinate with each other by completely different rules. The resettable one is not simply the better one.',
  description: 'Fuse vs. circuit breaker compared: clearing time and current limitation, let-through energy and arc-flash incident energy, selective coordination by ratio against time-current curves, single-phasing, and series ratings.',
  ogDesc: 'Clearing time and current limitation, let-through energy, selective coordination, single-phasing, and where series ratings apply.',
  keywords: 'fuse vs circuit breaker, current limiting fuse, let through energy, selective coordination, series rating, interrupting rating, AIC, single phasing, UL 248, UL 489',
  photo: { src: 'images/parts/dc-air-circuit-breakers', alt: 'A low-voltage air circuit breaker', caption: 'Air circuit breaker (illustration)' },
  takeaways: [
    'A current-limiting fuse can clear inside a quarter cycle. A breaker has a mechanism to move, so it needs cycles.',
    'That difference shows up as let-through energy, which sets what downstream equipment has to withstand and drives arc-flash incident energy.',
    'Fuses coordinate by ampere ratio, commonly 2:1. Breakers coordinate by overlaying time-current curves, and often do not coordinate at all at high fault current.',
    'A fuse opens one phase. A breaker opens all poles. On a three-phase motor that distinction can destroy the motor.',
  ],
  sections: [
    { id: 'how-each-one-interrupts', h2: 'How each one interrupts', html: `
  <p>A fuse is a calibrated conductor in a sand-filled barrel. Fault current heats the element until it melts and vaporizes, the filler quenches the arc, and the circuit is open. There is no mechanism, nothing to maintain, and nothing to reset. A <b>current-limiting</b> fuse is built so that this happens before the first half cycle has peaked, which means the fault current never reaches the value the system could have delivered.</p>
  <p>A circuit breaker senses the fault and then operates a mechanism: contacts part, an arc draws across them, and arc chutes cool and extinguish it, usually at the next current zero. Even a fast breaker therefore needs something on the order of one and a half to three cycles to clear, and a breaker with an intentional short delay for coordination needs considerably more.</p>` },
    { id: 'let-through-energy', h2: 'Let-through energy', html: `
  <p>Clearing time is not an academic figure. Energy passed into a fault goes as current squared times time, and the equipment downstream has to survive it. A current-limiting fuse clearing in a quarter cycle passes a small fraction of the energy a breaker clearing in three cycles does, against the same available fault current.</p>
  <p>Two things follow. The first is equipment withstand: a low let-through is what makes a series rating possible, where a downstream device is applied above its own interrupting rating because an upstream current-limiting device will clear first. The second is arc flash. Incident energy in IEEE 1584 scales with duration, so a quarter-cycle clearing device can put a working distance into a far lower PPE category than a breaker on the same bus.</p>` },
    { id: 'interrupting-rating', h2: 'Interrupting rating', html: `
  <p>NEC 110.9 requires any device intended to interrupt a fault to have an interrupting rating at least equal to the available fault current at its terminals. The two technologies sit in different places on that scale.</p>
  <p>Current-limiting fuses are readily available at 200 to 300 kA. Molded-case breakers typically run 10 to 65 kA depending on the frame and the interrupting class, and reaching higher usually means either a more expensive frame or a tested series combination with an upstream device.</p>
  <p>The series rating is where this gets misapplied. A series combination is only valid as tested and as marked on the equipment: a specific upstream device with a specific downstream one. Substituting a same-ampere fuse of a different class, or a different breaker of the same frame size, voids it, and nothing on the installation will look different afterwards.</p>` },
    { id: 'selective-coordination', h2: 'Selective coordination', html: `
  <p>Selective coordination means the device nearest the fault opens and nothing upstream does. The two technologies achieve it in ways that are not interchangeable.</p>
  <p>Fuses of the same class coordinate by ampere ratio. For many classes a 2:1 ratio between upstream and downstream ratings is selective across the whole range, including the instantaneous region, and the manufacturer's ratio tables are the authority.</p>
  <p>Breakers coordinate by time-current curve. In the overload region that usually works. In the instantaneous region it often does not: both devices see the same current and both trip, which is why coordination studies so often end up specifying zone-selective interlocking, short-time delay with no instantaneous, or a current-limiting fuse upstream after all.</p>
  <p>This matters more than a preference because NEC 700.32, 701.32 and 708.54 require selective coordination for emergency systems, legally required standby and critical operations power systems. Those are design requirements, not recommendations.</p>` },
    { id: 'single-phasing-and-practicalities', h2: 'Single-phasing and practicalities', html: `
  <table class="reftable">
    <tr><th scope="col">Fuse</th><th scope="col">Circuit breaker</th></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">After operating</td></tr>
    <tr><td>Replaced; the element is consumed</td><td>Reset; the device is reused</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Typical clearing time at high fault current</td></tr>
    <tr><td>Under a quarter cycle if current-limiting</td><td>Roughly 1.5 to 3 cycles, more with intentional delay</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Poles opened</td></tr>
    <tr><td>Only the phase that faulted</td><td>All poles together</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Adjustability</td></tr>
    <tr><td>None; characteristic is fixed by class and rating</td><td>Electronic trip units adjust pickup and delay</td></tr>
    <tr><td colspan="2" style="background:var(--sunk);font-weight:600;color:var(--ink)">Coordination method</td></tr>
    <tr><td>Ampere ratio from the manufacturer's tables</td><td>Overlaid time-current curves</td></tr>
  </table>
  <p>The single-phasing difference deserves its own note. A fuse protects one phase, so on a three-phase fault it may be the only one that opens. A three-phase induction motor left running on two phases draws heavily unbalanced current and can overheat and fail, which is why motor circuits pair fuses with an overload relay that opens all three poles rather than relying on the fuses alone.</p>
  <p>The operational trade is mundane but real. Fuses need the right class and rating in stock, and someone who will fit the right one at two in the morning rather than whatever is in the van. Breakers avoid that, and in exchange need periodic exercise, testing and eventually maintenance, because a mechanism that has not moved in fifteen years is not a mechanism anyone should rely on.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Substituting a non-current-limiting fuse of the same ampere rating.</b> It fits, it carries load, and it silently voids the series rating that made the downstream device legal.</li>
    <li><b>Coordinating breakers by ampere ratio.</b> That is the fuse rule. Breakers coordinate by curve overlay, and two breakers in a 2:1 ratio commonly both trip on a close-in fault.</li>
    <li><b>Ignoring single-phasing on motor circuits.</b> Fuses alone do not open all three poles.</li>
    <li><b>Treating interrupting rating as a nameplate formality.</b> NEC 110.9 is a requirement, and applying a 10 kA device where 22 kA is available is a failure waiting for the fault.</li>
    <li><b>Adding short-time delay for coordination without rechecking arc flash.</b> Delay is duration, and duration is incident energy. Coordination and arc-flash mitigation pull in opposite directions and have to be settled together.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'Which is better, a fuse or a circuit breaker?', a: 'Neither in general. A current-limiting fuse clears faster, passes far less energy downstream, reaches much higher interrupting ratings and coordinates by a simple ampere ratio. A breaker is resettable, opens all poles together, and can be adjusted. The right choice depends on available fault current, whether selective coordination is required, arc-flash exposure, and how the installation will be operated and maintained.' },
    { q: 'What does current-limiting mean?', a: 'A current-limiting fuse clears so quickly, inside the first half cycle, that the fault current never reaches the peak the system could have delivered. That caps the energy passed to downstream equipment, which is what makes series ratings possible and what can substantially reduce arc-flash incident energy.' },
    { q: 'Why does a fuse single-phase a motor?', a: 'A fuse protects one phase, so it may be the only one of three that opens. A three-phase induction motor then runs on two phases, drawing heavily unbalanced current, and can overheat and fail. Motor circuits pair fuses with an overload relay that opens all three poles rather than relying on the fuses to do it.' },
    { q: 'Can I use a breaker above its interrupting rating?', a: 'Only as part of a tested and marked series combination with a specific upstream device, which is usually a current-limiting fuse that clears before the downstream breaker is exposed to the full fault. The combination is valid only as tested; substituting a different fuse class or breaker voids it, and nothing about the installation will look different afterwards.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/switchgear-components.html">switchgear components</a> reference covers the devices themselves, and <a class="inline" href="guide-short-circuit-studies-breaker-coordination.html">short-circuit studies and coordination</a> covers the study this feeds.',
  calcs: [
    ['calculators/fault-current.html', 'Available Fault Current Calculator', 'What the device has to interrupt, from kVA, voltage and %Z.'],
    ['calculators/arc-flash.html', 'Arc-Flash Incident Energy Calculator', 'How clearing time drives incident energy at a working distance.'],
  ],
  guides: [
    ['guide-short-circuit-studies-breaker-coordination.html', 'Short-Circuit Studies &amp; Coordination'],
    ['guide-fully-rated-vs-series-rated.html', 'Fully Rated vs. Series Rated Breakers'],
    ['guide-arc-flash-ppe-categories.html', 'Arc-Flash PPE Categories'],
    ['guide-transformer-impedance.html', 'Transformer Impedance (%Z)'],
  ],
  covers: 'How fuses and circuit breakers interrupt a fault, the clearing times involved, let-through energy and what it means for equipment withstand and arc flash, interrupting and series ratings, the two different approaches to selective coordination, and single-phasing on motor circuits.',
  basedOn: ['UL 248 for fuses and UL 489 for molded-case circuit breakers', 'NEC 110.9 and 110.10 for interrupting rating and circuit impedance, and NEC Article 240 for overcurrent protection', 'NEC 700.32, 701.32 and 708.54 for selective coordination requirements', 'IEEE Std 1584 for arc-flash incident energy, and IEEE Std 242 (the Buff Book) for protection and coordination'],
  notThis: 'A coordination or arc-flash study. Device characteristics vary by manufacturer and class, series ratings are valid only as tested and marked, and both coordination and incident energy have to be established for the specific installation.',
},
];

/* ------------------------------------------------------------- builders ---- */

const BASE = 'https://voltfield.org/';
const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;');
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&mdash;/g, '—')
  .replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"')
  .replace(/&middot;/g, '·').replace(/&times;/g, '×').replace(/\s+/g, ' ').trim();

function jsonld(g) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: BASE + 'guides.html' },
        { '@type': 'ListItem', position: 3, name: plain(g.crumb), item: BASE + g.slug + '.html' },
      ]},
      { '@type': 'Article',
        headline: plain(g.headline),
        description: plain(g.description),
        image: BASE + 'social/social-generic.jpg',
        author: { '@type': 'Organization', name: 'Voltfield Editorial Team', url: BASE + 'methodology.html' },
        publisher: { '@type': 'Organization', name: 'Voltfield' },
        datePublished: DATE_ISO + 'T00:00:00-05:00',
        dateModified: DATE_ISO + 'T00:00:00-05:00',
        url: BASE + g.slug + '.html',
      },
      { '@type': 'FAQPage', mainEntity: g.faqs.map((f) => ({
        '@type': 'Question', name: plain(f.q),
        acceptedAnswer: { '@type': 'Answer', text: plain(f.a) },
      }))},
    ],
  });
}

function artban(g) {
  const photo = g.photo ? `
    <figure class="artban-photo">
      <picture><source srcset="${g.photo.src}.webp" type="image/webp"><img src="${g.photo.src}.jpg" width="340" height="340" alt="${g.photo.alt}" decoding="async" fetchpriority="high"></picture>
      <figcaption>${g.photo.caption}</figcaption>
    </figure>` : '';
  const inner = `
      <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="index.html" style="color:var(--slate);text-decoration:none">Home</a> / <a href="guides.html" style="color:var(--slate);text-decoration:none">Guides</a> / <span style="color:var(--ink)">${g.crumb}</span></nav>
      <div class="eyebrow">${g.eyebrow}</div>
      <h1>${g.h1}</h1>
      <p class="dek">${g.dek}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;font-family:var(--mono);font-size:11px;letter-spacing:.02em;color:var(--slate);margin-top:14px"><span>By <b style="color:var(--ink);font-weight:600">Voltfield Editorial Team</b></span><span>&middot;</span><span>Published ${DATE_LONG}</span><span>&middot;</span><a href="methodology.html" style="color:var(--slate);text-decoration:underline;display:inline-block;min-height:24px;padding-block:4px;line-height:16px">How we source &amp; verify this</a></div>`;
  return g.photo
    ? `<section class="artban">\n  <div class="artban-in has-photo">\n    <div class="artban-text">${inner}\n    </div>${photo}\n  </div>\n</section>`
    : `<section class="artban">\n  <div class="artban-in">${inner}\n  </div>\n</section>`;
}

function body(g) {
  const toc = g.sections.map((s) => `      <li><a href="#${s.id}">${s.h2}</a></li>`).join('\n');
  const faqBlocks = g.faqs.map((f) => `  <details style="background:var(--card);border:1px solid var(--line-dark);padding:14px 18px;margin-bottom:10px">
    <summary style="font-family:var(--disp);font-weight:600;font-size:15.5px;cursor:pointer">${f.q}</summary>
    <p style="margin-top:10px">${f.a}</p>
  </details>`).join('\n');
  const secs = g.sections.map((s, i) =>
    `  <h2 id="${s.id}">${s.h2}</h2>${s.html}` + (i === 1 ? '\n  <div class="ad-unit" data-ad="incontent"></div>' : '')
  ).join('\n');
  return `<div class="artwrap">
  <section class="takeaways" aria-labelledby="tk-h">
    <h2 id="tk-h">Key takeaways</h2>
    <ul>
${g.takeaways.map((t) => `      <li>${t}</li>`).join('\n')}
    </ul>
  </section>
  <details class="pagetoc"><summary>On this page &middot; ${g.sections.length + 1} sections</summary>
    <ol>
${toc}
      <li><a href="#faq">Frequently asked questions</a></li>
    </ol>
  </details>
${secs}

  <h2 id="faq">Frequently asked questions</h2>
${faqBlocks}
  <section class="nextsteps" aria-labelledby="next-h">
    <h2 id="next-h">Next steps</h2>
    <p class="ns-intro">${g.nextIntro}</p>
    <div class="ns-grid">
      <div class="ns-col">
      <h3 id="calcLinks">Run the numbers</h3>
      <ul class="catlink">
${g.calcs.map(([h, n, d]) => `        <li><a href="${h}">${n}</a>${d}</li>`).join('\n')}
      </ul>
      </div>
      <div class="ns-col">
      <h3 id="relatedGuides">Read next</h3>
      <ul>
${g.guides.map(([h, n]) => `        <li><a href="${h}">${n}</a></li>`).join('\n')}
      </ul>
      </div>
    </div>
  </section>`;
}

function provenance(g) {
  return `<aside class="provenance" aria-labelledby="prov-h">
  <details>
    <summary><h2 id="prov-h">Scope &amp; sources</h2><span class="prov-meta">Published ${DATE_LONG}.</span></summary>
    <dl>
      <dt>What this covers</dt>
      <dd>${g.covers}</dd>
      <dt>Based on</dt>
      <dd><ul>${g.basedOn.map((b) => `<li>${b}</li>`).join('')}</ul></dd>
      <dt>What it is not</dt>
      <dd>${g.notThis}</dd>
      <dt>Provenance</dt>
      <dd>Published ${DATE_LONG}. Written and maintained by the Voltfield editorial team against the sources above. Worked figures in the text are arithmetic the reader can check; nothing here states a measured value.</dd>
    </dl>
  </details>
  </aside>`;
}

/* ----------------------------------------------------------------- run ----- */

const tpl = fs.readFileSync(path.join(root, TEMPLATE), 'utf8');
const eol = tpl.includes('\r\n') ? '\r\n' : '\n';
let made = 0;

for (const g of GUIDES) {
  let s = tpl.replace(/\r\n/g, '\n');
  const url = BASE + g.slug + '.html';
  const card = BASE + 'social/social-generic.jpg';

  const one = (re, to, label) => {
    if (!re.test(s)) throw new Error(g.slug + ': no match for ' + label);
    s = s.replace(re, to);
  };

  one(/<title>[^<]*<\/title>/, `<title>${g.title || g.h1} | Voltfield</title>`, 'title');
  one(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`, 'canonical');
  one(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(g.description)}">`, 'description');
  one(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${esc(g.keywords)}">`, 'keywords');
  one(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(g.crumb)}">`, 'og:title');
  one(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(g.ogDesc)}">`, 'og:description');
  one(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${esc(g.crumb)}">`, 'tw:title');
  one(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${esc(g.ogDesc)}">`, 'tw:description');
  /* social-generic.jpg rather than a per-guide card: there is no card for these
     yet, and pointing og:image at a file that does not exist is worse than
     pointing it at one that does. */
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${card}">`)
       .replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${card}">`);

  one(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${jsonld(g)}\n</script>`, 'json-ld');
  one(/<section class="artban">[\s\S]*?<\/section>/, artban(g), 'artban');
  one(/<div class="artwrap">[\s\S]*?<\/section>\n\n  <div class="guide-foot">/, body(g) + '\n\n  <div class="guide-foot">', 'body');
  one(/Suggested citation: Voltfield Editorial Team, &ldquo;[^&]*&rdquo;/, `Suggested citation: Voltfield Editorial Team, &ldquo;${plain(g.h1)}&rdquo;`, 'citation');
  one(/<input type="hidden" name="source" value="[^"]*">/, `<input type="hidden" name="source" value="/${g.slug}.html">`, 'signup source');
  one(/<aside class="provenance"[\s\S]*?<\/aside>/, provenance(g), 'provenance');

  fs.writeFileSync(path.join(root, g.slug + '.html'), s.replace(/\n/g, eol));
  console.log('  wrote ' + g.slug + '.html');
  made++;
}
console.log('guides written: ' + made);
