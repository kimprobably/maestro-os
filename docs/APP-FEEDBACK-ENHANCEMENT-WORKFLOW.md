# App Feedback Enhancement Workflow

This workflow turns product feedback into a bounded enhancement loop that can be reused across apps:

1. Parse feedback into acceptance checks.
2. Produce a Spec Kitty-compatible feedback gate artifact.
3. Dispatch a target-specific enhancement adapter.
4. Run native app checks, product surface checks, feedback acceptance checks, Qlty, Promptfoo, and parallel model review.
5. Publish a handoff with the changed app and quality reports.

The first adapter target is `consumer-radar`. It addresses the current feedback by making growth provenance explicit, surfacing review samples and example content, penalizing category leaders in ranking, and adding a manual app seed flow.

For non-trivial feedback, use `workflows/app-feedback/discover-enhancement.fabro` instead. The first workflow is a deterministic patch adapter; the discovery workflow is the eval-driven path that audits existing capabilities, generates multiple spec/architecture/workflow candidates, scores them, materializes an app-specific enhancement workflow, and requires simplification before final handoff.

## Current Builder Behavior

The initial workflow-builder materializer is deterministic: it writes a known-good Fabro workflow, scripts, tests, and docs from repository code. AI is used later in the generated workflow's Promptfoo/model-review gates, not to invent the workflow graph itself.

That is deliberate for this spike checkpoint: deterministic materialization gives us a stable baseline to validate Fabro, Qlty, Promptfoo, Spec Kitty-style checks, and review fanout. The next builder iteration should add an LLM design stage before materialization so Fabro can choose whether to reuse, modify, or create a workflow from a vague request.

That next iteration now lives in `workflows/app-feedback/discover-enhancement.fabro`. It adds eval-driven development on top of test-driven development: candidate fanout, deterministic contract gates, rubric/pairwise evals, consensus selection, generated child workflows, and code simplification stages.

Run locally:

```bash
node scripts/workflow-builder/materialize-app-feedback-enhancement.mjs
node scripts/app-feedback/parse-feedback.mjs --feedback feedback/consumer-radar-product-feedback.md
node scripts/app-feedback/apply-feedback-enhancement.mjs --target consumer-radar --app-dir apps/generated-consumer-app-radar --feedback feedback/consumer-radar-product-feedback.md
node scripts/app-feedback/assert-feedback-enhancement.mjs apps/generated-consumer-app-radar --target consumer-radar
```

Run through Fabro:

```bash
fabro run workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml
```

Before starting Daytona-backed runs in a low-disk account, run:

```bash
fabro run workflows/fabro/daytona-cleanup.toml --sandbox local
```

That workflow archives old stopped Maestro/code-factory Daytona sandboxes while keeping the newest stopped sandbox by default. It avoids the common 30 GiB Daytona disk-limit failure before new Fabro sandboxes start.

For day-to-day Daytona-backed runs, prefer the wrapper:

```bash
node scripts/fabro/run-daytona-workflow.mjs workflows/app-feedback/enhance-app-from-feedback.consumer-radar.toml --server https://fabro-maestro-production.up.railway.app --no-upgrade-check -d
```

The wrapper runs the same cleanup preflight before calling `fabro run --sandbox daytona`.
