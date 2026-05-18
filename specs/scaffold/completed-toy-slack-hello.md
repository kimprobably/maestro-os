# Toy Slack Hello Completed Spec

## Purpose

Post a short development-only hello message to the configured Slack channel, append a run summary memory event, and exit.

## Context

This is a minimal workflow used to test the Maestro CLI, Slack persona posting, Fabro command stages, and workflow registration. It is not a customer-facing workflow.

## Non-goals

- No production outreach.
- No external enrichment.
- No database writes beyond local Maestro memory.
- No deployment, merge, migration, billing, delete, or send-to-customer action.

## Inputs

- `text`, optional, default: `hello from Maestro`.
- `FABRO_SLACK_BOT_TOKEN` or `SLACK_BOT_TOKEN`.
- `FABRO_SLACK_CHANNEL_ID` or `SLACK_CHANNEL_ID`.

## Outputs

- One Slack message under the `test-bot` persona.
- One memory event in `run/toy-slack-hello`.
- A registered Fabro workflow record in local Maestro state.

## Requirements

- Validate required Slack environment variables before posting.
- Use `maestro slack post --persona test-bot`.
- Use `maestro memory append run/toy-slack-hello` for the run summary.
- Return JSON output from every Maestro CLI command.
- Fail with exit code 2 for Slack infrastructure errors.

## Acceptance Criteria

- AC1: `maestro verify dot-syntax` passes for the workflow.
- AC2: `maestro workflow register` succeeds.
- AC3: Missing Slack secrets produce a structured error without printing secrets.
- AC4: The memory event includes message text, timestamp, and workflow name.
- AC5: The workflow has no irreversible operation, so no STOP gate is required.

## Definition of Done

- Spec Kitty work package exists as this markdown spec plus `specs/scaffold/completed-toy-slack-hello.json`.
- ADR required: false, because this is a test workflow and does not alter architecture.
- Qlty is not required for this non-code workflow; code workflows must include Qlty.
- The workflow validates with Fabro and the Maestro CLI.

## Risks

- Slack token or channel misconfiguration can fail the post.
- A real workspace message can be noisy if run repeatedly.
- Memory events can accumulate duplicate test entries.

## Verification Plan

- `maestro verify spec-quality specs/scaffold/completed-toy-slack-hello.md`
- `maestro verify dot-syntax workflows/scaffold/generated-toy-slack-hello.fabro`
- `maestro workflow register workflows/scaffold/generated-toy-slack-hello.fabro`
- Manual Slack confirmation only when intentionally running the live Slack post.

## Review Plan

- Product review: confirm this remains dev-only.
- Engineering review: confirm CLI errors and secret handling.
- Quality review: confirm deterministic validation and memory append behavior.
- No security reviewer required unless the workflow starts handling untrusted text or public channels.
