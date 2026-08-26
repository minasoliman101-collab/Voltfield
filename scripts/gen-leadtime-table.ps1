# Publishes the complete lead-time dataset on lead-time-index.html.
#
# The page already carried "How to cite this index" and "Embed this data on your
# site" -- it is positioned as a citable reference -- but published only 14
# hand-picked rows across five sector tables, while the catalog holds an
# indicative lead time for 235 of its 243 families. A page inviting citation
# should publish the data it is citing.
#
# The 14 curated rows stay: they are the editorial headline, and several of them
# carry market colour (\"Sold out through 2028\", \"2029+ delivery slots\") that
# is not in the structured data. This adds the full table underneath, grouped by
# sector, every row linking to that family's reference page.
#
# Rendered at build time from voltfield-catalog-data.js, so the figures cannot
# drift from the family and category pages -- one source, three renderings.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'parse-families.ps1')

$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$page = Join-Path $root 'lead-time-index.html'
$marker = 'id="full-index"'

$SEC = [ordered]@{
  dc   = @{ label='Data Centers';            var='--dc' }
  re   = @{ label='Renewables';              var='--re' }
  bess = @{ label='Battery Storage';         var='--bess' }
  og   = @{ label='Oil & Gas';               var='--og' }
  mro  = @{ label='Industrial Supply (MRO)'; var='--mro' }
}
function Esc([string]$s) { if($null -eq $s){return ''}; $s=$s -replace '&amp;','&'; return ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;') }

$fams = Get-Families (Join-Path $root 'voltfield-catalog-data.js')
$withLead = @($fams | Where-Object { $_.lw -gt 0 })
$lws = @($withLead | ForEach-Object { [int]$_.lw })

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('')
[void]$sb.AppendLine("  <h2 id=""full-index"">The full index: every family with a published lead time</h2>")
[void]$sb.AppendLine("  <p>$($withLead.Count) of the $($fams.Count) equipment families in the reference carry an indicative lead time. They are listed in full below, longest first within each sector, each linking to that family's page. The remaining $($fams.Count - $withLead.Count) are commodity items stocked and shipped to order, where a single lead-time figure would not mean anything.</p>")
[void]$sb.AppendLine("  <p class=""ltnote"">Every figure here is the same value rendered on the family and category pages &mdash; one source, so they cannot drift apart. All are indicative reference figures, not quotes.</p>")

foreach ($k in $SEC.Keys) {
  $rows = @($withLead | Where-Object { $_.s -eq $k } | Sort-Object @{e={[int]$_.lw}; Descending=$true}, n)
  if (-not $rows) { continue }
  $secLws = @($rows | ForEach-Object { [int]$_.lw })
  [void]$sb.AppendLine("  <h3>$(Esc $SEC[$k].label)</h3>")
  [void]$sb.AppendLine("  <p class=""ltsub"">$($rows.Count) families &middot; $(($secLws | Measure-Object -Minimum).Minimum) to $(($secLws | Measure-Object -Maximum).Maximum) weeks</p>")
  [void]$sb.AppendLine("  <div class=""idxwrap""><table class=""idxtable"" style=""--SECCOLOR:var($($SEC[$k].var))"">")
  [void]$sb.AppendLine('    <thead><tr><th>Equipment family</th><th>Category</th><th>Indicative lead time</th></tr></thead>')
  [void]$sb.AppendLine('    <tbody>')
  foreach ($f in $rows) {
    $w = [int]$f.lw
    $cls = if ($w -le 12) { 'short' } elseif ($w -le 52) { 'mid' } else { 'long' }
    [void]$sb.AppendLine("      <tr><td><a href=""/parts/$($f.slug).html"">$(Esc $f.n)</a></td><td>$(Esc $f.c)</td><td><span class=""lt $cls"">$w wk</span></td></tr>")
  }
  [void]$sb.AppendLine('    </tbody>')
  [void]$sb.AppendLine('  </table></div>')
}
[void]$sb.AppendLine('')

$html = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)

# remove a previously generated block so this is re-runnable
$rxOld = [regex]'(?s)\n  <h2 id="full-index">.*?(?=\n  <h2)'
if ($rxOld.IsMatch($html)) { $html = $rxOld.Replace($html, "`n", 1); Write-Host 'replaced previous block' }

$anchor = '  <h2>Why lead times are the real constraint</h2>'
if (-not $html.Contains($anchor)) { throw 'insertion anchor not found' }
$html = $html.Replace($anchor, $sb.ToString() + $anchor)

# small styles for the two new caption classes, appended to the page's own block
if ($html -notmatch '\.ltsub\{') {
  $css = ".ltsub{font-family:var(--mono);font-size:11px;color:var(--slate);margin:2px 0 8px}`r`n.ltnote{font-family:var(--mono);font-size:11.5px;color:var(--slate);margin:0 0 18px}`r`n"
  $html = [regex]::Replace($html, '(?s)(\n</style>)', "`r`n$css`$1", 1)
}

[System.IO.File]::WriteAllText($page, $html, $utf8)
Write-Host ("rows published: {0} across {1} sectors" -f $withLead.Count, ($withLead | Group-Object s).Count)
Write-Host ("lead-time range: {0} to {1} weeks" -f ($lws | Measure-Object -Minimum).Minimum, ($lws | Measure-Object -Maximum).Maximum)
