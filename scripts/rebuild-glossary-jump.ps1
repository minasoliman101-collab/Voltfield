# Rebuilds the glossary's jump-link index from the terms actually on the page.
#
# The index was a hand-maintained list of 21 anchors. Adding 35 terms left it
# silently stale: the page rendered 56 definitions while the navigation at the
# top still offered only the original 21, so two thirds of the new content had
# no route from the top of the page.
#
# Generated from the rendered terms for the same reason the DefinedTerm graph
# is: a hand-kept duplicate of a list will drift from it. Short labels are used
# where a heading carries a parenthetical expansion, so the index stays scannable.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$page = Join-Path $root 'glossary.html'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$html = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)

$rx = [regex]'(?s)<div class="term" id="(?<id>[^"]+)">\s*<h3>(?<h>.*?)</h3>'
$terms = foreach ($m in $rx.Matches($html)) {
  $label = $m.Groups['h'].Value.Trim()
  $label = [regex]::Replace($label, '<[^>]+>', '')
  # drop a parenthetical expansion so the chip stays short
  $label = [regex]::Replace($label, '\s*\([^)]*\)\s*$', '')
  [pscustomobject]@{ id = $m.Groups['id'].Value; label = $label.Trim() }
}
if (-not $terms) { throw 'no terms found' }

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('  <div class="jump">')
$i = 0
foreach ($t in $terms) {
  if ($i % 5 -eq 0) { [void]$sb.Append('    ') }
  [void]$sb.Append("<a href=""#$($t.id)"">$($t.label)</a>")
  $i++
  if ($i % 5 -eq 0) { [void]$sb.AppendLine('') }
}
if ($i % 5 -ne 0) { [void]$sb.AppendLine('') }
[void]$sb.AppendLine('  </div>')

$rxJump = [regex]'(?s)[ \t]*<div class="jump">.*?</div>\r?\n'
if (-not $rxJump.IsMatch($html)) { throw 'jump block not found' }
$html = $rxJump.Replace($html, $sb.ToString(), 1)

[System.IO.File]::WriteAllText($page, $html, $utf8)
Write-Host ("jump links rebuilt: {0}" -f $terms.Count)
