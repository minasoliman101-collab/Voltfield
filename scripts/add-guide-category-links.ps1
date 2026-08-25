# Links each guide to the equipment category it belongs to.
#
# Measured before writing this: all 18 guides were linked FROM the category
# pages, and none linked back. The guides are the strongest topical pages on
# the site and the category pages are new, so the equity was flowing one way.
#
# Inserted before the provenance <aside> that every guide ends with -- checked
# that all 18 have exactly one -- so the block sits at the end of the article
# body rather than after the sourcing note.
#
# Markup is a plain <h2> + <ul> + a.inline, which every guide already styles
# (verified: 0 of 18 lack an .inline rule). Nothing new is added to the CSS.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# guide -> [category href, link text, why it follows on from the guide]
$MAP = [ordered]@{
  'guide-transformer-lead-times.html' = @('data-centers/transformers.html','Data Center Transformers',
    'the transformer families this applies to, with configurations, standards and current indicative lead times')
  'guide-transformer-nameplate.html' = @('data-centers/transformers.html','Data Center Transformers',
    'the families those nameplates belong to, and what separates them on paper')
  'guide-pad-mount-vs-gsu-transformers.html' = @('data-centers/transformers.html','Data Center Transformers',
    'both types side by side, with the ratings and lead times that decide between them')
  'guide-switchgear-compartments.html' = @('data-centers/switchgear.html','Data Center Switchgear',
    'the MV and LV lineups these compartment types appear in')
  'guide-arc-flash-boundary-basics.html' = @('data-centers/switchgear.html','Data Center Switchgear',
    'the equipment the boundary is calculated around, including arc-resistant options')
  'guide-short-circuit-studies-breaker-coordination.html' = @('data-centers/switchgear.html','Data Center Switchgear',
    'the breakers and lineups a coordination study is run against')
  'guide-liquid-vs-air-cooling.html' = @('data-centers/cooling.html','Data Center Cooling',
    'CDUs, CRAH units, rear-door exchangers and chillers, with lead times')
  'guide-pue-explained.html' = @('data-centers/cooling.html','Data Center Cooling',
    'the cooling equipment whose efficiency PUE is measuring')
  'guide-grounding-bonding-basics.html' = @('data-centers/power-distribution.html','Data Center Power Distribution',
    'the distribution equipment these grounding and bonding rules apply to')
  'guide-bess-fire-safety-nfpa-855.html' = @('battery-storage/bess-enclosures.html','BESS Enclosures and Modules',
    'the enclosures NFPA 855 separation distances and UL 9540A evidence apply to')
  'guide-bess-augmentation.html' = @('battery-storage/bess-enclosures.html','BESS Enclosures and Modules',
    'the modules and enclosures an augmentation plan adds capacity to')
  'guide-inverter-clipping-ratio.html' = @('renewables/solar-inverters.html','Solar Inverters',
    'string, central and hybrid inverters, and how architecture affects the ratio')
  'guide-feoc-compliance.html' = @('renewables/solar-inverters.html','Solar Inverters',
    'the inverter families where FEOC-clean sourcing has to be documented')
  'guide-buy-america-iija.html' = @('renewables/ac-collection.html','Renewable Plant AC Collection',
    'the transformers and switchgear where domestic-content rules bite hardest')
  'guide-grid-interconnection-process.html' = @('renewables/ac-collection.html','Renewable Plant AC Collection',
    'the collector and substation equipment the interconnection agreement governs')
  'guide-interconnection-ercot.html' = @('renewables/ac-collection.html','Renewable Plant AC Collection',
    'the long-lead collector and substation equipment to release against the study')
  'guide-interconnection-miso.html' = @('renewables/ac-collection.html','Renewable Plant AC Collection',
    'the long-lead collector and substation equipment to release against the study')
  'guide-interconnection-pjm.html' = @('renewables/ac-collection.html','Renewable Plant AC Collection',
    'the long-lead collector and substation equipment to release against the study')
}

$done = 0
foreach ($file in $MAP.Keys) {
  $path = Join-Path $root $file
  if (-not (Test-Path $path)) { throw "missing guide: $file" }
  $s = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

  if ($s -match 'class="catlink"') { Write-Host "skip (already linked): $file"; continue }

  $href = $MAP[$file][0]; $text = $MAP[$file][1]; $why = $MAP[$file][2]
  if (-not (Test-Path (Join-Path $root ($href -replace '/','\')))) { throw "target missing: $href" }

  $aside = $s.IndexOf('<aside')
  if ($aside -lt 0) { throw "no <aside> in $file" }

  $block = "<h2>Equipment category</h2>`n" +
           "<ul class=`"catlink`">`n" +
           "  <li><a class=`"inline`" href=`"$href`">$text</a> &mdash; $why.</li>`n" +
           "</ul>`n`n"

  $s = $s.Insert($aside, $block)
  [System.IO.File]::WriteAllText($path, $s, $utf8)
  $done++
}
Write-Host "guides updated: $done"

# ---- assertions ----
$bad = @()
foreach ($file in $MAP.Keys) {
  $s = [System.IO.File]::ReadAllText((Join-Path $root $file), [System.Text.Encoding]::UTF8)
  $href = $MAP[$file][0]
  if (([regex]::Matches($s, 'class="catlink"')).Count -ne 1) { $bad += "$file : catlink count != 1" }
  if ($s -notmatch [regex]::Escape('href="' + $href + '"')) { $bad += "$file : target link absent" }
  # the block must sit before the aside, not inside it
  if ($s.IndexOf('class="catlink"') -gt $s.IndexOf('<aside')) { $bad += "$file : block landed after <aside>" }
  # and inside <main>
  if ($s.IndexOf('class="catlink"') -lt $s.IndexOf('<main')) { $bad += "$file : block outside <main>" }
}
if ($bad.Count) { $bad | ForEach-Object { Write-Warning $_ }; throw "$($bad.Count) problem(s)" }
Write-Host "verified: one category link per guide, inside <main>, before the provenance aside"
