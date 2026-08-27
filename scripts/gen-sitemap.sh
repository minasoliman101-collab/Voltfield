#!/usr/bin/env bash
# Regenerates sitemap.xml from the files actually on disk.
#
# The file had grown two formats: 57 original single-line entries with no
# <lastmod> at all, and 244 added later carrying one. Every lastmod that did
# exist was the same hardcoded date, which tells a crawler nothing -- the field
# exists so Google can prioritise what to re-fetch, and a value identical across
# hundreds of URLs carries no information.
#
# Now every entry is built the same way, and lastmod comes from the file's real
# last commit date, so it is correct by construction and updates itself.
#
# Existing priority and changefreq values are preserved per URL where the old
# file had them; anything new is classified by path.
set -euo pipefail

# --- harvest the old priority/changefreq per URL so nothing is lost ---
declare -A PRI FREQ
while IFS= read -r line; do
  loc=$(printf '%s' "$line" | grep -o '<loc>[^<]*</loc>' | sed 's|<loc>https://voltfield.org/||;s|</loc>||' || true)
  [ -z "$loc" ] && continue
  p=$(printf '%s' "$line" | grep -o '<priority>[^<]*' | sed 's/<priority>//' || true)
  c=$(printf '%s' "$line" | grep -o '<changefreq>[^<]*' | sed 's/<changefreq>//' || true)
  k="$loc"; [ -z "$k" ] && k="/"
  [ -n "$p" ] && PRI["$k"]="$p"
  [ -n "$c" ] && FREQ["$k"]="$c"
done < <(tr '\n' ' ' < sitemap.xml | sed 's|</url>|</url>\n|g')

classify_pri()  { case "$1" in "") echo 1.0;; guide-*) echo 0.8;; */*) echo 0.8;; guides.html) echo 0.9;; *) echo 0.7;; esac; }
classify_freq() { case "$1" in "") echo weekly;; *) echo monthly;; esac; }

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">' | sed 's|www.sitemap.org|www.sitemaps.org|'
  n=0
  while IFS= read -r f; do
    rel="${f#./}"
    # skip anything explicitly noindex, plus the 404
    grep -q 'content="noindex' "$f" && continue
    [ "$rel" = "404.html" ] && continue
    url="$rel"; [ "$rel" = "index.html" ] && url=""
    key="$url"; [ -z "$key" ] && key="/"
    d=$(git log -1 --format=%cs -- "$rel" 2>/dev/null || true)
    [ -z "$d" ] && d=$(date -r "$rel" +%F 2>/dev/null || date +%F)
    p="${PRI[$key]:-$(classify_pri "$url")}"
    c="${FREQ[$key]:-$(classify_freq "$url")}"
    printf '  <url>\n    <loc>https://voltfield.org/%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n  </url>\n' "$url" "$d" "$c" "$p"
    n=$((n+1))
  done < <(find . -name '*.html' -not -path './.git/*' -not -path './scripts/*' | sort)
  echo '</urlset>'
  echo "  urls written: $n" >&2
} > sitemap.new
mv sitemap.new sitemap.xml
