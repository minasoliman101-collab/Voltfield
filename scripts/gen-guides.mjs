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
    ['guide-nec-250-122-egc-sizing.html', 'NEC 250.122 EGC Sizing Explained'],
    ['guide-grounding-bonding-basics.html', 'Grounding &amp; Bonding Basics'],
    ['guide-ground-fault-protection.html', 'Ground-Fault Protection &amp; NEC 230.95'],
    ['guide-nema-enclosure-types.html', 'NEMA Enclosure Types Explained'],
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
    ['guide-nec-430-250-motor-fla.html', 'NEC 430.250 Motor Full-Load Current'],
    ['guide-short-circuit-studies-breaker-coordination.html', 'Short-Circuit Studies &amp; Coordination'],
    ['guide-fully-rated-vs-series-rated.html', 'Fully Rated vs. Series Rated Breakers'],
    ['guide-arc-flash-ppe-categories.html', 'Arc-Flash PPE Categories'],
    ['guide-transformer-impedance.html', 'Transformer Impedance (%Z)'],
  ],
  covers: 'How fuses and circuit breakers interrupt a fault, the clearing times involved, let-through energy and what it means for equipment withstand and arc flash, interrupting and series ratings, the two different approaches to selective coordination, and single-phasing on motor circuits.',
  basedOn: ['UL 248 for fuses and UL 489 for molded-case circuit breakers', 'NEC 110.9 and 110.10 for interrupting rating and circuit impedance, and NEC Article 240 for overcurrent protection', 'NEC 700.32, 701.32 and 708.54 for selective coordination requirements', 'IEEE Std 1584 for arc-flash incident energy, and IEEE Std 242 (the Buff Book) for protection and coordination'],
  notThis: 'A coordination or arc-flash study. Device characteristics vary by manufacturer and class, series ratings are valid only as tested and marked, and both coordination and incident energy have to be established for the specific installation.',
},
{
  slug: 'guide-nec-110-26-working-space',
  eyebrow: 'Code Requirements',
  crumb: 'NEC 110.26 Working Space',
  h1: 'NEC 110.26: Working Space Around Electrical Equipment',
  title: 'NEC 110.26 Working Space Explained',
  headline: 'NEC 110.26: Working Space, Dedicated Space and Entrances',
  dek: 'The clearance rule that gets designed out on paper and discovered on site. Three dimensions, a condition that changes one of them, a dedicated space above the equipment, and an entrance requirement that applies once the gear gets large.',
  description: 'NEC 110.26 working space explained: depth by condition, the 30-inch width and 6.5-foot height, the dedicated equipment space above a panel, entrance requirements for large equipment, and illumination.',
  ogDesc: 'Depth by condition, width and height, the dedicated space above the panel, and when large gear needs two entrances.',
  keywords: 'NEC 110.26, working space, working clearance, electrical panel clearance, dedicated equipment space, condition 1 2 3, 110.26 entrance, 36 inch clearance panel',
  photo: { src: 'images/parts/dc-lv-switchgear', alt: 'A low-voltage switchgear lineup', caption: 'Low-voltage switchgear (illustration)' },
  takeaways: [
    'Three dimensions: depth in front of the equipment, 30 inches of width, and 6.5 feet of height. Width and height do not change with voltage.',
    'Depth depends on what is on the opposite side, which the code calls Condition 1, 2 or 3. At 151 to 1000 volts those are 3, 3.5 and 4 feet.',
    'The space above a panel is separately reserved. Piping and ducts not serving the equipment cannot pass through it.',
    'Equipment rated 1200 A or more and over 6 feet wide needs an entrance at each end, unless an exception is satisfied.',
  ],
  sections: [
    { id: 'the-three-dimensions', h2: 'The three dimensions', html: `
  <p>NEC 110.26(A) requires working space at any equipment likely to need examination, adjustment, servicing or maintenance while energized. It is specified in three directions and all three have to be satisfied at once.</p>
  <p><b>Depth</b>, under 110.26(A)(1), is measured from the exposed live parts or from the enclosure front where parts are enclosed, and it is the one that varies. <b>Width</b>, under 110.26(A)(2), is 30 inches or the width of the equipment, whichever is greater, and the space has to allow any door or hinged panel to open at least 90 degrees. <b>Height</b>, under 110.26(A)(3), is 6.5 feet or the height of the equipment, whichever is greater.</p>
  <p>The width is often misread. It does not have to be centred on the equipment, but it does have to be continuous, and it is measured in front of the equipment rather than along it. Nothing may be stored in any of it &mdash; 110.26(B) is explicit that the working space is not storage space, which is the most common field violation on the whole section.</p>` },
    { id: 'depth-and-the-three-conditions', h2: 'Depth and the three conditions', html: `
  <p>Depth changes with what a worker could contact behind them while reaching into energized equipment. The code names three cases:</p>
  <ul>
    <li><b>Condition 1</b> &mdash; exposed live parts on one side, and nothing live or grounded on the other, or the other side effectively guarded by suitable insulating material.</li>
    <li><b>Condition 2</b> &mdash; exposed live parts on one side and grounded parts on the other. Concrete, brick and tile walls count as grounded.</li>
    <li><b>Condition 3</b> &mdash; exposed live parts on both sides of the working space, not guarded.</li>
  </ul>
  <p>For nominal voltage to ground of 151 to 1000 volts those give 3 feet, 3 feet 6 inches and 4 feet respectively. At 0 to 150 volts all three conditions are 3 feet, which is why a residential panel is a straightforward 36 inches regardless of what is opposite it.</p>
  <p>The practical trap is Condition 2. A panel on a wall facing a concrete wall three feet away looks compliant against the familiar 36-inch figure and is not, because the opposite wall is grounded and the requirement is 42 inches.</p>` },
    { id: 'the-dedicated-equipment-space', h2: 'The dedicated equipment space', html: `
  <p>110.26(E) is a separate requirement and it is routinely confused with working space. Working space is in front of the equipment and is about access. Dedicated space is <i>above and below</i> it and is about keeping other trades out.</p>
  <p>For indoor installations the space above the equipment footprint, extending from the floor to a height of 6 feet above the equipment or to the structural ceiling &mdash; whichever is lower &mdash; is reserved for electrical. Piping, ducts and equipment foreign to the electrical installation cannot be installed in it. Sprinkler protection is permitted, and a suspended ceiling with removable panels counts as the structural ceiling for this purpose.</p>
  <p>This is the requirement that gets lost in coordination. The electrical layout is correct, the mechanical contractor runs a condensate line across the ceiling above a panelboard, and the violation is discovered at inspection with the pipe already hung.</p>` },
    { id: 'entrances-to-working-space', h2: 'Entrances to working space', html: `
  <p>110.26(C) governs getting out. Every working space needs at least one entrance of sufficient area, and large equipment needs more than one.</p>
  <p>Where equipment is rated 1200 A or more and is over 6 feet wide, there must be an entrance at each end of the working space, not less than 24 inches wide and 6.5 feet high. Two exceptions allow a single entrance: where the location permits a continuous and unobstructed way of exit, or where the working space depth is twice the figure 110.26(A)(1) requires and the single entrance is positioned so a worker never has to pass within that minimum depth to leave.</p>
  <p>Where an entrance serves such equipment, personnel doors less than 25 feet from the nearest edge of the working space must open in the direction of egress and be equipped with panic hardware or listed fire-exit hardware. That requirement exists because the thing you are escaping is an arc flash, and it is not a dimension anyone can negotiate.</p>` },
    { id: 'illumination-and-elevation', h2: 'Illumination and elevation', html: `
  <p>110.26(D) requires illumination for all working spaces about service equipment, switchboards, switchgear, panelboards and motor control centers installed indoors. It cannot be controlled by automatic means alone, which rules out a lone occupancy sensor as the only control, and in general a luminaire is required rather than merely borrowed light.</p>
  <p>110.26(A)(4) covers limited access, such as equipment above a suspended ceiling or in a crawl space, with its own access and clearance rules. 110.27 and 110.28 then deal with guarding live parts and enclosure types, which are separate subjects frequently cited alongside this one.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Using 36 inches everywhere.</b> It is the Condition 1 figure. A grounded surface opposite makes it 42 inches above 150 volts.</li>
    <li><b>Storing anything in the working space.</b> 110.26(B) prohibits it outright, and a stack of boxes in front of a panel is a violation whether or not the panel is being worked on.</li>
    <li><b>Confusing dedicated space with working space.</b> One is in front and about access, the other is above and about other trades.</li>
    <li><b>Measuring width along the equipment instead of in front of it.</b> The 30 inches is depth-wise clear space in front, not a strip beside the gear.</li>
    <li><b>Forgetting the 90-degree door swing.</b> A panel in a narrow corridor can satisfy every dimension and still fail because the door cannot open.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'How much clearance does NEC 110.26 require in front of a panel?', a: 'Depth depends on the condition. For nominal voltage to ground of 151 to 1000 volts it is 3 feet for Condition 1, 3 feet 6 inches for Condition 2 and 4 feet for Condition 3. At 0 to 150 volts all three conditions are 3 feet. Width is 30 inches or the equipment width, whichever is greater, and height is 6.5 feet or the equipment height.' },
    { q: 'What is the difference between Condition 1, 2 and 3?', a: 'Condition 1 has exposed live parts on one side and nothing live or grounded opposite. Condition 2 has exposed live parts on one side and grounded parts opposite, which includes concrete, brick and tile walls. Condition 3 has exposed live parts on both sides of the space. Each step increases the required depth above 150 volts.' },
    { q: 'Can storage be placed in electrical working space?', a: 'No. NEC 110.26(B) requires the working space to be kept clear and states it is not to be used for storage. It applies all the time, not only while the equipment is being serviced, and it is the most commonly cited violation in the section.' },
    { q: 'What is dedicated equipment space?', a: 'A separate requirement in NEC 110.26(E) covering the space above and below the equipment footprint rather than in front of it. Indoors, the space above extends to 6 feet above the equipment or to the structural ceiling, whichever is lower, and piping, ducts and other equipment foreign to the electrical installation cannot be placed in it. Sprinkler protection is permitted.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/switchgear-components.html">switchgear components</a> reference covers the equipment these clearances apply to, and <a class="inline" href="guide-arc-flash-boundary-basics.html">arc-flash boundary basics</a> covers why the egress rules read the way they do.',
  calcs: [
    ['calculators/arc-flash.html', 'Arc-Flash Incident Energy Calculator', 'Incident energy and boundary at a working distance.'],
    ['calculators/fault-current.html', 'Available Fault Current Calculator', 'The fault current the gear in that space can deliver.'],
  ],
  guides: [
    ['guide-arc-flash-boundary-basics.html', 'Arc-Flash Boundary Basics'],
    ['guide-arc-flash-ppe-categories.html', 'Arc-Flash PPE Categories'],
    ['guide-switchgear-compartments.html', 'Metal-Clad vs. Metal-Enclosed Switchgear'],
    ['guide-ground-vs-neutral.html', 'Ground vs. Neutral Explained'],
  ],
  covers: 'The three working-space dimensions in NEC 110.26(A), how depth varies with Condition 1, 2 and 3, the prohibition on storage, the dedicated equipment space in 110.26(E), entrance and egress requirements for large equipment in 110.26(C), and illumination in 110.26(D).',
  basedOn: ['NEC Article 110, Part II, in particular 110.26(A) through (E)', 'NEC 110.27 and 110.28 for guarding and enclosure types', 'NFPA 70E for the electrically safe work practices these clearances support'],
  notThis: 'A compliance determination. Dimensions are stated as the code requires them, but the condition that applies, the voltage class and any local amendment are matters for the authority having jurisdiction, and code editions differ.',
},

{
  slug: 'guide-nec-250-122-egc-sizing',
  eyebrow: 'Grounding',
  crumb: 'NEC 250.122 EGC Sizing',
  h1: 'NEC 250.122: Sizing the Equipment Grounding Conductor',
  title: 'NEC 250.122 EGC Sizing Explained',
  headline: 'NEC 250.122: Sizing the Equipment Grounding Conductor, and the Upsizing Rule',
  dek: 'The equipment grounding conductor is sized from the overcurrent device, not from the load, because what it has to survive is a fault rather than a duty cycle. Two provisions around that table account for most of the errors.',
  description: 'NEC 250.122 equipment grounding conductor sizing explained: sizing from the overcurrent device rating, the proportional upsizing rule when conductors are increased, parallel runs, and the ceiling at the circuit conductor size.',
  ogDesc: 'Sizing from the overcurrent device rather than the load, the proportional upsizing rule, and parallel runs.',
  keywords: 'NEC 250.122, EGC sizing, equipment grounding conductor size, 250.122 table, ground wire size, 250.122(B) upsizing, parallel EGC, voltage drop ground wire',
  photo: { src: 'images/parts/dc-ground-bars-kits', alt: 'A ground bar and bonding kit', caption: 'Ground bar and bonding kit (illustration)' },
  takeaways: [
    'The EGC is sized from the rating of the overcurrent device ahead of the circuit, not from the load and not from the phase conductor.',
    'If the ungrounded conductors are upsized for any reason, including voltage drop, the EGC must be increased proportionally by circular mil area.',
    'The EGC is never required to be larger than the ungrounded circuit conductors it runs with.',
    'Representative copper sizes: 15 A takes 14 AWG, 100 A takes 8 AWG, 200 A takes 6 AWG, 400 A takes 3 AWG.',
  ],
  sections: [
    { id: 'why-the-device-and-not-the-load', h2: 'Why the device, and not the load', html: `
  <p>Every other conductor in the circuit is sized from what it carries continuously. The equipment grounding conductor carries nothing until something fails, and then it carries the entire available fault current for as long as the protective device takes to open. That is the duty it is sized for.</p>
  <p>So NEC 250.122(A) sizes it from the rating or setting of the overcurrent device ahead of the circuit, through Table 250.122. A 100 A breaker gets an 8 AWG copper EGC whether the load behind it is 95 amps or 12. Sizing it from the load, which looks reasonable, produces a conductor that may not survive long enough for the breaker to clear.</p>
  <p>Representative copper values from that table: 15 A takes 14 AWG, 20 A takes 12 AWG, 60 A takes 10 AWG, 100 A takes 8 AWG, 200 A takes 6 AWG, 400 A takes 3 AWG, 600 A takes 1 AWG. Aluminum runs larger at each step, and the table itself is the authority rather than this summary.</p>` },
    { id: 'the-upsizing-rule', h2: 'The upsizing rule in 250.122(B)', html: `
  <p>This is the provision most often missed, and it is missed because it is triggered by a decision made for an entirely unrelated reason.</p>
  <p>250.122(B) says that where ungrounded conductors are increased in size from the minimum that would have sufficient ampacity, the equipment grounding conductor must be increased in size proportionally, by circular mil area.</p>
  <p>The usual trigger is voltage drop. A 100 A feeder needs 3 AWG copper on ampacity, the run is long, so the designer specifies 1/0 to hold the drop inside 3 percent. The breaker is still 100 A, so the table still says 8 AWG &mdash; but the phase conductors went from 52,620 to 105,600 circular mils, a ratio of about 2.0, and the EGC has to grow by the same ratio. 8 AWG is 16,510 circular mils, so the EGC needs at least 33,020, which is 4 AWG.</p>
  <p>Nothing about the installation signals this. The breaker did not change, the load did not change, and the table lookup gives the same answer it always did. Only the reason for the larger phase conductor triggers it.</p>` },
    { id: 'the-ceiling-and-parallel-runs', h2: 'The ceiling, and parallel runs', html: `
  <p>Two limits keep the result sensible. First, 250.122(A) provides that the EGC need not be larger than the ungrounded circuit conductors it accompanies &mdash; on a small circuit with a large device the table could otherwise ask for more copper in the ground than in the phases.</p>
  <p>Second, parallel runs. Where circuit conductors are run in parallel in multiple raceways, 250.122(F) requires an equipment grounding conductor in each raceway, and each one is sized from the overcurrent device protecting the circuit &mdash; not from the device rating divided by the number of raceways. The reasoning is straightforward once stated: a fault in one raceway is cleared by the one device, so the EGC in that raceway sees the whole fault.</p>
  <p>Where a cable tray or a metal raceway is itself the equipment grounding conductor, 250.118 lists what qualifies, and the sizing question changes shape entirely.</p>` },
    { id: 'what-the-egc-is-not-for', h2: 'What the EGC is not for', html: `
  <p>Two things commonly loaded onto this conductor do not belong on it. It is not a neutral: it is bonded to the grounded conductor at exactly one point, and using it to return load current puts normal current on every enclosure in the path. <a class="inline" href="guide-ground-vs-neutral.html">Ground vs. neutral</a> covers that separately.</p>
  <p>It is also not the grounding electrode conductor. The GEC connects the system to earth and is sized from Table 250.66 against the service conductors; the EGC connects equipment back to the source and is sized from Table 250.122 against the overcurrent device. They are different conductors, sized from different tables, doing different jobs, and the similar names cause real errors in submittals.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Sizing from the load.</b> The table is indexed on the overcurrent device, because the fault is the duty.</li>
    <li><b>Missing 250.122(B).</b> Upsizing phase conductors for voltage drop obliges a proportional increase in the EGC, and nothing in the lookup reminds you.</li>
    <li><b>Dividing the device rating across parallel raceways.</b> Each raceway's EGC is sized from the full device rating.</li>
    <li><b>Confusing Table 250.122 with Table 250.66.</b> One sizes the equipment grounding conductor, the other the grounding electrode conductor.</li>
    <li><b>Using the EGC as a neutral.</b> A different fault with the same symptom: current on metal that should never carry any.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'How is the equipment grounding conductor sized?', a: 'From the rating or setting of the overcurrent device ahead of the circuit, using NEC Table 250.122 &mdash; not from the load and not from the phase conductor size. The EGC carries fault current only, for as long as the device takes to open, so the device rating is what determines the duty. Representative copper sizes are 14 AWG at 15 A, 8 AWG at 100 A and 6 AWG at 200 A.' },
    { q: 'Do I have to upsize the ground wire if I upsize the conductors?', a: 'Yes. NEC 250.122(B) requires the equipment grounding conductor to be increased proportionally by circular mil area whenever the ungrounded conductors are increased above the minimum size that would have had sufficient ampacity. Upsizing a feeder for voltage drop is the usual trigger, and the overcurrent device rating does not change, so the table lookup alone will not reveal it.' },
    { q: 'Can the EGC be smaller than the phase conductors?', a: 'Usually yes, and that is normal: a 100 A circuit on 3 AWG copper takes an 8 AWG copper EGC. The code also caps it in the other direction, since NEC 250.122(A) provides that the equipment grounding conductor need not be larger than the ungrounded circuit conductors it runs with.' },
    { q: 'Is the EGC the same as the grounding electrode conductor?', a: 'No. The equipment grounding conductor bonds equipment back to the source so fault current can clear a device, and is sized from Table 250.122 against the overcurrent device. The grounding electrode conductor connects the system to earth and is sized from Table 250.66 against the service conductors. Different conductors, different tables, different purposes.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/grounding-bonding.html">grounding and bonding</a> reference covers the hardware, and the <a class="inline" href="calculators/wire-size.html">wire size calculator</a> covers the phase conductors this is sized alongside.',
  calcs: [
    ['calculators/wire-size.html', 'Wire Size Calculator', 'Phase conductors, including the upsizing that triggers 250.122(B).'],
    ['calculators/voltage-drop.html', 'Voltage Drop Calculator', 'The usual reason a feeder gets upsized in the first place.'],
  ],
  guides: [
    ['guide-ground-vs-neutral.html', 'Ground vs. Neutral Explained'],
    ['guide-grounding-bonding-basics.html', 'Grounding &amp; Bonding Basics'],
    ['guide-ground-fault-protection.html', 'Ground-Fault Protection &amp; NEC 230.95'],
    ['guide-cable-ampacity-derating.html', 'Cable Ampacity Derating'],
  ],
  covers: 'Why the equipment grounding conductor is sized from the overcurrent device rather than the load, representative values from Table 250.122, the proportional upsizing requirement in 250.122(B) and what triggers it, the ceiling at the circuit conductor size, parallel runs under 250.122(F), and the distinction from the grounding electrode conductor.',
  basedOn: ['NEC 250.122, including (A), (B) and (F), and Table 250.122', 'NEC 250.66 and Table 250.66 for the grounding electrode conductor, for contrast', 'NEC 250.118 for raceways and enclosures that qualify as an equipment grounding conductor', 'IEEE Std 142 (the Green Book) for grounding practice'],
  notThis: 'A substitute for the table or for a design. Representative sizes are given to show the shape of the requirement; the published table governs, aluminum differs at every step, and the code edition in force where you are may not match the sections cited.',
},

{
  slug: 'guide-nec-430-250-motor-fla',
  eyebrow: 'Motors',
  crumb: 'NEC 430.250 Motor FLC',
  h1: 'NEC 430.250: Motor Full-Load Current, and Why Not the Nameplate',
  title: 'NEC 430.250 Motor Full-Load Current',
  headline: 'NEC 430.250: Motor Full-Load Current, and Why the Nameplate Is Not Used',
  dek: 'Motor circuits are the one place the code tells you to ignore the number printed on the equipment. Conductors and protection are sized from a table value; the nameplate is used for overload protection and almost nothing else.',
  description: 'NEC 430.250 motor full-load current explained: why the table value and not the nameplate sizes conductors, the 125 percent rule in 430.22, overload protection from the nameplate, and short-circuit protection percentages.',
  ogDesc: 'Why conductors are sized from the table rather than the nameplate, the 125 percent rule, and where the nameplate is actually used.',
  keywords: 'NEC 430.250, motor full load current, motor FLC table, motor FLA, 430.6, 430.22, motor conductor sizing, motor overload protection, 430.52',
  photo: { src: 'images/parts/mro-ac-motors', alt: 'A three-phase AC induction motor', caption: 'AC induction motor (illustration)' },
  takeaways: [
    'NEC 430.6(A)(1) requires conductor and protection sizing to use the table full-load current, not the motor nameplate.',
    'Branch-circuit conductors are sized at 125 percent of that table value, under 430.22.',
    'The nameplate current is used for overload protection, under 430.32, and for little else.',
    'Short-circuit and ground-fault protection is a percentage of the table value, and it is a large one: 250 percent for an inverse-time breaker on a squirrel-cage motor.',
  ],
  sections: [
    { id: 'the-rule-that-surprises-people', h2: 'The rule that surprises people', html: `
  <p>On any other load, you size the circuit from what the equipment says it draws. On a motor circuit, NEC 430.6(A)(1) says to use the values in Tables 430.247 through 430.250 instead &mdash; 430.250 being the three-phase alternating-current table &mdash; rather than the current marked on the motor.</p>
  <p>It reads like a mistake and it is deliberate. Table values are conservative and standardised, which means a circuit sized from them will carry any compliant motor of that horsepower and voltage, including the replacement fitted in eight years by someone who never sees the original calculation. Sizing to a specific nameplate produces a circuit that is correct for exactly one motor.</p>
  <p>The gap is real. At 460 volts three-phase, the table gives 65 amperes for a 50 horsepower motor. A particular efficient 50 horsepower motor might draw closer to 58 amperes at full load, which the <a class="inline" href="calculators/hp-to-kw.html">HP to kW calculator</a> will show. The circuit is sized on 65.</p>` },
    { id: 'what-each-number-is-used-for', h2: 'What each number is used for', html: `
  <table class="reftable">
    <tr><th scope="col">Purpose</th><th scope="col">Which current, and the section</th></tr>
    <tr><td>Branch-circuit conductors</td><td>Table value &times; 125 percent &mdash; 430.22</td></tr>
    <tr><td>Short-circuit and ground-fault protection</td><td>Table value &times; a percentage by device and motor type &mdash; 430.52</td></tr>
    <tr><td>Overload protection</td><td>Nameplate current &mdash; 430.32</td></tr>
    <tr><td>Disconnecting means</td><td>Table value, horsepower-based rating &mdash; 430.110</td></tr>
    <tr><td>Feeder serving several motors</td><td>125 percent of the largest motor's table value plus the others' &mdash; 430.24</td></tr>
  </table>
  <p>So the nameplate is not ignored. It is used for the one job that genuinely depends on that individual machine: protecting it from running overloaded. Everything structural &mdash; what the conductors are, what the breaker is, what the disconnect is rated &mdash; comes from the table.</p>` },
    { id: 'the-125-percent-rule', h2: 'The 125 percent rule', html: `
  <p>430.22 requires branch-circuit conductors supplying a single motor used in a continuous-duty application to have an ampacity of at least 125 percent of the motor's table full-load current.</p>
  <p>For the 50 horsepower motor at 460 volts: 65 &times; 1.25 = 81.25 amperes of required ampacity. That is then a conductor selection problem like any other, subject to the termination temperature limit and any ambient or bundling adjustment, which the <a class="inline" href="calculators/wire-size.html">wire size calculator</a> handles.</p>
  <p>The 125 percent here is not the continuous-load factor from 210.19(A). It is a separate motor provision that happens to use the same multiplier, and on a motor circuit it is this one that applies.</p>` },
    { id: 'why-the-breaker-looks-oversized', h2: 'Why the breaker looks oversized', html: `
  <p>A motor branch circuit routinely carries an overcurrent device far above the conductor ampacity, and that is correct rather than an error. Starting current on an induction motor runs six to eight times full-load for a few seconds, so a device sized to the running current would trip on every start.</p>
  <p>430.52 therefore sets the short-circuit and ground-fault device as a percentage of the table full-load current: for a squirrel-cage motor, 250 percent for an inverse-time circuit breaker, 300 percent for a dual-element time-delay fuse, 1700 percent for an instantaneous-trip breaker. On the 65 ampere example an inverse-time breaker may be sized up to about 163 amperes, on conductors with 81 amperes of required ampacity.</p>
  <p>What protects the conductor at those levels is the overload device, sized from the nameplate under 430.32, which is a separate element in the starter and the reason the arrangement is safe. The breaker is there for short circuits and ground faults; the overload relay is there for overload. Treating the breaker as the conductor's protection is the misreading that makes this look wrong.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Sizing conductors from the nameplate.</b> 430.6(A)(1) requires the table value. The nameplate belongs to overload protection.</li>
    <li><b>Setting the overload from the table.</b> The reverse error, and it leaves a specific motor unprotected or nuisance-tripping.</li>
    <li><b>Reading the breaker as conductor protection.</b> On a motor circuit the overload relay does that, which is why the breaker can sit well above the conductor ampacity.</li>
    <li><b>Using the wrong table.</b> 430.247 is direct current, 430.248 single-phase, 430.249 two-phase, 430.250 three-phase. Picking the wrong one produces a plausible number.</li>
    <li><b>Applying 210.19(A) instead of 430.22.</b> Same multiplier, different provision; on a motor circuit the motor article governs.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'Why does the NEC use a table instead of the motor nameplate?', a: 'NEC 430.6(A)(1) requires the table values in 430.247 through 430.250 for sizing conductors, short-circuit protection and the disconnecting means. Table values are conservative and standardised, so a circuit sized from them will carry any compliant motor of that horsepower and voltage, including a future replacement. A circuit sized to one nameplate is correct for one motor.' },
    { q: 'Where is the motor nameplate current used?', a: 'For overload protection, under NEC 430.32. That is the one job that depends on the individual machine rather than its horsepower class. Conductors, short-circuit and ground-fault protection and the disconnecting means all come from the table instead.' },
    { q: 'What size conductor does a 50 hp motor at 460 V need?', a: 'The table full-load current is 65 amperes, and NEC 430.22 requires branch-circuit conductors with at least 125 percent of that, so 81.25 amperes of required ampacity. Selecting the conductor from there is a normal ampacity problem, subject to the termination temperature limit in 110.14(C) and any ambient or bundling adjustment.' },
    { q: 'Why is a motor breaker so much larger than the conductor ampacity?', a: 'Because it is not protecting the conductor against overload. NEC 430.52 sizes the short-circuit and ground-fault device as a percentage of the table full-load current &mdash; 250 percent for an inverse-time breaker on a squirrel-cage motor &mdash; so it rides through the six to eight times full-load starting current. Overload protection is a separate device sized from the nameplate under 430.32.' },
  ],
  nextIntro: 'The <a class="inline" href="voltfield-supply-catalog.html?q=AC%20Motors">AC motors</a> family in the Spec Library covers the equipment, and <a class="inline" href="calculators/motor-start.html">motor starting voltage dip</a> covers what that starting current does to the bus.',
  calcs: [
    ['calculators/hp-to-kw.html', 'Motor HP to kW Calculator', 'Shaft output, supply power and calculated full-load amps.'],
    ['calculators/motor-start.html', 'Motor Starting Voltage Dip Calculator', 'Bus dip from locked-rotor kVA against source stiffness.'],
    ['calculators/wire-size.html', 'Wire Size Calculator', 'The conductor for the 125 percent figure.'],
  ],
  guides: [
    ['guide-fuse-vs-breaker.html', 'Fuse vs. Circuit Breaker Compared'],
    ['guide-continuous-load-80-percent-rule.html', 'The 80% Rule &amp; Continuous Loads'],
    ['guide-nec-220-87-existing-load.html', 'NEC 220.87 Existing Load Explained'],
    ['guide-kw-vs-kva.html', 'kW vs. kVA Explained'],
    ['guide-short-circuit-studies-breaker-coordination.html', 'Short-Circuit Studies &amp; Coordination'],
  ],
  covers: 'Why NEC 430.6(A)(1) requires table full-load current rather than the nameplate, which number is used for each purpose, the 125 percent conductor rule in 430.22, the short-circuit and ground-fault percentages in 430.52, and why a motor breaker sits above the conductor ampacity.',
  basedOn: ['NEC Article 430, in particular 430.6, 430.22, 430.24, 430.32, 430.52 and 430.110', 'NEC Tables 430.247 through 430.250 for full-load current', 'NEC 110.14(C) and Table 310.16 for the conductor selection that follows', 'NEMA MG1 for motor ratings and efficiency classes'],
  notThis: 'A substitute for the tables or for a design. The one table value quoted is illustrative; the published tables govern, several 430.52 percentages depend on motor and device type, and local amendments and code editions differ.',
},

{
  slug: 'guide-uptime-institute-tiers',
  eyebrow: 'Data Centers',
  crumb: 'Uptime Institute Tiers',
  h1: 'Uptime Institute Tiers I&ndash;IV: What They Actually Define',
  title: 'Uptime Institute Tiers Explained',
  headline: 'Uptime Institute Tiers I to IV: Topology, Certification and the Numbers That Are Not in the Standard',
  dek: 'Four levels describing what a facility can survive and what it can maintain without going down. The word is a trademark and the classification is an award, which is why most things called Tier III are not, and the availability percentages everyone quotes are not part of the standard at all.',
  description: 'Uptime Institute Tiers I to IV explained: redundant capacity, concurrent maintainability, fault tolerance, the three certification awards, and why the familiar 99.982 percent availability figures are not in the Tier Standard.',
  ogDesc: 'What each tier defines, why certification is not the same as a design claim, and where the availability percentages came from.',
  keywords: 'uptime institute tiers, tier 3 data center, tier iii vs tier iv, concurrently maintainable, fault tolerant data center, tier certification, tier standard topology, data center redundancy levels',
  photo: { src: 'images/parts/dc-floor-pdu-rpp', alt: 'A floor power distribution unit and remote power panel', caption: 'Floor PDU and remote power panel (illustration)' },
  takeaways: [
    'Tier I and II are about redundant capacity. Tier III and IV are about distribution paths, which is the real dividing line.',
    'Tier III means concurrently maintainable: anything can be taken out of service for planned work without affecting IT.',
    'Tier IV means fault tolerant: any single unplanned failure is survived, which additionally requires continuous cooling.',
    'Tier is an Uptime Institute trademark and an awarded certification. A design described as Tier III without an award is a self-assessment.',
  ],
  sections: [
    { id: 'the-four-levels', h2: 'The four levels', html: `
  <p>The classification describes topology &mdash; what the power and cooling systems are made of and how they are connected &mdash; rather than equipment quality or operational practice. Each level includes everything below it.</p>
  <table class="reftable">
    <tr><th scope="col">Tier</th><th scope="col">What it defines</th></tr>
    <tr><td><b>I</b> &mdash; Basic Capacity</td><td>A single path for power and cooling, no redundant capacity components. Planned work on almost anything requires shutting the IT load down, and an unplanned failure does the same.</td></tr>
    <tr><td><b>II</b> &mdash; Redundant Capacity</td><td>Redundant capacity components &mdash; a spare generator, a spare chiller &mdash; but still a single distribution path. A component can fail without taking the load down; work on the path still cannot be done live.</td></tr>
    <tr><td><b>III</b> &mdash; Concurrently Maintainable</td><td>Every capacity component <i>and every distribution path element</i> can be removed from service on a planned basis without affecting IT. In practice that means multiple independent distribution paths, with dual-powered IT equipment.</td></tr>
    <tr><td><b>IV</b> &mdash; Fault Tolerant</td><td>Any single unplanned failure of any capacity component or distribution element is survived with no IT impact, automatically. Adds continuous cooling and physical separation of redundant systems.</td></tr>
  </table>
  <p>The step that matters is between II and III, and it is not about having more equipment. Tier II adds spare components; Tier III adds <i>paths</i>. A site can have N+1 on every machine in the building and still be Tier II if there is one way for the power to get from those machines to the floor.</p>` },
    { id: 'maintainable-against-tolerant', h2: 'Maintainable against tolerant', html: `
  <p>Tier III and Tier IV answer two different questions, and conflating them is the most common technical error in the subject.</p>
  <p><b>Concurrently maintainable</b> is about planned work. Can you isolate a UPS, a switchboard, a distribution path or a chiller, work on it, and put it back, with the IT load running throughout? That is a question about valves, breakers, isolation points and whether the second path can carry the whole load while the first is open.</p>
  <p><b>Fault tolerant</b> is about the unplanned. When something fails with no warning and nobody is standing there, does the load ride through without human action? That is a question about automatic response, and it is a harder one. A Tier III site may well survive a failure &mdash; but it is not required to, and may need an operator to act.</p>
  <p>Tier IV also brings two requirements Tier III does not. <b>Continuous cooling</b> means the thermal environment is maintained through a utility outage and generator start, which usually means chilled water storage or a flywheel on the cooling plant, because IT equipment at high density overheats in minutes. And <b>compartmentalisation</b>, meaning the redundant systems are physically separated so a single event &mdash; a fire, a flood, a failure that propagates &mdash; cannot take both.</p>` },
    { id: 'certification-is-not-a-design-claim', h2: 'Certification is not a design claim', html: `
  <p>Tier, Tier Standard and the Tier Classification System are trademarks of Uptime Institute, and the classification is awarded rather than self-declared. There are three distinct awards, and they are not interchangeable:</p>
  <ul>
    <li><b>Tier Certification of Design Documents</b> &mdash; the drawings were reviewed and meet the topology.</li>
    <li><b>Tier Certification of Constructed Facility</b> &mdash; the building as built was inspected and demonstrated, which is a different and much harder thing than the drawings.</li>
    <li><b>Tier Certification of Operational Sustainability</b> &mdash; the staffing, maintenance and operating practice were assessed.</li>
  </ul>
  <p>So "Tier III" in a sales document can mean a certified constructed facility, a certified set of drawings for a building that was then value-engineered, or nothing more than somebody's opinion of their own topology. The question worth asking is which award, issued when, and for this building. Design certification without construction certification is common and is a reasonable thing to hold &mdash; it just is not the same claim.</p>
  <p>The honest way to describe an uncertified facility is by what it does: concurrently maintainable power with dual paths and N+1 cooling says more than a tier number anyway, and does not borrow a trademark.</p>` },
    { id: 'the-availability-percentages', h2: 'The availability percentages', html: `
  <p>Nearly every summary of this subject carries a table of availability figures &mdash; 99.671, 99.741, 99.982 and 99.995 percent, mapped to the four tiers. Those numbers are not in the current Tier Standard, and Uptime Institute has distanced itself from them.</p>
  <p>They originated in much older material and spread because they are concrete and easy to tabulate. The problem is that topology does not determine availability: a Tier IV facility operated badly will beat a Tier II one and lose to a well-run Tier III, and the standard says nothing about how many minutes a year any of them will be down. The Operational Sustainability certification exists precisely because topology alone does not predict outcomes.</p>
  <p>If someone quotes those percentages at you as a specification, they are quoting a decades-old secondary source. What a tier tells you is what the facility can survive and what it can maintain, not how often it will fail.</p>` },
    { id: 'what-the-tiers-do-not-cover', h2: 'What the tiers do not cover', html: `
  <p>The classification is about power and cooling topology for the critical environment. Several things people expect to find in it are not there.</p>
  <p>It says nothing about physical security, network redundancy or carrier diversity, nothing about geographic risk, and nothing about whether the IT architecture can tolerate losing the site &mdash; which, for most modern workloads, matters more than the facility tier. Nor does it grade equipment: a Tier IV topology built from poorly maintained equipment is still Tier IV topology.</p>
  <p>It also does not map onto the redundancy notation people use alongside it. N+1 and 2N describe how much spare capacity a system has; the tiers describe what the whole facility can do. <a class="inline" href="guide-n-plus-1-vs-2n-redundancy.html">N+1 vs 2N</a> covers that distinction, and the two vocabularies are routinely mixed in the same sentence to no good effect.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Equating N+1 with Tier III.</b> Redundant capacity is Tier II. Tier III needs redundant distribution paths that can each be isolated.</li>
    <li><b>Quoting the availability percentages as a requirement.</b> They are not in the standard and never described a guarantee.</li>
    <li><b>Treating design certification as construction certification.</b> Different awards, different evidence, and the gap between them is where value engineering lives.</li>
    <li><b>Using "Tier 3" as a generic adjective.</b> It is a trademark and an award; writing "concurrently maintainable" costs two more words and is defensible.</li>
    <li><b>Forgetting continuous cooling at Tier IV.</b> It is a requirement, it is expensive, and it is the item most often missing from a design that otherwise looks fault tolerant.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is the difference between Tier III and Tier IV?', a: 'Tier III is concurrently maintainable: every capacity component and distribution path element can be removed from service for planned work without affecting the IT load. Tier IV is fault tolerant: any single unplanned failure is survived automatically, with no human action. Tier IV additionally requires continuous cooling through a utility outage and physical separation of the redundant systems.' },
    { q: 'Does N+1 redundancy make a data center Tier III?', a: 'No. N+1 is redundant capacity, which is Tier II. Tier III requires redundant distribution paths as well, each able to be isolated for planned work while the other carries the load, which in practice means dual-powered IT equipment. A facility can have N+1 on every machine and still be Tier II if there is only one path to the floor.' },
    { q: 'Are the Tier availability percentages real?', a: 'The figures of 99.671, 99.741, 99.982 and 99.995 percent are widely quoted but are not part of the current Tier Standard, and Uptime Institute has distanced itself from them. Topology does not determine availability; operations largely do, which is why a separate Operational Sustainability certification exists. Treat the percentages as a decades-old secondary source rather than a specification.' },
    { q: 'Can a data center call itself Tier III without certification?', a: 'Tier and the Tier Classification System are Uptime Institute trademarks and the classification is awarded, so an uncertified claim is a self-assessment. There are also three separate awards &mdash; design documents, constructed facility, and operational sustainability &mdash; which are not interchangeable. Ask which award, issued when, and for which building.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/backup-power.html">backup power</a> reference covers the equipment these topologies are built from, and <a class="inline" href="guide-n-plus-1-vs-2n-redundancy.html">N+1 vs 2N</a> covers the redundancy vocabulary used alongside the tiers.',
  calcs: [
    ['calculators/generator-runtime.html', 'Generator Runtime Calculator', 'On-site fuel against consumption at real load.'],
    ['calculators/bess-sizing.html', 'BESS Sizing Calculator', 'Usable and nameplate kWh for a ride-through requirement.'],
  ],
  guides: [
    ['guide-n-plus-1-vs-2n-redundancy.html', 'N+1 vs. 2N Redundancy'],
    ['guide-ups-topologies.html', 'UPS Topologies'],
    ['guide-pue-explained.html', 'PUE Explained'],
    ['guide-liquid-vs-air-cooling.html', 'Liquid vs. Air Cooling'],
  ],
  covers: 'What each of the four Uptime Institute tiers defines, the distinction between redundant capacity and redundant distribution paths, concurrent maintainability against fault tolerance, the continuous cooling and compartmentalisation requirements at Tier IV, the three certification awards, and the status of the availability percentages commonly quoted alongside the tiers.',
  basedOn: ['Uptime Institute’s published description of the Tier Classification System and its certification awards', 'IEEE and ASHRAE material on continuous cooling and thermal ride-through, for the Tier IV requirement', 'Voltfield’s own guides on redundancy notation and UPS topology for the adjacent vocabulary'],
  notThis: 'An Uptime Institute publication, a certification, or a substitute for the Tier Standard. Tier, Tier Standard and the Tier Classification System are trademarks of Uptime Institute; this page describes the classification and is not affiliated with or endorsed by them. Only Uptime Institute can award a Tier Certification.',
},

{
  slug: 'guide-ansi-device-numbers',
  eyebrow: 'Protection',
  crumb: 'ANSI Device Numbers',
  h1: 'ANSI Device Numbers: Reading 50, 51, 87 and the Rest',
  title: 'ANSI Device Numbers Explained',
  headline: 'ANSI Device Numbers: Reading 50, 51, 87 and the Suffix System',
  dek: 'The two-digit codes on every protection one-line are IEEE C37.2 device function numbers. Learning twenty of them, plus how the suffixes work, makes a relay schedule readable &mdash; and explains why 52a and 52b are the two that catch people out.',
  description: 'ANSI device numbers explained: the common IEEE C37.2 function numbers including 50, 51, 87 and 86, how suffix letters like G, N and T narrow them, and what 52a and 52b auxiliary contacts actually mean.',
  ogDesc: 'The common function numbers, how suffixes narrow them, and the 52a / 52b auxiliary contact convention.',
  keywords: 'ANSI device numbers, IEEE C37.2, device function numbers, relay 50 51 87, 52a 52b, 51G, 87T, 86 lockout relay, protection one line symbols',
  photo: { src: 'images/parts/dc-protective-relays', alt: 'Protective relays in a switchgear panel', caption: 'Protective relays (illustration)' },
  takeaways: [
    'The numbers come from IEEE C37.2 and name a protective function, not a product. One modern relay performs dozens of them.',
    '50 is instantaneous overcurrent, 51 is time overcurrent, 87 is differential. Those three cover most of what appears on a one-line.',
    'Suffix letters narrow the function: G for ground, N for neutral, T for transformer, B for bus. 51G is ground time overcurrent.',
    '52 is the circuit breaker itself. 52a follows the breaker, 52b opposes it, and mixing them up is a wiring error that looks like a logic fault.',
  ],
  sections: [
    { id: 'what-the-numbers-are', h2: 'What the numbers are', html: `
  <p>IEEE C37.2 assigns a number to each device function in a power system, so a one-line diagram, a relay schedule and a protection setting sheet can all refer to the same thing without prose. They are universally called ANSI device numbers, from the standard’s earlier designation, and the usage has not changed.</p>
  <p>The important thing about them is that they name a <i>function</i>, not a box. A 1960s panel had one electromechanical relay per number, so the number and the hardware matched. A modern multifunction relay performs 50, 51, 51G, 46, 49, 27, 59, 81 and more simultaneously, and the one-line still shows each function separately because the protection scheme is what the drawing is describing.</p>` },
    { id: 'the-ones-worth-knowing', h2: 'The ones worth knowing', html: `
  <table class="reftable">
    <tr><th scope="col">Number</th><th scope="col">Function</th></tr>
    <tr><td><b>21</b></td><td>Distance &mdash; trips on impedance, used for transmission line protection</td></tr>
    <tr><td><b>25</b></td><td>Synchronising or sync-check &mdash; permits closing only when two sources are in step</td></tr>
    <tr><td><b>27</b></td><td>Undervoltage</td></tr>
    <tr><td><b>32</b></td><td>Directional power &mdash; commonly reverse power on a generator</td></tr>
    <tr><td><b>46</b></td><td>Phase balance, or negative-sequence current &mdash; catches single-phasing and unbalance</td></tr>
    <tr><td><b>49</b></td><td>Thermal &mdash; machine or transformer overtemperature</td></tr>
    <tr><td><b>50</b></td><td>Instantaneous overcurrent</td></tr>
    <tr><td><b>51</b></td><td>Time overcurrent</td></tr>
    <tr><td><b>52</b></td><td>AC circuit breaker</td></tr>
    <tr><td><b>59</b></td><td>Overvoltage</td></tr>
    <tr><td><b>63</b></td><td>Pressure &mdash; the sudden-pressure relay on a liquid-filled transformer</td></tr>
    <tr><td><b>64</b></td><td>Ground detector</td></tr>
    <tr><td><b>67</b></td><td>Directional overcurrent</td></tr>
    <tr><td><b>81</b></td><td>Frequency, over or under</td></tr>
    <tr><td><b>86</b></td><td>Lockout relay &mdash; latches a trip until deliberately reset</td></tr>
    <tr><td><b>87</b></td><td>Differential</td></tr>
  </table>
  <p>That is sixteen of roughly a hundred, and it will read most industrial and data-centre one-lines. The standard itself is the authority for the rest, including the device numbers used for specific machine and station functions.</p>` },
    { id: 'suffixes-and-combinations', h2: 'Suffixes and combinations', html: `
  <p>A bare number is often too broad, so C37.2 provides suffix letters that say what the function is applied to. The common ones are <b>G</b> for ground, <b>N</b> for neutral, <b>T</b> for transformer, <b>B</b> for bus, <b>L</b> for line and <b>M</b> for motor.</p>
  <p>So <b>51G</b> is ground time overcurrent, <b>87T</b> is transformer differential, <b>87B</b> is bus differential, and <b>50/51</b> written together means the instantaneous and time elements of the same overcurrent protection &mdash; which is how overcurrent protection is almost always specified, the instantaneous element handling close-in faults and the time element providing coordination.</p>
  <p>Where several identical devices exist, a prefix number distinguishes them: 1-51 and 2-51 are two separate time-overcurrent functions. And the difference between G and N is worth knowing, because they are not the same measurement: a G suffix generally refers to a function fed from a ground-sensing arrangement such as a residual or window CT, while N refers to one fed from the neutral conductor. On a drawing they look interchangeable and in the current they are not.</p>` },
    { id: 'the-52a-and-52b-trap', h2: 'The 52a and 52b trap', html: `
  <p>Device 52 is the circuit breaker, and its auxiliary contacts carry the two suffixes most likely to cause a real problem.</p>
  <p>A <b>52a</b> contact follows the breaker: closed when the breaker is closed, open when it is open. A <b>52b</b> contact does the opposite: closed when the breaker is open. The letters are not arbitrary and they are not a manufacturer convention &mdash; they are the standard, and every schematic assumes them.</p>
  <p>They matter because the trip coil is wired through a 52a: there is no reason to energise a trip coil on an already-open breaker, and leaving it energised would burn it out. The close circuit is wired through a 52b for the mirror-image reason. Swap them and the breaker will refuse to trip, or will trip and immediately attempt to reclose, and the symptom presents as a control-logic fault rather than as two wires in the wrong terminals.</p>` },
    { id: 'reading-a-one-line-with-them', h2: 'Reading a one-line with them', html: `
  <p>In practice the numbers cluster in recognisable patterns, and recognising the pattern is faster than decoding each number.</p>
  <p>A transformer protection package is typically <b>87T</b> differential, <b>50/51</b> on each side for backup overcurrent, <b>51G</b> for ground faults, <b>49</b> and <b>63</b> from the transformer’s own thermal and pressure devices, all collected into an <b>86</b> lockout so that a transformer trip stays tripped until somebody has looked at it.</p>
  <p>A generator package adds <b>32</b> reverse power, <b>40</b> loss of field, <b>46</b> negative sequence and <b>25</b> sync-check. A motor feeder is usually <b>50/51</b>, <b>49</b> or <b>51</b> as overload, <b>46</b> for single-phasing and <b>27</b> for undervoltage. An incoming utility feeder carries <b>27</b>, <b>59</b>, <b>81</b> and often <b>67</b> directional overcurrent where the service can backfeed.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Reading a number as a device.</b> One multifunction relay provides many numbers; one number does not imply one box to buy.</li>
    <li><b>Swapping 52a and 52b.</b> The classic control-wiring error, and the symptom looks like a logic problem rather than a wiring one.</li>
    <li><b>Treating 51G and 51N as the same function.</b> Different source of current, different sensitivity, and they do not detect the same faults equally.</li>
    <li><b>Omitting 86 and wiring trips directly.</b> Without a lockout, a transformer or bus trip can be reclosed onto a fault by someone who did not know why it opened.</li>
    <li><b>Specifying 50 without coordination.</b> An instantaneous element set too low defeats selective coordination with everything downstream of it.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What do ANSI device numbers 50, 51 and 87 mean?', a: '50 is instantaneous overcurrent, 51 is time overcurrent, and 87 is differential protection. They come from IEEE C37.2, which assigns a number to each device function so that one-line diagrams and relay schedules can reference functions without prose. Written together as 50/51 they mean the instantaneous and time elements of the same overcurrent protection.' },
    { q: 'What is the difference between 52a and 52b?', a: 'Device 52 is the AC circuit breaker. A 52a auxiliary contact follows the breaker, closed when the breaker is closed. A 52b contact is the opposite, closed when the breaker is open. The trip coil is wired through a 52a so it cannot be energised on an already-open breaker; the close circuit uses a 52b. Swapping them produces a breaker that will not trip, and the symptom looks like a control-logic fault.' },
    { q: 'What do the suffix letters on device numbers mean?', a: 'They narrow the function to what it is applied to. G is ground, N is neutral, T is transformer, B is bus, L is line and M is motor. So 51G is ground time overcurrent, 87T is transformer differential and 87B is bus differential. A prefix number distinguishes several identical devices, as in 1-51 and 2-51.' },
    { q: 'Is one device number one relay?', a: 'Not any more. In electromechanical panels each number was a separate relay, so the number and the hardware matched. A modern multifunction relay performs dozens of functions at once, and the one-line still shows each separately because the drawing is describing the protection scheme rather than the equipment list.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/switchgear-components.html">switchgear components</a> reference covers the relays and trip units themselves, and <a class="inline" href="guide-short-circuit-studies-breaker-coordination.html">short-circuit studies and coordination</a> covers what the settings behind these numbers are chosen against.',
  calcs: [
    ['calculators/fault-current.html', 'Available Fault Current Calculator', 'The current these elements are set against.'],
    ['calculators/arc-flash.html', 'Arc-Flash Incident Energy Calculator', 'How clearing time, and therefore the settings, drive incident energy.'],
  ],
  guides: [
    ['guide-short-circuit-studies-breaker-coordination.html', 'Short-Circuit Studies &amp; Coordination'],
    ['guide-fuse-vs-breaker.html', 'Fuse vs. Circuit Breaker Compared'],
    ['guide-ground-fault-protection.html', 'Ground-Fault Protection &amp; NEC 230.95'],
    ['guide-switchgear-compartments.html', 'Metal-Clad vs. Metal-Enclosed Switchgear'],
  ],
  covers: 'What IEEE C37.2 device function numbers are, sixteen of the commonly used ones, how suffix letters and prefix numbers narrow and distinguish them, the 52a and 52b auxiliary contact convention and why it matters in trip and close circuits, and the recognisable protection packages these numbers form on a one-line.',
  basedOn: ['IEEE Std C37.2 &mdash; standard for electrical power system device function numbers, acronyms and contact designations', 'IEEE Std 242 (the Buff Book) for protection and coordination practice', 'IEEE Std C37.91 for transformer protection packages'],
  notThis: 'A substitute for IEEE C37.2. Sixteen numbers of roughly a hundred are listed to make a drawing readable; the standard governs, including the numbers and suffixes not covered here, and relay settings are a study rather than a lookup.',
},

{
  slug: 'guide-rack-power-density',
  eyebrow: 'Data Centers',
  crumb: 'Rack Power Density',
  h1: 'Rack Power Density: Designing and Provisioning It',
  title: 'Rack Power Density Explained',
  headline: 'Rack Power Density: Average, Design and Nameplate, and the Capacity That Gets Stranded',
  dek: 'Density is three different numbers that all get called one thing. Confusing them is how a room ends up with power it cannot deliver to the racks that need it, and circuits sized for a load nothing ever draws.',
  description: 'Rack power density explained: average against design against nameplate, sizing rack circuits at 208 V and 415 V, diversity, dual-corded A and B feeds, and why provisioned capacity gets stranded.',
  ogDesc: 'Average against design against nameplate, rack circuit sizing, and why provisioned capacity ends up stranded.',
  keywords: 'rack power density, kw per rack, rack circuit sizing, nameplate vs actual power, stranded capacity data center, dual corded rack, 415V rack distribution, diversity factor',
  photo: { src: 'images/parts/dc-rack-pdus', alt: 'Rack power distribution units', caption: 'Rack PDUs (illustration)' },
  takeaways: [
    'Average density is total IT load divided by rack count. Nothing is designed to it, because the load is never spread evenly.',
    'Nameplate is the sum of power supply ratings and typically runs well above actual draw. Provisioning to nameplate strands capacity.',
    'A 10 kW rack draws about 28 A at 208 V three-phase, needing a 40 A circuit at 125 percent. The same rack at 415 V needs half that.',
    'Dual-corded equipment means each of the A and B feeds carries the full load when the other is out, so both are sized for all of it.',
  ],
  sections: [
    { id: 'three-numbers-one-word', h2: 'Three numbers, one word', html: `
  <p><b>Average density</b> is arithmetic: total IT load divided by the number of racks. A 1.2 MW hall across 150 racks averages 8 kW. It is a useful planning figure and nothing is ever designed to it.</p>
  <p><b>Design density</b> is what a given rack position is provisioned to support. It varies across the floor deliberately, because the load does. Put ten 40 kW AI racks in that same 1.2 MW hall and they consume 400 kW between them, leaving under 6 kW each for the remaining 140 &mdash; so the room needs at least two design densities, and the drawing has to say which positions are which.</p>
  <p><b>Nameplate</b> is the sum of what the equipment labels claim. It is the least useful of the three and the most often used, because it is the only one available before anything is installed. A dual-supply server with two 1600 W supplies has a 3200 W nameplate, draws perhaps 700 W at typical utilisation, and will never draw more than 1600 W on either cord because the second is redundant.</p>` },
    { id: 'sizing-the-rack-circuit', h2: 'Sizing the rack circuit', html: `
  <p>Once a design density is fixed, the branch circuit follows from it. At 208 V three-phase a rack drawing its full design load needs:</p>
  <table class="reftable">
    <tr><th scope="col">Design density</th><th scope="col">208 V 3-phase</th><th scope="col">415 V 3-phase</th></tr>
    <tr><td>5 kW</td><td>13.9 A &rarr; 20 A circuit</td><td>7.0 A &rarr; 15 A circuit</td></tr>
    <tr><td>10 kW</td><td>27.8 A &rarr; 40 A circuit</td><td>13.9 A &rarr; 20 A circuit</td></tr>
    <tr><td>15 kW</td><td>41.6 A &rarr; 60 A circuit</td><td>20.9 A &rarr; 30 A circuit</td></tr>
    <tr><td>20 kW</td><td>55.5 A &rarr; 70 A circuit</td><td>27.8 A &rarr; 40 A circuit</td></tr>
  </table>
  <p>Circuit ratings allow for the 125 percent continuous-load factor, since IT load is continuous by any definition; the <a class="inline" href="calculators/kw-to-amps.html">kW to amps calculator</a> gives the current and the <a class="inline" href="calculators/wire-size.html">wire size calculator</a> the conductor. The 415 V column is the reason 415/240 V distribution became standard in large halls: the same density at roughly half the current means less copper, fewer circuits and less transformation loss.</p>` },
    { id: 'dual-corded-feeds', h2: 'Dual-corded feeds', html: `
  <p>IT equipment in a concurrently maintainable or fault tolerant facility is dual-corded, drawing from independent A and B feeds. The arithmetic trap is in what each feed has to carry.</p>
  <p>In normal operation the load divides between the two, so each cord sees roughly half. But the whole point of the arrangement is that either path can be lost &mdash; for planned work or a failure &mdash; and when that happens the surviving feed carries the entire rack. Both feeds, both PDUs, both upstream paths and both sets of conductors are therefore sized for the full design density, not half of it.</p>
  <p>That is why a dual-path facility provisions roughly twice the distribution capacity of its IT load, and why monitoring a rack at 45 percent on each feed is the normal, healthy reading rather than evidence of waste. <a class="inline" href="guide-uptime-institute-tiers.html">The Uptime Institute tiers</a> describe the topology this supports.</p>` },
    { id: 'diversity-and-stranded-capacity', h2: 'Diversity and stranded capacity', html: `
  <p>Racks do not all peak together, and a diversity factor acknowledges that: the sum of design densities across a hall exceeds what the hall will ever draw at once. Applying diversity upstream &mdash; sizing the UPS and the transformer below the sum of the branch circuits &mdash; is normal and necessary, because provisioning for simultaneous peaks on every rack would double the plant.</p>
  <p>The failure mode in the other direction is <b>stranded capacity</b>: power that has been paid for, is sitting in the plant, and cannot be used. It happens in three recognisable ways.</p>
  <ul>
    <li><b>Cooling-limited.</b> The electrical system can deliver 15 kW to a position the air handling can only cool to 8. Above roughly 20 to 30 kW per rack this becomes the binding constraint &mdash; <a class="inline" href="guide-liquid-vs-air-cooling.html">liquid vs air cooling</a> covers where that line sits and what crosses it.</li>
    <li><b>Circuit-limited.</b> Capacity exists upstream but the rack has 20 A circuits in it. Adding density means re-pulling branch circuits, often in an occupied hall.</li>
    <li><b>Provisioned to nameplate.</b> Circuits sized for 3200 W of labelled supplies feeding 700 W of actual draw. The capacity is committed in the records and idle in reality, and this is the most common form by a wide margin.</li>
  </ul>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Designing to average density.</b> It describes the room, not any position in it, and a single high-density row invalidates it.</li>
    <li><b>Provisioning from nameplate.</b> It overstates draw substantially and strands capacity in the capacity-management records rather than in the plant.</li>
    <li><b>Sizing dual feeds at half load each.</b> Either feed must carry the whole rack, which is the entire purpose of having two.</li>
    <li><b>Reading 45 percent utilisation on an A feed as waste.</b> In a dual-path design that is the correct number.</li>
    <li><b>Treating power and cooling density as one figure.</b> They are provisioned by different systems and the lower one governs what the position can actually hold.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is rack power density?', a: 'The IT load a rack draws or is provisioned for, in kilowatts. It appears as three different figures that get used interchangeably: average density, which is total load divided by rack count; design density, which is what a given position is provisioned to support; and nameplate, which is the sum of equipment power supply ratings and usually well above actual draw.' },
    { q: 'What size circuit does a 10 kW rack need?', a: 'At 208 V three-phase a 10 kW rack draws about 27.8 A, and because IT load is continuous the circuit is sized at 125 percent of that, so a 40 A circuit. The same rack on 415 V three-phase draws about 13.9 A and needs a 20 A circuit, which is why higher-voltage distribution is standard in large halls.' },
    { q: 'Should each of the A and B feeds be sized for half the load?', a: 'No. Both are sized for the full design density. Load divides between them in normal operation, but the purpose of two independent feeds is that either can be taken out of service or lost, and the surviving one then carries the entire rack. This is why a dual-path facility provisions roughly twice the distribution capacity of its IT load.' },
    { q: 'What is stranded capacity?', a: 'Power that has been provisioned and paid for but cannot be used. It happens when cooling cannot remove the heat the electrical system could deliver, when the branch circuits in a rack are too small to carry additional load even though upstream capacity exists, or most commonly when circuits were provisioned from equipment nameplate ratings rather than measured draw.' },
  ],
  nextIntro: 'The <a class="inline" href="data-centers/power-distribution.html">power distribution</a> reference covers the PDUs and busway this runs through, and <a class="inline" href="guide-liquid-vs-air-cooling.html">liquid vs air cooling</a> covers the thermal limit that usually binds before the electrical one.',
  calcs: [
    ['calculators/kw-to-amps.html', 'kW to Amps Calculator', 'Rack current at 208 V or 415 V, with the 125 percent figure.'],
    ['calculators/wire-size.html', 'Wire Size Calculator', 'The branch-circuit conductor for that current.'],
    ['calculators/transformer-sizing.html', 'Transformer Sizing Calculator', 'The upstream kVA once diversity is applied.'],
  ],
  guides: [
    ['guide-liquid-vs-air-cooling.html', 'Liquid vs. Air Cooling for AI Racks'],
    ['guide-415v-vs-480v-distribution.html', '415 V vs. 480 V Distribution'],
    ['guide-uptime-institute-tiers.html', 'Uptime Institute Tiers Explained'],
    ['guide-pue-explained.html', 'PUE Explained'],
  ],
  covers: 'The difference between average, design and nameplate density, branch-circuit sizing at 208 V and 415 V with the continuous-load factor, why both feeds of a dual-corded rack carry the full load, diversity applied upstream, and the three ways provisioned capacity gets stranded.',
  basedOn: ['NEC 210.19(A) and 215.2 for the continuous-load factor applied to the circuit figures', 'ASHRAE thermal guidelines for the cooling limit that usually binds first', 'Voltfield’s own guides on liquid cooling, 415 V distribution and facility topology'],
  notThis: 'A capacity plan or an electrical design. The circuit figures are arithmetic from the stated voltages and are subject to the termination and derating rules in NEC 110.14(C) and 310.15; diversity factors are site-specific and the cooling limit depends on the containment and air-handling design.',
},

{
  slug: 'guide-spd-types-1-2-3',
  eyebrow: 'Protection',
  crumb: 'SPD Types',
  h1: 'SPD Types 1, 2 and 3: Where Each One Is Allowed',
  title: 'SPD Types 1, 2 and 3 Explained',
  headline: 'SPD Types 1, 2 and 3: The Type Number Is a Location, Not a Grade',
  dek: 'The type number does not rank these devices by quality or by how much energy they absorb. It states where in the system the device is permitted to be connected, and the boundary that matters is the service disconnect.',
  description: 'SPD Types 1, 2 and 3 explained: what the type number controls, which types may sit on the supply side of the service disconnect under NEC 242.12 and 242.14, the short-circuit and voltage checks in 242.10, and where 230.67 now requires one.',
  ogDesc: 'What the type number actually controls, the service-disconnect boundary, and the two ratings checks that get skipped.',
  keywords: 'SPD types, type 1 vs type 2 SPD, surge protective device types, NEC 242, NEC 230.67, surge protector service panel, UL 1449, type 3 SPD, SPD short circuit current rating',
  photo: { src: 'images/parts/dc-surge-protective-devices', alt: 'Panel-mounted surge protective devices', caption: 'Surge protective devices (illustration)' },
  takeaways: [
    'The type number describes the permitted connection point, not performance. A Type 2 is not a weaker Type 1.',
    'Type 1 is the only type permitted on the supply side of the service disconnect. It may also go on the load side.',
    'Type 2 is load side only. Type 3 is point-of-utilization and needs protection upstream of it.',
    'Two ratings have to be checked before any of this matters: the short-circuit current rating against available fault current, and the voltage rating against the maximum continuous phase-to-ground voltage.',
  ],
  sections: [
    { id: 'what-the-type-number-means', h2: 'What the type number means', html: `
  <p>The single most common error about these devices is reading the type number as a grade, as though a Type 1 were heavy-duty and a Type 3 were a budget version. It is not a ranking. Under UL 1449, the standard these devices are listed to, the type classifies the device by <b>where it is permitted to be connected</b> relative to the service disconnect.</p>
  <p>There are four. Type 1 and Type 2 are permanently connected devices distinguished by which side of the service disconnecting means they may sit on. Type 3 is a point-of-utilization device, installed near the equipment it protects. Type 4 is a component assembly, which is what goes inside listed equipment rather than onto a wall.</p>
  <p>Two devices can therefore have identical surge ratings and different type numbers, and a Type 1 and a Type 2 of the same brand and series frequently do. The difference is what the listing permits, which in turn is about whether the device can be installed without an overcurrent device ahead of it.</p>` },
    { id: 'the-service-disconnect-boundary', h2: 'The service disconnect boundary', html: `
  <p>This is where the published answers contradict each other, so it is worth stating plainly.</p>
  <p><b>Type 1 may be connected on the supply side of the service disconnecting means.</b> That is its defining permission, under NEC 242.12. It may <i>also</i> be connected on the load side, subject to the requirements that apply to Type 2 locations &mdash; so a Type 1 on a feeder serving a large motor is a normal installation, not a misapplication.</p>
  <p><b>Type 2 may only be connected on the load side of the service disconnect</b>, under NEC 242.14. Within that restriction it is flexible: anywhere on the load side of the feeder overcurrent device, and anywhere on the premises wiring of a separately derived system.</p>
  <p>So the asymmetry runs one way. Type 1 can go either side; Type 2 cannot go on the line side. If a source tells you a Type 2 may be installed on either side of the service disconnect, it has the two reversed. The reason behind the rule is overcurrent protection: a device on the supply side has no branch or feeder overcurrent device ahead of it, and only a Type 1 is listed to be connected that way.</p>` },
    { id: 'type-3-and-the-point-of-use', h2: 'Type 3 and the point of use', html: `
  <p>Type 3 is the plug strip, the receptacle-type device, the unit at the equipment. It is listed as a point-of-utilization device, which carries a consequence people miss: a Type 3 is not a substitute for protection at the service. It is designed to work downstream of a Type 1 or Type 2, dealing with what gets past that device and with transients generated inside the building rather than arriving from outside.</p>
  <p>Type 3 listings also carry a minimum conductor length from the service &mdash; the device is qualified on the assumption that there is impedance between it and the service entrance. Installing one directly at a panel is outside what it was listed for.</p>
  <p>The practical reading: a facility with only Type 3 devices at the equipment has not addressed the service-entrance surge, and a facility with only a service SPD has not addressed what reaches sensitive electronics. These are complementary layers, which is why the trade calls it cascaded protection rather than choosing one.</p>` },
    { id: 'the-two-checks-that-get-skipped', h2: 'The two checks that get skipped', html: `
  <p>Choosing the right type settles where the device may go. It does not establish that this particular device may go <i>there</i>. Two ratings do that, and both get skipped routinely.</p>
  <p><b>Short-circuit current rating.</b> An SPD carries a marked short-circuit current rating, and under NEC 242.10 it may not be installed where the available fault current exceeds it. This is the same discipline as any other equipment SCCR check: it needs a fault-current figure at the point of installation, not an assumption. A service-entrance location in a large facility is precisely where available fault current is highest.</p>
  <p><b>Voltage rating.</b> The device rating has to equal or exceed the maximum continuous phase-to-ground voltage available at the point of application. A device chosen from the nominal system voltage alone can fail this on a system that runs high, and the failure mode is the SPD degrading in normal service rather than during a surge.</p>
  <p>Article 242 also rules out certain systems outright unless the device is specifically listed for them: ungrounded systems, impedance-grounded systems and corner-grounded delta systems. A standard SPD assumes a grounded system with a predictable phase-to-ground voltage, and none of those three provide one.</p>` },
    { id: 'where-an-spd-is-now-required', h2: 'Where an SPD is now required', html: `
  <p>Surge protection used to be entirely optional. It is not any more, and this is the part of the subject that has changed most recently.</p>
  <p>NEC 230.67 requires that services supplying dwelling units be provided with a surge-protective device, and that the device be a Type 1 or Type 2. The requirement reaches replacements as well as new work: replacing the service equipment on an existing dwelling triggers it. Later editions extended the same requirement to additional occupancies, so the scope depends on which edition your jurisdiction has adopted.</p>
  <p>Note what the rule does <i>not</i> say. It does not require a Type 1 specifically, and it does not require a device at every panel. A single listed Type 2 at the service satisfies it. Claims that the code mandates a device at the service plus one at every downstream panel are good engineering practice stated as a code requirement, and the two are worth keeping separate when you are signing off on an installation.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <p>Reading the type number as a performance tier and specifying a Type 1 where a Type 2 is both permitted and identical in surge rating. Installing a Type 2 on the supply side of the service disconnect, which the listing does not allow. Treating plug-strip Type 3 devices as the building's surge protection. Selecting a device from nominal system voltage without checking it against the maximum continuous phase-to-ground voltage. Skipping the short-circuit current rating check at a service entrance, which is the one location where available fault current is most likely to exceed it. Quoting a dwelling-unit requirement from an edition the local jurisdiction has not adopted.</p>` },
  ],
  faqs: [
    { q: 'What is the difference between a Type 1 and a Type 2 SPD?', a: 'Where each may be connected, not how much surge energy it handles. A Type 1 is listed for connection on the supply side of the service disconnecting means, and may also be installed on the load side. A Type 2 is listed for the load side only. Two devices with identical surge ratings can carry different type numbers, because the type reflects the listed connection point.' },
    { q: 'Can a Type 2 SPD be installed on the line side of the service disconnect?', a: 'No. Type 2 is restricted to the load side of the service disconnect under NEC 242.14. Only a Type 1 is listed for supply-side connection, because a device there has no overcurrent device ahead of it. Sources stating that a Type 2 may be installed on either side have Type 1 and Type 2 reversed.' },
    { q: 'Do I need both a service SPD and point-of-use devices?', a: 'They do different jobs. A Type 1 or Type 2 at the service handles what arrives from outside; a Type 3 at the equipment handles what gets past it and what the building generates internally. A Type 3 is listed as a point-of-utilization device and is not a substitute for protection at the service. Cascaded protection is good practice, but note that the code requirement is for a device at the service, not at every panel.' },
    { q: 'Does the NEC require a surge protective device?', a: 'For dwelling-unit services, yes. NEC 230.67 requires a Type 1 or Type 2 SPD on services supplying dwelling units, including when existing service equipment is replaced. Later editions extended the requirement to further occupancies, so the scope depends on the edition your jurisdiction has adopted. Outside those cases an SPD is a design decision rather than a code requirement.' },
  ],
  nextIntro: 'Sizing and coordinating the protective devices around it is covered in <a class="inline" href="guide-short-circuit-studies-breaker-coordination.html">short-circuit studies and breaker coordination</a>, and the fault-current figure the SCCR check needs comes from the <a class="inline" href="calculators/fault-current.html">fault current calculator</a>.',
  calcs: [
    ['calculators/fault-current.html', 'Fault Current Calculator', 'The available fault current the SPD short-circuit rating is checked against.'],
  ],
  guides: [
    ['guide-fully-rated-vs-series-rated.html', 'Fully Rated vs. Series Rated'],
    ['guide-grounding-bonding-basics.html', 'Grounding & Bonding Basics'],
    ['guide-ground-fault-protection.html', 'Ground-Fault Protection Explained'],
    ['guide-harmonics-ieee-519.html', 'Harmonics & IEEE 519'],
  ],
  covers: 'What the UL 1449 type number classifies, which types may be connected on each side of the service disconnecting means under NEC 242.12 and 242.14, what a Type 3 point-of-utilization listing assumes, the short-circuit and voltage rating checks in Article 242, and the dwelling-unit requirement in NEC 230.67.',
  basedOn: ['NEC Article 242, Part II, for SPD connection locations and the ratings checks', 'NEC 230.67 for the dwelling-unit service requirement', 'UL 1449 as the product standard the type classification comes from'],
  notThis: 'A substitute for the code text or for a device listing. Section numbering and the scope of the 230.67 requirement differ between NEC editions, and the 2026 edition reorganizes several of these articles, so verify against the edition your jurisdiction has adopted. Selecting a specific device still requires the available fault current and the maximum continuous phase-to-ground voltage at the point of installation.',
},
{
  slug: 'guide-nec-220-87-existing-load',
  eyebrow: 'Load Calculations',
  crumb: 'NEC 220.87',
  h1: 'NEC 220.87: Measuring an Existing Load',
  title: 'NEC 220.87 Existing Load Explained',
  headline: 'NEC 220.87: Measuring an Existing Load Instead of Calculating It',
  dek: 'Adding load to an existing service does not require recalculating the whole building from scratch. Measured demand is allowed to stand in for the calculation, and the conditions attached to that measurement are where it comes apart.',
  description: 'NEC 220.87 explained: the one-year maximum demand route, the 30-day recording route, what the recording has to capture, why 125 percent and adding 25 percent are the same thing, and how an EV charger enters the calculation.',
  ogDesc: 'The two permitted routes, what the load study has to capture, and how an EV charger enters the calculation.',
  keywords: 'NEC 220.87, determining existing loads, existing load calculation, 30 day load study, maximum demand 125 percent, service capacity EV charger, NEC 220.57, NEC 625.42, load management ALMS',
  photo: { src: 'images/parts/dc-power-meters-bms', alt: 'Panel-mounted power meters', caption: 'Recording power meters (illustration)' },
  takeaways: [
    'Two routes are permitted: one year of maximum demand data, or a continuous recording over at least 30 days.',
    '125 percent of maximum demand and adding 25 percent to it are the same arithmetic. Sources that present these as competing methods are describing one method twice.',
    'The 30-day recording must capture the building occupied and the larger of the heating or cooling load, by measurement or calculation.',
    'EV charging equipment enters a service calculation at the larger of 7,200 VA or its nameplate rating, with no demand factor.',
  ],
  sections: [
    { id: 'why-the-section-exists', h2: 'Why the section exists', html: `
  <p>The standard load calculation in Article 220 is built for a building being designed. It works forward from connected load and applies demand factors to arrive at a figure for the service. Run that same calculation on a forty-year-old commercial building and two things go wrong: nobody knows what is actually connected any more, and the result comes back absurdly conservative, because the demand factors assume a diversity the building has already proven it exceeds in the other direction.</p>
  <p>220.87 resolves this by letting you measure instead. If the building has been running, its own demand history is better evidence than a calculation from an inventory nobody can verify. This is the section behind nearly every &ldquo;will my service take this new load&rdquo; question, and it is the reason a service that fails a paper calculation can still be perfectly adequate.</p>` },
    { id: 'the-two-routes', h2: 'The two routes', html: `
  <p><b>One year of demand data.</b> If maximum demand data for a one-year period is available, the calculated load is permitted to be 125 percent of that maximum demand. This is the preferred route because a full year captures both the heating and the cooling peak without any argument about which season you measured in.</p>
  <p><b>A 30-day recording.</b> Where a year of data is not available, the calculated load is permitted to be based on the maximum demand continuously recorded over a minimum 30-day period, using a recording ammeter or power meter connected to the highest-loaded phase. The demand figure is an average over a 15-minute interval, not an instantaneous peak &mdash; which matters, because an inrush spike is not what the section is asking for.</p>
  <p>Then the arithmetic: the recorded maximum demand at 125 percent, plus the new load being added, compared against the service rating or the feeder ampacity.</p>
  <p>One point worth settling, because the published sources make it look like a disagreement. Some describe the method as 125 percent of maximum demand and others as adding 25 percent to maximum demand. These are the same operation. Multiplying by 1.25 and adding a quarter produce an identical number, and there is no third method hiding behind the difference in wording.</p>` },
    { id: 'what-the-recording-has-to-capture', h2: 'What the recording has to capture', html: `
  <p>The 30-day route is the one that gets misapplied, because leaving a meter on a panel for a month is easy and the conditions on that month are not obvious.</p>
  <p>The recording has to reflect the building <b>occupied</b>. A load study run over a holiday shutdown, or on a tenant space between leases, does not measure the maximum demand of anything. It has to include the larger of the heating or the cooling load, by measurement or by calculation &mdash; so a study run in October in a climate with both a winter and a summer peak needs the missing season added analytically rather than ignored. And it has to account for loads that are periodic in nature, the ones that may simply not have run during the window.</p>
  <p>This is also why the one-year route is better whenever the data exists. Utility interval data for twelve months answers all three conditions at once, and most utilities will provide it to the account holder on request.</p>` },
    { id: 'where-the-method-does-not-apply', h2: 'Where the method does not apply', html: `
  <p>Measured demand is evidence about the building as it was operating during the measurement. Where something is actively shaping that measurement, the evidence no longer describes the underlying load. On-site generation, storage and deliberate peak shaving all do exactly that: they suppress the recorded demand without reducing what the building would draw if the shaping stopped. Several editions restrict the method on that basis, and the restriction is worth checking rather than assumed either way.</p>
  <p>The same logic applies informally to any site where the historic demand was limited by something that is about to change. A warehouse recorded while half empty, a restaurant space recorded as a retail unit, a building whose process equipment was idle &mdash; in each case the measurement is accurate and irrelevant.</p>
  <p>Two further cautions. The method establishes the <i>existing</i> load; the new load is added at its own full calculated value and gets no benefit from the measurement. And this is a section AHJs read closely, since it is the basis on which a service passes without being upgraded, so the load study and its conditions are worth documenting as carefully as the arithmetic.</p>` },
    { id: 'the-ev-charger-case', h2: 'The EV charger case', html: `
  <p>Most 220.87 questions now arrive attached to an EV charger, and the EV side has its own rules that the 220.87 result does not override.</p>
  <p>Under NEC 220.57, electric vehicle supply equipment enters a service or feeder calculation at the larger of 7,200 VA or its nameplate rating, at 100 percent, with no demand factor applied. The 7,200 VA figure is a floor, not a value: a 40 A EVSE at 240 V is 9,600 VA and enters at 9,600. Article 625 also treats EV charging as a continuous load, which is why no demand factor is available here even though comparable appliance loads get one.</p>
  <p>That is what makes the arithmetic tight, and it is also why load management is the usual answer rather than a service upgrade. Where an automatic load management system is installed, NEC 625.42 permits the maximum load on the service or feeder to be the maximum the management system allows, rather than the sum of the connected equipment nameplates. Four chargers behind an enforceable ALMS present as the system limit. The word doing the work is <i>enforceable</i>: the system has to actually constrain the load, not merely schedule it.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <p>Running the load study while the space is unoccupied or between tenants. Recording in one season and ignoring the opposite peak instead of adding it by calculation. Reading an instantaneous peak off a meter rather than the 15-minute average demand. Treating 125 percent and adding 25 percent as two different methods and wondering which applies. Applying the 125 percent factor to the new load as well as the measured existing load. Giving an EV charger a demand factor. Using measured demand from a site with on-site generation or peak shaving without checking whether the method is available there. Citing section numbers from an edition the jurisdiction has not adopted &mdash; Article 220 is reorganized in the 2026 NEC, so the number itself is worth confirming.</p>` },
  ],
  faqs: [
    { q: 'Can I use utility bills for a NEC 220.87 calculation?', a: 'Yes, if they give maximum demand for a one-year period. That is the first permitted route, and the calculated load is 125 percent of that maximum demand. Most utilities will provide twelve months of interval data to the account holder on request, and it is better evidence than a 30-day study because it captures both the heating and the cooling peak.' },
    { q: 'Is 125 percent of maximum demand the same as adding 25 percent?', a: 'Yes. Multiplying the recorded maximum demand by 1.25 and adding a quarter of it are the same arithmetic. Published sources describe the method both ways, which makes it look like there are two competing methods. There are not.' },
    { q: 'How long does the load study have to run?', a: 'A minimum of 30 days, continuously recorded, using a recording ammeter or power meter on the highest-loaded phase. Length alone is not enough: the recording has to reflect the building while occupied and include the larger of the heating or cooling load, by measurement or by calculation, along with loads that run only periodically.' },
    { q: 'Does an EV charger get a demand factor in the calculation?', a: 'No. EV supply equipment enters a service or feeder calculation at the larger of 7,200 VA or its nameplate rating, at 100 percent. Article 625 treats EV charging as a continuous load. The route to a smaller number is not a demand factor but an automatic load management system, which under NEC 625.42 lets the service see the limit the system enforces rather than the sum of the nameplates.' },
  ],
  nextIntro: 'The continuous-load factor that governs the new circuit is covered in <a class="inline" href="guide-continuous-load-80-percent-rule.html">the 80% rule and continuous loads</a>, and the conductor itself comes out of the <a class="inline" href="calculators/wire-size.html">wire size calculator</a>.',
  calcs: [
    ['calculators/wire-size.html', 'Wire Size Calculator', 'The conductor for the new load, with both NEC checks run.'],
    ['calculators/kw-to-amps.html', 'kW to Amps Calculator', 'Converting a demand figure in kW to the current the service sees.'],
    ['calculators/voltage-drop.html', 'Voltage Drop Calculator', 'Whether the run length forces the conductor up.'],
  ],
  guides: [
    ['guide-continuous-load-80-percent-rule.html', 'The 80% Rule & Continuous Loads'],
    ['guide-nec-430-250-motor-fla.html', 'NEC 430.250 Motor Full-Load Current'],
    ['guide-cable-ampacity-derating.html', 'Cable Ampacity Derating Explained'],
    ['guide-nec-110-26-working-space.html', 'NEC 110.26 Working Space'],
  ],
  covers: 'The one-year maximum demand route and the 30-day recording route, the conditions the recording has to satisfy, why 125 percent and adding 25 percent are one method, when measured demand stops being valid evidence, and how EV supply equipment and automatic load management enter the calculation.',
  basedOn: ['NEC 220.87 for the two permitted methods of determining an existing load', 'NEC 220.57 for the EV supply equipment load value and 625.42 for load management', 'NEC 210.19(A) and 215.2 for the continuous-load treatment of the new circuit'],
  notThis: 'A load calculation or a substitute for the code text. Whether the measured-demand method is available on a given site, and the exact conditions on the recording, vary between NEC editions and are read closely by the AHJ; Article 220 is reorganized in the 2026 edition, so confirm the section number against the edition your jurisdiction has adopted before citing it.',
},
{
  slug: 'guide-nema-enclosure-types',
  eyebrow: 'Enclosures',
  crumb: 'NEMA Enclosure Types',
  h1: 'NEMA Enclosure Types: What the Number Guarantees',
  title: 'NEMA Enclosure Types Explained',
  headline: 'NEMA Enclosure Types: Who Verifies Them, and Why IP Codes Do Not Map Back',
  dek: 'The numbers are not a ladder, nobody from NEMA tested the enclosure, and an IP code cannot be converted into a Type rating in the direction almost everyone converts it.',
  description: 'NEMA enclosure types explained: why Type numbers are not a hierarchy, who actually certifies a rating, why NEMA-to-IP conversion only works one way, the salt-spray misreading around Type 4X, and why the rating belongs to the installed assembly.',
  ogDesc: 'Why the numbers are not a ladder, who certifies the rating, and why IP codes do not convert back into Type ratings.',
  keywords: 'NEMA enclosure types, NEMA 4X vs IP66, NEMA enclosure ratings, NEMA 3R vs 12, NEMA 250, UL 50E, enclosure type rating, NEMA vs IP rating, NEC 110.28',
  photo: { src: 'images/parts/dc-electrical-enclosures-cabinets', alt: 'Electrical enclosures and cabinets', caption: 'Electrical enclosures (illustration)' },
  takeaways: [
    'NEMA is a standards body, not a testing laboratory. It neither tests enclosures nor certifies them, so a Type rating may be the manufacturer&rsquo;s own self-declaration.',
    'The numbers are not a hierarchy. Type 12 is indoor only; Type 3R, a lower number, is rated for outdoor use.',
    'A Type rating can be said to meet or exceed an IP code. An IP code can never be said to equal a Type rating, and NEC 110.28 states IP is not a substitute.',
    'The rating belongs to the installed assembly. One Type 1 fitting on a Type 4X enclosure makes the assembly Type 1.',
  ],
  sections: [
    { id: 'what-the-number-classifies', h2: 'What the number classifies', html: `
  <p>A NEMA Type number classifies an enclosure by the environmental conditions it is built to withstand: what solid objects and liquids it keeps out, whether it survives ice, whether it resists corrosion, and in some cases whether it resists oil or coolant. The requirements live in the ANSI/NEMA 250 standard, which covers construction, testing, rating and marking.</p>
  <p>Two things about that classification are worth fixing in mind immediately, because almost every practical mistake follows from getting one of them wrong. First, the rating applies to the enclosure <b>fully installed and ready for use</b> &mdash; not to the box as it left the factory. Second, there are no standard sizes. NEMA 250 says nothing about dimensions; each manufacturer designs its own enclosures, and a Type rating applies just as readily to the housing of a finished product as to an empty cabinet.</p>` },
    { id: 'nobody-certifies-it-for-you', h2: 'Nobody from NEMA certifies it', html: `
  <p>This is the part the datasheets do not say, and NEMA states it plainly in its own published FAQ: NEMA is a Standards Development Organization, not a testing laboratory and not a Certification Body. It neither tests products nor certifies that a product complies with a NEMA standard.</p>
  <p>So a manufacturer has two routes. It can <b>self-certify</b> that an enclosure meets the requirements of NEMA 250, which is entirely legitimate and explicitly permitted &mdash; anyone may label a complying product &ldquo;NEMA 4X&rdquo; or &ldquo;NEMA 3R&rdquo;. Or it can obtain <b>third-party certification</b> from a Certification Body, which in North America means listing to ANSI/UL 50E and CSA C22.2 No. 94.2 by an organisation such as UL, CSA or Intertek, with the ongoing factory surveillance that listing carries.</p>
  <p>Both products say the same thing on the label. The difference is who stands behind it, and it is invisible unless you look for a certification mark alongside the type designation. One detail makes the distinction findable: NEMA&rsquo;s own registered trademark may <i>not</i> be used in conjunction with a self-declared Type rating, because the NEMA mark is a trade-association mark and not a conformity assessment mark. A bare &ldquo;NEMA 4X&rdquo; in text is a self-declaration or a listing; a NEMA logo presented as though it certified the enclosure is neither.</p>
  <p>Whether that matters is a procurement and inspection question rather than an engineering one. A customer specification or the authority having jurisdiction may require a Certification Body mark, and on a listed-equipment job it generally will.</p>` },
    { id: 'the-numbers-are-not-a-ladder', h2: 'The numbers are not a ladder', html: `
  <p>The single most common error is reading the sequence as increasing protection, so that a higher number is assumed to cover everything a lower one does. It does not work that way, and one pair settles it: <b>Type 12 is an indoor rating and Type 3R is an outdoor rating.</b> Twelve is the larger number and the less suitable choice for a wall outside.</p>
  <p>What the families actually divide on is location and agent. Type 1 is basic indoor protection against incidental contact and falling dirt. Type 12 and 12K are the indoor industrial ratings, for circulating dust, falling dirt and dripping non-corrosive liquids. Type 13 adds resistance to oil and coolant spray, which is why it appears on machine tools. Type 5 addresses settling airborne dust indoors.</p>
  <p>Outdoors, Type 3R covers rain, sleet and external ice formation; Type 3 adds windblown dust; Type 3S adds a mechanism that stays operable when the enclosure is ice-laden. Type 4 is rated indoor or outdoor and adds splashing water and hose-directed water. Types 6 and 6P address submersion, temporary and prolonged respectively.</p>
  <p>Two suffixes carry most of the remaining meaning. <b>X</b> denotes additional corrosion resistance &mdash; 4X, 3RX, 3X, 3SX. <b>K</b> denotes knockouts. And the X suffix is where a widely repeated figure gets misread: it is sometimes claimed that Type 4X requires only a 200-hour salt-spray test while ordinary outdoor enclosures face 600 hours. The 200 hours is additional. All outdoor enclosures are subjected to 600 hours of salt spray and compared against a G90 galvanized steel specimen; the corrosion-resistant types then undergo a further 200 hours and are compared against a 304 stainless specimen. Type 4X is a longer test, not a shorter one.</p>
  <p>Hazardous locations sit outside this set entirely. Types 7 and 9 are covered by ANSI/NEMA 250 but are <i>not</i> within the scope of UL 50E, so a hazardous-location enclosure is a different conversation with a different standard behind it.</p>` },
    { id: 'ip-codes-do-not-map-back', h2: 'IP codes do not map back', html: `
  <p>&ldquo;NEMA 4 is IP66&rdquo; is the shorthand everyone uses, and it is half right in a way that matters.</p>
  <p>The conversion works in exactly one direction. A NEMA Type rating can be said to <b>meet or exceed</b> a given IP degree. An IP degree can never be said to <b>equal</b> a NEMA Type. NEMA says so in its own words, and the reason is scope: an IP code considers only the ingress of solid foreign objects and the ingress of water, while a NEMA Type also considers icing, corrosion resistance, lubricant resistance and construction details. There is nothing in an IP code that speaks to any of those, so no IP number can imply them.</p>
  <p>There is a second difference that gets almost no attention. A NEMA Type rating requires the enclosure to be fully installed and ready for use. An IP degree may be assigned to an enclosure in a partially completed state of installation. Two ratings taken at different points in the lifecycle are not interchangeable even where the test parameters line up.</p>
  <p>For work under the NEC this is not merely a technical nicety. <b>NEC 110.28 states that IP ratings are not a substitute for enclosure Type ratings.</b> An imported assembly carrying only an IP marking does not satisfy a Type requirement, whatever the correlation tables suggest, and that is a conversation to have with the AHJ before the equipment ships rather than after.</p>` },
    { id: 'the-rating-belongs-to-the-assembly', h2: 'The rating belongs to the assembly', html: `
  <p>An enclosure arrives with a Type rating. What gets installed is an assembly: the enclosure plus every fitting, gland, conduit hub, window and vent added to it. The rating that governs is the assembly&rsquo;s, and the rule is unforgiving.</p>
  <p>Fittings are tested independently, to a Type rating equal to or better than the enclosure they go into. The assembly&rsquo;s overall rating is then limited by the least severe rating of any component in it &mdash; the weakest link. A Type 4X stainless enclosure with one Type 1 fitting is a Type 1 assembly, and it is the fitting rather than the enclosure that decides. This is the most frequent way a correctly specified enclosure ends up non-compliant on site.</p>
  <p>Two related marking details are worth knowing. An enclosure meeting more than one Type rating may be designated by a combination of numbers, the <b>smaller number first</b>. And a rating may carry a conditional restriction stated on the marking, of which the common form is a qualifier such as &ldquo;Type 4X only when door closed&rdquo;. A conditional rating is a real rating; it is also a real condition, and an enclosure propped open for ventilation is not operating at its marked Type.</p>
  <p>Mounting is the other field variable. NEMA 250 requires a mounting means external to the electrical cavity for a number of Type-rated enclosures unless an intermediate bracket or foot is used &mdash; so drilling through the back of the cavity and sealing the holes with silicone is not a route to keeping the rating. The final installation is subject to the AHJ in any case.</p>` },
    { id: 'what-the-rating-does-not-cover', h2: 'What the rating does not cover', html: `
  <p>A Type rating is about the environment outside the enclosure getting in. It says nothing about what happens when the energy inside gets out.</p>
  <p>NEMA 250 does not address arc flash, and there is no test in it that rates an enclosure&rsquo;s resistance to arcing-fault energy. An enclosure is not arc-rated because it is Type 4X, and a Type number on a door is not a basis for any decision about personal protective equipment. That subject belongs to NFPA 70E, which governs the PPE and work practices, and for switchgear specifically to IEEE C37.20.7, which is the guide for testing equipment against internal arcing faults. Arc-resistant switchgear is a separate construction and a separate rating.</p>
  <p>The rating also says nothing about ingress protection ratings for personnel contact beyond the basic incidental-contact provision, about seismic qualification, about thermal performance, or about security. Each of those is specified separately, and each has been assumed to come free with a high Type number at some point.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <p>Specifying Type 12 for an outdoor location because the number is higher than 3R. Treating an IP marking as satisfying a Type requirement, which NEC 110.28 rules out. Reading the 200-hour salt-spray figure for Type 4X as the whole test rather than an addition to the 600 hours. Accepting a bare &ldquo;NEMA 4X&rdquo; on a datasheet where the specification or the AHJ wants a Certification Body mark. Installing a lower-rated fitting into a higher-rated enclosure and keeping the enclosure&rsquo;s number on the drawing. Ignoring a conditional qualifier such as &ldquo;only when door closed&rdquo;. Drilling mounting holes through the electrical cavity and sealing them with silicone. Assuming any Type rating implies arc resistance.</p>` },
  ],
  faqs: [
    { q: 'Is NEMA 4X the same as IP66?', a: 'No, and the relationship only runs one way. A NEMA Type rating can be said to meet or exceed an IP degree, but an IP degree can never be said to equal a NEMA Type. An IP code covers only solid-object and water ingress, while a NEMA Type also covers icing, corrosion resistance, lubricant resistance and construction details. NEC 110.28 states that IP ratings are not a substitute for enclosure Type ratings.' },
    { q: 'Who certifies a NEMA enclosure rating?', a: 'Not NEMA. It is a Standards Development Organization, not a testing laboratory or Certification Body, and it neither tests enclosures nor certifies compliance. A manufacturer may self-certify to NEMA 250, which is legitimate and explicitly permitted, or obtain third-party listing to UL 50E and CSA C22.2 No. 94.2 from a Certification Body. Both products carry the same type designation, so look for a certification mark if the specification or the AHJ requires one.' },
    { q: 'Can a NEMA 12 enclosure be used outdoors?', a: 'No. Type 12 is an indoor rating, for circulating dust, falling dirt and dripping non-corrosive liquids. Type 3R, despite the lower number, is the outdoor rating for rain, sleet and external ice. The Type numbers are not a hierarchy, and this pair is the clearest demonstration of it.' },
    { q: 'Does a NEMA enclosure rating protect against arc flash?', a: 'No. NEMA 250 does not address arc flash and contains no test rating an enclosure against arcing-fault energy, so no Type number implies arc resistance. PPE and work practices are governed by NFPA 70E, and arc-resistant switchgear is tested to IEEE C37.20.7 as a separate construction with a separate rating.' },
  ],
  nextIntro: 'The arcing-fault hazard a Type rating says nothing about is covered in <a class="inline" href="guide-arc-flash-boundary-basics.html">arc-flash boundary basics</a>, and the equipment constructions themselves in <a class="inline" href="guide-switchgear-compartments.html">metal-clad vs. metal-enclosed switchgear</a>.',
  calcs: [
    ['calculators/arc-flash.html', 'Arc Flash Calculator', 'The incident energy a Type rating has no bearing on.'],
  ],
  guides: [
    ['guide-switchgear-compartments.html', 'Metal-Clad vs. Metal-Enclosed Switchgear'],
    ['guide-arc-flash-boundary-basics.html', 'Arc-Flash Boundary Basics'],
    ['guide-nec-110-26-working-space.html', 'NEC 110.26 Working Space Explained'],
    ['guide-spd-types-1-2-3.html', 'SPD Types 1, 2 and 3 Explained'],
    ['guide-panelboard-vs-switchboard-vs-switchgear.html', 'Panelboard vs. Switchboard vs. Switchgear'],
  ],
  covers: 'What a Type number classifies and what it leaves out, the difference between self-declaration to NEMA 250 and third-party listing to UL 50E, why the numbering is not a hierarchy, the one-directional relationship with IEC 60529 IP codes and the NEC 110.28 position on it, the salt-spray requirements behind the X suffix, and how fittings and conditional markings govern the installed assembly.',
  basedOn: ['NEMA&rsquo;s own published FAQ on enclosures, for the certification, IP correlation, salt-spray, fitting and arc-flash positions', 'ANSI/NEMA 250 as the standard defining the Type ratings, and ANSI/UL 50E with CSA C22.2 No. 94.2 as the listing standards', 'NEC 110.28 for the status of IP ratings in United States installations'],
  notThis: 'A substitute for the standards, which define the construction, testing and marking requirements and are available for purchase. No NEMA table is reproduced here. The descriptions of what each Type resists are summaries, not the rating criteria; selecting an enclosure for a specific location requires the standard itself, the product listing and the AHJ, and standard designations and editions change.',
},
{
  slug: 'guide-panelboard-vs-switchboard-vs-switchgear',
  eyebrow: 'Switchgear',
  crumb: 'Panelboard vs. Switchboard vs. Switchgear',
  h1: 'Panelboard, Switchboard or Switchgear: Where the Line Is',
  title: 'Panelboard vs. Switchboard vs. Switchgear',
  headline: 'Panelboard, Switchboard, Switchgear: The Listing Standard Draws the Line, Not the Ampere Rating',
  dek: 'The ampere thresholds everyone quotes do not exist, and the published figures contradict each other because they are folklore. The real division is which standard the assembly is listed to, and whether it has a short-time rating at all.',
  description: 'Panelboard vs. switchboard vs. switchgear: why no ampere threshold separates them, the UL 67, UL 891 and UL 1558 listing standards, the short-time rating only switchgear has, and the construction and maintainability differences that follow.',
  ogDesc: 'Why no ampere threshold separates them, and how UL 891 and UL 1558 actually divide switchboards from switchgear.',
  keywords: 'panelboard vs switchboard, switchboard vs switchgear, switchgear vs panelboard, UL 891, UL 1558, UL 67, short time rating, selective coordination, UL 1066 power circuit breaker',
  photo: { src: 'images/parts/dc-lv-switchgear', alt: 'Low-voltage switchgear lineup', caption: 'Low-voltage switchgear (illustration)' },
  takeaways: [
    'No ampere rating separates these three. The published thresholds disagree with each other because none of them comes from a standard.',
    'The listing standards do the dividing: UL 67 for panelboards, UL 891 for switchboards, UL 1558 for low-voltage switchgear.',
    'Switchgear has a short-time rating of 30 or 60 cycles. UL 891 switchboards have none, and are rated to withstand short-circuit current for three cycles.',
    'Only UL 1066 power circuit breakers may be used in UL 1558 switchgear. Switchboards may use UL 489 molded-case or insulated-case breakers, UL 1066 breakers, or fused switches.',
  ],
  sections: [
    { id: 'the-threshold-that-does-not-exist', h2: 'The threshold that does not exist', html: `
  <p>Search this question and you will be told the dividing line is 1,200 A. Or 1,600 A. Or 600 A, or 2,000 A, depending on the page. The figures disagree because none of them comes from a standard; they are rules of thumb that hardened into quoted fact.</p>
  <p>The ranges overlap, which is the clearest demonstration that no threshold is doing any work. Circuit breaker frame ratings in low-voltage switchgear typically run from 800 A to 6,000 A. A single switchboard section may hold breakers from around 20 A up to 1,200 A or more. A 1,000 A assembly can legitimately be either one, and knowing it is 1,000 A tells you nothing about which it is.</p>
  <p>What the NEC definitions actually turn on is construction and mounting. A <b>panelboard</b> is a panel or group of panel units designed for assembly as a single panel, including buses and overcurrent devices, and designed to be placed in a cabinet or cutout box. A <b>switchboard</b> is a large panel, frame or assembly of panels carrying switches, protective devices, buses and usually instruments, and is not intended for installation in a cabinet. The distinction is between something that goes in a box on a wall and something that stands on the floor as its own assembly &mdash; not between two current ratings.</p>
  <p>Article 408 covers all three, and since the 2017 edition it has been titled for all three: switchboards, switchgear and panelboards. Switchgear being named separately there is itself a hint that it is a distinct category rather than a large switchboard.</p>` },
    { id: 'the-listing-standards', h2: 'The listing standards', html: `
  <p>This is where the question gets a decisive answer, and it is the part most comparisons skip or get backwards.</p>
  <p>Each assembly is listed to its own standard. <b>UL 67</b> covers panelboards. <b>UL 891</b> covers switchboards. <b>UL 1558</b> covers metal-enclosed low-voltage power circuit breaker switchgear. These are not tiers of the same document; they are separate standards with different construction and test requirements, and an assembly is built and listed to one of them.</p>
  <p>The breakers inside follow their own standards, and this is the constraint with the most practical bite. <b>UL 489</b> covers molded-case and insulated-case circuit breakers. <b>UL 1066</b> covers low-voltage power circuit breakers. Only UL 1066 power circuit breakers may be used in UL 1558 switchgear. A switchboard is more permissive: it may use UL 489 breakers, UL 1066 breakers, or fused switches.</p>
  <p>So the relationship is asymmetric in a way the ampere-threshold framing completely obscures. Switchgear is constrained to one class of breaker. A switchboard can be built with the same power circuit breakers a switchgear lineup uses, or with molded-case breakers, which is why two switchboards can differ from each other more than one of them differs from switchgear.</p>` },
    { id: 'the-short-time-rating', h2: 'The short-time rating', html: `
  <p>If you want one technical fact that separates switchgear from a switchboard, this is it.</p>
  <p>A UL 891 switchboard is rated to withstand short-circuit current for <b>three cycles</b>, and has no short-time rating. UL 1558 switchgear is rated to withstand short-circuit current for <b>four cycles</b>, and additionally carries short-time ratings of <b>30 or 60 cycles</b>. UL 891 does not cover switchboards with short-time current ratings at all &mdash; the capability is outside the standard&rsquo;s scope, not merely absent from a given product.</p>
  <p>The consequence is selective coordination. A short-time rating is what allows an upstream device to hold in deliberately, without tripping, while a downstream device clears the fault. That requires the upstream assembly and its breaker to survive the fault current for the duration of the delay, which is what the 30 or 60 cycle rating certifies. Three cycles does not leave room for a meaningful short-time delay, so coordination in a switchboard depends on other mechanisms and is correspondingly harder to achieve across several levels.</p>
  <p>Where coordination is mandatory rather than desirable &mdash; elevator circuits, emergency systems, health care essential electrical systems &mdash; this is frequently the fact that decides the equipment, long before anyone looks at an ampere rating. It is also why the answer to &ldquo;can we use a switchboard instead?&rdquo; is sometimes a flat no for reasons that have nothing to do with capacity.</p>` },
    { id: 'construction-and-maintainability', h2: 'Construction and maintainability', html: `
  <p>The physical differences follow from the standards rather than the reverse, and they are what you actually live with.</p>
  <p>In switchgear, sections are separated by complete metal barriers, and the breakers are drawout: a breaker can be racked out and removed for maintenance or replacement. UL 1066 power circuit breakers have replaceable parts and are designed to be maintained. Switchgear generally requires both front and rear access, is typically at least 60 inches deep, and can carry protective relays and intelligent controls.</p>
  <p>In a switchboard, devices are group-mounted without isolation between them. Most are fixed-mounted, though some switchboards use drawout UL 1066 breakers. Depth typically runs 24 to 60 inches. Most molded-case breakers cannot be disassembled, so a failed device is replaced whole rather than repaired. Switchboards generally do not carry relaying or intelligent controls.</p>
  <p>Two containment rules cut the other way and surprise people. A switchboard <i>can</i> contain a panelboard, and can contain a transfer switch. Switchgear <i>cannot</i> include either, although a transfer scheme can be implemented through its internal logic and breaker controls. So the more capable assembly is the more restrictive one about what may be built into it.</p>
  <p>The trade is straightforward once stated: a switchboard costs less and offers less maintainability, and switchgear costs more, takes more room, and can be maintained and coordinated.</p>` },
    { id: 'what-rear-access-does-not-tell-you', h2: 'What rear access does not tell you', html: `
  <p>A test you will see offered repeatedly is rear access: panelboards are accessible from the front only, switchboards from the rear as well. It is worth knowing why this is a weaker discriminator than it looks.</p>
  <p>The wording appears in both code and standards material, and it describes what these assemblies are <i>generally</i> like rather than setting a requirement. In current equipment it has drifted. Many modern switchboards are designed to be entirely front-accessible, which is often the reason they are chosen for a tight electrical room. Switchgear, meanwhile, generally does need rear access. So an assembly you can only reach from the front may be a panelboard or a contemporary front-accessible switchboard, and the one needing rear clearance is as likely to be switchgear as a switchboard.</p>
  <p>Use it as a clue about an installation, not as a classification. The listing label settles what the assembly is, and the required working space comes from NEC 110.26 based on what is actually there rather than from the category name.</p>` },
    { id: 'choosing-between-them', h2: 'Choosing between them', html: `
  <p>In practice the decision is made by a short series of questions, in roughly this order.</p>
  <p>Does the design require selective coordination through this level? If so, the short-time rating points at switchgear and the question is largely settled. Does the equipment need to be maintained in place over a long service life, with breakers removable without de-energising the lineup? That points the same way. Is there a protective relaying or control scheme to house? Again switchgear.</p>
  <p>If none of those apply, a switchboard is the ordinary answer for floor-standing service and distribution equipment, and a panelboard is the answer for branch-circuit distribution in a cabinet. Cost and footprint then matter, and both favour the switchboard.</p>
  <p>What should not drive the decision is the service size on its own. A large service does not require switchgear, and a moderate one does not rule it out.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <p>Quoting an ampere threshold as the dividing line, when the published thresholds contradict each other and none comes from a standard. Treating switchgear as simply a bigger switchboard, which gets the breaker constraint backwards &mdash; switchgear is the more restrictive assembly about what may go in it. Specifying a switchboard where the design needs selective coordination through that level, then discovering the three-cycle withstand leaves no room for a short-time delay. Assuming front-only access proves an assembly is a panelboard. Assuming a switchboard cannot contain a panelboard or a transfer switch, when it can, or that switchgear can, when it cannot. Using the words interchangeably on a drawing and a submittal, which is how the wrong standard ends up on the order.</p>` },
  ],
  faqs: [
    { q: 'What is the difference between a switchboard and switchgear?', a: 'The listing standard and the short-time rating. Switchboards are listed to UL 891 and withstand short-circuit current for three cycles with no short-time rating. Switchgear is listed to UL 1558, withstands four cycles, and carries short-time ratings of 30 or 60 cycles, which is what permits deliberate time delay for selective coordination. Switchgear also uses only UL 1066 power circuit breakers, has drawout breakers and barriered sections, and is built to be maintained.' },
    { q: 'Is there an ampere rating that separates a panelboard from a switchboard?', a: 'No. The thresholds commonly quoted, usually 1,200 A or 1,600 A, do not come from a standard, and published sources disagree with each other. The NEC definitions turn on construction and mounting: a panelboard is designed to be placed in a cabinet or cutout box, while a switchboard is a freestanding assembly not intended for cabinet installation. Ampere ranges for switchboards and switchgear overlap substantially.' },
    { q: 'What is a short-time rating and why does only switchgear have one?', a: 'It is the ability to carry fault current for a defined interval without tripping and without damage, so an upstream device can hold in while a downstream device clears the fault. That is the mechanism behind selective coordination. UL 1558 switchgear carries short-time ratings of 30 or 60 cycles. UL 891 does not cover switchboards with short-time current ratings at all, and a three-cycle withstand leaves no room for a meaningful delay.' },
    { q: 'Can a switchboard contain a panelboard?', a: 'Yes, and it can also contain a transfer switch. Switchgear can include neither, although a transfer scheme can be built through its internal logic and breaker controls. This surprises people because it runs opposite to the assumption that switchgear is the more capable and therefore more permissive assembly.' },
  ],
  nextIntro: 'The medium-voltage equivalents and the compartment constructions are covered in <a class="inline" href="guide-switchgear-compartments.html">metal-clad vs. metal-enclosed switchgear</a>, and the coordination study the short-time rating exists to serve in <a class="inline" href="guide-short-circuit-studies-breaker-coordination.html">short-circuit studies and breaker coordination</a>.',
  calcs: [
    ['calculators/fault-current.html', 'Fault Current Calculator', 'The available fault current the assembly rating is checked against.'],
    ['calculators/arc-flash.html', 'Arc Flash Calculator', 'Incident energy, which clearing time drives.'],
  ],
  guides: [
    ['guide-switchgear-compartments.html', 'Metal-Clad vs. Metal-Enclosed Switchgear'],
    ['guide-short-circuit-studies-breaker-coordination.html', 'Short-Circuit Studies &amp; Breaker Coordination'],
    ['guide-fully-rated-vs-series-rated.html', 'Fully Rated vs. Series Rated Breakers'],
    ['guide-nema-enclosure-types.html', 'NEMA Enclosure Types Explained'],
  ],
  covers: 'Why no ampere threshold divides these three and what the NEC definitions turn on instead, the UL 67, UL 891 and UL 1558 listing standards and the UL 489 and UL 1066 breaker standards under them, the short-time rating that only switchgear carries and its role in selective coordination, the construction and maintainability differences, and what each assembly may and may not contain.',
  basedOn: ['UL 67, UL 891 and UL 1558 as the listing standards for panelboards, switchboards and low-voltage switchgear, with UL 489 and UL 1066 for the breakers', 'NEC Article 100 definitions and Article 408, which since the 2017 edition covers switchboards, switchgear and panelboards', 'Published engineering comparisons of UL 1558 switchgear and UL 891 switchboards for the withstand and short-time figures'],
  notThis: 'A specification or a substitute for the standards and the product listings. The withstand and short-time figures describe what each standard covers rather than any particular product, and a specific assembly&rsquo;s ratings come from its label and its listing. The rear-access wording is descriptive rather than a classification rule and has drifted in modern equipment. Confirm NEC article and definition wording against the edition your jurisdiction has adopted.',
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

/* Slugs on the command line restrict the run to those guides. A full run
   rewrites every page in GUIDES, which destroys anything hand-added to one
   afterwards -- that happened once, to two cross-links added to generated
   guides between batches. Put such a link in the spec, or pass the slugs you
   mean. */
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

for (const g of GUIDES) {
  if (only.length && !only.includes(g.slug)) continue;
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
