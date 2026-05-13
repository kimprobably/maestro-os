# Fabro Railway Handoff

Status: deployed and installed. Do not commit real secrets here.

Fabro's Railway path is viable for giving another engineer a shared server. The
important constraint is persistence: Fabro stores run history, checkpoints,
sessions, the dev token, and JWT keys under `/storage`, so the Railway service
must have a Volume mounted at `/storage` before real usage.

## Deployment Shape

Use one Railway service running the Fabro server image.

Default upstream image:

```text
ghcr.io/fabro-sh/fabro:nightly
```

Maestro fork image:

```text
ghcr.io/modernagencysales/fabro-maestro:maestro-dev
ghcr.io/modernagencysales/fabro-maestro:sha-e2310ec7839f
```

Use the upstream image for vanilla server testing. Use the Maestro fork image
when testing fork-only changes such as custom providers, Slack gate dispatch, or
other local patches.

Published image digest:

```text
ghcr.io/modernagencysales/fabro-maestro@sha256:922abef2bfbbc0e64c1cb1756938df9cac192ec2acb66f59ce0b3e80af7d783c
```

Current access note: anonymous GHCR pull returned `403`, so Railway could not
pull the private GHCR image directly. The live Railway deployment was created by
uploading a minimal Docker source context that contains the Maestro Linux binary
extracted from the authenticated GHCR image. Keep using that path until the GHCR
package is made public or Railway private registry credentials are configured.

Live Railway service:

```text
Project: maestro-fabro (ff0c7d8c-ae9b-40a5-a1e1-3574961f971a)
Service: fabro-maestro (05455cb4-4d37-4e32-abf5-ff4b8665bffd)
URL: https://fabro-maestro-production.up.railway.app
Volume: fabro-maestro-volume mounted at /storage
Deployment: 2074ed44-da1f-4d4a-8de1-4f58ad9ec825
```

Engineer first-test guide: [`ENGINEER-TESTING.md`](./ENGINEER-TESTING.md).

## Required Railway Setup

1. Create a Railway service from a Docker image or upload the minimal Docker
   source context while GHCR remains private.
2. Attach a Railway Volume mounted at `/storage`.
3. Keep a single replica. Fabro currently assumes one process owns `/storage`.
4. Let Railway provide `$PORT`; the Fabro image honors it.
5. Add environment variables in Railway's Variables tab or raw editor.

## Environment Variables

Set only the variables needed for the test. Prefer separate development keys
with low limits and rotate anything that was pasted into chat.

```dotenv
SESSION_SECRET=<64-character-hex-string>
FABRO_DEV_TOKEN=<fabro_dev_generated_for_engineer_access>

OPENROUTER_API_KEY=<openrouter-dev-key>
DAYTONA_API_KEY=<daytona-dev-key>
DAYTONA_API_URL=https://app.daytona.io/api

ANTHROPIC_API_KEY=<optional-if-using-api-backend>
OPENAI_API_KEY=<optional-if-using-api-backend>
GEMINI_API_KEY=<optional-if-using-api-backend>

FABRO_SLACK_APP_TOKEN=<xapp-token-if-slack-socket-mode-is-enabled>
FABRO_SLACK_BOT_TOKEN=<xoxb-token-if-slack-is-enabled>
FABRO_SLACK_CHANNEL_ID=<default-dev-channel>

LINEAR_API_KEY=<linear-dev-key>

GITHUB_APP_CLIENT_SECRET=<only-if-github-oauth-is-enabled>
GITHUB_APP_WEBHOOK_SECRET=<only-if-github-app-is-enabled>
GITHUB_APP_PRIVATE_KEY=<only-if-github-app-is-enabled>
```

## Engineer Access

Do not send the engineer raw keys in Slack. Preferred flow:

1. Create or rotate dev-scoped keys for OpenRouter, Daytona, Linear, Slack, and
   GitHub.
2. Put those keys in Railway service variables or a password manager.
3. Give the engineer the Railway project/service access and the Fabro dev token.
4. Point their CLI at the server:

```toml
[cli.target]
type = "http"
url = "https://<railway-service>.up.railway.app/api/v1"
```

If `FABRO_DEV_TOKEN` is not pre-set, Fabro writes a generated token on first
boot. Read it from deploy logs or from the mounted storage path in the Railway
environment.

## Local To Cloud Cutover

Run local workflows against `http://127.0.0.1:32276` until the cloud service is
up. After Railway is healthy, update `~/.fabro/settings.toml` locally and rerun:

```bash
fabro model list --server https://<railway-service>.up.railway.app/api/v1
fabro run workflows/fabro/quality-stack-smoke.toml --server https://<railway-service>.up.railway.app/api/v1
```

## Open Questions

- Publish cadence and tag naming for `ghcr.io/modernagencysales/fabro-maestro`.
- Whether to make the GHCR package public or configure Railway private registry
  credentials for direct image deploys.
- Whether Railway will host only Fabro or also a Postgres/Neon proxy sidecar.
