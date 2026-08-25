# Replaces hotlinked publisher images in the sector-page news cards with the
# site's own reference illustrations.
#
# Why: those <img> tags pulled photographs straight from pv-tech.org,
# worldoil.com, energy-storage.news and four other publisher CDNs. That is
# someone else's copyrighted photography served on our pages without a licence,
# it leaks every visitor's IP to those hosts, it adds seven third-party DNS +
# TLS round trips to the render path, and any of them can 404 or swap the image
# out from under us at any time.
#
# index.html was already converted to owned illustrations; these four sector
# pages were missed. Same treatment, same "Illustration" badge, so nothing here
# claims to be photography of the thing described.
#
# Pure ASCII on purpose: Windows PowerShell 5.1 reads .ps1 as ANSI, so a literal
# em-dash here lands as mojibake in the output. HTML entities are used instead.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# headline fragment -> [illustration basename, alt subject]
$MAP = @{
  'renewables.html' = @(
    @('Treasury',        're-mono-perc-modules',          'Mono PERC PV module'),
    @('inverter industry','re-string-inverters-feoc-clean','String inverter'),
    @('module assembly', 're-topcon-modules',             'TOPCon PV module')
  )
  'battery-storage.html' = @(
    @('Saudi Arabia',    'bess-containerized-enclosures', 'Containerised BESS enclosure'),
    @('pumped hydro',    'bess-lfp-dc-blocks-5mwh',       'LFP DC block'),
    @('record Q1',       'bess-modular-battery-racks',    'Modular battery rack')
  )
  'data-centers.html' = @(
    @('transformer waits','dc-large-power-transformers',  'Large power transformer'),
    @('bid for the same','dc-pad-mount-transformers',     'Pad-mount transformer'),
    # this card's nc-img was an empty div -- a blank band, no image at all
    @('Liquid cooling',  'dc-coolant-distribution-units-cdu','Coolant distribution unit')
  )
  'oil-gas.html' = @(
    @('OCTG',            'og-octg-casing',                'OCTG casing'),
    @('Halliburton',     'og-frac-valves',                'Frac valve'),
    @('rig count',       'og-drill-pipe-s-135',           'S-135 drill pipe')
  )
}

# The old rule crops an illustration to fill a 64px strip. Illustrations are
# square subjects on a light ground, so they need contain, not cover -- the same
# fix index.html already carries.
$OLD_CSS = '.nc-img img{width:100%;height:100%;object-fit:cover;display:block}'
# The band these pages ship is 64px tall. An illustration needs more room than
# that, and with overflow:hidden a 96px image would simply be sliced. Raised to
# match index.html, which already carries this treatment, so the news cards look
# the same on every page. Declared AFTER the original .nc-img rule, so equal
# specificity resolves in this block's favour.
$NEW_CSS = @'
.nc-img{position:relative;overflow:hidden;height:108px;
  display:flex;align-items:center;justify-content:center}
.nc-img picture{display:contents}
.nc-img img{height:96px;width:96px;object-fit:contain;display:block;
  filter:drop-shadow(0 2px 4px rgba(16,27,45,.18));mix-blend-mode:multiply}
html[data-theme="dark"] .nc-img img{mix-blend-mode:normal}
.nc-illus{position:absolute;right:6px;bottom:5px;font-family:var(--mono);font-size:8px;
  letter-spacing:.08em;text-transform:uppercase;color:#7C8A9A;background:rgba(255,255,255,.82);
  padding:1px 4px;border-radius:2px}
html[data-theme="dark"] .nc-illus{background:rgba(16,27,45,.8);color:#9FB0C3}
'@

$totalImg = 0; $totalCss = 0
foreach ($file in $MAP.Keys) {
  $path = Join-Path $root $file
  $s = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $before = $s

  # --- CSS ---
  if ($s.Contains($OLD_CSS)) {
    $s = $s.Replace($OLD_CSS, $NEW_CSS.Trim())
    $totalCss++
  }

  # --- images ---
  # Scoped PER CARD. An earlier version searched the whole document for
  # '<div class="nc-img">...</div>' followed by the target <h4>; that always
  # matched the FIRST nc-img on the page, so every entry overwrote card one and
  # cards two and three kept their hotlinks. Match whole <a class="newscard">
  # blocks first, then rewrite the nc-img inside the block whose h4 matches.
  $cards = [regex]::Matches($s, '(?s)<a class="newscard".*?</a>')
  if ($cards.Count -eq 0) { throw "no newscard blocks in $file" }

  # rebuild right-to-left so earlier match offsets stay valid
  for ($ci = $cards.Count - 1; $ci -ge 0; $ci--) {
    $card = $cards[$ci].Value
    $h4 = [regex]::Match($card, '<h4>([^<]*)</h4>')
    if (-not $h4.Success) { continue }
    $headline = $h4.Groups[1].Value

    $entry = $MAP[$file] | Where-Object { $headline -like ('*' + $_[0] + '*') } | Select-Object -First 1
    if (-not $entry) { continue }
    $base = $entry[1]; $subject = $entry[2]

    if (-not (Test-Path (Join-Path $root ("images\parts\$base.jpg"))))  { throw "missing jpg: $base" }
    if (-not (Test-Path (Join-Path $root ("images\parts\$base.webp")))) { throw "missing webp: $base" }

    $alt = "$subject &mdash; reference illustration"
    $new = '<div class="nc-img"><picture>' +
           '<source srcset="images/parts/' + $base + '.webp" type="image/webp">' +
           '<img src="images/parts/' + $base + '.jpg" alt="' + $alt + '" width="340" height="340" ' +
           'loading="lazy" decoding="async" onerror="this.closest(&quot;.nc-img&quot;).remove()">' +
           '</picture><span class="nc-illus">Illustration</span></div>'

    # replace only the nc-img div INSIDE this card
    $newCard = [regex]::Replace($card, '(?s)<div class="nc-img">.*?</div>\s*(?=<div class="nc-tag")', $new)
    if ($newCard -eq $card) { Write-Warning "nc-img not rewritten for '$headline'"; continue }

    $s = $s.Remove($cards[$ci].Index, $cards[$ci].Length).Insert($cards[$ci].Index, $newCard)
    $totalImg++
  }

  if ($s -ne $before) {
    [System.IO.File]::WriteAllText($path, $s, $utf8)
    Write-Host "updated $file"
  }
}
Write-Host "images replaced: $totalImg   css blocks updated: $totalCss"

# assertion: no third-party image host may remain in these pages
foreach ($file in $MAP.Keys) {
  $s = [System.IO.File]::ReadAllText((Join-Path $root $file), [System.Text.Encoding]::UTF8)
  $left = [regex]::Matches($s, '<img[^>]*src="https?://[^"]+"')
  if ($left.Count -gt 0) { throw "$file still hotlinks $($left.Count) image(s)" }
}
Write-Host "verified: no remaining hotlinked <img> in any sector page"
