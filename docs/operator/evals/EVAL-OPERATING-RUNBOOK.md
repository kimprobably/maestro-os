# Eval Operating Runbook

## Team One-Pager

Open `docs/operator/evals/eval-operating-system-one-pager.html` in a browser for the team-facing overview.

## Local Commands

- `npm run eval:registry`
- `npm run eval:coverage`
- `npm run eval:index`
- `npm run eval:dashboard`
- `npm run factory:dashboard`

## Reading The Dashboard

`reports/eval-dashboard.md` is the quick operator view. Missing blocking evals and fallback-only evals are action items, not informational notes.

`reports/factory-dashboard.md` is the central factory rollup. It answers four operator questions: whether the factory is working, how much it produced, what quality evidence exists, and what needs attention. The v0 dashboard is file-backed: it reads `reports/eval-index.json`, generated files under `reports/`, and the Hermes Fabro run ledger when present. It auto-discovers the default `$HERMES_HOME` or `$HOME/.hermes` ledger paths, and `--run-ledger` can override the source.

`reports/factory-health.json` is the agent API for Quincy. The daily health job should read `owner_rollup.key_metrics`, report only `owner_rollup.owner_actions`, and use deeper fields only when an owner action needs evidence. The job definition lives at `hermes/distribution/maestro-operator/cron/factory-health-daily.json`.

## Promptfoo

Promptfoo remains a runner and local viewer. Use `promptfoo view -p 15500` for local inspection, but use the eval index as the central record.

## Railway/Fabro

Fabro/Railway run IDs must appear in normalized results when available through `FABRO_RUN_ID`.

## Waivers

Waivers require a structured `metadata.waiver` record with `waiver_id`, `accepted_by`, `reason`, `risk_statement`, `review_by`, and `compensating_control`. A fallback-only eval is still a blocking issue unless that waiver is accepted by the result contract.
