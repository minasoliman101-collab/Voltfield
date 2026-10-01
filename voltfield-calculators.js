/* VOLTFIELD calculators -- the logic behind every estimator on the site.
   Moved out of engineering-calculators.html (Oct 2026) when each calculator got
   its own page: calculators/*.html, calculators/project-finance.html and
   calculators/reference-tables.html each include the markup for their own
   tools (from scripts/tpl/calc-tools/) and load this one file.
   Every handler looks its elements up by id and does nothing when they are
   absent, so the whole file is safe on a page that carries only one tool.
   embed/calculator-widget.js repeats the voltage drop, transformer sizing and
   power factor math for other sites; change both together. */
(function(){
  const AWG=[
    {n:'14 AWG',cm:4110},{n:'12 AWG',cm:6530},{n:'10 AWG',cm:10380},{n:'8 AWG',cm:16510},
    {n:'6 AWG',cm:26240},{n:'4 AWG',cm:41740},{n:'3 AWG',cm:52620},{n:'2 AWG',cm:66360},
    {n:'1 AWG',cm:83690},{n:'1/0 AWG',cm:105600},{n:'2/0 AWG',cm:133100},{n:'3/0 AWG',cm:167800},
    {n:'4/0 AWG',cm:211600},{n:'250 kcmil',cm:250000},{n:'300 kcmil',cm:300000},{n:'350 kcmil',cm:350000},
    {n:'400 kcmil',cm:400000},{n:'500 kcmil',cm:500000},{n:'600 kcmil',cm:600000},{n:'750 kcmil',cm:750000},
    {n:'1000 kcmil',cm:1000000}
  ];
  const STD_KVA=[15,25,37.5,50,75,100,112.5,150,167,225,300,500,750,1000,1500,2000,2500,3000,3750,5000,7500,10000];
  const vdSel=document.getElementById('vdSize'), awgSel=document.getElementById('awgSize');
  [vdSel,awgSel].forEach(sel=>{ if(!sel)return; sel.innerHTML=AWG.map((a,i)=>'<option value="'+i+'"'+(a.n==='4/0 AWG'?' selected':'')+'>'+a.n+'</option>').join(''); });

  function fmt(v,d){d=d===undefined?2:d;return Number(v).toLocaleString('en-US',{maximumFractionDigits:d});}

  const vdBtn=document.getElementById('vdBtn');
  if(vdBtn)vdBtn.addEventListener('click',function(){
    const r=document.getElementById('vdResult');
    const I=parseFloat(document.getElementById('vdI').value), D=parseFloat(document.getElementById('vdD').value), V=parseFloat(document.getElementById('vdV').value);
    const K=parseFloat(document.getElementById('vdMat').value), phase=document.getElementById('vdPhase').value;
    const cm=AWG[+vdSel.value].cm;
    if(!(I>0)||!(D>0)||!(V>0)){r.textContent='Enter current, distance, and voltage.';r.className='est-result show';return;}
    const mult=phase==='3'?1.732:2;
    const vd=(mult*K*I*D)/cm;
    const pct=(vd/V)*100;
    const warn=pct>3;
    r.innerHTML='Voltage drop: <b>'+fmt(vd)+' V</b> ('+fmt(pct)+'%) over '+D+' ft of '+AWG[+vdSel.value].n+'.'+(warn?' <br>This exceeds the common 3% branch-circuit guideline — consider a larger conductor.':' Within the common 3% branch-circuit guideline.');
    r.className='est-result show'+(warn?' warn':'');
  });

  /* ---- NEC Table 310.16 ampacity (curated subset, base conditions: <=3 CCC, 30C ambient)
     and NEC Chapter 9 conduit fill (Table 1 caps, Table 4 EMT areas, Table 5 THHN areas) ---- */
  const NEC_AMPACITY=[
    {n:'14 AWG',Cu:{60:15,75:20,90:25},Al:{60:null,75:null,90:null}},
    {n:'12 AWG',Cu:{60:20,75:25,90:30},Al:{60:15,75:20,90:25}},
    {n:'10 AWG',Cu:{60:30,75:35,90:40},Al:{60:25,75:30,90:35}},
    {n:'8 AWG', Cu:{60:40,75:50,90:55},Al:{60:35,75:40,90:45}},
    {n:'6 AWG', Cu:{60:55,75:65,90:75},Al:{60:40,75:50,90:55}},
    {n:'4 AWG', Cu:{60:70,75:85,90:95},Al:{60:55,75:65,90:75}},
    {n:'3 AWG', Cu:{60:85,75:100,90:115},Al:{60:65,75:75,90:85}},
    {n:'2 AWG', Cu:{60:95,75:115,90:130},Al:{60:75,75:90,90:100}},
    {n:'1 AWG', Cu:{60:110,75:130,90:145},Al:{60:85,75:100,90:115}},
    {n:'1/0 AWG',Cu:{60:125,75:150,90:170},Al:{60:100,75:120,90:135}},
    {n:'2/0 AWG',Cu:{60:145,75:175,90:195},Al:{60:115,75:135,90:150}},
    {n:'3/0 AWG',Cu:{60:165,75:200,90:225},Al:{60:130,75:155,90:175}},
    {n:'4/0 AWG',Cu:{60:195,75:230,90:260},Al:{60:150,75:180,90:205}},
    {n:'250 kcmil',Cu:{60:215,75:255,90:290},Al:{60:170,75:205,90:230}},
    {n:'300 kcmil',Cu:{60:240,75:285,90:320},Al:{60:195,75:230,90:260}},
    {n:'350 kcmil',Cu:{60:260,75:310,90:350},Al:{60:210,75:250,90:280}},
    {n:'400 kcmil',Cu:{60:280,75:335,90:380},Al:{60:225,75:270,90:305}},
    {n:'500 kcmil',Cu:{60:320,75:380,90:430},Al:{60:260,75:310,90:350}}
  ];
  const EMT_AREA={'1-2in':0.122,'3-4in':0.213,'1in':0.346,'2in':1.342}; /* in^2 at 40% fill */
  const EMT_LABEL={'1-2in':'1/2"','3-4in':'3/4"','1in':'1"','2in':'2"'};
  const THHN_AREA={'14 AWG':0.0097,'12 AWG':0.0133,'10 AWG':0.0211,'8 AWG':0.0366,'6 AWG':0.0507,'1/0 AWG':0.1855};
  const FILL_CAP={1:0.53,2:0.31}; /* 3+ uses 0.40, handled separately */

  const ampSizeSel=document.getElementById('ampSize'), fillConduitSel=document.getElementById('fillConduit'), fillWireSel=document.getElementById('fillWire');
  if(ampSizeSel)ampSizeSel.innerHTML=NEC_AMPACITY.map((a,i)=>'<option value="'+i+'"'+(a.n==='4/0 AWG'?' selected':'')+'>'+a.n+'</option>').join('');
  if(fillConduitSel)fillConduitSel.innerHTML=Object.keys(EMT_AREA).map(k=>'<option value="'+k+'"'+(k==='3-4in'?' selected':'')+'>'+EMT_LABEL[k]+' EMT</option>').join('');
  if(fillWireSel)fillWireSel.innerHTML=Object.keys(THHN_AREA).map(k=>'<option value="'+k+'"'+(k==='12 AWG'?' selected':'')+'>'+k+' THHN</option>').join('');

  const ampBtn=document.getElementById('ampBtn');
  if(ampBtn)ampBtn.addEventListener('click',function(){
    const r=document.getElementById('ampResult');
    const row=NEC_AMPACITY[+ampSizeSel.value], mat=document.getElementById('ampMat').value, temp=document.getElementById('ampTemp').value;
    const a=row[mat][temp];
    if(a===null){r.textContent=row.n+' has no standard aluminum ampacity in this table (aluminum conductors typically start at 12 AWG).';r.className='est-result show warn';return;}
    r.innerHTML=row.n+' '+(mat==='Cu'?'copper':'aluminum')+', '+temp+'&deg;C column: <b>'+a+' A</b> base ampacity (&le;3 current-carrying conductors, 30&deg;C ambient, before any correction factors).';
    r.className='est-result show';
  });

  const fillBtn=document.getElementById('fillBtn');
  if(fillBtn)fillBtn.addEventListener('click',function(){
    const r=document.getElementById('fillResult');
    const conduit=fillConduitSel.value, wire=fillWireSel.value, n=parseInt(document.getElementById('fillN').value,10);
    if(!(n>0)){r.textContent='Enter the number of conductors.';r.className='est-result show';return;}
    const conduitArea40=EMT_AREA[conduit]; /* already the 40%-fill area */
    const conduitAreaTotal=conduitArea40/0.40;
    const wireArea=THHN_AREA[wire];
    const usedArea=n*wireArea;
    const cap=n>=3?0.40:FILL_CAP[n];
    const capArea=conduitAreaTotal*cap;
    const pct=(usedArea/conduitAreaTotal)*100;
    const fits=usedArea<=capArea;
    const nMax=Math.floor(capArea/wireArea);
    r.innerHTML=n+' &times; '+wire+' THHN in '+EMT_LABEL[conduit]+' EMT: <b>'+fmt(pct,1)+'% fill</b> (cap for '+n+' conductor'+(n===1?'':'s')+': '+(cap*100)+'%). '+(fits?'Fits within the cap.':'<b>Exceeds the fill cap</b> — over by '+fmt(usedArea-capArea,4)+' in&sup2;.')+' Max '+wire+' conductors in this conduit at the applicable cap: <b>'+nMax+'</b>.';
    r.className='est-result show'+(fits?'':' warn');
  });

  const xfBtn=document.getElementById('xfBtn');
  if(xfBtn)xfBtn.addEventListener('click',function(){
    const r=document.getElementById('xfResult');
    const kw=parseFloat(document.getElementById('xfKw').value), pf=parseFloat(document.getElementById('xfPf').value), V=parseFloat(document.getElementById('xfV').value);
    const phase=document.getElementById('xfPhase').value;
    if(!(kw>0)||!(pf>0&&pf<=1)||!(V>0)){r.textContent='Enter load, power factor (0-1), and voltage.';r.className='est-result show';return;}
    const kvaReq=kw/pf;
    const std=STD_KVA.find(s=>s>=kvaReq);
    if(std===undefined){r.innerHTML='Required: <b>'+fmt(kvaReq)+' kVA</b>, above the largest standard rating in this table ('+fmt(STD_KVA[STD_KVA.length-1],0)+' kVA). Split the load or size a substation transformer with the manufacturer.';r.className='est-result show warn';return;}
    const fla=phase==='3'?(std*1000)/(1.732*V):(std*1000)/V;
    r.innerHTML='Required: <b>'+fmt(kvaReq)+' kVA</b> &rarr; nearest standard size: <b>'+fmt(std,1)+' kVA</b>. Estimated secondary FLA at that rating: <b>'+fmt(fla)+' A</b>.';
    r.className='est-result show';
  });

  /* ---- Transformer inrush: rule-of-thumb multiplier x FLA, ranges commonly cited around IEEE 141/242 ---- */
  const INRUSH_CLASS={
    small:{lo:15,hi:25,decay:'within a few cycles (roughly 50-100 ms)'},
    dist:{lo:8,hi:12,decay:'over roughly 6-12 cycles (~0.1-0.2 s)'},
    large:{lo:4,hi:10,decay:'over several cycles up to roughly 1 second, sometimes longer on a high-X/R source'}
  };
  const inClassSel=document.getElementById('inClass');
  if(inClassSel)inClassSel.addEventListener('change',function(){
    const c=INRUSH_CLASS[this.value];
    document.getElementById('inMlo').value=c.lo;
    document.getElementById('inMhi').value=c.hi;
  });
  const inBtn=document.getElementById('inBtn');
  if(inBtn)inBtn.addEventListener('click',function(){
    const r=document.getElementById('inResult');
    const kva=parseFloat(document.getElementById('inKva').value), V=parseFloat(document.getElementById('inV').value);
    const mlo=parseFloat(document.getElementById('inMlo').value), mhi=parseFloat(document.getElementById('inMhi').value);
    if(!(kva>0)||!(V>0)||!(mlo>0)||!(mhi>0)){r.textContent='Enter transformer kVA, voltage, and both multipliers.';r.className='est-result show';return;}
    const fla=(kva*1000)/(1.732*V);
    const lo=mlo*fla, hi=mhi*fla;
    const decay=INRUSH_CLASS[inClassSel.value].decay;
    r.innerHTML='Full-load amps: <b>'+fmt(fla)+' A</b>. Estimated peak inrush: <b>'+fmt(lo,0)+'&ndash;'+fmt(hi,0)+' A</b> ('+fmt(mlo)+'&times;&ndash;'+fmt(mhi)+'&times; FLA), decaying '+decay+'. Treat this as an order-of-magnitude planning figure — actual peak and duration depend heavily on the specific unit\'s design.';
    r.className='est-result show';
  });

  const bessBtn=document.getElementById('bessBtn');
  if(bessBtn)bessBtn.addEventListener('click',function(){
    const r=document.getElementById('bessResult');
    const kw=parseFloat(document.getElementById('bessKw').value), hrs=parseFloat(document.getElementById('bessHrs').value);
    const dod=parseFloat(document.getElementById('bessDod').value)/100, rte=parseFloat(document.getElementById('bessRte').value)/100;
    if(!(kw>0)||!(hrs>0)||!(dod>0&&dod<=1)||!(rte>0&&rte<=1)){r.textContent='Enter load, duration, DoD, and RTE.';r.className='est-result show';return;}
    const usable=kw*hrs;
    const nameplate=usable/(dod*rte);
    r.innerHTML='Usable energy needed: <b>'+fmt(usable)+' kWh</b>. Nameplate energy to procure (after DoD/RTE losses): <b>'+fmt(nameplate)+' kWh</b>.';
    r.className='est-result show';
  });

  const strBtn=document.getElementById('strBtn');
  if(strBtn)strBtn.addEventListener('click',function(){
    const r=document.getElementById('strResult');
    const voc=parseFloat(document.getElementById('strVoc').value), vmp=parseFloat(document.getElementById('strVmp').value);
    const tcVoc=parseFloat(document.getElementById('strTcVoc').value), tcVmp=parseFloat(document.getElementById('strTcVmp').value);
    const tmin=parseFloat(document.getElementById('strTmin').value), tmax=parseFloat(document.getElementById('strTmax').value);
    const vmax=parseFloat(document.getElementById('strVmax').value), vmppt=parseFloat(document.getElementById('strVmppt').value);
    if(![voc,vmp,tcVoc,tcVmp,tmin,tmax,vmax,vmppt].every(v=>!isNaN(v))){r.textContent='Fill in every field (temp coefficients are typically negative).';r.className='est-result show';return;}
    const vocCold=voc*(1+(tcVoc/100)*(tmin-25));
    const vmpHot=vmp*(1+(tcVmp/100)*(tmax-25));
    const maxLen=Math.floor(vmax/vocCold);
    const minLen=Math.ceil(vmppt/vmpHot);
    const bad=minLen>maxLen;
    r.innerHTML='Cold Voc: <b>'+fmt(vocCold)+' V</b>/module. Hot Vmp: <b>'+fmt(vmpHot)+' V</b>/module. Max string length: <b>'+maxLen+' modules</b>. Min string length: <b>'+minLen+' modules</b>.'+(bad?' <br>No valid string length fits this window — recheck your inputs or inverter selection.':'');
    r.className='est-result show'+(bad?' warn':'');
  });

  const faultBtn=document.getElementById('faultBtn');
  if(faultBtn)faultBtn.addEventListener('click',function(){
    const r=document.getElementById('faultResult');
    const kva=parseFloat(document.getElementById('faultKva').value), z=parseFloat(document.getElementById('faultZ').value), V=parseFloat(document.getElementById('faultV').value);
    const aic=parseFloat(document.getElementById('faultAic').value);
    if(!(kva>0)||!(z>0)||!(V>0)){r.textContent='Enter transformer kVA, %Z, and secondary voltage.';r.className='est-result show';return;}
    const isc=(100000*kva)/(1.732*V*z);
    let out='Estimated available symmetrical fault current: <b>'+fmt(isc,0)+' A</b> ('+fmt(isc/1000)+' kA) at the transformer secondary, assuming an infinite source and ignoring cable impedance.';
    let warn=false;
    if(aic>0){
      const iscKa=isc/1000, under=iscKa>aic;
      out+=' <br>Equipment rated '+fmt(aic,1)+' kA AIC: '+(under?'<b>under-rated</b> — available fault current exceeds the equipment\'s withstand rating.':'adequate — available fault current is within the equipment\'s withstand rating.')+' (Remember: this ignores upstream/cable impedance, which only ever reduces actual fault current from this infinite-source figure — so a marginal pass here deserves a real study, not just this estimate.)';
      warn=under;
    }
    r.innerHTML=out;
    r.className='est-result show'+(warn?' warn':'');
  });

  /* ---- Motor starting voltage dip: infinite-bus-minus-source-impedance method (IEEE Std 399) ---- */
  const NEMA_CODE=[
    {l:'A',lo:0,hi:3.15},{l:'B',lo:3.15,hi:3.55},{l:'C',lo:3.55,hi:4.00},{l:'D',lo:4.00,hi:4.50},
    {l:'E',lo:4.50,hi:5.00},{l:'F',lo:5.00,hi:5.60},{l:'G',lo:5.60,hi:6.30},{l:'H',lo:6.30,hi:7.10},
    {l:'J',lo:7.10,hi:8.00},{l:'K',lo:8.00,hi:9.00},{l:'L',lo:9.00,hi:10.00},{l:'M',lo:10.00,hi:11.20},
    {l:'N',lo:11.20,hi:12.50},{l:'P',lo:12.50,hi:14.00},{l:'R',lo:14.00,hi:16.00},{l:'S',lo:16.00,hi:18.00},
    {l:'T',lo:18.00,hi:20.00},{l:'U',lo:20.00,hi:22.40},{l:'V',lo:22.40,hi:26.00}
  ];
  const motorLetterSel=document.getElementById('motorLetter'), motorMethodSel=document.getElementById('motorMethod');
  if(motorLetterSel)motorLetterSel.innerHTML=NEMA_CODE.map(c=>'<option value="'+c.l+'"'+(c.l==='G'?' selected':'')+'>'+c.l+' ('+c.lo.toFixed(2)+'&ndash;'+c.hi.toFixed(2)+' kVA/HP)</option>').join('');
  function motorSyncMethod(){
    const isLetter=motorMethodSel.value==='letter';
    document.getElementById('motorHpWrap').style.display=isLetter?'':'none';
    document.getElementById('motorLetterWrap').style.display=isLetter?'':'none';
    document.getElementById('motorLraWrap').style.display=isLetter?'none':'';
  }
  if(motorMethodSel){motorMethodSel.addEventListener('change',motorSyncMethod);motorSyncMethod();}

  const motorBtn=document.getElementById('motorBtn');
  if(motorBtn)motorBtn.addEventListener('click',function(){
    const r=document.getElementById('motorResult');
    const V=parseFloat(document.getElementById('motorV').value), sc=parseFloat(document.getElementById('motorSc').value);
    if(!(V>0)||!(sc>0)){r.textContent='Enter system voltage and available fault capacity.';r.className='est-result show';return;}
    let out,warn=false;
    if(motorMethodSel.value==='letter'){
      const hp=parseFloat(document.getElementById('motorHp').value);
      if(!(hp>0)){r.textContent='Enter motor HP.';r.className='est-result show';return;}
      const code=NEMA_CODE.find(c=>c.l===motorLetterSel.value);
      const lrkvaLo=code.lo*hp, lrkvaHi=code.hi*hp;
      const dipLo=lrkvaLo/(lrkvaLo+sc)*100, dipHi=lrkvaHi/(lrkvaHi+sc)*100;
      warn=dipHi>20;
      out='Locked-rotor kVA (Code '+code.l+' band): <b>'+fmt(lrkvaLo,0)+'&ndash;'+fmt(lrkvaHi,0)+' kVA</b>. Estimated voltage dip: <b>'+fmt(dipLo,1)+'%&ndash;'+fmt(dipHi,1)+'%</b> (terminal voltage sags to roughly '+fmt(100-dipHi,1)+'%&ndash;'+fmt(100-dipLo,1)+'% of nominal). Use actual nameplate LRA instead of the code-letter band for a precise figure.'+(warn?' This is a large enough dip to check against your minimum acceptable starting voltage.':'');
    } else {
      const lra=parseFloat(document.getElementById('motorLra').value);
      if(!(lra>0)){r.textContent='Enter locked-rotor amps (LRA).';r.className='est-result show';return;}
      const lrkva=1.732*V*lra/1000;
      const dip=lrkva/(lrkva+sc)*100;
      warn=dip>20;
      out='Locked-rotor kVA: <b>'+fmt(lrkva,0)+' kVA</b>. Estimated voltage dip: <b>'+fmt(dip,1)+'%</b> (terminal voltage sags to roughly '+fmt(100-dip,1)+'% of nominal).'+(warn?' This is a large enough dip to check against your minimum acceptable starting voltage.':'');
    }
    r.innerHTML=out;
    r.className='est-result show'+(warn?' warn':'');
  });

  /* ---- Arc-flash incident energy: Lee equation (open air, >600V) + Doughty equations
     (open air / arc-in-box, <=600V) -- both from NFPA 70E Annex D. Not the IEEE 1584
     arcing-current method. Every constant/exponent below was checked against worked
     numeric examples (V=0.48kV or 1kV, F=22.6kA, t=0.1s, D=18in) before shipping. */
  const AF_FORMULAS={
    lee:'E = 793 &times; F &times; V &times; t / D&sup2; &nbsp;&middot;&nbsp; Dc = &radic;(793 &times; F &times; V &times; t / E) &nbsp;[Lee, open air, &gt;600V]',
    doughtyAir:'E = 5271 &times; D<sup>&minus;1.9593</sup> &times; t &times; (0.0016F&sup2; &minus; 0.0076F + 0.8938) &nbsp;[Doughty, open air, &le;600V]',
    doughtyBox:'E = 1038.7 &times; D<sup>&minus;1.4738</sup> &times; t &times; (0.0093F&sup2; &minus; 0.3453F + 5.9675) &nbsp;[Doughty, arc in box, &le;600V]'
  };
  const afScenarioSel=document.getElementById('afScenario'), afVWrap=document.getElementById('afVWrap'), afFormulaEl=document.getElementById('afFormula');
  function afSyncScenario(){
    const sc=afScenarioSel.value;
    afVWrap.style.display=sc==='lee'?'':'none';
    afFormulaEl.innerHTML=AF_FORMULAS[sc];
  }
  if(afScenarioSel){afScenarioSel.addEventListener('change',afSyncScenario);afSyncScenario();}

  const afBtn=document.getElementById('afBtn');
  if(afBtn)afBtn.addEventListener('click',function(){
    const r=document.getElementById('afResult');
    const sc=afScenarioSel.value;
    const F=parseFloat(document.getElementById('afIbf').value), t=parseFloat(document.getElementById('afTime').value);
    const D=parseFloat(document.getElementById('afDist').value), thresh=parseFloat(document.getElementById('afThresh').value)||1.2;
    const V=parseFloat(document.getElementById('afV').value);
    if(!(F>0)||!(t>0)||!(D>0)){r.textContent='Enter bolted fault current, arc duration, and working distance.';r.className='est-result show';return;}
    if(sc==='lee'&&!(V>0)){r.textContent='Enter system voltage (kV) for the open-air, >600V scenario.';r.className='est-result show';return;}
    let E,Dc,warn=false,warnMsg='';
    if(sc==='lee'){
      E=793*F*V*t/(D*D);
      Dc=Math.sqrt(793*F*V*t/thresh);
    } else {
      const bracket=sc==='doughtyAir' ? (0.0016*F*F-0.0076*F+0.8938) : (0.0093*F*F-0.3453*F+5.9675);
      const k=sc==='doughtyAir'?5271:1038.7, exp=sc==='doughtyAir'?1.9593:1.4738;
      E=k*Math.pow(D,-exp)*t*bracket;
      Dc=Math.pow(k*t*bracket/thresh,1/exp);
      if(F<16||F>50){warn=true;warnMsg+=' Bolted fault current is outside the 16-50 kA range the Doughty equations were fit to — treat this result as extrapolated, not validated.';}
      if(D<18){warn=true;warnMsg+=' Working distance under 18 in is outside the Doughty equations\' validated range.';}
    }
    r.innerHTML='Estimated incident energy: <b>'+fmt(E)+' cal/cm&sup2;</b> at '+D+' in. Arc-flash boundary (at '+thresh+' cal/cm&sup2;): <b>'+fmt(Dc)+' in</b> ('+fmt(Dc/12)+' ft). Select PPE with an arc rating (ATPV/EBT) at or above the incident energy figure.'+warnMsg;
    r.className='est-result show'+(warn?' warn':'');
  });

  /* ---- Ground rod resistance: Dwight's formula (IEEE Std 142), R = [rho/(2*pi*L)] * [ln(4L/d) - 1] ---- */
  const gndPresetSel=document.getElementById('gndPreset');
  if(gndPresetSel)gndPresetSel.addEventListener('change',function(){
    if(this.value)document.getElementById('gndRho').value=this.value;
  });
  const gndBtn=document.getElementById('gndBtn');
  if(gndBtn)gndBtn.addEventListener('click',function(){
    const r=document.getElementById('gndResult');
    const rho=parseFloat(document.getElementById('gndRho').value);
    const Lft=parseFloat(document.getElementById('gndLen').value);
    const dIn=parseFloat(document.getElementById('gndDia').value);
    if(!(rho>0)||!(Lft>0)||!(dIn>0)){r.textContent='Enter soil resistivity, rod length, and rod diameter.';r.className='est-result show';return;}
    const L=Lft*0.3048, d=dIn*0.0254;
    const R=(rho/(2*Math.PI*L))*(Math.log(4*L/d)-1);
    const warn=R>25;
    r.innerHTML='Estimated resistance to earth: <b>'+fmt(R,1)+' &Omega;</b> for a '+Lft+' ft, '+dIn+'in-diameter rod in '+fmt(rho,0)+' &Omega;&middot;m soil.'+(warn?' <br>Exceeds the commonly cited 25&Omega; single-electrode benchmark — a supplemental electrode, longer/multiple rods, or soil treatment is the typical next step.':' Within the commonly cited 25&Omega; single-electrode benchmark.');
    r.className='est-result show'+(warn?' warn':'');
  });

  const pfBtn=document.getElementById('pfBtn');
  if(pfBtn)pfBtn.addEventListener('click',function(){
    const r=document.getElementById('pfResult');
    const kw=parseFloat(document.getElementById('pfKw').value), pf1=parseFloat(document.getElementById('pfExisting').value), pf2=parseFloat(document.getElementById('pfTarget').value);
    if(!(kw>0)||!(pf1>0&&pf1<=1)||!(pf2>0&&pf2<=1)){r.textContent='Enter real power and both power factors (0-1).';r.className='est-result show';return;}
    if(pf2<pf1){r.textContent='Target PF should be higher than existing PF.';r.className='est-result show warn';return;}
    const kvar=kw*(Math.tan(Math.acos(pf1))-Math.tan(Math.acos(pf2)));
    r.innerHTML='Capacitor bank required: <b>'+fmt(Math.max(kvar,0))+' kVAR</b> to raise PF from '+pf1+' to '+pf2+' at '+kw+' kW.';
    r.className='est-result show';
  });

  const cvBtn=document.getElementById('cvBtn');
  if(cvBtn)cvBtn.addEventListener('click',function(){
    const r=document.getElementById('cvResult');
    const kva=parseFloat(document.getElementById('cvKva').value), kw=parseFloat(document.getElementById('cvKw').value), pf=parseFloat(document.getElementById('cvPf').value);
    const has=[!isNaN(kva),!isNaN(kw),!isNaN(pf)].filter(Boolean).length;
    if(has<2){r.textContent='Enter any two of kVA, kW, PF to solve for the third.';r.className='est-result show';return;}
    let out;
    if(isNaN(pf)){out='Power factor: <b>'+fmt(kw/kva)+'</b>';}
    else if(isNaN(kw)){out='kW: <b>'+fmt(kva*pf)+'</b>';}
    else{out='kVA: <b>'+fmt(kw/pf)+'</b>';}
    r.innerHTML=out;
    r.className='est-result show';
  });

  const awgBtn=document.getElementById('awgBtn');
  if(awgBtn)awgBtn.addEventListener('click',function(){
    const r=document.getElementById('awgResult');
    const mm2In=parseFloat(document.getElementById('mm2In').value);
    const CM_PER_MM2=1973.53;
    if(mm2In>0){
      const cm=mm2In*CM_PER_MM2;
      let best=AWG[0],bd=Infinity;
      AWG.forEach(a=>{const d=Math.abs(a.cm-cm);if(d<bd){bd=d;best=a;}});
      r.innerHTML=fmt(mm2In)+' mm&sup2; = <b>'+fmt(cm,0)+' cmil</b> &rarr; closest standard size: <b>'+best.n+'</b>.';
    } else {
      const a=AWG[+awgSel.value];
      const mm2=a.cm/CM_PER_MM2;
      r.innerHTML=a.n+' = <b>'+fmt(a.cm)+' cmil</b> = <b>'+fmt(mm2)+' mm&sup2;</b>.';
    }
    r.className='est-result show';
  });

  const tcoBtn=document.getElementById('tcoBtn');
  if(tcoBtn)tcoBtn.addEventListener('click',function(){
    const r=document.getElementById('tcoResult');
    const nl=parseFloat(document.getElementById('tcoNl').value), ll=parseFloat(document.getElementById('tcoLl').value);
    const lf=parseFloat(document.getElementById('tcoLf').value)/100, rate=parseFloat(document.getElementById('tcoRate').value);
    const years=parseFloat(document.getElementById('tcoYears').value), disc=parseFloat(document.getElementById('tcoDiscount').value);
    if(!(nl>=0)||!(ll>=0)||!(lf>0)||!(rate>0)||!(years>0)){r.textContent='Enter no-load loss, load loss, load factor, rate, and service life.';r.className='est-result show';return;}
    const nlKwh=(nl/1000)*8760;
    const llKwh=(ll/1000)*Math.pow(lf,2)*8760;
    const annualCost=(nlKwh+llKwh)*rate;
    let lifetime,method;
    if(disc>0){
      const r_=disc/100;
      lifetime=annualCost*(1-Math.pow(1+r_,-years))/r_;
      method='NPV at '+disc+'% discount rate';
    } else {
      lifetime=annualCost*years;
      method='undiscounted total';
    }
    r.innerHTML='Annual energy loss: <b>'+fmt(nlKwh+llKwh,0)+' kWh</b> ($'+fmt(annualCost,0)+'/yr). Lifetime cost of losses over '+years+' years ('+method+'): <b>$'+fmt(lifetime,0)+'</b>.';
    r.className='est-result show';
  });

  const MACRS_PCT={5:[20.00,32.00,19.20,11.52,11.52,5.76],7:[14.29,24.49,17.49,12.49,8.93,8.92,8.93,4.46]};
  const macrsBtn=document.getElementById('macrsBtn');
  if(macrsBtn)macrsBtn.addEventListener('click',function(){
    const r=document.getElementById('macrsResult');
    const cost=parseFloat(document.getElementById('macrsCost').value);
    const cls=document.getElementById('macrsClass').value;
    if(!(cost>0)){r.textContent='Enter equipment cost.';r.className='est-result show';return;}
    const pcts=MACRS_PCT[cls];
    let rows='<div style="overflow-x:auto"><table class="reftable" style="margin-top:8px"><tr><th scope="col">Year</th><th scope="col">%</th><th scope="col">Deduction</th></tr>';
    let total=0;
    pcts.forEach((p,i)=>{
      const amt=cost*p/100;
      total+=amt;
      rows+='<tr><td>Year '+(i+1)+'</td><td>'+p.toFixed(2)+'%</td><td>$'+fmt(amt,0)+'</td></tr>';
    });
    rows+='</table></div>';
    r.innerHTML='MACRS '+cls+'-year schedule for $'+fmt(cost,0)+' of equipment (half-year convention):'+rows+'<div style="margin-top:8px">Total depreciated: <b>$'+fmt(total,0)+'</b></div>';
    r.className='est-result show';
  });

  const pbBtn=document.getElementById('pbBtn');
  if(pbBtn)pbBtn.addEventListener('click',function(){
    const r=document.getElementById('pbResult');
    const cost=parseFloat(document.getElementById('pbCost').value), savings=parseFloat(document.getElementById('pbSavings').value);
    const disc=parseFloat(document.getElementById('pbDiscount').value), years=parseFloat(document.getElementById('pbYears').value);
    if(!(cost>0)||!(savings>0)||!(years>0)){r.textContent='Enter upfront cost, annual savings, and analysis period.';r.className='est-result show';return;}
    const payback=cost/savings;
    const r_=disc>0?disc/100:0;
    const pvOfSavings=r_>0 ? savings*(1-Math.pow(1+r_,-years))/r_ : savings*years;
    const npv=pvOfSavings-cost;
    const noPayback=payback>years;
    const method=r_>0?'NPV at '+disc+'% discount rate':'undiscounted total (enter a discount rate for a true NPV)';
    r.innerHTML='Simple payback: <b>'+fmt(payback,1)+' years</b>'+(noPayback?' — longer than the '+years+'-year analysis period.':'.')+' Present value of '+years+' years of savings: <b>$'+fmt(pvOfSavings,0)+'</b> ('+method+'). Net present value: <b>$'+fmt(npv,0)+'</b>'+(npv>=0?' (positive — savings exceed cost in present-value terms).':' (negative — cost exceeds the present value of savings over this period).');
    r.className='est-result show'+(npv<0||noPayback?' warn':'');
  });

  const landedBtn=document.getElementById('landedBtn');
  if(landedBtn)landedBtn.addEventListener('click',function(){
    const r=document.getElementById('landedResult');
    const price=parseFloat(document.getElementById('landedPrice').value);
    const freight=parseFloat(document.getElementById('landedFreight').value)||0;
    const duty=parseFloat(document.getElementById('landedDuty').value)||0;
    const ins=parseFloat(document.getElementById('landedIns').value)||0;
    if(!(price>0)){r.textContent='Enter equipment price.';r.className='est-result show';return;}
    const dutyAmt=price*duty/100;
    const landed=price+freight+dutyAmt+ins;
    const pct=(landed-price)/price*100;
    r.innerHTML='Duty amount: <b>$'+fmt(dutyAmt,0)+'</b>. Total landed cost: <b>$'+fmt(landed,0)+'</b> ('+fmt(pct,1)+'% above equipment price).';
    r.className='est-result show';
  });

  const genBtn=document.getElementById('genBtn');
  if(genBtn)genBtn.addEventListener('click',function(){
    const r=document.getElementById('genResult');
    const tank=parseFloat(document.getElementById('genTank').value);
    const rate=parseFloat(document.getElementById('genRate').value);
    if(!(tank>0)||!(rate>0)){r.textContent='Enter fuel tank capacity and consumption rate.';r.className='est-result show';return;}
    const hrs=tank/rate;
    const days=hrs/24;
    r.innerHTML='Estimated runtime: <b>'+fmt(hrs,1)+' hours</b> ('+fmt(days,1)+' days) on a full tank at this load.';
    r.className='est-result show';
  });
})();

/* ---------- usage tracking: which of the 20 calculators actually get used.
   Delegated so it covers every .estimator/*Btn pair, including any added later.
   Moved here from engineering-calculators.html with the calculators, so the
   event names (calc = the estimator id) are unchanged and old reports still line up. ---------- */
(function(){
  document.addEventListener('click',function(e){
    var btn=e.target.closest('button[id$="Btn"]');
    if(!btn)return;
    var est=btn.closest('.estimator');
    if(!est||!est.id)return;
    if(window.vfGtag)window.vfGtag('event','calculator_run',{calc:est.id});
  });
})();
