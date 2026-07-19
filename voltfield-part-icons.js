/* VOLTFIELD — generic category icon system (replaces the single shared stock photo).
   Real per-SKU photography isn't feasible at 2M+ configurable SKUs without a licensed
   supplier image feed (Icecat / Digi-Key / Mouser all require a business agreement —
   see project notes). Until that's in place, each family renders a distinct,
   category-accurate icon instead of one generic placeholder. Built from plain
   rect/circle/line/polygon primitives only — no freehand bezier paths — so every
   shape is predictable at any size. */
const PART_ICONS={
  transformer:'<rect x="16" y="24" width="32" height="28" rx="2"/><line x1="20" y1="24" x2="20" y2="52"/><line x1="26" y1="24" x2="26" y2="52"/><line x1="38" y1="24" x2="38" y2="52"/><line x1="44" y1="24" x2="44" y2="52"/><rect x="22" y="10" width="6" height="14"/><rect x="36" y="10" width="6" height="14"/><circle cx="25" cy="10" r="2.2"/><circle cx="39" cy="10" r="2.2"/>',
  breaker:'<rect x="16" y="8" width="32" height="48" rx="3"/><rect x="26" y="16" width="12" height="14" rx="2"/><line x1="32" y1="16" x2="32" y2="12"/><circle cx="20" cy="14" r="1.6"/><circle cx="44" cy="14" r="1.6"/><circle cx="20" cy="50" r="1.6"/><circle cx="44" cy="50" r="1.6"/><line x1="22" y1="40" x2="42" y2="40"/>',
  genset:'<rect x="8" y="20" width="44" height="24" rx="2"/><rect x="4" y="44" width="52" height="6"/><rect x="42" y="8" width="6" height="14"/><line x1="14" y1="27" x2="24" y2="27"/><line x1="14" y1="33" x2="24" y2="33"/><line x1="14" y1="39" x2="24" y2="39"/><line x1="32" y1="27" x2="40" y2="27"/><line x1="32" y1="33" x2="40" y2="33"/>',
  cable:'<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="15"/><circle cx="32" cy="32" r="8"/><line x1="32" y1="4" x2="32" y2="10"/><line x1="32" y1="54" x2="32" y2="60"/>',
  busbar:'<rect x="10" y="14" width="44" height="6"/><rect x="10" y="29" width="44" height="6"/><rect x="10" y="44" width="44" height="6"/><rect x="16" y="20" width="4" height="9"/><rect x="44" y="20" width="4" height="9"/><rect x="16" y="35" width="4" height="9"/><rect x="44" y="35" width="4" height="9"/>',
  ground:'<line x1="32" y1="6" x2="32" y2="24"/><rect x="24" y="24" width="16" height="10" rx="1"/><line x1="40" y1="27" x2="50" y2="27"/><line x1="32" y1="34" x2="32" y2="46"/><line x1="16" y1="50" x2="48" y2="50"/><line x1="20" y1="56" x2="44" y2="56"/>',
  gauge:'<rect x="8" y="10" width="48" height="44" rx="3"/><circle cx="32" cy="32" r="16"/><line x1="32" y1="32" x2="40" y2="22"/><circle cx="32" cy="32" r="2.4"/>',
  solar:'<rect x="10" y="12" width="44" height="38" rx="1"/><line x1="10" y1="23" x2="54" y2="23"/><line x1="10" y1="34" x2="54" y2="34"/><line x1="10" y1="45" x2="54" y2="45"/><line x1="21" y1="12" x2="21" y2="50"/><line x1="32" y1="12" x2="32" y2="50"/><line x1="43" y1="12" x2="43" y2="50"/><rect x="27" y="50" width="10" height="5"/>',
  inverter:'<rect x="14" y="10" width="36" height="42" rx="2"/><rect x="20" y="16" width="24" height="10" rx="1"/><line x1="20" y1="32" x2="44" y2="32"/><line x1="20" y1="37" x2="44" y2="37"/><line x1="20" y1="42" x2="44" y2="42"/><circle cx="22" cy="47" r="2.4"/><circle cx="42" cy="47" r="2.4"/>',
  rack:'<line x1="14" y1="52" x2="14" y2="28"/><line x1="50" y1="52" x2="50" y2="14"/><line x1="14" y1="28" x2="50" y2="14"/><line x1="24" y1="52" x2="24" y2="24"/><line x1="24" y1="24" x2="50" y2="12"/><line x1="10" y1="52" x2="54" y2="52"/>',
  wind:'<circle cx="32" cy="20" r="3"/><line x1="32" y1="20" x2="32" y2="4"/><line x1="32" y1="20" x2="16" y2="34"/><line x1="32" y1="20" x2="48" y2="34"/><rect x="30" y="20" width="4" height="36"/><line x1="22" y1="56" x2="42" y2="56"/>',
  battery:'<rect x="10" y="20" width="44" height="26" rx="2"/><rect x="16" y="14" width="6" height="6"/><rect x="29" y="14" width="6" height="6"/><rect x="42" y="14" width="6" height="6"/><line x1="16" y1="32" x2="48" y2="32"/><line x1="16" y1="38" x2="48" y2="38"/>',
  powerconv:'<rect x="12" y="14" width="40" height="36" rx="2"/><line x1="18" y1="24" x2="46" y2="24"/><line x1="18" y1="30" x2="46" y2="30"/><line x1="18" y1="36" x2="46" y2="36"/><rect x="26" y="42" width="12" height="6"/>',
  bms:'<rect x="12" y="10" width="40" height="44" rx="2"/><rect x="18" y="16" width="28" height="14"/><circle cx="20" cy="36" r="2.4"/><circle cx="28" cy="36" r="2.4"/><circle cx="36" cy="36" r="2.4"/><circle cx="44" cy="36" r="2.4"/><line x1="18" y1="44" x2="46" y2="44"/>',
  fire:'<rect x="24" y="20" width="16" height="30" rx="6"/><rect x="27" y="10" width="10" height="10"/><line x1="32" y1="10" x2="32" y2="6"/><line x1="22" y1="16" x2="14" y2="22"/><circle cx="14" cy="22" r="3"/><line x1="24" y1="30" x2="40" y2="30"/>',
  fan:'<rect x="10" y="10" width="44" height="44" rx="4"/><circle cx="32" cy="32" r="16"/><line x1="32" y1="32" x2="32" y2="18"/><line x1="32" y1="32" x2="44" y2="32"/><line x1="32" y1="32" x2="32" y2="46"/><line x1="32" y1="32" x2="20" y2="32"/><circle cx="14" cy="14" r="1.6"/><circle cx="50" cy="14" r="1.6"/><circle cx="14" cy="50" r="1.6"/><circle cx="50" cy="50" r="1.6"/>',
  enclosure:'<rect x="14" y="8" width="36" height="44" rx="2"/><line x1="32" y1="8" x2="32" y2="52"/><rect x="38" y="26" width="4" height="10"/><line x1="18" y1="14" x2="28" y2="14"/><line x1="18" y1="18" x2="28" y2="18"/><rect x="18" y="52" width="8" height="4"/><rect x="38" y="52" width="8" height="4"/>',
  pipe:'<rect x="8" y="26" width="48" height="12"/><ellipse cx="8" cy="32" rx="3" ry="6"/><ellipse cx="56" cy="32" rx="3" ry="6"/>',
  valve:'<line x1="8" y1="32" x2="22" y2="32"/><line x1="42" y1="32" x2="56" y2="32"/><rect x="22" y="24" width="20" height="16" rx="2"/><line x1="32" y1="16" x2="32" y2="24"/><circle cx="32" cy="10" r="6"/><line x1="26" y1="10" x2="38" y2="10"/>',
  downhole:'<rect x="26" y="8" width="12" height="10"/><rect x="24" y="18" width="16" height="30"/><line x1="27" y1="24" x2="37" y2="24"/><line x1="28" y1="32" x2="36" y2="32"/><line x1="29" y1="40" x2="35" y2="40"/>',
  pump:'<circle cx="28" cy="34" r="14"/><rect x="40" y="28" width="14" height="12" rx="1"/><line x1="28" y1="20" x2="28" y2="26"/>',
  fastener:'<polygon points="24,10 40,10 46,20 40,30 24,30 18,20"/><rect x="28" y="30" width="8" height="26"/><line x1="24" y1="36" x2="40" y2="36"/><line x1="24" y1="42" x2="40" y2="42"/><line x1="24" y1="48" x2="40" y2="48"/>',
  rawstock:'<rect x="14" y="26" width="36" height="14"/><line x1="14" y1="26" x2="20" y2="20"/><line x1="50" y1="26" x2="56" y2="20"/><line x1="14" y1="40" x2="20" y2="34"/><line x1="50" y1="40" x2="56" y2="34"/><line x1="20" y1="20" x2="56" y2="20"/><line x1="20" y1="34" x2="56" y2="34"/>',
  ppe:'<path d="M12 36 A20 16 0 0 1 52 36"/><rect x="8" y="36" width="48" height="6" rx="2"/>',
  wrench:'<rect x="14" y="6" width="36" height="12" rx="2"/><rect x="28" y="18" width="8" height="34"/>',
  drill:'<rect x="10" y="26" width="26" height="14" rx="2"/><rect x="36" y="29" width="6" height="8"/><rect x="42" y="31" width="10" height="4"/><rect x="16" y="40" width="8" height="14" rx="2"/>',
  plumbing:'<line x1="10" y1="20" x2="30" y2="20"/><line x1="30" y1="20" x2="30" y2="40"/><line x1="30" y1="40" x2="48" y2="40"/><circle cx="48" cy="40" r="6"/>',
  cylinder:'<rect x="10" y="24" width="26" height="16" rx="2"/><rect x="36" y="30" width="18" height="4"/><line x1="54" y1="26" x2="54" y2="36"/>',
  abrasive:'<circle cx="32" cy="32" r="20"/><circle cx="32" cy="32" r="6"/><line x1="32" y1="12" x2="32" y2="18"/><line x1="32" y1="46" x2="32" y2="52"/><line x1="12" y1="32" x2="18" y2="32"/><line x1="46" y1="32" x2="52" y2="32"/>',
  adhesive:'<polygon points="28,8 36,8 40,16 24,16"/><rect x="22" y="24" width="20" height="32" rx="3"/><line x1="25" y1="32" x2="39" y2="32"/><line x1="25" y1="40" x2="39" y2="40"/><line x1="25" y1="48" x2="39" y2="48"/>',
  cleaning:'<rect x="22" y="22" width="20" height="32" rx="3"/><rect x="27" y="10" width="10" height="12"/><line x1="37" y1="14" x2="46" y2="8"/><line x1="22" y1="32" x2="42" y2="32"/>',
  bulb:'<circle cx="32" cy="26" r="14"/><rect x="26" y="40" width="12" height="6"/><rect x="28" y="46" width="8" height="4"/><line x1="26" y1="26" x2="38" y2="26"/>',
  oilcan:'<rect x="14" y="30" width="26" height="20" rx="2"/><rect x="18" y="24" width="8" height="6"/><line x1="40" y1="32" x2="54" y2="22"/>',
  meter:'<rect x="10" y="14" width="44" height="36" rx="3"/><rect x="18" y="20" width="28" height="14"/><line x1="32" y1="42" x2="32" y2="50"/><line x1="24" y1="42" x2="24" y2="50"/>',
  weld:'<line x1="14" y1="50" x2="30" y2="34"/><polygon points="30,34 44,20 50,26 36,40"/><line x1="46" y1="16" x2="52" y2="10"/><line x1="50" y1="20" x2="56" y2="16"/>',
  endmill:'<rect x="26" y="8" width="12" height="20"/><rect x="24" y="28" width="16" height="24" rx="2"/><line x1="24" y1="34" x2="40" y2="34"/><line x1="24" y1="40" x2="40" y2="40"/><line x1="24" y1="46" x2="40" y2="46"/>',
  box:'<polygon points="8,20 32,10 56,20 32,30"/><line x1="8" y1="20" x2="8" y2="46"/><line x1="8" y1="46" x2="32" y2="56"/><line x1="32" y1="56" x2="32" y2="30"/><line x1="56" y1="20" x2="56" y2="46"/><line x1="56" y1="46" x2="32" y2="56"/>',
  networking:'<rect x="14" y="24" width="36" height="20" rx="2"/><line x1="22" y1="24" x2="22" y2="18"/><line x1="30" y1="24" x2="30" y2="18"/><line x1="34" y1="24" x2="34" y2="18"/><line x1="42" y1="24" x2="42" y2="18"/><line x1="22" y1="44" x2="22" y2="50"/><line x1="42" y1="44" x2="42" y2="50"/>',
  camera:'<rect x="10" y="22" width="34" height="24" rx="3"/><circle cx="27" cy="34" r="8"/><circle cx="27" cy="34" r="3"/><polygon points="44,26 54,20 54,48 44,42"/>',
  gear:'<circle cx="32" cy="32" r="10"/><line x1="32" y1="14" x2="32" y2="20"/><line x1="32" y1="44" x2="32" y2="50"/><line x1="14" y1="32" x2="20" y2="32"/><line x1="44" y1="32" x2="50" y2="32"/><line x1="19" y1="19" x2="23" y2="23"/><line x1="41" y1="41" x2="45" y2="45"/><line x1="45" y1="19" x2="41" y2="23"/><line x1="23" y1="41" x2="19" y2="45"/>'
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
