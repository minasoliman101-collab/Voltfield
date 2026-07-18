/* ============================================================
   VOLTFIELD — Obsolete / End-of-Life reference data
   Series-level (product-family) discontinuation records with the
   OEM-recommended migration path where one exists.

   IMPORTANT: mappings are series-level and directional — always
   confirm the exact model-for-model replacement against the OEM's
   current migration documentation before purchase. Statuses:
     successor   — same OEM sells a recommended successor line
     transferred — product line moved to another OEM (acquisition/divestiture)
     retrofit    — successor OEM offers retrofit kits into existing gear
     exited      — manufacturer left the market; cross-vendor replacement class
   ============================================================ */
'use strict';

const EOL = [
  /* ---------------- Solar / renewables ---------------- */
  {oem:'SMA', series:'Sunny Central CP-XT series (500/630/720/760/800/850/900CP-XT)', sector:'re', cat:'Central inverters',
   status:'successor', year:'late 2010s', succOem:'SMA', succ:'Sunny Central UP / UP-S series',
   note:'SMA’s legacy CP-XT utility central inverters are discontinued; the UP platform is SMA’s current utility-scale line. SMA service supports legacy fleets with spares programs.',
   q:'central inverter utility'},
  {oem:'SMA', series:'Sunny Boy TL-US legacy string inverters (SB 3000-11000TL-US)', sector:'re', cat:'String inverters',
   status:'successor', year:'c. 2018-2021', succOem:'SMA', succ:'Sunny Boy -US / Sunny Tripower CORE1 & X',
   note:'Legacy TL-US residential/commercial string models are discontinued; current Sunny Boy and Sunny Tripower lines are the OEM path.',
   q:'string inverter'},
  {oem:'Satcon', series:'PowerGate Plus central inverters (30 kW–1 MW)', sector:'re', cat:'Central inverters',
   status:'exited', year:'2012 (bankruptcy)', succOem:'—', succ:'No OEM successor — repower with a modern central inverter / PCS',
   note:'Satcon ceased operations in 2012; no factory support exists. Fleets typically repower to current central inverters or refit with third-party control/repair services.',
   q:'central inverter utility'},
  {oem:'Advanced Energy', series:'Solaron / AE 500NX / AE 1000NX central inverters', sector:'re', cat:'Central inverters',
   status:'exited', year:'2015 (market exit)', succOem:'—', succ:'No OEM successor — repower with a modern central inverter / PCS',
   note:'Advanced Energy exited the solar inverter business in 2015. Legacy Solaron/NX fleets rely on third-party service or full repowering to current platforms.',
   q:'central inverter utility'},
  {oem:'ABB', series:'PVS800 / ULTRA central inverters', sector:'re', cat:'Central inverters',
   status:'transferred', year:'2020 (divestiture)', succOem:'FIMER', succ:'FIMER PVS980 platform',
   note:'ABB’s solar inverter business transferred to FIMER in 2020; FIMER carries service obligations and successor platforms.',
   q:'central inverter utility'},
  {oem:'Power-One / ABB', series:'Aurora PVI / TRIO string inverters', sector:'re', cat:'String inverters',
   status:'transferred', year:'2020 (divestiture)', succOem:'FIMER', succ:'FIMER string inverter lines',
   note:'The Aurora lines followed the ABB solar business into FIMER. Confirm service coverage per model with FIMER.',
   q:'string inverter'},
  {oem:'Fronius', series:'IG / IG Plus string inverters', sector:'re', cat:'String inverters',
   status:'successor', year:'mid 2010s', succOem:'Fronius', succ:'Fronius Symo (Advanced) / Tauro',
   note:'IG-family inverters are long discontinued; Symo and Tauro are the OEM replacement families.',
   q:'string inverter'},
  {oem:'First Solar', series:'Series 4 (FS-4xxx) thin-film modules', sector:'re', cat:'PV modules',
   status:'successor', year:'c. 2021', succOem:'First Solar', succ:'Series 6 / Series 7 modules',
   note:'Series 4 production ended as Series 6/7 ramped. For repairs on Series 4 arrays, match electrical windows carefully or re-string.',
   q:'thin-film cdte modules'},
  /* ---------------- Electrical / data center ---------------- */
  {oem:'Schneider Electric', series:'Masterpact NT / NW air circuit breakers', sector:'dc', cat:'LV breakers',
   status:'successor', year:'active migration', succOem:'Schneider Electric', succ:'MasterPact MTZ (with Micrologic X)',
   note:'MTZ is Schneider’s recommended replacement platform for NT/NW; cradle-compatible retrofit options exist for many frames.',
   q:'air circuit breakers'},
  {oem:'Schneider Electric', series:'Modicon Quantum PLC', sector:'dc', cat:'PLC / controls',
   status:'successor', year:'announced EOL', succOem:'Schneider Electric', succ:'Modicon M580 ePAC',
   note:'Schneider publishes a formal Quantum→M580 modernization path including wiring-conversion options.',
   q:'plant controllers'},
  {oem:'Schneider Electric (APC)', series:'Symmetra PX UPS', sector:'dc', cat:'UPS',
   status:'successor', year:'2020s', succOem:'Schneider Electric', succ:'Galaxy VS / VL series',
   note:'Galaxy VS/VL is the OEM-recommended replacement for Symmetra PX deployments as they reach end of service life.',
   q:'ups systems'},
  {oem:'Siemens', series:'SIMATIC S5 PLC family', sector:'dc', cat:'PLC / controls',
   status:'successor', year:'2003 (spares ended 2013)', succOem:'Siemens', succ:'SIMATIC S7-1500',
   note:'One of the most-documented migrations in industry; Siemens publishes S5→S7 conversion tooling and guides.',
   q:'plant controllers'},
  {oem:'Siemens', series:'MICROMASTER 440 / MASTERDRIVES', sector:'mro', cat:'VFDs / drives',
   status:'successor', year:'2010s', succOem:'Siemens', succ:'SINAMICS G120 / S120',
   note:'SINAMICS is Siemens’ consolidated drives platform; frame-for-frame replacement guides are published.',
   q:'motor controls drives'},
  {oem:'Westinghouse', series:'DS / DSII low-voltage power breakers', sector:'dc', cat:'LV breakers',
   status:'retrofit', year:'legacy (pre-Eaton)', succOem:'Eaton', succ:'Magnum-based direct-replacement / retrofit breakers',
   note:'Eaton (successor to Westinghouse distribution) offers UL-listed replacement breakers and retrofit kits for DS-class switchgear.',
   q:'air circuit breakers'},
  {oem:'GE', series:'AKR / AK low-voltage power breakers', sector:'dc', cat:'LV breakers',
   status:'retrofit', year:'legacy', succOem:'ABB', succ:'Emax 2-based retrofit kits (ABB acquired GE Industrial Solutions)',
   note:'ABB provides direct-replacement and retrofit programs for legacy GE AK/AKR frames; third-party remanufacture is also common.',
   q:'air circuit breakers'},
  {oem:'Eaton (Cutler-Hammer)', series:'Series C molded-case breakers', sector:'dc', cat:'MCCBs',
   status:'successor', year:'active migration', succOem:'Eaton', succ:'Power Defense (PD-frame) MCCBs',
   note:'Power Defense is Eaton’s global successor family to Series C; check frame/lug compatibility tables.',
   q:'molded-case breakers'},
  {oem:'GE Vernova (Multilin)', series:'Multilin SR series relays (SR 489/750/760)', sector:'dc', cat:'Protective relays',
   status:'successor', year:'2010s', succOem:'GE Vernova', succ:'Multilin 8 Series (850/845/889)',
   note:'The 8 Series is the published migration path from SR-family feeder/motor/generator relays, with retrofit mounting adapters.',
   q:'protective relays'},
  {oem:'Vertiv (Liebert)', series:'Liebert NX large UPS', sector:'dc', cat:'UPS',
   status:'successor', year:'2010s', succOem:'Vertiv', succ:'Liebert EXL S1',
   note:'EXL S1 is Vertiv’s successor platform for large monolithic UPS; verify battery-string reuse case-by-case.',
   q:'ups systems'},
  /* ---------------- Automation / instrumentation / O&G ---------------- */
  {oem:'Rockwell Automation (Allen-Bradley)', series:'PLC-5 & SLC 500 controllers', sector:'og', cat:'PLC / RTU',
   status:'successor', year:'PLC-5: 2017 · SLC: 2020s', succOem:'Rockwell Automation', succ:'ControlLogix / CompactLogix',
   note:'Rockwell publishes formal migration bundles (wiring conversion, code translation tools) from PLC-5/SLC to Logix.',
   q:'wellsite controllers rtu'},
  {oem:'Baker Hughes (Bently Nevada)', series:'3300 series machinery monitoring', sector:'og', cat:'Condition monitoring',
   status:'successor', year:'2000s', succOem:'Baker Hughes', succ:'3500 series / Orbit 60',
   note:'3500 remains the standard upgrade from 3300 racks; Orbit 60 is the current-generation platform.',
   q:'pressure temp transmitters'},
  {oem:'Emerson (Rosemount)', series:'Rosemount 1151 pressure transmitters', sector:'og', cat:'Instrumentation',
   status:'successor', year:'2000s', succOem:'Emerson', succ:'Rosemount 3051 / 3051S',
   note:'The 3051 is Emerson’s published direct migration from the analog 1151 line, with mounting-compatible options.',
   q:'pressure temp transmitters'},
];

const EOL_STATUS = {
  successor:  {label:'OEM successor available', c:'ok'},
  transferred:{label:'Line transferred — successor via new OEM', c:'warn'},
  retrofit:   {label:'Retrofit path via successor OEM', c:'warn'},
  exited:     {label:'OEM exited — cross-vendor replacement', c:'crit'},
};
