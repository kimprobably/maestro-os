## Parent workflow context
Goal: Create staged WakeTask product-iteration workflows, then run the UX Studio implementation workflow through Railway Fabro with durable evidence and postmortem learning

## Completed stages
- **workflow_definition_preflight**: succeeded
- **product_spec_child**: succeeded
- **ux_iteration_child**: succeeded

## Context
- parallel.branch_count: 4
- parallel.fan_in.best_id: calm_accountability_direction
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"calm_accountability_direction","status":"succeeded"},{"id":"hard_wake_direction","status":"succeeded"},{"id":"gamified_streak_direction","status":"succeeded"},{"id":"minimal_native_direction","status":"succeeded"}]


## Current sub-workflow
Goal: Validate WakeTask UX iteration evidence and capture postmortem learning

## Completed stages
- **write_validation_postmortem**: succeeded
- **validate_postmortem_contract**: failed
  - Script: `test -s .workflow/waketask-product-iteration/validation-postmortem.md && test -s .workflow/waketask-product-iteration/validation-postmortem.json && rg -q "What Worked|What Failed|Manual Versus Fabro Executed|Workflow Changes Needed|Product Backlog|Next Operator Action|No Secrets" .workflow/waketask-product-iteration/validation-postmortem.md && node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('.workflow/waketask-product-iteration/validation-postmortem.json','utf8'));"`
  - Output: (empty)

## Context
- failure_class: deterministic
- failure_signature: validate_postmortem_contract|deterministic|script failed with exit code: <n>
- parallel.branch_count: 4
- parallel.fan_in.best_id: calm_accountability_direction
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"calm_accountability_direction","status":"succeeded"},{"id":"hard_wake_direction","status":"succeeded"},{"id":"gamified_streak_direction","status":"succeeded"},{"id":"minimal_native_direction","status":"succeeded"}]


Inspect available artifacts from `.workflow/iphone-app-ux-studio/**`, `.workflow/waketask-product-iteration/**`, `reports/ios/**`, and Fabro run context. Write `.workflow/waketask-product-iteration/validation-postmortem.md` and `.workflow/waketask-product-iteration/validation-postmortem.json`. Classify blockers as infra, prompt/context, quality gate, git/metadata, app build/test, or product-spec issue. Required Markdown sections: Source List, What Worked, What Failed, Manual Versus Fabro Executed, Workflow Changes Needed, Product Backlog, Next Operator Action, No Secrets. If evidence is absent, say evidence is absent and identify the retry target. End your response with JSON only containing context_updates for contract.artifact, contract.gate, contract.next_action, contract.failure_classification, and waketask.postmortem.