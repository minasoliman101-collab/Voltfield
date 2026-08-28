# Generates the battery-storage and renewables category clusters.
#
# The FAQ structured data is PARSED OUT of each body fragment rather than
# retyped here. Google requires the marked-up Q&A to match what the page
# actually shows, and hand-maintaining two copies is how they drift apart.
#
# Note: written in pure ASCII on purpose. Windows PowerShell 5.1 reads .ps1 as
# ANSI, so a literal em-dash in this file becomes mojibake in the output. HTML
# entities are converted to real characters at runtime instead.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\minas\AppData\Local\Temp\claude\C--Users-minas-Desktop\57cb7386-2fb4-45d2-b459-f0af4d0e9662\scratchpad\Voltfield'
$bodies = Join-Path $root 'scripts\category-bodies'

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
  $t = ($t -replace '\s+',' ').Trim()
  return ($t | ConvertTo-Json -Compress)
}

# Pull the "Common questions" h3/p pairs out of a body fragment.
function FaqJson([string]$file){
  $b = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
  $i = $b.IndexOf('<h2>Common questions</h2>')
  if ($i -lt 0) { throw "no Common questions section in $file" }
  $tail = $b.Substring($i)
  $ms = [regex]::Matches($tail, '(?s)<h3>(.*?)</h3>\s*<p>(.*?)</p>')
  if ($ms.Count -lt 3) { throw "only $($ms.Count) FAQ pairs found in $file" }
  $items = foreach ($m in $ms) {
    '   {"@type":"Question","name":' + (JsonStr $m.Groups[1].Value) +
    ',"acceptedAnswer":{"@type":"Answer","text":' + (JsonStr $m.Groups[2].Value) + '}}'
  }
  return ($items -join ",`n")
}

function LdGraph($sectorName, $sectorUrl, $leaf, $url, $collName, $collDesc, $bodyFile){
  $faq = FaqJson $bodyFile
  return @"
 {"@type":"BreadcrumbList","itemListElement":[
   {"@type":"ListItem","position":1,"name":"Home","item":"https://voltfield.org/"},
   {"@type":"ListItem","position":2,"name":"$sectorName","item":"https://voltfield.org/$sectorUrl"},
   {"@type":"ListItem","position":3,"name":"$leaf","item":"https://voltfield.org/$url"}
 ]},
 {"@type":"CollectionPage","name":"$collName","description":"$collDesc","url":"https://voltfield.org/$url","isPartOf":{"@type":"WebSite","name":"VOLTFIELD Supply Co.","url":"https://voltfield.org/"}},
 {"@type":"FAQPage","mainEntity":[
$faq
 ]}
"@
}

