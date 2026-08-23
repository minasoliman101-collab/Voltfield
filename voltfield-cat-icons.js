/* VOLTFIELD — category icon rendering for every catalog part.
   Originally added because 94 of 236 part photos turned out to be
   byte-identical duplicates reused across unrelated families (traced via
   MD5 hashing of images/parts/*.jpg). Rather than keep juggling which
   photos were genuinely unique, every family now renders a hand-drawn
   icon keyed off its family (VF_FILE_ICON_MAP) or, failing that, its
   category (VF_CAT_ICON_MAP) — simple, consistent, and immune to any
   future photo mix-ups. VF_ICON_REPLACE is kept only as a historical
   record of which files were the duplicates. */

/* filenames (basename only) that were byte-identical duplicates of another
   family's photo — no longer consulted at render time, kept for reference */
const VF_ICON_REPLACE = new Set([
"bess-battery-modules-rack-hardware.jpg","bess-battery-thermal-components.jpg","bess-dc-contactors-fuses-pre-charge.jpg",
"bess-fire-detection-suppression-components.jpg","bess-grid-forming-pcs.jpg","bess-nmc-dc-blocks.jpg",
"dc-alternators-generator-ends.jpg","dc-breaker-repair-kits-contacts-arc-chutes-mechanisms.jpg","dc-breaker-trip-units-accessories.jpg",
"dc-bus-insulators-standoffs.jpg","dc-coolant-distribution-units-cdu.jpg","dc-de-energized-tap-changers.jpg",
"dc-dry-coolers-chillers.jpg","dc-electrical-enclosures-cabinets.jpg","dc-electrical-steel-core-laminations.jpg",
"dc-engine-cooling-exhaust.jpg","dc-fuel-starting-systems.jpg","dc-genset-controls-avrs-governors.jpg",
"dc-industrial-engines-diesel-gas.jpg","dc-instrument-transformers-ct-vt.jpg","dc-insulating-oils-dielectric-fluids.jpg",
"dc-large-power-transformers.jpg","dc-lv-switchgear.jpg","dc-magnet-wire-winding-conductor.jpg",
"dc-panel-heaters-terminal-blocks-control-wiring.jpg","dc-protective-relays.jpg","dc-tanks-skids-fabricated-steel.jpg",
"dc-transformer-bushings.jpg","dc-transformer-gauges-protective-devices.jpg","dc-transformer-insulation-pressboard.jpg",
"dc-transformer-radiators-cooling-fans.jpg",
"mro-bearings-bushings.jpg","mro-building-wire-cable.jpg","mro-coils-heat-exchangers.jpg",
"mro-conduit-raceway-fittings.jpg","mro-devices-switches-controls.jpg","mro-fuses-circuit-protection.jpg",
"mro-industrial-batteries-chargers.jpg","mro-industrial-fasteners-anchors.jpg","mro-janitorial-facility-supplies.jpg",
"mro-labels-nameplates-signage.jpg","mro-led-fixtures-lamps.jpg","mro-led-modules-drivers-optics.jpg",
"mro-mechanical-seals-packing.jpg","mro-metalworking-abrasives.jpg","mro-metalworking-cutting-tools.jpg",
"mro-motor-controls-drives.jpg","mro-motor-repair-parts.jpg","mro-oils-greases-fluids.jpg",
"mro-paints-protective-coatings.jpg","mro-pliers-screwdrivers-striking.jpg","mro-precision-measuring-inspection.jpg",
"mro-pump-repair-parts-impellers.jpg","mro-reels-crates-protective-packaging.jpg","mro-refrigerants-heat-transfer-fluids.jpg",
"mro-shaft-couplings-gearboxes-drive-parts.jpg","mro-socket-screws.jpg","mro-tape-labels-strapping.jpg",
"mro-toolholding-workholding.jpg","mro-wire-cable-cord.jpg",
"og-centrifugal-pumps.jpg","og-downhole-cable-wellsite-electrical.jpg","og-forged-bodies-bonnets-spools.jpg",
"og-gate-globe-check-valves.jpg","og-octg-casing.jpg","og-octg-tubing.jpg",
"og-stud-bolts-nuts-b7-2h.jpg","og-thread-protectors-dope-pipe-care.jpg","og-threaded-forged-fittings.jpg",
"og-valve-operators-actuators.jpg","og-valve-trim-seats-repair-kits.jpg","og-wellhead-hangers-packoffs-seals.jpg",
"og-wellheads-christmas-trees.jpg","og-wellsite-controllers-rtus.jpg",
"re-collector-substation-transformers.jpg","re-controller-boards-hmis-industrial-power-supplies.jpg","re-dc-link-film-capacitors.jpg",
"re-emi-filters-surge-components.jpg","re-filter-inductors-magnetics.jpg","re-gate-driver-boards.jpg",
"re-gsu-transformers.jpg","re-heat-sinks-cold-plates-fan-trays.jpg","re-igbt-sic-power-modules.jpg",
"re-module-frames-aluminum-extrusions.jpg","re-pad-mount-collection.jpg","re-plant-controllers.jpg",
"re-pv-dc-fuses-holders-disconnects.jpg","re-pv-junction-boxes-diodes-potting.jpg","re-recombiners.jpg",
"re-sensors-transducers.jpg","re-solar-cells-interconnect-ribbon.jpg","re-solar-glass-encapsulants-backsheets.jpg",
"re-tracker-drives-row-controllers.jpg","re-wiring-harnesses-cable-assemblies.jpg"
]);

/* filename -> icon id, one per actual part (not just per category) so two
   different components never render the same picture. Checked first; the
   category map below is only a fallback for anything not listed here. */
