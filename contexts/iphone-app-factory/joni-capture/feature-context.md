# Joni Capture iPhone Factory Context

Build `Joni Capture`, an iPhone app for Tim's Joni LinkedIn agent.

## Existing Repo Context

Read these before product/spec/implementation decisions:

- `docs/superpowers/specs/2026-05-19-joni-capture-iphone-design.md`
- `docs/operator/specs/active/joni-productized-linkedin-agent.md`
- `workflows/hermes/joni-linkedin-daily.fabro`
- `scripts/hermes/joni-linkedin-capture.mjs`
- `scripts/hermes/joni-linkedin-voice-eval.mjs`
- `hermes/profiles/joni/skills/linkedin-operator/SKILL.md`
- `hermes/profiles/joni/skills/maestro-linkedin-voice-editor/SKILL.md`
- `knowledge/voice.md`

## Product Requirements

The app must let Tim capture a rambled LinkedIn idea from the Lock Screen, Action Button/Shortcut, or in-app capture button, then track that idea through Joni classification, drafting, evaluation, and review preparation.

Build these app capabilities:

- audio capture and local capture queue;
- transcript lifecycle with pending/error states;
- `JoniIngestionClient` protocol with fixture/demo and hosted-configurable implementations;
- processing timeline from captured to ready-for-review;
- draft detail view with post type, angle, hook, draft, eval notes, and explicit no-publish state;
- dashboard for Joni activity and LinkedIn/Joni analytics snapshots;
- settings/privacy controls for local storage, retries, endpoint configuration, and deletion/export;
- interviewer mode for long-form ramble sessions that produce structured notes in Tim's voice.

## Safety Boundaries

- Do not publish to LinkedIn.
- Do not comment, DM, connect, or mutate LinkedIn.
- Do not hardcode API keys, Slack tokens, LinkedIn cookies, Fabro tokens, or HarvestAPI credentials.
- Do not claim live LinkedIn analytics unless a real source is configured.
- Use fixture/demo data when hosted Joni ingestion or analytics are unavailable.

## iPhone Factory Inputs

- App name: `Joni Capture`
- Bundle id: `com.maestro.jonicapture`
- App dir: `apps/joni-capture-iphone`
- Spec Kitty feature: `joni-capture-iphone-app`
- iOS validation mode: `github`
- macOS deferral: `false`

## Definition Of Done

- App builds from SwiftAIBoilerplatePro and preserves boilerplate architecture.
- First screen is the actual capture/dashboard tool.
- Quick capture and interviewer mode are visible and usable with fixture data.
- Joni states and draft prep are modeled explicitly.
- Analytics dashboard is honest about fixture/local versus live data.
- GitHub iOS validation evidence is attached in the Fabro handoff.
