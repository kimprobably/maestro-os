# WakeTask Spec Candidate (gpt-5-codex)

## 1) Problem Statement
People with high-stakes mornings (work, school, caregiving, shifts) cannot trust default alarms or static “challenge alarm” apps to reliably convert alarm trigger into sustained wakefulness and first action. Existing options are often bypassable, ad-disruptive at critical moments, and weak on transparent reliability evidence.

## 2) Target User
- Primary: heavy sleepers/chronic snoozers with real consequence if late.
- Secondary: ADHD-like autopilot dismisser, shift worker, student, caregiver.
- Exclusions (MVP): users seeking full sleep-stage analytics platform.

## 3) MVP Feature Set
- Alarm setup with strictness level and mission stack.
- Adaptive anti-autopilot missions (at least 3 modalities):
  - Cognitive (math/sequence)
  - Movement (steps/standing interval)
  - Scan/Photo object verification
- Post-dismiss wake contract:
  - Timed wake-check
  - Escalation path if missed
- Reliability ledger per alarm:
  - Scheduled time, trigger, dismissal path, wake-check result, failures
- Wake-to-first-task bridge:
  - One required user-defined micro-task after wake verification
- No interstitial ads during active alarm, dismissal, wake-check, and first-task flow.
- Weekly wake consistency summary.

## 4) Non-Goals (MVP)
- Full sleep tracking/coaching ecosystem.
- Public social feed or coercive accountability virality.
- Wearable-dependent core flow.
- Broad wellness content catalog.
- Cross-platform parity beyond iPhone at launch.

## 5) Core User Journeys
1. New user onboarding
- Chooses profile template (student/shift worker/chronic snoozer/caregiver).
- Sees platform-limit trust explainer and permission rationale.
- Creates first alarm with mission stack, strictness, wake-check, first micro-task.

2. Morning alarm execution
- Alarm fires in full-screen focused state.
- User completes adaptive mission sequence.
- WakeTask confirms dismissal and starts wake-check timer.

3. Post-dismiss wake contract
- User responds to wake-check in window.
- If missed, escalation executes (configured louder fallback + re-challenge).

4. First-task bridge
- User must complete selected micro-task (“drink water”, “open meds checklist”, etc.).
- Session marked “fully complete” only after task done.

5. Reliability review
- User opens alarm history and sees timeline + failure reasons.
- User adjusts strictness/missions based on outcomes.

## 6) Acceptance Criteria
- Alarm session records complete ledger entry for every scheduled alarm event.
- At least 3 mission types ship and difficulty changes based on recent relapse/rapid dismiss patterns.
- Wake-check escalation triggers when response SLA is missed.
- Critical wake path contains zero interstitial ads.
- First-task completion is enforced when enabled.
- Weekly summary reflects actual logged sessions.
- Permission copy explicitly states on-device processing for camera/object missions.
- App behavior and metadata include clear differentiation language (not generic “alarm + puzzles”).

## 7) Analytics / Events
- `onboarding_started`, `onboarding_completed`
- `alarm_created`, `alarm_edited`, `alarm_deleted`
- `alarm_triggered`
- `mission_started`, `mission_completed`, `mission_failed`, `mission_bypassed_detected`
- `dismissal_attempted`, `dismissal_completed`
- `wake_check_started`, `wake_check_completed`, `wake_check_missed`
- `escalation_triggered`, `escalation_completed`
- `first_task_started`, `first_task_completed`, `first_task_skipped` (if allowed)
- `session_completed`
- `reliability_log_viewed`
- `permission_prompt_shown`, `permission_granted`, `permission_denied`
- `paywall_viewed` (if applicable), with hard guard that paywall never interrupts active wake path.

## 8) Privacy & Security Requirements
- No hardcoded secrets; no credential values in logs/artifacts.
- On-device-first validation for photo/object missions; minimal retained data.
- Encrypt sensitive local state at rest using platform defaults.
- Collect only telemetry needed for reliability and product improvement.
- User-visible data retention/deletion controls.
- No environment variable dumps or secret echoing in build/test scripts.
- Secret scanning and quality/security gates blocking in CI.

## 9) App Store 4.3 Differentiation Statement
WakeTask is not a template alarm clone. It is a reliability-and-execution product: auditable reliability ledger + adaptive anti-autopilot mission engine + post-dismiss wake contract + first-task completion bridge in one integrated loop. The product promise is “wake certainty to first action,” with trust-first, ad-free critical wake flow and privacy-explicit mission handling.

## 10) Appium Exploratory Testing Requirements
- Automated exploratory tapper traverses every reachable enabled control/screen in iPhone app builds.
- Must include alarm setup, active alarm flow (simulated), mission flows, wake-check, escalation, first-task, history/ledger, settings.
- Produce artifact evidence: visited screen list, tapped control count, failures/crashes, blocked paths.
- Fail build on crash, unhandled alert loops, or dead-end navigation in reachable paths.
- Run alongside `xcodebuild build` and `xcodebuild test` in macOS lane.

## 11) SwiftAIBoilerplatePro Module Reuse Plan
- Reuse platform modules; do not rebuild core infra:
  - Networking/API client scaffolding
  - Local storage/state management
  - Settings/preferences framework
  - Localization/theming/design system primitives
  - Auth/payments/analytics hooks (if already provided)
- Build WakeTask feature modules on top:
  - `AlarmEngine`, `MissionEngine`, `WakeContract`, `ReliabilityLedger`, `FirstTaskBridge`
- UI composition via existing DS components (cards/buttons/chips/list rows/tags/toasts/haptics/a11y helpers).
- Preserve Swift 6 strict concurrency boundaries and module contracts.
- Keep files under 400 lines (production and tests), splitting by responsibility.

## 12) Definition of Done
- Spec-approved MVP implemented in `apps/waketask-iphone` using SwiftAIBoilerplatePro extensions.
- All required quality gates green (SwiftLint, SwiftFormat, Qlty, secret scanning).
- macOS CI evidence for `xcodebuild build` and `xcodebuild test`.
- Appium exploratory evidence attached and passing.
- App Store 4.3 differentiation checks pass for product strings/metadata.
- Security/privacy checks pass (no secret leaks, no forbidden env-dump behavior).
- Final cross-functional review passes: product fidelity, iOS architecture, security, QA, release readiness.