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

## Context
- parallel.branch_count: 3
- parallel.fan_in.best_head_sha: 0811dd9d23267a908b68836639535a89f44dd6cb
- parallel.fan_in.best_id: spec_candidate_a
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"spec_candidate_a","status":"succeeded","head_sha":"0811dd9d23267a908b68836639535a89f44dd6cb"},{"id":"spec_candidate_b","status":"failed","head_sha":"3da22d5e393974f5f473fb9eb0a1c53b37ce95df"},{"id":"spec_candidate_c","status":"failed","head_sha":"631025f7f4a3587990fd657b3facbf74dc06ece0"}]


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
