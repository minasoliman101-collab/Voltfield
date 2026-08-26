#!/usr/bin/env bash
# Removes the claim that Voltfield operates a distributor and mill network.
#
# It appeared seven times -- "sourced through Voltfield's distributor and mill
# network", "This index reflects Voltfield's own distributor and mill network".
# There is no such network. The site's own footer states that Voltfield stocks,
# sells and fulfils nothing, so these lines contradicted it directly, and the
# lead-time methodology attributed its figures to a supply network that does not
# exist -- which undermines exactly the page that invites citation.
#
# What the figures actually are: market reference data compiled from published
# ranges. That is defensible and is what the methodology page already says
# elsewhere.
set -euo pipefail
miss=0
sub() {
  local f=$1 old=$2 new=$3
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  $f :: ${old:0:60}"; miss=$((miss+1)); return 0; fi
  awk -v o="$old" -v n="$new" '{out="";rest=$0;while((i=index(rest,o))>0){out=out substr(rest,1,i-1) n;rest=substr(rest,i+length(o))}print out rest}' "$f" > "$f.t" && mv "$f.t" "$f"
  echo "  ok    $f"
}

sub index.html \
 'sourced through Voltfield&rsquo;s distributor and mill network.' \
 'with indicative market pricing published for budgeting.'
sub index.html \
 "sourced through Voltfield's distributor and mill network." \
 'with indicative market pricing published for budgeting.'

sub industrial-supply.html \
 "Yes &mdash; Industrial Supply is sourced through Voltfield's distributor and mill network, the same as every other sector on the site. Pricing shown is indicative, drawn from that network, not a live feed." \
 'Yes. Industrial Supply is documented the same way as every other sector on the site: configuration options, standards and indicative market pricing. Voltfield does not stock or supply any of it, and the pricing is a published reference range rather than a live feed.'
sub industrial-supply.html \
 "Yes — Industrial Supply is sourced through Voltfield's distributor and mill network, the same as every other sector on the site. Pricing shown is indicative, drawn from that network, not a live feed." \
 'Yes. Industrial Supply is documented the same way as every other sector on the site: configuration options, standards and indicative market pricing. Voltfield does not stock or supply any of it, and the pricing is a published reference range rather than a live feed.'
sub industrial-supply.html \
 "everyday plant and facility supplies, sourced through Voltfield's distributor and mill network." \
 'everyday plant and facility supplies, with indicative market pricing published for budgeting.'
sub industrial-supply.html \
 "Like every other sector on the site, Industrial Supply is sourced through Voltfield's distributor and mill network &mdash; pricing shown is indicative, drawn from that network, with more sourcing channels added as data allows." \
 'Like every other sector on the site, Industrial Supply is documented rather than supplied: pricing shown is an indicative market range published for budgeting, and the channel label records where that class of part is typically bought.'
sub industrial-supply.html \
 "Like every other sector on the site, Industrial Supply is sourced through Voltfield's distributor and mill network — pricing shown is indicative, drawn from that network, with more sourcing channels added as data allows." \
 'Like every other sector on the site, Industrial Supply is documented rather than supplied: pricing shown is an indicative market range published for budgeting, and the channel label records where that class of part is typically bought.'

sub lead-time-index.html \
 "Figures below are indicative market lead times and pricing ranges observed across Voltfield's distributor and mill network, compiled from the same data that drives lead-time flags across the catalog." \
 'Figures below are indicative market lead times and pricing ranges compiled from published market data, and are the same values that drive the lead-time flags across the catalog and the family reference pages.'
sub lead-time-index.html \
 'final lead time and price are confirmed when a specific configuration is quoted.' \
 'final lead time and price come from whoever actually supplies the equipment.'
sub lead-time-index.html \
 "This index reflects Voltfield's own distributor and mill network &mdash; if you're a buyer or distributor seeing a materially different lead time on a category above, tell us." \
 "This index is compiled from published market data &mdash; if you are a buyer or distributor seeing a materially different lead time on a category above, tell us."
sub lead-time-index.html \
 "This index reflects Voltfield's own distributor and mill network — if you're a buyer or distributor seeing a materially different lead time on a category above, tell us." \
 "This index is compiled from published market data — if you are a buyer or distributor seeing a materially different lead time on a category above, tell us."

sub methodology.html '<h3>The distributor and mill network</h3>' '<h3>Distribution channels</h3>'
sub methodology.html 'The distributor and mill network' 'Distribution channels'
echo; echo "  misses: $miss"
