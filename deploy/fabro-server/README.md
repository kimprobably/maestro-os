# Fabro Server Deployment

This pack runs a single Fabro server behind Caddy with persistent `/storage`.
It follows Fabro's self-host Docker/Railway shape: one web/API process, a
durable storage volume, and `FABRO_WEB_URL` set to the public origin.

## Target

- Runtime: Docker Compose on a small VPS, Railway, Fly, Render, or any host that
  can run the Fabro container and persist `/storage`.
- Image: `FABRO_IMAGE` in `env.server`. Use the official image for baseline
  Fabro, or a fork image once `modernagencysales/fabro-maestro` is published.
- Auth: `dev-token` first, GitHub OAuth later if we want browser login.
- GitHub integration: token strategy via `GITHUB_TOKEN`.
- Slack: Socket Mode via `FABRO_SLACK_APP_TOKEN` and Web API via
  `FABRO_SLACK_BOT_TOKEN`.
- Linear: `LINEAR_API_KEY` for workflow-created issues and project sync.

## Deploy

```bash
cd deploy/fabro-server
cp env.server.example env.server
openssl rand -hex 32
printf 'fabro_dev_%s\n' "$(openssl rand -hex 32)"
```

Fill `env.server` on the server, then:

```bash
docker compose --env-file env.server up -d
FABRO_REMOTE_URL="$FABRO_WEB_URL" FABRO_REMOTE_DEV_TOKEN="$FABRO_DEV_TOKEN" ./remote-smoke.sh
fabro auth login --server "$FABRO_WEB_URL" --dev-token "$FABRO_DEV_TOKEN"
```

After login, the same local CLI can target the cloud server:

```bash
FABRO_SERVER="$FABRO_WEB_URL" fabro settings --json
FABRO_SERVER="$FABRO_WEB_URL" fabro run workflows/fabro/quality-stack-smoke.toml
```

Verify Linear API access from the same env:

```bash
./bin/maestro linear smoke
```

## GitHub

For the current token strategy, set `GITHUB_TOKEN` in `env.server`. Use a
fine-grained GitHub token scoped only to the repos Fabro should clone, branch,
and open pull requests against. The native GitHub App/OAuth path can replace
this later by changing `[server.integrations.github]` and adding the app env
vars.

## Workflows

Run this locally before pushing workflows to a cloud server:

```bash
fabro run workflows/fabro/spike-workflow-registry-smoke.toml --no-upgrade-check
```

Run this after the cloud server is live:

```bash
FABRO_REMOTE_URL="https://fabro.example.com" \
FABRO_REMOTE_DEV_TOKEN="fabro_dev_..." \
fabro run workflows/fabro/remote-server-smoke.toml --no-upgrade-check
```

## Notes

- Keep `env.server` off git.
- Keep one replica until the storage and scheduler story is explicitly changed.
- Keep `/var/run/docker.sock` mounted only on trusted hosts; it gives Fabro
  local Docker sandbox control.
- If we deploy the fork, publish a GHCR image first and set `FABRO_IMAGE` to
  that tag.