const VF_FILE_ICON_MAP = {
  'bess-battery-modules-rack-hardware.jpg':'battery-module',
  'bess-battery-thermal-components.jpg':'thermal-component',
  'bess-dc-contactors-fuses-pre-charge.jpg':'contactor-fuse',
  'bess-grid-forming-pcs.jpg':'power-conversion',
  'bess-nmc-dc-blocks.jpg':'storage-block',
  'dc-alternators-generator-ends.jpg':'alternator',
  'dc-engine-cooling-exhaust.jpg':'engine-cooling',
  'dc-fuel-starting-systems.jpg':'fuel-system',
  'dc-genset-controls-avrs-governors.jpg':'genset-controls',
  'dc-industrial-engines-diesel-gas.jpg':'genset',
  'dc-breaker-repair-kits-contacts-arc-chutes-mechanisms.jpg':'breaker-parts',
  'dc-breaker-trip-units-accessories.jpg':'trip-unit',
  'dc-bus-insulators-standoffs.jpg':'insulator',
  'dc-electrical-enclosures-cabinets.jpg':'enclosure',
  'dc-instrument-transformers-ct-vt.jpg':'instrument-transformer',
  'dc-panel-heaters-terminal-blocks-control-wiring.jpg':'terminal-block',
  'dc-lv-switchgear.jpg':'switchgear',
  'dc-protective-relays.jpg':'protective-relay',
  'dc-dry-coolers-chillers.jpg':'dry-cooler',
  'dc-coolant-distribution-units-cdu.jpg':'coolant-distribution',
  'dc-large-power-transformers.jpg':'transformer',
  'dc-de-energized-tap-changers.jpg':'tap-changer',
  'dc-electrical-steel-core-laminations.jpg':'core-laminations',
  'dc-insulating-oils-dielectric-fluids.jpg':'dielectric-fluid',
  'dc-magnet-wire-winding-conductor.jpg':'magnet-wire',
  'dc-tanks-skids-fabricated-steel.jpg':'tank-skid',
  'dc-transformer-bushings.jpg':'bushing',
  'dc-transformer-gauges-protective-devices.jpg':'gauge',
  'dc-transformer-insulation-pressboard.jpg':'pressboard',
  'dc-transformer-radiators-cooling-fans.jpg':'radiator-fan',
  'mro-bearings-bushings.jpg':'bearing',
  'mro-mechanical-seals-packing.jpg':'mechanical-seal',
  'mro-shaft-couplings-gearboxes-drive-parts.jpg':'shaft-coupling',
  'mro-coils-heat-exchangers.jpg':'heat-exchanger',
  'mro-refrigerants-heat-transfer-fluids.jpg':'refrigerant-fluid',
  'mro-devices-switches-controls.jpg':'device-switch',
  'mro-fuses-circuit-protection.jpg':'fuse-protection',
  'mro-industrial-batteries-chargers.jpg':'battery-charger',
  'mro-wire-cable-cord.jpg':'wire-cord',
  'mro-socket-screws.jpg':'socket-screw',
  'mro-industrial-fasteners-anchors.jpg':'anchor-bolt',
  'mro-labels-nameplates-signage.jpg':'label-nameplate',
  'mro-reels-crates-protective-packaging.jpg':'packaging-crate',
  'mro-led-fixtures-lamps.jpg':'led-fixture',
  'mro-led-modules-drivers-optics.jpg':'led-driver',
  'mro-metalworking-cutting-tools.jpg':'cutting-insert',
  'mro-toolholding-workholding.jpg':'toolholding',
  'mro-motor-controls-drives.jpg':'motor-drive',
  'mro-motor-repair-parts.jpg':'motor-repair',
  'mro-paints-protective-coatings.jpg':'paint-coating',
  'mro-tape-labels-strapping.jpg':'tape-strapping',
  'mro-pump-repair-parts-impellers.jpg':'impeller',
  'og-centrifugal-pumps.jpg':'centrifugal-pump',
  'og-downhole-cable-wellsite-electrical.jpg':'downhole-cable',
  'og-forged-bodies-bonnets-spools.jpg':'forged-body',
  'og-thread-protectors-dope-pipe-care.jpg':'thread-protector',
  'og-valve-operators-actuators.jpg':'valve-actuator',
  'og-valve-trim-seats-repair-kits.jpg':'valve-trim',
  'og-wellhead-hangers-packoffs-seals.jpg':'wellhead-hanger',
  'og-stud-bolts-nuts-b7-2h.jpg':'stud-bolt',
  'og-wellsite-controllers-rtus.jpg':'wellsite-rtu',
  're-collector-substation-transformers.jpg':'transformer',
  're-gsu-transformers.jpg':'transformer',
  're-pad-mount-collection.jpg':'transformer',
  're-controller-boards-hmis-industrial-power-supplies.jpg':'controller-board',
  're-dc-link-film-capacitors.jpg':'capacitor',
  're-emi-filters-surge-components.jpg':'emi-filter',
  're-filter-inductors-magnetics.jpg':'inductor',
  're-gate-driver-boards.jpg':'gate-driver',
  're-heat-sinks-cold-plates-fan-trays.jpg':'heat-sink',
  're-igbt-sic-power-modules.jpg':'power-module',
  're-sensors-transducers.jpg':'sensor',
  're-wiring-harnesses-cable-assemblies.jpg':'wiring-harness',
  're-module-frames-aluminum-extrusions.jpg':'module-frame',
  're-pv-dc-fuses-holders-disconnects.jpg':'pv-fuse-holder',
  're-pv-junction-boxes-diodes-potting.jpg':'junction-box',
  're-solar-cells-interconnect-ribbon.jpg':'solar-cell',
  're-solar-glass-encapsulants-backsheets.jpg':'solar-glass',
  're-tracker-drives-row-controllers.jpg':'tracker-drive',
  're-plant-controllers.jpg':'plant-controller'
};

