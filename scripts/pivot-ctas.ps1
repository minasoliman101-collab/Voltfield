# Rewrites the sales CTAs left behind by the half-finished pivot.
#
# ordering-hidden.css hid the buttons but could not touch the words, so pages
# still promised to "build your quote in one click" and to sell parts. These
# rewrites keep the same useful action -- look your BOM up against the
# reference specs -- and drop the transaction.
#
# SKU counts are left exactly as they are. They are data, not copy, and
# scripts/check-static-totals.mjs is what verifies them.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI); the em-dash is
# built from its code point.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$em = [char]0x2014

$SUBS = @(
  # --- the quote promise ---
  @("Paste your electrical BOM or spec sheet $em we match every line against 21,180 data center SKUs and build your quote in one click.",
    "Paste your electrical BOM or spec sheet $em every line is matched against 21,180 data center reference specs, so you can check part numbers, ratings and indicative lead times in one pass."),
  @("Paste your equipment list $em we match it against 22,996 renewables SKUs, flag FEOC-clean options, and build your quote in one click.",
    "Paste your equipment list $em every line is matched against 22,996 renewables reference specs, with FEOC-clean options flagged, so you can check what you have specified."),
  @("Paste it $em we match every line against 2,045,332 MRO SKUs and build your quote in one click.",
    "Paste it $em every line is matched against 2,045,332 MRO reference specs, so you can identify what you are looking at."),

  # --- buttons ---
  @('MATCH YOUR BOM &rarr;','LOOK UP YOUR BOM &rarr;'),
  @('BROWSE ALL DATA CENTER PARTS &rarr;','BROWSE THE DATA CENTER SPEC LIBRARY &rarr;'),
  @('BROWSE ALL RENEWABLES PARTS &rarr;','BROWSE THE RENEWABLES SPEC LIBRARY &rarr;'),
  @('BROWSE ALL BATTERY STORAGE PARTS &rarr;','BROWSE THE BATTERY STORAGE SPEC LIBRARY &rarr;'),
  @('BROWSE ALL OIL &amp; GAS PARTS &rarr;','BROWSE THE OIL &amp; GAS SPEC LIBRARY &rarr;'),
  @('BROWSE ALL INDUSTRIAL SUPPLY PARTS &rarr;','BROWSE THE INDUSTRIAL SUPPLY SPEC LIBRARY &rarr;'),

  # --- CTA headings: "Sourcing X?" implies we sell X. "Specifying" is what the
  #     reader is actually doing, and most of these headings already say it. ---
  @('<h3>Sourcing a transformer?</h3>','<h3>Specifying a transformer?</h3>'),
  @('<h3>Sourcing switchgear?</h3>','<h3>Specifying switchgear?</h3>'),
  @('<h3>Sourcing backup power?</h3>','<h3>Specifying backup power?</h3>'),
  @('<h3>Sourcing cooling equipment?</h3>','<h3>Specifying cooling equipment?</h3>'),
  @('<h3>Sourcing cable or busbar?</h3>','<h3>Specifying cable or busbar?</h3>'),
  @('<h3>Sourcing distribution equipment?</h3>','<h3>Specifying distribution equipment?</h3>'),
  @('<h3>Sourcing grounding &amp; bonding hardware?</h3>','<h3>Specifying grounding &amp; bonding hardware?</h3>'),
  @('<h3>Sourcing a FEOC-sensitive project?</h3>','<h3>Documenting a FEOC-sensitive project?</h3>'),
  @('<h3>Sourcing for a federally funded infrastructure project?</h3>','<h3>Working on a federally funded infrastructure project?</h3>'),
  @('<h3>Need a real lead-time quote?</h3>','<h3>Need lead times for a specific configuration?</h3>')
)

$counts = @{}; $touched = 0
$files = Get-ChildItem $root -Recurse -Include *.html -File |
         Where-Object { $_.FullName -notlike '*\.git\*' -and $_.FullName -notlike '*\scripts\*' }
foreach ($f in $files) {
  $s = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8); $o = $s
  foreach ($p in $SUBS) {
    if ($s.Contains($p[0])) {
      $counts[$p[0]] = $counts[$p[0]] + ([regex]::Matches($s, [regex]::Escape($p[0]))).Count
      $s = $s.Replace($p[0], $p[1])
    }
  }
  if ($s -ne $o) { [System.IO.File]::WriteAllText($f.FullName, $s, $utf8); $touched++ }
}
Write-Host "files changed: $touched"
Write-Host ("substitutions applied: {0} of {1} patterns matched" -f $counts.Count, $SUBS.Count)
foreach ($k in $counts.Keys) {
  $lbl = if ($k.Length -gt 48) { $k.Substring(0,48) + '...' } else { $k }
  Write-Host ("  {0,3}  {1}" -f $counts[$k], $lbl)
}

# ---- assertions ----
$bad = @()
foreach ($f in $files) {
  $s = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  foreach ($dead in @('build your quote','MATCH YOUR BOM','BROWSE ALL','<h3>Sourcing ')) {
    if ($s.Contains($dead)) { $bad += "$($f.Name): $dead" }
  }
}
if ($bad.Count) { $bad | Select-Object -First 10 | ForEach-Object { Write-Warning $_ }; throw "$($bad.Count) sales CTA(s) left" }
Write-Host "verified: no quote-building copy, no 'BROWSE ALL PARTS', no 'Sourcing X?' headings"
