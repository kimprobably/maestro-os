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
pull the private GHCR image directly. The current live deployment was created by
uploading a Docker source context from the patched upstream Fabro worktree and
building on Railway. That build runs the Fabro web SPA build before compiling
`fabro-cli`, so the dashboard assets are embedded into the release binary.

Live Railway service:

```text
Project: maestro-fabro (ff0c7d8c-ae9b-40a5-a1e1-3574961f971a)
Service: fabro-maestro (05455cb4-4d37-4e32-abf5-ff4b8665bffd)
URL: https://fabro-maestro-production.up.railway.app
Volume: fabro-maestro-volume mounted at /storage
Deployment: 6157f5df-e595-41ea-aea2-7e5e23917b0d
```

Engineer first-test guide: [`ENGINEER-TESTING.md`](./ENGINEER-TESTING.md).

## Required Railway Setup

1. Create a Railway service from a Docker image or upload the Docker source
   context while GHCR remains private.
2. Attach a Railway Volume mounted at `/storage`.
3. Keep a single replica. Fabro currently assumes one process owns `/storage`.
4. Let Railway provide `$PORT`; the Fabro image honors it.
5. Add environment variables in Railway's Variables tab or raw editor.

## Source Context Deploy

Use this path while the Maestro image is private or while testing local patches
that have not been published as an image.

```bash
WORKTREE="/path/to/fabro-upstream-main-or-maestro-worktree"
CONTEXT="/tmp/fabro-railway-source"

rm -rf "$CONTEXT"
mkdir -p "$CONTEXT/source" "$CONTEXT/app"
rsync -a --delete \
  --exclude target \
  --exclude node_modules \
  --exclude .git \
  --exclude tmp \
  --exclude .DS_Store \
  --exclude .direnv \
  --exclude .cache \
  "$WORKTREE/" "$CONTEXT/source/"
cp deploy/fabro-server/settings.server.toml "$CONTEXT/app/settings.server.toml"
cp deploy/railway/source-build.Dockerfile "$CONTEXT/Dockerfile"
cp deploy/railway/railway-entrypoint.sh "$CONTEXT/railway-entrypoint.sh"

railway up "$CONTEXT" --path-as-root --message "Deploy Fabro with embedded web dashboard assets"
```

Do not add a Docker `VOLUME` instruction. Railway rejects it; attach the
Railway Volume through the Railway service settings instead.

## Environment Variables

Set only the variables needed for the test. Prefer separate development keys
with low limits and rotate anything that was pasted into chat.

```dotenv
SESSION_SECRET=<64-character-hex-string>
FABRO_DEV_TOKEN=<fabro_dev_generated_for_engineer_access>

OPENROUTER_API_KEY=<openrouter-dev-key>
DAYTONA_API_KEY=<daytona-dev-key>
DAYTONA_API_URL=https://app.daytona.io/api
CODEX_AUTH_JSON_BASE64=<base64-of-codex-auth-json-for-cli-backend>
CLAUDE_CODE_CREDENTIALS_JSON_BASE64=<base64-of-claude-code-.credentials.json>

OPENAI_API_KEY=<optional-for-codex-cli-api-key-auth>
CLAUDE_CODE_OAUTH_TOKEN=<optional-legacy-token; not sufficient by itself for fresh sandboxes>
ANTHROPIC_API_KEY=<optional-if-using-anthropic-api-backend>
GEMINI_API_KEY=<optional-if-using-api-backend>

FABRO_SLACK_APP_TOKEN=<xapp-token-if-slack-socket-mode-is-enabled>
FABRO_SLACK_BOT_TOKEN=<xoxb-token-if-slack-is-enabled>
FABRO_SLACK_CHANNEL_ID=<default-dev-channel>

LINEAR_API_KEY=<linear-dev-key>

GITHUB_APP_CLIENT_SECRET=<only-if-github-oauth-is-enabled>
GITHUB_APP_WEBHOOK_SECRET=<only-if-github-app-is-enabled>
GITHUB_APP_PRIVATE_KEY=<only-if-github-app-is-enabled>
```

For Claude Code subscription auth, the portable artifact is the Claude Code
credentials JSON, not the `setup-token` bearer string alone. On macOS, export it
without printing the contents:

```sh
security find-generic-password -s 'Claude Code-credentials' -w \
  | base64 | tr -d '\n'
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

When using `railway run` with the local CLI, unset the server-only config path
so the local machine does not try to read `/app/settings.server.toml`:

```bash
railway run -- env -u FABRO_CONFIG fabro version \
  --server https://<railway-service>.up.railway.app/api/v1 \
  --no-upgrade-check
```

## Open Questions

- Publish cadence and tag naming for `ghcr.io/modernagencysales/fabro-maestro`.
- Whether to make the GHCR package public or configure Railway private registry
  credentials for direct image deploys.
- Whether Railway will host only Fabro or also a Postgres/Neon proxy sidecar.
