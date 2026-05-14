# WakeTask iPhone App Specification — Candidate (DeepSeek V4 Pro)

**Model identity**: `deepseek/deepseek-v4-pro`  
**Date**: 2026-05-14  
**App**: WakeTask (`com.keen.waketask`)  
**Boilerplate**: SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution  
**Target**: TestFlight-ready handoff

---

## 1. Problem Statement

### Core Problem: The Compulsive Snooze Cycle

The native iOS Clock app and most third-party alarms treat snooze as a convenience feature — a single tap to delay. For chronic oversleepers, the snooze button becomes a learned reflex. Research across Reddit communities (r/sleep, r/getdisciplined), App Store reviews, and competitor analysis reveals a recurring pattern:

- **Executive function is offline during the wake-up window.** Users are conscious enough to register the alarm but not enough to override the snooze reflex.
- **Snooze is not laziness** — it is involuntary habituation. Users report genuine distress and shame about their inability to wake up despite strong intentions.
- **Willpower-based strategies fail within 2–4 weeks.** Loud alarms, puzzle alarms, and motion-based alarms all suffer from the same decay curve: users habituate to the friction mechanism and discover workarounds.
- **No competitor addresses habituation.** Alarmy, Puzzle Alarm, Sleep Cycle, and LOUD Alarm all use static friction. Once the user "solves" the unlock pattern, effectiveness collapses.

The problem is not "alarms aren't loud enough." The problem is that the alarm dismissal experience is static while the user's resistance adapts.

---

## 2. Target User

### Primary Persona: The Chronic Oversleeper

| Attribute | Description |
|---|---|
| **Age range** | 18–45 |
| **Sleep profile** | Deep sleeper; not a light sleeper |
| **Wake-up behavior** | Hits snooze 3–8+ times per alarm session; dismisses alarm in drowsy, reflexive state |
| **Motivation profile** | Wants to wake up; has tried multiple alarms, apps, and strategies; feels shame about repeated failure |
| **Accountability profile** | Responds better to external structure than internal discipline; motivated by streaks and visible progress |
| **Tech comfort** | Comfortable with iPhone; has tried or considered app-based solutions |
| **Key frustration** | Knows they can wake up but can't break the snooze habit at the moment of decision |

### Secondary Persona: The Accountability Seeker

- Wants friend/partner visibility into wake-up consistency
- Prefers social framing over punishment framing
- Motivated by not letting others down more than by self-discipline

---

## 3. MVP Feature Set (Phase 1 — TestFlight Ready)

### 3.1 Core Alarm Mechanics

| # | Feature | Description | Priority |
|---|---|---|---|
| F1 | **Motion-Lock Task** | Shake-detection via `CMMotionManager`. User must shake the phone at a threshold intensity N times (default: 8 shakes at ≥3.0 m/s²). Visual progress meter fills per shake with haptic feedback per event. | P0 |
| F2 | **Math Puzzle Task** | Simple arithmetic (addition/subtraction/multiplication) with configurable digit range. Difficulty 1: single-digit; Difficulty 3: 2-digit operations. Displays a large, high-contrast keypad. Timer counts down with haptic pulse advancing toward deadline. | P0 |
| F3 | **Pattern/Tap-Sequence Task** | Simon-Says-style: display a sequence of colored targets (3–6 items), user reproduces by tapping in order. Difficulty scales by sequence length and speed. Serves as accessibility fallback for motion-impaired users and as a cognitive alternative to math. | P0 |
| F4 | **Task Rotation Guarantee** | Algorithm ensures no task type repeats within a 3-day rolling window. The same specific puzzle instance is excluded for 7 days. Random daily selection from the available pool. | P0 |

### 3.2 Adaptive Difficulty System

