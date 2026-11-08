# Renders the 1200x630 Open Graph cards in social/.
#
# Why this exists at all: there wasn't one. The cards were generated once and
# then left behind by the business they advertised. The homepage card still
# read "Find the Exact Part, From Grid Gear to MRO -- 2M+ CONFIGURABLE SKUS",
# and social-generic.jpg -- the card 21 pages share, guides and the privacy
# policy among them -- read "VOLTFIELD Supply Co. ... 24-hour quotes", on a
# site whose own footer says nothing is for sale. Every share, every Slack and
# LinkedIn unfurl, led with a pitch for a catalog that no longer exists. With
# no generator in the repo, nobody was going to redraw 58 images by hand.
#
# Text comes from each page's own og:title / og:description (see
# gen-social-manifest.mjs), so a card cannot drift from its page again: fix the
# page's meta, re-run this, and the artwork follows. The two cards that
# describe the whole site rather than one page -- index and generic -- are the
# exception and carry text set in the manifest script.
#
# System.Drawing, not a Node image library, because the site has no build step
# and no dependencies beyond one Netlify Function; adding sharp to draw 58 JPEGs
# would be the largest dependency in the repo. GDI+ ships with Windows and
# scripts/ is already PowerShell.
#
#   node scripts/gen-social-manifest.mjs      # refresh social-cards.json
#   powershell -File scripts/gen-social-cards.ps1 [-Only social-index.jpg]
#
# Arial and Consolas are deliberate: the sector cards already on disk were
# drawn in them, and these have to sit alongside those without looking reskinned.

param(
  [string]$Manifest = "$PSScriptRoot\social-cards.json",
  [string]$OutDir   = "$PSScriptRoot\..\social",
  [string]$Only     = ""
)

Add-Type -AssemblyName System.Drawing

$W = 1200; $H = 630
$INK      = [System.Drawing.Color]::FromArgb(0x10, 0x1B, 0x2D)  # page navy
$INK_TOP  = [System.Drawing.Color]::FromArgb(0x18, 0x26, 0x3C)  # lift, top-right
$SIGNAL   = [System.Drawing.Color]::FromArgb(0xFF, 0xC4, 0x00)  # amber
$WHITE    = [System.Drawing.Color]::FromArgb(0xFF, 0xFF, 0xFF)
$SLATE    = [System.Drawing.Color]::FromArgb(0xA8, 0xB6, 0xC8)

$PAD = 72

function Measure-Text($g, $text, $font) {
  # StringFormat.GenericTypographic: without it MeasureString adds a few px of
  # padding per call, which compounds over a wrapped line and makes long titles
  # wrap a word early.
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $fmt.FormatFlags = $fmt.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
  return $g.MeasureString($text, $font, [System.Drawing.SizeF]::new(10000, 10000), $fmt)
}

function Wrap-Text($g, $text, $font, $maxWidth) {
  $words = $text -split '\s+'
  $lines = @(); $cur = ''
  foreach ($w in $words) {
    $try = if ($cur) { "$cur $w" } else { $w }
    if ((Measure-Text $g $try $font).Width -le $maxWidth) { $cur = $try }
    else { if ($cur) { $lines += $cur }; $cur = $w }
  }
  if ($cur) { $lines += $cur }
  return ,$lines
}

# Shrinks until the text fits maxLines, so a 30-character title and an
# 83-character one both fill the space instead of one overflowing.
function Fit-Text($g, $text, $family, $style, $maxWidth, $maxLines, $startSize, $minSize) {
  for ($size = $startSize; $size -ge $minSize; $size -= 2) {
    $f = New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
    $lines = Wrap-Text $g $text $f $maxWidth
    if ($lines.Count -le $maxLines) { return @{ Font = $f; Lines = $lines; Size = $size } }
    $f.Dispose()
  }
  $f = New-Object System.Drawing.Font($family, $minSize, $style, [System.Drawing.GraphicsUnit]::Pixel)
  $lines = Wrap-Text $g $text $f $maxWidth
  if ($lines.Count -gt $maxLines) {
    $lines = $lines[0..($maxLines - 1)]
    $lines[$maxLines - 1] = ($lines[$maxLines - 1] -replace '[\s\p{P}]+$', '') + '...'
  }
  return @{ Font = $f; Lines = $lines; Size = $minSize }
}

function Draw-Lines($g, $lines, $font, $brush, $x, $y, $leading) {
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $cy = $y
  foreach ($ln in $lines) {
    $g.DrawString($ln, $font, $brush, [single]$x, [single]$cy, $fmt)
    $cy += $leading
  }
  return $cy
}

# Amber tile with the bolt from the site's own favicon path, traced to 24x24.
function Draw-Logo($g, $x, $y, $size) {
  $tile = New-Object System.Drawing.SolidBrush($SIGNAL)
  $g.FillRectangle($tile, [single]$x, [single]$y, [single]$size, [single]$size)
  $tile.Dispose()
  $s = $size / 24.0
  $pts = @(
    [System.Drawing.PointF]::new($x + 13*$s, $y +  2*$s),
    [System.Drawing.PointF]::new($x +  4*$s, $y + 14*$s),
    [System.Drawing.PointF]::new($x + 10*$s, $y + 14*$s),
    [System.Drawing.PointF]::new($x +  9*$s, $y + 22*$s),
    [System.Drawing.PointF]::new($x + 18*$s, $y + 10*$s),
    [System.Drawing.PointF]::new($x + 12*$s, $y + 10*$s)
  )
  $bolt = New-Object System.Drawing.SolidBrush($INK)
  $g.FillPolygon($bolt, $pts)
  $bolt.Dispose()
}

