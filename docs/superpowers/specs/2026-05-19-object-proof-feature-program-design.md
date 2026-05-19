# Object Proof Feature Program Design

## Goal

Create a Fabro workflow that can run a multi-slice WakeTask product feature program for object-proof alarm missions. The workflow should implement one slice at a time, validate it, write stage-specific eval evidence, capture learnings, and feed those learnings into the next slice.

## Product Scope

The program builds the `Object Proof` mission pack for WakeTask in this order:

1. Barcode/QR scan missions.
2. Preset object photo missions using local Apple Vision classification.
3. Same-object photo missions where the user registers an object once and must photograph the same object later.

The workflow must keep the alarm dismiss path reliable and local-first. Cloud AI may be noted as backlog, but the first implementation program should prefer on-device APIs and hard evidence over network-dependent magic.

## Workflow Architecture

The workflow is a WakeTask-specific orchestration wrapper around the existing app feature iteration pattern. It runs against Railway-hosted Fabro and a Daytona sandbox with network access.

The parent workflow owns program order and cross-stage learning. Each stage child owns a bounded product slice. Stage children must write:

- stage spec;
- eval plan;
- implementation evidence;
- validation report;
- stage postmortem.

After each stage, a learning child updates cumulative learnings. Later stage prompts must read the cumulative learnings before planning or editing code.

## Stages

### Barcode/QR

Build the most deterministic object-proof path first. The user can register a barcode or QR code as the alarm target and later scan that exact code to stop the alarm.

Acceptance criteria:

- setup supports registering a barcode/QR target;
- saved alarm persists the target;
- live alarm flow opens scanner UI;
- dismiss remains blocked until the target matches;
- tests or simulator evidence prove the blocked and successful paths.

### Preset Apple Vision Object Recognition

Build the viral camera moment second. The user chooses a preset object such as sink, plate, toothbrush, shoes, fridge, keys, toilet, or coffee mug. The live challenge captures a photo and accepts it only when local Vision labels match the target with acceptable confidence.

Acceptance criteria:

- setup exposes preset object selection;
- mission stores accepted label groups and confidence threshold;
- camera capture runs local Vision classification;
- uncertain or wrong photos do not silently unlock;
- validation covers success, failure, and fallback messaging.

### Same-Object Match

Build personalization third. The user registers a reference object photo during setup and must photograph a matching object later. The first pass may use Vision feature prints or another on-device similarity mechanism, with clear thresholds and retry copy.

Acceptance criteria:

- setup can register a reference object;
- reference metadata is stored locally without leaking image data;
- live mission captures a candidate photo;
- on-device similarity gates dismissal;
- validation covers match, mismatch, and privacy/residual-risk behavior.

## Learnings Contract

Each learning artifact must include:

- what worked technically;
- what failed or was flaky;
- reusable code patterns;
- tests/evals that caught real issues;
- product behavior to carry forward;
- changes the next stage must make;
- risks and backlog.

The cumulative learning artifact is the handoff surface between stages. It should be treated as part of the spec for every later implementation stage.

## Evaluation Strategy

Each stage must create app-level evidence rather than only prose:

- unit or ViewModel tests for mission verification behavior;
- UI or Appium/XCUITest evidence where possible;
- CI or local iOS quality evidence;
- artifact checks for stage JSON/Markdown contracts;
- empty-action and no-secret discipline.

Prompt/call eval artifacts should be written for implementation and learning calls so future workflow health dashboards can see which agent calls produced usable artifacts.

## Constraints

- Use Railway Fabro, not local Fabro, for the overnight run.
- Do not print secrets or environment variable values.
- Do not rebuild auth, payments, network, storage, localization, settings, design system, or bundle identity unless the stage spec explicitly justifies it.
- Do not make this a visual-only UX pass.
- Do not require cloud AI for alarm dismissal in the first pass.
- Preserve durable artifacts under `.workflow/object-proof-program/**`.

## Open Risks

- GitHub hosted macOS CI may be blocked by billing/spending limits. The workflow should still require evidence and record hosted-CI blockers clearly.
- Apple Vision label availability and confidence may vary by OS/device. Stage two must include a calibration artifact and a fallback rule.
- Same-object matching can false-negative in morning lighting. Stage three must make thresholds and retry behavior explicit.

## Approval

The user approved the staged Object Proof concept on 2026-05-19 and asked for an overnight Fabro workflow that implements all three slices one at a time, learns from each slice, creates evals, and carries the best parts forward.
