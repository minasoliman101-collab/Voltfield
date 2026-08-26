# Generates a category page per entry in category-intros.txt.
#
# WHY: the catalog has 81 categories and only 13 had a page. A category is the
# level a buyer actually searches at -- "data center switchgear", "transformer
# spare parts" -- sitting between the sector hub and the 243 family pages. Where
# no page existed, that whole tier of intent had nothing to land on and the
# family pages hung off the sector hub with nothing in between.
#
# These are fully static: the family table, lead times, price bands and
# standards are all rendered at build time from voltfield-catalog-data.js, so a
# crawler sees the same content a reader does with no script execution.
#
# Every figure comes from the catalog data. The written intro carries what a
# table cannot, which is the reason a page is generated only where one exists.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'parse-families.ps1')

$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$em   = [char]0x2014
$nd   = [char]0x2013

$SECTOR = @{
  dc   = @{ label='Data Centers';            page='data-centers.html';      dir='data-centers' }
  re   = @{ label='Renewables';              page='renewables.html';        dir='renewables' }
  bess = @{ label='Battery Storage';         page='battery-storage.html';   dir='battery-storage' }
  og   = @{ label='Oil & Gas';               page='oil-gas.html';           dir='oil-gas' }
  mro  = @{ label='Industrial Supply (MRO)'; page='industrial-supply.html'; dir='industrial-supply' }
}
$GUIDES = @(
  @{ re='transformer|bushing|tap changer|core|winding|insulat'; href='guide-transformer-nameplate.html';    t='How to Read a Transformer Nameplate' }
  @{ re='transformer|core|steel';                              href='guide-transformer-lead-times.html';   t='Why Transformer Lead Times Hit 3+ Years' }
  @{ re='switchgear|breaker|trip|relay|contact|arc';           href='guide-switchgear-compartments.html';  t='Metal-Clad vs Metal-Enclosed Switchgear' }
  @{ re='relay|breaker|trip|fault|protection|meter';           href='guide-short-circuit-studies-breaker-coordination.html'; t='Short-Circuit Studies & Breaker Coordination' }
  @{ re='ground|bond|surge|earth';                             href='guide-grounding-bonding-basics.html'; t='Grounding & Bonding Basics' }
  @{ re='ground|bond|arc|ppe';                                 href='guide-arc-flash-boundary-basics.html';t='Arc-Flash Boundary Basics' }
  @{ re='genset|engine|alternator|generator|fuel|exhaust';     href='guide-pue-explained.html';            t='PUE Explained' }
)

function Esc([string]$s) {
  if ($null -eq $s) { return '' }
  $s = $s -replace '&amp;','&'
  return ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;')
}
function EscJson([string]$s) {
  if ($null -eq $s) { return '' }
  $s = $s -replace '&amp;','&'
  return (($s -replace '\\','\\\\' -replace '"','\"') -replace '\s+',' ').Trim()
}
function Compact([double]$v, [string]$pu) {
  if ($pu -eq '/W' -or $pu -eq '/kWh') { if ($v -lt 1) { return '$' + $v.ToString('0.000') } else { return '$' + $v.ToString('0.00') } }
  if ($v -ge 1e6) { $m=$v/1e6; if ($m -ge 10) { return '$'+[math]::Round($m)+'M' } else { return '$'+($m.ToString('0.0') -replace '\.0$','')+'M' } }
  if ($v -ge 1e3) { return '$' + [math]::Round($v/1e3) + 'K' }
  if ($v -lt 10)  { return '$' + $v.ToString('0.00') }
  return '$' + [math]::Round($v).ToString('N0')
}

$fams = Get-Families (Join-Path $root 'voltfield-catalog-data.js')
$top   = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\chrome-top.html'), [System.Text.Encoding]::UTF8)
$hTail = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\head-tail.html'), [System.Text.Encoding]::UTF8)
$bot   = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\chrome-bot.html'), [System.Text.Encoding]::UTF8)

