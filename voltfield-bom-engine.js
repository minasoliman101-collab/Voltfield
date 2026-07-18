/* ============================================================
   VOLTFIELD — Component BOM engine
   Generates an indicative component-level Bill of Materials for
   any configurable catalog part (loaded AFTER voltfield-catalog-data.js).

   Every component line carries an explicit linkRe mapping it to a
   real, sourceable catalog family — so each generated line can be
   shopped/quoted directly. The coverage harness on the BOM
   Generator page asserts this stays at 100%.

   Costing is a reconciliation model: component lines share a fixed
   materials fraction of the configured assembly price by weight;
   the remainder is shown as labor / test / logistics / margin
   roll-up lines. All figures are indicative estimates.
   ============================================================ */

'use strict';

/* ---------- small helpers ---------- */
function bomNum(s, def) {
  if (s == null) return def;
  const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : def;
}
function axPick(f, picks, re) {
  for (let i = 0; i < f.ax.length; i++) if (re.test(f.ax[i][0])) return picks[i];
  return null;
}
function axNum(f, picks, re, def) { return bomNum(axPick(f, picks, re), def); }
function cfgHas(f, picks, re) { return re.test(f.n) || picks.some(p => re.test(String(p))); }
function rq(x) { return x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100; }

/* component line factory: name, material, spec, qty, unit, weight, group, linkRe (required) */
function it(n, mat, spec, qty, unit, w, g, linkRe) {
  return { n, mat, spec, qty: Math.max(qty > 0 ? qty : 1, qty), unit, w, g, linkRe };
}

/* find a catalog family for cross-linking a component to a buyable part */
function bomLinkFam(re) {
  const f = FAM.find(x => re.test(x.n) || re.test(x.c));
  return f ? `voltfield-part.html?fi=${f._i}` : null;
}

/* every component line gets a shop link: declared family first,
   then keyword match, then a pre-filled catalog search (last resort) */
function bomShopLink(x) {
  if (x.linkRe) { const l = bomLinkFam(x.linkRe); if (l) return l; }
  const words = x.n.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
    .filter(w => w.length >= 4 && !/^(with|from|sets?|kits?|per|type|class|rated|full|main|assembly|assemblies|components?|systems?)$/.test(w));
  let best = null, bestSc = 0;
  for (const f of FAM) {
    let sc = 0;
    for (const w of words) { if (f.n.toLowerCase().includes(w)) sc += 2; else if (f.search.includes(w)) sc += 1; }
    if (sc > bestSc) { bestSc = sc; best = f; }
  }
  if (best && bestSc >= 3) return `voltfield-part.html?fi=${best._i}`;
  return `voltfield-supply-catalog.html?q=${encodeURIComponent(words.slice(0, 3).join(' ') || x.n.split(/[—-]/)[0].trim())}`;
}

/* ---------- NOT-APPLICABLE categories (commodity / single-piece / consumable) ---------- */
const BOM_NA = {
  'og|Fittings & Flanges': 'Single-piece forged or machined items — no sub-components beyond the forging itself.',
  'og|Gaskets, Seals & Fasteners': 'Commodity sealing and fastening hardware — these ARE the components other BOMs call out.',
  'og|Tubulars|Line Pipe': 'Continuous mill product — no discrete sub-components.',
  'og|Valve & Wellhead Components': 'These are the component-level spares themselves — order directly, or open the parent valve/wellhead BOM.',
  'dc|Transformer Components': 'These are the component-level spares themselves — order directly, or open the parent transformer BOM.',
  'dc|Switchgear Components': 'These are the component-level spares themselves — order directly, or open the parent switchgear/breaker BOM.',
  'dc|Genset Components': 'These are the component-level spares themselves — order directly, or open the parent genset BOM.',
  're|Inverter & PE Components': 'These are the component-level spares themselves — order directly, or open the parent inverter/PCS BOM.',
  're|Module & BOS Components': 'These are the component-level spares themselves — order directly, or open the parent module/tracker BOM.',
  'bess|Battery Components': 'These are the component-level spares themselves — order directly, or open the parent DC-block BOM.',
  'bess|Fire Suppression & Safety|Fire Detection & Suppression Components': 'These are the component-level spares themselves — order directly, or open the parent suppression-system BOM.',
  'mro|Power Transmission': 'Component-level power-transmission spares — no further breakdown published.',
  'mro|Pumps|Pump Repair Parts & Impellers': 'Component-level pump spares — no further breakdown published.',
  'mro|Motors|Motor Repair Parts': 'Component-level motor spares — no further breakdown published.',
  'mro|Electrical|Fuses & Circuit Protection': 'Single-piece protective devices — no sub-components.',
  'mro|Electrical|Industrial Batteries & Chargers': 'Sealed battery/charger units — no serviceable sub-components published.',
  'mro|HVAC & Refrigeration|Coils & Heat Exchangers': 'Component-level heat-transfer spares — no further breakdown published.',
  'mro|HVAC & Refrigeration|Refrigerants & Heat-Transfer Fluids': 'Formulated fluids — chemistry, not components.',
  'mro|Lighting|LED Modules, Drivers & Optics': 'Component-level lighting spares — no further breakdown published.',
  'mro|Identification & Packaging': 'Identification and packaging goods — no sub-components.',
  'mro|Adhesives, Sealants & Tape|Paints & Protective Coatings': 'Formulated coatings — chemistry, not components.',
  'mro|Fasteners & Hardware': 'Single-piece commodity fasteners — no sub-components.',
  'mro|Raw Materials': 'Raw mill stock — no sub-components.',
  'mro|Safety & PPE': 'Soft goods / consumables — component breakdown not applicable.',
  'mro|Hand Tools': 'Single-piece or simply-joined hand tools — component breakdown not published.',
  'mro|Abrasives': 'Consumable abrasive media — no serviceable sub-components.',
  'mro|Adhesives, Sealants & Tape': 'Formulated consumables — chemistry, not components.',
  'mro|Cleaning & Janitorial': 'Consumables — component breakdown not applicable.',
  'mro|Lubrication': 'Formulated fluids — component breakdown not applicable.',
  'mro|Welding|Filler Metal & Electrodes': 'Consumable filler metal — no sub-components.',
  'mro|Machining': 'Single-piece cutting tools and holders — no sub-components.',
  'mro|HVAC & Refrigeration|Filters & Belts': 'Consumable filters and belts — no sub-components.',
  'mro|Plumbing|Pipe, Tube & Hose': 'Continuous stock — no discrete sub-components.',
  'mro|Pneumatics & Hydraulics|Hydraulic Hose & Fittings': 'Hose stock and single-piece fittings — no sub-components.',
  'mro|Electrical|Wire, Cable & Cord': null, /* handled by cable template */
  're|Structural BOS|Module Clamps & Hardware': 'Hardware kit of commodity fasteners — see the kit contents on the part page.',
  're|Wind Components|Blade Bolts & Foundation Hardware': 'Commodity structural bolting — no sub-components.',
};

/* ============================================================
   Reusable parametric templates — every item carries linkRe
   ============================================================ */

/* Oil-filled or dry transformer */
function tmplTransformer(f, picks) {
  let kva = axNum(f, picks, /mva/i, 0) * 1000 || axNum(f, picks, /kva/i, 500);
  const dry = /dry|cast|isolation|k-rated/i.test(f.n);
  const hvkv = bomNum(axPick(f, picks, /hv|primary|class/i), 15);
  const coreKg = rq(kva * (dry ? 1.9 : 1.35));
  const cuKg = rq(kva * (dry ? 0.55 : 0.42));
  const items = [
    it('Core — grain-oriented electrical steel laminations', 'GOES M-4 / 23ZDKH', 'Step-lap mitred core, stacked & banded', coreKg, 'kg', 30, 'Core & magnetics', /Electrical Steel & Core/),
    it('HV winding — copper magnet conductor', 'Cu, class 220 enamel / paper wrap', `Rated for ${hvkv} kV class primary`, rq(cuKg * 0.55), 'kg', 14, 'Windings & conductors', /Magnet Wire & Winding/),
    it('LV winding — copper strip / foil', 'Cu strip', 'Foil-wound secondary', rq(cuKg * 0.45), 'kg', 11, 'Windings & conductors', /Magnet Wire & Winding/),
  ];
  if (dry) {
    items.push(
      it('Cast-resin encapsulation / VPI varnish', 'Epoxy resin system', 'Class F/H insulation system', rq(kva * 0.12), 'kg', 6, 'Insulation & dielectric', /Adhesives & Epoxies/),
      it('Winding support blocks & duct spacers', 'GPO-3 / NEMA glass polyester', 'Vertical cooling ducts', Math.max(8, Math.round(kva / 40)), 'ea', 2, 'Insulation & dielectric', /Insulation & Pressboard/),
      it('Ventilated enclosure', 'Powder-coated CRS, NEMA 2', 'Panels, base, lifting provisions', 1, 'ea', 8, 'Structure & enclosure', /Enclosures & Cabinets/),
      it('Temperature monitor & winding RTDs', 'Electronic monitor + 3× PT100', 'Fan control + alarm/trip contacts', 1, 'set', 3, 'Controls & instrumentation', /Gauges & Protective/),
      it('Cooling fans (AF configs)', 'Axial fans, 120/240 V', 'Mounted on lower frame', cfgHas(f, picks, /af\b/i) ? Math.max(2, Math.round(kva / 250)) : 0, 'ea', 2, 'Cooling', /Radiators & Cooling Fans/)
    );
  } else {
    items.push(
      it('Insulating fluid', 'Mineral oil or natural ester (FR3)', 'Degassed & filtered at fill', rq(kva * 0.9), 'L', 7, 'Insulation & dielectric', /Insulating Oils/),
      it('Kraft / crepe paper & pressboard insulation', 'Thermally-upgraded kraft', 'Winding wrap, angle rings, barriers', rq(kva * 0.05), 'kg', 3, 'Insulation & dielectric', /Insulation & Pressboard/),
      it('Tank & cover, welded', 'Mild steel, painted', 'Weld-tested, corrosion system C3+', 1, 'ea', 9, 'Structure & enclosure', /Tanks, Skids/),
      it('Radiators / cooling panels', 'Pressed steel', 'Sized to cooling class', Math.max(2, Math.round(kva / 400)), 'ea', 4, 'Cooling', /Radiators & Cooling Fans/),
      it('HV bushings', 'Porcelain or polymer, oil-filled class', `${hvkv} kV class`, 3, 'ea', 4, 'Windings & conductors', /Transformer Bushings/),
      it('LV bushings / spades', 'Epoxy / Cu spade', 'Rated to LV amperage', 4, 'ea', 2, 'Windings & conductors', /Transformer Bushings/),
      it('De-energized tap changer (DETC)', '5-position ±2×2.5%', 'Externally operable', 1, 'ea', 3, 'Controls & instrumentation', /Tap Changers/),
      it('Pressure-relief device, liquid-level & temp gauges', 'Gauge set', 'Alarm contacts wired to terminal block', 1, 'set', 2, 'Controls & instrumentation', /Gauges & Protective/),
      it('Gasket set — cover, bushings, valves', 'Nitrile / cork-nitrile', 'Full seal-up kit', 1, 'set', 1, 'Hardware & fasteners', /Ring-Joint|Gasket/)
    );
  }
  items.push(it('Structural bolting & grounding hardware', 'HDG grade 5 / copper', 'Tank, cabinet & ground pads', Math.max(24, Math.round(kva / 12)), 'ea', 1, 'Hardware & fasteners', /Hex Cap Screws/));
  return { unitDesc: `${kva.toLocaleString()} kVA transformer`, items };
}

