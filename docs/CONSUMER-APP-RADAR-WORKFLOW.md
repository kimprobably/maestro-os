# Consumer App Radar Workflow

This directory was materialized by `workflows/factory/workflow-builder.fabro`.

Run the generated workflow through the Railway Fabro server:

```bash
fabro run workflows/consumer-radar/build-consumer-app-radar.toml --server https://fabro-maestro-production.up.railway.app/api/v1 --preserve-sandbox
```

The workflow builds `apps/generated-consumer-app-radar` inside the Daytona sandbox, runs native checks, attempts Qlty, attempts Promptfoo, and fans out OpenRouter reviews across Kimi, Qwen, and DeepSeek. It records transient gate logs under `.workflow/consumer-radar` and commit-visible review artifacts under `reports/consumer-radar`.

Because this spike repo currently has no Git remote for Daytona to clone, remote runs include a short support-file wait stage. Start the run detached, then copy `scripts/consumer-radar`, `specs/consumer-app-radar`, and `evals/consumer-app-radar-quality.yaml` into the run sandbox with `fabro sandbox cp`.

Secrets are not stored in this repo. `APIFY_TOKEN` and
`OPENROUTER_API_KEY` are injected into the sandbox from the Fabro server
secret vault via `[run.sandbox.env]`.
