/* Tell IndexNow (Bing, Yandex, Seznam, Naver and others) which pages exist or changed.

   node scripts/indexnow.mjs              pages whose sitemap <lastmod> is today
   node scripts/indexnow.mjs --since=2026-11-01   pages modified on or after a date
   node scripts/indexnow.mjs --all        every page in sitemap.xml
   node scripts/indexnow.mjs URL [URL...] the given voltfield.org URLs
   add --dry to print what would be sent without sending it

   Run it AFTER the deploy is live: IndexNow fetches the key file from the site
   to prove ownership, and a page it is told about should already be the new one.
   The key is public by design; it lives at /<key>.txt in the repo root. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'voltfield.org';
const KEY = 'c21f95379d5976aebd5325f145ed98f0';
const KEY_URL = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const sinceArg = args.find(a => a.startsWith('--since='));
const given = args.filter(a => !a.startsWith('--'));

const pad = n => String(n).padStart(2, '0');
const d = new Date();
const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
  loc: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1],
  lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1] || '',
})).filter(e => e.loc);

let urls;
if (given.length) {
  urls = given;
} else if (all) {
  urls = entries.map(e => e.loc);
} else {
  const since = sinceArg ? sinceArg.slice(8) : today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) { console.error('Bad --since date, use YYYY-MM-DD'); process.exit(1); }
  urls = entries.filter(e => e.lastmod.slice(0, 10) >= since).map(e => e.loc);
}
urls = [...new Set(urls)];
const bad = urls.filter(u => !u.startsWith(`https://${HOST}/`));
if (bad.length) { console.error('Not on ' + HOST + ':\n  ' + bad.join('\n  ')); process.exit(1); }
if (!urls.length) { console.log('Nothing to submit.'); process.exit(0); }

if (!fs.existsSync(path.join(ROOT, KEY + '.txt')) || fs.readFileSync(path.join(ROOT, KEY + '.txt'), 'utf8').trim() !== KEY) {
  console.error('Key file ' + KEY + '.txt is missing from the repo root or does not contain the key.'); process.exit(1);
}

console.log(`${urls.length} URL(s)` + (dry ? ' (dry run, nothing sent):' : ':'));
for (const u of urls.slice(0, 12)) console.log('  ' + u);
if (urls.length > 12) console.log(`  ... and ${urls.length - 12} more`);
if (dry) process.exit(0);

/* the key file has to be live, or the submission is rejected with 403 */
const kr = await fetch(KEY_URL);
const kt = kr.ok ? (await kr.text()).trim() : '';
if (kt !== KEY) { console.error(`Key file is not live yet at ${KEY_URL} (status ${kr.status}). Deploy first, then run this again.`); process.exit(1); }

/* IndexNow accepts up to 10,000 URLs per request */
for (let i = 0; i < urls.length; i += 10000) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_URL, urlList: urls.slice(i, i + 10000) }),
  });
  const meaning = { 200: 'accepted', 202: 'accepted, key validation pending', 400: 'bad request', 403: 'key not valid for this host', 422: 'URLs do not match the host or key', 429: 'too many requests, try later' }[res.status] || 'unexpected';
  console.log(`IndexNow answered ${res.status}: ${meaning}`);
  if (res.status !== 200 && res.status !== 202) { const t = await res.text(); if (t) console.log(t.slice(0, 300)); process.exit(1); }
}