/* (sector|category) -> icon id. Every family now renders an icon (no more
   real photos in the catalog), so this covers all 81 categories, not just
   the ones that had duplicate photos. Used whenever a file isn't in the
   more-specific VF_FILE_ICON_MAP above. */
const VF_CAT_ICON_MAP = {
  'dc|Transformers':'transformer','dc|Transformer Components':'transformer','re|GSU & MV Transformers':'transformer',
  'dc|Switchgear & Breakers':'switchgear','dc|Switchgear Components':'switchgear',
  'mro|Electrical':'electrical','mro|Electrical Distribution Equipment':'enclosure',
  'dc|Genset Components':'genset',
  'dc|Cooling':'cooling','mro|HVAC & Refrigeration':'cooling',
  'dc|Monitoring & Controls':'controls','re|Monitoring & SCADA':'controls','og|Instrumentation & Controls':'controls','mro|Industrial Automation':'controls',
  'bess|Battery Components':'battery','bess|Storage Blocks':'battery',
  'bess|Power Conversion':'power-conversion','re|Inverter & PE Components':'power-conversion','re|Inverters & PCS':'power-conversion',
  'bess|Fire Suppression & Safety':'fire-safety',
  're|Module & BOS Components':'module-bos',
  're|Combiners & Protection':'combiner',
  'og|Valves':'valve','og|Valve & Wellhead Components':'valve',
  'og|Pressure Control':'wellhead',
  'og|Tubulars':'tubular',
  'og|Fittings & Flanges':'fitting',
  'og|Gaskets, Seals & Fasteners':'fastener','mro|Fasteners & Hardware':'fastener','mro|Industrial Fasteners':'fastener',
  'og|Pumps & Rotating':'pump','mro|Pumps':'pump',
  'mro|Cutting Tools':'cutting-tool','mro|Machining':'cutting-tool',
  'mro|Hand Tools':'hand-tool',
  'mro|Measuring & Inspection':'measuring','mro|Test Instruments':'measuring',
  'mro|Metalworking Abrasives':'abrasive','mro|Abrasives':'abrasive',
  'mro|Lubrication':'lubrication','mro|Metalworking Fluids':'lubrication',
  'mro|Power Transmission':'power-transmission',
  'mro|Motors':'motor',
  'mro|Lighting':'lighting','mro|Lighting & Controls':'lighting',
  'mro|Building Wire & Cable':'cable','dc|Cabling & Busbar':'cable','re|Wire & Cable':'cable',
  'mro|Conduit, Raceway & Fittings':'conduit',
  'mro|Adhesives, Sealants & Tape':'tape','mro|Tape, Labels & Strapping':'tape','mro|Identification & Packaging':'tape',
  'mro|Janitorial & Facility':'janitorial','mro|Cleaning & Janitorial':'janitorial',
  'bess|Controls (BMS/EMS)':'controls',
  'bess|Enclosures & Integration':'enclosure',
  'bess|Thermal Management':'thermal-component',
  'dc|Backup Power':'backup-power',
  'dc|Grounding & Bonding':'grounding',
  'dc|Power Distribution':'power-distribution',
  'mro|Bags & Poly':'packaging-crate','mro|Packaging Materials':'packaging-crate','mro|Retail & Warehouse':'packaging-crate','mro|Shipping Boxes':'packaging-crate',
  'mro|Datacomm & Networking':'network',
  'mro|Machine Accessories':'toolholding','mro|Toolholding & Workholding':'toolholding',
  'mro|Material Handling':'material-handling','mro|Warehouse & Material Handling':'material-handling',
  'mro|Plumbing':'plumbing',
  'mro|Pneumatics & Hydraulics':'pneumatics',
  'mro|Power Tools':'power-tool',
  'mro|Raw Materials':'raw-material',
  'mro|Safety & PPE':'ppe','mro|Safety Supplies':'ppe',
  'mro|Security & Life Safety':'security',
  'mro|Welding':'welding',
  'og|Downhole & Artificial Lift':'downhole-lift',
  're|Solar Modules':'pv-module',
  're|Structural BOS':'structural-bos',
  're|Wind Components':'wind-turbine'
};

/* Each entry returns inner SVG markup for a 0..100 viewBox, drawn with
   the given accent color. Simple line-art, consistent stroke weight. */