/* Power-electronics assembly (inverter / PCS / UPS / STS / drives) */
function tmplPowerElectronics(f, picks, kwIn) {
  const kw = kwIn || axNum(f, picks, /mw|kw|kva|power|rating/i, 250) * (axPick(f, picks, /mw/i) ? 1000 : 1);
  const modules = Math.max(1, Math.round(kw / 150));
  const items = [
    it('Power semiconductor modules (IGBT / SiC half-bridge)', 'Si IGBT or SiC MOSFET', '1200–1700 V class, paralleled per phase leg', modules * 6, 'ea', 22, 'Power stage', /IGBT & SiC/),
    it('Gate-driver boards', 'PCB assembly', 'Isolated drive + desat protection', modules * 3, 'ea', 5, 'Power stage', /Gate Driver/),
    it('DC-link capacitor bank', 'Metallized polypropylene film', 'Low-ESL bus-mounted', modules * 4, 'ea', 8, 'Power stage', /DC-Link Film/),
    it('Laminated DC busbar', 'Cu, epoxy laminate', 'Low-inductance sandwich bus', modules, 'ea', 3, 'Power stage', /Copper Busbar/),
    it('Magnetics — output filter inductors / LCL', 'Amorphous or Si-steel core, Cu', 'Sized to switching frequency', 3, 'ea', 9, 'Magnetics & filtering', /Filter Inductors/),
    it('EMI/RFI filter & snubbers', 'Film caps + ferrites', 'Conducted-emissions compliance', 1, 'set', 2, 'Magnetics & filtering', /EMI Filters/),
    it('Main AC contactor / breaker', 'MCCB or vacuum contactor', 'Rated to output amps', 1, 'ea', 4, 'Switching & protection', /Molded-Case Breakers/),
    it('DC disconnect & fusing', 'Fused disconnect, DC-rated', 'Per string / per rack input', Math.max(1, Math.round(kw / 500)), 'ea', 3, 'Switching & protection', /PV & DC Fuses/),
    it('Surge protective devices (AC & DC side)', 'MOV type 1/2', 'Coordinated SPD set', 2, 'ea', 1, 'Switching & protection', /Surge Protective/),
    it('Control & communications board set', 'DSP/FPGA controller, I/O, comms', 'Modbus/CAN/Ethernet, firmware-loaded', 1, 'set', 6, 'Controls & instrumentation', /Controller Boards, HMIs/),
    it('Current & voltage sensors', 'Hall-effect CTs, dividers', 'Per-phase + DC bus sensing', 8, 'ea', 2, 'Controls & instrumentation', /Sensors & Transducers/),
    it('HMI / display & status LEDs', 'Panel HMI', 'Local configuration & alarms', 1, 'ea', 1, 'Controls & instrumentation', /Controller Boards, HMIs/),
    it('Cooling system — fans / heat-sinks or liquid plate', 'Al extrusion + axial fans', 'Redundant fan trays where specified', Math.max(2, Math.round(kw / 200)), 'ea', 5, 'Cooling', /Heat Sinks, Cold Plates/),
    it('Enclosure, gland plates & internal harness', 'Powder-coated steel, NEMA 3R/4', 'Cabinet, door interlocks, wiring loom', 1, 'ea', 8, 'Structure & enclosure', /Enclosures & Cabinets/),
    it('Assembly fasteners & terminal hardware', 'Zinc-plated steel, Cu lugs', 'Torque-marked connections', Math.max(60, Math.round(kw / 4)), 'ea', 1, 'Hardware & fasteners', /Hex Cap Screws/),
  ];
  return { unitDesc: `${kw >= 1000 ? (kw / 1000) + ' MW' : kw + ' kW'} power-conversion assembly`, items };
}

/* Generic electronics device (meters, relays, transmitters, controllers, BMS/EMS, SCADA) */
function tmplElectronics(f) {
  const items = [
    it('Main PCB assembly (MCU/DSP, memory, power)', 'FR-4 multilayer, RoHS', 'Conformal-coated, firmware-loaded', 1, 'ea', 34, 'Electronics', /Controller Boards, HMIs/),
    it('I/O & interface board', 'PCB assembly', 'Analog/digital I/O, comms PHY', 1, 'ea', 12, 'Electronics', /Controller Boards, HMIs/),
    it('Power supply module', 'AC/DC or loop-powered', 'Isolated, surge-protected', 1, 'ea', 8, 'Electronics', /Controller Boards, HMIs/),
    it('Sensing element / measurement front-end', 'Per device type', 'CT/PT inputs, sensor cell, or field I/O', 1, 'set', 14, 'Sensing', /Sensors & Transducers/),
    it('Display / indicators', 'LCD/LED', 'Status & local readout', 1, 'ea', 4, 'Interface', /Controller Boards, HMIs/),
    it('Terminal blocks & connectors', 'Cage-clamp, plated Cu', 'Pluggable field wiring', 1, 'set', 4, 'Interface', /Panel Heaters, Terminal Blocks/),
    it('Housing / case', 'Polycarbonate or die-cast Al', 'Panel, DIN-rail or field-mount', 1, 'ea', 10, 'Structure & enclosure', /Enclosures & Cabinets/),
    it('Gaskets & environmental sealing', 'Silicone', 'Per ingress rating', 1, 'set', 2, 'Structure & enclosure', /Rubber & Gasket/),
    it('Fasteners, label set & packaging insert', 'Misc.', 'Nameplate, cal cert where applicable', 1, 'set', 2, 'Hardware & fasteners', /Labels, Nameplates/),
  ];
  return { unitDesc: `${f.n} device`, items };
}

/* Rotating pump/compressor */
function tmplPump(f, picks) {
  const hp = axNum(f, picks, /hp|kw|gpm|flow|size/i, 10);
  const comp = /compressor/i.test(f.n);
  const pd = /positive|diaphragm|drum|rod pump/i.test(f.n);
  const items = [
    it(comp ? 'Compression element (screw / recip cylinder)' : pd ? 'Pumping element (diaphragm / gear / plunger set)' : 'Impeller', comp || pd ? 'Alloy steel / elastomer' : 'CF8M / bronze / cast iron', 'Balanced, wear-matched to casing', comp || pd ? 1 : Math.max(1, Math.round(hp / 60)), 'ea', 16, 'Wet end / gas end', /Pump Repair Parts/),
    it('Casing / housing', 'Cast iron / WCB / 316SS', 'Pressure-containing, hydro-tested', 1, 'ea', 15, 'Wet end / gas end', /Pump Repair Parts/),
    it('Shaft', '416SS / 4140', 'Ground & polished', 1, 'ea', 6, 'Rotating assembly', /Pump Repair Parts/),
    it('Bearings (radial + thrust)', 'SKF/NSK-class rolling element', 'L10 sized to duty', 2, 'ea', 4, 'Rotating assembly', /Bearings & Bushings/),
    it('Mechanical seal or packing', 'Carbon/SiC faces, Viton', 'Single cartridge (dual optional)', 1, 'ea', 6, 'Sealing', /Mechanical Seals & Packing/),
    it('O-rings & gasket kit', 'Viton / Buna-N', 'Full rebuild set', 1, 'set', 1, 'Sealing', /O-Rings/),
    it('Drive motor', 'TEFC induction motor', `${hp} HP class`, 1, 'ea', 22, 'Driver', /AC Motors/),
    it('Coupling & guard', 'Elastomeric coupling, steel guard', 'Aligned at assembly', 1, 'ea', 2, 'Driver', /Shaft Couplings, Gearboxes/),
    it('Baseplate / frame', 'Fabricated steel', 'Machined mounting pads', 1, 'ea', 4, 'Structure & enclosure', /Tanks, Skids/),
    it('Wear rings, keys & retaining hardware', 'Bronze / steel', 'Renewable wear parts', 1, 'set', 2, 'Hardware & fasteners', /Pump Repair Parts/),
    it('Assembly bolting', 'Grade 5 / B7', 'Casing & foot bolting', Math.max(16, Math.round(hp)), 'ea', 1, 'Hardware & fasteners', /Stud Bolts|Hex Cap/),
  ];
  return { unitDesc: `${hp} HP-class ${comp ? 'compressor' : 'pump'} assembly`, items };
}

