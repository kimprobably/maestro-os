# WakeTask iPhone App Specification
**Model Identity**: anthropic/claude-haiku-4-5 (spec_claude)  
**Date**: 2026-05-14  
**Status**: Independent Spec Candidate (spec_fanout/pass1)  
**Target**: TestFlight-ready iPhone app using SwiftAIBoilerplatePro

---

## Executive Summary

**WakeTask** is a task-based alarm and morning accountability app that combines reliable wake-up functionality with first-task completion tracking. Unlike generic puzzle alarms, WakeTask ties alarm dismissal to user-selected morning priorities, creating momentum for the full day. The MVP bundles iOS-native local notifications + in-app audio/haptics, integrated task selection from Reminders/Calendar, streak tracking, iCloud sync, and lock screen widgets—positioning WakeTask as the primary morning routine tool, not a peripheral app.

**Core Insight**: Users don't just need to wake up; they need to *start* their day with purpose. WakeTask makes this connection explicit.

---

## 1. Problem Statement

### Primary Pain Point
iOS users ages 18-60 struggle with **two interconnected failures**:
1. **Unreliable wakefulness**: Existing alarms either fail (user sleeps through) or succeed but cause stress/fatigue
2. **Loss of morning momentum**: Even when users wake, they lack accountability for initiating their first priority task, leading to procrastination and reactive work days

### Secondary Pain Points
- **Fragmentation**: Users juggle separate alarm, task, and habit-tracking apps with no connection
- **Data loss**: Switching phones or reinstalling apps results in lost streak history
- **Accessibility barriers**: Aggressive alarms cause anxiety or sensory overload for ADHD and neurodivergent users
- **Novelty decay**: Generic challenge-based alarms lose engagement after 3-4 weeks

### Emotional Driver
Users want to **earn** morning success by connecting it to something meaningful (a real task) and see it reflected in long-term momentum (streaks, milestones). This transforms waking up from a survival mechanism into an identity-shaping habit.

---

## 2. Target User

### Primary User Persona
- **Demographics**: Ages 25-45, iOS users in US/English-speaking markets (initial)
- **Tech comfort**: Moderate to high (comfortable with iOS settings, apps, possibly Shortcuts)
- **Daily behavior**: Smartphone-dependent; wants reliability and integration
- **Motivation**: Seeks structure and accountability to "win the morning" as foundation for better days
- **Pain sensitivity**: Values simplicity over aggressive features; values data persistence; wants accessible options

### Secondary Segments (v1 opportunity)
- **ADHD/neurodivergent users**: Need gentle, non-punitive wake mechanics with sensory options
- **Power users**: Willing to pay for integrations and advanced customization (v2 expansion)
- **Habit practitioners**: Already using streaks/accountability apps; seeking unified morning experience

---

## 3. MVP Feature Set

### 3.1 Core Alarm Functionality
- **Local Notification Scheduling**: iOS UNUserNotificationCenter API for reliable wake-time delivery
  - Configurable wake time (time picker UI)
  - Recurrence patterns (every day, weekdays only, custom days, one-time)
  - Persistence: alarms survive app closure and device sleep
- **In-App Alarm Audio & Haptics Flow** (MVP alarm delivery mechanism):
  - When local notification fires at wake time, app launches to foreground (or user taps notification)
  - In-app alarm audio starts: configurable wake sound (system alert tones or custom audio)
  - Haptic feedback: escalating vibration pattern (accessibility-inclusive)
  - **Critical Alerts (optional post-MVP)**: If entitlement granted, can be added as premium feature; not assumed for MVP
- **Alarm Screen Visual**:
  - Large, clear display of wake time and recurrence
  - **Morning task title prominently displayed** (read from user-selected Reminders/Calendar task)
  - Task description/notes if available
  - Completion affordance: checkbox or swipe gesture to mark done
  - No ambiguous dismiss buttons; only task completion stops alarm

### 3.2 Morning Task Integration
- **Task Source Selection**:
  - User picks morning task from Reminders (read-only access)
  - Fallback: user types manual task name if no Reminders task selected
  - Task persistence: linked to alarm, synced via iCloud
- **Alarm Screen UX**:
  - Task title visible in large, accessible font
  - Task completion flow: user checks box or swipes to mark done
  - Haptic confirmation when task marked complete
  - Alarm dismisses only after task completion (no accidental silent dismissal)

### 3.3 Streak Tracking & Calendar Visualization
- **Streak Counter**:
  - Displays current consecutive-day count
  - Resets only if user fails to complete task by end of day (configurable grace period, default midnight)
  - Stored in iCloud for persistence across devices
- **Calendar Views**:
  - 7-week view (last 49 days): day-by-day completion dots
  - 30-week view (6-month): month-by-month completion summary
  - Completion states: done (filled), missed (empty), frozen/paused (special indicator)
- **Milestone Recognition** (psychological engagement):
  - Day 7: "One week of mornings owned"
  - Day 30: "One month streak"
  - Day 90: "Three months and counting"
  - Non-aggressive language; optional sound/haptic notification, no celebratory pop-ups

