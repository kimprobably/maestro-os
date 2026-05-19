# Factory Dashboard

Generated: 2026-05-19T06:18:42.478Z
Overall: **ATTENTION REQUIRED**

## Owner Rollup

Factory needs owner attention.

| Metric | Value |
| --- | ---: |
| Factory Status | attention_required |
| Report Artifacts | 12 |
| Fabro Runs Tracked | 1 |
| Completed Runs | 0 |
| Failed Runs | 0 |
| Eval Evidence Coverage | 2% |
| Missing Blocking Evals | 88 |

### Owner Actions

1. **Missing blocking eval evidence (88)** (high) - Assign Quincy to connect normalized result emission for these evals and rerun npm run eval:index.
2. **Unknown Fabro run status (1)** (medium) - Assign Quincy to refresh the run projection and classify unknown runs as completed, failed, active, or intentionally ignored.

## Is The Factory Working?

| Signal | Status | Notes |
| --- | --- | --- |
| Eval gate | attention | 88 blocking evals need evidence or fixes. |
| Fabro run stream | attention | 1 tracked runs, 0 completed, 0 failed, 0 active, 1 unknown. |
| Artifact stream | working | 12 generated report artifacts. |

## How Much Has It Produced?

| Metric | Count |
| --- | ---: |
| Report Artifacts | 12 |
| Fabro Runs Tracked | 1 |
| Completed Runs | 0 |
| Failed Runs | 0 |
| Active Runs | 0 |

### Artifact Categories

| Category | Count |
| --- | ---: |
| eval | 5 |
| quality | 3 |
| review | 4 |

## Quality Of Output

| Metric | Count |
| --- | ---: |
| Registered Evals | 90 |
| Blocking Evals | 90 |
| Present Results | 2 |
| Passed | 2 |
| Failed | 0 |
| Fallback Only | 0 |
| Waived | 0 |
| Missing Blocking | 88 |

Eval index generated: 2026-05-19T06:18:41.373Z

## Pay Attention

1. **Missing blocking eval evidence (88)** (high) - consumer-radar.product-quality, enhancement-discovery.workflow-quality, iphone-factory.prompt-quality, hermes.skill-promotion-quality, eval.meta.fallback-masking, iphone-feature.context-intake.call, iphone-feature.implementation.call, iphone-object-proof.program.outcome and 80 more
   Action: Assign Quincy to connect normalized result emission for these evals and rerun npm run eval:index.
2. **Unknown Fabro run status (1)** (medium) - 1 tracked run projections do not have a known terminal or active status.
   Action: Assign Quincy to refresh the run projection and classify unknown runs as completed, failed, active, or intentionally ignored.

## Recent Factory Artifacts

- reports/eval-dashboard.md (eval, 5987 bytes)
- reports/eval-index.json (eval, 35585 bytes)
- reports/evals/factory-health/active-workflows.eval-coverage.json (eval, 14027 bytes)
- reports/evals/factory-health/workflow-builder.eval-coverage.json (eval, 1113 bytes)
- reports/active-workflow-eval-review.md (eval, 1295 bytes)
- reports/consumer-radar/reviews/qwen-feedback.json (review, 4209 bytes)
- reports/consumer-radar/reviews/kimi-feedback.json (review, 2910 bytes)
- reports/consumer-radar/reviews/deepseek-feedback.json (review, 3421 bytes)

## Recent Fabro Runs

- 01KRV4X3GESNR09A2FVJRCGPTS: unknown

## Inputs

| Input | Path |
| --- | --- |
| Eval Index | reports/eval-index.json |
| Reports Root | reports |
| Run Ledger | $HOME/.hermes/profiles/maestro-operator/state/fabro-run-ledger.jsonl |
