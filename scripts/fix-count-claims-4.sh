#!/usr/bin/env bash
# Pass 4: the last "SKU" wording that describes Voltfield's OWN count.
#
# Deliberately NOT changed, because they refer to real manufacturer SKUs and are
# correct as written:
#   voltfield-identify.html  "distributors may add their own SKU on top"
#   voltfield-part.html      "not a manufacturer SKU or UPC"
#   404.html                 "ERR-NO-SKU" (error-code easter egg)
set -euo pipefail
miss=0
sub() {
  local f=$1 old=$2 new=$3
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  $f :: ${old:0:70}"; miss=$((miss+1)); return 0; fi
  local n; n=$(grep -oF -- "$old" "$f"|wc -l)
  awk -v o="$old" -v n="$new" '{while((i=index($0,o))>0){$0=substr($0,1,i-1) n substr($0,i+length(o))}print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  printf "  ok x%-2s %s :: %s\n" "$n" "$f" "${old:0:58}"
}

sub voltfield-insights.html 'SKUs across the four energy-infrastructure s' 'configurations across the four energy-infrastructure s'
sub voltfield-insights.html 'Share of SKUs by quoted lead time' 'Share of configurations by indicative lead time'
sub voltfield-insights.html 'Top 12 categories by SKU count, across all sectors' 'Top 12 categories by configuration count, across all sectors'
sub voltfield-insights.html 'Families, categories and SKUs per sector' 'Families, categories and configurations per sector'
sub voltfield-insights.html '>SKUs<' '>Configurations<'
sub voltfield-insights.html 'Short-lead SKUs are dominated by industrial-supply' 'Short-lead configurations are dominated by industrial-supply'

sub voltfield-part.html 'rt is one configuration of a family spanning many SKUs; change any option to reconfigure it' \
                        'rt is one configuration of a family spanning many; change any option to reconfigure it'
sub voltfield-part.html 'many SKUs in a family would otherwise share one d' 'many configurations in a family would otherwise share one d'

sub voltfield-supply-catalog.html 'configure exact SKUs and see full specs.' 'configure exact variants and see full specs.'
sub voltfield-supply-catalog.html '${fmt(f.ct)} SKUs in this family' '${fmt(f.ct)} configurations in this family'
sub voltfield-supply-catalog.html '${fmt(f.ct)} configurable SKUs &middot;' '${fmt(f.ct)} configurations &middot;'
sub voltfield-supply-catalog.html "'SKU Count'" "'Configurations'"

echo; echo "misses: $miss"