$written = 0
foreach ($line in [System.IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'category-intros.txt'), [System.Text.Encoding]::UTF8)) {
  if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
  $p = $line.Split('|')
  if ($p.Count -lt 7) { Write-Host "  skipping malformed line"; continue }
  $sec=$SECTOR[$p[0]]; $cat=$p[1]; $slug=$p[2]; $h1=$p[3]; $dek=$p[4]; $intro=$p[5]; $q=$p[6]

  $inCat = @($fams | Where-Object { $_.s -eq $p[0] -and $_.c -eq $cat } | Sort-Object n)
  if (-not $inCat) { Write-Host "  no families for $cat"; continue }
  $cfgTotal = ($inCat | Measure-Object combos -Sum).Sum
  $lws = @($inCat | Where-Object { $_.lw -gt 0 } | ForEach-Object { [int]$_.lw })
  $url = "https://voltfield.org/$($sec.dir)/$slug.html"

  # ---- family table ----
  $rows = ''
  foreach ($f in $inCat) {
    $axSum = ($f.ax | ForEach-Object { "$(Esc $_[0]): $((@($_[1..($_.Count-1)] | ForEach-Object { Esc $_ })) -join ' / ')" }) -join '<br>'
    $band  = if ($null -ne $f.lo) { (Compact $f.lo $f.pu) + " $nd " + (Compact $f.hi $f.pu) + $(if($f.pu){" <small>$(Esc $f.pu)</small>"}) } else { '' }
    $lt    = if ($f.lw -gt 0) { $c = if ($f.lw -le 12){'short'} elseif ($f.lw -le 52){'mid'} else {'long'}; "<span class=""lt $c"">~$([int]$f.lw) wk</span>" } else { '<span class="muted">n/a</span>' }
    $rows += "        <tr>`r`n"
    $rows += "          <td><b><a href=""/parts/$($f.slug).html"">$(Esc $f.n)</a></b>$($f.combos) documented configurations</td>`r`n"
    $rows += "          <td class=""num"">$axSum</td>`r`n"
    $rows += "          <td>$lt</td>`r`n"
    $rows += "          <td class=""num"">$band</td>`r`n"
    $rows += "          <td class=""num"">$((@($f.cmp | ForEach-Object { Esc $_ })) -join '<br>')</td>`r`n"
    $rows += "        </tr>`r`n"
  }

  # ---- related guides, matched on the whole category's keywords ----
  $hay = (($inCat | ForEach-Object { $_.n + ' ' + $_.kw }) -join ' ').ToLower() + ' ' + $cat.ToLower()
  $rel = "      <a href=""/$($sec.page)"">$(Esc $sec.label)</a>`r`n"
  $seen=@{}
  foreach ($g in $GUIDES) {
    if ($hay -match $g.re -and -not $seen.ContainsKey($g.href)) { $seen[$g.href]=$true; $rel += "      <a href=""/$($g.href)"">$(Esc $g.t)</a>`r`n"; if ($seen.Count -ge 3){break} }
  }

  $desc = "$($cat): the families, how each is specified, the standards they are built to, indicative lead times and market price bands. Reference data, nothing for sale."

  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine('<!DOCTYPE html>')
  [void]$sb.AppendLine('<html lang="en">')
  [void]$sb.AppendLine('<head>')
  [void]$sb.AppendLine('<meta charset="UTF-8">')
  [void]$sb.AppendLine('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  [void]$sb.AppendLine("<title>$(Esc $h1) | Voltfield</title>")
  [void]$sb.AppendLine("<link rel=""canonical"" href=""$url"">")
  [void]$sb.AppendLine("<meta name=""description"" content=""$(Esc $desc)"">")
  [void]$sb.AppendLine('<meta name="robots" content="index,follow">')
  [void]$sb.AppendLine('<meta property="og:type" content="website">')
  [void]$sb.AppendLine('<meta property="og:site_name" content="Voltfield">')
  [void]$sb.AppendLine("<meta property=""og:title"" content=""$(Esc $h1)"">")
  [void]$sb.AppendLine("<meta property=""og:description"" content=""$(Esc $desc)"">")
  [void]$sb.AppendLine('<meta name="twitter:card" content="summary_large_image">')
  [void]$sb.AppendLine('<script type="application/ld+json">')
  [void]$sb.AppendLine('{"@context":"https://schema.org","@graph":[')
  [void]$sb.AppendLine(' {"@type":"BreadcrumbList","itemListElement":[')
  [void]$sb.AppendLine('   {"@type":"ListItem","position":1,"name":"Home","item":"https://voltfield.org/"},')
  [void]$sb.AppendLine("   {""@type"":""ListItem"",""position"":2,""name"":""$(EscJson $sec.label)"",""item"":""https://voltfield.org/$($sec.page)""},")
  [void]$sb.AppendLine("   {""@type"":""ListItem"",""position"":3,""name"":""$(EscJson $cat)"",""item"":""$url""}")
  [void]$sb.AppendLine(' ]},')
  [void]$sb.AppendLine(" {""@type"":""CollectionPage"",""name"":""$(EscJson $h1)"",""description"":""$(EscJson $desc)"",""url"":""$url"",""isPartOf"":{""@type"":""WebSite"",""name"":""Voltfield"",""url"":""https://voltfield.org/""}},")
  [void]$sb.AppendLine(' {"@type":"FAQPage","mainEntity":[')
  [void]$sb.AppendLine("   {""@type"":""Question"",""name"":""$(EscJson $q)"",""acceptedAnswer"":{""@type"":""Answer"",""text"":""$(EscJson $intro)""}}")
  [void]$sb.AppendLine(' ]}')
  [void]$sb.AppendLine(']}')
  [void]$sb.AppendLine('</script>')
  [void]$sb.Append($hTail)
  [void]$sb.Append($top)
  [void]$sb.AppendLine('<main id="main" tabindex="-1">')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<section class="artban">')
  [void]$sb.AppendLine('  <div class="artban-in">')
  [void]$sb.AppendLine("    <div class=""eyebrow"">$(Esc $sec.label) &middot; Equipment Category</div>")
  [void]$sb.AppendLine("    <h1>$(Esc $h1)</h1>")
  [void]$sb.AppendLine("    <p class=""dek"">$(Esc $dek)</p>")
  [void]$sb.AppendLine('  </div>')
  [void]$sb.AppendLine('</section>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<nav class="crumb" aria-label="Breadcrumb">')
  [void]$sb.AppendLine('  <a href="/index.html">Home</a><span class="sep">/</span>')
  [void]$sb.AppendLine("  <a href=""/$($sec.page)"">$(Esc $sec.label)</a><span class=""sep"">/</span>")
  [void]$sb.AppendLine("  <span>$(Esc $cat)</span>")
  [void]$sb.AppendLine('</nav>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<div class="artwrap">')
  [void]$sb.AppendLine("  <h2>$(Esc $q)</h2>")
  [void]$sb.AppendLine("  <p>$(Esc $intro)</p>")
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine("  <h2>The $($inCat.Count) families in this category</h2>")
  [void]$sb.AppendLine("  <p>$($cfgTotal.ToString('N0')) documented configurations in total$(if($lws.Count){", with indicative lead times from $(($lws | Measure-Object -Minimum).Minimum) to $(($lws | Measure-Object -Maximum).Maximum) weeks"}). Each family links to its own reference page.</p>")
  [void]$sb.AppendLine('    <div class="tblwrap">')
  [void]$sb.AppendLine('    <table class="famtable">')
  [void]$sb.AppendLine('      <thead>')
  [void]$sb.AppendLine('        <tr><th>Family</th><th>How it is specified</th><th>Lead time</th><th>Indicative band</th><th>Standards</th></tr>')
  [void]$sb.AppendLine('      </thead>')
  [void]$sb.AppendLine('      <tbody>')
  [void]$sb.Append($rows)
  [void]$sb.AppendLine('      </tbody>')
  [void]$sb.AppendLine('    </table>')
  [void]$sb.AppendLine('    </div>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine("    <div class=""callout""><b>On these figures.</b> Price bands are market ranges for each family as a whole, published for budgeting $em they are not quotes, and Voltfield sells nothing. Lead times are indicative and move with the market; the <a href=""/lead-time-index.html"">Lead-Time Index</a> covers what is driving them.</div>")
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Related</h2>')
  [void]$sb.AppendLine('    <div class="rel">')
  [void]$sb.Append($rel)
  [void]$sb.AppendLine('    </div>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('</div>')
  [void]$sb.AppendLine('</main>')
  [void]$sb.Append($bot)

  $outDir = Join-Path $root $sec.dir
  if (-not (Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }
  [System.IO.File]::WriteAllText((Join-Path $outDir "$slug.html"), $sb.ToString(), $utf8)
  Write-Host ("  {0}/{1}.html  {2} families, {3} configs" -f $sec.dir, $slug, $inCat.Count, $cfgTotal)
  $written++
}
Write-Host ("category pages written: {0}" -f $written)
