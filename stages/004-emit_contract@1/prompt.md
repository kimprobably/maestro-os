## Parent workflow context
Goal: Implement WakeTask's Object Proof mission pack as three staged feature slices with evals, learnings, and final postmortem


## Current sub-workflow
Goal: Validate WakeTask Object Proof workflow contracts, Railway Fabro reachability, context artifacts, and app checkout

## Completed stages
- **validate_object_proof_workflow**: succeeded
  - Script: `mkdir -p .workflow/object-proof-program/preflight; { node --test scripts/iphone-app-factory/test-object-proof-program-workflow-contract.mjs && node scripts/iphone-app-factory/object-proof-program-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --context-paths "$OBJECT_PROOF_CONTEXT_PATHS" && node scripts/iphone-app-factory/checkout-existing-app.mjs --out .workflow/object-proof-program/preflight/checkout-existing-app.json; } > .workflow/object-proof-program/preflight/workflow-preflight.log 2>&1`
  - Output: (empty)


Read `.workflow/object-proof-program/preflight/workflow-preflight.json` and `.workflow/object-proof-program/preflight/checkout-existing-app.json`. Respond with JSON only: {"context_updates":{"contract.artifact":".workflow/object-proof-program/preflight/workflow-preflight.json","contract.gate":"object-proof-program-preflight","contract.next_action":"program-spec-child","contract.failure_classification":"none"}}