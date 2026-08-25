#!/usr/bin/env bash
# Replaces the published SKU counts with the real configuration counts.
#
# The old figures came from a hand-typed ct: field (removed in the previous
# commit) that overstated each family's real configuration space by a median
# 30x. They were wrong twice over: the prose numbers (21,180 / 22,996 /
# 2,045,332) did not even match the sums that field produced (27,390 / 27,526 /
# 2,045,972), so no two places on the site agreed.
#
# Real figures, computed from the attribute axes:
#   dc   50 families  11 cats   1,326 configurations
#   re   42 families  10 cats     673
#   bess 20 families   7 cats     212
#   og   33 families   9 cats   1,112
#   mro  98 families  44 cats   8,106
#   ----------------------------------------------
#        243 families 81 cats  11,429
#
# "SKU" is also dropped in favour of "configuration". A SKU is a stock-keeping
# unit -- it implies purchasable inventory, which is exactly what this site no
# longer claims to have. The MRO "44 categories" claim was already correct and
# is left alone.
set -euo pipefail

sub() { # file  literal-old  literal-new
  local f=$1 old=$2 new=$3
  grep -qF -- "$old" "$f" || { echo "  MISS  $f :: ${old:0:70}"; return 1; }
  python_missing=1
  # literal replace via awk (no regex interpretation)
  awk -v o="$old" -v n="$new" '{
    while ((i = index($0, o)) > 0) { $0 = substr($0,1,i-1) n substr($0,i+length(o)) }
    print
  }' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  echo "  ok    $f :: ${old:0:60}"
}

echo "== data-centers.html =="
f=data-centers.html
sub $f "— 21,180 SKUs with real lead times." "— 1,326 documented configurations with indicative lead times."
sub $f "CDUs, and busway — 21,180 SKUs." "CDUs, and busway — 1,326 configurations across 50 equipment families."
sub $f "Data Centers · 21,180 SKUs" "Data Centers · 1,326 configurations"
sub $f '<div class="k">21,180</div><div class="l">Reference SKUs</div>' '<div class="k">1,326</div><div class="l">Configurations</div>'
sub $f "21,180 SKUs total" "1,326 configurations"
sub $f "matched against 21,180 data center reference specs" "matched against 1,326 data center reference configurations"

echo "== renewables.html =="
f=renewables.html
sub $f "— 22,996 SKUs including FEOC-clean sourcing options." "— 673 documented configurations including FEOC-clean options."
sub $f "and GSU transformers — 22,996 SKUs." "and GSU transformers — 673 configurations across 42 equipment families."
sub $f "Renewables · 22,996 SKUs" "Renewables · 673 configurations"
sub $f '<div class="k">22,996</div><div class="l">Reference SKUs</div>' '<div class="k">673</div><div class="l">Configurations</div>'
sub $f "22,996 SKUs total" "673 configurations"
sub $f "matched against 22,996 renewables reference specs" "matched against 673 renewables reference configurations"

echo "== industrial-supply.html =="
f=industrial-supply.html
sub $f "everyday plant and facility supplies. 2,045,332 SKUs." "everyday plant and facility supplies. 8,106 documented configurations."
sub $f "metalworking supplies — 2,045,332 SKUs across 44 categories." "metalworking supplies — 8,106 configurations across 44 categories."
sub $f "Industrial Supply (MRO) · 2,045,332 SKUs" "Industrial Supply (MRO) · 8,106 configurations"
sub $f '<div class="k">2,045,332</div><div class="l">Industrial supply SKUs</div>' '<div class="k">8,106</div><div class="l">Configurations</div>'
sub $f "2,045,332 SKUs across 44 categories —" "8,106 configurations across 44 categories —"
sub $f "matched against 2,045,332 MRO reference specs" "matched against 8,106 MRO reference configurations"

echo "== index.html =="
f=index.html
sub $f '<span class="n">21,180 SKUs</span>'    '<span class="n">1,326 configurations</span>'
sub $f '<span class="n">22,996 SKUs</span>'    '<span class="n">673 configurations</span>'
sub $f '<span class="n">2,045,332 SKUs</span>' '<span class="n">8,106 configurations</span>'
sub $f "Industrial Supply spans 2,045,332 SKUs across 44 categories, sourced through Voltfield's distributor and mill network. More sourcing channels can be added as data." \
       "Industrial Supply spans 8,106 documented configurations across 44 categories. Channel labels indicate where this class of part is typically distributed; Voltfield does not supply it."

echo "== voltfield-supply-catalog.html =="
f=voltfield-supply-catalog.html
sub $f "<b id=\"mTotal\">2,191,366</b> configurable SKUs" "<b id=\"mTotal\">11,429</b> configurations"
sub $f "<h1>Search configurable SKUs across five sectors</h1>" "<h1>Search 11,429 equipment configurations across five sectors</h1>"
sub $f 'Searchable, filterable catalog of configurable SKUs across' 'Searchable, filterable reference of 11,429 equipment configurations across'
sub $f '<span class="sub" id="resSub">configurable SKUs</span>' '<span class="sub" id="resSub">configurations</span>'
sub $f 'state.q?`configurable SKUs match' 'state.q?`configurations match'
sub $f ':`configurable SKUs · ${matched.length} families`' ':`configurations · ${matched.length} families`'
sub $f 'stat read "0 configurable SKUs"' 'stat read "0 configurations"'

echo "== voltfield-insights.html =="
f=voltfield-insights.html
sub $f 'configurable SKUs across <b id="fFam">243</b> product families' 'configurations across <b id="fFam">243</b> equipment families'
sub $f "l:'Configurable SKUs'" "l:'Configurations'"