### 3.4 iCloud Sync & Data Persistence
- **CloudKit Integration**:
  - Alarms, streaks, task preferences, settings synced via iCloud
  - Graceful conflict resolution (last-write-wins for non-critical data; conservative for streaks)
  - Offline mode: app functions locally; syncs when connectivity restored
- **Data Model**:
  - User owns all data; no cloud lock-in beyond iCloud standard
  - Export-friendly: data structured for potential future backup/migration
  - No proprietary cloud dependency; iCloud is primary sync layer

### 3.5 Lock Screen Widget
- **Widget Visibility** (iOS 16+):
  - Lock screen widget displays: current streak count (large, glanceable)
  - Today's morning task title (single line, truncated if needed)
  - Optional quick-tap affordance to open app (if feasible via WidgetKit)
- **Update Frequency**: Synced with task completion and streak changes (near real-time)
- **Accessibility**: Readable by VoiceOver; tap target meets minimum size guidelines

### 3.6 Shortcuts Integration
- **Exposed Actions**:
  - "Complete Morning Task": marks today's task as done (callable from any Shortcut)
  - "Get Current Streak": returns streak count for use in other automations
  - "Get Morning Task": returns today's task title
- **Use Cases**:
  - Users can build custom morning routines (e.g., "complete task → play music → start focus mode")
  - Third-party automations can query WakeTask state
- **Security**: Shortcuts actions require explicit user grant (standard iOS permission flow)

### 3.7 Settings & Customization
- **Wake Audio**:
  - Volume slider (0-100%)
  - System alert tone selector or custom audio option
  - Mute/silent mode respect
- **Sensory Options** (accessibility):
  - Low-volume wake alert option (respects user preference for gentle sound)
  - Phased vibration escalation (soft → strong over 30 seconds)
  - Option to disable audio entirely (vibration + notification only)
  - VoiceOver hints for all controls
