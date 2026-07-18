# Copies the static site into www/ for Capacitor bundling.
# Excludes server/host-only files that make no sense inside an app binary.
$src = Split-Path $PSScriptRoot -Parent      # the v4-site folder
$dst = Join-Path $PSScriptRoot 'www'

if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
New-Item -ItemType Directory -Force $dst | Out-Null

$exclude = @('app-wrapper', 'voltfield-site.zip', 'staticwebapp.config.json',
             'robots.txt', 'sitemap.xml', 'ads.txt', 'sw.js',
             'README.md', 'APP-STORES.md')

Get-ChildItem $src | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
  Copy-Item $_.FullName -Destination $dst -Recurse
}

# Inside the app the files are local — strip the service-worker registration guard is
# unnecessary (sw.js is excluded and registration is https/localhost-only), so nothing
# else to patch. Ads: AdSense must stay OFF in app builds (Google policy) — verify
# ads.provider is 'none' or preview:false in www/voltfield-site-config.js before shipping.
Write-Output "Site copied to $dst — now run: npx cap sync"
