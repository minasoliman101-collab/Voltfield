/* VOLTFIELD — category icon fallback for duplicate part photos.
   94 of 236 part images were byte-identical duplicates reused across
   unrelated families (traced via MD5 hashing of images/parts/*.jpg).
   For each duplicate group we keep one family's real photo and render
   a distinct hand-drawn category icon for the rest, so no two
   unrelated families ever look identical. */

/* filenames (basename only) that must NOT use their catalog photo */
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

/* (sector|category) -> icon id. Anything not listed falls back to 'generic'. */
const VF_CAT_ICON_MAP = {
  'dc|Transformers':'transformer','dc|Transformer Components':'transformer','re|GSU & MV Transformers':'transformer',
  'dc|Switchgear & Breakers':'switchgear','dc|Switchgear Components':'switchgear',
  'mro|Electrical':'electrical',
  'dc|Genset Components':'genset',
  'dc|Cooling':'cooling','mro|HVAC & Refrigeration':'cooling',
  'dc|Monitoring & Controls':'controls','re|Monitoring & SCADA':'controls','og|Instrumentation & Controls':'controls',
  'bess|Battery Components':'battery','bess|Storage Blocks':'battery',
  'bess|Power Conversion':'power-conversion','re|Inverter & PE Components':'power-conversion',
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
  'mro|Measuring & Inspection':'measuring',
  'mro|Metalworking Abrasives':'abrasive',
  'mro|Lubrication':'lubrication',
  'mro|Power Transmission':'power-transmission',
  'mro|Motors':'motor',
  'mro|Lighting':'lighting',
  'mro|Building Wire & Cable':'cable',
  'mro|Conduit, Raceway & Fittings':'conduit',
  'mro|Adhesives, Sealants & Tape':'tape','mro|Tape, Labels & Strapping':'tape','mro|Identification & Packaging':'tape',
  'mro|Janitorial & Facility':'janitorial'
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
  generic:c=>`<rect x="22" y="22" width="56" height="56" rx="8" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="14" fill="none" stroke="${c}" stroke-width="4"/>`
};

function vfCatIconSVG(iconId,color){
  const draw=VF_ICON_PATHS[iconId]||VF_ICON_PATHS.generic;
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${draw(color)}</svg>`;
}

/* Drop-in replacement for a bare pImg(f.img,...) call: routes duplicate-photo
   families to a category icon instead, keeps everyone else on their real photo. */
function vfPartVisual(f,cls,alt,lazy){
  if(!f||!f.img) return '';
  const base=f.img.split('/').pop();
  if(!VF_ICON_REPLACE.has(base)) return pImg(f.img,cls,alt,lazy);
  const iconId=VF_CAT_ICON_MAP[f.s+'|'+f.c]||'generic';
  const color=(typeof SECTORS!=='undefined'&&SECTORS[f.s])?SECTORS[f.s].color:'#5B6B7E';
  return `<div class="vf-cat-icon ${cls||''}" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${color}14">${vfCatIconSVG(iconId,color)}</div>`;
}