- **Snooze Behavior**:
  - Snooze disabled by default (reinforces "complete task" rule)
  - Optional 5/10/15-minute snooze if enabled (but snooze doesn't count as completion)
- **Data & Privacy**:
  - iCloud sync on/off toggle
  - Local-only mode option (no cloud sync, but data persists locally)
  - Delete all data option (with confirmation)
  - Privacy policy link
- **App Links**:
  - Link to Reminders app (to create/manage tasks)
  - Link to Calendar app
  - Link to iOS Shortcuts app

### 3.8 Accessibility (WCAG 2.1 AA Compliance)
- **VoiceOver Support**:
  - All interactive elements have descriptive labels
  - Screen hierarchy logical and navigable
  - Text size respects system settings
- **Motor**:
  - Tap targets ≥ 44×44 points
  - Gestures have alternative button options (swipe + checkbox both work for task completion)
  - No required rapid taps or hold gestures
- **Auditory**:
  - No sound-only alerts; visual + haptic alternatives provided
  - Captions/transcripts not applicable for MVP (no media)
- **Visual**:
  - Color contrast ≥ 4.5:1 for text
  - No reliance on color alone for information (e.g., status uses text + color)

### 3.9 Notifications & Re-engagement (MVP)
- **Local Notifications**:
  - Daily notification at wake time (requires UNUserNotificationCenter permission)
  - Optional re-engagement notification if streak active (e.g., 8 PM: "Tomorrow: complete your morning task")
- **No Push Notifications** (MVP): No server-side push; only local scheduling

---

## 4. Non-Goals for MVP

### Out of Scope
- ❌ **AI/Machine Learning**: No personalized wake timing, sleep analysis, or adaptive alarms
- ❌ **Social Accountability**: No public streaks, friend challenges, leaderboards, or sharing
- ❌ **Financial Consequences**: No Beeminder, Stickk, or bet-based integrations
- ❌ **Advanced Task Customization**: No multiple tasks, templates, conditional logic, or task scheduling
- ❌ **Apple Health Integration**: No sleep tracking, step counting, or health data read/write
- ❌ **Video/Media**: No guided wake routines, meditations, music streaming, or audiobook integration
- ❌ **Browser/Web**: No web dashboard or account management
- ❌ **Cross-Platform**: No Android, watchOS, or macOS apps for MVP
- ❌ **Critical Alerts**: No entitlement assumption; optional post-MVP if granted
- ❌ **Premium Paywall**: MVP includes all core features; no aggressive feature gating

---

## 5. User Journeys

### Journey 1: First-Time Setup (Onboarding)
```
User opens WakeTask for first time
→ Welcome screen explains core value ("Win your morning with purpose")
→ Request notification permission (required for alarm)
→ Pick wake time (time picker)
→ Pick recurrence (every day / weekdays / custom)
→ Select morning task (Reminders picker or manual entry)
→ Confirm setup
→ See streak dashboard (0 days)
→ Close app; notification scheduled
```
**Goal**: Setup in <2 minutes; user confident alarm will fire.

### Journey 2: Morning Alarm Experience
```
[6:30 AM] Local notification fires
→ User taps notification or app opens to foreground
→ Alarm screen displays: wake time, task title, audio/haptic alarm running
→ User sees task description
→ User checks checkbox or swipes to mark task done
→ Alarm stops; haptic confirmation; screen shows "Task complete! ✓"
→ Streak incremented; user sees dashboard
→ User exits app (or stays for motivation)
```
**Goal**: Alarm reliably wakes user; task completion is clear and satisfying; streak updates immediately.

### Journey 3: Checking Streak Progress
```
User opens app during day
→ Dashboard shows: current streak count, today's task (completed ✓)
→ Calendar view shows week/month of completions
→ User sees milestone (e.g., "Day 30 reached!")
→ Motivational message reinforces momentum (not punitive)
→ User can browse historical completions
```
**Goal**: Visible progress; psychological reinforcement; sustained engagement.

### Journey 4: Changing Wake Time
```
User goes to Settings
→ Taps "Edit Alarm"
→ Changes wake time or recurrence
→ Changes morning task (Reminders picker)
→ Saves; new alarm scheduled
→ Old alarm cancelled; iCloud sync updated
```
**Goal**: Flexibility without friction; no broken alarms after edit.

### Journey 5: Missed Morning
```
[User oversleeps; misses 6:30 AM alarm]
→ User opens app at 11 AM
→ Dashboard shows: "Streak frozen" or "Streak broken" (configurable)
→ Message: "Tomorrow's a fresh start. Set your alarm again?"
→ User confirms for next morning
→ Streak resets to 0 (or shows option to freeze for vacation)
```
**Goal**: Non-punitive communication; user invited back, not shamed out.

### Journey 6: Using Shortcuts
```
User creates Shortcut: "Morning Routine"
→ Shortcut includes WakeTask action: "Complete Morning Task"
→ When Shortcut runs, WakeTask task marked complete (even from lock screen)
→ Streak updates automatically
→ User sees confirmation
```
**Goal**: Power users can automate; integration is seamless.

---

## 6. Acceptance Criteria

### Feature Completeness
- ✅ Alarm scheduling works across app foreground, background, and device sleep states
- ✅ Task selection from Reminders is available at first setup and in settings
- ✅ Streak counter displays correctly and resets on day boundaries
- ✅ Calendar visualization renders 7-week and 30-week views without crashes
- ✅ iCloud sync replicates alarms, streaks, and settings across 2+ devices
- ✅ Lock screen widget displays streak count and task title; tappable (if WidgetKit supports)
- ✅ Shortcuts actions ("Complete Morning Task", "Get Streak", "Get Task") execute without error
- ✅ Settings persist across app closure and device restart
- ✅ Local notifications respect system Do Not Disturb and notification settings

### User Experience
- ✅ Onboarding completes in <2 minutes with 0 confusion (QA validation)
- ✅ Alarm screen is unambiguous: task title prominent, no hidden dismiss buttons
- ✅ Task completion gesture (checkbox or swipe) is discoverable without tutorial
- ✅ Streak milestones (7, 30, 90 days) trigger acknowledgment without aggressive celebration
- ✅ Missed morning messaging is non-punitive and invites re-engagement
- ✅ Lock screen widget is visible and accurate in real-time

### Accessibility (WCAG 2.1 AA)
- ✅ VoiceOver reads all screen elements correctly; screen order is logical
- ✅ All tap targets ≥ 44×44 points
- ✅ Color contrast meets 4.5:1 for text; no color-only information
- ✅ Low-volume wake option available and functional
- ✅ Phased vibration escalation configurable
- ✅ Gestures have button alternatives (swipe + checkbox both complete task)

### Data & Reliability
- ✅ iCloud sync is bidirectional and conflict-free (tested across 2+ devices)
- ✅ Data persists after app delete and reinstall (via iCloud)
- ✅ Offline mode functions; syncs when connectivity restored
- ✅ No data loss on app crash, device sleep, or force-quit
- ✅ Alarms survive: app closure, device restart, notification settings changes

### Performance & Quality
- ✅ App launch time <2 seconds
- ✅ Calendar rendering <500ms for 49-day or 6-month view
- ✅ No crashes on alarm fire, task completion, or settings change
- ✅ Memory usage <150MB under typical use (measured via Xcode Profiler)
- ✅ Battery impact of local notifications measured and documented

### Security & Privacy
- ✅ No hardcoded credentials or secrets in code
- ✅ iCloud data encrypted in transit and at rest (Apple-managed)
- ✅ No tracking or analytics without explicit consent
- ✅ Reminders access is read-only; no modification
- ✅ App follows App Store Privacy Policy requirements (4.3 submission)

### Testing Evidence
- ✅ XCTest unit tests cover: alarm scheduling, streak logic, iCloud sync
- ✅ Appium/XCUITest exploratory testing: all reachable buttons tapped, alarm fired
- ✅ SwiftLint and SwiftFormat passing without suppressions
- ✅ No secret scanning violations (environment-based credentials checked, not printed)
- ✅ App built and tested on real iOS device (iPhone 14+) or simulator

---

## 7. Analytics & Events (MVP)

### Analytics Framework
WakeTask uses local-only telemetry (no external analytics service for MVP) to understand user engagement:

### Events to Track
1. **Onboarding**
   - `onboarding_started`: User opens app first time
   - `onboarding_task_selected`: User selects morning task
   - `onboarding_alarm_scheduled`: Alarm scheduled successfully
   - `onboarding_completed`: User reaches dashboard after setup

2. **Alarm Events**
   - `alarm_fired`: Local notification delivered at wake time
   - `alarm_tapped`: User taps notification to open app
   - `alarm_screen_shown`: Alarm screen displayed in foreground
   - `task_completed`: User marks task done (checkbox or swipe)
   - `alarm_dismissed`: Alarm stops playing

3. **Streak Events**
   - `streak_incremented`: Streak counter increased (daily)
   - `streak_broken`: Streak reset to 0 (missed day)
   - `milestone_reached`: Day 7, 30, or 90 achieved
   - `streak_frozen`: User pauses streak (vacation/sick day)

4. **Engagement**
   - `dashboard_viewed`: User opens dashboard
   - `calendar_viewed_7week`: User opens 7-week calendar
   - `calendar_viewed_30week`: User opens 30-week calendar
   - `settings_changed`: User modifies any setting

5. **System**
   - `app_launched`: App comes to foreground
   - `app_backgrounded`: App closed or backgrounded
   - `icloud_sync_completed`: Data synced to cloud
   - `icloud_sync_failed`: Sync error (logged with error code, not sensitive data)

### Storage
- Events stored locally in Core Data (not synced to cloud for MVP)
- Retention: Last 90 days
- User can request deletion via Settings

### Analytics Dashboard (Post-MVP)
Future enhancement: dashboards for:
- 1-day, 7-day, 30-day, 90-day retention cohorts
- Daily active users (DAU) and streak engagement
- Churn by day (when users abandon app)
- Most-used features (alarm vs. streak vs. widgets)

---

## 8. Privacy & Security Requirements

### Data Model
- **User Data**: Alarm times, recurrence rules, task titles, streak history, settings, preferences
- **No PII Collected**: No names, emails, phone numbers, location, health data (for MVP)
- **Reminders Integration**: Read-only access to user's existing tasks; WakeTask stores task *title* only, not full task object

### Privacy Controls
1. **Notification Permission**: User must grant permission; can be revoked in Settings
2. **iCloud Sync Toggle**: User can disable cloud sync; data stays local only
3. **Data Deletion**: User can delete all WakeTask data in-app with confirmation
4. **Privacy Policy**: In-app link to privacy policy explaining iCloud storage, no tracking, data retention

### Security Measures
1. **Code Secrets**:
   - No hardcoded API keys, credentials, or tokens
   - Environment variables for any future API calls (not used in MVP)
   - Secret scanning gates enabled (SwiftLint, Qlty) to prevent secret commits

2. **Data Encryption**:
   - iCloud data encrypted by Apple (CloudKit standard)
   - Local data stored in standard iOS app container (encrypted by file system)
   - No additional encryption layer needed for MVP

3. **Reminders Access**:
   - EventKit framework used for read-only access
   - Explicit user permission required (standard iOS prompt)
   - No write or delete permissions

4. **Authentication & Sync**:
   - CloudKit uses device credential (iCloud account)
   - No custom authentication server
   - Cross-device sync requires same iCloud account

### Compliance
- **App Store Guidelines 4.3**: Privacy policy provided; no tracking without consent
- **GDPR** (if applicable): No EU user data collection assumed for MVP; privacy policy links to deletion rights
- **CCPA** (if applicable): California users can delete data via in-app deletion
- **Accessibility**: WCAG 2.1 AA compliance documented (see Accessibility section)

---

## 9. App Store 4.3 Differentiation Statement

### App Name & Subtitle
- **App Name**: WakeTask
- **Subtitle**: "Your first task, every morning"

### Short Description (30 words max)
"Win your morning with purpose. WakeTask combines a reliable alarm with your most important task, building momentum through streaks and iOS integration."

### Long Description (4000 characters)
```
WakeTask redefines the alarm app. Instead of puzzle challenges or aggressive sounds, your alarm dismisses only when you complete your selected morning task. This simple shift transforms your wake-up from a survival mechanism into the foundation of a successful day.

CORE FEATURES:
• Task-based alarm dismissal: Wake up means completing a real priority, not solving arbitrary puzzles
• Deep iOS integration: Alarms pull from Reminders, sync via iCloud, work with Shortcuts and widgets
• Streak accountability: Visual progress tracking (7-week and 30-week calendars) builds momentum without shame
• Accessible design: Gentle wake modes, sensory options, VoiceOver support—built for all users
• Lock screen widget: See your streak and today's task at a glance

WHY WAKETASK IS DIFFERENT:
Most alarm apps treat alarms as isolated features. WakeTask integrates your alarm, task, and streak into one cohesive morning system. Your first task isn't an afterthought—it's the definition of success.

Competitors offer:
- Puzzle alarms (novelty wears off in weeks)
- Separate alarm + task apps (manual data entry, fragmentation)
- Habit trackers without alarms (no wake-up enforcement)

WakeTask offers:
- Alarm dismissal tied to meaningful task completion
- System-level iOS integration (Reminders, Calendar, Shortcuts, widgets, iCloud sync)
- Accessibility-first design with sensory options
- Long-term habit formation focus (90+ day retention design)

PRIVACY & SECURITY:
• All data synced via iCloud—encrypted and private
• No tracking, no ads, no aggressive paywalls
• Read-only Reminders access; you control all data

BUILD YOUR MORNING MOMENTUM TODAY.
```

### Key Differentiators (for review)
1. **Uniqueness**: No competitor bundles alarm + task dismissal + iOS integration + accessibility in one cohesive product
2. **Originality**: Task-based dismissal mechanic differs fundamentally from puzzle alarms (Alarmy, Puzzle Alarm) and habit trackers (Streaks, Done)
3. **User Benefit**: Saves time (one app vs. three); increases success rate (task-based accountability); reduces friction (system integration)
4. **Sustainability**: Monetization is honest ($3-5/month); user retention likely higher (morning routine habit stickiness); defensible market position (deep iOS integration hard to replicate)

### Screenshots & Visuals
*(Specified for implementation phase; not detailed here)*
- Screenshot 1: Alarm screen with task prominently displayed
- Screenshot 2: Streak calendar showing 30-day progress
- Screenshot 3: Lock screen widget
- Screenshot 4: Reminders task picker
- Screenshot 5: Settings and accessibility options

---

## 10. Appium/XCUITest Exploratory Testing Requirements

### Testing Scope
Appium and XCUITest exploratory taps validate:
- **Every reachable, enabled button/control** is tappable without crash
- **Alarm firing** is reliable (local notification delivered, in-app audio/haptics triggered)
- **Critical user flows** (setup, alarm completion, streak tracking) function end-to-end
- **Accessibility** (VoiceOver, tap target sizes) is validated

### Test Scenarios

#### Scenario 1: Onboarding & First Setup
```
1. Tap "Get Started" button
2. Grant notification permission
3. Tap time picker; select 6:30 AM
4. Tap recurrence picker; select "Every Day"
5. Tap Reminders picker; select a sample task
6. Tap "Confirm" button
7. Verify: Alarm scheduled, dashboard shows 0-day streak
```
**Expected**: No crashes; alarm visible in system notification settings.

#### Scenario 2: Alarm Fire & Task Completion
```
1. Schedule alarm for 1 minute from now (test time)
2. Wait for notification to fire
3. Tap notification to open app
4. Verify: Alarm screen shows, audio/haptics playing
5. Tap task completion checkbox
6. Verify: Alarm stops, streak increments to 1
```
**Expected**: Alarm reliably fires; completion gesture is responsive; UI reflects streak change.

#### Scenario 3: Calendar Navigation
```
1. Open dashboard
2. Tap "7-week calendar" button
3. Swipe/scroll to see all weeks
4. Tap "30-week calendar" button
5. Swipe/scroll to see all months
6. Tap back to dashboard
```
**Expected**: No crashes; calendar renders without lag; navigation smooth.

#### Scenario 4: Streak Milestone
```
1. Manually set streak to day 6 (via test fixture or repeated completions)
2. Complete alarm flow next day
3. Verify: Dashboard shows milestone notification ("Day 7 reached!")
4. Tap dismiss or confirm
```
**Expected**: Milestone triggers; message is clear; no app crash.

#### Scenario 5: Settings & Customization
```
1. Open Settings
2. Tap volume slider; drag to 50%
3. Tap wake sound dropdown; select different tone
4. Tap "Sensory options"; toggle low-volume mode
5. Tap "Low-volume wake" toggle ON
6. Tap back
7. Trigger test alarm; verify low volume
```
**Expected**: Settings persist; wake sound changes apply; low-volume mode works.

#### Scenario 6: Lock Screen Widget (iOS 16+)
```
1. Add lock screen widget via iOS lock screen edit
2. Select WakeTask widget
3. Unlock device; view lock screen
4. Verify: Streak count visible, task title visible
5. Tap widget (if supported); app opens
6. Complete alarm; go back to lock screen
7. Verify: Widget streak count updated
```
**Expected**: Widget displays correctly; tappable; updates in real-time.

#### Scenario 7: Shortcuts Integration
```
1. Open Shortcuts app
2. Create test Shortcut with WakeTask action "Complete Morning Task"
3. Run Shortcut
4. Return to WakeTask
5. Verify: Task marked complete, streak incremented
```
**Expected**: Shortcut executes without error; WakeTask state changes reflect in app.

#### Scenario 8: iCloud Sync (Multi-Device Simulation)
```
1. Create alarm + complete task on Device A (streak = 1)
2. On Device B (same iCloud account): Open WakeTask
3. Wait for sync
4. Verify: Alarm and streak visible on Device B
5. Modify alarm on Device B; verify change on Device A after sync
```
**Expected**: Sync is bidirectional; no conflicts; data consistent across devices.

#### Scenario 9: Accessibility (VoiceOver)
```
1. Enable VoiceOver (Settings > Accessibility > VoiceOver)
2. Open WakeTask
3. Swipe right to navigate each element
4. Verify: All elements read with descriptive labels (not "Button 1", but "Complete task button")
5. Double-tap key actions (Setup, Complete, Settings)
6. Verify: Actions work with VoiceOver enabled
```
**Expected**: All elements accessible; no silent failures; screen order logical.

#### Scenario 10: Edge Cases & Error Handling
```
1. Schedule alarm; turn off notifications in iOS Settings
2. Open WakeTask; verify graceful handling (warning message?)
3. Turn notifications back on
4. Schedule alarm; restart app mid-alarm-fire
5. Verify: Alarm state preserved; no duplicate notifications
6. Force-quit app; trigger alarm
7. Verify: Local notification still fires; app relaunches or user can tap notification
```
**Expected**: No crashes; degraded mode acceptable (warnings shown); alarms survive app state changes.

### Appium Script Execution
- All scenarios automated in Appium (XCUITest backend on iOS)
- Results logged with: test name, status (pass/fail/crash), duration, screenshot on failure
- Critical path tests (onboarding, alarm fire, completion, sync) must pass 100%
- Edge case tests may have known limitations (e.g., multi-device sync may require manual verification if automation framework lacks multi-device support)

### Evidence Requirements
- Appium test report: `.workflow/iphone-app-factory/appium-test-report.json` (or similar)
- Screenshots on failure: `.workflow/iphone-app-factory/appium-failures/` (if any)
- Devices tested: iPhone 14, iPhone 15 (simulator) or real hardware
- iOS versions: 16.x and 17.x minimum

---

## 11. SwiftAIBoilerplatePro Module Reuse Plan

### Boilerplate Architecture Overview
SwiftAIBoilerplatePro provides:
- **DesignSystem**: SF Symbols, typography, spacing, colors
- **Networking**: HTTP client, error handling (not used in MVP; local app only)
- **Storage**: Core Data + CloudKit helpers, Codable extensions
- **Authentication**: iCloud credential handling (used for CloudKit)
- **Testing**: XCTest utilities, mock data fixtures
- **Navigation**: SwiftUI navigation patterns, routing stack
- **Localization**: Base strings file structure (en, es, fr, de, etc.)

### MVP Module Reuse

#### 1. **DesignSystem** (100% reuse)
- **Usage**: All UI components follow DesignSystem specs
- **Components used**:
  - `DSTypography`: Font sizes, weights for alarm time, task title, streak count
  - `DSSpacing`: Standard 8px, 16px, 24px grid for layout
  - `DSColors`: Primary (accent), secondary, warning, success, neutral palette
  - `DSSFSymbols`: Icons for checkmark, calendar, gear, widgets
- **No customization needed**: Colors/typography inherit from system app theme

#### 2. **Storage** (90% reuse with extension)
- **Usage**: Persist alarms, streaks, settings via Core Data + CloudKit
- **Modules used**:
  - `CoreDataStack`: Database initialization, migrations
  - `CloudKitSync`: Automatic iCloud sync of entities
  - `CodableHelpers`: Serialize/deserialize alarm and streak models
- **Extension needed**: Custom `CloudKitRecord` conformance for `WakeTaskAlarm` and `StreakDay` entities (20-30 lines of code)
- **New models** (WakeTask-specific):
  - `WakeTaskAlarm`: time, recurrence, taskTitle, enabled
  - `StreakDay`: date, completed, taskTitle
  - `UserSettings`: wakeVolume, soundChoice, sensoryMode, snoozeEnabled

#### 3. **Testing** (80% reuse)
- **Usage**: XCTest framework, mock data factories
- **Modules used**:
  - `MockDataFactory`: Generate test alarms, streaks, fixtures
  - `XCTestExtensions`: Helper assertions, async/await support
- **Extensions needed**: Custom factory methods for `WakeTaskAlarm` and `StreakDay` (fixtures)
- **New tests** (WakeTask-specific):
  - Streak increment/reset logic
  - iCloud sync conflict resolution
  - Notification scheduling
  - Shortcut action execution

#### 4. **Localization** (80% reuse)
- **Usage**: Strings file for UI text (en, es, fr, de initially)
- **Modules used**:
  - Base `.strings` file structure
  - `Localizable.strings()`  macro for runtime localization
- **Extensions needed**: WakeTask-specific strings (alarm, task, milestone, settings labels)
- **New strings**:
  - "Complete your task to dismiss alarm"
  - "Day 7 streak reached!"
  - "Low-volume wake mode"
  - etc. (~80 strings for MVP)

#### 5. **Navigation** (70% reuse)
- **Usage**: SwiftUI navigation patterns for tab bar, settings, modals
- **Modules used**:
  - `NavigationRouter`: Root-level navigation state
  - `ModalStack`: Present settings, onboarding overlays
  - `DeepLinkHandler`: Handle app launches from notifications
- **Extensions needed**: WakeTask routes (dashboard, alarm, settings, onboarding)
- **New routes** (10-15 lines):
  - `.dashboard`
  - `.alarmSetup`
  - `.alarmActive(alarmID)`
  - `.settings`
  - `.onboarding`

#### 6. **Authentication** (50% reuse)
- **Usage**: iCloud identity for CloudKit
- **Modules used**:
  - `CloudKitAuth`: Check iCloud account status, handle auth errors
- **No customization**: iCloud auth is transparent for MVP; user's existing iCloud account is used
- **Error handling**: Display message if iCloud unavailable (graceful fallback to local-only mode)

### Boilerplate Modules NOT Reused (MVP Constraints)

#### Excluded Modules
1. **Networking**: No server/API for MVP (local app only)
   - ❌ `HTTPClient`, `APIRouter`, `NetworkingError`
2. **Analytics**: No external analytics service for MVP (local telemetry instead)
   - ❌ `AnalyticsClient`, `EventLogger`
3. **AI/ML**: No ML models or AI integrations for MVP
   - ❌ `MLModelManager`, `CoreMLHelper`
4. **Payments**: No in-app purchases for MVP (all features free)
   - ❌ `StoreKitManager`, `ReceiptValidator`
5. **Notifications**: Custom notification handling (not boilerplate's generic push)
   - ℹ️ Use `UNUserNotificationCenter` directly for local alarms

### Implementation Strategy

#### Step 1: Extend Storage Models
Create `WakeTaskAlarm` and `StreakDay` models conforming to boilerplate's `CoreDataEntity` protocol:
```swift
// Pseudo-code; actual implementation in feature branch
class WakeTaskAlarm: NSManagedObject, CoreDataEntity {
    @NSManaged var wakeTime: Date
    @NSManaged var recurrence: String // "daily", "weekdays", etc.
    @NSManaged var taskTitle: String
    @NSManaged var enabled: Bool
}
```

#### Step 2: Extend Localization
Add WakeTask strings to boilerplate's `Localizable.strings`:
```swift
"complete_to_dismiss" = "Complete to dismiss"
"day_7_milestone" = "One week of mornings owned"
// etc.
```

#### Step 3: Extend Navigation
Add WakeTask routes to boilerplate's router:
```swift
enum WakeTaskRoute {
    case dashboard
    case alarmSetup
    case alarmActive(UUID)
    case settings
}
```

#### Step 4: Integrate DesignSystem
Use boilerplate components in SwiftUI views:
```swift
Text("6:30 AM")
    .font(.font(DSTypography.largeTitle))
    .foregroundColor(.color(DSColors.primary))
    .padding(.spacing(DSSpacing.large))
```

### Code Organization
```
apps/waketask-iphone/
├── Sources/
│   ├── App/
│   │   ├── WakeTaskApp.swift          # App entry point
│   │   ├── AppDelegate.swift          # Notification setup
│   │   └── Environment.swift          # Injected dependencies
│   ├── Models/
│   │   ├── WakeTaskAlarm.swift        # Extends boilerplate
│   │   ├── StreakDay.swift
│   │   └── UserSettings.swift
│   ├── Views/
│   │   ├── Dashboard/
│   │   ├── AlarmScreen/
│   │   ├── Onboarding/
│   │   └── Settings/
│   ├── Services/
│   │   ├── AlarmService.swift         # Local notification mgmt
│   │   ├── StreakService.swift        # Streak logic
│   │   └── SyncService.swift          # iCloud sync orchestration
│   ├── Utilities/
│   │   ├── NotificationHandler.swift
│   │   ├── WidgetProvider.swift
│   │   └── ShortcutsProvider.swift
│   └── Resources/
│       ├── Localizable.strings
│       └── Assets.xcassets
├── Tests/
│   ├── AlarmServiceTests.swift
│   ├── StreakServiceTests.swift
│   └── SyncServiceTests.swift
├── Widgets/
│   └── WakeTaskWidget/               # Lock screen widget
├── Intents/
│   └── WakeTaskIntents.swift          # Shortcuts support
└── Package.swift / waketask.pbxproj   # Build config
```

### File Size Constraints
Per quality bar (400 lines max per file):
- **View files**: <300 lines (SwiftUI views are lightweight)
- **Service files**: <350 lines (business logic split into focused services)
- **Tests**: <400 lines (one test file per service)
- **Models**: <150 lines (data models are simple)

---

## 12. Definition of Done

### Development Complete
- ✅ All MVP features implemented (Section 3)
- ✅ Code follows SwiftAIBoilerplatePro patterns and style
- ✅ Files stay under 400 lines per file (enforced by linter)
- ✅ No hardcoded secrets; environment variables used for any credentials
- ✅ No warnings in Xcode build

### Testing Complete
- ✅ XCTest unit tests cover: alarm scheduling, streak logic, iCloud sync, notification handling
- ✅ XCTest unit test coverage ≥ 70% for core services
- ✅ Appium/XCUITest exploratory taps all reachable buttons (Section 10)
- ✅ Appium test evidence saved to `.workflow/iphone-app-factory/appium-test-report.json`
- ✅ No crashes in exploratory testing; critical path (alarm fire, completion, sync) passes 100%

### Quality Gates Passed
- ✅ **SwiftLint**: All checks pass; no rule suppressions (unless documented ADR)
- ✅ **SwiftFormat**: Code formatted consistently
- ✅ **Qlty**: Code quality analysis passing
- ✅ **Secret Scanning**: No credentials detected; environment variables checked as boolean presence only
- ✅ **Build**: `xcodebuild build` succeeds for iOS 16+ (macOS lane)
- ✅ **Test**: `xcodebuild test` succeeds; all unit tests pass

### Accessibility Validated
- ✅ VoiceOver tested on all screens; all elements have descriptive labels
- ✅ Tap targets ≥ 44×44 points
- ✅ Color contrast ≥ 4.5:1 for text
- ✅ Sensory options (low-volume, phased vibration) configured and tested
- ✅ Motor accessibility: gestures have button alternatives
- ✅ No crashes or silent failures with accessibility enabled

### App Store Submission Ready
- ✅ Privacy policy drafted and linked in app
- ✅ App description (short + long) follows 4.3 differentiation narrative
- ✅ Screenshots (5+) demonstrate core features and value prop
- ✅ Icon (1024×1024 PNG) designed and included
- ✅ Metadata: app name, keywords, category selected
- ✅ No guideline violations identified (legal review, content policy, etc.)
- ✅ Bundle ID matches `com.keen.waketask`
- ✅ Signing certificate and provisioning profile configured

### Data & Sync Validated
- ✅ iCloud sync tested on 2+ devices (or simulator + device)
- ✅ Data persists after app delete and reinstall
- ✅ Offline mode functions; syncs when connectivity restored
- ✅ Conflict resolution tested (e.g., alarm edited on two devices simultaneously)
- ✅ No data loss on app crash or force-quit

### Documentation Complete
- ✅ README.md: setup, build, run instructions
- ✅ Architecture.md: module overview, dependency diagram
- ✅ TESTING.md: how to run XCTest and Appium tests locally
- ✅ RELEASE.md: TestFlight build, signing, submission steps
- ✅ Inline code comments for non-obvious logic (streaks, sync, notifications)

### Handoff to TestFlight
- ✅ App built with Release configuration
- ✅ Code signing provisioning profile configured for App Store
- ✅ Build uploaded to App Store Connect
- ✅ TestFlight flight created; beta testers invited
- ✅ Crash logs and feedback collected and reviewed
- ✅ No blockers for App Store submission identified

### Performance Benchmarked
- ✅ App launch time < 2 seconds (measured on real device or simulator)
- ✅ Calendar rendering < 500ms for 49-day or 6-month view
- ✅ Memory usage < 150MB under typical use (measured via Xcode Profiler)
- ✅ iCloud sync latency < 5 seconds on typical WiFi (CloudKit dependent, not app-side)
- ✅ Local notification delivery < 2 seconds of scheduled time (system dependent)
- ✅ Battery impact measured and documented (unlikely to be significant for local notifications)

### Final Review Sign-Off
- ✅ **Product Fidelity**: App matches spec; no scope creep into v2 features
- ✅ **iOS Architecture**: Follows iOS best practices (SwiftUI, Combine, async/await); no deprecated APIs
- ✅ **Security**: No secrets committed; iCloud integration secure; Reminders access minimal
- ✅ **Quality & QA**: All tests passing; Appium evidence complete; accessibility validated
- ✅ **Release Readiness**: TestFlight build ready; submission checklist complete

---

## Summary

WakeTask MVP delivers a cohesive, iOS-native alarm and morning accountability system that differentiates through task-based dismissal, system integration, and accessibility-first design. By leveraging SwiftAIBoilerplatePro's storage, navigation, and design patterns, development stays focused on core value (streaks + task integration) while maintaining platform quality and security standards.

**Success metric**: Users adopt WakeTask as their primary morning routine tool, reflected in 30-day cohort retention ≥ 50% and 5+ daily active use per week for 50%+ of active users.

**Next phase (v2 expansion)**: AI-driven wake timing, social accountability, financial integrations, Health app connection, multi-task support, and Critical Alerts (if entitlement granted).

