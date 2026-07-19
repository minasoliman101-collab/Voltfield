# VOLTFIELD Supply Co. — Website (static site)

A self‑contained, **fully static website** — plain HTML, CSS, and JavaScript. There is **no server, database, or build step**. Every page runs entirely in the browser, so it can be hosted on any static‑file host and works offline once loaded.

---

## 1. What's in this folder

| File | Purpose |
|------|---------|
| `index.html` | **Home page** — the entry point (open this one). |
| `voltfield-supply-catalog.html` | **All Parts** — searchable/filterable catalog + configurator + quote list. |
| `voltfield-suppliers.html` | **All Suppliers** — supplier & distributor directory. |
| `voltfield-bom.html` | **Quick Order** — paste/upload a BOM; matches each line to the catalog. |
| `voltfield-bom-generator.html` | **BOM Generator** — pick any engineered part and generate its full component-level Bill of Materials (quantities, materials, indicative cost roll-up; CSV/print export). |
| `voltfield-pcb.html` | **Custom PCB Builder** — fab configurator (size, layers, material, copper, finish, mask, tolerances, vias) with live board preview, parametric budgetary pricing + quantity breaks, Gerber attach, printable spec sheet, add-to-quote. Pricing multipliers live at the top of the page script. |
| `voltfield-eol.html` / `voltfield-eol-data.js` | **Obsolete/EOL reference** — discontinued series with OEM-recommended successors (see §10). |
| `voltfield-bom-engine.js` | Component-template engine behind the BOM Generator (per-category teardowns that scale with configuration). |
| `voltfield-site-config.js` | **Site config** — production domain (canonical/OG URLs) + ad monetization settings and slot renderer. |
| `robots.txt` / `sitemap.xml` | Crawl control + sitemap (replace `YOUR-DOMAIN` before submitting to Search Console). |
| `ads.txt` | Authorized-sellers file for ad networks (instructions inside). |
| `manifest.json` / `sw.js` / `icons/` | **PWA layer** — makes the site installable (Add to Home Screen) and fully offline-capable. Bump `VERSION` in `sw.js` when you redeploy changed files. |
| `privacy-policy.html` | Privacy policy **template** — required by both app stores; fill in bracketed fields before publishing. |
| `APP-STORES.md` | **Step-by-step guide to publishing on Google Play and the Apple App Store.** |
| `app-wrapper/` | Ready-made Capacitor scaffold for building native Android/iOS binaries (see APP-STORES.md Route C). |
| `voltfield-insights.html` | **Insights** — live dashboard of the catalog (SKUs by source & sector, top categories, lead‑time mix). |
| `voltfield-part.html` | **Part detail** — shareable, configurable single‑part page (opened via links). |
| `voltfield-rfq.html` | **RFQ** — printable Request for Quotation built from the quote list. |
| `voltfield-catalog-data.js` | **Shared data + logic** — the whole product taxonomy and SKU engine. **Single source of truth.** |
| `404.html` | Friendly "page not found" page. |
| `staticwebapp.config.json` | Config for Azure Static Web Apps (404 + MIME + caching). Ignored by other hosts. |
| `voltfield-home.html` | Redirect stub → `index.html` (keeps old links working). |

> **Keep every file in the same folder.** The catalog, Quick Order, Part, and RFQ pages all load `voltfield-catalog-data.js` from alongside them. If you split them up, the catalog data won't load.

---

## 2. Preview it locally (no hosting)

- **Simplest:** double‑click `index.html` — it opens in your browser and everything works (search, filters, configurator, quote list, RFQ, print).
- **Optional local server** (nice clean URLs). From this folder:
  - Python: `python -m http.server 8080` → visit `http://localhost:8080`
  - Node: `npx serve .`

Fonts load from Google Fonts over the internet; with no connection the site still works, just in a fallback system font.

---

## 3. Put it on the web (pick ONE)

All options below serve `index.html` at the root automatically.

### Option A — Netlify Drop (fastest, free, ~1 minute)
1. Go to **https://app.netlify.com/drop**
2. **Drag this whole folder** (or `voltfield-site.zip`) onto the page.
3. You immediately get a public URL like `https://your-site-name.netlify.app`.
4. (Optional) Create a free account to keep it, rename it, or add a custom domain.

