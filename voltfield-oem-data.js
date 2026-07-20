/* VOLTFIELD - real OEM cross-reference data, sourced live from Icecat.
   Unlike voltfield-catalog-data.js (Voltfield's own procedurally-generated
   VF- SKUs), every entry here is a genuine real-world product: real brand,
   real manufacturer part/model number, real GTIN. Regenerate this file by
   editing the $LOOKUPS list in scripts/fetch-oem-icecat.ps1 and re-running it --
   never hand-edit a brand/model/GTIN value in here. */
const OEM_REF=[
  {"test":true,"brand":"HP","mpn":"Two-view Cling Film","gtin":"0088698419298","title":"HP Two-view Cling Film","category":"Printing Films","img":"https://images.icecat.biz/img/gallery/17851951_7354464937.jpg","source":"Icecat","note":"Icecat demo product -- pipeline test entry, not a real Voltfield offering"},
];
