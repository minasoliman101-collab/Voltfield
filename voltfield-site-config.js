/* ============================================================
   VOLTFIELD — site configuration: SEO helpers + ad monetization
   Loaded by every page (small, no dependencies).

   TO GO LIVE:
   1. Set SITE_URL to your real production domain (no trailing slash).
      This enables canonical URLs and correct Open Graph links.
   2. To turn on ads, sign up for Google AdSense (or another network),
      then set ads.provider='adsense' and paste your publisher ID
      (looks like 'ca-pub-1234567890123456') into ads.client.
      Also update ads.txt in this folder — see the comments there.
   3. While ads.client is empty, slots render as labeled placeholders
      when ads.preview=true (so you can see placements) and render
      nothing at all when ads.preview=false.
   ============================================================ */
'use strict';

const SITE_CONFIG = {
  /* production domain (no trailing slash) — update if you attach a custom domain */
  siteUrl: 'https://voltfield.org',

  ads: {
    provider: 'none',      /* 'none' | 'adsense' */
    client: '',            /* AdSense publisher ID, e.g. 'ca-pub-XXXXXXXXXXXXXXXX' */
    slots: {               /* per-placement AdSense slot IDs (create in AdSense UI) */
      leaderboard: '',
      incontent: '',
      footer: '',
    },
    preview: false,        /* show placeholder boxes until a real client ID is set — off until AdSense is approved */
  },

  /* Part identification (voltfield-identify.html).
     v1 runs fully on-device: OCR (Tesseract.js) + token matching against the
     catalog/EOL data. To upgrade to full photo recognition (no label needed),
     stand up a backend that accepts an image and returns candidate keywords
     (e.g. Azure Function -> Claude/GPT-4o vision), then set its URL here.
     The page will POST {image: dataURL} and expects {keywords: [...], text: ''}. */
  vision: {
    endpoint: '',          /* e.g. 'https://<your-app>.azurestaticapps.net/api/identify' */
  },

  /* Subscriptions (see voltfield-account.html + README §9).
     Create Payment Links in your Stripe dashboard and paste them here —
     until then the plan buttons fall back to a sales-contact email. */
  billing: {
    proMonthlyUrl: '',     /* e.g. 'https://buy.stripe.com/xxxx' */
    proAnnualUrl: '',
    portalUrl: '',         /* Stripe customer-portal login link */
    salesEmail: 'Sales@voltfield.org',
  },

  /* Analytics (see README §13). Create a free GA4 property at
     analytics.google.com, then paste its Measurement ID (looks like
     'G-XXXXXXXXXX') below. Nothing loads at all until it's set —
     update privacy-policy.html's Analytics section when you do. */
  analytics: {
    provider: 'ga4',       /* 'none' | 'ga4' */
    measurementId: 'G-02QLZGR9ZE',
  },
};

/* ---------- --vf-header-h: real header height, for the mobile menu ----------
   The open mobile nav is absolutely positioned inside a position:sticky header,
   so it cannot scroll with the page -- it needs its own max-height, and that
   height is "whatever is left below the header". The header's height varies
   with viewport width (the wordmark wraps), so it has to be measured rather
   than hard-coded. voltfield-core.css consumes this with a static fallback, so
   the menu is still usable if this never runs. */
(function () {
  var header = null;
  var t = null;

  function measure() {
    if (!header) header = document.querySelector('header.site');
    if (!header) return;
    var h = Math.round(header.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--vf-header-h', h + 'px');
  }

  function debounced() { clearTimeout(t); t = setTimeout(measure, 100); }

  function start() {
    measure();
    window.addEventListener('resize', debounced);
    window.addEventListener('orientationchange', debounced);

    /* Measured again in the capture phase of any click that opens a menu --
       i.e. at the exact moment the value gets used. This is the load-bearing
       one: it is correct even if a resize event was missed, because it runs
       immediately before the menu is shown.

       Deliberately NOT a ResizeObserver on the header. The property this sets
       feeds a max-height on menus that live inside the header, so observing
       the header creates a resize loop -- and once the browser detects one it
       stops delivering notifications entirely. Measured directly: the observer
       fired once and then never again, leaving the value stale at 157px across
       three subsequent header height changes. Event-driven measurement has no
       such failure mode. */
    document.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('#navToggle, .navdrop-btn')) measure();
    }, true);

    /* Web fonts can change the header's height after first paint. */
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(measure).catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/* ---------- PWA: service-worker registration (https/localhost only) ---------- */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  window.addEventListener('load', function () {
    /* Root-absolute, not 'sw.js'. A relative path resolves against the current
       directory, so any page outside the site root (e.g. /data-centers/transformers)
       would ask for /data-centers/sw.js -- a 404 that fails silently, and if such a
       file ever existed it would register with a scope limited to that directory.
       An explicit '/' scope keeps one worker for the whole origin at any depth. */
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () { /* non-fatal */ });
  });
})();

