Goal: Use eval-driven development to discover the real Consumer Radar enhancement workflow required by product feedback

## Completed stages
- **bootstrap**: succeeded
  - Script: `mkdir -p .workflow/enhancement-discovery/spec-candidates .workflow/enhancement-discovery/architecture-candidates .workflow/enhancement-discovery/workflow-candidates .workflow/enhancement-discovery/evals; test -f 'feedback/consumer-radar-product-feedback.md'; test -d 'apps/generated-consumer-app-radar'; echo eval_driven_development test_driven_development`
  - Output:
    ```
    eval_driven_development test_driven_development
    ```
- **parse_requests**: succeeded
  - Script: `node scripts/app-feedback/parse-feedback.mjs --feedback 'feedback/consumer-radar-product-feedback.md' --out .workflow/enhancement-discovery/request-analysis.json`
  - Output:
    ```
    (14 lines omitted)
          "required": true,
          "expectation": "Every growth hypothesis must disclose whether live social scraping ran and lower confidence for fixture-backed claims."
        },
        {
          "id": "visible-review-samples",
          "required": true,
          "expectation": "The UI must surface representative App Store review samples for each opportunity."
        },
        {
          "id": "emerging-not-biggest-ranking",
          "required": true,
          "expectation": "Ranking must favor apps with recent velocity outside the top category leaders."
        },
        {
          "id": "visible-example-content",
          "required": true,
          "expectation": "The app detail view must show social content examples and source status."
        },
        {
          "id": "add-app-research-seed",
          "required": true,
          "expectation": "The UI and API must support adding a new app as a research seed."
        }
      ]
    }
    ```
- **capability_audit**: succeeded
  - Script: `node scripts/app-feedback/analyze-enhancement-capabilities.mjs --app-dir 'apps/generated-consumer-app-radar' --analysis .workflow/enhancement-discovery/request-analysis.json --target 'consumer-radar' --out .workflow/enhancement-discovery/capability-audit.json`
  - Output:
    ```
    (22 lines omitted)
          "severity": "blocker",
          "finding": "The app has no API endpoint that discovers or enriches more apps from live sources.",
          "required_work": "Add a live discovery/enrichment endpoint and UI control that can run with APIFY_TOKEN."
        },
        {
          "id": "fixture-only-refresh",
          "severity": "blocker",
          "finding": "Refresh modes still behave as fixture or smoke paths, not real data acquisition.",
          "required_work": "Add real-mode ingestion that fails when live evidence is required and unavailable."
        },
        {
          "id": "honest-but-not-complete",
          "severity": "major",
          "finding": "The previous enhancement disclosed fixture provenance but did not complete the live behavior.",
          "required_work": "Replace fixture-only evidence with live scrape evidence where real mode is requested."
        }
      ],
      "non_cheating_requirements": [
        "Real-mode live discovery must fail if APIFY_TOKEN is absent and allow_fixture_fallback=false.",
        "Growth hypotheses must cite live social or App Store evidence when marked liveScraped=true.",
        "Fixture-backed rows may remain only when visually disclosed and excluded from live acceptance counts.",
        "Add-app controls must be able to fetch or enrich more apps, not only seed local placeholders.",
        "Review samples and example content must include source provenance."
      ]
    }
    ```
- **spec_fanout**: partially_succeeded
- **spec_join**: succeeded
- **ensure_spec_candidates**: succeeded
  - Script: `node scripts/app-feedback/ensure-enhancement-candidates.mjs --stage spec --dir .workflow/enhancement-discovery/spec-candidates --minimum '3' --out .workflow/enhancement-discovery/evals/spec-candidate-ensure.json`
  - Output:
    ```
    (2 lines omitted)
      "stage": "spec",
      "dir": "/home/daytona/workspace/.workflow/enhancement-discovery/spec-candidates",
      "minimum": 3,
      "existing_count": 0,
      "generated_count": 3,
      "existing_before": [],
      "generated": [
        "fallback-data-truth.md",
        "fallback-product-ux.md",
        "fallback-workflow-first.md"
      ],
      "candidate_count": 3,
      "candidates": [
        "fallback-data-truth.md",
        "fallback-product-ux.md",
        "fallback-workflow-first.md"
      ],
      "files": [
        "fallback-data-truth.md",
        "fallback-product-ux.md",
        "fallback-workflow-first.md"
      ],
      "fallback_generated": true,
      "fallback_provenance": true
    }
    ```
- **spec_eval_contract**: succeeded
  - Script: `node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage spec --candidates .workflow/enhancement-discovery/spec-candidates --out .workflow/enhancement-discovery/evals/spec-contract.json --minimum-candidates '3' --minimum-eval-score '0.78' --dataset evals/workflow-quality/datasets/enhancement-discovery-golden.jsonl --dataset-version workflow-quality-v1 --prompt-version app-feedback-spec-candidates-v1 --rubric-version enhancement-discovery-spec-rubric-v1 --judge-model deterministic-marker-v1 --baseline evals/workflow-quality/baselines/enhancement-discovery-spec.json --max-regression '0.05'`
  - Output:
    ```
    (41 lines omitted)
        {
          "file": "/home/daytona/workspace/.workflow/enhancement-discovery/spec-candidates/fallback-workflow-first.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        }
      ],
      "selected": {
        "file": "/home/daytona/workspace/.workflow/enhancement-discovery/spec-candidates/fallback-data-truth.md",
        "score": 1,
        "hits": 6,
        "possible": 6,
        "missing": []
      },
      "baseline": {
        "path": "/home/daytona/workspace/evals/workflow-quality/baselines/enhancement-discovery-spec.json",
        "score": 0.78,
        "dataset_version": "workflow-quality-v1",
        "rubric_version": "enhancement-discovery-spec-rubric-v1",
        "delta": 0.22,
        "max_regression": 0.05
      },
      "failures": []
    }
    ```