| # | Feature | Description | Priority |
|---|---|---|---|
| F5 | **Snooze-Triggered Escalation** | Track snooze events with timestamps. Compute rolling 7-day snooze count. If snoozes exceed threshold, increment task difficulty by 1 level (1–5 scale). Hard ceiling at level 5. | P0 |
| F6 | **Difficulty Reset** | After a 7-day perfect streak (zero snoozes across all days), difficulty drops to baseline (level 1). User is notified of the reset. | P0 |
| F7 | **Manual Difficulty Override** | Settings screen allows user to manually set difficulty floor (1–3) and ceiling (2–5). User can also disable adaptive difficulty entirely and fix at a chosen level. | P1 |
| F8 | **Per-Session Escalation** | Within a single alarm session, first snooze triggers baseline task. Second snooze escalates to next difficulty level. Third snooze reaches maximum difficulty. Fourth snooze: app concedes and schedules backup alarm (+5 min). | P0 |

### 3.3 Temporal Gates and Feedback

| # | Feature | Description | Priority |
|---|---|---|---|
| F9 | **Task Timer (Configurable)** | Each task has a completion window. Default: 30s for motion, 60s for math, 45s for pattern. User-configurable per task type in Settings (10–120s range). Timer displayed as a large, WCAG AAA-contrast countdown. | P0 |
| F10 | **Haptic Escalation** | As timer approaches deadline: gentle pulse at 50% remaining, urgent pulse at 25%, continuous pulse at 10%. Fully configurable via Settings (on/off, intensity). | P0 |
| F11 | **Auto-Fail and Backup Alarm** | If timer expires before task completion, task auto-fails. A local notification fires as a backup alarm after a configurable delay (default: 5 minutes). User sees a clear "Task Failed — Next alarm in 5 minutes" message. | P0 |
| F12 | **Success Feedback** | On task completion: haptic burst (iOS notification success pattern) + a brief visual confirmation ("Awake!") + alarm sound stops immediately. No interstitial, no "rate me" prompt, no upsell. | P0 |

### 3.4 History and Motivation

| # | Feature | Description | Priority |
|---|---|---|---|
| F13 | **Streak Counter** | Consecutive days with zero snoozes. Displayed prominently in the main settings/home view and optionally as a Lock Screen / Home Screen widget. Streak break: "Streak reset. You had X days. Start again." No negative framing. | P0 |
| F14 | **Snooze History (4-Week Rolling)** | In-app view: weekly snooze count, snooze-by-day bar chart, task type distribution, average completion time. Data stored locally; never leaves device. Export available as CSV for user's own analysis. | P1 |

### 3.5 Settings and Configuration

| # | Feature | Description | Priority |
|---|---|---|---|
| F15 | **Task Type Toggle** | Enable/disable individual task types. Disabling all but one effectively locks the app to a single task type (user choice). | P0 |
| F16 | **Timer Duration Per Task** | Configurable timer window per task type (motion: 10–60s, math: 30–120s, pattern: 15–90s). | P1 |
| F17 | **Difficulty Range** | Manual floor (1–3) and ceiling (2–5) for adaptive difficulty. | P1 |
| F18 | **Haptic Intensity** | Off / Low / Medium / High for task feedback and deadline pulsing. | P2 |
| F19 | **Accessibility Mode** | Global toggle enabling: VoiceOver-optimized layouts, reduced motion, enlarged touch targets, tap-as-shake alternative for motion tasks. | P0 |

---

## 4. Non-Goals (Explicitly Out of Scope)

| Area | Reasoning |
|---|---|
| **Sleep tracking** | WakeTask is a wake-up app, not a sleep app. No accelerometer monitoring during sleep. Motion sensing is active only during the alarm window. |
| **Alarm scheduling replacement** | WakeTask complements the native iOS Clock app; it does not duplicate alarm creation/scheduling. The user sets their alarm in Clock.app. WakeTask provides the dismissal experience. |
| **Calendar integration** | Showing the first calendar event on dismissal is a v1.1 candidate. MVP focuses on the wake-up moment only. |
| **Social witness / accountability** | Privacy and notification coordination complexity is deferred to v1.1. MVP has zero network calls during alarm dismissal. |
| **Voice recognition task** | Unreliable in iOS background/local-notification wake context for MVP. Deferred. |
| **Cloud sync of alarm settings** | All data stays local. No CloudKit in MVP. |
| **In-app purchases or subscriptions** | MVP is free. Monetization is a v1.2 consideration after retention data is validated. |
| **Dark pattern designs** | No hidden snooze buttons, no phantom notifications, no manipulative nudge UI, no upsell interstitials at dismissal. |
| **Social features, leaderboards, public profiles** | WakeTask is a personal tool. No social graph, no sharing, no public visibility. |

