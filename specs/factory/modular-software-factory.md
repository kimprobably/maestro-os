# Modular Software Factory Spec

## Purpose

Build a **hands-off software factory** out of modular, individually
eval-gated Fabro workflows that compose into one pipeline:
spec → plan → parallel per-task implementation → review → integrate, with
deterministic gates between every stage. The factory builds the GTM Client
Lead Loop product (Specs 1–7) and is itself a v1 deliverable that is iterated
and optimized as it runs.

## Context

This is Spec 0 of the GTM Client Lead Loop plan — see
`docs/superpowers/specs/2026-05-16-gtm-client-lead-loop-design.md`. It is the
factory that builds the other six specs.

The design principle is **modularity with per-workflow evals**. A monolithic
"spec in, software out" pipeline is unprovable and unfixable. Instead the
factory is a library of small, single-purpose Fabro workflows — each with a
typed input/output contract and its own eval dataset — composed by a top-level
subworkflow. Each modular workflow is de-risked independently: it cannot be
composed into the factory until its eval passes threshold. Composition is
where Fabro earns its place — deterministic STOP/FLAG gates, fanout
parallelism across tasks, hands-off runs, and review loops via retry targets.

maestro-os already has factory pieces (`specs/factory/goal-to-production-spec.md`,
`maestro verify spec-quality`, `maestro verify workflow-quality`, the
promptfoo eval harness under `evals/`). This spec modularizes that into
eval-gated workflows rather than starting from zero.

The factory is **bootstrapped, not self-created from nothing**: the first
modular workflows cannot be built by a factory that does not yet exist. They
are built by hand / with the superpowers suite, eval-gated, and from there the
factory composes and extends itself.

## Non-Goals

- Do not build the GTM product here. Spec 0 builds the *factory*; the factory
  builds Specs 1–7.
- Do not replace the superpowers suite wholesale. Superpowers bootstraps the
  first modular workflows and remains the human-driven fallback.
- Do not build a general-purpose CI system. The factory targets the
  maestro-os repo and its conventions (Code Standards, Tenant Scope Lint,
  Qlty, the eval harness).
- Do not remove human STOP gates from outward-facing steps. Merge to a default
  branch is always behind a STOP gate.
- Do not pursue full autonomy in v0. "Hands-off" means a `factory.build` run
  proceeds without keystrokes between designed STOP gates — not zero human
  gates.

## Inputs

- A spec file (e.g. `specs/gtm/brain.md`) — the unit of work the
  factory builds.
- The repo at a known base commit / branch.
- The Engineering Charter (`specs/engineering-charter.md`) and the Coding
  Standards (`knowledge/coding-standards.md`) — the two review rubrics.

## Outputs

- A library of modular Fabro workflows under `workflows/factory/`.
- The composing workflow `workflows/factory/build.fabro`.
- An eval dataset per modular workflow under `evals/factory/<workflow>/`.
- For each `factory.build` run: an implemented, tested, reviewed change set on
  a feature branch, plus a build report under
  `.workflow/factory-build/<spec>/<run-id>/` (per-task evidence, eval scores,
  review findings, gate outcomes).
- A factory eval scoreboard — per-modular-workflow eval scores tracked over
  time as a regression ratchet.

## Modular Workflows

Each is a single-purpose Fabro workflow with a typed input/output contract and
its own eval. A modular workflow is registered into the factory only when its
eval passes threshold (see Evals).

- **`factory.plan-spec`** — input: a spec file. Output: an implementation plan
  (`docs/superpowers/plans/<date>-<spec>.md`) — goal, architecture, ordered
  work with checkbox tasks. Encodes the `writing-plans` discipline as a
  workflow.
- **`factory.decompose-plan`** — input: a plan. Output: a task graph — each
  task with its files-touched set, its dependency edges, and a "can run in
  parallel with" set. This is what makes fanout safe.
- **`factory.implement-task`** — input: one task + the repo base. Output: a
  tested code change in an **isolated Daytona sandbox**. TDD-ordered: write
  the failing test → confirm it fails → implement → confirm green. Emits a
  branch/patch + run evidence. The unit of parallelism.
- **`factory.review-change`** — input: a change/diff. Output: a structured
  review against the two rubrics — the **Engineering Charter**
  (`specs/engineering-charter.md`, the architecture-level invariants) and the
  **Coding Standards** (`knowledge/coding-standards.md`, the code-level
  rubric: the 10 principles, layering, the anti-pattern catalog, the review
  checklist). Pass/fail plus findings with severities; a violation of an
  architectural invariant is a review failure. Runs the Qlty linter, the
  Tenant Scope Lint, the Component Ownership Lint, and `maestro verify
  workflow-quality`.