### Option B — Cloudflare Pages or GitHub Pages (free)
- **Cloudflare Pages:** dashboard → Workers & Pages → Create → Pages → **Upload assets** → drag the folder → Deploy.
- **GitHub Pages:** push these files to a repo → Settings → Pages → Source = your branch, root folder → Save. URL: `https://<user>.github.io/<repo>/`.

### Option C — Azure Static Web Apps (recommended for a Microsoft 365 / Azure org)
Best fit if your org already uses Azure — custom domains and HTTPS are included free.
- **Easiest (VS Code):** install the **Azure Static Web Apps** extension → sign in → "Create Static Web App (Advanced)" → point **App location** at this folder, leave **Api location** blank, **Output location** blank (no build).
- **CLI:**
  ```bash
  npm install -g @azure/static-web-apps-cli
  swa deploy ./ --env production
  ```
- The included `staticwebapp.config.json` wires up the custom 404 page automatically.

### Option D — Azure Blob Storage static website (simple & cheap)
1. Create a Storage account → **Static website** → Enable.
2. Set **Index document name** = `index.html`, **Error document path** = `404.html`.
3. Upload all files to the **`$web`** container.
4. Use the **Primary endpoint** URL it gives you.

---

## 4. Custom domain & HTTPS
Every option above supports a custom domain (e.g. `parts.yourcompany.com`) with free automatic HTTPS. In the host's dashboard, add the domain and create the CNAME record it shows you with your DNS provider. Certificates are issued automatically.

---

## 5. Important notes before sharing publicly
- **No secrets or keys.** Everything is client‑side; there is nothing sensitive to leak.
- **The catalog data is illustrative/modeled** for demonstration — SKUs are generated from a taxonomy, and pricing/lead times are indicative market ranges, not live inventory or firm quotes. Product images are original, AI‑generated illustrations of each part type (not vendor photography); the exact item shipped may differ. Review this before putting it in front of customers.
- **Business model / sourcing framing.** Every part in the catalog — including the families tagged as sourced via Grainger, Uline, Graybar, or MSC Industrial — is presented as sold and fulfilled **directly by Voltfield**, priced by Voltfield (sourcing cost + markup), not as a mirrored third-party storefront or live data integration. The `f.d`/`f.d0` field is an internal sourcing-channel tag only; it drives the "Sourcing Channel" facet and the Insights sourcing-mix chart, both explicitly labeled as such. Catalog scope/counts are modeled on each distributor's publicly published product range. Keep this framing (no "live catalog," "mirrored," or "integration" language) anywhere new copy references these vendors — see `voltfield-suppliers.html`'s footer disclaimer for the canonical wording.
- **News links** on the home page point to third‑party publishers.

### ⚠️ SharePoint / OneDrive is **not** a website host
Dropping these files in a SharePoint document library or your OneDrive **will not** serve them as a working website — modern SharePoint blocks custom page scripts and serves `.html` as a download, so the catalog's JavaScript won't run. Use one of the static hosts above instead. (This folder living in OneDrive is fine for **storage/preview**, just not for hosting.)

---

## 6. Traffic (SEO) & ad revenue

**SEO — already wired in.** Every page has unique titles, meta descriptions, and Open Graph/Twitter tags; the home page carries Organization + WebSite (sitewide search) structured data and the BOM Generator carries WebApplication structured data. Part pages set a descriptive `<title>` per configuration. To finish setup after you deploy:
1. Open `voltfield-site-config.js` and set `siteUrl` to your production domain — this turns on canonical URLs and correct share links.
2. Replace `YOUR-DOMAIN` in `sitemap.xml` and uncomment the `Sitemap:` line in `robots.txt`.
3. Add the site to **Google Search Console** and **Bing Webmaster Tools** and submit the sitemap.
4. Traffic levers that matter most for this site: the BOM Generator and Quick Order pages are the linkable/shareable assets — every generated BOM and configured part has a copyable deep link.

