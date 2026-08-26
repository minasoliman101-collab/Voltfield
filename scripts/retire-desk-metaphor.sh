#!/usr/bin/env bash
# Retires "desk" as the site's word for a catalog sector.
#
# It was used about forty times -- "the Storage desk covers...", "What's
# included in the Renewables desk?", "these desks carry MV switchgear". On a
# site that sells nothing and has nobody to talk to, a "desk" reads as a staffed
# sourcing desk. The footer column heading became "Sectors" already; this makes
# the prose agree.
#
# A handful went further than implication and invited contact with a person:
# "talk to the engineering desk", "Send to the identification desk", "use the
# engineering desk". Those are rewritten, not relabelled -- there is no desk to
# send anything to.
set -euo pipefail
n=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  b=$(md5sum "$f" | cut -d' ' -f1)
  perl -0pi -e '
    # --- CTAs implying a person: rewrite, do not relabel ---
    s{Send to the identification desk &rsaquo;}{Look it up in the spec library &rsaquo;}g;
    s{talk to the engineering desk &rarr;}{see the PCB reference &rarr;}g;
    s{use the engineering desk\.}{use the PCB layout tool.}g;
    # --- tool-page labels ---
    s{Voltfield &mdash; Custom PCB desk}{Voltfield &mdash; Custom PCB reference}g;
    s{Voltfield — Custom PCB desk}{Voltfield — Custom PCB reference}g;
    s{Voltfield &mdash; Obsolete &amp; EOL desk}{Voltfield &mdash; Obsolete &amp; EOL reference}g;
    s{Voltfield — Obsolete &amp; EOL desk}{Voltfield — Obsolete &amp; EOL reference}g;
    s{Voltfield &mdash; Part identification desk}{Voltfield &mdash; Part identification reference}g;
    s{Voltfield — Part identification desk}{Voltfield — Part identification reference}g;
    s{The desk behind every other build}{The sector behind every other build}g;
    # --- the generic sector sense ---
    s{\bdesks\b}{sectors}g;
    s{\bdesk\x27s\b}{sector\x27s}g;
    s{\bdesk\b}{sector}g;
  ' "$f"
  [ "$b" != "$(md5sum "$f" | cut -d' ' -f1)" ] && n=$((n+1))
done
echo "  pages updated: $n"
