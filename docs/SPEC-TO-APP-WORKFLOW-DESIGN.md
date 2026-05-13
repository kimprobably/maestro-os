# Spec-to-App Workflow Design

Status: draft v0.1 for Phase 2.

## Source Pattern

The Fabro Clone Substack example is the target quality bar for application generation workflows: https://docs.fabro.sh/examples/clone-substack. The useful pattern is:

- Bootstrap and spec expansion before planning.
- Parallel planning fanout.
- Consolidated implementation plan.
- One bounded implementation loop.
- Deterministic verify chain.
- Fidelity review mapped to acceptance criteria.
- Parallel review fanout.
- Consensus review.
- Postmortem-driven repair that preserves working code.

## Maestro Adaptation

Maestro now has two seed workflows for this pattern:

- `workflows/scaffold/spec-lift-workflow.fabro`: turns an idea into a completed spec with Spec Kitty-style package metadata, deterministic spec validation, product review, engineering review, quality review, and human approval.
- `workflows/code/spec-to-application.fabro`: turns an approved spec into an application with Qlty, native gates, browser/artifact checks, fidelity review, reviewer fanout, and postmortem repair.

## Rules

- No application build starts until `maestro verify spec-quality` passes.
- Application workflows need Qlty plus native gates.
- UI apps need browser evidence and artifact checks.
- Review agents produce findings; fix loops own edits.
- Rig is only an app framework candidate for generated Rust AI apps. It is not the Fabro runtime.
- Durable memory writes go through approved summary stages.
- Quality gates must route explicitly: success edges use `condition="outcome=succeeded"` and repair edges are the unconditional fallback.
- `goal_gate=true` marks final success requirements; it does not replace explicit pass/fail routing.
- Generated workflows must use real Fabro handlers (`prompt` nodes and `script` nodes), not inert pseudo attributes that happen to parse as DOT.
- Generated workflows must not depend on files unless a previous stage writes those files or they are checked in.
