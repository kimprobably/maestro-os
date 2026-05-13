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
- **plan_eval**: succeeded
  - Script: `node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage workflow --candidates .workflow/consumer-radar-live-enrichment/plans --out .workflow/consumer-radar-live-enrichment/plan-eval.json --minimum-candidates 2 --minimum-eval-score 0.72`
  - Output:
    ```
    (27 lines omitted)
        {
          "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/product-surface-first.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        },
        {
          "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/product-surface.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        }
      ],
      "selected": {
        "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/product-surface-first.md",
        "score": 1,
        "hits": 6,
        "possible": 6,
        "missing": []
      },
      "baseline": null,
      "failures": []
    }
    ```
- **implementation_plan_fanout**: partially_succeeded
- **plan_join**: succeeded
- **plan_eval**: succeeded
  - Script: `node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage workflow --candidates .workflow/consumer-radar-live-enrichment/plans --out .workflow/consumer-radar-live-enrichment/plan-eval.json --minimum-candidates 2 --minimum-eval-score 0.72`
  - Output:
    ```
    (27 lines omitted)
        {
          "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/product-surface-first.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        },
        {
          "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/product-surface.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        }
      ],
      "selected": {
        "file": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans/product-surface-first.md",
        "score": 1,
        "hits": 6,
        "possible": 6,
        "missing": []
      },
      "baseline": null,
      "failures": []
    }
    ```
- **implement_live_enrichment**: succeeded
  - Model: qwen/qwen3.6-plus, 3.0m tokens in / 30.1k out
  - Files: /home/daytona/workspace/.workflow/consumer-radar-live-enrichment/implementation-report.md, /home/daytona/workspace/apps/generated-consumer-app-radar/public/app.js, /home/daytona/workspace/apps/generated-consumer-app-radar/public/index.html, /home/daytona/workspace/apps/generated-consumer-app-radar/src/ingest.js, /home/daytona/workspace/apps/generated-consumer-app-radar/src/server.js, /home/daytona/workspace/apps/generated-consumer-app-radar/tests/live-enrichment.test.js
- **native_checks**: succeeded
  - Script: `node scripts/consumer-radar/run-native-checks.mjs 'apps/generated-consumer-app-radar'`
  - Output:
    ```
    {
      "ok": true,
      "checks": 3
    }
    ```
- **live_data_gate**: failed
  - Script: `node scripts/consumer-radar/assert-live-enrichment.mjs 'apps/generated-consumer-app-radar' --real-mode 'true' --allow-fixture-fallback 'false' --minimum-live-apps '8' --minimum-review-samples '12' --minimum-social-examples '8'`
  - Output:
    ```
    node:internal/modules/cjs/loader:1386
      throw err;
      ^
    
    Error: Cannot find module '/home/daytona/workspace/scripts/consumer-radar/assert-live-enrichment.mjs'
        at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
        at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
        at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
        at Function._load (node:internal/modules/cjs/loader:1192:37)
        at TracingChannel.traceSync (node:diagnostics_channel:328:14)
        at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
        at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
        at node:internal/main/run_main_module:36:49 {
      code: 'MODULE_NOT_FOUND',
      requireStack: []
    }
    
    Node.js v22.22.2
    ```

## Context
- failure_class: deterministic
- failure_signature: live_data_gate|deterministic|script failed with exit code: <n> ## output node:internal/modules/cjs/loader:<n> throw err; ^ error: cannot find module '/home/daytona/workspace/scripts/consumer-radar/assert-live-enrichment.mjs' at function._resolvefilename (node:internal/
- parallel.branch_count: 2
- parallel.fan_in.best_head_sha: 3e9a707943ac9f64e9b0fa8b59d192959ab3fcc3
- parallel.fan_in.best_id: plan_product_surface
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"plan_live_sources","status":"failed","head_sha":"8d4461e82331be763e09a2f2b27a49c4249a5ede"},{"id":"plan_product_surface","status":"succeeded","head_sha":"3e9a707943ac9f64e9b0fa8b59d192959ab3fcc3"}]


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