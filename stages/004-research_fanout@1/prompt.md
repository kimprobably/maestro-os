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
      "promptfoo_stdout_excerpt": "           │               │               │               │ Assessment:   │\n│               │               │               │               │               │               │               │ **STRONG BUT  │\n│               │               │               │               │               │               │               │ WITH CRITICAL │\n│               │               │               │               │               │               │               │ GAPS**        │\n│               │               │               │               │               │               │               │ (7.2/10)      │\n│               │               │               │               │               │               │               │ This is a     │\n│               │               │               │               │               │               │               │ well-archite… │\n│               │               │               │               │               │               │               │ prompt suite  │\n│               │               │               │               │               │               │               │ with          │\n│               │               │               │               │               │               │               │ excellent     │\n│               │               │               │               │               │               │               │ stage         │\n│               │               │               │               │               │               │               │ separation    │\n│               │               │               │               │               │               │               │ and quality   │\n│               │               │               │               │               │               │               │ gates.        │\n│               │               │               │               │               │               │               │ However, it   │\n│               │               │               │               │               │               │               │ has **3       │\n│               │               │               │               │               │               │               │ blocking      │\n│               │               │               │               │               │               │               │ issues** for  │\n│               │               │               │               │               │               │               │ ...           │\n└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘\n✓ Eval complete (ID: eval-hLN-2026-05-14T06:14:18)\n\n» View results: promptfoo view\n» Share with your team: https://promptfoo.app\n» Feedback: https://promptfoo.dev/feedback\n\nTotal Tokens: 5,765\n  Eval: 4,673 (3,973 prompt, 700 completion)\n  Grading: 1,092 (932 prompt, 160 completion)\n\nResults:\n  0 passed (0%)\n  ✗ 1 failed (100%)\n  0 errors (0%)\nDuration: 11s (concurrency: 1)\n\nWriting output to .workflow/iphone-app-factory/evals/promptfoo-output.json\n",
      "promptfoo_stderr_excerpt": "npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead\nnpm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.\nnpm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.\n",
      "fallback_used": true,
      "fallback_ok": true,
      "fallback_failures": []
    }
    ```


# App Store Review Research

Read `.workflow/iphone-app-factory/context.md` and `quality-bar.json`.

Research iPhone apps related to `alarm clock apps that require a task or engagement before dismissal, such as puzzles, movement, scanning, commitment stakes, or accountability` for `US iPhone users who oversleep, snooze repeatedly, or need high-friction wake-up accountability`.

Use the existing Consumer Radar/App Store reviews tooling if available. Prefer live Apify/App Store data when credentials are present. If live scraping is unavailable, mark the limitation explicitly and do not invent review quotes.

Write `.workflow/iphone-app-factory/research/app-store.md` with:

- candidate apps and App Store links
- why each app is relevant
- recent review themes, complaints, feature requests, and delight moments
- what appears fast-growing versus merely large
- evidence quality: `live`, `partial`, or `limited`
- concrete product opportunities for our app

Do not write implementation code.