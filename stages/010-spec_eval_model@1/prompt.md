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

## Context
- parallel.branch_count: 3
- parallel.fan_in.best_head_sha: a1ef995de1131f4acfe41ad588b19df0d253df46
- parallel.fan_in.best_id: spec_candidate_b
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"spec_candidate_a","status":"failed","head_sha":"6fb4da3f2b746444940d7e4d742891204bd4f5b2"},{"id":"spec_candidate_b","status":"succeeded","head_sha":"a1ef995de1131f4acfe41ad588b19df0d253df46"},{"id":"spec_candidate_c","status":"failed","head_sha":"19adab109eed096c1a123f80110ef35242d6770d"}]


# Enhancement Eval Consensus

You are an eval judge for the enhancement-discovery workflow.

Read all available artifacts under `.workflow/enhancement-discovery/`, especially candidate files and contract eval JSON files.

Use this rubric:

- Intent fidelity: does the artifact solve the user's actual request?
- Non-cheating behavior: does it reject fixture-only, note-only, or placeholder implementations when real behavior is required?
- Test-driven development: are objective behaviors covered by deterministic tests and gates?
- Eval-driven development: are subjective outputs scored by rubric, pairwise comparison, and consensus?
- Architecture quality: are boundaries clear and maintainable?
- Workflow quality: are retry paths, fanout, gates, artifacts, and handoffs explicit?
- Simplification: does it require a real code simplification pass without deleting acceptance coverage?

Write the appropriate selected artifact:

- For spec consensus, write `.workflow/enhancement-discovery/selected-spec.md`.
- For architecture consensus, write `.workflow/enhancement-discovery/selected-architecture.md`.
- For workflow consensus, write `.workflow/enhancement-discovery/selected-workflow-design.md`.
- For final consensus, write `.workflow/enhancement-discovery/final-eval-consensus.md`.

End with one of:

- `VERDICT: APPROVED`
- `VERDICT: REJECTED`

If rejected, include exact changes required before retry.
