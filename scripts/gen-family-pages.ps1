# Generates one reference page per equipment family under /parts/.
#
# WHY: the catalog exposes 243 families and 11,429 configurations through two
# crawlable URLs. voltfield-part.html, which renders a single configuration, has
# zero inbound internal links -- it is reachable only by clicking a JS-rendered
# card, so nothing in that layer is indexable. 453 of the 472 part images never
# appear in an <img> tag at all.
#
# Each page carries only data that is real: the family's attribute axes, its
# standards, its indicative price band, its lead time, and a written
# introduction. Nothing is invented to fill a template. A family with no lead
# time in the data simply does not get a lead-time row.
#
# QUALITY GATE: a page is generated only for a family that has a written intro
# in family-intros.txt. Emitting 243 pages whose only difference is table data
# would be a doorway-page pattern, and would trade the fabrication problem this
# site just finished fixing for a thin-content one. Coverage grows as intros
# are written.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
. (Join-Path $PSScriptRoot 'parse-families.ps1')

$root  = Split-Path -Parent $PSScriptRoot
$utf8  = New-Object System.Text.UTF8Encoding($false)
$em    = [char]0x2014   # em dash
$nd    = [char]0x2013   # en dash

$SECTOR = @{
  dc   = @{ label='Data Centers';             page='data-centers.html';      color='#2B6CB0' }
  re   = @{ label='Renewables';               page='renewables.html';        color='#2E7D4F' }
  bess = @{ label='Battery Storage';          page='battery-storage.html';   color='#B7791F' }
  og   = @{ label='Oil & Gas';                page='oil-gas.html';           color='#9C4221' }
  mro  = @{ label='Industrial Supply (MRO)';  page='industrial-supply.html'; color='#5B6B7E' }
}

# category -> the existing cluster page that covers it, where one exists
$CLUSTER = @{
  'dc|Transformers'            = 'data-centers/transformers.html'
  'dc|Switchgear & Breakers'   = 'data-centers/switchgear.html'
  'dc|Backup Power'            = 'data-centers/backup-power.html'
  'dc|Cooling'                 = 'data-centers/cooling.html'
  'dc|Power Distribution'      = 'data-centers/power-distribution.html'
  'dc|Cabling & Busbar'        = 'data-centers/cabling.html'
  'dc|Transformer Components'  = 'data-centers/transformer-components.html'
  'dc|Switchgear Components'   = 'data-centers/switchgear-components.html'
  'dc|Genset Components'       = 'data-centers/genset-components.html'
  'dc|Grounding & Bonding'      = 'data-centers/grounding-bonding.html'
  'dc|Monitoring & Controls'    = 'data-centers/monitoring-controls.html'
  're|Inverters & PCS'         = 'renewables/solar-inverters.html'
  're|Inverter & PE Components'= 'renewables/solar-inverters.html'
  're|Combiners & Protection'  = 'renewables/dc-collection.html'
  're|GSU & MV Transformers'   = 'renewables/ac-collection.html'
  're|Wire & Cable'            = 'renewables/dc-collection.html'
  'bess|Power Conversion'      = 'battery-storage/pcs-inverters.html'
  'bess|Storage Blocks'        = 'battery-storage/bess-enclosures.html'
  'bess|Enclosures & Integration' = 'battery-storage/bess-enclosures.html'
  'bess|Battery Components'    = 'battery-storage/bess-enclosures.html'
  'bess|Fire Suppression & Safety' = 'battery-storage/bess-enclosures.html'
  'bess|Thermal Management'    = 'battery-storage/balance-of-plant.html'
  'bess|Controls (BMS/EMS)'    = 'battery-storage/balance-of-plant.html'
}

