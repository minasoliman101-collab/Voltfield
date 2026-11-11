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
  const vdSel=document.getElementById('vdSize');
  if(vdSel) vdSel.innerHTML=AWG.map((a,i)=>'<option value="'+i+'"'+(a.n==='4/0 AWG'?' selected':'')+'>'+a.n+'</option>').join('');

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

  /* ---- NEC Table 310.16 ampacity (curated subset, base conditions: <=3 CCC, 30C ambient).
     Conduit fill has its own data block lower down, with the conduit-fill page. ---- */
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

  const ampSizeSel=document.getElementById('ampSize');
  if(ampSizeSel)ampSizeSel.innerHTML=NEC_AMPACITY.map((a,i)=>'<option value="'+i+'"'+(a.n==='4/0 AWG'?' selected':'')+'>'+a.n+'</option>').join('');

  const ampBtn=document.getElementById('ampBtn');
  if(ampBtn)ampBtn.addEventListener('click',function(){
    const r=document.getElementById('ampResult');
    const row=NEC_AMPACITY[+ampSizeSel.value], mat=document.getElementById('ampMat').value, temp=document.getElementById('ampTemp').value;
    const a=row[mat][temp];
    if(a===null){r.textContent=row.n+' has no standard aluminum ampacity in this table (aluminum conductors typically start at 12 AWG).';r.className='est-result show warn';return;}
    r.innerHTML=row.n+' '+(mat==='Cu'?'copper':'aluminum')+', '+temp+'&deg;C column: <b>'+a+' A</b> base ampacity (&le;3 current-carrying conductors, 30&deg;C ambient, before any correction factors).';
    r.className='est-result show';
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

  /* ---- AWG to mm2 -------------------------------------------------------
     Replaces a smaller widget that lived on calculators/reference-tables.html
     and converted between a 21-row lookup table. AWG is defined by a geometric
     progression rather than tabulated arbitrarily -- the diameter of gauge n is
     0.005 in x 92^((36-n)/39) -- so every size is computed here instead, which
     covers 40 AWG through 2000 kcmil rather than 14 AWG through 1000 kcmil.
     That definition is also where the familiar rules of thumb come from: six
     gauge steps is very nearly four times the area, three steps very nearly
     double.

     Sizes above 4/0 leave the gauge system and are specified in thousands of
     circular mils, so those entries carry a cmil value instead of a gauge
     number.

     What this deliberately does NOT do is convert ampacity. NEC Table 310.16
     and IEC 60364-5-52 rest on different installation methods, ambient
     references and grouping assumptions, so equal area is not equal current
     rating. The estimator id stays awgCalc so the usage events still line up
     with reports from before the move. */
  const CMIL_MM2 = Math.PI / 4 * Math.pow(0.0254, 2);   /* mm2 per circular mil */
  const IEC_MM2 = [0.5,0.75,1,1.5,2.5,4,6,10,16,25,35,50,70,95,120,150,185,240,300,400,500,630,800,1000];
  /* n = gauge number for the formula (4/0 is -3); cmil given directly above 4/0. */
  const AWG_SIZES = [
    {label:'2000 kcmil',cmil:2000000},{label:'1750 kcmil',cmil:1750000},
    {label:'1500 kcmil',cmil:1500000},{label:'1250 kcmil',cmil:1250000},
    {label:'1000 kcmil',cmil:1000000},{label:'900 kcmil',cmil:900000},
    {label:'800 kcmil',cmil:800000},{label:'750 kcmil',cmil:750000},
    {label:'700 kcmil',cmil:700000},{label:'600 kcmil',cmil:600000},
    {label:'500 kcmil',cmil:500000},{label:'400 kcmil',cmil:400000},
    {label:'350 kcmil',cmil:350000},{label:'300 kcmil',cmil:300000},
    {label:'250 kcmil',cmil:250000},
    {label:'4/0 AWG',n:-3},{label:'3/0 AWG',n:-2},{label:'2/0 AWG',n:-1},{label:'1/0 AWG',n:0}
  ];
  for(let gn=1;gn<=40;gn++) AWG_SIZES.push({label:gn+' AWG',n:gn});

  function awgCmil(s){ return s.cmil!==undefined ? s.cmil : Math.pow(0.005*Math.pow(92,(36-s.n)/39)*1000,2); }
  function awgArea(s){ return awgCmil(s)*CMIL_MM2; }
  function awgDiaMm(s){ return Math.sqrt(awgCmil(s))/1000*25.4; }
  /* The standardized tables carry these to four significant figures, and their
     values differ from the pure formula in the last digit (6 AWG is listed as
     26,240 where the definition gives 26,250). Round the same way and say so. */
  function awgSig4(v){ const e=Math.pow(10,Math.floor(Math.log10(v))-3); return Math.round(v/e)*e; }
  function awgNote(){
    return '<br>Area is the AWG geometric definition for a solid conductor. Circular mils are rounded to four significant figures as the tables present them, and the standardized values in NEC Chapter 9 Table 8 can differ from the definition in the last digit. A stranded conductor of the same size has a larger overall diameter. Use Table 8 for code work. Ampacity does not convert: NEC and IEC rate conductors under different installation and ambient assumptions.';
  }

  const awgPick = document.getElementById('awgPick');
  if(awgPick && !awgPick.options.length){
    awgPick.innerHTML = AWG_SIZES.map(function(s,i){
      return '<option value="'+i+'"'+(s.label==='12 AWG'?' selected':'')+'>'+s.label+'</option>';
    }).join('');
  }

  const awgDirSel = document.getElementById('awgDir');
  if(awgDirSel){
    const awgSync=function(){
      const toMm = awgDirSel.value==='a2m';
      document.getElementById('awgPickWrap').hidden = !toMm;
      document.getElementById('awgMm2Wrap').hidden = toMm;
    };
    awgDirSel.addEventListener('change',awgSync); awgSync();
  }

  const awgBtn=document.getElementById('awgBtn');
  if(awgBtn)awgBtn.addEventListener('click',function(){
    const r=document.getElementById('awgResult');
    const nearestIec=function(mm2){ return IEC_MM2.reduce(function(a,b){ return Math.abs(b-mm2)<Math.abs(a-mm2)?b:a; }); };

    if(document.getElementById('awgDir').value==='a2m'){
      const s=AWG_SIZES[parseInt(document.getElementById('awgPick').value,10)];
      if(!s){r.textContent='Pick a size.';r.className='est-result show';return;}
      const mm2=awgArea(s), iec=nearestIec(mm2);
      let msg='<b>'+s.label+' = '+fmt(mm2,mm2<10?3:1)+' mm&sup2;</b>';
      msg+='<br>'+fmt(awgSig4(awgCmil(s)),0)+' circular mils, '+fmt(awgDiaMm(s),2)+' mm nominal diameter.';
      /* The nearest IEC size is almost never equal, and which way it rounds matters. */
      if(Math.abs(iec-mm2)/mm2<0.005){
        msg+='<br>IEC standard size '+iec+' mm&sup2; is effectively identical.';
      } else {
        msg+='<br>Nearest IEC standard size: <b>'+iec+' mm&sup2;</b>, '+fmt(Math.abs(iec-mm2)/mm2*100,1)+'% '+(iec>mm2?'larger':'smaller')+'.';
        if(iec<mm2){
          const up=IEC_MM2[IEC_MM2.indexOf(iec)+1];
          msg+=' That is less copper, so a substitution steps up to '+(up?up+' mm&sup2;':'the next size')+' instead.';
        }
      }
      r.innerHTML=msg+awgNote(); r.className='est-result show'; return;
    }

    const mm2=parseFloat(document.getElementById('awgMm2').value);
    if(!(mm2>0)){r.textContent='Enter an area in mm\u00b2.';r.className='est-result show';return;}
    const biggest=awgArea(AWG_SIZES[0]);
    if(mm2>biggest){
      r.innerHTML='Above '+AWG_SIZES[0].label+' ('+fmt(biggest,0)+' mm&sup2;), the largest single conductor here. Larger cross-sections run as parallel conductors or busbar.';
      r.className='est-result show warn'; return;
    }
    /* Nearest by area, and separately the smallest size that is not smaller --
       for a substitution those are two different questions. */
    let near=AWG_SIZES[0];
    AWG_SIZES.forEach(function(s){ if(Math.abs(awgArea(s)-mm2)<Math.abs(awgArea(near)-mm2)) near=s; });
    const notSmaller=AWG_SIZES.filter(function(s){ return awgArea(s)>=mm2; }).pop()||AWG_SIZES[0];
    const na=awgArea(near), shown=fmt(mm2,mm2<10?2:1);
    /* Within half a percent the figure entered IS that size -- almost always a
       value read off an AWG table in the first place -- so do not report a 0%
       difference and do not push the reader up a size for nothing. */
    if(Math.abs(na-mm2)/mm2<0.005){
      r.innerHTML='<b>'+shown+' mm&sup2; is '+near.label+'</b> ('+fmt(na,na<10?3:1)+' mm&sup2;). The two are the same size.'+awgNote();
      r.className='est-result show'; return;
    }
    let msg='<b>'+shown+' mm&sup2; is closest to '+near.label+'</b> ('+fmt(na,na<10?3:1)+' mm&sup2;, '+fmt(Math.abs(na-mm2)/mm2*100,1)+'% '+(na>mm2?'larger':'smaller')+').';
    if(notSmaller.label!==near.label){
      msg+='<br>Smallest size not smaller than '+shown+' mm&sup2;: <b>'+notSmaller.label+'</b> ('+fmt(awgArea(notSmaller),1)+' mm&sup2;). Use that one for a substitution.';
    } else {
      msg+='<br>That is also the smallest size no smaller than the figure entered.';
    }
    r.innerHTML=msg+awgNote(); r.className='est-result show';
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
  /* ---- Wire size: the two checks NEC 110.14(C) and 310.15 actually require ----
     The existing ampacity tool above is a pure table lookup. This one performs
     the selection: a conductor has to satisfy the termination temperature limit
     at 125% of a continuous load AND survive ambient and bundling adjustment on
     its own insulation column against the real load. The answer is whichever
     check demands more copper, and they move independently -- raising ambient
     changes the second and leaves the first alone.

     Adjustment factors are NEC 310.15(B)(1) and 310.15(C)(1). Only the factors
     needed to run the calculation are here; base ampacities come from the
     curated NEC_AMPACITY subset already in this file. */
  const WS_AMB={           /* ambient correction, by insulation rating */
    90:{30:1.00,35:0.96,40:0.91,45:0.87,50:0.82,55:0.76,60:0.71},
    75:{30:1.00,35:0.94,40:0.88,45:0.82,50:0.75,55:0.67,60:0.58}
  };
  const WS_CCC={3:1.00,6:0.80,9:0.70,20:0.50,30:0.45,40:0.40,41:0.35};

  const wsBtn=document.getElementById('wsBtn');
  if(wsBtn)wsBtn.addEventListener('click',function(){
    const r=document.getElementById('wsResult');
    const load=parseFloat(document.getElementById('wsLoad').value);
    const cont=document.getElementById('wsCont').value==='1';
    const mat=document.getElementById('wsMat').value;
    const term=document.getElementById('wsTerm').value;
    const ins=document.getElementById('wsIns').value;
    const amb=document.getElementById('wsAmb').value;
    const ccc=document.getElementById('wsCcc').value;
    if(!(load>0)){r.textContent='Enter the load current.';r.className='est-result show';return;}

    /* An insulation rating below the termination rating would make the second
       check run on a lower column than the first, which is not a real
       installation -- it means the wrong wire for those terminals. */
    if(Number(ins)<Number(term)){
      r.innerHTML='Insulation rated below the terminations. A '+ins+'&deg;C conductor cannot be used on '+term+'&deg;C terminals; pick an insulation rating at or above the termination rating.';
      r.className='est-result show warn'; return;
    }

    const required=cont ? load*1.25 : load;
    const ambF=WS_AMB[ins][amb], cccF=WS_CCC[ccc];

    const pick=(fn)=>{ for(const row of NEC_AMPACITY){ const v=fn(row); if(v!==null&&v!==undefined&&v>0) return row; } return null; };
    /* Check 1: termination column must carry 125% of a continuous load. */
    const byTerm=pick(row=> (row[mat][term]!==null && row[mat][term]>=required) ? row[mat][term] : null);
    /* Check 2: insulation column, adjusted, must carry the real load. */
    const byDerate=pick(row=> (row[mat][ins]!==null && row[mat][ins]*ambF*cccF>=load) ? row[mat][ins] : null);

    if(!byTerm||!byDerate){
      r.innerHTML='Above the largest size in this table ('+NEC_AMPACITY[NEC_AMPACITY.length-1].n+'). Parallel conductors or a busway, and a full calculation rather than a lookup.';
      r.className='est-result show warn'; return;
    }

    const iT=NEC_AMPACITY.indexOf(byTerm), iD=NEC_AMPACITY.indexOf(byDerate);
    const winner=iD>iT ? byDerate : byTerm;
    const governed=iD>iT ? 'the derating check' : (iD===iT ? 'both checks equally' : 'the termination limit');
    const dv=byDerate[mat][ins]*ambF*cccF;

    let msg='<b>'+winner.n+' '+(mat==='Cu'?'copper':'aluminum')+'</b>, governed by '+governed+'.';
    msg+='<br>Termination check: '+(cont?'125% of ':'')+load+' A = '+fmt(required,1)+' A required &rarr; '+byTerm.n+' carries '+byTerm[mat][term]+' A in the '+term+'&deg;C column.';
    msg+='<br>Derating check: '+byDerate.n+' at '+ins+'&deg;C is '+byDerate[mat][ins]+' A &times; '+fmt(ambF,2)+' ambient &times; '+fmt(cccF,2)+' bundling = '+fmt(dv,1)+' A against a '+load+' A load.';
    if(cont) msg+='<br>The overcurrent device is a separate selection under NEC 240.4 and 240.6.';
    msg+=' Voltage drop is not checked here.';
    r.innerHTML=msg; r.className='est-result show';
  });

/* ---- Unit conversions: amps/kW/kVA/HP/watts ----
     One shared square root of three, used by every handler below and quoted as
     1.732 in the formulas on the pages, so a reader checking the page against
     the tool gets the same answer to the digits shown. Each handler ignores
     power factor on DC rather than silently applying a meaningless one, and
     hides the field so nobody types into it expecting an effect. */
  const R3=Math.sqrt(3);

  /* Show or hide a power factor field when the system selector changes, so the
     form only ever asks for what the selected system actually uses. */
  function wirePfToggle(selId,wrapId){
    const sel=document.getElementById(selId), wrap=document.getElementById(wrapId);
    if(!sel||!wrap)return;
    const sync=function(){ wrap.hidden = (sel.value==='dc'); };
    sel.addEventListener('change',sync); sync();
  }
  wirePfToggle('a2kPhase','a2kPfWrap');
  wirePfToggle('k2aPhase','k2aPfWrap');
  wirePfToggle('w2aPhase','w2aPfWrap');

  /* Amps to kW */
  const a2kBtn=document.getElementById('a2kBtn');
  if(a2kBtn)a2kBtn.addEventListener('click',function(){
    const r=document.getElementById('a2kResult');
    const sys=document.getElementById('a2kPhase').value;
    const I=parseFloat(document.getElementById('a2kI').value);
    const V=parseFloat(document.getElementById('a2kV').value);
    const pfRaw=parseFloat(document.getElementById('a2kPf').value);
    const pf = sys==='dc' ? 1 : pfRaw;
    if(!(I>0)||!(V>0)){r.textContent='Enter current and voltage.';r.className='est-result show';return;}
    if(sys!=='dc'&&!(pf>0&&pf<=1)){r.textContent='Enter a power factor between 0 and 1.';r.className='est-result show';return;}
    const kw = sys==='3' ? (R3*V*I*pf)/1000 : (V*I*pf)/1000;
    const kva = sys==='dc' ? null : (sys==='3' ? (R3*V*I)/1000 : (V*I)/1000);
    let msg='<b>'+fmt(kw)+' kW</b> real power';
    if(kva!==null) msg+=', from <b>'+fmt(kva)+' kVA</b> apparent at PF '+fmt(pf,2);
    msg+='.';
    if(sys==='3') msg+=' Three-phase, so the square root of three is included.';
    if(sys==='dc') msg+=' DC has no power factor, so real and apparent power are the same.';
    r.innerHTML=msg; r.className='est-result show';
  });

  /* kW to amps */
  const k2aBtn=document.getElementById('k2aBtn');
  if(k2aBtn)k2aBtn.addEventListener('click',function(){
    const r=document.getElementById('k2aResult');
    const sys=document.getElementById('k2aPhase').value;
    const kw=parseFloat(document.getElementById('k2aKw').value);
    const V=parseFloat(document.getElementById('k2aV').value);
    const pfRaw=parseFloat(document.getElementById('k2aPf').value);
    const pf = sys==='dc' ? 1 : pfRaw;
    if(!(kw>0)||!(V>0)){r.textContent='Enter power and voltage.';r.className='est-result show';return;}
    if(sys!=='dc'&&!(pf>0&&pf<=1)){r.textContent='Enter a power factor between 0 and 1.';r.className='est-result show';return;}
    const I = sys==='3' ? (kw*1000)/(R3*V*pf) : (kw*1000)/(V*pf);
    /* The 125% continuous-load figure is shown alongside because sizing from
       the bare current is the most common way this result is misused. */
    const cont=I*1.25;
    let msg='<b>'+fmt(I)+' A</b>';
    if(sys==='3') msg+=' per phase';
    msg+='. At 125% for a continuous load: <b>'+fmt(cont)+' A</b>, which is the figure NEC 210.19(A) sizes the conductor from.';
    if(sys==='dc') msg+=' DC, so no power factor applies.';
    r.innerHTML=msg; r.className='est-result show';
  });

  /* kVA to amps -- no power factor by design */
  const kva2aBtn=document.getElementById('kva2aBtn');
  if(kva2aBtn)kva2aBtn.addEventListener('click',function(){
    const r=document.getElementById('kva2aResult');
    const sys=document.getElementById('kva2aPhase').value;
    const kva=parseFloat(document.getElementById('kva2aKva').value);
    const V=parseFloat(document.getElementById('kva2aV').value);
    if(!(kva>0)||!(V>0)){r.textContent='Enter a kVA rating and the voltage on the side you are calculating.';r.className='est-result show';return;}
    const I = sys==='3' ? (kva*1000)/(R3*V) : (kva*1000)/V;
    r.innerHTML='<b>'+fmt(I)+' A</b> full-load'+(sys==='3'?' per phase':'')+
      '. No power factor term: kVA is already apparent power. Calculate the other winding separately &mdash; the kVA is the same on both sides, the current is not.';
    r.className='est-result show';
  });

  /* Motor HP to kW, and to full-load amps */
  const hp2kBtn=document.getElementById('hp2kBtn');
  if(hp2kBtn)hp2kBtn.addEventListener('click',function(){
    const r=document.getElementById('hp2kResult');
    const hp=parseFloat(document.getElementById('hp2kHp').value);
    const eff=parseFloat(document.getElementById('hp2kEff').value);
    const V=parseFloat(document.getElementById('hp2kV').value);
    const pf=parseFloat(document.getElementById('hp2kPf').value);
    if(!(hp>0)){r.textContent='Enter horsepower.';r.className='est-result show';return;}
    if(!(eff>0&&eff<=1)){r.textContent='Enter an efficiency between 0 and 1, for example 0.93.';r.className='est-result show';return;}
    const out=hp*0.7457;
    const inp=out/eff;
    let msg='Shaft output <b>'+fmt(out)+' kW</b>, drawn from the supply <b>'+fmt(inp)+' kW</b>.';
    if(V>0&&pf>0&&pf<=1){
      const I=(hp*745.7)/(R3*V*pf*eff);
      msg+=' Full-load current at '+fmt(V,0)+' V three-phase: <b>'+fmt(I)+' A</b>. '+
           'Size conductors and protection from NEC Table 430.250, which is deliberately more conservative than this figure.';
    } else {
      msg+=' Add voltage and power factor for full-load current.';
    }
    r.innerHTML=msg; r.className='est-result show';
  });

  /* Watts to amps */
  const w2aBtn=document.getElementById('w2aBtn');
  if(w2aBtn)w2aBtn.addEventListener('click',function(){
    const r=document.getElementById('w2aResult');
    const sys=document.getElementById('w2aPhase').value;
    const W=parseFloat(document.getElementById('w2aW').value);
    const V=parseFloat(document.getElementById('w2aV').value);
    const pfRaw=parseFloat(document.getElementById('w2aPf').value);
    const pf = sys==='dc' ? 1 : pfRaw;
    if(!(W>0)||!(V>0)){r.textContent='Enter power and voltage.';r.className='est-result show';return;}
    if(sys!=='dc'&&!(pf>0&&pf<=1)){r.textContent='Enter a power factor between 0 and 1.';r.className='est-result show';return;}
    const I = sys==='3' ? W/(R3*V*pf) : W/(V*pf);
    let msg='<b>'+fmt(I)+' A</b>'+(sys==='3'?' per phase':'')+'.';
    /* Branch-circuit context only where it is meaningful: a single-phase load
       on a standard residential or commercial branch circuit. */
    if(sys==='1'&&V<=277){
      const cont=I*1.25;
      msg+=' At 125% for a continuous load: <b>'+fmt(cont)+' A</b>. On a 15 A circuit the continuous limit is 12 A, on a 20 A circuit 16 A.';
    }
    if(sys==='dc') msg+=' DC, so no power factor applies.';
    r.innerHTML=msg; r.className='est-result show';
  });

  /* ---- Conduit fill: mixed sizes, the right cap, and the smallest raceway ----
     Replaces the single-size widget on calculators/ampacity.html, which could
     not take more than one conductor size and said so. Real raceways carry
     mixed sizes -- phases plus a smaller equipment grounding conductor is the
     normal case -- and the cap depends on the TOTAL conductor count, so the
     mixed case is not a sum of single-size answers.

     Chapter 9 Table 1 caps: 53% for one conductor, 31% for two, 40% for more
     than two. A nipple not exceeding 24 inches may be filled to 60% under the
     notes to Table 1. Equipment grounding and bonding conductors count toward
     the fill. A multiconductor cable counts as a single conductor.

     DATA SCOPE: the conduit and conductor areas here are the same curated
     subset the previous widget used, cross-checked against the 40% EMT figures
     it carried. They are not a reproduction of Chapter 9 Tables 4 and 5, and
     the conductor list was deliberately NOT extended: published sources
     disagree on some Table 5 areas (2 AWG THHN appears as both 0.1158 and
     0.1333 in different places), and a fill tool that is confidently wrong is
     worse than one that asks for the number. Hence the direct-entry fields for
     anything outside the list. Annex C is the code's own pre-computed answer
     and can differ by about one conductor either way from area-ratio math. */
  const CF_RACEWAY=[
    {k:'emt-1-2',label:'1/2" EMT',area:0.304},
    {k:'emt-3-4',label:'3/4" EMT',area:0.533},
    {k:'emt-1',label:'1" EMT',area:0.864},
    {k:'emt-2',label:'2" EMT',area:3.356}
  ];
  const CF_COND=[
    {k:'14',label:'14 AWG THHN',area:0.0097},
    {k:'12',label:'12 AWG THHN',area:0.0133},
    {k:'10',label:'10 AWG THHN',area:0.0211},
    {k:'8',label:'8 AWG THHN',area:0.0366},
    {k:'6',label:'6 AWG THHN',area:0.0507},
    {k:'1-0',label:'1/0 AWG THHN',area:0.1855}
  ];
  function cfCap(n,nipple){ return nipple ? 0.60 : (n===1?0.53:(n===2?0.31:0.40)); }

  const cfConduitSel=document.getElementById('cfConduit');
  if(cfConduitSel && !cfConduitSel.options.length){
    cfConduitSel.innerHTML=CF_RACEWAY.map(function(c){
      return '<option value="'+c.k+'"'+(c.k==='emt-3-4'?' selected':'')+'>'+c.label+'</option>';
    }).join('')+'<option value="custom">Other (enter area)</option>';
    cfConduitSel.addEventListener('change',function(){
      document.getElementById('cfAreaWrap').hidden = cfConduitSel.value!=='custom';
    });
  }
  ['cfSize1','cfSize2','cfSize3'].forEach(function(id,i){
    const sel=document.getElementById(id);
    if(sel && !sel.options.length){
      sel.innerHTML=CF_COND.map(function(c){
        return '<option value="'+c.k+'"'+((i===0&&c.k==='12')||(i===1&&c.k==='10')?' selected':'')+'>'+c.label+'</option>';
      }).join('');
    }
  });

  const cfBtn=document.getElementById('cfBtn');
  if(cfBtn)cfBtn.addEventListener('click',function(){
    const r=document.getElementById('cfResult');
    const num=function(id){ const v=parseFloat(document.getElementById(id).value); return isNaN(v)?0:v; };
    const sel=document.getElementById('cfConduit').value;
    const race=CF_RACEWAY.filter(function(c){return c.k===sel;})[0];
    const total = race ? race.area : num('cfArea');
    const raceName = race ? race.label : 'the raceway';
    if(!(total>0)){ r.textContent='Enter the raceway internal area from Chapter 9 Table 4.'; r.className='est-result show'; return; }

    const groups=[];
    [['cfQty1','cfSize1'],['cfQty2','cfSize2'],['cfQty3','cfSize3']].forEach(function(p){
      const q=Math.floor(num(p[0]));
      if(q>0){ const c=CF_COND.filter(function(x){return x.k===document.getElementById(p[1]).value;})[0];
               if(c) groups.push({q:q,label:c.label,area:c.area}); }
    });
    const otherN=Math.floor(num('cfOtherN')), otherA=num('cfOtherA');
    if(otherN>0 && !(otherA>0)){ r.textContent='Give the total area for the other conductors, from Chapter 9 Table 5.'; r.className='est-result show'; return; }

    const n = groups.reduce(function(a,g){return a+g.q;},0) + otherN;
    if(n<1){ r.textContent='Enter at least one conductor.'; r.className='est-result show'; return; }
    const used = groups.reduce(function(a,g){return a+g.q*g.area;},0) + otherA;

    const nipple = document.getElementById('cfNipple').value==='1';
    const cap = cfCap(n,nipple);
    const capArea = total*cap;
    const pct = used/total*100;
    const fits = used<=capArea;

    let msg = '<b>'+fmt(pct,1)+'% fill</b> in '+raceName+' &mdash; '+fmt(used,4)+' in&sup2; of conductor in '+fmt(total,3)+' in&sup2; total area.';
    msg += '<br>'+n+' conductor'+(n===1?'':'s')+', so the cap is <b>'+Math.round(cap*100)+'%</b>'+(nipple?' (nipple, 24 in. or less)':'')+' = '+fmt(capArea,4)+' in&sup2;. ';
    msg += fits ? '<b>Fits.</b>' : '<b>Over the cap</b> by '+fmt(used-capArea,4)+' in&sup2;.';

    if(groups.length){
      msg += '<br>Counted: '+groups.map(function(g){return g.q+' &times; '+g.label;}).join(', ')+
             (otherN>0 ? ', plus '+otherN+' other at '+fmt(otherA,4)+' in&sup2;' : '')+'.';
    }
    /* The smallest listed raceway that works -- the question actually being asked. */
    const ok=CF_RACEWAY.filter(function(c){ return used <= c.area*cfCap(n,nipple); });
    if(ok.length) msg += '<br>Smallest listed size that fits this bundle: <b>'+ok[0].label+'</b>.';
    else msg += '<br>No listed size fits; larger raceways are in Chapter 9 Table 4.';

    /* Single-size bundles have a meaningful maximum count; mixed ones do not. */
    if(groups.length===1 && otherN===0){
      let best=0;
      for(let k=1;k<=1000;k++){ if(k*groups[0].area <= total*cfCap(k,nipple)) best=k; }
      msg += '<br>Maximum '+groups[0].label+' in '+raceName+': <b>'+best+'</b>.';
    }
    msg += '<br>Equipment grounding conductors count toward fill, and a multiconductor cable counts as one conductor. NEC Annex C gives the code\u2019s own pre-computed counts and can differ by about one conductor from this arithmetic.';
    r.innerHTML=msg;
    r.className='est-result show'+(fits?'':' warn');
  });

  /* ---- kVA / kW / PF / kvar: solve the power triangle -------------------
     Replaces a three-field solver that lived under #unit-converter on
     calculators/reference-tables.html. Adding reactive power makes it the whole
     triangle rather than three quarters of it, and lets the tool check an
     over-specified entry instead of silently ignoring a field.

     S^2 = P^2 + Q^2, and PF = P/S. Everything below is those two relations
     rearranged. The estimator id stays convCalc so the usage events still match
     reports from before the move.

     The editorial point the page is built on: power factor is a property of the
     load, not of the equipment feeding it. That is WHY transformers are rated
     in kVA -- the manufacturer cannot know the load. So kVA to kW is not a unit
     conversion with a fixed factor, and 0.8 is a generator-set design
     convention rather than a default to reach for. */
  function ptSolve(S,Pk,pf,Q){
    const has=function(v){ return v!==null && !isNaN(v); };
    let n=[S,Pk,pf,Q].filter(has).length;
    if(n<2) return {err:'Enter at least two values.'};
    if(has(pf)&&(pf<=0||pf>1)) return {err:'Power factor is between 0 and 1. Leading and lagging share the same magnitude here.'};
    if(has(S)&&S<0||has(Pk)&&Pk<0||has(Q)&&Q<0) return {err:'Powers cannot be negative.'};

    /* Derive from whichever pair is present, in order of directness. */
    if(has(S)&&has(pf)){ const p=S*pf; return fin(S,p,pf,Math.sqrt(Math.max(S*S-p*p,0)),S,Pk,pf,Q); }
    if(has(Pk)&&has(pf)){ const s2=Pk/pf; return fin(s2,Pk,pf,Math.sqrt(Math.max(s2*s2-Pk*Pk,0)),S,Pk,pf,Q); }
    if(has(S)&&has(Pk)){
      if(Pk>S) return {err:'Real power cannot exceed apparent power. kW is at most kVA, and they are equal only at unity power factor.'};
      return fin(S,Pk,Pk/S,Math.sqrt(Math.max(S*S-Pk*Pk,0)),S,Pk,pf,Q);
    }
    if(has(Pk)&&has(Q)){ const s3=Math.sqrt(Pk*Pk+Q*Q); return fin(s3,Pk,s3===0?1:Pk/s3,Q,S,Pk,pf,Q); }
    if(has(S)&&has(Q)){
      if(Q>S) return {err:'Reactive power cannot exceed apparent power.'};
      const p4=Math.sqrt(Math.max(S*S-Q*Q,0)); return fin(S,p4,S===0?1:p4/S,Q,S,Pk,pf,Q);
    }
    if(has(pf)&&has(Q)){
      if(pf>=1) return {err:'At unity power factor the reactive power is zero, so these two cannot both be given unless kvar is 0.'};
      const s5=Q/Math.sin(Math.acos(pf)); return fin(s5,s5*pf,pf,Q,S,Pk,pf,Q);
    }
    return {err:'Enter at least two values.'};
  }
  /* Flag any supplied value the solution contradicts by more than 1%. */
  function fin(S,Pk,pf,Q,iS,iP,ipf,iQ){
    const out={S:S,P:Pk,pf:pf,Q:Q,conflicts:[]};
    const chk=function(given,solved,name,unit){
      if(given===null||isNaN(given))return;
      const d=Math.abs(given-solved), rel=Math.max(Math.abs(solved),1e-9);
      if(d/rel>0.01) out.conflicts.push(name+' given as '+given+unit+' but the others imply '+fmt(solved,2)+unit);
    };
    chk(iS,S,'kVA',' kVA'); chk(iP,Pk,'kW',' kW'); chk(ipf,pf,'PF',''); chk(iQ,Q,'kvar',' kvar');
    return out;
  }

  const ptBtn=document.getElementById('ptBtn');
  if(ptBtn)ptBtn.addEventListener('click',function(){
    const r=document.getElementById('ptResult');
    const g=function(id){ const v=parseFloat(document.getElementById(id).value); return isNaN(v)?null:v; };
    const res=ptSolve(g('ptKva'),g('ptKw'),g('ptPf'),g('ptKvar'));
    if(res.err){ r.textContent=res.err; r.className='est-result show warn'; return; }

    let msg='<b>'+fmt(res.S,2)+' kVA &middot; '+fmt(res.P,2)+' kW &middot; '+fmt(res.Q,2)+' kvar &middot; PF '+fmt(res.pf,3)+'</b>';
    msg+='<br>kW = kVA &times; PF = '+fmt(res.S,2)+' &times; '+fmt(res.pf,3)+' = '+fmt(res.P,2)+' kW.';
    if(res.Q>0.005) msg+=' The '+fmt(res.Q,2)+' kvar is reactive: it is current the system carries and nothing useful comes out of it.';
    else msg+=' At unity power factor there is no reactive component.';
    /* The figure that matters when sizing anything upstream. */
    if(res.pf<0.999) msg+='<br>Everything in the supply path &mdash; transformer, conductors, switchgear &mdash; is sized for the '+fmt(res.S,2)+' kVA, not the '+fmt(res.P,2)+' kW. That is '+fmt((res.S/res.P-1)*100,0)+'% more apparent power than real power.';
    if(res.conflicts.length) msg+='<br><b>Check the inputs:</b> '+res.conflicts.join('; ')+'. The solution above was derived from the other fields.';
    msg+='<br>Power factor is a property of the load, so a transformer rating converts to kW only once the load is known. There is no default value, and 0.8 is a generator-set convention rather than a general one.';
    r.innerHTML=msg;
    r.className='est-result show'+(res.conflicts.length?' warn':'');
  });


  /* ---- Three-phase power: solve the fourth value, and show where root-3 goes
     This is NOT another one-way conversion -- amps-to-kw, kw-to-amps and
     kva-to-amps already each do one of those. The job here is solving for
     whichever value is unknown, and separating line quantities from phase
     quantities, which is the part that actually causes errors. In wye the line
     current IS the phase current and line voltage is root-3 times phase
     voltage; in delta it is the other way round. Equipment nameplates give line
     values, so the phase figures are what you need when working inside a
     winding or checking a single leg. */
  const TP_R3=Math.sqrt(3);
  const tpBtn=document.getElementById('tpBtn');
  if(tpBtn)tpBtn.addEventListener('click',function(){
    const r=document.getElementById('tpResult');
    const g=function(id){ const v=parseFloat(document.getElementById(id).value); return isNaN(v)?null:v; };
    let V=g('tpV'), I=g('tpI'), Pk=g('tpP'), pf=g('tpPf');
    const given=[V,I,Pk,pf].filter(function(v){return v!==null;}).length;
    if(given<3){ r.textContent='Enter any three of line voltage, line current, real power and power factor.'; r.className='est-result show'; return; }
    if(pf!==null&&(pf<=0||pf>1)){ r.textContent='Power factor is between 0 and 1.'; r.className='est-result show warn'; return; }
    if((V!==null&&V<=0)||(I!==null&&I<=0)||(Pk!==null&&Pk<=0)){ r.textContent='Voltage, current and power must be greater than zero.'; r.className='est-result show warn'; return; }

    let solvedFor='';
    /* P = root3 * V * I * pf, rearranged for whichever one is missing. */
    if(Pk===null){ Pk=TP_R3*V*I*pf/1000; solvedFor='real power'; }
    else if(I===null){ I=Pk*1000/(TP_R3*V*pf); solvedFor='line current'; }
    else if(V===null){ V=Pk*1000/(TP_R3*I*pf); solvedFor='line voltage'; }
    else if(pf===null){
      pf=Pk*1000/(TP_R3*V*I); solvedFor='power factor';
      if(pf>1.0001){ r.innerHTML='That gives a power factor of '+fmt(pf,3)+', which is impossible &mdash; real power cannot exceed apparent power. Check the voltage and current, or whether the power figure is actually kVA.'; r.className='est-result show warn'; return; }
      if(pf>1) pf=1;
    }
    else solvedFor='nothing (all four given)';

    const S=TP_R3*V*I/1000, Q=Math.sqrt(Math.max(S*S-Pk*Pk,0));
    let msg='<b>'+fmt(V,0)+' V line &middot; '+fmt(I,1)+' A line &middot; '+fmt(Pk,2)+' kW &middot; PF '+fmt(pf,3)+'</b>';
    if(solvedFor!=='nothing (all four given)') msg+='<br>Solved for '+solvedFor+'.';
    else msg+='<br>All four given, so nothing was solved; the figures below follow from them.';
    msg+='<br>kW = &radic;3 &times; V &times; I &times; PF = 1.732 &times; '+fmt(V,0)+' &times; '+fmt(I,1)+' &times; '+fmt(pf,3)+' = '+fmt(Pk,2)+' kW.';
    msg+='<br>Apparent power '+fmt(S,2)+' kVA, reactive '+fmt(Q,2)+' kvar.';
    msg+='<br><b>Wye:</b> phase voltage '+fmt(V/TP_R3,1)+' V, phase current '+fmt(I,1)+' A (same as line). <b>Delta:</b> phase voltage '+fmt(V,0)+' V (same as line), phase current '+fmt(I/TP_R3,1)+' A.';
    msg+='<br>This assumes a balanced load at one frequency. Nameplates give line values, and the &radic;3 belongs in exactly one place depending on the connection.';
    r.innerHTML=msg; r.className='est-result show';
  });

  /* ---- Cooling capacity: BTU/h, tons and kW --------------------------------
     A ton of refrigeration is not a weight. It is the rate of heat removal that
     would melt a short ton of ice in 24 hours, which works out to 12,000 BTU/h
     exactly by definition, or about 3.517 kW.

     The IT option exists because the data-center question is almost always
     "how much cooling for this load", and the answer is unintuitively simple:
     essentially all electrical energy into IT equipment leaves as heat, so the
     thermal load in kW equals the electrical load in kW. The arithmetic is then
     a unit conversion, not an energy balance. */
  const BTU_PER_TON=12000, KW_PER_TON=3.516852842;
  const btBtn=document.getElementById('btBtn');
  if(btBtn)btBtn.addEventListener('click',function(){
    const r=document.getElementById('btResult');
    const v=parseFloat(document.getElementById('btVal').value);
    const unit=document.getElementById('btUnit').value;
    const spareRaw=parseFloat(document.getElementById('btSpare').value);
    const spare=isNaN(spareRaw)?0:spareRaw;
    if(!(v>0)){ r.textContent='Enter a value greater than zero.'; r.className='est-result show'; return; }
    if(spare<0||spare>100){ r.textContent='Spare capacity is a percentage between 0 and 100.'; r.className='est-result show warn'; return; }

    let tons;
    if(unit==='ton') tons=v;
    else if(unit==='btu') tons=v/BTU_PER_TON;
    else tons=v/KW_PER_TON;           /* kw and it are both thermal kW */

    const f=1+spare/100, t2=tons*f;
    const tonWord = Math.abs(t2-1)<0.005 ? ' ton' : ' tons';
    let msg='<b>'+fmt(t2,2)+tonWord+' &middot; '+fmt(t2*BTU_PER_TON,0)+' BTU/h &middot; '+fmt(t2*KW_PER_TON,2)+' kW</b>';
    if(unit==='it') msg+='<br>A '+fmt(v,2)+' kW IT load produces very nearly '+fmt(v,2)+' kW of heat, because essentially all the electrical energy into the equipment leaves as heat. That is the figure converted above.';
    if(spare>0) msg+='<br>Includes '+fmt(spare,0)+'% spare on a base of '+fmt(tons,2)+' tons ('+fmt(tons*KW_PER_TON,2)+' kW).';
    msg+='<br>One ton is 12,000 BTU/h by definition &mdash; the rate that would melt a short ton of ice in 24 hours &mdash; or about 3.517 kW. It is a rate of heat removal, not a weight.';
    msg+='<br>This is sensible cooling capacity only. It excludes the power the cooling plant itself draws, any latent load, and the redundancy the facility is designed to.';
    r.innerHTML=msg; r.className='est-result show';
  });


})();

/* ---------- usage tracking: which of the 25 calculators actually get used.
   Delegated so it covers every .estimator/*Btn pair, including any added later.
   Moved here from engineering-calculators.html with the calculators, so the
   event names (calc = the estimator id) are unchanged and old reports still line up. ---------- */
(function(){
  document.addEventListener('click',function(e){
    var btn=e.target.closest('button[id$="Btn"]');
    if(!btn)return;
    var est=btn.closest('.estimator');
    if(!est||!est.id)return;
    if(window.__vfExampleRun)return; /* the worked example below is not a use of the tool */
    if(window.vfGtag)window.vfGtag('event','calculator_run',{calc:est.id});
  });
})();

/* ---------- open on a worked example, not an empty form ----------
   Every input already advertises an example in its placeholder ("e.g. 100").
   A first-time visitor saw a blank form and no result, and had to type three
   or four numbers before learning what the tool returns; the calculator sites
   that hold the top results for these queries all open with a filled-in case.
   So: copy each "e.g. N" placeholder into its empty field and run the tool
   once. Only fields whose placeholder is a plain number are touched, a field
   the browser restored a value into is left alone, and a tool is skipped
   entirely if it carries data-no-example or if the example does not produce a
   result. The run is flagged so it is not counted as a calculator_run. */
(function(){
  var RX=/^e\.g\.\s*(-?\d+(?:\.\d+)?)$/;
  document.querySelectorAll('.estimator').forEach(function(est){
    if(est.hasAttribute('data-no-example'))return;
    var btn=est.querySelector('button[id$="Btn"]');
    if(!btn)return;
    var fields=[].slice.call(est.querySelectorAll('input[type="number"]'));
    if(fields.some(function(i){return i.value!==i.defaultValue;}))return; /* the browser restored what the visitor typed: their state wins */
    var filled=[];
    fields.forEach(function(i){if(i.value!=='')return;var m=RX.exec(i.placeholder||'');if(m){i.value=m[1];filled.push(i);}});
    if(!filled.length)return;
    window.__vfExampleRun=true;
    try{btn.click();}finally{window.__vfExampleRun=false;}
    var res=est.querySelector('.est-result');
    if(!res||!res.classList.contains('show')||!res.querySelector('b')){
      /* The example did not give a clean answer for this tool: put it back as it was. */
      filled.forEach(function(i){i.value='';});
      if(res){res.className='est-result';res.textContent='';}
      return;
    }
    var note=document.createElement('p');
    note.className='est-example';
    note.textContent='Example values shown. Change any input and press '+(btn.textContent||'Calculate').trim()+'.';
    res.parentNode.insertBefore(note,res.nextSibling);
    function drop(){if(note.parentNode)note.parentNode.removeChild(note);est.removeEventListener('input',drop);est.removeEventListener('change',drop);}
    est.addEventListener('input',drop);
    est.addEventListener('change',drop);
    /* Typing over an example should replace it, not append to it. */
    filled.forEach(function(i){i.addEventListener('focus',function f(){i.select();i.removeEventListener('focus',f);});});
  });
})();
