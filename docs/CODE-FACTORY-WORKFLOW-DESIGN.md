# Code Factory Workflow Design

Status: draft guardrail for Phase 2. Do not implement until the Phase 1 Fabro go/no-go is complete.

## Goal

Fabro should generate code through a spec-first workflow, not by sending one coding agent directly into a repo. The workflow should make the artifacts explicit, run multiple independent review passes, and require human approval before irreversible steps such as merge, deploy, migration, or broad refactor.

## Agent Roles

- `context-research-agent`: gathers repo/product/team context before spec work, using Unblocked MCP and local docs, then writes a cited `context-brief.md`.
- `memory-curator-agent`: reads approved specs, ADRs, run summaries, and reviewer outcomes, then writes durable facts to the shared memory system. It is the only default long-term memory writer.
- `spec-agent`: turns the user request into a structured spec with scope, non-goals, acceptance criteria, touched systems, risks, and verification plan.
- `spec-review-agent`: reviews the spec for ambiguity, missing edge cases, hidden migrations, and mismatched product intent.
- `adr-manager-agent`: checks whether the change needs an ADR, reads existing ADRs, drafts or updates ADRs, and blocks implementation until architecture decisions are recorded.
- `app-framework-selection-agent`: decides which output framework or template a generated application should use. Fabro stays the factory runtime; app frameworks such as Rig are selected only for the software being built.
- `implementation-planner-agent`: converts the approved spec into a file-scoped implementation plan with ownership boundaries and test strategy.
- `worker-agent`: implements one bounded slice. Multiple workers can run in parallel only when their write sets are disjoint.
- `correctness-review-agent`: reviews behavior, data flow, failure modes, and acceptance criteria coverage.
- `test-review-agent`: reviews test quality, regression coverage, and whether verification commands actually exercise the risk.
- `security-review-agent`: runs for auth, webhooks, secrets, user input, network calls, and third-party integrations.
- `migration-review-agent`: runs for schema changes, deprecations, data movement, or compatibility breaks.
- `dependency-review-agent`: checks dependency/license/supply-chain risk when packages or toolchains change.
- `performance-review-agent`: runs when hot paths, queries, queues, or build/runtime cost can regress.
- `adr-review-agent`: checks that ADR text matches the implementation and that code did not introduce unrecorded architectural decisions.
- `quality-gate-agent`: runs deterministic tools and CI-equivalent checks, then blocks handoff on failures.
- `integration-agent`: applies reviewer fixes, resolves conflicts, reruns verification, and prepares the final handoff.

## Workflow Shape

1. Context research -> `context-brief.md`.
2. Memory brief -> query approved durable memory and append it to `context-brief.md` with source labels.
3. Parse request -> Spec Kitty work package with `spec.md` and `spec.json`.
4. Parallel spec reviews -> issue list.
5. Human gate: approve spec or revise.
6. ADR scan -> `adr-required: true|false`; draft ADR when required.
7. ADR review.
8. Human gate: approve ADR or revise.
9. Framework/template selection for generated apps.
10. Implementation plan with file ownership.
11. Human gate for high-risk plans only.
12. Dispatch worker agents by disjoint write set.
13. Integrate patches.
14. Parallel review agents.
15. Fix loop until reviewers clear or max attempts reached.
16. Quality gate runs deterministic commands and CI-equivalent checks.
17. Memory curator writes approved learnings.
18. Human gate: approve merge/release.

## Output App Frameworks

Fabro remains the factory runtime and orchestration layer. It owns workflow execution, Slack gates, Daytona sandboxes, reviewer fanout, run state, and quality gates.

Rig is an output-framework candidate for Rust AI applications that the factory builds. Use it for app templates that need provider abstraction, agents, RAG, embeddings, vector stores, or lightweight AI pipelines. Do not replace Fabro's runtime, workflow engine, or current provider integration with Rig during Phase 2.

