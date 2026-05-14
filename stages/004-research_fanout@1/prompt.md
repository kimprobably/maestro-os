Goal: Build a differentiated iPhone app from a researched app opportunity using SwiftAIBoilerplatePro

## Completed stages
- **bootstrap**: succeeded
  - Script: `node scripts/iphone-app-factory/bootstrap.mjs --app-dir 'apps/waketask-iphone' --app-name 'WakeTask' --bundle-id 'com.keen.waketask' --boilerplate-repo 'SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution'`
  - Output:
    ```
    {"ok":true,"appDir":"apps/waketask-iphone","appName":"WakeTask","bundleId":"com.keen.waketask","boilerplateRepo":"SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution"}
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
      "promptfoo_stdout_excerpt": "           │               │               │               │ Prompt Suite  │\n│               │               │               │               │               │               │               │ ## Overall    │\n│               │               │               │               │               │               │               │ Assessment:   │\n│               │               │               │               │               │               │               │ **STRONG BUT  │\n│               │               │               │               │               │               │               │ WITH CRITICAL │\n│               │               │               │               │               │               │               │ GAPS** ⚠️     │\n│               │               │               │               │               │               │               │ **Score:      │\n│               │               │               │               │               │               │               │ 7.2/10** for  │\n│               │               │               │               │               │               │               │ overnight     │\n│               │               │               │               │               │               │               │ agentic       │\n│               │               │               │               │               │               │               │ generation    │\n│               │               │               │               │               │               │               │ The suite     │\n│               │               │               │               │               │               │               │ demonstrates  │\n│               │               │               │               │               │               │               │ sophisticated │\n│               │               │               │               │               │               │               │ multi-stage   │\n│               │               │               │               │               │               │               │ orchestration │\n│               │               │               │               │               │               │               │ and strong    │\n│               │               │               │               │               │               │               │ guardrails,   │\n│               │               │               │               │               │               │               │ b...          │\n└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘\n✓ Eval complete (ID: eval-Zij-2026-05-14T06:36:28)\n\n» View results: promptfoo view\n» Share with your team: https://promptfoo.app\n» Feedback: https://promptfoo.dev/feedback\n\nTotal Tokens: 5,842\n  Eval: 4,735 (4,035 prompt, 700 completion)\n  Grading: 1,107 (931 prompt, 176 completion)\n\nResults:\n  0 passed (0%)\n  ✗ 1 failed (100%)\n  0 errors (0%)\nDuration: 11s (concurrency: 1)\n\nWriting output to .workflow/iphone-app-factory/evals/promptfoo-output.json\n",
      "promptfoo_stderr_excerpt": "npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead\nnpm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.\nnpm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.\n",
      "fallback_used": true,
      "fallback_ok": true,
      "fallback_failures": []
    }
    ```


# Competitor Research

Read `.workflow/iphone-app-factory/context.md`, `quality-bar.json`, and any research artifacts already available.

Find up to `12` competitor iPhone apps. For each:

- positioning and primary promise
- onboarding shape
- monetization
- main features
- retention mechanics
- visible reviews/complaints
- likely growth channel or social wedge
- gaps we can exploit

Write `.workflow/iphone-app-factory/research/competitors.md`.

Secret handling is blocking: never print environment variables or credential values. If checking credential availability, report only true/false presence and never echo, grep, dump, log, or write the value.

Be explicit about evidence quality. Do not overfit to the largest apps if smaller fast-growing products better match the opportunity.