- **`factory.integrate`** — input: the set of completed task changes. Output:
  the changes merged onto one feature branch, conflicts resolved, the full
  test suite run green. Ends at a STOP gate before any merge to a default
  branch.

A modular workflow may itself be invoked standalone (e.g. run
`factory.review-change` on a hand-written PR) — they are not only factory
internals.

## Deterministic Gates

Gates are Fabro STOP/FLAG nodes between stages. A failed gate STOPs the run
with a structured reason; it does not silently continue.

- **spec-quality gate** — `maestro verify spec-quality <spec>` (includes the
  placeholder guard). Blocks `factory.plan-spec`.
- **plan-quality gate** — the plan has concrete tasks, files, and a valid
  dependency graph; no placeholder tasks.
- **test-pass gate** — `factory.implement-task` output's new test fails before
  implementation and passes after; the task's scoped suite is green.
- **review-pass gate** — `factory.review-change` returns no Critical/High
  findings. Failure routes back to `factory.implement-task` (a review loop,
  bounded — see Review Loops).
- **workflow-quality gate** — for tasks that author product Fabro workflows,
  `maestro verify workflow-quality` + the Tenant Scope Lint must pass.
- **integration gate** — the full suite is green after merge; a STOP gate
  holds before merge to a default branch for human sign-off.

## Composition

`workflows/factory/build.fabro` composes the modular workflows as
subworkflows:

```
spec ──▶[spec-quality gate]──▶ factory.plan-spec
     ──▶[plan-quality gate]──▶ factory.decompose-plan
     ──▶ fanout over tasks (dependency-ordered, parallel where independent):
            factory.implement-task  ──▶[test-pass gate]
            factory.review-change   ──▶[review-pass gate]──┐
            ▲────────────── bounded review loop ───────────┘
     ──▶ factory.integrate ──▶[integration gate / STOP before merge]
     ──▶ build report
```

- **Fanout / parallelism** — independent tasks (disjoint files-touched, no
  dependency edge) run concurrently, each in its own Daytona sandbox.
  Dependent tasks wait on their predecessors.
- **Hands-off** — a `build` run proceeds without keystrokes between the
  designed STOP gates. The only mandatory human gate is before merge to a
  default branch.
- **Model routing** — the `model_stylesheet` routes per node class
  (`.planning`, `.implementation`, `.review`) so each stage uses an
  appropriate model and reasoning effort; tuning this is part of factory
  optimization.

## Review Loops

`factory.review-change` failures route back to `factory.implement-task` as a
Fabro retry target, with the review findings passed as input. The loop is
bounded (default 3 iterations); on exhaustion the run STOPs and FLAGs the task
for a human. This is the "review catches it, implementation fixes it" loop —
mechanical, bounded, evidenced.

## Evals

Evals are the discipline that makes modular composition trustworthy.

- Each modular workflow has an eval dataset under `evals/factory/<workflow>/`
  with fixtures and a promptfoo (or maestro eval-harness) config:
  - `plan-spec` — given a fixture spec, the plan covers its acceptance
    criteria and produces a valid task graph.
  - `decompose-plan` — given a fixture plan, the task graph's dependency edges
    are correct and the parallel sets are genuinely disjoint.
  - `implement-task` — given a fixture task, the output has a test that fails
    pre-implementation and passes post, with no Code-Standards violations.
  - `review-change` — given fixture diffs (known-good and known-bad, including
    seeded Code-Standards violations), the review catches the bad and passes
    the good.
  - `integrate` — given fixture branches with a known conflict, the merge
    resolves and the suite ends green.
- **Registration gate**: a modular workflow cannot be composed into
  `factory.build` until its eval passes threshold.
- **Regression ratchet**: each modular workflow's eval score is tracked over
  time; optimizing a workflow (prompt, model routing, structure) must not
  regress its eval. This is how the factory is "iterated and optimized"
  safely.

## Bootstrap And Co-Evolution

- **Bootstrap order**: `factory.implement-task` and `factory.review-change`
  are built first — by hand / with the superpowers suite — and eval-gated.
  Then `factory.plan-spec`, `factory.decompose-plan`, `factory.integrate`,
  then `factory.build` composes them.
