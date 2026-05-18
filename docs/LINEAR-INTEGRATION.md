# Linear Integration

Status: API bridge installed; connector needs reauthentication.

## Surfaces

Maestro uses Linear in two ways:

- Codex/agent connector: interactive issue and project work through the bundled
  Linear plugin.
- Workflow bridge: `LINEAR_API_KEY` in local/cloud/sandbox env so Fabro
  workflows can create or update issues without relying on this chat session.

## Current State

The bundled Linear connector is installed, but returned `401 reauthentication
required` on 2026-05-13. Reconnect the Linear app in Codex before asking agents
to create or update real issues through the plugin.

The repo side is installed and verified:

```bash
./bin/maestro linear smoke
./bin/maestro doctor quality-stack
```

Latest Fabro smoke:

- `workflows/fabro/linear-integration-smoke.fabro`
- run `01KRFR8HR7E3Y0DY28RMKGG53G`
- status: succeeded

`doctor quality-stack` reports `linear_api` as:

- `pass` when `LINEAR_API_KEY` can query Linear.
- `warn` when the API key is missing.
- `fail` when the key is present but the API query fails.

## Required Env

```bash
LINEAR_API_KEY=
LINEAR_API_URL=https://api.linear.app/graphql
```

Use a token scoped to the workspace where Maestro should create automation
issues. Put the same values in Daytona/bootstrap env and cloud
`deploy/fabro-server/env.server`.

## Workflow Usage

Coding and spec workflows should create Linear issues for:

- approved specs that need implementation packages;
- failed reviewer gates that need human triage;
- ADR follow-ups;
- deployment blockers;
- quality debt discovered by Qlty/native checks.

For now, keep actual issue writes behind a human-approved workflow step. Reads
and smoke checks can run automatically.
