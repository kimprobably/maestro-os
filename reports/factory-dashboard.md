# Factory Dashboard

Generated: 2026-05-19T00:50:54.754Z
Overall: **ATTENTION REQUIRED**

## Owner Rollup

Factory needs owner attention.

| Metric | Value |
| --- | ---: |
| Factory Status | attention_required |
| Report Artifacts | 9 |
| Fabro Runs Tracked | 0 |
| Completed Runs | 0 |
| Failed Runs | 0 |
| Eval Evidence Coverage | 0% |
| Missing Blocking Evals | 8 |

### Owner Actions

1. **Missing blocking eval evidence (8)** (high) - Assign Quincy to connect normalized result emission for these evals and rerun npm run eval:index.
2. **Run ledger not connected** (medium) - Wire the Hermes Fabro run ledger into npm run factory:dashboard so daily health includes production state.

## Is The Factory Working?

| Signal | Status | Notes |
| --- | --- | --- |
| Eval gate | attention | 8 blocking evals need evidence or fixes. |
| Fabro run stream | not connected | No run ledger path supplied, so production run state is not included. |
| Artifact stream | working | 9 generated report artifacts. |

## How Much Has It Produced?

| Metric | Count |
| --- | ---: |
| Report Artifacts | 9 |
| Fabro Runs Tracked | 0 |
| Completed Runs | 0 |
| Failed Runs | 0 |
| Active Runs | 0 |

### Artifact Categories

| Category | Count |
| --- | ---: |
| eval | 2 |
| quality | 3 |
| review | 4 |

## Quality Of Output

| Metric | Count |
| --- | ---: |
| Registered Evals | 8 |
| Blocking Evals | 8 |
| Present Results | 0 |
| Passed | 0 |
| Failed | 0 |
| Fallback Only | 0 |
| Waived | 0 |
| Missing Blocking | 8 |

Eval index generated: 2026-05-18T22:19:44.262Z

## Pay Attention

1. **Missing blocking eval evidence (8)** (high) - consumer-radar.product-quality, enhancement-discovery.workflow-quality, iphone-factory.prompt-quality, hermes.skill-promotion-quality, eval.meta.fallback-masking, workflow-builder.eval-coverage, iphone-feature.context-intake.call, iphone-feature.implementation.call
   Action: Assign Quincy to connect normalized result emission for these evals and rerun npm run eval:index.
2. **Run ledger not connected** (medium) - Pass --run-ledger with the Hermes Fabro run ledger JSONL path to include run production and failure data.
   Action: Wire the Hermes Fabro run ledger into npm run factory:dashboard so daily health includes production state.

## Recent Factory Artifacts

- reports/eval-dashboard.md (eval, 749 bytes)
- reports/eval-index.json (eval, 3345 bytes)
- reports/consumer-radar/reviews/qwen-feedback.json (review, 4209 bytes)
- reports/consumer-radar/reviews/kimi-feedback.json (review, 2910 bytes)
- reports/consumer-radar/reviews/deepseek-feedback.json (review, 3421 bytes)
- reports/consumer-radar/review-consensus.json (review, 520 bytes)
- reports/consumer-radar/quality/qlty-report.json (quality, 1150 bytes)
- reports/consumer-radar/quality/native-checks.json (quality, 1551 bytes)

## Recent Fabro Runs

No run ledger events were included.

## Inputs

| Input | Path |
| --- | --- |
| Eval Index | reports/eval-index.json |
| Reports Root | reports |
| Run Ledger | not configured |