- **Co-evolution**: the factory matures to "enough to build Spec 1," then
  builds Spec 1, then is improved, then builds Spec 2, and so on. The bias is
  toward shipping product — factory polishing never blocks the product
  critical path. Each product spec built is also a real-world eval of the
  factory; gaps found feed back as factory tasks.
- The superpowers suite remains the human-driven fallback for any spec the
  factory cannot yet handle.

## Acceptance Criteria

- Each of the five modular workflows exists under `workflows/factory/`, has a
  typed input/output contract, and has an eval under `evals/factory/<workflow>/`
  that passes threshold.
- A modular workflow whose eval is below threshold is refused composition into
  `factory.build`.
- `factory.implement-task` run on a fixture task produces a change whose new
  test fails at the base commit and passes after the change, with no
  Critical/High Code-Standards findings.
- `factory.review-change` run on a seeded known-bad diff returns the expected
  Critical/High findings; run on a known-good diff it passes.
- `factory.build` run on a small fixture spec proceeds hands-off through every
  gate and STOPs before merge to a default branch with a complete build
  report.
- The review loop: a deliberately flawed implementation is caught by
  `factory.review-change`, routed back to `factory.implement-task`, and fixed
  within the bounded retry count; loop exhaustion STOPs and FLAGs.
- Fanout: a plan with two independent tasks runs them concurrently in separate
  Daytona sandboxes; a plan with a dependency runs them in order.
- The factory eval scoreboard records a score per modular workflow and a
  regression in any score fails CI.
- `factory.build` successfully produces the implementation of at least one
  real GTM product spec (Spec 1) end to end.

## Definition Of Done

- `workflows/factory/{plan-spec,decompose-plan,implement-task,review-change,
  integrate}.fabro` and `workflows/factory/build.fabro` are checked in with
  local toml runners.
- Prompts for each LLM node under `prompts/factory/`.
- `evals/factory/<workflow>/` datasets and configs for all five modular
  workflows, wired into CI with thresholds and the regression ratchet.
- The bootstrap workflows (`implement-task`, `review-change`) are documented
  as hand-built, with their build evidence retained.
- `docs/MODULAR-SOFTWARE-FACTORY.md` documents the architecture, the modular
  contracts, the gates, how to run `factory.build`, and the
  optimization/iteration process.
- `knowledge/known-gotchas.md` updated with factory gotchas.
- `maestro verify workflow-quality` passes over every factory workflow.
- `maestro verify spec-quality specs/factory/modular-software-factory.md`
  passes.

## Risks

- **Bootstrap circularity.** The factory cannot build its own first
  workflows. Mitigation: `implement-task` and `review-change` are explicitly
  hand-built and eval-gated before composition.
- **Factory polishing crowds out product.** Mitigation: the co-evolution rule
  — mature the factory to "enough for the next spec," ship that spec, then
  improve. The product critical path is protected in the design doc build
  order.
- **Bad modular workflow composed too early.** Mitigation: the eval
  registration gate; no workflow joins `factory.build` below threshold.
- **Review loop thrash.** A flawed task could ping-pong between implement and
  review. Mitigation: bounded retry count, then STOP + human FLAG.
- **Parallel task collisions.** Two fanned-out tasks touching the same files.
  Mitigation: `factory.decompose-plan` computes files-touched sets; only
  disjoint tasks run concurrently; `factory.integrate` is the conflict
  backstop.
- **Eval drift / overfitting.** Modular evals could pass while real builds
  fail. Mitigation: every real product spec built is itself a factory eval;
  gaps feed back as factory tasks; the scoreboard tracks real-run outcomes
  alongside fixture evals.
- **Hands-off over-trust.** A hands-off run merging bad code. Mitigation: the
  mandatory STOP gate before merge to a default branch; the review-pass and
  integration gates upstream of it.

## Spec Kitty

Create a Spec Kitty mission for the factory. Work packages: the five modular
workflows, the composing `build` workflow, per-workflow eval datasets, the
gates, the review loop, fanout/sandbox parallelism, the eval scoreboard +
regression ratchet, bootstrap of the first two workflows, docs.

## ADR

No ADR required for v0. A future ADR is required before the factory is trusted
to merge without a human gate, covering:

- The autonomy boundary — which steps may ever proceed without a STOP gate.
- The model-routing and cost policy for `factory.build` runs.
- How factory workflows are versioned and rolled back.
- Whether the factory is exposed beyond the maestro-os repo.
