## Parent workflow context
Goal: Create staged WakeTask product-iteration workflows, then run the UX Studio implementation workflow through Railway Fabro with durable evidence and postmortem learning


## Current sub-workflow
Goal: Validate WakeTask staged workflow definitions before any product implementation run starts

## Completed stages
- **validate_workflow_contract**: succeeded
  - Script: `mkdir -p .workflow/waketask-product-iteration; node --test scripts/iphone-app-factory/test-waketask-product-iteration-workflows.mjs && node --test scripts/iphone-app-factory/test-ux-studio-workflow-contract.mjs && node -e "const fs=require('fs'); const report={ok:true, artifact:'.workflow/waketask-product-iteration/workflow-preflight.json', gate:'workflow-contract', next_action:'product-spec-child', failure_classification:'none'}; fs.writeFileSync(report.artifact, JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify(report));"`
  - Output:
    ```
    (74 lines omitted)
      duration_ms: 0.19595
      type: 'test'
      ...
    # Subtest: UX studio prompt files exist
    ok 9 - UX studio prompt files exist
      ---
      duration_ms: 0.282219
      type: 'test'
      ...
    # Subtest: UX studio script files exist
    ok 10 - UX studio script files exist
      ---
      duration_ms: 0.28989
      type: 'test'
      ...
    1..10
    # tests 10
    # suites 0
    # pass 10
    # fail 0
    # cancelled 0
    # skipped 0
    # todo 0
    # duration_ms 62.375421
    {"ok":true,"artifact":".workflow/waketask-product-iteration/workflow-preflight.json","gate":"workflow-contract","next_action":"product-spec-child","failure_classification":"none"}
    ```


Read `.workflow/waketask-product-iteration/workflow-preflight.json`. Respond with JSON only: {"context_updates":{"contract.artifact":".workflow/waketask-product-iteration/workflow-preflight.json","contract.gate":"workflow-contract","contract.next_action":"product-spec-child","contract.failure_classification":"none"}}