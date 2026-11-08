# Guide candidates

The backlog that commit `4ef1467` ("Add the six guides worth building from the
candidate list") worked from, rebuilt. That commit emptied the old list: it
built six and rejected four, leaving nothing written down. This file is the
replacement, with the rejections kept so they are not re-proposed.

Measured against the corpus on 2026-11-08: 52 guides, 25 calculators, 56
glossary terms.

## The bar

Taken from the four rejections in `4ef1467`, which are the clearest statement
of it anywhere in the repo. A candidate has to pass all four:

1. **A governing standard to lead with.** Commissioning levels L1–L5 were
   dropped for having none — "which is what gave the other pages their angle."
2. **No overlap with an existing guide.** ASHRAE thermal classes and
   busway-vs-RPP-vs-PDU were dropped for sitting too close to the cooling and
   rack-density guides.
3. **Verifiable.** NEMA-vs-IEC motor frames was dropped as "a dimensional
   lookup I cannot verify."
4. **An angle** — the condition most summaries omit. `nec-705-supply-side-vs-load-side`
   leads on the 120 percent busbar allowance depending on where the backfeed
   breaker sits, which most write-ups skip.

The count below is what survives that bar, not what could be written.

## How the candidates were found

Three signals, cross-referenced against the full text of all 52 guides:

- **Glossary terms with no guide.** 44 in-scope terms (oil & gas and MRO terms
  excluded — those sectors are off the homepage and out of the sitemap).
- **Standards the site cites but no guide owns.** Counted across every
  indexable page.
- **Calculators with no companion guide.** Only 3 of 25 have one.

"Mentions" below means occurrences across indexable pages, excluding nav,
header and footer. High mentions with no guide means the site already needs
the page and is working around its absence.

Two cautions, learned while compiling this. Matching a candidate by slug
produces false gaps — "metal-clad vs. metal-enclosed" looked uncovered and is
in fact owned by `guide-switchgear-compartments`, which holds 39 of the 58
mentions across the whole guide corpus. And a high
mention count can mean the opposite of opportunity: see the rejections.

---

## Tier 1 — build these first

Standard-led, no existing owner, and the site already leans on the concept.

### 1. LFP vs. NMC cell chemistry
- **Standard:** UL 1973, UL 9540A test data by chemistry; NFPA 855 separation
  distances differ by chemistry.
- **Mentions:** 32 across 8 pages, **zero in any guide.**
- **Links from:** `battery-storage/bess-enclosures.html` (11), `battery-storage.html` (6),
  `glossary.html` (5), `lead-time-index.html` (5), `calculators/bess-sizing.html` (2).
- **Angle:** chemistry is treated as a cost-per-kWh choice; it is really a
  siting choice, because thermal runaway behaviour changes UL 9540A results and
  therefore separation distance and suppression. Ties directly into the
  existing NFPA 855 guide without repeating it.

### 2. Dry-type vs. liquid-filled transformers
- **Standard:** IEEE C57.12.01 (dry) vs. C57.12.00 (liquid); NEC 450.21–450.27
  on indoor installation and vaults.
- **Mentions:** 32 across 14 pages, **zero in any guide** — despite three
  existing transformer guides.
- **Links from:** `data-centers/transformers.html` (9), `glossary.html` (7),
  `guide-415v-vs-480v-distribution.html` (2), `guide-transformer-impedance.html` (2).
- **Angle:** the choice is usually made on first cost, then forced by NEC 450
  vault and separation requirements that the installation location dictates.

### 3. UL 1741 SA / SB and IEEE 1547
- **Standard:** UL 1741 SA/SB, IEEE 1547-2018 and 1547.1 test procedures.
- **Mentions:** 19 (UL 1741) and 13 (IEEE 1547), across 5 pages each, no guide.
- **Links from:** `renewables/solar-inverters.html`, `battery-storage/pcs-inverters.html`,
  `calculators/bess-sizing.html`, `guide-grid-forming-vs-grid-following.html`.
- **Angle:** the two are constantly conflated. 1547 is what the utility
  requires of the interconnection; 1741 SA/SB is how an inverter proves it
  complies. Nothing on the site currently separates them.
- **Open question:** one guide or two. One risks being a definition list; two
  risks failing the overlap test against each other. Lead with the distinction
  and see whether it sustains two pages.

### 4. CRAH vs. CRAC
- **Standard:** ASHRAE TC 9.9 envelopes for the air path.
- **Mentions:** 27 across 8 pages, **zero in any guide.**
- **Links from:** `glossary.html` (9), `data-centers/cooling.html` (7),
  `data-centers.html` (2).
- **Angle:** chilled water vs. direct expansion, and why the distinction
  decides where the heat rejection plant goes.
- **Overlap risk: medium.** `guide-liquid-vs-air-cooling` is adjacent. This has
  to stay inside the air path or it will fail the bar the way
  busway-vs-RPP-vs-PDU did.

### 5. MPPT and inverter input design
- **Standard:** UL 1741 inverter input window; NEC 690.7 maximum voltage.
- **Mentions:** 11 across 3 pages, **zero in any guide.**
- **Links from:** `renewables/solar-inverters.html` (4), `calculators/solar-string.html` (3).
- **Angle:** string sizing is governed by the MPPT window at temperature
  extremes, not by nameplate watts. Direct companion to the existing
  `solar-string` calculator, which has no guide behind it.

### 6. SoC and SoH
- **Standard:** no single governing standard — **check this one against the
  bar before starting.** Closest anchors are IEEE 1188/1106 maintenance
  practice and warranty-defined capacity retention.
- **Mentions:** 5 across 2 pages, zero in any guide.
- **Angle:** SoH is a warranty term before it is a technical one, which is what
  makes augmentation schedules contractual. Pairs with the existing
  `bess-augmentation` guide.

### 7. Safe harbor and construction start
- **Standard:** IRS Notice 2013-29 and successors; 5 percent safe harbor and
  physical work test.
- **Mentions:** 4 across 2 pages (`guide-feoc-compliance.html`, `glossary.html`).
- **Angle:** low internal mention count but high intent — it is the question
  that decides whether a project keeps its tax credit year. Completes the
  compliance cluster with FEOC, domestic content and Buy America.

---

## Tier 2 — plausible, angle not yet proven

Worth building, but each needs the "condition most summaries omit" before it
is worth a page.

| Candidate | Standard to lead with | Mentions | Note |
|---|---|---|---|
| MCCB vs. ICCB vs. ACB | UL 489, UL 1066 | 30 / 12 pages | 4 mentions already in the panelboard guide — must not restate it |
| Bifacial gain and albedo | IEC 60904-1-2 | 6 / 4 pages | Thin internally; may belong inside an MPPT or tracker guide |
| Tracker control and backtracking | No governing standard | 2 / 1 page | Fails test 1 alone. Only viable folded into a tracker guide |
| Power factor correction | IEEE 519, NEC 460 | 27 / 12 pages | 9 mentions in the harmonics guide — overlap risk is real |
| Motor starting methods | NEC 430 Part X | 81 / 22 pages | Split across `generator-sizing` and `vfd-vs-soft-starter`; needs a distinct cut |
| Generator runtime and fuel sizing | NFPA 110 | — | Companion to the `generator-runtime` calculator |
| Conduit fill beyond Chapter 9 | NEC Chapter 9, Annex C | — | Companion to the `conduit-fill` calculator |
| BESS enclosure and siting | NFPA 855, IFC 1207 | — | Check against the existing NFPA 855 guide first |

---

## Rejected

Kept so they are not proposed again.

| Candidate | Why |
|---|---|
| Fault current fundamentals | 274 mentions across 47 pages, already owned by `short-circuit-studies`, `interrupting-rating-vs-sccr`, `fully-rated-vs-series-rated` and `transformer-impedance`. Pure overlap. |
| Transformer sizing | Sits between `transformer-nameplate` and `transformer-impedance`. Fails test 2. |
| Metal-clad vs. metal-enclosed | Already owned by `guide-switchgear-compartments`, which holds 39 of 58 mentions. |
| Unit-converter companions (amps-to-kW, watts-to-amps, HP-to-kW, kVA-to-amps, BTU-to-tons, AWG-to-mm²) | The calculator page is the content. A guide would restate it. |
| ASHRAE thermal classes | Dropped in `4ef1467` — too close to the cooling guide. |
| Busway vs. RPP vs. PDU | Dropped in `4ef1467` — too close to rack-density. |
| NEMA vs. IEC motor frames | Dropped in `4ef1467` — unverifiable dimensional lookup. |
| Commissioning levels L1–L5 | Dropped in `4ef1467` — no governing standard to lead with. |

---

## How many

**7 Tier 1, 8 Tier 2 — about 15 that clearly pass the bar.** Extending into
per-calculator companions and splitting the larger topics gets to roughly 30
before the overlap test starts failing, which would take the corpus from 52 to
about 80.

Where the corpus is thin, by sector:

| Sector | Guides | Note |
|---|---|---|
| Electrical fundamentals | 33 | Saturated |
| Data centers | 8 | Reasonable |
| Renewables | 8 | Thin relative to homepage prominence |
| Battery storage | **3** | Thinnest, and one of three promoted sectors |

BESS is the clearest structural gap: three guides for a sector with its own
homepage card, its own category tree and 20 part families in the catalog data.

## The caveat worth keeping

Corpus size is not currently the binding constraint. There is no `sameAs` on
the Organization node and no external profile anywhere in the repo, so nothing
ties this site to an off-site entity. Thirty more guides on a site nothing
links to will underperform fifteen on a site that gets cited. Build these
because they close real gaps for readers, not on the expectation that volume
alone moves rankings.
