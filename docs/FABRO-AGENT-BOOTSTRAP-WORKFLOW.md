# Fabro Agent Bootstrap Workflow

Status: v0 deterministic workflow.

Use `workflows/hermes/create-agent.fabro` whenever a new Maestro agent profile needs to be created or a specialist needs to be promoted into a durable role.

## Why This Is A Fabro Workflow

Agent creation is repeatable and has deterministic stages:

- validate name, role, scope, and secret safety,
- create the Hermes profile prompt,
- update the agent registry,
- update the musician name pool,
- add the profile to worker installation,
- generate a Slack bot manifest and setup pack when requested,
- verify all artifacts,
- produce a handoff.

Anything we need to do twice should live in Fabro if the stages are deterministic. New agent bootstrapping now meets that bar.

## Workflow

- Workflow: `workflows/hermes/create-agent.fabro`
- Run config: `workflows/hermes/create-agent.toml`
- Script: `scripts/hermes/bootstrap-agent.mjs`

## Inputs

- `agent_name`: musician first name, e.g. `Nina`.
- `agent_role`: short role boundary.
- `agent_owns`: comma-separated ownership list.
- `agent_current_focus`: current operating focus.
- `agent_slack_bot`: `true` or `false`.
- `agent_reporting_channel`: optional Slack channel ID or label.

## Outputs

- `hermes/profiles/<profile>/SOUL.md`
- `hermes/agents/registry.json`
- `hermes/agents/name-pool.md`
- `hermes/scripts/install-worker-profiles.sh`
- `.workflow/hermes-agent-bootstrap/plan.md`
- `.workflow/hermes-agent-bootstrap/verify.json`
- `.workflow/hermes-agent-bootstrap/handoff.md`
- when Slack bot is requested:
  - `hermes/agents/slack/<profile>-manifest.json`
  - `docs/operator/agent-slack/<profile>-setup.md`

## Slack Bot Boundary

The workflow does as much Slack bot work as is deterministic:

- generates a Slack app manifest,
- writes setup instructions,
- records that a separate Slack app and separate Railway gateway are required.

It does not pretend to finish Slack installation without admin action. The live install still requires a human/admin to create or import the Slack app, install it to the workspace, capture clean token values, and configure a separate Railway service.

Default policy: do not create a separate Slack bot unless direct human interaction with the specialist is frequent enough to justify another gateway.

## Verification

Run:

```bash
node --test scripts/hermes/test-bootstrap-agent-workflow.mjs
fabro validate workflows/hermes/create-agent.fabro --no-upgrade-check
```

When used inside Fabro, the `verify_agent_artifacts` stage also runs the agent registry and specialist profile tests.
