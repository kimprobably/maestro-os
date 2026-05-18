# Maestro Memory

Use this skill when deciding what to remember, where to persist state, or how to update Maestro operator knowledge.

## Memory Policy

Hermes has two active memory layers:

- Built-in file memory: short, curated `MEMORY.md` / `USER.md` seeds that stay visible and manually reviewable.
- Honcho memory: long-term conversational/user modeling, semantic recall, and derived conclusions across sessions.

Use memory for:

- Tim's stable preferences.
- Current business operating principles.
- Pointers to authoritative docs.
- Small lessons that change future behavior.

Do not use Hermes memory for:

- Full process docs.
- Run histories.
- Customer data.
- Large examples.
- Logs.
- Secrets.
- Anything that needs querying, audit, or rollback.

Do not store secret values in either layer. Credential facts must be presence-only.

## Honcho Usage

Honcho is for "who Tim/Maestro/Miles are becoming over time" context, not for operational ledgers.

- Use `honcho_conclude` for compact, durable conclusions that should help future conversations.
- Use `honcho_search` or `honcho_reasoning` when a Slack conversation depends on prior context that is not in the current thread.
- Prefer concise conclusions with evidence-aware wording. Avoid turning one-off guesses into permanent facts.
- If a conclusion is wrong or sensitive, delete it rather than arguing around it.
- Keep Fabro runs, implementation status, plans, and audits in their ledgers/docs; link or summarize them into Honcho only when they affect future behavior.

## Durable State Locations

- Business/operator architecture: `docs/HERMES-OPERATOR-ARCHITECTURE.md`
- Deployment steps: `docs/HERMES-DEPLOYMENT-RUNBOOK.md`
- Fabro run state: `hermes/run-ledger/`
- Slack routing: `hermes/slack/channel-map.md`
- Agent tasks: Hermes Kanban board
- Repeatable procedures: `hermes/skills/*/SKILL.md`
- Workflow specs: `docs/*WORKFLOW*.md`
- Planning/spec context: operator plan registry and planning repo
- Code evidence: Git branches, PRs, CI artifacts

## Update Rules

When a lesson is learned:

1. If it applies to one run, write it to the run ledger.
2. If it applies to one task, write it to the Kanban task comment.
3. If it applies to a repeatable procedure, update or draft a skill.
4. If it applies to architecture or policy, update a doc.
5. If it is a compact stable preference or pointer, update built-in memory.
6. If it is durable conversational/user context, write a Honcho conclusion.

For risky domains, draft the skill/doc change and request review:

- Payments
- Production deploys
- Outbound sends/imports
- Customer-facing content publishing
- Code generation standards
- Security policies

## Memory Seeds

Use `hermes/memory/MEMORY.seed.md` and `hermes/memory/USER.seed.md` as initial profile memory. Keep them short enough for Hermes memory limits.
