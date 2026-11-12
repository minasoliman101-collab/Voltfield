/* Builds embed-calculators.html: the page that lists every embeddable
   calculator, lets a visitor pick one and see it running, and gives the
   snippet. Uses contact.html for the site chrome, as a plain root-level page.

   Run after gen-embed-widget.mjs (it reads the list from the widget it wrote):
     node scripts/gen-embed-widget.mjs && node scripts/gen-embed-page.mjs */
import fs from 'node:fs';

const BASE = 'https://voltfield.org/';
const FILE = 'embed-calculators.html';
const TODAY = new Date().toISOString().slice(0, 10);

const w = fs.readFileSync('embed/calculator-widget.js', 'utf8');
const m = w.match(/var TOOLS=(\{.*\});\n/);
if (!m) throw new Error('could not read the tool list from embed/calculator-widget.js');
const TOOLS = JSON.parse(m[1].split('<\\/script').join('</script'));
const list = Object.keys(TOOLS).map(s => [s, TOOLS[s].t]).sort((a, b) => a[1].localeCompare(b[1]));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const N = list.length;

const title = 'Embed a Free Electrical Calculator on Your Site';
const h1 = 'Embeddable Calculators';
const desc = `Add any of ${N} free electrical and cooling calculators to your own web page with a two-line snippet. No signup, no tracking, light or dark, US or metric.`;

const first = list.find(x => x[0] === 'voltage-drop') || list[0];
const snippet = (slug, t) => `&lt;div class="vf-calc-widget" data-calc="${slug}"&gt;
  &lt;a href="https://voltfield.org/calculators/${slug}.html"&gt;${esc(t)}&lt;/a&gt; by Voltfield
&lt;/div&gt;
&lt;script src="https://voltfield.org/embed/calculator-widget.js" async&gt;&lt;/script&gt;`;

const main = `<main id="main" tabindex="-1">
<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <a href="engineering-calculators.html" style="color:var(--slate);text-decoration:none">Calculators</a> / <span style="color:var(--ink)">Embed</span></nav>
    <div class="eyebrow">For Your Site &middot; Free</div>
    <h1>${h1}</h1>
    <p class="dek">Put a working Voltfield calculator on your own page: a course site, a blog post, a contractor&rsquo;s resources page, an internal wiki. Two lines of HTML, ${N} calculators to choose from.</p>
  </div>
</section>
<div class="artwrap">

  <p><b>Pick a calculator, copy the snippet, paste it where you want the calculator to appear.</b> It is the same calculator as the one on Voltfield, running in your reader&rsquo;s browser. There is no account, no key and no charge, and it keeps a link back to the page that explains the method.</p>

  <h2 id="build">Choose and preview</h2>
  <div class="embed-pick">
    <div class="est-field"><label for="epCalc">Calculator</label><select id="epCalc">
${list.map(([s, t]) => `      <option value="${s}"${s === first[0] ? ' selected' : ''}>${esc(t)}</option>`).join('\n')}
    </select></div>
    <div class="est-field"><label for="epTheme">Appearance</label><select id="epTheme"><option value="light">Light</option><option value="dark">Dark</option></select></div>
    <div class="est-field"><label for="epUnits">Opens in</label><select id="epUnits"><option value="">US units</option><option value="metric">Metric units</option></select></div>
  </div>

  <div class="vf-embed code-only">
    <div class="vf-embed-code">
      <pre id="embedSnippet">${snippet(first[0], first[1])}</pre>
      <button type="button" id="copyEmbedBtn">Copy snippet</button>
    </div>
  </div>

  <h3 id="epPrevH">Preview</h3>
  <div class="embed-prev" id="epPrev" aria-labelledby="epPrevH"><p class="chartcap" style="margin:0">The preview needs JavaScript. The snippet above works without it being on here.</p></div>

  <h2>What you are adding to your page</h2>
  <ul>
    <li><b>The real calculator.</b> The snippet loads the same code the Voltfield page runs, so the result, the warnings and the rounding are identical, and a correction made here reaches your copy without you doing anything.</li>
    <li><b>Nothing that follows your readers.</b> The embedded calculator loads its code and stylesheet from voltfield.org and nothing else. It sets no cookies, runs no analytics, and what a reader types never leaves their browser.</li>
    <li><b>Something that cannot disturb your page.</b> It runs in its own frame. Your styles do not reach in and its styles do not reach out, and it sizes itself to its contents.</li>
    <li><b>A link back.</b> Under the calculator is a link to the page on Voltfield that gives the formula, a worked example and what the calculation leaves out. Please keep it: it is what the embed asks in return, and it is what lets your reader check the working.</li>
  </ul>

  <h2>Options</h2>
  <p>Set these as attributes on the <code>div</code>.</p>
  <ul>
    <li><code>data-calc</code>: which calculator. The names are in the list below.</li>
    <li><code>data-theme="dark"</code>: for a dark page. Leave it out for light.</li>
    <li><code>data-units="metric"</code>: open in metric on the calculators that have both systems. The reader can still switch.</li>
  </ul>
  <p>You can put several calculators on one page. Include the <code>script</code> line once, after the last one.</p>

  <h2>If it does not appear</h2>
  <p>Some site builders remove <code>script</code> tags from pasted HTML. Use the builder&rsquo;s &ldquo;custom HTML&rdquo; or &ldquo;embed code&rdquo; block, which keeps them. A strict content security policy needs to allow scripts, styles and frames from <code>https://voltfield.org</code>. Where neither is possible, the link in the snippet still shows, and takes the reader to the calculator.</p>

  <h2 id="all">All ${N} embeddable calculators</h2>
  <ul class="embed-all">
${list.map(([s, t]) => `    <li><a class="inline" href="calculators/${s}.html">${esc(t)}</a> <code>${s}</code></li>`).join('\n')}
  </ul>

  <div class="callout"><b>These are screening tools.</b> Each calculator states its method and its limits on its own page. Embedding one does not change that: it is an estimate to check an order of magnitude, not a design. The <a class="inline" href="terms.html">terms of use</a> apply to embedded copies as they do here.</div>

  <h2>Questions</h2>
  <p>If you want a calculator that is not here, or something about the embed does not work on your platform, the <a class="inline" href="contact.html">contact page</a> says how to reach us. The <a class="inline" href="lead-time-index.html">Lead-Time Index</a> has an embeddable widget of its own, and the <a class="inline" href="reference-charts.html">reference charts</a> are free to print and reproduce.</p>

</div>
</main>`;

