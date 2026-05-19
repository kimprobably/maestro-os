# Agent Bootstrap Rules

Use this checklist before adding any new Maestro agent profile, Slack bot, or long-running specialist.

Default path: run or follow the Fabro workflow in `workflows/hermes/create-agent.fabro`. Manual edits should match that workflow's stages and verification gates.

## 1. Name

- Use a first name of a musician from history unless explicitly grandfathering a legacy name.
- Add the name to `hermes/agents/name-pool.md` as active or reserved.
- Do not reuse a name for two live agents.

## 2. Role Boundary

Every agent needs a crisp ownership boundary before implementation:

- What it owns.
- What it explicitly does not own.
- Which risks require escalation.
- Which tools/MCPs it may use.
- Which mutations are allowed without human approval.

If two agents own the same outcome, one must be the accountable owner and the other must be a support role.

## 3. Profile

Every durable agent gets a Hermes profile:

- `hermes/profiles/<profile>/SOUL.md`
- entry in `hermes/scripts/install-worker-profiles.sh`
- entry in `hermes/agents/registry.json`
- Honcho AI peer mapping in `scripts/hermes/render-honcho-config.mjs`

Profiles are for state separation. They are not security sandboxes.

## 4. Skills And Docs

Each agent must have the skills and docs needed for its domain available in the Railway image.

Required checks:

- profile has the relevant `skills/*/SKILL.md`
- distribution profile includes the Superpowers skills from `https://github.com/obra/superpowers`
- worker install copies the distribution skill set into every durable profile
- each SOUL file names `using-superpowers` as the first skill-discovery step for software work
- required docs exist under `/app/docs` or `/app/hermes`
- required scripts exist under `/app/scripts`
- if a doc/script is needed at runtime, add it to `prepare-railway-gateway-context.sh` and the Dockerfile when it is outside the copied `hermes/` tree

## 5. Memory

Every durable specialist should get a separate Honcho AI peer.

Rules:

- Use Honcho for cross-session domain judgment.
- Use ledgers for operational state.
- Use repo docs/skills for procedures.
- Never store secrets, raw logs, or full run histories in memory.

## 6. Handoff

Every internal specialist needs a bounded handoff command:

```bash
timeout 900 hermes -p <profile> chat -q "<task brief>"
```

The task brief must include:

- objective,
- current state or ledger facts,
- relevant compact Slack context,
- allowed actions,
- forbidden actions,
- exit criteria,
- reporting destination.

Do not pass raw long Slack threads.

## 7. Slack Bot Decision

Default: no separate Slack bot.

Use a separate Slack bot only when direct human interaction with that specialist is frequent enough to justify the extra operational surface.

If creating one:

- use a separate Slack app/token,
- use a separate Railway service/gateway,
- bind it to the specialist profile,
- restrict allowed users/channels,
- document ownership in `registry.json`,
- verify token locks and gateway status independently.

Do not run two profiles through the same Slack app identity.

## 8. Verification

Before calling a new agent live, verify:

- `hermes profile list` shows the profile.
- `hermes -p <profile> memory status` shows the intended provider.
- `hermes -p <profile> honcho status` returns OK when Honcho is enabled.
- required MCPs connect from that profile.
- relevant skills exist in `/data/.hermes/profiles/<profile>/skills`.
- required docs/scripts are visible in `/app`.
- tests cover registry, profile install, memory host mapping, and runtime docs.

## 9. Retirement

If replacing an agent:

- create the new profile first,
- retire the old profile to `/data/.hermes/profiles/.retired`,
- remove stale wrappers,
- remove old Honcho host mappings,
- keep registry history explicit in docs if the name was user-facing.
