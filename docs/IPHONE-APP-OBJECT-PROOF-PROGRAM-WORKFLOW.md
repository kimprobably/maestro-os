# WakeTask Object Proof Program Workflow

This workflow is a WakeTask-specific staged feature program for the three Object Proof missions:

1. Barcode or QR scan mission.
2. Preset local Apple Vision object-photo mission.
3. Same-object reference-photo mission.

It is intentionally sequential. Each implementation stage writes its own spec, eval plan, evidence, validation report, and postmortem. A learning child then summarizes what worked and what should carry forward before the next stage runs.

## Goal

Make WakeTask better in the hot task-alarm category by adding missions that are easy to explain in a short video, obvious in setup, and actually block alarm dismiss until proof succeeds.

The workflow should produce:

- a program spec before implementation;
- three behavior-complete implementation slices;
- per-stage eval and validation evidence;
- cumulative learnings after every slice;
- a pushed WakeTask branch;
- a final postmortem with workflow improvement backlog.

## Workflow Files

- Parent: `workflows/iphone-app-factory/waketask-object-proof-program.fabro`
- Railway run config: `workflows/iphone-app-factory/waketask-object-proof-program.railway.toml`
- Child workflows: `workflows/iphone-app-factory/object-proof-*.fabro`
- Prompts: `prompts/iphone-app-factory/object-proof-*.md`
- Gates: `scripts/iphone-app-factory/object-proof-*.mjs`
- Contract test: `scripts/iphone-app-factory/test-object-proof-program-workflow-contract.mjs`

## Stage Order

The order is fixed by design:

1. `barcode`
2. `preset_vision`
3. `same_object`

Barcode comes first because it is deterministic and provides the simplest camera-permission, mission-config, and dismiss-blocking path. Preset Vision reuses that camera and challenge structure while adding local classification. Same-object comes last because it has the most ambiguity around matching, privacy, and false negatives.

## Inputs

The Railway config starts from the existing WakeTask mission-engine branch:

- `repo_url = "https://github.com/kimprobably/waketask-ios.git"`
- `base_branch = "feature/waketask-mission-engine-20260517"`
- `run_branch = "feature/waketask-object-proof-program-20260519"`
- `app_dir = "apps/waketask-ios"`
- `context_paths = "contexts/iphone-app-factory/waketask,contexts/iphone-app-factory/waketask/screenshots"`
- `fabro_server = "https://fabro-maestro-production.up.railway.app/api/v1"`

Do not point this workflow at local Fabro for overnight runs.

## Required Environment

Do not print values. Presence-only checks are enough.

- `CODEX_AUTH_JSON_BASE64`
- `CODEX_MCP_CREDENTIALS_JSON_BASE64`
- `GITHUB_TOKEN` or `GH_TOKEN`
- `OPENROUTER_API_KEY`
- `CLAUDE_CODE_OAUTH_TOKEN` or `CLAUDE_CODE_CREDENTIALS_JSON_BASE64`
- `APIFY_TOKEN` if research stages are expanded later

## Launch

Validate first:

```bash
node --test scripts/iphone-app-factory/test-object-proof-program-workflow-contract.mjs
fabro validate workflows/iphone-app-factory/waketask-object-proof-program.fabro --no-upgrade-check
fabro preflight workflows/iphone-app-factory/waketask-object-proof-program.railway.toml --server https://fabro-maestro-production.up.railway.app/api/v1 --no-upgrade-check
```

Run on Railway Fabro:

```bash
fabro run workflows/iphone-app-factory/waketask-object-proof-program.railway.toml --server https://fabro-maestro-production.up.railway.app/api/v1 --no-upgrade-check -d
```

## Babysitting Rules

If a stage fails, inspect events and artifacts before restarting.

Classify failures as:

- `infra`: Railway, Daytona, network, CLI, or remote service outage.
- `prompt/context`: missing context, context too large, prompt output missing contract files.
- `quality gate`: deterministic object-proof gate rejected missing coverage.
- `git/metadata`: checkout, branch, commit, or push failed.
- `app build/test`: Swift build, test, simulator, Appium, or CI evidence failed.
- `product-spec`: feature definition is ambiguous or conflicts with app constraints.
- `app-platform`: iOS permission, Apple Vision, camera, notification, or alarm limitation.

Only restart a child after recording the failure classification and the intended fix in the run notes or ledger.

## Artifact Contract

Program root:

- `.workflow/object-proof-program/program-spec.md`
- `.workflow/object-proof-program/program-spec.json`
- `.workflow/object-proof-program/final-postmortem.md`
- `.workflow/object-proof-program/publish-existing-app-branch.json`
- `.workflow/object-proof-program/final-gate.json`

Per stage:

- `.workflow/object-proof-program/stages/<stage>/stage-spec.md`
- `.workflow/object-proof-program/stages/<stage>/stage-spec.json`
- `.workflow/object-proof-program/stages/<stage>/eval-plan.json`
- `.workflow/object-proof-program/stages/<stage>/implementation-evidence.md`
- `.workflow/object-proof-program/stages/<stage>/implementation-evidence.json`
- `.workflow/object-proof-program/stages/<stage>/validation-report.md`
- `.workflow/object-proof-program/stages/<stage>/validation-report.json`
- `.workflow/object-proof-program/stages/<stage>/stage-postmortem.md`
- `.workflow/object-proof-program/stages/<stage>/stage-gate.json`

Learnings:

- `.workflow/object-proof-program/learnings/<stage>-learnings.md`
- `.workflow/object-proof-program/learnings/<stage>-learnings.json`
- `.workflow/object-proof-program/learnings/<stage>-learning-gate.json`
- `.workflow/object-proof-program/learnings/cumulative-learnings.json`

## Success Criteria

- Program spec exists and names the three stages in the required order.
- Each stage changes app behavior, not only documentation.
- Each mission blocks dismiss until its proof succeeds or an explicit spec-approved fallback applies.
- Tests or strongest available validation evidence cover match and mismatch behavior.
- Final publish pushes or confirms the WakeTask app branch.
- Final postmortem states what Fabro did, what required manual steering, and what to improve next.

## Known Risks

- Hosted macOS GitHub Actions may be blocked by billing or runner limits. Record that as CI evidence and run the strongest local checks available.
- Apple Vision object labels can be fuzzy. The preset Vision stage should group labels and use thresholds with retry copy, not hard-code a single fragile label.
- Same-object matching can produce false negatives in different lighting. The final stage must document fallback policy and privacy behavior clearly.
- Camera, photo library, notifications, and alarm sound behavior need Info.plist and permission-state coverage.
