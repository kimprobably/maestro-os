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
  - Model: gpt-5.3-codex, 181.4k tokens in / 3.1k out
- **research_evidence_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/research-evidence-gate.mjs`
  - Output:
    ```
    {"ok":true,"failures":[],"required_files":[".workflow/iphone-app-factory/research/app-store.md",".workflow/iphone-app-factory/research/reddit.md",".workflow/iphone-app-factory/research/competitors.md",".workflow/iphone-app-factory/research/design-patterns.md",".workflow/iphone-app-factory/research-synthesis.md",".workflow/iphone-app-factory/opportunity-matrix.json"]}
    ```
- **research_fanout**: succeeded
- **research_join**: succeeded
- **research_synthesis**: succeeded
  - Model: gpt-5.3-codex, 181.4k tokens in / 3.1k out
- **research_evidence_gate**: succeeded
  - Script: `node scripts/iphone-app-factory/research-evidence-gate.mjs`
  - Output:
    ```
    {"ok":true,"failures":[],"required_files":[".workflow/iphone-app-factory/research/app-store.md",".workflow/iphone-app-factory/research/reddit.md",".workflow/iphone-app-factory/research/competitors.md",".workflow/iphone-app-factory/research/design-patterns.md",".workflow/iphone-app-factory/research-synthesis.md",".workflow/iphone-app-factory/opportunity-matrix.json"]}
    ```
- **spec_fanout**: succeeded
- **spec_join**: succeeded
- **spec_cross_critique**: succeeded
  - Model: gpt-5.3-codex, 396.1k tokens in / 3.1k out
- **spec_consensus**: succeeded
  - Model: gpt-5.3-codex, 299.2k tokens in / 3.8k out

## Context
- parallel.branch_count: 4
- parallel.fan_in.best_head_sha: 3f72d9d42d4dc1795aa71b716845195511834f92
- parallel.fan_in.best_id: spec_claude
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"spec_codex","status":"succeeded","head_sha":"5a4b6fbf24ca0930c2a978ea64a7cab75b3a5767"},{"id":"spec_claude","status":"succeeded","head_sha":"3f72d9d42d4dc1795aa71b716845195511834f92"},{"id":"spec_kimi","status":"succeeded","head_sha":"76315c650863c022f30e4c3afb1ace78531a9e87"},{"id":"spec_deepseek","status":"succeeded","head_sha":"c1247427d77348bc9331352d9ea19e85fbc9d3e7"}]


# Spec Red Team

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/definition-of-done.md`
- `.workflow/iphone-app-factory/research-synthesis.md`
- `.workflow/iphone-app-factory/quality-bar.json`

Review the spec as a skeptical product, QA, iOS, and App Store reviewer.

Reject if:

- research evidence is too weak to justify the product
- features are vague or untestable
- the app is too template-like
- boilerplate reuse is unclear
- Appium exploratory QA is not required
- release criteria can pass without macOS/Xcode evidence

Write `.workflow/iphone-app-factory/spec-red-team.md`.

End with exactly one verdict line:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
