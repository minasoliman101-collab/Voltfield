#!/usr/bin/env bash
# Groups the 13-item Tools dropdown, and drops the "Sourcing by sector /
# one supply chain" framing from the homepage.
#
# Thirteen flat links is a list, not a menu: nothing tells the reader whether
# "Part ID" and "Obsolete/EOL" are related, or which of them does what they
# came for. Three labelled groups -- design and practice, look something up,
# prepare to specify -- turn it into something scannable without removing a
# single tool.
#
# Search moves out of the dropdown; it is not a tool and belongs with the rest
# of the utility chrome.
set -euo pipefail
OLD='          <a href="free-tools.html">All Free Tools</a>
          <a href="voltfield-sandbox.html">Practice Sandbox</a>
          <a href="voltfield-pod-designer.html">POD &amp; Skid Designer</a>
          <a href="voltfield-rack-builder.html">Rack Elevation Builder</a>
          <a href="engineering-calculators.html">Calculators</a>
          <a href="voltfield-bom-generator.html">BOM Generator</a>
          <a href="voltfield-pcb.html">PCB Builder</a>
          <a href="voltfield-pcb-layout.html">PCB Layout Tool</a>
          <a href="voltfield-identify.html">Part ID</a>
          <a href="voltfield-eol.html">Obsolete/EOL</a>
          <a href="voltfield-glossary-quiz.html">Glossary Quiz</a>
          <a href="specification-checklist.html">RFQ Toolkit</a>
          <a href="site-search.html">Search</a>'
NEW='          <a href="free-tools.html" class="navdrop-all">All free tools</a>
          <span class="navdrop-grp">Calculate</span>
          <a href="engineering-calculators.html">Engineering calculators</a>
          <a href="voltfield-bom-generator.html">BOM generator</a>
          <span class="navdrop-grp">Design &amp; practice</span>
          <a href="voltfield-sandbox.html">One-line sandbox</a>
          <a href="voltfield-pod-designer.html">POD &amp; skid designer</a>
          <a href="voltfield-rack-builder.html">Rack elevation builder</a>
          <a href="voltfield-pcb.html">PCB builder</a>
          <a href="voltfield-pcb-layout.html">PCB layout tool</a>
          <span class="navdrop-grp">Look it up</span>
          <a href="voltfield-identify.html">Identify a part</a>
          <a href="voltfield-eol.html">Obsolete &amp; end-of-life</a>
          <a href="specification-checklist.html">RFQ readiness checklist</a>
          <a href="voltfield-glossary-quiz.html">Glossary quiz</a>'
n=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  b=$(md5sum "$f" | cut -d' ' -f1)
  awk -v o="$OLD" -v r="$NEW" 'BEGIN{RS="\x01"} {gsub(o,r)} {printf "%s",$0}' "$f" > "$f.t" && mv "$f.t" "$f"
  [ "$b" != "$(md5sum "$f" | cut -d' ' -f1)" ] && n=$((n+1))
done
echo "  dropdown regrouped on $n pages"