---

## 5. User Journeys

### Journey 1: First-Time Setup (New User)

1. User opens WakeTask for the first time.
2. App shows a 3-screen onboarding: (a) "Break the snooze cycle" value prop, (b) "How it works" with task previews, (c) "Set your alarm in Clock.app — we handle the rest."
3. App requests Notification permission. If denied, shows a gentle reminder that notifications are required for alarm handling.
4. User is taken to the Settings home screen showing: current streak (0), snooze history (empty), and configuration options.
5. User can toggle task types and adjust preferences.
6. App instructions: "Set your alarm in the iOS Clock app. When it goes off, open WakeTask to dismiss it."

### Journey 2: Morning Wake-Up (Happy Path)

1. iOS Clock app alarm fires at 7:00 AM.
2. User opens WakeTask (or taps the persistent notification).
3. WakeTask presents the day's randomly-selected task, e.g., Math Puzzle (difficulty 2).
4. Screen shows: large math problem ("23 + 47 = ?"), large keypad, countdown timer at 60 seconds, haptic pulse every 5 seconds.
5. User enters "70" and taps Submit.
6. Task evaluates: correct!
7. Haptic burst + visual confirmation: "☀️ Awake! Streak: 4 days". Alarm ceases.
8. User exits app. No further screens. No upsell.

### Journey 3: Snooze Attempt with Escalation

1. Alarm fires. Math Puzzle (difficulty 1: "7 + 3 = ?") displayed. Timer 60s.
2. User taps Snooze button.
3. App shows: "Snoozed. Next alarm in 5 minutes." Backup notification scheduled.
4. After 5 minutes, backup alarm fires.
5. WakeTask now presents Math Puzzle at difficulty 3 (two-digit multiplication: "14 × 6 = ?"). Timer 60s.
6. User completes correctly. Success feedback. Streak unaffected (snooze was within same alarm session).

### Journey 4: Repeated Snooze → Maximum Escalation

1. Alarm fires. Motion-Lock task (8 shakes). Timer 30s.
2. User taps Snooze.
3. Backup alarm fires. Motion-Lock task now requires 14 shakes (escalated). Timer 30s.
4. User taps Snooze again.
5. Second backup alarm fires. Motion-Lock task now requires 20 shakes (maximum). Timer 30s.
6. User snoozes a third time.
7. App concedes: "You've hit the limit. No more backup alarms for this session." App stops scheduling. Streak is broken (recorded as a snooze day).

### Journey 5: Checking History and Streak

1. User opens WakeTask during the day.
2. Home screen shows: current streak (7 days 🔥), weekly snooze count (2), quick glance bar chart (Mon–Sun).
3. User taps "View History" → full 4-week view: daily snooze counts, task type breakdown, average completion times.
4. User can export CSV from this screen.

### Journey 6: Task Rotation Experience

1. Monday: User gets Motion-Lock task.
2. Tuesday: Math Puzzle (motion excluded from pool for 3-day window).
3. Wednesday: Pattern/Tap-Sequence (motion and math excluded).
4. Thursday: Motion-Lock is available again. Random selection may pick it or a different available type.

### Journey 7: Accessibility Mode

1. User with motor impairment opens Settings → enables Accessibility Mode.
2. Motion-Lock task is replaced with Tap-Sequence alternative: tap a series of large targets in order rather than shaking.
3. All touch targets render at minimum 44×44pt.
4. VoiceOver reads timer, task instructions, and progress aloud.
5. Haptic feedback is configurable independently.

---

## 6. Acceptance Criteria

### 6.1 Functional Acceptance

