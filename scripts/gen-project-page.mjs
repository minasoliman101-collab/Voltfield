/* Builds project-sheet.html: the list of results a visitor has saved from the
   calculators ("Save to project sheet", in voltfield-calculators.js), with a
   name, a note on each line, and a print layout that makes one clean page.

   Everything lives in the visitor's browser (localStorage key vf_project, and
   vf_project_meta for the name). Nothing is sent anywhere and there is no
   account, which is also the limit: the sheet does not follow them to another
   device. Printing, saving as PDF, copying as text and the link on each line
   are the ways out.

   Uses contact.html for the site chrome.   node scripts/gen-project-page.mjs */
import fs from 'node:fs';

const BASE = 'https://voltfield.org/';
const FILE = 'project-sheet.html';
const TODAY = new Date().toISOString().slice(0, 10);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const title = 'Project Calculation Sheet: Save & Print Results';
const h1 = 'Project Calculation Sheet';
const desc = 'Keep the results of several electrical and cooling calculations on one sheet, add notes, and print or save it as a PDF. Stored in your browser, no account.';

const main = `<main id="main" tabindex="-1">
<section class="artban">
  <div class="artban-in">
    <nav aria-label="Breadcrumb" class="crumbnav" style="font-family:var(--mono);font-size:11px;color:var(--slate);margin-bottom:12px"><a href="/" style="color:var(--slate);text-decoration:none">Home</a> / <a href="engineering-calculators.html" style="color:var(--slate);text-decoration:none">Calculators</a> / <span style="color:var(--ink)">Project sheet</span></nav>
    <div class="eyebrow">Your Saved Results</div>
    <div class="print-head" aria-hidden="true">VOLTFIELD <span>voltfield.org</span></div>
    <h1>${h1}</h1>
    <p class="dek">The results you have saved from the calculators, on one page you can annotate and print.</p>
  </div>
</section>
<div class="artwrap">

  <noscript><p class="callout">The project sheet is kept in your browser and needs JavaScript to show it.</p></noscript>

  <div id="psFull" hidden>
    <div class="ps-meta">
      <div class="est-field ps-name"><label for="psName">Project or job name</label><input type="text" id="psName" maxlength="120" placeholder="e.g. Building C feeder check" autocomplete="off"></div>
      <div class="ps-date" id="psDate"></div>
    </div>
    <div class="ps-actions">
      <button type="button" id="psPrint">Print or save as PDF</button>
      <button type="button" id="psCopy">Copy as text</button>
      <button type="button" id="psClear" class="ps-danger">Clear the sheet</button>
    </div>
    <ol class="ps-list" id="psList"></ol>
    <p class="print-foot">Results from the calculators at voltfield.org, saved and printed by the reader. Each is a screening estimate from the inputs shown, by the method given on that calculator&rsquo;s page. Not a design, and not a substitute for the adopted code or a calculation by a qualified engineer.</p>
  </div>

  <div id="psEmpty">
    <p><b>Nothing saved yet.</b> Run any calculator, then press <b>Save to project sheet</b> under the result. It appears here with its inputs, and you can add as many as the job needs.</p>
    <div class="rel">
      <a href="calculators/voltage-drop.html">Voltage drop</a>
      <a href="calculators/wire-size.html">Wire size</a>
      <a href="calculators/transformer-sizing.html">Transformer sizing</a>
      <a href="calculators/breaker-size.html">Breaker size</a>
      <a href="calculators/btu-to-tons.html">Cooling load</a>
      <a href="engineering-calculators.html">All calculators</a>
    </div>
  </div>

  <div class="web-only">
  <h2>What the sheet is for</h2>
  <p>A real job is rarely one calculation. Sizing a feeder means a load current, a wire size, a voltage drop check and a breaker; a small plant room means a heat load, an airflow and a pump. The sheet keeps those results together, in the order you saved them, with the inputs that produced each one, so the working can be read by someone else or by you next week.</p>
  <p>Each line keeps a link that reopens its calculator with the same inputs. Change a figure there, save again, and the line is replaced with the new result.</p>

  <h2>Where it is kept</h2>
  <p>In this browser, on this device, and nowhere else. There is no account and nothing is uploaded, which means the sheet is private and also that it does not travel: it will not be on your phone if you built it on your laptop, and clearing your browser&rsquo;s site data removes it. To keep a copy or pass it on, print it, save it as a PDF, or copy it as text.</p>

  <div class="callout"><b>These are screening estimates.</b> The sheet records what the calculators returned for the inputs shown. It is a way to keep your working together, not a design document, and it does not replace the adopted code or a calculation by a qualified engineer.</div>
  </div>

</div>
</main>`;

