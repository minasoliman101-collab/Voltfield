/* PDF downloads for the reference charts.

   Each chart page already has a print layout (the @media print block written
   by gen-charts.mjs). This prints those pages with headless Chrome, so the PDF
   is the page's own print sheet and cannot drift from it. Charts with metric
   tables get a second file printed with ?units=metric.

     node scripts/gen-chart-pdfs.mjs            every chart
     node scripts/gen-chart-pdfs.mjs <slug>...  only these

   Run it after gen-charts.mjs whenever a chart changes. Needs Chrome or Edge;
   set CHROME to the executable if it is not in one of the usual places.

   The pages are served from this folder on a throwaway local port, because
   they reference their stylesheets by absolute path. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { execFile } from 'node:child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'charts', 'pdf');
const only = process.argv.slice(2);

const CHROME = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(p => p && fs.existsSync(p));
if (!CHROME) throw new Error('No Chrome or Edge found. Set CHROME to the browser executable.');

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(ROOT, rel);
  /* the service worker would only cache this throwaway origin */
  if (!file.startsWith(ROOT) || rel === '/sw.js' || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const slugs = fs.readdirSync(path.join(ROOT, 'charts')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5))
  .filter(s => !only.length || only.includes(s));
fs.mkdirSync(OUT, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vf-pdf-'));

/* Not execFileSync: that would block this process, and this process is the
   server the browser is waiting on. */
async function print(slug, units) {
  const out = path.join(OUT, `voltfield-${slug}${units === 'metric' ? '-metric' : ''}.pdf`);
  await new Promise((ok, fail) => execFile(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--no-first-run',
    '--user-data-dir=' + profile, '--virtual-time-budget=6000', '--print-to-pdf=' + out,
    `http://127.0.0.1:${port}/charts/${slug}.html?units=${units}`], { timeout: 90000 }, err => err ? fail(err) : ok()));
  if (!fs.existsSync(out) || fs.statSync(out).size < 5000) throw new Error(slug + ' (' + units + '): no PDF written');
  const pages = (fs.readFileSync(out, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  console.log(`  ${path.basename(out)}  ${Math.round(fs.statSync(out).size / 1024)} KB  ${pages} page${pages === 1 ? '' : 's'}`);
}

try {
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(ROOT, 'charts', slug + '.html'), 'utf8');
    await print(slug, 'us');
    if (html.includes('data-chart-pdf="' + slug + '-metric"')) await print(slug, 'metric');
  }
} finally {
  server.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
}
console.log('chart PDFs written to charts/pdf');