| ID | Criterion | Verification |
|---|---|---|
| AC1 | Motion-Lock task detects shakes at ≥3.0 m/s² threshold and increments counter with haptic feedback per shake. | Unit test: mock `CMMotionManager` with simulated acceleration data; verify counter increments only above threshold. |
| AC2 | Math Puzzle task generates problems in the configured digit range and validates correct/incorrect answers. | Unit test: generate 100 problems per difficulty level; verify all have operands within range and produce integer answers. |
| AC3 | Pattern task generates sequences of configurable length, accepts correct tap order, rejects incorrect order. | Unit test: verify sequence generation uniqueness (no repeats per session), verify match/mismatch logic. |
| AC4 | Task rotation excludes the same task type for 3 days and the same specific puzzle instance for 7 days. | Unit test: simulate 30-day sequence; assert no same-type within 3-day window; assert no identical puzzle within 7 days. |
| AC5 | Snooze event is recorded with timestamp; 7-day rolling count is computed correctly. | Unit test: insert snooze events at known dates; verify rolling window calculation at date boundaries. |
| AC6 | Difficulty increments when 7-day snooze count exceeds threshold (2 snoozes → level 2, 4 snoozes → level 3, 6 snoozes → level 4, 8+ snoozes → level 5). | Unit test: set up snooze history at each boundary; verify difficulty returned by adaptive algorithm. |
| AC7 | 7-day perfect streak resets difficulty to baseline (level 1). | Unit test: set up 7 days with zero snoozes; verify difficulty = 1. |
| AC8 | Per-session escalation: snooze 1 → base difficulty, snooze 2 → +1 level, snooze 3 → max, snooze 4 → concede (no more backups). | Integration test: simulate alarm session with multiple snoozes; verify escalation state machine. |
| AC9 | Task timer expires → auto-fail → backup alarm scheduled. | Integration test: set timer to 1s, trigger task, wait for timeout, verify backup notification received. |
| AC10 | Task completion → alarm sound stops immediately → success haptic + visual confirmation → no interstitial. | UI test: complete task, assert alarm output stops, assert success view displayed, assert no upsell/modal. |
| AC11 | Settings: toggling off a task type removes it from the rotation pool immediately. | Unit test: disable motion; verify motion never selected over 30-day simulation. |
| AC12 | Manual difficulty floor/ceiling is respected by adaptive algorithm. | Unit test: set floor=2, ceiling=4; verify difficulty never outside [2,4] regardless of snooze history. |

### 6.2 Non-Functional Acceptance

| ID | Criterion | Verification |
|---|---|---|
| AC13 | All text meets WCAG AAA contrast ratio (4.5:1 minimum). | Tooling: run contrast analyzer on all views during CI. |
| AC14 | All interactive elements have minimum 44×44pt touch targets in Accessibility Mode. | UI test: verify frame sizes of all tappable elements in accessibility layout. |
| AC15 | VoiceOver reads all labels, values, and hints correctly on every screen. | Accessibility audit: enable VoiceOver, navigate all screens, verify complete read-out. |
| AC16 | Motion monitoring is active ONLY during the alarm window. No accelerometer polling before alarm fires or after dismissal. | Instrumentation test: verify `CMMotionManager.startAccelerometerUpdates()` is called only within alarm session lifecycle. |
| AC17 | App does not crash, ANR, or produce unhandled error screens during Appium exploratory click pass. | Appium/XCUITest tapper runs against all screens; zero crashes or unhandled errors. |
| AC18 | `xcodebuild build` and `xcodebuild test` pass on macOS with Swift 6 strict concurrency. | CI gate in GitHub Actions macOS runner. |
| AC19 | SwiftLint strict mode, SwiftFormat lint mode, Qlty check, and gitleaks scan all pass with zero blocking issues. | CI gate. |
| AC20 | No hardcoded secrets, API keys, tokens, or credential patterns in source or committed config. | CI gitleaks scan; manual review of Info.plist and configuration files. |
| AC21 | App Store 4.3 release string audit finds zero template/boilerplate fingerprints. | Automated scan of all user-facing strings, metadata, and display names. |

### 6.3 Edge Cases

