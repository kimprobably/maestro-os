# Hermes Deployment Runbook

Status: v0 external-service runbook, 2026-05-14

This runbook assumes nothing runs on Tim's Mac except one-off inspection. The operator runs in an external service.

## Required Credentials

Presence-only checks. Never print secret values.

Core:

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_ALLOWED_USERS`
- `SLACK_HOME_CHANNEL`
- Hermes `openai-codex` auth from `hermes auth add openai-codex`
- Optional fallback: `OPENROUTER_API_KEY`

Execution:

- `DAYTONA_API_KEY`
- `DAYTONA_ORGANIZATION_ID` when required by API calls
- GitHub auth for run branches, CI checks, and PRs
- `FABRO_SERVER` set to the Railway API URL, not the web origin
- `FABRO_DEV_TOKEN` for one-time `fabro auth login`

Memory:

- Optional `HONCHO_API_KEY` for long-term Honcho memory.
- Optional `HONCHO_ENVIRONMENT`, `HONCHO_WORKSPACE`, and `HONCHO_RECALL_MODE` for memory routing.

Business MCPs, add only when channel policy is ready:

- Linear
- Beehiiv
- Vercel
- Railway
- Stripe
- Plusvibe or outbound stack

## Host Choice

Preferred v0:

1. Run Hermes gateway on Daytona for one smoke week if always-on cost is acceptable.
2. Keep Railway ready as the gateway fallback.
3. Use Daytona either way for Codex worker lanes and Fabro sandbox recovery.

Daytona must be created with auto-stop disabled for the gateway:

```python
sandbox = daytona.create(CreateSandboxFromSnapshotParams(
    snapshot="maestro-hermes-gateway",
    auto_stop_interval=0,
))
```

Do not rely on a background gateway process to keep a default Daytona sandbox alive. Daytona docs say background scripts and long-running internal processes do not reset the inactivity timer.

## Files To Install

Copy or sync this repo's `hermes/` package into the profile home:

```text
hermes/config/config.example.yaml
hermes/profiles/*/SOUL.md
hermes/skills/fabro-babysitter/SKILL.md
hermes/skills/maestro-integrations/SKILL.md
hermes/skills/maestro-memory/SKILL.md
hermes/skills/maestro-skill-governance/SKILL.md
hermes/skills/maestro-spec-planning/SKILL.md
hermes/slack/channel-map.md
hermes/kanban/seed-board.md
hermes/run-ledger/*
hermes/memory/*.seed.md
```

Suggested persistent paths:

```text
/workspace/maestro-os                         # repo checkout
/home/daytona/volume/maestro-hermes           # Daytona volume mount
/home/daytona/volume/maestro-hermes/.hermes   # HERMES_HOME
/home/daytona/volume/maestro-hermes/ledger    # SQLite/JSONL ledger
```

Set `HERMES_HOME` to the persistent profile home before running the gateway.

## Specialist Profiles

The gateway installs these specialist profiles idempotently on every Railway boot:

- `smith`: engineering and deploy worker.
- `johann`: email/content drafting worker.
- `quill`: outbound/GTM worker.
- `quincy`: Fabro babysitting, workflow reliability, evals, run recovery, and postmortems.

The `quincy` profile is the default specialist for substantial Fabro work. Miles should keep Slack control-room ownership, then hand off durable Fabro runs, workflow fixes, and eval investigations to `quincy` with clear exit criteria.

When `HONCHO_API_KEY` is present, every specialist profile gets `memory.provider: honcho` and a separate Honcho AI peer in the shared `maestro` workspace. This lets each profile learn within its domain without merging its observations into Miles' general operator peer.

For new agents, follow `hermes/agents/bootstrap-rules.md` and prefer `workflows/hermes/create-agent.fabro`. The important default is: create an internal Hermes profile first, give it a registry entry and Honcho peer, then add a separate Slack bot only when direct specialist conversation is frequent enough to justify a second gateway.

## Learning Loop Policy

The gateway profile should keep memory/user modeling enabled, keep skill creation nudges active, and run the curator on an idle daily cadence. Do not let Hermes self-evaluation promote important operating policy by itself.

Production settings:

- `agent.reasoning_effort: xhigh`
- `memory.memory_enabled: true`
- `memory.user_profile_enabled: true`
- `memory.provider: honcho` when `HONCHO_API_KEY` is present.
- `memory.nudge_interval: 4`
- `skills.creation_nudge_interval: 4`
- `skills.guard_agent_created: true`
- `curator.enabled: true`
- `curator.interval_hours: 24`

The Railway entrypoint enforces these keys on every boot because the profile config is preserved across deployments. Honcho config is written to `$HERMES_HOME/honcho.json` without embedding the API key; the key stays in Railway/profile env.

Curated Maestro skills are repo-owned. The deploy image patches Hermes' `skill_manage` tool so background self-improvement cannot patch, edit, delete, or add support files to non-agent-created skills. Generated skills can still be created and later promoted through evidence.

Run a skill promotion gate before trusting a generated skill for high-impact work:

```bash
npm run hermes:skill-eval -- --candidate path/to/SKILL.md --allow-fallback false
```

The command writes `.workflow/hermes-skill-governance/skill-promotion-report.json` and runs Promptfoo when model credentials are available.

## Day 0 Setup

1. Create or choose the gateway host.
2. Mount persistent storage:
   - Daytona: a shared volume with a `maestro-hermes/gateway` subpath.
   - Railway: a volume mounted at `/app/.hermes` or another explicit path.
3. Install Hermes from upstream.
4. Clone `maestro-os`.
5. Run `hermes/scripts/bootstrap-external-host.sh --install-hermes --install-fabro`.
   This installs Fabro from Homebrew nightly where available, otherwise the
   latest upstream nightly release artifact, then verifies `fabro mcp`.
6. Run `hermes/scripts/install-worker-profiles.sh`.
7. Replace Slack channel placeholders in the generated `maestro-operator` profile `config.yaml`.
8. Add Slack tokens to the profile `.env`.
9. Set `FABRO_SERVER=https://fabro-maestro-production.up.railway.app/api/v1`.
10. Run `fabro auth login --server "$FABRO_SERVER" --dev-token "$FABRO_DEV_TOKEN"`.
11. Run `maestro-operator auth add openai-codex`.
12. Configure OpenRouter fallback if needed.
13. Confirm Fabro MCP exposes only the Fabro tools initially.
14. Start the Slack gateway in the foreground for the first smoke.
15. Invite the bot to `#agent-control`, `#maestro`, and `#fabro-runs`.

## Smoke Tests

Run these without printing secrets:

```bash
command -v hermes
hermes --version
hermes -p maestro-operator doctor
hermes -p maestro-operator auth list
hermes -p maestro-operator mcp list
fabro --version
fabro mcp --help
```

Slack smoke:

- DM the bot and confirm it responds.
- Mention the bot in `#agent-control`.
- Confirm unauthorized users are blocked or paired.
- Confirm thread replies work with `!help` where slash commands are blocked by Slack threads.

Model smoke:

```bash
hermes -p maestro-operator chat -q "Reply with the provider and model you are using. Do not inspect secrets."
```

Fabro smoke from Slack:

```text
Use fabro-babysitter to inspect recent Fabro runs. Report only run IDs, statuses, and next actions.
```

Kanban smoke:

```bash
hermes -p maestro-operator kanban init --name maestro-ops
hermes -p maestro-operator kanban create "Inspect Fabro MCP availability" --assignee maestro-operator
```

Adjust exact Kanban commands if Hermes CLI syntax changes; the required outcome is a durable board with task history.

## First Real Run

From `#fabro-runs`, ask:

```text
Use fabro-babysitter. Start and babysit workflows/phase1/test-run.fabro. Persist every meaningful state change to the run ledger. Summarize without dumping logs or secrets.
```

Expected behavior:

1. Babysitter checks MCP availability.
2. Creates or updates a run-ledger record.
3. Starts the submitted run if needed.
4. Polls with `fabro_run_gather`.
5. Reads events with `fabro_run_events`.
6. Reads durable state with `fabro_run_interact(get)`.
7. Classifies failures if any.
8. Reports status and next action.

## Cron Jobs

Create one operator cron after manual smoke passes:

```bash
hermes -p maestro-operator cron create "every 30m" \
  "Use fabro-babysitter. Inspect active Fabro runs, update the run ledger, and report only exceptions to the Slack home channel." \
  --skill fabro-babysitter \
  --name "Fabro run babysitter"
```

Cron prompts must be self-contained because Hermes cron jobs run fresh sessions.

## Week 1 Evaluation

Track:

- Slack reconnects and missed messages.
- Daytona always-on cost.
- Context-window pressure.
- Codex subscription limits.
- OpenRouter fallback frequency.
- MCP tool list noise.
- Fabro control-plane failures.
- Number of human interruptions required.
- Whether the run ledger is complete enough to resume after a crash.

Go/no-go:

- Keep Daytona gateway if uptime and cost are acceptable.
- Move gateway to Railway if Daytona service operation is awkward.
- Keep Daytona for workers either way.

## Escalation Rules

Escalate to Tim only for:

- Missing required credentials by key name only.
- Production deploy approval.
- Customer-facing send/import approval.
- Refund, charge, or payment mutation approval.
- Ambiguous legal/compliance issue.
- Repeated deterministic failure requiring product direction.
- Human testing or App Store submission.

Everything else should be handled by Kanban, Fabro, run ledger, and scheduled summaries.
