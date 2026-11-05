#!/usr/bin/env bash
# Regenerate vendor/three/build/three.module.min.js from the readable build
# beside it. The site has no build step and this is not one: the output is
# committed, and this script exists so the committed file can be reproduced
# and diffed against its source rather than being an opaque blob.
#
# Three ships r160 as 1,295KB of commented ES module. The browser lexes all of
# it before the first triangle, which on a mid-range phone is the single
# largest cost in loading the 3D showcase. Minified it is 652KB raw and 136KB
# over the wire under brotli, against 197KB for the readable build.
#
# Run from the repository root:  bash scripts/build-three.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=vendor/three/build/three.module.js
OUT=vendor/three/build/three.module.min.js
[ -f "$SRC" ] || { echo "missing $SRC" >&2; exit 1; }
npx --yes esbuild@0.24.0 "$SRC" --minify --legal-comments=none --outfile="$OUT"
printf 'source %s bytes -> minified %s bytes\n' "$(wc -c <"$SRC")" "$(wc -c <"$OUT")"