| ID | Scenario | Expected Behavior |
|---|---|---|
| EC1 | User force-quits app during task. | Task state is lost. Backup alarm fires at scheduled time. No crash or corrupted state on next launch. |
| EC2 | User receives phone call during alarm. | iOS handles call interruption. When call ends, wake task view resumes (state preserved). Timer accounts for elapsed time. |
| EC3 | User has no task types enabled (all toggled off). | App shows warning in Settings: "Enable at least one task type." Alarm fallback: shows tap-to-dismiss with a 5-second hold requirement. |
| EC4 | Device has low battery (<5%) during alarm. | Motion-Lock task is replaced with Pattern task (lower energy). User notified: "Low battery — using energy-saving task." |
| EC5 | User changes system clock (time cheat). | Snooze history uses monotonic clock (`mach_absolute_time`), not wall clock. Time manipulation does not affect streak or difficulty. |
| EC6 | Notification permission denied. | App shows persistent banner in Settings: "Notifications required. Enable in iOS Settings → WakeTask." Alarm handling works but background reliability is degraded. |

---

## 7. Analytics / Events

All analytics are **anonymous, privacy-first, and local-first**. No third-party analytics SDK. No user-identifiable data. Events are aggregated locally and shown to the user in the History view. No events are transmitted off-device in MVP.

### 7.1 Event Schema

| Event Name | Fired When | Properties |
|---|---|---|
| `alarm_fired` | Alarm notification triggers task presentation | `task_type` (motion/math/pattern), `difficulty_level` (1–5), `timestamp` |
| `task_started` | User begins interacting with task | `task_type`, `difficulty_level`, `timer_duration_s`, `session_id` |
| `task_completed` | User successfully completes task | `task_type`, `difficulty_level`, `completion_time_s`, `attempts_in_session`, `session_id` |
| `task_failed_timeout` | Timer expires before completion | `task_type`, `difficulty_level`, `timer_duration_s`, `session_id` |
| `snooze_tapped` | User taps Snooze button | `task_type`, `difficulty_level`, `snooze_count_in_session`, `elapsed_since_alarm`, `session_id` |
| `session_conceded` | Maximum snoozes reached; app stops scheduling | `total_snoozes`, `final_difficulty`, `session_duration_s`, `session_id` |
| `streak_updated` | Streak counter changes (increment or reset) | `new_streak_value`, `previous_streak_value`, `is_reset` (bool), `timestamp` |
| `difficulty_changed` | Adaptive algorithm changes difficulty level | `new_level`, `previous_level`, `reason` (snooze_threshold / perfect_week / manual), `timestamp` |
| `settings_changed` | User modifies any setting | `setting_key`, `old_value`, `new_value` |
| `accessibility_mode_toggled` | Accessibility Mode enabled/disabled | `enabled` (bool) |
| `app_launched` | App opened outside alarm context | `timestamp` |
| `history_viewed` | User opens History screen | `timestamp` |

### 7.2 Data Retention

- Events stored locally in a SQLite database (via the boilerplate Storage module).
- Rolling 4-week window: events older than 28 days are purged automatically.
- User can clear all analytics data from Settings → Privacy → Clear History.
- No network transmission. No analytics SDK. No vendor tracking.

---

## 8. Privacy and Security Requirements

### 8.1 Data Classification

| Data | Classification | Storage | Retention |
|---|---|---|---|
| Snooze history (timestamps, counts) | Personal | Local SQLite | 4 weeks rolling |
| Task preferences, difficulty settings | Personal | UserDefaults | Until user deletes app |
| Streak counter | Personal | UserDefaults | Until reset or app deletion |
| Motion accelerometer data | Sensitive (ephemeral) | In-memory only | Duration of alarm session |
| Analytics events | Personal (aggregate) | Local SQLite | 4 weeks rolling |

### 8.2 Privacy Principles

1. **Zero network transmission**: No analytics data, snooze history, task performance, or any user data leaves the device. WakeTask is a fully offline app in MVP.
2. **No third-party SDKs**: The app does not integrate any analytics, advertising, or tracking frameworks. Only Apple first-party frameworks and the SwiftAIBoilerplatePro modules.
3. **No user accounts**: No sign-up, no login, no email collection, no phone number. Zero PII collection.
4. **Motion data is ephemeral**: Accelerometer readings exist only in memory during the active alarm session. Never written to disk. Never persisted.
5. **Transparent permissions**: Only two permissions requested:
   - **Notifications** (`UNAuthorizationOptions`): required for alarm handling. Clearly explained in onboarding.
   - **Motion & Fitness** (`NSMotionUsageDescription`): required for shake-detection task. Description string: "WakeTask uses motion detection only during your alarm to verify you're awake and shaking your phone. No motion is recorded outside of alarm time."
