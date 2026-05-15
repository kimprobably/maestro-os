# Fabro Run Ledger

The run ledger is the durable state layer for the Hermes Fabro babysitter.

Use it to resume after:

- Hermes session reset
- Slack interruption
- Fabro control-plane issue
- Daytona sandbox failure
- CI retry
- Human approval delay

## Preferred Storage

SQLite using `schema.sql`.

Suggested path:

```text
$HERMES_HOME/state/fabro-run-ledger.sqlite
```

## Fallback Storage

If SQLite is unavailable, append JSONL events to:

```text
$HERMES_HOME/state/fabro-run-ledger.jsonl
```

Each entry should match `ledger-event.schema.json`.

## Update Cadence

Write a ledger update after every meaningful event:

- run created
- run started
- status change
- stage/node change
- failure classification
- retry/fork/resume decision
- branch/SHA discovery
- sandbox discovery
- gate result
- human approval needed
- final summary

## Reporting

Reports should cite ledger facts by run ID and event cursor. Do not paste logs unless explicitly requested, and never paste secrets.
