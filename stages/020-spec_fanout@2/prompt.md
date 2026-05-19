Goal: Build Joni Capture, a phone-first iPhone app for capturing rambled LinkedIn ideas, handing them to Joni for draft preparation, monitoring Joni activity and analytics, and supporting an AI content interviewer mode.

## Completed stages
- **run_input_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/run-input-gate.mjs --app-type 'iPhone productivity and creator-operator tool. Read docs/superpowers/specs/2026-05-19-joni-capture-iphone-design.md and contexts/iphone-app-factory/joni-capture/feature-context.md. Build a lock-screen/action-button voice capture app for Joni, the LinkedIn agent. It must capture rambled post ideas, transcribe or queue them, submit through a configurable Joni ingestion client, classify post type, prepare evaluated LinkedIn drafts in Tim voice, show Joni activity and analytics, and include interviewer mode for structured notes. No LinkedIn publishing or mutation.' --target-audience 'Tim Keen and operator-founders who capture ideas on the move and want a private agent-assisted LinkedIn drafting workflow with visible status, draft review, and analytics.' --app-name 'Joni Capture' --bundle-id 'com.maestro.jonicapture' --app-dir 'apps/joni-capture-iphone' --spec-kitty-feature 'joni-capture-iphone-app' --ios-validation-mode 'github' --allow-macos-deferred 'false'`
  - Output:
    ```
    {"ok":true,"inputs":{"app_type":"[present]","target_audience":"[present]","app_name":"Joni Capture","bundle_id":"com.maestro.jonicapture","app_dir":"apps/joni-capture-iphone","spec_kitty_feature":"joni-capture-iphone-app","ios_validation_mode":"github","allow_macos_deferred":"false"},"failures":[]}
    ```
- **bootstrap**: succeeded
  - Script: `node scripts/iphone-app-factory/bootstrap.mjs --app-dir 'apps/joni-capture-iphone' --app-name 'Joni Capture' --bundle-id 'com.maestro.jonicapture' --boilerplate-repo 'SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution'`
  - Output:
    ```
    {"ok":true,"appDir":"apps/joni-capture-iphone","appName":"Joni Capture","bundleId":"com.maestro.jonicapture","boilerplateRepo":"SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution","secretShellGuards":{"installed":true,"path":"/usr/local/bin"},"boilerplateMaterialization":{"status":"materialized","source":"vendor/SwiftAIBoilerplatePro-Distribution.tar.gz","permissionNormalization":{"touched":8799,"errors":[]}},"appleDoubleCleanup":{"removed_count":7114,"remaining_count":0,"errors":[]}}
    ```
- **prompt_quality_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/promptfoo-prompt-quality.mjs --config evals/iphone-app-factory/prompt-quality.yaml --registry evals/iphone-app-factory/prompt-registry.json --out .workflow/iphone-app-factory/evals/prompt-quality.json --allow-fallback true --accepted-risk-promptfoo-failure false`
  - Output:
    ```
    {
      "ok": true,
      "prompt_count": 62,
      "prompt_file_count": 62,
      "promptfoo_attempted": true,
      "promptfoo_ok": false,
      "promptfoo_status": 100,
      "attempted_fallback_accepted": true,
      "accepted_risk_promptfoo_failure": false,
      "fallback_ok": true,
      "fallback_failure_count": 0,
      "promptfoo_failure_count": 1,
      "critical_gaps": [
        "appium_xcuitest_deferral_policy",
        "deterministic_gate_enforcement",
        "review_fan_in_integrity"
      ],
      "report_path": "/home/daytona/repos/kimprobably/maestro-os/.workflow/iphone-app-factory/evals/prompt-quality.json"
    }
    ```
- **research_fanout**: succeeded
- **research_join**: succeeded
- **research_synthesis**: succeeded
  - Model: anthropic/claude-haiku-4-5, 391.8k tokens in / 18.7k out
  - Files: /home/daytona/workspace/maestro-os/.workflow/iphone-app-factory/opportunity-matrix.json, /home/daytona/workspace/maestro-os/.workflow/iphone-app-factory/research-synthesis.md
- **research_evidence_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/research-evidence-gate.mjs`
  - Output:
    ```
    {"ok":true,"failures":[],"required_files":[".workflow/iphone-app-factory/research/app-store.md",".workflow/iphone-app-factory/research/reddit.md",".workflow/iphone-app-factory/research/competitors.md",".workflow/iphone-app-factory/research/design-patterns.md",".workflow/iphone-app-factory/research-synthesis.md",".workflow/iphone-app-factory/opportunity-matrix.json"]}
    ```
- **spec_fanout**: partially_succeeded
- **spec_join**: succeeded
- **spec_cross_critique**: succeeded
  - Model: google/gemini-3.1-pro-preview, 9.6m tokens in / 8.5k out
  - Files: /home/daytona/workspace/maestro-os/.workflow/iphone-app-factory/spec-cross-critique.md
- **spec_consensus**: failed

## Context
- failure_class: deterministic
- failure_signature: spec_consensus|deterministic|api_deterministic|openrouter|invalid_request
- parallel.branch_count: 4
- parallel.fan_in.best_head_sha: b1765ad5a9e730a6d6a3b30a2106fdd9b378ee85
- parallel.fan_in.best_id: spec_claude
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"spec_codex","status":"succeeded","head_sha":"2ad1e790e9e9111cb23fbac3bdd191f25d2a547a"},{"id":"spec_claude","status":"succeeded","head_sha":"b1765ad5a9e730a6d6a3b30a2106fdd9b378ee85"},{"id":"spec_kimi","status":"failed","head_sha":"8800aa5c6c3defe0c08352b30d68ea8129537602"},{"id":"spec_deepseek","status":"succeeded","head_sha":"2c2b788f5026c9d8027b69160155a9bba5b6d79f"}]


# Independent Spec Candidate

You are producing one independent spec candidate. Do not assume other model outputs are correct.

Read:

- `.workflow/iphone-app-factory/research-synthesis.md`
- `.workflow/iphone-app-factory/opportunity-matrix.json`
- `.workflow/iphone-app-factory/quality-bar.json`

Draft a complete iPhone app spec for `Joni Capture`.

The spec must include:

- problem statement
- target user
- MVP feature set
- non-goals
- user journeys
- acceptance criteria
- analytics/events
- privacy/security requirements
- App Store 4.3 differentiation statement
- Appium exploratory testing requirements
- SwiftAIBoilerplatePro module reuse plan
- Definition of Done

Write the candidate in your response and include a clear title with your model identity. The consensus stage will merge the branch outputs from context.