6. **No background motion**: `CMMotionManager` is started when the alarm session begins and stopped when it ends. No background modes for motion. No sleep tracking.
7. **User data control**: All data is deletable from Settings → Privacy → Clear All Data.

### 8.3 Security Requirements

1. **No hardcoded secrets**: Zero API keys, tokens, or credentials in source code, plists, or configuration files. Verified by CI gitleaks scan.
2. **No network requests**: MVP makes zero outbound HTTP/HTTPS connections. This is a deliberate security property — no network surface area, no data exfiltration risk.
3. **App Transport Security**: Default ATS settings (no exceptions needed since no network calls).
4. **Code signing**: Standard Xcode automatic signing for development and TestFlight distribution.
5. **No URL schemes or deep links registered**: Reduces attack surface. No `CFBundleURLTypes`.
6. **No pasteboard access**: The app does not read from or write to `UIPasteboard`.

### 8.4 App Privacy Label (App Store Connect)

- **Data Linked to You**: None
- **Data Used to Track You**: None
- **Data Not Linked to You**: None collected

WakeTask collects no data at all in MVP. This is a marketable privacy advantage.

---

## 9. App Store 4.3 Differentiation Statement

### 9.1 Core Positioning

> **WakeTask: The alarm that learns when you're slacking.**

WakeTask is the only alarm app that adapts its difficulty to *your* snooze patterns. Instead of offering static friction that you habituate to within weeks, WakeTask escalates the challenge when you snooze and rewards consistency when you succeed. It combines multi-modal tasks (motion, math, pattern) with guaranteed variety to prevent predictability-induced automaticity.

### 9.2 Concrete Differentiators vs. Closest Competitor (Alarmy)

| Dimension | Alarmy | WakeTask |
|---|---|---|
| **Task variety** | 2 modes (motion, puzzle) | 3+ modes (motion, math, pattern) with guaranteed rotation |
| **Difficulty adaptation** | Static — same difficulty forever | Adaptive — snoozing makes it harder; perfect weeks reset it |
| **Per-session escalation** | No — same difficulty regardless of snooze count | Yes — snooze 1: baseline, snooze 2: harder, snooze 3: maximum, snooze 4: concede |
| **Habituation prevention** | None — users discover workarounds within 2–4 weeks | Task rotation + difficulty scaling + no-repeat guarantee addresses the retention cliff |
| **Accessibility** | Partial — motion task has no tap alternative | Full — every task type has an accessible alternative; WCAG AAA contrast; VoiceOver complete |
| **Privacy** | Network-connected; analytics | Fully offline; zero data collection; no network calls |
| **Monetization** | Free + Premium ($3.99/mo) | MVP is free; monetization deferred until retention validated |

### 9.3 Why This Passes 4.3 (Spam / Minimum Functionality) Review

- ✅ **Genuine differentiated functionality**: Adaptive difficulty is not cosmetic variation; it's a novel algorithmic feature absent from all competitors.
- ✅ **Meaningful user experience**: Multi-modal task system with rotation, escalation, and accessibility alternatives is substantial engineering, not a template reskin.
- ✅ **Not a clone**: Does not copy Alarmy, Puzzle Alarm, Sleep Cycle, or LOUD Alarm UX patterns. Original interaction model (escalation state machine, rotation algorithm).
- ✅ **Privacy as differentiator**: Fully offline with zero data collection is articulated in metadata and represents a meaningful product property.
- ✅ **Accessibility as first-class feature**: Not bolted on; designed into every task type from the start.
- ✅ **No template fingerprints**: Release strings, feature descriptions, and screenshots must be verified as original during 4.3 hardening audit.

---

## 10. Appium Exploratory Testing Requirements

### 10.1 Test Harness Objective

Run an automated Appium/XCUITest exploratory tapper that clicks every reachable, enabled button and interactive control across all app screens. The harness must fail on:

