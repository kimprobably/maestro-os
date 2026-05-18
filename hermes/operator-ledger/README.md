# Operator Ledger

The operator ledger is Maestro's generalized durable event stream for Hermes.
It records cross-domain facts that should survive Slack thread loss, Hermes
session compaction, gateway restarts, Fabro control-plane gaps, and agent handoff.

The existing Fabro run ledger remains the Fabro-specific projection. This
ledger stores shared subjects such as Slack threads, Fabro runs, Kanban tasks,
GitHub PRs, Linear issues, clients, leads, and scheduled agent work.

## Storage

Preferred SQLite path:

```text
$HERMES_HOME/profiles/maestro-operator/state/operator-ledger.sqlite
```

Fallback JSONL path:

```text
$HERMES_HOME/profiles/maestro-operator/state/operator-ledger.jsonl
```

## Model Context Policy

Slack thread context passed to the model should be built from this ledger:

- current authorized user message exactly,
- the most recent one or two relevant thread messages exactly,
- the latest rolling checkpoint for older history,
- linked subjects such as Fabro runs, Kanban tasks, Git branches, and approvals.

Do not pass long raw Slack threads directly to Hermes.
