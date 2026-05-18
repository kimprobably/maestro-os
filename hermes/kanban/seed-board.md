# Maestro Kanban Seed

Hermes Kanban is the durable delegation layer. The operator should create tasks here instead of relying on Slack memory or daily human queue review.

## Lanes

| Assignee | Role | Notes |
| --- | --- | --- |
| `maestro-operator` | Orchestrator | Decomposes work, creates child cards, avoids implementation when possible |
| `fabro-babysitter` | Run operator | Monitors Fabro, updates run ledger, escalates exceptions |
| `smith` | Engineering worker | Implements code, infra, deploys |
| `smith-codex-yolo` | Fast code worker | Daytona-only, disposable branch, constrained credentials |
| `smith-reviewer` | Review worker | Reviews code and gate evidence |
| `johann` | Email/content drafter | Drafts only until send/publish approval |
| `quill` | Outbound worker | Draft/research only until send/import approval |
| `ops-admin` | Business ops | Linear, calendar, admin, setup tasks |

## Worker Completion Convention

Terminal/research tasks can complete directly with a clear summary.

Code-changing tasks should add a structured comment, then block:

```text
reason: review-required: code changes need review
metadata:
  changed_files:
  tests_run:
  branch_or_pr:
  decisions:
  residual_risks:
```

Reviewer unblocks after approval or comments with requested changes.

## Initial Tasks

1. `Install Hermes gateway on selected host`
   - Assignee: `ops-admin`
   - Exit: Slack DM and `#agent-control` smoke pass.

2. `Smoke openai-codex provider`
   - Assignee: `maestro-operator`
   - Exit: provider/model confirmed without secret inspection.

3. `Configure Fabro MCP allowlist`
   - Assignee: `fabro-babysitter`
   - Exit: five Fabro tools visible and callable.

4. `Initialize run ledger`
   - Assignee: `fabro-babysitter`
   - Exit: schema applied or JSONL fallback created.

5. `Run workflows/phase1/test-run.fabro`
   - Assignee: `fabro-babysitter`
   - Exit: run started, observed, ledgered, summarized.

6. `Create Smith Codex worker lane`
   - Assignee: `smith`
   - Exit: Daytona sandbox can run Codex in a disposable branch.

7. `Create Johann draft-only lane`
   - Assignee: `johann`
   - Exit: draft skill installed; Beehiiv send/publish gated.

8. `Create Quill draft-only lane`
   - Assignee: `quill`
   - Exit: outbound send/import gated.

9. `Decide gateway host after one-week smoke`
   - Assignee: `maestro-operator`
   - Exit: Daytona keep/move-to-Railway decision with cost and uptime evidence.
