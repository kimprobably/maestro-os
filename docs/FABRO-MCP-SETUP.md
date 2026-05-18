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
