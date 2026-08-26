#!/usr/bin/env bash
# Renames the user-facing "sourcing list" to "saved list".
#
# The feature is a list of parts held in browser localStorage. Its controls are
# suppressed by ordering-hidden.css, but the label still appeared in button
# text, toasts, aria-labels and the privacy policy -- describing a sourcing
# activity on a site that states it is not a route to any supplier.
#
# "Saved list" describes exactly what it is with no commercial implication.
# Nothing functional changes: element ids, the vf_quote storage key and every
# handler are untouched, so this is a labelling change only.
set -euo pipefail
n=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  b=$(md5sum "$f" | cut -d' ' -f1)
  perl -0pi -e '
    s{Sourcing lists}{Saved lists}g;
    s{sourcing lists}{saved lists}g;
    s{Sourcing list}{Saved list}g;
    s{sourcing list}{saved list}g;
    s{SOURCING LIST}{SAVED LIST}g;
  ' "$f"
  [ "$b" != "$(md5sum "$f" | cut -d' ' -f1)" ] && n=$((n+1))
done
echo "  pages relabelled: $n"
