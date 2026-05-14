# WakeTask - iPhone App Spec

## 1. Problem Statement
Many users struggle to transition from sleep to productive wakefulness. Existing alarm apps fall into two extremes: 
1. **Aggressive/Punitive**: Alarms that require solving difficult math problems or arbitrary puzzles, which often lead to frustration, "novelty decay" (novelty-decay risk over time), or sensory overload (especially for neurodivergent/ADHD users).
2. **Gentle but Ineffective**: Native alarms that are easily snoozed or dismissed without actually waking the user fully.

Furthermore, surviving the alarm doesn't guarantee a successful morning. Users often wake up but immediately lose momentum, scrolling social media instead of starting their day. There is no unified tool that connects the *act of waking up* to the *first meaningful priority of the day*.

**WakeTask** solves this by bundling reliable wakefulness with immediate morning task initiation. The alarm can only be dismissed by completing a meaningful, user-selected morning task. 

## 2. Target User
**Primary:** iOS users (18-45) who want to "win their morning" and build reliable momentum for their day.
**Secondary:** Neurodivergent (e.g., ADHD) users who need structure and external accountability but find existing "punitive" alarm methods inaccessible or overwhelming.

**Key Traits:**
- Comfortable with iOS system apps (Reminders, Calendar).
- Want to build a consistent habit, not just a 30-day challenge.
- Need external accountability but reject shame-based mechanics.

## 3. MVP Feature Set
1. **Task-Based Alarm Dismissal**: 
    - Full-screen alarm UI that cannot be easily dismissed.
    - Requires completing a pre-selected "Morning Task" (via standard iOS checkbox/swipe gesture) to silence the alarm.
    - Task title and description are prominently visible on the ringing alarm screen.
2. **iOS System Integration**:
    - Select Morning Tasks natively from Apple Reminders or Apple Calendar (read-only access).
    - Expose "Complete Morning Task" App Intent for iOS Shortcuts.
3. **Streak & Momentum Tracking**:
    - Visual streak counter (consecutive successful days).
    - Calendar view (7-week and 30-week) showing successful wake-up days.
    - Gentle re-engagement messaging if a streak is broken (non-punitive).
4. **Lock Screen Widget**:
    - Glanceable widget showing current streak and today's morning task.
5. **Data Persistence via iCloud**:
    - Streaks, alarm schedules, and task preferences sync via `NSUbiquitousKeyValueStore` or CloudKit to survive device changes and app reinstalls.
6. **Accessible Wake Options**:
    - Support for iOS VoiceOver.
    - Option for non-aggressive sound profiles.

## 4. Non-Goals (MVP)
- Custom AI-based wake-time optimization or sleep tracking.
- Social features (leaderboards, friend challenges, public sharing).
- Financial consequences (integrations with Beeminder, Stickk).
- Apple Health integration (no read/write of sleep data in v1).
- Android or watchOS companion apps.
- Complex task management within the app (users should use Apple Reminders/Calendar).
- In-app subscriptions or paywalls (MVP is free/ad-free for validation).

## 5. User Journeys
### Journey 1: Setup and First Alarm
1. User downloads WakeTask and grants Notification/Reminders/Calendar permissions.
2. User taps "+" to create an alarm.
3. User sets the time (e.g., 6:30 AM) and recurrence (e.g., Weekdays).
4. User taps "Select Morning Task" and chooses a specific Reminder list or Calendar event.
5. User saves the alarm.

### Journey 2: The Morning Wake-Up
1. At 6:30 AM, a critical alert notification plays (WakeTask alarm sound).
2. User taps the notification (or opens the app).
3. The app displays a full-screen "Wake Up" UI, displaying the selected task: *e.g., "Drink full glass of water & stretch."*
4. There is no simple "Stop" button. User must swipe or check the box next to the task.
5. Upon checking the box, the alarm silences immediately with a satisfying haptic success feedback.
6. The UI transitions to the Streak Dashboard, showing the user's streak incrementing (e.g., "3 Day Streak!").

### Journey 3: Streak Review
1. User opens the app during the day (or views the Lock Screen Widget).
2. User sees their current streak count cleanly displayed.
3. User taps the calendar tab to view their 7-week history, clearly seeing the solid block of successful days, reinforcing their new habit identity.

