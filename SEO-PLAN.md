# Voltfield SEO plan

Working plan for the six SEO priorities: site speed, title tags, keyword research, backlinks, internal linking and content. Each section says what is already done in the repo and what still has to happen outside it.

---

## 1. Site speed

**Done (Sept 2026)**

| Change | Why |
|---|---|
| Home page 3D showcase loads only when its stage is near the viewport, and never on Save-Data or 2G connections (`index.html`, hero script). | three.js is 1.2 MB, which was about 90% of the home page's weight. Before this change every visitor downloaded it after `load`, including phone readers who never scrolled to the stage. |
| Google Fonts stylesheet is preloaded and applied on load, with a `<noscript>` fallback, on all 80 pages and in `scripts/tpl/head-tail.html`. | It was the only render-blocking third-party request on every page. `display=swap` was already set, so text paints in the fallback font and then swaps. |
| `sw.js` VERSION bumped to `voltfield-v101`. | Returning visitors pick up the changed pages right away. |

**Already in good shape.** Images use WebP with `<picture>`, `loading="lazy"`, and explicit width/height (layout shift measured at 0.001). The catalog data is off the home page's critical path. `_headers` sets long-lived caching for `vendor/`, `images/` and `icons/`.

**Measured baseline** (Playwright, 412×823 viewport, 4× CPU throttle, about 1.6 Mbps / 150 ms, third-party requests blocked): guides and calculator pages reach first contentful paint in about 0.9 s at about 90 KB. The home page was at 1.1 s and 1.5 MB, most of it three.js.

**Next**
- Check the field data (Core Web Vitals) in Search Console about 28 days after deploy. The lab numbers above leave out GTM and fonts.
- Consider self-hosting IBM Plex (woff2, `font-display: swap`). That would remove the last third-party request on the critical path.
- `voltfield-core.css` is 50 KB and loaded on every page. Splitting out the tool-only rules would help the text-only pages.

---

## 2. Title tags

**Done.** Rewrote the titles that were too long, too generic, or didn't match their page:

| Page | Before | After |
|---|---|---|
| `index.html` | Electrical Power Calculators for Data Centers, Solar & BESS (71 chars, truncated) | Data Center, Solar & BESS Electrical Calculators (60) |
| `voltfield-insights.html` | Guides & Industry Insights. This competed with `guides.html`, and the page is actually a catalog dashboard. | Equipment Catalog Insights: Lead Times & Mix |
| `voltfield-glossary-quiz.html` | Glossary Quiz | Electrical Glossary Quiz: Power Equipment Terms |
| `voltfield-pcb-layout.html` | PCB Layout Tool | Free PCB Layout Tool: Place Parts & Route Traces |
| `voltfield-pcb.html` | Custom PCB Builder | PCB Cost Estimator & Spec Builder |
| `packets.html` | Reference Packets | Offline Engineering Reference Packets |
| `voltfield-rack-builder.html` | Rack Elevation Builder | Rack Elevation Builder: Power & U-Space Planner |
| `voltfield-pod-designer.html` | POD & Skid Designer | POD & Skid Designer: Power Block Sizing Tool |
| 5 × `data-centers/*-components`, `grounding-bonding`, `monitoring-controls` | lower-case, keyword-light titles, plus a templated description shared by all five | Title-case keyword titles; descriptions now name the equipment families actually on each page |

Descriptions over 160 characters on `calculators/bess-sizing.html` and `data-centers/transformers.html` were trimmed.

**Rules to keep:** 60 characters or fewer including `| Voltfield`, primary keyword first, one page per keyword (see §3), and `og:title` kept consistent with the title.

---

## 3. Keyword research

> The volumes and difficulty below need validating. This map comes from search intent and from what each page already targets. Before investing in new pages, pull real numbers from **Google Search Console** (queries the site already gets impressions for) and **Google Keyword Planner / Ahrefs / Semrush**.

### Keyword map: one primary keyword per URL