/* ---------- canonical + og:url injection (works on any host once siteUrl is set) ---------- */
(function () {
  if (!SITE_CONFIG.siteUrl) return;
  const path = location.pathname.replace(/\/index\.html$/, '/');
  /* The catalog page renders the same shell for every search/filter combo (?q=, ?sector=,
     ?cat=, ?lt=, ?page=, ?sort=) with no per-combo title/description — indexing every
     combination would spread the same thin content across thousands of URLs. Canonicalize
     those views to the bare catalog page and keep them out of the index; the dedicated
     sector landing pages (data-centers.html etc.) carry the real, unique, indexable content
     and link into these filtered views for browsing. */
  const isCatalogSearch = /voltfield-supply-catalog\.html$/.test(location.pathname) &&
    /[?&](q|sector|cat|lt|page|sort)=/.test(location.search);
  const cleanSearch = isCatalogSearch
    ? ''
    : location.search.replace(/([?&])(quote|qty)=[^&]*/g, '').replace(/^&/, '?');
  const href = SITE_CONFIG.siteUrl + path + cleanSearch;
  if (!document.querySelector('link[rel="canonical"]')) {
    const l = document.createElement('link'); l.rel = 'canonical'; l.href = href;
    document.head.appendChild(l);
  }
  if (!document.querySelector('meta[property="og:url"]')) {
    const m = document.createElement('meta'); m.setAttribute('property', 'og:url'); m.content = href;
    document.head.appendChild(m);
  }
  if (isCatalogSearch && !document.querySelector('meta[name="robots"]')) {
    const r = document.createElement('meta'); r.name = 'robots'; r.content = 'noindex,follow';
    document.head.appendChild(r);
  }
})();

/* ---------- ad slots ----------
   Place <div class="ad-unit" data-ad="leaderboard|incontent|footer"></div>
   anywhere in the page; this renders them on DOMContentLoaded. */
