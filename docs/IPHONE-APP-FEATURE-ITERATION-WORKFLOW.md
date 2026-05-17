# iPhone App Feature Iteration Workflow

The existing-app feature workflow implements product behavior in an app that already exists. It is not a new-app factory and not a visual-only UX pass.

Use it when the goal is to add or improve real product features while preserving the app's foundation: auth, payments, storage, networking, bundle ID, release setup, and existing CI.

## Workflow Shape

Parent workflow:

- `workflows/iphone-app-factory/iterate-existing-app-features.fabro`

Child workflows:

- `feature-workflow-preflight-stage.fabro`
- `feature-context-intake-stage.fabro`
- `feature-research-stage.fabro`
- `feature-existing-app-audit-stage.fabro`
- `feature-spec-stage.fabro`
- `feature-implementation-plan-stage.fabro`
- `feature-implementation-stage.fabro`
- `feature-validation-stage.fabro`
- `feature-publish-postmortem-stage.fabro`

The app-specific material comes from the run config and context paths. The reusable graph should not hardcode WakeTask, alarm clocks, or any other app.

## Required Artifacts

Feature runs write artifacts under `.workflow/existing-app-feature/`:

- `context-intake.md`
- `context/context-pack.json`
- `research/research-synthesis.md`
- `research/research-pack.json`
- `audit/existing-app-audit.md`
- `audit/existing-app-audit.json`
- `spec/feature-spec.md`
- `spec/feature-spec.json`
- `implementation/implementation-plan.md`
- `implementation/implementation-plan.json`
- `implementation/implementation-evidence.md`
- `implementation/implementation-evidence.json`
- `validation/validation-review.md`
- `validation/validation-review.json`
- `postmortem.md`

## Gates

The feature workflow uses deterministic gates so a run cannot succeed from a polished but unwired UI pass:

- `feature-context-gate.mjs`
- `feature-research-gate.mjs`
- `existing-app-audit-gate.mjs`
- `feature-spec-gate.mjs`
- `feature-implementation-plan-gate.mjs`
- `feature-implementation-coverage-gate.mjs`
- `empty-action-gate.mjs`
- `ci-trigger-gate.mjs`
- `feature-postmortem-gate.mjs`

## WakeTask Rehearsal

WakeTask is the first context pack:

- `contexts/iphone-app-factory/waketask/feature-context.md`
- `contexts/iphone-app-factory/waketask/feature-pack.json`
- `workflows/iphone-app-factory/iterate-existing-app-features.waketask.railway.toml`

Launch against Railway Fabro:

```bash
fabro run workflows/iphone-app-factory/iterate-existing-app-features.waketask.railway.toml \
  --server https://fabro-maestro-production.up.railway.app/api/v1 \
  --no-upgrade-check
```

Then hand the run to Hermes babysitting and require a final postmortem before considering the run complete.