const VF_ICON_PATHS = {
  transformer:c=>`<rect x="22" y="38" width="56" height="38" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M32 38V24m12 14V24m12 14V24m12 14V24" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="20" r="4" fill="${c}"/><circle cx="56" cy="20" r="4" fill="${c}"/><path d="M78 50h10M78 62h10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  switchgear:c=>`<rect x="26" y="18" width="48" height="64" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M38 32v14M62 32v14" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="38" cy="52" r="4" fill="${c}"/><circle cx="62" cy="52" r="4" fill="${c}"/><path d="M34 66h32" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  electrical:c=>`<circle cx="50" cy="50" r="26" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 30v12l-10 8h20l-10 8v12" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  genset:c=>`<rect x="18" y="34" width="36" height="32" rx="4" fill="none" stroke="${c}" stroke-width="4"/><circle cx="70" cy="50" r="16" fill="none" stroke="${c}" stroke-width="4"/><path d="M70 38v24M58 50h24" stroke="${c}" stroke-width="3"/><path d="M26 34v-8h20v8" stroke="${c}" stroke-width="4" fill="none"/>`,
  cooling:c=>`<circle cx="50" cy="50" r="10" fill="${c}"/><path d="M50 50C46 34 34 30 30 20M50 50C60 38 76 38 84 32M50 50C50 66 62 74 66 84M50 50C38 58 24 56 16 66" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  controls:c=>`<rect x="20" y="24" width="60" height="42" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 56l10-14 10 8 10-18 10 20 4-6" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 66v10M60 66v10M34 82h32" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  battery:c=>`<rect x="20" y="30" width="60" height="40" rx="4" fill="none" stroke="${c}" stroke-width="4"/><rect x="42" y="22" width="16" height="10" rx="2" fill="${c}"/><path d="M36 40v20M50 36v28M64 40v20" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'power-conversion':c=>`<rect x="22" y="22" width="56" height="56" rx="6" fill="none" stroke="${c}" stroke-width="4"/><path d="M32 62l14-24 8 14 14-24" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  'fire-safety':c=>`<path d="M50 18c10 14-6 18-4 30 1 8 8 12 4 20-6 12-24 8-26-4-3-16 10-18 8-30-1-6 6-12 18-16z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  'module-bos':c=>`<rect x="18" y="26" width="64" height="40" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M18 39h64M18 52h64M39 26v40M60 26v40" stroke="${c}" stroke-width="2.5"/>`,
  combiner:c=>`<rect x="24" y="22" width="52" height="56" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M34 34h32M34 46h32" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><circle cx="40" cy="60" r="4" fill="${c}"/><circle cx="60" cy="60" r="4" fill="${c}"/>`,
  valve:c=>`<circle cx="50" cy="42" r="18" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 24v-8M50 60v10M32 42h-8M68 42h8M37 29l-6-6M63 29l6-6" stroke="${c}" stroke-width="4" stroke-linecap="round"/><rect x="42" y="70" width="16" height="12" rx="2" fill="${c}"/>`,
  wellhead:c=>`<rect x="38" y="60" width="24" height="24" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 60V38" stroke="${c}" stroke-width="5"/><rect x="30" y="30" width="40" height="12" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M20 36h10M70 36h10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  tubular:c=>`<rect x="14" y="42" width="72" height="16" rx="8" fill="none" stroke="${c}" stroke-width="4"/><ellipse cx="20" cy="50" rx="6" ry="8" fill="none" stroke="${c}" stroke-width="3.5"/><ellipse cx="80" cy="50" rx="6" ry="8" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  fitting:c=>`<path d="M20 40h24v-8a6 6 0 016-6h0a6 6 0 016 6v8h24" fill="none" stroke="${c}" stroke-width="4"/><path d="M20 60h24v8a6 6 0 006 6h0a6 6 0 006-6v-8h24" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="6" fill="${c}"/>`,
  fastener:c=>`<path d="M50 16l7 8h-14z" fill="${c}"/><rect x="43" y="24" width="14" height="10" fill="none" stroke="${c}" stroke-width="3.5"/><rect x="46" y="34" width="8" height="44" fill="none" stroke="${c}" stroke-width="4"/><path d="M46 42h8M46 50h8M46 58h8M46 66h8" stroke="${c}" stroke-width="2.5"/>`,
  pump:c=>`<circle cx="42" cy="50" r="22" fill="none" stroke="${c}" stroke-width="4"/><path d="M42 50L30 40M42 50l14-4M42 50l-4 16" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><rect x="64" y="42" width="20" height="16" rx="2" fill="none" stroke="${c}" stroke-width="4"/>`,
  'cutting-tool':c=>`<path d="M28 72L64 36" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M64 36l14-4-4 14z" fill="${c}"/><circle cx="26" cy="74" r="6" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  'hand-tool':c=>`<path d="M30 30a12 12 0 0016 16L70 22l6 6-36 24a12 12 0 00-16 16L18 74l-6-6z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  measuring:c=>`<rect x="16" y="42" width="68" height="16" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 42v8M40 42v8M52 42v10M64 42v8M76 42v8" stroke="${c}" stroke-width="3"/>`,
  abrasive:c=>`<circle cx="50" cy="50" r="28" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="10" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 22v8M50 70v8M22 50h8M70 50h8" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  lubrication:c=>`<path d="M50 18c8 14 16 24 16 36a16 16 0 01-32 0c0-12 8-22 16-36z" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="80" r="3" fill="${c}"/>`,
  'power-transmission':c=>`<circle cx="34" cy="50" r="16" fill="none" stroke="${c}" stroke-width="4"/><circle cx="70" cy="50" r="10" fill="none" stroke="${c}" stroke-width="4"/><path d="M34 34a16 16 0 010 32M50 44l14-4M50 56l14 4" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  motor:c=>`<rect x="20" y="32" width="42" height="36" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M62 42h8v16h-8M74 46v8" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M28 32v-6M40 32v-6M52 32v-6M28 68v6M40 68v6M52 68v6" stroke="${c}" stroke-width="3"/>`,
  lighting:c=>`<circle cx="50" cy="42" r="20" fill="none" stroke="${c}" stroke-width="4"/><path d="M40 62h20M43 70h14M46 78h8" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M50 30v8M38 42h-6M68 42h-6" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  cable:c=>`<path d="M20 30c0 20 60 20 60 40" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M20 40c0 16 48 18 48 34" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><circle cx="20" cy="30" r="5" fill="${c}"/><circle cx="80" cy="70" r="5" fill="${c}"/>`,
  conduit:c=>`<rect x="14" y="44" width="50" height="12" rx="6" fill="none" stroke="${c}" stroke-width="4"/><rect x="58" y="30" width="12" height="50" rx="6" fill="none" stroke="${c}" stroke-width="4"/>`,
  tape:c=>`<circle cx="46" cy="50" r="26" fill="none" stroke="${c}" stroke-width="4"/><circle cx="46" cy="50" r="10" fill="none" stroke="${c}" stroke-width="4"/><path d="M72 50c8 2 12 8 10 16" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  janitorial:c=>`<path d="M42 20l16 16-38 38-10-10z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M50 28l14-14" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  generic:c=>`<rect x="22" y="22" width="56" height="56" rx="8" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="14" fill="none" stroke="${c}" stroke-width="4"/>`,

  /* --- battery / BESS breakdown --- */
  'battery-module':c=>`<rect x="16" y="34" width="20" height="32" rx="3" fill="none" stroke="${c}" stroke-width="4"/><rect x="40" y="34" width="20" height="32" rx="3" fill="none" stroke="${c}" stroke-width="4"/><rect x="64" y="34" width="20" height="32" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M14 30h72" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'thermal-component':c=>`<rect x="20" y="46" width="60" height="10" rx="3" fill="${c}"/><path d="M28 46c0-10 6-16 6-24M50 46c0-10 6-16 6-24M72 46c0-10 6-16 6-24" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  'contactor-fuse':c=>`<rect x="30" y="24" width="40" height="52" rx="4" fill="none" stroke="${c}" stroke-width="4"/><circle cx="42" cy="40" r="4" fill="${c}"/><circle cx="58" cy="40" r="4" fill="${c}"/><path d="M42 44v10M58 44v10" stroke="${c}" stroke-width="3.5"/><path d="M36 62h28" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'storage-block':c=>`<rect x="14" y="30" width="72" height="40" rx="5" fill="none" stroke="${c}" stroke-width="4"/><path d="M14 46h72" stroke="${c}" stroke-width="3"/><path d="M26 30v-8h48v8" stroke="${c}" stroke-width="4" fill="none"/>`,

  /* --- genset breakdown --- */
  alternator:c=>`<circle cx="50" cy="50" r="26" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 24v8M50 68v8M24 50h8M68 50h8M32 32l6 6M62 32l-6 6M32 68l6-6M62 68l-6-6" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="8" fill="${c}"/>`,
  'engine-cooling':c=>`<rect x="18" y="30" width="34" height="40" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M18 38h34M18 46h34M18 54h34M18 62h34" stroke="${c}" stroke-width="2.5"/><path d="M58 40c10 0 18 4 18 12s-10 8-10 16" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  'fuel-system':c=>`<rect x="22" y="24" width="30" height="46" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M22 36h30" stroke="${c}" stroke-width="3"/><circle cx="68" cy="58" r="14" fill="none" stroke="${c}" stroke-width="4"/><path d="M52 58h6" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'genset-controls':c=>`<rect x="20" y="22" width="60" height="40" rx="4" fill="none" stroke="${c}" stroke-width="4"/><circle cx="36" cy="42" r="9" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M36 33v3M36 48v3M27 42h3M42 42h3" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M56 34l10 16 10-16" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 70v10M66 70v10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,

  /* --- switchgear breakdown --- */
  'breaker-parts':c=>`<rect x="24" y="20" width="24" height="60" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M58 30l16 10-16 10M58 60l16 10-16 10" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  'trip-unit':c=>`<rect x="26" y="26" width="48" height="48" rx="5" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 36l-10 18h10l-6 12" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  insulator:c=>`<path d="M40 82V18M28 24h24M26 34h28M28 44h24M26 54h28M28 64h24M26 74h28" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  enclosure:c=>`<rect x="22" y="18" width="56" height="64" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M22 32h56" stroke="${c}" stroke-width="3"/><circle cx="68" cy="52" r="3" fill="${c}"/><path d="M32 46h20M32 58h20M32 68h20" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  'instrument-transformer':c=>`<circle cx="50" cy="50" r="24" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="12" fill="none" stroke="${c}" stroke-width="3"/><path d="M50 26v-8M50 82v-8" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'terminal-block':c=>`<rect x="16" y="40" width="68" height="24" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 40v-10M44 40v-10M60 40v-10M76 40v-10M28 64v10M44 64v10M60 64v10M76 64v10" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'protective-relay':c=>`<rect x="22" y="20" width="56" height="60" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 32l-12 20h12l-8 16 20-24H50z" fill="${c}"/>`,

  /* --- cooling breakdown --- */
  'dry-cooler':c=>`<rect x="16" y="52" width="68" height="20" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M26 52V32a10 10 0 0110-10h28a10 10 0 0110 10v20" stroke="${c}" stroke-width="4" fill="none"/><path d="M30 62h8M46 62h8M62 62h8" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  'coolant-distribution':c=>`<rect x="26" y="26" width="48" height="48" rx="6" fill="none" stroke="${c}" stroke-width="4"/><path d="M26 50h-12M74 50h12M50 26v-12M50 74v12" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="10" fill="none" stroke="${c}" stroke-width="3.5"/>`,

  /* --- transformer components breakdown --- */
  'tap-changer':c=>`<rect x="34" y="18" width="32" height="20" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 38v44" stroke="${c}" stroke-width="4"/><path d="M38 50h-14M38 62h-14M38 74h-14M62 50h14M62 62h14M62 74h14" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="62" r="5" fill="${c}"/>`,
  'core-laminations':c=>`<path d="M22 20v60M32 20v60M42 20v60M52 20v60M62 20v60M72 20v60" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'dielectric-fluid':c=>`<path d="M50 18c10 16 20 28 20 40a20 20 0 01-40 0c0-12 10-24 20-40z" fill="none" stroke="${c}" stroke-width="4"/><path d="M38 62a12 12 0 0012 12" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  'magnet-wire':c=>`<path d="M20 50a30 6 0 1060 0 30 6 0 10-60 0" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M24 44a26 5 0 1052 0" fill="none" stroke="${c}" stroke-width="2.5" opacity=".5"/><path d="M50 20v14M50 66v14" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'tank-skid':c=>`<rect x="18" y="30" width="64" height="34" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M14 70h72M22 70v-6M78 70v-6M40 70v-6M60 70v-6" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  bushing:c=>`<path d="M50 14v14M40 28h20M38 34h24M40 40h20M38 46h24M40 52h20M38 58h24M44 64h12v18h-12z" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  gauge:c=>`<circle cx="50" cy="50" r="28" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 50L64 34" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="${c}"/><path d="M50 26v6M50 74v6M26 50h6M74 50h6" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  pressboard:c=>`<rect x="20" y="22" width="46" height="58" rx="2" fill="none" stroke="${c}" stroke-width="4"/><rect x="30" y="14" width="46" height="58" rx="2" fill="none" stroke="${c}" stroke-width="3" opacity=".6"/>`,
  'radiator-fan':c=>`<rect x="16" y="24" width="34" height="52" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M22 24v52M28 24v52M34 24v52M40 24v52" stroke="${c}" stroke-width="2.5"/><circle cx="68" cy="50" r="16" fill="none" stroke="${c}" stroke-width="4"/><path d="M68 50c0-8 6-10 6-16M68 50c8 0 10 6 16 6M68 50c0 8-6 10-6 16" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`,

  /* --- MRO mechanical / electrical breakdown --- */
  bearing:c=>`<circle cx="50" cy="50" r="26" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="12" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="24" r="4" fill="${c}"/><circle cx="50" cy="76" r="4" fill="${c}"/><circle cx="24" cy="50" r="4" fill="${c}"/><circle cx="76" cy="50" r="4" fill="${c}"/>`,
  'mechanical-seal':c=>`<circle cx="50" cy="50" r="28" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="16" fill="none" stroke="${c}" stroke-width="3"/><circle cx="50" cy="50" r="5" fill="${c}"/>`,
  'shaft-coupling':c=>`<rect x="14" y="42" width="24" height="16" rx="3" fill="none" stroke="${c}" stroke-width="4"/><rect x="62" y="42" width="24" height="16" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M38 44l24 12M38 56l24-12" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'heat-exchanger':c=>`<rect x="18" y="22" width="64" height="56" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M18 34h64M18 46h64M18 58h64M18 70h64" stroke="${c}" stroke-width="2.5"/>`,
  'refrigerant-fluid':c=>`<path d="M28 24c0 10 8 14 8 24a8 8 0 01-16 0c0-10 8-14 8-24z" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M64 34c0 10 8 14 8 24a8 8 0 01-16 0c0-10 8-14 8-24z" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M20 76h60" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'device-switch':c=>`<rect x="30" y="20" width="40" height="60" rx="6" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="38" r="6" fill="${c}"/><path d="M40 60h20" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'fuse-protection':c=>`<rect x="30" y="34" width="40" height="20" rx="10" fill="none" stroke="${c}" stroke-width="4"/><path d="M18 44h12M70 44h12" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M42 44h16" stroke="${c}" stroke-width="3" stroke-dasharray="2 3"/>`,
  'battery-charger':c=>`<rect x="18" y="34" width="34" height="20" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M52 40h4M52 48h4" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M66 30l-10 18h10l-10 18" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  'wire-cord':c=>`<path d="M18 30c14 0 14 14 28 14s14-14 28-14 14 14 14 14" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M18 60c14 0 14 14 28 14s14-14 28-14 14 14 14 14" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
  'socket-screw':c=>`<circle cx="50" cy="34" r="16" fill="none" stroke="${c}" stroke-width="4"/><rect x="46" y="20" width="8" height="8" fill="${c}"/><rect x="44" y="50" width="12" height="34" fill="none" stroke="${c}" stroke-width="4"/><path d="M44 58h12M44 66h12M44 74h12" stroke="${c}" stroke-width="2.5"/>`,
  'anchor-bolt':c=>`<path d="M50 16v50M38 60a12 12 0 0024 0" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M40 22h20" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M38 76l-8 8M50 78v10M62 76l8 8" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'label-nameplate':c=>`<rect x="18" y="30" width="64" height="40" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 42h30M28 52h44M28 62h20" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'packaging-crate':c=>`<rect x="18" y="28" width="64" height="44" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M18 28l32 20 32-20M50 48v24" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  'led-fixture':c=>`<rect x="24" y="38" width="52" height="16" rx="8" fill="none" stroke="${c}" stroke-width="4"/><path d="M34 54v8M46 54v10M58 54v10M70 54v8" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  'led-driver':c=>`<rect x="26" y="24" width="48" height="30" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M36 62v6M46 62v6M56 62v6M66 62v6" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><circle cx="40" cy="39" r="4" fill="${c}"/><circle cx="60" cy="39" r="4" fill="${c}"/>`,
  'cutting-insert':c=>`<path d="M50 20l26 26-26 26-26-26z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="46" r="5" fill="${c}"/>`,
  toolholding:c=>`<path d="M50 18v28" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M34 46h32l-6 36H40z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  'motor-drive':c=>`<rect x="18" y="28" width="34" height="44" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M26 38h18M26 48h18M26 58h10" stroke="${c}" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="50" r="16" fill="none" stroke="${c}" stroke-width="4"/><path d="M62 50h16M70 42v16" stroke="${c}" stroke-width="3"/>`,
  'motor-repair':c=>`<circle cx="42" cy="50" r="22" fill="none" stroke="${c}" stroke-width="4"/><path d="M42 28v-8M42 72v8" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M62 40l14-6-6 14z" fill="${c}"/>`,
  'paint-coating':c=>`<path d="M36 18h20v18l8 8v38a8 8 0 01-8 8H36a8 8 0 01-8-8V44l8-8z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M28 58h28" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  'tape-strapping':c=>`<circle cx="42" cy="50" r="26" fill="none" stroke="${c}" stroke-width="4"/><circle cx="42" cy="50" r="9" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M68 50h16" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  impeller:c=>`<circle cx="50" cy="50" r="10" fill="${c}"/><path d="M50 50c0-14 10-18 6-30M50 50c14 0 20-8 30-6M50 50c0 14-10 18-6 30M50 50c-14 0-20 8-30 6" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,

  /* --- oil & gas breakdown --- */
  'centrifugal-pump':c=>`<circle cx="40" cy="50" r="24" fill="none" stroke="${c}" stroke-width="4"/><path d="M40 50L26 40M40 50l16-2M40 50l-2 18" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><rect x="64" y="44" width="20" height="12" rx="2" fill="${c}"/>`,
  'downhole-cable':c=>`<path d="M50 16v10" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M30 26h40l-6 54H36z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M40 36c6 6 14 6 20 0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  'forged-body':c=>`<path d="M24 40h20v-8a6 6 0 016-6 6 6 0 016 6v8h20v20H56v8a6 6 0 01-6 6 6 6 0 01-6-6v-8H24z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`,
  'thread-protector':c=>`<rect x="30" y="16" width="16" height="68" rx="6" fill="none" stroke="${c}" stroke-width="4"/><path d="M30 28h16M30 40h16M30 52h16M30 64h16" stroke="${c}" stroke-width="2.5"/><rect x="54" y="34" width="20" height="12" rx="3" fill="${c}"/>`,
  'valve-actuator':c=>`<rect x="34" y="18" width="32" height="26" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 44v14" stroke="${c}" stroke-width="5"/><circle cx="50" cy="70" r="14" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 60v20M40 70h20" stroke="${c}" stroke-width="3"/>`,
  'valve-trim':c=>`<circle cx="50" cy="42" r="16" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 58v22" stroke="${c}" stroke-width="4"/><path d="M38 76h24" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M42 34l16 16M58 34l-16 16" stroke="${c}" stroke-width="3"/>`,
  'wellhead-hanger':c=>`<rect x="30" y="18" width="40" height="14" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M38 32v20a12 12 0 0024 0V32" stroke="${c}" stroke-width="4" fill="none"/><path d="M50 64v20" stroke="${c}" stroke-width="5"/>`,
  'stud-bolt':c=>`<path d="M28 30h12v50H28zM60 30h12v50H60z" fill="none" stroke="${c}" stroke-width="4"/><path d="M22 30h24M56 30h24M22 80h24M56 80h24" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'wellsite-rtu':c=>`<rect x="24" y="22" width="52" height="42" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M50 64v10M36 82h28" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M34 44l8-14 8 20 8-24 6 10" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

  /* --- renewables PE/module breakdown --- */
  'controller-board':c=>`<rect x="18" y="24" width="64" height="46" rx="4" fill="none" stroke="${c}" stroke-width="4"/><circle cx="34" cy="38" r="4" fill="${c}"/><circle cx="50" cy="38" r="4" fill="${c}"/><path d="M28 54h44M28 62h30" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  capacitor:c=>`<path d="M32 20v60M40 20v60" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M14 50h18M50 50h18" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'emi-filter':c=>`<rect x="20" y="36" width="60" height="28" rx="6" fill="none" stroke="${c}" stroke-width="4"/><path d="M32 36V24M50 36V24M68 36V24M32 64v12M50 64v12M68 64v12" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  inductor:c=>`<path d="M14 50a9 9 0 0118 0 9 9 0 0018 0 9 9 0 0118 0 9 9 0 0018 0" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  'gate-driver':c=>`<rect x="24" y="30" width="52" height="34" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M36 30v-8M50 30v-8M64 30v-8M36 64v8M50 64v8M64 64v8" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'heat-sink':c=>`<rect x="20" y="56" width="60" height="12" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 56V26M40 56V26M52 56V26M64 56V26M76 56V26" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'power-module':c=>`<rect x="24" y="20" width="52" height="60" rx="4" fill="none" stroke="${c}" stroke-width="4"/><circle cx="38" cy="36" r="5" fill="${c}"/><circle cx="62" cy="36" r="5" fill="${c}"/><path d="M32 56h36M32 66h36" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  sensor:c=>`<circle cx="50" cy="48" r="18" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="48" r="6" fill="${c}"/><path d="M50 30v-10M50 82c-16 0-16-8-16-8" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  'wiring-harness':c=>`<circle cx="22" cy="26" r="6" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="22" cy="74" r="6" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M28 26c30 0 12 24 30 24s2 24 30 24" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="88" cy="26" r="6" fill="none" stroke="${c}" stroke-width="3.5"/><circle cx="88" cy="74" r="6" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  'module-frame':c=>`<rect x="16" y="16" width="68" height="68" rx="2" fill="none" stroke="${c}" stroke-width="5"/><rect x="26" y="26" width="48" height="48" rx="1" fill="none" stroke="${c}" stroke-width="2.5" opacity=".6"/>`,
  'pv-fuse-holder':c=>`<rect x="30" y="38" width="40" height="18" rx="9" fill="none" stroke="${c}" stroke-width="4"/><path d="M18 47h12M70 47h12" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M50 56v14" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'junction-box':c=>`<rect x="24" y="24" width="52" height="52" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M24 40h52M40 76V40M60 76V40" stroke="${c}" stroke-width="3"/>`,
  'solar-cell':c=>`<rect x="22" y="22" width="56" height="56" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M22 22l56 56M50 22v56M22 50h56" stroke="${c}" stroke-width="2.5"/>`,
  'solar-glass':c=>`<rect x="16" y="30" width="68" height="40" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M16 30l68 40M84 30l-68 40" stroke="${c}" stroke-width="2" opacity=".5"/>`,
  'tracker-drive':c=>`<path d="M20 62h60" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M50 62V30" stroke="${c}" stroke-width="4"/><path d="M30 42l40-12M30 42a20 20 0 0140-12" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="70" r="8" fill="none" stroke="${c}" stroke-width="4"/>`,
  'plant-controller':c=>`<rect x="18" y="20" width="64" height="44" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 40h20v14H28zM56 34h16v20H56z" fill="none" stroke="${c}" stroke-width="3"/><path d="M40 72v10M60 72v10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,

  /* --- full-catalog category coverage (beyond the original duplicate-photo set) --- */
  grounding:c=>`<path d="M50 16v40" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M28 56h44M34 66h32M40 76h20" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'backup-power':c=>`<rect x="24" y="26" width="40" height="54" rx="4" fill="none" stroke="${c}" stroke-width="4"/><path d="M64 40h8v8" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M48 36l-10 20h10l-6 18 18-24H50z" fill="${c}"/>`,
  'power-distribution':c=>`<rect x="20" y="20" width="60" height="60" rx="4" fill="none" stroke="${c}" stroke-width="4"/><circle cx="34" cy="36" r="4" fill="${c}"/><circle cx="50" cy="36" r="4" fill="${c}"/><circle cx="66" cy="36" r="4" fill="${c}"/><circle cx="34" cy="54" r="4" fill="${c}"/><circle cx="50" cy="54" r="4" fill="${c}"/><circle cx="66" cy="54" r="4" fill="${c}"/><path d="M30 70h40" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  network:c=>`<rect x="18" y="34" width="64" height="26" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M28 60v8M40 60v8M52 60v8M64 60v8M76 60v8" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/><path d="M28 34v-8h12v8M52 34v-8h12v8" stroke="${c}" stroke-width="3"/>`,
  'material-handling':c=>`<rect x="16" y="60" width="68" height="10" rx="2" fill="none" stroke="${c}" stroke-width="4"/><path d="M16 70v8M84 70v8" stroke="${c}" stroke-width="4" stroke-linecap="round"/><rect x="28" y="30" width="24" height="30" rx="2" fill="none" stroke="${c}" stroke-width="4"/><rect x="54" y="40" width="18" height="20" rx="2" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  plumbing:c=>`<path d="M20 40h30v-8a8 8 0 018-8h0a8 8 0 018 8v8h14" fill="none" stroke="${c}" stroke-width="4"/><path d="M30 60l14-14 6 6-14 14z" fill="none" stroke="${c}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="34" cy="70" r="8" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  pneumatics:c=>`<rect x="18" y="38" width="40" height="24" rx="3" fill="none" stroke="${c}" stroke-width="4"/><path d="M58 50h24" stroke="${c}" stroke-width="6" stroke-linecap="round"/><rect x="78" y="42" width="6" height="16" fill="${c}"/>`,
  'power-tool':c=>`<path d="M20 44h30v18H30l-10 10z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><rect x="50" y="48" width="10" height="10" fill="${c}"/><path d="M60 53h22" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  'raw-material':c=>`<rect x="18" y="26" width="64" height="10" rx="2" fill="none" stroke="${c}" stroke-width="4"/><rect x="18" y="45" width="64" height="10" rx="2" fill="none" stroke="${c}" stroke-width="4"/><rect x="18" y="64" width="64" height="10" rx="2" fill="none" stroke="${c}" stroke-width="4"/>`,
  ppe:c=>`<path d="M22 62a28 20 0 0156 0z" fill="none" stroke="${c}" stroke-width="4"/><path d="M16 62h68" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M50 34v10" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  security:c=>`<path d="M50 16l26 10v18c0 20-12 32-26 38-14-6-26-18-26-38V26z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><rect x="40" y="46" width="20" height="16" rx="2" fill="none" stroke="${c}" stroke-width="3.5"/><path d="M44 46v-6a6 6 0 0112 0v6" fill="none" stroke="${c}" stroke-width="3.5"/>`,
  welding:c=>`<path d="M28 72l24-24" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M52 48l10-10 10 10-10 10z" fill="none" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M66 30l6-6M74 38l8-4M60 24l4-8" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
  'downhole-lift':c=>`<path d="M20 70h60" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M35 70V50" stroke="${c}" stroke-width="4"/><path d="M20 40l50-6" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M50 34v16M64 36v10" stroke="${c}" stroke-width="3.5"/>`,
  'pv-module':c=>`<rect x="16" y="24" width="68" height="52" rx="2" fill="none" stroke="${c}" stroke-width="5"/><path d="M33 24v52M50 24v52M67 24v52M16 40h68M16 60h68" stroke="${c}" stroke-width="2.5"/>`,
  'structural-bos':c=>`<path d="M18 34h64M18 50h64" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M30 34v16M50 34v16M70 34v16" stroke="${c}" stroke-width="3.5"/><path d="M24 66l12-8M76 66l-12-8" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`,
  'wind-turbine':c=>`<circle cx="50" cy="50" r="6" fill="${c}"/><path d="M50 50c0-18 8-24 4-34M50 50c16 6 26 0 34-8M50 50c-4 18 4 26-2 34" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 60v20" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`
};