(function () {
  const CSS = `
  .ad-unit{max-width:1240px;margin:18px auto;padding:0 20px}
  .ad-unit .ad-box{position:relative;min-height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .ad-unit .ad-lbl{position:absolute;top:4px;left:8px;font:500 8.5px/1 'IBM Plex Mono',monospace;letter-spacing:.12em;color:#8896A6;text-transform:uppercase}
  .ad-unit .ad-ph{width:100%;min-height:90px;border:1px dashed #A7B6C6;background:repeating-linear-gradient(45deg,#E8EDF3,#E8EDF3 12px,#DDE5EC 12px,#DDE5EC 24px);display:flex;align-items:center;justify-content:center;font:500 11px/1.5 'IBM Plex Mono',monospace;color:#8896A6;text-align:center;padding:14px}
  @media(max-width:720px){.ad-unit .ad-box,.ad-unit .ad-ph{min-height:60px}}
  /* In-content units sit between paragraphs, so the space has to be held
     before the ad arrives or the text below jumps (CLS). A responsive unit
     here fills at about 250-280px tall on phones and desktops alike. */
  .ad-unit[data-ad="incontent"] .ad-box,.ad-unit[data-ad="incontent"] .ad-ph{min-height:280px}
  @media print{.ad-unit{display:none!important}}`;

  function boot() {
    const units = document.querySelectorAll('.ad-unit[data-ad]');
    if (!units.length) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const A = SITE_CONFIG.ads;
    const live = A.provider === 'adsense' && A.client;

    if (live && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(A.client);
      s.crossOrigin = 'anonymous';
      document.head.appendChild(s);
    }

    units.forEach(u => {
      const kind = u.dataset.ad;
      if (live) {
        const slot = A.slots[kind] || '';
        u.innerHTML = `<div class="ad-box"><span class="ad-lbl">Advertisement</span>
          <ins class="adsbygoogle" style="display:block;width:100%"
               data-ad-client="${A.client}" ${slot ? `data-ad-slot="${slot}"` : ''}
               data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ }
      } else if (A.preview) {
        u.innerHTML = `<div class="ad-ph">AD SLOT — ${kind.toUpperCase()}<br>responsive display ad renders here once a publisher ID is set in voltfield-site-config.js</div>`;
      } else {
        u.remove();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ---------- analytics: GA4, loaded only if a Measurement ID is configured ---------- */
(function () {
  const A = SITE_CONFIG.analytics;
  if (!A || A.provider !== 'ga4' || !A.measurementId) return;
  /* The tag is the largest download on every page (about 190 KB), and injected
     from the head it competed with the stylesheet and the fonts for the
     connection and with first paint for the main thread. Nothing is lost by
     waiting: the calls below queue in dataLayer with their own timestamp and
     are sent when the tag arrives. So it is fetched once the page has loaded,
     or after four seconds if load is slow, or on the way out if the reader
     leaves first. */
  let injected = false;
  function inject() {
    if (injected) return;
    injected = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.measurementId);
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') setTimeout(inject, 0);
  else {
    window.addEventListener('load', function () { setTimeout(inject, 0); });
    setTimeout(inject, 4000);
    document.addEventListener('visibilitychange', function () { if (document.hidden) inject(); });
  }
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', A.measurementId);
  window.vfGtag = gtag; /* available for future event tracking, e.g. vfGtag('event','add_to_quote') */
})();

/* ---------- dark mode toggle ----------
   The theme itself is already applied before paint by a tiny inline script
   in <head> (reads localStorage/prefers-color-scheme, sets <html data-theme>)
   so there's no flash of the wrong theme. This just adds the visible toggle
   button + click handling, once the header exists. */
(function () {
  function initToggle() {
    const host = document.querySelector('.headright');
    if (!host || document.getElementById('themeToggle')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'themeToggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    /* Styled by #themeToggle in voltfield-core.css rather than inline here.
       The inline version hardcoded #101B2D on a 2px border, which was the old
       header vocabulary and survived the redesign as a hard navy square next
       to the rounded controls beside it -- and, being literal hex, it could
       not follow the dark theme's token swap either. */
    btn.className = 'themetoggle';
    function paint() {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.textContent = dark ? '☀' : '☽'; /* sun when dark (tap to go light), moon when light */
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('vf_theme', next); } catch (e) {}
      paint();
    });
    paint();
    host.insertBefore(btn, host.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initToggle);
  else initToggle();
})();

/* ---------- units: one setting for the whole site ----------
   The calculators and the charts each grew a US / Metric switch of their own.
   This is the single source both now defer to, plus two things neither could
   do: put a switch on pages that have no tool (guides, glossary, practice
   questions), and show a metric equivalent beside the US quantities that sit
   in ordinary text.

     VFUnits.metric()      current choice
     VFUnits.set(bool)     store it and tell everything on the page
     'vf:units' on document, detail {metric}   fired on every change

   TEXT. In metric mode, a US quantity in running text is shown as its metric
   equivalent with the original kept in brackets: "46 m (150 ft)". Both are
   shown on purpose. These are conversions of what the page says, not a
   rewrite of it. Left alone: formulas, whose constants only mean anything in
   the units they were written in; tables; anything with a hand-written metric
   version (data-u, data-units); anything that already gives its own
   equivalent; and the pages that state code requirements (see AS_WRITTEN). */
(function(){
  var metric=false;
  try{metric=localStorage.getItem('vf_units')==='metric';}catch(e){}
  try{var q=new URLSearchParams(location.search).get('units');if(q==='metric'||q==='us'){metric=q==='metric';try{localStorage.setItem('vf_units',q);}catch(e){}}}catch(e){}

  var api={
    metric:function(){return metric;},
    set:function(want){
      want=!!want;
      if(want===metric)return;
      metric=want;
      try{localStorage.setItem('vf_units',metric?'metric':'us');}catch(e){}
      try{document.dispatchEvent(new CustomEvent('vf:units',{detail:{metric:metric}}));}catch(e){}
      if(window.vfGtag)window.vfGtag('event','units_toggle',{to:metric?'metric':'us',page:location.pathname});
    }
  };
  window.VFUnits=api;

  /* ---- conversion of quantities in text ---- */
  function show(v){
    var a=Math.abs(v), d=a>=100?0:a>=10?1:a>=1?2:3;
    return Number(v).toLocaleString('en-US',{maximumFractionDigits:d});
  }
  function num(s){return parseFloat(String(s).replace(/,/g,''));}
  /* Cooling "tons" only on pages about cooling: elsewhere a ton is a weight. */
  var COOLING=/cool|crac|crah|chill|btu|contain|airflow|pue|affinity|pump|liquid|rack-power|data-center/i.test(location.pathname);
  /* Pages that state code requirements in feet and inches are left as written.
     The code publishes its own metric figures for those (900 mm, not the 914 mm
     that 3 ft converts to), and a computed figure beside a requirement would
     be the wrong number. The unit-converter pages are left alone too: there
     the conversion is the subject, and the tool does it. */
  var AS_WRITTEN=/\/guide-nec-|\/charts\/(?:wire-ampacity|motor-full-load-current)-chart|\/calculators\/(?:btu-to-tons|hp-to-kw|awg-to-mm2)/.test(location.pathname);

  var NUM='(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?';
  /* [pattern, factor ('temp' for temperature), metric unit, how the metric unit
     looks in text, for spotting a figure the sentence already gives].
     Longest patterns first: alternation takes the first that matches. */
  var RULES=[
    ['GPM per ton',            0.0630902/3.516853, 'L/s per kW', /L\/s/],
    ['gal(?:lons)?\\s?(?:\\/|per )\\s?h(?:ou)?r?', 3.785412, 'L/h', /L\/h/],
    ['gallons?|gal(?![a-z])',  3.785412, 'L', /\d\s?(?:L|litres?|liters?)\b/],
    ['ft\\/s|feet per second', 0.3048, 'm/s', /m\/s/],
    ['lb-ft',                  1.355818, 'N·m', /N·m/],
    ['square feet|sq\\.? ?ft|ft²', 0.092903, 'm²', /m²/],
    ['feet|foot|ft(?![a-z])',  0.3048, 'm', /\d\s?(?:m|mm|metres?|meters?)\b/],
    ['inch(?:es)?',            25.4, 'mm', /\d\s?mm\b/],
    ['in(?=\\s?(?:[.,;:)]|$|inside|diameter|working|Schedule|pipe|rod|wide|deep|thick|long|high|or less|and under|clearance|nominal))', 25.4, 'mm', /\d\s?mm\b/],
    ['°F|degrees Fahrenheit',  'temp', '', /°C|\d\s?K\b/],
    ['CFM',                    1.699011, 'm³/h', /m³\/h/],
    ['GPM',                    0.0630902, 'L/s', /L\/s/],
    ['BTU\\/h(?:r)?|BTU per hour', 1/3412.142, 'kW', /kW/],
    ['psi(?![a-z])',           6.894757, 'kPa', /kPa/],
    ['hp(?![a-z])|HP(?![A-Za-z])|horsepower', 0.7457, 'kW', /kW/],
    ['tons?(?! of (?:ice|steel|copper|CO))(?![a-z])', COOLING?3.516853:null, 'kW', /kW/]
  ].filter(function(r){return r[1]!=null;});
  var UNIT_RE=RULES.map(function(r){return new RegExp('^(?:'+r[0]+')$');});
  var MASTER=new RegExp('(?:('+NUM+')(\\s?(?:to|and|–|—|-)\\s?))?('+NUM+')(?:\\s?|-)('+RULES.map(function(r){return r[0];}).join('|')+')','g');
  var HAS_OWN=/^\s?\((?:about |approx\.? |roughly |or )?[\d.,]+(?:\s?(?:to|and|–|-)\s?[\d.,]+)?\s?(?:m\b|mm|kW|K\b|°C|L\b|L\/|kPa|N·m|m³|m²|m\/s)/;
  var DIFF=/^\s*(?:rise|difference|drop|approach|range|spread|step|higher|lower|wider|warmer|cooler|colder|above|below|per\b|of (?:rise|difference))/i;
  var DIFF_BEFORE=/(?:rise of|difference of|drop of|by|every|each|per)\s*$/i;
  var NOT_DIFF=/^\s*(?:ambient|outdoor|outside|leaving|entering|supply|return|inlet|water|air\b)/i;
  var SKIP='script,style,noscript,code,pre,svg,canvas,input,textarea,select,option,button,label,table,.formula,.pq-ans,.est-result,.est-example,.est-after,.pq-bar,.vf3d-co-wrap,.crumbnav,[data-u],[data-units],.vf-conv,.sub,h1,title';

  function convertText(text,lead){
    lead=lead||'';
    MASTER.lastIndex=0;
    var out=[],last=0,m,any=false;
    while((m=MASTER.exec(text))){
      var start=m.index,end=start+m[0].length,unit=m[3+1],a=m[1]!=null?num(m[1]):null,sep=m[2]||'',b=num(m[3]);
      var before=(lead+text.slice(0,start)).slice(-28),after=text.slice(end,end+34);
      /* The result of a sum written out in US units ("500 × 0.80 = 400 GPM"):
         a metric figure there would not be what the arithmetic gives. */
      if(/=\s*$/.test(before))continue;
      /* A dimension set by the code (the 24 in conduit nipple), which the code
         states in metric as its own round figure. */
      if(/nipple/i.test(text.slice(Math.max(0,start-90),end+40)))continue;
      /* the figure is itself a bracketed equivalent, or is followed by one */
      if(/\(\s*(?:about |approx\.? |roughly )?$/.test(before)||HAS_OWN.test(after))continue;
      /* "ft" as the start of a longer word */
      if(/[A-Za-z0-9]/.test(text.charAt(end))&&unit!=='in')continue;
      /* a fraction or a slash-separated list: "3/4 inch", "10/20/40 ft" */
      if(text.charAt(start-1)==='/'||text.charAt(start+(m[1]||'').length)==='/')continue;
      /* "33,000 foot-pounds" is not a length */
      if(/^-?pounds?/.test(after))continue;
      /* "ohms per 1000 ft" is a unit, not a distance */
      if(a==null&&b===1000&&/per\s$/.test(before))continue;
      /* "and" joins a range only after "between": "Category 2 and 3 ft" is not one */
      if(a!=null&&/and/.test(sep)&&!/between\s$/i.test(before)){
        start+=m[1].length+sep.length;a=null;sep='';
        before=(lead+text.slice(0,start)).slice(-28);
        if(text.charAt(start-1)==='/')continue;
      }
      var ri=-1;for(var i=0;i<UNIT_RE.length;i++){if(UNIT_RE[i].test(unit)){ri=i;break;}}
      if(ri<0)continue;
      var rule=RULES[ri],res;
      /* The sentence already gives the metric figure ("147.9 lb-ft, which is
         200.6 N·m"; "a 200 kW room is about 57 tons"). Adding it again only
         produces "200 kW (57 tons)" beside "200 kW". */
      if(rule[3].test(text.slice(Math.max(0,start-60),start)+' | '+text.slice(end,end+45)))continue;
      if(rule[1]==='temp'){
        /* A difference converts by 5/9; a temperature also loses its 32. The
           wording decides where it can. Where it cannot, a figure of 40 or
           under is taken as a difference: on this site those are rises and
           spreads ("at 12°F it is 2.0"), and real temperatures run higher. */
        var hi=Math.max(b,a==null?b:a);
        var isDiff=DIFF.test(after)||DIFF_BEFORE.test(before)||(hi<=40&&!NOT_DIFF.test(after));
        var f=isDiff?function(x){return x*5/9;}:function(x){return (x-32)*5/9;};
        res=(a!=null?show(f(a))+sep:'')+show(f(b))+(isDiff?' K':'°C');
      }else{
        res=(a!=null?show(a*rule[1])+sep:'')+show(b*rule[1])+' '+rule[2];
      }
      out.push(text.slice(last,start),{us:text.slice(start,end),metric:res});
      last=end;any=true;
    }
    if(!any)return null;
    out.push(text.slice(last));
    return out;
  }

  var applied=false;
  function annotate(){
    var root=document.querySelector('main')||document.body;
    if(!root||applied||AS_WRITTEN)return;
    applied=true;
    var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.nodeValue||!/\d/.test(n.nodeValue))return NodeFilter.FILTER_REJECT;
      var p=n.parentElement;
      return (p&&!p.closest(SKIP))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    var nodes=[],n;
    while((n=w.nextNode()))nodes.push(n);
    nodes.forEach(function(node){
      /* what comes just before this text node, for "= <b>56.9 tons</b>" */
      var pv=node.previousSibling||(node.parentNode&&node.parentNode.previousSibling);
      var parts=convertText(node.nodeValue,pv?String(pv.textContent||'').slice(-28):'');
      if(!parts)return;
      var frag=document.createDocumentFragment();
      parts.forEach(function(p){
        if(typeof p==='string'){if(p)frag.appendChild(document.createTextNode(p));return;}
        var s=document.createElement('span');
        s.className='vf-conv';s.setAttribute('data-us',p.us);
        s.textContent=p.metric+' ('+p.us+')';
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag,node);
    });
  }
  function restore(){
    if(!applied)return;
    applied=false;
    document.querySelectorAll('.vf-conv').forEach(function(s){
      var p=s.parentNode;p.replaceChild(document.createTextNode(s.getAttribute('data-us')),s);p.normalize();
    });
  }

  /* ---- the switch: in the header on wide screens, in the footer row always ---- */
  var buttons=[];
  function paintButtons(){
    buttons.forEach(function(b){
      if(b.getAttribute('data-vfu')==='toggle'){
        b.textContent=metric?'m':'ft';
        b.setAttribute('aria-label','Units: '+(metric?'metric':'US')+'. Switch to '+(metric?'US':'metric'));
        b.setAttribute('title',metric?'Metric units. Switch to US':'US units. Switch to metric');
      }else{
        b.setAttribute('aria-pressed',((b.getAttribute('data-vfu')==='metric')===metric)?'true':'false');
      }
    });
  }
  function build(){
    var st=document.createElement('style');
    st.textContent='#unitsToggle{font:600 12px/1 "IBM Plex Mono",ui-monospace,monospace;min-width:40px}'+
      '@media(max-width:700px){#unitsToggle{display:none}}'+
      '.foot-units{display:inline-flex;align-items:center;gap:8px;margin-left:auto;font-size:13px}'+
      '.foot-units span{color:#7F94AC}'+
      '.foot-units button{font:inherit;background:transparent;border:0;border-bottom:1px solid transparent;color:#93A7BD;padding:5px 2px;cursor:pointer}'+
      '.foot-units button[aria-pressed="true"]{color:#fff;border-bottom-color:#FFC400}'+
      '@media(max-width:520px){.foot-units{margin-left:0;width:100%}}'+
      '@media print{#unitsToggle,.foot-units{display:none}}';
    document.head.appendChild(st);

    var host=document.querySelector('.headright');
    if(host&&!document.getElementById('unitsToggle')){
      var hb=document.createElement('button');
      hb.type='button';hb.id='unitsToggle';hb.className='themetoggle';hb.setAttribute('data-vfu','toggle');
      hb.addEventListener('click',function(){api.set(!metric);});
      host.insertBefore(hb,host.firstChild);
      buttons.push(hb);
    }
    var foot=document.querySelector('footer .foot-legal');
    if(foot&&!foot.querySelector('.foot-units')){
      var box=document.createElement('span');
      box.className='foot-units';box.setAttribute('role','group');box.setAttribute('aria-label','Units');
      var lab=document.createElement('span');lab.textContent='Units';box.appendChild(lab);
      [['us','US'],['metric','Metric']].forEach(function(o){
        var b=document.createElement('button');b.type='button';b.textContent=o[1];b.setAttribute('data-vfu',o[0]);
        b.addEventListener('click',function(){api.set(o[0]==='metric');});
        box.appendChild(b);buttons.push(b);
      });
      foot.appendChild(box);
    }
    paintButtons();
    if(metric)annotate();
  }
  document.addEventListener('vf:units',function(){
    paintButtons();
    if(metric)annotate();else restore();
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);
  else build();
})();