- **spec_eval_model**: succeeded
  - Model: deepseek/deepseek-v4-pro, 86.6k tokens in / 4.7k out
  - Files: /home/daytona/workspace/.workflow/enhancement-discovery/selected-spec.md
- **spec_eval_consensus**: succeeded
  - Model: deepseek/deepseek-v4-pro, 158.9k tokens in / 14.1k out
  - Files: /home/daytona/workspace/.workflow/enhancement-discovery/final-eval-consensus.md, /home/daytona/workspace/.workflow/enhancement-discovery/selected-spec.md
- **architecture_fanout**: partially_succeeded
- **architecture_join**: succeeded
- **ensure_architecture_candidates**: succeeded
  - Script: `node scripts/app-feedback/ensure-enhancement-candidates.mjs --stage architecture --dir .workflow/enhancement-discovery/architecture-candidates --minimum '2' --out .workflow/enhancement-discovery/evals/architecture-candidate-ensure.json`
  - Output:
    ```
    {
      "ok": true,
      "stage": "architecture",
      "dir": "/home/daytona/workspace/.workflow/enhancement-discovery/architecture-candidates",
      "minimum": 2,
      "existing_count": 1,
      "generated_count": 1,
      "existing_before": [
        "extensible-source-pipeline.md"
      ],
      "generated": [
        "fallback-smallest-surface.md"
      ],
      "candidate_count": 2,
      "candidates": [
        "extensible-source-pipeline.md",
        "fallback-smallest-surface.md"
      ],
      "files": [
        "extensible-source-pipeline.md",
        "fallback-smallest-surface.md"
      ],
      "fallback_generated": true,
      "fallback_provenance": true
    }
    ```
- **architecture_eval_contract**: succeeded
  - Script: `node scripts/app-feedback/evaluate-enhancement-artifact.mjs --stage architecture --candidates .workflow/enhancement-discovery/architecture-candidates --out .workflow/enhancement-discovery/evals/architecture-contract.json --minimum-candidates '2' --minimum-eval-score '0.78' --dataset evals/workflow-quality/datasets/enhancement-discovery-golden.jsonl --dataset-version workflow-quality-v1 --prompt-version app-feedback-architecture-candidates-v1 --rubric-version enhancement-discovery-architecture-rubric-v1 --judge-model deterministic-marker-v1 --baseline evals/workflow-quality/baselines/enhancement-discovery-architecture.json --max-regression '0.05'`
  - Output:
    ```
    (36 lines omitted)
        {
          "file": "/home/daytona/workspace/.workflow/enhancement-discovery/architecture-candidates/fallback-smallest-surface.md",
          "score": 1,
          "hits": 6,
          "possible": 6,
          "missing": []
        }
      ],
      "selected": {
        "file": "/home/daytona/workspace/.workflow/enhancement-discovery/architecture-candidates/fallback-smallest-surface.md",
        "score": 1,
        "hits": 6,
        "possible": 6,
        "missing": []
      },
      "baseline": {
        "path": "/home/daytona/workspace/evals/workflow-quality/baselines/enhancement-discovery-architecture.json",
        "score": 0.78,
        "dataset_version": "workflow-quality-v1",
        "rubric_version": "enhancement-discovery-architecture-rubric-v1",
        "delta": 0.22,
        "max_regression": 0.05
      },
      "failures": []
    }
    ```
- **architecture_eval_consensus**: succeeded
  - Model: deepseek/deepseek-v4-pro, 279.8k tokens in / 15.3k out
  - Files: /home/daytona/workspace/.workflow/enhancement-discovery/final-eval-consensus.md, /home/daytona/workspace/.workflow/enhancement-discovery/selected-architecture.md, /home/daytona/workspace/.workflow/enhancement-discovery/selected-workflow-design.md

## Context
- parallel.branch_count: 2
- parallel.fan_in.best_head_sha: b98c2a2de27d932df7b40bf84c1705573c2134c4
- parallel.fan_in.best_id: architecture_candidate_b
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"architecture_candidate_a","status":"failed","head_sha":"15fce176af67dca37f3ff6ceab43d5a688e0c651"},{"id":"architecture_candidate_b","status":"succeeded","head_sha":"b98c2a2de27d932df7b40bf84c1705573c2134c4"}]


# Workflow Candidate B: Generated Subworkflow

Design a Fabro workflow that first generates an app-specific enhancement workflow, then validates or runs it.

Read:

- `.workflow/enhancement-discovery/spec-candidates/`
- `.workflow/enhancement-discovery/architecture-candidates/`
- Existing app workflow files under `workflows/`

Write `.workflow/enhancement-discovery/workflow-candidates/generated-subworkflow.md`.

Required rubric coverage:

- Parent workflow stages
- Generated child workflow stages
- Test-driven deterministic gates
- Eval-driven rubric gates and pairwise comparison
- Non-cheating live data gates
- Code simplification stages in both parent and child workflows
- Retry targets and handoff artifacts
- CI/CD and model-review fanout

The workflow should be reusable for future apps, not only Consumer Radar.
