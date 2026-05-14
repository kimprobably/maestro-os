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
      "promptfoo_stdout_excerpt": "           │               │               │               │ Prompt Suite  │\n│               │               │               │               │               │               │               │ ## Overall    │\n│               │               │               │               │               │               │               │ Assessment:   │\n│               │               │               │               │               │               │               │ **STRONG BUT  │\n│               │               │               │               │               │               │               │ WITH CRITICAL │\n│               │               │               │               │               │               │               │ GAPS**        │\n│               │               │               │               │               │               │               │ (7.2/10)      │\n│               │               │               │               │               │               │               │ This is a     │\n│               │               │               │               │               │               │               │ well-archite… │\n│               │               │               │               │               │               │               │ prompt suite  │\n│               │               │               │               │               │               │               │ with          │\n│               │               │               │               │               │               │               │ excellent     │\n│               │               │               │               │               │               │               │ structural    │\n│               │               │               │               │               │               │               │ discipline,   │\n│               │               │               │               │               │               │               │ but it has    │\n│               │               │               │               │               │               │               │ **three       │\n│               │               │               │               │               │               │               │ blocking      │\n│               │               │               │               │               │               │               │ vulnerabilit… │\n│               │               │               │               │               │               │               │ for overn...  │\n└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘\n✓ Eval complete (ID: eval-W7Z-2026-05-14T08:27:39)\n\n» View results: promptfoo view\n» Share with your team: https://promptfoo.app\n» Feedback: https://promptfoo.dev/feedback\n\nTotal Tokens: 5,868\n  Eval: 4,755 (4,055 prompt, 700 completion)\n  Grading: 1,113 (931 prompt, 182 completion)\n\nResults:\n  0 passed (0%)\n  ✗ 1 failed (100%)\n  0 errors (0%)\nDuration: 11s (concurrency: 1)\n\nWriting output to .workflow/iphone-app-factory/evals/promptfoo-output.json\n",
      "promptfoo_stderr_excerpt": "npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead\nnpm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.\nnpm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.\n",
      "fallback_used": true,
      "fallback_ok": true,
      "fallback_failures": []
    }
    ```
- **research_fanout**: succeeded
- **research_join**: succeeded

## Context
- parallel.branch_count: 4
- parallel.fan_in.best_head_sha: 6e4061a82c57bd1e43f9997f046f5e524fd3e010
- parallel.fan_in.best_id: app_store_research
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"app_store_research","status":"succeeded","head_sha":"6e4061a82c57bd1e43f9997f046f5e524fd3e010"},{"id":"reddit_research","status":"succeeded","head_sha":"10a8051b882bf80a8f0e2815f3c8fcda7372b4d3"},{"id":"competitor_research","status":"succeeded","head_sha":"5cf994657319edd20d98f70900660e77b33dce3f"},{"id":"design_pattern_research","status":"succeeded","head_sha":"5929bbb322587bd13eee0faf6193312149e79668"}]


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
