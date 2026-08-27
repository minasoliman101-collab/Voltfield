# Retired: the /parts/ family-page pipeline

These built and maintained the 243 per-family pages under `/parts/`, removed in
the consolidation pass.

They are kept rather than deleted because the family data itself is still live
— `voltfield-catalog-data.js` drives the Spec Library — and these scripts are
the record of how the static mirror of it was produced.

**Do not run them.** `gen-parts-redirects.sh` in particular rewrites the
`/parts/` block in `_redirects`, which now holds the 301s pointing each retired
URL at the category page that absorbed it. Running it would replace those with
redirects to pages that no longer exist.

Why the pages went: measured against the whole site, they carried a median of
31% distinctive 8-word phrases (guides 91%, category pages 90%, calculators
78%), 297 phrases appeared on 95%+ of them, and the genuinely unique editorial
content was about one sentence per page. At 243 of 322 pages they were 75% of
the crawlable site.
