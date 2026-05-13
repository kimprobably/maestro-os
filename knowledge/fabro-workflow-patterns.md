# Fabro Workflow Patterns

Status: captured from Fabro docs on 2026-05-13.

Sources:

- https://docs.fabro.sh/tutorials/hello-world
- https://docs.fabro.sh/tutorials/parallel-review
- https://docs.fabro.sh/tutorials/multi-model
- https://docs.fabro.sh/tutorials/ensemble
- https://docs.fabro.sh/tutorials/sub-workflow
- https://docs.fabro.sh/examples/clone-substack
- https://docs.fabro.sh/examples/solitaire

## Node Roles

- `shape=tab`: one-shot prompt node. Use for summarization,
  classification, synthesis, and cheap review where no tools are needed.
- Default box agent: multi-turn agent with tools. Use when file I/O, shell
  commands, edits, or autonomous iteration are required.
- `shape=parallelogram`: deterministic script/command stage. Use for
  validators, registry writes, CI commands, smoke checks, and API probes.
- `shape=hexagon`: human approval gate. Use before irreversible actions.

## Fanout And Review

Use `shape=component` for fanout and `shape=tripleoctagon` for fan-in.
Branches get isolated context, then the merge node collects results for a
downstream synthesis or consensus node.

Maestro standard reviewer fanout:

- spec: product, engineering, quality, security when relevant;
- architecture: architecture, ADR, dependency/migration when relevant;
- code: correctness, tests, security, simplification;
- release: CI/CD, artifact, deployment, final fidelity.

Use `join_policy="wait_all"` for quality gates. Use `first_success` only for
search/research fallback where any valid answer can unblock progress.

## Model Routing

Use `model_stylesheet` as the workflow-level routing surface:

- universal `*` for cheap default model;
- class selectors such as `.coding`, `.review`, `.verify`, `.hard`;
- ID selectors for exceptional nodes;
- explicit `provider` when routing through OpenRouter or non-default providers.

Maestro defaults:

- cheap classification/spec hygiene: OpenRouter Haiku-class model;
- coding and file edits: Claude CLI or a high-capability coding model;
- review/consensus: independent high-capability model;
- verifier nodes: deterministic scripts first, LLM only for semantic checks.

## Ensemble

Use provider/model ensembles when the decision is expensive to get wrong:

- architecture decision;
- implementation plan debate;
- final release/fidelity review;
- ambiguous spec interpretation.

Pattern: fan out to independent models, merge, then synthesize with a stronger
or more trusted model. The synthesis must cite disagreements and choose a
concrete path.

## Sub-Workflows

Use sub-workflows for reusable loops with their own local definition of done:

- spec-lift;
- implement-test-fix;
- review-consensus;
- deployment smoke;
- memory compaction.

The parent workflow should own user-facing approvals and global state. The child
workflow should own a bounded task, files, and local repair loop.

## Clone Substack Pattern

Use this as the standard for non-trivial app generation:

1. Bootstrap and self-heal.
2. Load spec and definition of done.
3. Independent plan fanout.
4. Debate/consensus plan.
5. Implementation.
6. Multi-stage verification chain.
7. Fidelity review.
8. Parallel reviewer fanout.
9. Consensus gate.
10. Postmortem repair loop back to planning or implementation.

## Solitaire Pattern

Use this when building from a vague or high-level goal:

1. Expand goal into spec.
2. Implement in layers.
3. Verify after each layer.
4. Retry the layer that failed.
5. Run final `goal_gate=true` review.

This maps directly to Maestro's vague-goal factory workflow: vague goal to
Spec Kitty spec, architecture, packages, implementation, simplification, CI,
and release handoff.

## Generic Phased App Build

Use `workflows/code/phased-application-build.fabro` when the goal is to build an
app or demo from a vague goal without running the heavier full factory workflow.
It generalizes the Solitaire example into four reusable phases:

1. `foundation`: manifest, scaffold, scripts, dependency setup.
2. `core`: domain logic, state model, business rules, focused tests.
3. `interface`: UI, CLI, API, library surface, or workflow entrypoint.
4. `integration`: end-to-end wiring, docs, hardening, release evidence.

Every phase follows `implement -> independent verify -> deterministic gate`.
The deterministic phase gate requires:

- verifier report with `VERDICT: APPROVED`;
- phase evidence under `.workflow/phased/evidence/`;
- at least one recognized app manifest;
- native checks for detected package ecosystems.

Use the local TOML for fast trusted iteration:

```bash
fabro run workflows/code/phased-application-build.toml
```

Use the Daytona TOML once cloud sandbox credentials and GitHub cloning are
ready:

```bash
fabro run workflows/code/phased-application-build.daytona.toml
```

The final review uses a reviewer fanout rather than a single reviewer:
correctness, tests, security, and simplification. The final gate blocks release
handoff unless the consensus report is approved.
