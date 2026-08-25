#!/usr/bin/env bash
# Repoints the sitewide "Guides & Insights" nav item at the new guides hub.
#
# It pointed at voltfield-insights.html, which is a charts page -- lead-time
# distribution and configuration mix. Useful, but not a guide index, and three
# of the eighteen guides were not linked from it at all. The site's largest
# content asset had no index page and no single sitewide entry point.
#
# guides.html is that index: 18 guides grouped by topic, the 5 sector hubs, the
# 12 equipment deep-dives, and the data pages. Insights keeps its own card there
# and its links elsewhere, so nothing loses its route.
#
# Relative and root-relative forms both appear (subdirectory pages use the
# latter), and the current-page variant carries class="on".
set -euo pipefail
changed=0
for f in $(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*'); do
  before=$(md5sum "$f" | cut -d' ' -f1)
  # depth-correct href: pages one directory deep keep the root-relative form
  perl -0pi -e '
    s{<a href="/voltfield-insights\.html">Guides &amp; Insights</a>}{<a href="/guides.html">Guides</a>}g;
    s{<a href="voltfield-insights\.html">Guides &amp; Insights</a>}{<a href="guides.html">Guides</a>}g;
    s{<a href="voltfield-insights\.html" class="on">Guides &amp; Insights</a>}{<a href="guides.html">Guides</a>}g;
    s{<a href="voltfield-insights\.html">Insights &amp; Guides</a>}{<a href="guides.html">Guides</a>}g;
    s{<a class="ctabtn" href="voltfield-insights\.html">SEE ALL GUIDES &rarr;</a>}{<a class="ctabtn" href="guides.html">SEE ALL GUIDES &rarr;</a>}g;
  ' "$f"
  after=$(md5sum "$f" | cut -d' ' -f1)
  [ "$before" != "$after" ] && changed=$((changed+1))
done
echo "  pages updated: $changed"
