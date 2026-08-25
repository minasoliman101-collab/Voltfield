# Parses voltfield-catalog-data.js into family records.
#
# Dot-sourced by gen-family-pages.ps1. Kept separate so the parse can be
# verified on its own before anything is generated: every field below is read
# back out and checked against the totals the live site reports (243 families,
# 81 categories, 11,429 configurations).
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'

function Get-Families {
  param([string]$Path)

  $lines = [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8)
  $out = New-Object System.Collections.ArrayList

  # Three MRO fastener families reference the shared axis constants FIN and GR
  # by name rather than writing the values out (ax:[GR,['Drive',...]]). Read
  # their real definitions from the head of the file and expand them inline,
  # otherwise those axes parse as empty and the configuration count comes out
  # 875 short of the 11,429 the site reports.
  $consts = @{}
  foreach ($cname in 'FIN','GR') {
    $decl = $lines | Where-Object { $_ -match "^const $cname=\[" } | Select-Object -First 1
    if (-not $decl) { throw "shared axis constant $cname not found" }
    $consts[$cname] = $decl.Substring($decl.IndexOf('['))
    $consts[$cname] = $consts[$cname].TrimEnd(';')
  }

  foreach ($line in $lines) {
    if ($line -notmatch "^\{s:'") { continue }

    # expand the shared constants only inside this record's ax:[...]
    foreach ($cname in $consts.Keys) {
      $line = $line -replace "(?<=[\[,])$cname(?=[,\]])", $consts[$cname]
    }

    $rec = [ordered]@{}
    foreach ($f in 's','c','n','pu') {
      if ($line -match "[{,]$f`:'([^']*)'") { $rec[$f] = $Matches[1] } else { $rec[$f] = '' }
    }
    foreach ($f in 'img','kw') {
      if ($line -match "[{,]$f`:'([^']*)'") { $rec[$f] = $Matches[1] } else { $rec[$f] = '' }
    }
    foreach ($f in 'lo','hi','lw') {
      if ($line -match "[{,]$f`:(-?[\d.]+)") { $rec[$f] = [double]$Matches[1] } else { $rec[$f] = $null }
    }

    # cmp:['A','B'] -> string[]
    $rec['cmp'] = @()
    if ($line -match "[{,]cmp:\[([^\]]*)\]") {
      $rec['cmp'] = @([regex]::Matches($Matches[1], "'([^']*)'") | ForEach-Object { $_.Groups[1].Value })
    }

    # ax:[['Label','v1','v2'],['Label2',...]] -> array of arrays.
    # Greedy to the final ']]' so nested axis brackets are all captured.
    $rec['ax'] = @()
    if ($line -match "[{,]ax:\[(\[.*\])\]") {
      $inner = $Matches[1]
      foreach ($m in [regex]::Matches($inner, "\[([^\[\]]*)\]")) {
        $vals = @([regex]::Matches($m.Groups[1].Value, "'([^']*)'") | ForEach-Object { $_.Groups[1].Value })
        if ($vals.Count -ge 2) { $rec['ax'] += ,$vals }
      }
    }

    # derived: configuration count = product of (values per axis)
    $combo = 1
    foreach ($axis in $rec['ax']) { $combo = $combo * ($axis.Count - 1) }
    $rec['combos'] = $combo

    # slug for the page URL
    $slug = $rec['n'].ToLower()
    $slug = $slug -replace '&amp;','and' -replace '&','and'
    $slug = $slug -replace '[^a-z0-9]+','-'
    $slug = $slug.Trim('-')
    $rec['slug'] = $slug

    [void]$out.Add([pscustomobject]$rec)
  }

  # Two distinct MRO families are both called "Toolholding & Workholding" -- one
  # under the Machining category, one under a category of its own. Same name,
  # different records, so the name alone cannot address a page. Any slug that
  # collides gets its category prefixed; unique slugs are left short.
  $bySlug = $out | Group-Object slug | Where-Object Count -gt 1
  foreach ($g in $bySlug) {
    foreach ($rec in $g.Group) {
      $catSlug = ($rec.c.ToLower() -replace '&amp;','and' -replace '&','and' -replace '[^a-z0-9]+','-').Trim('-')
      $rec.slug = "$catSlug-$($rec.slug)"
    }
  }
  return $out
}

# ---- run standalone for verification ----
if ($MyInvocation.InvocationName -ne '.') {
  $root = Split-Path -Parent $PSScriptRoot
  $fams = Get-Families (Join-Path $root 'voltfield-catalog-data.js')

  Write-Host ("families parsed : {0}" -f $fams.Count)
  Write-Host ("categories      : {0}" -f (($fams | ForEach-Object { $_.s + '|' + $_.c } | Sort-Object -Unique).Count))
  Write-Host ("configurations  : {0}" -f (($fams | Measure-Object combos -Sum).Sum))
  Write-Host ""
  Write-Host "per sector:"
  $fams | Group-Object s | Sort-Object Name | ForEach-Object {
    $cfg = ($_.Group | Measure-Object combos -Sum).Sum
    $cat = ($_.Group | ForEach-Object c | Sort-Object -Unique).Count
    Write-Host ("  {0,-5} {1,3} families {2,3} cats {3,6} configs" -f $_.Name, $_.Count, $cat, $cfg)
  }
  Write-Host ""
  Write-Host "integrity checks:"
  $noAx   = @($fams | Where-Object { $_.ax.Count -eq 0 })
  $noImg  = @($fams | Where-Object { -not $_.img })
  $noLw   = @($fams | Where-Object { -not $_.lw })
  $noCmp  = @($fams | Where-Object { $_.cmp.Count -eq 0 })
  $dupSlug= @($fams | Group-Object slug | Where-Object Count -gt 1)
  Write-Host ("  no axes parsed  : {0}" -f $noAx.Count)
  Write-Host ("  no image        : {0}" -f $noImg.Count)
  Write-Host ("  no lead time    : {0}" -f $noLw.Count)
  Write-Host ("  no standards    : {0}" -f $noCmp.Count)
  Write-Host ("  duplicate slugs : {0}" -f $dupSlug.Count)
  if ($dupSlug.Count) { $dupSlug | ForEach-Object { Write-Host ("    {0}" -f $_.Name) } }
  Write-Host ""
  Write-Host "sample record:"
  $s = $fams | Where-Object { $_.n -eq 'Large Power Transformers' }
  $s | Format-List s,c,n,slug,lo,hi,pu,lw,combos | Out-String | Write-Host
  Write-Host ("  cmp : {0}" -f ($s.cmp -join ', '))
  foreach ($a in $s.ax) { Write-Host ("  ax  : {0} = {1}" -f $a[0], (($a[1..($a.Count-1)]) -join ' / ')) }
}
