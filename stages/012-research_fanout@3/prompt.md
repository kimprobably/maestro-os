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
- **research_synthesis**: failed
- **research_fanout**: partially_succeeded
- **research_join**: failed
- **research_synthesis**: failed

## Context
- failure_class: deterministic
- failure_signature: research_synthesis|deterministic|api_deterministic|openrouter|invalid_request
- parallel.branch_count: 4
- parallel.results: [{"id":"app_store_research","status":"failed","head_sha":"d709042c72a8f0a9283b4be11448588c209b8ac1"},{"id":"reddit_research","status":"failed","head_sha":"4333c341bdcd44fc96df480b86f5e4e25d10d21c"},{"id":"competitor_research","status":"failed","head_sha":"41e8a88ac72378284ca8ff29fb32f60cc9441790"},{"id":"design_pattern_research","status":"failed","head_sha":"103c77fbb11198f55bb189d115d4664b80be3c44"}]


# iOS Design Pattern Research

Read `.workflow/iphone-app-factory/context.md`, `quality-bar.json`, and the research artifacts.

If `true` is true and a usable Mobbin login/session is available, use browser tooling to inspect Mobbin iOS patterns that fit this app type. Credentials, if available, come from `MOBBIN_EMAIL` and `MOBBIN_PASSWORD`; never write either value into files, prompts, logs, or reports. Use Mobbin's native email/password path by clicking `See other options`; do not choose Google OAuth for these credentials. Otherwise use Apple Human Interface Guidelines, competitor screenshots/listings, and the boilerplate DesignSystem docs.

Secret handling is blocking: never print environment variables or credential values. If checking Mobbin credential availability, report only true/false presence and never echo, grep, dump, log, or write the email, password, cookies, or session values. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Do not spawn subagents, delegate, inspect `.env` files, or search the environment for credentials. If Mobbin or another live source fails, record the limitation and continue with HIG and public-reference evidence.

Write `.workflow/iphone-app-factory/research/design-patterns.md` with:

- pattern name
- source app or design reference
- why it fits this product
- what to adapt into SwiftUI
- what not to copy
- DesignSystem components or tokens likely to use

This is inspiration and pattern abstraction, not clone work. Do not copy another app's visual design or proprietary assets.

Keep the pass bounded: write the report once, do not run ad hoc verification loops, and end after the file is written. Do not write implementation code.