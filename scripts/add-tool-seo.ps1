# Injects the indexable explainer block into the interactive tool pages, and
# generates the matching JSON-LD from the block that was just inserted.
#
# The tools are JS applications: what a crawler sees is chrome plus an empty
# container. These pages measured 174-591 words of indexable text against 4,314
# on engineering-calculators.html, which is the same template already working.
#
# The FAQ markup is PARSED OUT of the inserted HTML rather than typed again, so
# the structured data cannot disagree with what the page shows.
#
# Pure ASCII on purpose: Windows PowerShell 5.1 reads .ps1 as ANSI, so a literal
# em-dash here becomes mojibake in the output. Entities are converted at runtime.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$frag = Join-Path $root 'scripts\tool-seo'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Unent([string]$t){
  $map = @{ '&mdash;'=[char]0x2014; '&ndash;'=[char]0x2013; '&rsquo;'=[char]0x2019;
            '&lsquo;'=[char]0x2018; '&ldquo;'=[char]0x201C; '&rdquo;'=[char]0x201D;
            '&nbsp;'=' '; '&deg;'=[char]0x00B0; '&amp;'='&' }
  foreach ($k in $map.Keys) { $t = $t.Replace($k, [string]$map[$k]) }
  return $t
}
function JsonStr([string]$t){
  $t = Unent $t
  $t = $t -replace '<[^>]+>',''
  return (($t -replace '\s+',' ').Trim() | ConvertTo-Json -Compress)
}

$TOOLS = @(
  @{ file='voltfield-eol.html';           frag='eol.html';
     name='EOL & Replacement Finder';
     desc='Map discontinued electrical platforms to current replacement classes.' },
  @{ file='voltfield-identify.html';      frag='identify.html';
     name='Part Identifier';
     desc='Identify electrical equipment from partial part numbers and markings.' },
  @{ file='voltfield-bom-generator.html'; frag='bom-generator.html';
     name='BOM Generator';
     desc='Break electrical equipment into the components it is assembled from.' },
  @{ file='voltfield-pcb.html';           frag='pcb.html';
     name='PCB Builder';
     desc='Place through-hole components and learn what each one does.' }
)

foreach ($t in $TOOLS) {
  $page = Join-Path $root $t.file
  $f    = Join-Path $frag $t.frag
  if (-not (Test-Path $f))    { throw "missing fragment: $f" }
  $s = [System.IO.File]::ReadAllText($page, [System.Text.Encoding]::UTF8)
  if ($s -match 'class="toolseo"') { Write-Host "skip (already done): $($t.file)"; continue }

  $block = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

  # --- FAQ JSON straight out of the block we are inserting ---
  $i = $block.IndexOf('<h2>Common questions</h2>')
  if ($i -lt 0) { throw "no Common questions section in $($t.frag)" }
  $ms = [regex]::Matches($block.Substring($i), '(?s)<h3>(.*?)</h3>\s*<p>(.*?)</p>')
  if ($ms.Count -lt 3) { throw "only $($ms.Count) FAQ pairs in $($t.frag)" }
  $faq = (@(foreach ($m in $ms) {
    '   {"@type":"Question","name":' + (JsonStr $m.Groups[1].Value) +
    ',"acceptedAnswer":{"@type":"Answer","text":' + (JsonStr $m.Groups[2].Value) + '}}'
  }) -join ",`n")

  $url = 'https://voltfield.org/' + $t.file
  $ld = @"
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[
 {"@type":"BreadcrumbList","itemListElement":[
   {"@type":"ListItem","position":1,"name":"Home","item":"https://voltfield.org/"},
   {"@type":"ListItem","position":2,"name":"Free Tools","item":"https://voltfield.org/free-tools.html"},
   {"@type":"ListItem","position":3,"name":"$($t.name)","item":"$url"}
 ]},
 {"@type":"WebApplication","name":"$($t.name)","url":"$url","applicationCategory":"EngineeringApplication","operatingSystem":"Any","description":"$($t.desc)","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"isPartOf":{"@type":"WebSite","name":"VOLTFIELD Supply Co.","url":"https://voltfield.org/"}},
 {"@type":"FAQPage","mainEntity":[
$faq
 ]}
]}
</script>
"@

  # --- insert the block before the footer, and the JSON-LD before </head> ---
  $anchor = $s.IndexOf('<footer')
  if ($anchor -lt 0) { throw "no <footer> in $($t.file)" }
  $s = $s.Substring(0, $anchor) + $block + "`n`n" + $s.Substring($anchor)

  $head = $s.IndexOf('</head>')
  if ($head -lt 0) { throw "no </head> in $($t.file)" }
  $s = $s.Substring(0, $head) + $ld + $s.Substring($head)

  [System.IO.File]::WriteAllText($page, $s, $utf8)
  Write-Host "wrote $($t.file)  (+$($ms.Count) FAQ)"
}