**Ads — ready to switch on.** Ad slots (leaderboard / in-content / footer) are already placed on the home, Insights, Quick Order, and BOM Generator pages. They render as labeled placeholders until you add a publisher ID:
1. Sign up for **Google AdSense**, add and verify your domain.
2. In `voltfield-site-config.js` set `ads.provider='adsense'`, paste your `ca-pub-…` ID into `ads.client`, and (optionally) per-placement slot IDs into `ads.slots`.
3. Update `ads.txt` with your `pub-…` ID (instructions in the file). It must be served from the domain root.
4. To hide the placeholders before then, set `ads.preview=false`.
> Note: ad networks review sites before serving ads. The catalog data is modeled/illustrative (see §5) — make sure the site presents real value and truthful content before applying, and expect policy review for "demo" datasets.

---

## 7. Mobile app & app stores

The site is an installable **PWA**: on a phone, visiting the deployed site offers "Add to Home Screen," launches full-screen with the VOLTFIELD icon, and works completely offline (the service worker pre-caches every page including the full catalog). App-launcher shortcuts jump straight to the BOM Generator, Quick Order, and the catalog.

To publish real store apps (Google Play via Trusted Web Activity, Apple App Store via Capacitor/WKWebView), follow **`APP-STORES.md`** — it covers accounts and costs, packaging with PWABuilder, the included `app-wrapper/` Capacitor project, the privacy-policy requirement, and the AdSense-vs-AdMob rules inside apps.

---

## 8. Updating the catalog later
Everything data‑related lives in **`voltfield-catalog-data.js`** — one file drives all pages.
- **Change counts, prices, categories, or attributes:** edit the `FAM` array entries.
- **Add another distributor** (e.g. Fastenal, Rexel): add a block of `{s:'mro', d0:'<name>', c:'<Category>', n:'<Family>', ct:<count>, ...}` rows and add the label to the distributor maps in the catalog page. Totals, facets, and search update automatically.

No rebuild needed — just re‑upload the changed file(s) to your host.

---

## 9. Accounts & subscriptions

`voltfield-account.html` is the Accounts & Plans page (in the nav on every page).

**Sign-in (works today on Azure Static Web Apps).** The page's buttons use SWA's built-in authentication (`/.auth/login/aad`, `/.auth/login/github`) — no code, no password storage; deploy via §3 Option C and sign-in just works. The page reads `/.auth/me` to show the signed-in user. On other hosts, swap in an identity provider (Auth0, Clerk, Supabase Auth) and update the two button URLs + the `/.auth/me` fetch.

**Subscriptions.** Plan cards are live; paid features are honestly labeled as roadmap (◷) until there's a backend. To start charging:
1. Create a Stripe account → Products → **Payment Links** for Pro monthly/annual.
2. Paste the links into `SITE_CONFIG.billing` in `voltfield-site-config.js` (`proMonthlyUrl`, etc.). The "Start Pro" button uses them automatically; until then it opens a sales email.
3. Entitlements (who has an active subscription) need a small backend — the natural pairing is SWA's **managed Azure Functions** (free tier): a `/api/me/plan` function that checks the Stripe customer by the signed-in email, plus Stripe webhooks. Supabase or Firebase are equivalent alternatives.
4. Pro features (saved BOMs, shared quote lists, alerts) then store per-user data keyed to the signed-in identity — the front-end already centralizes quote state in `vf_quote` localStorage, which is the natural sync point.

**Honesty guardrail:** don't flip features from ◷ to ✓ on the page until they actually exist — the plan cards and the transparency note under them are written to avoid selling vaporware.

---

## 10. BOM coverage guarantee, EOL section & OEM suppliers

**Every BOM line is sourceable.** The catalog carries dedicated *Components & Spares* families per sector (Transformer Components, Switchgear Components, Genset Components, Inverter & PE Components, Module & BOS Components, Battery Components, Valve & Wellhead Components, Power Transmission, and additions to existing MRO categories). Every line the BOM engine can generate carries an explicit mapping to one of these families — the coverage harness (run in the browser console on the BOM Generator page) asserts **100% of ~1,035 unique component lines resolve to a real part page**. If you add or edit templates in `voltfield-bom-engine.js`, re-run the harness and keep it at zero failures.

