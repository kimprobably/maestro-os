# Daytona Gateway Status

Updated: 2026-05-14 13:55 America/New_York

Current decision: Daytona is retained for worker/sandbox execution, but not as
the Slack gateway host. Its egress to Slack resets TLS connections while GitHub
works, so Railway is now the active always-on gateway target.

## Sandbox

- Name: `maestro-hermes-gateway`
- ID: `63730602-bee1-47b5-9628-f0774f6bbb79`
- Snapshot: `maestro-code-factory-v6`
- Region: `us`
- Auto-stop: disabled via `--auto-stop 0`
- Labels: `project=maestro-os`, `purpose=hermes-gateway`
- Repo path: `/workspace/maestro-os`

## Completed

- Created a separate Daytona gateway sandbox instead of reusing an active Fabro/code-factory sandbox.
- Cloned `kimprobably/maestro-os` branch `spike/fabro-code-factory-v5` into `/workspace/maestro-os`.
- Transferred the local Hermes operator package into the sandbox:
  - `docs/HERMES-OPERATOR-ARCHITECTURE.md`
  - `docs/HERMES-DEPLOYMENT-RUNBOOK.md`
  - `hermes/`
- Installed Hermes Agent `v0.13.0` into `/usr/local/bin/hermes`.
- Installed the `maestro-operator` Hermes profile distribution.
- Installed worker profiles:
  - `smith`
  - `johann`
  - `quill`
- Installed SQLite and initialized `/root/.hermes/profiles/maestro-operator/state/fabro-run-ledger.sqlite`.
- Verified the ledger tables:
  - `fabro_runs`
  - `fabro_run_events`
  - `fabro_run_decisions`
  - `fabro_quality_gates`
- Seeded bounded Hermes memories:
  - `/root/.hermes/profiles/maestro-operator/memories/MEMORY.md`
  - `/root/.hermes/profiles/maestro-operator/memories/USER.md`
- Verified Hermes profile state:
  - `maestro-operator` installed from distribution.
  - Gateway stopped.
  - Fabro MCP enabled with 5 selected tools.
  - Linear/Stripe/Beehiiv/outbound MCPs disabled.
- Created and paused cron job:
  - ID: `5bef90a45b39`
  - Name: `Fabro run babysitter`
  - Schedule: `every 30m`
  - Workdir: `/workspace/maestro-os`
- Transferred Codex auth file to `/root/.codex/auth.json` without printing contents.
- Verified via SSH that:
  - `/root/.codex/auth.json` is present.
  - `/root/.codex/config.toml` is not present.
  - `codex-cli 0.130.0` is installed.
- Added Slack gateway credentials to the Hermes profile without printing values.
- Set `GATEWAY_ALLOW_ALL_USERS=true` for the smoke period.
- Installed Fabro `0.233.0-nightly.0` from upstream nightly release artifacts.
- Switched Fabro MCP from a local Fabro server target to the Railway API target:
  `https://fabro-maestro-production.up.railway.app/api/v1`.
- Stored Fabro CLI dev-token auth for the Railway server.
- Verified Hermes MCP discovery:
  - `fabro` enabled.
  - 5 selected tools.
- Verified a real Hermes agent-side Fabro MCP smoke:
  - Result shape: `FABRO_MCP_OK <run_id> <status>`.
- Verified Slack egress failure from Daytona:
  - `https://slack.com/api/api.test`: connection reset by peer.
  - `https://www.google.com`: connection reset by peer.
  - `https://api.github.com/rate_limit`: HTTP 200.

## Blockers

- Daytona control-plane API is intermittent:
  - `https://app.daytona.io/api/sandbox/maestro-hermes-gateway`
  - `https://proxy.app.daytona.io/toolbox/.../process/execute`
- Slack gateway cannot run reliably from Daytona because TLS to Slack is reset.
- Codex auth works for Hermes on Daytona, but this does not transfer to Railway.
- Gateway service should remain stopped on Daytona to avoid duplicate Slack consumers.
- Fabro smoke run has not been started.

## Resume Checklist

1. Re-check Daytona control plane:
   ```bash
   daytona info maestro-hermes-gateway
   ```
2. Re-check Codex auth presence without printing contents:
   ```bash
   daytona exec maestro-hermes-gateway -- "if [ -f /root/.codex/auth.json ]; then echo 'ok remote codex auth present'; else echo 'missing remote codex auth'; fi"
   daytona exec maestro-hermes-gateway -- "if [ -f /root/.codex/config.toml ]; then echo 'ok remote codex config present'; else echo 'missing remote codex config'; fi"
   ```
3. If auth is incomplete, retry transfer without printing contents.
4. Keep this sandbox available for Smith/Codex worker tasks and Fabro sandbox
   recovery.
5. Do not start the Slack gateway here unless the Slack TLS reset is resolved.
6. Use Railway service `maestro-hermes-gateway` for the Slack-resident process.

## Notes

- The first attempt to mount Daytona volume `maestro-agent-auth` failed because `daytona volume get maestro-agent-auth` returned `Not Found`, despite `daytona volume list` showing that display name.
- The first `daytona create` failed with an internal server error when the volume mount was included. Creating without the volume succeeded.
- Daytona CLI is older than API:
  - CLI: `v0.173.0`
  - API warning: `v0.176.0`
  - Upgrade the CLI before further heavy provisioning if possible.
