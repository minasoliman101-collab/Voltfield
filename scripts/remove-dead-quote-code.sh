#!/usr/bin/env bash
# Removes the last of the quote-list machinery from the markup.
#
# Two things, both inert but both still shipping:
#
#   1. <a class="quotebtn" href="...?quote=1">SOURCING LIST <span id="quoteCount">0</span></a>
#      display:none via ordering-hidden.css, so no visitor sees it -- but it is
#      still a link in the HTML with "SOURCING LIST" as its anchor text and an
#      aria-label of "View sourcing list on catalog page", on a site that states
#      it sells nothing. A hidden link is also a poor signal in its own right.
#
#   2. The counter that reads localStorage["vf_quote"] to populate #quoteCount.
#      It is guarded with if(el), so it never errors -- but it runs on every page
#      load, touches storage for a feature that no longer exists, and on the 243
#      /parts/ pages the element it targets was never rendered at all. Those
#      pages inherited it from the footer template used to generate them.
#
# ordering-hidden.css keeps its .quotebtn rule: the catalog and part pages still
# build quote rows in JS, and hiding the controls there is deliberate.
set -euo pipefail
n_btn=0; n_js=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  before=$(md5sum "$f" | cut -d' ' -f1)
  # 1. the hidden sourcing-list button
  perl -0pi -e 's{[ \t]*<a class="quotebtn"[^>]*>.*?</a>\r?\n}{}gs' "$f"
  mid=$(md5sum "$f" | cut -d' ' -f1); [ "$before" != "$mid" ] && n_btn=$((n_btn+1))
  # 2. the counter IIFE, with its preceding comment line
  perl -0pi -e 's{[ \t]*/\* -+ quote-list counter[^\n]*\*/\r?\n}{}g' "$f"
  perl -0pi -e 's{[ \t]*\(function\(\)\{\s*try\{\s*const q=JSON\.parse\(localStorage\.getItem\("vf_quote"\)\|\|"\[\]"\);\s*const el=document\.getElementById\("quoteCount"\);\s*if\(el\)el\.textContent=Array\.isArray\(q\)\?q\.length:0;\s*\}catch\(e\)\{\}\s*\}\)\(\);\r?\n}{}gs' "$f"
  after=$(md5sum "$f" | cut -d' ' -f1); [ "$mid" != "$after" ] && n_js=$((n_js+1))
done
echo "  quotebtn removed from : $n_btn pages"
echo "  counter removed from  : $n_js pages"
