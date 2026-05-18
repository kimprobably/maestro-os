# Maestro Spec And Planning

Use this skill when Tim asks Hermes to plan, specify, break down, or coordinate software work.

## Boundary

Hermes may inspect, specify, plan, decompose, and review code work.

Hermes should not directly edit application code from Slack by default. Actual codebase edits should run through Fabro workflows or an explicitly approved Fabro/Daytona worker lane.

## Default Code Work Loop

1. Clarify the objective and risk level.
2. Inspect GitHub/code context with native GitHub skills if credentials are available.
3. Produce a concrete spec or implementation plan.
4. Convert stable work into one of:
   - a Fabro workflow run,
   - a Fabro workflow improvement,
   - Linear issues for human-visible task tracking,
   - Hermes Kanban cards for agent-internal delegation.
5. Ask Tim before starting any code-mutating run unless there is an existing approved workflow gate.
6. Babysit Fabro using `fabro-babysitter`.
7. Verify with review/test/gate evidence before calling work complete.

## Superpowers Doctrine

Apply the relevant Superpowers habits when planning:

- Brainstorm before changing behavior.
- Write plans before implementation.
- Use TDD for bug fixes and new behavior.
- Use systematic debugging before proposing fixes.
- Request/perform review before completion.
- Verify with fresh evidence before claiming work is done.

If writing a plan, make it executable by another agent: exact files, exact commands, expected outputs, test steps, review checkpoints, and no placeholders.

## Planning Context Registry

Use `/app/scripts/operator-ledger/plan-registry.mjs` when Tim asks what plans, specs, or parked ideas exist, or when a new working plan/spec should be made retrievable later.

- Planning source files live under `/app/docs/operator`.
- `node /app/scripts/operator-ledger/plan-registry.mjs context --root /app --home "$HERMES_HOME" --domain hermes` returns indexed planning context.
- `node /app/scripts/operator-ledger/plan-registry.mjs index --root /app --home "$HERMES_HOME"` refreshes the operator-ledger index after files change.
- Treat registry entries as planning context, not committed decisions or ADRs.
- Park broad product architecture conversations there when they should remain visible but not implemented now.

## Spec Kitty Doctrine

Use Spec Kitty concepts when the work needs formal mission structure:

- `software-dev` for code-producing work.
- `research` for evidence gathering.
- `plan` for architecture/roadmap planning without code.
- `documentation` for documentation work.

For external automation, use Spec Kitty orchestrator-api concepts rather than directly mutating state files.

## Fabro Handoff Standard

Before handing implementation to Fabro, provide:

- objective
- repo and branch context
- inputs and constraints
- files/modules likely affected
- required tests/gates
- review requirements
- approval gates
- rollback or stop conditions
- expected artifacts

After Fabro starts, treat Fabro as eventually consistent and use the run ledger.
