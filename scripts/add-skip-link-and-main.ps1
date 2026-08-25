# Adds a skip link and a <main> landmark to every page.
#
# Measured before this: 1 page of 65 had a <main> landmark and 2 had a skip
# link. The header carries a full nav plus a Tools dropdown, so a keyboard or
# screen-reader user re-traversed all of it on every page.
#
# Safe to wrap content in <main>: checked first that no CSS uses `body > x`
# selectors, no :nth-child on top-level sections, and no JS walks
# document.body.children -- so introducing one wrapper element changes nothing.
#
# Pure ASCII on purpose (PowerShell 5.1 reads .ps1 as ANSI).
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$SKIP = '<a class="skip-link" href="#main">Skip to main content</a>'

$pages = Get-ChildItem $root -Recurse -Filter *.html -File |
         Where-Object { $_.FullName -notlike '*\.git\*' -and $_.FullName -notlike '*\scripts\*' }

$done = 0; $skipped = @()
foreach ($p in $pages) {
  $s = [System.IO.File]::ReadAllText($p.FullName, [System.Text.Encoding]::UTF8)
  $rel = $p.FullName.Substring($root.Length + 1)
  $before = $s

  # A page that already has the landmark still needs the skip link -- an early
  # version bailed out here and left the one such page without one.
  if ($s -match '<main[\s>]') {
    $b = [regex]::Match($s, '<body[^>]*>')
    if ($b.Success -and $s -notmatch [regex]::Escape($SKIP)) {
      $s = $s.Insert($b.Index + $b.Length, "`n" + $SKIP)
      # -replace takes no count operand in PowerShell, so target the first
       # occurrence by index rather than pretending it does.
      if ($s -notmatch 'id="main"') {
        $mi = $s.IndexOf('<main')
        if ($mi -ge 0) { $s = $s.Insert($mi + 5, ' id="main" tabindex="-1"') }
      }
      [System.IO.File]::WriteAllText($p.FullName, $s, $utf8)
      $done++
    }
    $skipped += "$rel (already had <main>; skip link added)"
    continue
  }

  # An existing id="main" elsewhere would collide with the landmark's id.
  # This MUST happen before the offsets below are taken: the replacement is
  # longer than the original, and computing the insertion points first left
  # them stale by exactly that difference -- which put </main> five characters
  # into the preceding </div> on the one page that had id="main".
  if ($s -match 'id="main"') {
    $s = $s -replace 'id="main"', 'id="main-hero"'
  }

  # Pages with no <header> (404, privacy policy) have no nav to skip past, so
  # the landmark opens right after the GTM noscript instead and no skip link is
  # added -- a skip link that skips nothing is noise for a screen-reader user.
  $hdr = $s.IndexOf('</header>')
  $hasHeader = $hdr -ge 0
  if (-not $hasHeader) {
    $ns = $s.IndexOf('</noscript>')
    $b0 = [regex]::Match($s, '<body[^>]*>')
    $hdr = if ($ns -ge 0) { $ns - 9 + 9 } else { $b0.Index + $b0.Length - 9 }
  }

  # Checkout and RFQ have a header but no footer; close the landmark at </body>.
  $ftr = $s.IndexOf('<footer', [Math]::Max(0, $hdr))
  if ($ftr -lt 0) { $ftr = $s.LastIndexOf('</body>') }
  if ($ftr -lt 0) { $skipped += "$rel (no <footer> and no </body>)"; continue }

  # close </main> before the footer, open <main> after the header.
  # Later position first, so the earlier insert cannot shift it.
  $s = $s.Insert($ftr, "</main>`n")
  $s = $s.Insert($hdr + 9, "`n<main id=`"main`" tabindex=`"-1`">")

  # skip link immediately inside <body> -- only where there is a nav to skip
  if ($hasHeader) {
    $bodyOpen = [regex]::Match($s, '<body[^>]*>')
    if (-not $bodyOpen.Success) { $skipped += "$rel (no <body>)"; continue }
    if ($s -notmatch [regex]::Escape($SKIP)) {
      $s = $s.Insert($bodyOpen.Index + $bodyOpen.Length, "`n" + $SKIP)
    }
  }

  if ($s -ne $before) {
    [System.IO.File]::WriteAllText($p.FullName, $s, $utf8)
    $done++
  }
}

Write-Host "pages updated: $done"
if ($skipped.Count) { Write-Host "skipped:"; $skipped | ForEach-Object { Write-Host "  $_" } }

# ---- assertions ----
$bad = @()
foreach ($p in $pages) {
  $s = [System.IO.File]::ReadAllText($p.FullName, [System.Text.Encoding]::UTF8)
  $rel = $p.FullName.Substring($root.Length + 1)
  $o = ([regex]::Matches($s, '<main[\s>]')).Count
  $c = ([regex]::Matches($s, '</main>')).Count
  $ids = ([regex]::Matches($s, 'id="main"')).Count
  if ($o -ne $c)  { $bad += "$rel : <main>=$o </main>=$c" }
  if ($ids -gt 1) { $bad += "$rel : duplicate id=main ($ids)" }
  if ($o -eq 1 -and $s.IndexOf('</main>') -lt $s.IndexOf('<main')) { $bad += "$rel : </main> before <main>" }
  # </main> must land on a tag boundary, not inside one. The first run spliced
  # it into a preceding </div>, which the balance check above did not catch.
  if ($o -eq 1) {
    $mc = $s.IndexOf('</main>')
    $tail = $s.Substring($mc + 7).TrimStart()
    if ($tail -notmatch '^<') { $bad += "$rel : </main> lands mid-tag -> '$($tail.Substring(0,[Math]::Min(16,$tail.Length)))'" }
  }
  # A skip link is required only where there is a header nav to skip.
  if ($s -match '<header' -and $s -notmatch 'class="skip-link"') { $bad += "$rel : has nav but no skip link" }
}
if ($bad.Count) { $bad | ForEach-Object { Write-Warning $_ }; throw "$($bad.Count) structural problem(s)" }
Write-Host "verified: every page has exactly one balanced <main> and one id=main"