$PAGES = @(
  @{ dir='battery-storage'; slug='bess-enclosures'; sector='Battery Storage'; sectorUrl='battery-storage.html'
     leaf='BESS Enclosures'
     title='BESS Enclosures &amp; Battery Modules | Voltfield'
     desc='Containerized BESS enclosures, battery modules and fire protection: configurations, UL 9540A and NFPA 855 considerations, and indicative lead times.'
     kw='BESS enclosure, containerized battery storage, LFP battery module, UL 9540A, NFPA 855, battery energy storage system'
     h1='Battery Storage Enclosures &amp; Modules'
     dek='Containerized enclosures, modular cabinets, battery modules and the fire protection that decides whether any of it can be permitted.'
     collName='BESS Enclosures and Battery Modules'
     collDesc='Containerized battery energy storage enclosures, modules and fire protection equipment, with configurations, standards and indicative lead times.'
     ctaH3='Sizing a storage block?'
     ctaP='Lay out enclosures, conversion and the electrical room, then export the result as a bill of materials.'
     ctaHref='/voltfield-pod-designer.html'; ctaLabel='Open the POD Designer' },

  @{ dir='battery-storage'; slug='pcs-inverters'; sector='Battery Storage'; sectorUrl='battery-storage.html'
     leaf='Power Conversion'
     title='BESS Power Conversion Systems (PCS) | Voltfield'
     desc='Central, modular and grid-forming PCS for battery storage: ratings, UL 1741 SB certification, grid support requirements and indicative lead times.'
     kw='power conversion system, PCS, BESS inverter, grid-forming inverter, UL 1741 SB, IEEE 1547, IEEE 2800'
     h1='Power Conversion Systems'
     dek='The converter sets the power rating, the fault behaviour and the grid services a storage plant can actually be paid for.'
     collName='Battery Storage Power Conversion Systems'
     collDesc='Central, modular, grid-forming and behind-the-meter power conversion systems for battery storage, with ratings, standards and indicative lead times.'
     ctaH3='Working out a conversion rating?'
     ctaP='Run the load and current numbers, then build the circuit from source to point of interconnection.'
     ctaHref='/engineering-calculators.html'; ctaLabel='Open the calculators' },

  @{ dir='battery-storage'; slug='balance-of-plant'; sector='Battery Storage'; sectorUrl='battery-storage.html'
     leaf='Balance of Plant'
     title='BESS Balance of Plant &amp; MV Equipment | Voltfield'
     desc='MV step-up transformers, collector switchgear, protection relays and station service for battery storage, with indicative lead times and scope-split guidance.'
     kw='BESS balance of plant, MV step-up transformer, collector switchgear, plant controller, station service, storage interconnection'
     h1='Balance of Plant &amp; MV Equipment'
     dek='Transformers, collector switchgear, protection and auxiliary power &mdash; the items that usually set the energisation date.'
     collName='Battery Storage Balance of Plant'
     collDesc='Medium-voltage transformers, collector switchgear, protection relays and station service equipment for battery energy storage projects.'
     ctaH3='Mapping the scope split?'
     ctaP='Work through what belongs in each package before the RFQ goes out, using the readiness checklist.'
     ctaHref='/specification-checklist.html'; ctaLabel='Open the RFQ toolkit' },

  @{ dir='renewables'; slug='solar-inverters'; sector='Renewables'; sectorUrl='renewables.html'
     leaf='Solar Inverters'
     title='Solar Inverters: String, Central &amp; Hybrid | Voltfield'
     desc='String, central, commercial and hybrid PV inverters: ratings, MPPT granularity, UL 1741 SB certification and indicative lead times.'
     kw='solar inverter, string inverter, central inverter, hybrid inverter, UL 1741 SB, DC AC ratio, MPPT'
     h1='Solar Inverters'
     dek='String or central is a site decision &mdash; terrain, shading and service access decide it, not a preference.'
     collName='Solar Inverters'
     collDesc='String, central, commercial three-phase and hybrid PV inverters, with configurations, grid support certification and indicative lead times.'
     ctaH3='Sizing an inverter block?'
     ctaP='Work the DC/AC ratio and the current numbers before the specification is fixed.'
     ctaHref='/engineering-calculators.html'; ctaLabel='Open the calculators' },

  @{ dir='renewables'; slug='dc-collection'; sector='Renewables'; sectorUrl='renewables.html'
     leaf='DC Collection'
     title='PV Combiners, Recombiners &amp; DC Cable | Voltfield'
     desc='String combiners, recombiners, PV wire and rapid shutdown equipment: 1500V configurations, NEC requirements and indicative lead times.'
     kw='PV combiner box, recombiner, PV wire, MC4 connector, rapid shutdown, NEC 690.12, 1500V solar'
     h1='DC Collection &amp; Combiners'
     dek='Source-circuit protection, combiners, cable and connectors &mdash; none of it generates anything, and all of it can lose energy.'
     collName='PV DC Collection Equipment'
     collDesc='String combiner boxes, recombiners, PV wire and connectors, and rapid shutdown equipment, with configurations, standards and indicative lead times.'
     ctaH3='Checking a string design?'
     ctaP='Run voltage drop and ampacity against real conditions before the combiner schedule is issued.'
     ctaHref='/engineering-calculators.html'; ctaLabel='Open the calculators' },

  @{ dir='renewables'; slug='ac-collection'; sector='Renewables'; sectorUrl='renewables.html'
     leaf='AC Collection'
     title='Solar AC Collection: Transformers &amp; Switchgear | Voltfield'
     desc='Pad-mount step-up transformers, collector feeders, collector switchgear and main power transformers for renewable plants, with indicative lead times.'
     kw='collector substation, pad mount step up transformer, collector switchgear, MV feeder, main power transformer, 34.5kV collection'
     h1='AC Collection &amp; Substation'
     dek='Everything the plant produces leaves through this equipment &mdash; and it carries the longest lead times on the project.'
     collName='Renewable Plant AC Collection Equipment'
     collDesc='Pad-mount step-up transformers, collector feeders, collector switchgear and main power transformers for renewable energy plants.'
     ctaH3='Sequencing a long-lead package?'
     ctaP='See where current lead times sit, and what drives them, before the procurement plan is set.'
     ctaHref='/lead-time-index.html'; ctaLabel='Open the lead-time index' }
)

foreach ($p in $PAGES) {
  $outRel   = $p.dir + '/' + $p.slug + '.html'
  $bodyFile = Join-Path $bodies ('body-' + $(if ($p.dir -eq 'battery-storage' -and $p.slug -eq 'balance-of-plant') { 'bess-balance-of-plant' } else { $p.slug }) + '.html')
  if (-not (Test-Path $bodyFile)) { throw "missing body fragment: $bodyFile" }

  $ld = LdGraph $p.sector $p.sectorUrl $p.leaf $outRel $p.collName $p.collDesc $bodyFile
  $crumbMid = '<a href="/' + $p.sectorUrl + '">' + $p.sector + '</a><span class="sep">/</span>' + "`n          "

  $dir = Join-Path $root $p.dir
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

  & (Join-Path $root 'scripts\make-category-page.ps1') `
      -Slug $p.slug -Title $p.title -Desc $p.desc -Keywords $p.kw `
      -CrumbName $p.leaf -H1 $p.h1 -Dek $p.dek -LdGraph $ld -BodyFile $bodyFile `
      -CtaH3 $p.ctaH3 -CtaP $p.ctaP -CtaHref $p.ctaHref -CtaLabel $p.ctaLabel `
      -OutRel $outRel -CrumbMid $crumbMid

  # Two things the shared template carries from the data-center page that are
  # wrong on any other sector: the banner eyebrow and the social card image.
  $out = Join-Path $root ($outRel -replace '/','\')
  $s = [System.IO.File]::ReadAllText($out, [System.Text.Encoding]::UTF8)
  $before = $s
  $s = $s.Replace('<div class="eyebrow">Data Centers ',
                  '<div class="eyebrow">' + $p.sector + ' ')
  $s = $s.Replace('social/social-data-centers.jpg', 'social/social-' + $p.dir + '.jpg')
  if ($s -eq $before) { throw "eyebrow/social fixups matched nothing in $outRel" }
  [System.IO.File]::WriteAllText($out, $s, (New-Object System.Text.UTF8Encoding($false)))
}
Write-Host "done: $($PAGES.Count) pages"
