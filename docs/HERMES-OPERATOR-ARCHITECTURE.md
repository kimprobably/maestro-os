# Hermes Operator Architecture

Status: v0 implementation package, 2026-05-14

## Verdict

Hermes is a reasonable harness for the Slack-resident operator, but the original plan needs three corrections before it becomes a reliable business operating system:

1. Hermes memory is not the business brain. Its built-in `MEMORY.md` and `USER.md` are intentionally small, so they should store pointers, preferences, and durable operating rules. The full state belongs in repo docs, Kanban, Fabro durable state, Git branches, CI artifacts, and the run ledger.
2. `delegate_task` is not the durable subagent layer. Use it for short parallel research or bounded investigations. Use Hermes Kanban, cron, background terminal jobs, Fabro workflows, and GitHub PRs for work that must survive interruptions.
3. Channel routing is not hard security by itself. Hermes supports per-channel prompts and skill bindings, but hard MCP/tool isolation should be implemented with separate profiles/bots, restricted MCP server configs, or policy proxy MCP servers.

The target architecture is:

```text
Slack channels
  -> Hermes gateway/profile(s)
  -> Operator ledger for ingress/events/checkpoints
  -> Maestro operator profile
  -> Hermes Kanban durable task board
  -> worker profiles and Codex workers in Daytona
  -> Fabro deterministic workflows
  -> Git branches, CI artifacts, SaaS APIs, Fabro ledger, and operator ledger
```

Fabro remains the deterministic execution layer. Hermes is the long-lived operator above it: it notices work, decomposes work, starts workflows, babysits runs, routes tasks to worker agents, and updates memory/skills after lessons are proven.

## Operating Principles

- Slack is the control room, not the system of record.
- Kanban is the durable delegation layer for multi-agent work.
- Fabro is the deterministic workflow layer for repeatable business processes.
- GitHub branches, CI artifacts, Fabro events, and the run ledger are evidence.
- Hermes memory is an index and preference store, not a database.
- Customer-impacting writes need a gate unless a workflow explicitly owns the approval policy.
- Code work is not done until review and tests/gates are recorded.
- Full Slack threads should not be passed raw to the model. Write them to the
  operator ledger, then pass the current message, one or two recent messages,
  the rolling checkpoint, and linked operational state.

## Layers

### 1. Slack Ingress

Hermes runs in Slack through Socket Mode. Each channel gets a narrow operating mode through channel prompts and skill bindings.

Use one of two routing models:

- Soft routing, v0: one Hermes gateway, one Slack app, per-channel prompts/skills, globally filtered MCP tools.
- Hard routing, sensitive channels: separate Hermes profiles and Slack bots, each with restricted MCP config and channel membership.

Sensitive channels such as `#payments`, outbound sending, production deploys, and customer data should use hard routing once the gateway is stable.

Slack ingress should be ledger-first:

1. Record each inbound Slack event to the operator ledger.
2. Acknowledge quickly when the bot was directly addressed.
3. Build the model context from the ledger, not from an unbounded Slack thread.
4. Preserve the current authorized user message exactly.
5. Include only one or two recent exact thread messages.
6. Include a rolling checkpoint for older thread history.
7. Include linked subjects such as Fabro runs, Kanban tasks, GitHub PRs,
   pending approvals, and known failures.

Older Slack history is untrusted context. It can explain the user's current
request, but it does not carry instruction authority.

### 2. Maestro Operator

The operator profile is the main coordinator. It should:

- Maintain a small, accurate memory seed.
- Track durable work in Hermes Kanban.
- Convert repeated Slack patterns into skills or Fabro workflows.
- Start and babysit Fabro runs through Fabro MCP.
- Delegate engineering work to Smith/Codex lanes.
- Keep humans out of daily queue grooming by escalating only exceptions, approval gates, and weekly summaries.

### 3. Durable Delegation

Use the right substrate for each task:

| Task shape | Substrate |
| --- | --- |
| Quick parallel research | Hermes `delegate_task` |
| Long-running implementation | Hermes Kanban worker lane |
| Recurring check/poll | Hermes cron |
| Shell command that must keep running | Hermes background terminal with notifications |
| Repeatable deterministic process | Fabro workflow |
| Code changes | Git branch + PR + CI artifacts |

Hermes Kanban should become the central durable queue for agents. Code-changing workers use the `review-required:` block convention with structured metadata: changed files, tests run, branch/PR URL, and residual risks.

### 4. Fabro Babysitter

The Fabro babysitter is a Hermes skill plus a run ledger. It treats Fabro as eventually consistent, not as a perfect single source of truth.