**Obsolete/EOL section** (`voltfield-eol.html` + `voltfield-eol-data.js`): series-level discontinuation records with the OEM-recommended successor (or the honest status when the OEM exited/transferred the line). Records are editorial, maintained at product-series level from public OEM lifecycle notices — always verify model-for-model against OEM migration docs before quoting, and keep the on-page disclaimer intact. Add records by appending to the `EOL` array.

**OEM suppliers**: real OEM brands (SMA, Schneider Electric, Siemens, Advanced Energy, ABB, FIMER, Eaton, GE Vernova, Hitachi Energy, Vertiv, Caterpillar, Cummins, First Solar, Sungrow, Power Electronics, Fronius, Rockwell, Emerson, Baker Hughes, SLB, NOV, CATL) are listed in the suppliers directory as an independent distributor's line card, cross-linked to their EOL records. Keep the trademark/non-affiliation disclaimer in the suppliers footer.

---

## 11. Part identification from photos (`voltfield-identify.html`)

**How v1 works (fully client-side, private by design):** the user photographs a nameplate/label (or drags in images); Tesseract.js (lazy-loaded ~3 MB from jsDelivr on first use, runs as WASM in the browser — photos never leave the device) OCRs the selected image into an editable text box. The text is tokenized into **brands** (matched against the OEM/EOL lists plus a curated brand dictionary), **ratings** (kV/kVA/V/A/HP/RPM/Ah… regexes), and **model-number candidates**. Matching then produces, in order: EOL-platform alerts (brand + series overlap → links to the EOL record and replacement class), top-5 ranked catalog family matches (each with Configure & Quote, and a **Component BOM teardown** link when the family has a BOM template — this is the "recognize the parent part → break down its BOM" path), a **PCB routing card** when board-related tokens appear (into the PCB Builder / rebuild review), and a human-review mailto pre-filled with the extracted text and detected tokens. If OCR can't load (offline), typing the label text drives the identical pipeline.

**Upgrading to true photo recognition (no label needed):** set `SITE_CONFIG.vision.endpoint` in `voltfield-site-config.js` to a backend URL. The page POSTs `{image: <dataURL>}` and expects `{keywords: [...], text: "..."}` back, which it feeds into the same matching pipeline. The natural build: an Azure Static Web Apps managed function that forwards the image to a vision model (e.g. Claude with vision) with a prompt like "identify this industrial part: manufacturer, type, ratings, model number" — that keeps the API key server-side. With that in place, bare-part photos resolve without a readable label, and the existing family→BOM and PCB-routing logic does the rest.

---

## 12. RFQ submissions (`voltfield-rfq.html`) — Netlify Forms, with mailto fallback

The RFQ page's **Send RFQ** button submits the buyer info + quote lines directly (AJAX POST) to **Netlify Forms** — no backend to run. A statically-present, always-hidden `<form name="rfq-quote" data-netlify="true">` sits right after `<body>` purely so Netlify's deploy-time scan registers the form and its fields (`company`, `contact`, `email`, `phone`, `project`, `needed_by`, `notes`, `item_count`, `total_units`, `estimated_total`, `line_items`, `rfq_number`) — it is never shown or submitted itself. **Email is required** before sending (client-side validated). On success, a confirmation banner shows the RFQ number; on any failure (not deployed to Netlify yet, offline, running locally) it automatically falls back to opening the user's mail client with the same content pre-filled — nothing is ever silently lost. A secondary **Email instead** button always uses the mailto path regardless of form availability.

**One-time setup after deploying to Netlify (do this or submissions go unseen):**
1. Netlify auto-detects the `rfq-quote` form on the next deploy — check **Site configuration → Forms** to confirm it appears.
2. Under **Forms → Form notifications → Add notification → Email notification**, set the recipient to your monitored inbox (e.g. `Sales@voltfield.com` or `RFQ@voltfield.com` once those mailboxes exist) so every submission emails you immediately.
3. Submissions are also viewable/exportable anytime under **Site configuration → Forms → rfq-quote**, even without email notifications configured.
4. Free Netlify tier includes 100 form submissions/month; the honeypot field (`bot-field`) filters most spam automatically.

If you move hosts away from Netlify, this specific submission path stops working (falls back to mailto automatically) — swap in the target host's form/backend equivalent and update `sendBtn`'s handler in `voltfield-rfq.html`.
