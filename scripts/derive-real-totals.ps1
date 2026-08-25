# Makes the catalog's SKU totals real.
#
# Every family carried a hand-typed ct: field documented as "SKU count". It was
# not a count of anything: measured against each family's own attribute axes,
# the declared figure ran from 0.83x to 1800x the number of configurations the
# axes can actually produce (median 30x). Machine Tool Accessories declared
# 54,000 from 30 real combinations. Summed, ct claimed 2,191,366 while the file's
# own header comment said "~1.23M" -- it already disagreed with itself.
#
# That number was not cosmetic. It drove pagination, facet counts, the insights
# charts, the compare table and the CSV export, and voltfield-insights.html
# published it as "Configurable SKUs ... derived live from the catalog taxonomy".
# It was derived live -- from a hand-typed field.
#
# Two changes make the claim true:
#   1. ct is now COMPUTED as the cross-product of the family's axes.
#   2. genSKU decodes its index in mixed radix, so index i maps 1:1 onto one
#      distinct combination. It used to hash the index per axis, which drew
#      repeatedly from a much smaller real space -- at 2.19M indices over 11,429
#      combinations, every configuration was being re-emitted ~190 times under a
#      different generated part number.
#
# Result: 243 families, 81 categories, 11,429 configurations, each appearing once.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$p = Join-Path $root 'voltfield-catalog-data.js'
$s = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
$orig = $s

# ---- 1. strip the hand-typed ct: values from all 243 family records ----
$before = ([regex]::Matches($s, ',ct:\d+')).Count
$s = [regex]::Replace($s, ',ct:\d+', '')
Write-Host "stripped hand-typed ct: fields: $before"
if ($before -ne 243) { throw "expected 243 ct: fields, found $before" }

# ---- 2. fix the field-key comment ----
$s = $s.Replace('// s=sector c=category n=name kw=keywords ct=SKU count',
                '// s=sector c=category n=name kw=keywords  (ct is DERIVED below)')

# ---- 3. fix the header comment that claimed ~1.23M ----
$s = $s.Replace('A compact taxonomy (sector -> category -> family -> attribute
   axes) expands into the full ~1.23M-SKU space on demand.',
                'A compact taxonomy (sector -> category -> family -> attribute
   axes) expands on demand into every configuration those axes describe.
   The total is computed from the axes, never declared.')

# ---- 4. derive ct from the axes ----
$anchor = "FAM.forEach((f,i)=>{ f._i=i;"
if (-not $s.Contains($anchor)) { throw "derive-metadata anchor not found" }
$derive = @"
/* Number of distinct configurations this family can produce -- the product of
   its attribute axes (each axis is [label, ...values], so length-1 values).
   This replaces a hand-typed ct: field that overstated the space by a median
   30x and was published as if it had been counted. Everything downstream
   (pagination, facet counts, insights, CSV export) now reads a real number. */
FAM.forEach(f=>{ f.ct = f.ax.reduce((n,axis)=>n*(axis.length-1), 1); });

$anchor
"@
$s = $s.Replace($anchor, $derive)

# ---- 5. genSKU: enumerate combinations instead of hashing into them ----
$oldPick = "  const picks=f.ax.map((axis,ai)=>{const o=axis.slice(1); return o[h(i,ai+7)%o.length];});"
if (-not $s.Contains($oldPick)) { throw "genSKU pick line not found" }
$newPick = @"
  /* Mixed-radix decode: index i maps 1:1 onto one distinct combination, so
     every configuration is emitted exactly once. This used to hash i per axis,
     which drew from the real (much smaller) space with replacement and
     re-emitted the same configuration many times under different part numbers. */
  let r = i >>> 0;
  const picks = f.ax.map(axis => { const o = axis.slice(1); const pick = o[r % o.length]; r = Math.floor(r / o.length); return pick; });
"@
$s = $s.Replace($oldPick, $newPick)

if ($s -eq $orig) { throw "no changes applied" }
[System.IO.File]::WriteAllText($p, $s, $utf8)

# ---- assertions ----
$s2 = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
$bad = @()
if ([regex]::Matches($s2, ',ct:\d+').Count -ne 0) { $bad += 'hand-typed ct: survived' }
if (-not $s2.Contains('f.ct = f.ax.reduce'))      { $bad += 'derived ct missing' }
if (-not $s2.Contains('Mixed-radix decode'))      { $bad += 'genSKU not updated' }
if ($s2.Contains('1.23M'))                        { $bad += 'stale 1.23M claim' }
if ($s2.Contains('h(i,ai+7)'))                    { $bad += 'old hash pick survived' }
if ($bad.Count) { $bad | ForEach-Object { Write-Warning $_ }; throw "$($bad.Count) assertion(s) failed" }
Write-Host "verified: ct derived from axes, genSKU enumerates, no stale totals"
