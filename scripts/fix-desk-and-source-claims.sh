#!/usr/bin/env bash
# Removes the last language implying Voltfield sources equipment or staffs a desk.
#
#  - Four interconnection guides told the reader to "configure it on the
#    Renewables or Data Centers desk and get a real lead time". "Desk" reads as
#    a staffed sourcing desk, and "get a real lead time" implies someone
#    supplies one on request. Nobody does; the site publishes indicative figures.
#
#  - voltfield-eol.html opened with "We source three ways around end-of-life
#    equipment". Voltfield sources nothing. What the page actually documents is
#    the three routes that EXIST around obsolescence, which is useful and true.
#
#  - The footer column heading "Desks" listed the five sectors on 293 pages.
#    Same implication, so it becomes "Sectors".
#
# Left alone deliberately: "How we source & verify this" in the guide bylines.
# That is about sourcing information, not equipment, and it links to the
# methodology page -- correct as written.
set -euo pipefail
miss=0
sub() {
  local f=$1 old=$2 new=$3
  if ! grep -qF -- "$old" "$f"; then echo "  MISS  $f"; miss=$((miss+1)); return 0; fi
  awk -v o="$old" -v n="$new" '{out="";rest=$0;while((i=index(rest,o))>0){out=out substr(rest,1,i-1) n;rest=substr(rest,i+length(o))}print out rest}' "$f" > "$f.t" && mv "$f.t" "$f"
  echo "  ok    $f"
}

sub guide-grid-interconnection-process.html \
 'desk and get a real lead time before' \
 'reference and check its indicative lead time before'
sub guide-interconnection-ercot.html \
 'desk and get a real indicative lead time' \
 'reference and check its indicative lead time'
sub guide-interconnection-miso.html \
 'desk and get a real indicative lead time before' \
 'reference and check its indicative lead time before'
sub guide-interconnection-pjm.html \
 'desk and get a real indicative lead time before' \
 'reference and check its indicative lead time before'

sub voltfield-eol.html \
 'We source three ways around end-of-life equipment:' \
 'There are three routes around end-of-life equipment:'

# footer heading, sitewide
n=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  b=$(md5sum "$f" | cut -d' ' -f1)
  perl -0pi -e 's{<h4>Desks</h4>}{<h4>Sectors</h4>}g' "$f"
  [ "$b" != "$(md5sum "$f" | cut -d' ' -f1)" ] && n=$((n+1))
done
perl -0pi -e 's{<h4>Desks</h4>}{<h4>Sectors</h4>}g' scripts/tpl/chrome-bot.html
echo "  footer heading changed on $n pages (+ the parts template)"
echo; echo "  misses: $miss"
