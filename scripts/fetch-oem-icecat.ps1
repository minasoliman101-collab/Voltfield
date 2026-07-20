<#
VOLTFIELD - Icecat OEM data sync script.

Pulls REAL product records (brand, model/part number, GTIN, category, image)
from the Icecat JSON API and writes them to voltfield-oem-data.js as the
OEM_REF array. This is the only script that should ever write that file --
never hand-edit fabricated brand/model/GTIN values into it.

Requires C:\Users\minas\Desktop\v4-site\.env.icecat.txt with:
  ICECAT_USERNAME=...
  ICECAT_APP_KEY=...

Usage: edit the $LOOKUPS list below (each entry is either an icecat_id, or a
Brand+ProductCode pair, or a GTIN -- whatever you have for a real product),
then run:  powershell -File scripts\fetch-oem-icecat.ps1

Each lookup is tried against live.icecat.biz. Entries the account can't
access (Full Icecat gated, not found, brand-restricted) are skipped and
logged -- they are never faked.
#>

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env.icecat.txt'
if (-not (Test-Path $envPath)) { $envPath = Join-Path $root '.env.icecat' }
if (-not (Test-Path $envPath)) { throw "No .env.icecat(.txt) file found next to the site root." }

$envMap = @{}
foreach ($line in Get-Content $envPath) {
    if ($line -match '^([A-Z_]+)=(.*)$') { $envMap[$matches[1]] = $matches[2] }
}
if (-not $envMap.ICECAT_USERNAME -or -not $envMap.ICECAT_APP_KEY) {
    throw "ICECAT_USERNAME / ICECAT_APP_KEY missing from $envPath"
}

# Add real lookups here. One of: @{icecat_id='...'} / @{Brand='...';ProductCode='...'} / @{GTIN='...'}
# All icecat_ids below were confirmed reachable on this account's free Open Icecat tier
# (found by probing -- everything else tried, incl. ABB/Fluke/Milwaukee/Logitech, is Full-Icecat-gated).
$TEST_NOTE = 'Icecat free-tier product -- pipeline test entry, not a real Voltfield offering'
$LOOKUPS = @(
    @{ icecat_id = '1445'; note = $TEST_NOTE }
    @{ icecat_id = '1440'; note = $TEST_NOTE }
    @{ icecat_id = '1441'; note = $TEST_NOTE }
    @{ icecat_id = '1447'; note = $TEST_NOTE }
    @{ icecat_id = '1448'; note = $TEST_NOTE }
    @{ icecat_id = '1449'; note = $TEST_NOTE }
    @{ icecat_id = '1452'; note = $TEST_NOTE }
    @{ icecat_id = '1453'; note = $TEST_NOTE }
    @{ icecat_id = '1470'; note = $TEST_NOTE }
    @{ icecat_id = '1490'; note = $TEST_NOTE }
    @{ icecat_id = '1550'; note = $TEST_NOTE }
    @{ icecat_id = '1600'; note = $TEST_NOTE }
    @{ icecat_id = '1800'; note = $TEST_NOTE }
    @{ icecat_id = '9990'; note = $TEST_NOTE }
    @{ icecat_id = '9995'; note = $TEST_NOTE }
    @{ icecat_id = '10000'; note = $TEST_NOTE }
    @{ icecat_id = '10001'; note = $TEST_NOTE }
    @{ icecat_id = '10002'; note = $TEST_NOTE }
    @{ icecat_id = '10003'; note = $TEST_NOTE }
    @{ icecat_id = '10005'; note = $TEST_NOTE }
    @{ icecat_id = '10010'; note = $TEST_NOTE }
    @{ icecat_id = '10050'; note = $TEST_NOTE }
    @{ icecat_id = '10100'; note = $TEST_NOTE }
)

function Get-IcecatProduct($lookup) {
    $qs = @("lang=en", "shopname=$($envMap.ICECAT_USERNAME)", "app_key=$($envMap.ICECAT_APP_KEY)", "content=")
    foreach ($k in $lookup.Keys) {
        if ($k -ne 'note') { $qs += "$k=$([uri]::EscapeDataString([string]$lookup[$k]))" }
    }
    $uri = "https://live.icecat.biz/api?" + ($qs -join '&')
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method Get
        return $resp
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Warning "Lookup $($lookup | ConvertTo-Json -Compress) failed: HTTP $status"
        return $null
    }
}

$results = @()
foreach ($lookup in $LOOKUPS) {
    $resp = Get-IcecatProduct $lookup
    if (-not $resp -or -not $resp.data -or -not $resp.data.GeneralInfo) {
        Write-Warning "Skipped (no data): $($lookup | ConvertTo-Json -Compress)"
        continue
    }
    $gi = $resp.data.GeneralInfo
    $gtin = $null
    if ($gi.GTIN -is [array]) { $gtin = $gi.GTIN[0] } else { $gtin = $gi.GTIN }
    $img = $resp.data.Image.HighPic
    $catName = $null
    if ($gi.Category -and $gi.Category.Name) { $catName = $gi.Category.Name.Value }
    $results += [ordered]@{
        test     = $true
        brand    = $gi.Brand
        mpn      = $gi.ProductName
        gtin     = $gtin
        title    = $gi.Title
        category = $catName
        img      = $img
        source   = 'Icecat'
        note     = $lookup.note
    }
    Write-Output "OK: $($gi.Brand) / $($gi.ProductName)"
}

$lines = @()
$lines += "/* VOLTFIELD - real OEM cross-reference data, sourced live from Icecat."
$lines += "   Unlike voltfield-catalog-data.js (Voltfield's own procedurally-generated"
$lines += "   VF- SKUs), every entry here is a genuine real-world product: real brand,"
$lines += "   real manufacturer part/model number, real GTIN. Regenerate this file by"
$lines += "   editing the `$LOOKUPS list in scripts/fetch-oem-icecat.ps1 and re-running it --"
$lines += "   never hand-edit a brand/model/GTIN value in here. */"
$lines += "const OEM_REF=["
foreach ($r in $results) {
    $json = $r | ConvertTo-Json -Compress
    $lines += "  $json,"
}
$lines += "];"

$outPath = Join-Path $root 'voltfield-oem-data.js'
$lines -join "`n" | Set-Content -Path $outPath -Encoding utf8
Write-Output "Wrote $($results.Count) record(s) to $outPath"
