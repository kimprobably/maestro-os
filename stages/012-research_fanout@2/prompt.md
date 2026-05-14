Goal: Build a differentiated iPhone app from a researched app opportunity using SwiftAIBoilerplatePro

## Completed stages
- **bootstrap**: succeeded
  - Script: `node scripts/iphone-app-factory/bootstrap.mjs --app-dir 'apps/waketask-iphone' --app-name 'WakeTask' --bundle-id 'com.keen.waketask' --boilerplate-repo 'SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution'`
  - Output:
    ```
    {"ok":true,"appDir":"apps/waketask-iphone","appName":"WakeTask","bundleId":"com.keen.waketask","boilerplateRepo":"SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution","secretShellGuards":{"installed":true,"path":"/usr/local/bin"},"boilerplateMaterialization":{"status":"materialized","source":"vendor/SwiftAIBoilerplatePro-Distribution.tar.gz"}}
    ```
- **prompt_quality_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/promptfoo-prompt-quality.mjs --config evals/iphone-app-factory/prompt-quality.yaml --registry evals/iphone-app-factory/prompt-registry.json --out .workflow/iphone-app-factory/evals/prompt-quality.json --allow-fallback true`
  - Output:
    ```
    {
      "ok": true,
      "registry_path": "evals/iphone-app-factory/prompt-registry.json",
      "dataset_version": "iphone-app-factory-prompts-v1",
      "rubric_version": "iphone-app-factory-prompt-rubric-v1",
      "prompt_count": 32,
      "prompt_file_count": 32,
      "promptfoo_attempted": true,
      "promptfoo_status": 100,
      "promptfoo_stdout_excerpt": "           │               │               │               │ Prompt Suite  │\n│               │               │               │               │               │               │               │ ## Overall    │\n│               │               │               │               │               │               │               │ Assessment:   │\n│               │               │               │               │               │               │               │ **STRONG BUT  │\n│               │               │               │               │               │               │               │ WITH CRITICAL │\n│               │               │               │               │               │               │               │ GAPS**        │\n│               │               │               │               │               │               │               │ (7.2/10)      │\n│               │               │               │               │               │               │               │ This is a     │\n│               │               │               │               │               │               │               │ well-archite… │\n│               │               │               │               │               │               │               │ prompt suite  │\n│               │               │               │               │               │               │               │ with          │\n│               │               │               │               │               │               │               │ excellent     │\n│               │               │               │               │               │               │               │ structural    │\n│               │               │               │               │               │               │               │ discipline,   │\n│               │               │               │               │               │               │               │ but it has    │\n│               │               │               │               │               │               │               │ **three       │\n│               │               │               │               │               │               │               │ blocking      │\n│               │               │               │               │               │               │               │ vulnerabilit… │\n│               │               │               │               │               │               │               │ for overn...  │\n└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘\n✓ Eval complete (ID: eval-ldP-2026-05-14T09:51:31)\n\n» View results: promptfoo view\n» Share with your team: https://promptfoo.app\n» Feedback: https://promptfoo.dev/feedback\n\nTotal Tokens: 5,868\n  Eval: 4,755 (4,055 prompt, 700 completion)\n  Grading: 1,113 (931 prompt, 182 completion)\n\nResults:\n  0 passed (0%)\n  ✗ 1 failed (100%)\n  0 errors (0%)\nDuration: 12s (concurrency: 1)\n\nWriting output to .workflow/iphone-app-factory/evals/promptfoo-output.json\n",
      "promptfoo_stderr_excerpt": "npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead\nnpm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.\nnpm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.\n",
      "fallback_used": true,
      "fallback_ok": true,
      "fallback_failures": []
    }
    ```
- **research_fanout**: succeeded
- **research_join**: succeeded
- **research_synthesis**: succeeded
  - Model: gpt-5.3-codex, 322.0k tokens in / 2.2k out
- **research_evidence_gate**: failed
  - Script: `node scripts/iphone-app-factory/research-evidence-gate.mjs`
  - Output:
    ```
    (2 lines omitted)
      "failures": [
        "missing .workflow/iphone-app-factory/research/app-store.md",
        "missing .workflow/iphone-app-factory/research/reddit.md",
        "missing .workflow/iphone-app-factory/research/competitors.md",
        "missing .workflow/iphone-app-factory/research/design-patterns.md",
        "missing .workflow/iphone-app-factory/research-synthesis.md",
        "missing .workflow/iphone-app-factory/opportunity-matrix.json",
        "research synthesis missing required term: target user",
        "research synthesis missing required term: jobs-to-be-done",
        "research synthesis missing required term: competitor",
        "research synthesis missing required term: App Store",
        "research synthesis missing required term: design",
        "research synthesis missing required term: MVP",
        "research synthesis missing required term: risk",
        "opportunity matrix must contain at least one opportunity"
      ],
      "required_files": [
        ".workflow/iphone-app-factory/research/app-store.md",
        ".workflow/iphone-app-factory/research/reddit.md",
        ".workflow/iphone-app-factory/research/competitors.md",
        ".workflow/iphone-app-factory/research/design-patterns.md",
        ".workflow/iphone-app-factory/research-synthesis.md",
        ".workflow/iphone-app-factory/opportunity-matrix.json"
      ]
    }
    ```

## Context
- failure_class: deterministic
- failure_signature: research_evidence_gate|deterministic|script failed with exit code: <n> ## output { "ok": false,"failures": [ "missing .workflow/iphone-app-factory/research/app-store.md","missing .workflow/iphone-app-factory/research/reddit.md","missing .workflow/iphone-app-factory/research/co
- parallel.branch_count: 4
- parallel.fan_in.best_head_sha: 1020a9f0bcc8408a3e89413582d523d13f4c0e7d
- parallel.fan_in.best_id: app_store_research
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"app_store_research","status":"succeeded","head_sha":"1020a9f0bcc8408a3e89413582d523d13f4c0e7d"},{"id":"reddit_research","status":"succeeded","head_sha":"c5b841e266e2e7b163e9e1b45f5a63002474bc26"},{"id":"competitor_research","status":"succeeded","head_sha":"f93b44c98e00441ad00358cbc62f1719f988e83e"},{"id":"design_pattern_research","status":"succeeded","head_sha":"9f77e4a9ef6d2f9df4bf277068e3770e9c2e04f1"}]


# iOS Design Pattern Research

Read `.workflow/iphone-app-factory/context.md`, `quality-bar.json`, and the research artifacts.

If `true` is true and a usable Mobbin login/session is available, use browser tooling to inspect Mobbin iOS patterns that fit this app type. Credentials, if available, come from `MOBBIN_EMAIL` and `MOBBIN_PASSWORD`; never write either value into files, prompts, logs, or reports. Use Mobbin's native email/password path by clicking `See other options`; do not choose Google OAuth for these credentials. Otherwise use Apple Human Interface Guidelines, competitor screenshots/listings, and the boilerplate DesignSystem docs.

Secret handling is blocking: never print environment variables or credential values. If checking Mobbin credential availability, report only true/false presence and never echo, grep, dump, log, or write the email, password, cookies, or session values. Do not run environment dump commands such as `env`, `printenv`, `set`, `export`, or `declare -x`, and do not echo any `$...TOKEN`, `$...KEY`, `$...PASSWORD`, `$...AUTH`, or `$...CREDENTIAL` variable.

Write `.workflow/iphone-app-factory/research/design-patterns.md` with:

- pattern name
- source app or design reference
- why it fits this product
- what to adapt into SwiftUI
- what not to copy
- DesignSystem components or tokens likely to use

This is inspiration and pattern abstraction, not clone work. Do not copy another app's visual design or proprietary assets.