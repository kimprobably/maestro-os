# Independent Spec Candidate (GPT-5 Codex): WakeTask iPhone App

## 1. Problem Statement
Many users can silence alarms while half-asleep, then fall back asleep within minutes. Existing “mission alarm” apps focus on alarm dismissal, but often fail on sustained wakefulness, reliability trust, and panic-free strictness. WakeTask will solve for the real outcome: user is still awake after dismissal.

## 2. Target User
- Primary: iPhone users who frequently snooze/dismiss in sleep inertia and relapse (students, shift workers, professionals, heavy sleepers, ADHD-leaning routine strugglers).
- Secondary: users who need strict wake accountability while traveling or changing routine.

## 3. MVP Feature Set
- Mission-gated alarms with configurable mission chain:
  - Math, memory, motion, scan (barcode/QR).
- Post-dismissal Wake Assurance Loop:
  - Mandatory wake checks at +3, +7, +12 minutes (configurable by strictness profile).
  - Missed check triggers escalating re-alarm.
- Mission Safety Rails:
  - Pre-sleep validation of mission assets (especially scan targets).
  - Accountable fallback mission if primary mission unavailable.
- Reliability Surface:
  - Pre-sleep readiness checklist.
  - Morning reliability log (fired time, dismissed time, wake-check results, fallback usage).
- Context Profiles:
  - Weekday, weekend, travel preset strictness and mission mix.
- Trust-first wake UX:
  - Low-clutter, large touch targets, no ad interruptions in wake-critical flow.
- Transparent monetization:
  - Clear free/pro boundaries before wake-time setup.

## 4. Non-Goals (MVP)
- Sleep-stage tracking platform.
- Social/community wake competitions.
- Wellness content ecosystem.
- Deep wearable-dependent wake logic.
- Rebuilding boilerplate infra modules (auth, payments, storage, networking, localization, settings, design system).

## 5. User Journeys
1. First-time setup:
- User selects wake goal and strictness profile.
- Configures alarm + mission chain.
- Validates scan/motion assets.
- Confirms readiness checklist passes before sleep.

2. Wake flow:
- Alarm fires.
- User completes mission chain.
- Alarm dismisses only after mission completion.
- Wake assurance checks run at configured intervals.
- If user misses a check, escalation alarm fires and requires re-completion.

3. Failure-safe flow:
- Scan mission fails (lighting/object unavailable).
- App auto-falls back to secondary mission.
- Event logged with reason.

4. Morning confidence:
- User opens “Wake Report.”
- Sees proof timeline of alarm and checks.
- Adjusts strictness/profile if relapse occurred.

5. Travel adaptation:
- User activates travel profile.
- App swaps in travel-safe mission mix and fallback defaults.

## 6. Acceptance Criteria
- Alarm cannot be dismissed without completing configured mission chain.
- Wake assurance checks trigger at configured intervals after dismissal.
- Missing any wake check re-triggers alarm escalation within 10 seconds.
- Scan mission setup prevents saving invalid/unreadable target.
- Fallback mission activates automatically on primary mission failure and is logged.
- Wake report displays complete timeline for each alarm instance.
- All wake-critical screens are operable one-handed with large tappable controls.
- No ad/interstitial appears during wake-critical path.
- Free/pro boundaries shown before enabling gated features.
- App functions across profile switches (weekday/weekend/travel) without reconfiguration loss.

## 7. Analytics / Events
- `onboarding_completed`
- `alarm_created`, `alarm_edited`, `alarm_deleted`
- `profile_selected` (weekday/weekend/travel/custom)
- `mission_started`, `mission_completed`, `mission_failed`
- `fallback_triggered` (reason code)
- `alarm_fired`
- `alarm_dismissed`
- `wake_check_scheduled`, `wake_check_passed`, `wake_check_missed`
- `escalation_triggered`, `escalation_completed`
- `wake_report_viewed`
- `relapse_risk_detected` (missed check within session)
- `paywall_viewed`, `paywall_converted`, `paywall_dismissed`
- `permission_prompt_shown`, `permission_granted`, `permission_denied` (notifications/camera/motion)

## 8. Privacy & Security Requirements
- Data minimization: store only alarm, mission config, and wake event telemetry needed for feature operation.
- Sensitive data:
  - Camera used only for scan mission validation/execution, no unnecessary media retention.
  - No credential/token leakage to logs/artifacts.
- Clear permission rationale at request time (notifications/camera/motion), with “why needed now.”
- On-device-first wake event history where feasible.
- Privacy policy and data-use summary accessible in-app.
- No hardcoded secrets; secret scanning and SAST are blocking gates.
- Never print environment variables or secret-like values in CI/runtime logs.

## 9. App Store 4.3 Differentiation Statement
WakeTask is not a generic alarm clone. It has a distinct two-phase wake architecture:
1. mission-based dismissal, and  
2. post-dismissal wake verification with escalation.

It further differentiates with reliability-readiness checks, transparent wake-event proof logs, and panic-safe mission fallback design. Core success metric is sustained wakefulness, not “alarm stopped,” creating a materially different product behavior and user outcome.

## 10. Appium Exploratory Testing Requirements
- Automated exploratory tapper must traverse every reachable enabled control across:
  - onboarding
  - alarm creation/edit
  - mission setup/validation
  - profile switching
  - wake report
  - paywall/settings/privacy screens
- Nightly exploratory run must capture:
  - visited screen list
  - control coverage count
  - crashes/assertions
- Include targeted scenarios:
  - mission failure to fallback path
  - missed wake-check escalation
  - permission denied flows
  - travel profile activation/deactivation
- Evidence artifact required per run (logs + screenshots/video where supported).
- Exploratory suite is blocking for release unless explicit documented deferment.

## 11. SwiftAIBoilerplatePro Module Reuse Plan
- Reuse `Core` + `CompositionRoot` for dependency injection and feature wiring.
- Reuse `DesignSystem` for accessibility-safe typography/colors/components; extend for wake-critical UI states.
- Reuse `Feature.Settings` for alarm/profile/preferences surfaces.
- Reuse `Storage` package for local persistence of alarms, mission config, wake logs, profile settings.
- Reuse `Payments` (RevenueCat) for free/pro gating and entitlement checks.
- Reuse `Auth` only if cloud sync/account features are later enabled (not required for offline MVP wake loop).
- Reuse existing test scaffolding:
  - unit tests target for domain logic (mission engine, assurance scheduler, fallback resolver)
  - UI tests + Appium exploratory harness.
- Preserve Swift 6 strict concurrency and <400 LOC per production/test Swift file by splitting:
  - `AlarmEngine`
  - `MissionEngine`
  - `WakeAssuranceScheduler`
  - `ReliabilityLogService`
  - `ProfilePolicyResolver`

## 12. Definition of Done
- Product:
  - All MVP features implemented and usable end-to-end on iPhone.
  - Differentiation statement reflected in onboarding copy and App Store metadata.
- Quality:
  - SwiftLint, SwiftFormat, Qlty, SAST, secret scanning all passing.
  - Swift 6 strict concurrency warnings treated as failures.
  - Production/test Swift files remain under 400 LOC.
- Testing:
  - `xcodebuild build` and `xcodebuild test` passing in macOS lane.
  - Appium exploratory tapper passes with evidence artifacts and no critical crash.
  - Core wake journeys validated (dismissal, assurance checks, escalation, fallback).
- Security/Privacy:
  - Privacy manifest/policy updated for actual data flows.
  - No hardcoded secrets or secret leakage in logs/artifacts.
- Release readiness:
  - App Store 4.3 hardening checklist complete.
  - TestFlight-ready build produced with release notes and known-limits log.