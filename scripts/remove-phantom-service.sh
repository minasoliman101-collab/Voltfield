#!/usr/bin/env bash
# Removes a described service that does not exist.
#
# Eight indexed pages told the reader they could "save it to a sourcing list and
# send it over", and that the request "is routed to a person who connects you
# with the distributor, mill or OEM that can actually fulfil it".
#
# There is no such person and no such routing. The send controls are hidden by
# ordering-hidden.css, so a reader who tried to follow the instruction would
# find nothing to click. This is the same claim as the "sourcing team" line
# removed earlier; it survived on these eight pages.
#
# about.html is the worst of them: it opens by explaining that the storefront
# framing was rewritten, then asserts this flow as the CURRENT model, so the
# page appears to be describing an honest correction while restating the thing
# being corrected.
#
# Replacement points at what actually exists: the family reference pages.
set -euo pipefail
miss=0
sub() {
  local f=$1 old=$2 new=$3
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  $f"; miss=$((miss+1)); return 0; fi
  awk -v o="$old" -v n="$new" '{out="";rest=$0;while((i=index(rest,o))>0){out=out substr(rest,1,i-1) n;rest=substr(rest,i+length(o))}print out rest}' "$f" > "$f.t" && mv "$f.t" "$f"
  echo "  ok    $f"
}

REF='Every family has a reference page with its configuration axes, the standards it is built to, its indicative lead time and its market price band. Take the specification to whoever supplies it &mdash; Voltfield sells nothing and is not a route to any of it.'

sub about.html \
 'You can still configure a part, save it to a sourcing list, and send a request &mdash; it just gets routed to a person who connects you with the actual fulfilling distributor, mill, or OEM, rather than treated as a completed sale.' \
 'What replaced it is a reference: you can look up a family, see how it is specified, what standards apply, roughly what it costs and roughly how long it takes. There is no request to send and no one to send it to.'

sub data-center-electrical-procurement.html \
 'Configure a specification, save it to a sourcing list, and send it over. It is routed to a person who connects you with the distributor, mill or OEM that can actually fulfil it &mdash; Voltfield does not stock or ship equipment itself.' "$REF"

sub data-centers/backup-power.html \
 'Configure the generator or UPS specification, save it to a sourcing list, and send it over. It is routed to a person who connects you with the distributor or OEM that can fulfil it &mdash; Voltfield does not stock or ship equipment itself.' "$REF"

sub data-centers/cabling.html \
 'Configure the specification, save it to a sourcing list, and send it over. It is routed to a person who connects you with the distributor, mill or OEM that can fulfil it &mdash; Voltfield does not stock or ship equipment itself.' "$REF"

for p in cooling power-distribution; do
  sub "data-centers/$p.html" \
   'Configure the specification, save it to a sourcing list, and send it over. It is routed to a person who connects you with the distributor or OEM that can fulfil it &mdash; Voltfield does not stock or ship equipment itself.' "$REF"
done

sub data-centers/switchgear.html \
 'Configure the lineup, save it to a sourcing list, and send it over. It is routed to a person who connects you with the distributor or OEM that can fulfil it &mdash; Voltfield does not stock or ship equipment itself.' "$REF"

echo; echo "  misses: $miss"