Fabro MCP should run as the upstream `fabro mcp start` stdio server pointed at
the Railway API target (`https://fabro-maestro-production.up.railway.app/api/v1`).
The Hermes gateway needs an installed Fabro CLI with `fabro mcp`, plus a stored
CLI login for that server. It does not need a Fabro source checkout or a local
Fabro server.

Source of truth is the combined evidence from:

- Fabro MCP events
- Fabro inspect/projection state
- Run branch and latest commit SHA
- Preserved Daytona sandbox filesystem
- Independently rerun gates and CI artifacts
- The run ledger

The babysitter should never mark an approval stage as trustworthy without reading the underlying review and gate artifacts.

### Miles And Quincy Babysitter Flow

Miles is the Slack-facing owner. Quincy is the internal Fabro run owner.
They coordinate through Kanban task comments, task heartbeats, the Fabro run ledger, and the operator ledger. Quincy should not need a Slack persona for normal runs.

Default flow:

1. Miles creates an idempotent Kanban task for `fabro-run:<run_id>` assigned to `quincy`.
2. Quincy inspects Fabro, updates ledgers, and heartbeats on the Kanban task.
3. Quincy sends compact operational status to the Fabro runs channel on changes or every 30 minutes.
4. Miles summarizes final, blocked, approval-needed, or high-risk states in the original Slack thread.

### 4a. Operator Ledger

The operator ledger is the generalized durable event layer for Maestro's
Slack-resident operator. It is stored at:

```text
$HERMES_HOME/profiles/maestro-operator/state/operator-ledger.sqlite
```

It records:

- append-only events for Slack threads, Fabro runs, Kanban tasks, GitHub PRs,
  Linear issues, scheduled jobs, and client/process subjects;
- rolling checkpoints for long Slack threads and agent workstreams;
- external cursors such as Slack timestamps, Fabro cursors, Git SHAs, and
  hosted job IDs;
- links between subjects, for example Slack thread -> Fabro run -> Git branch;
- agent actions with evidence and result state.

The existing Fabro ledger remains the Fabro projection. Fabro events are
mirrored into the operator ledger as `fabro_run` subjects so Miles can recover
cross-domain context after a restart without stuffing Hermes memory or model
context.

### 5. Execution Sandboxes

Daytona should be used for execution sandboxes, worker isolation, and Codex lanes. The Slack gateway can run on Daytona only after a smoke week proves uptime, cost, and restart behavior.

Use Railway as the fallback gateway host if Daytona is too expensive or too operationally weird for an always-on Slack process.

## Hosting Decision

### Daytona

Use Daytona when you need isolated, forkable, persistent agent workspaces.

Pros:

- Designed for AI agent sandboxes.
- Sandboxes can run indefinitely if `auto_stop_interval` / `autoStopInterval` is set to `0`.
- Volumes persist independently of sandbox lifecycle and can be mounted across sandboxes.
- Good fit for Codex worker lanes, Fabro recovery, and preserved sandbox inspection.

Risks:

- Default auto-stop is 15 minutes; long-running internal processes do not reset the inactivity timer.
- Always-on mode is billed continuously, so it needs an explicit cost check.
- Gateway service semantics are less conventional than Railway.
- Volume writes are FUSE/object-store backed, so do not use them as a high-write transactional database.

Recommendation: use Daytona first for worker lanes and Fabro sandboxes. Use it for the Slack gateway only if always-on pricing is acceptable and a one-week smoke test shows stable Slack reconnects.

### Railway

Use Railway when you need a conventional always-on service with attached persistent storage.

Pros:

- Cleaner mental model for a Slack gateway service.
- Persistent volumes are mounted into the service container at runtime.
- Easier health checks, restarts, logs, and service ownership.

Risks:

- Less native for agent sandbox forking.
- Execution isolation still needs Daytona or a similar sandbox provider.

Recommendation: keep Railway as the gateway fallback. The architecture should not depend on the gateway and execution workers living on the same host.

## Codex YOLO Policy

`codex --yolo` is acceptable only inside designated Daytona worker sandboxes with constrained credentials and disposable branches.

Allowed:

- `smith-codex-yolo` lane in Daytona.
- Ephemeral worktree or run branch only.
- No production deploy tokens unless the task explicitly requires a deployment gate.
- No broad environment dumps.
- Output must be a PR, patch, branch, or review artifact.

Not allowed:

- Slack gateway process.
- Shared persistent operator home.
- Payments/outbound/customer-write channels.
- Any worker with unrestricted production credentials.