const STYLE = `<link rel="stylesheet" href="voltfield-calculators.css">
<style>
.embed-pick{display:flex;flex-wrap:wrap;gap:12px;margin:14px 0 4px}
.embed-pick .est-field{min-width:180px;flex:1 1 180px}
.embed-pick select{width:100%}
.embed-prev{margin:10px 0 26px;padding:14px;border:1px dashed var(--line-dark);border-radius:var(--r-m,8px);min-height:120px}
.embed-prev[data-dark="1"]{background:#0B1420}
.embed-all{columns:2;column-gap:28px;padding-left:18px}
.embed-all li{break-inside:avoid;margin-bottom:6px}
.embed-all code{font-size:12px;color:var(--slate)}
@media(max-width:640px){.embed-all{columns:1}}
</style>`;

const SCRIPT = `<script src="embed/calculator-widget.js"></script>
<script>
(function(){
  var sel=document.getElementById('epCalc'),th=document.getElementById('epTheme'),un=document.getElementById('epUnits');
  var pre=document.getElementById('embedSnippet'),prev=document.getElementById('epPrev'),btn=document.getElementById('copyEmbedBtn');
  if(!sel||!window.VoltfieldCalc)return;
  function draw(){
    var slug=sel.value,t=sel.options[sel.selectedIndex].textContent,dark=th.value==='dark',metric=un.value==='metric';
    pre.textContent='<div class="vf-calc-widget" data-calc="'+slug+'"'+(dark?' data-theme="dark"':'')+(metric?' data-units="metric"':'')+'>\\n'+
      '  <a href="https://voltfield.org/calculators/'+slug+'.html">'+t+'</a> by Voltfield\\n</div>\\n'+
      '<script src="https://voltfield.org/embed/calculator-widget.js" async><\\/script>';
    prev.textContent='';
    if(dark)prev.setAttribute('data-dark','1');else prev.removeAttribute('data-dark');
    var d=document.createElement('div');
    d.className='vf-calc-widget';d.setAttribute('data-calc',slug);
    if(dark){d.setAttribute('data-theme','dark');d.style.color='#C9D3DF';}
    if(metric)d.setAttribute('data-units','metric');
    prev.appendChild(d);
    window.VoltfieldCalc.render(d);
  }
  [sel,th,un].forEach(function(e){e.addEventListener('change',draw);});
  try{var q=new URLSearchParams(location.search).get('calc');if(q&&sel.querySelector('option[value="'+q+'"]'))sel.value=q;}catch(e){}
  draw();
  btn.addEventListener('click',function(){
    var t=pre.textContent;
    (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){
      btn.textContent='Copied';setTimeout(function(){btn.textContent='Copy snippet';},1800);
      if(window.vfGtag)window.vfGtag('event','embed_copy',{calc:sel.value,from:'embed-page'});
    },function(){btn.textContent='Select the text to copy';setTimeout(function(){btn.textContent='Copy snippet';},2200);});
  });
})();
</script>`;

const ld = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    { '@type': 'ListItem', position: 2, name: 'Calculators', item: BASE + 'engineering-calculators.html' },
    { '@type': 'ListItem', position: 3, name: h1, item: BASE + FILE }] },
  { '@type': 'WebPage', name: h1, description: desc, url: BASE + FILE, dateModified: TODAY, inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'Voltfield', url: BASE }, publisher: { '@type': 'Organization', name: 'Voltfield', url: BASE } },
  { '@type': 'ItemList', name: 'Embeddable calculators', numberOfItems: N,
    itemListElement: list.map(([s, t], i) => ({ '@type': 'ListItem', position: i + 1, name: t, url: BASE + 'calculators/' + s + '.html' })) }
] };

let s = fs.readFileSync('contact.html', 'utf8').replace(/\r\n/g, '\n');
const one = (re, to, label) => { if (!re.test(s)) throw new Error('template: no match for ' + label); s = s.replace(re, to); };
one(/<title>[^<]*<\/title>/, () => `<title>${esc(title)} | Voltfield</title>`, 'title');
one(/<link rel="canonical" href="[^"]*">/, () => `<link rel="canonical" href="${BASE + FILE}">`, 'canonical');
one(/<meta property="og:url" content="[^"]*">/, () => `<meta property="og:url" content="${BASE + FILE}">`, 'og:url');
one(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${esc(desc)}">`, 'description');
one(/<meta property="og:title" content="[^"]*">/, () => `<meta property="og:title" content="${esc(h1)}">`, 'og:title');
one(/<meta property="og:description" content="[^"]*">/, () => `<meta property="og:description" content="${esc(desc)}">`, 'og:description');
one(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">\n${JSON.stringify(ld)}\n</script>`, 'json-ld');
one(/<\/head>/, () => STYLE + '\n</head>', 'head end');
one(/<main id="main" tabindex="-1">[\s\S]*<\/main>/, () => main, 'main');
one(/<\/body>/, () => SCRIPT + '\n</body>', 'body end');
fs.writeFileSync(FILE, s);
console.log(`${FILE}: ${N} calculators listed`);
