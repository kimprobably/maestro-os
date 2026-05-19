## Parent workflow context
Goal: Implement WakeTask's viral completion and accountability feature pack after Object Proof missions land


## Current sub-workflow
Goal: Validate reusable existing-app feature workflow contracts and Railway execution requirements

## Completed stages
- **validate_feature_workflow**: succeeded
  - Script: `mkdir -p .workflow/existing-app-feature/preflight; { node --test scripts/iphone-app-factory/test-existing-app-feature-workflow-contract.mjs && node scripts/iphone-app-factory/feature-workflow-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --context-paths "$FEATURE_CONTEXT_PATHS" --use-mobbin-mcp "$UX_USE_MOBBIN_MCP"; } > .workflow/existing-app-feature/preflight/workflow-preflight.log 2>&1`
  - Output: (empty)


Read `.workflow/existing-app-feature/preflight/workflow-preflight.json`. Respond with JSON only: {"context_updates":{"contract.artifact":".workflow/existing-app-feature/preflight/workflow-preflight.json","contract.gate":"feature-workflow-contract","contract.next_action":"context-intake-child","contract.failure_classification":"none"}}