| Primary keyword | Intent | Page |
|---|---|---|
| voltage drop calculator | tool | `calculators/voltage-drop.html` |
| transformer sizing calculator / kW to kVA transformer | tool | `calculators/transformer-sizing.html` |
| kW vs kVA / convert kW to kVA / kVA to amps | learn | `guide-kw-vs-kva.html` **(new)** |
| how to size a UPS / UPS sizing / UPS battery runtime | learn | `guide-ups-sizing.html` **(new)**. `data-centers/backup-power.html` is the equipment reference and links to it, so the two do not compete. |
| transformer impedance / percent impedance / %Z fault current | learn | `guide-transformer-impedance.html` **(new)** |
| N+1 vs 2N / data center redundancy / 2N+1 | learn | `guide-n-plus-1-vs-2n-redundancy.html` **(new)** |
| BESS C-rate / battery C-rate / 4-hour battery C-rate | learn | `guide-bess-c-rate.html` **(new)** |
| IEEE 519 / harmonics / THD vs TDD / capacitor resonance | learn | `guide-harmonics-ieee-519.html` **(new)** |
| generator sizing / standby generator sizing / step load | learn | `guide-generator-sizing.html` **(new)**. `data-centers/backup-power.html` is the equipment reference and links to it. |
| arc flash PPE categories / NFPA 70E PPE table | learn | `guide-arc-flash-ppe-categories.html` **(new)** |
| 415V data center / 415V vs 480V / 240V servers | learn | `guide-415v-vs-480v-distribution.html` **(new)** |
| ground fault protection / NEC 230.95 / GFPE vs GFCI | learn | `guide-ground-fault-protection.html` **(new)** |
| series rated vs fully rated / NEC 240.86 / series combination | learn | `guide-fully-rated-vs-series-rated.html` **(new)** |
| ampacity derating / NEC 310.15 adjustment factors | learn | `guide-cable-ampacity-derating.html` **(new)** |
| 80 percent rule / continuous load / 100% rated breaker | learn | `guide-continuous-load-80-percent-rule.html` **(new)** |
| power factor correction calculator | tool | `calculators/power-factor.html` |
| available fault current calculator | tool | `calculators/fault-current.html` |
| arc flash calculator / incident energy | tool | `calculators/arc-flash.html` |
| arc flash boundary | learn | `guide-arc-flash-boundary-basics.html` |
| ampacity chart / conduit fill | tool | `calculators/ampacity.html` |
| BESS sizing calculator | tool | `calculators/bess-sizing.html` |
| solar string sizing calculator | tool | `calculators/solar-string.html` |
| generator runtime / fuel consumption | tool | `calculators/generator-runtime.html` |
| ground rod resistance | tool | `calculators/grounding.html` |
| transformer inrush current | tool | `calculators/inrush.html` |
| motor starting voltage dip | tool | `calculators/motor-start.html` |
| how to read a transformer nameplate | learn | `guide-transformer-nameplate.html` |
| pad mount vs GSU transformer | learn | `guide-pad-mount-vs-gsu-transformers.html` |
| transformer lead time | learn/news | `guide-transformer-lead-times.html` |
| metal-clad vs metal-enclosed switchgear | learn | `guide-switchgear-compartments.html` |
| short circuit study / selective coordination | learn | `guide-short-circuit-studies-breaker-coordination.html` |
| grounding vs bonding | learn | `guide-grounding-bonding-basics.html` |
| PUE / what is a good PUE | learn | `guide-pue-explained.html` |
| liquid vs air cooling data center | learn | `guide-liquid-vs-air-cooling.html` |
| inverter clipping / DC:AC ratio | learn | `guide-inverter-clipping-ratio.html` |
| BESS augmentation | learn | `guide-bess-augmentation.html` |
| NFPA 855 / UL 9540A | learn | `guide-bess-fire-safety-nfpa-855.html` |
| grid interconnection process | learn | `guide-grid-interconnection-process.html` |
| PJM / MISO / ERCOT interconnection queue | learn | `guide-interconnection-{pjm,miso,ercot}.html` |
| FEOC compliance | learn | `guide-feoc-compliance.html` |
| Buy America / BABA | learn | `guide-buy-america-iija.html` |
| equipment lead time index | data | `lead-time-index.html` |
| free electrical engineering calculators | hub | `engineering-calculators.html` |

### Cannibalization to watch
- `engineering-calculators.html` still lists "voltage drop calculator" and "transformer sizing calculator" in its meta keywords. The dedicated `calculators/*` pages should own those queries, and the hub should own "free electrical engineering calculators". If Search Console shows the hub ranking for a calculator query instead of the dedicated page, add a stronger contextual link from the hub to that page.
- `guides.html` vs. `voltfield-insights.html`: resolved by the retitle in §2.

