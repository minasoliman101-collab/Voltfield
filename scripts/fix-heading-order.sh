#!/usr/bin/env bash
# Closes the h3 -> h5 gap in the shared footer.
#
# The footer labels its three columns with <h5> (Voltfield / Desks / Compliance)
# while page content stops at <h3>. That skips h4 on 281 pages, which breaks the
# document outline for anyone navigating by heading level.
#
# Verified before changing anything: every <h5> on the site is inside a footer,
# so the swap cannot disturb content headings. The CSS selector is scoped
# `footer h4`, which still beats a bare `h4` rule on specificity, so the styling
# is unchanged.
set -euo pipefail
m=0; c=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  b=$(md5sum "$f" | cut -d' ' -f1)
  perl -0pi -e 's{<h5>(.*?)</h5>}{<h4>$1</h4>}gs' "$f"
  perl -0pi -e 's{footer h5\{}{footer h4\{}g' "$f"
  [ "$b" != "$(md5sum "$f" | cut -d' ' -f1)" ] && m=$((m+1))
done
for f in *.css scripts/tpl/*.html; do
  [ -f "$f" ] || continue
  b=$(md5sum "$f" | cut -d' ' -f1)
  perl -0pi -e 's{footer h5\{}{footer h4\{}g; s{<h5>(.*?)</h5>}{<h4>$1</h4>}gs' "$f"
  [ "$b" != "$(md5sum "$f" | cut -d' ' -f1)" ] && c=$((c+1))
done
echo "  html updated : $m"
echo "  css/templates: $c"
