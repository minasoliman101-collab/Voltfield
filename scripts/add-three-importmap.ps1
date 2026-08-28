# Adds the three.js import map to the pages that request ambient occlusion.
#
# Why it is needed: three ships examples/jsm compiled against a BARE specifier
# -- every postprocessing module starts `import { ... } from 'three'`. A browser
# cannot resolve a bare specifier on its own, so the dynamic import rejects, the
# library's catch swallows it and AO silently never engages. Verified against
# the live site: an ao:true viewer and an ao:false viewer of the same model came
# out pixel-identical, mean channel difference 0.
#
# The map points at the EXACT url voltfield-3d.js already imports, so the browser
# resolves both to one module record. A different url (or a rewriting CDN) would
# load a second copy of three, and instanceof checks across the two would fail.
#
# Placed immediately before the first <script> in <head>: an import map has to be
# parsed before any module graph is resolved, and only one is allowed per page.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# Every page that loads voltfield-3d.js, directly or through
# voltfield-component-viz.js. The map is needed by any examples/jsm module the
# library pulls -- postprocessing for AO, and RoundedBoxGeometry for bevelled
# edges -- and a page without it silently renders sharp-edged boxes while its
# neighbours render bevelled ones.
$PAGES = @(
  'index.html',                    # hero showcase
  'voltfield-part.html',           # part viewer
  'engineering-calculators.html',  # component inspector
  'voltfield-pcb-layout.html',
  'voltfield-pod-designer.html',
  'voltfield-rack-builder.html',
  'voltfield-sandbox.html',
  'specification-checklist.html',
  'voltfield-bom-generator.html',
  'voltfield-bom.html',
  'voltfield-eol.html',
  'voltfield-glossary-quiz.html',
  'voltfield-identify.html'
)

$MAP = @'
<!-- three.js import map. Required by the examples/jsm postprocessing modules
     that voltfield-3d.js loads for ambient occlusion: those are published with
     a bare `from 'three'` specifier, which a browser cannot resolve on its own.
     The url must match the one voltfield-3d.js imports, so the two resolve to a
     single module instance rather than two copies of three. -->
<script type="importmap">
{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js"}}
</script>
'@

$done = 0
foreach ($p in $PAGES) {
  $path = Join-Path $root $p
  if (-not (Test-Path $path)) { throw "missing page: $p" }
  $s = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($s -match 'type="importmap"') { Write-Host "skip (already has one): $p"; continue }

  # first <script> inside <head> -- the map must precede all of them
  $head = $s.IndexOf('<head')
  if ($head -lt 0) { throw "no <head> in $p" }
  $first = $s.IndexOf('<script', $head)
  if ($first -lt 0) { throw "no <script> in the head of $p" }

  $s = $s.Insert($first, $MAP + "`n")
  [System.IO.File]::WriteAllText($path, $s, $utf8)
  $done++
}
Write-Host "pages updated: $done"

# ---- assertions ----
$bad = @()
foreach ($p in $PAGES) {
  $s = [System.IO.File]::ReadAllText((Join-Path $root $p), [System.Text.Encoding]::UTF8)
  $n = ([regex]::Matches($s, 'type="importmap"')).Count
  if ($n -ne 1) { $bad += "$p : $n import maps (must be exactly 1)" ; continue }
  $im = $s.IndexOf('type="importmap"')
  # must sit inside <head>, and before every other script on the page
  if ($im -gt $s.IndexOf('</head>')) { $bad += "$p : import map outside <head>" }
  $firstOther = [regex]::Match($s, '<script(?![^>]*importmap)')
  if ($firstOther.Success -and $firstOther.Index -lt $im) {
    $bad += "$p : a <script> precedes the import map"
  }
  if ($s -notmatch [regex]::Escape('three@0.160.0/build/three.module.js')) {
    $bad += "$p : mapped url does not match the library's"
  }
}
if ($bad.Count) { $bad | ForEach-Object { Write-Warning $_ }; throw "$($bad.Count) problem(s)" }
Write-Host "verified: exactly one import map per page, inside <head>, ahead of every other script"