const STYLE = `<link rel="stylesheet" href="voltfield-calculators.css">
<style>
.ps-meta{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin:6px 0 12px}
.ps-name{flex:1 1 320px}
.ps-name input{width:100%}
.ps-date{font-family:var(--mono);font-size:12px;color:var(--slate);padding-bottom:10px}
.ps-actions{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 18px}
.ps-actions button,.ps-item button{font:600 12px/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;padding:10px 14px;min-height:40px;
  background:var(--card);color:var(--ink);border:1px solid var(--line-dark);border-radius:var(--r-s,6px);cursor:pointer}
.ps-actions button:hover,.ps-item button:hover{border-color:var(--signal)}
.ps-actions .ps-danger{margin-left:auto;color:var(--slate)}
.artwrap .ps-list{list-style:none;padding:0;margin:0;counter-reset:ps}
.ps-note-print{display:none}
.ps-item{counter-increment:ps;background:var(--card);border:1px solid var(--line-dark);border-radius:var(--r-m,8px);padding:16px 18px;margin:0 0 12px}
.ps-item h2{font-size:17px;margin:0 0 8px;display:flex;gap:10px;align-items:baseline}
.ps-item h2::before{content:counter(ps) ".";font-family:var(--mono);font-size:13px;color:var(--slate)}
.ps-res{font-size:15.5px;line-height:1.55;margin:0 0 10px;color:var(--ink)}
.ps-in{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 10px;padding:0;font-size:13.5px;color:var(--ink-2)}
.ps-in div{display:flex;gap:6px}
.ps-in dt{color:var(--slate)}
.ps-in dd{margin:0;font-variant-numeric:tabular-nums}
.ps-note{width:100%;min-height:42px;font:inherit;font-size:14px;padding:8px 10px;border:1px solid var(--line-dark);border-radius:var(--r-s,6px);background:var(--bg,transparent);color:var(--ink);resize:vertical}
.ps-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
.ps-row a{font-size:13.5px}
.ps-row .ps-when{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--slate)}
.ps-item button{padding:7px 10px;min-height:32px;font-size:11px}
.ps-link{display:none}
.print-head,.print-foot{display:none}
@media(max-width:520px){.ps-actions .ps-danger{margin-left:0}}
@page{size:letter portrait;margin:13mm 12mm 14mm}
@media print{
  header.site,footer,.ad-unit,.skip-link,.totop,.crumbnav,.eyebrow,.dek,.web-only,.ps-actions,.ps-item button,#psEmpty,#themeToggle,#unitsToggle{display:none!important}
  html,body{background:#fff!important}
  html[data-theme] main *,main *{color:#000!important;background:transparent!important;box-shadow:none!important}
  .artban{padding:0!important;border:0!important;margin:0!important}
  .artban-in,.artwrap{max-width:none!important;padding:0!important;margin:0!important}
  .print-head{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5pt solid #000;padding-bottom:3pt;margin-bottom:8pt;font:700 10pt/1.2 var(--mono);letter-spacing:.06em}
  .print-head span{font-weight:400;letter-spacing:0;font-size:8.5pt}
  h1{font-size:17pt!important;margin:0 0 6pt!important}
  .ps-meta{margin:0 0 8pt;gap:10pt}
  .ps-name label{display:none}
  .ps-name input{border:0!important;padding:0!important;font-size:12pt!important;font-weight:600}
  .ps-name input:placeholder-shown{display:none}
  .ps-date{padding:0;font-size:8.5pt}
  .ps-item{border:0!important;border-top:.5pt solid #999!important;border-radius:0;padding:7pt 0 5pt;margin:0;break-inside:avoid;page-break-inside:avoid}
  .ps-item h2{font-size:11pt!important;margin:0 0 3pt!important}
  .artwrap .ps-res{font-size:10pt;line-height:1.4;margin:0 0 3pt}
  .ps-in{font-size:8.5pt;margin:0 0 3pt}
  /* a textarea prints at its box height, not its text height: print the text */
  .ps-note{display:none!important}
  .ps-note-print{display:block;font-size:9pt;font-style:italic;white-space:pre-wrap;margin:0 0 2pt}
  .ps-note-print:empty{display:none}
  .ps-row{margin-top:2pt}
  .ps-row a.ps-open{display:none}
  .ps-link{display:block;font-size:7pt;word-break:break-all;color:#444!important}
  .ps-row .ps-when{margin-left:0;font-size:7.5pt}
  .print-foot{display:block;margin-top:9pt;padding-top:4pt;border-top:.5pt solid #000;font-size:7.5pt!important;line-height:1.35}
}
</style>`;

