# Spec Candidate (GPT-5 Codex): WakeTask iPhone App

## Problem Statement
People who snooze through alarms lose a critical 30–90 second wake window. Existing options are either too passive (Clock), too generic (puzzle alarms), or too extreme (public shaming/financial pressure). Users need their real morning priority surfaced at alarm time, with just enough forcing to act.

## Target User
- Primary: 25–45 remote/hybrid workers or students who snooze often, use iPhone + task lists, and feel morning overwhelm.
- Secondary:
1. ADHD/neurodivergent users needing external structure.
2. Parents needing immediate morning clarity.
3. Flexible-schedule users whose urgency changes by day.

## MVP Feature Set
1. Alarm forcing core
- Single active alarm schedule (time + recurrence).
- Alarm UI with two actions: `Complete Task` and `Snooze`.
- Persistent sound + haptics until one action is taken.

2. Personal task at alarm time (differentiator)
- Apple Reminders integration (permissioned).
- Fetch top-priority morning task and display in large, high-contrast format.
- On `Complete Task`, mark reminder complete.

3. Snooze-proof task re-presentation
- Snooze options: 10/15/30 min.
- On every re-ring, task is shown again (not just clock time).

4. Fast setup
- Onboarding: choose task source (Reminders in MVP), grant permission, set alarm.
- Time-to-first-alarm target: <90 seconds.

5. Accessibility baseline
- VoiceOver labels/actions.
- Dynamic Type support.
- High contrast support.
- Haptic-only usability path.

6. Settings
- Alarm time/recurrence, snooze duration, haptic intensity, task source reconnect.

## Non-Goals (MVP)
- Public social posting.
- Financial stakes/payments.
- Todoist integration.
- Calendar-aware auto-adjustments.
- HealthKit sleep-aware suppression.
- Lock Screen widget.
- Gamified puzzles/music modes.
- Multi-platform (watch/iPad/macOS).

## User Journeys
1. First-time setup
- Open app → onboarding (value + permissions) → select Reminders list → set alarm → confirmation.

2. Night-before planning
- User creates/edits reminder in Apple Reminders.
- WakeTask automatically uses top task for next alarm.

3. Morning alarm flow
- Alarm fires with task on screen.
- User either taps `Complete Task` (marks done) or `Snooze`.
- If snoozed, same task reappears at next alarm.

4. Recovery flow
- Permission revoked/network irrelevant (on-device).
- App shows fallback message + local quick task entry for next alarm cycle.

## Acceptance Criteria
1. Task rendering
- Given Reminders permission and an available task, when alarm fires, task text is visible within 1 second of alarm UI presentation.

2. Complete action
- Given displayed reminder task, tapping `Complete Task` marks it completed in Reminders within 3 seconds and stops alarm.

3. Snooze cycle
- Tapping snooze schedules next alarm at selected interval and re-displays same task context on next ring.

4. Reliability
- Alarm triggers when app is backgrounded/locked in at least 95% of internal test runs across supported iOS versions/devices.

5. Accessibility
- All alarm actions are reachable via VoiceOver rotor navigation.
- Dynamic Type XXL does not clip primary actions.

6. Performance
- Cold launch to interactive home screen <2.5s on baseline test device.

7. Code quality gates
- Swift 6 strict concurrency clean.
- SwiftLint/SwiftFormat/Qlty pass.
- Production/test Swift files remain <400 lines each.

## Analytics / Events
(privacy-safe, no task content payloads)
- `onboarding_started`
- `permission_reminders_granted|denied`
- `alarm_created`
- `alarm_triggered`
- `task_shown_at_alarm`
- `alarm_completed_task`
- `alarm_snoozed` (with interval bucket)
- `alarm_dismiss_abandon` (if app exits mid-flow)
- `settings_changed`
- `permission_revoked_detected`
- KPI rollups:
1. First/second-alarm success rate.
2. Snooze count per morning.
3. 7-day retention.
4. % alarms with successful task completion action.

## Privacy & Security Requirements
- On-device-first storage for alarm/task mapping and analytics queue.
- Never log reminder text/content in telemetry.
- No hardcoded secrets; no env var dumping in scripts/logs.
- Principle of least privilege for Reminders permission.
- Clear consent copy for data use and optional analytics.
- Secret scanning enforced in CI.
- Credential presence checks allowed only boolean-style (no values printed).
- App Privacy Nutrition Label must reflect minimal collection.

## App Store 4.3 Differentiation Statement
WakeTask is not a clone alarm utility; it is a task-driven wake execution app. Core novelty is forcing interaction with a user’s actual morning task from Reminders at alarm time, plus snooze-cycle task re-presentation. Competitors focus on generic puzzles or friction tricks; WakeTask links wake behavior directly to personal intent, with minimalist design and no bloat features in MVP.

## Appium Exploratory Testing Requirements
- Automated exploratory tapper must traverse every reachable enabled control on core flows:
1. Onboarding
2. Alarm creation/edit
3. Alarm ringing screen
4. Snooze/complete flows
5. Settings
- Evidence artifacts required:
1. Control coverage report (reachable enabled controls count).
2. Session logs with timestamps.
3. Screenshots for major states.
- Fail criteria:
1. Untappable enabled controls.
2. Navigation dead-ends.
3. Crash/hang during traversal.
- Include at least one run per supported device class in CI macOS lane.

## SwiftAIBoilerplatePro Module Reuse Plan
1. Reuse platform modules as-is
- App shell/navigation, settings framework, analytics pipeline, secure storage wrappers, networking abstraction, design tokens, test harness, CI scripts.

2. Add WakeTask domain modules
- `AlarmDomain` (entities/use-cases/scheduling abstractions)
- `TaskIntegrationReminders` (EventKit/Reminders adapter)
- `AlarmPresentation` (alarm screen + state machine)
- `WakeTaskOnboarding` (permission and setup flow)

3. Architecture constraints
- Keep strict separation: domain vs adapters vs UI.
- Preserve Swift 6 concurrency model (`Sendable`, actor isolation).
- Do not rebuild auth/payments/storage infra without ADR approval.

## Definition of Done
1. Product
- MVP feature set implemented and demoable end-to-end on iPhone.
- Differentiation statement reflected in in-app copy and App Store metadata.

2. Engineering quality
- Build + tests pass in macOS lane via `xcodebuild build` and `xcodebuild test`.
- Lint/format/quality/security gates green.
- File size limits respected (<400 lines per Swift file).

3. QA
- Appium exploratory tap evidence attached.
- Core acceptance criteria validated with test evidence.

4. Release readiness
- App Store 4.3 hardening checklist complete.
- Privacy policy + permissions copy finalized.
- TestFlight-ready artifact produced with release notes and known limitations.