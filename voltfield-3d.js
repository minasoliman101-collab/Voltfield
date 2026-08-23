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

  const BUILDERS = {
    transformer: buildTransformer,
    switchgear: buildSwitchgear,
    battery: buildBatteryRack,
    genset: buildGenset
  };
  function resolveBuilder(shapeId){ return BUILDERS[shapeId] || buildGeneric; }

  /* ---------- hand-rolled drag-to-rotate + wheel-to-zoom, spherical camera ---------- */
  function attachOrbit(camera, dom, target){
    let theta = 0.9, phi = 1.15, radius = 5.6;
    let autoRotate = true, dragging = false, lastX = 0, lastY = 0;
    const minPhi = 0.35, maxPhi = Math.PI - 0.35, minR = 2.6, maxR = 9;

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
      radius = Math.min(maxR, Math.max(minR, radius + e.deltaY*0.0035));
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

  /* ---------- public API ---------- */
  const VF3D = {};

  /* Mounts a rotatable 3D shape into `container` (any block element with a
     real width/height). Returns a dispose() function -- call it before
     removing/replacing the container to stop the render loop and free the
     WebGL context; skipping this on a page that toggles the view on and off
     repeatedly will leak GPU contexts. */
  VF3D.mount = function(container, shapeId, colorHex){
    let disposed = false, renderer, camera, orbit, animId, ro;

    loadThree().then(THREE => {
      if (disposed) return;
      const w = container.clientWidth || 300, h = container.clientHeight || 260;

      const scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, w/h, 0.1, 100);

      renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
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

      const color = typeof colorHex === 'number' ? colorHex : parseInt(String(colorHex||'2B6CB0').replace('#',''),16);
      const model = resolveBuilder(shapeId)(THREE, color);
      model.position.y -= 0.9;
      scene.add(model);

      const target = new THREE.Vector3(0, 0.1, 0);
      orbit = attachOrbit(camera, renderer.domElement, target);

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

    return function dispose(){
      disposed = true;
      if (animId) cancelAnimationFrame(animId);
      if (ro) ro.disconnect();
      if (orbit) orbit.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  };

  window.VF3D = VF3D;
})();
