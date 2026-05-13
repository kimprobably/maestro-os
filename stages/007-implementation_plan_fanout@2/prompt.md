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
- **plan_eval**: failed
  - Script: `node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage workflow --candidates .workflow/consumer-radar-live-enrichment/plans --out .workflow/consumer-radar-live-enrichment/plan-eval.json --minimum-candidates 2 --minimum-eval-score 0.72`
  - Output:
    ```
    (9 lines omitted)
        "rubric_version": "workflow-rubric-v0",
        "judge_model": "deterministic-marker-v1",
        "evaluator_version": "enhancement-artifact-evaluator-v1",
        "generated_at": "2026-05-13T21:37:11.429Z"
      },
      "candidates_dir": "/home/daytona/workspace/.workflow/consumer-radar-live-enrichment/plans",
      "candidate_count": 0,
      "minimum_candidates": 2,
      "minimum_eval_score": 0.72,
      "rubric": [
        "fanout",
        "gate",
        "retry",
        "eval-driven",
        "test-driven",
        "simplification"
      ],
      "scores": [],
      "selected": null,
      "baseline": null,
      "failures": [
        "expected at least 2 workflow candidates, found 0",
        "best workflow score is below minimum_eval_score 0.72"
      ]
    }
    ```

## Context
- failure_class: deterministic
- failure_signature: plan_eval|deterministic|script failed with exit code: <n> ## output { "ok": false,"verdict": "rejected","stage": "workflow","lineage": { "dataset_path": null,"dataset_version": "workflow-dataset-v0","dataset_sha256": null,"prompt_version": "workflow-prompt-v0","ru
- parallel.branch_count: 2
- parallel.fan_in.best_head_sha: 0cd13ab6b46da62b0c268101a5cd3e6b883b9028
- parallel.fan_in.best_id: plan_live_sources
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"plan_live_sources","status":"succeeded","head_sha":"0cd13ab6b46da62b0c268101a5cd3e6b883b9028"},{"id":"plan_product_surface","status":"failed","head_sha":"81cc29f6025bca6db3f0358a2db281904f1d4530"}]


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
