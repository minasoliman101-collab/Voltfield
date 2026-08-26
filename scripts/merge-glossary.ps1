# Merges new glossary terms in, re-sorts the whole set alphabetically, and
# regenerates the DefinedTerm structured data from the same source.
#
# The glossary had 21 terms. Every one is static HTML (the page's search index
# is built FROM the DOM, not the other way round), so the terms were always
# crawlable -- but 21 is thin for a page whose whole value is long-tail
# definition queries.
#
# The JSON-LD is rebuilt from the rendered terms rather than maintained by hand,
# so the markup and the structured data cannot drift apart: every DefinedTerm
# corresponds to a term that is actually on the page.
$ErrorActionPreference = 'Stop'
$root  = Split-Path -Parent $PSScriptRoot
$utf8  = New-Object System.Text.UTF8Encoding($false)
$page  = Join-Path $root 'glossary.html'
$newf  = Join-Path (Split-Path -Parent $root) 'new-terms.html'

$html = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)
$new  = [System.IO.File]::ReadAllText($newf, [System.Text.Encoding]::UTF8)

# ---- collect every term block from both sources ----
$rx = [regex]'(?s)[ \t]*<div class="term" id="(?<id>[^"]+)">\s*<h3>(?<h>.*?)</h3>\s*<p>(?<p>.*?)</p>\s*</div>\r?\n?'
$terms = @{}
foreach ($src in @($html, $new)) {
  foreach ($m in $rx.Matches($src)) {
    $terms[$m.Groups['id'].Value] = [pscustomobject]@{
      id = $m.Groups['id'].Value
      h  = $m.Groups['h'].Value.Trim()
      p  = $m.Groups['p'].Value.Trim()
    }
  }
}
Write-Host ("terms collected: {0}" -f $terms.Count)

# sort on the heading with markup and leading articles stripped, so "ATS vs. STS"
# and "&#8212;" style entities do not distort the order
function SortKey([string]$h) {
  $s = [regex]::Replace($h, '<[^>]+>', '')
  $s = $s -replace '&[a-z]+;', '' -replace '[^A-Za-z0-9 ]', ''
  return $s.Trim().ToLower()
}
$sorted = $terms.Values | Sort-Object { SortKey $_.h }

# ---- rebuild the term container ----
$sb = New-Object System.Text.StringBuilder
foreach ($t in $sorted) {
  [void]$sb.AppendLine("    <div class=""term"" id=""$($t.id)"">")
  [void]$sb.AppendLine("      <h3>$($t.h)</h3>")
  [void]$sb.AppendLine("      <p>$($t.p)</p>")
  [void]$sb.AppendLine("    </div>")
}
$block = $sb.ToString()

# replace from the first term div through the last
$first = $rx.Match($html)
if (-not $first.Success) { throw 'no term blocks found in glossary.html' }
$all = $rx.Matches($html)
$last = $all[$all.Count-1]
$start = $first.Index
$end   = $last.Index + $last.Length
$html = $html.Substring(0, $start) + $block + $html.Substring($end)

# ---- regenerate the DefinedTerm graph from the same sorted set ----
function JsonEsc([string]$s) {
  $s = [regex]::Replace($s, '<[^>]+>', '')          # strip inline links
  $s = $s -replace '&mdash;', [char]0x2014 -replace '&sup2;', [char]0x00B2
  $s = $s -replace '&amp;','&' -replace '&lt;','<' -replace '&gt;','>'
  $s = $s -replace '\\','\\\\' -replace '"','\"'
  $s = $s -replace '\s+',' '
  return $s.Trim()
}
$items = ($sorted | ForEach-Object {
  '   {"@type":"DefinedTerm","name":"' + (JsonEsc $_.h) + '","description":"' + (JsonEsc $_.p) + '"}'
}) -join ",`r`n"

$rxSet = [regex]'(?s)(\{"@type":"DefinedTermSet".*?"hasDefinedTerm":\[).*?(\]\})'
if ($rxSet.IsMatch($html)) {
  $html = $rxSet.Replace($html, { param($m) $m.Groups[1].Value + "`r`n" + $items + "`r`n  " + $m.Groups[2].Value }, 1)
  Write-Host 'DefinedTermSet rebuilt'
} else {
  Write-Host 'WARNING: DefinedTermSet block not matched - schema left as-is'
}

[System.IO.File]::WriteAllText($page, $html, $utf8)
Write-Host ("terms on page now: {0}" -f ([regex]::Matches($html,'class="term"')).Count)
Write-Host ("DefinedTerm count : {0}" -f ([regex]::Matches($html,'"@type":"DefinedTerm"')).Count)