/* Industrial valve */
function tmplValve(f, picks) {
  const inch = axNum(f, picks, /size|bore|inch|"/i, 4);
  const cls = axPick(f, picks, /class|#|pressure|psi/i) || '150#';
  const items = [
    it('Body', 'WCB / LF2 / CF8M casting or forging', `Pressure class ${cls}, hydro-tested`, 1, 'ea', 30, 'Pressure boundary', /Forged Bodies/),
    it('Bonnet / cover', 'Matching body material', 'Bolted, gasketed', 1, 'ea', 10, 'Pressure boundary', /Forged Bodies/),
    it(/ball/i.test(f.n) ? 'Ball' : /gate/i.test(f.n) ? 'Gate / wedge' : /choke/i.test(f.n) ? 'Choke trim (bean/needle)' : 'Disc / plug', '316SS / ENP steel / tungsten-carbide trim', 'Lapped sealing surfaces', 1, 'ea', 14, 'Trim', /Valve Trim, Seats/),
    it('Seats', 'RPTFE / Devlon / alloy overlay', 'Matched pair', 2, 'ea', 6, 'Trim', /Valve Trim, Seats/),
    it('Stem', '17-4PH / XM-19', 'Blow-out proof design', 1, 'ea', 5, 'Trim', /Valve Trim, Seats/),
    it('Stem packing set', 'Graphite / PTFE chevrons', 'Live-loaded on larger sizes', 1, 'set', 2, 'Sealing', /Mechanical Seals & Packing/),
    it('Body/bonnet gasket', 'Spiral-wound 316/graphite', 'ASME B16.20', 1, 'ea', 1, 'Sealing', /Spiral-Wound/),
    it('Body bolting — studs & nuts', 'ASTM A193 B7 / A194 2H', 'Torqued to spec', Math.max(8, Math.round(inch * 2)), 'ea', 2, 'Hardware & fasteners', /Stud Bolts/),
    it(/frac|choke|kill/i.test(f.n) ? 'Grease fittings & body vents' : 'Handwheel / wrench or gear operator', 'Ductile iron / steel', inch >= 8 ? 'Gear operator' : 'Manual lever/handwheel', 1, 'ea', 4, 'Operator', /Valve Operators & Actuators/),
    it('Position indicator & locking plate', 'Steel / polymer', 'Lockable where specified', 1, 'ea', 1, 'Operator', /Valve Operators & Actuators/),
    it('Identification plate & paint system', 'SS tag, epoxy coat', 'Full traceability heat codes', 1, 'set', 1, 'Finishing', /Labels, Nameplates/),
  ];
  return { unitDesc: `${inch}" ${cls} valve assembly`, items };
}

/* Electric motor */
function tmplMotor(f, picks) {
  const hp = axNum(f, picks, /hp|kw|frame/i, 10);
  const items = [
    it('Stator — laminations + copper windings', 'M-19 Si steel, class F Cu wire', 'VPI-impregnated', 1, 'ea', 30, 'Electromagnetics', /Motor Repair Parts/),
    it('Rotor — die-cast squirrel cage / wound', 'Al or Cu cage on steel laminations', 'Dynamically balanced', 1, 'ea', 18, 'Electromagnetics', /Motor Repair Parts/),
    it('Frame / stator housing', 'Cast iron or rolled steel', 'TEFC finned', 1, 'ea', 14, 'Structure & enclosure', /Motor Repair Parts/),
    it('End bells / brackets', 'Cast iron', 'Machined bearing seats', 2, 'ea', 6, 'Structure & enclosure', /Motor Repair Parts/),
    it('Bearings DE + NDE', 'Deep-groove ball / roller', 'Regreasable on larger frames', 2, 'ea', 5, 'Rotating assembly', /Bearings & Bushings/),
    it('Shaft', '1045 steel', 'Keyed, ground journals', 1, 'ea', 5, 'Rotating assembly', /Motor Repair Parts/),
    it('Cooling fan & shroud', 'Polymer / steel', 'Bi-directional', 1, 'ea', 2, 'Cooling', /Motor Repair Parts/),
    it('Conduit box, leads & terminal board', 'Cast iron box, Cu leads', 'F1/F2 mountable', 1, 'set', 3, 'Connections', /Motor Repair Parts/),
    it('Slinger, seals & hardware kit', 'V-ring, gaskets, bolts', 'Weather protection', 1, 'set', 2, 'Hardware & fasteners', /O-Rings/),
    it('Nameplate & balance weights', 'SS plate', 'Full electrical data', 1, 'set', 1, 'Finishing', /Labels, Nameplates/),
  ];
  return { unitDesc: `${hp} HP-class motor`, items };
}

/* Switchgear lineup / panelboard-type assembly */
function tmplSwitchgear(f, picks) {
  const amps = axNum(f, picks, /bus|amp|frame/i, 2000);
  const mv = /mv|medium/i.test(f.n) || axNum(f, picks, /voltage|kv/i, 0) >= 5;
  const sections = Math.max(2, Math.round(amps / 1000) + 1);
  const items = [
    it(mv ? 'Vacuum circuit breakers (drawout)' : 'Power circuit breakers / MCCBs', mv ? 'VCB, spring-charged' : 'ACB/MCCB frames', 'One main + feeders', sections + 1, 'ea', 26, 'Switching devices', mv ? /Air Circuit/ : /Molded-Case/),
    it('Main bus — copper busbar, plated', 'Cu, tin/silver plated', `${amps} A continuous`, sections * 3, 'ea', 10, 'Bus & connections', /Copper Busbar/),
    it('Bus supports & standoff insulators', 'Cycloaliphatic epoxy / GPO-3', 'Braced to interrupt rating', sections * 6, 'ea', 3, 'Bus & connections', /Bus Insulators/),
    it('Current transformers', 'Window/bar CTs, metering + relay class', 'Per phase, per breaker', (sections + 1) * 3, 'ea', 5, 'Instrumentation', /Instrument Transformers/),
    it(mv ? 'Voltage transformers (drawout)' : 'Control power transformer', 'VT / CPT', 'Fused', mv ? 2 : 1, 'ea', 3, 'Instrumentation', /Instrument Transformers/),
    it('Protective relays', 'Microprocessor multifunction', '50/51, 27/59, 81, differential as spec’d', sections, 'ea', 8, 'Instrumentation', /Protective Relays/),
    it('Metering — power quality meters', 'Class 0.2 meters', 'Comms to SCADA/BMS', 1, 'ea', 2, 'Instrumentation', /Power Meters/),
    it('Enclosure sections, doors & barriers', mv ? 'Metal-clad, arc-resistant option' : 'NEMA 1/3R sections', 'Shutters, interlocks, IR windows', sections, 'ea', 18, 'Structure & enclosure', /Enclosures & Cabinets/),
    it('Control wiring, terminal blocks & switches', 'SIS wire, TBs, CS/LS switches', 'Point-to-point tested', 1, 'lot', 5, 'Controls & wiring', /Panel Heaters, Terminal Blocks/),
    it('Space heaters & thermostats', 'Strip heaters', 'Condensation control', sections, 'ea', 1, 'Controls & wiring', /Panel Heaters, Terminal Blocks/),
    it('Ground bus & lugs', 'Cu ground bus', 'Full-length', 1, 'lot', 1, 'Bus & connections', /Ground Bars/),
    it('Assembly hardware, gaskets & labels', 'Zinc-plated, EPDM', 'Arc-flash & mimic labels', 1, 'lot', 2, 'Hardware & fasteners', /Labels, Nameplates/),
  ];
  return { unitDesc: `${sections}-section, ${amps} A ${mv ? 'MV' : 'LV'} lineup`, items };
}

/* Single circuit breaker (MCCB / ACB) */
function tmplBreaker(f, picks) {
  const amps = axNum(f, picks, /amp|frame/i, 400);
  const poles = axNum(f, picks, /pole/i, 3);
  const items = [
    it('Molded case / frame halves', 'Glass-filled polyester', 'Interrupt-rated housing', 2, 'ea', 12, 'Structure & enclosure', /Breaker Repair Kits/),
    it('Contact sets — fixed + moving', 'AgW / AgC contact tips on Cu', 'Per pole', poles, 'set', 22, 'Current path', /Breaker Repair Kits/),
    it('Arc chutes / splitter plate stacks', 'Steel plates in ceramic holder', 'Per pole', poles, 'ea', 10, 'Current path', /Breaker Repair Kits/),
    it('Operating mechanism — springs, cradle, handle', 'Spring steel, zinc die-cast', 'Quick-make/quick-break', 1, 'ea', 18, 'Mechanism', /Breaker Repair Kits/),
    it(cfgHas(f, picks, /electronic|lsig|lsi/i) ? 'Electronic trip unit (LSI/LSIG)' : 'Thermal-magnetic trip elements', cfgHas(f, picks, /electronic|lsig|lsi/i) ? 'PCB + rogowski/CT sensing' : 'Bimetal + magnetic armature per pole', 'Calibrated at factory', 1, 'ea', 20, 'Protection', /Trip Units/),
    it('Line/load terminals & lugs', 'Plated Cu/Al', `${amps} A rated`, poles * 2, 'ea', 6, 'Current path', /Trip Units/),
    it('Accessory pocket components (aux/alarm/shunt)', 'Micro-switches, coil', 'As configured', 1, 'set', 4, 'Protection', /Trip Units/),
    it('Fasteners, rivets & label set', 'Steel, mylar', 'Ratings nameplate', 1, 'set', 2, 'Hardware & fasteners', /Rivets/),
  ];
  return { unitDesc: `${amps} A, ${poles}-pole breaker`, items };
}

/* Genset / turbine */
function tmplGenset(f, picks) {
  const kw = axNum(f, picks, /kw|mw|rating/i, 1000) * (axPick(f, picks, /mw/i) ? 1000 : 1);
  const turbine = /turbine/i.test(f.n);
  const items = [
    it(turbine ? 'Gas turbine core (compressor/combustor/turbine)' : 'Engine — diesel / natural-gas reciprocating', turbine ? 'Ni-alloy hot section' : 'Cast iron block, forged internals', `${Math.round(kw * 1.05).toLocaleString()} kWm prime mover`, 1, 'ea', 38, 'Prime mover', /Industrial Engines/),
    it('Alternator / generator end', 'Synchronous, brushless, PMG excitation', 'Class H insulation', 1, 'ea', 20, 'Generator', /Alternators & Generator/),
    it(turbine ? 'Air inlet filtration & silencing' : 'Radiator & charge-air cooling package', turbine ? 'Multi-stage filter house' : 'Cu/Al cores, engine-driven fan', 'Sized to site ambient', 1, 'ea', 6, 'Cooling & air', /Engine Cooling & Exhaust/),
    it('Fuel system — pumps, filters, lines' + (turbine ? ', gas train' : ', day tank connections'), 'Steel/SS lines, duplex filters', 'Leak-tested', 1, 'set', 4, 'Fuel & exhaust', /Fuel & Starting/),
    it('Exhaust system — silencer, bellows, piping', 'Aluminized steel / SS bellows', 'Critical-grade attenuation', 1, 'set', 3, 'Fuel & exhaust', /Engine Cooling & Exhaust/),
    it('Starting system — batteries & charger (or air start)', 'AGM battery banks + float charger', 'Redundant on larger sets', 2, 'ea', 2, 'Electrical', /Fuel & Starting/),
    it('Generator controller & governor/AVR', 'Digital genset controller', 'Sync, load-share, protective functions', 1, 'set', 6, 'Controls & instrumentation', /Genset Controls/),
    it('Output circuit breaker', 'ACB/MCCB', 'Rated to alternator amps', 1, 'ea', 4, 'Electrical', /Air Circuit|Molded-Case/),
    it('Skid base, isolators & vibration mounts', 'Fabricated steel, spring isolators', 'Full-length fuel-containment option', 1, 'ea', 6, 'Structure & enclosure', /Tanks, Skids/),
    it('Enclosure / weather housing (where specified)', 'Sound-attenuated steel', 'Walk-in on larger ratings', 1, 'ea', 8, 'Structure & enclosure', /Containerized/),
    it('Wiring harness, sensors & senders', 'Loom, RTDs, pressure senders', 'Engine & alternator monitoring', 1, 'lot', 2, 'Controls & instrumentation', /Wiring Harnesses/),
    it('Anchor bolts & hardware kit', 'HDG', 'Seismic-rated where required', 24, 'ea', 1, 'Hardware & fasteners', /Anchors/),
  ];
  return { unitDesc: `${kw >= 1000 ? (kw / 1000).toFixed(1) + ' MW' : kw + ' kW'} ${turbine ? 'turbine' : 'engine'} generator set`, items };
}

/* UPS static / flywheel */
function tmplUPS(f, picks) {
  const kw = axNum(f, picks, /kva|kw/i, 500);
  const fly = /flywheel/i.test(f.n);
  const base = tmplPowerElectronics(f, picks, kw);
  base.items.push(
    fly
      ? it('Flywheel energy-storage module', 'Steel rotor, vacuum housing, mag bearings', 'Ride-through energy store', Math.max(1, Math.round(kw / 300)), 'ea', 18, 'Energy storage', /Flywheel/)
      : it('Battery strings (VRLA / Li-ion) + racks & DC breakers', 'Battery modules, racks, fusing', 'Runtime per spec', Math.max(1, Math.round(kw / 250)), 'string', 18, 'Energy storage', /Industrial Batteries/),
    it('Static bypass switch assembly', 'SCR pair + wrap-around contactor', 'Make-before-break transfer', 1, 'ea', 6, 'Switching & protection', /Static Transfer/),
    it('Maintenance bypass panel', 'Rotary/breaker MBP', 'External or built-in', 1, 'ea', 3, 'Switching & protection', /Switchboard/)
  );
  base.unitDesc = `${kw} kVA ${fly ? 'flywheel' : 'static'} UPS`;
  return base;
}

/* Cooling / HVAC unit */
function tmplCooling(f, picks) {
  const kw = axNum(f, picks, /kw|ton|capacity/i, 300);
  const liquid = /cdu|liquid|rear-door|skid/i.test(f.n);
  const chiller = /chiller|dry cooler|crac|hvac/i.test(f.n);
  const items = [
    it(liquid ? 'Brazed-plate / shell heat exchanger' : 'Evaporator & condenser coil set', liquid ? '316SS brazed-plate' : 'Cu tube / Al fin coils', `${kw} kW-class thermal duty`, liquid ? 2 : 1, 'ea', 16, 'Heat transfer', /Coils & Heat Exchangers/),
    it(chiller ? 'Compressors (scroll/screw)' : liquid ? 'Circulation pumps (N+1)' : 'Fan array', chiller ? 'Hermetic scroll/screw' : liquid ? 'SS centrifugal, VFD-driven' : 'EC plug fans', 'Redundant per spec', Math.max(2, Math.round(kw / 150)), 'ea', 20, 'Fluid movers', chiller ? /Refrigeration Parts/ : liquid ? /Centrifugal & Utility Pumps/ : /Motors, Blowers & Fans/),
    it(liquid || chiller ? 'Fans — condenser / dry-cooler' : 'EC fan wall modules', 'EC axial fans', 'Speed-controlled', Math.max(2, Math.round(kw / 100)), 'ea', 6, 'Fluid movers', /Motors, Blowers & Fans/),
    it('Valves — isolation, balancing, control', 'Bronze/SS, electronic actuators', '2-way/3-way control', Math.max(4, Math.round(kw / 80)), 'ea', 5, 'Piping & valves', /Valves & Fittings/),
    it('Manifolds, piping & hose assemblies', 'Cu / SS / EPDM flex', 'Pressure-tested', 1, 'lot', 6, 'Piping & valves', /Pipe, Tube & Hose/),
    it('Filters / strainers & fluid treatment', 'Y-strainers, filter driers', 'Serviceable', 1, 'set', 2, 'Piping & valves', /Filters & Belts/),
    it('VFDs / motor controls', 'Drive per pump/fan group', 'Integrated in panel', Math.max(1, Math.round(kw / 200)), 'ea', 6, 'Controls & instrumentation', /Motor Controls/),
    it('Unit controller, sensors & display', 'PLC/DDC, PT/RTD/flow sensors', 'BMS-integrated (BACnet/Modbus)', 1, 'set', 7, 'Controls & instrumentation', /Controller Boards, HMIs/),
    it('Leak detection & condensate management', 'Rope sensors, drip pans, pump', 'Alarmed', 1, 'set', 2, 'Controls & instrumentation', /Sensors & Transducers/),
    it('Frame, panels & insulation', 'G90 steel, foam insulation', 'Serviceable access', 1, 'ea', 9, 'Structure & enclosure', /Enclosures & Cabinets/),
    it('Refrigerant / coolant first fill', chiller ? 'R-513A/R-32 class' : 'PG25 / treated water', 'Factory-charged', rq(kw * 0.3), chiller ? 'kg' : 'L', 3, 'Fluids', /Refrigerants & Heat-Transfer/),
    it('Hardware, gaskets & vibration isolation', 'Neoprene mounts, bolts', 'Anti-vibration kit', 1, 'lot', 2, 'Hardware & fasteners', /Rubber & Gasket/),
  ];
  return { unitDesc: `${kw} kW-class cooling unit`, items };
}

/* PV module */
function tmplPVModule(f, picks) {
  const w = axNum(f, picks, /w|watt|power/i, 550);
  const thin = /thin-film|cdte/i.test(f.n);
  const cells = thin ? 1 : Math.round(w / 5.1);
  const items = [
    it(thin ? 'CdTe semiconductor stack on substrate glass' : 'Solar cells — mono PERC/TOPCon', thin ? 'CdTe/CdS layers' : `M10/G12 silicon, ${cells} cells`, 'Sorted & binned to power class', cells, 'ea', 42, 'Active laminate', /Solar Cells & Interconnect/),
    it('Front glass', 'Low-iron tempered, 2.0–3.2 mm AR-coated', 'Full module area', 1, 'ea', 10, 'Active laminate', /Solar Glass/),
    it(thin ? 'Rear glass' : 'Backsheet or rear glass', thin ? 'Heat-strengthened glass' : 'PPE/PVDF backsheet or 2 mm glass', 'Per bifacial config', 1, 'ea', 6, 'Active laminate', /Solar Glass/),
    it('Encapsulant sheets', 'EVA / POE', 'Front + rear layers', 2, 'ea', 5, 'Active laminate', /Solar Glass/),
    it('Cell interconnect ribbon & busbar', 'Sn-coated Cu ribbon', 'Multi-busbar layout', rq(w * 0.3), 'm', 4, 'Active laminate', /Solar Cells & Interconnect/),
    it('Frame', 'Anodized 6063 Al', 'Corner-keyed, grounding holes', 1, 'set', 12, 'Structure & enclosure', /Module Frames & Aluminum/),
    it('Junction box with bypass diodes', 'PPO housing, 3 diodes, potted', 'IP68', 1, 'ea', 5, 'Electrical', /PV Junction Boxes/),
    it('Output cables & connectors', '4/6 mm² PV wire + MC4-type', '±1.2 m leads', 2, 'ea', 3, 'Electrical', /MC4 Connectors/),
    it('Edge sealant & potting', 'Silicone / butyl', 'Frame + J-box seal', 1, 'lot', 2, 'Structure & enclosure', /Sealants & Caulks/),
    it('Label set & serial barcode', 'Mylar', 'IEC/UL ratings plate', 1, 'set', 1, 'Finishing', /Labels, Nameplates/),
  ];
  return { unitDesc: `${w} W module`, units: w, items };
}

/* Tracker / racking / piles */
function tmplTracker(f, picks) {
  const fixed = /fixed|racking/i.test(f.n);
  const pile = /pile|foundation/i.test(f.n);
  if (pile) {
    return { unitDesc: 'Driven pile', items: [
      it('Pile section — W6/W8 or C-channel', 'HDG A572 Gr 50', 'Rolled section, punched', 1, 'ea', 80, 'Structure', /Structural Shapes/),
      it('Cap plate / bracket', 'HDG steel', 'Slotted for tolerance', 1, 'ea', 12, 'Structure', /Bar, Sheet & Plate/),
      it('Hardware set', 'HDG bolts & serrated nuts', 'Per connection detail', 8, 'ea', 8, 'Hardware & fasteners', /Hex Cap Screws/),
    ]};
  }
  const rowKw = axNum(f, picks, /kw|module|row/i, 120);
  const items = [
    it('Torque tube sections', 'HDG steel tube, 100–150 mm', 'Spliced full row', Math.max(4, Math.round(rowKw / 15)), 'ea', 22, 'Structure', /Structural Shapes/),
    it('Module rails / purlins & clamps', 'Galvalume steel / Al', 'Pre-assembled fasteners', Math.max(20, Math.round(rowKw / 2)), 'ea', 16, 'Structure', /Module Clamps/),
    it('Bearing assemblies (dampered)', 'Polymer bushing + housing', 'One per pile top', Math.max(6, Math.round(rowKw / 18)), 'ea', 8, 'Structure', /Bearings & Bushings/),
  ];
  if (!fixed) items.push(
    it('Slew drive / gearbox', 'Worm slew drive, sealed', 'Self-locking', 1, 'ea', 14, 'Drive & control', /Tracker Drives & Row/),
    it('Drive motor (24/48 VDC)', 'BLDC gearmotor', 'With encoder', 1, 'ea', 6, 'Drive & control', /DC & Gearmotors/),
    it('Tracker controller + inclinometer', 'Self-powered node, Zigbee/LoRa', 'Row controller w/ backtracking', 1, 'ea', 7, 'Drive & control', /Tracker Drives & Row/),
    it('Self-power module & battery', 'PV panel + Li battery', 'Autonomous row power', 1, 'ea', 3, 'Drive & control', /Tracker Drives & Row/),
    it('Wind/dampers & stow hardware', 'Hydraulic dampers', 'Per wind design', Math.max(2, Math.round(rowKw / 40)), 'ea', 4, 'Structure', /Tracker Drives & Row/)
  );
  items.push(it('Fastener & grounding kit — full row', 'HDG/SS hardware, WEEBs, lugs', 'UL 2703 bonding path', 1, 'lot', 5, 'Hardware & fasteners', /Ground Bars/));
  return { unitDesc: (fixed ? 'Fixed-tilt rack section' : 'Single-axis tracker row') + ` (~${rowKw} kW of modules)`, units: rowKw * 1000, items };
}

/* Cable (per 1000-ft reel) */
function tmplCable(f, picks) {
  const awgPick = axPick(f, picks, /awg|size|gauge/i);
  const mv = /mv|collection/i.test(f.n);
  const selfRe = new RegExp(f.n.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'));
  const items = [
    it('Conductor', /al\b|aluminum/i.test((picks || []).join(' ')) ? 'Stranded 1350/8000 Al' : 'Stranded bare Cu', awgPick ? `Size ${awgPick}` : 'Per configured size', 1000, 'ft', 55, 'Conductor', /Wire, Coil & Fine/),
    it('Insulation', mv ? 'TR-XLPE, 100%/133% level' : 'XLPE / PVC / nylon per type', 'Extruded, spark-tested', 1000, 'ft', 18, 'Insulation & jacket', selfRe),
    it('Jacket', mv ? 'LLDPE / CPE sunlight-resistant' : 'PVC sunlight-resistant', 'Sequential footage marking', 1000, 'ft', 9, 'Insulation & jacket', selfRe),
  ];
  if (mv) items.splice(2, 0,
    it('Semi-conducting shields (conductor + insulation)', 'Semi-con compound', 'Triple-extruded', 1000, 'ft', 6, 'Insulation & jacket', selfRe),
    it('Metallic shield — Cu tape / concentric neutral', 'Annealed Cu', 'Per shield spec', 1000, 'ft', 8, 'Insulation & jacket', /Wire, Coil & Fine/));
  items.push(it('Reel, lagging & seals', 'Wood/steel reel', 'End caps, moisture seals', 1, 'ea', 4, 'Packaging', /Reels, Crates/));
  return { unitDesc: `1,000 ft reel of ${f.n}`, units: 1000, items };
}

/* BESS DC block */
function tmplBESS(f, picks) {
  const mwh = axNum(f, picks, /mwh|kwh|energy/i, 5);
  const rack = /rack/i.test(f.n);
  const kwhTot = mwh >= 100 ? mwh : mwh * 1000;
  const cellAh = 314, cellKwh = 3.2 * cellAh / 1000;
  const cells = Math.round((rack ? kwhTot : mwh * 1000) / cellKwh);
  const modules = Math.max(1, Math.round(cells / 104));
  const racks = rack ? 1 : Math.max(2, Math.round(modules / 8));
  const items = [
    it('Battery cells — LFP/NMC prismatic', /nmc/i.test(f.n) ? 'NMC 811 prismatic' : `LFP ${cellAh} Ah prismatic`, 'Grade-A, matched impedance bins', cells, 'ea', 46, 'Energy storage', /Battery Cells \(Prismatic/),
    it('Module housings, busbars & cell interconnects', 'Al housing, laser-welded busbar', `${modules} modules`, modules, 'ea', 10, 'Energy storage', /Battery Modules & Rack/),
    it('BMS — module slaves + rack masters', 'CMU per module, BMU per rack', 'Cell V/T sensing, balancing', modules + racks, 'ea', 6, 'Controls & instrumentation', /Battery Management/),
    it('Rack frames & module rails', 'Powder-coated steel racking', 'Seismic-rated', racks, 'ea', 5, 'Structure & enclosure', /Battery Modules & Rack/),
    it('DC busbar, cabling & MSD connectors', 'Cu bus, 1500 V DC cable', 'Touch-safe', 1, 'lot', 4, 'Power distribution', /Battery Modules & Rack/),
    it('DC contactors, fuses & pre-charge', 'DC-rated contactor + Class T/aR fuses per rack', 'Fault-rated', racks * 3, 'ea', 4, 'Power distribution', /DC Contactors, Fuses/),
    it('Liquid-cooling plates, manifolds & CDU interface', 'Al cold plates, PG25 loop', 'Leak-tested circuit', modules, 'ea', 7, 'Thermal management', /Battery Thermal/),
    it('Fire safety — gas detection, aerosol suppression, deflagration vents', 'NFPA 855/69 compliant set', 'Zone-monitored', 1, 'set', 3, 'Safety', /Fire Detection & Suppression Components/),
    it('Enclosure — outdoor cabinet/container, doors, HVAC interface', 'Corten/galvanneal, IP55', 'Insulated, access-controlled', rack ? 0 : 1, 'ea', 12, 'Structure & enclosure', /Containerized/),
    it('Wiring harnesses, comms & sensors', 'CAN/Ethernet looms, smoke/H2 sensors', 'Pre-terminated', 1, 'lot', 2, 'Controls & instrumentation', /Wiring Harnesses/),
    it('Hardware & torque-marked fastener kit', 'Zinc-flake coated', 'Full assembly kit', 1, 'lot', 1, 'Hardware & fasteners', /Hex Cap Screws/),
  ];
  return { unitDesc: rack ? `${kwhTot.toLocaleString()} kWh rack` : `${mwh} MWh DC block (${cells.toLocaleString()} cells)`, units: rack ? kwhTot : mwh * 1000, items };
}

/* Combiner box */
function tmplCombiner(f, picks) {
  const strings = axNum(f, picks, /string|input|circuit/i, 24);
  const items = [
    it('String fuses & holders', '1500 V gPV fuse + touch-safe holder', 'Per input', strings, 'ea', 18, 'Protection', /PV & DC Fuses/),
    it('DC disconnect switch', 'Load-break rotary, 1500 V DC', 'Externally operable', 1, 'ea', 14, 'Protection', /PV & DC Fuses/),
    it('Output busbar & lugs', 'Tin-plated Cu', 'Sized to output amps', 1, 'set', 10, 'Bus & connections', /Copper Busbar/),
    it('Surge protective device', 'DC SPD type 1/2, 1500 V', 'Monitored', 1, 'ea', 8, 'Protection', /Surge Protective/),
    it('Input connectors / cable glands', 'MC4-type bulkhead or glands', 'Per input + output', strings + 2, 'ea', 8, 'Connections', /MC4/),
    it('Monitoring board (string currents) & CTs', 'Hall sensors + comms PCB', 'Modbus over RS-485', 1, 'set', 12, 'Controls & instrumentation', /Controller Boards, HMIs/),
    it('Enclosure — NEMA 4X', 'Polycarbonate / 316SS', 'UV-rated, padlockable', 1, 'ea', 22, 'Structure & enclosure', /Enclosures & Cabinets/),
    it('DIN rail, wire duct & internal wiring', 'PVC duct, tinned wire', 'Point-tested', 1, 'lot', 5, 'Connections', /Panel Heaters, Terminal Blocks/),
    it('Mounting & sealing hardware', 'SS316 hardware', 'Pole/rack mount kit', 1, 'set', 3, 'Hardware & fasteners', /Hex Cap Screws/),
  ];
  return { unitDesc: `${strings}-string combiner`, items };
}

/* Wellhead / BOP */
function tmplPressureControl(f, picks) {
  const bop = /bop/i.test(f.n);
  const psi = axNum(f, picks, /psi|pressure|rating/i, 10000);
  const items = bop ? [
    it('Body — forged ram/annular housing', 'AISI 4130 75K forging', `${psi.toLocaleString()} psi WP, NACE MR0175`, 1, 'ea', 32, 'Pressure boundary', /Forged Bodies/),
    it(/annular/i.test(String(picks)) ? 'Packing element (annular)' : 'Ram blocks — pipe/blind/shear', 'NBR/HNBR elastomer + alloy steel', 'Size-specific', 2, 'ea', 16, 'Sealing elements', /annular/i.test(String(picks)) ? /Wellhead Hangers/ : /Valve Trim, Seats/),
    it('Bonnets / doors with hinges', '4130 forged', 'Side outlet as spec’d', 2, 'ea', 10, 'Pressure boundary', /Forged Bodies/),
    it('Operating pistons & cylinders', 'Chromed alloy steel', 'Hydraulic open/close', 2, 'ea', 10, 'Actuation', /Forged Bodies/),
    it('Seals, seats & elastomer kit', 'HNBR, PTFE, energized lip seals', 'Full redress kit', 1, 'set', 8, 'Sealing elements', /O-Rings/),
    it('Ring grooves & gaskets (BX/RX)', '316 SS inlay, BX gasket', 'API 6A flange prep', 2, 'ea', 3, 'Connections', /Ring-Joint/),
    it('Studs & nuts — bonnet/flange', 'B7/2H, PTFE-coated', 'Full bolting set', 32, 'ea', 3, 'Hardware & fasteners', /Stud Bolts/),
    it('Hydraulic control connections & test ports', 'Autoclave-type fittings', 'Function-tested', 1, 'set', 3, 'Actuation', /Hydraulic Hose/),
    it('Position indicators & locks', 'Visual + manual locks', 'Ram-lock screws', 2, 'ea', 3, 'Actuation', /Valve Operators & Actuators/),
    it('Paint system & traceability tags', 'Epoxy, SS tags', 'Full MTRs', 1, 'lot', 2, 'Finishing', /Paints & Protective Coatings/),
  ] : [
    it('Casing/tubing head spools', '4130 forged, load-rated', `${psi.toLocaleString()} psi WP`, 2, 'ea', 24, 'Pressure boundary', /Forged Bodies/),
    it('Casing & tubing hangers', 'Mandrel/slip type, alloy steel', 'Size to program', 2, 'ea', 14, 'Suspension', /Wellhead Hangers/),
    it('Master & wing gate valves', 'API 6A slab gates', 'PR2-tested', 4, 'ea', 22, 'Valves', /Gate \/ Globe/),
    it('Tree cap, crosses & adapters', '4130 forged', 'Studded/flanged', 3, 'ea', 10, 'Pressure boundary', /Adapters & Spools/),
    it('Choke — positive/adjustable', 'Tungsten-carbide trim', 'Bean sizes per program', 1, 'ea', 7, 'Valves', /Choke & Kill/),
    it('Ring gaskets — R/RX/BX set', 'Soft iron / 316', 'All connections', 8, 'ea', 2, 'Connections', /Ring-Joint/),
    it('Studs & nuts — full stack', 'B7/2H PTFE-coated', 'All flanges', 64, 'ea', 3, 'Hardware & fasteners', /Stud Bolts/),
    it('Seals, packoffs & secondary seals', 'HNBR/PTFE energized', 'Annulus isolation', 1, 'set', 6, 'Suspension', /Wellhead Hangers/),
    it('Gauge valves, needle valves & pressure gauges', 'SS instrument set', 'Annulus monitoring', 1, 'set', 2, 'Instrumentation', /Temp Transmitters/),
    it('Paint & traceability', 'Epoxy, low-stress stamping', 'Full MTR package', 1, 'lot', 2, 'Finishing', /Paints & Protective Coatings/),
  ];
  return { unitDesc: bop ? `${psi.toLocaleString()} psi BOP assembly` : `${psi.toLocaleString()} psi wellhead & tree`, items };
}

/* Downhole / artificial lift */
function tmplDownhole(f, picks) {
  if (/esp/i.test(f.n)) {
    const hp = axNum(f, picks, /hp/i, 200);
    return { unitDesc: `${hp} HP ESP string`, items: [
      it('Multistage centrifugal pump sections', 'Ni-resist stages, 400-series shafts', 'Stage count per TDH', 3, 'ea', 26, 'Pump', /ESP Systems/),
      it('Submersible motor', 'Oil-filled induction, 400-series housing', `${hp} HP class`, 1, 'ea', 26, 'Motor', /ESP Systems/),
      it('Seal/protector section', 'Labyrinth + bag chambers', 'Thrust bearing carrier', 1, 'ea', 10, 'Motor', /ESP Systems/),
      it('Gas separator / intake', 'Rotary separator', 'Per GOR', 1, 'ea', 5, 'Pump', /ESP Systems/),
      it('Power cable — flat/round, armored', 'EPDM/lead-sheathed, galv. armor', 'Sized to setting depth', 5000, 'ft', 18, 'Power delivery', /Downhole Cable & Wellsite/),
      it('Motor lead extension & pothead', 'Spliced MLE, banded', 'High-temp rated', 1, 'ea', 4, 'Power delivery', /Downhole Cable & Wellsite/),
      it('Downhole sensor (PHM)', 'P/T/vibration gauge', 'Surface readout', 1, 'ea', 4, 'Instrumentation', /Temp Transmitters/),
      it('Cable bands, protectors & clamps', 'SS bands, cast protectors', 'Per joint', 160, 'ea', 3, 'Hardware & fasteners', /Downhole Cable & Wellsite/),
      it('Wellhead penetrator & surface connections', 'Rated feed-through', 'Tested', 1, 'set', 2, 'Power delivery', /Downhole Cable & Wellsite/),
      it('O-rings, thread compound & shear pins', 'Service kit', 'Install consumables', 1, 'set', 2, 'Hardware & fasteners', /O-Rings/),
    ]};
  }
  if (/rod pump|sucker/i.test(f.n)) {
    return { unitDesc: 'Rod-lift downhole assembly', items: [
      it('Subsurface pump — barrel & plunger', 'Chrome barrel, spray-metal plunger', 'API 11AX insert/tubing pump', 1, 'ea', 30, 'Pump', /Rod Pumps & Sucker/),
      it('Standing & traveling valve assemblies', 'Cobalt/ceramic ball & seat', 'Matched sets', 2, 'ea', 12, 'Pump', /Valve Trim, Seats/),
      it('Sucker rod string', 'Grade D/KD alloy rods', '25-ft rods + couplings', 300, 'ea', 38, 'Rod string', /Rod Pumps & Sucker/),
      it('Rod couplings & sub-couplings', 'Spray-metal T-couplings', 'Full string', 300, 'ea', 8, 'Rod string', /Rod Pumps & Sucker/),
      it('Rod guides & scrapers', 'Molded polymer', 'Deviated-well spacing', 120, 'ea', 4, 'Rod string', /Rod Pumps & Sucker/),
      it('Polished rod, clamp & liner', '4140 chrome', 'Stuffing-box interface', 1, 'set', 4, 'Surface interface', /Rod Pumps & Sucker/),
      it('Hold-down / seating assembly & gas anchor', 'Mechanical/cup hold-down', 'Per pump type', 1, 'set', 4, 'Pump', /Packers & Completion/),
    ]};
  }
  return { unitDesc: 'Completion tool assembly', items: [
    it('Mandrel body', '4140/13Cr alloy', 'Threaded, gauged', 1, 'ea', 30, 'Structure', /Packers & Completion/),
    it('Slip & cone assembly', 'Case-hardened wickers', 'Bi-directional', 1, 'set', 18, 'Anchoring', /Packers & Completion/),
    it('Element package', 'HNBR/Aflas rated to temp', '3-element pack', 1, 'set', 20, 'Sealing', /Wellhead Hangers/),
    it('Setting mechanism — shear screws, ratchet, lock ring', 'Alloy steel', 'Hydraulic/mechanical set', 1, 'set', 14, 'Actuation', /Packers & Completion/),
    it('Seal bores, O-rings & backups', 'Viton/PTFE', 'Redress kit', 1, 'set', 8, 'Sealing', /O-Rings/),
    it('Release/retrieval components', 'Shear studs, fishing neck', 'Per running procedure', 1, 'set', 6, 'Actuation', /Packers & Completion/),
    it('Thread protectors & tags', 'Steel/plastic', 'Traceability', 1, 'set', 4, 'Finishing', /Thread Protectors, Dope/),
  ]};
}

/* OCTG / drill pipe */
function tmplTubular(f, picks) {
  const dp = /drill pipe/i.test(f.n);
  const selfRe = new RegExp(f.n.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'));
  const items = [
    it('Pipe body', dp ? 'S-135 seamless tube, upset ends' : 'Seamless/ERW carbon steel per API 5CT', 'Per configured OD/weight/grade', 1, 'joint', dp ? 55 : 78, 'Body', selfRe),
    dp ? it('Tool joints — pin & box, friction-welded', '4137H forged, hardbanded', 'Double-shoulder option', 2, 'ea', 32, 'Connections', /Forged Bodies/)
       : it('Coupling', 'Same-grade machined coupling, phosphated', 'API/premium thread', 1, 'ea', 12, 'Connections', /Forged Bodies/),
    it('Thread compound & storage coating', 'API-modified dope, mill varnish', 'Applied at mill', 1, 'lot', 3, 'Finishing', /Thread Protectors, Dope/),
    it('Thread protectors — pin & box', 'HDPE/steel composite', 'Open-end protection', 2, 'ea', 4, 'Finishing', /Thread Protectors, Dope/),
    it(dp ? 'Hardbanding & internal plastic coating' : 'Marking, drift & inspection', dp ? 'Casing-friendly hardband, IPC' : 'Full-length drift, EMI/UT', 'Certified', 1, 'lot', 6, 'Finishing', dp ? /Thread Protectors, Dope/ : /Labels, Nameplates/),
  ];
  return { unitDesc: dp ? 'Range-2/3 drill-pipe joint' : 'Range-3 OCTG joint (~42 ft)', units: dp ? 1 : 42, items };
}

/* Instrumentation transmitter / flow meter / RTU */
function tmplInstrument(f) {
  const base = tmplElectronics(f);
  if (/flow/i.test(f.n)) base.items.unshift(it('Flow tube / measurement body', '316SS wetted parts', 'Calibrated bore, flanged', 1, 'ea', 20, 'Sensing', /Flow Meters/));
  if (/pressure|temp/i.test(f.n)) base.items.unshift(it('Process connection & isolation diaphragm', '316L/Hastelloy diaphragm, silicone fill', 'NACE option', 1, 'ea', 12, 'Sensing', /Temp Transmitters/));
  return base;
}

/* LED fixture */
function tmplLED(f, picks) {
  const lm = axNum(f, picks, /lumen|lm/i, 20000);
  const items = [
    it('LED boards (mid-power arrays)', 'Aluminum MCPCB, 3030/5050 LEDs', `${lm.toLocaleString()} lm target flux`, Math.max(2, Math.round(lm / 12000)), 'ea', 26, 'Light engine', /LED Modules, Drivers/),
    it('LED driver', 'Constant-current, 0-10 V dimming', 'Surge-protected', 1, 'ea', 20, 'Electrical', /LED Modules, Drivers/),
    it('Heat sink / housing', 'Extruded/die-cast Al', 'Passive thermal path', 1, 'ea', 20, 'Structure & enclosure', /Heat Sinks, Cold Plates/),
    it('Optics — lens / reflector', 'PC lens, PMMA optics', 'Beam per distribution', 1, 'set', 10, 'Light engine', /LED Modules, Drivers/),
    it('Gaskets & seals', 'Silicone', 'IP65 where rated', 1, 'set', 3, 'Structure & enclosure', /Rubber & Gasket/),
    it('Mounting hardware — hook/yoke/bracket', 'Steel, zinc-plated', 'Per mount config', 1, 'set', 6, 'Hardware & fasteners', /Hex Cap Screws/),
    it('Wiring, connectors & sensor socket', 'Quick-connects, NEMA/zhaga socket', 'Sensor-ready', 1, 'set', 4, 'Electrical', /LED Modules, Drivers/),
    it('End caps, lens clips & labels', 'Misc.', 'DLC/UL labels', 1, 'set', 2, 'Finishing', /LED Modules, Drivers/),
  ];
  return { unitDesc: `${lm.toLocaleString()} lm fixture`, items };
}

/* Power tool */
function tmplPowerTool(f, picks) {
  const cordless = cfgHas(f, picks, /cordless|volt|v\b|battery/i);
  const selfRe = /Drills \/ Drivers|Saws & Grinders/;
  const items = [
    it('Motor — brushless BLDC / universal', 'Nd magnets, Cu windings', 'Electronically controlled', 1, 'ea', 22, 'Drivetrain', /DC & Gearmotors/),
    it('Gearbox / transmission', 'Hardened steel planetary', 'Multi-speed', 1, 'ea', 14, 'Drivetrain', /Shaft Couplings, Gearboxes/),
    it(/saw|grinder/i.test(f.n) ? 'Spindle, guard & blade/wheel interface' : 'Chuck / bit holder & clutch', 'Hardened steel', 'Tool-free change', 1, 'set', 8, 'Drivetrain', selfRe),
    it('Controller / switch module', 'PCB + FETs, trigger', 'Variable speed, brake', 1, 'ea', 10, 'Electrical', /Devices, Switches/),
    cordless ? it('Battery interface & pack (where kitted)', 'Li-ion pack, BMS', 'Slide-pack rail', 1, 'ea', 16, 'Electrical', /Industrial Batteries/)
             : it('Cord set & strain relief', 'SJO cord, molded plug', 'Double-insulated', 1, 'ea', 4, 'Electrical', /Wire, Cable & Cord/),
    it('Housing clamshells & grip overmold', 'Glass-filled nylon, TPE', 'Ergonomic', 1, 'set', 12, 'Structure & enclosure', selfRe),
    it('Bearings, seals & retaining rings', 'Ball bearings', 'Sealed', 4, 'ea', 4, 'Drivetrain', /Bearings & Bushings/),
    it('LED worklight, belt clip & aux handle', 'Accessory set', 'Per model', 1, 'set', 3, 'Finishing', selfRe),
    it('Screws & internal fasteners', 'Torx thread-formers', 'Service-friendly', 14, 'ea', 2, 'Hardware & fasteners', /Machine Screws/),
  ];
  return { unitDesc: `${f.n} unit`, items };
}

/* Hoist / rigging */
function tmplHoist(f, picks) {
  if (/sling|rigging/i.test(String(picks)) && !/hoist/i.test(f.n)) return null;
  const ton = axNum(f, picks, /ton|capacity|wll/i, 2);
  const items = [
    it('Load chain / wire rope', 'Grade 100 alloy chain or IWRC rope', `${ton}-ton WLL`, 20, 'ft', 16, 'Load path', /Hoists, Slings/),
    it('Hooks — top & bottom with latches', 'Forged alloy, load-rated', 'Proof-tested', 2, 'ea', 10, 'Load path', /Hoists, Slings/),
    it('Lift wheel / drum & sheaves', 'Hardened steel', 'Pocket wheel machined', 1, 'set', 10, 'Drivetrain', /Hoists, Slings/),
    it('Gear train & load brake', 'Helical gears, Weston-type brake', 'Oil-bath', 1, 'set', 18, 'Drivetrain', /Shaft Couplings, Gearboxes/),
    it(/electric|motor/i.test(f.n + String(picks)) ? 'Hoist motor & contactor panel' : 'Hand chain & guide', 'TENV motor or plated hand chain', 'Duty-rated', 1, 'set', 20, 'Drive', /electric|motor/i.test(f.n + String(picks)) ? /AC Motors/ : /Hoists, Slings/),
    it('Frame, covers & suspension', 'Steel housing, hook/lug/trolley mount', 'Powder-coated', 1, 'ea', 14, 'Structure & enclosure', /Hoists, Slings/),
    it('Limit switches & overload clutch', 'Upper/lower limits, slip clutch', 'Factory-set', 1, 'set', 6, 'Safety', /Devices, Switches/),
    it('Bearings, seals & hardware', 'Sealed bearings, gaskets', 'Service kit', 1, 'set', 4, 'Hardware & fasteners', /Bearings & Bushings/),
    it('Chain container & labels', 'Fabric/steel bag, capacity tags', 'ASME B30 marking', 1, 'set', 2, 'Finishing', /Reels, Crates/),
  ];
  return { unitDesc: `${ton}-ton hoist`, items };
}

/* Cylinder */
function tmplCylinder(f, picks) {
  const bore = axNum(f, picks, /bore|size/i, 2);
  return { unitDesc: `${bore}" bore cylinder`, items: [
    it('Barrel / tube', 'Honed steel or hard-coat Al', `${bore}" bore, honed ID`, 1, 'ea', 22, 'Structure', /Tubing & Pipe Stock/),
    it('Piston rod', 'Chrome-plated 1045/17-4', 'Ground & polished', 1, 'ea', 16, 'Motion', /Bar, Sheet & Plate/),
    it('Piston & wear bands', 'Ductile iron / Al, PTFE bands', 'Magnet option', 1, 'ea', 12, 'Motion', /Cylinders & Valves/),
    it('End caps / heads', 'Al or steel, ported', 'SAE/NPT ports', 2, 'ea', 14, 'Structure', /Cylinders & Valves/),
    it('Rod gland & bushing', 'Bronze bushing cartridge', 'Serviceable', 1, 'ea', 8, 'Sealing', /Cylinders & Valves/),
    it('Seal kit — rod, piston, wipers, O-rings', 'NBR/polyurethane/Viton', 'Full rebuild kit', 1, 'set', 10, 'Sealing', /O-Rings/),
    it('Tie rods & nuts (or welded joints)', 'High-tensile steel', 'Torqued pattern', 4, 'ea', 8, 'Hardware & fasteners', /Threaded Rod/),
    it('Cushion needles & check screws', 'Steel', 'Adjustable cushions', 2, 'ea', 4, 'Motion', /Cylinders & Valves/),
    it('Mounting accessories', 'Clevis/flange/trunnion', 'Per mount code', 1, 'set', 6, 'Hardware & fasteners', /Cylinders & Valves/),
  ]};
}

/* Caster */
function tmplCaster(f, picks) {
  const dia = axNum(f, picks, /wheel|dia|size/i, 5);
  return { unitDesc: `${dia}" caster`, items: [
    it('Wheel', 'Polyurethane on iron / phenolic / rubber', `${dia}" diameter`, 1, 'ea', 34, 'Wheel', /Casters & Wheels/),
    it('Wheel bearing', 'Roller/ball/Delrin', 'Sealed option', 1, 'ea', 10, 'Wheel', /Bearings & Bushings/),
    it('Fork / rig', 'Pressed steel, zinc-plated', 'Double-ball raceway (swivel)', 1, 'ea', 26, 'Rig', /Casters & Wheels/),
    it('Swivel raceway balls & kingpin', 'Hardened balls, riveted or kingpinless', 'Load-rated', 1, 'set', 12, 'Rig', /Casters & Wheels/),
    it('Top plate / stem', 'Steel plate or threaded stem', 'Bolt pattern per spec', 1, 'ea', 10, 'Mounting', /Casters & Wheels/),
    it('Brake / lock assembly (where specified)', 'Total-lock or wheel brake', 'Foot-actuated', 1, 'ea', 6, 'Mounting', /Casters & Wheels/),
    it('Axle bolt, nut & seals', 'Grade 5, nyloc', 'Serviceable', 1, 'set', 2, 'Hardware & fasteners', /Hex Cap Screws/),
  ]};
}

/* Wind drive components */
function tmplWindDrive(f) {
  if (/slip ring/i.test(f.n)) {
    return { unitDesc: 'Slip-ring / converter assembly', items: [
      it('Slip-ring stack — rings & insulation', 'Cu/Au-plated rings, epoxy', 'Power + signal channels', 1, 'ea', 30, 'Current path', /Slip Rings/),
      it('Brush blocks & holders', 'Metal-graphite brushes', 'Wear-monitored', 4, 'ea', 16, 'Current path', /Slip Rings/),
      it('Housing & rotary interface', 'Al housing, sealed', 'IP54+, flange-mounted', 1, 'ea', 18, 'Structure & enclosure', /Enclosures & Cabinets/),
      it('Bearings & encoder', 'Sealed bearings, encoder ring', 'Maintenance interval rated', 1, 'set', 12, 'Rotation', /Bearings & Bushings/),
      it('Wiring, connectors & terminal boards', 'Harness + MIL/industrial connectors', 'Tested continuity', 1, 'lot', 14, 'Connections', /Wiring Harnesses/),
      it('Seals, hardware & tags', 'V-rings, SS hardware', 'Traceability', 1, 'set', 10, 'Hardware & fasteners', /O-Rings/),
    ]};
  }
  return { unitDesc: 'Pitch/yaw drive assembly', items: [
    it('Planetary gearbox — multi-stage', 'Case-hardened gears, ductile housing', 'High ratio, output pinion', 1, 'ea', 34, 'Drivetrain', /Shaft Couplings, Gearboxes/),
    it('Drive motor — asynchronous/PM servo', 'IP54, brake-equipped', 'Encoder feedback', 1, 'ea', 24, 'Drivetrain', /DC & Gearmotors/),
    it('Output pinion', 'Carburized alloy, ground teeth', 'Matched to slew ring', 1, 'ea', 10, 'Drivetrain', /Shaft Couplings, Gearboxes/),
    it('Electromagnetic brake', 'Spring-applied, power-release', 'Fail-safe holding', 1, 'ea', 8, 'Safety', /Shaft Couplings, Gearboxes/),
    it('Encoder & sensors', 'Absolute encoder, temp sensors', 'Condition monitoring', 1, 'set', 6, 'Controls & instrumentation', /Sensors & Transducers/),
    it('Seals, bearings & lubrication system', 'Lip seals, grease points', 'Auto-lube compatible', 1, 'set', 8, 'Hardware & fasteners', /Bearings & Bushings/),
    it('Mounting bolts & dowels', '12.9 class, hydraulically tensioned', 'Per flange pattern', 16, 'ea', 4, 'Hardware & fasteners', /Hex Cap Screws/),
    it('Corrosion protection & tags', 'C4/C5 paint system', 'Offshore option', 1, 'lot', 6, 'Finishing', /Paints & Protective Coatings/),
  ]};
}

/* Fire suppression system */
function tmplFireSupp(f) {
  if (/gas detection|deflagration/i.test(f.n)) {
    const e = tmplElectronics(f);
    e.items.unshift(it('Gas sensing heads (H2/CO/smoke)', 'Catalytic/electrochemical/optical cells', 'Zone coverage set', 4, 'ea', 18, 'Sensing', /Sensors & Transducers/));
    e.items.push(it('Deflagration vent panels (where kitted)', 'Scored SS membrane', 'NFPA 68 sized', 2, 'ea', 8, 'Safety', /Fire Detection & Suppression Components/));
    return e;
  }
  return { unitDesc: 'Suppression system kit', items: [
    it('Agent — aerosol generators / clean-agent cylinders', 'Condensed aerosol or FK-5-1-12', 'Volume-matched charge', 4, 'ea', 34, 'Suppression', /Fire Detection & Suppression Components/),
    it('Discharge nozzles & piping/brackets', 'SS nozzles, sched-40 pipe', 'Flow-calculated', 1, 'lot', 12, 'Distribution', /Fire Detection & Suppression Components/),
    it('Releasing control panel', 'Listed releasing FACP', 'Battery-backed', 1, 'ea', 18, 'Controls & instrumentation', /Fire Detection & Suppression Components/),
    it('Detection — smoke/heat detectors', 'Photoelectric + fixed-temp', 'Cross-zoned', 6, 'ea', 10, 'Detection', /Fire Detection & Suppression Components/),
    it('Notification — horn/strobes, discharge signs', 'Listed devices', 'Per code', 4, 'ea', 5, 'Detection', /Fire Detection & Suppression Components/),
    it('Manual release & abort stations', 'Dual-action pull', 'At egress', 2, 'ea', 4, 'Controls & instrumentation', /Fire Detection & Suppression Components/),
    it('Wiring, EOL devices & monitor modules', 'FPLR cable, modules', 'Supervised circuits', 1, 'lot', 9, 'Distribution', /Wire, Cable & Cord/),
    it('Mounting hardware & seismic bracing', 'Strut, anchors', 'Per detail', 1, 'lot', 4, 'Hardware & fasteners', /Anchors/),
    it('Signage, tags & documentation', 'As-builts, calc package', 'AHJ submittal set', 1, 'set', 4, 'Finishing', /Labels, Nameplates/),
  ]};
}

/* Container enclosure */
function tmplContainer(f, picks) {
  const ftPick = axNum(f, picks, /ft|length|size/i, 20);
  return { unitDesc: `${ftPick} ft containerized enclosure`, items: [
    it('Container shell — corten frame & panels', 'Corten A / galvanneal', 'ISO-corner or skid base', 1, 'ea', 30, 'Structure', /Structural Shapes/),
    it('Doors, hatches & hardware', 'Personnel + equipment doors', 'Panic hardware, 3-pt locks', 3, 'ea', 8, 'Structure', /Enclosures & Cabinets/),
    it('Insulation & interior liner', 'Mineral wool / PIR + steel liner', 'Fire-rated option', 1, 'lot', 8, 'Structure', /Foam, Felt/),
    it('HVAC units — wall-pack / split', 'Redundant N+1', 'Sized to heat load', 2, 'ea', 14, 'Environmental', /HVAC \/ Chiller/),
    it('Electrical — panelboard, lighting, receptacles', 'AC panel, LED fixtures', 'Code-compliant', 1, 'lot', 10, 'Electrical', /Switchboard/),
    it('Cable tray, ladder & penetrations', 'HDG tray, sealed glands', 'Segregated power/signal', 1, 'lot', 6, 'Electrical', /Conduit, Boxes/),
    it('Fire & gas detection interface', 'Detectors + panel interface', 'To site FACP', 1, 'set', 6, 'Safety', /Gas Detection/),
    it('Floor — structural + finish', 'Steel joists, plate/grating', 'Load-rated', 1, 'lot', 8, 'Structure', /Bar, Sheet & Plate/),
    it('Paint system & insulated roof', 'C4 epoxy/urethane', 'Solar-reflective roof', 1, 'lot', 5, 'Finishing', /Paints & Protective Coatings/),
    it('Grounding ring & lugs', 'Cu bus & pads', 'Bonded structure', 1, 'set', 3, 'Electrical', /Ground Bars/),
    it('Hardware, gaskets & signage', 'EPDM, SS hardware', 'Arc-flash & exit signage', 1, 'lot', 2, 'Hardware & fasteners', /Labels, Nameplates/),
  ]};
}

/* Busway / PDU-type distribution */
function tmplDistribution(f, picks) {
  if (/busway/i.test(f.n)) {
    const amps = axNum(f, picks, /amp/i, 800);
    return { unitDesc: `10-ft busway section, ${amps} A`, units: 10, items: [
      it('Bus conductors', 'Cu or Al, epoxy/mylar insulated', `${amps} A per phase + N + G`, 5, 'ea', 40, 'Current path', /Copper Busbar/),
      it('Housing extrusion / case', 'Al extrusion or steel case', '10-ft section', 1, 'ea', 22, 'Structure & enclosure', /Module Frames & Aluminum/),
      it('Joint stack / connection kit', 'Plated contact stack, bolted', 'One per section', 1, 'ea', 14, 'Current path', /Busway/),
      it('Plug-in openings & covers (plug-in type)', 'Spring-loaded stabs, doors', 'Per section spec', 4, 'ea', 8, 'Current path', /Busway/),
      it('Hangers & mounting hardware', 'Strut, rods, brackets', 'Seismic-rated', 2, 'set', 6, 'Hardware & fasteners', /Anchors/),
      it('End closures, labels & torque indicators', 'Misc.', 'Belleville-marked', 1, 'set', 4, 'Finishing', /Labels, Nameplates/),
      it('Fire-stop & barrier kits (where required)', 'Intumescent kit', 'Rated penetrations', 1, 'set', 6, 'Safety', /Sealants & Caulks/),
    ]};
  }
  if (/rack pdu/i.test(f.n)) {
    return { unitDesc: 'Rack PDU', items: [
      it('Chassis / extrusion', 'Al extrusion, 0U/2U', 'Tool-less mounting', 1, 'ea', 14, 'Structure & enclosure', /Module Frames & Aluminum/),
      it('Outlet modules', 'C13/C19 combo banks, locking', 'Per outlet count', 42, 'ea', 24, 'Current path', /Devices, Switches/),
      it('Input cord & plug', 'SOOW cord, IEC 60309 plug', '3-phase, per rating', 1, 'ea', 10, 'Current path', /Wire, Cable & Cord/),
      it('Branch breakers / fusing', 'Hydraulic-magnetic 2-pole', 'Per bank', 6, 'ea', 12, 'Protection', /Molded-Case/),
      it('Metering & network controller', 'Per-outlet metering PCB, NMC', 'Hot-swap controller', 1, 'set', 26, 'Controls & instrumentation', /Controller Boards, HMIs/),
      it('Sensors — temp/humidity ports', 'Plug-in sensor set', 'Environmental monitoring', 1, 'set', 4, 'Controls & instrumentation', /Sensors & Transducers/),
      it('Busbar / internal wiring', 'Cu bus, UL1015 wiring', 'Torque-verified', 1, 'lot', 8, 'Current path', /Copper Busbar/),
      it('Display & bezel', 'OLED/LED local display', 'Rotatable', 1, 'ea', 2, 'Interface', /Controller Boards, HMIs/),
    ]};
  }
  if (/static transfer/i.test(f.n)) return tmplPowerElectronics(f, picks);
  const kva = axNum(f, picks, /kva/i, 300);
  return { unitDesc: `${kva} kVA floor PDU`, items: [
    it('Isolation transformer', 'K-rated, Cu-wound', `${kva} kVA`, 1, 'ea', 34, 'Power path', /Isolation \/ K-Rated/),
    it('Main input breaker', 'MCCB, 80% rated', 'Sized to kVA', 1, 'ea', 6, 'Protection', /Molded-Case/),
    it('Panelboards — subfeed & branch', '42-84 pole, bolt-on', 'Dual panel option', 2, 'ea', 16, 'Power path', /Switchboard/),
    it('Branch breakers (initial fit-out)', 'Bolt-on 1-3 pole', 'Per schedule', 42, 'ea', 10, 'Protection', /Molded-Case/),
    it('Power monitoring unit', 'Branch-circuit monitoring CTs + meter', 'Per-branch kW/kWh', 1, 'set', 12, 'Controls & instrumentation', /Power Meters/),
    it('Surge protective device', 'Type 2 SPD', 'Monitored', 1, 'ea', 3, 'Protection', /Surge Protective/),
    it('Enclosure, casters & seismic anchors', 'NEMA 1 steel, leveling feet', 'Computer-room finish', 1, 'ea', 12, 'Structure & enclosure', /Enclosures & Cabinets/),
    it('Output cabling & lugs (whips optional)', 'Cu feeders, listed lugs', 'Torque-marked', 1, 'lot', 5, 'Power path', /LV Power Cable/),
    it('Nameplates, mimic & arc-flash labels', 'Engraved + printed', 'Per NFPA 70E', 1, 'set', 2, 'Finishing', /Labels, Nameplates/),
  ]};
}

/* Grounding & SPD */
function tmplGrounding(f, picks) {
  if (/surge/i.test(f.n)) {
    return { unitDesc: 'SPD assembly', items: [
      it('MOV / SAD suppression modules', 'Thermally-protected MOV blocks', 'Per-mode protection', 7, 'ea', 40, 'Suppression', /EMI Filters/),
      it('Status monitoring PCB & counter', 'PCB, dry contacts', 'Surge counter, alarm relay', 1, 'ea', 16, 'Controls & instrumentation', /Controller Boards, HMIs/),
      it('Disconnect / overcurrent integration', 'Internal fusing', 'Fail-safe disconnect', 1, 'set', 12, 'Protection', /Fuses & Circuit Protection/),
      it('Enclosure — NEMA 4X option', 'Steel/polycarbonate', 'Flush leads', 1, 'ea', 16, 'Structure & enclosure', /Enclosures & Cabinets/),
      it('Terminals, leads & indicators', 'Cu leads, LEDs', 'Short-lead design', 1, 'set', 12, 'Connections', /Panel Heaters, Terminal Blocks/),
      it('Label set & install hardware', 'UL 1449 markings', 'Mounting kit', 1, 'set', 4, 'Hardware & fasteners', /Labels, Nameplates/),
    ]};
  }
  return { unitDesc: 'Grounding kit', items: [
    it('Ground bar — Cu, drilled', 'Hard-drawn Cu bar', 'Per hole pattern', 1, 'ea', 30, 'Current path', /Ground Bars/),
    it('Insulators & standoff brackets', 'Fiberglass standoffs', 'Wall/rack mount', 2, 'ea', 12, 'Mounting', /Bus Insulators/),
    it('Compression lugs & two-hole pads', 'Long-barrel Cu', 'Irreversible crimp', 12, 'ea', 22, 'Connections', /Ground Bars/),
    it('Grounding conductors', 'Bare/green-insulated Cu', 'Per kit length', 50, 'ft', 20, 'Current path', /Wire, Coil & Fine/),
    it('Exothermic weld kit / mechanical clamps', 'Molds + shots or bronze clamps', 'Per connection type', 1, 'set', 10, 'Connections', /Ground Bars/),
    it('Hardware & antioxidant', 'SS bolts, joint compound', 'Torque spec card', 1, 'set', 6, 'Hardware & fasteners', /Hex Cap Screws/),
  ]};
}

/* Met station / plant controller / SCADA */
function tmplSCADA(f) {
  const e = tmplElectronics(f);
  if (/met station/i.test(f.n)) e.items.unshift(
    it('Sensors — pyranometers, anemometer, temp/RH', 'Class A instruments', 'Calibrated set', 5, 'ea', 24, 'Sensing', /Sensors & Transducers/),
    it('Mast, mounts & solar power kit', 'Al mast, PV + battery', 'Free-standing', 1, 'set', 10, 'Structure & enclosure', /Met Stations/));
  return e;
}

/* ============================================================
   Template registry (most-specific key wins)
   ============================================================ */
const BOM_T = {
  'dc|Transformers': tmplTransformer,
  're|GSU & MV Transformers': tmplTransformer,
  'dc|Switchgear & Breakers': (f, p) => /mccb|molded|air circuit/i.test(f.n) ? tmplBreaker(f, p) : tmplSwitchgear(f, p),
  'dc|Backup Power': (f, p) => /ups|flywheel/i.test(f.n) ? tmplUPS(f, p) : tmplGenset(f, p),
  'dc|Cooling': tmplCooling,
  'dc|Power Distribution': tmplDistribution,
  'dc|Cabling & Busbar': (f, p) => /busbar/i.test(f.n)
    ? { unitDesc: '100-ft busbar bundle (10 × 10-ft bars)', units: 100, items: [
        it('Cu bar stock — ETP C11000', 'Electrolytic tough-pitch Cu', 'Per configured size', 10, 'ea', 78, 'Conductor', /Copper Busbar/),
        it('Plating (tin/silver)', 'Electroplate', 'Full-length', 1, 'lot', 10, 'Finishing', /Copper Busbar/),
        it('Edge rounding, punching & packaging', 'Machined', 'Deburred, wrapped', 1, 'lot', 12, 'Finishing', /Reels, Crates/)]}
    : tmplCable(f, p),
  'dc|Grounding & Bonding': tmplGrounding,
  'dc|Monitoring & Controls': tmplElectronics,
  're|Solar Modules': tmplPVModule,
  're|Inverters & PCS': tmplPowerElectronics,
  're|Structural BOS': tmplTracker,
  're|Wire & Cable': (f, p) => /connector|jumper/i.test(f.n)
    ? { unitDesc: 'Connector set', items: [
        it('Contact pins/sockets', 'Tin-plated Cu', 'Crimp style', 2, 'ea', 30, 'Current path', /MC4/),
        it('Housing bodies', 'PPO/PA UV-stable', 'Male + female', 2, 'ea', 30, 'Structure & enclosure', /MC4/),
        it('Seals & cable glands', 'EPDM/silicone', 'IP68', 2, 'set', 20, 'Sealing', /O-Rings/),
        it('Locking clips & tags', 'PA clip', 'Tool-release', 2, 'ea', 20, 'Hardware & fasteners', /MC4/)]}
    : tmplCable(f, p),
  're|Combiners & Protection': (f, p) => /rapid shutdown/i.test(f.n) ? tmplElectronics(f) : tmplCombiner(f, p),
  're|Wind Components': tmplWindDrive,
  're|Monitoring & SCADA': tmplSCADA,
  'bess|Storage Blocks': tmplBESS,
  'bess|Power Conversion': tmplPowerElectronics,
  'bess|Controls (BMS/EMS)': tmplElectronics,
  'bess|Fire Suppression & Safety': tmplFireSupp,
  'bess|Thermal Management': tmplCooling,
  'bess|Enclosures & Integration': (f, p) => /switchboard|panel/i.test(f.n) ? tmplSwitchgear(f, p) : tmplContainer(f, p),
  'og|Tubulars': tmplTubular,
  'og|Valves': tmplValve,
  'og|Pressure Control': tmplPressureControl,
  'og|Downhole & Artificial Lift': tmplDownhole,
  'og|Instrumentation & Controls': tmplInstrument,
  'og|Pumps & Rotating': tmplPump,
  'mro|Electrical': (f, p) => /wire, cable/i.test(f.n) ? tmplCable(f, p) : /fuses|batteries/i.test(f.n) ? null : tmplElectronics(f),
  'mro|HVAC & Refrigeration': (f, p) => /motors|blowers|fans/i.test(f.n) ? tmplMotor(f, p) : /coils|refrigerants/i.test(f.n) ? null : tmplElectronics(f),
  'mro|Power Tools': tmplPowerTool,
  'mro|Material Handling': (f, p) => /caster/i.test(f.n) ? tmplCaster(f, p) : /hoist|sling|rigging/i.test(f.n) ? tmplHoist(f, p) : null,
  'mro|Motors': (f, p) => /controls|drives/i.test(f.n) ? tmplPowerElectronics(f, p) : /repair/i.test(f.n) ? null : tmplMotor(f, p),
  'mro|Plumbing': (f, p) => /fixtures|pumps/i.test(f.n) ? tmplPump(f, p) : null,
  'mro|Pneumatics & Hydraulics': (f, p) => /cylinder|valve/i.test(f.n) ? tmplCylinder(f, p) : null,
  'mro|Pumps': (f, p) => /repair/i.test(f.n) ? null : tmplPump(f, p),
  'mro|Lighting': (f, p) => /modules|drivers/i.test(f.n) ? null : tmplLED(f, p),
  'mro|Test Instruments': tmplElectronics,
  'mro|Welding': (f) => /torch|gun/i.test(f.n) ? {
    unitDesc: 'Torch/gun assembly', items: [
      it('Handle / body & trigger', 'Glass-filled nylon, switch', 'Ergonomic', 1, 'ea', 18, 'Structure & enclosure', /Torches, Guns/),
      it('Neck / gooseneck & conductor tube', 'Cu tube, insulated', 'Rated to amperage', 1, 'ea', 16, 'Current path', /Torches, Guns/),
      it('Consumable front-end — tips, nozzle, diffuser', 'Cu/CuCrZr, brass', 'Starter set', 1, 'set', 14, 'Current path', /Torches, Guns/),
      it('Cable assembly — power + gas', 'Cu cable, gas hose, liner', 'Per length', 1, 'ea', 30, 'Current path', /Torches, Guns/),
      it('Connectors & strain relief', 'Euro/direct plug', 'Machine-side', 1, 'set', 12, 'Connections', /Torches, Guns/),
      it('Insulators, O-rings & hardware', 'High-temp polymer', 'Service kit', 1, 'set', 10, 'Hardware & fasteners', /O-Rings/)]} : null,
};

/* ---------- cost roll-up lines (share of assembly price) ---------- */
const BOM_OVERHEAD = [
  { n: 'Fabrication & assembly labor', pct: 0.13 },
  { n: 'Factory test, QA & certification', pct: 0.05 },
  { n: 'Packaging, logistics & freight-in', pct: 0.04 },
  { n: 'Engineering, warranty & margin', pct: 0.08 },
];
const BOM_MATERIAL_SHARE = 1 - BOM_OVERHEAD.reduce((a, x) => a + x.pct, 0);

/* ---------- public API ---------- */
function bomApplicability(f) {
  const kFam = `${f.s}|${f.c}|${f.n}`, kCat = `${f.s}|${f.c}`;
  if (BOM_NA[kFam]) return { ok: false, reason: BOM_NA[kFam] };
  if (kCat in BOM_NA && BOM_NA[kCat]) return { ok: false, reason: BOM_NA[kCat] };
  const t = BOM_T[kFam] || BOM_T[kCat];
  if (!t) return { ok: false, reason: 'No component template is published for this item type yet.' };
  if (typeof t === 'function') {
    /* dispatchers may return null for spares families */
    try { if (t(f, f.ax.map(a => a[1])) === null) return { ok: false, reason: 'These are component-level spares — order directly, or open the parent assembly BOM.' }; } catch (e) { /* fall through */ }
  }
  return { ok: true };
}

function generateBOM(f, picks) {
  const app = bomApplicability(f);
  if (!app.ok) return { applicable: false, reason: app.reason };
  const t = BOM_T[`${f.s}|${f.c}|${f.n}`] || BOM_T[`${f.s}|${f.c}`];
  const res = t(f, picks);
  if (!res) return { applicable: false, reason: 'These are component-level spares — order directly, or open the parent assembly BOM.' };

  const units = (f.pu && f.pu !== '/ea') ? (res.units || 1) : 1;
  const price = priceFor(f, picks) * units;
  const items = res.items.filter(x => x && x.qty > 0);
  const wSum = items.reduce((a, x) => a + x.w, 0) || 1;
  const matPool = price * BOM_MATERIAL_SHARE;

  const groups = [];
  const byG = {};
  let no = 0;
  items.forEach(x => {
    no += 10;
    const ext = matPool * x.w / wSum;
    const unitCost = ext / x.qty;
    const line = {
      no, name: x.n, mat: x.mat, spec: x.spec, qty: x.qty, unit: x.unit,
      unitCost, ext, pct: ext / price,
      link: bomShopLink(x),
    };
    if (!byG[x.g]) { byG[x.g] = { g: x.g, items: [], ext: 0 }; groups.push(byG[x.g]); }
    byG[x.g].items.push(line); byG[x.g].ext += ext;
  });

  const overhead = BOM_OVERHEAD.map(o => ({ n: o.n, ext: price * o.pct, pct: o.pct }));
  return {
    applicable: true,
    unitDesc: res.unitDesc,
    price,
    groups,
    materialTotal: matPool,
    overhead,
    total: matPool + overhead.reduce((a, x) => a + x.ext, 0),
    lineCount: items.length,
    pieceCount: items.reduce((a, x) => a + (x.unit === 'ea' ? x.qty : 1), 0),
  };
}
