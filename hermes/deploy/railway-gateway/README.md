# Railway Hermes Gateway

This deployment runs the Slack gateway on Railway and keeps Daytona for worker
sandboxes. Use it when Daytona egress cannot maintain Slack Socket Mode.

The image installs:

- Hermes Agent from upstream.
- Fabro latest upstream nightly release artifact, verified with `fabro mcp`.
- The `maestro-operator`, Smith, Johann, and Quill profiles.
- The SQLite Fabro run ledger schema.

Runtime variables:

```dotenv
HERMES_HOME=/data/.hermes
FABRO_SERVER=https://fabro-maestro-production.up.railway.app/api/v1
FABRO_DEV_TOKEN=
SLACK_BOT_TOKEN=
SLACK_APP_TOKEN=
SLACK_HOME_CHANNEL=
SLACK_ALLOWED_USERS=
GATEWAY_ALLOW_ALL_USERS=false
OPENROUTER_API_KEY=
HERMES_GATEWAY_MODEL_PROVIDER=openrouter
HERMES_GATEWAY_MODEL=openrouter/pareto-code
DAYTONA_API_KEY=
DAYTONA_ORGANIZATION_ID=
DAYTONA_API_URL=https://app.daytona.io/api
HONCHO_API_KEY=
HONCHO_ENVIRONMENT=production
HONCHO_WORKSPACE=maestro
HONCHO_RECALL_MODE=hybrid
```

For the smoke period, `GATEWAY_ALLOW_ALL_USERS=true` is acceptable. Before
production, replace it with `SLACK_ALLOWED_USERS`.

Railway does not inherit the Daytona Codex OAuth login. Use the OpenRouter model
override above for the Railway gateway unless you explicitly install Codex auth
inside the Railway profile volume.

Build context:

```bash
hermes/scripts/prepare-railway-gateway-context.sh /tmp/maestro-hermes-railway
railway up /tmp/maestro-hermes-railway --path-as-root --service maestro-hermes-gateway
```
