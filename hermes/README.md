# Maestro Hermes Package

This directory contains the v0 install package for the Maestro Slack-resident operator.

Contents:

- `config/config.example.yaml` - Hermes config template with Slack, MCP, and channel routing placeholders.
- `profiles/*/SOUL.md` - profile prompts for the operator and worker roles.
- `skills/fabro-babysitter/SKILL.md` - Fabro run operator loop.
- `skills/maestro-memory/SKILL.md` - memory discipline for Maestro.
- `slack/channel-map.md` - channel-to-profile/tool policy.
- `kanban/seed-board.md` - lanes and first tasks.
- `run-ledger/` - durable Fabro run ledger schema and event shape.
- `memory/` - initial bounded Hermes memory seeds.
- `scripts/check-hermes-prereqs.sh` - presence-only gateway prerequisite check.
- `scripts/bootstrap-external-host.sh` - external host installer for the distribution, memory seeds, and run ledger.
- `scripts/install-worker-profiles.sh` - creates Smith, Johann, Quill, and `quincy` profiles from the operator profile.
- `distribution/maestro-operator/` - installable Hermes profile distribution.

Install this into the external Hermes host, not Tim's Mac. Use Daytona for the first smoke if always-on cost is acceptable; otherwise use Railway for the Slack gateway and Daytona for worker sandboxes.

`quincy` is the specialist DevOps/Fabro profile. It owns Fabro run
babysitting, workflow reliability fixes, eval/gate investigations, recovery,
and postmortems. With Honcho enabled, it gets a separate AI peer in the shared
Maestro workspace so it can accumulate Fabro-specific operating judgment.

Local install command from a checked-out repo:

```bash
hermes profile install ./hermes/distribution/maestro-operator --alias --yes
```

External-host bootstrap:

```bash
hermes/scripts/bootstrap-external-host.sh --install-hermes --install-fabro
hermes/scripts/install-worker-profiles.sh
```

Fabro MCP is launched through the upstream `fabro mcp start` stdio command and
targets the Railway API in `FABRO_SERVER`. The Hermes host needs a Fabro
nightly CLI with `fabro mcp` available and a stored `fabro auth login`; it does
not need a Fabro source checkout or a local Fabro server.