function vfCatIconSVG(iconId,color){
  const draw=VF_ICON_PATHS[iconId]||VF_ICON_PATHS.generic;
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${draw(color)}</svg>`;
}

/* The category-icon lookup, pulled out on its own so other renderers (the
   voltfield-3d.js procedural shape viewer) can resolve the same family ->
   icon-id mapping without duplicating this logic. */
function vfIconIdFor(f){
  if(!f) return 'generic';
  const base=f.img?f.img.split('/').pop():'';
  return (base&&VF_FILE_ICON_MAP[base])||VF_CAT_ICON_MAP[f.s+'|'+f.c]||'generic';
}

/* Drop-in replacement for a bare pImg(f.img,...) call: routes duplicate-photo
   families to a category icon instead, keeps everyone else on their real photo. */
function vfPartVisual(f,cls,alt){
  if(!f) return '';
  const iconId=vfIconIdFor(f);
  const color=(typeof SECTORS!=='undefined'&&SECTORS[f.s])?SECTORS[f.s].color:'#5B6B7E';
  const label=alt||f.n||f.c;
  return `<div class="vf-cat-icon ${cls||''}" role="img" aria-label="${label.replace(/"/g,'&quot;')}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${color}14">${vfCatIconSVG(iconId,color)}</div>`;
}
