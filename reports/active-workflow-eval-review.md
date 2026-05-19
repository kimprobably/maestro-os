# Active Workflow Eval Review

## Coverage

- Active groups covered: 5
- Active workflows scanned: 28
- Wrapper model calls covered: 50
- Native Fabro prompt nodes tracked: 78
- Child workflow evals registered: 22
- Parent or standalone outcome surfaces registered: 6

## Useful Signals

- Factory dashboard status: attention_required
- Blocking eval evidence missing: 88
- Eval index issues: 0
- Owner actions: Missing blocking eval evidence (88) -> Assign Quincy to connect normalized result emission for these evals and rerun npm run eval:index.; Unknown Fabro run status (1) -> Assign Quincy to refresh the run projection and classify unknown runs as completed, failed, active, or intentionally ignored.

## Weak Evals To Strengthen

- Artifact-existence evals that need semantic rubrics: wrapper call evals currently prove command success and usable final artifacts before they prove domain quality.
- Native prompt nodes that need runtime collection: workflows/iphone-app-factory/build-iphone-app.fabro (39); workflows/iphone-app-factory/build-iphone-app.cli.fabro (39)

## Next Actions

1. Implement Fabro native prompt evidence collector.
2. Add semantic promptfoo rubrics for the highest-volume workflow stages.
3. Tune dashboard owner actions after one real PR and one real Fabro run.
