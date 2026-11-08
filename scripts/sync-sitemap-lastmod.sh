#!/usr/bin/env bash
# Sets each sitemap <lastmod> from that file's real last commit date.
#
# Every entry carried the same hardcoded date, which tells a crawler nothing:
# lastmod exists so Google can prioritise what to re-fetch, and a value that is
# identical across 244 URLs carries no information. Worse, it goes stale the
# moment one page changes, at which point the whole file is asserting a date
# that is wrong for almost every URL in it.
#
# Reading it from git means it is correct by construction and updates itself.
# Files not yet committed fall back to their filesystem mtime.
set -euo pipefail
tmp=$(mktemp)
changed=0; missing=0
while IFS= read -r line; do
  if [[ "$line" =~ \<loc\>https://voltfield\.org/(.*)\</loc\> ]]; then
    cur="${BASH_REMATCH[1]}"
    printf '%s\n' "$line" >> "$tmp"
    continue
  fi
  if [[ "$line" =~ ^([[:space:]]*)\<lastmod\>.*\</lastmod\>$ ]] && [ -n "${cur:-}" ]; then
    indent="${BASH_REMATCH[1]}"
    path="$cur"; [ -z "$path" ] && path="index.html"
    d=$(git log -1 --format=%cs -- "$path" 2>/dev/null || true)
    [ -z "$d" ] && { d=$(date -r "$path" +%F 2>/dev/null || date +%F); missing=$((missing+1)); }
    printf '%s<lastmod>%s</lastmod>\n' "$indent" "$d" >> "$tmp"
    changed=$((changed+1))
    continue
  fi
  printf '%s\n' "$line" >> "$tmp"
done < sitemap.xml
mv "$tmp" sitemap.xml
echo "  lastmod entries rewritten: $changed"
echo "  fell back to mtime:        $missing"

# Second pass: let each page overrule the git date with the date it states
# itself.
#
# The pass above is correct by construction and wrong in practice. A commit
# touching a file is not a change to what the page says, and most commits here
# touch many files at once -- a vendored asset, a 3D model, a nav tweak, a
# sitewide find-and-replace. Run alone it had pushed 93 of 113 entries ahead of
# the date the page prints to the reader, some by over two months. lastmod is a
# hint a crawler decides whether to trust, and a feed that marks most of the
# site fresh on a day none of it changed teaches it not to.
#
# So the git date is demoted to a fallback: it survives only where a page
# states nothing (~3 of them). It is still worth computing, because it is the
# only signal those pages have.
echo "  reconciling against each page's own stated date..."
node "$(dirname "$0")/fix-sitemap-lastmod.mjs" --apply | sed 's/^/  /'