- Any crash or unhandled exception
- Any broken navigation (screen not reachable, back button broken)
- Any unhandled error screen or blank screen
- Any control that is tappable but produces no visible state change

### 10.2 Screens to Cover

| Screen | Controls to Tap |
|---|---|
| **Onboarding** (3 screens) | "Next," "Skip," swipe gestures, "Get Started" |
| **Settings Home** | All toggles (Task Types × 3), all sliders/pickers (Timer, Difficulty, Haptic), "View History" button, "Accessibility Mode" toggle |
| **Alarm Task: Motion** | "Snooze" button (visible always during task), progress meter (non-interactive, verify visibility) |
| **Alarm Task: Math** | Keypad buttons (0–9, Submit, Clear), "Snooze" button, timer display |
| **Alarm Task: Pattern** | Colored targets (tap reproduction), "Snooze" button |
| **Success Screen** | No buttons (verify dismissable via swipe or auto-dismiss after N seconds) |
| **History View** | Segmented control (Week 1–4), "Export CSV" button, back button |
| **Settings → Privacy** | "Clear History" button with confirmation alert |

### 10.3 Tap Strategy

1. Launch app fresh (clear UserDefaults).
2. Navigate through onboarding tapping every enabled control.
3. Land on Settings Home. Toggle each switch on/off. Adjust each slider to min, max, and midpoint.
4. Navigate to History. Tap each segment. Tap Export. Dismiss share sheet if appears.
5. Simulate alarm session via deep-link or test hook. Verify task screen renders.
6. Tap every keypad/control on each task type screen.
7. Tap Snooze. Verify backup alarm scheduled.
8. Force-complete task via test hook. Verify success screen.
9. Enable Accessibility Mode. Repeat task screen verification.

### 10.4 iOS Simulator Configuration

- Device: iPhone 16 (or latest available iOS simulator)
- OS: Latest iOS version supported by Xcode
- Accessibility: VoiceOver enabled for one pass, disabled for one pass
- Dynamic Type: Largest setting for one pass, default for one pass

---

## 11. SwiftAIBoilerplatePro Module Reuse Plan

### 11.1 Module Inventory (Keep Unchanged)

| Module | Reasoning |
|---|---|
| **Auth** | Keep but unused in MVP. No login/sign-up, but module remains available for potential v1.2 social features. Do not remove — it's integrated into CompositionRoot and removing it risks regressions. |
| **DesignSystem** | Use as-is. Provides typography (SF Pro Display), color palette, spacing, and accessibility primitives. Rebrand with WakeTask color tokens (dark-mode primary with high-contrast accent). |
| **AppLogger** | Use as-is. All logging (info, debug, error, fault) must go through `AppLogger`. Zero `print()` statements. |
| **Storage** | Use as-is. SQLite-backed local persistence for snooze history, analytics events, and user preferences. |
| **Localization** | Use as-is. Add WakeTask-specific `.strings` files for all user-facing text. Support English for MVP. |
| **Settings** | Adapt (see below). |
| **Networking** | Keep but unused in MVP. No network calls. Module remains available for future versions. Do not remove. |
| **AI** | Keep but unused. Deferred to potential v1.2 for voice task. |
| **Payments** | Keep but unused. MVP is free. Module remains for potential monetization. |

### 11.2 Modules to Adapt

| Module | Changes |
|---|---|
| **Settings** | Add WakeTask-specific settings screen: task type toggles, timer durations per task, difficulty range pickers, haptic intensity, accessibility mode, privacy controls (clear data). Use existing Settings pattern (`@Observable` view model, `UserDefaults`/Storage persistence). |
| **DesignSystem** | Add WakeTask brand colors: high-contrast green accent for success, amber for deadline warning, red for timeout. Add alarm-specific typography scale (minimum 18pt, large timer at 48pt+). These are token additions, not module rewrites. |
| **App Entry / CompositionRoot** | Configure root view to present onboarding (first launch) or Settings Home (returning user). Wire up Notification delegate. Register alarm session handler. |

### 11.3 New Modules to Add

