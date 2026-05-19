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
- **research_fanout**: partially_succeeded
- **research_join**: failed

## Context
- failure_class: deterministic
- failure_signature: research_join|deterministic|all candidates failed
- parallel.branch_count: 4
- parallel.results: [{"id":"app_store_research","status":"failed","head_sha":"934606e56c5a6abd62c826cc4f163c533f927131"},{"id":"reddit_research","status":"failed","head_sha":"350cd3252f3dbe08c5ab0176d971e7e0dff7b379"},{"id":"competitor_research","status":"failed","head_sha":"b1f9f122e9c482b7effa57a2366c61e636ee8030"},{"id":"design_pattern_research","status":"failed","head_sha":"51de76746501f703d4387e17d9299d5a1689ab6d"}]


# Research Synthesis

Read:

- `.workflow/iphone-app-factory/research/app-store.md`
- `.workflow/iphone-app-factory/research/reddit.md`
- `.workflow/iphone-app-factory/research/competitors.md`
- `.workflow/iphone-app-factory/research/design-patterns.md`
- `.workflow/iphone-app-factory/quality-bar.json`

Write `.workflow/iphone-app-factory/research-synthesis.md` with:

- target user and urgent problem
- jobs-to-be-done
- top complaint themes and quoted evidence summaries
- competitor strengths and weaknesses
- feature opportunity matrix
- differentiation thesis strong enough for App Store 4.3 review
- design direction
- MVP scope and non-goals
- risks and unknowns

Also write `.workflow/iphone-app-factory/opportunity-matrix.json` as strict JSON:

```json
{
  "opportunities": [
    {
      "title": "...",
      "evidence": ["..."],
      "user_pain": "...",
      "mvp_feature": "...",
      "differentiation": "...",
      "risk": "low|medium|high"
    }
  ]
}
```
