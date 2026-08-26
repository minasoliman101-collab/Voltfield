# Generates a landing page per calculator from calc-content.txt.
#
# WHY: 21 calculators live on one page, reachable only by anchor. "Voltage drop
# calculator" and "transformer sizing calculator" are among the highest-volume
# queries this site could plausibly rank for, and all of them pointed at a
# single 96KB URL whose title mentions none of them.
#
# The tool itself is NOT split. Every calculator shares one 28KB closure, and
# carving it up would be surgery on working code for no user benefit. Each
# landing page explains the calculation properly -- formula, variables, a worked
# example the reader can check against the tool, the governing standard, what
# the method does not account for, and the mistakes it invites -- then links
# straight to the live calculator.
#
# That is the difference between a landing page and a doorway page: this one
# answers the question on its own.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$em   = [char]0x2014

# The date shown on every page is the real last-commit date of the content these
# pages are generated from. A hand-typed "updated" date is decoration; this one
# cannot be wrong without the content actually changing.
Push-Location $root
$dataDateRaw = (git log -1 --format=%cs -- scripts/calc-content.txt 2>$null)
Pop-Location
if (-not $dataDateRaw) { $dataDateRaw = (Get-Date).ToString('yyyy-MM-dd') }
$dataDateISO = $dataDateRaw.Trim()
$dataDate    = ([datetime]::ParseExact($dataDateISO, 'yyyy-MM-dd', $null)).ToString('MMMM d, yyyy')
Write-Host ("content date: {0}" -f $dataDate)

$top   = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\chrome-top.html'), [System.Text.Encoding]::UTF8)
$hTail = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\head-tail.html'), [System.Text.Encoding]::UTF8)
$bot   = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'tpl\chrome-bot.html'), [System.Text.Encoding]::UTF8)

function EscJson([string]$s) {
  if ($null -eq $s) { return '' }
  $s = $s -replace '<[^>]+>','' -replace '&mdash;',[char]0x2014 -replace '&minus;','-' -replace '&times;','x' -replace '&asymp;','~'
  $s = $s -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>' -replace '&deg;',[char]0x00B0 -replace '&middot;',[char]0x00B7
  $s = $s -replace '&[a-z]+;',''
  $s = $s -replace '\\','\\\\' -replace '"','\"'
  return ($s -replace '\s+',' ').Trim()
}

# ---- parse the content file into records ----
$lines = [System.IO.File]::ReadAllLines((Join-Path $PSScriptRoot 'calc-content.txt'), [System.Text.Encoding]::UTF8)
$recs = New-Object System.Collections.ArrayList
$cur = $null; $sect = $null
foreach ($ln in $lines) {
  if ($ln -match '^\s*#') { continue }
  if ($ln -match '^===(.+)$') {
    if ($cur) { [void]$recs.Add($cur) }
    $p = $Matches[1].Split('|')
    $cur = [ordered]@{ slug=$p[0]; anchor=$p[1]; h1=$p[2]; title=$p[3]; desc=$p[4];
                       intro=@(); formula=@(); vars=@(); example=@(); standard=@(); limits=@(); mistakes=@(); related=@() }
    $sect = $null; continue
  }
  if ($ln -match '^--([a-z]+)\s*$') { $sect = $Matches[1]; continue }
  if ($cur -and $sect -and $ln.Trim() -ne '') { $cur[$sect] += $ln.Trim() }
}
if ($cur) { [void]$recs.Add($cur) }
Write-Host ("records parsed: {0}" -f $recs.Count)

$outDir = Join-Path $root 'calculators'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }

