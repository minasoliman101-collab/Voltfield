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
