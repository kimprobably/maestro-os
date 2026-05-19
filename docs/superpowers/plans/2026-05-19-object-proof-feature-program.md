# Object Proof Feature Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Fabro workflow that runs WakeTask's Object Proof mission pack as three sequential implementation slices with evals, validation evidence, and cumulative learnings.

**Architecture:** Add a WakeTask-specific parent Fabro workflow that owns stage order and calls child workflows for preflight, program spec, each implementation slice, each learning pass, and final publish/postmortem. Use existing `run-codex-prompt.mjs`, checkout, publish, and iPhone app gates where possible, while adding small deterministic gates for Object Proof stage artifacts.

**Tech Stack:** Fabro workflow DOT, Node.js gate scripts, Codex CLI through `run-codex-prompt.mjs`, GitHub/WakeTask iOS repo, Daytona, Railway Fabro.

---

## File Map

- Create `workflows/iphone-app-factory/waketask-object-proof-program.fabro`: parent orchestration graph.
- Create `workflows/iphone-app-factory/waketask-object-proof-program.railway.toml`: WakeTask run config for Railway-hosted Fabro.
- Create child workflows under `workflows/iphone-app-factory/object-proof-*.fabro`: preflight, program spec, three implementation slices, three learning passes, final publish/postmortem.
- Create prompts under `prompts/iphone-app-factory/object-proof-*.md`: program spec, stage implementation, learning synthesis, final postmortem.
- Create gates under `scripts/iphone-app-factory/object-proof-*.mjs`: workflow preflight, program spec gate, stage gate, learning gate, final gate.
- Create `scripts/iphone-app-factory/test-object-proof-program-workflow-contract.mjs`: deterministic workflow contract test.
- Update `docs/IPHONE-APP-OBJECT-PROOF-PROGRAM-WORKFLOW.md`: operator runbook.

## Tasks

### Task 1: Workflow Contract And Preflight

- [ ] Add a preflight script that verifies Railway Fabro URL, required files, context paths, no local Fabro URL, and credential presence by key name only.
- [ ] Add a child workflow that runs the preflight and checks out `https://github.com/kimprobably/waketask-ios.git` into `apps/waketask-ios`.
- [ ] Add a contract test that proves the parent and preflight child exist and do not contain localhost URLs.

### Task 2: Program Spec Stage

- [ ] Add a program spec prompt that writes `.workflow/object-proof-program/program-spec.md` and `.workflow/object-proof-program/program-spec.json`.
- [ ] Add a spec gate requiring barcode, preset Vision, same-object, stage order, acceptance criteria, eval requirements, and no secrets.
- [ ] Add a child workflow for spec writing and validation.

### Task 3: Stage Implementation Children

- [ ] Add one implementation prompt shared by all stages. The prompt must render stage variables from environment-backed inputs and require stage spec, eval plan, implementation evidence, validation report, and stage postmortem artifacts.
- [ ] Add child workflows for `barcode`, `preset_vision`, and `same_object`, each setting its own stage id, goal, and required capabilities before invoking Codex.
- [ ] Add a stage gate requiring the stage artifacts and capability coverage for every stage-specific capability.

### Task 4: Learning Children

- [ ] Add one learning prompt shared by all stages. It must read the stage artifacts and cumulative learnings.
- [ ] Add child workflows for barcode, preset Vision, and same-object learning.
- [ ] Add a learning gate requiring `learnings/<stage>-learnings.json` and `learnings/cumulative-learnings.json`.

### Task 5: Final Publish And Postmortem

- [ ] Add a final postmortem prompt requiring what worked, what failed, manual vs Fabro execution, workflow changes, product backlog, reusable learnings, and next operator action.
- [ ] Add a final gate requiring all three stage learnings and publish evidence.
- [ ] Add a child workflow that publishes the WakeTask branch with `publish-existing-app-branch.mjs`, writes final postmortem, and gates it.

### Task 6: Validation

- [ ] Run `node --test scripts/iphone-app-factory/test-object-proof-program-workflow-contract.mjs`.
- [ ] Run `fabro validate workflows/iphone-app-factory/waketask-object-proof-program.fabro --no-upgrade-check`.
- [ ] Run `fabro preflight workflows/iphone-app-factory/waketask-object-proof-program.railway.toml --server https://fabro-maestro-production.up.railway.app/api/v1 --no-upgrade-check`.
- [ ] Keep unrelated Hermes changes unstaged.

## Self-Review

- Spec coverage: parent/child workflows, per-stage evals, learning propagation, Railway Fabro, and final postmortem are represented.
- Placeholder scan: no TODO/TBD placeholders.
- Scope: this plan builds the workflow, not the app feature itself. The workflow will drive the app implementation run.
