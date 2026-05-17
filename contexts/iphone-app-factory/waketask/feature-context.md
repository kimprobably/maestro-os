# WakeTask Feature Iteration Context

## Product Goal

WakeTask should become a category-leading task-based alarm app. It should feel familiar to iPhone users who understand Apple Clock, while clearly being its own original app with missions as the differentiator.

## Trend Context

Task-based alarm apps are gaining traction because short-form videos make the forced-action mechanic instantly legible. The strongest pattern is a skit/demo hybrid: the joke explains the product. Examples include someone doing pushups, scanning a barcode away from bed, solving a puzzle, or taking a funny proof photo before the alarm stops.

Winning short-form patterns:

- Pushups or squats to stop the alarm.
- Barcode or QR scan away from bed.
- Object hunt or photo proof.
- Math or memory tasks.
- Touch grass, sky photo, make bed, or similar visual tasks.
- Relationship POV where a partner films the forced wake-up task.
- Completion/reward/share moment after success.

## Required Capabilities

- `mission_task_picker`: task selection must be obvious during alarm setup.
- `dismiss_blocking_mission_engine`: dismiss must be blocked until the configured mission succeeds.
- `live_alarm_challenge`: alarm firing must enter a clear challenge screen with progress and retry states.
- `loud_ramping_randomized_sounds`: alarm sound setup must support loud, ramping, and randomized options where platform constraints allow.
- `completion_streak_share`: completion must show a streak/reward/shareable result moment.

## Product Constraints

- Use the existing WakeTask app and SwiftAIBoilerplatePro foundation.
- Do not rebuild auth, payments, AI, storage, networking, localization infrastructure, settings infrastructure, design system, or bundle identity unless explicitly required.
- Avoid literal Apple Clock pixel copying. Target the native iOS mental model, clean hierarchy, and App Store-safe originality.
- Human App Store submission is out of scope.
- Accountability friend confirmation is backlog unless the spec explicitly scopes a small non-blocking placeholder.

## Context Sources

- User-provided Social Growth Engineers trend notes.
- Mobbin MCP UI references.
- Local screenshots under `/Users/timlife/Documents/Screenshots`.
- WakeTask repo: `https://github.com/kimprobably/waketask-ios.git`.
- Previous Fabro UX run artifacts and postmortems.