| Module | Purpose | File Budget |
|---|---|---|
| **AlarmSession** | Manages alarm lifecycle: activation, task presentation, snooze flow, escalation state machine, timer, and dismissal. Core of the app. | ≤400 lines per file; split into `AlarmSessionManager`, `TaskPresenter`, `EscalationEngine`, `TimerController`. |
| **Tasks** | Contains the three task implementations: `MotionTask`, `MathTask`, `PatternTask`. Each conforms to `TaskProtocol` with `start()`, `evaluate()`, `cancel()`, and `accessibilityAlternative()`. | ≤400 lines per task file; protocol in separate file. |
| **TaskRotation** | Algorithm for daily task selection, no-repeat guarantee, and task pool management. | ≤200 lines. |
| **AdaptiveDifficulty** | Computes difficulty level from snooze history, streak data, and user-configured floor/ceiling. Pure function design for testability. | ≤200 lines. |
| **SnoozeHistory** | CRUD operations on snooze events, streak computation, weekly aggregation. Uses Storage module for persistence. | ≤300 lines. |
| **Analytics** | Local event recording, aggregation queries (weekly counts, task type breakdown), and CSV export. | ≤300 lines. |
| **Accessibility** | Accessibility Mode state management, VoiceOver annotations, dynamic type responder, reduced-motion coordinator. | ≤250 lines. |

### 11.4 Swift 6 Concurrency

- All new modules use `async/await` with `@MainActor` for UI-bound state.
- `CMMotionManager` callbacks are dispatched to a serial `DispatchQueue` and bridged to `AsyncStream` for Swift concurrency.
- No `@unchecked Sendable` unless justified with inline documentation. Target: zero concurrency warnings.
- `@Observable` view models (Swift 6 compatible) for all UI state.

---

## 12. Definition of Done

### 12.1 Code Complete

- [ ] All P0 features (F1–F6, F8–F10, F12–F13, F15, F19) are implemented and function correctly.
- [ ] All P1 features (F7, F11, F14, F16–F17) are implemented.
- [ ] All acceptance criteria (AC1–AC21) pass.
- [ ] All edge cases (EC1–EC6) are handled.
- [ ] No `print()` statements; all logging via `AppLogger`.
- [ ] No production Swift file exceeds 400 lines.
- [ ] Swift 6 strict concurrency: zero warnings, zero `@unchecked Sendable` without documented justification.

### 12.2 Quality Gates (Blocking)

- [ ] `xcodebuild build` passes on macOS.
- [ ] `xcodebuild test` passes with all unit and integration tests.
- [ ] SwiftLint strict mode: zero violations.
- [ ] SwiftFormat lint mode: zero violations.
- [ ] Qlty check: zero high-severity issues on changed code.
- [ ] gitleaks/trufflehog scan: zero findings.
- [ ] Appium/XCUITest exploratory tapper completes without crashes, broken navigation, or unhandled errors.

### 12.3 App Store Readiness

- [ ] App Store 4.3 release string audit: zero boilerplate/template fingerprints in display name, subtitle, description, keywords, or screenshots.
- [ ] `NSMotionUsageDescription` string is original and clearly explains motion usage.
- [ ] Privacy label configured correctly: "Data Not Collected" for all categories.
- [ ] All user-facing strings are in Localizable.strings; no hardcoded English in source.
- [ ] App icon is original (not boilerplate default) — a simple, high-contrast icon representing the wake-up concept.
- [ ] Screenshots (or screenshot placeholders) are generated showing the task UI at various states.

### 12.4 Documentation

- [ ] `apps/waketask-iphone/README.md` describes: app purpose, setup instructions, module map, build/test commands, and privacy architecture.
- [ ] Architecture decision record (ADR) written for adaptive difficulty algorithm (why this design over alternatives).
- [ ] ADR written for offline-first / zero-network MVP decision.
- [ ] All `// MARK:` sections in source accurately describe code organization.

### 12.5 TestFlight Handoff Readiness

- [ ] Archive builds successfully.
- [ ] TestFlight export configuration is documented (or the Xcode project is configured for "Automatically manage signing").
- [ ] Beta App Review Information fields are populated with test credentials and demo instructions.
- [ ] Known issues (if any) are documented in TestFlight "What to Test" notes.