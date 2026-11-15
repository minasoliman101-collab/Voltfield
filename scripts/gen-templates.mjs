#!/usr/bin/env node
/* Generates the document templates: templates.html (hub) and templates/<slug>.html.
 *
 *   node scripts/gen-templates.mjs            # all
 *   node scripts/gen-templates.mjs purchase-order
 *
 * Each template is a form laid out as the document itself. It fills in the
 * browser, remembers what was typed (localStorage, this device only), and
 * prints as the document with the site chrome stripped, so "Print" gives a
 * blank form or a completed one. Behaviour lives in /voltfield-templates.js,
 * layout in /voltfield-templates.css; this file only holds the fields and the
 * words around them.
 *
 * Example values are placeholders. Prices in particular are round numbers and
 * say so on the page: the site does not publish invented market prices.
 *
 * New slugs still have to go into sitemap.xml, _redirects and search-index.json.
 */
import { page, crumbNav, write, esc } from './lib-shell.mjs';
import { MORE } from './template-specs-2.mjs';

const DATE_ISO = '2026-11-15';
const DATE_LONG = 'November 15, 2026';
const INCOTERMS = ['', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'];

/* field: [id, label, opts]  opts: {t:'area|date|select|time', ex, span, opts, rows} */
const T = [
{
  slug: 'purchase-order', key: 'po', short: 'Purchase order', badge: 'PO', group: 'run',
  h1: 'Purchase Order Template for Electrical and Power Equipment',
  title: 'Purchase Order Template for Equipment (Free, Fillable) | Voltfield',
  desc: 'A free purchase order template for transformers, switchgear, generators and other engineered equipment. Fill it in the browser, print it or save it as a PDF.',
  card: 'Line items with totals, Incoterms, and the equipment terms a generic PO leaves out: approval drawings, factory tests, documentation.',
  dek: 'A purchase order built for engineered equipment, with the terms a generic PO form has no room for. Fill it in here, then print it or save it as a PDF.',
  intro: '<b>A purchase order is the buyer&rsquo;s written offer to buy: what, how many, at what price, delivered where and when, and on what terms.</b> Once the vendor accepts it, it is the contract both sides work to. For a pallet of fittings a one-page form is enough. For a transformer or a lineup of switchgear the price is the easy part, and the arguments later are about drawings, tests, documents and dates. This template gives those their own section.',
  docTitle: 'Purchase Order',
  head: [['po_no', 'PO number', { ex: 'PO-2026-0148' }], ['po_date', 'Date', { t: 'date', ex: '2026-11-15' }], ['po_rev', 'Revision', { ex: '0' }]],
  blocks: [
    { grid: 3, fields: [
      ['buyer', 'Buyer', { t: 'area', rows: 4, ex: 'Example Energy Partners LLC\n100 Substation Road\nAustin, TX 78701\nAP: ap@example.com' }],
      ['vendor', 'Vendor', { t: 'area', rows: 4, ex: 'Example Transformer Co.\n2500 Foundry Avenue\nMilwaukee, WI 53201' }],
      ['shipto', 'Ship to', { t: 'area', rows: 4, ex: 'Example Data Hall 2, Laydown B\n4400 County Road 12\nTaylor, TX 76574\nSite contact: 555-0100' }] ] },
    { grid: 4, fields: [
      ['buyer_contact', 'Buyer contact', { ex: 'J. Rivera, 555-0101' }],
      ['vendor_contact', 'Vendor contact', { ex: 'Inside sales, 555-0102' }],
      ['quote_ref', 'Vendor quote no. and date', { ex: 'Q-88213 rev B, 2026-10-30' }],
      ['project', 'Project / job no.', { ex: 'DH2-ELEC-014' }],
      ['pay_terms', 'Payment terms', { ex: 'Net 30 after each milestone' }],
      ['incoterm', 'Incoterms 2020 rule', { t: 'select', opts: INCOTERMS, ex: 'DAP' }],
      ['named_place', 'Named place', { ex: 'Taylor, TX site, on truck' }],
      ['need_date', 'Required on site', { t: 'date', ex: '2027-08-16' }],
      ['ship_via', 'Ship via', { ex: 'Vendor-arranged flatbed' }],
      ['currency', 'Currency', { ex: 'USD' }],
      ['tax_status', 'Tax status', { ex: 'Taxable, TX' }],
      ['spec_ref', 'Governing specification', { ex: 'Spec 26 12 19 rev 2' }] ] },
    { table: 'items', add: true, money: true, cols: [
      ['line', 'Line', 'w6'], ['desc', 'Description and specification reference', 'wide'], ['qty', 'Qty', 'w8 num'],
      ['unit', 'Unit', 'w8'], ['price', 'Unit price', 'w14 num'], ['amount', 'Amount', 'w14 num calc'] ],
      rows: 5, ex: [
        ['1', 'Pad-mounted transformer, 2500 kVA, 34.5 kV delta to 480Y/277 V, 5.75% Z, per Spec 26 12 19 rev 2 and data sheet DS-01', '2', 'ea', '100000.00'],
        ['2', 'Factory witness test, one unit, two buyer attendees', '1', 'lot', '5000.00'],
        ['3', 'Spare parts per data sheet DS-01 section 9', '1', 'lot', '2500.00'] ] },
    { totals: [['subtotal', 'Subtotal', 'calc'], ['tax', 'Tax', ''], ['freight', 'Freight', ''], ['total', 'Total', 'calc']], ex: { tax: '0.00', freight: '0.00' } },
    { heading: 'Equipment terms' },
    { grid: 2, fields: [
      ['standards', 'Applicable standards and listings', { t: 'area', rows: 2, ex: 'IEEE C57.12.34, IEEE C57.12.00, DOE 2016 efficiency. UL listed.' }],
      ['drawings', 'Approval drawings', { t: 'area', rows: 2, ex: 'Due 4 weeks after receipt of order. Buyer returns comments within 10 working days. No fabrication before release.' }],
      ['tests', 'Factory tests and witness points', { t: 'area', rows: 2, ex: 'Routine tests per IEEE C57.12.90 on every unit. Witness on unit 1 with 10 working days notice.' }],
      ['docs', 'Documents to be delivered', { t: 'area', rows: 2, ex: 'Certified test reports, as-built drawings, O&M manual, nameplate photo. Two copies, PDF.' }],
      ['warranty', 'Warranty', { t: 'area', rows: 2, ex: '24 months from energization or 30 months from delivery, whichever comes first.' }],
      ['late', 'Delivery terms and late delivery', { t: 'area', rows: 2, ex: 'Time is of the essence. Liquidated damages 0.5% of unit price per week late, capped at 10%.' }],
      ['milestones', 'Payment milestones', { t: 'area', rows: 2, ex: '10% drawing approval, 40% tests passed, 40% delivery, 10% final documents.' }],
      ['notes', 'Notes and special instructions', { t: 'area', rows: 2, ex: 'Call site contact 48 hours before delivery. Deliveries 07:00 to 15:00 weekdays only.' }] ] },
    { sign: [['Authorized by (buyer)', 'auth'], ['Accepted by (vendor)', 'acc']] },
    { foot: 'This order is governed by the terms stated above and in the documents it references. Any vendor terms that add to or differ from them apply only if the buyer agrees in writing.' }
  ],
  notes: [
    ['PO number, date and revision', 'One number per order, never reused. When anything changes after acceptance, issue the same number with the next revision and state what changed. Two documents with the same number and different contents is how invoices get paid against the wrong price.'],
    ['Buyer, vendor, ship to', 'Use legal entity names, the ones on the contract and the tax forms. The ship-to is very often not the buyer&rsquo;s address: give the site, the gate or laydown area, and a person with a phone number.'],
    ['Vendor quote number', 'Tie the order to the exact quote and its revision. If the order departs from the quote anywhere, say so on the line concerned, because a bare reference pulls in everything the quote said, including the vendor&rsquo;s exceptions.'],
    ['Incoterms rule and named place', 'The three letters are only half of it. The rule says who arranges and pays for carriage and, more to the point, where risk passes. It means nothing without the place: &ldquo;DAP Taylor, TX site, on truck&rdquo; tells you the vendor carries the risk to your gate and you unload. Incoterms say nothing about title or payment, so state those separately.'],
    ['Required on site', 'Give the date you need the equipment, not the date you would like the vendor to ship. If the vendor&rsquo;s acknowledged date differs, the difference needs resolving before fabrication starts, not when the crane is booked.'],
    ['Line items', 'Describe each line so that someone who never saw the quote could check the delivery against it: rating, voltage, key options and the specification or data sheet that carries the rest. Services such as witness tests, commissioning support and training get lines of their own so they can be invoiced and closed separately.'],
    ['Approval drawings', 'State when drawings are due, how long you take to return them and that nothing is built before release. On long-lead equipment the drawing cycle is where schedule is most often lost, and it is lost on the buyer&rsquo;s side as often as the vendor&rsquo;s.'],
    ['Factory tests and witness points', 'Name the tests and the standard they are run to, and say which ones you intend to witness and how much notice you need. A witness point that is not in the order is a favor the vendor may or may not grant.'],
    ['Documents to be delivered', 'List them and tie the last payment to them. Test reports and as-built drawings are far easier to get before the final invoice is paid than after.'],
    ['Late delivery', 'If late delivery will cost you money, put the remedy in the order. Liquidated damages need a rate, a cap and a clear trigger date. Have counsel check the wording, because an unenforceable clause is worse than none.'],
  ],
  mistakes: [
    'Ordering &ldquo;per quote&rdquo; and so accepting every exception the vendor took to your specification.',
    'An Incoterms rule with no named place, or FOB used for truck freight when the rule is written for sea freight. For containers and trucks, FCA, CPT, DAP or DDP are the rules that fit.',
    'A required date with no consequence for missing it and no milestone dates before it.',
    'Paying 100% on delivery, which leaves nothing to hold against missing test reports and manuals.',
    'Changing scope by email and never revising the order.',
  ],
  faq: [
    ['Is a purchase order a contract?', 'It becomes one when the vendor accepts it, whether by signing it, sending an order acknowledgment or starting the work. Until then it is an offer. That is why the acceptance block and the vendor&rsquo;s acknowledgment matter: check the acknowledgment against the order line by line, because differing terms on it can change the deal.'],
    ['What is the difference between a purchase order and an invoice?', 'The purchase order comes from the buyer before the work and says what is being bought. The invoice comes from the vendor afterwards and asks for payment. Accounts payable matches the invoice to the order and to proof that the goods arrived, which is the three-way match.'],
    ['What should an equipment purchase order include that an ordinary one does not?', 'The governing specification and data sheets, the approval drawing cycle, factory tests and witness points, the documents to be handed over, payment milestones tied to those events, the warranty start, and what happens if delivery is late.'],
    ['Can I use this template as it stands?', 'It is a general template for laying out an order clearly. It is not legal advice and it does not replace your company&rsquo;s terms and conditions. Have the wording that matters to you, such as warranty, liability and damages, reviewed by someone qualified to do so.'],
  ],
  related: [['bill-of-lading', 'Bill of lading template'], ['proof-of-delivery', 'Proof of delivery template'], ['/specification-checklist.html', 'Specification checklist'], ['/guide-transformer-nameplate.html', 'How to read a transformer nameplate']],
},
{
  slug: 'bill-of-lading', key: 'bol', short: 'Bill of lading', badge: 'BOL', group: 'ship',
  h1: 'Bill of Lading Template (Straight, Truck Freight)',
  title: 'Bill of Lading Template (Free, Fillable BOL) | Voltfield',
  desc: 'A free straight bill of lading template for truck freight. Fill in shipper, consignee, carrier and commodity lines in the browser, then print it or save it as a PDF.',
  card: 'Straight BOL for truck freight: shipper, consignee, carrier, freight terms and commodity lines with weight totals.',
  dek: 'A straight bill of lading for truck freight, laid out the way carriers expect it. Fill it in here, then print it or save it as a PDF.',
  intro: '<b>A bill of lading does three jobs at once: it is the carrier&rsquo;s receipt for the freight, the contract of carriage, and the instruction that says who the freight is to be delivered to.</b> A straight bill of lading, the kind used for almost all domestic truck freight, names one consignee and is not negotiable. The shipper prepares it, the driver signs it at pickup, and a copy travels with the load.',
  docTitle: 'Straight Bill of Lading',
  sub: 'Short form, not negotiable',
  head: [['bol_no', 'BOL number', { ex: 'BOL-004512' }], ['bol_date', 'Ship date', { t: 'date', ex: '2027-08-12' }], ['bol_page', 'Page', { ex: '1 of 1' }]],
  blocks: [
    { grid: 3, fields: [
      ['shipfrom', 'Ship from (shipper)', { t: 'area', rows: 4, ex: 'Example Transformer Co.\n2500 Foundry Avenue, Dock 3\nMilwaukee, WI 53201\nShipping: 555-0102' }],
      ['shipto', 'Ship to (consignee)', { t: 'area', rows: 4, ex: 'Example Energy Partners LLC\nExample Data Hall 2, Laydown B\n4400 County Road 12\nTaylor, TX 76574\nSite contact: 555-0100' }],
      ['billto', 'Third-party freight charges bill to', { t: 'area', rows: 4, ex: '' }] ] },
    { grid: 4, fields: [
      ['carrier', 'Carrier name', { ex: 'Example Heavy Haul Inc.' }],
      ['scac', 'SCAC', { ex: 'EXHH' }],
      ['pro', 'PRO number', { ex: '' }],
      ['trailer', 'Trailer number', { ex: 'FB-2217' }],
      ['seal', 'Seal number(s)', { ex: 'None, open deck' }],
      ['terms', 'Freight charge terms', { t: 'select', opts: ['', 'Prepaid', 'Collect', 'Third party'], ex: 'Prepaid' }],
      ['po_ref', 'Customer PO number', { ex: 'PO-2026-0148' }],
      ['declared', 'Declared value', { ex: '' }] ] },
    { table: 'cargo', add: true, sum: ['hu', 'pkgs', 'weight'], cols: [
      ['hu', 'Handling units', 'w8 num'], ['hutype', 'Type', 'w8'], ['pkgs', 'Pieces', 'w8 num'], ['weight', 'Weight (lb)', 'w10 num'],
      ['hm', 'HM', 'w6'], ['desc', 'Commodity description', 'wide'], ['nmfc', 'NMFC no.', 'w10'], ['cls', 'Class', 'w8'] ],
      rows: 5, ex: [
        ['2', 'Skid', '2', '15400', '', 'Electrical transformers, liquid filled, pad-mounted, 2500 kVA. Do not hump. Tarp required.', '', ''],
        ['1', 'Crate', '1', '310', '', 'Transformer accessories and spare parts', '', ''] ] },
    { grid: 2, fields: [
      ['instr', 'Special instructions', { t: 'area', rows: 3, ex: 'Delivery by appointment, call site contact 48 hours ahead. Unloading by consignee crane. Check impact recorders with consignee before unloading.' }],
      ['cod', 'COD amount and fee terms, if any', { t: 'area', rows: 3, ex: '' }] ] },
    { foot: 'Received, subject to the rates, classifications and rules that have been established by the carrier and are available to the shipper on request, the property described above in apparent good order, except as noted. Where the rate depends on value, the shipper states the agreed or declared value of the property above.' },
    { sign: [['Shipper signature and date', 'shp'], ['Carrier / driver signature and pickup date', 'car']] },
    { foot: 'Shipper certifies that the contents are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation. Carrier acknowledges receipt of the packages listed.' }
  ],
  notes: [
    ['BOL number', 'Your own reference for the shipment. The carrier will add its PRO number at pickup; record it when you get it, because that is the number the carrier tracks by.'],
    ['Ship from and ship to', 'Full legal names and physical addresses, with a dock or gate and a phone number at each end. A site under construction often has no street number a truck can find, so give directions or coordinates in the special instructions.'],
    ['Third-party bill to', 'Fill this in only when someone other than the shipper or the consignee pays the freight, for example a logistics provider. Leave it empty otherwise.'],
    ['SCAC', 'The Standard Carrier Alpha Code, a two-to-four-letter code that identifies the carrier. Your carrier will tell you theirs.'],
    ['Freight charge terms', 'Prepaid means the shipper pays the carrier. Collect means the consignee pays. Third party means the party named in the bill-to box pays. This should agree with the Incoterms rule or freight terms on the purchase order.'],
    ['Handling units and pieces', 'A handling unit is what the forklift or crane picks up: a skid, a crate, a reel. Pieces are what is inside or on it. The driver signs for handling units, so that count is the one that has to be right.'],
    ['Weight', 'Gross weight including the pallet or skid and packaging. For heavy equipment use the certified shipping weight from the manufacturer, since permits and axle loading are worked out from it.'],
    ['HM', 'Mark this column for any line that is a regulated hazardous material. A hazmat line needs more than a mark: the proper shipping description, an emergency response number and a shipper&rsquo;s certification, as the hazardous materials regulations require. This template does not cover that; use the carrier&rsquo;s or your compliance team&rsquo;s hazmat form. Lithium batteries are hazardous materials.'],
    ['NMFC number and class', 'Used for less-than-truckload freight, where the rate depends on the freight class. A dedicated flatbed or heavy-haul move is usually priced by the load and these stay empty.'],
    ['Declared value', 'A carrier&rsquo;s liability is often limited to an amount per pound unless a higher value is declared and paid for. For a transformer the limited figure can be a small fraction of the replacement cost, so settle value and cargo insurance before the truck is loaded.'],
    ['Signatures', 'The driver&rsquo;s signature at pickup is the carrier&rsquo;s receipt for the count and apparent condition. Keep the signed copy. At the other end, the consignee&rsquo;s signature on the delivery receipt closes the loop: see the proof of delivery template.'],
  ],
  mistakes: [
    'Handling-unit counts that do not match what was loaded. The carrier is responsible for what the driver signed for, not what you meant.',
    'Freight terms on the bill of lading that contradict the purchase order.',
    'No delivery contact or appointment requirement for a site that cannot receive unannounced.',
    'Leaving declared value empty on high-value equipment and discovering the liability limit after damage.',
    'Shipping batteries or other regulated goods on a plain bill of lading with no hazardous materials description.',
  ],
  faq: [
    ['What is the difference between a straight and an order bill of lading?', 'A straight bill of lading names a specific consignee and is not negotiable: the carrier delivers to that party. An order bill of lading is negotiable and the freight is released to whoever holds the endorsed original, which is used where goods are sold or financed in transit. Domestic equipment shipments almost always move on a straight bill.'],
    ['Who fills out the bill of lading?', 'Normally the shipper, since the shipper knows what was loaded. The carrier&rsquo;s driver checks the count and apparent condition and signs it at pickup.'],
    ['Is a bill of lading the same as a proof of delivery?', 'No. The bill of lading is created at pickup and shows what the carrier accepted. The proof of delivery is signed at the destination and shows what arrived and in what condition. A signed delivery copy of the bill of lading is often used as the proof of delivery.'],
    ['Can I use this for ocean or air freight?', 'No. Ocean bills of lading and air waybills are issued by the carrier or forwarder in their own formats. This template is for domestic truck freight.'],
  ],
  related: [['proof-of-delivery', 'Proof of delivery template'], ['purchase-order', 'Purchase order template'], ['/guide-pad-mount-vs-gsu-transformers.html', 'Pad-mount vs. GSU transformers']],
},
{
  slug: 'proof-of-delivery', key: 'pod', short: 'Proof of delivery', badge: 'POD', group: 'ship',
  h1: 'Proof of Delivery Template for Equipment Deliveries',
  title: 'Proof of Delivery Template (Free, Fillable POD) | Voltfield',
  desc: 'A free proof of delivery template with a receiving inspection for heavy electrical equipment. Record counts, damage and exceptions in the browser, then print or save as PDF.',
  card: 'Delivery receipt with a receiving inspection: counts against the BOL, damage, impact recorders, and the exceptions line that protects a claim.',
  dek: 'A delivery receipt with a receiving inspection for heavy equipment. Fill it in at the truck, then print it or save it as a PDF.',
  intro: '<b>A proof of delivery is the signed record that a shipment arrived: what was delivered, when, to whom, and in what condition.</b> It is the last document in the chain that starts with the purchase order, and it is the one that decides a freight claim. Whatever damage or shortage is not written on it before the driver leaves is very hard to recover afterwards. This version adds the checks that matter for electrical equipment.',
  docTitle: 'Proof of Delivery',
  sub: 'Delivery receipt and receiving inspection',
  head: [['pod_no', 'Receipt number', { ex: 'RCV-0931' }], ['pod_date', 'Delivery date', { t: 'date', ex: '2027-08-16' }], ['pod_time', 'Arrival / departure', { ex: '07:40 / 10:15' }]],
  blocks: [
    { grid: 3, fields: [
      ['delivered_to', 'Delivered to', { t: 'area', rows: 4, ex: 'Example Energy Partners LLC\nExample Data Hall 2, Laydown B\n4400 County Road 12\nTaylor, TX 76574' }],
      ['shipper', 'Shipped from', { t: 'area', rows: 4, ex: 'Example Transformer Co.\nMilwaukee, WI' }],
      ['carrier', 'Carrier, driver and vehicle', { t: 'area', rows: 4, ex: 'Example Heavy Haul Inc.\nDriver: printed name\nTractor 418, trailer FB-2217' }] ] },
    { grid: 4, fields: [
      ['bol_ref', 'BOL number', { ex: 'BOL-004512' }],
      ['pro_ref', 'PRO number', { ex: '' }],
      ['po_ref', 'PO number', { ex: 'PO-2026-0148' }],
      ['seal_ok', 'Seal intact / number', { ex: 'N/A, open deck' }] ] },
    { table: 'received', add: true, cols: [
      ['line', 'Line', 'w6'], ['desc', 'Description, serial or tag number', 'wide'], ['shipped', 'Qty on BOL', 'w10 num'], ['recd', 'Qty received', 'w10 num'],
      ['cond', 'Condition', 'w14'], ['note', 'Exception noted', 'mid'] ],
      rows: 5, ex: [
        ['1', 'Pad-mounted transformer 2500 kVA, S/N to be recorded from nameplate', '2', '2', 'Good', ''],
        ['2', 'Crate, accessories and spares', '1', '1', 'Damaged', 'Crate corner crushed, contents not yet inspected'] ] },
    { heading: 'Receiving inspection, before unloading' },
    { checks: [
      ['c_count', 'Handling units counted and matched to the BOL'],
      ['c_tarp', 'Tarps, blocking and tie-downs in place, no sign of load shift'],
      ['c_impact', 'Impact recorder or indicators read, with the carrier present'],
      ['c_leak', 'No oil, coolant or electrolyte leaks; gauges and pressure readings recorded'],
      ['c_ext', 'No dents, broken bushings, bent fins or damaged paint on visible surfaces'],
      ['c_photo', 'Photos taken on the truck, before unloading, of every side and of any damage'],
      ['c_name', 'Nameplate data matches the purchase order'],
      ['c_docs', 'Packing list and shipped documents received'] ] },
    { grid: 2, fields: [
      ['readings', 'Readings recorded (impact recorder, pressure, oil level, temperature)', { t: 'area', rows: 3, ex: 'Unit 1: recorder shows no events over threshold. Tank pressure positive. Unit 2: same.' }],
      ['exceptions', 'Exceptions: shortage, damage or concealed-damage reservation', { t: 'area', rows: 3, ex: 'Line 2 crate corner crushed on arrival, photographed on trailer. Received subject to inspection of contents.' }] ] },
    { sign: [['Received by: name, title, signature, date and time', 'rcv'], ['Driver: name, signature, date and time', 'drv']] },
    { foot: 'Signature by the receiver confirms the count and the apparent condition recorded above, and nothing more. It is not acceptance of the equipment under the purchase order.' }
  ],
  notes: [
    ['Arrival and departure times', 'Record both. They settle detention charges, and the arrival time shows whether a delivery window was met.'],
    ['BOL, PRO and PO numbers', 'These three tie the receipt to the shipment, the carrier&rsquo;s record and the order. Accounts payable needs the PO number to match the receipt to the invoice.'],
    ['Quantity on BOL against quantity received', 'Count handling units yourself before signing. If the count is short, write the shortage on the driver&rsquo;s copy as well as your own.'],
    ['Condition and exceptions', 'Write what you see in plain words: &ldquo;crate corner crushed&rdquo;, &ldquo;two radiator fins bent, north side&rdquo;. A vague note such as &ldquo;subject to inspection&rdquo; on its own carries little weight. Specific notes on the delivery receipt are what a freight claim is built on.'],
    ['Impact recorders', 'Large transformers and other heavy equipment are often shipped with an impact recorder or shock indicators. Read them with the driver present and before the load comes off the trailer, because once it is on the ground nobody can say when a shock happened. If a reading is over the manufacturer&rsquo;s limit, note it, tell the manufacturer and follow their instructions before unloading or moving the unit.'],
    ['Pressure and level readings', 'Equipment shipped sealed or gas-filled should arrive with its pressure still positive. A lost charge suggests a leak and possible moisture ingress. Record the reading and the ambient temperature.'],
    ['Photos', 'Take them on the truck. Photos of damage taken after unloading invite the answer that the damage happened during unloading.'],
    ['Signatures', 'Get the driver&rsquo;s printed name and signature next to any exception. The receiver&rsquo;s signature confirms count and visible condition only; acceptance under the purchase order comes later, after inspection and testing.'],
  ],
  mistakes: [
    'Signing clean and reporting damage afterwards. A clean receipt is evidence that the freight arrived in good order.',
    'Unloading before reading impact recorders.',
    'Refusing a damaged shipment outright when it could be received with exceptions noted, which usually leaves the receiver in a stronger position and the equipment in safer hands. Check your contract and call the vendor first.',
    'Noting damage on your copy but not on the copy the driver takes away.',
    'Treating the delivery signature as acceptance of the equipment.',
  ],
  faq: [
    ['What is a proof of delivery?', 'A document signed by the receiver, and usually the driver, confirming that a shipment was delivered: what arrived, the quantity, the date and time, and the condition it was in. It is also called a delivery receipt.'],
    ['What is the difference between a POD and a BOL?', 'The bill of lading is issued at pickup and records what the carrier took on. The proof of delivery is signed at the destination and records what arrived. The consignee&rsquo;s signed copy of the bill of lading often serves as the proof of delivery.'],
    ['What should I do if freight arrives damaged?', 'Write the damage on the delivery receipt in specific terms before the driver leaves, have the driver sign next to it, photograph the freight on the truck, keep the packaging, and tell the carrier and the vendor in writing straight away. Time limits for claims are set by the carrier&rsquo;s terms and the contract of carriage, so check them the same day.'],
    ['How long should proof of delivery records be kept?', 'For as long as your company&rsquo;s records policy and any contract require. They support invoice payment, warranty start dates and freight claims, so in practice they are kept with the purchase order file for the life of the equipment warranty at least.'],
  ],
  related: [['bill-of-lading', 'Bill of lading template'], ['purchase-order', 'Purchase order template'], ['/guide-transformer-nameplate.html', 'How to read a transformer nameplate']],
},
{
  slug: 'rfq', key: 'rfq', short: 'Request for quotation', badge: 'RFQ', group: 'bid',
  h1: 'Request for Quotation (RFQ) Template for Engineered Equipment',
  title: 'RFQ Template for Equipment (Free, Fillable) | Voltfield',
  desc: 'A free request for quotation template for transformers, switchgear and other engineered equipment. One scope, one deadline and a list of what every bidder must return.',
  card: 'One scope, one deadline, and a list of what each bidder must send back, so the bids that arrive can be compared.',
  dek: 'A request for quotation that asks every bidder the same question and tells them exactly what to send back. Fill it in here, then print it or save it as a PDF.',
  intro: '<b>A request for quotation asks suppliers to price a defined scope on stated terms by a stated date.</b> Its real job is to make the answers comparable. If each bidder receives the same specification, the same quantities, the same delivery point and the same list of things to return, the bids can be laid side by side. If not, you will be comparing three different interpretations of what you wanted.',
  docTitle: 'Request for Quotation',
  sub: 'This is an invitation to quote, not an order',
  head: [['rfq_no', 'RFQ number', { ex: 'RFQ-2026-031' }], ['rfq_date', 'Issued', { t: 'date', ex: '2026-11-15' }], ['rfq_due', 'Bids due (date, time, zone)', { ex: '2026-12-11, 17:00 CT' }]],
  blocks: [
    { grid: 3, fields: [
      ['buyer', 'Buyer', { t: 'area', rows: 4, ex: 'Example Energy Partners LLC\n100 Substation Road\nAustin, TX 78701' }],
      ['sendto', 'Send bids and questions to', { t: 'area', rows: 4, ex: 'J. Rivera, Procurement\nbids@example.com\n555-0101' }],
      ['deliver', 'Delivery point', { t: 'area', rows: 4, ex: 'Example Data Hall 2, Laydown B\n4400 County Road 12\nTaylor, TX 76574' }] ] },
    { grid: 4, fields: [
      ['project', 'Project / job no.', { ex: 'DH2-ELEC-014' }],
      ['spec_ref', 'Governing specification', { ex: 'Spec 26 12 19 rev 2' }],
      ['datasheet', 'Data sheet to complete', { ex: 'DS-01 rev 1' }],
      ['need_date', 'Required on site', { t: 'date', ex: '2027-08-16' }],
      ['incoterm', 'Incoterms 2020 rule', { t: 'select', opts: INCOTERMS, ex: 'DAP' }],
      ['named_place', 'Named place', { ex: 'Taylor, TX site, on truck' }],
      ['q_due', 'Questions due', { t: 'date', ex: '2026-11-27' }],
      ['validity', 'Bid validity required', { ex: '90 days' }],
      ['currency', 'Currency', { ex: 'USD' }],
      ['price_basis', 'Price basis', { ex: 'Fixed, no escalation' }],
      ['loss_a', 'Loss factor A, $/kW no-load', { ex: 'State your value' }],
      ['loss_b', 'Loss factor B, $/kW load', { ex: 'State your value' }] ] },
    { table: 'items', add: true, money: true, caption: 'Scope and price schedule', cols: [
      ['line', 'Line', 'w6'], ['desc', 'Description and specification reference', 'wide'], ['qty', 'Qty', 'w8 num'],
      ['unit', 'Unit', 'w8'], ['price', 'Unit price (bidder)', 'w14 num'], ['amount', 'Extended (bidder)', 'w14 num calc'] ],
      rows: 5, ex: [
        ['1', 'Pad-mounted transformer, 2500 kVA, 34.5 kV delta to 480Y/277 V, per Spec 26 12 19 rev 2 and data sheet DS-01', '2', 'ea', ''],
        ['2', 'Factory witness test, one unit, two buyer attendees', '1', 'lot', ''],
        ['3', 'Spare parts per data sheet DS-01 section 9', '1', 'lot', ''],
        ['4', 'Freight to named place', '1', 'lot', ''] ] },
    { heading: 'Each bid must include' },
    { checks: [
      ['r_ds', 'The completed data sheet, with guaranteed losses and impedance'],
      ['r_exc', 'A list of exceptions and clarifications, or a statement that there are none'],
      ['r_lead', 'Lead time, stated from order and from drawing approval'],
      ['r_dwg', 'Drawing submittal schedule'],
      ['r_itp', 'Inspection and test plan, or the list of factory tests included'],
      ['r_place', 'Place of manufacture and of testing'],
      ['r_war', 'Warranty terms and start date'],
      ['r_pay', 'Proposed payment milestones'],
      ['r_ref', 'Three references for comparable equipment'],
      ['r_opt', 'Options and alternates priced separately from the base bid'] ] },
    { grid: 2, fields: [
      ['instr', 'Bid instructions', { t: 'area', rows: 3, ex: 'One PDF by email to the address above. Late bids are not considered. Questions in writing only; answers go to all bidders.' }],
      ['terms', 'Commercial terms that will apply', { t: 'area', rows: 3, ex: 'Buyer purchase order terms, attached. Liquidated damages for late delivery apply. State any exception in the bid.' }],
      ['eval', 'How bids will be evaluated', { t: 'area', rows: 3, ex: 'Total evaluated cost including losses at the A and B factors above, among bids that are technically compliant and meet the required date.' }],
      ['attach', 'Attachments', { t: 'area', rows: 3, ex: 'Specification 26 12 19 rev 2. Data sheet DS-01. One-line diagram E-001. Purchase order terms.' }] ] },
    { sign: [['Issued by: name, title, date', 'iss'], ['Bidder acknowledgment: company, name, date', 'ack']] },
    { foot: 'This request is an invitation to quote and does not commit the buyer to place an order. The buyer may accept or reject any quotation in whole or in part. Costs of preparing a quotation are the bidder&rsquo;s own.' }
  ],
  notes: [
    ['Bids due', 'Give a date, a time and a time zone. Allow enough time for a real answer: a manufacturer pricing a transformer to your loss factors is doing design work, and a week is not enough.'],
    ['Governing specification and data sheet', 'The specification says what you require. The data sheet is the form each bidder fills in with what it is offering: ratings, losses, impedance, weights, dimensions. Asking every bidder to complete the same data sheet is what makes the technical comparison possible. The <a class="inline" href="/specification-checklist.html">specification checklist</a> covers what the specification itself should state.'],
    ['Required on site', 'State the date you need, and ask for the lead time separately. Bidders who cannot meet the date will tell you, which is better learned now.'],
    ['Incoterms rule and named place', 'Fix the delivery basis so that every price includes the same freight. Otherwise one bid is delivered to site and another stops at the factory gate. See the <a class="inline" href="/guide-incoterms-for-equipment.html">Incoterms guide</a>.'],
    ['Loss factors A and B', 'For transformers, state the dollar value you place on each kilowatt of no-load and load loss. Bidders then optimize the design for your cost of energy, and you compare bids on total owning cost. Leave these out and you will be offered the cheapest unit to build. The method is in <a class="inline" href="/guide-how-to-compare-equipment-bids.html">how to compare equipment bids</a>.'],
    ['Scope and price schedule', 'List the lines you want priced separately. Anything you may want to drop or compare, such as witness testing, spares and freight, should be its own line. The price columns are for the bidder.'],
    ['Each bid must include', 'Tick what applies and delete nothing a bidder might otherwise leave out. The exceptions list is the most important item: require it even when the answer is &ldquo;none&rdquo;.'],
    ['How bids will be evaluated', 'Say it plainly. Bidders respond to what is being scored, and a stated basis protects the award from argument later.'],
    ['Questions', 'Take questions in writing up to a cut-off date and send every answer to every bidder. An answer given to one bidder alone changes the scope for that bidder only.'],
  ],
  mistakes: [
    'Sending bidders different versions of the specification, or answering one bidder&rsquo;s question privately.',
    'No delivery basis, so freight is in some prices and not in others.',
    'No requirement to list exceptions, so they surface after award.',
    'Asking for a price without a data sheet, which leaves nothing to check the delivered equipment against.',
    'A deadline too short for a considered bid, which favors whoever had a stock design on the shelf.',
  ],
  faq: [
    ['What is the difference between an RFQ, an RFP and an RFI?', 'A request for information (RFI) gathers facts about suppliers and what is available, with no pricing commitment. A request for quotation (RFQ) asks for a price for a scope the buyer has already defined. A request for proposal (RFP) describes a need and asks suppliers to propose how they would meet it, so both the solution and the price are being compared.'],
    ['Is an RFQ legally binding?', 'An RFQ is an invitation to quote, and issuing one does not ordinarily oblige the buyer to buy. The supplier&rsquo;s quotation is normally an offer, which becomes a contract when the buyer accepts it, typically with a purchase order. How this works in a given case depends on the wording and the governing law.'],
    ['How many suppliers should receive an RFQ?', 'Three to five qualified suppliers is typical. Fewer gives little competition; many more makes serious bidders less willing to invest in a careful quotation. Send it only to suppliers you would be prepared to award to.'],
    ['What should an RFQ for a transformer include?', 'The specification and a data sheet for the bidder to complete, quantity, required date and delivery point with an Incoterms rule, the loss evaluation factors, the factory tests required, the commercial terms that will apply, the evaluation basis and the list of items each bid must contain.'],
  ],
  related: [['bid-tabulation', 'Bid tabulation template'], ['purchase-order', 'Purchase order template'], ['/guide-vendor-qualification.html', 'How to qualify an equipment vendor'], ['/guide-how-to-compare-equipment-bids.html', 'How to compare equipment bids']],
},
{
  slug: 'bid-tabulation', key: 'bidtab', short: 'Bid tabulation', badge: 'TAB', group: 'bid',
  h1: 'Bid Tabulation Template for Equipment Bids',
  title: 'Bid Tabulation Template (Free Bid Comparison Sheet) | Voltfield',
  desc: 'A free bid tabulation template for comparing three equipment bids: leveled price lines with totals, loss evaluation, lead time, exceptions and terms, and the recommendation.',
  card: 'Three bidders side by side: leveled price lines that total themselves, loss evaluation, lead time, exceptions and the recommendation.',
  dek: 'Three bids on one page and on one basis, with totals that add themselves and a place for the reasons. Fill it in here, then print it or save it as a PDF.',
  intro: '<b>A bid tabulation sets the bids side by side, line by line, so that differences in scope, cost and terms can be seen and the reason for the award is on record.</b> The first table levels the price: every bidder gets a figure on every line, including the lines a bidder left out. The second table holds what cannot be reduced to a price. The method behind it is in <a class="inline" href="/guide-how-to-compare-equipment-bids.html">how to compare equipment bids</a>.',
  docTitle: 'Bid Tabulation',
  sub: 'Confidential: bid prices are not to be shared between bidders',
  head: [['tab_rfq', 'RFQ number', { ex: 'RFQ-2026-031' }], ['tab_date', 'Date', { t: 'date', ex: '2026-12-15' }], ['tab_rev', 'Revision', { ex: '0' }]],
  blocks: [
    { grid: 4, fields: [
      ['project', 'Project / job no.', { ex: 'DH2-ELEC-014' }],
      ['equip', 'Equipment', { ex: '2 x 2500 kVA pad-mounted transformers' }],
      ['spec_ref', 'Governing specification', { ex: 'Spec 26 12 19 rev 2' }],
      ['need_date', 'Required on site', { t: 'date', ex: '2027-08-16' }] ] },
    { grid: 3, fields: [
      ['b1', 'Bidder 1', { ex: 'Example Transformer Co.' }],
      ['b2', 'Bidder 2', { ex: 'Sample Electric Works' }],
      ['b3', 'Bidder 3', { ex: 'Placeholder Power Inc.' }] ] },
    { table: 'price', add: true, caption: 'Price, leveled to the same scope', sum: ['p1', 'p2', 'p3'], sumLabel: 'Total evaluated cost', cols: [
      ['line', 'Line', 'w6'], ['desc', 'Item', 'wide'], ['p1', 'Bidder 1', 'w16 num'], ['p2', 'Bidder 2', 'w16 num'], ['p3', 'Bidder 3', 'w16 num'] ],
      rows: 8,
      pre: [['1', 'Base equipment price'], ['2', 'Freight to named place'], ['3', 'Factory witness test'], ['4', 'Spare parts'], ['5', 'Site services and commissioning support'], ['6', 'Taxes and duties'], ['7', 'Loss evaluation: A x no-load loss'], ['8', 'Loss evaluation: B x load loss']],
      ex: [['1', 'Base equipment price', '200000', '188000', '206000'], ['2', 'Freight to named place', '0', '9000', '0'], ['3', 'Factory witness test', '5000', '5000', '0'], ['4', 'Spare parts', '2500', '3000', '2500'], ['5', 'Site services and commissioning support', '0', '0', '0'], ['6', 'Taxes and duties', '0', '0', '0'],
        ['7', 'Loss evaluation: A x no-load loss (A = 8,000 $/kW, two units)', '40000', '54400', '38400'], ['8', 'Loss evaluation: B x load loss (B = 2,500 $/kW, two units)', '110000', '130000', '105000']] },
    { table: 'terms', add: true, caption: 'Technical and commercial comparison', cols: [
      ['desc', 'Item', 'mid'], ['t1', 'Bidder 1', 'ta'], ['t2', 'Bidder 2', 'ta'], ['t3', 'Bidder 3', 'ta'] ],
      rows: 12,
      pre: [['Technically compliant'], ['Guaranteed no-load / load loss'], ['Lead time and what it runs from'], ['Meets required date'], ['Exceptions to specification'], ['Exceptions to commercial terms'], ['Payment milestones'], ['Warranty'], ['Late delivery damages'], ['Place of manufacture and test'], ['Price basis and validity'], ['Leveling allowances used']],
      ex: [['Technically compliant', 'Yes', 'Yes, with one exception', 'Yes'],
        ['Guaranteed no-load / load loss', '2.5 kW / 22 kW', '3.4 kW / 26 kW', '2.4 kW / 21 kW'],
        ['Lead time and what it runs from', '36 weeks from drawing approval', '30 weeks from order', '44 weeks from drawing approval'],
        ['Meets required date', 'Yes', 'Yes', 'No, 5 weeks late'],
        ['Exceptions to specification', 'None', 'Impedance 5.5% offered against 5.75%', 'None'],
        ['Exceptions to commercial terms', 'Damages capped at 5%', 'None', 'No liquidated damages'],
        ['Payment milestones', '10 / 40 / 40 / 10', '30% with order', '10 / 40 / 40 / 10'],
        ['Warranty', '24 months from energization', '12 months from delivery', '24 months from energization'],
        ['Late delivery damages', 'Accepted, capped', 'Accepted', 'Refused'],
        ['Place of manufacture and test', 'Milwaukee, WI', 'To be confirmed', 'Springfield, MO'],
        ['Price basis and validity', 'Fixed, 90 days', 'Fixed, 30 days', 'Indexed to metals, 60 days'],
        ['Leveling allowances used', 'None', 'None', 'Witness test included in base']] },
    { grid: 2, fields: [
      ['recommend', 'Recommendation', { t: 'area', rows: 3, ex: 'Award to Bidder 1.' }],
      ['basis', 'Basis of recommendation', { t: 'area', rows: 3, ex: 'Lowest total evaluated cost among bids that meet the required date. Bidder 3 is lower on evaluated cost but misses the date and refuses damages. Bidder 2 has the lowest price and the highest losses.' }],
      ['open', 'Open clarifications before award', { t: 'area', rows: 2, ex: 'Bidder 1 to confirm damages cap can be raised to 10%.' }],
      ['notes', 'Notes', { t: 'area', rows: 2, ex: 'All figures in USD. Example values are placeholders.' }] ] },
    { sign: [['Prepared by: name, title, date', 'prep'], ['Approved by: name, title, date', 'appr']] },
    { foot: 'Evaluated cost includes the buyer&rsquo;s valuation of losses and any leveling allowances, and is used for comparison only. It is not the contract price.' }
  ],
  notes: [
    ['Bidder names', 'Three columns suit the usual three bids. For more, run a second sheet with the same lines.'],
    ['Price lines', 'Every bidder gets a number on every line. If a bidder included an item in its base price, enter zero and say so under leveling allowances. If a bidder left an item out, get its price in writing; failing that, enter an allowance and mark it as one.'],
    ['Loss evaluation', 'For transformers, multiply each bidder&rsquo;s guaranteed no-load loss by your A factor and its load loss by your B factor, for all units, and enter the results as price lines. They are then part of the total. For other equipment use these lines for whatever operating cost you evaluate, or leave them empty.'],
    ['Total evaluated cost', 'The column totals add as you type. This is the figure to compare, and it is not what you will pay: the loss lines are a valuation, not an invoice.'],
    ['Technically compliant', 'Decided by the engineer, before the prices are discussed if you can manage it. A bid that is not compliant and cannot be made so is set aside, whatever its price.'],
    ['Lead time', 'Write what the lead time runs from. Thirty weeks from order and thirty weeks from drawing approval can be two months apart.'],
    ['Exceptions', 'Copy them from the bid in the bidder&rsquo;s own words, and record how each was resolved: accepted, priced or withdrawn.'],
    ['Basis of recommendation', 'One or two sentences that would make sense to an auditor a year from now. If the recommended bid is not the lowest evaluated cost, say what outweighed it.'],
  ],
  mistakes: [
    'Comparing cover-page totals before leveling the scope.',
    'Leaving a line blank for a bidder, which the total then treats as zero.',
    'Recording lead times without what they run from.',
    'Leaving losses out of a transformer comparison.',
    'Showing one bidder another bidder&rsquo;s numbers.',
  ],
  faq: [
    ['What is a bid tabulation?', 'A table that lists each bidder&rsquo;s price, scope, technical data, delivery and terms side by side on the same basis. It is used to compare bids fairly and to record why the award was made.'],
    ['What is bid leveling?', 'Adjusting bids so they cover the same scope before comparing them: adding prices for items a bidder left out, separating options a bidder bundled in, and putting all prices on the same delivery basis.'],
    ['What is total evaluated cost?', 'The bid price plus the buyer&rsquo;s valuation of costs that differ between bids but are not in the price, such as the cost of transformer losses over the service life. Bids are ranked on this figure, though the contract is placed at the bid price.'],
    ['Who should prepare the bid tabulation?', 'Usually procurement prepares the commercial part and the responsible engineer the technical part, and both sign. Splitting the two helps keep the technical judgment from being pulled by the price.'],
  ],
  related: [['rfq', 'Request for quotation template'], ['purchase-order', 'Purchase order template'], ['/guide-how-to-compare-equipment-bids.html', 'How to compare equipment bids'], ['/guide-vendor-qualification.html', 'How to qualify an equipment vendor']],
},
...MORE,
];

/* ------------------------------------------------------------- render ---- */
function field([id, label, o = {}], key) {
  const name = `${key}_${id}`;
  const ex = o.ex ? ` data-ex="${esc(o.ex)}"` : '';
  const span = o.span ? ` style="grid-column:span ${o.span}"` : '';
  let ctl;
  if (o.t === 'area') ctl = `<textarea id="${name}" name="${name}" rows="${o.rows || 3}"${ex}></textarea>`;
  else if (o.t === 'select') ctl = `<select id="${name}" name="${name}"${ex}>${o.opts.map(v => `<option>${esc(v)}</option>`).join('')}</select>`;
  else ctl = `<input id="${name}" name="${name}" type="${o.t === 'date' ? 'date' : 'text'}" autocomplete="off"${ex}>`;
  return `<div class="tf"${span}><label for="${name}">${label}</label>${ctl}</div>`;
}
const isTa = (k, cls) => k === 'desc' || /\bta\b/.test(cls);
function table(b, key) {
  const row = `<tr>${b.cols.map(([k, label, cls]) =>
    `<td class="${cls}"><${isTa(k, cls) ? 'textarea rows="1"' : 'input type="text" autocomplete="off"'} data-col="${k}" aria-label="${esc(label)}"${/calc/.test(cls) ? ' readonly tabindex="-1"' : ''}${/num/.test(cls) ? ' inputmode="decimal"' : ''}>${isTa(k, cls) ? '</textarea>' : ''}</td>`).join('')}</tr>`;
  const sum = b.sum ? `<tfoot><tr>${b.cols.map(([k, label, cls]) => `<td class="${cls}">${b.sum.includes(k) ? `<output data-sum="${k}" aria-label="Total, ${esc(label)}">0</output>` : (k === 'desc' ? (b.sumLabel || 'Totals') : '')}</td>`).join('')}</tr></tfoot>` : '';
  return `${b.caption ? `<h2 class="th">${b.caption}</h2>\n` : ''}<div class="tt-wrap"><table class="tt" data-table="${key}_${b.table}"${b.money ? ' data-money="1"' : ''} data-ex="${esc(JSON.stringify(b.ex))}"${b.pre ? ` data-pre="${esc(JSON.stringify(b.pre))}"` : ''} ${b.prod ? ` data-prod="${b.prod}"` : ''} data-rows="${b.rows}">
<thead><tr>${b.cols.map(([, label, cls]) => `<th scope="col" class="${cls}">${label}</th>`).join('')}</tr></thead>
<tbody>${row}</tbody>${sum}</table></div>
${b.add ? '<p class="tt-add web-only"><button type="button" class="tbtn" data-add>Add a line</button> <button type="button" class="tbtn" data-del>Remove last line</button></p>' : ''}`;
}
function block(b, t) {
  if (b.grid) return `<div class="tg tg${b.grid}">${b.fields.map(f => field(f, t.key)).join('')}</div>`;
  if (b.table) return table(b, t.key);
  if (b.totals) return `<div class="ttot">${b.totals.map(([id, label, cls]) =>
    `<div class="tf"><label for="${t.key}_${id}">${label}</label><input id="${t.key}_${id}" name="${t.key}_${id}" type="text" inputmode="decimal" data-total="${id}"${cls ? ' readonly tabindex="-1"' : ''}${b.ex && b.ex[id] ? ` data-ex="${b.ex[id]}"` : ''}></div>`).join('')}</div>`;
  if (b.heading) return `<h2 class="th">${b.heading}</h2>`;
  if (b.checks) return `<div class="tchecks">${b.checks.map(([id, label]) =>
    `<label class="tck"><input type="checkbox" id="${t.key}_${id}" name="${t.key}_${id}"> <span>${label}</span></label>`).join('')}</div>`;
  if (b.sign) return `<div class="tsign">${b.sign.map(([label]) => `<div class="tsig"><span class="tsig-line"></span><span class="tsig-lab">${label}</span></div>`).join('')}</div>`;
  if (b.foot) return `<p class="tfoot">${b.foot}</p>`;
  return '';
}
const rel = h => h.startsWith('/') ? h : `/templates/${h}.html`;

function render(t) {
  const crumbs = [['Templates', 'templates.html'], [t.short, `templates/${t.slug}.html`]];
  const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>${t.h1}</h1>
    <p class="dek">${t.dek}</p>
  </div>
</section>

<div class="artwrap tplwrap">
  <p>${t.intro}</p>

  <div class="tpl-actions web-only" role="group" aria-label="Template actions">
    <button type="button" class="btn btn-primary" data-act="print">Print or save as PDF</button>
    <button type="button" class="btn btn-ghost" data-act="example">Fill with an example</button>
    <button type="button" class="btn btn-ghost" data-act="csv">Download lines as CSV</button>
    <button type="button" class="btn btn-ghost" data-act="clear">Clear</button>
  </div>
  <p class="tpl-hint web-only" id="tplStatus" role="status">Printing an empty form gives you a blank template. What you type stays in this browser and is not sent anywhere.</p>

  <form class="tpl-doc" id="tplDoc" data-key="${t.key}" data-name="${t.slug}" autocomplete="off" onsubmit="return false">
    <div class="tdoc-head">
      <div class="tdoc-title"><b>${t.docTitle}</b>${t.sub ? `<span>${t.sub}</span>` : ''}</div>
      <div class="tdoc-meta">${t.head.map(f => field(f, t.key)).join('')}</div>
    </div>
    ${t.blocks.map(b => block(b, t)).join('\n    ')}
  </form>

  <div class="ad-unit" data-ad="incontent"></div>

  <h2 id="fields">What goes in each field</h2>
  <dl class="tnotes">
${t.notes.map(([a, b]) => `    <dt>${a}</dt><dd>${b}</dd>`).join('\n')}
  </dl>

  <h2 id="mistakes">Mistakes that cost money later</h2>
  <ul>
${t.mistakes.map(m => `    <li>${m}</li>`).join('\n')}
  </ul>

  <h2 id="questions">Questions</h2>
${t.faq.map(([q, a]) => `  <details class="tfaq"><summary>${q}</summary><p>${a}</p></details>`).join('\n')}

  <p class="callout">This is a general-purpose template to help you lay a document out clearly. It is not legal advice, and it does not replace your company&rsquo;s terms, your carrier&rsquo;s tariff or the requirements of any regulation that applies to your shipment.</p>

  <h2 id="related">Related</h2>
  <ul>
${t.related.map(([h, l]) => `    <li><a class="inline" href="${rel(h)}">${l}</a></li>`).join('\n')}
    <li><a class="inline" href="/templates.html">All templates</a></li>
  </ul>
  <p class="provenance">Published ${DATE_LONG}. Spotted something wrong or missing? <a class="inline" href="/contact.html">Tell us</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>`;
  return page({ url: `templates/${t.slug}.html`, title: t.title, desc: t.desc, crumbs, faq: t.faq, dateISO: DATE_ISO,
    css: ['/voltfield-templates.css'], js: ['/voltfield-templates.js'], body });
}

function hub() {
  const crumbs = [['Templates', 'templates.html']];
  const body = `
<section class="artban">
  <div class="artban-in">
    ${crumbNav(crumbs)}
    <h1>Procurement and Logistics Templates</h1>
    <p class="dek">The documents that carry a piece of equipment from order to site, as forms you can fill in here and print. Free, no sign-up, nothing uploaded.</p>
  </div>
</section>

<div class="artwrap">
  <p><b>Buying a transformer, a generator or a battery container leaves a paper trail, and each document in it settles a different argument.</b> The request for quotation settles what was asked. The bid tabulation settles why one bidder was chosen. The purchase order settles what was agreed. The bill of lading settles what the carrier took. The proof of delivery settles what arrived and in what state. Between them sit the working documents: the inspection and test plan, the expediting log, the packing list and the vendor scorecard. These templates follow that order, and each page explains what every field is for and where the common mistakes are.</p>

  <h2 id="bidding">Before the order: asking and comparing</h2>
  <div class="gdgrid">
${T.filter(t => t.group === 'bid').map(t => `    <a class="gdcard has-thumb" href="/templates/${t.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${t.badge}</span><h3>${t.short} template</h3><p>${t.card}</p></a>`).join('\n')}
  </div>

  <h2 id="running">Placing and running the order</h2>
  <div class="gdgrid">
${T.filter(t => t.group === 'run').map(t => `    <a class="gdcard has-thumb" href="/templates/${t.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${t.badge}</span><h3>${t.short} template</h3><p>${t.card}</p></a>`).join('\n')}
  </div>

  <h2 id="order-to-site">Shipping and receiving</h2>
  <div class="gdgrid">
${T.filter(t => t.group === 'ship').map(t => `    <a class="gdcard has-thumb" href="/templates/${t.slug}.html"><span class="gd-thumb is-badge" aria-hidden="true">${t.badge}</span><h3>${t.short} template</h3><p>${t.card}</p></a>`).join('\n')}
  </div>

  <h2 id="engineering">For the engineering side of the order</h2>
  <div class="gdgrid">
    <a class="gdcard" href="/specification-checklist.html"><h3>Specification checklist</h3><p>What a complete equipment specification has to state, with copy-ready sheets for transformers, switchgear and BESS.</p></a>
    <a class="gdcard" href="/project-sheet.html"><h3>Project sheet</h3><p>Collect calculator results for one job, with their inputs, and print them as a single record.</p></a>
    <a class="gdcard" href="/formulas.html"><h3>Formula reference</h3><p>The formulas behind the numbers on a data sheet, each with its variables and a calculator.</p></a>
  </div>

  <h2 id="guides">Guides that go with them</h2>
  <ul>
    <li><a class="inline" href="/guide-vendor-qualification.html">How to qualify an equipment vendor</a>: what to check before a manufacturer goes on the bid list.</li>
    <li><a class="inline" href="/guide-how-to-compare-equipment-bids.html">How to compare equipment bids</a>: leveling scope and adding the cost of losses.</li>
    <li><a class="inline" href="/guide-incoterms-for-equipment.html">Incoterms 2020 for heavy equipment</a>: who pays, who carries the risk, and where it changes hands.</li>
    <li><a class="inline" href="/guide-fat-vs-sat.html">FAT vs. SAT</a>: factory and site acceptance testing, witness points and punch lists.</li>
  </ul>

  <h2 id="how">How the templates work</h2>
  <ul>
    <li><b>Fill in the browser.</b> Each template is the document itself, with the fields live. Totals add up as you type.</li>
    <li><b>Print or save as PDF.</b> The print button gives the document on its own, without the site around it. Print it empty for a blank form.</li>
    <li><b>Private.</b> What you type is kept in your browser on this device so a reload does not lose it. It is not sent to Voltfield or anyone else.</li>
    <li><b>General, not legal.</b> These lay a document out clearly. They do not replace your company&rsquo;s terms and conditions or a carrier&rsquo;s tariff.</li>
  </ul>
  <p class="provenance">Published ${DATE_LONG}. Need a template that is not here? <a class="inline" href="/contact.html">Tell us which one</a>.</p>
</div>
<div class="ad-unit" data-ad="footer"></div>`;
  return page({ url: 'templates.html', title: 'Procurement and Logistics Templates: RFQ, PO, BOL, POD | Voltfield',
    desc: 'Nine free fillable templates for buying and shipping power equipment, from RFQ and bid tabulation to purchase order, expediting log, ITP, packing list, BOL and POD. Fill in the browser, print or save as PDF.',
    crumbs, dateISO: DATE_ISO, css: ['/voltfield-templates.css'], body });
}

const only = process.argv.slice(2);
for (const t of T) if (!only.length || only.includes(t.slug)) write(`templates/${t.slug}.html`, render(t));
write('templates.html', hub());
