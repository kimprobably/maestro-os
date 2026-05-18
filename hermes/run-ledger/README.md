# Fabro Run Ledger

The Fabro run ledger is the Fabro-specific projection for the Hermes
babysitter. It remains the right place to store current Fabro run state:
status, node, cursor, branch/SHA, sandbox, failure class, quality risks, and
next action.

For cross-domain events, use the generalized operator ledger in
`hermes/operator-ledger/`. Fabro append events are mirrored there as
`fabro_run` subjects so Slack threads, Kanban tasks, GitHub PRs, and Fabro
runs can be linked without overloading the Fabro projection schema.

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

## Boundary With Operator Ledger

- Fabro run ledger: current Fabro projection and Fabro event replay safety.
- Operator ledger: cross-domain event stream, subject links, Slack thread
  checkpoints, and model-context inputs.
- Hermes memory: compact preferences and pointers only.

Do not pass full raw Slack threads to Hermes. Write Slack events to the operator
ledger and build model input from the Slack thread context builder: current
message, one or two recent messages, the latest checkpoint, and linked subjects.
