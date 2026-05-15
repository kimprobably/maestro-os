# Fabro Run Ledger

Maestro already has a durable Fabro run ledger in Hermes. Do not create a second
ledger for the iPhone App Factory unless this SQLite layer proves insufficient.

## Storage Decision

Use Hermes SQLite first:

```text
$HERMES_HOME/state/fabro-run-ledger.sqlite
```

Schema:

```text
hermes/run-ledger/schema.sql
```

If SQLite is unavailable, Hermes falls back to:

```text
$HERMES_HOME/state/fabro-run-ledger.jsonl
```

JSONL entries should match:

```text
hermes/run-ledger/ledger-event.schema.json
```

## Why Not Fabro Storage Alone

Fabro is the orchestrator, but the babysitter needs state that survives:

- local agent session resets
- Railway/Fabro UI confusion
- failed metadata pushes
- Daytona sandbox DNS/proxy failures
- GitHub Actions retries
- manual recovery after a Fabro control-plane failure

The ledger stores cross-surface facts keyed by `run_id`: Fabro event cursor,
current node, latest branch/SHA, sandbox id, failure class, quality risks,
decisions taken, and next action.

## Required Write Cadence

Write to the ledger after every meaningful run event:

- run created or started
- status or node change
- failure classification
- retry, fork, or manual recovery decision
- branch/SHA discovery
- sandbox discovery
- gate result
- CI run/artifact discovery
- final summary
- postmortem written
- improvement backlog ideas created or updated

Use the helper CLI for explicit writes:

```bash
node scripts/fabro/run-ledger.mjs init
node scripts/fabro/run-ledger.mjs append-event --run-id <id> --current-status running --next-action "poll"
node scripts/fabro/run-ledger.mjs summarize-run --run-id <id>
```

For active monitoring, use the babysitter poller:

```bash
node scripts/fabro/babysit-run.mjs --run-id <id> --server https://fabro-maestro-production.up.railway.app/api/v1
```

The poller supports HTTP, command, and event-file sources. It classifies known
failure signatures, writes ledger events, and prints the next operator action.
Use `--event-command` when a host can expose Fabro CLI/MCP event JSON but not
direct HTTP.

## WakeTask Lessons

The WakeTask run showed why the ledger must be external to chat:

- The original run used local Fabro, not Railway.
- The run failed at simplification after Daytona DNS/proxy errors and prompt
  file materialization failure.
- Metadata branch push failed because GitHub DNS resolution failed.
- The fork replayed historical events and was not a clean restart.
- Manual recovery produced green hosted macOS CI, but that fact lived outside
  the original Fabro terminal state.

Future babysitters should update Hermes ledger state before making retry or
handoff claims.

## Postmortem Link

For substantial runs, the ledger should point to the postmortem path and any
improvement backlog IDs created from the run. Use:

- `docs/FABRO-RUN-POSTMORTEMS.md` for the protocol and template.
- `docs/FABRO-RUN-IMPROVEMENT-BACKLOG.md` for ideas that should improve future
  prompts, gates, scripts, workflow graphs, deployments, skills, or ledgers.
