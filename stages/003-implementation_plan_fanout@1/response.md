Done. `.workflow/consumer-radar-live-enrichment/plans/source-first.md` is written. It covers:

1. **Apify App Store discovery** — extending `src/sources/apify.js` with `discoverApps`, wiring into `ingest.js` with `mode: "live"`
2. **Apple review ingestion** — extending `src/sources/apple.js` iTunes RSS pagination, populating `reviewSamples` per app (≥12 target)
3. **TikTok/Instagram social enrichment** — reusing existing `fetchTikTokSignals` / `fetchInstagramSignals`, targeting ≥8 social examples
4. **Test-driven checks** — T1 (preflight, already passed), T2–T5 (existing scripts), T6–T9 (new assertions to add for live data provenance and endpoint contracts)
5. **Eval-driven realism checks** — deterministic `assert-live-enrichment.mjs` gate + LLM rubric scoring (≥0.72 score, 5 sub-checks all true)
6. **Live data gates and non-cheating** — strict `real_mode=true, allow_fixture_fallback=false` enforcement, no synthetic reviews, no cached social data, no hard-coded app lists, replay protection via actor run IDs
7. **Simplification plan** — remove dead paths, consolidate adapters, inline small utilities, trim unused fields, re-run full gate chain
8. **Pairwise tradeoff vs Plan B** — 9-dimension comparison table with recommendation for Plan A (source-first given this workflow's real-data-gate emphasis)