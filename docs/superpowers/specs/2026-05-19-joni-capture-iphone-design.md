# Joni Capture iPhone App Design

Date: 2026-05-19
Status: Approved for overnight Fabro execution by Tim's "finish all this tonight" instruction

## Context

Tim wants a phone-first Joni workflow: tap from the Lock Screen or Action Button, ramble a LinkedIn idea, hand it to Joni, have Joni classify the post shape, draft in Tim's voice, run eval/edit passes, and prepare a draft for approval. The same app should show Joni and LinkedIn analytics plus what Joni is currently doing. If the capture/drafting slice lands, the app should also include an AI content interviewer mode that turns rambly conversations into structured notes in Tim's voice.

Existing assets to reuse:

- `docs/operator/specs/active/joni-productized-linkedin-agent.md`
- `workflows/hermes/joni-linkedin-daily.fabro`
- `workflows/hermes/joni-linkedin-daily.toml`
- `scripts/hermes/joni-linkedin-capture.mjs`
- `scripts/hermes/joni-linkedin-voice-eval.mjs`
- `hermes/profiles/joni/skills/linkedin-operator/SKILL.md`
- `hermes/profiles/joni/skills/maestro-linkedin-voice-editor/SKILL.md`
- `knowledge/voice.md`
- `workflows/iphone-app-factory/build-iphone-app.cli.fabro`
- `scripts/iphone-app-factory/create-run-config.mjs`

## Iteration Notes

Iteration 1: A simple voice-note inbox would be fast, but too weak. It would not solve the real pain: capturing ideas at the moment of inspiration and knowing Joni actually processed them.

Iteration 2: A full LinkedIn/Joni mobile control center would be powerful, but too large for a first overnight run. It risks overbuilding analytics and fragile backend assumptions before the capture pipeline works.

Iteration 3, selected: Build a focused Joni Capture app from the existing iPhone factory. The app has a lock-screen/action-button capture path, local transcript queue, Joni draft-prep status, lightweight analytics, and interviewer mode. Integration uses explicit client protocols and configurable endpoints so the app is useful with fixtures immediately and can connect to hosted Joni/Fabro without embedding secrets or mutating LinkedIn.

## Product Boundary

The app is a capture, review, and visibility surface. It must not publish, comment, DM, connect, or mutate LinkedIn. All LinkedIn output is draft-only until Tim explicitly approves in an external LinkedIn flow.

The app should be useful even if Joni's hosted ingestion endpoint is unavailable:

- save raw capture locally;
- transcribe locally where possible;
- queue failed submissions;
- show pending/error states;
- allow export/share of a transcript or prepared draft;
- use fixture/demo analytics when no authenticated analytics source is configured.

## Core User Flows

### Quick Capture

Tim can trigger capture from:

- Lock Screen widget;
- Action Button through Shortcuts/App Intent;
- in-app primary capture button.

Capture records audio, creates a local capture object, starts transcription, and shows immediate status. The app should support short ideas and longer rambles.

### Joni Draft Prep

For each capture, the app sends transcript plus non-secret metadata to a Joni ingestion client. The first implementation should define a `JoniIngestionClient` protocol and a fixture-backed implementation. A hosted implementation may use a configurable base URL and token read from secure app configuration/keychain, but the app must not commit or display secrets.

Joni processing states:

- captured;
- transcribing;
- queued;
- submitted;
- classifying;
- drafting;
- evaluating;
- ready for review;
- needs attention;
- failed.

Post type classification should cover at least:

- story;
- contrarian observation;
- teardown;
- tactical playbook;
- founder/operator lesson;
- list/framework;
- question/prompt;
- analytics-driven follow-up.

Draft prep output should include:

- recommended post type;
- angle and hook options;
- LinkedIn-ready draft;
- voice/eval notes;
- evidence/context used;
- explicit approval state.

### Dashboard

The dashboard should answer three questions quickly:

- What did I just capture and where is it?
- What has Joni prepared for LinkedIn?
- Is Joni healthy and what is she doing?

Required surfaces:

- capture queue with status and retry;
- draft review list with eval status;
- Joni activity timeline;
- analytics snapshot for recent LinkedIn/Joni performance;
- lightweight settings for ingestion mode and privacy.

Analytics should start from fixture/local JSON and be shaped for future Joni ledger/LinkedIn analytics ingestion. Do not fake live LinkedIn API support.

### Content Interviewer Mode

Add an interviewer tab or mode if core capture is implemented cleanly. It should support a longer recorded conversation, produce structured notes in Tim's voice, and preserve raw transcript separately from edited notes.

Structured note output:

- title;
- core thesis;
- supporting stories;
- useful phrases in Tim's voice;
- possible LinkedIn angles;
- follow-up questions;
- source transcript link/status.

## Architecture

Use SwiftAIBoilerplatePro and preserve its existing app foundation, project structure, design system, persistence, settings, and networking patterns.

Suggested app modules:

- `Capture`: audio recording, transcript lifecycle, App Intent/Shortcut entry points, Lock Screen widget model.
- `JoniPipeline`: ingestion client protocol, fixture client, hosted client seam, processing state model.
- `Drafts`: draft list, detail view, eval/approval state, export/share.
- `Analytics`: dashboard cards, local fixture source, future ledger source protocol.
- `Interview`: long-form session model, structured notes generator seam.
- `Privacy`: local storage policy, secret-free config, delete/export controls.

Data should be persisted locally with tenant/user scope `tim` in the model so it can later become multi-tenant without rewriting the schema.

## Fabro/A2P Run Contract

Use the existing iPhone factory with concrete, non-generic inputs:

- app name: `Joni Capture`
- bundle id: `com.maestro.jonicapture`
- app dir: `apps/joni-capture-iphone`
- Spec Kitty feature: `joni-capture-iphone-app`
- validation mode: `github`
- `allow_macos_deferred = "false"`
- sandbox: Daytona through hosted Railway Fabro

Do not print or commit secrets. Credential checks must be presence-only. All hosted endpoints must be configurable and disabled by default in local/demo mode.

## Acceptance Criteria

- The first screen is the usable Joni capture/dashboard experience, not a marketing page.
- A quick capture can be created, transcribed or marked transcript-pending, and shown in the queue.
- A capture can be submitted through the Joni ingestion protocol and transitions through visible processing states.
- Fixture-backed Joni responses produce a classified LinkedIn draft with eval notes and explicit "not published" state.
- Dashboard shows capture queue, draft readiness, Joni activity, and analytics snapshot.
- Interviewer mode can convert a longer transcript fixture into structured notes in Tim's voice.
- The app has no auto-publish path and no LinkedIn mutation UI.
- iOS CI validation runs through GitHub; macOS validation must not be silently deferred.
- The final handoff lists any backend endpoint gaps separately from app implementation status.

## Babysitting Plan

Start the Fabro run from the run-specific TOML, then assign Quincy a Hermes Kanban babysitter task with:

- run id;
- original Slack/home channel;
- report channel fallback;
- compact heartbeat expectation;
- terminal-state evidence requirements;
- instruction to classify credential, infra, deterministic, or product blockers.

Quincy should update the Fabro run ledger and report only meaningful status changes, blockers, approvals, and terminal states.
