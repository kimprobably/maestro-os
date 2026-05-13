# Fabro MCP Setup

Fabro exposes a local MCP server through:

```bash
fabro mcp start --server http://127.0.0.1:32276
```

Local agent registrations:

- Claude Code: `~/.claude/.mcp.json` has a `fabro` server entry.
- Codex CLI: `codex mcp add fabro -- fabro mcp start --server http://127.0.0.1:32276`.

Useful checks:

```bash
fabro mcp config --json --no-upgrade-check
codex mcp get fabro
```

Restart the agent session after changing MCP configuration so the new Fabro tools are loaded.
