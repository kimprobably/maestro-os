# Phase 1 Findings

Date: 2026-05-12
Status: current checkpoint, not final sign-off

## Summary

Fabro is viable enough to keep moving. OpenRouter, Slack approval cards, physical Slack button clicks through Socket Mode, gate-decision resume, persona-style Slack posting, Daytona custom snapshots, Daytona subscription CLIs after manual login, iteration speed, and first-class sub-workflows all work. The remaining unresolved item is operational polish: a repeatable Daytona subscription-auth strategy and the final anchor-message `chat.update` UX for stage progress.

## Test Results

| Test | Result | Evidence |
|---|---|---|
| 1. Rust modification surface | Partial pass | OpenRouter provider and Slack gate dispatch are implemented in the fork. Current diff is `22 files`, `2590 insertions`, `1630 deletions`; this includes tests and formatting churn inside touched files. Full anchor-message progress updates are still incomplete. |
| 2. Real workflow through Slack | Pass for local E2E | Run `01KRF0HE119FJ2JS9NE6ES60XA` completed after a real Slack `[A] Approve` button click. Socket Mode received the click, emitted `interview.completed`, unblocked the run, completed draft/persist stages, and posted via `bin/maestro slack post`. Earlier API-approval run `01KREXTYHDWJ19RBFAYNR6YWR4` completed in `3m20s`. Daytona CLI auth was not part of these local runs. |
| 3. Subscription CLI auth in Daytona | Partial pass | Default Daytona sandbox `c0a38490-8cf5-45ca-a12d-9537aa02cc4d` runs Claude Code `2.1.19` and Codex `0.130.0`. After manual login, `claude -p hello` and `codex exec --skip-git-repo-check hello` both returned successful responses. A broader Daytona key created active custom snapshot `maestro-agent-test-20260512` (`1047d5db-7497-4fb0-85b6-c2c2cc284722`), so snapshot permissions are no longer blocked. Repeatable subscription auth state remains unresolved. |
| 4. Iteration speed | Pass | Run `01KREZ5ZQEQ66WPXWBQWVYXRY0`: DOT prompt edit to first-stage output visible in Slack in `5s`, under the 60s target. |
| 5. Sub-workflow invocation | Pass | Run `01KREZG8WKCR3QM8S7RMV1G3D3`: `stack.manager_loop` invoked `subflow-child.fabro`, propagated `subflow.result`, and the parent emitted `PARENT-SAW-CHILD result=ok` in `2s`. |

## Decision

Current recommendation: **conditional GO**.

The all-Fabro runtime thesis is holding up: workflow execution, HITL gates, physical Slack buttons, Slack surfaces, OpenRouter, shell stages, Daytona snapshots, Daytona subscription CLIs after manual login, and workflow composition are all working. The conditions to close during Phase 2 foundation work are:

- Make Daytona auth repeatable: use Daytona volumes or a bootstrap that prompts manual login only when auth state is missing.
- Finish or explicitly defer the single-anchor `chat.update` stage-progress UX.

## Quality Stack Decision

The code-factory design should use a spec-first workflow with Spec Kitty as the work-package state layer, Unblocked MCP as a context source, Qlty as the baseline deterministic quality gate, and native language gates on top. Rig belongs in the output app-template layer for Rust AI apps built by Fabro, not as a replacement for Fabro. cortex-mem is the leading memory-sidecar candidate, exposed through MCP/REST with curated long-term writes. For Rust, keep `cargo fmt`, `cargo clippy`, `cargo test` or `nextest`, doc tests, `cargo deny`, coverage, docs warnings, and targeted Miri/fuzz/property tests for high-risk crates. Reviewer fanout should be risk-based: correctness and test reviewers always, with security, migration, dependency, performance, and ADR reviewers added from spec risk tags.

## Next Actions

1. Document the repeatable Daytona subscription-auth strategy.
2. Spike the Rig app-template and cortex-mem sidecar integrations behind Fabro workflows.
3. Decide whether the remaining `chat.update` anchor-message UX is a Phase 1 blocker or a Phase 2 polish task.
4. Start Phase 2 foundation work with the constitution documents and seed workflow.