# keyword -> guide, for the "related reading" block. Matched against name+kw.
$GUIDES = @(
  @{ re='transformer|gsu|pad-mount|padmount';  href='guide-transformer-nameplate.html';    t='How to Read a Transformer Nameplate' }
  @{ re='transformer|gsu';                     href='guide-transformer-lead-times.html';   t='Why Transformer Lead Times Hit 3+ Years' }
  @{ re='pad-mount|padmount|gsu|step-up';      href='guide-pad-mount-vs-gsu-transformers.html'; t='Pad-Mount vs GSU Transformers' }
  @{ re='switchgear|metal-clad|breaker|mccb';  href='guide-switchgear-compartments.html';  t='Metal-Clad vs Metal-Enclosed Switchgear' }
  @{ re='breaker|mccb|relay|protection|fault'; href='guide-short-circuit-studies-breaker-coordination.html'; t='Short-Circuit Studies & Breaker Coordination' }
  @{ re='ground|bond|earthing';                href='guide-grounding-bonding-basics.html'; t='Grounding & Bonding Basics' }
  @{ re='arc.flash|ppe|nfpa 70e';              href='guide-arc-flash-boundary-basics.html';t='Arc-Flash Boundary Basics' }
  @{ re='cdu|crah|crac|chiller|cooling|liquid';href='guide-liquid-vs-air-cooling.html';    t='Liquid vs Air Cooling for AI Racks' }
  @{ re='ups|genset|generator|pue|rack pdu';   href='guide-pue-explained.html';            t='PUE Explained' }
  @{ re='inverter|pcs|mppt|clipping';          href='guide-inverter-clipping-ratio.html';  t='Inverter Clipping & DC:AC Ratio' }
  @{ re='battery|bess|dc block|lithium';       href='guide-bess-augmentation.html';        t='BESS Augmentation Explained' }
  @{ re='fire|suppress|nfpa 855|9540';         href='guide-bess-fire-safety-nfpa-855.html';t='BESS Fire Safety: NFPA 855 & UL 9540A' }
  @{ re='module|panel|tracker|feoc';           href='guide-feoc-compliance.html';          t='FEOC Compliance for Solar & Storage' }
)

function Esc([string]$s) {
  if ($null -eq $s) { return '' }
  # the source data already contains &amp; in some names; normalise then re-escape
  $s = $s -replace '&amp;','&'
  return ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;')
}
function EscAttr([string]$s) { return (Esc $s) }
function EscJson([string]$s) {
  if ($null -eq $s) { return '' }
  $s = $s -replace '&amp;','&'
  return ($s -replace '\\','\\\\' -replace '"','\"')
}

function Compact([double]$v, [string]$pu) {
  if ($pu -eq '/W' -or $pu -eq '/kWh') { if ($v -lt 1) { return '$' + $v.ToString('0.000') } else { return '$' + $v.ToString('0.00') } }
  if ($v -ge 1e6) { $m = $v/1e6; if ($m -ge 10) { return '$' + [math]::Round($m) + 'M' } else { return '$' + ($m.ToString('0.0') -replace '\.0$','') + 'M' } }
  if ($v -ge 1e3) { return '$' + [math]::Round($v/1e3) + 'K' }
  if ($v -lt 10)  { return '$' + $v.ToString('0.00') }
  return '$' + [math]::Round($v).ToString('N0')
}

# ---- load written intros ----
$introPath = Join-Path $PSScriptRoot 'family-intros.txt'
$intros = @{}
if (Test-Path $introPath) {
  foreach ($ln in [System.IO.File]::ReadAllLines($introPath, [System.Text.Encoding]::UTF8)) {
    if ($ln -match '^\s*#' -or $ln.Trim() -eq '') { continue }
    # key is "sector|Family Name", which itself contains a pipe, so the record
    # separator is ' :: ' rather than '|'
    $i = $ln.IndexOf(' :: '); if ($i -lt 1) { continue }
    $intros[$ln.Substring(0,$i).Trim()] = $ln.Substring($i+4).Trim()
  }
}

