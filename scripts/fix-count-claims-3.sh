#!/usr/bin/env bash
# Pass 3: hero stat blocks, remaining prose, and the last of the "SKU" wording.
#
# Also fixes two lines on the insights page that still described the site as a
# supplier ("Every SKU is sourced through a distributor/mill network ... which
# network we source it through"). Voltfield does not source anything; the
# channel field records where this CLASS of part is typically distributed.
set -euo pipefail
miss=0
sub() {
  local f=$1 old=$2 new=$3
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  $f :: ${old:0:70}"; miss=$((miss+1)); return 0; fi
  local n; n=$(grep -oF -- "$old" "$f" | wc -l)
  awk -v o="$old" -v n="$new" '{while((i=index($0,o))>0){$0=substr($0,1,i-1) n substr($0,i+length(o))}print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  printf "  ok x%-2s %s :: %s\n" "$n" "$f" "${old:0:58}"
}

echo "== hero stat blocks =="
sub battery-storage.html '<div class="k">330</div><div class="l">Reference SKUs</div>' \
                         '<div class="k">212</div><div class="l">Configurations</div>'
sub oil-gas.html '<div class="k">87,574</div><div class="l">Oil &amp; gas SKUs</div>' \
                 '<div class="k">1,112</div><div class="l">Configurations</div>'
sub oil-gas.html '<div class="k">6,482</div><div class="l">Fittings &amp; flanges SKUs</div>' \
                 '<div class="k">163</div><div class="l">Fittings &amp; flanges</div>'
sub industrial-supply.html '<div class="k">196,142</div><div class="l">Fastener &amp; hardware SKUs</div>' \
                           '<div class="k">1,417</div><div class="l">Fasteners &amp; hardware</div>'

echo "== remaining prose =="
sub oil-gas.html 'we match it against 87,574 oilfield SKUs, new, rebuilt, or recertified.' \
                 'every line is matched against 1,112 oilfield configurations, new, rebuilt, or recertified.'
sub battery-storage.html "BMS list — we match it against 330 storage SKUs and price it at current \$/kWh benchmarks." \
                         "BMS list — every line is matched against 212 storage configurations, with current \$/kWh benchmark ranges."
sub industrial-supply.html "It's the largest single desk in the catalog by SKU count, and the one" \
                           "It's the largest single desk in the catalog by configuration count, and the one"
sub industrial-supply.html 'for SKU mix and lead-time distribution across the full catalog.' \
                           'for configuration mix and lead-time distribution across the full catalog.'

echo "== insights: wording + the last sourcing claims =="
sub voltfield-insights.html 'Catalog Insights — lead times and SKU mix at a glance' \
                            'Catalog Insights — lead times and configuration mix at a glance'
sub voltfield-insights.html 'SKUs by source and sector, top categori' 'Configurations by channel and sector, top categori'
sub voltfield-insights.html 'SKU counts by source and sector, top c' 'Configuration counts by channel and sector, top c'
sub voltfield-insights.html 'SKU counts by source and sector, the b' 'Configuration counts by channel and sector, the b'
sub voltfield-insights.html 'Every SKU is sourced through a distributor/mill network — share shown by which network we source it through' \
                            'Channel indicates where this class of part is typically distributed — Voltfield does not supply any of it'
sub voltfield-insights.html 'MRO SKUs mirrored from each distributor catalog' \
                            'MRO configurations by typical distribution channel'

echo "== stragglers =="
sub 404.html 'd back to the catalog to search configurable SKUs.' 'd back to the catalog to search configurations.'
sub engineering-calculators.html 'Search a wide range of configurable SKUs across' 'Search a wide range of configurations across'
sub voltfield-bom.html "very line against the catalog's configurable SKUs" "very line against the catalog's configurations"
sub voltfield-catalog-data.js '/* ===== OIL & GAS — 87,574 ===== */' '/* ===== OIL & GAS ===== */'
sub voltfield-catalog-data.js '/* Fasteners & Hardware — 196,142 */' '/* Fasteners & Hardware */'
sub voltfield-catalog-data.js '/* Raw Materials — 815,920 */' '/* Raw Materials */'
sub voltfield-insights.html '// Lead-time mix (by SKUs)' '// Lead-time mix (by configurations)'

echo; echo "misses: $miss"
