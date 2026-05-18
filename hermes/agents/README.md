# Maestro Agent Registry

This directory is the lightweight source of truth for named Hermes agents.

- `registry.json` stores active agents, profiles, roles, current focus, and handoff commands.
- `name-pool.md` stores available musician first names for future agents.
- `bootstrap-rules.md` defines the checklist for adding or retiring agents.

View the registry from a gateway host:

```bash
node /app/scripts/hermes/agent-registry.mjs list
node /app/scripts/hermes/agent-registry.mjs show quincy
node /app/scripts/hermes/agent-registry.mjs names
```

This is intentionally simpler than a dashboard. The Hermes dashboard can help manage profiles and sessions, but this registry is the business-facing roster Miles should use when deciding who owns what.