const SCRIPT = `<script>
(function(){
  var KEY='vf_project',META='vf_project_meta';
  var full=document.getElementById('psFull'),empty=document.getElementById('psEmpty'),listEl=document.getElementById('psList');
  var nameEl=document.getElementById('psName'),dateEl=document.getElementById('psDate');
  if(!full||!listEl)return;
  function read(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(function(x){return x&&typeof x==='object'&&x.r;}):[];}catch(e){return [];}}
  function write(a){try{localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
  function meta(){try{var m=JSON.parse(localStorage.getItem(META)||'{}');return m&&typeof m==='object'?m:{};}catch(e){return {};}}
  function setMeta(m){try{localStorage.setItem(META,JSON.stringify(m));}catch(e){}}
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function when(d){try{return new Date(d).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});}catch(e){return '';}}
  /* Only links back into this site's own calculators are made clickable: the
     list is the visitor's own storage, but nothing read from storage should be
     able to put an arbitrary address behind a link. */
  function safe(u){try{var x=new URL(u,location.href);return (x.origin===location.origin||x.origin==='https://voltfield.org')&&x.pathname.indexOf('/calculators/')===0?x.href:null;}catch(e){return null;}}

  function draw(){
    var items=read();
    full.hidden=!items.length;empty.hidden=!!items.length;
    listEl.textContent='';
    items.forEach(function(it,idx){
      var li=el('li','ps-item');
      li.appendChild(el('h2',null,String(it.t||'Calculation')));
      li.appendChild(el('p','ps-res',String(it.r)));
      if(Array.isArray(it.i)&&it.i.length){
        var dl=el('dl','ps-in');
        it.i.forEach(function(p){if(!Array.isArray(p))return;var d=el('div');d.appendChild(el('dt',null,String(p[0])+':'));d.appendChild(el('dd',null,String(p[1])));dl.appendChild(d);});
        li.appendChild(dl);
      }
      var note=el('textarea','ps-note');note.placeholder='Note for this line (optional)';note.value=String(it.n||'');
      note.setAttribute('aria-label','Note for '+String(it.t||'this calculation'));note.maxLength=600;
      note.addEventListener('input',function(){var a=read();if(a[idx]){a[idx].n=note.value;write(a);}});
      var np=el('div','ps-note-print',note.value);
      note.addEventListener('input',function(){np.textContent=note.value;});
      li.appendChild(note);li.appendChild(np);
      var row=el('div','ps-row');
      var href=safe(it.u);
      if(href){
        var a=el('a','inline ps-open','Reopen with these inputs');a.href=href;row.appendChild(a);
      }
      function move(by,label){var b=el('button',null,label);b.type='button';b.addEventListener('click',function(){var a=read(),j=idx+by;if(j<0||j>=a.length)return;var t=a[idx];a[idx]=a[j];a[j]=t;write(a);draw();});return b;}
      if(idx>0)row.appendChild(move(-1,'Move up'));
      if(idx<items.length-1)row.appendChild(move(1,'Move down'));
      var rm=el('button',null,'Remove');rm.type='button';
      rm.addEventListener('click',function(){var a=read();a.splice(idx,1);write(a);draw();});
      row.appendChild(rm);
      row.appendChild(el('span','ps-when',it.d?'Saved '+when(it.d):''));
      li.appendChild(row);
      if(href)li.appendChild(el('div','ps-link',href.replace(/^https?:\\/\\//,'')));
      listEl.appendChild(li);
    });
    dateEl.textContent=items.length?items.length+(items.length===1?' result':' results')+' \\u00b7 '+when(Date.now()):'';
  }

  nameEl.value=String(meta().name||'');
  nameEl.addEventListener('input',function(){var m=meta();m.name=nameEl.value;setMeta(m);});
  document.getElementById('psPrint').addEventListener('click',function(){
    if(window.vfGtag)window.vfGtag('event','project_print',{n:read().length});
    window.print();
  });
  document.getElementById('psCopy').addEventListener('click',function(){
    var b=this,out=[];
    if(nameEl.value)out.push(nameEl.value,'');
    read().forEach(function(it,i){
      out.push((i+1)+'. '+(it.t||'Calculation'));
      out.push('   '+it.r);
      if(Array.isArray(it.i)&&it.i.length)out.push('   Inputs: '+it.i.map(function(p){return p[0]+' '+p[1];}).join('; '));
      if(it.n)out.push('   Note: '+it.n);
      var h=safe(it.u);if(h)out.push('   '+h);
      out.push('');
    });
    out.push('From the calculators at voltfield.org. Screening estimates, not a design.');
    var text=out.join('\\n');
    (navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).then(function(){
      b.textContent='Copied';setTimeout(function(){b.textContent='Copy as text';},1600);
    },function(){b.textContent='Copy failed';setTimeout(function(){b.textContent='Copy as text';},1800);});
  });
  /* Two presses, not a dialog: the first arms it and says what it will do. */
  var clr=document.getElementById('psClear'),armed=null;
  clr.addEventListener('click',function(){
    if(!armed){clr.textContent='Press again to remove all';armed=setTimeout(function(){armed=null;clr.textContent='Clear the sheet';},4000);return;}
    clearTimeout(armed);armed=null;clr.textContent='Clear the sheet';
    write([]);draw();
  });
  /* saved from a calculator in another tab */
  window.addEventListener('storage',function(e){if(e.key===KEY)draw();});
  draw();
})();
</script>`;

const ld = { '@context': 'https://schema.org', '@graph': [
  { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    { '@type': 'ListItem', position: 2, name: 'Calculators', item: BASE + 'engineering-calculators.html' },
    { '@type': 'ListItem', position: 3, name: h1, item: BASE + FILE }] },
  { '@type': 'WebPage', name: h1, description: desc, url: BASE + FILE, dateModified: TODAY, inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'Voltfield', url: BASE }, publisher: { '@type': 'Organization', name: 'Voltfield', url: BASE } }
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
console.log(FILE + ' written');
