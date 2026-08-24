/* VOLTFIELD -- shared component visuals for the practice tools.

   One registry describing every physical thing a tool lets you place, with
   three kinds of visual attached:

     - a reference illustration (already in images/parts/, previously only ever
       surfaced on part pages),
     - a procedural 3D shape id (voltfield-3d.js),
     - a short plain-English note on what the component actually does.

   Why a shared registry: the sandbox, POD designer, rack builder and the
   calculators were each describing the same equipment in their own words with
   no picture at all. Keeping it in one place means a transformer is explained
   and illustrated identically wherever it appears, and a new tool gets visuals
   by naming ids rather than re-authoring content.

   IMPORTANT -- WebGL budget: thumbnails are plain <img> and cost nothing, so
   every tile can have one. 3D costs a GL context and browsers cap those, so
   this module deliberately offers ONE shared inspector viewer that re-mounts
   on selection rather than a grid of live viewers. See the live-instance note
   in voltfield-3d.js. */
(function(){
  'use strict';

  const IMG = 'images/parts/';

  /* img: basename in images/parts/ (a .webp + .jpg pair), or null where the
     library genuinely has no illustration for it -- better an honest 3D-only
     card than a picture of something else. */
  const INFO = {
    /* ---------- electrical / plant ---------- */
    transformer: {
      name: 'Pad-mount transformer', shape: 'transformer', color: '#2B6CB0',
      img: 'dc-pad-mount-transformers',
      what: 'Steps the incoming utility voltage down to the voltage the facility actually distributes.',
      note: 'Its impedance (%Z) sets how much fault current can reach everything downstream: lower %Z means a stiffer source and a HIGHER available fault current, which is why it drives the interrupting rating you need on the main breaker.'
    },
    switchgear: {
      name: 'LV switchgear', shape: 'switchgear', color: '#2B6CB0',
      img: 'dc-lv-switchgear',
      what: 'The main protection and disconnect point for the whole electrical lineup.',
      note: 'Sized by continuous bus ampacity and by short-circuit withstand -- both matter, and they are separate ratings.'
    },
    breaker: {
      name: 'Molded-case breaker', shape: 'breaker', color: '#2B6CB0',
      img: 'dc-molded-case-breakers-mccb-15-1200a',
      what: 'Opens the circuit on an overload or a short circuit.',
      note: 'Two different numbers: the trip rating (AT) is the current it carries continuously; the interrupting rating (kAIC) is the fault current it can safely break. A breaker can be correctly sized on AT and still be dangerously under-rated on kAIC.'
    },
    conductor: {
      name: 'LV power cable', shape: 'conductor', color: '#2E7D4F',
      img: 'dc-lv-power-cable',
      what: 'Carries the current from the source to the load.',
      note: 'Two limits apply at once: ampacity (will it overheat?) and voltage drop (will the load still see usable voltage at the far end?). On long runs voltage drop usually decides the size, not ampacity.'
    },
    motor: {
      name: 'AC induction motor', shape: 'motor', color: '#5B6B7E',
      img: 'mro-ac-motors',
      what: 'Converts electrical power to shaft power -- the load at the end of a branch circuit.',
      note: 'Draws several times its running current while starting, which is what causes the momentary voltage dip other equipment on the same bus will see.'
    },
    panel: {
      name: 'Panelboard', shape: 'panel', color: '#2B6CB0',
      img: 'bess-switchboard-ac-panels',
      what: 'Splits one feeder into many branch circuits, each with its own breaker.',
      note: 'The bus rating and the main breaker are separate: a 400 A panel may be fed by a smaller main, but never the reverse.'
    },
    busway: {
      name: 'Plug-in busway', shape: 'busway', color: '#2B6CB0',
      img: 'dc-busway-feeder-plug-in',
      what: 'A rigid distribution run you tap into anywhere along its length.',
      note: 'Used instead of many parallel cable feeders when loads move or get added later -- you add a tap-off box rather than pulling new cable.'
    },
    cooling: {
      name: 'CRAH / CRAC unit', shape: 'cooling', color: '#2B6CB0',
      img: 'dc-crah-crac-units',
      what: 'Removes the heat the IT equipment produces.',
      note: 'Cooling load tracks the electrical load closely -- roughly every kW delivered to the racks becomes a kW of heat to reject.'
    },
    genset: {
      name: 'Diesel genset', shape: 'genset', color: '#9C4221',
      img: 'dc-diesel-gensets',
      what: 'Standby generation for when the utility feed is lost.',
      note: 'Takes time to start and accept load, so it covers a long outage -- it does not cover the gap at the instant of the transfer. That is what a UPS is for.'
    },
    battery: {
      name: 'Battery / static UPS', shape: 'battery', color: '#B7791F',
      img: 'dc-ups-systems-static',
      what: 'Rides through the seconds between losing the utility and the generator picking up load.',
      note: 'Sized in both power (can it carry the load?) and energy (for how long?). The two are independent choices.'
    },

    /* ---------- 19" rack gear ----------
       No reference illustrations exist for most of these, so they are 3D-only
       rather than borrowed from a different category. */
    server:    { name: '1U rack server', shape: 'server', color: '#2B6CB0', img: null,
      what: 'A single compute node, one rack unit tall.',
      note: 'The power figure on a spec sheet is usually the supply rating, not what it actually draws -- budget on measured or nameplate-derated load or you will over-size every circuit.' },
    server2u:  { name: '2U rack server', shape: 'server2u', color: '#2B6CB0', img: null,
      what: 'A taller compute node with room for more drives and cooling.',
      note: 'Buys you airflow and drive bays at the cost of rack density.' },
    netswitch: { name: 'Top-of-rack switch', shape: 'netswitch', color: '#2E7D4F',
      img: 'mro-datacomm-networking',
      what: 'Aggregates the network connections for everything in the rack.',
      note: 'Usually mounted at the top so every server has a short, equal-length run to it.' },
    storage:   { name: 'Storage array', shape: 'storage', color: '#B7791F', img: null,
      what: 'A chassis full of drives presented to the servers as storage.',
      note: 'Among the heaviest things in the rack when fully populated -- weight, not U-space, is often what runs out first.' },
    ups:       { name: 'Rack-mount UPS', shape: 'ups', color: '#9C4221',
      img: 'dc-ups-systems-static',
      what: 'Battery backup for one rack rather than the whole room.',
      note: 'Heavy and bottom-mounted: putting it high raises the rack centre of gravity enough to matter when it is rolled.' },
    pdu:       { name: 'Rack PDU', shape: 'pdu', color: '#5B6B7E',
      img: 'dc-rack-pdus',
      what: 'Distributes the rack circuit to the individual equipment outlets.',
      note: 'A metered PDU is how you find out what the rack actually draws, rather than what the spec sheets claimed.' },
    kvm:       { name: 'KVM console', shape: 'kvm', color: '#5B6B7E', img: null,
      what: 'A fold-out keyboard and screen for working on equipment at the rack.',
      note: 'Draws almost no power but still consumes a rack unit.' },
    blank:     { name: 'Blanking panel', shape: 'blank', color: '#5B6B7E', img: null,
      what: 'Fills an empty rack unit.',
      note: 'Not cosmetic: an open U lets hot exhaust air recirculate to the front of the rack and be drawn back in, which raises intake temperature on everything above it.' },
    cablemgr:  { name: 'Cable manager', shape: 'cablemgr', color: '#5B6B7E', img: null,
      what: 'Routes and dresses the cabling between equipment.',
      note: 'Costs rack units but keeps airflow paths clear and makes anything above it serviceable.' },

    /* ---------- through-hole PCB parts (PCB Layout tool) ----------
       All img:null on purpose. The illustration library covers industrial
       electrical supply, not electronics: the nearest "LED" entry is light
       FIXTURES and the nearest "capacitor" is a power film cap, and showing
       either next to a through-hole part would actively mislead someone
       learning what these look like. 3D and text only until real ones exist. */
    res:   { name: 'Resistor', shape: 'res', color: '#2B6CB0', img: null,
      what: 'Limits current, or sets a voltage by dividing it.',
      note: 'Not polarised — it goes in either way round. The colour bands, read from the end with the bands crowded toward it, give the value.' },
    ccap:  { name: 'Ceramic capacitor', shape: 'ccap', color: '#2B6CB0', img: null,
      what: 'Small non-polarised capacitor, usually smoothing supply noise close to a chip.',
      note: 'Either way round is fine. Placed as near the chip\'s power pins as the layout allows, because the point is to supply fast current locally.' },
    ecap:  { name: 'Electrolytic capacitor', shape: 'ecap', color: '#2B6CB0', img: null,
      what: 'Larger capacitor for bulk energy storage and supply smoothing.',
      note: 'POLARISED — the stripe marks the negative leg. Fitting one backwards is the classic way to make a capacitor vent.' },
    led:   { name: 'LED', shape: 'led', color: '#B7791F', img: null,
      what: 'Emits light when current flows the right way through it.',
      note: 'Polarised, and it does not limit its own current: without a series resistor it draws until something fails. The longer leg is the anode (+).' },
    diode: { name: 'Diode', shape: 'diode', color: '#5B6B7E', img: null,
      what: 'Lets current pass one way and blocks it the other.',
      note: 'The painted band marks the cathode — the end current flows OUT of in normal conduction.' },
    btn:   { name: 'Push button', shape: 'btn', color: '#5B6B7E', img: null,
      what: 'Momentary switch: closes the circuit only while pressed.',
      note: 'The four pins are two pairs already joined inside, so which pair you wire across decides whether it switches anything at all.' },
    hdr2:  { name: '2-pin header', shape: 'hdr2', color: '#5B6B7E', img: null,
      what: 'Two pins for a connection off the board — typically power in.',
      note: 'Nothing enforces polarity on a plain header; the board silkscreen is the only thing stopping a reversed plug.' },
    hdr4:  { name: '4-pin header', shape: 'hdr4', color: '#5B6B7E', img: null,
      what: 'Four pins for a multi-wire connection off the board.',
      note: 'Pin 1 is marked on the board, not the part — orientation is a layout decision.' },
    dip8:  { name: 'DIP-8 IC', shape: 'dip8', color: '#5B6B7E', img: null,
      what: 'An eight-pin chip in a dual in-line package, four pins a side.',
      note: 'The notch (and the dot beside pin 1) is the only orientation cue. Pins count anticlockwise from pin 1 when viewed from above.' },
    pot:   { name: 'Potentiometer', shape: 'pot', color: '#5B6B7E', img: null,
      what: 'A variable resistor you adjust with a shaft or screwdriver.',
      note: 'Three pins: the outer two are the whole resistive track, the middle one is the wiper that moves along it. Using only the wiper and one end makes it a variable resistor instead of a divider.' }
  };

  function has(id){ return Object.prototype.hasOwnProperty.call(INFO, id); }
  function get(id){ return INFO[id] || null; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* A reference illustration, WebP with JPG fallback. Removes itself if the
     file is missing rather than leaving a broken-image box on the page.

     Loads EAGERLY by default: this is the picture the user just asked for by
     selecting a component, so deferring it is exactly backwards -- it is the
     focal content, not an offscreen extra. Pass {lazy:true} where the image
     genuinely sits below the fold. Tile thumbnails stay lazy; there can be
     dozens of those and most are never looked at. */
  function photoHTML(id, opts){
    const o = opts || {}, c = get(id);
    if (!c || !c.img) return '';
    const alt = esc(c.name + ' — reference illustration');
    const cls = o.cls || 'vfcv-photo';
    const size = o.size || 300;
    const load = o.lazy ? ' loading="lazy"' : '';
    return '<figure class="' + cls + '">' +
      '<picture>' +
        '<source srcset="' + IMG + c.img + '.webp" type="image/webp">' +
        '<img src="' + IMG + c.img + '.jpg" alt="' + alt + '" width="' + size + '" height="' + size +
          '"' + load + ' decoding="async" onerror="this.closest(\'figure\').remove()">' +
      '</picture>' +
      (o.caption === false ? '' : '<figcaption>AI-generated reference illustration, not vendor photography — the item supplied varies by manufacturer and configuration.</figcaption>') +
    '</figure>';
  }

  /* Small square thumbnail for a picker tile. Cheap enough to put on every tile. */
  function thumbHTML(id, px){
    const c = get(id);
    if (!c || !c.img) return '';
    const n = px || 44;
    return '<picture class="vfcv-thumb">' +
      '<source srcset="' + IMG + c.img + '.webp" type="image/webp">' +
      '<img src="' + IMG + c.img + '.jpg" alt="" aria-hidden="true" width="' + n + '" height="' + n +
        '" loading="lazy" decoding="async" onerror="this.closest(\'picture\').remove()">' +
    '</picture>';
  }

  function explainHTML(id){
    const c = get(id);
    if (!c) return '';
    return '<div class="vfcv-explain">' +
      '<h4>' + esc(c.name) + '</h4>' +
      '<p class="vfcv-what">' + esc(c.what) + '</p>' +
      (c.note ? '<p class="vfcv-note">' + esc(c.note) + '</p>' : '') +
    '</div>';
  }

  /* ---------- shared inspector ----------
     ONE live 3D viewer for a whole page. Call show() with a different id and it
     re-mounts in place; the previous context is disposed first. This is what
     lets a picker of twenty components have visuals without twenty contexts. */
  function makeInspector(container, opts){
    const o = opts || {};
    let dispose = null, current = null, wrap, stage, side;

    container.classList.add('vfcv-inspector');
    container.innerHTML =
      '<div class="vfcv-stage" data-vfcv-stage></div>' +
      '<div class="vfcv-side" data-vfcv-side></div>';
    stage = container.querySelector('[data-vfcv-stage]');
    side  = container.querySelector('[data-vfcv-side]');

    function clear(){
      if (dispose) { try { dispose(); } catch (e) {} dispose = null; }
      current = null;
      stage.innerHTML = '';
      side.innerHTML = '';
      container.classList.remove('has-item');
    }

    function show(id){
      const c = get(id);
      if (!c) { clear(); return; }
      if (current === id) return;              // already showing it
      if (dispose) { try { dispose(); } catch (e) {} dispose = null; }
      current = id;
      container.classList.add('has-item');
      stage.innerHTML = '';
      if (window.VF3D) dispose = window.VF3D.mount(stage, c.shape, c.color);
      side.innerHTML = explainHTML(id) + photoHTML(id, {size: 220});
      if (o.onShow) o.onShow(id, c);
    }

    return {
      show: show,
      clear: clear,
      current: function(){ return current; },
      destroy: function(){ clear(); container.classList.remove('vfcv-inspector'); container.innerHTML = ''; }
    };
  }

  window.VFCV = {
    INFO: INFO,
    has: has,
    get: get,
    photoHTML: photoHTML,
    thumbHTML: thumbHTML,
    explainHTML: explainHTML,
    inspector: makeInspector,
    ids: function(){ return Object.keys(INFO); }
  };
})();
