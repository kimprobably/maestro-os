# Workflow Standards

Status: draft v0.1 for Tim review

## Required Shape

Every Fabro workflow must have:

- A clear goal in graph metadata.
- A persona.
- Explicit inputs and outputs.
- Validators after every stage that emits user-facing or machine-consumed output.
- A failure path that posts a persona-scoped message explaining what failed.
- A final run-summary event.
- Memory append only when the workflow learned something durable.

## Gates

Use STOP gates for irreversible or expensive actions:

- Send email or LinkedIn messages.
- Queue campaigns.
- Merge, deploy, publish, delete, migrate, or archive.
- Spend enrichment credits at scale.
- Write durable long-term memory.

Use FLAG gates for reviewable but reversible actions:

- Draft approval.
- Quality concerns.
- Ambiguous inputs.
- Low-confidence context.

STOP gates must include:

- What will happen if approved.
- What data or files will change.
- Cost/spend exposure if relevant.
- Approve, reject, and edit/revise paths.

## Context

Workflow context must be explicit and cited:

- Unblocked MCP and similar tools feed the context-research-agent.
- Workers consume a stable `context-brief.md`; they do not independently rediscover broad context unless assigned.
- Memory reads must include namespace and source labels.
- Long-term memory writes go through the memory-curator-agent by default.

## Agent Fanout

Use fanout only when write sets or review responsibilities are independent.

Required roles for code-generation workflows:

- Spec agent.
- Spec review agent.
- ADR manager when architecture may change.
- Implementation planner.
- Worker agents with disjoint write sets.
- Correctness reviewer.
- Test reviewer.
- Quality gate agent.

Add security, migration, dependency, performance, and ADR reviewers when the spec risk tags require them.

## Deterministic Quality Gates

Every workflow that changes code must run the relevant deterministic checks before final handoff.

Rust default:

- `cargo fmt --check`
- `cargo clippy --workspace --all-targets --all-features -- -D warnings`
- `cargo nextest run` or `cargo test`
- `cargo test --doc`
- `cargo deny check` when dependency changes are present
- `RUSTDOCFLAGS="-D warnings" cargo doc` for public crates

TypeScript default:

- Package/app-scoped typecheck.
- Package/app-scoped tests.
- Lint/format check.
- Framework-specific checks from current official docs when adding framework code.

## GTM Workflow Rules

Before scaling list-building:

1. Generate or load the ICP.
2. Probe roughly 100 contacts.
3. Score the probe.
4. Gate scale-up on A+B qualification rate.

Phone enrichment is opt-in. Visual/human review belongs before expensive enrichment when the list could include competitors or bad-fit accounts.

Cold outreach workflows must validate:

- Deliverability prerequisites.
- Lead has usable contact data.
- Body length.
- Banned phrases.
- Voice match.
- One clear CTA.
- Specific hook tied to lead/company context.

## Failure Behavior

On failure:

- Emit a structured failure event.
- Post a persona message in the Slack thread when a thread exists.
- Include the failing stage, cause, retryability, and recommended next action.
- Do not mark a run successful if any required validator failed.

## Registration

`maestro workflow register <path>` must:

- Validate DOT syntax.
- Validate required metadata.
- Validate gates for irreversible operations.
- Validate referenced prompts/knowledge files exist.
- Record a registration event.
