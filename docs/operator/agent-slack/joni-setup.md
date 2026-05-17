# Joni Slack Bot Setup

Status: generated, not installed.

Use the manifest at `hermes/agents/slack/joni-manifest.json`.

Required human/admin steps:

1. Create a separate Slack app for Joni.
2. Import or mirror the generated manifest.
3. Enable Socket Mode.
4. Create an app-level token with the `connections:write` scope.
5. Install the app to the workspace.
6. Invite the bot to every Slack channel it should answer in, or grant the generated `channels:join` scope and let the operator join public channels by API.
7. Create or clone a separate Railway service for the joni gateway.
8. Store the Joni-specific bot token and app-level token in that service.
9. Restrict allowed users and channels before making it live.

Minimum Railway variables for the dedicated bot service:

```dotenv
HERMES_GATEWAY_PROFILE=joni
HERMES_HOME=/data/.hermes
SLACK_BOT_TOKEN=
SLACK_APP_TOKEN=
SLACK_HOME_CHANNEL=
SLACK_ALLOWED_USERS=
GATEWAY_ALLOW_ALL_USERS=false
HARVEST_API_KEY=
FABRO_SERVER=https://fabro-maestro-production.up.railway.app/api/v1
HONCHO_WORKSPACE=maestro
HONCHO_ENVIRONMENT=production
HONCHO_RECALL_MODE=hybrid
```

Do not reuse Miles' Slack app identity for Joni.