# The date shown on every page is the real last-commit date of the data these
# pages are generated from, resolved once. A hand-typed "updated" date is a
# decoration; this one cannot be wrong without the data actually changing.
Push-Location $root
$dataDateRaw = (git log -1 --format=%cs -- voltfield-catalog-data.js scripts/family-intros.txt 2>$null)
Pop-Location
if (-not $dataDateRaw) { $dataDateRaw = (Get-Date).ToString('yyyy-MM-dd') }
$dataDate  = ([datetime]::ParseExact($dataDateRaw.Trim(), 'yyyy-MM-dd', $null)).ToString('MMMM d, yyyy')
$dataDateISO = $dataDateRaw.Trim()
Write-Host ("reference data date: {0}" -f $dataDate)

$fams = Get-Families (Join-Path $root 'voltfield-catalog-data.js')
$top  = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\chrome-top.html'), [System.Text.Encoding]::UTF8)
$hTail= [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\head-tail.html'), [System.Text.Encoding]::UTF8)
$bot  = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\chrome-bot.html'), [System.Text.Encoding]::UTF8)

$outDir = Join-Path $root 'parts'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }

$written = 0; $skipped = 0; $urls = New-Object System.Collections.ArrayList
foreach ($f in $fams) {
  # Two MRO families share the name "Toolholding & Workholding" under different
  # categories, so sector|name is not unique. A category-qualified key wins where
  # one is supplied; otherwise fall back to the short form.
  $keyQ = "$($f.s)|$($f.c)|$($f.n)"
  $key  = "$($f.s)|$($f.n)"
  if     ($intros.ContainsKey($keyQ)) { $intro = $intros[$keyQ] }
  elseif ($intros.ContainsKey($key))  { $intro = $intros[$key] }
  else   { $skipped++; continue }

  $sec   = $SECTOR[$f.s]
  $name  = Esc $f.n
  $cat   = Esc $f.c

  # Two families share the name "Toolholding & Workholding". The parser already
  # prefixed the category onto the colliding slugs, so reuse that signal here:
  # a collided page qualifies its title, H1 and description with the category so
  # no two pages ship identical ones.
  $collided = $f.slug -ne (($f.n.ToLower() -replace '&amp;','and' -replace '&','and' -replace '[^a-z0-9]+','-').Trim('-'))
  $dispName = if ($collided) { "$name ($cat)" } else { $name }
  $url   = "https://voltfield.org/parts/$($f.slug).html"
  $band  = if ($null -ne $f.lo -and $null -ne $f.hi) { (Compact $f.lo $f.pu) + " $nd " + (Compact $f.hi $f.pu) } else { '' }

  # ---- axis cards ----
  $axCards = ''
  $axSummary = @()
  foreach ($a in $f.ax) {
    $label = Esc $a[0]
    $vals  = @($a[1..($a.Count-1)] | ForEach-Object { Esc $_ })
    $axCards += "      <div class=`"speccard`"><h3>$label</h3><p>$($vals -join ' &middot; ')</p></div>`r`n"
    $axSummary += "$label ($($vals.Count))"
  }

  # ---- reference rows: only what exists ----
  $rows = ''
  if ($band) { $rows += "          <tr><td><b>Indicative price band</b></td><td class=`"num`">$band$(if($f.pu){" <small>$(Esc $f.pu)</small>"})</td></tr>`r`n" }
  if ($f.lw -and $f.lw -gt 0) {
    # class names must match the shared stylesheet, which defines .lt.short /
    # .lt.mid / .lt.long (and their dark-mode variants) -- not ok/warn
    $ltClass = if ($f.lw -le 12) { 'short' } elseif ($f.lw -le 52) { 'mid' } else { 'long' }
    $rows += "          <tr><td><b>Indicative lead time</b></td><td class=`"num`"><span class=`"lt $ltClass`">~$([int]$f.lw) weeks</span></td></tr>`r`n"
  }
  $rows += "          <tr><td><b>Standards referenced</b></td><td class=`"num`">$((@($f.cmp | ForEach-Object { Esc $_ })) -join '<br>')</td></tr>`r`n"
  $rows += "          <tr><td><b>Documented configurations</b></td><td class=`"num`">$($f.combos.ToString('N0'))</td></tr>`r`n"
  $rows += "          <tr><td><b>Category</b></td><td class=`"num`">$cat</td></tr>`r`n"

  # ---- related links ----
  $rel = "      <a href=`"/$($sec.page)`">$(Esc $sec.label)</a>`r`n"
  $ck = "$($f.s)|$($f.c)"
  if ($CLUSTER.ContainsKey($ck)) { $rel += "      <a href=`"/$($CLUSTER[$ck])`">$cat</a>`r`n" }
  $hay = ($f.n + ' ' + $f.kw).ToLower()
  $seen = @{}
  foreach ($g in $GUIDES) {
    if ($hay -match $g.re -and -not $seen.ContainsKey($g.href)) {
      $seen[$g.href] = $true
      $rel += "      <a href=`"/$($g.href)`">$(Esc $g.t)</a>`r`n"
      if ($seen.Count -ge 3) { break }
    }
  }

  # Intrinsic dimensions are read from the file, not assumed. The first pass
  # hardcoded 640x420, which stretched every one of these square images and
  # reserved a box of the wrong shape.
  $imgTag = ''
  if ($f.img) {
    $imgPath = Join-Path $root ($f.img -replace '/','\')
    if (Test-Path $imgPath) {
      try {
        $bmp = [System.Drawing.Image]::FromFile($imgPath)
        $iw = $bmp.Width; $ih = $bmp.Height
        $bmp.Dispose()
      } catch { $iw = 340; $ih = 340 }
      # A WebP of every part image already exists alongside the JPG and is 34%
      # smaller across the set, but nothing was serving it. <picture> offers it
      # first and falls back to the JPG, so no browser loses the image.
      $webpRel  = $f.img -replace '\.jpg$','.webp'
      $webpPath = Join-Path $root ($webpRel -replace '/','\')
      if (Test-Path $webpPath) {
        $imgTag  = "    <picture>`r`n"
        $imgTag += "      <source srcset=`"/$webpRel`" type=`"image/webp`">`r`n"
        $imgTag += "      <img class=`"famimg`" src=`"/$($f.img)`" alt=`"$(EscAttr $f.n)`" width=`"$iw`" height=`"$ih`" loading=`"lazy`" decoding=`"async`">`r`n"
        $imgTag += "    </picture>`r`n"
      } else {
        $imgTag = "    <img class=`"famimg`" src=`"/$($f.img)`" alt=`"$(EscAttr $f.n)`" width=`"$iw`" height=`"$ih`" loading=`"lazy`" decoding=`"async`">`r`n"
      }
    }
  }

  $descName = if ($collided) { "$($f.n) ($($f.c))" } else { $f.n }
  $desc = "${descName}: configuration options, standards, indicative lead time and market price band. Reference data, nothing for sale."

  # ---- assemble ----
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine('<!DOCTYPE html>')
  [void]$sb.AppendLine('<html lang="en">')
  [void]$sb.AppendLine('<head>')
  [void]$sb.AppendLine('<meta charset="UTF-8">')
  [void]$sb.AppendLine('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  # Title: family name first, minimal boilerplate. The previous form appended
  # "-Specs, Standards & Lead Time | Voltfield" -- 40 characters of suffix that
  # pushed 224 of 243 titles past the ~60 Google renders, truncating the part
  # that actually distinguishes the page. This form leaves only 4 over.
  [void]$sb.AppendLine("<title>$dispName Specs | Voltfield</title>")
  [void]$sb.AppendLine("<link rel=`"canonical`" href=`"$url`">")
  [void]$sb.AppendLine("<meta name=`"description`" content=`"$(EscAttr $desc)`">")
  [void]$sb.AppendLine('<meta name="robots" content="index,follow">')
  [void]$sb.AppendLine('<meta property="og:type" content="article">')
  [void]$sb.AppendLine('<meta property="og:site_name" content="Voltfield">')
  [void]$sb.AppendLine("<meta property=`"og:title`" content=`"$name`">")
  [void]$sb.AppendLine("<meta property=`"og:description`" content=`"$(EscAttr $desc)`">")
  [void]$sb.AppendLine('<meta name="twitter:card" content="summary_large_image">')
  [void]$sb.AppendLine('<script type="application/ld+json">')
  [void]$sb.AppendLine('{"@context":"https://schema.org","@graph":[')
  [void]$sb.AppendLine(' {"@type":"BreadcrumbList","itemListElement":[')
  [void]$sb.AppendLine('   {"@type":"ListItem","position":1,"name":"Home","item":"https://voltfield.org/"},')
  [void]$sb.AppendLine("   {`"@type`":`"ListItem`",`"position`":2,`"name`":`"$(EscJson $sec.label)`",`"item`":`"https://voltfield.org/$($sec.page)`"},")
  [void]$sb.AppendLine("   {`"@type`":`"ListItem`",`"position`":3,`"name`":`"$(EscJson $f.n)`",`"item`":`"$url`"}")
  [void]$sb.AppendLine(' ]},')
  [void]$sb.AppendLine(" {`"@type`":`"WebPage`",`"name`":`"$(EscJson $f.n)`",`"description`":`"$(EscJson $desc)`",`"url`":`"$url`",`"dateModified`":`"$dataDateISO`",`"isPartOf`":{`"@type`":`"WebSite`",`"name`":`"Voltfield`",`"url`":`"https://voltfield.org/`"},`"publisher`":{`"@type`":`"Organization`",`"name`":`"Voltfield`",`"url`":`"https://voltfield.org/`"}}")
  [void]$sb.AppendLine(']}')
  [void]$sb.AppendLine('</script>')
  [void]$sb.Append($hTail)
  [void]$sb.Append($top)
  [void]$sb.AppendLine('<main id="main" tabindex="-1">')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<section class="artban">')
  [void]$sb.AppendLine('  <div class="artban-in">')
  [void]$sb.AppendLine("    <div class=`"eyebrow`">$(Esc $sec.label) &middot; Equipment Family</div>")
  [void]$sb.AppendLine("    <h1>$dispName</h1>")
  [void]$sb.AppendLine("    <p class=`"dek`">$(Esc $intro)</p>")
  [void]$sb.AppendLine('  </div>')
  [void]$sb.AppendLine('</section>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<nav class="crumb" aria-label="Breadcrumb">')
  [void]$sb.AppendLine('  <a href="/index.html">Home</a><span class="sep">/</span>')
  [void]$sb.AppendLine("  <a href=`"/$($sec.page)`">$(Esc $sec.label)</a><span class=`"sep`">/</span>")
  [void]$sb.AppendLine("  <span>$name</span>")
  [void]$sb.AppendLine('</nav>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<div class="artwrap">')
  [void]$sb.Append($imgTag)
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>How this family is specified</h2>')
  [void]$sb.AppendLine("  <p>$($f.ax.Count) attribute $(if($f.ax.Count -eq 1){'axis'}else{'axes'}) describe this family $em $($axSummary -join ', ') $em which together give $($f.combos.ToString('N0')) documented configuration$(if($f.combos -ne 1){'s'}).</p>")
  [void]$sb.AppendLine('    <div class="specgrid">')
  [void]$sb.Append($axCards)
  [void]$sb.AppendLine('    </div>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Reference data</h2>')
  [void]$sb.AppendLine('    <div class="tblwrap">')
  [void]$sb.AppendLine('    <table class="famtable">')
  [void]$sb.AppendLine('      <tbody>')
  [void]$sb.Append($rows)
  [void]$sb.AppendLine('      </tbody>')
  [void]$sb.AppendLine('    </table>')
  [void]$sb.AppendLine('    </div>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine("    <div class=`"callout`"><b>On these figures.</b> The price band is the market range for this family as a whole, published for budgeting $em it is not a quote, and Voltfield sells nothing. Lead time is indicative and moves with the market; check the <a href=`"/lead-time-index.html`">Lead-Time Index</a> for what is driving it.</div>")
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Related</h2>')
  [void]$sb.AppendLine('    <div class="rel">')
  [void]$sb.Append($rel)
  [void]$sb.AppendLine('    </div>')
  [void]$sb.AppendLine('')
  # Provenance block, matching the pattern the guides already use. Says what the
  # page covers, what it is built from, what it explicitly is NOT, and when the
  # underlying data last changed. The date is the source file's real last commit
  # date, so it cannot drift into being decorative.
  [void]$sb.AppendLine('  <aside class="provenance" aria-labelledby="prov-h">')
  [void]$sb.AppendLine('    <h2 id="prov-h">Scope &amp; sources</h2>')
  [void]$sb.AppendLine('    <dl>')
  [void]$sb.AppendLine("      <dt>What this covers</dt>")
  [void]$sb.AppendLine("      <dd>How $name is specified, the standards it is built to, its indicative lead time and its market price band.</dd>")
  [void]$sb.AppendLine("      <dt>Based on</dt>")
  [void]$sb.AppendLine("      <dd><ul><li>Voltfield's own equipment reference data &mdash; $($f.ax.Count) attribute $(if($f.ax.Count -eq 1){'axis'}else{'axes'}) giving $($f.combos.ToString('N0')) documented configuration$(if($f.combos -ne 1){'s'})</li><li>$((@($f.cmp | ForEach-Object { Esc $_ })) -join '; ') &mdash; the standards this family is built and tested to</li><li>Published market ranges for the price band and lead time</li></ul></dd>")
  [void]$sb.AppendLine("      <dt>What it is not</dt>")
  [void]$sb.AppendLine("      <dd>Not a quote, an offer, or a live inventory feed. The price band is a market range for the family as a whole and the lead time is directional. Voltfield sells nothing and is not a route to anyone who does.</dd>")
  [void]$sb.AppendLine("      <dt>Provenance</dt>")
  [void]$sb.AppendLine("      <dd>Reference data last updated $dataDate. Compiled and maintained by the Voltfield editorial team &mdash; a small team rather than a named author, which is why figures are attributed to Voltfield and labelled as estimates where they are estimates. See the <a href=""/methodology.html"">methodology page</a> for how each number is derived.</dd>")
  [void]$sb.AppendLine('    </dl>')
  [void]$sb.AppendLine('  </aside>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <div class="ctaband"><div class="ctaband-in">')
  [void]$sb.AppendLine("    <h3>Every configuration in this family</h3>")
  [void]$sb.AppendLine("    <p>Filter the spec library to $name and step through all $($f.combos.ToString('N0')) of them.</p>")
  [void]$sb.AppendLine("    <a class=`"ctabtn`" href=`"/voltfield-supply-catalog.html?q=$([uri]::EscapeDataString($f.n))`">OPEN THE SPEC LIBRARY &rarr;</a>")
  [void]$sb.AppendLine('  </div></div>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('</div>')
  [void]$sb.AppendLine('</main>')
  [void]$sb.Append($bot)

  [System.IO.File]::WriteAllText((Join-Path $outDir "$($f.slug).html"), $sb.ToString(), $utf8)
  [void]$urls.Add("/parts/$($f.slug).html")
  $written++
}

Write-Host ("pages written : {0}" -f $written)
Write-Host ("skipped (no intro yet) : {0}" -f $skipped)
[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot 'generated-parts.txt'), $urls, $utf8)
