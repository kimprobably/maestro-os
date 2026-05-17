## Parent workflow context
Goal: Create staged WakeTask product-iteration workflows, then run the UX Studio implementation workflow through Railway Fabro with durable evidence and postmortem learning

## Completed stages
- **workflow_definition_preflight**: succeeded
- **product_spec_child**: succeeded
- **ux_iteration_child**: succeeded
- **validation_postmortem_child**: failed
- **validation_postmortem_child**: failed

## Context
- failure_class: deterministic
- failure_signature: validation_postmortem_child|deterministic|child engine error: engine error: deterministic failure cycle detected: signature validate_postmortem_contract|deterministic|script failed with exit code: <n> repeated <n> times (limit <n>)
- parallel.branch_count: 4
- parallel.fan_in.best_id: calm_accountability_direction
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"calm_accountability_direction","status":"succeeded"},{"id":"hard_wake_direction","status":"succeeded"},{"id":"gamified_streak_direction","status":"succeeded"},{"id":"minimal_native_direction","status":"succeeded"}]


## Current sub-workflow
Goal: Validate WakeTask UX iteration evidence and capture postmortem learning

## Context
- command.output: {"ok":true,"postmortem_path":".workflow/iphone-app-ux-studio/postmortem.md","out_path":".workflow/iphone-app-ux-studio/postmortem-gate.json","required_sections":[{"label":"Run Summary","slug":"run_summary"},{"label":"What Worked","slug":"what_worked"},{"label":"What Failed","slug":"what_failed"},{"label":"Where Agents Needed Steering","slug":"where_agents_needed_steering"},{"label":"Gate Effectiveness","slug":"gate_effectiveness"},{"label":"Prompt Improvements","slug":"prompt_improvements"},{"label":"Workflow Improvements","slug":"workflow_improvements"},{"label":"Design Corpus Additions","slug":"design_corpus_additions"},{"label":"Next-Run Recommendations","slug":"next_run_recommendations"}],"postmortem_present":true,"present_sections":["Run Summary","What Worked","What Failed","Where Agents Needed Steering","Gate Effectiveness","Prompt Improvements","Workflow Improvements","Design Corpus Additions","Next-Run Recommendations"],"missing_sections":[],"secret_finding_count":0,"failures":[]}

- parallel.branch_count: 4
- parallel.fan_in.best_id: calm_accountability_direction
- parallel.fan_in.best_outcome: succeeded
- parallel.results: [{"id":"calm_accountability_direction","status":"succeeded"},{"id":"hard_wake_direction","status":"succeeded"},{"id":"gamified_streak_direction","status":"succeeded"},{"id":"minimal_native_direction","status":"succeeded"}]


Inspect available artifacts from `.workflow/iphone-app-ux-studio/**`, `.workflow/waketask-product-iteration/**`, `reports/ios/**`, and Fabro run context. Write `.workflow/waketask-product-iteration/validation-postmortem.md` and `.workflow/waketask-product-iteration/validation-postmortem.json`. Classify blockers as infra, prompt/context, quality gate, git/metadata, app build/test, or product-spec issue. Required Markdown sections: Source List, What Worked, What Failed, Manual Versus Fabro Executed, Workflow Changes Needed, Product Backlog, Next Operator Action, No Secrets. If evidence is absent, say evidence is absent and identify the retry target. End your response with JSON only containing context_updates for contract.artifact, contract.gate, contract.next_action, contract.failure_classification, and waketask.postmortem.