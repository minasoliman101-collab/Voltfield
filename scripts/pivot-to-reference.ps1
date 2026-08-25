# Pivots the site from sourcing-agent framing to pure engineering reference.
#
# The previous pivot (see ordering-hidden.css) hid the sales UI with CSS but
# deliberately left every page, script and word of copy intact. CSS cannot hide
# prose, so the site ended up describing two different businesses: a homepage
# offering free tools with nothing paywalled, and a footer on 31 pages calling
# itself an "independent sourcing agent for long-lead ... equipment".
#
# This finishes the job in the copy and the metadata. It does not delete data:
# the spec library and its indicative price ranges stay, reframed as benchmark
# reference -- the same standing the lead-time index already has.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# Only content files. Never touch filenames or urls -- the 2,355 lowercase
# "voltfield" occurrences are asset paths like voltfield-3d.js.
$files = Get-ChildItem $root -Recurse -Include *.html,*.js,*.json,*.xml,*.txt -File |
         Where-Object { $_.FullName -notlike '*\.git\*' -and $_.FullName -notlike '*\scripts\*' }

# ordered: longest / most specific first
$SUBS = @(
  # --- wordmark + tagline ---
  @('VOLTFIELD<small>SUPPLY CO. &mdash; SOURCING &amp; ENGINEERING REFERENCE</small>',
    'VOLTFIELD<small>ENGINEERING REFERENCE &amp; EQUIPMENT DATA</small>'),
  @('VOLTFIELD<small>SUPPLY CO. — SOURCING &amp; ENGINEERING REFERENCE</small>',
    'VOLTFIELD<small>ENGINEERING REFERENCE &amp; EQUIPMENT DATA</small>'),
  @('VOLTFIELD<small>SUPPLY CO. — SOURCING & ENGINEERING REFERENCE</small>',
    'VOLTFIELD<small>ENGINEERING REFERENCE & EQUIPMENT DATA</small>'),
  @('SUPPLY CO. &mdash; SOURCING &amp; ENGINEERING REFERENCE','ENGINEERING REFERENCE &amp; EQUIPMENT DATA'),
  @('SUPPLY CO. — SOURCING &amp; ENGINEERING REFERENCE','ENGINEERING REFERENCE &amp; EQUIPMENT DATA'),
  @('SUPPLY CO. — SOURCING & ENGINEERING REFERENCE','ENGINEERING REFERENCE & EQUIPMENT DATA'),

  # --- the sourcing-agent identity, wherever it is stated ---
  @('Independent sourcing agent for long-lead electrical, storage, oilfield, and MRO/industrial supply equipment. Pricing shown across the catalog is indicative market range, for reference only &mdash; actual pricing, availability, and lead time are set by the distributor, mill, or OEM fulfilling the order.',
    'An independent engineering reference for energy-infrastructure and industrial power equipment. Nothing here is for sale. Price ranges in the spec library are indicative market benchmarks published for budgeting and comparison &mdash; real pricing, availability and lead time come from the distributor, mill or OEM you buy from.'),
  @('Independent sourcing agent for energy-infrastructure and industrial MRO parts across data centers, renewables, battery storage, and oil &amp; gas.',
    'An independent engineering reference for energy-infrastructure and industrial power equipment across data centers, renewables, battery storage, and oil &amp; gas. Nothing here is for sale.'),
  @('Independent sourcing agent for energy-infrastructure and industrial MRO parts across data centers, renewables, battery storage, and oil & gas.',
    'An independent engineering reference for energy-infrastructure and industrial power equipment across data centers, renewables, battery storage, and oil & gas. Nothing here is for sale.'),

  # --- brand name. Bare "Voltfield"/"VOLTFIELD" is already correct; only the
  #     "Supply Co." suffix goes. ---
  @('VOLTFIELD Supply Co.','Voltfield'),
  @('Voltfield Supply Co.','Voltfield'),
  @('VOLTFIELD SUPPLY CO.','VOLTFIELD'),
  @('voltfield supply co','voltfield')
)

$counts = @{}
$touched = 0
foreach ($f in $files) {
  $s = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $before = $s
  foreach ($pair in $SUBS) {
    if ($s.Contains($pair[0])) {
      $n = ([regex]::Matches($s, [regex]::Escape($pair[0]))).Count
      $counts[$pair[0]] = $counts[$pair[0]] + $n
      $s = $s.Replace($pair[0], $pair[1])
    }
  }
  if ($s -ne $before) { [System.IO.File]::WriteAllText($f.FullName, $s, $utf8); $touched++ }
}

Write-Host "files changed: $touched"
foreach ($k in $counts.Keys) {
  $label = if ($k.Length -gt 54) { $k.Substring(0,54) + '...' } else { $k }
  Write-Host ("  {0,4}  {1}" -f $counts[$k], $label)
}

# ---- assertions ----
$bad = @()
foreach ($f in $files) {
  $s = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
  $rel = $f.FullName.Substring($root.Length + 1)
  foreach ($dead in @('Supply Co.','SUPPLY CO.','Independent sourcing agent')) {
    if ($s.Contains($dead)) { $bad += "$rel still contains: $dead" }
  }
}
if ($bad.Count) { $bad | Select-Object -First 12 | ForEach-Object { Write-Warning $_ }; throw "$($bad.Count) leftover(s)" }
Write-Host "verified: no 'Supply Co.' or 'sourcing agent' text remains"
