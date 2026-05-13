# App Feedback Enhancement Workflow

This workflow turns product feedback into a bounded enhancement loop that can be reused across apps:

1. Parse feedback into acceptance checks.
2. Produce a Spec Kitty-compatible feedback gate artifact.
3. Dispatch a target-specific enhancement adapter.
4. Run native app checks, product surface checks, feedback acceptance checks, Qlty, Promptfoo, and parallel model review.
5. Publish a handoff with the changed app and quality reports.

The first adapter target is `consumer-radar`. It addresses the current feedback by making growth provenance explicit, surfacing review samples and example content, penalizing category leaders in ranking, and adding a manual app seed flow.

## Current Builder Behavior

The initial workflow-builder materializer is deterministic: it writes a known-good Fabro workflow, scripts, tests, and docs from repository code. AI is used later in the generated workflow's Promptfoo/model-review gates, not to invent the workflow graph itself.

That is deliberate for this spike checkpoint: deterministic materialization gives us a stable baseline to validate Fabro, Qlty, Promptfoo, Spec Kitty-style checks, and review fanout. The next builder iteration should add an LLM design stage before materialization so Fabro can choose whether to reuse, modify, or create a workflow from a vague request.

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
