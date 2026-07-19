/* VOLTFIELD — generic category icon system (replaces the single shared stock photo).
   Real per-SKU photography isn't feasible at 2M+ configurable SKUs without a licensed
   supplier image feed (Icecat / Digi-Key / Mouser all require a business agreement —
   see project notes). Until that's in place, each family renders a distinct,
   category-accurate line-art icon instead of one generic placeholder. */
const PART_ICONS={
  transformer:'<path d="M20 14v36M44 14v36M20 20a8 8 0 000 16a8 8 0 010 16M44 20a8 8 0 010 16a8 8 0 000 16M8 22h8M8 42h8M48 22h8M48 42h8"/>',
  breaker:'<rect x="16" y="10" width="32" height="44" rx="2"/><path d="M32 18v10M24 44h16M32 28l-6 16h12z"/>',
  genset:'<rect x="10" y="20" width="30" height="26" rx="2"/><circle cx="25" cy="33" r="9"/><path d="M25 24v3M25 39v3M16 33h3M31 33h3M19 27l2 2M31 39l2 2M31 27l-2 2M19 39l2-2"/><path d="M40 26h10M40 40h10M46 26v14"/>',
  cable:'<path d="M10 32c6-10 12 10 18 0s12 10 18 0s12 10 16 0"/><circle cx="10" cy="32" r="3"/><circle cx="54" cy="32" r="3"/>',
  busbar:'<rect x="10" y="14" width="44" height="6"/><rect x="10" y="29" width="44" height="6"/><rect x="10" y="44" width="44" height="6"/>',
  ground:'<path d="M32 8v26"/><path d="M18 34h28M22 42h20M26 50h12"/>',
  gauge:'<circle cx="32" cy="34" r="20"/><path d="M32 34l10-12M18 34h4M46 34h4M24 20l3 3M40 20l-3 3"/><path d="M32 14v-4"/>',
  solar:'<rect x="10" y="14" width="44" height="36" rx="1"/><path d="M10 25h44M10 36h44M10 47h44M21 14v36M32 14v36M43 14v36"/>',
  inverter:'<rect x="14" y="12" width="36" height="40" rx="2"/><path d="M20 34l6-10 6 14 6-14 6 10"/>',
  rack:'<path d="M14 54V14l18-6l18 6v40M14 14l18 6l18-6M32 20v34M14 30l18 6l18-6M14 42l18 6l18-6"/>',
  wind:'<circle cx="32" cy="32" r="3.5"/><path d="M32 32L18 14c10-4 16 6 14 18z"/><path d="M32 32L52 24c-2 10-12 12-20 8z"/><path d="M32 32L24 54c-8-6-6-16 0-22z"/><path d="M32 44v14"/>',
  battery:'<rect x="12" y="18" width="34" height="28" rx="2"/><rect x="46" y="27" width="6" height="10"/><path d="M22 26v12M32 26v12"/>',
  powerconv:'<rect x="12" y="16" width="40" height="32" rx="2"/><path d="M20 32h8l4-10l8 20l4-10h8"/>',
  bms:'<rect x="12" y="10" width="40" height="44" rx="2"/><circle cx="24" cy="24" r="3"/><circle cx="40" cy="24" r="3"/><path d="M18 38h28M18 45h20"/>',
  fire:'<path d="M28 8h8v6h-8z"/><path d="M24 14h16l3 6H21z"/><path d="M23 20h18l-2 34H25z"/><path d="M27 26h10M26 34h12M27 42h10"/>',
  fan:'<circle cx="32" cy="32" r="4"/><path d="M32 32C24 24 24 12 32 10c4 8-2 16-0 22z"/><path d="M32 32C40 24 52 24 54 32c-8 4-16-2-22 0z"/><path d="M32 32C40 40 40 52 32 54c-4-8 2-16 0-22z"/><path d="M32 32C24 40 12 40 10 32c8-4 16 2 22 0z"/>',
  enclosure:'<rect x="14" y="10" width="36" height="44" rx="2"/><path d="M14 20h36M22 10v10M40 30h4M40 38h4"/>',
  pipe:'<path d="M8 26h48v12H8z"/><ellipse cx="8" cy="32" rx="3" ry="6"/><ellipse cx="56" cy="32" rx="3" ry="6"/>',
  valve:'<path d="M10 32h14M40 32h14M24 32h16" /><rect x="24" y="24" width="16" height="16" rx="1"/><path d="M32 12v12M22 12h20"/>',
  downhole:'<path d="M26 8h12v10H26z"/><path d="M24 18h16l-3 34h-10z"/><path d="M27 24h10M28 32h8M29 40h6"/>',
  pump:'<circle cx="26" cy="32" r="14"/><path d="M40 32h14v-6M46 26v12"/><path d="M26 22v20M16 32h20"/>',
  fastener:'<path d="M22 10h20l4 8-4 8H22l-4-8z"/><rect x="28" y="26" width="8" height="28"/><path d="M24 34h16M24 40h16M24 46h16"/>',
  rawstock:'<rect x="12" y="24" width="40" height="16" rx="2"/><path d="M12 24l6-6h34l-6 6M52 24l6 6v10l-6 6M12 40l6 6"/>',
  ppe:'<path d="M14 34a18 14 0 0136 0z"/><rect x="10" y="34" width="44" height="6" rx="2"/><path d="M26 34v-6a6 6 0 0112 0v6"/>',
  wrench:'<path d="M40 12a10 10 0 00-13 13L12 40l6 6l15-15a10 10 0 0013-13l-6 6l-6-2l-2-6z"/>',
  drill:'<path d="M12 30h24v10H12z"/><path d="M36 32h6l8-4v12l-8-4h-6z"/><path d="M16 40v6M22 40v6"/>',
  plumbing:'<path d="M10 20h20v10a10 10 0 0010 10h14"/><circle cx="48" cy="40" r="6"/><path d="M18 14v6M22 14v6"/>',
  cylinder:'<rect x="10" y="24" width="26" height="16" rx="2"/><rect x="36" y="29" width="14" height="6"/><path d="M50 32h4"/>',
  abrasive:'<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="6"/><path d="M32 12v6M32 48v6M12 32h6M46 32h6"/>',
  adhesive:'<path d="M26 8h12v8H26z"/><path d="M24 16h16l2 34a4 4 0 01-4 4H26a4 4 0 01-4-4z"/><path d="M25 26h14M25 34h14M25 42h14"/>',
  cleaning:'<path d="M28 8h8v8h-8z"/><path d="M24 16h16l3 8v28a3 3 0 01-3 3H24a3 3 0 01-3-3V24z"/><path d="M40 20l6-4"/>',
  bulb:'<circle cx="32" cy="26" r="14"/><path d="M26 38h12M27 44h10M29 50h6"/><path d="M32 12v-4M18 26h-4M46 26h4M22 16l-3-3M42 16l3-3"/>',
  oilcan:'<path d="M14 30h24v18a4 4 0 01-4 4H18a4 4 0 01-4-4z"/><path d="M38 34l14-10"/><path d="M18 30v-8a4 4 0 014-4h8"/>',
  meter:'<rect x="10" y="14" width="44" height="36" rx="3"/><path d="M32 42V26M22 42a10 10 0 0120-6"/><circle cx="32" cy="42" r="2.4"/>',
  weld:'<path d="M12 46l12-12M20 22l22 22"/><path d="M40 16l8 8-16 16l-8-8z"/><path d="M46 10l8 8"/>',
  endmill:'<path d="M28 8h8v20h-8z"/><path d="M24 28h16v22a8 8 0 01-16 0z"/><path d="M24 34h16M24 40h16M24 46h16"/>',
  box:'<path d="M8 20l24-10l24 10l-24 10z"/><path d="M8 20v26l24 10V30M56 20v26l-24 10"/>',
  networking:'<rect x="14" y="24" width="36" height="20" rx="2"/><path d="M22 24v-6h8v6M34 24v-6h8v6"/><path d="M22 44v6M42 44v6"/>',
  camera:'<rect x="10" y="22" width="34" height="24" rx="3"/><circle cx="27" cy="34" r="8"/><path d="M44 28l10-6v24l-10-6z"/>',
  gear:'<circle cx="32" cy="32" r="10"/><path d="M32 14v6M32 46v6M14 32h6M46 32h6M19 19l4 4M41 41l4 4M45 19l-4 4M23 41l-4 4"/>'
};
/* category/keyword -> icon key. Matched in order against family category + keywords + name. */
const ICON_RULES=[
  [/transformer|gsu\b/i,'transformer'],
  [/breaker|switchgear/i,'breaker'],
  [/genset|generator|backup power/i,'genset'],
  [/cable|wire|building wire/i,'cable'],
  [/busbar|bus duct|power distribution|electrical distribution/i,'busbar'],
  [/ground|bonding/i,'ground'],
  [/monitor|scada|control|instrumentation|test instrument/i,'gauge'],
  [/solar module|module & bos/i,'solar'],
  [/inverter|pcs|power conversion|inverter & pe/i,'inverter'],
  [/structural bos|rack|racking/i,'rack'],
  [/wind/i,'wind'],
  [/storage block|battery/i,'battery'],
  [/bms|ems|controls \(bms/i,'bms'],
  [/fire suppression|fire/i,'fire'],
  [/thermal|hvac|cooling|refrigeration/i,'fan'],
  [/enclosure/i,'enclosure'],
  [/tubular|conduit|raceway/i,'pipe'],
  [/valve|pressure control|wellhead/i,'valve'],
  [/downhole|artificial lift/i,'downhole'],
  [/pump/i,'pump'],
  [/gasket|seal|fastener|fasteners & hardware|industrial fasteners/i,'fastener'],
  [/raw material/i,'rawstock'],
  [/safety & ppe|safety supplies/i,'ppe'],
  [/hand tool/i,'wrench'],
  [/power tool/i,'drill'],
  [/plumbing|fittings & flanges/i,'plumbing'],
  [/pneumatic|hydraulic/i,'cylinder'],
  [/abrasive/i,'abrasive'],
  [/adhesive|sealant|tape/i,'adhesive'],
  [/cleaning|janitorial/i,'cleaning'],
  [/lighting/i,'bulb'],
  [/lubrication|lubricant/i,'oilcan'],
  [/welding/i,'weld'],
  [/machining|cutting tool|toolholding|workholding|metalworking/i,'endmill'],
  [/shipping|packaging|bags & poly|identification & packaging/i,'box'],
  [/datacomm|networking/i,'networking'],
  [/security & life safety/i,'camera'],
  [/motor|power transmission/i,'genset'],
  [/electrical(?!\s*distribution)/i,'breaker']
];
function categoryIconKey(f){
  const hay=[f.c,f.kw,f.n].filter(Boolean).join(' ');
  for(const [re,key] of ICON_RULES) if(re.test(hay)) return key;
  return 'gear';
}
/* returns an inline <svg> string sized/colored for the given family + sector color */
function partIconSvg(f,color){
  const key=categoryIconKey(f);
  const body=PART_ICONS[key]||PART_ICONS.gear;
  return `<svg viewBox="0 0 64 64" fill="none" stroke="${color||'#5B6B7E'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
