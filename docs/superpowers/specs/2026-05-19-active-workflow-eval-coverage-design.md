# Active Workflow Eval Coverage Design

## Goal

Strap eval coverage onto every Fabro workflow the factory is actively using so evals behave like tests: every model call has evidence, every small workflow has a quality gate, every parent workflow has an outcome gate, and the factory owner dashboard shows only the rollup signals that need attention.

## Context

The current eval operating system has useful primitives but incomplete coverage. `run-codex-prompt.mjs` can already emit call-level eval artifacts when workflows pass `--eval-id`, and the factory dashboard can already read normalized eval results. The gap is that active Fabro workflows are not all registered, not all model calls are wired to eval IDs, and native Fabro `prompt="@..."` model nodes are invisible to the existing static coverage checker.

Fabro run history shows the first active scope should be production-ish workflows, not every historical smoke or spike workflow:

- WakeTask object-proof program.
- iPhone app build factory, including CLI variants.
- Existing app feature iteration.
- WakeTask product and UX iteration.
- Hermes agent creation.

One-off probes, smoke workflows, and research spikes stay outside active coverage unless they become recurring factory workflows.

## Design

Add an active workflow coverage layer on top of the existing eval registry.

The layer has three committed surfaces:

1. `evals/active-workflows.yaml` declares which Fabro workflows are actively owned by the factory, which parent workflow group they belong to, and whether each workflow has wrapper-call, native-prompt, child-workflow, or outcome coverage requirements.
2. `evals/registry.yaml` remains the source of truth for individual eval IDs, their level, owner, subject paths, artifact patterns, and waiver policy.
3. `reports/evals/factory-health/*.json` stores deterministic coverage results so the existing eval index and factory dashboard can roll the signal up.

This keeps scope explicit. A workflow is not required to be perfect because it exists in the repo; it is required to be covered because it is declared active.

## Eval Levels

Call-level evals cover individual model calls. For `run-codex-prompt.mjs` calls, the workflow command must pass `--eval-id`, and the registry must contain a matching `level: call` entry with the workflow path and node identity. The existing call artifact evaluator remains the first deterministic gate: command success, usable last message, and artifact presence.

Workflow-level evals cover small child workflows or bounded stage workflows. Each active child workflow must have a `level: workflow` registry entry and either deterministic coverage evidence or a promptfoo/rubric result.

Product or parent outcome evals cover the end-to-end factory run. Each active parent workflow needs a `level: workflow` or `level: product` eval that checks whether the overall run produced the expected handoff, artifacts, validation evidence, and postmortem.

Meta-evals cover the eval system itself. The active coverage checker should write a blocking deterministic eval result so missing eval coverage appears in the same dashboard as product quality problems.

## Native Fabro Prompt Nodes

The iPhone app build workflows include native Fabro `prompt="@..."` nodes instead of the `run-codex-prompt.mjs` wrapper. These are real model calls and must not be hidden from the eval system.

The first pass should handle them in two steps:

1. Static coverage marks every native prompt node in an active workflow and requires either a registry-backed eval ID or an explicit `native_prompt_collection_required` entry in `evals/active-workflows.yaml`.
2. A Fabro run evidence collector reads run projections from Fabro, extracts stage prompt/response/provider evidence for native prompt nodes, normalizes it into eval result JSON, and writes it under `reports/evals/<fabro-run-id>/`.

Until the collector is implemented for a workflow, native prompt nodes are visible as attention items rather than silently passing.

## Active Workflow Scope

WakeTask object-proof is highest priority because it is actively running and already emits several `iphone-object-proof.*.call` eval IDs. The first implementation should add those IDs to the registry and require workflow/outcome evals for the parent and each object-proof child stage.

Existing app feature iteration is next because recent runs failed and several `run-codex-prompt.mjs` calls lack `--eval-id`. The first implementation should wire eval IDs for context intake, app audit, research, spec, implementation plan, implementation, validation, and postmortem stages.

The iPhone app build factory is next because it contains many native prompt nodes. The first implementation should inventory those nodes and make the missing runtime collector visible as a blocking or attention-level coverage issue.

WakeTask product/UX iteration gets active coverage accounting in the first pass, with detailed semantic rubrics added after the call inventory is stable.

Hermes create-agent gets lightweight workflow coverage unless its run cadence increases.

## Owner Dashboard Rollup

The factory owner should not need to read every eval result. The dashboard should roll active workflow evals into four signals:

- Is the factory working?
- How much has it produced?
- What is the quality of what it produced?
- What should I pay attention to?

The eval layer contributes to the quality and attention signals. Missing eval IDs, missing artifacts, stale coverage, native prompt collection gaps, and blocking eval failures should appear as owner actions. Detailed call and workflow evidence remains available for Quincy and other agents through JSON artifacts and registry paths.

## Agent Accessibility

Quincy must be able to inspect the system without using a browser. The active workflow manifest, registry entries, normalized eval result JSON, eval index, and factory health JSON are the primary agent surfaces.

For daily factory-health work, Quincy should:

1. Read `reports/factory-health.json`.
2. Read `reports/eval-index.json` for failing or missing blocking evals.
3. Read `evals/active-workflows.yaml` to understand declared active coverage.
4. Inspect recent Fabro run IDs only when the rollup points to a missing or stale evidence gap.

## CI Behavior

CI should run the existing registry validation and add an active workflow coverage check. The check should fail when:

- an active `run-codex-prompt.mjs` command lacks `--eval-id`;
- a referenced eval ID is absent from the registry;
- a registered call eval lacks a matching active workflow subject path;
- an active child workflow lacks a workflow-level eval;
- an active parent workflow lacks an outcome eval;
- a native prompt node is neither collected nor explicitly tracked as pending collection.

The checker should write a normalized eval result so CI failures and local dashboard output use the same evidence format.

## Usefulness Review

After the first implementation, run the checker and inspect recent Fabro runs. The review should answer:

- Which active workflows now have complete call, child workflow, and parent outcome coverage?
- Which evals only prove artifact existence and need stronger semantic rubrics?
- Which failures are useful owner-level attention items?
- Which failures are noisy and should become lower-level agent tasks instead?

Weak evals are expected in the first pass. The requirement is that they are visible, owned, and easy to strengthen.

## Non-Goals

This pass does not build a live dashboard UI, warehouse every raw event, or write deep promptfoo rubrics for every stage. It creates the coverage spine first so the factory can see what exists, what is missing, and where semantic eval depth should be added next.

## Approval

The user approved this scope on 2026-05-19: cover actively used production-ish workflows first, wire individual model calls where possible, expose native Fabro prompt gaps, roll the result into the existing dashboard, and keep the system agent-accessible for Quincy.
