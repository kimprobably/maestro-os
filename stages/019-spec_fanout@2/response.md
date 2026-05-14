# WakeTask Spec Candidate (GPT-5 Codex)

## 1. Problem Statement
People who snooze through alarms have only a 30–90 second attention window after waking. Existing alarm apps either allow easy dismiss (Clock) or force generic puzzles (Alarmy), but neither presents the user’s actual morning priority at the critical moment. Result: repeated snoozing, decision paralysis, and missed starts.

## 2. Target User
Primary:
- Adults 25–45 with flexible mornings (remote workers, students, knowledge workers)
- Already using iPhone + Apple Reminders
- Frequent snoozers (3+ snoozes/day) who want practical, not gamified wake-up forcing

Secondary:
- ADHD/neurodivergent users who need external structure
- Parents needing rapid morning prioritization
- Users who reject public/social accountability

## 3. MVP Feature Set
1. Alarm forcing core
- Single alarm configuration with recurrence (weekday/custom)
- Persistent alarm UI with critical alert behavior and strong haptics
- Only two actions at alarm: `Complete Task` or `Snooze`

2. Task-at-alarm integration
- Apple Reminders integration (read/write with permission)
- Pull top-priority morning task at trigger time
- Display task prominently on alarm screen (large type, high contrast)

3. Snooze-proof task re-presentation
- Snooze options: 10/15/30 min
- On every re-ring, task is shown again (not time-only)
- Completion marks task done in Reminders

4. Accessibility and reliability
- VoiceOver labels/actions for all controls
- Dynamic Type and high-contrast support
- Haptic-first cues for hearing-impaired users

5. Minimal settings
- Alarm time/recurrence, snooze duration, haptic intensity, reminder source
- No optional complexity in first-run path beyond permissions

## 4. Non-Goals (MVP)
- Games/puzzles/music wake challenges
- Public social posting/accountability feeds
- Financial stakes/payments
- Gamification/streak economy
- Multi-person/team accountability
- Calendar-aware dynamic wake time (post-MVP)
- Todoist/third-party task sources (post-MVP)

## 5. User Journeys
1. First-run setup
- User opens app, grants Notifications + Reminders
- Selects reminder list/source and alarm time
- Sees confirmation preview: next alarm + selected morning task

2. Morning alarm flow
- Alarm fires with task visible immediately
- User either snoozes or taps `Complete Task`
- If complete: task marked done, alarm ends, completion event logged
- If snooze: alarm re-triggers with same task context

3. Failure/recovery flow
- If Reminders permission revoked or no task found, app falls back to “Set one wake task now” quick entry
- Alarm still functions; user is blocked from silent dismissal loops

## 6. Acceptance Criteria
- Alarm screen always shows a concrete task when task source available
- User cannot fully dismiss ringing state without either task completion or explicit snooze
- Snooze always re-displays task content on next ring
- Task completion writes back to Reminders successfully (or surfaces actionable error)
- First-time setup to active alarm can be completed in under 2 minutes
- VoiceOver can navigate and activate all alarm actions
- Core app behavior validated on supported iOS versions without crashes in primary flows

## 7. Analytics / Events
Track on-device-first, privacy-minimized events:
- `onboarding_started`
- `permissions_notifications_granted`
- `permissions_reminders_granted`
- `alarm_created`
- `alarm_fired`
- `task_loaded_for_alarm`
- `task_missing_fallback_shown`
- `snooze_selected` (with duration)
- `task_completed_from_alarm`
- `alarm_dismissed_without_completion` (if allowed fallback path)
- `first_alarm_success_within_7_days`
- `daily_snooze_count`
- `time_to_completion_after_alarm`

Success KPIs:
- First/second-ring rise rate
- Avg snoozes per active day
- Task completion within 30 min of alarm
- Week-4 retention for active alarm users

## 8. Privacy / Security Requirements
- No hardcoded secrets or credential logging
- No env-dump commands or secret echoing in tooling/logs
- Reminders/calendar/health data processed on-device by default
- Data minimization: collect only event metadata needed for product metrics
- Explicit consent for each iOS permission; graceful degrade on denial
- Clear in-app privacy disclosure for what is stored locally vs optionally synced
- Security gates remain blocking: SwiftLint, SwiftFormat, Qlty, secret scanning

## 9. App Store 4.3 Differentiation Statement
WakeTask is not a clone alarm utility. Its core behavior is distinct: it binds alarm dismissal flow to the user’s own morning task (Apple Reminders), re-presents that task on every snooze cycle, and prioritizes purposeful wake-up execution over generic puzzles/games. The app is focused, privacy-first, and functionally differentiated from existing “challenge alarm” products.

## 10. Appium Exploratory Testing Requirements
- Implement exploratory tapper to click every reachable enabled control in key screens
- Required flows:
1. Onboarding and permission prompts
2. Alarm creation/edit
3. Alarm firing UI with complete/snooze paths
4. Settings changes (snooze duration, haptic intensity, task source)
5. Permission-denied fallback states
- Output artifacts:
1. Control coverage summary
2. Screens visited and action log
3. Any crash/hang with repro steps
- Must be part of quality gate evidence; cannot be skipped unless explicitly marked `allow_macos_deferred`

## 11. SwiftAIBoilerplatePro Module Reuse Plan
Reuse boilerplate platform modules; only extend app-specific domain:
- Reuse app shell/navigation/theme/settings scaffolding
- Reuse permission handling patterns and dependency injection container
- Reuse storage/networking abstractions where needed (without rebuilding infra)
- Add WakeTask domain modules:
1. `AlarmDomain` (alarm scheduling, snooze lifecycle)
2. `TaskBridge` (Reminders adapter, task selection, completion write-back)
3. `AlarmUI` (ringing state views/components)
4. `WakeAnalytics` (event contracts + emitters)
- Keep Swift 6 strict concurrency
- Keep production/test Swift files under 400 lines

## 12. Definition of Done
1. Product
- MVP flows implemented and match acceptance criteria
- Differentiation statement reflected in in-app copy and App Store metadata draft

2. Engineering quality
- Swift 6 strict concurrency clean
- SwiftLint/SwiftFormat/Qlty/secret scan all pass
- No file-size policy violations (>400 LOC per Swift file)

3. Validation
- `xcodebuild build` and `xcodebuild test` pass in macOS lane
- Appium exploratory tapper evidence attached with no blocker defects

4. Release readiness
- Privacy disclosures complete
- App Store 4.3 hardening checks pass for strings/metadata
- Spec, QA evidence, and handoff notes complete for TestFlight-ready state