$written = 0
foreach ($r in $recs) {
  $url = "https://voltfield.org/calculators/$($r.slug).html"
  $toolUrl = "/engineering-calculators.html#$($r.anchor)"

  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine('<!DOCTYPE html>')
  [void]$sb.AppendLine('<html lang="en">')
  [void]$sb.AppendLine('<head>')
  [void]$sb.AppendLine('<meta charset="UTF-8">')
  [void]$sb.AppendLine('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
  # The site suffix is appended here rather than carried in the content file:
  # the record header is pipe-delimited and a title containing " | Voltfield"
  # split into an extra field, which silently pushed " Voltfield" into every
  # meta description.
  [void]$sb.AppendLine("<title>$($r.title) | Voltfield</title>")
  [void]$sb.AppendLine("<link rel=""canonical"" href=""$url"">")
  [void]$sb.AppendLine("<meta name=""description"" content=""$($r.desc)"">")
  [void]$sb.AppendLine('<meta name="robots" content="index,follow">')
  [void]$sb.AppendLine('<meta property="og:type" content="article">')
  [void]$sb.AppendLine('<meta property="og:site_name" content="Voltfield">')
  [void]$sb.AppendLine("<meta property=""og:title"" content=""$($r.h1)"">")
  [void]$sb.AppendLine("<meta property=""og:description"" content=""$($r.desc)"">")
  [void]$sb.AppendLine('<meta name="twitter:card" content="summary_large_image">')
  [void]$sb.AppendLine('<script type="application/ld+json">')
  [void]$sb.AppendLine('{"@context":"https://schema.org","@graph":[')
  [void]$sb.AppendLine(' {"@type":"BreadcrumbList","itemListElement":[')
  [void]$sb.AppendLine('   {"@type":"ListItem","position":1,"name":"Home","item":"https://voltfield.org/"},')
  [void]$sb.AppendLine('   {"@type":"ListItem","position":2,"name":"Calculators","item":"https://voltfield.org/engineering-calculators.html"},')
  [void]$sb.AppendLine("   {""@type"":""ListItem"",""position"":3,""name"":""$(EscJson $r.h1)"",""item"":""$url""}")
  [void]$sb.AppendLine(' ]},')
  [void]$sb.AppendLine(" {""@type"":""WebPage"",""name"":""$(EscJson $r.h1)"",""description"":""$(EscJson $r.desc)"",""url"":""$url"",""dateModified"":""$dataDateISO"",""isPartOf"":{""@type"":""WebSite"",""name"":""Voltfield"",""url"":""https://voltfield.org/""},""publisher"":{""@type"":""Organization"",""name"":""Voltfield"",""url"":""https://voltfield.org/""}},")
  [void]$sb.AppendLine(' {"@type":"FAQPage","mainEntity":[')
  [void]$sb.AppendLine("   {""@type"":""Question"",""name"":""What does the $(EscJson $r.h1.Replace(' Calculator','')) calculation account for?"",""acceptedAnswer"":{""@type"":""Answer"",""text"":""$(EscJson ($r.intro -join ' '))""}},")
  [void]$sb.AppendLine("   {""@type"":""Question"",""name"":""What does it not account for?"",""acceptedAnswer"":{""@type"":""Answer"",""text"":""$(EscJson ($r.limits -join ' '))""}}")
  [void]$sb.AppendLine(' ]}')
  [void]$sb.AppendLine(']}')
  [void]$sb.AppendLine('</script>')
  [void]$sb.Append($hTail)
  [void]$sb.Append($top)
  [void]$sb.AppendLine('<main id="main" tabindex="-1">')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<section class="artban">')
  [void]$sb.AppendLine('  <div class="artban-in">')
  [void]$sb.AppendLine('    <div class="eyebrow">Free Calculator &middot; No Signup</div>')
  [void]$sb.AppendLine("    <h1>$($r.h1)</h1>")
  [void]$sb.AppendLine("    <p class=""dek"">$($r.intro[0])</p>")
  [void]$sb.AppendLine('  </div>')
  [void]$sb.AppendLine('</section>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<nav class="crumb" aria-label="Breadcrumb">')
  [void]$sb.AppendLine('  <a href="/index.html">Home</a><span class="sep">/</span>')
  [void]$sb.AppendLine('  <a href="/engineering-calculators.html">Calculators</a><span class="sep">/</span>')
  [void]$sb.AppendLine("  <span>$($r.h1)</span>")
  [void]$sb.AppendLine('</nav>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('<div class="artwrap">')
  [void]$sb.AppendLine("  <div class=""ctaband""><div class=""ctaband-in"">")
  [void]$sb.AppendLine("    <div><h3>Run the numbers</h3><p>The working calculator is free and needs no signup.</p></div>")
  [void]$sb.AppendLine("    <a class=""ctabtn"" href=""$toolUrl"">OPEN THE CALCULATOR &rarr;</a>")
  [void]$sb.AppendLine('  </div></div>')
  [void]$sb.AppendLine('')
  if ($r.intro.Count -gt 1) { foreach ($p in $r.intro[1..($r.intro.Count-1)]) { [void]$sb.AppendLine("  <p>$p</p>") } }
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>The formula</h2>')
  [void]$sb.AppendLine("    <div class=""formula"">$($r.formula -join '<br>')</div>")
  [void]$sb.AppendLine('    <div class="tblwrap"><table class="famtable"><tbody>')
  foreach ($v in $r.vars) {
    $i = $v.IndexOf(' :: ')
    if ($i -lt 0) { continue }
    [void]$sb.AppendLine("      <tr><td class=""num""><b>$($v.Substring(0,$i))</b></td><td>$($v.Substring($i+4))</td></tr>")
  }
  [void]$sb.AppendLine('    </tbody></table></div>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Worked example</h2>')
  foreach ($p in $r.example) { [void]$sb.AppendLine("  <p>$p</p>") }
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Which standard governs this</h2>')
  foreach ($p in $r.standard) { [void]$sb.AppendLine("  <p>$p</p>") }
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>What this calculation does not account for</h2>')
  foreach ($p in $r.limits) { [void]$sb.AppendLine("  <p>$p</p>") }
  [void]$sb.AppendLine("    <div class=""callout""><b>This is a screening estimate.</b> It is here to get you to the right order of magnitude and the right conversation $em not to replace a stamped calculation by a qualified engineer.</div>")
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Common mistakes</h2>')
  foreach ($p in $r.mistakes) { [void]$sb.AppendLine("  <p>$p</p>") }
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('  <h2>Related</h2>')
  [void]$sb.AppendLine('    <div class="rel">')
  foreach ($l in $r.related) {
    $i = $l.IndexOf(' :: ')
    if ($i -lt 0) { continue }
    [void]$sb.AppendLine("      <a href=""$($l.Substring(0,$i))"">$($l.Substring($i+4))</a>")
  }
  [void]$sb.AppendLine("      <a href=""/engineering-calculators.html"">All 21 calculators</a>")
  [void]$sb.AppendLine('    </div>')
  [void]$sb.AppendLine('')
  # Provenance block, matching the pattern the guides use. The "what it is not"
  # line matters most here: a calculator page that does not state where its
  # method stops being valid invites a screening number into a real design.
  [void]$sb.AppendLine('  <aside class="provenance" aria-labelledby="prov-h">')
  [void]$sb.AppendLine('    <h2 id="prov-h">Scope &amp; sources</h2>')
  [void]$sb.AppendLine('    <dl>')
  [void]$sb.AppendLine("      <dt>What this covers</dt>")
  [void]$sb.AppendLine("      <dd>$($r.desc)</dd>")
  [void]$sb.AppendLine("      <dt>Based on</dt>")
  [void]$sb.AppendLine("      <dd><ul>$(($r.standard | ForEach-Object { "<li>$_</li>" }) -join '')</ul></dd>")
  [void]$sb.AppendLine("      <dt>What it is not</dt>")
  [void]$sb.AppendLine("      <dd>$($r.limits -join ' ') This is a screening estimate, not a stamped calculation.</dd>")
  [void]$sb.AppendLine("      <dt>Provenance</dt>")
  [void]$sb.AppendLine("      <dd>Last reviewed $dataDate. Written and maintained by the Voltfield editorial team &mdash; a small team rather than a named author, which is why estimates are attributed to Voltfield and labelled as estimates. Worked examples are arithmetic you can reproduce against the <a href=""$toolUrl"">live calculator</a>. See the <a href=""/methodology.html"">methodology page</a>.</dd>")
  [void]$sb.AppendLine('    </dl>')
  [void]$sb.AppendLine('  </aside>')
  [void]$sb.AppendLine('')
  [void]$sb.AppendLine('</div>')
  [void]$sb.AppendLine('</main>')
  [void]$sb.Append($bot)

  [System.IO.File]::WriteAllText((Join-Path $outDir "$($r.slug).html"), $sb.ToString(), $utf8)
  $written++
}
Write-Host ("calculator pages written: {0}" -f $written)