## 6. Acceptance Criteria
- **Alarm Execution**: Alarm fires reliably in the foreground and background at the designated time, triggering sound and haptic feedback.
- **Dismissal Constraint**: The alarm sound cannot be stopped via an in-app button *unless* the linked task checkbox is checked or swipe-to-complete gesture is performed.
- **Task Reading**: The app successfully requests and reads data from `EventKit` (Reminders/Calendar) to display task choices.
- **Streak Calculation**: The streak correctly increments when a task is completed within the morning window. Streaks accurately reset to 0 if an alarm is missed/skipped (task not completed).
- **Data Persistence**: Alarm schedules and streak history survive an app force-quit and device reboot.
- **Widgets**: Lock screen widget correctly updates within 5 minutes of task completion to reflect the new streak count.

## 7. Analytics & Events
*Note: Usage of SwiftAIBoilerplatePro's built-in analytics wrapper.*
- `alarm_created` (Properties: time_of_day, recurrence_type, task_source)
- `alarm_fired`
- `alarm_dismissed_task_completed` (Properties: time_to_dismiss_seconds)
- `alarm_missed` (streak broken)
- `streak_milestone_reached` (Properties: day_count [7, 30, 90])
- `widget_tapped`

## 8. Privacy & Security Requirements
- **Data Minimization**: Only request read access to specific Reminder lists or Calendars needed for the morning task. Do not request full system access if avoidable. No external API transmission of user's personal task titles.
- **Local First**: Streak data and alarm configurations should prioritize local device storage and iCloud Sync. No proprietary backend server is required or permitted for storing user tasks or sleep habits.
- **Permissions Context**: Provide clear context (via pre-permission screens) on *why* Reminders/Calendar access is needed (to link alarms to actual routines).

## 9. App Store 4.3 Differentiation Statement
WakeTask is uniquely positioned in the Productivity/Utilities category by bridging the gap between isolated alarm apps and isolated task managers. Unlike competitors that rely on arbitrary puzzles (Alarmy) or disconnected habit tracking (Streaks), WakeTask uses "Proof of Meaningful Action" as its core wake-up mechanic. By gating alarm dismissal behind native iOS Reminder/Calendar completion, it orchestrates the critical transition from sleep to the day's first priority, significantly reducing morning fragmentation and acting as an integrated ecosystem participant rather than a siloed utility.

## 10. Appium / XCUITest Exploratory Testing Requirements
- **Test Scenarios**:
  - Verify app launches to empty state gracefully.
  - Automate the creation of a new alarm with a mock task.
  - Trigger a mock alarm event (unit test / deep link simulation) and verify the dismissal UI is presented.
  - Automate checking the task box and assert that the streak increments UI updates.
  - Tap all tabs and settings menus to ensure no crashes.
- **Gate**: Exploratory tapper MUST successfully click every reachable enabled control without a crash.

## 11. SwiftAIBoilerplatePro Module Reuse Plan
- **Core Architecture**: Utilize the boilerplate's `Coordinator` pattern or baseline SwiftUI navigation structure.
- **Design System**: Use defined `Color` and `Typography` extensions from the boilerplate to ensure consistency and speed up UI development. Prefer SF Symbols.
- **Persistence**: Utilize the boilerplate's `CoreData` / `SwiftData` or `UserDefaults` wrappers for saving local streak state. Use boilerplate `AppStorage` property wrappers where applicable.
- **Analytics**: Hook into the provided unified Analytics service protocol.
- **Onboarding**: Adapt the boilerplate's onboarding flow to request EventKit/Notification permissions.
- **Testing**: Extend the Boilerplate test target (`SwiftAIBoilerplateProTests`) rather than creating a new setup.

## 12. Definition of Done
- All Acceptance Criteria met.
- No `SwiftLint` warnings or errors; code adheres to Swift 6 strict concurrency checks.
- All modules remain < 400 lines of code.
- Successfully built on macOS CI runner (`xcodebuild build`).
- UI Tests / Appium tests pass on the test runner (`xcodebuild test`).
- Code reviewed and approved against security and privacy guidelines (no hardcoded credentials).
- The App is in a functioning state ready for TestFlight distribution.