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

  const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js';
  let threeModPromise = null;
  function loadThree(){
    if (!threeModPromise) threeModPromise = import(THREE_URL);
    return threeModPromise;
  }

  /* ---------- shape builders: each returns a THREE.Group centered near the origin ---------- */
  function buildTransformer(THREE, color){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color, metalness:.35, roughness:.55});
    const dark = new THREE.MeshStandardMaterial({color:0x22334C, metalness:.4, roughness:.5});

    const tank = new THREE.Mesh(new THREE.BoxGeometry(2.4,1.6,1.4), mat);
    tank.position.y = 0.8; g.add(tank);

    for (const side of [-1,1]) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.45,1.3,0.22), dark);
      fin.position.set(side*1.5, 0.75, 0); g.add(fin);
    }

    const cons = new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,1.4,16), mat);
    cons.rotation.z = Math.PI/2;
    cons.position.set(0, 1.72, 0.55); g.add(cons);

    for (const x of [-0.7,0,0.7]) {
      const bush = new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.1,0.7,10), dark);
      bush.position.set(x, 1.95, -0.3); g.add(bush);
    }

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6,0.15,1.6), dark);
    base.position.y = -0.075; g.add(base);
    return g;
  }

  function buildSwitchgear(THREE, color){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color, metalness:.3, roughness:.6});
    const dark = new THREE.MeshStandardMaterial({color:0x22334C, metalness:.4, roughness:.5});
    const signal = new THREE.MeshStandardMaterial({color:0xFFC400, emissive:0xFFC400, emissiveIntensity:.2, roughness:.4});

    const n = 3, w = 0.85, h = 1.9;
    for (let i=0;i<n;i++){
      const cab = new THREE.Mesh(new THREE.BoxGeometry(w*0.9,h,1.0), mat);
      cab.position.set((i-(n-1)/2)*w, h/2, 0); g.add(cab);
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.03,12), signal);
      dot.rotation.x = Math.PI/2;
      dot.position.set((i-(n-1)/2)*w, h*0.78, 0.51); g.add(dot);
    }
    const bus = new THREE.Mesh(new THREE.BoxGeometry(w*n+0.05, 0.12, 1.05), dark);
    bus.position.y = h + 0.06; g.add(bus);
    return g;
  }

  function buildBatteryRack(THREE, color){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color, metalness:.25, roughness:.65});
    const mod = new THREE.MeshStandardMaterial({color:0x101B2D, metalness:.3, roughness:.5});

    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8,2.2,1.1), mat);
    cab.position.y = 1.1; g.add(cab);

    const cols=3, rows=4, mw=1.5/cols, mh=1.8/rows;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      const m = new THREE.Mesh(new THREE.BoxGeometry(mw*0.8,mh*0.76,0.05), mod);
      m.position.set((c-(cols-1)/2)*mw, 0.35+r*mh, 0.58); g.add(m);
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0,0.12,1.3), mod);
    base.position.y = -0.06; g.add(base);
    return g;
  }

  function buildGenset(THREE, color){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color, metalness:.3, roughness:.6});
    const dark = new THREE.MeshStandardMaterial({color:0x22334C, metalness:.4, roughness:.5});

    const skid = new THREE.Mesh(new THREE.BoxGeometry(3.0,0.2,1.2), dark);
    skid.position.y = 0.1; g.add(skid);

    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.6,20), mat);
    engine.rotation.z = Math.PI/2;
    engine.position.set(-0.4,0.75,0); g.add(engine);

    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.5,1.1,1.1), dark);
    radiator.position.set(1.15,0.75,0); g.add(radiator);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.0,0.08,1.2), dark);
    canopy.position.y = 1.55; g.add(canopy);
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
  function mats(THREE, color){
    return {
      body: new THREE.MeshStandardMaterial({color, metalness:.3, roughness:.6}),
      dark: new THREE.MeshStandardMaterial({color:0x22334C, metalness:.4, roughness:.5}),
      deep: new THREE.MeshStandardMaterial({color:0x101B2D, metalness:.3, roughness:.55}),
      gold: new THREE.MeshStandardMaterial({color:0xFFC400, emissive:0xFFC400, emissiveIntensity:.22, roughness:.4}),
      lit:  new THREE.MeshStandardMaterial({color:0x7FCC9B, emissive:0x7FCC9B, emissiveIntensity:.3, roughness:.4})
    };
  }
  function box(THREE, m, w,h,d, x,y,z){
    const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m);
    b.position.set(x,y,z); return b;
  }
  function cyl(THREE, m, rt,rb,h, seg, x,y,z){
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||14), m);
    c.position.set(x,y,z); return c;
  }

  /* ---------- 19" rack gear: one chassis helper, different faceplates ----------
     Real proportions: a 19" rack unit is 19in wide and 1.75in per U, so the
     chassis is deliberately wide and thin rather than a generic cube. */
  const RU = 0.37, RW = 4.0, RD = 2.2;
  function rackChassis(THREE, M, u){
    const g = new THREE.Group();
    const h = u * RU;
    g.add(box(THREE, M.body, RW, h, RD, 0, h/2, 0));
    // rack ears
    g.add(box(THREE, M.dark, 0.18, h, 0.09, -(RW/2)-0.09, h/2, RD/2 - 0.05));
    g.add(box(THREE, M.dark, 0.18, h, 0.09,  (RW/2)+0.09, h/2, RD/2 - 0.05));
    g.userData.h = h;
    return g;
  }
  function faceZ(){ return RD/2 + 0.012; }

  function buildServer(THREE, color, u){
    const M = mats(THREE, color); u = u || 1;
    const g = rackChassis(THREE, M, u); const h = g.userData.h;
    // drive bays down the left of the faceplate
    const bays = u === 1 ? 4 : 8, cols = u === 1 ? 4 : 4, rows = u === 1 ? 1 : 2;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){
      g.add(box(THREE, M.deep, 0.42, (h/rows)*0.5, 0.02, -1.45 + c*0.5, (h/rows)*(r+0.5), faceZ()));
    }
    // vent block on the right
    for (let i=0;i<6;i++) g.add(box(THREE, M.deep, 0.05, h*0.55, 0.02, 0.9 + i*0.12, h/2, faceZ()));
    g.add(cyl(THREE, M.lit, 0.035,0.035,0.02, 10, 1.78, h*0.5, faceZ()).rotateX(Math.PI/2));
    return g;
  }
  function buildSwitchNet(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    // two rows of RJ45 ports
    for (let r=0;r<2;r++) for (let i=0;i<12;i++){
      g.add(box(THREE, M.deep, 0.11, 0.06, 0.02, -1.7 + i*0.29, h*(r?0.66:0.34), faceZ()));
    }
    g.add(box(THREE, M.gold, 0.28, 0.07, 0.02, 1.72, h*0.5, faceZ()));
    return g;
  }
  function buildStorage(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 2); const h = g.userData.h;
    // dense drive carriers
    for (let r=0;r<2;r++) for (let c=0;c<12;c++){
      g.add(box(THREE, M.deep, 0.24, h*0.38, 0.02, -1.72 + c*0.31, h*(r?0.72:0.28), faceZ()));
    }
    return g;
  }
  function buildUPSRack(THREE, color, u){
    const M = mats(THREE, color); u = u || 4;
    const g = rackChassis(THREE, M, u); const h = g.userData.h;
    g.add(box(THREE, M.deep, 1.5, h*0.42, 0.02, -0.95, h*0.55, faceZ()));      // display
    g.add(box(THREE, M.lit,  0.5,  0.07,  0.02, -1.42, h*0.55, faceZ()));       // status strip
    for (let i=0;i<7;i++) g.add(box(THREE, M.deep, 0.06, h*0.6, 0.02, 0.5 + i*0.19, h*0.5, faceZ()));
    return g;
  }
  function buildPDU(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    for (let i=0;i<10;i++){
      g.add(cyl(THREE, M.deep, 0.055,0.055,0.02, 10, -1.7 + i*0.38, h*0.5, faceZ()).rotateX(Math.PI/2));
    }
    g.add(box(THREE, M.gold, 0.22, 0.08, 0.02, 1.75, h*0.5, faceZ()));
    return g;
  }
  function buildKVM(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    g.add(box(THREE, M.deep, 3.0, h*0.55, 0.02, 0, h*0.5, faceZ()));            // screen bezel
    g.add(box(THREE, M.dark, 2.7, h*0.34, 0.015, 0, h*0.5, faceZ()+0.008));     // screen
    return g;
  }
  function buildBlank(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 1); const h = g.userData.h;
    g.add(box(THREE, M.dark, 3.4, h*0.3, 0.015, 0, h*0.5, faceZ()));            // simple stamped rib
    return g;
  }
  function buildCableMgr(THREE, color){
    const M = mats(THREE, color);
    const g = rackChassis(THREE, M, 2); const h = g.userData.h;
    for (let i=0;i<6;i++){                                                     // D-ring fingers
      g.add(box(THREE, M.dark, 0.14, h*0.8, 0.30, -1.6 + i*0.64, h*0.5, faceZ()+0.15));
    }
    return g;
  }

  /* ---------- electrical gear ---------- */
  function buildBreaker(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    g.add(box(THREE, M.body, 1.5, 2.1, 1.15, 0, 1.05, 0));                     // molded case
    g.add(box(THREE, M.deep, 0.72, 0.62, 0.10, 0, 1.32, 0.60));                // window
    g.add(box(THREE, M.gold, 0.30, 0.42, 0.22, 0, 1.32, 0.66));                // toggle handle
    g.add(box(THREE, M.dark, 1.1, 0.20, 0.72, 0, 2.02, 0));                    // line-side lug shroud
    g.add(box(THREE, M.dark, 1.1, 0.20, 0.72, 0, 0.10, 0));                    // load-side lug shroud
    for (let i=-1;i<=1;i++) {
      g.add(cyl(THREE, M.dark, 0.10,0.10,0.34, 10, i*0.42, 2.24, 0));
      g.add(cyl(THREE, M.dark, 0.10,0.10,0.34, 10, i*0.42, -0.14, 0));
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
    const body = cyl(THREE, M.body, 0.85,0.85,2.2, 24, 0, 1.0, 0); body.rotation.z = Math.PI/2; g.add(body);
    for (let i=0;i<9;i++){                                                     // cooling fins
      const f = cyl(THREE, M.dark, 0.92,0.92,0.06, 24, -0.95 + i*0.24, 1.0, 0);
      f.rotation.z = Math.PI/2; g.add(f);
    }
    const shaft = cyl(THREE, M.dark, 0.17,0.17,0.9, 14, 1.55, 1.0, 0); shaft.rotation.z = Math.PI/2; g.add(shaft);
    g.add(box(THREE, M.dark, 0.75, 0.55, 0.75, -0.1, 1.95, 0));                // terminal box
    g.add(box(THREE, M.dark, 2.3, 0.16, 1.5, 0, 0.08, 0));                     // base/feet
    return g;
  }
  function buildPanel(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    g.add(box(THREE, M.body, 1.7, 2.9, 0.75, 0, 1.45, 0));                     // enclosure
    g.add(box(THREE, M.dark, 1.5, 2.6, 0.05, 0, 1.45, 0.40));                  // dead front
    for (let r=0;r<8;r++) for (const s of [-1,1]) {                            // breaker handles
      g.add(box(THREE, M.deep, 0.5, 0.19, 0.06, s*0.36, 2.42 - r*0.29, 0.44));
    }
    g.add(cyl(THREE, M.gold, 0.06,0.06,0.10, 10, 0.72, 0.34, 0.44));           // latch
    return g;
  }
  function buildBusway(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    g.add(box(THREE, M.body, 4.4, 0.85, 0.85, 0, 1.4, 0));                     // duct run
    for (const x of [-1.5, 0, 1.5]) g.add(box(THREE, M.dark, 0.16, 1.0, 1.0, x, 1.4, 0));   // joints
    for (const x of [-2.2, 2.2]) g.add(box(THREE, M.dark, 0.12, 1.05, 1.05, x, 1.4, 0));    // end flanges
    g.add(box(THREE, M.dark, 0.8, 0.55, 0.55, 0.75, 0.85, 0));                 // tap-off box
    g.add(box(THREE, M.gold, 0.22, 0.10, 0.06, 0.75, 0.85, 0.30));
    for (const x of [-1.6, 1.6]) {                                            // hangers
      g.add(box(THREE, M.dark, 0.08, 1.0, 0.08, x, 2.32, 0));
    }
    return g;
  }
  function buildCooling(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    g.add(box(THREE, M.body, 2.0, 2.8, 1.5, 0, 1.4, 0));                       // CRAH cabinet
    for (let i=0;i<2;i++){                                                     // fan grilles
      const ring = cyl(THREE, M.dark, 0.42,0.42,0.08, 22, 0, 0.85 + i*1.05, 0.78);
      ring.rotation.x = Math.PI/2; g.add(ring);
      for (let b=0;b<4;b++){
        const bl = box(THREE, M.deep, 0.72, 0.06, 0.05, 0, 0.85 + i*1.05, 0.82);
        bl.rotation.z = b * Math.PI/4; g.add(bl);
      }
    }
    for (const s of [-1,1]) g.add(cyl(THREE, M.dark, 0.16,0.16,0.9, 12, s*0.7, 2.9, -0.4)); // supply/return pipes
    g.add(box(THREE, M.dark, 2.2, 0.14, 1.7, 0, 0.07, 0));
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
    const m = new THREE.MeshStandardMaterial({color:PCB_GREEN, metalness:.15, roughness:.75});
    g.add(box(THREE, m, w||3.0, 0.10, d||2.2, 0, -0.05, 0));
    return g;
  }
  function leadMat(THREE){ return new THREE.MeshStandardMaterial({color:LEAD, metalness:.9, roughness:.28}); }
  function goldMat(THREE){ return new THREE.MeshStandardMaterial({color:0xD4A72C, metalness:.85, roughness:.3}); }
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
      g.add(pin(THREE, L, s*1.38, 0, 0.72));
    }
    return g;
  }

  function buildCeramicCap(THREE){
    const g = pcbBase(THREE, 2.2, 1.6);
    const body = new THREE.MeshStandardMaterial({color:0xC98A2E, metalness:.1, roughness:.72});
    const L = leadMat(THREE);
    const disc = cyl(THREE, body, 0.52,0.52, 0.20, 22, 0, 0.86, 0);   // the classic disc
    disc.rotation.x = Math.PI/2; g.add(disc);
    for (const s of [-1,1]) g.add(pin(THREE, L, s*0.22, 0, 0.80));
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
    for (const s of [-1,1]) g.add(pin(THREE, L, s*0.20, 0, 0.12));
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
    for (const s of [-1,1]) g.add(pin(THREE, L, s*0.16, 0, 0.42));
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
    for (const s of [-1,1]) {
      const run = cyl(THREE, L, 0.045,0.045, 0.6, 8, s*0.78, 0.72, 0); run.rotation.z = Math.PI/2; g.add(run);
      g.add(pin(THREE, L, s*1.06, 0, 0.72));
    }
    return g;
  }

  function buildPushButton(THREE){
    const g = pcbBase(THREE, 2.4, 2.4);
    const body = new THREE.MeshStandardMaterial({color:BLACK, metalness:.25, roughness:.6});
    const cap  = new THREE.MeshStandardMaterial({color:0xC23B3B, metalness:.2, roughness:.5});
    const L = leadMat(THREE);
    g.add(box(THREE, body, 1.25, 0.5, 1.25, 0, 0.25, 0));              // tactile switch body
    g.add(cyl(THREE, cap, 0.24,0.24, 0.32, 18, 0, 0.62, 0));           // plunger
    for (const sx of [-1,1]) for (const sz of [-1,1]) g.add(pin(THREE, L, sx*0.55, sz*0.55, 0.12));
    return g;
  }

  function buildHeader(THREE, n, vertical){
    const g = pcbBase(THREE, Math.max(2.0, n*0.55 + 0.9), 1.6);
    const body = new THREE.MeshStandardMaterial({color:BLACK, metalness:.2, roughness:.65});
    const G = goldMat(THREE);
    const pitch = 0.55, span = (n-1)*pitch;
    g.add(box(THREE, body, span + 0.5, 0.42, 0.5, 0, 0.21, 0));        // plastic strip
    for (let i=0;i<n;i++){
      const x = -span/2 + i*pitch;
      g.add(box(THREE, G, 0.13, 1.35, 0.13, x, 0.62, 0));              // square pin above
      g.add(box(THREE, G, 0.11, 0.55, 0.11, x, -0.20, 0));             // and below the board
    }
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
    for (let i=0;i<4;i++){                                             // 4 pins a side
      const z = -D/2 + 0.32 + i*0.42;
      for (const sx of [-1,1]) {
        g.add(box(THREE, L, 0.28, 0.06, 0.16, sx*(W/2 + 0.11), 0.42, z));   // shoulder
        g.add(box(THREE, L, 0.09, 0.75, 0.16, sx*(W/2 + 0.22), 0.06, z));   // leg
      }
    }
    return g;
  }

  function buildPotentiometer(THREE){
    const g = pcbBase(THREE, 2.6, 2.2);
    const can = new THREE.MeshStandardMaterial({color:0x2C3E56, metalness:.55, roughness:.42});
    const shaft = new THREE.MeshStandardMaterial({color:0xD8DEE6, metalness:.7, roughness:.35});
    const L = leadMat(THREE);
    g.add(cyl(THREE, can, 0.70,0.70, 0.45, 24, 0, 0.28, 0));           // round body
    g.add(cyl(THREE, shaft, 0.16,0.16, 0.85, 16, 0, 0.90, 0));         // adjustment shaft
    const slot = box(THREE, new THREE.MeshStandardMaterial({color:0x3A3A42, roughness:.6}), 0.26, 0.05, 0.06, 0, 1.32, 0);
    g.add(slot);                                                       // screwdriver slot
    for (const x of [-0.5, 0, 0.5]) g.add(pin(THREE, L, x, 0.45, 0.16));  // wiper + two ends
    return g;
  }

  /* ---------- calculator subjects ---------- */

  function buildPVModule(THREE, color){
    const M = mats(THREE, color); const g = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({color:0x16305A, metalness:.55, roughness:.28});
    const frame = new THREE.MeshStandardMaterial({color:0xB9C2CC, metalness:.75, roughness:.35});
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

  /* Per-shape opening camera angle. The default (phi 1.15) looks in from a bit
     above the horizon, which suits upright equipment but reduces a broad flat
     object to a line -- a tilted PV module was almost invisible until the
     camera was raised over it. Smaller phi = higher viewpoint. */
  const VIEW_HINT = {
    pvmodule: { phi: 0.62 },
    groundrod: { phi: 1.30 },   // lower, so the buried length reads against grade
    blank:    { phi: 0.95 },
    cablemgr: { phi: 0.95 }
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
    function wheel(e){
      e.preventDefault();
      radius = Math.min(maxR, Math.max(minR, radius + e.deltaY*zoomStep));
      apply();
    }
    function pdown(e){ try{dom.setPointerCapture(e.pointerId);}catch(err){} down(e.clientX,e.clientY); }
    function pmove(e){ move(e.clientX,e.clientY); }

    dom.addEventListener('pointerdown', pdown);
    dom.addEventListener('pointermove', pmove);
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', up);
    dom.addEventListener('wheel', wheel, {passive:false});
    apply();

    return {
      tick(){ if (autoRotate) { theta += 0.0032; apply(); } },
      dispose(){
        dom.removeEventListener('pointerdown', pdown);
        dom.removeEventListener('pointermove', pmove);
        dom.removeEventListener('pointerup', up);
        dom.removeEventListener('pointercancel', up);
        dom.removeEventListener('wheel', wheel);
      }
    };
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
  VF3D.mount = function(container, shapeId, colorHex){
    const color = normColor(colorHex);
    const hint = VIEW_HINT[shapeId] || {};
    return VF3D.mountScene(container, function(THREE){
      return resolveBuilder(shapeId)(THREE, color);
    }, hint);
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
    let disposed = false, renderer, camera, orbit, animId, ro;

    loadThree().then(THREE => {
      if (disposed) return;
      const w = container.clientWidth || 300, h = container.clientHeight || 260;

      const scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, w/h, 0.1, 100);

      // preserveDrawingBuffer keeps the last frame readable after render, which
      // lets a viewer right-click-save the 3D view (and makes the shape library
      // testable by reading frames back). Negligible cost at these sizes.
      renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
      renderer.setSize(w,h);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab';
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x22334C, 0.95));
      const dir = new THREE.DirectionalLight(0xffffff, 1.15);
      dir.position.set(4,6,5); scene.add(dir);
      const fill = new THREE.DirectionalLight(0xAFC0D3, 0.35);
      fill.position.set(-4,2,-3); scene.add(fill);

      const model = build(THREE);
      scene.add(model);

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
      const distV = (size.y/2) / Math.tan(vFov/2) + radXZ;
      const distH = radXZ / Math.tan(hFov/2) + radXZ;
      const fit = Math.max(distV, distH);
      const radius = fit * (o.zoom || 1.25);

      const target = new THREE.Vector3(ctr.x, ctr.y, ctr.z);
      orbit = attachOrbit(camera, renderer.domElement, target, {
        radius: radius,
        minR: radius * 0.35,
        maxR: radius * 2.4,
        theta: o.theta,
        phi: o.phi,
        autoRotate: o.autoRotate
      });

      function animate(){
        if (disposed) return;
        orbit.tick();
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      }
      animate();

      if (window.ResizeObserver) {
        ro = new ResizeObserver(() => {
          const nw = container.clientWidth||w, nh = container.clientHeight||h;
          if (!nw||!nh) return;
          camera.aspect = nw/nh; camera.updateProjectionMatrix();
          renderer.setSize(nw,nh);
        });
        ro.observe(container);
      }
    }).catch(() => {
      if (!disposed) container.innerHTML = '<div style="font:12px/1.4 monospace;color:#8896A6;padding:12px;text-align:center">3D view needs an internet connection the first time it loads.</div>';
    });

    function dispose(evicted){
      if (disposed) return;
      disposed = true;
      if (animId) cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
      if (orbit) orbit.dispose();
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
