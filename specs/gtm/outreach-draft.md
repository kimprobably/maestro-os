# Outreach Draft Workflow Spec

## Purpose

Given an enriched lead, draft short cold email variants in Tim's voice, validate
them, and surface surviving variants for human approval before queueing.

## Context

This is the first GTM workflow used to test the Maestro meta-loop against a
non-code workflow. It should prove that Fabro can mix deterministic validators,
LLM drafting, human STOP gates, Slack persona output, and memory writes.

## Non-Goals

- Do not send email in v0.
- Do not enrich leads in this workflow.
- Do not write to a real email queue until the STOP gate path is fully proven.

## Inputs

- `lead_path`: JSON lead fixture path.
- `campaign_id`: optional campaign identifier.

## Outputs

- `drafts/outreach/latest.json`
- Slack approval thread when enabled.
- Memory event in `persona/quill/episodic`.

## Functional Requirements

- Load lead, ICP, and voice guide.
- Draft three variants.
- Validate email format, banned phrases, length, and at least one variant.
- STOP gate before any queue/write action.
- Record approved handoff as a draft artifact.
- Record validator outcomes.

## Acceptance Criteria

- Fabro validates the workflow.
- `maestro verify workflow-quality` passes.
- The workflow has a deterministic validation chain before approval.
- No email is sent without a STOP gate.

## Definition Of Done

- Workflow, prompt, fixtures, and eval config are checked in.
- Qlty and registry smokes include the workflow.
- Real send queue remains disabled until explicitly approved.

## Risks

- LLM drafts can sound generic.
- Fixture leads are not production leads.
- Voice-match remains an LLM judge and needs eval calibration.

## Spec Kitty

Create a software-dev mission when this workflow graduates from spike artifact
to production workflow. Work packages:

- validators;
- drafting prompt;
- Slack approval UI;
- queue persistence;
- eval dataset expansion.

## ADR

ADR not required for this spike workflow. A future ADR is required before
connecting a production send queue.
