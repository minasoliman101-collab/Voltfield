#!/usr/bin/env bash
# Removes the fabricated dollar figures from the BOM generator.
#
# Every cost cell traced back to priceFor(), the interpolation removed from the
# catalog display earlier: it derives a per-configuration price from the average
# POSITION of each chosen option in its dropdown, which carries no engineering
# relationship to the configuration. bom-engine then multiplies that number by a
# material share and allocates it across components by weight.
#
# So the generator was presenting a per-component dollar breakdown -- unit cost,
# extended cost, a total "reconciling to assembly price" -- built on a figure
# with no basis. Unlike the catalog's prices, these were never hidden.
#
# What survives is the part that IS modelled and useful: component structure,
# quantities, materials, specs, and each item's RELATIVE share of the assembly.
# The relative allocation comes from per-item weights, which are
# engineering-typical for the class; it is only the multiplication by a fake
# price that made it fake.
set -euo pipefail
f=voltfield-bom-generator.html
sub() { grep -qF -- "$1" "$f" || { echo "  MISS: ${1:0:64}"; return 0; }; awk -v o="$1" -v n="$2" '{out="";rest=$0;while((i=index(rest,o))>0){out=out substr(rest,1,i-1) n;rest=substr(rest,i+length(o))}print out rest}' "$f" > "$f.t" && mv "$f.t" "$f"; echo "  ok"; }

# --- table headers: drop the two dollar columns, relabel the share column ---
sub '<th class="r">Unit cost (est.)</th>' ''
sub '<th class="r">Ext. cost (est.)</th>' ''
sub '<th>Unit cost (est.)</th>' ''
sub '<th>Ext. cost (est.)</th>' ''
sub '% of unit price' '% of assembly'

# --- component rows ---
sub '          <td class="c-cost r">${m$(x.unitCost)}</td>
          <td class="c-cost r">${m$(x.ext)}</td>
' ''
# --- group headers and overhead rows carried a dollar total ---
sub '<tr class="grp"><td colspan="8">${esc(g.g)}<span class="gx">${m$(g.ext)}</span></td></tr>' \
    '<tr class="grp"><td colspan="6">${esc(g.g)}</td></tr>'
sub 'Assembly, test &amp; logistics roll-up<span class="gx">${m$(bom.overhead.reduce((a,x)=>a+x.ext,0))}</span>' \
    'Assembly, test &amp; logistics roll-up'
sub '<tr class="grp"><td colspan="8">Assembly, test &amp; logistics roll-up' \
    '<tr class="grp"><td colspan="6">Assembly, test &amp; logistics roll-up'
