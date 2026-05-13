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
- **implementation_plan_fanout**: partially_succeeded
- **plan_join**: succeeded
- **ensure_plan_candidates**: succeeded
  - Script: `node scripts/app-feedback/ensure-live-enrichment-plans.mjs --plans .workflow/consumer-radar-live-enrichment/plans --minimum-candidates 2`
  - Output:
    ```
    {
      "ok": true,
      "plans_dir": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans",
      "minimum_candidates": 2,
      "before_count": 1,
      "after_count": 2,
      "created": [
        "source-first-fallback.md"
      ],
      "candidates": [
        "product-surface-first.md",
        "source-first-fallback.md"
      ]
    }
    ```
- **plan_eval**: succeeded
  - Script: `node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage workflow --candidates .workflow/consumer-radar-live-enrichment/plans --out .workflow/consumer-radar-live-enrichment/plan-eval.json --minimum-candidates 2 --minimum-eval-score 0.72`
  - Output:
    ```
    (30 lines omitted)
          "hits": 4,
          "possible": 6,
          "missing": [
            "fanout",
            "retry"
          ]
        },
        {
          "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/source-first-fallback.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        }
      ],
      "selected": {
        "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/source-first-fallback.md",
        "score": 1,
        "hits": 6,
        "possible": 6,
        "missing": []
      },
      "baseline": null,
      "failures": []
    }
    ```

## Context
- parallel.branch_count: 2
- parallel.fan_in.best_head_sha: 8a776804d5472254a0c3beb68c607340480c20ed
- parallel.fan_in.best_id: plan_product_surface
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"plan_live_sources","status":"failed","head_sha":"6bf9aafb4bc57a0415b47fec793db0ffe76cba49"},{"id":"plan_product_surface","status":"succeeded","head_sha":"8a776804d5472254a0c3beb68c607340480c20ed"}]


# Consumer Radar Live Enrichment Implementation

Implement the generated live-enrichment workflow for `apps/generated-consumer-app-radar`.

Required behavior:

- Wire Apify actor execution into live app discovery and social-content enrichment.
- Use Apple review ingestion for visible review samples.
- Add API/UI controls to fetch more apps.
- Fail real mode when required credentials or live results are missing and `allow_fixture_fallback=false`.
- Persist evidence artifacts showing which rows are live-scraped vs fixture-backed.
- Add deterministic tests before implementation changes.
- Add a code simplification pass before final review.

Write a short implementation report to `.workflow/consumer-radar-live-enrichment/implementation-report.md`.