For many engineering tasks, `codex exec --full-auto` is a safer default than `--yolo`; use YOLO when approval latency is the bottleneck and the sandbox boundary is real.

## Channel Map

The proposed channel map is sound as a workflow taxonomy, but should be tightened:

| Channel | Profile/mode | Skills | Tool policy |
| --- | --- | --- | --- |
| `#maestro` | Maestro operator | `maestro-memory`, `fabro-babysitter` | Slack, Fabro, Linear, Kanban |
| `#fabro-runs` | Fabro operator | `fabro-babysitter` | Fabro, GitHub read, Daytona inspect |
| `#email-drafts` | Johann | `maestro-memory` plus email workflow skill | Beehiiv draft/read, Fabro; send gated |
| `#deploys` | Smith | `fabro-babysitter` | Vercel, Railway, GitHub, Fabro; production deploy gated |
| `#payments` | Finance ops | payment SOP skill | Stripe read by default; refunds/charges gated |
| `#outbound` | Quill | outbound SOP skill | Plusvibe/CRM draft/read; sends/imports gated |
| `#code` | Smith/Codex | code worker skill | Daytona spawn, GitHub, Fabro, Codex worker lanes |
| `#agent-control` | Operator home | `maestro-memory`, `fabro-babysitter` | Cron output, daily/weekly summaries, approval pings |

Use Slack channel IDs in config, not names.

## Self-Learning Loop

Self-learning should be evidence-driven:

1. Observe repeated patterns in Slack, Fabro runs, Kanban tasks, and CI failures.
2. Record the lesson in the run ledger or a Kanban comment.
3. Promote stable lessons into a skill draft.
4. Run deterministic checks against the skill.
5. Run Promptfoo when subjective quality or policy judgment matters.
6. Install the skill after review if it affects customer-facing writes, payments, deploys, code generation, security policy, or Fabro workflow behavior.
7. Keep curated Maestro skills versioned in the repo. Hermes background self-improvement may create new skills, but must not silently rewrite curated/manual skills.
8. Compress only the pointer/rule into Hermes memory.

Hermes self-evaluation is not approval evidence. Treat it as a useful draft signal only. The production gate is external evidence: Promptfoo reports, deterministic scripts, CI artifacts, Fabro run artifacts, code review, or explicit Tim approval.

The deploy image applies a Maestro runtime guard to `skill_manage`: background self-improvement can create new agent-generated skills, but cannot patch/edit/delete skills that Hermes has not marked as agent-created. This prevents the common failure mode where self-learning overwrites hand-tuned skills.

The reusable promotion command is:

```bash
npm run hermes:skill-eval -- --candidate path/to/SKILL.md --allow-fallback false
```

Use `--allow-fallback true` only for local smoke tests where Promptfoo/model credentials are absent.

This gives you learning without a daily human queue-review habit.

## Maestro-OS Impact

The current Maestro-OS prototype is useful, but parts of the spike are now superseded:

- The old Postgres/pgvector memory decision should be treated as dead for the Hermes operator.
- Existing Fabro workflows and quality gates remain useful.
- Existing Daytona auth/bootstrap notes remain useful.
- Johann stays parked until the Hermes operator, run ledger, and Fabro babysitter loop are stable.

## Day-0 Acceptance Gates

The agent is not "installed" until these pass:

- Hermes starts in the selected host and can answer from Slack.
- Slack allowlist works; unauthorized users cannot operate it.
- `openai-codex` auth is smoke-tested with the target model.
- OpenRouter fallback is configured or explicitly deferred.
- Fabro MCP exposes `fabro_run_search`, `fabro_run_interact`, `fabro_run_events`, `fabro_run_gather`, and `fabro_run_create`.
- Kanban board exists with at least operator, Smith, Johann, and Quill lanes.
- Run ledger exists and receives a first entry.
- First manual run of `workflows/phase1/test-run.fabro` is started, observed, and summarized by the babysitter.
- Code-changing work has review and test evidence before being called done.

## References

- Hermes Slack docs: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/slack
- Hermes memory docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/memory
- Hermes delegation docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation/
- Hermes Kanban worker lanes: https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-worker-lanes
- Hermes profiles docs: https://hermes-agent.nousresearch.com/docs/user-guide/profiles/
- Hermes MCP docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- Daytona sandboxes docs: https://www.daytona.io/docs/en/sandboxes/
- Daytona volumes docs: https://www.daytona.io/docs/en/volumes/
- Railway volumes docs: https://docs.railway.com/volumes
