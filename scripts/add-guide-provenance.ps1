# Adds provenance to every guide: a visible "Scope & sources" block, an
# "Updated" date in the byline, and dateModified in the Article schema.
#
# Dates come from GIT, not from a hand-maintained list, so they are verifiable:
#   published = first commit that added the file
#   updated   = last commit that touched it
#
# What this deliberately does NOT do: invent a named human reviewer, or claim a
# "last reviewed" date. A reviewer credit asserts that a qualified person signed
# off on the content. Fabricating that is exactly the signal Google's spam
# policies target, and it would put an untrue claim on the site. "Updated" is
# used rather than "reviewed" because a file-modification date is what git can
# actually prove -- many of these dates are sitewide script passes (GTM, OG
# images, canonical tags), not content revisions, and labelling those as
# reviews would overstate them.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)

$data = Get-Content (Join-Path $PSScriptRoot 'guide-provenance.json') -Raw -Encoding UTF8 | ConvertFrom-Json

function Esc([string]$s) { $s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' }
function LongDate([string]$iso) {
  if (-not $iso) { return $null }
  ([datetime]::ParseExact($iso, 'yyyy-MM-dd', $null)).ToString('MMMM d, yyyy', [Globalization.CultureInfo]::InvariantCulture)
}

$done = 0; $skipped = @()
foreach ($slug in $data.guides.PSObject.Properties.Name) {
  $file = Join-Path $root ($slug + '.html')
  if (-not (Test-Path $file)) { $skipped += "$slug (no file)"; continue }

  $g = $data.guides.$slug
  $s = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

  if ($s -match 'class="provenance"') { $skipped += "$slug (already has block)"; continue }

  # PUBLISHED comes from the page's own datePublished, not from git.
  # Git records when the file was committed to this repo, which is not the same
  # as when the content was authored -- and the visible byline already shows the
  # schema date. Using the git date produced a page that said "Published Jul 25"
  # in the byline and "Published August 4" in this block: a visible contradiction
  # on the same page, which is precisely the kind of thing that costs trust.
  $added = $null
  $m = [regex]::Match($s, '"datePublished":"(\d{4}-\d{2}-\d{2})')
  if ($m.Success) { $added = $m.Groups[1].Value }

  # UPDATED comes from git, which is the only thing that can actually prove when
  # the file last changed.
  Push-Location $root
  $last = (git log -1 --format=%ad --date=short -- ($slug + '.html'))
  if (-not $added) { $added = (git log --diff-filter=A --format=%ad --date=short -- ($slug + '.html') | Select-Object -Last 1) }
  Pop-Location
  if (-not $added) { $skipped += "$slug (no publish date)"; continue }

  $addedLong = LongDate $added
  $lastLong  = LongDate $last
  # If git's last-touch predates the authored date, the "updated" claim would be
  # nonsense; drop it rather than print a date earlier than publication.
  if ($last -and $added -and ([datetime]$last -lt [datetime]$added)) { $last = $added; $lastLong = $addedLong }

  # --- 1. dateModified in the Article node (only if absent) ---
  if ($s -notmatch '"dateModified"') {
    $s = [regex]::Replace($s,
      '("datePublished":"[^"]*")',
      ('${1},"dateModified":"' + $last + 'T00:00:00-05:00"'), 1)
  }

  # --- 2. "Updated" in the visible byline, next to Published ---
  if ($added -ne $last -and $s -notmatch 'Updated ' + [regex]::Escape($lastLong)) {
    $s = [regex]::Replace($s,
      '(<span>Published [^<]*</span>)',
      ('${1}<span>&middot;</span><span>Updated ' + $lastLong + '</span>'), 1)
  }

  # --- 3. visible provenance block, appended to the article body ---
  $sources = ($g.basedOn | ForEach-Object { '<li>' + (Esc $_) + '</li>' }) -join ''
  $block = @"

  <aside class="provenance" aria-labelledby="prov-h">
    <h2 id="prov-h">Scope &amp; sources</h2>
    <dl>
      <dt>What this covers</dt>
      <dd>$(Esc $g.covers)</dd>
      <dt>Based on</dt>
      <dd><ul>$sources</ul></dd>
      <dt>What it is not</dt>
      <dd>$(Esc $g.notFor)</dd>
      <dt>Provenance</dt>
      <dd>Published $addedLong$(if ($added -ne $last) { " &middot; last updated $lastLong" }). Written and maintained by the Voltfield editorial team against the sources above. Figures that are Voltfield's own estimates rather than published standards are labelled as such where they appear &mdash; see the <a href="methodology.html">methodology page</a>.</dd>
    </dl>
  </aside>
"@

  $marker = '<section class="ctaband">'
  $idx = $s.IndexOf($marker)
  if ($idx -lt 0) {
    # fall back to the end of the article wrapper
    $idx = $s.IndexOf('<footer')
    if ($idx -lt 0) { $skipped += "$slug (no insertion point)"; continue }
  }
  $s = $s.Substring(0, $idx) + $block + "`n" + $s.Substring($idx)

  [System.IO.File]::WriteAllText($file, $s, $utf8)
  $done++
}

Write-Host "provenance added to $done guide(s)"
if ($skipped.Count) { Write-Host ("skipped: " + ($skipped -join ' | ')) }
