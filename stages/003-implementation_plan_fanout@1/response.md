The plan file has been successfully created at `.workflow/consumer-radar-live-enrichment/plans/source-first.md` (172 lines) with all required sections:

1. **Apify App Store discovery path** — Actor configuration, execution flow, normalization, dedup, failure handling
2. **TikTok and Instagram social enrichment path** — Both scrapers with defaults, search strategies, signal aggregation, rate limiting
3. **Apple review ingestion path** — JSON feed primary, App Store Connect secondary, review processing, RSS smoke precheck
4. **Test-driven checks before code changes** — Unit tests per module, integration/smoke tests, test execution via `node --test`
5. **Eval-driven checks for source realism** — Promptfoo eval suite for source realism, ranking quality, and social signal validity
6. **Live data gates and non-cheating criteria** — Thresholds table, strict enforcement rules, `assert-live-enrichment.mjs` implementation spec
7. **Simplification plan after implementation** — Dead code removal, normalization consolidation, regression verification
8. **Pairwise tradeoff: Source-First vs Product-Surface-First** — 8-dimension comparison table with recommendation