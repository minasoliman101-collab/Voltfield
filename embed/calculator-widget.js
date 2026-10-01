/* VOLTFIELD - embeddable calculators.
   Usage on any site:
     <div class="vf-calc-widget" data-calc="voltage-drop"></div>
     <script src="https://voltfield.org/embed/calculator-widget.js" async></script>
   data-calc: voltage-drop | transformer-sizing | power-factor

   The math and tables mirror the live calculators in
   voltfield-calculators.js. Change them there and here together.
   Everything renders in a shadow root so the host page's CSS can't reach in,
   and the widget makes no network requests. */
(function(){
  var SITE='https://voltfield.org';
  var AWG=[
    {n:'14 AWG',cm:4110},{n:'12 AWG',cm:6530},{n:'10 AWG',cm:10380},{n:'8 AWG',cm:16510},
    {n:'6 AWG',cm:26240},{n:'4 AWG',cm:41740},{n:'3 AWG',cm:52620},{n:'2 AWG',cm:66360},
    {n:'1 AWG',cm:83690},{n:'1/0 AWG',cm:105600},{n:'2/0 AWG',cm:133100},{n:'3/0 AWG',cm:167800},
    {n:'4/0 AWG',cm:211600},{n:'250 kcmil',cm:250000},{n:'300 kcmil',cm:300000},{n:'350 kcmil',cm:350000},
    {n:'400 kcmil',cm:400000},{n:'500 kcmil',cm:500000},{n:'600 kcmil',cm:600000},{n:'750 kcmil',cm:750000},
    {n:'1000 kcmil',cm:1000000}
  ];
  var STD_KVA=[15,25,37.5,50,75,100,112.5,150,167,225,300,500,750,1000,1500,2000,2500,3000,3750,5000,7500,10000];

  function fmt(v,d){d=d===undefined?2:d;return Number(v).toLocaleString('en-US',{maximumFractionDigits:d});}
  function val(scope,id){return scope.getElementById(id).value;}
  function num(scope,id){return parseFloat(val(scope,id));}

  var CALCS={
    'voltage-drop':{
      title:'Voltage Drop Calculator',
      page:'/calculators/voltage-drop.html',
      note:'K-factor method, resistance only. Best for runs under about 250 ft.',
      fields:[
        {id:'ph',label:'Phase',select:[['3','Three-phase'],['1','Single-phase']]},
        {id:'mat',label:'Conductor',select:[['12.9','Copper'],['21.2','Aluminum']]},
        {id:'size',label:'Wire size',select:AWG.map(function(a,i){return [String(i),a.n];}),def:'12'},
        {id:'i',label:'Load current (A)',ph:'100'},
        {id:'d',label:'One-way distance (ft)',ph:'150'},
        {id:'v',label:'System voltage (V)',ph:'480'}
      ],
      run:function(r){
        var I=num(r,'i'),D=num(r,'d'),V=num(r,'v'),K=num(r,'mat'),a=AWG[+val(r,'size')];
        if(!(I>0)||!(D>0)||!(V>0))return {text:'Enter current, distance, and voltage.'};
        var vd=((val(r,'ph')==='3'?1.732:2)*K*I*D)/a.cm, pct=vd/V*100, warn=pct>3;
        return {warn:warn,html:'Voltage drop: <b>'+fmt(vd)+' V</b> ('+fmt(pct)+'%) over '+fmt(D,0)+' ft of '+a.n+'. '+
          (warn?'Exceeds the common 3% branch-circuit guideline; consider a larger conductor.':'Within the common 3% branch-circuit guideline.')};
      }
    },
    'transformer-sizing':{
      title:'Transformer Sizing Calculator',
      page:'/calculators/transformer-sizing.html',
      note:'Rounds up to the next standard ANSI/IEEE C57.12.00 kVA rating. No growth margin added.',
      fields:[
        {id:'ph',label:'Phase',select:[['3','Three-phase'],['1','Single-phase']]},
        {id:'kw',label:'Load (kW)',ph:'300'},
        {id:'pf',label:'Power factor',ph:'0.9',step:'0.01'},
        {id:'v',label:'Secondary voltage (V)',ph:'480'}
      ],
      run:function(r){
        var kw=num(r,'kw'),pf=num(r,'pf'),V=num(r,'v');
        if(!(kw>0)||!(pf>0&&pf<=1)||!(V>0))return {text:'Enter load, power factor (0-1), and voltage.'};
        var req=kw/pf, std=null;
        for(var i=0;i<STD_KVA.length;i++){if(STD_KVA[i]>=req){std=STD_KVA[i];break;}}
        if(std===null)return {warn:true,html:'Required: <b>'+fmt(req)+' kVA</b>, above the largest standard rating in this table ('+fmt(STD_KVA[STD_KVA.length-1],0)+' kVA). Split the load or size a substation transformer with the manufacturer.'};
        var fla=val(r,'ph')==='3'?std*1000/(1.732*V):std*1000/V;
        return {html:'Required: <b>'+fmt(req)+' kVA</b>. Next standard size: <b>'+fmt(std,1)+' kVA</b>. Secondary full-load current at that rating: <b>'+fmt(fla)+' A</b>.'};
      }
    },
    'power-factor':{
      title:'Power Factor Correction Calculator',
      page:'/calculators/power-factor.html',
      note:'Capacitor kVAR to move from the existing to the target power factor.',
      fields:[
        {id:'kw',label:'Real power (kW)',ph:'400'},
        {id:'pf1',label:'Existing PF',ph:'0.75',step:'0.01'},
        {id:'pf2',label:'Target PF',ph:'0.95',step:'0.01'}
      ],
      run:function(r){
        var kw=num(r,'kw'),pf1=num(r,'pf1'),pf2=num(r,'pf2');
        if(!(kw>0)||!(pf1>0&&pf1<=1)||!(pf2>0&&pf2<=1))return {text:'Enter real power and both power factors (0-1).'};
        if(pf2<pf1)return {warn:true,text:'Target PF should be higher than existing PF.'};
        var kvar=kw*(Math.tan(Math.acos(pf1))-Math.tan(Math.acos(pf2)));
        return {html:'Capacitor bank required: <b>'+fmt(Math.max(kvar,0))+' kVAR</b> to raise PF from '+pf1+' to '+pf2+' at '+fmt(kw,0)+' kW.'};
      }
    }
  };

  var CSS=
    ':host{all:initial;display:block}'+
    '.w{font-family:-apple-system,"Segoe UI",Roboto,sans-serif;border:1px solid #C4CFDA;background:#F3F6FA;max-width:420px;color:#101B2D;box-sizing:border-box}'+
    '.w *{box-sizing:border-box}'+
    '.hd{background:#101B2D;color:#FFC400;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:9px 12px;font-weight:600}'+
    '.bd{padding:12px}'+
    '.nt{font-size:11.5px;color:#4A5A6E;margin:0 0 10px;line-height:1.45}'+
    '.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 10px}'+
    'label{display:block;font-size:11.5px;color:#22334C;font-weight:600}'+
    'input,select{display:block;width:100%;margin-top:3px;padding:7px 8px;font-size:14px;border:1px solid #9AAABB;border-radius:4px;background:#fff;color:#101B2D;font-family:inherit}'+
    'button{margin-top:10px;background:#101B2D;color:#fff;border:0;border-radius:999px;padding:9px 18px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit}'+
    'button:hover{background:#22334C}'+
    '.out{margin-top:10px;font-size:13.5px;line-height:1.5;min-height:1em}'+
    '.out.warn{color:#A32A1C}'+
    '.ft{padding:8px 12px;font-size:11px;background:#fff;border-top:1px solid #C4CFDA}'+
    '.ft a{color:#7E5800;text-decoration:none;font-weight:600}'+
    '.ft a:hover{text-decoration:underline}';

  function el(tag,attrs,text){
    var e=document.createElement(tag);
    for(var k in attrs)if(attrs.hasOwnProperty(k))e.setAttribute(k,attrs[k]);
    if(text!==undefined)e.textContent=text;
    return e;
  }

  var seq=0;
  function render(host){
    var c=CALCS[host.getAttribute('data-calc')];
    if(!c||host.getAttribute('data-vf-ready'))return;
    host.setAttribute('data-vf-ready','1');
    var root=host.attachShadow?host.attachShadow({mode:'open'}):host;
    var pre='vfc'+(++seq)+'-';
    var st=document.createElement('style'); st.textContent=CSS; root.appendChild(st);
    var w=el('div',{'class':'w'});
    w.appendChild(el('div',{'class':'hd'},c.title));
    var bd=el('form',{'class':'bd'});
    bd.appendChild(el('p',{'class':'nt'},c.note));
    var g=el('div',{'class':'g'});
    c.fields.forEach(function(f){
      var lab=el('label',{'for':pre+f.id},f.label), input;
      if(f.select){
        input=el('select',{id:pre+f.id});
        f.select.forEach(function(o){var op=el('option',{value:o[0]},o[1]);if(f.def===o[0])op.selected=true;input.appendChild(op);});
      }else{
        input=el('input',{id:pre+f.id,type:'number',min:'0',step:f.step||'any',placeholder:'e.g. '+f.ph,inputmode:'decimal'});
      }
      lab.appendChild(input); g.appendChild(lab);
    });
    bd.appendChild(g);
    bd.appendChild(el('button',{type:'submit'},'Calculate'));
    var out=el('div',{'class':'out','role':'status','aria-live':'polite'});
    bd.appendChild(out);
    w.appendChild(bd);
    var ft=el('div',{'class':'ft'});
    ft.appendChild(el('a',{href:SITE+c.page,target:'_blank',rel:'noopener'},'How this works, with a worked example: Voltfield \u2192'));
    w.appendChild(ft);
    root.appendChild(w);

    // Field lookups are scoped to this widget's prefixed ids.
    var scope={getElementById:function(id){return w.querySelector('#'+pre+id);}};
    bd.addEventListener('submit',function(e){
      e.preventDefault();
      var res=c.run(scope);
      out.className='out'+(res.warn?' warn':'');
      if(res.html)out.innerHTML=res.html;else out.textContent=res.text;
    });
  }

  function init(){
    var els=document.querySelectorAll('.vf-calc-widget');
    for(var i=0;i<els.length;i++){try{render(els[i]);}catch(e){}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
