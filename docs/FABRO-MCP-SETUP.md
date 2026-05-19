# Fabro MCP Setup

Fabro's run-management MCP is a stdio server launched by the authenticated
`fabro` CLI. For Maestro, that stdio process should connect to the hosted
Railway Fabro API:

```bash
export FABRO_SERVER="https://fabro-maestro-production.up.railway.app/api/v1"
fabro auth login --server "$FABRO_SERVER" --dev-token "$FABRO_DEV_TOKEN"
fabro mcp start --server "$FABRO_SERVER"
```

Do not clone Fabro onto the Hermes gateway just to get MCP. Install a Fabro CLI
from upstream nightly artifacts and verify that the binary exposes `fabro mcp`
before starting Hermes. The MCP child process reuses the CLI auth store, OAuth
refresh, dev-token handling, proxy behavior, and local storage.

Hermes registration:

```yaml
mcp_servers:
  fabro:
    command: fabro
    args: ["mcp", "start", "--server", "${FABRO_SERVER}"]
```

Local developer registrations:

- Claude Code: `~/.claude/.mcp.json` has a `fabro` server entry.
- Codex CLI: `codex mcp add fabro -- fabro mcp start --server "$FABRO_SERVER"`.

Useful checks:

```bash
node scripts/fabro/railway-preflight.mjs
fabro mcp --help
fabro mcp config --server "$FABRO_SERVER"
codex mcp get fabro
```

## Refreshing Codex Auth For Fabro Workers

Fabro workers restore Codex CLI auth from `CODEX_AUTH_JSON_BASE64` and Codex
MCP file credentials from `CODEX_MCP_CREDENTIALS_JSON_BASE64`. If Codex exits
with refresh-token or websocket 401 errors, refresh local Codex auth and push the
local Codex files through Railway stdin:

```bash
codex login
codex login status
node scripts/fabro/refresh-codex-auth-railway.mjs --service fabro-maestro --environment production --redeploy
```

Use the actual Fabro Railway service name from the Railway UI or local Railway
link. The helper reads `$CODEX_HOME/auth.json` and, when present,
`$CODEX_HOME/.credentials.json`, validates JSON, base64-encodes the file
contents, and sends values with `railway variable set <KEY> --stdin`. Its output
lists only variable names, source paths, and encoded lengths; it must not print
token values.

Validate the runtime before retrying failed production work:

```bash
node scripts/fabro/railway-preflight.mjs --server https://fabro-maestro-production.up.railway.app/api/v1 --expected-workflow build-iphone-app
fabro run workflows/fabro/daytona-cli-auth-runtime-smoke.fabro --server https://fabro-maestro-production.up.railway.app/api/v1
```

Before retrying or forking a failed run, preserve the current state in the run
ledger:

```bash
node scripts/fabro/babysit-run.mjs --run-id <run-id> --server https://fabro-maestro-production.up.railway.app/api/v1 --once
```

After launching a long run, attach the durable babysitter loop:

```bash
node scripts/fabro/babysit-run.mjs --run-id <run-id> --server https://fabro-maestro-production.up.railway.app/api/v1
```

The babysitter writes the Hermes run ledger and summarizes retry, recovery, or
quality-gate actions. For hosts that can only access events through a CLI/MCP
bridge, use `--event-command` with `{run_id}` and `{after}` placeholders.

Local Fabro is only for isolated experiments. If you launch against
`http://127.0.0.1:32276`, the run will not appear in the Railway UI at
`https://fabro-maestro-production.up.railway.app/runs`.

Before starting a real iPhone App Factory run, generate a run-specific config
instead of using generic defaults:

```bash
node scripts/iphone-app-factory/create-run-config.mjs \
  --app-type "..." \
  --target-audience "..." \
  --app-name "..." \
  --bundle-id "com.keen.<slug>" \
  --app-dir "apps/<slug>-iphone" \
  --spec-kitty-feature "<slug>-iphone-app"
```

Restart the agent session after changing MCP configuration so the new Fabro tools are loaded.
