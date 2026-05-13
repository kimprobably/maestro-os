# Enhancement Discovery Workflow

This workflow fixes the gap in the first feedback workflow. The old path parsed product feedback and ran a known target adapter. That made it good at honest fixture disclosure, but bad at discovering the real implementation needed for requests like "wire Apify and get more apps."

The new workflow is an eval-driven workflow builder:

1. Parse enhancement requests.
2. Audit the app's existing capabilities.
3. Generate multiple spec candidates.
4. Score specs with deterministic contract checks and rubric evals.
5. Generate multiple architecture candidates.
6. Score architecture candidates.
7. Generate multiple workflow candidates.
8. Score workflow candidates.
9. Materialize an app-specific enhancement workflow.
10. Validate or run the generated workflow.
11. Require a simplification plan.
12. Run final eval fanout and publish a handoff.

## TDD + EDD

TDD covers objective behavior: files exist, workflows validate, endpoints exist, real mode fails without required credentials, native tests pass, and quality gates run.

EDD covers subjective quality: whether a spec is good enough, whether an architecture is realistic, whether a workflow would actually solve the user's request, and whether simplification improves the result. Those stages use candidates, rubric scoring, pairwise comparison, consensus selection, and persisted eval artifacts.

## Consumer Radar Target

For Consumer Radar, the generated child workflow is:

- `workflows/consumer-radar/live-enrichment.fabro`
- `workflows/consumer-radar/live-enrichment.toml`

That child workflow is intentionally strict:

- `real_mode=true`
- `allow_fixture_fallback=false`
- `APIFY_TOKEN` required before live execution
- `live_data_gate` required after implementation
- code simplification required before final review

Run the builder locally:

```bash
node scripts/workflow-builder/materialize-enhancement-discovery.mjs
node scripts/workflow-builder/validate-enhancement-discovery-builder.mjs
fabro validate workflows/app-feedback/discover-enhancement.fabro --no-upgrade-check
```

Run through Fabro:

```bash
fabro run workflows/app-feedback/discover-enhancement.consumer-radar.toml --no-upgrade-check
```

To execute the generated child workflow in the same run, set `execute_generated_workflow=true`. Keep that off while iterating on workflow design, then enable it once the generated workflow and credentials are ready.
