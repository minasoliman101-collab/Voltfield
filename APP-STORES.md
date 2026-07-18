# Getting VOLTFIELD on the App Stores

The site is now a **fully installable PWA** (manifest + service worker + icons, works 100% offline). That's the foundation both store routes build on. This document is the complete path from here to published apps.

---

## Stage 0 — Prerequisites (everything below depends on these)

| # | Prerequisite | Why | Cost |
|---|--------------|-----|------|
| 1 | **Deploy the site to a real HTTPS domain** (see README §3) | PWA install, TWA packaging, and store review all require a live HTTPS origin. `localhost` only works for testing. | ~$10–15/yr domain; hosting free |
| 2 | **Privacy policy at a public URL** | Both stores require one, even for apps that collect nothing. A template is included: `privacy-policy.html` — **fill in the bracketed fields and have it reviewed before submitting.** | free |
| 3 | **Google Play Console account** | Publishes Android apps | $25 one-time |
| 4 | **Apple Developer Program account** | Publishes iOS apps | $99/year |
| 5 | Store assets | Play: 512px icon (have it: `icons/icon-512.png`), 1024×500 feature graphic, 2+ phone screenshots. iOS: 1024px icon, screenshots per device size. | free (screenshots from the site) |

> Publishing as a **company** (recommended for a B2B brand): Google requires standard verification; Apple requires a D-U-N-S number for an organization account (free, takes ~1–2 weeks). Individual accounts are faster but show your personal name as the developer.

---

## Route A — Google Play via Trusted Web Activity (recommended first; ~1 day of work)

A TWA ships your **live website** as a real Android app (full-screen Chrome, no browser UI). Updates deploy instantly with the website — no store resubmission.

1. Deploy the site to your HTTPS domain and confirm the PWA passes: open Chrome DevTools → Lighthouse → PWA audit (should already pass — manifest, service worker, icons and offline are all wired).
2. Go to **https://www.pwabuilder.com**, enter your site URL, and click **Package for stores → Android**.
3. Set the package ID (e.g. `com.voltfield.supply`), app name, and let it generate a **signed `.aab`** (Android App Bundle). Download the package **and the signing key it creates — back that key up; you cannot update the app without it.**
4. PWABuilder gives you an `assetlinks.json`. Upload it to your site at exactly `/.well-known/assetlinks.json` — this proves you own the domain and removes the browser address bar.
5. In **Play Console**: Create app → upload the `.aab` to Production (or Internal testing first — recommended) → fill the store listing (title ≤30 chars, short + full description, screenshots, feature graphic) → content rating questionnaire → data-safety form (declare what you actually collect: with ads off, effectively nothing; with AdSense/AdMob on, declare advertising identifiers) → privacy policy URL.
6. Submit for review. First review typically takes a few days. New personal accounts must run a 14-day closed test with 12+ testers before production — org accounts skip this.

## Route B — iOS App Store (~2–5 days of work; needs a Mac)

Apple has no TWA equivalent; you ship a **WKWebView wrapper** around the site (PWABuilder can generate it) or a **Capacitor app** (Route C — better long-term).

1. On https://www.pwabuilder.com → **Package for stores → iOS** to generate an Xcode project wrapping your URL.
2. You need **a Mac with Xcode** to build and submit. No Mac? Use a cloud macOS build service (Codemagic, MacStadium, GitHub Actions macOS runners) — budget a day to wire up.
3. In Xcode: set your team/signing, bundle ID (`com.voltfield.supply`), build, then upload via **App Store Connect** → TestFlight (test it) → submit for review.
4. **The honest risk — Guideline 4.2 (minimum functionality):** Apple rejects apps that are "just a website." Your odds are decent because the app has real utility (BOM generator, offline 2M-SKU catalog, quote builder) — but improve them by: enabling full offline mode in the wrapper (works — the whole site is client-side), adding the app shortcuts, and writing review notes that lead with the BOM generator as an engineering tool, not a storefront. If rejected on 4.2, the Capacitor route with a couple of native touches (share sheet, haptics, push) usually gets through on resubmission.

## Route C — Capacitor (one codebase → both stores, fully offline, most "native" path)

Capacitor bundles the site's files **inside** the app binary — no web deploy needed, works with zero connectivity forever. Scaffold is ready in `app-wrapper/`:

1. Install **Node.js LTS** (https://nodejs.org) — not currently installed on this machine.
2. `cd app-wrapper` → `npm install`
3. `.\copy-site.ps1` (copies the site into `www/`, excluding server-only files)
4. `npx cap add android` (and `npx cap add ios` on a Mac) → `npx cap sync`
5. `npx cap open android` → build a signed `.aab` in Android Studio → Play Console (same listing steps as Route A step 5).
6. iOS: `npx cap open ios` on a Mac → Xcode → App Store Connect.
7. **Updates require store resubmission** (the web files are baked in). Bump the version, re-run `copy-site.ps1` + `npx cap sync`, rebuild, upload.

---

## Ads inside the apps — important

- **Route A (TWA):** it's your real website rendered by Chrome — **AdSense keeps working as-is.**
- **Routes B/C (WebView/Capacitor):** AdSense **is not permitted in app WebViews** (Google policy). Use **AdMob** (`@capacitor-community/admob` plugin) for app builds, keep AdSense for the web. The ad config in `voltfield-site-config.js` renders nothing when no publisher ID is set, so app builds can simply ship with ads off (`preview:false`).
- Both stores make you declare ads: Play's Data safety form + "Contains ads" flag; Apple's App Privacy section (advertising data → tracking disclosure; if you use AdMob with personalized ads you must show the App Tracking Transparency prompt).

## Which route first?

1. **Deploy the site + Route A (Play/TWA)** — cheapest, fastest, updates ship with the website.
2. **Route C (Capacitor) for iOS** once you have Mac access — strongest App Store review position and true offline.
3. Revisit ads after both are live (AdSense web + AdMob app, or leave apps ad-free — cleaner for a B2B tool).

## Suggested store listing copy (edit freely)

- **Title:** VOLTFIELD Supply — Parts & BOM
- **Short description (Play, ≤80 chars):** Search 2M+ industrial parts, generate component BOMs, build quotes — offline.
- **Long description opener:** Find the exact part, not just the category. VOLTFIELD puts a 2M+ SKU energy-infrastructure and MRO catalog in your pocket: configure transformers, switchgear, inverters, battery storage, oilfield equipment and everyday MRO; generate a full component-level Bill of Materials for any engineered part; match pasted parts lists in seconds; and build RFQ-ready quotes — all of it working fully offline in the field.
- **Keywords (iOS):** BOM, bill of materials, industrial parts, transformer, switchgear, solar, BESS, MRO, RFQ, procurement

> Reminder from README §5: the catalog data is modeled/illustrative. Store reviewers (and users) will treat listings at face value — make sure the app description matches what the data really is before you submit.
