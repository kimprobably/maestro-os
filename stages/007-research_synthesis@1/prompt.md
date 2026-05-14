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
      "promptfoo_stdout_excerpt": "           │               │               │               │ Prompt Suite  │\n│               │               │               │               │               │               │               │ ## Overall    │\n│               │               │               │               │               │               │               │ Assessment:   │\n│               │               │               │               │               │               │               │ **STRONG BUT  │\n│               │               │               │               │               │               │               │ WITH CRITICAL │\n│               │               │               │               │               │               │               │ GAPS** ⚠️     │\n│               │               │               │               │               │               │               │ **Score:      │\n│               │               │               │               │               │               │               │ 7.2/10** for  │\n│               │               │               │               │               │               │               │ overnight     │\n│               │               │               │               │               │               │               │ agentic       │\n│               │               │               │               │               │               │               │ generation    │\n│               │               │               │               │               │               │               │ The suite     │\n│               │               │               │               │               │               │               │ demonstrates  │\n│               │               │               │               │               │               │               │ sophisticated │\n│               │               │               │               │               │               │               │ multi-stage   │\n│               │               │               │               │               │               │               │ orchestration │\n│               │               │               │               │               │               │               │ and strong    │\n│               │               │               │               │               │               │               │ guardrails,   │\n│               │               │               │               │               │               │               │ b...          │\n└───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘\n✓ Eval complete (ID: eval-LG0-2026-05-14T06:22:04)\n\n» View results: promptfoo view\n» Share with your team: https://promptfoo.app\n» Feedback: https://promptfoo.dev/feedback\n\nTotal Tokens: 5,842\n  Eval: 4,735 (4,035 prompt, 700 completion)\n  Grading: 1,107 (931 prompt, 176 completion)\n\nResults:\n  0 passed (0%)\n  ✗ 1 failed (100%)\n  0 errors (0%)\nDuration: 11s (concurrency: 1)\n\nWriting output to .workflow/iphone-app-factory/evals/promptfoo-output.json\n",
      "promptfoo_stderr_excerpt": "npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead\nnpm warn deprecated boolean@3.2.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.\nnpm warn deprecated prebuild-install@7.1.3: No longer maintained. Please contact the author of the relevant native addon; alternatives are available.\n",
      "fallback_used": true,
      "fallback_ok": true,
      "fallback_failures": []
    }
    ```
- **research_fanout**: partially_succeeded
- **research_join**: succeeded

## Context
- parallel.branch_count: 4
- parallel.fan_in.best_head_sha: 6080e13520384263527aa745d0b75c12f9b0fd62
- parallel.fan_in.best_id: competitor_research
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"app_store_research","status":"failed","head_sha":"8eb93dddca3e7eca353e348e609143e366f7e154"},{"id":"reddit_research","status":"failed","head_sha":"d7fc6183bd79f13ac7d45a46738797d3300b25a9"},{"id":"competitor_research","status":"succeeded","head_sha":"6080e13520384263527aa745d0b75c12f9b0fd62"},{"id":"design_pattern_research","status":"failed","head_sha":"bcfe35976636f7958dd31405a0d7e0a9655d9ff4"}]


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
