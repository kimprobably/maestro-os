# Railway Hermes Gateway

This deployment runs the Slack gateway on Railway and keeps Daytona for worker
sandboxes. Use it when Daytona egress cannot maintain Slack Socket Mode.

The image installs:

- Hermes Agent from upstream.
- Fabro latest upstream nightly release artifact, verified with `fabro mcp`.
- The `maestro-operator`, Smith, Johann, Quill, Quincy, and Joni profiles.
- The SQLite Fabro run ledger schema.

Runtime variables:

```dotenv
HERMES_HOME=/data/.hermes
HERMES_GATEWAY_PROFILE=maestro-operator
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
HARVEST_API_KEY=
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

Dedicated specialist bots should use the same image with a separate Railway
service, separate Slack app tokens, and `HERMES_GATEWAY_PROFILE=<profile>`.
For Joni, use `HERMES_GATEWAY_PROFILE=joni`; the gateway preserves her
profile-specific SOUL and loads the `linkedin-operator` skill into her Slack
home channel.
