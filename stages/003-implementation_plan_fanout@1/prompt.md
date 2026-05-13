Goal: Implement Consumer Radar live discovery and enrichment with strict real-data gates

## Completed stages
- **live_source_preflight**: succeeded
  - Script: `echo APIFY_TOKEN live source preflight; node scripts/app-feedback/live-source-preflight.mjs --app-dir 'apps/generated-consumer-app-radar' --real-mode 'true' --allow-fixture-fallback 'false' --out .workflow/consumer-radar-live-enrichment/source-preflight.json`
  - Output:
    ```
    APIFY_TOKEN live source preflight
    {
      "ok": true,
      "app_dir": "/home/daytona/workspace/apps/generated-consumer-app-radar",
      "real_mode": true,
      "allow_fixture_fallback": false,
      "has_apify_token": true,
      "failures": []
    }
    ```


# Consumer Radar Live Enrichment Plan B: Product Surface First

Create implementation plan B for live Consumer Radar enrichment.

Write `.workflow/consumer-radar-live-enrichment/plans/product-surface-first.md`.

Required content:

- Fetch-more-apps API and UI workflow
- App review and example-content display workflow
- Test-driven checks before code changes
- Eval-driven checks for user value
- Live data gates and non-cheating criteria
- Simplification plan after implementation
- Pairwise tradeoff against a source-first plan