### Content gaps, in priority order (validate volume first)
1. ~~**UPS sizing**~~ Done: `guide-ups-sizing.html` (Sept 2026).
2. ~~**Transformer impedance (%Z) explained**~~ Done: `guide-transformer-impedance.html` (Sept 2026).
3. ~~**N+1 vs 2N redundancy**~~ Done: `guide-n-plus-1-vs-2n-redundancy.html` (Sept 2026). `data-centers.html` keeps its summary and links to it.
4. ~~**BESS C-rate explained**~~ Done: `guide-bess-c-rate.html` (Sept 2026).
5. ~~**NEC 3% / 5% voltage drop rule**~~ Done as a section plus FAQ on `calculators/voltage-drop.html` (Sept 2026), not a new page. It is a hand edit, flagged in `scripts/gen-calc-pages.ps1`.
6. ~~**Harmonics and IEEE 519**~~ Done: `guide-harmonics-ieee-519.html` (Sept 2026). IEEE 519 was cited in several places with nothing explaining it.
7. ~~**Generator sizing**~~ Done: `guide-generator-sizing.html` (Sept 2026).
8. ~~**Arc-flash PPE categories**~~ Done: `guide-arc-flash-ppe-categories.html` (Sept 2026). Same change corrected `calculators/arc-flash.html`, which said incident energy scales with the square of arcing time (it is linear, as the calculator itself computes), and the boundary guide, which said the site had no arc-flash calculator.
9. ~~**415 V vs. 480 V distribution**~~ Done: `guide-415v-vs-480v-distribution.html` (Sept 2026).
10. ~~**Ground-fault protection**~~ Done: `guide-ground-fault-protection.html` (Sept 2026).
11. ~~**Fully rated vs. series rated breakers**~~ Done: `guide-fully-rated-vs-series-rated.html` (Sept 2026).
12. ~~**Cable ampacity derating**~~ Done: `guide-cable-ampacity-derating.html` (Sept 2026).
13. ~~**The 80% rule and continuous loads**~~ Done: `guide-continuous-load-80-percent-rule.html` (Sept 2026).

---

## 4. Backlinks

Earning backlinks happens off-site, so the repo changes are limited to making Voltfield easy to cite and link to.

**Done.** Every guide ends with a **"Cite or link to this guide"** box. It contains a ready-to-paste citation with the canonical URL and the last-updated date (`id="citeThis"`). Students, forum posters and trade writers are more likely to link when they don't have to build the citation themselves.

**Already on site:** the embeddable lead-time widget (`embed/lead-time-widget.js`, promoted on `lead-time-index.html`) includes an attribution link automatically.

**Outreach plan (manual)**
| Asset to pitch | Who links to this kind of thing |
|---|---|
| Lead-Time Index plus embed widget | Trade press covering the transformer shortage (Utility Dive, T&D World, Canary Media, pv magazine); data-center newsletters |
| Calculator pages (method shown, worked examples) | University power-systems course pages, IEEE student branch resource lists, r/ElectricalEngineering and Eng-Tips answers where a calculator answers the question asked |
| Interconnection guides (PJM / MISO / ERCOT) | Developer and consultancy blogs, clean-energy policy newsletters |
| FEOC / BABA guides | Tax-equity and procurement newsletters, law-firm client alerts (they cite plain-English explainers) |
| kW vs. kVA guide | Electrician-training sites, generator and UPS dealer FAQ pages |

**Rules:** no paid links, no link exchanges, no PBNs. Answer the question first and link only when the page adds something. Track referring domains monthly in Search Console → Links.

---

## 5. Internal linking

**Done**
- **Calculator pages were near-orphans.** Each of the 12 `calculators/*.html` pages had 2–3 contextual inbound links, and none of the 18 guides linked to one. Guides that match a calculator now end with a **"Run the numbers"** list linking to 1–3 calculator pages (11 guides).
- Each calculator page's **Related** block now links to its matching guides and 1–2 sibling calculators. These links are mirrored in `scripts/calc-content.txt` so a regeneration keeps them.
- The new kW vs. kVA guide is linked from the guides hub (new "Power fundamentals" section), the glossary's kVA vs. kW entry, six calculator pages, the sitemap, the RSS feed, and site search.
- Fixed the "All 21 calculators" link text on the 12 calculator pages. The hub has 20, which matches the rest of the site.

**Next**
- Re-run the link audit after each new page. The script used for this pass counts contextual inbound links inside `<main>` only, so nav and footer links don't count. Keep every indexable page at 3 or more contextual inbound links.
- `voltfield-pcb.html` (1 inbound) and `site-search.html` are the weakest remaining pages. Link the PCB tools from `free-tools.html` copy where relevant.

---

## 6. High-quality content

**Done.** Published **`guide-kw-vs-kva.html`**. It covers the power triangle, a kVA-per-100 kW table, a worked kW → kVA → amps example, and how the rating applies to transformers, generators (0.8 PF convention) and UPS systems. It also includes common mistakes, an FAQ with FAQPage schema, sources, and a social card. Every figure is arithmetic that can be reproduced from the formulas on the page, which is the same standard the calculator pages hold to.

**Standards for new content** (these match the existing editorial rules on `methodology.html`)
- Answer the query in the first paragraph, then go deeper.
- Include a worked example the reader can check, and name the governing standard.
- Say what the method does *not* cover.
- Link to at least one calculator and two related guides, and get at least three contextual inbound links.
- Keep byline, provenance and JSON-LD dates in sync. This pass found and fixed one mismatch, in the FEOC guide.

**Done (Sept 2026):** the two thinnest reference pages, `data-centers/monitoring-controls.html` and `data-centers/grounding-bonding.html`, went from about 425 to about 820 words each. Each gained a "What to settle in the specification" section, a visible FAQ and FAQPage schema. Both are hand edits, flagged in `scripts/gen-category-pages.ps1`.
