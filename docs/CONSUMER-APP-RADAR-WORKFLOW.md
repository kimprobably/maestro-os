# Consumer App Radar Workflow

This directory was materialized by `workflows/factory/workflow-builder.fabro`.

Run the generated workflow through the Railway Fabro server:

```bash
fabro run workflows/consumer-radar/build-consumer-app-radar.toml \
  --server https://fabro-maestro-production.up.railway.app/api/v1 \
  --preserve-sandbox
```

The workflow builds `apps/generated-consumer-app-radar` inside the Daytona
sandbox, runs native checks, verifies the generated dashboard through a product
surface gate, runs Qlty, attempts Promptfoo, and fans out OpenRouter reviews
across Kimi, Qwen, and DeepSeek. It records reports under
`.workflow/consumer-radar` and `reports/consumer-radar`.

Daytona runs clone the pushed `spike/fabro-code-factory-v5` branch. Commit and
push workflow changes before launching a remote run; dirty local files are not
available inside the sandbox.

Secrets are not stored in this repo. `APIFY_TOKEN` and `OPENROUTER_API_KEY`
are injected into the sandbox from the Fabro server secret vault via
`[run.sandbox.env]`.