function Render-Card($card, $outPath) {
  $bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  # AntiAliasGridFit, not ClearType: ClearType's subpixel fringes turn into
  # coloured speckle on a dark background once the JPEG is quantised.
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
          $rect, $INK_TOP, $INK, [single]215)
  $g.FillRectangle($bg, $rect); $bg.Dispose()

  Draw-Logo $g $PAD 58 64

  $wordFont  = New-Object System.Drawing.Font('Arial', 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $whiteB    = New-Object System.Drawing.SolidBrush($WHITE)
  $signalB   = New-Object System.Drawing.SolidBrush($SIGNAL)
  $slateB    = New-Object System.Drawing.SolidBrush($SLATE)
  $fmt       = [System.Drawing.StringFormat]::GenericTypographic
  $g.DrawString('VOLTFIELD', $wordFont, $whiteB, [single]($PAD + 88), [single]71, $fmt)

  # Tracking by hand. Joining the characters with a space (the obvious way)
  # gives roughly three times the letter-spacing the existing cards use and
  # reads as a different design; 3px is close to theirs.
  $eyeFont = New-Object System.Drawing.Font('Consolas', 17, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $ex = [single]$PAD
  foreach ($ch in $card.eyebrow.ToUpper().ToCharArray()) {
    $g.DrawString($ch, $eyeFont, $signalB, $ex, [single]208, $fmt)
    $ex += (Measure-Text $g ([string]$ch) $eyeFont).Width + 3
  }

  # Title and subtitle are measured as one block and anchored to a common
  # baseline near the foot of the card, which is what the sector cards already
  # on disk do -- so a one-line title and a three-line one both sit on the same
  # line above the URL instead of the short ones floating with a hole beneath.
  #
  # Two earlier attempts were wrong in opposite directions: anchoring the
  # subtitle a fixed distance up from the URL overlapped the title once it
  # wrapped to three lines, and flowing both from the top left short cards
  # bottom-heavy with empty space.
  $maxW     = $W - (2 * $PAD)
  $TITLE_Y  = 248   # title hangs from just under the eyebrow
  $SUB_END  = 545   # subtitle's last line ends here, clear of the URL at 562
  $SUB_LEAD = 32

  $title = Fit-Text $g $card.title 'Arial' ([System.Drawing.FontStyle]::Bold) $maxW 3 60 36
  $leading = [math]::Round($title.Size * 1.16)
  Draw-Lines $g $title.Lines $title.Font $whiteB $PAD $TITLE_Y $leading | Out-Null

  if ($card.subtitle) {
    $subFont  = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $subLines = Wrap-Text $g $card.subtitle $subFont $maxW
    if ($subLines.Count -gt 2) {
      $subLines = @($subLines[0..1])
      $subLines[1] = ($subLines[1] -replace '[\s\p{P}]+$', '') + '...'
    }
    $subY = $SUB_END - ($subLines.Count * $SUB_LEAD)

    # Worst case is a three-line title: its last line ends near 458 and the
    # subtitle starts at 481, so they clear. Asserted rather than assumed,
    # because the two blocks are positioned from opposite edges and nothing
    # else would catch them meeting in the middle.
    $titleEnd = $TITLE_Y + ($title.Lines.Count * $leading)
    if ($titleEnd -gt $subY) {
      Write-Warning "$($card.file): title and subtitle overlap ($titleEnd > $subY); dropping subtitle to one line"
      $subLines = @(($subLines[0] -replace '[\s\p{P}]+$', '') + '...')
      $subY = $SUB_END - $SUB_LEAD
    }

    Draw-Lines $g $subLines $subFont $slateB $PAD $subY $SUB_LEAD | Out-Null
    $subFont.Dispose()
  }

  if ($card.url) {
    $urlFont = New-Object System.Drawing.Font('Consolas', 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString($card.url, $urlFont, $signalB, [single]$PAD, [single]562, $fmt)
    $urlFont.Dispose()
  }

  $g.FillRectangle($signalB, 0, $H - 8, $W, 8)

  $wordFont.Dispose(); $eyeFont.Dispose(); $title.Font.Dispose()
  $whiteB.Dispose(); $signalB.Dispose(); $slateB.Dispose()

  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
                  [System.Drawing.Imaging.Encoder]::Quality, [int64]88)
  $bmp.Save($outPath, $codec, $p)

  $g.Dispose(); $bmp.Dispose()
}

# -Encoding UTF8 is load-bearing. Windows PowerShell 5.1's Get-Content
# defaults to the ANSI codepage, so every em dash in the manifest (U+2014,
# three bytes in UTF-8) came through as the three characters "a€"" and got
# drawn that way onto the cards.
$cards = Get-Content -Raw -Encoding UTF8 -Path $Manifest | ConvertFrom-Json
$OutDir = (Resolve-Path $OutDir).Path
$n = 0
foreach ($c in $cards) {
  if ($Only -and $c.file -ne $Only) { continue }
  Render-Card $c (Join-Path $OutDir $c.file)
  $n++
}
Write-Output "  rendered $n card(s) into $OutDir"
