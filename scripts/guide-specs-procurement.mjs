/* Guide specs for the procurement and logistics side, imported by
 * gen-guides.mjs and appended to GUIDES. Same shape as the specs there.
 * Money figures in worked examples are round illustrative numbers and the text
 * says so: the site does not publish market prices. */
const DATE = '2026-11-15';
const TPL = [
  ['templates/rfq.html', 'Request for Quotation Template', 'Scope, bid instructions and the data bidders must return.'],
  ['templates/bid-tabulation.html', 'Bid Tabulation Template', 'Three bidders side by side, price and terms.'],
  ['templates/purchase-order.html', 'Purchase Order Template', 'With equipment terms: drawings, tests, documents.'],
];
const LOG = [
  ['templates/purchase-order.html', 'Purchase Order Template', 'Incoterms rule and named place on the order.'],
  ['templates/bill-of-lading.html', 'Bill of Lading Template', 'Straight BOL for truck freight.'],
  ['templates/proof-of-delivery.html', 'Proof of Delivery Template', 'Delivery receipt with a receiving inspection.'],
];

export const PROCUREMENT = [
{
  slug: 'guide-incoterms-for-equipment',
  date: DATE,
  eyebrow: 'Procurement & logistics',
  crumb: 'Incoterms for Equipment',
  h1: 'Incoterms 2020 for Heavy Equipment: EXW, FCA, DAP and DDP Explained',
  title: 'Incoterms 2020 Explained for Equipment Buyers',
  headline: 'Incoterms 2020 for Heavy Equipment: Who Pays, Who Carries the Risk, and Where It Changes Hands',
  dek: 'Three letters on a purchase order decide who books the truck, who insures the load and who owns the problem when a transformer arrives with a cracked bushing. This is what each rule means and which ones fit engineered equipment.',
  description: 'Incoterms 2020 explained for equipment buyers: EXW, FCA, CPT, CIP, DAP, DPU and DDP, where risk transfers under each, and which rule suits transformers and switchgear.',
  ogDesc: 'Where risk and cost change hands under each Incoterms 2020 rule, and which rules fit heavy electrical equipment.',
  keywords: 'incoterms 2020, incoterms explained, EXW vs FCA, DAP vs DDP, DPU incoterm, FOB vs FCA, incoterms for equipment, risk transfer incoterms',
  photo: null,
  takeaways: [
    'An Incoterms rule sets three things: who arranges and pays for carriage, where risk of loss passes from seller to buyer, and who handles export and import clearance.',
    'It does not set when title passes, when payment is due or what happens if the goods are defective. Those belong in the purchase order.',
    'The rule is incomplete without a named place. &ldquo;DAP&rdquo; means nothing; &ldquo;DAP Taylor, TX site, on truck&rdquo; does.',
    'FOB, FAS, CFR and CIF are written for sea freight. For trucks and containers use FCA, CPT, CIP, DAP, DPU or DDP.',
  ],
  sections: [
    { id: 'what-a-rule-decides', h2: 'What an Incoterms rule decides', html: `
  <p><b>Incoterms are eleven standard trade terms published by the International Chamber of Commerce. Each one is a three-letter rule that divides the cost and the risk of moving goods between a seller and a buyer.</b> The current edition is Incoterms 2020. A rule answers three questions: who arranges and pays for transport, at what point the risk of loss or damage moves from seller to buyer, and who is responsible for export and import formalities.</p>
  <p>The point where risk passes is the one that matters when something goes wrong. If a transformer is dropped after risk has passed to you, you still owe the seller the price and your remedy is against the carrier or your insurer. If it is dropped before, it is the seller&rsquo;s loss to sort out.</p>
  <p>Just as important is what the rules leave out. They say nothing about when ownership passes, how or when the price is paid, warranty, or late delivery. A purchase order that relies on an Incoterms rule for any of those has a gap in it.</p>` },
    { id: 'the-rules', h2: 'The rules, from least to most seller responsibility', html: `
  <p>Seven rules work for any mode of transport and are the ones to use for equipment moving by truck, rail, container or a mix:</p>
  <table class="reftable">
    <tr><th scope="col">Rule</th><th scope="col">Seller&rsquo;s job ends</th><th scope="col">Risk passes to buyer</th><th scope="col">Main carriage paid by</th></tr>
    <tr><td><b>EXW</b> Ex Works</td><td>Goods made available at the seller&rsquo;s premises, not loaded</td><td>When made available</td><td>Buyer</td></tr>
    <tr><td><b>FCA</b> Free Carrier</td><td>Goods handed to the buyer&rsquo;s carrier, loaded if at the seller&rsquo;s premises</td><td>At that handover</td><td>Buyer</td></tr>
    <tr><td><b>CPT</b> Carriage Paid To</td><td>Seller pays carriage to the named destination</td><td>When handed to the first carrier</td><td>Seller</td></tr>
    <tr><td><b>CIP</b> Carriage and Insurance Paid To</td><td>As CPT, and the seller buys cargo insurance for the buyer</td><td>When handed to the first carrier</td><td>Seller</td></tr>
    <tr><td><b>DAP</b> Delivered at Place</td><td>Goods arrive at the named place, ready for unloading</td><td>On arrival, before unloading</td><td>Seller</td></tr>
    <tr><td><b>DPU</b> Delivered at Place Unloaded</td><td>Goods arrive and are unloaded by the seller</td><td>Once unloaded</td><td>Seller</td></tr>
    <tr><td><b>DDP</b> Delivered Duty Paid</td><td>As DAP, and the seller clears import and pays duties and taxes</td><td>On arrival, before unloading</td><td>Seller</td></tr>
  </table>
  <p>Four more, <b>FAS</b>, <b>FOB</b>, <b>CFR</b> and <b>CIF</b>, are for sea and inland waterway transport only. Their delivery points are alongside or on board a vessel, which is the wrong place to draw the line for a container that was handed over at an inland terminal days earlier.</p>
  <p>CPT and CIP catch people out. The seller pays the freight all the way to the destination, but the risk passed to the buyer back when the goods were handed to the first carrier. Paying for the journey is not the same as carrying its risk.</p>` },
    { id: 'which-rule-for-equipment', h2: 'Which rule fits heavy equipment', html: `
  <p>For a transformer, a generator or a lineup of switchgear, the practical question is who is better placed to manage a difficult move: permits, escorts, a specialized carrier, and proof of what happened on the way.</p>
  <p><b>DAP to the site</b> is the common choice. The manufacturer arranges a carrier that moves its product every week, the risk in transit stays with the party that packed and blocked the load, and the buyer takes over at the gate. The buyer supplies the crane and the rigging crew, and the risk of the lift is the buyer&rsquo;s.</p>
  <p><b>DPU</b> moves the unloading to the seller as well. It suits a buyer with no rigging capability on site, and it needs the place defined exactly: on the pad, on the laydown area, or just off the truck.</p>
  <p><b>FCA at the factory</b> suits a buyer with its own heavy-haul contract and logistics team. Risk passes at the factory dock, so the buyer needs cargo insurance in place before the load moves, and a clear record of the condition at handover.</p>
  <p><b>EXW</b> looks cheapest and is usually the wrong choice. The seller is not obliged to load the goods, and for an export sale the buyer is left to clear export from a country where it may have no standing to do so. FCA fixes both problems for very little.</p>
  <p><b>DDP</b> on an imported unit hands the duties and import clearance to the seller. That is convenient, but check that the seller is actually able to act as importer in your country, and remember that whoever is importer of record carries the compliance obligations that go with it. Projects with domestic content requirements should read the <a class="inline" href="guide-buy-america-iija.html">Buy America</a> and <a class="inline" href="guide-feoc-compliance.html">FEOC</a> guides alongside this one.</p>` },
    { id: 'the-named-place', h2: 'The named place', html: `
  <p>Every rule is followed by a place, and the precision of that place is what makes the rule work. &ldquo;DAP Texas&rdquo; leaves room for an argument about whether the seller&rsquo;s job ended at a rail terminal or at your gate. Write the place the way you would give directions to the driver: the site name and address, and where on the site.</p>
  <p>Add what the rule itself does not say. State who unloads, even where the rule implies it. State the delivery window and how much notice the site needs. State who supplies the impact recorder and who reads it on arrival. And state the edition: &ldquo;Incoterms 2020&rdquo;.</p>` },
    { id: 'us-domestic-fob', h2: 'A note on &ldquo;FOB&rdquo; in the United States', html: `
  <p>Inside the United States, &ldquo;FOB origin&rdquo; and &ldquo;FOB destination&rdquo; are long-standing commercial terms that come from the Uniform Commercial Code, not from Incoterms. They are used for truck freight every day, and they mean something different from the Incoterms FOB rule, which is about loading a ship. A domestic order that says &ldquo;FOB destination, freight prepaid&rdquo; is clear to both sides. An order that mixes the two systems, for example &ldquo;FOB factory, Incoterms 2020&rdquo; for a truck shipment, is not. Pick one system and name it.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>A rule with no named place,</b> or a place as vague as a city.</li>
    <li><b>Assuming the rule settles title or payment.</b> It settles neither.</li>
    <li><b>Assuming CPT or CIP means the seller carries the transit risk.</b> The seller pays the freight; the buyer carries the risk from the first carrier onward.</li>
    <li><b>Using FOB or CIF for containers or trucks.</b></li>
    <li><b>Buying EXW and discovering nobody is contracted to load the truck.</b></li>
    <li><b>Freight terms on the bill of lading that contradict the order.</b> Prepaid or collect on the <a class="inline" href="templates/bill-of-lading.html">bill of lading</a> should follow from the rule on the purchase order.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is the difference between DAP and DDP?', a: 'Under both, the seller delivers the goods to the named place ready for unloading and carries the risk until then. Under DDP the seller also clears the goods for import and pays the duties and taxes. Under DAP import clearance and duties are the buyer&rsquo;s.' },
    { q: 'What is the difference between EXW and FCA?', a: 'Under EXW the seller only makes the goods available at its premises: it does not have to load them or clear them for export. Under FCA the seller loads the goods onto the buyer&rsquo;s carrier when delivery is at the seller&rsquo;s premises, and clears them for export. FCA is usually the better choice for the same price.' },
    { q: 'Do Incoterms determine when ownership transfers?', a: 'No. Incoterms set the transfer of risk and the split of costs and tasks. When title passes is a matter for the contract and the governing law, so state it in the purchase order.' },
    { q: 'Which Incoterm should I use for a transformer?', a: 'There is no single answer, but DAP to the project site is a common choice because the manufacturer arranges the specialized transport and carries the transit risk, while the buyer unloads with its own crane. DPU adds unloading to the seller&rsquo;s scope, and FCA suits a buyer that runs its own heavy-haul logistics.' },
  ],
  nextIntro: 'The rule and its named place go on the purchase order, the freight terms that follow from it go on the bill of lading, and the handover it describes is recorded on the proof of delivery.',
  calcsHead: 'Use the templates',
  calcs: LOG,
  guides: [
    ['guide-how-to-compare-equipment-bids.html', 'How to Compare Equipment Bids'],
    ['guide-fat-vs-sat.html', 'FAT vs. SAT'],
    ['guide-buy-america-iija.html', 'Buy America under the IIJA'],
    ['guide-transformer-lead-times.html', 'Transformer Lead Times'],
  ],
  covers: 'What an Incoterms 2020 rule does and does not decide, the seven any-mode rules and the four sea-freight rules, where risk passes under each, which rules suit heavy electrical equipment, the named place, and the separate United States usage of FOB origin and FOB destination.',
  basedOn: ['International Chamber of Commerce, Incoterms 2020 (ICC Publication 723)', 'Uniform Commercial Code, Article 2, for United States domestic shipment terms'],
  notThis: 'Legal advice or a substitute for the text of the rules, which the ICC publishes. Customs, tax and title questions depend on the countries and the contract involved.',
},
{
  slug: 'guide-how-to-compare-equipment-bids',
  date: DATE,
  eyebrow: 'Procurement & logistics',
  crumb: 'How to Compare Equipment Bids',
  h1: 'How to Compare Equipment Bids: Bid Tabulation and Total Evaluated Cost',
  title: 'How to Compare Equipment Bids (Bid Tabulation)',
  headline: 'How to Compare Equipment Bids: Why the Lowest Price Is Often Not the Lowest Cost',
  dek: 'Three quotes for the same transformer rarely describe the same transformer. A bid tabulation puts them on one basis, and a loss evaluation shows what each will cost to own. Both fit on a page.',
  description: 'How to compare bids for transformers, switchgear and other equipment: level the scope, tabulate exceptions and terms, and evaluate transformer losses to find the lowest total cost.',
  ogDesc: 'Level the scope, list the exceptions, add the cost of losses. A method for comparing equipment bids on one basis.',
  keywords: 'bid tabulation, bid comparison, how to compare bids, total evaluated cost, transformer loss evaluation, A and B factors, total owning cost, bid leveling',
  photo: null,
  takeaways: [
    'Bids can only be compared once they describe the same scope. Leveling the scope comes before comparing the price.',
    'Read the exceptions and clarifications first. That is where a low price is usually explained.',
    'For transformers, add the cost of losses: total owning cost = price + A &times; no-load loss + B &times; load loss.',
    'Lead time, payment terms, warranty and documentation are part of the comparison, and should be written down beside the price.',
  ],
  sections: [
    { id: 'what-a-bid-tab-is', h2: 'What a bid tabulation is', html: `
  <p><b>A bid tabulation is a table with the bidders across the top and everything that matters down the side: price, scope, technical data, delivery and commercial terms.</b> Its job is to put every bid on the same basis so that the differences between them are visible, and to leave a record of why one was chosen.</p>
  <p>It only works if every bidder was asked the same question. That is the purpose of a proper <a class="inline" href="templates/rfq.html">request for quotation</a>: one specification, one data sheet to fill in, one set of commercial terms, and one deadline. When bidders are given different information, the table compares the bidders&rsquo; guesses.</p>` },
    { id: 'level-the-scope', h2: 'Step 1: level the scope', html: `
  <p>Before looking at totals, go line by line and mark what each bid includes. The usual gaps are:</p>
  <ul>
    <li><b>Freight and unloading.</b> One bid is delivered to site, another is priced at the factory. See the <a class="inline" href="guide-incoterms-for-equipment.html">Incoterms guide</a>.</li>
    <li><b>Accessories and options.</b> Monitoring, surge arresters, special paint, seismic bracing, spare parts.</li>
    <li><b>Testing.</b> Routine tests only, or the optional tests the specification asked for. Witness testing included or extra. See <a class="inline" href="guide-fat-vs-sat.html">FAT vs. SAT</a>.</li>
    <li><b>Site services.</b> Assembly, oil filling, commissioning support, training.</li>
    <li><b>Taxes and duties.</b></li>
  </ul>
  <p>Where a bid leaves something out, ask the bidder for a price, in writing, and enter it. If time does not allow, enter the highest price any other bidder gave for that item and mark it as an allowance. What you must not do is compare a complete bid with an incomplete one and call the difference a saving.</p>` },
    { id: 'read-the-exceptions', h2: 'Step 2: read the exceptions', html: `
  <p>Every serious bid has a section called exceptions, clarifications or deviations. It lists where the offer departs from your specification and your terms. Typical entries: a different impedance, a lower temperature rating, a substitute component manufacturer, a shorter warranty, a cap on liability, a refusal of liquidated damages.</p>
  <p>Each exception is one of three things. It is acceptable as it stands, it is acceptable at a price, or it disqualifies the bid. Decide which, with the engineer for technical items and whoever owns the contract terms for commercial ones, and record the decision in the table. A bid with no exceptions listed deserves a second look as well: either the bidder complies in full, or the bidder did not read the specification.</p>` },
    { id: 'evaluate-losses', h2: 'Step 3: add the cost of losses', html: `
  <p>A transformer consumes energy every hour it is energized. <b>No-load loss</b> is drawn by the core all the time, whatever the load. <b>Load loss</b> is drawn in the windings and rises with the square of the load. Over a service life of decades the cost of that energy can rival the purchase price, and two bids at a similar price can differ a great deal in losses.</p>
  <p>The standard way to bring losses into the comparison is to give each kilowatt of loss a present value and add it to the price:</p>
  <p><b>Total owning cost = purchase price + (A &times; no-load loss) + (B &times; load loss)</b></p>
  <p>A and B are in dollars per kilowatt. The owner sets them from its energy cost, the expected loading, the years of service and its discount rate. A is always the larger, since no-load loss runs continuously. State both factors in the request for quotation, so bidders can design to them, and require guaranteed loss figures with a stated tolerance.</p>
  <p>An example, with round illustrative numbers that are not market prices, and assumed factors of A = $8,000 per kW and B = $2,500 per kW:</p>
  <table class="reftable">
    <tr><th scope="col"></th><th scope="col">Bidder 1</th><th scope="col">Bidder 2</th></tr>
    <tr><td>Purchase price</td><td>$100,000</td><td>$94,000</td></tr>
    <tr><td>No-load loss</td><td>2.5 kW</td><td>3.4 kW</td></tr>
    <tr><td>Load loss</td><td>22 kW</td><td>26 kW</td></tr>
    <tr><td>A &times; no-load loss</td><td>$20,000</td><td>$27,200</td></tr>
    <tr><td>B &times; load loss</td><td>$55,000</td><td>$65,000</td></tr>
    <tr><td><b>Total owning cost</b></td><td><b>$175,000</b></td><td><b>$186,200</b></td></tr>
  </table>
  <p>Bidder 2 is $6,000 cheaper to buy and $11,200 more expensive to own. The same reasoning applies, with different inputs, to the efficiency of a UPS, a motor or a chiller: wherever equipment runs for years, the energy it wastes belongs in the comparison.</p>` },
    { id: 'compare-the-terms', h2: 'Step 4: compare the terms that are not a price', html: `
  <p>Some differences cannot be turned into dollars cleanly, and they still decide projects. Put them in the table in plain words:</p>
  <ul>
    <li><b>Lead time,</b> stated from the same starting point for each bidder: from order, or from drawing approval. These can differ by months. Note how long the drawing cycle is and whether the date is guaranteed.</li>
    <li><b>Payment terms.</b> A large payment with the order costs money and removes leverage. Compare the milestones side by side.</li>
    <li><b>Warranty.</b> Length, when it starts, and whether it covers removal, shipping and reinstallation or only the repair.</li>
    <li><b>Late delivery.</b> Whether liquidated damages were accepted, and at what rate and cap.</li>
    <li><b>Where it is built and tested,</b> and by whom. This matters for domestic content rules and for witness testing.</li>
    <li><b>Service and spares</b> after delivery.</li>
    <li><b>Validity.</b> How long the price holds, and whether it is fixed or tied to a metals index.</li>
  </ul>` },
    { id: 'recommend-and-record', h2: 'Step 5: recommend, and write down why', html: `
  <p>The finished table should let someone who was not in the room see why the recommended bidder was chosen. State the basis in a sentence: lowest total owning cost among technically compliant bids that meet the required date, for example. If the recommendation is not the lowest evaluated cost, say what outweighed it. Keep the bids, the clarification emails and the table together. The <a class="inline" href="templates/bid-tabulation.html">bid tabulation template</a> has a place for each of these.</p>
  <p>Treat bidders evenly throughout. A clarification that changes the scope goes to all of them, and one bidder&rsquo;s price is never shown to another.</p>` },
  ],
  faqs: [
    { q: 'What is a bid tabulation?', a: 'A table that lists each bidder&rsquo;s price, scope, technical data, delivery and commercial terms side by side on the same basis, so the bids can be compared fairly and the reason for the award is recorded.' },
    { q: 'What are A and B factors in a transformer bid evaluation?', a: 'They are dollar values per kilowatt that an owner assigns to transformer losses. A applies to no-load loss and B to load loss. Total owning cost is the purchase price plus A times the no-load loss plus B times the load loss, and bids are compared on that total.' },
    { q: 'Should I always pick the lowest bid?', a: 'Pick the lowest bid only after the scopes have been leveled, exceptions resolved and operating costs added. The lowest price on the cover page is often missing scope, carries exceptions to the specification or has higher losses.' },
    { q: 'How many bids do I need?', a: 'Three is the usual minimum for a meaningful comparison, and many organizations&rsquo; procurement rules require it. For long-lead equipment with few qualified manufacturers, fewer may be all that is available; record why.' },
  ],
  nextIntro: 'The comparison starts with a request that asks every bidder the same question and ends with an order that records what was agreed. The loss terms used here are explained in <a class="inline" href="guide-transformer-nameplate.html">how to read a transformer nameplate</a> and <a class="inline" href="guide-transformer-impedance.html">transformer impedance</a>.',
  calcsHead: 'Use the templates',
  calcs: TPL,
  guides: [
    ['guide-vendor-qualification.html', 'How to Qualify an Equipment Vendor'],
    ['guide-incoterms-for-equipment.html', 'Incoterms 2020 for Heavy Equipment'],
    ['guide-fat-vs-sat.html', 'FAT vs. SAT'],
    ['guide-transformer-lead-times.html', 'Transformer Lead Times'],
  ],
  covers: 'How to build a bid tabulation for engineered equipment: leveling scope, handling exceptions, evaluating transformer losses with A and B factors, comparing lead time and commercial terms, and recording the recommendation.',
  basedOn: ['IEEE C57.120 &mdash; Guide for Loss Evaluation of Distribution and Power Transformers and Reactors', 'IEEE C57.12.00 &mdash; general requirements for liquid-immersed transformers, for loss definitions and tolerances', 'General competitive procurement practice'],
  notThis: 'A set of loss evaluation factors for your system, or procurement rules for your organization. A and B factors must be derived from your own energy costs, loading and financial assumptions, and the figures in the example are illustrative only.',
},
{
  slug: 'guide-fat-vs-sat',
  date: DATE,
  eyebrow: 'Procurement & logistics',
  crumb: 'FAT vs. SAT',
  h1: 'FAT vs. SAT: Factory and Site Acceptance Testing Explained',
  title: 'FAT vs. SAT: Factory and Site Acceptance Tests',
  headline: 'FAT vs. SAT: What Is Tested at the Factory, What Is Tested on Site, and Who Signs',
  dek: 'A factory acceptance test proves the equipment was built right before it ships. A site acceptance test proves it arrived intact and was installed right. Each catches problems the other cannot, and both have to be written into the order to exist.',
  description: 'FAT vs. SAT explained: what a factory acceptance test and a site acceptance test each prove, witness and hold points, the inspection and test plan, and how to handle a punch list.',
  ogDesc: 'What a factory acceptance test and a site acceptance test each prove, and how witness points and punch lists work.',
  keywords: 'FAT vs SAT, factory acceptance test, site acceptance test, witness test, hold point, inspection and test plan, ITP, punch list, routine tests transformer',
  photo: null,
  takeaways: [
    'FAT happens at the manufacturer before shipment and checks the equipment against the specification and approved drawings.',
    'SAT happens after installation and checks that nothing was damaged in transit and that the equipment works in its real surroundings.',
    'A problem found at the factory is fixed by the people and tools that built the equipment. The same problem found on site costs many times more.',
    'Witness and hold points must be in the purchase order. So must the rule that equipment does not ship until the punch list is closed or agreed.',
  ],
  sections: [
    { id: 'the-difference', h2: 'The difference in one paragraph', html: `
  <p><b>A factory acceptance test (FAT) is carried out at the manufacturer&rsquo;s works before the equipment ships, to show that it meets the specification. A site acceptance test (SAT) is carried out after the equipment is installed, to show that it survived the journey and works where it will be used.</b> The FAT is the buyer&rsquo;s last chance to have a fault corrected in the factory. The SAT is the first proof that the installed system does its job.</p>
  <table class="reftable">
    <tr><th scope="col"></th><th scope="col">FAT</th><th scope="col">SAT</th></tr>
    <tr><td>Where</td><td>Manufacturer&rsquo;s works</td><td>Project site, installed</td></tr>
    <tr><td>When</td><td>Before shipment</td><td>After installation, before or during commissioning</td></tr>
    <tr><td>Proves</td><td>Built to specification and drawings</td><td>Undamaged, correctly installed, works with the real system</td></tr>
    <tr><td>Run by</td><td>Manufacturer, witnessed by buyer</td><td>Contractor or testing firm, often with manufacturer support</td></tr>
    <tr><td>Ends with</td><td>Release for shipment</td><td>Acceptance, energization or handover</td></tr>
  </table>` },
    { id: 'what-a-fat-covers', h2: 'What a FAT covers', html: `
  <p>The content depends on the equipment, and the governing standard names the tests. Standards generally sort tests into <b>routine tests</b>, done on every unit, and <b>design tests</b> (also called type tests), done once on a representative unit to prove the design. A buyer normally receives routine test results for its own units and design test reports from an earlier identical or similar unit, unless the order pays for the design tests to be repeated.</p>
  <ul>
    <li><b>Transformers:</b> ratio, polarity and phase relation, winding resistance, no-load loss and excitation current, load loss and impedance, dielectric tests, and for liquid-filled units a leak test. The measured losses are the ones compared with the guaranteed figures from the <a class="inline" href="guide-how-to-compare-equipment-bids.html">bid evaluation</a>.</li>
    <li><b>Switchgear and switchboards:</b> a check against the drawings, wiring and control checks, mechanical operation and interlocks, dielectric tests, and functional tests of protection and control with relays set and trip circuits proven.</li>
    <li><b>Generators and UPS:</b> load tests in steps up to rated load, transient response to load steps, alarms and shutdowns, and for a UPS the transfers to and from bypass and battery.</li>
    <li><b>Packaged systems,</b> such as power skids and battery containers: an integrated test with everything connected, including controls, communications and fire detection interfaces.</li>
  </ul>
  <p>Alongside the electrical tests there is a visual and dimensional inspection: nameplate data, bill of materials, paint, labels, terminal markings, and the anchoring and cable entry details the site crew is counting on.</p>` },
    { id: 'witness-and-hold-points', h2: 'Witness points, hold points and the ITP', html: `
  <p>The document that organizes all this is the <b>inspection and test plan</b> (ITP). It lists each inspection and test in sequence, the procedure and acceptance criteria for it, and what the buyer&rsquo;s involvement is. That involvement comes in three levels:</p>
  <ul>
    <li><b>Hold point.</b> Work stops until the buyer has attended or has released the point in writing.</li>
    <li><b>Witness point.</b> The buyer is notified and may attend. If the buyer does not come, the work goes on.</li>
    <li><b>Review.</b> The buyer receives the records afterwards.</li>
  </ul>
  <p>Ask for the ITP with the approval drawings and agree it before fabrication. Put the notice period for witness points in the order: ten working days is common, since travel has to be booked. And decide who attends. A witness who does not know the equipment can only confirm that a test took place.</p>` },
    { id: 'the-punch-list', h2: 'The punch list and release for shipment', html: `
  <p>Almost every FAT finds something: a mislabelled terminal, a relay setting, a missing accessory, sometimes a failed test. Each finding goes on a punch list with an owner and a date. The decision that matters is which items must be closed <b>before shipment</b> and which can be finished on site.</p>
  <p>The rule of thumb is simple. Anything that needs factory tools, factory people or a retest stays at the factory. Agreeing to &ldquo;fix it on site&rdquo; moves the cost and the schedule risk to the project, and field repairs to a transformer or a tested assembly are rarely as good as factory ones. The order should say that the equipment is not released for shipment until the buyer signs the release, and should tie a payment milestone to that signature.</p>
  <p>The FAT report, the test data and the closed punch list travel with the documents the order requires. Check them against the delivery when it arrives, using the <a class="inline" href="templates/proof-of-delivery.html">proof of delivery</a>.</p>` },
    { id: 'what-a-sat-covers', h2: 'What a SAT covers', html: `
  <p>Transport and installation are hard on equipment. A SAT starts with what the journey may have changed and then moves to what the factory could not test:</p>
  <ul>
    <li><b>Receiving checks:</b> impact recorder readings, pressure or oil level, visible damage.</li>
    <li><b>Repeat of selected factory tests</b> to compare with the FAT values: insulation resistance, turns ratio, winding resistance, contact resistance. A change from the factory figure is the signal to look for.</li>
    <li><b>Installation checks:</b> anchoring, clearances, grounding and bonding, cable terminations and torque, phasing.</li>
    <li><b>Functional tests with the real system:</b> protection trips to the actual breakers, interlocks between pieces of equipment from different vendors, controls and monitoring through to the plant system.</li>
    <li><b>Energization and load,</b> with readings recorded.</li>
  </ul>
  <p>Site testing of electrical equipment is commonly specified to recognized acceptance testing standards, which give the tests and expected values for each equipment type. Whether the SAT is the same thing as commissioning or one step within it varies from project to project, so define it in the contract.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Not putting the FAT in the order.</b> A witness test requested after award is a change order.</li>
    <li><b>Waiving the FAT to save schedule.</b> The time saved is usually spent several times over on site.</li>
    <li><b>Accepting design test reports from a unit that is not really similar.</b></li>
    <li><b>Shipping with an open punch list and no agreement on who closes it.</b></li>
    <li><b>Skipping the comparison between site and factory values.</b> A site test result means most when set beside the factory one.</li>
    <li><b>Treating a signed delivery receipt as acceptance.</b> Acceptance comes after the SAT.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is the difference between FAT and SAT?', a: 'A factory acceptance test is done at the manufacturer before shipment to prove the equipment meets the specification. A site acceptance test is done after installation to prove it was not damaged in transit, was installed correctly and works with the real system.' },
    { q: 'Is a factory acceptance test mandatory?', a: 'Manufacturers perform routine tests on every unit as their standards require, but a FAT witnessed by the buyer happens only if the purchase order calls for it. For major equipment it is strongly advisable.' },
    { q: 'What is the difference between a hold point and a witness point?', a: 'At a hold point the manufacturer cannot proceed until the buyer has attended or released the point in writing. At a witness point the buyer is notified and may attend, but work continues if the buyer does not come.' },
    { q: 'What is an inspection and test plan?', a: 'A document that lists every inspection and test in order, with the procedure, the acceptance criteria and the buyer&rsquo;s involvement at each step: hold, witness or review of records.' },
  ],
  nextIntro: 'Tests have to be asked for in the request for quotation and fixed in the purchase order, with a payment milestone tied to passing them. What a short-circuit study expects of the tested equipment is covered in <a class="inline" href="guide-short-circuit-studies-breaker-coordination.html">short-circuit studies and breaker coordination</a>.',
  calcsHead: 'Use the templates',
  calcs: [TPL[2], TPL[0], LOG[2]],
  guides: [
    ['guide-how-to-compare-equipment-bids.html', 'How to Compare Equipment Bids'],
    ['guide-vendor-qualification.html', 'How to Qualify an Equipment Vendor'],
    ['guide-transformer-nameplate.html', 'How to Read a Transformer Nameplate'],
    ['guide-incoterms-for-equipment.html', 'Incoterms 2020 for Heavy Equipment'],
  ],
  covers: 'What factory and site acceptance tests each prove, typical FAT content for transformers, switchgear, generators, UPS and packaged systems, routine and design tests, inspection and test plans with hold and witness points, punch lists, release for shipment, and typical SAT content.',
  basedOn: ['IEEE C57.12.00 and C57.12.90 &mdash; transformer test classification and test code', 'IEEE C37.20 series &mdash; production tests for metal-enclosed switchgear', 'ANSI/NETA ATS &mdash; Standard for Acceptance Testing Specifications for Electrical Power Equipment and Systems', 'IEC 62381 &mdash; factory acceptance test, site acceptance test and site integration test for automation systems, for the terminology'],
  notThis: 'A test procedure or a list of the tests your equipment requires. Those come from the governing equipment standard, the specification and the manufacturer&rsquo;s procedures.',
},
{
  slug: 'guide-vendor-qualification',
  date: DATE,
  eyebrow: 'Procurement & logistics',
  crumb: 'How to Qualify an Equipment Vendor',
  h1: 'How to Qualify an Equipment Vendor: Prequalification and Scorecards',
  title: 'How to Qualify an Equipment Vendor (Prequalification)',
  headline: 'How to Qualify an Equipment Vendor: What to Check Before the Bid and What to Measure After',
  dek: 'A bid is a promise. Vendor qualification is the work of finding out whether the company making it can keep it: build the equipment, test it, deliver it on the date and still be there when the warranty is called.',
  description: 'How to prequalify a manufacturer of transformers, switchgear or other power equipment: capability, quality system, references, capacity, financial health, and a scorecard for performance.',
  ogDesc: 'What to check before a manufacturer goes on the bid list, and what to measure once the order is placed.',
  keywords: 'vendor qualification, supplier prequalification, vendor prequalification checklist, approved vendor list, supplier scorecard, vendor management, factory audit, supplier evaluation',
  photo: null,
  takeaways: [
    'Qualify vendors before the request for quotation goes out. A bid from a vendor you would not award to wastes everyone&rsquo;s time and distorts the comparison.',
    'Check six things: technical capability, quality system, track record, capacity, financial standing and compliance.',
    'A reference is only useful if it is for the same kind of equipment at a similar rating, and if you speak to the person who received it.',
    'After award, measure the vendor on a few facts: dates met, drawing turnaround, test results, and how problems were handled.',
  ],
  sections: [
    { id: 'why-qualify', h2: 'Why qualify before bidding', html: `
  <p><b>Vendor qualification is the check, made before a company is invited to bid, that it is able to supply what you need to the standard you need.</b> The companies that pass go on an approved vendor list, sometimes called an approved manufacturers list, and bids are invited from that list.</p>
  <p>Doing it first matters for a practical reason. Once prices are on the table, an unqualified low bid is very hard to set aside. It pulls the budget expectation down and puts pressure on the qualified bidders, and if it is accepted the project inherits the risk. Long-lead equipment makes this worse: by the time a vendor&rsquo;s shortcomings show, the alternative is another full manufacturing cycle. See <a class="inline" href="guide-transformer-lead-times.html">transformer lead times</a> for how long that can be.</p>` },
    { id: 'six-checks', h2: 'Six things to check', html: `
  <h3>1. Technical capability</h3>
  <p>Has the vendor built this type of equipment at this rating and voltage class, in its own factory? Ask for a supply record of similar units with ratings and dates. Ask where the equipment will be built, since a company with several plants may qualify at one and not another. Ask what the factory can test in-house: a manufacturer that cannot perform the tests your specification requires will be sending the unit elsewhere or asking for a waiver. See <a class="inline" href="guide-fat-vs-sat.html">FAT vs. SAT</a>.</p>
  <h3>2. Quality system</h3>
  <p>Certification to ISO 9001 shows that a quality management system exists and is audited. It is a starting point. What tells you more is how the vendor handles nonconformances, how it controls its own suppliers of critical parts such as core steel, bushings, breakers and relays, and whether the product carries the listings and certifications your project requires. For major equipment a factory audit, in person, is worth the trip.</p>
  <h3>3. Track record</h3>
  <p>Ask for references for comparable equipment and call them. Ask the person who received the equipment whether it arrived on the acknowledged date, how the drawings and the factory test went, what failed in service, and how the vendor responded. Ask whether they would order again.</p>
  <h3>4. Capacity</h3>
  <p>A capable factory with a full order book will still deliver late. Ask for the current lead time and what it is measured from, how much of the plant&rsquo;s capacity is already committed, and which components the vendor is itself waiting on.</p>
  <h3>5. Financial standing</h3>
  <p>Equipment orders involve advance payments and a warranty that runs for years. Both depend on the vendor staying in business. Review financial statements or a credit report in proportion to the size of the order, and consider security for advance payments, such as a bank guarantee or a bond, where the exposure is large.</p>
  <h3>6. Compliance and support</h3>
  <p>Confirm what the project requires: country of origin and domestic content, covered in the <a class="inline" href="guide-buy-america-iija.html">Buy America</a> and <a class="inline" href="guide-feoc-compliance.html">FEOC</a> guides, safety record for any site work, insurance, and export or sanctions restrictions. Then ask who answers the phone after delivery: where the service engineers are based, where spares are held and how long the vendor has supported earlier product generations.</p>` },
    { id: 'the-questionnaire', h2: 'The prequalification questionnaire', html: `
  <p>The usual tool is a questionnaire sent to each prospective vendor, with the same questions for all and a request for evidence, not statements. Keep it short enough that a good vendor will answer it properly. A useful one asks for:</p>
  <ul>
    <li>Legal entity, ownership, and the manufacturing location proposed</li>
    <li>Supply record for comparable equipment over the last five years</li>
    <li>Test facilities and their limits</li>
    <li>Quality certificates and product listings, with certificate numbers and expiry dates</li>
    <li>Sources of critical components</li>
    <li>Current lead time and capacity</li>
    <li>Three references with contact details</li>
    <li>Financial statements or a credit reference</li>
    <li>Warranty terms and service locations</li>
  </ul>
  <p>Score the answers against criteria you set beforehand, with a pass mark, and record the result. Some criteria are pass or fail by nature: a vendor that cannot meet a legal content requirement does not qualify however well it scores elsewhere.</p>` },
    { id: 'scorecards', h2: 'After award: the vendor scorecard', html: `
  <p>Qualification is a forecast. Performance on an order is the evidence. A scorecard records that evidence in a form that can be compared across vendors and fed back into the approved list. It works best with a handful of measures that come from dates and documents already on file:</p>
  <table class="reftable">
    <tr><th scope="col">Measure</th><th scope="col">How to take it</th></tr>
    <tr><td>On-time delivery</td><td>Actual delivery date against the date acknowledged on the order</td></tr>
    <tr><td>Drawing turnaround</td><td>Days from order to first submittal, and number of resubmittals</td></tr>
    <tr><td>Quality at the factory</td><td>FAT passed first time or not; punch list items at release</td></tr>
    <tr><td>Quality on arrival</td><td>Exceptions on the proof of delivery; defects found at site testing</td></tr>
    <tr><td>Documentation</td><td>Test reports and manuals complete and on time</td></tr>
    <tr><td>Responsiveness</td><td>Time to answer technical queries and to resolve warranty claims</td></tr>
    <tr><td>Commercial conduct</td><td>Change orders raised, and whether they were justified</td></tr>
  </table>
  <p>Share the scorecard with the vendor. Most will improve what they know is being measured, and a vendor that disputes a date is giving you a chance to correct your own records. Review the approved list on a schedule, since factories change hands, key people leave and a vendor that was excellent three years ago may not be now.</p>` },
    { id: 'common-mistakes', h2: 'Common mistakes', html: `
  <ul>
    <li><b>Qualifying the brand and not the factory.</b></li>
    <li><b>Accepting references without calling them.</b></li>
    <li><b>Treating a quality certificate as proof of quality.</b></li>
    <li><b>Adding an unqualified vendor to the bid list &ldquo;to keep the others honest&rdquo;.</b></li>
    <li><b>Never removing anyone from the approved list.</b></li>
    <li><b>Scoring vendors on impressions.</b> Use dates and documents.</li>
  </ul>` },
  ],
  faqs: [
    { q: 'What is vendor prequalification?', a: 'The process of checking, before inviting bids, that a supplier has the technical capability, quality system, track record, capacity, financial standing and compliance to supply what is needed. Suppliers that pass go on an approved vendor list.' },
    { q: 'What is an approved vendor list?', a: 'A list of suppliers that an organization has qualified to supply a given type of equipment. Bids are invited from the list, and the list is reviewed as vendors&rsquo; performance and circumstances change. It is also called an approved manufacturers list.' },
    { q: 'What should a vendor scorecard measure?', a: 'A small number of factual measures: on-time delivery against the acknowledged date, drawing turnaround, factory test results, condition on arrival, completeness of documentation, responsiveness, and the number and merit of change orders.' },
    { q: 'Is ISO 9001 certification enough to qualify a manufacturer?', a: 'No. It shows that a quality management system exists and is audited, which is a reasonable minimum. It does not show that the manufacturer has built your type of equipment, can test it, has capacity or is financially sound.' },
  ],
  nextIntro: 'Qualified vendors receive the request for quotation, their bids go into the tabulation, and the order records what was agreed. Performance against that order is what the scorecard measures.',
  calcsHead: 'Use the templates',
  calcs: TPL,
  guides: [
    ['guide-how-to-compare-equipment-bids.html', 'How to Compare Equipment Bids'],
    ['guide-fat-vs-sat.html', 'FAT vs. SAT'],
    ['guide-transformer-lead-times.html', 'Transformer Lead Times'],
    ['guide-feoc-compliance.html', 'FEOC Compliance'],
  ],
  covers: 'Why vendors are qualified before bidding, six areas to check for manufacturers of power equipment, what a prequalification questionnaire asks for, and a scorecard of factual measures for performance after award.',
  basedOn: ['ISO 9001 &mdash; Quality management systems, requirements, including its provisions on control of externally provided products', 'General procurement and supplier quality practice for engineered equipment'],
  notThis: 'An assessment of any particular manufacturer, or procurement rules for your organization. Voltfield does not rate, rank or recommend vendors.',
},
];
