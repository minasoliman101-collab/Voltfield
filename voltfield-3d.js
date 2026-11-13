/* VOLTFIELD -- procedural 3D shapes for hero equipment categories.
   No external model files: every shape below is built from primitive Three.js
   geometry (boxes, cylinders) at load time, styled with the site's own sector
   colors -- the same "illustrative, not vendor-accurate" spirit as the AI-
   generated part images, just genuinely three-dimensional and rotatable.

   Three.js itself loads lazily from a CDN only when a 3D view is actually
   requested -- the same pattern already used for Tesseract.js on the Part ID
   page (voltfield-identify.html). Nothing here adds weight to a normal page
   load. Orbit/drag rotation is hand-rolled (a few lines of spherical-camera
   math) rather than pulling in three.js's OrbitControls addon, so the only
   external dependency is the one three.module.js file. */
(function(){
  'use strict';

  /* Self-hosted. These were loaded from unpkg, which put the site's most
     distinctive feature behind a third-party CDN on the critical path -- it
     failed twice during one afternoon of testing, and every failure surfaces
     to the reader as "3D view needs an internet connection". The exact same
     module graph (13 files, three plus the four postprocessing passes and
     their shaders) now ships from this origin under vendor/three/, so the 3D
     views have no external dependency at all. */
  /* The minified build, generated from the unminified one next to it by
     scripts/build-three.sh and committed alongside it. Three ships r160 as
     1,295KB of commented source; the browser has to lex all of it before a
     single triangle is drawn, and this page's whole job on a phone is to not
     do that. Minifying halves it to 652KB raw and takes the brotli transfer
     from 197KB to 136KB. The readable build stays in the tree, unreferenced,
     so the minified one can be regenerated and diffed against its source. */
  const THREE_URL = '/vendor/three/build/three.module.min.js';
  let threeModPromise = null;
  function loadThree(){
    if (!threeModPromise) threeModPromise = import(THREE_URL);
    return threeModPromise;
  }

  /* ---------- optional ambient occlusion ----------
     AO is what makes a crevice read as a crevice: without it, the inside of a
     radiator bank, the gap behind a louvre and the seat of a bolt are all lit
     exactly like the open faces around them, which is the flat look that
     survives everything done so far.

     This is the ONE place the library reaches past three.module.js, and it does
     so on three conditions:
       - lazily, only when a caller actually asks for AO
       - opt-in per mount, so a grid of thumbnails never pays a full-screen
         post-process pass per viewer
       - degrading silently: if the modules do not load, the viewer keeps
         rendering exactly as before. Offline still works, just without AO.

     Pinned to the same three version as the core build -- examples/jsm is
     compiled against a specific release and will throw on a mismatch. */
  /* ---------- bevelled edges ----------
     Every box in this library met its neighbours at a perfect 90 degrees. Real
     sheet metal, castings and enclosures are all chamfered or radiused, and a
     perfectly sharp edge is the most reliable CG tell there is: it cannot catch
     the thin highlight that runs along every real edge, so the form reads as
     printed rather than fabricated.

     RoundedBoxGeometry is a 4.6KB module, and swapping it in inside box()
     bevels all 200-odd boxes from one place. Optional exactly like AO: if it
     does not load, box() falls back to BoxGeometry and everything still
     renders, just with sharp edges. */
  const GEO_URL = '/vendor/three/examples/jsm/geometries/';
  let RoundedBox = null, roundedPromise = null;
  function loadRoundedBox(){
    if (!roundedPromise) {
      roundedPromise = Promise.race([
        import(GEO_URL + 'RoundedBoxGeometry.js').then(function(m){ RoundedBox = m.RoundedBoxGeometry; }),
        /* Never let a slow or blocked CDN hold up the first frame. Losing the
           race just means sharp edges on this mount. */
        new Promise(function(r){ setTimeout(r, 2500); })
      ]).catch(function(){ RoundedBox = null; });
    }
    return roundedPromise;
  }

  const PP_URL = '/vendor/three/examples/jsm/postprocessing/';
  let ppPromise = null;
  function loadPostFX(){
    if (!ppPromise) {
      ppPromise = Promise.all([
        import(PP_URL + 'EffectComposer.js'),
        import(PP_URL + 'RenderPass.js'),
        import(PP_URL + 'SSAOPass.js'),
        import(PP_URL + 'OutputPass.js')
      ]).then(function(m){
        return { EffectComposer: m[0].EffectComposer, RenderPass: m[1].RenderPass,
                 SSAOPass: m[2].SSAOPass, OutputPass: m[3].OutputPass };
      });
    }
    return ppPromise;
  }

  /* ---------- device tier ----------
     The render settings below this point were all sized for the machine the
     library was developed on: a 2048x2048 shadow map, a 1.5x supersample, a 4x
     multisampled half-float composer and a two-pass SSAO prepass, handed to
     every visitor including a mid-range phone on a bus. The picture those
     settings buy is worth having on hardware that can draw it and worth nothing
     at all on hardware that drops to 12fps producing it.

     Read once per page, from what the platform will actually tell us. No user
     agent sniffing: the question is not which phone this is, it is how many
     cores and how much memory it has and whether the person asked us to go easy
     on their data. Where an API is missing the answer falls to the middle tier
     rather than the top one, because the devices that do not report are
     overwhelmingly the older ones.

     0 = minimal, 1 = standard, 2 = full. */
  let _tier = null;
  function tier(){
    if (_tier !== null) return _tier;
    const c = navigator.connection || {};
    const cores = navigator.hardwareConcurrency || 0;
    /* GB, quantised by the UA to 0.25/0.5/1/2/4/8. Chromium only; 0 elsewhere. */
    const mem = navigator.deviceMemory || 0;
    let coarse = false;
    try { coarse = matchMedia('(pointer: coarse)').matches; } catch (e) {}

    if (c.saveData || /(^|-)[23]g$/.test(c.effectiveType || '')) { _tier = 0; return 0; }
    if ((cores && cores <= 4) || (mem && mem <= 2)) { _tier = 0; return 0; }
    /* A touch device with reported headroom still renders on a thermally
       limited GPU, so it gets the standard tier rather than the full one: no
       SSAO, which submits the whole scene twice more per frame and is the
       single most expensive thing in here. */
    if (coarse) { _tier = 1; return 1; }
    if (cores >= 8 || mem >= 8) { _tier = 2; return 2; }
    _tier = 1; return 1;
  }

  /* ---------- shape builders: each returns a THREE.Group centered near the origin ---------- */
  function buildTransformer(THREE, color){
    const g = new THREE.Group();
    const M = mats(THREE, color);
    /* Materials chosen per part rather than per palette slot: the tank and its
       corrugations are the same painted steel, but the bushings are glazed
       porcelain (a dielectric -- giving ceramic any metalness is what made it
       look like painted plastic), the fan guards and hardware are galvanised,
       and the terminals are copper. */
    const mat = M.body, dark = M.dark;
    const metal = M.galv;
    const porc  = M.porcelain;
    const cu    = M.copper;

    const TW = 2.4, TH = 1.6, TD = 1.4;
    g.add(box(THREE, mat, TW, TH, TD, 0, 0.8, 0));                       // tank

    /* Corrugated tank wall -- distribution transformers get their cooling
       surface from the pressed corrugations, not bolt-on radiators. */
    for (let i = 0; i < 11; i++) {
      const x = -TW/2 + 0.16 + i * ((TW - 0.32) / 10);
      g.add(box(THREE, dark, 0.05, TH - 0.22, 0.03, x, 0.8, TD/2 + 0.005));
      g.add(box(THREE, dark, 0.05, TH - 0.22, 0.03, x, 0.8, -TD/2 - 0.005));
    }

    /* Bolt-on radiator banks on the short sides, with headers. */
    for (const s of [-1, 1]) {
      radiator(THREE, g, dark, {x: s * (TW/2 + 0.22), y: 0.85, z: 0, h: 1.15, w: 0.40, d: 0.07, n: 6, pitch: 0.13, axis:'z'});
    }

    /* Cooling fans under the radiators (the ONAF stage). */
    for (const s of [-1, 1]) fan(THREE, g, metal, dark, {x: s * (TW/2 + 0.22), y: 0.16, z: 0, r: 0.24, blades: 5});

    /* Conservator on saddles, with the oil-level gauge on its end. */
    const cons = cyl(THREE, mat, 0.26, 0.26, 1.5, 18, 0, 1.86, 0.5);
    cons.rotation.z = Math.PI/2; g.add(cons);
    for (const s of [-1, 1]) g.add(box(THREE, dark, 0.09, 0.22, 0.20, s*0.55, 1.68, 0.5));
    const gauge = cyl(THREE, M.gold, 0.10, 0.10, 0.04, 12, 0.76, 1.86, 0.5);
    gauge.rotation.z = Math.PI/2; g.add(gauge);

    /* HV bushings: porcelain sheds stepping down in diameter, on a turret. */
    for (const x of [-0.72, 0, 0.72]) {
      g.add(cyl(THREE, dark, 0.16, 0.18, 0.16, 12, x, 1.66, -0.34));      // turret
      for (let i = 0; i < 4; i++) {
        const r = 0.145 - i * 0.018;
        g.add(cyl(THREE, porc, r, r + 0.012, 0.10, 12, x, 1.80 + i * 0.16, -0.34));
      }
      g.add(cyl(THREE, cu, 0.035, 0.035, 0.14, 8, x, 2.44, -0.34));       // stud
    }

    /* LV bushings -- fewer sheds, larger conductor. */
    for (const x of [-0.42, 0, 0.42]) {
      for (let i = 0; i < 2; i++) {
        g.add(cyl(THREE, porc, 0.10, 0.115, 0.09, 10, x, 1.74 + i * 0.13, 0.34));
      }
      g.add(cyl(THREE, cu, 0.05, 0.05, 0.10, 8, x, 1.96, 0.34));
    }

    /* De-energised tap changer handle on the tank face. */
    g.add(cyl(THREE, dark, 0.13, 0.13, 0.07, 12, -0.85, 1.18, TD/2 + 0.03));
    g.add(box(THREE, metal, 0.05, 0.20, 0.04, -0.85, 1.26, TD/2 + 0.07));

    /* Nameplate, pressure-relief device, and ground pads. */
    /* The rating plate carries the numbers the equipment is actually selected
       on. %Z is on it deliberately: it sets the available fault current
       downstream, which is the point the transformer guides keep making. */
    decal(THREE, g, {key:'np-xfmr', w:0.74, h:0.48, x:0.72, y:1.14, z:TD/2 + 0.03,
      cw:280, ch:180, metal:0.35, rough:0.42,
      draw: npDraw('LIQUID-FILLED TRANSFORMER', [
        ['kVA',   '2500'],
        ['HV',    '13.8 kV'],
        ['LV',    '480Y/277'],
        ['%Z',    '5.75'],
        ['PH/HZ', '3 / 60']
      ])});
    g.add(cyl(THREE, dark, 0.09, 0.09, 0.08, 10, 0.30, 1.64, 0));         // PRD on the cover
    for (const s of [-1, 1]) g.add(box(THREE, cu, 0.13, 0.09, 0.03, s*0.95, 0.22, TD/2 + 0.015));

    /* Lifting lugs at the cover corners. */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      lug(THREE, g, metal, sx * (TW/2 - 0.16), TH + 0.06, sz * (TD/2 - 0.14));
    }

    /* ---- the fittings, which are most of what is on a real tank ----
       A liquid-filled transformer is a tank with about two dozen things bolted
       or plumbed to it, and the model had the tank, the radiators and the
       bushings. The rest is gauges, valves, a breather and the pipework between
       them: small parts and short runs, which the batching makes free. */

    /* Conservator pipework, with the Buchholz gas relay in the run. Oil goes
       from the tank cover up to the conservator through this pipe, and the
       relay sits in it precisely because that is where gas collects. */
    tubeRun(THREE, g, dark, [[0.30,1.62,0.50],[0.30,1.80,0.50]], 0.055, metal);
    g.add(box(THREE, dark, 0.20, 0.16, 0.18, 0.30, 1.72, 0.50));
    g.add(cyl(THREE, M.gold, 0.045, 0.045, 0.03, 10, 0.30, 1.72, 0.60).rotateX(Math.PI/2));

    /* Silica-gel breather: a pipe down off the conservator into a clear
       canister with its oil seal cup. The one fitting a maintenance engineer
       looks at first, because its colour tells you whether it is saturated. */
    tubeRun(THREE, g, dark, [[-0.66,1.86,0.50],[-0.66,1.44,0.56],[-0.80,1.30,0.56]], 0.035);
    g.add(cyl(THREE, M.porcelain, 0.075, 0.075, 0.26, 14, -0.80, 1.14, 0.56));
    g.add(cyl(THREE, dark, 0.090, 0.090, 0.05, 14, -0.80, 0.99, 0.56));
    g.add(cyl(THREE, dark, 0.090, 0.090, 0.04, 14, -0.80, 1.29, 0.56));

    /* Dial thermometer and winding-temperature indicator on the tank face. */
    for (let i = 0; i < 2; i++) {
      const gx = -0.30 + i * 0.30;
      g.add(cyl(THREE, dark, 0.105, 0.105, 0.05, 16, gx, 0.86, TD/2 + 0.02).rotateX(Math.PI/2));
      g.add(cyl(THREE, M.porcelain, 0.085, 0.085, 0.02, 16, gx, 0.86, TD/2 + 0.05).rotateX(Math.PI/2));
      g.add(box(THREE, M.gold, 0.012, 0.062, 0.012, gx + 0.018, 0.885, TD/2 + 0.062));
      /* capillary from the bulb in the tank wall up to the dial */
      tubeRun(THREE, g, metal, [[gx,0.91,TD/2+0.02],[gx,1.26,TD/2+0.02]], 0.012);
    }

    /* Valves at the tank bottom: the main drain with its sampling cock, and a
       filter-press valve on the opposite side. */
    for (const vx of [-0.62, 0.62]) {
      g.add(cyl(THREE, dark, 0.055, 0.055, 0.12, 12, vx, 0.22, TD/2 + 0.06).rotateX(Math.PI/2));
      const hw = cyl(THREE, metal, 0.085, 0.085, 0.022, 14, vx, 0.22, TD/2 + 0.14);
      hw.rotation.x = Math.PI/2; g.add(hw);
      g.add(box(THREE, metal, 0.016, 0.15, 0.016, vx, 0.22, TD/2 + 0.14));
    }

    /* Bolted cover flange. The tank lid on these is gasketed and bolted all the
       way round, and a lid that simply meets the tank is one of the plainer
       tells that a model was drawn rather than fabricated. */
    g.add(box(THREE, dark, TW + 0.06, 0.06, TD + 0.06, 0, TH + 0.02, 0));
    for (let i = 0; i < 9; i++) {
      const bx = -TW/2 + 0.12 + i * ((TW - 0.24) / 8);
      for (const bz of [TD/2 + 0.025, -TD/2 - 0.025]) {
        g.add(cyl(THREE, metal, 0.026, 0.026, 0.035, 6, bx, TH + 0.06, bz));
      }
    }

    /* Earth conductor from the ground pad down to grade, which is what the pad
       is for and what the 250-series guides keep pointing at. */
    tubeRun(THREE, g, cu, [[-0.95,0.20,TD/2+0.03],[-1.05,-0.02,TD/2+0.10],[-1.05,-0.30,TD/2+0.10]], 0.022);

    /* Pressure-relief discharge pipe, directing oil away from the cover. */
    tubeRun(THREE, g, dark, [[0.30,1.68,0],[0.30,1.70,-0.30],[0.30,1.40,-0.46]], 0.038);

    /* Guard rings over the cooling fans -- a bare fan under a radiator bank is
       something no utility would energise. */
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      const rr = 0.09 + k * 0.075;
      const ring = cyl(THREE, metal, rr, rr, 0.010, 20, sx * (TW/2 + 0.22), 0.16, 0);
      g.add(ring);
    }

    /* Skid base with channel ends. */
    g.add(box(THREE, dark, TW + 0.24, 0.16, TD + 0.24, 0, -0.08, 0));
    for (const s of [-1, 1]) g.add(box(THREE, metal, 0.10, 0.20, TD + 0.24, s*(TW/2 + 0.06), -0.06, 0));

    /* Named points for the viewer's callouts (opts.callouts). */
    callout(THREE, g, 'HV bushings', 0, 2.44, -0.34);
    callout(THREE, g, 'Conservator tank', -0.55, 2.12, 0.5);
    callout(THREE, g, 'Cooling radiators', 1.66, 1, 0);
    callout(THREE, g, 'Rating plate', 0.72, 1.14, 0.74);
    return g;
  }

  function buildSwitchgear(THREE, color){
    const g = new THREE.Group();
    const M = mats(THREE, color);
    const mat = M.body, dark = M.dark, signal = M.gold;
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const glass = new THREE.MeshStandardMaterial({color:0x0E1826, metalness:.5, roughness:.25});

    const n = 3, w = 0.86, h = 1.9, d = 1.0, fz = d/2;
    for (let i = 0; i < n; i++) {
      const x = (i - (n-1)/2) * w;
      g.add(box(THREE, mat, w * 0.92, h, d, x, h/2, 0));                  // cubicle

      /* Upper: instrument compartment -- meter window, relay, indicator lamps. */
      g.add(box(THREE, dark, w*0.72, 0.46, 0.03, x, h*0.80, fz + 0.01));
      g.add(box(THREE, glass, w*0.40, 0.24, 0.015, x - 0.06, h*0.83, fz + 0.03));
      g.add(box(THREE, metal, 0.13, 0.13, 0.02, x + 0.22, h*0.83, fz + 0.03));
      /* Live metering readout behind the instrument window, and the cubicle
         designation below it -- a switchgear lineup is identified by these. */
      decal(THREE, g, {key:'sg-meter-'+i, w:w*0.38, h:0.22, x:x - 0.06, y:h*0.83, z:fz + 0.042,
        cw:200, ch:120, rough:0.3, metal:0.0,
        draw: (function(idx){ return function(xc,W,H){
          xc.fillStyle='#07120C'; xc.fillRect(0,0,W,H);
          xc.fillStyle='#4BE08A'; xc.textBaseline='middle';
          xc.font='bold '+Math.round(H*0.30)+'px "IBM Plex Mono",monospace';
          xc.fillText(['480','477','479'][idx]+' V', W*0.08, H*0.30);
          xc.font='bold '+Math.round(H*0.24)+'px "IBM Plex Mono",monospace';
          xc.fillText(['612','588','604'][idx]+' A', W*0.08, H*0.68);
          xc.fillStyle='#1E6B3A'; xc.fillRect(W*0.70,H*0.18,W*0.22,H*0.16);
        };})(i)});
      decal(THREE, g, {key:'sg-id-'+i, w:w*0.46, h:0.10, x:x, y:h*0.60, z:fz + 0.02,
        cw:220, ch:56, rough:0.6, metal:0.1,
        draw: (function(idx){ return function(xc,W,H){
          xc.fillStyle='#12161B'; xc.fillRect(0,0,W,H);
          xc.fillStyle='#E8ECEF'; xc.textBaseline='middle'; xc.textAlign='center';
          xc.font='bold '+Math.round(H*0.52)+'px "Helvetica Neue",Arial,sans-serif';
          xc.fillText(['MAIN','TIE','FEEDER 1'][idx], W/2, H*0.54);
        };})(i)});
      for (let k = 0; k < 3; k++) {
        const lamp = cyl(THREE, k === 0 ? M.lit : (k === 1 ? signal : dark), 0.028, 0.028, 0.02, 8,
          x - 0.20 + k * 0.09, h*0.68, fz + 0.02);
        lamp.rotation.x = Math.PI/2; g.add(lamp);
        if (k === 1) blink(lamp, 2.2, i * 0.7, 0.05, 0.9);
      }

      /* Middle: breaker compartment door with racking port and handle. */
      door(THREE, g, mat, dark, metal, {x: x, y: h*0.45, z: fz + 0.015, w: w*0.80, h: 0.72});
      const port = cyl(THREE, dark, 0.06, 0.06, 0.03, 10, x, h*0.45, fz + 0.05);
      port.rotation.x = Math.PI/2; g.add(port);

      /* Lower: cable compartment, louvred for ventilation. */
      louvers(THREE, g, dark, {n: 5, x: x, y0: h*0.10, y1: h*0.24, z: fz + 0.015, w: w*0.62, h: 0.035});

      /* Arc-vent flap on the roof of each cubicle. */
      g.add(box(THREE, metal, w*0.62, 0.05, 0.34, x, h + 0.03, -0.18));

      /* Arc-flash label on the middle cubicle door. Required in practice, and
         it is the single most recognisable thing on real switchgear. */
      if (i === 1) {
        decal(THREE, g, {key:'arcflash', w:w*0.68, h:0.34, x:x, y:h*0.34, z:fz + 0.055,
          cw:340, ch:200, rough:0.6, metal:0.05, draw: arcFlashDraw});
      }
    }

    /* Continuous top bus enclosure spanning the lineup, with joint covers. */
    g.add(box(THREE, dark, w*n + 0.06, 0.16, d + 0.06, 0, h + 0.12, 0));
    for (let i = 0; i < n - 1; i++) {
      g.add(box(THREE, metal, 0.07, 0.20, d + 0.10, (i - (n-2)/2) * w, h + 0.12, 0));
    }

    /* ---- lineup hardware ----
       The front of each cubicle was well covered and everything that makes a
       lineup a lineup -- the seams between sections, how it is lifted, how
       cable gets into it and how pressure gets out of it -- was not. */

    /* Vertical joint strips where sections bolt together. */
    for (let i = 0; i < n - 1; i++) {
      g.add(box(THREE, dark, 0.05, h - 0.10, 0.03, (i - (n-2)/2) * w, h/2, fz + 0.005));
    }

    /* Pressure-relief chimneys over the arc-vent flaps. An arc vent that opens
       into the room rather than into a duct is the thing switchgear standards
       spend the most words on. */
    for (let i = 0; i < n; i++) {
      const x = (i - (n-1)/2) * w;
      g.add(box(THREE, dark, w*0.52, 0.26, 0.28, x, h + 0.33, -0.20));
      louvers(THREE, g, metal, {n: 3, x: x, y0: h + 0.26, y1: h + 0.40, z: -0.335, w: w*0.44, h: 0.035});
    }

    /* Control-wiring trough running the length of the roof, which is how the
       sections are actually tied together. */
    g.add(box(THREE, metal, w*n - 0.20, 0.11, 0.16, 0, h + 0.27, 0.30));
    for (let i = 0; i < n; i++) {
      const x = (i - (n-1)/2) * w;
      tubeRun(THREE, g, dark, [[x + 0.18, h + 0.22, 0.30],[x + 0.18, h + 0.06, 0.34]], 0.030);
    }

    /* Lifting angles at the roof corners. */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      lug(THREE, g, metal, sx * (w*n/2 - 0.14), h + 0.22, sz * (d/2 - 0.12));
    }

    /* Conduit stubs rising into the cable compartments through the floor,
       because the lineup has to be fed from somewhere. */
    for (let i = 0; i < n; i++) {
      const x = (i - (n-1)/2) * w;
      for (const cz of [-0.22, 0.10]) {
        g.add(cyl(THREE, metal, 0.075, 0.075, 0.30, 12, x - 0.18, 0.00, cz));
        g.add(cyl(THREE, dark, 0.090, 0.090, 0.05, 12, x - 0.18, 0.16, cz));
      }
    }

    /* Ground bus along the base, with a connection stud at each section. */
    g.add(box(THREE, M.copper, w*n - 0.14, 0.055, 0.016, 0, 0.21, fz + 0.015));
    for (let i = 0; i < n; i++) {
      const x = (i - (n-1)/2) * w;
      g.add(cyl(THREE, M.brass, 0.026, 0.026, 0.05, 8, x, 0.21, fz + 0.035).rotateX(Math.PI/2));
    }

    /* Hinges and handles on the lower cable-compartment covers, which were
       bolted-looking blanks with louvres punched in them. */
    for (let i = 0; i < n; i++) {
      const x = (i - (n-1)/2) * w;
      for (const sy of [h*0.07, h*0.27]) {
        g.add(cyl(THREE, metal, 0.040, 0.040, 0.12, 8, x - w*0.38, sy, fz + 0.025));
      }
      g.add(box(THREE, metal, 0.05, 0.18, 0.045, x + w*0.34, h*0.17, fz + 0.035));
    }

    /* Lineup rating plate on the end panel: the short-circuit rating is the
       number the whole interrupting-rating guide is about. */
    decal(THREE, g, {key:'sg-np', w:0.46, h:0.30, x: w*n/2 + 0.035, y: h*0.62, z: 0.10,
      ry: Math.PI/2, cw:280, ch:180, metal:0.35, rough:0.42,
      draw: npDraw('LOW-VOLTAGE SWITCHGEAR', [
        ['BUS',   '3000 A'],
        ['VOLTS', '480Y/277'],
        ['SC',    '100 kA'],
        ['STD',   'UL 1558']
      ])});

    /* End panels, base channel and floor bolts. */
    for (const s of [-1, 1]) g.add(box(THREE, dark, 0.05, h, d, s * (w*n/2), h/2, 0));
    g.add(box(THREE, dark, w*n + 0.10, 0.14, d + 0.10, 0, 0.07, 0));
    for (const s of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(THREE, metal, 0.04, 0.04, 0.05, 6, s * (w*n/2 - 0.16), 0.16, sz * (d/2 - 0.12)));
    }

    /* Named points for the viewer's callouts (opts.callouts). */
    callout(THREE, g, 'Power meter', -0.92, 1.58, 0.55);
    callout(THREE, g, 'Breaker compartment', 0, 0.86, 0.56);
    callout(THREE, g, 'Status lamps', 0.75, 1.29, 0.53);
    callout(THREE, g, 'Rating plate', 1.33, 1.18, 0.1);
    return g;
  }

  function buildBatteryRack(THREE, color){
    const g = new THREE.Group();
    const M = mats(THREE, color);
    const mat = M.body, mod = M.deep, dark = M.dark;
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const cu    = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});

    const W = 1.9, H = 2.2, D = 1.1;
    /* Open frame rather than a solid cabinet: uprights, top and bottom rails. */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(box(THREE, mat, 0.10, H, 0.10, sx*(W/2 - 0.05), H/2, sz*(D/2 - 0.05)));
    }
    for (const y of [0.06, H - 0.06]) for (const sz of [-1, 1]) {
      g.add(box(THREE, mat, W, 0.09, 0.10, 0, y, sz*(D/2 - 0.05)));
    }
    g.add(box(THREE, dark, W, H - 0.2, 0.05, 0, H/2, -D/2 + 0.04));       // back panel

    /* Battery modules on shelves, each with a vent slot and terminal pair. */
    const rows = 5, mh = (H - 0.42) / rows;
    for (let r = 0; r < rows; r++) {
      const y = 0.26 + r * mh + mh/2;
      g.add(box(THREE, metal, W - 0.22, 0.035, D - 0.20, 0, y - mh/2 + 0.02, 0));  // shelf
      g.add(box(THREE, mod, W - 0.30, mh * 0.72, D - 0.26, 0, y, 0.01));           // module
      g.add(box(THREE, dark, W - 0.42, mh * 0.16, 0.02, 0, y + mh*0.20, D/2 - 0.12));
      for (const sx of [-1, 1]) {                                                  // terminals
        g.add(cyl(THREE, cu, 0.045, 0.045, 0.06, 8, sx * (W/2 - 0.30), y, D/2 - 0.14));
      }
      const led = cyl(THREE, r === rows-1 ? M.gold : M.lit, 0.022, 0.022, 0.02, 8, W/2 - 0.20, y, D/2 - 0.14);
      led.rotation.x = Math.PI/2; g.add(led);
    }

    /* Inter-module cabling down one side. */
    for (let r = 0; r < rows - 1; r++) {
      const y0 = 0.26 + r * mh + mh/2, y1 = y0 + mh;
      const c = cyl(THREE, cu, 0.03, 0.03, mh, 6, -(W/2 - 0.30), (y0 + y1)/2, D/2 - 0.14);
      g.add(c);
    }

    /* BMS / controller box at the top, and a disconnect handle. */
    g.add(box(THREE, dark, W - 0.30, 0.22, D - 0.30, 0, H - 0.20, 0));
    g.add(box(THREE, M.lit, 0.26, 0.08, 0.02, -0.30, H - 0.20, D/2 - 0.16));
    g.add(cyl(THREE, metal, 0.09, 0.09, 0.05, 10, 0.42, H - 0.20, D/2 - 0.15));
    g.add(box(THREE, M.gold, 0.05, 0.16, 0.04, 0.42, H - 0.14, D/2 - 0.12));

    /* Base plinth with anchor feet. */
    g.add(box(THREE, mod, W + 0.14, 0.13, D + 0.14, 0, 0.065, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(THREE, metal, 0.04, 0.04, 0.05, 6, sx*(W/2 - 0.10), 0.15, sz*(D/2 - 0.10)));
    }
    return g;
  }

  function buildGenset(THREE, color){
    const g = new THREE.Group();
    const M = mats(THREE, color);
    const mat = M.body, dark = M.dark;
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const blk   = new THREE.MeshStandardMaterial({color:0x24272C, metalness:.05, roughness:.55});

    /* Fuel-tank base skid -- on a packaged set the tank IS the base. */
    g.add(box(THREE, dark, 3.2, 0.34, 1.25, 0, 0.17, 0));
    for (const s of [-1, 1]) g.add(box(THREE, metal, 0.10, 0.40, 1.30, s*1.55, 0.20, 0));
    g.add(cyl(THREE, metal, 0.10, 0.10, 0.10, 10, 1.16, 0.38, 0.42));      // fill point

    /* Engine block with cylinder head and rocker cover. Block stays dark; the
       rocker cover takes the body colour so the two read as separate parts. */
    g.add(box(THREE, blk, 1.35, 0.62, 0.78, -0.55, 0.70, 0));
    for (let i = 0; i < 4; i++) {                                          // block ribs
      g.add(box(THREE, dark, 0.04, 0.54, 0.82, -1.05 + i*0.33, 0.70, 0));
    }
    g.add(box(THREE, dark, 1.20, 0.24, 0.62, -0.55, 1.10, 0));             // head
    g.add(box(THREE, mat, 1.05, 0.16, 0.46, -0.55, 1.30, 0));              // rocker cover
    for (let i = 0; i < 5; i++) {                                          // cover bolts
      g.add(cyl(THREE, metal, 0.028, 0.028, 0.04, 6, -0.95 + i*0.20, 1.39, 0));
    }
    /* Exhaust manifold: a run of short stubs into a collector. */
    for (let i = 0; i < 4; i++) {
      g.add(cyl(THREE, blk, 0.075, 0.075, 0.22, 8, -1.02 + i*0.31, 1.00, -0.44));
    }
    const coll = cyl(THREE, blk, 0.10, 0.10, 1.30, 10, -0.55, 1.00, -0.56);
    coll.rotation.z = Math.PI/2; g.add(coll);

    /* Turbo and air filter housing. */
    g.add(cyl(THREE, metal, 0.17, 0.17, 0.22, 12, 0.18, 1.00, -0.44));
    const filt = cyl(THREE, mat, 0.20, 0.20, 0.42, 14, 0.18, 1.06, 0.34);
    filt.rotation.z = Math.PI/2; g.add(filt);

    /* Alternator: cylindrical housing with cooling slots and terminal box. */
    const alt = cyl(THREE, mat, 0.44, 0.44, 0.86, 20, 0.62, 0.74, 0);
    alt.rotation.z = Math.PI/2; g.add(alt);
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2;
      g.add(box(THREE, dark, 0.60, 0.055, 0.05, 0.62, 0.74 + Math.sin(a)*0.40, Math.cos(a)*0.40));
    }
    g.add(box(THREE, dark, 0.40, 0.30, 0.34, 0.62, 1.24, 0));

    /* Radiator: body-coloured frame around a visibly finned core, so it reads
       as a heat exchanger rather than a flat slab. */
    g.add(box(THREE, mat, 0.14, 1.20, 1.16, 1.36, 0.88, 0));               // frame
    g.add(box(THREE, blk, 0.06, 1.00, 0.98, 1.30, 0.88, 0));               // core recess
    for (let i = 0; i < 13; i++) {
      g.add(box(THREE, metal, 0.02, 0.94, 0.035, 1.28, 0.88, -0.46 + i*0.077));
    }
    fan(THREE, g, metal, blk, {x: 1.12, y: 0.88, z: 0, r: 0.40, blades: 6, axis: 'x', rate: 5});
    /* Fan guard bars across the face. */
    for (let i = 0; i < 5; i++) {
      g.add(box(THREE, metal, 0.02, 0.03, 0.92, 1.06, 0.88 - 0.32 + i*0.16, 0));
    }

    /* Critical-grade silencer, carried on stanchions off the skid rather than
       floating above the engine -- the first version had it unsupported in
       mid-air, which read as a modelling error rather than a machine. */
    const SILY = 1.68;
    for (const sx of [-1.05, -0.05]) {
      g.add(box(THREE, metal, 0.07, SILY - 1.20, 0.07, sx, (SILY + 1.20)/2 - 0.10, -0.30));
      g.add(box(THREE, metal, 0.22, 0.06, 0.22, sx, SILY - 0.20, -0.30));   // saddle
    }
    const sil = cyl(THREE, metal, 0.19, 0.19, 1.05, 14, -0.55, SILY, -0.30);
    sil.rotation.z = Math.PI/2; g.add(sil);
    for (const sx of [-1.05, -0.05]) {                                      // clamp bands
      const bandm = cyl(THREE, dark, 0.205, 0.205, 0.06, 14, sx, SILY, -0.30);
      bandm.rotation.z = Math.PI/2; g.add(bandm);
    }
    /* Flex connector from the manifold collector up into the silencer. */
    const flex = cyl(THREE, dark, 0.10, 0.10, 0.52, 10, -0.05, 1.34, -0.44);
    flex.rotation.x = -0.5; g.add(flex);
    g.add(cyl(THREE, metal, 0.12, 0.12, 0.50, 10, -1.08, 1.94, -0.30));     // stack
    g.add(cyl(THREE, dark, 0.155, 0.12, 0.07, 10, -1.08, 2.22, -0.30));     // rain cap

    /* Control panel on the skid, and battery box. */
    g.add(box(THREE, dark, 0.34, 0.52, 0.22, 1.02, 0.66, 0.56));
    g.add(box(THREE, M.lit, 0.22, 0.16, 0.02, 1.02, 0.80, 0.68));
    g.add(box(THREE, blk, 0.42, 0.24, 0.30, -1.20, 0.48, 0.42));

    /* Lifting lugs on the skid corners. */
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lug(THREE, g, metal, sx*1.42, 0.36, sz*0.50);

    /* ---- the parts that make it read as a machine rather than an assembly ----
       Everything above was a correct set of major components sitting near each
       other. What a packaged set actually looks like is those components
       plumbed, belted, bolted and filtered together, and none of that was here
       because each piece of it is a diagonal run or a small casting that was
       not worth hand-solving a rotation for. tube() makes the runs cheap and
       the static batching makes the small parts free. */

    /* Sump flange below the block, standing proud of it the way a cast oil pan
       does rather than continuing the block's own face. */
    g.add(box(THREE, blk, 1.12, 0.11, 0.84, -0.55, 0.45, 0));
    /* Spin-on oil filters off the side of the block. */
    for (let i = 0; i < 2; i++) {
      const f = cyl(THREE, mat, 0.075, 0.075, 0.20, 12, -0.95 + i*0.22, 0.66, 0.48);
      f.rotation.x = Math.PI/2; g.add(f);
    }
    /* Starter motor, low on the flywheel end where it meets the alternator. */
    const st = cyl(THREE, metal, 0.095, 0.095, 0.30, 12, 0.00, 0.52, -0.42);
    st.rotation.z = Math.PI/2; g.add(st);
    g.add(cyl(THREE, blk, 0.055, 0.055, 0.10, 10, 0.16, 0.52, -0.42));

    /* Front crank pulley and its belt guard. The drive end of an engine is
       never a flat face, and this is the end the camera passes on every
       rotation. */
    const pul = cyl(THREE, metal, 0.17, 0.17, 0.09, 16, -1.27, 0.72, 0);
    pul.rotation.z = Math.PI/2; g.add(pul);
    g.add(box(THREE, dark, 0.04, 0.70, 0.56, -1.31, 0.74, 0));
    for (let i = 0; i < 4; i++) g.add(box(THREE, blk, 0.015, 0.05, 0.50, -1.34, 0.50 + i*0.16, 0));

    /* Upper radiator hose, engine thermostat housing to the top tank. Routed
       over the alternator and clear of the control panel. */
    tubeRun(THREE, g, blk, [[0.02,1.16,0.28],[0.62,1.34,0.44],[1.22,1.18,0.32]], 0.072, dark);
    /* Lower hose, water pump to the bottom tank, outboard of the alternator. */
    tubeRun(THREE, g, blk, [[-0.10,0.56,0.52],[0.70,0.50,0.60],[1.22,0.44,0.44]], 0.062, dark);

    /* Radiator top and bottom tanks with a filler cap, so the core is plumbed
       into something instead of ending in air. */
    for (const ty of [1.42, 0.34]) g.add(box(THREE, dark, 0.20, 0.13, 1.10, 1.33, ty, 0));
    g.add(cyl(THREE, metal, 0.075, 0.075, 0.07, 12, 1.33, 1.52, 0.30));

    /* Fuel: tank gauge, vent and a drain valve under the skid. */
    g.add(cyl(THREE, M.gold, 0.055, 0.055, 0.02, 12, 1.16, 0.20, 0.63));
    g.add(cyl(THREE, metal, 0.030, 0.030, 0.12, 8, 0.86, 0.40, 0.42));
    g.add(cyl(THREE, M.copper, 0.035, 0.035, 0.07, 8, -1.50, 0.12, 0.30));
    /* Fuel line, tank to the engine's lift pump. */
    tubeRun(THREE, g, M.copper, [[-1.45,0.32,0.38],[-1.30,0.46,0.44],[-1.00,0.48,0.44]], 0.022);

    /* Dipstick and its tube. */
    tube(THREE, g, metal, [-0.20,0.52,0.44], [-0.20,0.98,0.50], 0.016, 8);
    g.add(cyl(THREE, M.gold, 0.030, 0.030, 0.05, 8, -0.20, 1.01, 0.50));

    /* Cable glands under the alternator terminal box, and the earth stud that
       every one of these has to have. */
    for (let i = 0; i < 3; i++) {
      g.add(cyl(THREE, M.brass, 0.040, 0.040, 0.07, 10, 0.48 + i*0.14, 1.07, 0.09));
    }
    g.add(cyl(THREE, M.copper, 0.028, 0.028, 0.09, 8, 1.30, 0.42, 0.55));
    tubeRun(THREE, g, M.copper, [[1.30,0.46,0.55],[1.44,0.30,0.58],[1.44,0.10,0.58]], 0.018);

    /* Rating plate on the alternator terminal box: the numbers are the reason
       the machine is on this page at all. */
    decal(THREE, g, {
      key:'genset-np', x:0.62, y:1.26, z:0.18, w:0.30, h:0.19, cw:300, ch:190,
      draw: npDraw('GENERATING SET', [
        ['STANDBY', '500 kW'], ['PRIME', '455 kW'],
        ['VOLTS', '480Y/277'], ['PF', '0.8'], ['RPM', '1800']
      ])
    });

    /* Named points for the viewer's callouts (opts.callouts). */
    callout(THREE, g, 'Diesel engine', -0.55, 1.38, 0);
    callout(THREE, g, 'Alternator', 0.62, 0.74, 0.46);
    callout(THREE, g, 'Radiator and fan', 1.40, 1.50, 0);
    callout(THREE, g, 'Controller', 1.02, 0.8, 0.7);
    return g;
  }

  function buildGeneric(THREE, color){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color, metalness:.25, roughness:.6});
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.7,1.7,1.7), mat);
    box.position.y = 0.85; g.add(box);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.9,0.12,1.9), new THREE.MeshStandardMaterial({color:0x22334C}));
    base.position.y = -0.06; g.add(base);
    return g;
  }

  /* ---------- shared material helpers ---------- */
  /* ---------- surface micro-detail ----------
     Every material here was a flat colour with one constant roughness value.
     That is the single biggest thing making the models read as CG rather than
     as equipment: a real painted or machined surface is never optically
     uniform, so its specular highlight breaks up across the face instead of
     sitting there as one clean sheet.

     A single tiling noise canvas drives both a roughnessMap and a very shallow
     bumpMap. It is deliberately near-WHITE: roughnessMap MULTIPLIES the
     material's roughness, so a mid-grey map would halve it and turn painted
     steel into a mirror. This only ever roughens slightly, never polishes.

     The canvas is built once at module scope; the CanvasTexture wrapping it is
     per-viewer, because textures upload per WebGL context. */
  /* Set from renderer.capabilities once a context exists; 4 until then, which is
     the value every texture used before. Module-level so the geometry helpers
     can reach it without a renderer reference. */
  let MAX_ANISO = 4;
  /* Supersampling factor for label/nameplate canvases. The draw callbacks size
     everything from the width and height they are handed, so raising this
     sharpens text without touching any of them. Kept at 2: these canvases are
     cached per key and shared across every live context, so the memory cost is
     paid once, but going higher stops being visible before it stops costing. */
  const LABEL_SCALE = 2;
  let _noiseCanvas = null;
  function noiseCanvas(){
    if (_noiseCanvas) return _noiseCanvas;
    const N = 256;
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const x = cv.getContext('2d');
    const img = x.createImageData(N, N);
    /* Value noise at two frequencies, biased high. Seeded from a plain LCG so
       every viewer and every build gets the identical surface. */
    let seed = 0x2F6E2B1;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF);
    const coarse = new Float32Array(64 * 64);
    for (let i = 0; i < coarse.length; i++) coarse[i] = rnd();
    for (let p = 0, y = 0; y < N; y++) {
      for (let xx = 0; xx < N; xx++, p += 4) {
        const c = coarse[((y >> 2) * 64 + (xx >> 2)) % coarse.length];
        const v = 214 + c * 26 + rnd() * 15;      // ~214..255, never dark
        img.data[p] = img.data[p+1] = img.data[p+2] = v;
        img.data[p+3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    _noiseCanvas = cv;
    return cv;
  }
  /* Cached per repeat bucket. Every material used to get two freshly allocated
     CanvasTextures -- one for roughness, one for bump -- which for the ~90
     materials a model builds meant ~180 GPU uploads of one 256x256 image. The
     same texture object can drive both slots (identical UVs, identical repeat),
     so this hands back one shared instance per bucket.

     The cache is handed in rather than held at module scope on purpose: a
     texture belongs to the WebGL context that uploaded it, and a page can mount
     several viewers. One cache per addSurfaceDetail call is one cache per
     context, which is the only sharing that is safe. */
  function surfaceTex(THREE, repeat, cache){
    const key = String(repeat);
    const hit = cache.get(key);
    if (hit) return hit;
    const t = new THREE.CanvasTexture(noiseCanvas());
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    /* This is the tiling roughness/bump map, so it is seen at grazing angles on
       every large panel. Without anisotropic filtering it smears into mush
       toward the horizon of a surface, which is exactly where a real machined
       or painted finish still shows texture. */
    t.anisotropy = MAX_ANISO;
    cache.set(key, t);
    return t;
  }

  /* Applied to every material in a built model, not just the five from mats():
     the builders create roughly 90 of their own -- bare steel, copper, porcelain,
     engine block -- and those are exactly the surfaces where a uniform highlight
     looks most synthetic. Doing it in one pass at mount time covers all of them
     without touching 90 call sites.

     Left alone deliberately:
       - emissive materials (lamps, meter faces) -- roughening them reads as dirt
       - anything with a `map` already (the canvas nameplates and placards)
       - transparent surfaces (glass doors, soil, the POD shell) */
  /* Repeat buckets, in tiles per world unit of the surface they land on.
     Bucketed rather than continuous so the texture cache stays small -- a
     handful of shared textures instead of one per material. */
  const TILE_BUCKETS = [0.25, 0.5, 1, 2, 3, 4, 6, 8, 12, 16];
  const TILES_PER_UNIT = 3;
  function tileRepeat(size){
    const want = size * TILES_PER_UNIT;
    let best = TILE_BUCKETS[0];
    for (const b of TILE_BUCKETS) if (Math.abs(b - want) < Math.abs(best - want)) best = b;
    return best;
  }

  function addSurfaceDetail(THREE, root){
    /* World matrices drive the size measurement below, and a freshly built
       model has not been through a render yet, so its children still carry
       identity matrices. */
    root.updateWorldMatrix(true, true);
    const seen = new Set();
    const cache = new Map();
    const v = new THREE.Vector3();
    const _ws = new THREE.Vector3();
    root.traverse(function(n){
      if (!n.isMesh) return;
      const list = Array.isArray(n.material) ? n.material : [n.material];
      for (const m of list) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        if (m.map || m.transparent) continue;
        if (m.emissive && (m.emissive.r || m.emissive.g || m.emissive.b)) continue;
        if (m.roughnessMap) continue;
        /* Every material used to get repeat 3 regardless of what it was on, so
           a transformer tank and a bolt head carried noise of the same on-screen
           size. Texture that does not hold a constant world scale is one of the
           plainer tells that a surface is synthetic. Size the tiling from the
           mesh instead, so a grain of finish stays a grain of finish whatever
           it is applied to. */
        let size = 1;
        try {
          const g = n.geometry;
          if (g) {
            if (!g.boundingBox) g.computeBoundingBox();
            if (g.boundingBox) {
              g.boundingBox.getSize(v);
              n.getWorldScale(_ws);
              size = Math.max(v.x * Math.abs(_ws.x), v.y * Math.abs(_ws.y), v.z * Math.abs(_ws.z));
            }
          }
        } catch (e) { size = 1; }
        if (!(size > 0) || !isFinite(size)) size = 1;
        const tex = surfaceTex(THREE, tileRepeat(size), cache);
        m.roughnessMap = tex;
        m.bumpMap = tex;
        /* Scaled by how polished the surface is: a mirror shows every
           irregularity, matt paint hides most of them. */
        m.bumpScale = 0.003 + (m.metalness || 0) * 0.006;
        m.needsUpdate = true;
      }
    });
    /* Handed back so a caller that replaces the model can free these. The
       textures are per-call (one WebGL context's worth), unlike the canvas
       behind them, which is shared at module scope. */
    return cache;
  }

  /* ---------- static batching ----------
     Measured on the homepage showcase before this existed: the hero models drew
     roughly 16,000 triangles per frame through roughly 400 draw calls. That
     ratio is the whole performance story. 16,000 triangles is nothing -- a phone
     from 2016 draws that without noticing -- but every one of the hundred or so
     boxes and cylinders a builder emits is its own mesh, so it is its own draw
     call, and the scene is submitted up to four times a frame (shadow map, SSAO
     depth, SSAO normals, colour). The cost was never the geometry. It was the
     per-mesh submission overhead, and it is what capped how much detail the
     builders could afford.

     So: once the model is built, nudged and textured, collapse every static
     mesh sharing a material into one merged mesh. Nothing about the picture
     changes -- identical triangles, identical materials, identical UVs, each
     part's transform baked in -- but the submission count falls to roughly the
     number of distinct materials in the model.

     Deliberately not merged:
       - InstancedMesh, already one draw call by construction
       - transparent materials: merging fixes the draw order of the faces inside
         the merged mesh, and a glass door or a POD shell has to sort per-face
         against what is behind it
       - skinned or morphed meshes, whose vertices move after this runs
       - a mesh with children, which would be removed along with its parent
       - geometries whose attribute set differs from the group's, which would
         concatenate into garbage rather than fail loudly

     A mirrored transform (negative determinant) has its winding reversed on the
     way in, or the part turns inside out once its matrix is baked.

     Call only before the first render, which is where mountScene calls it: the
     original geometries have never been uploaded at that point, so dropping
     them frees nothing on the GPU and cannot pull a buffer out from under a
     mesh that is still being drawn. */
  function flipWinding(geo){
    for (const name in geo.attributes) {
      const a = geo.attributes[name], n = a.itemSize, arr = a.array;
      for (let i = 0; i + 3 * n <= arr.length; i += 3 * n) {
        for (let k = 0; k < n; k++) {
          const t = arr[i + n + k]; arr[i + n + k] = arr[i + 2 * n + k]; arr[i + 2 * n + k] = t;
        }
      }
    }
  }

  const MERGE_SIG = 'normal,position,uv';
  function mergeByMaterial(THREE, root){
    root.updateMatrixWorld(true);
    const groups = new Map();
    root.traverse(function(n){
      if (!n.isMesh || n.isInstancedMesh || n.isSkinnedMesh) return;
      if (!n.visible || n.children.length) return;
      if (!n.geometry || !n.material || Array.isArray(n.material)) return;
      if (n.morphTargetInfluences && n.morphTargetInfluences.length) return;
      if (n.material.transparent) return;
      if (Object.keys(n.geometry.attributes).sort().join(',') !== MERGE_SIG) return;
      /* Keyed by parent as well as material, so a subassembly the caller moves
         afterwards -- the rack and POD builders position whole units -- keeps
         moving as one piece instead of being welded to its neighbours. */
      const key = n.material.uuid + '|' + (n.parent ? n.parent.uuid : 'root');
      let e = groups.get(key);
      if (!e) { e = { mat: n.material, parent: n.parent || root, meshes: [] }; groups.set(key, e); }
      e.meshes.push(n);
    });

    let batches = 0, collapsed = 0;
    groups.forEach(function(e){
      if (e.meshes.length < 2) return;
      const parts = [];
      let verts = 0, bad = false;
      for (const n of e.meshes) {
        try {
          const g = n.geometry.index ? n.geometry.toNonIndexed() : n.geometry.clone();
          g.applyMatrix4(n.matrix);
          if (n.matrix.determinant() < 0) flipWinding(g);
          parts.push(g);
          verts += g.attributes.position.count;
        } catch (err) { bad = true; break; }
      }
      /* Any part that will not transform leaves the whole group unmerged rather
         than half-merged, which would drop geometry out of the picture. */
      if (bad || !verts) return;
      const pos = new Float32Array(verts * 3), nor = new Float32Array(verts * 3), uv = new Float32Array(verts * 2);
      let vo = 0;
      for (const g of parts) {
        const c = g.attributes.position.count;
        pos.set(g.attributes.position.array.subarray(0, c * 3), vo * 3);
        nor.set(g.attributes.normal.array.subarray(0, c * 3), vo * 3);
        uv.set(g.attributes.uv.array.subarray(0, c * 2), vo * 2);
        vo += c;
      }
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const mesh = new THREE.Mesh(out, e.mat);
      mesh.name = 'batch';
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      e.parent.add(mesh);
      for (const n of e.meshes) if (n.parent) n.parent.remove(n);
      batches++; collapsed += e.meshes.length;
    });
    return { batches: batches, collapsed: collapsed };
  }

  /* ---------- material library ----------
     `body` stays the sector hue: that colour is functional, it is how a viewer
     tells a data-centre part from a storage or oilfield one, and it is not a
     realism decision to make.

     Everything else is. `dark` was a fixed navy (#22334C) used 57 times and
     `deep` 18 more, which meant galvanised frames, rubber gaskets, cast-iron
     housings, concrete pads and black plastic all rendered as the same blue.
     They are now neutral greys, and the named materials below give builders a
     physically sensible choice per part instead of a tint of the brand colour.

     Values are plausible PBR rather than measured: non-metals sit at metalness
     0 (a painted or ceramic surface is a dielectric -- giving it metalness is
     the classic way to make everything look like toys), and roughness carries
     the difference between a glazed bushing and a sand-cast housing. */
  function mats(THREE, color){
    const M = function(c, metalness, roughness, extra){
      const o = {color:c, metalness:metalness, roughness:roughness};
      if (extra) for (const k in extra) o[k] = extra[k];
      /* Bare MeshStandardMaterial leaves envMapIntensity at 1. The PMREM
         environment is the only thing giving metal a sense of sitting in a room
         rather than being lit by two lamps in a void, so metals are pushed above
         1 and dielectrics left at it. Scaled by metalness so one line covers the
         whole library. */
      if (o.envMapIntensity == null) o.envMapIntensity = 1 + (metalness || 0) * 0.35;
      /* clearcoat requires MeshPhysicalMaterial, which extends Standard, so
         addSurfaceDetail's roughness/bump pass still applies unchanged. */
      return (o.clearcoat != null)
        ? new THREE.MeshPhysicalMaterial(o)
        : new THREE.MeshStandardMaterial(o);
    };
    /* Painted industrial enamel is two layers: pigment under a thin gloss coat.
       A single-lobe Standard material has to average them, which is what makes
       painted equipment read as plastic. Clearcoat models the second lobe -- a
       sharp specular over the diffuse base -- and is the single biggest step
       toward these reading as coated steel rather than toys. Glaze is the same
       idea taken to a fired ceramic finish. */
    const PAINT = {clearcoat:0.42, clearcoatRoughness:0.30};
    const GLAZE = {clearcoat:1.00, clearcoatRoughness:0.06};
    return {
      /* sector identity -- do not repurpose */
      body: M(color, 0.30, 0.60, PAINT),

      /* neutral structural greys, replacing the old navy */
      dark: M(0x3A4046, 0.55, 0.52, PAINT),
      deep: M(0x24272B, 0.35, 0.58, PAINT),

      /* indicators stay emissive */
      gold: M(0xFFC400, 0.00, 0.40, {emissive:0xFFC400, emissiveIntensity:.22}),
      lit:  M(0x7FCC9B, 0.00, 0.40, {emissive:0x7FCC9B, emissiveIntensity:.30}),

      /* ---- real materials ---- */
      steel:     M(0x9AA3AD, 0.85, 0.34),   // bare / mill-finish steel
      galv:      M(0xAAB2B8, 0.68, 0.50),   // galvanised: duller, slight spangle
      stainless: M(0xC6CCD2, 0.92, 0.20),   // silencers, cladding, fasteners
      castIron:  M(0x55595E, 0.45, 0.70),   // engine blocks, motor housings
      copper:    M(0xB87333, 0.88, 0.32),   // busbar, windings, terminals
      brass:     M(0xC0982E, 0.86, 0.30),   // glands, valve trim
      porcelain: M(0xE9E5DB, 0.00, 0.22, GLAZE),   // glazed bushing sheds -- dielectric
      rubber:    M(0x1A1C1F, 0.00, 0.94),   // gaskets, boots, vibration mounts
      plastic:   M(0x24272C, 0.05, 0.52, {clearcoat:0.25, clearcoatRoughness:0.42}),   // mouldings, breaker cases
      concrete:  M(0x8E8B84, 0.00, 0.95)    // pads and plinths
    };
  }
  function box(THREE, m, w,h,d, x,y,z){
    const smallest = Math.min(w, h, d);
    let geo;
    /* Skip the thin detail plates -- vent slots, printed markings, faceplate
       inlays are 0.012-0.03 thick, so a bevel would consume the whole slab and
       round it into a lozenge. They also sit flat against a parent face where
       no edge is visible, so it would be vertices spent on nothing. */
    /* The threshold was 0.05, which left every trim piece, cover plate, rail
       and small bracket -- a large share of what is actually silhouetted
       against the background -- with perfectly sharp edges, and a perfectly
       sharp edge is the most reliable CG tell there is: it cannot catch the
       thin highlight that runs along every real one. Lowered to 0.028, with the
       radius still proportional so a thin plate gets a thin chamfer rather than
       being rounded into a lozenge. Below that the part is a printed marking or
       a vent slot lying flat on a parent face, where no edge is visible. */
    if (RoundedBox && smallest > 0.028) {
      /* Proportional, but capped: a chamfer is a fixed small size on real
         equipment, not a fraction of the panel. Without the cap a large tank
         face turns into a pillow. */
      const r = Math.min(smallest * 0.12, 0.022);
      geo = new RoundedBox(w, h, d, 1, r);
    } else {
      geo = new THREE.BoxGeometry(w, h, d);
    }
    const b = new THREE.Mesh(geo, m);
    b.position.set(x,y,z); return b;
  }
  /* Radial resolution multiplier. The builders were authored with segment counts
     tuned by eye at thumbnail size -- half of them sit at 10 or fewer, which is
     visibly faceted once a bushing, pipe, fan hub or shaft is shown at any real
     size. Scaling centrally lifts all 100-odd call sites at once instead of
     re-tuning each by hand, and keeps the numbers at the call site meaningful as
     *relative* detail (a bolt head still gets less than a transformer tank).
     Clamped at both ends: never coarser than 10, never finer than 48, since past
     that the extra triangles buy nothing at these screen sizes. */
  /* Raised per mount by opts.detail. A grid of 90px thumbnails and one 560px
     hero are not the same picture and should not carry the same silhouette
     budget: at thumbnail size a 10-sided bushing is indistinguishable from a
     round one, and at hero size it is the most obvious thing on the model.
     Segments are now nearly free -- the parts are merged into one draw call per
     material, so a finer cylinder costs triangles, which there is room for, and
     not submissions, which there was not. */
  const DETAIL_BASE = 2.0;
  let DETAIL = DETAIL_BASE;
  function segs(n){ return Math.max(10, Math.min(64, Math.round((n || 14) * DETAIL))); }

  function cyl(THREE, m, rt,rb,h, seg, x,y,z){
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segs(seg)), m);
    c.position.set(x,y,z); return c;
  }

  /* One draw call for a repeated part.
     The heavy repeats here are genuinely repetitive -- 24 RJ45 jacks, 24 drive
     carriers, 56 keycaps, and a punched vent field on every rack chassis. As
     separate meshes each one is its own draw call, and a loaded rack was
     spending hundreds of them on identical little boxes. Same geometry, same
     material, different transforms is exactly what InstancedMesh is for.

     `at` is an array of [x,y,z] or [x,y,z,rx,ry,rz]. Shadows are enabled by the
     caller-side traverse in mountScene, which handles InstancedMesh fine. */
  function inst(THREE, g, geo, mat, at){
    const im = new THREE.InstancedMesh(geo, mat, at.length);
    const m4 = new THREE.Matrix4(), eu = new THREE.Euler(), q = new THREE.Quaternion();
    const v = new THREE.Vector3(), one = new THREE.Vector3(1,1,1);
    for (let i = 0; i < at.length; i++) {
      const a = at[i];
      v.set(a[0], a[1], a[2]);
      eu.set(a[3] || 0, a[4] || 0, a[5] || 0);
      q.setFromEuler(eu);
      m4.compose(v, q, one);
      im.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true;
    g.add(im);
    return im;
  }

  /* ---------- detail helpers ----------
     Small repeated features -- louvers, bolt circles, fan grilles, handles,
     nameplates -- extracted so every builder can add the same vocabulary of
     detail instead of each inventing its own. Segment counts are kept low on
     purpose: these mount on phones, and a bolt head does not need 24 sides. */

  /* A run of ventilation louvers across a face. */
  function louvers(THREE, g, m, opts){
    const o = opts, n = o.n || 6;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const y = o.y0 + (o.y1 - o.y0) * t;
      const l = box(THREE, m, o.w, o.h || 0.045, 0.02, o.x || 0, y, o.z);
      if (o.tilt) l.rotation.x = o.tilt;
      g.add(l);
    }
  }

  /* A cylinder spanning two points. Hoses, conduit, cable drops, earth straps,
     jumpers and fuel lines are all "a round thing running from here to there",
     and having to write each one as a CylinderGeometry with a hand-solved
     rotation is the reason the builders had almost none of them. Everything on
     real equipment is connected to something else; the models were a set of
     boxes sitting near each other. */
  function tube(THREE, g, m, a, b, r, seg){
    const A = new THREE.Vector3(a[0], a[1], a[2]);
    const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = d.length();
    if (!(len > 1e-6)) return null;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs(seg || 10)), m);
    c.position.set(A.x + d.x / 2, A.y + d.y / 2, A.z + d.z / 2);
    c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.add(c);
    return c;
  }

  /* A run of tube through a list of points, with a collar at each joint so the
     bends read as fittings rather than as two cylinders meeting at an angle. */
  function tubeRun(THREE, g, m, pts, r, collar){
    for (let i = 0; i < pts.length - 1; i++) tube(THREE, g, m, pts[i], pts[i + 1], r);
    for (let i = 1; i < pts.length - 1; i++) {
      const j = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, segs(10), segs(7)), m);
      j.position.set(pts[i][0], pts[i][1], pts[i][2]);
      g.add(j);
    }
    if (collar) {
      for (const p of [pts[0], pts[pts.length - 1]]) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.22, r * 1.22, r * 0.7, segs(10)), collar);
        c.position.set(p[0], p[1], p[2]);
        g.add(c);
      }
    }
  }

  /* Bolt heads round a flange or along an edge. */
  function bolts(THREE, g, m, opts){
    const o = opts, n = o.n || 8, r = o.r || 0.3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (o.phase || 0);
      const b = cyl(THREE, m, o.size || 0.035, o.size || 0.035, 0.05, 6,
        (o.x || 0) + Math.cos(a) * r, (o.y || 0) + Math.sin(a) * r, o.z || 0);
      b.rotation.x = Math.PI / 2;
      g.add(b);
    }
  }

  /* ---------- motion and callouts ----------
     Three small conventions the viewer reads after a model is built:

       group.userData.spin    = {axis, rate}   rotate this group, rad/s
       mesh.userData.blink    = {period, phase, lo, hi}   pulse its emissive
       object.userData.callout = 'Label'       pin a text label to this point

     A spinning part has to be its own Group: mergeByMaterial batches per
     parent, so everything inside the group collapses into one mesh that still
     turns as a unit, and nothing outside it is welded to it. */
  function spinner(THREE, g, x, y, z, axis, rate){
    const sp = new THREE.Group();
    sp.position.set(x, y, z);
    sp.userData.spin = { axis: axis || 'z', rate: rate == null ? 3 : rate };
    g.add(sp);
    return sp;
  }
  /* Move a mesh that was positioned in model space into a spinner, keeping it
     where it was. Lets a builder keep its absolute coordinates. */
  function toSpin(sp, mesh){
    mesh.position.sub(sp.position);
    sp.add(mesh);
    return mesh;
  }
  /* An indicator that pulses. Its material is cloned so that it is not batched
     with, and does not drag along, every other lamp sharing the original. */
  function blink(mesh, period, phase, lo, hi){
    mesh.material = mesh.material.clone();
    mesh.userData.blink = { period: period || 1.6, phase: phase || 0, lo: lo == null ? 0.05 : lo, hi: hi == null ? 1.1 : hi };
    return mesh;
  }
  function callout(THREE, g, label, x, y, z){
    const a = new THREE.Object3D();
    a.position.set(x, y, z);
    a.userData.callout = label;
    g.add(a);
    return a;
  }

  /* A fan: a dark throat, a rim, and a rotor of pitched blades that turns.

     The first version drew the ring as a solid metal disc with flat blades laid
     on it, so at any distance a fan read as a grey plate -- on the CRAH, where
     the two fans are most of the front face, that was the weakest surface on
     the model. A fan is a hole with something moving in it: the throat is now
     dark, the blades are pitched so they catch light differently as they turn,
     and the rotor is a spinner group.

     opts.axis:'x' turns the whole fan to face along X (a genset's radiator fan
     faces the radiator, not the side of the skid). opts.rate is rad/s. */
  function fan(THREE, g, ring, blade, opts){
    const o = opts, r = o.r || 0.4;
    const holder = new THREE.Group();
    holder.position.set(o.x || 0, o.y || 0, o.z || 0);
    if (o.axis === 'x') holder.rotation.y = Math.PI / 2;
    g.add(holder);

    const throatM = new THREE.MeshStandardMaterial({color: 0x15181C, metalness: .2, roughness: .85});
    const throat = cyl(THREE, throatM, r * 0.97, r * 0.97, 0.02, 24, 0, 0, -0.012);
    throat.rotation.x = Math.PI / 2; holder.add(throat);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.07, 8, segs(26)), ring);
    holder.add(rim);

    const rot = spinner(THREE, holder, 0, 0, 0.012, 'z', o.rate == null ? 4.2 : o.rate);
    const hub = cyl(THREE, blade, r * 0.22, r * 0.20, 0.07, 14, 0, 0, 0.012);
    hub.rotation.x = Math.PI / 2; rot.add(hub);
    const n = o.blades || 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const bl = box(THREE, ring, r * 0.74, r * 0.30, 0.016, Math.cos(a) * r * 0.57, Math.sin(a) * r * 0.57, 0);
      bl.rotation.order = 'ZXY';
      bl.rotation.z = a;
      bl.rotation.x = 0.50;                       // blade pitch
      rot.add(bl);
    }
  }

  /* Radiator: a stack of fins with an end plate, as seen on transformer tanks. */
  function radiator(THREE, g, m, opts){
    const o = opts, n = o.n || 7;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * (o.pitch || 0.11);
      g.add(box(THREE, m, o.w || 0.06, o.h, o.d || 0.5, o.x + (o.axis === 'z' ? 0 : off), o.y, o.z + (o.axis === 'z' ? off : 0)));
    }
    /* top and bottom headers tying the fins together */
    for (const s of [-1, 1]) {
      g.add(box(THREE, m, o.axis === 'z' ? 0.12 : n * (o.pitch || 0.11), 0.09, o.axis === 'z' ? n * (o.pitch || 0.11) : 0.12,
        o.x, o.y + s * (o.h / 2 - 0.03), o.z));
    }
  }

  /* A door: recessed panel, hinge barrels and a latch handle. */
  function door(THREE, g, face, dark, metal, opts){
    const o = opts;
    g.add(box(THREE, face, o.w, o.h, 0.03, o.x, o.y, o.z));
    g.add(box(THREE, dark, o.w - 0.12, o.h - 0.12, 0.012, o.x, o.y, o.z + 0.02));
    for (const s of [-1, 1]) {
      g.add(cyl(THREE, metal, 0.045, 0.045, 0.14, 8, o.x - o.w / 2 + 0.03, o.y + s * (o.h / 2 - 0.18), o.z + 0.02));
    }
    const handle = box(THREE, metal, 0.06, 0.26, 0.05, o.x + o.w / 2 - 0.10, o.y, o.z + 0.04);
    g.add(handle);
  }

  /* Nameplate / rating label. */
  function plate(THREE, g, m, opts){
    const o = opts;
    g.add(box(THREE, m, o.w || 0.34, o.h || 0.22, 0.015, o.x, o.y, o.z));
  }

  /* ---------- decals: canvas-drawn labels ----------
     A blank rectangle standing in for a nameplate teaches nothing. The actual
     numbers on a transformer plate -- kVA, the two voltages, impedance -- are
     what a learner is supposed to take away, and the whole point of showing the
     equipment is to attach those numbers to the object they live on.

     Canvases are cached by key at module scope because the 2D drawing is the
     expensive part and it is identical for every viewer. The CanvasTexture is
     built per call: textures are uploaded per WebGL context, and viewers here
     each own their own context. */
  const _labelCanvas = {};
  function labelCanvas(key, w, h, draw){
    if (_labelCanvas[key]) return _labelCanvas[key];
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    draw(cv.getContext('2d'), w, h);
    _labelCanvas[key] = cv;
    return cv;
  }

  /* A flat label plane. Kept as a PlaneGeometry rather than mapping a box:
     BoxGeometry repeats the same UV square on all six faces, so a plate would
     show the text on its back and edges too. */
  function decal(THREE, g, o){
    /* Label canvases are authored at the sizes below and rendered at 2x. These
       are the only surfaces on the model carrying TEXT -- nameplates, rating
       plates, warning labels -- so they are the first thing to look soft when a
       viewer zooms, and the draw callbacks are resolution-independent 2D canvas
       calls that scale for free. The 2x happens here rather than in each of the
       eleven call sites so their authored proportions stay readable. */
    const cv  = labelCanvas(o.key, (o.cw || 256) * LABEL_SCALE, (o.ch || 160) * LABEL_SCALE, o.draw);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = MAX_ANISO;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, roughness: o.rough == null ? 0.5 : o.rough,
      metalness: o.metal == null ? 0.15 : o.metal,
      transparent: !!o.transparent, side: THREE.DoubleSide });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), mat);
    p.position.set(o.x, o.y, o.z);
    if (o.rx) p.rotation.x = o.rx;
    if (o.ry) p.rotation.y = o.ry;
    if (o.rz) p.rotation.z = o.rz;
    g.add(p);
    return p;
  }

  /* Etched-metal nameplate: a title bar over rows of label/value pairs, which
     is how essentially every rating plate in this equipment class is laid out. */
  function npDraw(title, rows){
    return function(x, W, H){
      x.fillStyle = '#C9CDD2'; x.fillRect(0,0,W,H);
      x.fillStyle = '#9AA1A9'; x.fillRect(0,0,W,Math.round(H*0.20));
      x.fillStyle = '#14181D';
      x.font = 'bold ' + Math.round(H*0.135) + 'px "Helvetica Neue",Arial,sans-serif';
      x.textBaseline = 'middle';
      x.fillText(title, W*0.045, H*0.105);
      const top = H*0.30, step = (H*0.64) / rows.length;
      x.font = Math.round(H*0.105) + 'px "Helvetica Neue",Arial,sans-serif';
      rows.forEach(function(r, i){
        const y = top + step*i + step/2;
        x.fillStyle = '#3A4149'; x.fillText(r[0], W*0.05, y);
        x.fillStyle = '#101418';
        x.font = 'bold ' + Math.round(H*0.105) + 'px "Helvetica Neue",Arial,sans-serif';
        x.fillText(r[1], W*0.52, y);
        x.font = Math.round(H*0.105) + 'px "Helvetica Neue",Arial,sans-serif';
      });
      x.strokeStyle = '#7F868E'; x.lineWidth = 2; x.strokeRect(1,1,W-2,H-2);
    };
  }

  /* The orange ANSI Z535 arc-flash label that appears on switchgear and
     panelboards. Instantly recognisable and genuinely informative. */
  function arcFlashDraw(x, W, H){
    x.fillStyle = '#F0F0EE'; x.fillRect(0,0,W,H);
    x.fillStyle = '#E8791A'; x.fillRect(0,0,W,Math.round(H*0.30));
    x.fillStyle = '#101010';
    x.font = 'bold ' + Math.round(H*0.20) + 'px "Helvetica Neue",Arial,sans-serif';
    x.textBaseline = 'middle';
    x.fillText('WARNING', W*0.30, H*0.155);
    /* triangle-and-bang */
    x.beginPath(); x.moveTo(W*0.14,H*0.055); x.lineTo(W*0.24,H*0.255); x.lineTo(W*0.04,H*0.255);
    x.closePath(); x.fillStyle='#F0F0EE'; x.fill(); x.strokeStyle='#101010'; x.lineWidth=3; x.stroke();
    x.fillStyle='#101010'; x.font='bold '+Math.round(H*0.13)+'px Arial'; x.fillText('!', W*0.125, H*0.19);
    x.fillStyle = '#151515';
    x.font = 'bold ' + Math.round(H*0.115) + 'px "Helvetica Neue",Arial,sans-serif';
    x.fillText('Arc Flash and Shock Hazard', W*0.06, H*0.44);
    x.font = Math.round(H*0.10) + 'px "Helvetica Neue",Arial,sans-serif';
    x.fillText('Appropriate PPE Required', W*0.06, H*0.60);
    x.fillText('Do not operate controls or open', W*0.06, H*0.745);
    x.fillText('covers without protective equipment', W*0.06, H*0.875);
  }

  /* Panel directory card -- the circuit schedule inside a panelboard door. */
  function directoryDraw(x, W, H){
    x.fillStyle = '#FBFBF7'; x.fillRect(0,0,W,H);
    x.fillStyle = '#2B3138';
    x.font = 'bold ' + Math.round(H*0.075) + 'px "Helvetica Neue",Arial,sans-serif';
    x.textBaseline = 'middle';
    x.fillText('CIRCUIT DIRECTORY', W*0.06, H*0.075);
    const names = ['LTG  A','LTG  B','RECEPT','RECEPT','AHU-1','AHU-2','PUMP','SPARE','SPARE'];
    x.font = Math.round(H*0.055) + 'px "Helvetica Neue",Arial,sans-serif';
    for (let i=0;i<9;i++){
      const y = H*0.17 + i*(H*0.088);
      x.strokeStyle = '#C2C7CC'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(W*0.05,y+H*0.042); x.lineTo(W*0.95,y+H*0.042); x.stroke();
      x.fillStyle = '#5A6068'; x.fillText(String(i*2+1), W*0.07, y);
      x.fillStyle = '#22262B'; x.fillText(names[i], W*0.17, y);
      x.fillStyle = '#5A6068'; x.fillText('20A', W*0.72, y);
    }
  }

  /* Lifting lug. */
  function lug(THREE, g, m, x, y, z){
    const l = box(THREE, m, 0.09, 0.16, 0.05, x, y, z);
    g.add(l);
    const eye = cyl(THREE, m, 0.055, 0.055, 0.045, 10, x, y + 0.09, z);
    eye.rotation.x = Math.PI / 2; g.add(eye);
  }

  /* ---------- 19" rack gear: one chassis helper, different faceplates ----------
     Real proportions: a 19" rack unit is 19in wide and 1.75in per U, so the
     chassis is deliberately wide and thin rather than a generic cube. */
  const RU = 0.37, RW = 4.0, RD = 2.2;
  function rackChassis(THREE, M, u){
    const g = new THREE.Group();
    const h = u * RU;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    g.add(box(THREE, M.body, RW, h, RD, 0, h/2, 0));

    /* The faceplate is a separate panel bolted to the chassis, so it sits very
       slightly proud with a shadow gap around it. Without this the whole unit
       reads as one extruded block no matter what is drawn on the front. */
    g.add(box(THREE, M.dark, RW - 0.02, h - 0.03, 0.04, 0, h/2, RD/2 - 0.01));
    g.add(box(THREE, M.body, RW - 0.10, h - 0.09, 0.03, 0, h/2, RD/2 + 0.012));

    /* Rack ears with the two mounting slots each that actually carry the unit. */
    for (const s of [-1, 1]) {
      g.add(box(THREE, M.dark, 0.18, h, 0.09, s*((RW/2)+0.09), h/2, RD/2 - 0.05));
      const ys = u === 1 ? [h*0.5] : [h*0.22, h*0.78];
      for (const y of ys) {
        g.add(cyl(THREE, metal, 0.045, 0.045, 0.05, 10,
                  s*((RW/2)+0.09), y, RD/2 - 0.005).rotateX(Math.PI/2));
      }
    }
    /* Punched vent field along the top skin and a folded seam down each side.
       27 holes per chassis, and a loaded rack holds several chassis -- one
       instanced draw instead of 27 each. */
    const ventAt = [];
    for (let c = 0; c < 9; c++) for (let r = 0; r < 3; r++) {
      ventAt.push([-1.7 + c*0.42, h + 0.006, -0.35 + r*0.35]);
    }
    inst(THREE, g, new THREE.BoxGeometry(0.17, 0.012, 0.14), M.dark, ventAt);
    for (const s of [-1, 1]) g.add(box(THREE, M.dark, 0.02, h, RD + 0.01, s*RW/2, h/2, 0));
    g.userData.h = h;
    return g;
  }
  /* Front surface to draw faceplate features on. This must clear the raised
     faceplate panel added in rackChassis -- at the old RD/2 + 0.012 every port,
     bay and LED ended up buried inside that panel instead of on it. */
  function faceZ(){ return RD/2 + 0.035; }

  function buildServer(THREE, color, u){
    const M = mats(THREE, color); u = u || 1;
    const g = rackChassis(THREE, M, u); const h = g.userData.h;
    // drive bays down the left of the faceplate
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    const cols = 4, rows = u === 1 ? 1 : 2;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const bx = -1.45 + c*0.5, by = (h/rows)*(r+0.5), bh = (h/rows)*0.5;
      g.add(box(THREE, M.deep, 0.42, bh, 0.02, bx, by, faceZ()));      // recessed bay
      /* Each carrier has a latch handle and an activity LED -- that pairing is
         what makes a drive bay read as a drive bay and not a printed rectangle. */
      g.add(box(THREE, metal, 0.07, bh*0.8, 0.03, bx - 0.15, by, faceZ()+0.015));
      g.add(blink(box(THREE, M.lit, 0.05, 0.035, 0.02, bx + 0.14, by - bh*0.28, faceZ()+0.015), 0.35 + ((r*cols + c) % 5) * 0.17, (r*cols + c) * 0.9, 0.0, 1.4));
    }
    // vent block on the right, punched rather than printed
    for (let i=0;i<6;i++) for (let r=0;r<(u===1?2:4);r++){
      g.add(box(THREE, M.deep, 0.05, h*0.16, 0.02, 0.9 + i*0.12, h*0.22 + r*h*0.2, faceZ()));
    }
    /* Power button, reset pinhole, status LEDs and a front USB -- the cluster
       of controls at the right-hand end of essentially every rack server. */
    g.add(cyl(THREE, metal, 0.075,0.075,0.035, 12, 1.62, h*0.5, faceZ()+0.01).rotateX(Math.PI/2));
    g.add(blink(cyl(THREE, M.lit, 0.035,0.035,0.02, 10, 1.78, h*0.72, faceZ()).rotateX(Math.PI/2), 3.0, 0, 0.15, 1.0));
    g.add(cyl(THREE, M.gold, 0.028,0.028,0.02, 10, 1.78, h*0.5, faceZ()).rotateX(Math.PI/2));
    g.add(box(THREE, M.dark, 0.16, 0.07, 0.03, 1.76, h*0.26, faceZ()));   // USB
    /* Pull-out asset tag between the bays and the vents. */
    g.add(box(THREE, M.dark, 0.10, h*0.34, 0.03, 0.72, h*0.5, faceZ()));

    /* ---- the parts that are in your hands ----
       Everything on this faceplate was something to look at. What you actually
       touch on a rack server -- the ear handles you pull it out by, the rail
       latches, the service label on the lid -- was missing, and at hero size
       the faceplate is most of the silhouette. */

    /* Rack-ear pull handles. */
    for (const sx of [-1, 1]) {
      g.add(box(THREE, metal, 0.05, h*0.62, 0.05, sx*((RW/2) + 0.07), h*0.5, RD/2 + 0.14));
      for (const sy of [-1, 1]) {
        g.add(box(THREE, metal, 0.05, 0.05, 0.14, sx*((RW/2) + 0.07), h*0.5 + sy*h*0.31, RD/2 + 0.08));
      }
    }

    /* Diagnostic display, which on a 2U sits between the bays and the control
       cluster and is the first thing anyone looks at in a cold aisle. */
    if (u > 1) {
      g.add(box(THREE, M.deep, 0.52, h*0.22, 0.02, 0.30, h*0.74, faceZ()));
      decal(THREE, g, {key:'srv-lcd', w:0.46, h:h*0.17, x:0.30, y:h*0.74, z:faceZ()+0.016,
        cw:240, ch:90, rough:0.25, metal:0.0,
        draw: function(x,W,H){
          x.fillStyle='#0A1A12'; x.fillRect(0,0,W,H);
          x.fillStyle='#5BE39B'; x.textBaseline='middle';
          x.font='bold '+Math.round(H*0.34)+'px "IBM Plex Mono",monospace';
          x.fillText('NODE-07  OK', W*0.07, H*0.52);
        }});
    }

    /* Chassis lid seam and its release latch, running back from the faceplate. */
    g.add(box(THREE, M.dark, RW - 0.26, 0.012, RD - 0.16, 0, h + 0.012, -0.02));
    g.add(box(THREE, metal, 0.30, 0.035, 0.12, 0, h + 0.03, RD/2 - 0.16));

    /* Slide-rail members down each flank -- how it is held in the rack. */
    for (const sx of [-1, 1]) {
      g.add(box(THREE, metal, 0.035, h*0.34, RD - 0.22, sx*(RW/2 + 0.025), h*0.5, -0.06));
    }

    /* Named points for the viewer's callouts (opts.callouts). */
    callout(THREE, g, 'Drive bays', -0.70, h * 0.5, faceZ() + 0.03);
    callout(THREE, g, 'Status LEDs', 1.78, h * 0.72, faceZ() + 0.03);
    callout(THREE, g, 'Rack ears', RW / 2 + 0.07, h * 0.5, RD / 2 + 0.16);
    return g;
  }
  function buildSwitchNet(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    /* 24 RJ45 jacks in the usual two staggered banks of 12. Each is a shielded
       housing with the latch cut-out above it and a link LED beside it, which is
       what distinguishes a switch faceplate from a grid of dark rectangles. */
    /* 24 jacks x 3 parts each was 72 draw calls for the same three little boxes.
       Collected per part type and drawn instanced. */
    const shieldAt = [], boreAt = [], latchAt = [], ledAt = [];
    for (let r=0;r<2;r++) for (let i=0;i<12;i++){
      const x = -1.7 + i*0.29, y = h*(r?0.66:0.34);
      shieldAt.push([x, y, faceZ()]);
      boreAt.push([x, y - 0.008, faceZ()+0.008]);
      latchAt.push([x, y + 0.036, faceZ()+0.008]);
      if (i % 2 === 0) ledAt.push([x, y + 0.075, faceZ()]);
    }
    inst(THREE, g, new THREE.BoxGeometry(0.13, 0.085, 0.02),  metal,  shieldAt);
    inst(THREE, g, new THREE.BoxGeometry(0.10, 0.055, 0.03),  M.deep, boreAt);
    inst(THREE, g, new THREE.BoxGeometry(0.035, 0.03, 0.03),  M.deep, latchAt);
    inst(THREE, g, new THREE.BoxGeometry(0.03, 0.022, 0.02),  M.lit,  ledAt);
    /* Two SFP+ uplink cages and the console port at the right-hand end. */
    for (let i=0;i<2;i++) {
      g.add(box(THREE, metal, 0.26, 0.11, 0.02, 1.55, h*(i?0.66:0.34), faceZ()));
      g.add(box(THREE, M.dark, 0.22, 0.075, 0.03, 1.55, h*(i?0.66:0.34), faceZ()+0.008));
    }
    g.add(box(THREE, M.gold, 0.20, 0.07, 0.02, 1.86, h*0.5, faceZ()));
    return g;
  }
  function buildStorage(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 2); const h = g.userData.h;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    /* 24 vertical carriers. Each gets the cam latch and the two status LEDs a
       hot-swap carrier carries, so a failed drive is a thing you could point at. */
    /* 24 carriers x 4 parts. The one faulted drive stays a separate mesh --
       it is the only instance with a different material, and it is the detail
       worth being able to point at. */
    const bh = h*0.38;
    const bayAt = [], latchAt2 = [], actAt = [], okAt = [];
    for (let r=0;r<2;r++) for (let c=0;c<12;c++){
      const x = -1.72 + c*0.31, y = h*(r?0.72:0.28);
      bayAt.push([x, y, faceZ()]);
      latchAt2.push([x - 0.08, y, faceZ()+0.014]);
      actAt.push([x + 0.05, y + bh*0.26, faceZ()+0.012]);
      if (!(c === 5 && r === 1)) okAt.push([x + 0.05, y - bh*0.26, faceZ()+0.012]);
      else g.add(box(THREE, M.gold, 0.05, 0.035, 0.02, x + 0.05, y - bh*0.26, faceZ()+0.012));
    }
    inst(THREE, g, new THREE.BoxGeometry(0.24, bh, 0.02),          M.deep, bayAt);
    inst(THREE, g, new THREE.BoxGeometry(0.055, bh*0.72, 0.03),    metal,  latchAt2);
    inst(THREE, g, new THREE.BoxGeometry(0.05, 0.035, 0.02),       M.lit,  actAt);
    inst(THREE, g, new THREE.BoxGeometry(0.05, 0.035, 0.02),       M.dark, okAt);
    /* Enclosure ID display at the right-hand end. */
    g.add(box(THREE, M.dark, 0.20, h*0.20, 0.03, 1.82, h*0.5, faceZ()));
    return g;
  }
  function buildUPSRack(THREE, color, u){
    const M = mats(THREE, color); u = u || 4;
    const g = rackChassis(THREE, M, u); const h = g.userData.h;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    /* Bezel-mounted LCD with a lit panel inset, the way a rack UPS presents
       load and runtime. */
    g.add(box(THREE, M.dark, 1.62, h*0.46, 0.03, -0.95, h*0.58, faceZ()));
    /* Load and runtime on the LCD -- the two numbers anyone walking a data hall
       actually reads off a UPS. */
    decal(THREE, g, {key:'ups-lcd', w:1.44, h:h*0.36, x:-0.95, y:h*0.58, z:faceZ()+0.016,
      cw:320, ch:120, rough:0.25, metal:0.0,
      draw: function(x,W,H){
        x.fillStyle='#08120B'; x.fillRect(0,0,W,H);
        x.fillStyle='#4BE08A'; x.textBaseline='middle';
        x.font='bold '+Math.round(H*0.30)+'px "IBM Plex Mono",monospace';
        x.fillText('LOAD  62%', W*0.05, H*0.30);
        x.font='bold '+Math.round(H*0.24)+'px "IBM Plex Mono",monospace';
        x.fillText('RUNTIME 11 MIN', W*0.05, H*0.68);
        x.fillStyle='#1E6B3A';
        for(var i=0;i<10;i++){ x.fillRect(W*0.62+i*(W*0.035), H*0.16, W*0.022, H*0.22); }
        x.fillStyle='#4BE08A';
        for(var j=0;j<6;j++){ x.fillRect(W*0.62+j*(W*0.035), H*0.16, W*0.022, H*0.22); }
      }});
    for (let i=0;i<5;i++) {                                                    // bar-graph segments
      g.add(box(THREE, i < 3 ? M.lit : M.dark, 0.20, h*0.07, 0.02,
                -1.42 + i*0.24, h*0.46, faceZ()+0.026));
    }
    /* Navigation keypad beside the display. */
    for (let r=0;r<2;r++) for (let c=0;c<2;c++) {
      g.add(box(THREE, metal, 0.16, h*0.09, 0.03, 0.06 + c*0.22, h*0.66 - r*h*0.14, faceZ()+0.01));
    }
    /* The battery module is a separate drawer with its own handle -- on a rack
       UPS this is the part that gets pulled and replaced, so it reads as one. */
    g.add(box(THREE, M.dark, 3.5, h*0.30, 0.03, 0, h*0.17, faceZ()));
    for (const s of [-1,1]) g.add(box(THREE, metal, 0.34, h*0.16, 0.05, s*1.30, h*0.17, faceZ()+0.02));
    for (let i=0;i<7;i++) g.add(box(THREE, M.deep, 0.06, h*0.5, 0.02, 0.62 + i*0.19, h*0.58, faceZ()));
    return g;
  }
  function buildPDU(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    /* C13 outlets: a rectangular moulded body with the D-shaped aperture and a
       per-outlet LED. A bare circle reads as a hole, not a socket. */
    for (let i=0;i<10;i++){
      const x = -1.72 + i*0.34;
      g.add(box(THREE, M.dark, 0.24, h*0.52, 0.03, x, h*0.46, faceZ()));
      g.add(box(THREE, M.deep, 0.17, h*0.34, 0.03, x, h*0.46, faceZ()+0.016));
      for (let p=0;p<3;p++) {                                          // the three pin slots
        g.add(box(THREE, M.body, 0.028, h*0.10, 0.02,
                  x - 0.05 + p*0.05, h*0.46 + (p===1 ? h*0.06 : -h*0.03), faceZ()+0.03));
      }
      g.add(box(THREE, M.lit, 0.06, 0.035, 0.02, x, h*0.80, faceZ()+0.006));
    }
    /* Metered PDU display and its circuit-breaker button. */
    g.add(box(THREE, M.dark, 0.30, h*0.34, 0.03, 1.72, h*0.62, faceZ()));
    g.add(box(THREE, M.gold, 0.22, h*0.22, 0.02, 1.72, h*0.62, faceZ()+0.016));
    g.add(cyl(THREE, M.deep, 0.05,0.05,0.04, 10, 1.72, h*0.24, faceZ()).rotateX(Math.PI/2));
    return g;
  }
  function buildKVM(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    /* A rack console is a slide-out drawer: the tray pulls forward, the lid
       hinges up into a screen. Drawn part-way out so both halves are visible --
       fully closed it is indistinguishable from a blanking panel. */
    const tray = new THREE.Group();
    tray.add(box(THREE, M.body, RW - 0.12, h*0.9, 1.5, 0, h*0.5, RD/2 + 0.75));
    tray.add(box(THREE, M.dark, RW - 0.30, 0.02, 1.1, 0, h*0.95, RD/2 + 0.72));  // keyboard well
    const keyAt = [];                                                            // 56 key caps
    for (let r=0;r<4;r++) for (let c=0;c<14;c++) {
      keyAt.push([-1.55 + c*0.24, h*0.97, RD/2 + 0.30 + r*0.20]);
    }
    inst(THREE, tray, new THREE.BoxGeometry(0.16, 0.04, 0.13), M.deep, keyAt);
    tray.add(box(THREE, M.deep, 0.55, 0.03, 0.34, 1.35, h*0.97, RD/2 + 1.20));   // touchpad
    for (const s of [-1,1]) tray.add(box(THREE, metal, 0.20, h*0.4, 0.06, s*1.86, h*0.5, RD/2 + 1.50));
    g.add(tray);

    /* Lid hinged up behind the tray, carrying the screen. */
    const lid = new THREE.Group();
    lid.add(box(THREE, M.body, RW - 0.12, 1.55, 0.09, 0, 0.78, 0));
    lid.add(box(THREE, M.dark, RW - 0.42, 1.20, 0.03, 0, 0.80, 0.06));
    lid.add(box(THREE, M.lit,  RW - 0.60, 1.02, 0.02, 0, 0.80, 0.08));           // panel
    lid.position.set(0, h*0.9, RD/2 + 0.06);
    lid.rotation.x = -0.16;                                                      // tipped back
    g.add(lid);
    return g;
  }
  function buildBlank(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    /* A blanking panel is plain by definition, so the detail that matters is the
       tool-less mounting: the sprung clips at each end and the stiffening swage
       across the middle are the whole of what one looks like. */
    g.add(box(THREE, M.dark, 3.4, h*0.30, 0.02, 0, h*0.5, faceZ()));             // stamped swage
    g.add(box(THREE, M.dark, 3.4, 0.02, 0.03, 0, h*0.5 + h*0.15, faceZ()+0.008));
    g.add(box(THREE, M.dark, 3.4, 0.02, 0.03, 0, h*0.5 - h*0.15, faceZ()+0.008));
    for (const s of [-1,1]) {
      g.add(box(THREE, metal, 0.12, h*0.55, 0.05, s*1.82, h*0.5, faceZ()+0.01)); // sprung clip
      g.add(box(THREE, metal, 0.07, h*0.18, 0.10, s*1.90, h*0.5, faceZ()-0.03));
    }
    return g;
  }
  function buildCableMgr(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 2); const h = g.userData.h;
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    /* Fingers are C-shaped, not solid blocks: the open throat is the entire
       point of a finger duct, and patch cords have to be visible sitting in it. */
    for (let i=0;i<6;i++){
      const x = -1.6 + i*0.64, fz = RD/2 + 0.18;
      g.add(box(THREE, M.dark, 0.14, h*0.86, 0.34, x, h*0.5, fz));               // upright
      for (const s of [-1,1]) {                                                  // top and bottom returns
        g.add(box(THREE, M.dark, 0.34, h*0.12, 0.34, x + 0.24, h*0.5 + s*h*0.37, fz));
      }
    }
    /* Cords lying in the channel, in the sector colours used elsewhere. */
    const cords = [0x2E7D4F, 0x2B6CB0, 0xB7791F, 0x9C4221];
    cords.forEach(function(c, i){
      const m = new THREE.MeshStandardMaterial({color:c, roughness:.6});
      const r = cyl(THREE, m, 0.05, 0.05, 3.3, 8, 0.1, h*0.30 + i*0.11, RD/2 + 0.20);
      r.rotation.z = Math.PI/2; r.rotation.y = 0.04*i; g.add(r);
    });
    /* Hinged cover lying open below the fingers. */
    const cover = box(THREE, M.body, RW - 0.20, 0.06, 0.62, 0, h*0.06, RD/2 + 0.42);
    cover.rotation.x = -0.55; g.add(cover);
    return g;
  }

  /* ---------- electrical gear ---------- */
  function buildBreaker(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const cu    = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const W = 1.5, H = 2.1, D = 1.15, fz = D/2;

    g.add(box(THREE, M.body, W, H, D, 0, 1.05, 0));                            // moulded case
    /* Case split line and the moulding ribs that run round it. */
    g.add(box(THREE, M.dark, W + 0.02, 0.035, D + 0.02, 0, 1.05, 0));
    for (const sy of [0.42, 1.68]) g.add(box(THREE, M.dark, W + 0.01, 0.03, D + 0.01, 0, sy, 0));

    /* Escutcheon, ON/OFF markings and toggle. */
    g.add(box(THREE, M.deep, 0.80, 0.70, 0.05, 0, 1.32, fz + 0.01));
    g.add(box(THREE, M.gold, 0.30, 0.42, 0.22, 0, 1.32, fz + 0.09));           // toggle
    g.add(box(THREE, metal, 0.16, 0.05, 0.02, -0.28, 1.56, fz + 0.03));        // "I"
    g.add(box(THREE, metal, 0.16, 0.05, 0.02, -0.28, 1.08, fz + 0.03));        // "O"
    /* Push-to-trip button. */
    const ptt = cyl(THREE, M.dark, 0.07, 0.07, 0.05, 10, 0.44, 1.62, fz + 0.03);
    ptt.rotation.x = Math.PI/2; g.add(ptt);
    /* Rating plug window, showing the actual plug rating. */
    g.add(box(THREE, M.dark, 0.30, 0.18, 0.02, 0.40, 1.06, fz + 0.03));
    decal(THREE, g, {key:'brk-plug', w:0.26, h:0.15, x:0.40, y:1.06, z:fz + 0.045,
      cw:160, ch:96, rough:0.4, metal:0.1,
      draw: function(x,W,H){
        x.fillStyle='#15181C'; x.fillRect(0,0,W,H);
        x.fillStyle='#F2C230'; x.textBaseline='middle'; x.textAlign='center';
        x.font='bold '+Math.round(H*0.52)+'px "Helvetica Neue",Arial,sans-serif';
        x.fillText('400', W/2, H*0.44);
        x.font='bold '+Math.round(H*0.24)+'px "Helvetica Neue",Arial,sans-serif';
        x.fillText('AMP', W/2, H*0.80);
      }});
    /* Interrupting-rating label on the case. AIC is the number that has to be
       checked against available fault current, and it is the one people skip. */
    decal(THREE, g, {key:'brk-aic', w:0.62, h:0.30, x:0, y:0.68, z:fz + 0.02,
      cw:260, ch:130, rough:0.55, metal:0.1,
      draw: npDraw('MOLDED CASE BREAKER', [
        ['FRAME', '600A'],
        ['AIC',   '65kA @480V'],
        ['UL',    '489']
      ])});

    /* Lug shrouds with removable covers, top and bottom. */
    for (const s of [1, -1]) {
      const y = s > 0 ? 2.02 : 0.10;
      g.add(box(THREE, M.dark, W - 0.30, 0.22, D - 0.34, 0, y, 0));
      for (let i = -1; i <= 1; i++) {
        g.add(cyl(THREE, M.deep, 0.11, 0.11, 0.36, 10, i*0.42, y + s*0.24, 0));
        g.add(cyl(THREE, cu, 0.06, 0.06, 0.20, 8, i*0.42, y + s*0.40, 0));     // conductor stub
        /* lug clamping screw */
        g.add(cyl(THREE, metal, 0.045, 0.045, 0.05, 6, i*0.42, y + s*0.24, D/2 - 0.20));
      }
    }

    /* Mounting bosses on the back. */
    for (const sx of [-1, 1]) for (const sy of [0.45, 1.65]) {
      g.add(cyl(THREE, M.dark, 0.06, 0.06, 0.06, 8, sx*(W/2 - 0.16), sy, -D/2 - 0.02));
    }
    return g;
  }
  function buildConductor(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const jacket = new THREE.MeshStandardMaterial({color, metalness:.15, roughness:.75});
    const copper = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const green  = new THREE.MeshStandardMaterial({color:0x2E7D4F, metalness:.15, roughness:.75});
    const LEN = 3.4, R = 0.30;

    /* Rotating a cylinder 90deg about Z lays its axis along X, so the bundle's
       cross-section offsets live in Y and Z -- offsetting in X would just slide
       each conductor along its own length (which is what the first version did,
       stacking them instead of bundling them). */
    function run(mat, r, dy, dz, len, cx){
      const c = cyl(THREE, mat, r, r, len, 20, 0, 0, 0);
      c.rotation.z = Math.PI/2;
      c.position.set(cx || 0, 0.95 + dy, dz);
      return c;
    }
    // three phase conductors in a triangle, plus a smaller green ground
    const bundle = [[ 0.32, -0.34], [ 0.32, 0.34], [-0.36, 0.0]];
    bundle.forEach(function(o){
      g.add(run(jacket, R, o[0], o[1], LEN));
      // exposed copper strand past the cut end of the jacket
      g.add(run(copper, R*0.55, o[0], o[1], 0.75, LEN/2 + 0.34));
    });
    g.add(run(green, R*0.62, -0.30, 0.62, LEN));
    g.add(run(copper, R*0.34, -0.30, 0.62, 0.75, LEN/2 + 0.34));
    return g;
  }
  function buildMotor(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    const blk   = new THREE.MeshStandardMaterial({color:0x24272C, metalness:.05, roughness:.55});

    /* Stator frame with radial cooling fins running its length. */
    const body = cyl(THREE, M.body, 0.85, 0.85, 2.0, 24, 0, 1.0, 0);
    body.rotation.z = Math.PI/2; g.add(body);
    for (let i = 0; i < 14; i++) {
      const a = (i/14) * Math.PI * 2;
      g.add(box(THREE, M.body, 1.9, 0.10, 0.09, 0, 1.0 + Math.sin(a)*0.90, Math.cos(a)*0.90));
    }
    /* End bells, bolted, slightly larger diameter than the frame. */
    for (const s of [-1, 1]) {
      const eb = cyl(THREE, M.dark, 0.88, 0.80, 0.22, 22, s*1.08, 1.0, 0);
      eb.rotation.z = Math.PI/2; g.add(eb);
      bolts(THREE, g, metal, {n: 6, r: 0.70, x: 0, y: 1.0, z: 0, size: 0.05});
    }

    /* Drive end: shaft with keyway and a bearing boss. */
    g.add(cyl(THREE, M.dark, 0.26, 0.26, 0.18, 16, 1.24, 1.0, 0).rotateZ(Math.PI/2));
    /* Everything on the shaft turns as one: shaft, key, coupling half and its
       set screws. Slow enough to read as rotation rather than a blur. */
    const rotor = spinner(THREE, g, 0, 1.0, 0, 'x', 2.6);
    const shaft = cyl(THREE, metal, 0.16, 0.16, 0.86, 14, 1.68, 1.0, 0);
    shaft.rotation.z = Math.PI/2; toSpin(rotor, shaft);
    toSpin(rotor, box(THREE, blk, 0.34, 0.05, 0.09, 1.80, 1.14, 0));           // key

    /* Non-drive end: fan cowl with guard slots. */
    const cowl = cyl(THREE, M.dark, 0.80, 0.72, 0.42, 20, -1.42, 1.0, 0);
    cowl.rotation.z = Math.PI/2; g.add(cowl);
    for (let i = 0; i < 10; i++) {
      const a = (i/10) * Math.PI * 2;
      g.add(box(THREE, blk, 0.03, 0.42, 0.10, -1.63, 1.0 + Math.sin(a)*0.46, Math.cos(a)*0.46));
    }

    /* Terminal box with gland plate and lid screws. */
    g.add(box(THREE, M.dark, 0.80, 0.58, 0.78, -0.05, 1.98, 0));
    g.add(box(THREE, blk, 0.66, 0.05, 0.64, -0.05, 2.28, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(THREE, metal, 0.035, 0.035, 0.04, 6, -0.05 + sx*0.26, 2.31, sz*0.24));
    }
    g.add(cyl(THREE, metal, 0.11, 0.11, 0.16, 10, -0.05, 1.86, 0.44));         // cable gland

    /* Nameplate, eyebolt and feet with slotted holes. */
    /* Motor nameplate. FLA and service factor are the two values people come
       looking for when sizing overloads and conductors. */
    decal(THREE, g, {key:'np-motor', w:0.66, h:0.42, x:0.30, y:1.44, z:0.75,
      cw:280, ch:180, metal:0.35, rough:0.42,
      draw: npDraw('INDUCTION MOTOR', [
        ['HP',    '75'],
        ['RPM',   '1780'],
        ['VOLTS', '460'],
        ['FLA',   '88'],
        ['SF',    '1.15']
      ])});
    g.add(cyl(THREE, metal, 0.09, 0.09, 0.06, 10, -0.05, 2.34, 0).rotateX(Math.PI/2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(box(THREE, M.dark, 0.42, 0.16, 0.30, sx*0.86, 0.14, sz*0.60));
      g.add(cyl(THREE, blk, 0.06, 0.06, 0.18, 8, sx*0.86, 0.16, sz*0.60));
    }
    /* ---- the connections ----
       A motor that is not wired to anything and not coupled to anything is a
       casting, not a machine, and the load at the end of a one-line is the
       whole reason this shape is on the page. */

    /* Flexible conduit from the terminal-box gland down to the base, which is
       where the supply actually arrives. */
    tubeRun(THREE, g, M.dark, [[-0.05,1.86,0.52],[-0.05,1.60,0.86],[-0.05,0.90,0.96],[-0.05,0.32,0.90]], 0.075, metal);

    /* Coupling half on the shaft, with its set screws -- the drive end now
       drives something. */
    const cph = cyl(THREE, M.dark, 0.28, 0.28, 0.26, 20, 1.92, 1.0, 0);
    cph.rotation.z = Math.PI/2; toSpin(rotor, cph);
    for (let i = 0; i < 4; i++) {
      const a = (i/4) * Math.PI * 2;
      toSpin(rotor, cyl(THREE, metal, 0.030, 0.030, 0.05, 6, 1.92, 1.0 + Math.sin(a)*0.29, Math.cos(a)*0.29));
    }

    /* Grease nipples and relief plugs on both bearing housings. */
    for (const sx of [-1, 1]) {
      g.add(cyl(THREE, M.brass, 0.028, 0.028, 0.07, 8, sx*1.10, 1.36, 0.10));
      g.add(cyl(THREE, M.brass, 0.022, 0.022, 0.05, 8, sx*1.10, 0.66, 0.10));
    }

    /* Earthing lug on the near foot. Bonding the frame is a code requirement,
       not a detail. */
    g.add(box(THREE, M.copper, 0.10, 0.07, 0.030, 0.86, 0.26, 0.76));
    g.add(cyl(THREE, M.brass, 0.022, 0.022, 0.05, 8, 0.86, 0.26, 0.80).rotateX(Math.PI/2));
    tubeRun(THREE, g, M.copper, [[0.86,0.26,0.82],[1.00,0.16,0.88],[1.00,0.04,0.78]], 0.018);

    /* Condensate drain plugs at the bottom of each end bell. */
    for (const sx of [-1, 1]) g.add(cyl(THREE, M.brass, 0.030, 0.030, 0.05, 8, sx*1.06, 0.24, 0.30));

    g.add(box(THREE, M.dark, 2.30, 0.10, 1.44, 0, 0.05, 0));                   // base rails

    /* Named points for the viewer's callouts (opts.callouts). */
    callout(THREE, g, 'Terminal box', -0.05, 2.3, 0.2);
    callout(THREE, g, 'Drive shaft', 1.75, 1, 0.17);
    callout(THREE, g, 'Cooling fan', -1.5, 1, 0.72);
    callout(THREE, g, 'Nameplate', 0.3, 1.44, 0.77);
    return g;
  }
  function buildPanel(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const cu    = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const W = 1.7, H = 2.9, D = 0.75, fz = D/2;

    g.add(box(THREE, M.body, W, H, D, 0, 1.45, 0));                            // enclosure

    /* Door swung OPEN on its hinges. Closed, it hid every interior feature --
       the breaker handles, the gutter and the bus bars below were all modelled
       and none of it was visible, which defeats the point of the detail. */
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-W/2 + 0.04, 1.45, fz + 0.02);
    const leaf = box(THREE, M.body, W - 0.06, H - 0.10, 0.04, (W - 0.06)/2, 0, 0);
    doorPivot.add(leaf);
    doorPivot.add(box(THREE, M.dark, W - 0.22, H - 0.26, 0.015, (W - 0.06)/2, 0, -0.03));
    /* latch and handle on the free edge */
    doorPivot.add(box(THREE, metal, 0.06, 0.30, 0.06, W - 0.18, 0, 0.05));
    doorPivot.add(cyl(THREE, M.gold, 0.06, 0.06, 0.10, 10, W - 0.18, -0.25, 0.05));
    /* Circuit directory on the inside of the door, where it actually lives, and
       the arc-flash warning on the outside where an operator would read it. */
    decal(THREE, doorPivot, {key:'dir-card', w:W-0.34, h:1.35, cw:300, ch:340,
      x:(W-0.06)/2, y:0.42, z:-0.04, ry:Math.PI, rough:0.75, metal:0.05,
      draw: directoryDraw});
    decal(THREE, doorPivot, {key:'arcflash', w:W-0.38, h:0.62, cw:340, ch:200,
      x:(W-0.06)/2, y:-0.72, z:0.031, rough:0.6, metal:0.05, draw: arcFlashDraw});
    doorPivot.rotation.y = -1.15;                                              // ~66 degrees open
    g.add(doorPivot);
    for (const sy of [0.55, 1.45, 2.35]) {                                     // hinge barrels
      g.add(cyl(THREE, metal, 0.05, 0.05, 0.18, 8, -W/2 + 0.04, sy, fz + 0.02));
    }

    /* Dead front with the breaker cutout, main breaker at the top. */
    g.add(box(THREE, M.dark, W - 0.20, H - 0.26, 0.04, 0, 1.45, fz - 0.04));
    g.add(box(THREE, M.deep, 1.10, 0.34, 0.06, 0, 2.52, fz - 0.02));           // main
    g.add(box(THREE, M.gold, 0.24, 0.22, 0.08, 0, 2.52, fz + 0.01));

    /* Branch breaker handles in two columns, alternating trip positions. */
    for (let r = 0; r < 9; r++) for (const s of [-1, 1]) {
      const y = 2.20 - r * 0.22;
      g.add(box(THREE, M.deep, 0.46, 0.155, 0.06, s*0.34, y, fz - 0.02));
      g.add(box(THREE, r % 3 === 2 ? M.dark : metal, 0.12, 0.10, 0.05, s*0.34 + s*0.10, y, fz + 0.01));
    }
    /* Centre gutter between the columns, with the neutral/ground bars visible. */
    g.add(box(THREE, M.dark, 0.14, H - 0.60, 0.05, 0, 1.55, fz - 0.03));
    for (const sx of [-1, 1]) {
      g.add(box(THREE, cu, 0.05, H - 0.90, 0.03, sx*(W/2 - 0.14), 1.50, fz - 0.06));
    }

    /* Directory pocket, and a conduit knockout pattern on the top. */
    plate(THREE, g, metal, {x: 0, y: 0.34, z: fz + 0.03, w: 0.70, h: 0.26});
    for (const sx of [-0.45, 0, 0.45]) {
      g.add(cyl(THREE, M.dark, 0.13, 0.13, 0.04, 12, sx, H + 0.01, 0));
    }
    return g;
  }
  function buildBusway(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const cu    = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const Y = 1.4, S = 0.85;

    g.add(box(THREE, M.body, 4.4, S, S, 0, Y, 0));                             // duct run
    /* Housing seams along the top and bottom edges, as on a real extrusion. */
    for (const sy of [-1, 1]) g.add(box(THREE, M.dark, 4.4, 0.03, S + 0.02, 0, Y + sy*(S/2 - 0.06), 0));

    /* Bolted joint packs, with visible bolt heads. */
    for (const x of [-1.5, 0, 1.5]) {
      g.add(box(THREE, M.dark, 0.18, S + 0.14, S + 0.14, x, Y, 0));
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        const b = cyl(THREE, metal, 0.045, 0.045, 0.06, 6, x, Y + sy*0.34, sz*0.34);
        b.rotation.z = Math.PI/2; g.add(b);
      }
    }

    /* End flanges with the bus stack visible on the cut end. */
    for (const s of [-1, 1]) g.add(box(THREE, M.dark, 0.14, S + 0.18, S + 0.18, s*2.2, Y, 0));
    for (let i = 0; i < 4; i++) {
      g.add(box(THREE, i === 3 ? M.lit : cu, 0.03, 0.15, S - 0.24, 2.28, Y + 0.28 - i*0.19, 0));
    }

    /* Plug-in tap-off units: one fitted with a handle and cable outlet, one
       empty opening showing the stab contacts behind it. */
    g.add(box(THREE, M.body, 0.80, 0.60, 0.34, 0.75, Y - 0.62, 0.30));
    g.add(box(THREE, M.dark, 0.66, 0.46, 0.04, 0.75, Y - 0.62, 0.48));
    g.add(box(THREE, M.gold, 0.22, 0.12, 0.08, 0.75, Y - 0.62, 0.52));         // operating handle
    g.add(cyl(THREE, M.dark, 0.10, 0.10, 0.24, 10, 0.75, Y - 0.94, 0.30));     // cable outlet
    g.add(box(THREE, M.deep, 0.46, 0.34, 0.05, -0.70, Y, S/2 + 0.005));        // empty opening
    for (const sz of [-1, 1]) g.add(box(THREE, cu, 0.06, 0.22, 0.04, -0.70 + sz*0.12, Y, S/2 - 0.02));

    /* Trapeze hangers: threaded rod, channel and nuts. */
    for (const x of [-1.6, 1.6]) {
      for (const sz of [-1, 1]) {
        g.add(cyl(THREE, metal, 0.035, 0.035, 1.05, 8, x, Y + S/2 + 0.52, sz*0.42));
        g.add(cyl(THREE, M.dark, 0.06, 0.06, 0.05, 6, x, Y + S/2 + 0.04, sz*0.42));
      }
      g.add(box(THREE, metal, 0.10, 0.07, 1.05, x, Y + S/2 + 0.04, 0));        // channel
    }
    return g;
  }
  function buildCooling(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const blk   = new THREE.MeshStandardMaterial({color:0x24272C, metalness:.05, roughness:.60});
    const cu    = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const W = 2.0, H = 2.8, D = 1.5, fz = D/2;

    g.add(box(THREE, M.body, W, H, D, 0, 1.4, 0));                             // CRAH cabinet
    /* Panel seams so the cabinet reads as sheet metal rather than one block. */
    for (const sy of [0.70, 1.90]) g.add(box(THREE, M.dark, W + 0.01, 0.03, D + 0.01, 0, sy, 0));

    /* Filter section behind a louvred access door, lower front. */
    door(THREE, g, M.body, M.dark, metal, {x: 0, y: 0.52, z: fz + 0.02, w: W - 0.24, h: 0.80});
    louvers(THREE, g, blk, {n: 7, x: 0, y0: 0.24, y1: 0.80, z: fz + 0.05, w: W - 0.50, h: 0.045});

    /* Two EC fans behind a wire guard. */
    for (let i = 0; i < 2; i++) {
      const y = 1.45 + i * 0.86;
      fan(THREE, g, metal, blk, {x: 0, y: y, z: fz + 0.03, r: 0.38, blades: 7});
      for (let k = 0; k < 4; k++) {                                            // guard rings
        const r = 0.10 + k * 0.09;
        /* A wire ring, not a disc. These were solid cylinders, so the largest
           one covered the whole fan and the unit showed two grey plates where
           its fans should be. */
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 6, segs(22)), metal);
        ring.position.set(0, y, fz + 0.085); g.add(ring);
      }
      for (let k = 0; k < 4; k++) {                                            // guard spokes
        const sp = box(THREE, metal, 0.74, 0.012, 0.012, 0, y, fz + 0.085);
        sp.rotation.z = (k / 4) * Math.PI; g.add(sp);
      }
    }

    /* Chilled-water supply and return with insulation, valves and a coil. */
    for (const s of [-1, 1]) {
      g.add(cyl(THREE, M.dark, 0.17, 0.17, 1.0, 12, s*0.68, H + 0.22, -0.42));
      g.add(cyl(THREE, s > 0 ? cu : metal, 0.10, 0.10, 1.06, 10, s*0.68, H + 0.22, -0.42));
      /* isolation valve with handwheel */
      g.add(box(THREE, blk, 0.20, 0.18, 0.20, s*0.68, H + 0.52, -0.42));
      const hw = cyl(THREE, M.gold, 0.13, 0.13, 0.035, 12, s*0.68, H + 0.68, -0.42);
      hw.rotation.x = Math.PI/2; g.add(hw);
    }
    /* Coil face visible through the top-rear grille. */
    for (let i = 0; i < 8; i++) {
      g.add(box(THREE, metal, W - 0.34, 0.02, 0.05, 0, 2.30, -fz + 0.10 + i*0.06));
    }

    /* Controls panel with display, and a condensate drain stub. */
    g.add(box(THREE, M.dark, 0.46, 0.36, 0.05, W/2 - 0.36, 2.42, fz + 0.02));
    g.add(box(THREE, M.lit, 0.30, 0.16, 0.02, W/2 - 0.36, 2.46, fz + 0.05));
    g.add(cyl(THREE, metal, 0.06, 0.06, 0.22, 8, -W/2 + 0.24, 0.16, fz - 0.20).rotateX(Math.PI/2));

    /* ---- the pipework, and the parts that make it a serviceable unit ----
       The chilled-water pipes stopped in mid-air above the cabinet and never
       entered it, which is the one connection the whole machine exists to
       make: cooling load tracks the electrical load through these two pipes. */

    /* The risers already pass through the cabinet roof: they run from y =
       H-0.28 up to H+0.72 and carry their isolation valve at H+0.52. What they
       lacked was anything holding them there -- an insulated pipe standing on
       a roof with no flange, no banding and no support is the part of this
       model that reads as a drawing rather than an install. */
    const PB = H - 0.28;                                     // riser foot
    for (const sp of [-1, 1]) {
      /* Flange where the riser passes through the cabinet roof. */
      g.add(cyl(THREE, metal, 0.21, 0.21, 0.04, 16, sp*0.68, PB + 0.06, -0.42));
      /* Banding round the lagging, below the support and clear of the valve. */
      g.add(cyl(THREE, metal, 0.178, 0.178, 0.035, 16, sp*0.68, PB + 0.26, -0.42));
    }
    /* Riser support bracket off the cabinet roof, with a clamp round each pipe.
       Chilled-water pipe this size is always anchored at the unit. */
    g.add(box(THREE, metal, 1.80, 0.045, 0.09, 0, H + 0.12, -0.42));
    for (const sp of [-1, 1]) {
      g.add(box(THREE, metal, 0.07, 0.14, 0.09, sp*0.86, H + 0.05, -0.42));
      g.add(cyl(THREE, metal, 0.19, 0.19, 0.035, 16, sp*0.68, H + 0.12, -0.42));
    }

    /* Condensate pump box and its discharge line, the other pipe every one of
       these has and nobody draws. */
    g.add(box(THREE, M.deep, 0.34, 0.16, 0.22, -W/2 + 0.30, 0.30, fz - 0.10));
    tubeRun(THREE, g, metal, [[-W/2 + 0.30, 0.38, fz - 0.10],[-W/2 + 0.30, 0.62, fz - 0.02],[-W/2 + 0.62, 0.62, fz - 0.02]], 0.022);

    /* Filter differential-pressure gauge beside the controls -- the instrument
       that says when the filter section behind that door needs changing. */
    g.add(cyl(THREE, M.dark, 0.105, 0.105, 0.05, 16, -W/2 + 0.40, 2.42, fz + 0.02).rotateX(Math.PI/2));
    g.add(cyl(THREE, M.porcelain, 0.085, 0.085, 0.02, 16, -W/2 + 0.40, 2.42, fz + 0.05).rotateX(Math.PI/2));
    g.add(box(THREE, M.gold, 0.012, 0.060, 0.012, -W/2 + 0.42, 2.445, fz + 0.062));

    /* Hinges and a latch on the filter door, which had neither. */
    for (const hy of [0.26, 0.78]) {
      g.add(cyl(THREE, metal, 0.042, 0.042, 0.13, 8, -(W - 0.24)/2 + 0.03, hy, fz + 0.035));
    }
    g.add(box(THREE, metal, 0.05, 0.20, 0.05, (W - 0.24)/2 - 0.08, 0.52, fz + 0.05));

    /* Side service panel with quarter-turn fasteners. */
    g.add(box(THREE, M.dark, 0.03, H - 0.52, D - 0.30, W/2 + 0.005, 1.42, 0));
    for (const py of [0.62, 1.42, 2.22]) for (const pz of [-0.42, 0.42]) {
      g.add(cyl(THREE, metal, 0.035, 0.035, 0.03, 8, W/2 + 0.025, py, pz).rotateZ(Math.PI/2));
    }

    /* BMS/control conduit leaving the top of the cabinet. */
    tubeRun(THREE, g, M.dark, [[W/2 - 0.36, H + 0.02, 0.30],[W/2 - 0.36, H + 0.30, 0.30],[W/2 + 0.14, H + 0.30, 0.30]], 0.045, metal);

    /* Rating plate: the tonnage and the airflow are what a sizing calculation
       hands you, and this is where they live. */
    decal(THREE, g, {key:'crah-np', w:0.40, h:0.26, x: -W/2 - 0.005, y: 1.70, z: 0.10,
      ry: -Math.PI/2, cw:280, ch:180, metal:0.35, rough:0.42,
      draw: npDraw('COMPUTER-ROOM AIR HANDLER', [
        ['CAPACITY', '30 tons'],
        ['AIRFLOW',  '12,000 cfm'],
        ['CHW',      '45/57 F'],
        ['VOLTS',    '480/3/60']
      ])});

    /* Plinth with levelling feet. */
    g.add(box(THREE, M.dark, W + 0.20, 0.14, D + 0.20, 0, 0.07, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(THREE, metal, 0.05, 0.05, 0.06, 8, sx*(W/2 - 0.12), 0.17, sz*(D/2 - 0.12)));
    }

    /* Named points for the viewer's callouts (opts.callouts). */
    callout(THREE, g, 'EC fans', 0, 1.45, 0.86);
    callout(THREE, g, 'Filter section', 0, 0.52, 0.82);
    callout(THREE, g, 'Chilled water pipes', 0.68, 3.3, -0.42);
    callout(THREE, g, 'Controller', 0.64, 2.44, 0.8);
    return g;
  }

  /* ---------- through-hole PCB parts ----------
     For the PCB Layout tool, whose palette is footprints on a grid: a learner
     placing "DIP-8" or "electrolytic cap" benefits from seeing the physical
     part the footprint belongs to. All are drawn standing on a small board
     stub so the relative sizes read honestly against each other. */
  const PCB_GREEN = 0x1E6B3A, LEAD = 0xC8CCD2, BLACK = 0x1A1A1E;

  function pcbBase(THREE, w, d){
    const g = new THREE.Group();
    const W = w || 3.0, D = d || 2.2;
    const m = new THREE.MeshStandardMaterial({color:PCB_GREEN, metalness:.15, roughness:.75});
    const dk = new THREE.MeshStandardMaterial({color:0x14512B, metalness:.15, roughness:.8});
    g.add(box(THREE, m, W, 0.10, D, 0, -0.05, 0));
    /* Copper traces running off toward the board edge, so the stub reads as a
       fragment of a real board rather than a green coaster the part sits on. */
    const cu = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.8, roughness:.4});
    for (let i = 0; i < 3; i++) {
      const z = (i - 1) * (D * 0.28);
      g.add(box(THREE, cu, W * 0.42, 0.012, 0.07, -W * 0.28, 0.005, z));
      g.add(box(THREE, cu, W * 0.42, 0.012, 0.07,  W * 0.28, 0.005, z + 0.11));
    }
    g.add(box(THREE, dk, W - 0.16, 0.012, 0.03, 0, 0.006,  D/2 - 0.10));  // silkscreen edge
    g.add(box(THREE, dk, W - 0.16, 0.012, 0.03, 0, 0.006, -D/2 + 0.10));
    return g;
  }
  function leadMat(THREE){ return new THREE.MeshStandardMaterial({color:LEAD, metalness:.9, roughness:.28}); }
  function goldMat(THREE){ return new THREE.MeshStandardMaterial({color:0xD4A72C, metalness:.85, roughness:.3}); }
  /* An annular solder pad where a lead enters the board. Drawn as a shallow
     ring rather than a disc so the plated hole reads at the centre. */
  function pad(THREE, g, x, z, r){
    const cu = new THREE.MeshStandardMaterial({color:0xC08A4A, metalness:.85, roughness:.35});
    const ring = new THREE.Mesh(new THREE.RingGeometry((r||0.075), (r||0.075)+0.075, 16), cu);
    ring.rotation.x = -Math.PI/2; ring.position.set(x, 0.008, z);
    ring.material.side = THREE.DoubleSide; g.add(ring);
  }
  /* White silkscreen outline of the part footprint. */
  function silk(THREE, g, x, z, w, d){
    const m = new THREE.MeshStandardMaterial({color:0xE8ECEF, roughness:.85});
    const t = 0.035;
    g.add(box(THREE, m, w, 0.012, t, x, 0.007, z - d/2));
    g.add(box(THREE, m, w, 0.012, t, x, 0.007, z + d/2));
    g.add(box(THREE, m, t, 0.012, d, x - w/2, 0.007, z));
    g.add(box(THREE, m, t, 0.012, d, x + w/2, 0.007, z));
  }
  /* A lead running from `top` straight down through the board.
     Takes the TOP, not a length: an axial part's lead has to stop exactly at
     the body it leaves, and sizing by length instead made the leads overshoot
     above the resistor and diode bodies like antennae. */
  const PCB_UNDER = -0.35;
  function pin(THREE, m, x, z, top){
    const t = (top == null ? 0.5 : top);
    const h = t - PCB_UNDER;
    return cyl(THREE, m, 0.045,0.045, h, 8, x, PCB_UNDER + h/2, z);
  }
  /* pin + its solder pad, which is what you actually see on a populated board. */
  function pinAt(THREE, g, m, x, z, top){ g.add(pin(THREE, m, x, z, top)); pad(THREE, g, x, z); }

  function buildResistor(THREE){
    const g = pcbBase(THREE, 3.2, 1.6);
    const body = new THREE.MeshStandardMaterial({color:0xC9AE86, metalness:.1, roughness:.7});
    const L = leadMat(THREE);
    const b = cyl(THREE, body, 0.26,0.26, 1.15, 18, 0, 0.72, 0); b.rotation.z = Math.PI/2; g.add(b);
    for (const s of [-1,1]) {                                   // end caps
      const c = cyl(THREE, body, 0.29,0.29, 0.12, 18, s*0.58, 0.72, 0); c.rotation.z = Math.PI/2; g.add(c);
    }
    // colour bands -- what you actually read the value off
    const bands = [[-0.30,0x5A3A1E],[-0.12,0x1A1A1E],[0.06,0xB03030],[0.34,0xC8A42C]];
    bands.forEach(function(bd){
      const r = cyl(THREE, new THREE.MeshStandardMaterial({color:bd[1], roughness:.6}), 0.275,0.275, 0.11, 18, bd[0], 0.72, 0);
      r.rotation.z = Math.PI/2; g.add(r);
    });
    for (const s of [-1,1]) {                                   // axial leads, bent down
      const run = cyl(THREE, L, 0.045,0.045, 0.75, 8, s*1.02, 0.72, 0); run.rotation.z = Math.PI/2; g.add(run);
      /* the radius of the bend, so the lead turns rather than meeting at a corner */
      const knee = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.045, 6, 10, Math.PI/2), L);
      knee.position.set(s*1.28, 0.62, 0); knee.rotation.x = Math.PI/2;
      knee.rotation.z = s > 0 ? 0 : Math.PI/2; g.add(knee);
      pinAt(THREE, g, L, s*1.38, 0, 0.62);
    }
    silk(THREE, g, 0, 0, 2.9, 0.75);
    return g;
  }

  function buildCeramicCap(THREE){
    const g = pcbBase(THREE, 2.2, 1.6);
    const body = new THREE.MeshStandardMaterial({color:0xC98A2E, metalness:.1, roughness:.72});
    const L = leadMat(THREE);
    const disc = cyl(THREE, body, 0.52,0.52, 0.20, 22, 0, 0.86, 0);   // the classic disc
    disc.rotation.x = Math.PI/2; g.add(disc);
    /* Rounded rim on the dipped body. A disc cap is epoxy dipped, not machined,
       so the edge is domed rather than square. Built from a torus around the
       disc's own axis -- the shoulder must share the disc's orientation, or it
       reads as an unrelated lump stuck to the front. */
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.10, 8, 24), body);
    rim.position.set(0, 0.86, 0); g.add(rim);
    /* The narrow neck the two leads leave through, at the bottom of the dip. */
    const neck = cyl(THREE, body, 0.30, 0.22, 0.30, 16, 0, 0.46, 0); g.add(neck);
    /* Printed value code -- "104" is the marking a learner reads off the part. */
    const ink = new THREE.MeshStandardMaterial({color:0x22160A, roughness:.8});
    for (let i=0;i<3;i++) g.add(box(THREE, ink, 0.09, 0.20, 0.03, -0.15 + i*0.15, 0.92, 0.11));
    for (const s of [-1,1]) {
      g.add(cyl(THREE, L, 0.045,0.045, 0.24, 8, s*0.22, 0.62, 0));    // lead inside the shoulder
      pinAt(THREE, g, L, s*0.22, 0, 0.62);
    }
    silk(THREE, g, 0, 0, 1.25, 0.55);
    return g;
  }

  function buildElectrolyticCap(THREE){
    const g = pcbBase(THREE, 2.2, 2.0);
    const can = new THREE.MeshStandardMaterial({color:0x243A5E, metalness:.5, roughness:.4});
    const stripe = new THREE.MeshStandardMaterial({color:0xD8DEE6, metalness:.2, roughness:.6});
    const L = leadMat(THREE);
    g.add(cyl(THREE, can, 0.55,0.55, 1.6, 24, 0, 0.85, 0));           // upright can
    g.add(cyl(THREE, can, 0.57,0.57, 0.06, 24, 0, 1.63, 0));          // crimped top
    /* Polarity stripe. Drawn as a curved cylinder SEGMENT wrapping ~70deg of
       the can rather than a flat plate on one face: a flat plate disappears
       entirely once the model is rotated, and the stripe is the one feature
       that makes this part different from a non-polarised one. */
    const st = new THREE.Mesh(
      new THREE.CylinderGeometry(0.565, 0.565, 1.45, 24, 1, true, -0.62, 1.24), stripe);
    st.position.y = 0.85; g.add(st);
    /* Minus signs down the stripe -- the actual polarity marking, not just a band. */
    const ink = new THREE.MeshStandardMaterial({color:0x1A2233, roughness:.8});
    for (let i=0;i<4;i++) g.add(box(THREE, ink, 0.20, 0.05, 0.03, 0, 0.34 + i*0.34, 0.568));

    /* Pressure-relief vent scored into the crimped top as a K. Every aluminium
       electrolytic has one; it is the feature that identifies the top face. */
    const score = new THREE.MeshStandardMaterial({color:0x101821, roughness:.7});
    g.add(box(THREE, score, 0.52, 0.03, 0.055, 0, 1.67, 0));
    for (const s of [-1,1]) {
      const arm = box(THREE, score, 0.34, 0.03, 0.055, 0.13, 1.67, s*0.13);
      arm.rotation.y = s * 0.9; g.add(arm);
    }
    /* Sleeve seam, and the moulded insulating base disc the can sits on. */
    g.add(box(THREE, new THREE.MeshStandardMaterial({color:0x18293F, roughness:.7}),
              0.04, 1.45, 0.03, 0, 0.85, -0.56));
    g.add(cyl(THREE, new THREE.MeshStandardMaterial({color:0x1C1C22, roughness:.75}),
              0.57, 0.57, 0.10, 24, 0, 0.10, 0));
    for (const s of [-1,1]) pinAt(THREE, g, L, s*0.20, 0, 0.06);
    return g;
  }

  function buildLED(THREE){
    const g = pcbBase(THREE, 2.0, 1.6);
    const lens = new THREE.MeshStandardMaterial({color:0xD03A3A, emissive:0xD03A3A, emissiveIntensity:.45, roughness:.25, transparent:true, opacity:.9});
    const L = leadMat(THREE);
    g.add(cyl(THREE, lens, 0.34,0.34, 0.75, 20, 0, 0.72, 0));          // body
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 12, 0, Math.PI*2, 0, Math.PI/2), lens);
    dome.position.y = 1.10; g.add(dome);
    g.add(cyl(THREE, lens, 0.40,0.40, 0.08, 20, 0, 0.38, 0));          // the flange with the flat
    /* The flat on the flange marks the cathode. Getting an LED backwards is the
       classic beginner mistake, so the flat is modelled rather than implied. */
    g.add(box(THREE, lens, 0.10, 0.08, 0.44, -0.36, 0.38, 0));
    /* Lead frame inside the epoxy: the big anvil is the cathode. */
    const frame = new THREE.MeshStandardMaterial({color:0x8A9099, metalness:.85, roughness:.35});
    g.add(box(THREE, frame, 0.20, 0.16, 0.20, -0.16, 0.62, 0));        // reflector cup
    g.add(box(THREE, frame, 0.07, 0.34, 0.07,  0.16, 0.54, 0));        // anode post
    pinAt(THREE, g, L, -0.16, 0, 0.42);                                // cathode (short)
    pinAt(THREE, g, L,  0.16, 0, 0.54);                                // anode  (long)
    silk(THREE, g, 0, 0, 0.9, 0.5);
    return g;
  }

  function buildDiode(THREE){
    const g = pcbBase(THREE, 2.8, 1.6);
    const body = new THREE.MeshStandardMaterial({color:BLACK, metalness:.3, roughness:.55});
    const band = new THREE.MeshStandardMaterial({color:0xE4E8ED, metalness:.2, roughness:.5});
    const L = leadMat(THREE);
    const b = cyl(THREE, body, 0.24,0.24, 0.95, 18, 0, 0.72, 0); b.rotation.z = Math.PI/2; g.add(b);
    const bd = cyl(THREE, band, 0.25,0.25, 0.14, 18, -0.30, 0.72, 0);  // cathode band
    bd.rotation.z = Math.PI/2; g.add(bd);
    /* Rounded glass-body ends, so it reads as a DO-41 rather than a cut rod. */
    for (const s of [-1,1]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 8, 0, Math.PI*2, 0, Math.PI/2), body);
      cap.position.set(s*0.475, 0.72, 0); cap.rotation.z = s*Math.PI/2; g.add(cap);
    }
    for (const s of [-1,1]) {
      const run = cyl(THREE, L, 0.045,0.045, 0.6, 8, s*0.78, 0.72, 0); run.rotation.z = Math.PI/2; g.add(run);
      const knee = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.045, 6, 10, Math.PI/2), L);
      knee.position.set(s*0.96, 0.62, 0); knee.rotation.x = Math.PI/2;
      knee.rotation.z = s > 0 ? 0 : Math.PI/2; g.add(knee);
      pinAt(THREE, g, L, s*1.06, 0, 0.62);
    }
    silk(THREE, g, 0, 0, 2.3, 0.7);
    return g;
  }

  function buildPushButton(THREE){
    const g = pcbBase(THREE, 2.4, 2.4);
    const body = new THREE.MeshStandardMaterial({color:BLACK, metalness:.25, roughness:.6});
    const cap  = new THREE.MeshStandardMaterial({color:0xC23B3B, metalness:.2, roughness:.5});
    const L = leadMat(THREE);
    const metal = new THREE.MeshStandardMaterial({color:0xC6CCD2, metalness:.90, roughness:.22});
    g.add(box(THREE, body, 1.25, 0.5, 1.25, 0, 0.25, 0));              // tactile switch body
    /* Stainless top plate with the dimple the dome snaps against, and the
       moulded ring the plunger rides in. */
    g.add(box(THREE, metal, 1.18, 0.05, 1.18, 0, 0.52, 0));
    g.add(cyl(THREE, body, 0.34,0.34, 0.10, 18, 0, 0.58, 0));
    g.add(cyl(THREE, cap, 0.24,0.24, 0.32, 18, 0, 0.72, 0));           // plunger
    g.add(cyl(THREE, cap, 0.26,0.22, 0.05, 18, 0, 0.90, 0));           // domed cap face
    /* Corner chamfers and the moulding seam around the body sides. */
    g.add(box(THREE, new THREE.MeshStandardMaterial({color:0x0E0E12, roughness:.7}),
              1.27, 0.03, 1.27, 0, 0.30, 0));
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      /* Gull-wing shoulder out of the body before the lead turns down. */
      g.add(box(THREE, L, 0.20, 0.05, 0.14, sx*0.66, 0.16, sz*0.45));
      pinAt(THREE, g, L, sx*0.72, sz*0.45, 0.16);
    }
    silk(THREE, g, 0, 0, 1.45, 1.45);
    return g;
  }

  function buildHeader(THREE, n, vertical){
    const g = pcbBase(THREE, Math.max(2.0, n*0.55 + 0.9), 1.6);
    const body = new THREE.MeshStandardMaterial({color:BLACK, metalness:.2, roughness:.65});
    const G = goldMat(THREE);
    const pitch = 0.55, span = (n-1)*pitch;
    g.add(box(THREE, body, span + 0.5, 0.42, 0.5, 0, 0.21, 0));        // plastic strip
    const dk = new THREE.MeshStandardMaterial({color:0x0D0D11, roughness:.75});
    for (let i=0;i<n;i++){
      const x = -span/2 + i*pitch;
      g.add(box(THREE, G, 0.13, 1.35, 0.13, x, 0.62, 0));              // square pin above
      g.add(box(THREE, G, 0.11, 0.55, 0.11, x, -0.20, 0));             // and below the board
      /* Chamfered pin tip, the moulded well each pin sits in, and a pad. */
      g.add(box(THREE, G, 0.09, 0.09, 0.09, x, 1.32, 0));
      g.add(box(THREE, dk, 0.26, 0.05, 0.26, x, 0.44, 0));
      pad(THREE, g, x, 0, 0.065);
    }
    /* Pin-1 square silkscreen marker: on a header this is the only orientation cue. */
    const wht = new THREE.MeshStandardMaterial({color:0xE8ECEF, roughness:.85});
    g.add(box(THREE, wht, 0.24, 0.012, 0.24, -span/2, 0.008, 0.44));
    silk(THREE, g, 0, 0, span + 0.62, 0.62);
    return g;
  }

  function buildDIP8(THREE){
    const g = pcbBase(THREE, 3.0, 2.6);
    const body = new THREE.MeshStandardMaterial({color:0x26262C, metalness:.25, roughness:.6});
    const L = leadMat(THREE);
    const W = 1.5, D = 1.9, H = 0.42;
    g.add(box(THREE, body, W, H, D, 0, 0.30 + H/2, 0));
    // pin-1 notch at one end -- the only thing telling you which way round it goes
    const notch = cyl(THREE, new THREE.MeshStandardMaterial({color:0x141418, roughness:.7}), 0.17,0.17, 0.06, 16, -W/2 + 0.08, 0.30 + H, 0);
    notch.rotation.x = Math.PI/2; g.add(notch);
    g.add(cyl(THREE, new THREE.MeshStandardMaterial({color:0x141418, roughness:.7}), 0.10,0.10, 0.05, 14, -W/2 + 0.30, 0.30 + H, -D/2 + 0.28).rotateX(Math.PI/2));
    /* Moulding parting line round the package sides, and the two ejector-pin
       dimples on top -- small, but they are why a real DIP never looks like a
       plain extruded block. */
    const seam = new THREE.MeshStandardMaterial({color:0x141418, roughness:.75});
    g.add(box(THREE, seam, W + 0.015, 0.025, D + 0.015, 0, 0.30 + H/2, 0));
    for (const sz of [-1,1]) {
      g.add(cyl(THREE, seam, 0.07,0.07, 0.04, 12, W/2 - 0.34, 0.30 + H, sz*(D/2 - 0.34)).rotateX(Math.PI/2));
    }
    /* Printed part marking on the top face. */
    const ink = new THREE.MeshStandardMaterial({color:0xB9BEC6, roughness:.8});
    for (let r=0;r<2;r++) for (let c=0;c<4;c++) {
      g.add(box(THREE, ink, 0.11, 0.02, 0.16, -0.36 + c*0.24, 0.30 + H + 0.015, -0.28 + r*0.34));
    }
    for (let i=0;i<4;i++){                                             // 4 pins a side
      const z = -D/2 + 0.32 + i*0.42;
      for (const sx of [-1,1]) {
        g.add(box(THREE, L, 0.28, 0.06, 0.16, sx*(W/2 + 0.11), 0.42, z));   // shoulder
        g.add(box(THREE, L, 0.09, 0.75, 0.16, sx*(W/2 + 0.22), 0.06, z));   // leg
        g.add(box(THREE, L, 0.07, 0.10, 0.11, sx*(W/2 + 0.22), -0.32, z));  // tapered tip
        pad(THREE, g, sx*(W/2 + 0.22), z, 0.06);
      }
    }
    silk(THREE, g, 0, 0, W + 0.20, D + 0.20);
    return g;
  }

  function buildPotentiometer(THREE){
    const g = pcbBase(THREE, 2.6, 2.2);
    const can = new THREE.MeshStandardMaterial({color:0x2C3E56, metalness:.55, roughness:.42});
    const shaft = new THREE.MeshStandardMaterial({color:0xD8DEE6, metalness:.7, roughness:.35});
    const L = leadMat(THREE);
    const dk = new THREE.MeshStandardMaterial({color:0x1A2432, roughness:.7});
    g.add(cyl(THREE, can, 0.70,0.70, 0.45, 24, 0, 0.28, 0));           // round body
    /* Crimped rim round the can, and the moulded base the pins come through. */
    g.add(cyl(THREE, shaft, 0.72,0.72, 0.06, 24, 0, 0.48, 0));
    g.add(cyl(THREE, dk, 0.74,0.74, 0.10, 24, 0, 0.06, 0));
    /* Rotation-limit stops and the printed resistance code on the can face. */
    for (const s of [-1,1]) g.add(box(THREE, dk, 0.10, 0.06, 0.10, s*0.46, 0.53, -0.46));
    const ink = new THREE.MeshStandardMaterial({color:0xD4D9DF, roughness:.8});
    for (let i=0;i<4;i++) g.add(box(THREE, ink, 0.09, 0.03, 0.16, -0.24 + i*0.16, 0.30, 0.705));

    g.add(cyl(THREE, shaft, 0.16,0.16, 0.85, 16, 0, 0.90, 0));         // adjustment shaft
    g.add(cyl(THREE, shaft, 0.24,0.24, 0.08, 16, 0, 1.28, 0));         // slotted head
    const slot = box(THREE, new THREE.MeshStandardMaterial({color:0x3A3A42, roughness:.6}), 0.42, 0.06, 0.07, 0, 1.33, 0);
    g.add(slot);                                                       // screwdriver slot
    /* An index mark on the head, so which way it has been turned is readable. */
    g.add(box(THREE, ink, 0.06, 0.03, 0.10, 0.15, 1.33, 0.12));
    for (const x of [-0.5, 0, 0.5]) pinAt(THREE, g, L, x, 0.45, 0.10);  // wiper + two ends
    silk(THREE, g, 0, 0.22, 1.6, 1.3);
    return g;
  }

  /* ---------- calculator subjects ---------- */

  function buildPVModule(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({color:0x16305A, metalness:.55, roughness:.28});
    const frame = new THREE.MeshStandardMaterial({color:0xAAB2B8, metalness:.68, roughness:.50});
    const panel = new THREE.Group();
    const PW = 3.6, PH = 2.2;
    panel.add(box(THREE, frame, PW+0.14, 0.10, PH+0.14, 0, 0, 0));
    panel.add(box(THREE, glass, PW, 0.05, PH, 0, 0.06, 0));
    for (let r=0;r<4;r++) for (let c=0;c<6;c++){          // cell grid
      panel.add(box(THREE, M.deep, PW/6*0.86, 0.012, PH/4*0.86, (c-2.5)*(PW/6), 0.09, (r-1.5)*(PH/4)));
    }
    panel.rotation.x = -0.52;                              // fixed tilt
    panel.position.y = 1.35;
    g.add(panel);
    // racking
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      const post = box(THREE, frame, 0.12, sz>0?1.0:1.9, 0.12, sx*1.5, (sz>0?0.5:0.95), sz*0.9);
      g.add(post);
    }
    g.add(box(THREE, M.dark, 3.6, 0.10, 2.4, 0, 0.03, 0));
    return g;
  }

  function buildGroundRod(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    /* The soil MUST be see-through: the buried length is the entire point of
       this shape, and an opaque block hides it completely. */
    const soil = new THREE.MeshStandardMaterial({
      color:0x6B5540, metalness:.0, roughness:.95,
      transparent:true, opacity:.34, side:THREE.DoubleSide, depthWrite:false });
    const cu   = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const grade = new THREE.MeshStandardMaterial({color:0x7A6349, roughness:.9});
    g.add(box(THREE, soil, 3.2, 1.9, 2.0, 0, -0.95, 0));
    g.add(box(THREE, grade, 3.24, 0.05, 2.04, 0, 0.0, 0));       // grade line
    g.add(cyl(THREE, cu, 0.10,0.10, 2.9, 14, 0, -0.55, 0));      // the rod, mostly below grade
    g.add(cyl(THREE, cu, 0.13,0.13, 0.12, 14, 0, 0.92, 0));      // exposed top
    // acorn clamp + grounding electrode conductor heading off to the service
    g.add(box(THREE, M.dark, 0.30, 0.26, 0.30, 0, 0.74, 0));
    const gec = cyl(THREE, cu, 0.07,0.07, 1.5, 12, 0.75, 0.86, 0);
    gec.rotation.z = Math.PI/2; gec.rotation.y = 0.15; g.add(gec);
    return g;
  }

  function buildPFCapacitor(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    /* Cabinet built as a SHELL with an open front, not a solid box: the staged
       cans inside are the thing worth showing, and a solid body hides them no
       matter how transparent the door is. */
    const W = 2.0, H = 2.6, D = 1.2, t = 0.07;
    g.add(box(THREE, M.body, W, H, t, 0, 1.3, -D/2));             // back
    for (const s of [-1,1]) g.add(box(THREE, M.body, t, H, D, s*W/2, 1.3, 0));  // sides
    g.add(box(THREE, M.body, W, t, D, 0, 1.3 + H/2, 0));          // top
    g.add(box(THREE, M.body, W, t, D, 0, 1.3 - H/2, 0));          // bottom
    const glass = new THREE.MeshStandardMaterial({
      color:0x9FB3CC, metalness:.4, roughness:.45,
      transparent:true, opacity:.20, side:THREE.DoubleSide, depthWrite:false });
    g.add(box(THREE, glass, W - 0.12, H - 0.18, 0.04, 0, 1.3, D/2));   // door
    // capacitor cans behind the door, in stages -- PF correction is switched in steps
    for (let r=0;r<3;r++) for (const x of [-0.42, 0.42]) {
      g.add(cyl(THREE, M.deep, 0.26,0.26, 0.62, 16, x, 0.55 + r*0.78, 0.05));
      g.add(cyl(THREE, M.dark, 0.28,0.28, 0.05, 16, x, 0.87 + r*0.78, 0.05));  // can top
    }
    // stage indicator per step -- PF correction switches in, not all at once
    for (let r=0;r<3;r++) g.add(box(THREE, M.gold, 0.14, 0.06, 0.03, 0.86, 0.55 + r*0.78, D/2 + 0.03));
    g.add(box(THREE, M.dark, 2.2, 0.14, 1.4, 0, 0.07, 0));
    return g;
  }

  /* ================= mechanical plant (Nov 2026) =================
     The cooling side of a data center is as much pumps, chillers and heat
     rejection as it is CRAHs, and none of it had a model. Same vocabulary as
     everything above: sector colour on the painted casing, real materials on
     the parts that are not painted, and every pipe going somewhere. */

  /* A flanged pipe stub along +/-X or +/-Y, with a bolted flange at the open end. */
  function flangedStub(THREE, g, pipeM, flangeM, boltM, from, to, r){
    tube(THREE, g, pipeM, from, to, r, 16);
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.55, r * 1.55, 0.07, segs(18)), flangeM);
    fl.position.set(to[0], to[1], to[2]);
    const d = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
    fl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    g.add(fl);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.10, 6), boltM);
      /* a ring of bolts in the plane of the flange */
      const u = Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const v = new THREE.Vector3().crossVectors(d, u).normalize();
      const w = new THREE.Vector3().crossVectors(d, v).normalize();
      b.position.set(
        to[0] + (v.x * Math.cos(a) + w.x * Math.sin(a)) * r * 1.28,
        to[1] + (v.y * Math.cos(a) + w.y * Math.sin(a)) * r * 1.28,
        to[2] + (v.z * Math.cos(a) + w.z * Math.sin(a)) * r * 1.28);
      b.quaternion.copy(fl.quaternion);
      g.add(b);
    }
  }

  /* Base-mounted end-suction centrifugal pump: motor, coupling guard, bearing
     frame and volute on one steel baseplate. Suction enters on the shaft axis,
     discharge leaves vertically -- the arrangement the name describes. */
  function buildPump(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const AX = 1.05;                                   // shaft centreline height

    /* Baseplate on a concrete inertia pad. */
    g.add(box(THREE, M.concrete, 4.3, 0.22, 1.7, 0, 0.11, 0));
    g.add(box(THREE, M.dark, 4.0, 0.12, 1.3, 0, 0.28, 0));
    for (const x of [-1.8, -0.6, 0.6, 1.8]) for (const z of [-0.56, 0.56])
      g.add(cyl(THREE, M.steel, 0.05, 0.05, 0.10, 6, x, 0.37, z));              // anchor bolts

    /* Motor, left: finned frame, end bells, terminal box, fan cowl. */
    const mx = -1.05;
    const frame = cyl(THREE, M.castIron, 0.52, 0.52, 1.30, 24, mx, AX, 0);
    frame.rotation.z = Math.PI / 2; g.add(frame);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.add(box(THREE, M.castIron, 1.22, 0.07, 0.05, mx, AX + Math.sin(a) * 0.55, Math.cos(a) * 0.55));
    }
    for (const s of [-1, 1]) {
      const eb = cyl(THREE, M.dark, 0.55, 0.50, 0.16, 22, mx + s * 0.72, AX, 0);
      eb.rotation.z = Math.PI / 2; g.add(eb);
    }
    const cowl = cyl(THREE, M.dark, 0.52, 0.46, 0.34, 20, mx - 0.96, AX, 0);
    cowl.rotation.z = Math.PI / 2; g.add(cowl);
    g.add(box(THREE, M.dark, 0.44, 0.26, 0.40, mx, AX + 0.62, 0));              // terminal box
    g.add(cyl(THREE, M.brass, 0.05, 0.05, 0.12, 8, mx, AX + 0.62, 0.26).rotateX(Math.PI / 2));  // gland
    for (const z of [-0.36, 0.36]) g.add(box(THREE, M.castIron, 0.9, 0.5, 0.12, mx, 0.58, z));   // feet

    /* Coupling guard between motor and pump. */
    const guard = cyl(THREE, M.gold, 0.30, 0.30, 0.52, 18, 0.02, AX, 0);
    guard.rotation.z = Math.PI / 2; g.add(guard);
    g.add(box(THREE, M.gold, 0.52, 0.42, 0.62, 0.02, 0.62, 0));

    /* Bearing frame, then the volute casing in the sector colour. */
    const bf = cyl(THREE, M.castIron, 0.30, 0.34, 0.62, 18, 0.62, AX, 0);
    bf.rotation.z = Math.PI / 2; g.add(bf);
    g.add(box(THREE, M.castIron, 0.36, 0.62, 0.50, 0.62, 0.62, 0));             // frame foot
    const vol = cyl(THREE, M.body, 0.74, 0.74, 0.46, 30, 1.18, AX, 0);
    vol.rotation.z = Math.PI / 2; g.add(vol);
    const back = cyl(THREE, M.body, 0.60, 0.74, 0.14, 26, 0.90, AX, 0);
    back.rotation.z = Math.PI / 2; g.add(back);
    /* casing bolts are a ring in the YZ plane, so place them by hand */
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const b = cyl(THREE, M.steel, 0.035, 0.035, 0.06, 6, 1.43, AX + Math.sin(a) * 0.64, Math.cos(a) * 0.64);
      b.rotation.z = Math.PI / 2; g.add(b);
    }
    g.add(box(THREE, M.body, 0.40, 0.42, 0.9, 1.18, 0.55, 0));                  // casing foot

    /* Suction on the shaft axis, discharge tangential and vertical. */
    flangedStub(THREE, g, M.body, M.body, M.steel, [1.40, AX, 0], [2.02, AX, 0], 0.30);
    flangedStub(THREE, g, M.body, M.body, M.steel, [1.18, AX + 0.50, 0.30], [1.18, AX + 1.25, 0.30], 0.24);
    /* Gauge tapping and drain plug. */
    tube(THREE, g, M.brass, [1.18, AX + 0.95, 0.54], [1.18, AX + 0.95, 0.74], 0.025, 8);
    const gauge = cyl(THREE, M.stainless, 0.11, 0.11, 0.05, 16, 1.18, AX + 0.95, 0.78);
    gauge.rotation.x = Math.PI / 2; g.add(gauge);
    g.add(cyl(THREE, M.brass, 0.05, 0.05, 0.08, 6, 1.18, AX - 0.76, 0));

    decal(THREE, g, {key: 'pump-np', w: 0.34, h: 0.22, x: mx, y: AX + 0.05, z: 0.605, cw: 280, ch: 180, metal: 0.35, rough: 0.42,
      draw: npDraw('CENTRIFUGAL PUMP', [['FLOW', '500 GPM'], ['HEAD', '80 FT'], ['MOTOR', '15 HP']])});
    return g;
  }

  /* Air-cooled chiller: a long skid with V-bank condenser coils and a row of
     fans on top, compressors and the evaporator barrel underneath. */
  function buildChiller(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const blk = new THREE.MeshStandardMaterial({color: 0x1E2226, metalness: .1, roughness: .7});
    const fin = new THREE.MeshStandardMaterial({color: 0x8F99A3, metalness: .75, roughness: .45});
    const L = 4.6, W = 1.9, H = 2.5;

    g.add(box(THREE, M.concrete, L + 0.5, 0.18, W + 0.5, 0, 0.09, 0));
    for (const z of [-W / 2 + 0.06, W / 2 - 0.06]) g.add(box(THREE, M.dark, L, 0.18, 0.12, 0, 0.27, z));   // base rails
    for (const x of [-L / 2 + 0.06, 0, L / 2 - 0.06]) g.add(box(THREE, M.dark, 0.12, 0.18, W, x, 0.27, 0));

    /* Corner and intermediate posts carrying the fan deck. */
    for (const x of [-L / 2 + 0.06, -L / 6, L / 6, L / 2 - 0.06]) for (const z of [-W / 2 + 0.06, W / 2 - 0.06])
      g.add(box(THREE, M.body, 0.10, H - 0.36, 0.10, x, 0.36 + (H - 0.36) / 2, z));

    /* Condenser coil slabs down both long sides, upper two thirds. */
    const coilH = 1.25, coilY = H - 0.30 - coilH / 2;
    for (const s of [-1, 1]) {
      g.add(box(THREE, fin, L - 0.3, coilH, 0.10, 0, coilY, s * (W / 2 - 0.10)));
      for (let i = 0; i < 46; i++)                                                 // fin texture
        g.add(box(THREE, blk, 0.012, coilH - 0.06, 0.012, -L / 2 + 0.22 + i * ((L - 0.44) / 45), coilY, s * (W / 2 - 0.04)));
      tubeRun(THREE, g, M.copper, [[-L / 2 + 0.20, coilY + coilH / 2 - 0.08, s * (W / 2 - 0.22)], [L / 2 - 0.20, coilY + coilH / 2 - 0.08, s * (W / 2 - 0.22)]], 0.04);
    }

    /* Fan deck with a row of condenser fans, each in a short stack with a guard. */
    g.add(box(THREE, M.body, L, 0.10, W, 0, H - 0.24, 0));
    for (let i = 0; i < 4; i++) {
      const x = -L / 2 + L / 8 + i * (L / 4);
      g.add(cyl(THREE, M.body, 0.50, 0.54, 0.24, 26, x, H - 0.08, 0));           // stack
      g.add(cyl(THREE, blk, 0.46, 0.46, 0.02, 24, x, H - 0.06, 0));              // dark throat
      g.add(cyl(THREE, M.steel, 0.12, 0.12, 0.10, 12, x, H + 0.00, 0));          // hub
      for (let k = 0; k < 5; k++) {
        const bl = box(THREE, M.galv, 0.82, 0.02, 0.16, x, H - 0.01, 0);
        bl.rotation.y = (k / 5) * Math.PI; bl.rotation.x = 0.18; g.add(bl);
      }
      for (let k = 1; k <= 3; k++) {                                              // guard rings
        const r = k * 0.155;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, segs(20)), M.steel);
        ring.rotation.x = Math.PI / 2; ring.position.set(x, H + 0.06, 0); g.add(ring);
      }
    }

    /* Below the coils: evaporator barrel, two compressors, control panel. */
    const evap = cyl(THREE, blk, 0.34, 0.34, L - 1.2, 22, 0.25, 0.80, -0.38);
    evap.rotation.z = Math.PI / 2; g.add(evap);
    for (const s of [-1, 1]) {
      const head = cyl(THREE, M.dark, 0.36, 0.36, 0.10, 22, 0.25 + s * (L - 1.2) / 2, 0.80, -0.38);
      head.rotation.z = Math.PI / 2; g.add(head);
    }
    for (const x of [-0.2, 1.15]) {
      const c = cyl(THREE, M.castIron, 0.30, 0.30, 0.95, 20, x, 0.78, 0.36);
      c.rotation.z = Math.PI / 2; g.add(c);
      g.add(box(THREE, M.castIron, 0.30, 0.22, 0.30, x, 1.10, 0.36));             // terminal box
      tubeRun(THREE, g, M.copper, [[x + 0.3, 1.0, 0.36], [x + 0.3, 1.25, 0.36], [x + 0.3, 1.25, W / 2 - 0.22]], 0.035);
    }
    g.add(box(THREE, M.body, 0.75, 1.55, W - 0.3, -L / 2 + 0.52, 1.20, 0));        // control / starter panel
    g.add(box(THREE, M.dark, 0.012, 1.40, 0.02, -L / 2 + 0.14, 1.20, 0));              // door seam
    g.add(box(THREE, M.gold, 0.02, 0.10, 0.10, -L / 2 + 0.135, 1.72, -0.5));
    g.add(box(THREE, M.lit, 0.02, 0.08, 0.08, -L / 2 + 0.135, 1.72, -0.3));
    g.add(box(THREE, blk, 0.02, 0.26, 0.38, -L / 2 + 0.135, 1.50, 0.35));         // HMI

    /* Chilled-water supply and return, flanged, at the far end. */
    flangedStub(THREE, g, M.steel, M.steel, M.stainless, [L / 2 - 0.6, 0.95, -0.38], [L / 2 + 0.28, 0.95, -0.38], 0.15);
    flangedStub(THREE, g, M.steel, M.steel, M.stainless, [L / 2 - 0.6, 0.62, -0.38], [L / 2 + 0.28, 0.62, -0.38], 0.15);

    decal(THREE, g, {key: 'chiller-np', w: 0.40, h: 0.26, x: -L / 2 + 0.138, y: 0.86, z: -0.36, ry: -Math.PI / 2, cw: 280, ch: 180, metal: 0.35, rough: 0.42,
      draw: npDraw('AIR-COOLED CHILLER', [['CAPACITY', '150 TONS'], ['LWT', '44 F'], ['REFRIG', 'R-513A']])});
    return g;
  }

  /* Induced-draft cooling tower: casing, louvred air inlets low down, fill
     visible behind them, a fan in a velocity-recovery stack on top, and the
     cold-water basin with its supply and return. */
  function buildCoolingTower(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const blk = new THREE.MeshStandardMaterial({color: 0x1B1E22, metalness: .1, roughness: .8});
    const W = 2.6, D = 2.6, H = 2.7;

    g.add(box(THREE, M.concrete, W + 0.6, 0.16, D + 0.6, 0, 0.08, 0));
    for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) for (const z of [-D / 2 + 0.1, D / 2 - 0.1])
      g.add(box(THREE, M.galv, 0.14, 0.34, 0.14, x, 0.33, z));                      // support steel
    g.add(box(THREE, M.galv, W, 0.46, D, 0, 0.72, 0));                              // cold-water basin
    g.add(box(THREE, M.dark, W + 0.02, 0.04, D + 0.02, 0, 0.96, 0));

    /* Air inlet band: dark opening with fill behind tilted louvres on all four sides. */
    const inY = 1.36, inH = 0.74;
    g.add(box(THREE, blk, W - 0.10, inH, D - 0.10, 0, inY, 0));
    for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) for (const z of [-D / 2 + 0.05, D / 2 - 0.05])
      g.add(box(THREE, M.body, 0.10, inH, 0.10, x, inY, z));                        // corner posts
    for (let i = 0; i < 6; i++) {
      const y = inY - inH / 2 + 0.08 + i * ((inH - 0.16) / 5);
      for (const s of [-1, 1]) {
        const a = box(THREE, M.galv, W - 0.22, 0.02, 0.14, 0, y, s * (D / 2 - 0.03)); a.rotation.x = s * 0.6; g.add(a);
        const b = box(THREE, M.galv, 0.14, 0.02, D - 0.22, s * (W / 2 - 0.03), y, 0); b.rotation.z = -s * 0.6; g.add(b);
      }
    }

    /* Casing above the inlets, with panel seams and an access door. */
    const cY = (inY + inH / 2 + H) / 2, cH = H - (inY + inH / 2);
    g.add(box(THREE, M.body, W, cH, D, 0, cY, 0));
    for (const x of [-W / 6, W / 6]) g.add(box(THREE, M.dark, 0.02, cH - 0.04, D + 0.012, x, cY, 0));
    for (const z of [-D / 6, D / 6]) g.add(box(THREE, M.dark, W + 0.012, cH - 0.04, 0.02, 0, cY, z));
    door(THREE, g, M.body, M.dark, M.stainless, {x: 0.55, y: cY, z: D / 2 + 0.012, w: 0.62, h: cH - 0.22});

    /* Fan deck and velocity-recovery stack with the fan inside it. */
    g.add(box(THREE, M.dark, W + 0.04, 0.06, D + 0.04, 0, H + 0.03, 0));
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 0.92, 0.62, segs(30), 1, true), M.body);
    stack.material = M.body.clone(); stack.material.side = THREE.DoubleSide;
    stack.position.set(0, H + 0.37, 0); g.add(stack);
    g.add(cyl(THREE, blk, 0.90, 0.90, 0.02, 28, 0, H + 0.08, 0));
    g.add(cyl(THREE, M.steel, 0.20, 0.20, 0.16, 14, 0, H + 0.36, 0));
    for (let k = 0; k < 6; k++) {
      const bl = box(THREE, M.galv, 1.62, 0.025, 0.26, 0, H + 0.36, 0);
      bl.rotation.y = (k / 6) * Math.PI; bl.rotation.x = 0.22; g.add(bl);
    }
    for (let k = 1; k <= 4; k++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(k * 0.24, 0.01, 6, segs(24)), M.steel);
      ring.rotation.x = Math.PI / 2; ring.position.set(0, H + 0.69, 0); g.add(ring);
    }
    /* Fan motor on the deck, belt guard to the stack. */
    g.add(cyl(THREE, M.castIron, 0.16, 0.16, 0.42, 14, W / 2 - 0.22, H + 0.24, D / 2 - 0.30).rotateZ(Math.PI / 2));
    g.add(box(THREE, M.gold, 0.50, 0.10, 0.20, W / 2 - 0.55, H + 0.14, D / 2 - 0.42));

    /* Condenser water: hot return up to the distribution deck, cold supply from the basin. */
    tubeRun(THREE, g, M.steel, [[-W / 2 - 0.55, 0.40, 0.55], [-W / 2 - 0.55, H - 0.25, 0.55], [-W / 2 + 0.05, H - 0.25, 0.55]], 0.11, M.dark);
    flangedStub(THREE, g, M.steel, M.steel, M.stainless, [-W / 2 + 0.05, 0.72, -0.55], [-W / 2 - 0.50, 0.72, -0.55], 0.13);
    /* Ladder up one side. */
    for (const z of [-0.95, -0.65]) g.add(box(THREE, M.galv, 0.03, H - 0.3, 0.03, W / 2 + 0.06, 0.3 + (H - 0.3) / 2 + 0.15, z));
    for (let i = 0; i < 9; i++) g.add(box(THREE, M.galv, 0.025, 0.025, 0.30, W / 2 + 0.06, 0.55 + i * 0.27, -0.80));

    decal(THREE, g, {key: 'tower-np', w: 0.40, h: 0.26, x: -0.55, y: cY, z: D / 2 + 0.008, cw: 280, ch: 180, metal: 0.35, rough: 0.42,
      draw: npDraw('COOLING TOWER', [['CAPACITY', '300 TONS'], ['FLOW', '900 GPM'], ['RANGE', '10 F']])});
    return g;
  }

  const BUILDERS = {
    /* electrical / plant */
    transformer: buildTransformer,
    switchgear: buildSwitchgear,
    battery: buildBatteryRack,
    genset: buildGenset,
    breaker: buildBreaker,
    conductor: buildConductor,
    motor: buildMotor,
    panel: buildPanel,
    busway: buildBusway,
    cooling: buildCooling,
    pump: buildPump,
    chiller: buildChiller,
    coolingtower: buildCoolingTower,
    /* 19" rack gear */
    server: (T,c) => buildServer(T,c,1),
    server2u: (T,c) => buildServer(T,c,2),
    netswitch: buildSwitchNet,
    storage: buildStorage,
    ups: (T,c) => buildUPSRack(T,c,4),
    pdu: buildPDU,
    kvm: buildKVM,
    blank: buildBlank,
    cablemgr: buildCableMgr,
    /* through-hole PCB parts (ids match the PCB Layout tool's palette) */
    res: buildResistor,
    ccap: buildCeramicCap,
    ecap: buildElectrolyticCap,
    led: buildLED,
    diode: buildDiode,
    btn: buildPushButton,
    hdr2: (T) => buildHeader(T, 2),
    hdr4: (T) => buildHeader(T, 4),
    dip8: buildDIP8,
    pot: buildPotentiometer,
    /* calculator subjects */
    pvmodule: buildPVModule,
    groundrod: buildGroundRod,
    pfcap: buildPFCapacitor
  };
  function resolveBuilder(shapeId){ return BUILDERS[shapeId] || buildGeneric; }

  /* ---------- coplanar-face separation ----------
     Depth buffers cannot order two surfaces that occupy the same plane. Where
     a model has coincident same-facing faces, which one wins is decided by
     floating-point noise, so it flips per pixel and re-flips as the camera
     moves: the shimmer reads as the model "glitching".

     This is a modelling hazard, not a one-off mistake. Sweeping all 32 shapes
     for axis-aligned boxes sharing a face plane with overlapping area found it
     in 16 of them -- the diesel genset's skid rails share BOTH the fuel tank's
     underside (y=0) and its end caps (x=+/-1.6), which is why it was reported
     as glitching along the bottom; the CRAH's worst pair covers 3.0 square
     units. Fixing sixteen builders by hand would leave the seventeenth to be
     written next week, so the separation happens here, once, for anything the
     library ever renders.

     Method: find same-facing coplanar pairs with real overlap, and push the
     SMALLER of the two a hair along that face's normal so it sits proud rather
     than flush. Smaller-moves-outward is what keeps the result physically
     sensible -- a skid rail ends up just below the tank it carries, which is
     where a skid rail belongs. The offset is scaled to the model so it stays
     sub-visible whether the subject is a 3-unit genset or a 0.2-unit connector,
     and each mesh is moved at most once per axis so a part in several pairs
     cannot drift. */
  function separateCoplanar(THREE, root){
    root.updateMatrixWorld(true);

    const items = [];
    root.traverse(function(n){
      if (!n.isMesh || !n.geometry || n.geometry.type !== 'BoxGeometry') return;
      /* Rotated boxes are skipped: their axis-aligned bounds are larger than
         the box itself, so "coplanar" read off an AABB would be fiction. */
      const e = new THREE.Euler().setFromQuaternion(n.getWorldQuaternion(new THREE.Quaternion()));
      const aligned = [e.x, e.y, e.z].every(function(a){
        const m = Math.abs(a) % (Math.PI / 2);
        return m < 1e-4 || Math.abs(m - Math.PI / 2) < 1e-4;
      });
      if (!aligned) return;
      const bb = new THREE.Box3().setFromObject(n);
      const sz = bb.getSize(new THREE.Vector3());
      items.push({ mesh: n, bb: bb, vol: sz.x * sz.y * sz.z });
    });
    if (items.length < 2) return;

    const whole = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
    const eps = Math.max(whole.x, whole.y, whole.z) * 0.0012;
    const moved = new Set();

    function faceOverlap(A, B, ax){
      const o = [0, 1, 2].filter(function(i){ return i !== ax; });
      const k = ['x', 'y', 'z'];
      const w = Math.min(A.max[k[o[0]]], B.max[k[o[0]]]) - Math.max(A.min[k[o[0]]], B.min[k[o[0]]]);
      const h = Math.min(A.max[k[o[1]]], B.max[k[o[1]]]) - Math.max(A.min[k[o[1]]], B.min[k[o[1]]]);
      return (w > 1e-4 && h > 1e-4) ? w * h : 0;
    }

    const AX = ['x', 'y', 'z'];
    const delta = new THREE.Vector3();
    for (let i = 0; i < items.length; i++){
      for (let j = i + 1; j < items.length; j++){
        const A = items[i], B = items[j];
        for (let ax = 0; ax < 3; ax++){
          const k = AX[ax];
          for (let sideI = 0; sideI < 2; sideI++){
            const side = sideI ? 'max' : 'min';
            if (Math.abs(A.bb[side][k] - B.bb[side][k]) > 1e-4) continue;
            /* 0.01 square units filters out incidental contact between small
               trim pieces, where the fight is a pixel or two and the nudge
               would cost more than it fixes. */
            if (faceOverlap(A.bb, B.bb, ax) < 0.01) continue;

            const small = A.vol <= B.vol ? A : B;
            const tag = small.mesh.uuid + ':' + k;
            if (moved.has(tag)) continue;
            moved.add(tag);

            /* Outward along this face's normal: min faces point negative. */
            delta.set(0, 0, 0);
            delta[k] = side === 'min' ? -eps : eps;
            const p = small.mesh.getWorldPosition(new THREE.Vector3()).add(delta);
            small.mesh.parent.worldToLocal(p);
            small.mesh.position.copy(p);
            small.mesh.updateMatrixWorld(true);
            small.bb.setFromObject(small.mesh);
          }
        }
      }
    }
  }


  /* Per-shape opening camera angle. The default (phi 1.15) looks in from a bit
     above the horizon, which suits upright equipment but reduces a broad flat
     object to a line -- a tilted PV module was almost invisible until the
     camera was raised over it. Smaller phi = higher viewpoint. */
  const VIEW_HINT = {
    pvmodule: { phi: 0.62 },
    groundrod: { phi: 1.30 },   // lower, so the buried length reads against grade
    /* Rack gear is wide, shallow and carries all of its detail on the faceplate.
       At the default phi the camera looks down onto the lid and the ports, bays
       and displays are edge-on and unreadable, so these open near eye level. */
    server:    { phi: 1.44 },
    server2u:  { phi: 1.44 },
    netswitch: { phi: 1.44 },
    storage:   { phi: 1.44 },
    ups:       { phi: 1.40 },
    pdu:       { phi: 1.44 },
    kvm:       { phi: 1.20 },   // higher: the open keyboard tray is the subject
    blank:     { phi: 1.44 },
    cablemgr:  { phi: 1.32 }
  };

  /* ---------- composite assemblies ----------
     These take a live layout from one of the tools and stack/lay out the single
     shapes above into one scene, so a tool shows ONE 3D view of the thing the
     user actually built rather than a palette of thumbnails (which would blow
     the WebGL context budget -- see the live-instance registry below). */

  /* Open-frame 19" rack loaded from the top down.
     items: [{shape, u, color}] in top-to-bottom order; rackU is the frame height. */
  function buildRackAssembly(THREE, items, rackU, accent){
    const g = new THREE.Group();
    const frame = new THREE.MeshStandardMaterial({color:0x2A3B54, metalness:.55, roughness:.45});
    const rail  = new THREE.MeshStandardMaterial({color:0x1A2739, metalness:.5, roughness:.5});
    const H = rackU * RU;
    const halfW = RW/2 + 0.16, halfD = RD/2 + 0.10;

    // four corner posts + top/bottom frame members
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      g.add(box(THREE, frame, 0.17, H, 0.17, sx*halfW, H/2, sz*halfD));
    }
    for (const y of [0.06, H - 0.06]) for (const sz of [-1,1]) {
      g.add(box(THREE, frame, halfW*2, 0.12, 0.17, 0, y, sz*halfD));
    }
    // punched mounting rails just inside the front posts
    for (const sx of [-1,1]) g.add(box(THREE, rail, 0.10, H, 0.30, sx*(RW/2 - 0.02), H/2, RD/2 - 0.10));
    g.add(box(THREE, rail, halfW*2 + 0.2, 0.10, halfD*2 + 0.2, 0, 0.02, 0));   // plinth

    /* Gear stacks downward from the top rail. rackChassis() builds each chassis
       sitting ON its group origin (spanning 0..h upward), so an item's origin
       goes at the BOTTOM of its slot, not the middle. */
    let y = H;
    items.forEach(function(it){
      const u = it.u || 1;
      const mesh = resolveBuilder(it.shape)(THREE, it.color != null ? it.color : accent);
      mesh.position.y = y - u * RU;
      g.add(mesh);
      y -= u * RU;
    });
    return g;
  }

  /* POD / skid: equipment laid out on a pad, optionally inside a container shell. */
  function buildPodAssembly(THREE, items, opts){
    const o = opts || {};
    const g = new THREE.Group();
    const pad = new THREE.MeshStandardMaterial({color:0x2A3B54, metalness:.2, roughness:.85});
    const n = Math.max(items.length, 1);
    const pitch = 3.2;
    const spanX = n * pitch;
    const padW = Math.max(spanX + 1.6, 6), padD = 6.0;

    g.add(box(THREE, pad, padW, 0.22, padD, 0, -0.11, 0));

    items.forEach(function(it, i){
      const mesh = resolveBuilder(it.shape)(THREE, it.color != null ? it.color : 0x2B6CB0);
      mesh.position.x = (i - (n-1)/2) * pitch;
      if (it.rotY) mesh.rotation.y = it.rotY;
      g.add(mesh);
    });

    /* A POD is a skid inside a container shell; a skid is the same kit without it.
       Drawing the shell as an open frame keeps the gear visible while still
       reading as an enclosure. */
    if (o.shell) {
      const sh = new THREE.MeshStandardMaterial({color:0x8FA3BC, metalness:.4, roughness:.6, transparent:true, opacity:.20, side:THREE.DoubleSide});
      const rib = new THREE.MeshStandardMaterial({color:0x8FA3BC, metalness:.5, roughness:.5});
      const cw = padW, cd = padD, ch = 4.2;
      g.add(box(THREE, sh, cw, 0.10, cd, 0, ch, 0));                     // roof
      for (const sz of [-1,1]) g.add(box(THREE, sh, cw, ch, 0.08, 0, ch/2, sz*cd/2));
      g.add(box(THREE, sh, 0.08, ch, cd, -cw/2, ch/2, 0));               // one end wall
      for (const sx of [-1,1]) for (const sz of [-1,1]) {
        g.add(box(THREE, rib, 0.14, ch, 0.14, sx*cw/2, ch/2, sz*cd/2));  // corner castings
      }
    }
    return g;
  }

  /* Sandbox: source -> protection -> conductor run -> load, laid out left to right
     with a busbar tying them together, so the circuit reads as a circuit. */
  function buildCircuitAssembly(THREE, items){
    const g = new THREE.Group();
    const bus = new THREE.MeshStandardMaterial({color:0xB87333, metalness:.85, roughness:.35});
    const n = Math.max(items.length, 1);
    const pitch = 3.6;
    items.forEach(function(it, i){
      const mesh = resolveBuilder(it.shape)(THREE, it.color != null ? it.color : 0x2B6CB0);
      mesh.position.x = (i - (n-1)/2) * pitch;
      g.add(mesh);
      if (i < n - 1) {   // link to the next device
        const link = cyl(THREE, bus, 0.09, 0.09, pitch, 10, (i - (n-1)/2) * pitch + pitch/2, 0.5, 0);
        link.rotation.z = Math.PI/2; g.add(link);
      }
    });
    return g;
  }

  /* ---------- hand-rolled drag-to-rotate + wheel-to-zoom, spherical camera ---------- */
  function attachOrbit(camera, dom, target, opts){
    /* Radius and its clamps are caller-supplied because assemblies vary wildly in
       size -- a 1U PDU and a 48U rack elevation cannot share one framing distance. */
    const o = opts || {};
    let theta = o.theta != null ? o.theta : 0.9;
    let phi = o.phi != null ? o.phi : 1.15;
    let radius = o.radius != null ? o.radius : 5.6;
    let autoRotate = o.autoRotate !== false, dragging = false, lastX = 0, lastY = 0;
    /* Content that moves on its own is a barrier for some viewers, and the
       platform already carries the answer as a user preference. Honoured here
       rather than per caller so no mount can forget it. */
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) autoRotate = false; } catch (e) {}
    const minPhi = 0.35, maxPhi = Math.PI - 0.35;
    const minR = o.minR != null ? o.minR : 2.6, maxR = o.maxR != null ? o.maxR : 9;
    const zoomStep = (maxR - minR) / 1800;

    function apply(){
      const s = Math.sin(phi);
      camera.position.set(
        target.x + radius*s*Math.sin(theta),
        target.y + radius*Math.cos(phi),
        target.z + radius*s*Math.cos(theta)
      );
      camera.lookAt(target);
    }
    function down(x,y){ dragging = true; autoRotate = false; lastX = x; lastY = y; }
    function move(x,y){
      if (!dragging) return;
      const dx = x-lastX, dy = y-lastY; lastX = x; lastY = y;
      theta -= dx*0.008;
      phi = Math.min(maxPhi, Math.max(minPhi, phi - dy*0.008));
      apply();
    }
    function up(){ dragging = false; }
    function setR(r){ radius = Math.min(maxR, Math.max(minR, r)); apply(); }
    function wheel(e){
      e.preventDefault();
      setR(radius + e.deltaY*zoomStep);
    }

    /* Pinch-to-zoom.
       Zoom used to be wheel-only, which meant it did not exist on a phone:
       there is no wheel event, and the single-pointer handler treated a second
       finger as more rotation. Every model was locked at its framing distance
       on the device where you most want to lean in on a nameplate.

       Pointer events already cover touch, so this tracks the live pointers in a
       map: one moves the camera, two scale the radius by the ratio of their
       separation. The canvas already carries touch-action:none, which is what
       stops the browser claiming the gesture as a page zoom. */
    const pts = new Map();
    let pinchPrev = 0;
    function spread(){
      const p = [...pts.values()];
      return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    }
    function pdown(e){
      try{ dom.setPointerCapture(e.pointerId); }catch(err){}
      pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (pts.size === 2) { pinchPrev = spread(); dragging = false; autoRotate = false; }
      else if (pts.size === 1) down(e.clientX, e.clientY);
    }
    function pmove(e){
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if (pts.size >= 2) {
        const d = spread();
        /* Fingers apart -> smaller radius -> closer. Guard the first frame and
           any degenerate zero so one stray sample cannot divide by nothing. */
        if (pinchPrev > 0 && d > 0) setR(radius * (pinchPrev / d));
        pinchPrev = d;
        return;
      }
      move(e.clientX, e.clientY);
    }
    function pup(e){
      pts.delete(e.pointerId);
      if (pts.size < 2) pinchPrev = 0;
      /* Lifting one of two fingers hands control back to the other rather than
         jumping the model: re-seat the drag origin on whichever remains. */
      if (pts.size === 1) { const p = pts.values().next().value; lastX = p.x; lastY = p.y; dragging = true; }
      else if (pts.size === 0) dragging = false;
    }

    /* Keyboard equivalents for every mouse/touch gesture above. Without these
       the model is reachable but inert for anyone not using a pointer, and the
       auto-rotation has no way to be stopped -- moving content that cannot be
       paused is its own barrier. Space/Enter is that pause. */
    const KEY_ROT = 0.12, KEY_ZOOM = 0.12;
    function key(e){
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      let used = true;
      switch (e.key) {
        case 'ArrowLeft':  autoRotate = false; theta += KEY_ROT; break;
        case 'ArrowRight': autoRotate = false; theta -= KEY_ROT; break;
        case 'ArrowUp':    autoRotate = false; phi = Math.max(minPhi, phi - KEY_ROT); break;
        case 'ArrowDown':  autoRotate = false; phi = Math.min(maxPhi, phi + KEY_ROT); break;
        case '+': case '=': e.preventDefault(); setR(radius - (maxR - minR) * KEY_ZOOM); return;
        case '-': case '_': e.preventDefault(); setR(radius + (maxR - minR) * KEY_ZOOM); return;
        case 'Home': e.preventDefault(); autoRotate = false; theta = o.theta != null ? o.theta : 0.9;
                        phi = o.phi != null ? o.phi : 1.15;
                        setR(o.radius != null ? o.radius : 5.6); return;
        case ' ': case 'Spacebar': case 'Enter': autoRotate = !autoRotate; break;
        default: used = false;
      }
      if (!used) return;
      e.preventDefault();
      apply();
    }

    dom.addEventListener('keydown', key);
    dom.addEventListener('pointerdown', pdown);
    dom.addEventListener('pointermove', pmove);
    dom.addEventListener('pointerup', pup);
    dom.addEventListener('pointercancel', pup);
    dom.addEventListener('wheel', wheel, {passive:false});
    apply();

    return {
      tick(){ if (autoRotate) { theta += 0.0032; apply(); } },
      dispose(){
        dom.removeEventListener('pointerdown', pdown);
        dom.removeEventListener('pointermove', pmove);
        dom.removeEventListener('pointerup', pup);
        dom.removeEventListener('pointercancel', pup);
        dom.removeEventListener('wheel', wheel);
        dom.removeEventListener('keydown', key);
        pts.clear();
      }
    };
  }

  /* ---------- studio environment ----------
     Every material here is metalness .4-.9. Metal in a physically-based renderer
     is lit almost entirely by what it REFLECTS, so with no environment map a
     bushing, a busbar or a radiator fin has nothing to reflect and resolves to
     flat grey -- which is why the models read as plastic no matter how much
     geometry they carry.

     Built from a canvas gradient rather than three's RoomEnvironment addon: that
     addon lives in examples/jsm and would be a SECOND module fetched from the
     CDN. This site is an offline-first PWA and three is already the one external
     dependency, so a procedural equirect out of core three keeps it that way.

     PMREM output is bound to the renderer that produced it, so this cannot be
     shared between viewers -- each context builds its own. Kept at 128x64 source
     so that per-context cost stays trivial. */
  function studioEnv(THREE, renderer){
    /* 256x128 rather than 128x64. The source is what PMREM prefilters into the
       reflection mips, so at the old size the horizon band and the two key
       sources blurred into a soft wash on anything approaching a mirror finish
       -- polished shafts, bushing glaze, copper. Still trivial to build. */
    const W = 256, H = 128;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');

    /* Sky over horizon over floor. The bright band across the horizon is what
       produces the long specular highlight along a cylindrical bushing or a
       length of busway. */
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.00, '#F2F6FA');   // overhead
    g.addColorStop(0.42, '#D8E2EC');
    g.addColorStop(0.50, '#FFFFFF');   // horizon band
    g.addColorStop(0.58, '#8FA0B4');
    g.addColorStop(1.00, '#333F4E');   // floor
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    /* Two soft key sources, so rotating the model sweeps a highlight across it
       instead of presenting one uniform sheen from every angle. */
    for (const k of [{cx:0.26, i:0.95}, {cx:0.72, i:0.55}]) {
      const r = x.createRadialGradient(k.cx*W, H*0.30, 0, k.cx*W, H*0.30, W*0.20);
      r.addColorStop(0, 'rgba(255,255,255,' + k.i + ')');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = r; x.fillRect(0, 0, W, H);
    }

    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromEquirectangular(tex);
    pmrem.dispose();
    tex.dispose();
    return rt;                                  // caller disposes rt
  }

  /* ---------- live-instance registry ----------
     Browsers cap simultaneous WebGL contexts (16 in Chrome at time of writing)
     and silently kill the OLDEST context once you exceed it -- the canvas stays
     in the DOM but renders nothing, with no error thrown. Measured directly:
     19 viewers on one page left 16 alive and 3 lost, and the 3 blanks were the
     first three mounted.

     So the library caps itself well below that and disposes least-recently-
     mounted viewers when the cap is hit. A caller that mounts too many gets
     degraded-but-honest behaviour (older views revert to a static placeholder)
     instead of mystery blank boxes. For a palette of many thumbnails, prefer
     the existing 2D icons and reserve 3D for the one assembled view. */
  const MAX_LIVE = 8;
  const live = [];   // [{dispose, container}] in mount order

  function retire(){
    while (live.length > MAX_LIVE) {
      const oldest = live.shift();
      try { oldest.dispose(true); } catch (e) { /* already gone */ }
    }
  }

  /* ---------- public API ---------- */
  const VF3D = {};

  /* Every shape id the library can build, for tools that want to enumerate
     or validate against it rather than hard-coding the list. */
  VF3D.shapes = function(){ return Object.keys(BUILDERS); };
  VF3D.hasShape = function(id){ return Object.prototype.hasOwnProperty.call(BUILDERS, id); };

  /* Mounts a rotatable 3D shape into `container` (any block element with a
     real width/height). Returns a dispose() function -- call it before
     removing/replacing the container to stop the render loop and free the
     WebGL context; skipping this on a page that toggles the view on and off
     repeatedly will leak GPU contexts. */
  /* `opts` is merged over the shape's own VIEW_HINT, so a caller can ask for
     ambient occlusion ({ao:true}) on a hero-sized view without losing the
     per-shape camera angle. Grids of thumbnails should leave it off. */
  VF3D.mount = function(container, shapeId, colorHex, opts){
    const color = normColor(colorHex);
    const hint = VIEW_HINT[shapeId] || {};
    const merged = {};
    for (const k in hint) merged[k] = hint[k];
    if (opts) for (const k in opts) merged[k] = opts[k];
    /* The shape id is the only description of the subject this entry point
       receives, so it becomes the accessible name unless a caller supplies a
       better one: "pad-mount-transformer" reads as "pad mount transformer". */
    if (merged.label == null) merged.label = String(shapeId || '').replace(/[-_]+/g, ' ').trim() || 'power equipment';
    return VF3D.mountScene(container, function(THREE){
      return resolveBuilder(shapeId)(THREE, color);
    }, merged);
  };

  /* Replace the subject of a live mount, reusing its WebGL context. Same
     arguments as VF3D.mount with the handle in place of the container.

     Returns false if the handle predates this (or is not one), so a caller can
     fall back to mount() rather than silently showing nothing.

     Every view option is restated, not merged: the options object behind the
     mount persists across swaps, so a shape with a camera hint followed by one
     without would otherwise keep the first shape's angle. Writing undefined is
     the same as absent to every reader of these, which all test for null. */
  VF3D.swapShape = function(handle, shapeId, colorHex, opts){
    if (!handle || typeof handle.swap !== 'function') return false;
    if (!VF3D.hasShape(shapeId)) return false;
    const color = normColor(colorHex);
    const hint = VIEW_HINT[shapeId] || {};
    const merged = { phi: undefined, theta: undefined, zoom: undefined, yBias: undefined };
    for (const k in hint) merged[k] = hint[k];
    if (opts) for (const k in opts) merged[k] = opts[k];
    if (merged.label == null) {
      merged.label = String(shapeId || '').replace(/[-_]+/g, ' ').trim() || 'power equipment';
    }
    handle.swap(function(THREE){ return resolveBuilder(shapeId)(THREE, color); }, merged);
    return true;
  };

  function normColor(c){
    if (typeof c === 'number') return c;
    return parseInt(String(c == null ? '2B6CB0' : c).replace('#',''), 16);
  }

  /* Mounts an arbitrary assembly. `build(THREE)` returns any Object3D; the camera
     then frames whatever it got, so callers don't have to know how big their
     assembly turned out (a 1U PDU and a 48U rack both come back framed). */
  VF3D.mountScene = function(container, build, opts){
    const o = opts || {};
    let disposed = false, renderer, camera, orbit, animId, ro, envRT, composer;
    /* Held across a swap: the context, the environment map, the lights and the
       composer all outlive any one model. */
    let scene, model, dirLight, surfCache, visIO, onVis, dirTargetIn = false, onScreen = true;
    let swap = null, runRef = null;

    /* RoundedBoxGeometry has to be resolved before build() runs, because box()
       reaches for it synchronously. Fetched in parallel with three and capped
       by its own timeout, so the worst case is sharp edges rather than a
       viewer that never appears. */
    Promise.all([loadThree(), loadRoundedBox()]).then(res => {
      const THREE = res[0];
      if (disposed) return;
      const w = container.clientWidth || 300, h = container.clientHeight || 260;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, w/h, 0.1, 100);

      // preserveDrawingBuffer keeps the last frame readable after render, which
      // lets a viewer right-click-save the 3D view (and makes the shape library
      // testable by reading frames back). Negligible cost at these sizes.
      const T = tier();
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        /* preserveDrawingBuffer keeps the last frame readable after render,
           which lets a viewer right-click-save the 3D view and makes the shape
           library testable by reading frames back. It is not free: it stops the
           driver discarding the buffer at the end of a frame, which on a
           tile-based mobile GPU means resolving and writing out the whole
           surface every frame. Kept where it is cheap and where someone might
           actually use it; dropped on touch hardware, where nobody right-clicks
           and the bandwidth is the scarce thing. */
        preserveDrawingBuffer: T === 2,
        powerPreference: T === 2 ? 'high-performance' : 'default'
      });
      /* Supersample on non-retina displays. A plain 1.0 device ratio renders
         one sample per screen pixel, which MSAA only partly rescues: MSAA
         antialiases geometry EDGES but not shading, so specular glints on the
         radiator fins and the fan blades still crawl. Rendering at 1.5x and
         letting the browser downscale antialiases the shading too.

         Bounded rather than open-ended: 1.5 is 2.25x the fragment work, which
         these canvases (a few hundred px square, a handful of thousand
         triangles) absorb easily, while 2.0 on an already-2x display would be
         4x for no visible gain. Retina screens are left at 2. */
      /* A phone reports devicePixelRatio 3, so the old floor-and-cap handed it
         2.0 -- four times the fragment work of 1.0, on the weakest GPU of the
         three tiers, to supersample a canvas a few hundred pixels across. The
         supersample is there to antialias SHADING, which MSAA cannot do, and
         1.5 already does that; past it the returns are invisible and the cost
         is quadratic. */
      const _dpr = window.devicePixelRatio || 1;
      renderer.setPixelRatio(
        T === 0 ? Math.min(_dpr, 1) :
        T === 1 ? Math.min(_dpr, 1.5) :
                  Math.min(Math.max(_dpr, 1.5), 2));
      /* Record the GPU's real anisotropic-filtering limit once. Textures were
         pinned at 4; hardware typically allows 16, and the difference shows on
         any surface viewed at a shallow angle -- which here means every
         nameplate, side panel and floor. It costs nothing beyond samples the
         GPU could already take. */
      try { MAX_ANISO = renderer.capabilities.getMaxAnisotropy() || 4; } catch(e) { MAX_ANISO = 4; }
      renderer.setSize(w,h);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';

      /* A bare <canvas> is a blank element to a screen reader: no name, no role,
         nothing to announce, and until now nothing to operate without a pointer.
         role="img" plus a name makes it an image with a text alternative, which
         is what it is for anyone not dragging it; the description names the keys
         attachOrbit binds, so the interaction is discoverable rather than
         something you have to guess at. The spec table on the page carries the
         actual figures -- this view is a supplement to it, not the only copy. */
      (function(){
        const cvs = renderer.domElement;
        const name = o.label || container.getAttribute('data-label') || 'power equipment';
        cvs.setAttribute('role', 'img');
        cvs.setAttribute('aria-label', '3D model of ' + name);
        cvs.tabIndex = 0;
        let help = document.getElementById('vf3d-help');
        if (!help) {
          help = document.createElement('p');
          help.id = 'vf3d-help';
          help.className = 'vf-sr-only';
          help.textContent = 'Interactive 3D view. Arrow keys rotate the model, ' +
            'plus and minus zoom, Home resets the view, and Space starts or stops ' +
            'the automatic rotation. The specifications shown elsewhere on this ' +
            'page do not depend on this view.';
          ((cvs.closest && cvs.closest('main,[role=main],section[aria-label],aside,header,footer')) || document.querySelector('main') || document.body).appendChild(help);
        }
        cvs.setAttribute('aria-describedby', 'vf3d-help');
      })();

      /* Filmic response instead of the default clip. Without it the specular
         highlights the environment map introduces blow straight out to white. */
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      /* The soft filter takes several taps per fragment. Worth it where there is
         headroom; on the minimal tier a single tap keeps the self-shadowing
         that gives the fins and louvres their depth, which is the point of
         having shadows at all here, and drops the rest. */
      renderer.shadowMap.type = T === 0 ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      envRT = studioEnv(THREE, renderer);
      scene.environment = envRT.texture;

      /* Direct light is dialled well back from what it was before the
         environment map existed: the env now supplies most of the ambient and
         all of the specular, so the previous intensities double-count and wash
         the models out. */
      scene.add(new THREE.HemisphereLight(0xffffff, 0x22334C, 0.30));
      const dir = dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
      dir.position.set(4,6,5); scene.add(dir);
      dir.castShadow = true;
      /* 2048 is spread over a frustum fitted tightly to one model, so it buys
         real self-shadowing detail rather than general softness -- but it is
         also a 16MB depth target, which is not a sensible thing to allocate on
         a phone for a decorative hero. */
      const _sm = T === 2 ? 2048 : 1024;
      dir.shadow.mapSize.set(_sm, _sm);
      /* Shadow acne on this geometry comes from the many thin coplanar plates
         (louvre slats, faceplate details, PCB pads). normalBias handles those
         far better than depth bias alone, which would detach contact shadows. */
      dir.shadow.bias = -0.0004;
      dir.shadow.normalBias = 0.02;
      const fill = new THREE.DirectionalLight(0xAFC0D3, 0.22);
      fill.position.set(-4,2,-3); scene.add(fill);

      /* Everything from here to the end of the framing pass depends only on
         WHICH model is being shown, not on the context, the lights or the
         composer. Pulled into a function so the homepage carousel can replace
         the subject without tearing down and rebuilding a WebGL context every
         seven seconds, which is what it used to do. */
      /* Motion and callouts for the model currently installed (see the
         conventions above the fan helper). Rebuilt on every install, so a
         swapped-in model brings its own. */
      let spinners = [], blinkers = [], anchors = [], coWrap = null, coNodes = [], lastT = 0, coCtr = null;
      let motionOK = true;
      try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) motionOK = false; } catch (e) {}

      function clearCallouts(){
        if (coWrap && coWrap.parentNode) coWrap.parentNode.removeChild(coWrap);
        coWrap = null; coNodes = [];
      }
      function buildCallouts(){
        clearCallouts();
        if (!o.callouts || !anchors.length) return;
        if (!document.getElementById('vf3d-co-css')) {
          const st = document.createElement('style');
          st.id = 'vf3d-co-css';
          st.textContent =
            '.vf3d-co-wrap{position:absolute;inset:0;pointer-events:none;overflow:hidden}' +
            '.vf3d-co{position:absolute;left:0;top:0;display:flex;align-items:center;gap:7px;white-space:nowrap;' +
              'font:500 11px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.02em;color:#E8EEF6;' +
              'transition:opacity .35s ease;will-change:transform}' +
            '.vf3d-co{align-items:flex-start}.vf3d-co i{margin-top:5px;flex:none;width:9px;height:9px;border-radius:50%;background:#FFC400;box-shadow:0 0 0 3px rgba(255,196,0,.22),0 0 0 1px rgba(16,27,45,.9)}' +
            '.vf3d-co b{transition:transform .25s ease;font-weight:500;background:rgba(16,27,45,.82);border:1px solid rgba(141,160,184,.35);border-radius:4px;padding:4px 7px}' +
            '.vf3d-co.is-left{flex-direction:row-reverse}' +
            '.vf3d-co.is-back{opacity:0}' +
            '@media(max-width:620px){.vf3d-co b{display:none}}' +
            '@media(prefers-reduced-motion:reduce){.vf3d-co{transition:none}}';
          document.head.appendChild(st);
        }
        if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
        coWrap = document.createElement('div');
        coWrap.className = 'vf3d-co-wrap';
        /* The same names are in the list for a screen reader, once, rather
           than as a set of things moving round a canvas. */
        coWrap.setAttribute('aria-hidden', 'true');
        coNodes = anchors.map(function(a){
          const el = document.createElement('span');
          el.className = 'vf3d-co is-back';
          const dot = document.createElement('i'), tx = document.createElement('b');
          tx.textContent = a.userData.callout;
          el.appendChild(dot); el.appendChild(tx);
          coWrap.appendChild(el);
          return el;
        });
        container.appendChild(coWrap);
        if (renderer && renderer.domElement) {
          renderer.domElement.setAttribute('aria-label', '3D model of ' + (o.label || 'power equipment') +
            '. Labelled parts: ' + anchors.map(function(a){ return a.userData.callout; }).join(', ') + '.');
        }
      }
      const _cv = new THREE.Vector3(), _cc = new THREE.Vector3(), _cd = new THREE.Vector3();
      function placeCallouts(){
        if (!coWrap) return;
        const cw = container.clientWidth, ch = container.clientHeight;
        _cc.copy(camera.position).sub(coCtr);
        for (let i = 0; i < anchors.length; i++) {
          const el = coNodes[i];
          anchors[i].getWorldPosition(_cv);
          /* Facing test against the model's centre: a point on the far side of
             the model fades out instead of floating over the near side. */
          _cd.copy(_cv).sub(coCtr);
          const back = _cd.dot(_cc) < -0.12 * _cd.length() * _cc.length();
          _cv.project(camera);
          const x = (_cv.x * 0.5 + 0.5) * cw, y = (-_cv.y * 0.5 + 0.5) * ch;
          const off = x < 4 || x > cw - 4 || y < 4 || y > ch - 4 || _cv.z > 1;
          el.classList.toggle('is-back', back || off);
          const left = x > cw * 0.58;
          el.classList.toggle('is-left', left);
          /* Anchor on the dot: its centre is 4.5px in from the leading edge. */
          el.style.transform = 'translate(' + (left ? 'calc(' + (x + 4.5).toFixed(1) + 'px - 100%)' : (x - 4.5).toFixed(1) + 'px') + ',' + (y - 10).toFixed(1) + 'px)';
          el._x = x; el._y = y; el._left = left; el._on = !(back || off);
        }
        /* Two points that project close together would print their labels on
           top of each other. The dots stay exactly on their points; only the
           text of the lower one is pushed down, far enough to clear. */
        const vis = coNodes.filter(function(e){ return e._on; }).sort(function(a, b){ return a._y - b._y; });
        const placed = [];
        for (let i = 0; i < vis.length; i++) {
          const e = vis[i];
          /* Horizontal extent of the whole label, whichever side of its dot
             it sits on. Width is read once; the text never changes. */
          if (!e._w) e._w = e.offsetWidth || 120;
          const x0 = e._left ? e._x - e._w : e._x, x1 = e._left ? e._x : e._x + e._w;
          let ty = e._y;
          for (let j = 0; j < placed.length; j++) {
            const p = placed[j];
            if (x0 < p.x1 + 6 && x1 > p.x0 - 6 && ty < p.ty + 24) ty = p.ty + 24;
          }
          placed.push({ x0: x0, x1: x1, ty: ty });
          const dy = ty - e._y;
          if (e._dy !== dy) { e._dy = dy; e.lastChild.style.transform = dy ? 'translateY(' + dy.toFixed(1) + 'px)' : ''; }
        }
      }

      function install(buildFn){
        /* Set around the build and restored after it. Builders run
           synchronously, so no other mount can observe the raised value. */
        const _d = DETAIL;
        /* Capped by tier. Finer cylinders cost triangles, which every tier has
           room for, but they also cost CPU: each one is a geometry built, a
           matrix baked and vertices copied during the merge, all on the main
           thread while the reader is waiting. That budget is not the same on
           a phone as on a workstation. */
        DETAIL = o.detail > 0
          ? (T === 0 ? Math.min(o.detail, DETAIL_BASE)
            : T === 1 ? Math.min(o.detail, 2.6) : o.detail)
          : DETAIL_BASE;
        try { model = buildFn(THREE); } finally { DETAIL = _d; }
        separateCoplanar(THREE, model);
        surfCache = addSurfaceDetail(THREE, model);
        /* Before the first render, so the original per-part geometries are
           dropped without ever having been uploaded. */
        /* opts.merge:false is an escape hatch for comparing a merged render
           against an unmerged one; nothing in the site sets it. */
        if (o.merge !== false) mergeByMaterial(THREE, model);
        scene.add(model);

        spinners = []; blinkers = []; anchors = [];
        model.traverse(function(n){
          if (n.userData.spin) spinners.push(n);
          if (n.userData.blink && n.material) blinkers.push(n);
          if (n.userData.callout) anchors.push(n);
        });
        coCtr = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        buildCallouts();

        /* Self-shadowing only -- no ground plane. These shapes are framed on their
           own bounds and several (conductor, busway, the PCB parts) have no ground
           to stand on, so a catcher plane would either float or cut through them.
           Radiator fins, louvres, fan blades and cable trays shadowing themselves
           is where the depth cue actually comes from. */
        model.traverse(function(n){
          if (!n.isMesh) return;
          /* A transparent mesh must NOT cast: the shadow map has no notion of
             opacity, so a see-through surface casts a fully solid shadow. Every
             translucent surface in this library exists specifically so you can
             see what is behind it -- the soil around a ground rod, the glass door
             on a capacitor cabinet, the POD shell -- and casting would black out
             exactly the interior they were made transparent to reveal. */
          const m = n.material;
          const clear = Array.isArray(m) ? m.some(function(x){ return x && x.transparent; })
                                         : !!(m && m.transparent);
          n.castShadow = !clear;
          n.receiveShadow = true;
        });

        /* Frame the model from its own bounds. Fit the LARGER of the horizontal
           and vertical requirement against the matching half-FOV: a 48U rack is
           height-limited, a busway run is width-limited, and using only one of
           them crops the other.

           Horizontally we fit the XZ bounding RADIUS, not the X extent. The camera
           orbits, so a long row of gear presents its full length at one angle and
           its depth at another; sizing to the half-diagonal keeps it framed all the
           way round instead of clipping the ends once the user drags. */
        const bb = new THREE.Box3().setFromObject(model);
        const size = bb.getSize(new THREE.Vector3());
        const ctr  = bb.getCenter(new THREE.Vector3());
        const vFov = camera.fov * Math.PI/180;
        const hFov = 2 * Math.atan(Math.tan(vFov/2) * camera.aspect);
        const radXZ = Math.sqrt(size.x*size.x + size.z*size.z) / 2;

        /* Framing is solved by projection, not by a closed-form estimate.

           The previous version fitted (size.y/2) against the vertical half-FOV
           and added radXZ as a rotation margin. That treats the model as
           symmetric about its bounding-box centre, and under perspective from an
           elevated camera it is not: the near-bottom of the object is closer to
           the lens than the far-top, so it projects further from centre and
           leaves the frame first. On a wide, low model the error is large --
           measured on the diesel genset at the homepage showcase's 563x340, the
           skid ran off the bottom edge while roughly a fifth of the frame sat
           empty above the exhaust.

           So: place the camera, project the eight bounding-box corners, and read
           the real screen-space bounds. Sample right around the orbit, because
           theta auto-rotates and a long object presents its length at one angle
           and its depth at another -- framing that holds only at the opening
           angle clips halfway through the first rotation. Then centre on what
           was actually measured and scale to fit. Converges in a few passes. */
        const phi0 = o.phi != null ? o.phi : 1.15;
        const corners = [];
        for (let xi = 0; xi < 2; xi++)
          for (let yi = 0; yi < 2; yi++)
            for (let zi = 0; zi < 2; zi++)
              corners.push(new THREE.Vector3(
                xi ? bb.max.x : bb.min.x,
                yi ? bb.max.y : bb.min.y,
                zi ? bb.max.z : bb.min.z));

        const target = ctr.clone();
        /* Opening estimate, then refined below. */
        let radius = Math.max(
          (size.y/2) / Math.tan(vFov/2) + radXZ,
          radXZ / Math.tan(hFov/2) + radXZ
        );
        /* Fraction of the half-frame the model is allowed to occupy. 0.92 leaves
           a visible margin on the tightest axis; the old 1.06 distance multiplier
           is kept as o.zoom for callers that set it. */
        const FILL = 0.92;
        /* Sit the model slightly above the middle of the frame rather than dead
           centre. Equipment reads better with a little more room under it than
           over it -- dead-centre leaves the subject looking like it is sinking --
           and it keeps the silhouette clear of the caption bar directly beneath
           the canvas. In NDC, where 1.0 is half the frame height. */
        const Y_BIAS = o.yBias != null ? o.yBias : 0.07;
        const THETA_SAMPLES = 24;
        const probe = new THREE.Vector3();

        for (let pass = 0; pass < 5; pass++) {
          let minY = Infinity, maxY = -Infinity, maxAbsX = 0;
          for (let t = 0; t < THETA_SAMPLES; t++) {
            const th = (t / THETA_SAMPLES) * Math.PI * 2;
            const s = Math.sin(phi0);
            camera.position.set(
              target.x + radius * s * Math.sin(th),
              target.y + radius * Math.cos(phi0),
              target.z + radius * s * Math.cos(th)
            );
            camera.lookAt(target);
            camera.updateMatrixWorld(true);
            for (let i = 0; i < corners.length; i++) {
              probe.copy(corners[i]).project(camera);
              if (probe.y < minY) minY = probe.y;
              if (probe.y > maxY) maxY = probe.y;
              const ax = Math.abs(probe.x);
              if (ax > maxAbsX) maxAbsX = ax;
            }
          }
          /* Vertical placement: move the look-at point so the measured box
             centre lands on Y_BIAS rather than wherever perspective put it. One
             NDC unit is half the frustum height at the target's depth. */
          const dy = (minY + maxY) / 2 - Y_BIAS;
          target.y += dy * radius * Math.tan(vFov/2);
          /* Then scale distance to fit. Measured against the biased centre and
             taking the larger side, so the offset cannot push the top out of
             frame -- which a symmetric half-span test would miss. */
          const halfV = Math.max(Math.abs(maxY - dy), Math.abs(minY - dy));
          const need = Math.max(halfV, maxAbsX) / FILL;
          if (isFinite(need) && need > 0) radius *= need;
        }
        radius *= (o.zoom || 1);

        /* Fit the shadow camera to this model. The shapes span a wide range of
           scales -- a DIP-8 on a board stub against a 48U rack -- and a single
           fixed frustum either misses the small ones entirely or spreads 1024px
           across so much world space that the large ones get blocky shadows. */
        const shadowR = Math.max(size.x, size.y, size.z) * 0.85 + 0.5;
        dir.position.set(ctr.x + shadowR*0.8, ctr.y + shadowR*1.2, ctr.z + shadowR*1.0);
        dir.target.position.copy(ctr);
        if (!dirTargetIn) { scene.add(dir.target); dirTargetIn = true; }
        const sc = dir.shadow.camera;
        sc.left = -shadowR; sc.right = shadowR;
        sc.top  =  shadowR; sc.bottom = -shadowR;
        sc.near = 0.1;      sc.far = shadowR * 5;
        sc.updateProjectionMatrix();

        /* Fit the depth range to the model instead of leaving the 0.1..100
           default. These models are only a few world units across, so a 100-unit
           far plane spends nearly all of the depth buffer's precision on empty
           space behind them. Measured effect on the SSAO depth prepass: with
           far=100 the AO buffer bottomed out at 175/255 (almost no occlusion
           detected); fitted, it reaches 69. It also sharpens the shadow map. */
        camera.near = Math.max(0.05, radius * 0.15);
        /* `radius` is now the solved orbit distance, so the far plane is that
           plus the object's own half-diagonal and the room the orbit's maxR
           allows the viewer to pull back to. */
        camera.far  = radius * 4 + radXZ;
        camera.updateProjectionMatrix();

        /* `target` is the solved look-at from the framing pass above -- it is the
           box centre nudged vertically so the model sits centred on screen, not
           the raw bounding-box centre. */
        if (orbit) { orbit.dispose(); orbit = null; }
        orbit = attachOrbit(camera, renderer.domElement, target, {
          radius: radius,
          minR: radius * 0.35,
          maxR: radius * 2.4,
          theta: o.theta,
          phi: o.phi,
          autoRotate: o.autoRotate
        });
      }

      /* Frees one model's GPU resources without touching anything shared.
         Material.dispose() does not release textures in three, so the label
         maps and the shared noise textures are released explicitly -- the
         canvases behind them are cached at module scope and are not touched. */
      function uninstall(){
        if (!model) return;
        clearCallouts(); spinners = []; blinkers = []; anchors = [];
        scene.remove(model);
        model.traverse(function(n){
          if (!n.isMesh && !n.isInstancedMesh && !n.isPoints && !n.isLine) return;
          if (n.geometry) { try { n.geometry.dispose(); } catch (e) {} }
          const ms = Array.isArray(n.material) ? n.material : [n.material];
          for (const m of ms) {
            if (!m) continue;
            if (m.map) { try { m.map.dispose(); } catch (e) {} }
            try { m.dispose(); } catch (e) {}
          }
        });
        if (surfCache) {
          surfCache.forEach(function(t){ try { t.dispose(); } catch (e) {} });
          surfCache = null;
        }
        if (dirTargetIn && dirLight) { scene.remove(dirLight.target); dirTargetIn = false; }
        model = null;
      }

      /* Replace the subject in place. Reuses the context, the environment map,
         the lights, the shadow map and the AO composer, all of which cost more
         to build than the model does. */
      swap = function(nextBuild, nextOpts){
        if (disposed || !nextBuild) return;
        if (nextOpts) for (const k in nextOpts) o[k] = nextOpts[k];
        /* The canvas survives the swap, so its accessible name has to be
           re-stated or a screen reader keeps announcing the previous subject. */
        if (renderer && renderer.domElement) {
          renderer.domElement.setAttribute('aria-label', '3D model of ' + (o.label || 'power equipment'));
        }
        uninstall();
        install(nextBuild);
        run();
      };

      install(build);

      /* Ambient occlusion, opt-in per mount. Until (and unless) the modules
         land, `composer` stays null and the loop renders exactly as before, so
         a slow CDN delays AO rather than the model. */
      /* AO is the single most expensive thing in this file: SSAOPass renders
         the whole scene twice more per frame, into a depth target and a normal
         target, before the colour pass. On the full tier that is affordable and
         it is what makes a crevice read as a crevice. Below it, the honest
         trade is to render fewer, cleaner frames without it. */
      if (o.ao === true && T === 2) {
        loadPostFX().then(function(PP){
          if (disposed) return;
          const cw = container.clientWidth || w, ch = container.clientHeight || h;
          /* Multisampled composer target. This matters more than it looks.

             The renderer is built with antialias:true, but that only applies
             to the DEFAULT framebuffer -- the moment anything renders through
             an EffectComposer, the picture goes into a WebGLRenderTarget
             instead and the renderer's MSAA is bypassed entirely. Composer's
             own default target is created as { type: HalfFloatType } with no
             `samples`, so it has none.

             The effect is not subtle and it is exactly the "glitching" this
             was reported as: measured on the genset at 520x400, 51.9% of
             silhouette edges came back hard-stepped through the AO path
             against 18.7% rendering direct. Under auto-rotation those stepped
             edges crawl, which is what draws the eye on the skid rails and
             the radiator fins.

             Four samples restores it. renderTarget2 is cloned from this one
             inside the composer and WebGLRenderTarget.copy() carries `samples`
             across, so both buffers are multisampled; setSize() below keeps
             them that way on resize. */
          const dpr = renderer.getPixelRatio();
          const msaaRT = new THREE.WebGLRenderTarget(
            Math.max(1, Math.round(cw * dpr)),
            Math.max(1, Math.round(ch * dpr)),
            { type: THREE.HalfFloatType, samples: 4 }
          );
          const c = new PP.EffectComposer(renderer, msaaRT);
          c.addPass(new PP.RenderPass(scene, camera));
          const ssao = new PP.SSAOPass(scene, camera, cw, ch);
          /* Tuned for these models' scale -- they are framed a couple of world
             units across, so the default 8-unit kernel would sample right past
             the geometry and shade nothing. */
          /* Swept these against the AO buffer directly rather than guessing.
             three's default kernel of 8 is sized for scenes hundreds of units
             across: on a 3-unit model every sample lands in empty space and the
             AO buffer comes back white. 0.25 with a tight depth window is where
             crevices actually register. */
          ssao.kernelRadius = 0.25;
          ssao.minDistance  = 0.001;
          ssao.maxDistance  = 0.05;
          c.addPass(ssao);
          /* Required last: the composer renders through linear render targets,
             so tone mapping and the output colour space have to be applied at
             the end instead of by the renderer. Without this the picture comes
             out washed out and in the wrong space. */
          c.addPass(new PP.OutputPass());
          composer = c;
        }).catch(function(){ /* no AO; direct rendering continues */ });
      }

      /* The loop used to run from mount until dispose. A reader who scrolled
         past the showcase and carried on down the homepage kept a GPU busy and
         a battery draining on a picture nobody could see -- and on the homepage,
         where the carousel also kept swapping models behind them, it never
         stopped. Rendering now follows the canvas: paused when it leaves the
         viewport or the tab is hidden, resumed where it left off.

         animId doubles as the "is the loop live" flag, so nothing can start a
         second one. */
      function animate(){
        animId = null;
        if (disposed || !onScreen || document.hidden) return;
        orbit.tick();
        {
          const now = performance.now();
          /* Clamped: the loop pauses off-screen and in a hidden tab, and the
             first frame back must not spin a fan through the whole absence. */
          const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
          lastT = now;
          if (motionOK) {
            for (let i = 0; i < spinners.length; i++) {
              const sp = spinners[i];
              sp.rotation[sp.userData.spin.axis] += sp.userData.spin.rate * dt;
            }
            for (let i = 0; i < blinkers.length; i++) {
              const b = blinkers[i].userData.blink;
              const k = 0.5 + 0.5 * Math.sin((now / 1000 / b.period + b.phase) * Math.PI * 2);
              blinkers[i].material.emissiveIntensity = b.lo + (b.hi - b.lo) * k * k;
            }
          }
          if (coWrap) placeCallouts();
        }
        if (composer) composer.render(); else renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      }
      function run(){
        if (disposed || animId != null || !onScreen || document.hidden) return;
        animId = requestAnimationFrame(animate);
      }
      runRef = run;

      if ('IntersectionObserver' in window) {
        /* A margin, so the first frame is already drawn by the time the stage
           reaches the viewport rather than appearing after it. */
        visIO = new IntersectionObserver(function(entries){
          onScreen = entries[entries.length - 1].isIntersecting;
          if (onScreen) run();
        }, { rootMargin: '150px' });
        visIO.observe(container);
      }
      onVis = function(){ run(); };
      document.addEventListener('visibilitychange', onVis);
      run();

      if (window.ResizeObserver) {
        ro = new ResizeObserver(() => {
          const nw = container.clientWidth||w, nh = container.clientHeight||h;
          if (!nw||!nh) return;
          camera.aspect = nw/nh; camera.updateProjectionMatrix();
          renderer.setSize(nw,nh);
          /* The composer owns its own render targets, so it needs resizing too
             or AO keeps sampling at the old dimensions and smears. */
          if (composer) composer.setSize(nw,nh);
        });
        ro.observe(container);
      }
    }).catch((err) => {
      /* This catch covers the whole mount chain, not just the CDN import, so a
         genuine bug in scene construction used to surface to the user as
         "needs an internet connection" and to the developer as nothing at all.
         The message stays (it is the common case and the actionable one), but
         the underlying error is logged so the other case is debuggable. */
      try { console.error('[VF3D] mount failed:', err); } catch (e) {}
      if (!disposed) container.innerHTML = '<div style="font:12px/1.4 monospace;color:#8896A6;padding:12px;text-align:center">3D view needs an internet connection the first time it loads.</div>';
    });

    function dispose(evicted){
      if (disposed) return;
      disposed = true;
      if (animId) cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
      if (visIO) { try { visIO.disconnect(); } catch (e) {} visIO = null; }
      if (onVis) { document.removeEventListener('visibilitychange', onVis); onVis = null; }
      if (orbit) orbit.dispose();
      /* The PMREM render target is GPU memory owned by this context. It has to
         go before the context is lost, or it is leaked for as long as the page
         lives -- and with LRU eviction cycling viewers, that accumulates. */
      if (envRT) { try { envRT.dispose(); } catch (e) {} envRT = null; }
      /* The composer holds several full-size render targets of its own -- more
         GPU memory than the env map -- so it has to go the same way. */
      if (composer) { try { composer.dispose(); } catch (e) {} composer = null; }
      if (container) { const cw0 = container.querySelector('.vf3d-co-wrap'); if (cw0) container.removeChild(cw0); }
      if (renderer) {
        renderer.dispose();
        // free the GL context immediately rather than waiting for GC, otherwise
        // the browser keeps counting it against the per-page context cap
        const ext = renderer.getContext && renderer.getContext().getExtension('WEBGL_lose_context');
        if (ext) { try { ext.loseContext(); } catch (e) {} }
        if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (evicted && container && !container.childNodes.length) {
        container.innerHTML = '<div style="font:11px/1.4 ui-monospace,monospace;color:#8896A6;padding:10px;text-align:center">3D view paused &mdash; too many open at once</div>';
      }
      const i = live.findIndex(function(x){ return x.dispose === dispose; });
      if (i > -1) live.splice(i, 1);
    }

    /* The handle has always been a bare dispose function and callers call it as
       one, so swap and resume hang off it rather than changing its shape. */
    dispose.swap = function(nextBuild, nextOpts){ if (swap) swap(nextBuild, nextOpts); };
    dispose.resume = function(){ if (runRef) runRef(); };

    live.push({ dispose: dispose, container: container });
    retire();
    return dispose;
  };

  /* ---------- assembly mounts, one per tool ---------- */

  /* items: [{shape, u, color}] top-to-bottom. */
  VF3D.mountRack = function(container, items, rackU, opts){
    const list = (items || []).map(function(it){
      return { shape: it.shape, u: it.u || 1, color: normColor(it.color) };
    });
    const accent = normColor((opts||{}).accent || '#2B6CB0');
    return VF3D.mountScene(container, function(THREE){
      return buildRackAssembly(THREE, list, rackU || 42, accent);
    }, { zoom: 1.12, theta: 0.55 });
  };

  /* items: [{shape, color}] left-to-right; opts.shell draws the container skin
     (POD) versus leaving it open (skid). */
  VF3D.mountPod = function(container, items, opts){
    const o = opts || {};
    const list = (items || []).map(function(it){
      return { shape: it.shape, color: normColor(it.color), rotY: it.rotY };
    });
    return VF3D.mountScene(container, function(THREE){
      return buildPodAssembly(THREE, list, { shell: !!o.shell });
    }, { zoom: 1.2, theta: 0.7 });
  };

  /* items: [{shape, color}] in circuit order, source first. */
  VF3D.mountCircuit = function(container, items){
    const list = (items || []).map(function(it){
      return { shape: it.shape, color: normColor(it.color) };
    });
    return VF3D.mountScene(container, function(THREE){
      return buildCircuitAssembly(THREE, list);
    }, { zoom: 1.18, theta: 0.6 });
  };

  window.VF3D = VF3D;
})();
