(function(){
  var DATA_URL='https://voltfield.org/lead-time-index.json';
  var SITE_URL='https://voltfield.org/lead-time-index.html';
  var TREND_ICON={up:'▲',down:'▼',flat:'■'};
  var TREND_COLOR={up:'#C43D2E',down:'#2E7D4F',flat:'#5B6B7E'};

  /* True when the host page already credits us in its own markup: a
     .vf-credit near the widget, or any link to lead-time-index.html among its
     siblings. Deliberately generous about placement -- people move the credit
     line around, and a false positive only costs the in-widget footer, while
     a false negative shows the credit twice. */
  function hasExternalCredit(el){
    var scope = el.parentNode || document;
    if (scope.querySelector && scope.querySelector('.vf-credit')) return true;
    var sibs = scope.children || [];
    for (var i = 0; i < sibs.length; i++){
      if (sibs[i] === el) continue;
      var a = sibs[i].matches && sibs[i].matches('a') ? sibs[i]
            : (sibs[i].querySelector ? sibs[i].querySelector('a') : null);
      if (a && a.getAttribute('href') && a.getAttribute('href').indexOf('lead-time-index') !== -1) return true;
    }
    return false;
  }

  function render(el,data){
    var sectorKey=el.getAttribute('data-sector')||'dc';
    var limit=parseInt(el.getAttribute('data-limit'),10)||0;
    var sector=data.sectors.filter(function(s){return s.key===sectorKey;})[0]||data.sectors[0];
    var items=limit>0?sector.items.slice(0,limit):sector.items;

    var root=el.attachShadow?el.attachShadow({mode:'open'}):el;
    var style=document.createElement('style');
    style.textContent=
      ':host{all:initial}'+
      '.vfw{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;border:1px solid #C4CFDA;background:#F3F6FA;max-width:380px;color:#101B2D;box-sizing:border-box}'+
      '.vfw *{box-sizing:border-box}'+
      '.vfw .hd{background:#101B2D;color:#FFC400;font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:9px 12px;font-weight:600}'+
      '.vfw table{width:100%;border-collapse:collapse;font-size:12.5px}'+
      '.vfw td{padding:7px 12px;border-bottom:1px solid #C4CFDA;line-height:1.4}'+
      '.vfw tr:last-child td{border-bottom:0}'+
      '.vfw .eq{color:#22334C}'+
      '.vfw .val{font-weight:600;text-align:right;white-space:nowrap;color:#101B2D}'+
      '.vfw .tr{padding-left:6px;font-size:10px}'+
      '.vfw .ft{padding:8px 12px;font-size:12px;background:#fff;border-top:1px solid #C4CFDA}'+
      '.vfw .ft a{color:#101B2D;text-decoration-color:#E5AC00;text-decoration:none;font-weight:600}'+
      '.vfw .ft a:hover{text-decoration:underline}';
    root.appendChild(style);

    var wrap=document.createElement('div'); wrap.className='vfw';
    var hd=document.createElement('div'); hd.className='hd'; hd.textContent=sector.label+' — Lead Times';
    wrap.appendChild(hd);
    var table=document.createElement('table');
    items.forEach(function(it){
      var tr=document.createElement('tr');
      var tdEq=document.createElement('td'); tdEq.className='eq'; tdEq.textContent=it.equipment;
      var tdVal=document.createElement('td'); tdVal.className='val'; tdVal.textContent=it.value+' ';
      var span=document.createElement('span'); span.className='tr';
      span.style.color=TREND_COLOR[it.trend]||'#5B6B7E';
      span.textContent=TREND_ICON[it.trend]||'';
      tdVal.appendChild(span);
      tr.appendChild(tdEq); tr.appendChild(tdVal);
      table.appendChild(tr);
    });
    wrap.appendChild(table);

    /* Attribution. The snippet on lead-time-index.html now ships a plain
       <p class="vf-credit"><a href="..."></p> next to the widget, because the
       footer this function used to draw is useless as a credit: it is created
       in JavaScript and lives inside a shadow root, so the embedding page's
       HTML contains no link at all and nothing counts it. Attribution that
       only a rendering engine can see is not attribution.

       The in-widget footer is kept as the fallback for anyone who pastes the
       div and the script but drops the credit line, so the data is never
       shown uncredited. When the host page does carry the credit, drawing it
       twice just looks like a mistake -- so look for it first. */
    if (!hasExternalCredit(el)) {
      var ft = document.createElement('div'); ft.className = 'ft';
      var a = document.createElement('a'); a.href = SITE_URL; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Data via Voltfield Lead-Time Index →';
      ft.appendChild(a);
      wrap.appendChild(ft);
    }
    root.appendChild(wrap);
  }

  function init(){
    var els=document.querySelectorAll('.vf-lead-time-widget');
    if(!els.length)return;
    fetch(DATA_URL).then(function(r){return r.json();}).then(function(data){
      els.forEach(function(el){ try{render(el,data);}catch(e){} });
    }).catch(function(){});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }
})();
