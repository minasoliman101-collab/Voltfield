# Builds a data-center category page from the transformers page as the template.
#
# Only head metadata, the banner, breadcrumb and the body between <div class="artwrap">
# and </div> differ between these pages; the header, nav, footer, styles and scripts
# are identical. Cloning rather than hand-writing each keeps the 38 internal links
# and the root-relative asset paths from drifting page to page.
#
# Usage: pass the slug; body content is read from a sibling .body.html fragment.
param(
  [Parameter(Mandatory=$true)][string]$Slug,
  [Parameter(Mandatory=$true)][string]$Title,       # <title>, keep under 60 chars incl. " | Voltfield"
  [Parameter(Mandatory=$true)][string]$Desc,        # meta description
  [Parameter(Mandatory=$true)][string]$Keywords,
  [Parameter(Mandatory=$true)][string]$CrumbName,   # breadcrumb + og title leaf
  [Parameter(Mandatory=$true)][string]$H1,
  [Parameter(Mandatory=$true)][string]$Dek,
  [Parameter(Mandatory=$true)][string]$LdGraph,     # JSON for the @graph array
  [Parameter(Mandatory=$true)][string]$BodyFile,    # path to the artwrap inner HTML
  [Parameter(Mandatory=$true)][string]$CtaH3,
  [Parameter(Mandatory=$true)][string]$CtaP,
  [Parameter(Mandatory=$true)][string]$CtaHref,
  [Parameter(Mandatory=$true)][string]$CtaLabel
)
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$tpl  = Join-Path $root 'data-centers\transformers.html'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$s = [System.IO.File]::ReadAllText($tpl, [System.Text.Encoding]::UTF8)
$body = [System.IO.File]::ReadAllText($BodyFile, [System.Text.Encoding]::UTF8)

# --- head ---
$s = $s -replace '<title>[^<]*</title>', ('<title>' + $Title + '</title>')
$s = $s -replace 'href="https://voltfield\.org/data-centers/transformers\.html"', ('href="https://voltfield.org/data-centers/' + $Slug + '.html"')
$s = [regex]::Replace($s, '<meta name="description" content="[^"]*">', '<meta name="description" content="' + $Desc + '">')
$s = [regex]::Replace($s, '<meta name="keywords" content="[^"]*">', '<meta name="keywords" content="' + $Keywords + '">')
$s = [regex]::Replace($s, '<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="' + $CrumbName + '">')
$s = [regex]::Replace($s, '<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="' + $Desc + '">')

# --- structured data: replace the whole @graph ---
$ldStart = $s.IndexOf('{"@context":"https://schema.org","@graph":[')
$ldEnd   = $s.IndexOf('</script>', $ldStart)
$s = $s.Substring(0, $ldStart) + '{"@context":"https://schema.org","@graph":[' + "`n" + $LdGraph + "`n]}`n" + $s.Substring($ldEnd)

# --- banner ---
$s = [regex]::Replace($s, '(?s)<h1>.*?</h1>', '<h1>' + $H1 + '</h1>')
$s = [regex]::Replace($s, '(?s)<p class="dek">.*?</p>', '<p class="dek">' + $Dek + '</p>')

# --- breadcrumb leaf ---
$s = [regex]::Replace($s, '(?s)(<span class="sep">/</span>\s*\n\s*<span>)[^<]*(</span>)', ('${1}' + $CrumbName + '${2}'))

# --- body ---
$bStart = $s.IndexOf('<div class="artwrap">')
$bEnd   = $s.IndexOf('<section class="ctaband">')
$s = $s.Substring(0, $bStart) + "<div class=`"artwrap`">`n" + $body + "`n</div>`n`n" + $s.Substring($bEnd)

# --- CTA ---
# Scope the rewrite to the ctaband section by index. An earlier version used
# [regex]::Replace(..., 1) intending "replace the first match" -- but there is no
# (input, pattern, replacement, count) static overload, so the 1 was read as
# RegexOptions.IgnoreCase and EVERY <h3>+<p> in the document was overwritten,
# destroying all four FAQ answers on the generated pages.
$ctaStart = $s.IndexOf('<section class="ctaband">')
if ($ctaStart -lt 0) { throw 'ctaband section not found in template' }
$head = $s.Substring(0, $ctaStart)
$cta  = $s.Substring($ctaStart)
$cta  = [regex]::Replace($cta, '(?s)<h3>.*?</h3>', '<h3>' + $CtaH3 + '</h3>')
$cta  = [regex]::Replace($cta, '(?s)(<h3>.*?</h3>\s*)<p>.*?</p>', ('${1}<p>' + $CtaP + '</p>'))
$cta  = [regex]::Replace($cta, '<a class="ctabtn" href="[^"]*">[^<]*</a>', '<a class="ctabtn" href="' + $CtaHref + '">' + $CtaLabel + '</a>')
$s = $head + $cta

# sanity: the body's FAQ headings must have survived
$faqCount = ([regex]::Matches($s, '<h3>')).Count
if ($faqCount -lt 2) { throw "only $faqCount <h3> left -- the CTA rewrite clobbered the body" }

$out = Join-Path $root ('data-centers\' + $Slug + '.html')
[System.IO.File]::WriteAllText($out, $s, $utf8)
Write-Host "wrote data-centers/$Slug.html"
