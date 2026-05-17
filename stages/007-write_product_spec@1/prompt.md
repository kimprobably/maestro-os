## Parent workflow context
Goal: Create staged WakeTask product-iteration workflows, then run the UX Studio implementation workflow through Railway Fabro with durable evidence and postmortem learning

## Completed stages
- **workflow_definition_preflight**: succeeded


## Current sub-workflow
Goal: Write the WakeTask product feature spec before implementation starts


Write `.workflow/waketask-product-iteration/product-spec.md` and `.workflow/waketask-product-iteration/product-spec.json`. This is for WakeTask, a task-based alarm app. Required direction: Apple Clock-like familiarity without literal copying, obvious mission/task selection, real missions wired to dismiss, loud sounds/ramping/randomized options, funny visual viral tasks, completion/reward/share moments, and future accountability friend flow as backlog. Required spec sections: Source List, Target User, Product Thesis, Feature Pack, Screen Requirements, Mission Engine Requirements, Sound Requirements, Completion And Sharing, Non-Goals, Acceptance Criteria, Risks, No Secrets. JSON must include keys `screens`, `missions`, `acceptance_criteria`, `non_goals`, and `next_action`. Treat Mobbin/competitor material as private reference principles only. Do not output secrets. End your response with JSON only containing context_updates for contract.artifact, contract.gate, contract.next_action, contract.failure_classification, and waketask.product_spec.