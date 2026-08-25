#!/usr/bin/env bash
# Pass 2: the per-category tiles and the remaining sector totals.
#
# Real configuration counts, computed from each family's attribute axes and
# reconciled against the sector totals (dc 1,326 / re 673 / bess 212 /
# og 1,112 / mro 8,106 = 11,429):
#
#   dc  Transformers            141   (published 1,320)
#   dc  Switchgear & Breakers   116   (published 1,798)
#   re  Inverters & PCS          42   (published   116)
#   re  Structural BOS           78   (published 1,704)
#   bess Storage Blocks          21   (published    96)
#   bess Power Conversion        21   (published    48)
#   og  Tubulars                142   (published 1,456)
#   og  Fittings & Flanges      163   (published 6,482)
#   mro Fasteners & Hardware  1,417   (published 196,142)
#   mro Raw Materials         1,809   (published 815,920)
#   mro Safety & PPE            156   (published   577)
#
# The unit word changes from "SKUs" to "configurations" in the same edit, which
# also means these replacements cannot cascade into one another (dc Switchgear
# becomes "116 configurations", which no longer matches the "116 SKUs" pattern
# that renewables Inverters & PCS still needs).
set -euo pipefail
miss=0
sub() {
  local f=$1 old=$2 new=$3
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  $f :: ${old:0:70}"; miss=$((miss+1)); return 0; fi
  local n; n=$(grep -oF -- "$old" "$f" | wc -l)
  awk -v o="$old" -v n="$new" '{while((i=index($0,o))>0){$0=substr($0,1,i-1) n substr($0,i+length(o))}print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  printf "  ok x%-2s %s :: %s\n" "$n" "$f" "${old:0:56}"
}

echo "== per-category tiles =="
sub data-centers.html '>1,320 SKUs' '>141 configurations'
sub data-centers.html '>1,798 SKUs' '>116 configurations'
sub index.html        '>1,320 SKUs' '>141 configurations'
sub index.html        '>1,798 SKUs' '>116 configurations'
sub renewables.html   '>116 SKUs'   '>42 configurations'
sub renewables.html   '>1,704 SKUs' '>78 configurations'
sub index.html        '>116 SKUs'   '>42 configurations'
sub index.html        '>1,704 SKUs' '>78 configurations'
sub battery-storage.html '>96 SKUs' '>21 configurations'
sub battery-storage.html '>48 SKUs' '>21 configurations'
sub index.html           '>96 SKUs' '>21 configurations'
sub index.html           '>48 SKUs' '>21 configurations'
sub oil-gas.html '>1,456 SKUs' '>142 configurations'
sub oil-gas.html '>6,482 SKUs' '>163 configurations'
sub index.html   '>1,456 SKUs' '>142 configurations'
sub index.html   '>6,482 SKUs' '>163 configurations'
sub industrial-supply.html '>196,142 SKUs' '>1,417 configurations'
sub industrial-supply.html '>815,920 SKUs' '>1,809 configurations'
sub industrial-supply.html '>577 SKUs'     '>156 configurations'
sub index.html '>196,142 SKUs' '>1,417 configurations'
sub index.html '>815,920 SKUs' '>1,809 configurations'
sub index.html '>577 SKUs'     '>156 configurations'

echo "== battery storage sector total =="
sub battery-storage.html "thermal management for BESS projects — 330 SKUs priced at today's \$/kWh benchmarks." \
                         "thermal management for BESS projects — 212 configurations with \$/kWh benchmark ranges."
sub battery-storage.html "thermal management — 330 SKUs built to NFPA 855 and UL 9540A." \
                         "thermal management — 212 configurations built to NFPA 855 and UL 9540A."
sub battery-storage.html "Battery Storage · 330 SKUs" "Battery Storage · 212 configurations"
sub battery-storage.html "thermal management — 330 SKUs built to NFPA 855 and UL 9540A, configu" \
                         "thermal management — 212 configurations built to NFPA 855 and UL 9540A, configu"
sub battery-storage.html "330 SKUs total" "212 configurations"
sub index.html '<span class="n">330 SKUs</span>' '<span class="n">212 configurations</span>'

echo "== oil & gas sector total =="
sub oil-gas.html "— new, rebuilt, or recertified — 87,574 SKUs." "— new, rebuilt, or recertified — 1,112 configurations."
sub oil-gas.html "and fittings — 87,574 SKUs across API 5CT/6A/7K/16A/Q1 specs" "and fittings — 1,112 configurations across API 5CT/6A/7K/16A/Q1 specs"
sub oil-gas.html "Oil &amp; Gas · 87,574 SKUs" "Oil &amp; Gas · 1,112 configurations"
sub oil-gas.html "frac valves and fittings — 87,574 SKUs across API" "frac valves and fittings — 1,112 configurations across API"
sub oil-gas.html "87,574 SKUs total" "1,112 configurations"
sub index.html '<span class="n">87,574 SKUs</span>' '<span class="n">1,112 configurations</span>'

echo "== MRO prose =="
sub industrial-supply.html "Raw Materials, with 815,920 SKUs, followed by Fasteners & Hardware at 196,142 SKUs." \
                           "Raw Materials, with 1,809 configurations, followed by Fasteners & Hardware at 1,417."
sub industrial-supply.html "Raw Materials, with 815,920 SKUs, followed by Fasteners &amp; Hardware at 196,142 SKUs." \
                           "Raw Materials, with 1,809 configurations, followed by Fasteners &amp; Hardware at 1,417."

echo "== insights static fallback (what a crawler sees before JS) =="
sub voltfield-insights.html '<b id="fTotal">2,191,366</b>' '<b id="fTotal">11,429</b>'

echo "== source comments and runtime wording =="
sub voltfield-catalog-data.js '/* ===== DATA CENTERS — 21,180 ===== */' '/* ===== DATA CENTERS ===== */'
sub voltfield-catalog-data.js '/* ===== RENEWABLES — 22,996 ===== */'   '/* ===== RENEWABLES ===== */'
sub voltfield-supply-catalog.html "['SKUs in family',it=" "['Configurations in family',it="
sub voltfield-supply-catalog.html '// Lead-time mix (by SKUs)' '// Lead-time mix (by configurations)'
sub voltfield-part.html 'family (${fmt(f.ct)} SKUs)' 'family (${fmt(f.ct)} configurations)'
sub voltfield-identify.html '${fmt(f.ct)} configurable SKUs' '${fmt(f.ct)} configurations'
sub voltfield-bom-generator.html '${fmt(x.f.ct)} SKUs' '${fmt(x.f.ct)} configurations'

echo
echo "misses: $miss"
