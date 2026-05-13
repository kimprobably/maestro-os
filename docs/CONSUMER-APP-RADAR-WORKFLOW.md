# Consumer App Radar Workflow

This directory was materialized by `workflows/factory/workflow-builder.fabro`.

Run the generated workflow through the Railway Fabro server:

```bash
fabro run workflows/consumer-radar/build-consumer-app-radar.toml --server https://fabro-maestro-production.up.railway.app/api/v1 --preserve-sandbox
```

The workflow builds `apps/generated-consumer-app-radar` inside the Daytona sandbox, runs native checks, attempts Qlty, attempts Promptfoo, and fans out OpenRouter reviews across Kimi, Qwen, and DeepSeek. It records all reports under `.workflow/consumer-radar`.

Secrets are not stored in this repo. `APIFY_TOKEN` and `OPENROUTER_API_KEY` are injected into the sandbox from the Fabro server process environment via `[run.sandbox.env]`.