Phase 2 should add a pinned `templates/ai-rust-app-rig/` blueprint before any deeper integration. The first spike should prove:

- OpenRouter and direct provider calls through Rig work with our env/auth conventions.
- Tool calls and streaming are compatible with the product patterns we expect.
- RAG/vector-store setup can be generated and reviewed predictably.
- The generated app still passes the Rust quality gates below.

## Quality Stack

- Spec Kitty is the spec/work-package state layer. Fabro workflows should create and update specs throughout the run rather than treating specs as a one-time prompt.
- Unblocked MCP is a context broker for the context-research-agent. Do not let every worker query it independently; workers consume the brief so context stays cited and stable.
- Qlty is the baseline deterministic review layer for formatting, static checks, code review, quality gates, and coverage reporting.
- Rust repositories add native gates on top of Qlty: `cargo fmt --check`, `cargo clippy --workspace --all-targets --all-features -- -D warnings`, `cargo nextest run` or `cargo test`, `cargo test --doc`, `cargo deny check`, coverage via `cargo llvm-cov`, docs via `RUSTDOCFLAGS="-D warnings" cargo doc`, and `cargo semver-checks` for published crates.
- High-risk Rust crates may add `cargo miri test`, fuzzing, or property tests, but those should be targeted rather than mandatory for every change.
- Reviewer fanout is risk-based. Always run correctness and test review; add security, migration, dependency, performance, and ADR review only when the spec risk tags call for them.

## Memory Stack

cortex-mem is the leading memory-sidecar candidate. Use it through MCP or REST first, not as a direct dependency inside Fabro. It can provide session, user, agent, and resource memory dimensions that map to Maestro namespaces such as `run/*`, `persona/*`, `team/*`, and repository knowledge.

Default rule: worker agents may read curated memory, but they do not freely write long-term memory. Durable writes go through the memory-curator-agent after specs, ADRs, reviewer outcomes, or final run summaries are approved.

Phase 2 should spike cortex-mem with Qdrant and an OpenAI-compatible embedding endpoint:

- Store a spec, ADR, reviewer finding, and run summary.
- Query those facts from a Claude/Codex worker prompt through MCP.
- Verify retrieval quality and source labeling.
- Decide whether to keep cortex-mem as a sidecar or implement the smaller Postgres + pgvector memory CLI originally planned.

## Local Skills In Sandboxes

Claude Code and Codex do not automatically share the host machine's local skills when they run in Daytona. Treat skills as versioned inputs to the sandbox, not ambient personal config.

For Phase 2:

- Keep a curated skill bundle under this repo, for example `agent-assets/skills/`, generated from approved local sources such as `~/.claude/skills`, `~/.codex/superpowers/skills`, and `~/.agents/skills`.
- Sync only selected `SKILL.md` directories into the sandbox before a run. Do not copy entire home config directories because they may include auth tokens, logs, caches, or unrelated personal state.
- For Claude Code workers, install/sync relevant skills into `~/.claude/skills` or include them in the repo workspace and reference them from the agent prompt.
- For Codex workers, install/sync relevant skills into `~/.codex/skills` / `~/.codex/superpowers/skills` when using Codex-native skill discovery, or include a `skills_manifest.md` in the run brief for CLI-only execution.
- The `implementation-planner-agent` should declare required skills per worker. Workers should receive only the skills they need for their write set.
- The final run report should list which skill bundle version and skill names were used.

This keeps subscription CLI sandboxes reproducible while avoiding accidental leakage of local auth state.

## Hard Rules

- No code before spec review passes.
- No architecture-affecting code before ADR manager clears or drafts the ADR.
- Review agents produce findings; they do not rewrite code directly unless the workflow explicitly promotes them into a fix-loop worker.
- Every worker owns an explicit write set.
- Every review finding must become either a code fix, a spec/ADR update, or a documented non-action with rationale.
- The final report must include spec version, ADR decisions, changed files, verification commands, and residual risk.
