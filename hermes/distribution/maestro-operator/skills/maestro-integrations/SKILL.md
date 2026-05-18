# Maestro Native Integrations

Use this skill when connecting or using third-party business systems from the Maestro operator.

## Preference Order

Prefer native Hermes skills before MCP when a native skill exists and is enough:

- GitHub: `github-auth`, `codebase-inspection`, `github-issues`, `github-pr-workflow`, `github-code-review`, `github-repo-management`
- Linear: `linear`
- Mobbin: `mobbin` MCP for design pattern research
- Google Stitch: `stitch` MCP for UI generation and design iteration
- Google Workspace: `google-workspace`
- Slack: gateway platform, channel prompts, and `send_message`
- Email-only Gmail: consider `himalaya` if Google Workspace OAuth is unnecessary

Use MCP when:

- Hermes has no native skill for the service.
- A structured tool surface is materially safer than shell/API calls.
- We need tool allowlists, policy proxies, or deterministic orchestration.

## Specialist Profile Handoffs

Miles is the Slack-facing control room. Specialist profiles are internal workers with their own state, skills, and Honcho peers; they do not run separate Slack gateways by default.

Before creating or renaming an agent, follow `hermes/agents/bootstrap-rules.md`. Prefer `workflows/hermes/create-agent.fabro` because new-agent setup is deterministic enough to run through Fabro.

Use `quincy` for substantial Fabro babysitting, workflow reliability, eval/gate investigations, recovery, and postmortems.

From the Railway gateway, hand off with a bounded terminal command:

```bash
timeout 900 hermes -p quincy chat -q "<task brief>"
```

The task brief must include the run ID or workflow path, current ledger facts, relevant Slack thread/checkpoint, allowed actions, exit criteria, and reporting destination. Do not pass raw long Slack threads; pass the compact thread context and linked ledger subjects.

## Credential Policy

Never print secret values. Credential checks are presence-only.

Required credentials:

- GitHub read access: `GITHUB_TOKEN` or authenticated `gh`.
- GitHub planning repo write access: `GITHUB_PLANNING_REPO` plus either `GITHUB_PLANNING_REPO_SSH_KEY_B64` or `GITHUB_PLANNING_REPO_AUTH=https` with a repo-scoped `GITHUB_TOKEN`.
- Linear: `LINEAR_API_KEY`.
- Mobbin: paid Mobbin account OAuth cached under `$HERMES_HOME/mcp-tokens/mobbin.json`.
- Google Stitch: `STITCH_API_KEY`.
- Google Workspace: OAuth client secret JSON plus generated token files.

Prefer narrow read credentials first. Add write scopes only after a workflow gate exists.

## GitHub Policy

The always-on Slack operator should start with read-only GitHub access:

- repository metadata read
- contents read
- pull request read
- issue read
- Actions/checks/status read if available

Do not use a broad write-capable GitHub token in Railway unless Tim explicitly approves.

GitHub reads are allowed for planning, status, issue/PR inspection, CI review, and codebase context.
Code changes must be routed through Fabro unless Tim explicitly overrides.

Miles has one GitHub write lane: the planning/sandbox repository named by `GITHUB_PLANNING_REPO`.
Use it for working plans, scratch specs, Linear/Fabro handoff docs, and agent-owned planning artifacts.
Do not write to production code repositories from Slack.

Planning repo helper:

```bash
node /app/scripts/hermes/github-planning-repo.mjs status --check-write-auth
node /app/scripts/hermes/github-planning-repo.mjs sync-docs --source /app/docs/operator --prefix docs/operator --message "Sync operator planning context"
node /app/scripts/hermes/github-planning-repo.mjs publish-file --source /tmp/plan.md --path docs/plans/v2-app.md --message "Add V2 app plan"
```

## Linear Policy

Linear reads are allowed for planning and status. Creating/updating issues is allowed when Tim explicitly asks for task tracking or when converting an approved plan into work items.

Use Linear for human-visible business/product tasks. Use Hermes Kanban for agent-internal delegated work.

## Mobbin Policy

Use Mobbin MCP for design reference and pattern research before building or critiquing important UI.

Good Mobbin tasks:

- onboarding, paywalls, upgrade prompts, checkout, permissions, KYC, dashboards, navigation, empty states, settings, and mobile flows
- finding examples from specific categories like fintech, education, productivity, CRM, consumer social, or health
- comparing multiple shipped UI patterns before proposing a Maestro V2 app screen

Mobbin output is design evidence, not product doctrine. Synthesize patterns into Maestro-specific recommendations and keep implementation work routed through Fabro when code changes are needed.

Mobbin MCP setup:

- Endpoint: `https://api.mobbin.com/mcp`
- Config key: `mcp_servers.mobbin`
- Auth: OAuth browser login; no API key.
- On Railway, keep it disabled until OAuth tokens are cached, then the gateway auto-enables it on boot.

## Google Stitch Policy

Use Stitch MCP to turn approved UI direction, Mobbin findings, or product specs into design explorations.

Good Stitch tasks:

- generate first-pass mobile/web screens from a product brief
- iterate visual direction after reviewing Mobbin references
- compare layout alternatives before committing Fabro implementation work
- create design prompts and structured handoff notes for Maestro V2 app planning

Stitch output is a design artifact, not an implementation source of truth. Route production code changes through Fabro. Keep prompts free of secrets and customer-sensitive data.

Google Stitch MCP setup:

- Endpoint: `https://stitch.googleapis.com/mcp`
- Config key: `mcp_servers.stitch`
- Auth: API key in `STITCH_API_KEY`, sent as `X-Goog-Api-Key`.
- On Railway, the gateway auto-enables Stitch when `STITCH_API_KEY` is present.

## Google Workspace Policy

Read/search is allowed after OAuth is configured.

Mutations require explicit approval:

- send/reply email
- create/delete/update calendar events
- create/share/delete Drive files
- modify Docs or Sheets

For content workflows, draft first and request approval before sending or publishing.

## Setup URLs

- GitHub fine-grained PAT: `https://github.com/settings/personal-access-tokens/new`
- Linear personal API key: `https://linear.app/settings/account/security`
- Mobbin MCP setup: `https://docs.mobbin.com/mcp/clients/claude-code`
- Google Stitch MCP setup: `https://stitch.withgoogle.com/docs/mcp/setup/`
- Google Cloud project selector: `https://console.cloud.google.com/projectselector2/home/dashboard`
- Google API library: `https://console.cloud.google.com/apis/library`
- Google OAuth credentials: `https://console.cloud.google.com/apis/credentials`
- Google OAuth test users: `https://console.cloud.google.com/auth/audience`
