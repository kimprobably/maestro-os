## Parent workflow context
Goal: Create staged WakeTask product-iteration workflows, then run the UX Studio implementation workflow through Railway Fabro with durable evidence and postmortem learning


## Current sub-workflow
Goal: Validate WakeTask staged workflow definitions before any product implementation run starts

## Completed stages
- **validate_workflow_contract**: failed
  - Script: `mkdir -p .workflow/waketask-product-iteration; node --test scripts/iphone-app-factory/test-waketask-product-iteration-workflows.mjs && node --test scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs && node -e "const fs=require('fs'); const report={ok:true, artifact:'.workflow/waketask-product-iteration/workflow-preflight.json', gate:'workflow-contract', next_action:'product-spec-child', failure_classification:'none'}; fs.writeFileSync(report.artifact, JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report));"`
  - Output:
    ```
    Could not find 'scripts/iphone-app-factory/test-waketask-product-iteration-workflows.mjs'
    ```

## Context
- failure_class: deterministic
- failure_signature: validate_workflow_contract|deterministic|script failed with exit code: <n> ## output could not find 'scripts/iphone-app-factory/test-waketask-product-iteration-workflows.mjs'


Read `.workflow/waketask-product-iteration/workflow-preflight.json`. Respond with JSON only: {"context_updates":{"contract.artifact":".workflow/waketask-product-iteration/workflow-preflight.json","contract.gate":"workflow-contract","contract.next_action":"product-spec-child","contract.failure_classification":"none"}}