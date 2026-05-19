Now I'll draft a comprehensive spec for Joni Capture based on the research synthesis, opportunity matrix, and quality bar requirements.

---

# JONI CAPTURE: iPhone App Specification — Haiku Model Candidate

**Model Identity:** Claude Haiku 4.5  
**Spec Date:** 2026-05-19  
**App:** Joni Capture (com.maestro.jonicapture)  
**Branch Head SHA:** `b1765ad5a9e730a6d6a3b30a2106fdd9b378ee85`

---

## Executive Problem Statement

**Core Problem:** Operator-founders like Tim Keen have constant ideas but lack a frictionless mobile-first workflow to turn voice rambles into polished LinkedIn posts. The current capture-to-publish gap has 4 friction points:

1. **Ideation → Capture Friction** (~30% loss): Ideas happen off-desk. Missing the 3-second capture window loses the idea.
2. **Capture → Polish Friction** (~50% loss): Raw transcripts are too rough to publish without manual editing—too time-consuming.
3. **Polish → Confidence Friction** (~20% loss): No visible proof of workflow success (did the post work?).
4. **Confidence → Habit Loop Friction**: Without ROI visibility, creators abandon the tool.

**Joni Capture directly addresses** friction #2 (AI drafting), #3 (visible processing states), and #1 (lock-screen + Action Button).

---

## Target User & Value Proposition

### Primary User: Tim Keen (Operator-Founder)
- **Profile:** Busy founder/operator with constant stream of ideas; captures on the move (walking, driving, between meetings).
- **Motivation:** Share ideas publicly on LinkedIn to build thought leadership and network.
- **Success Criteria:** Turn a 2-minute ramble into a publish-ready draft in <5 minutes, with visible confirmation that the workflow is working.
- **User Journey:** 
  1. **Idea strikes** while walking → **Tap lock-screen widget** (1.5 sec) → **Talk for 90 seconds** → **Release** → **See transcript + "Submitted to Joni"**
  2. **10 minutes later** → **Open app** → **See draft ready** with "Story (94% confidence)" and Tim's voice → **Copy to LinkedIn** → **Paste + review in LinkedIn app** → **Publish**
  3. **Next day** → **Open Analytics tab** → **See "3 captures, 2 drafts, 1 published, 8 reactions"** → **Motivation to capture again**

---

## MVP Feature Set

### P0: Core Capture Flow (Critical Path)
- **Lock-Screen Widget** (iOS 17+, graceful fallback iOS 16)
  - Microphone icon + "Tap to capture" label
  - Shows "Recording..." during capture
  - Minimal UI; no scrolling
  - Uses `@AppIntent` and `WidgetKit`
  
- **Action Button Integration** (iPhone 15+, graceful fallback to in-app button)
  - Single long-press triggers recording start
  - Release stops recording
  - Accessibility: works with VoiceOver

- **In-App Capture UI**
  - Large red recording button with waveform animation
  - Pause / Stop controls
  - Timer showing elapsed seconds
  - Microphone permission request if needed

- **Local Audio Persistence**
  - Store audio files on-device (Core Data or SwiftData blob, or file URL)
  - Never auto-send; always queue locally first
  - Delete captures with explicit confirmation

### P0: Transcription & Queue Management
- **Transcript Generation** (Mock Apple Speech Recognition or API endpoint)
  - Show transcript after recording
  - Allow inline editing before submission (word-by-word, character count visible)
  - Undo support
  - Clear "Edit transcript before sending to Joni" label

- **Capture Queue with State Badges**
  - Each row shows: timestamp, first 40 chars of transcript, state badge
  - States: `Captured → Transcribing → Queued → Submitted → Classifying → Drafting → Evaluating → Ready`
  - Swipe-to-delete with confirmation
  - Pull-to-refresh re-checks state
  - Failed items show red badge + "Retry" button

### P0: Joni Processing Pipeline UI (Activity Timeline)
- **Vertical Timeline Card**
  - Left edge: vertical line with dots/checkmarks for completed steps
  - Each step shows: icon, label, timestamp, optional detail
  - Expandable: tap a step to show inline preview (e.g., draft snippet, classification rationale)
  - State flow: captured → transcribing → queued → submitted → classifying → drafting → evaluating → ready

- **Joni Status Indicator**
  - Dashboard header shows 🟢 Healthy, 🟡 Delayed, 🔴 Attention status
  - Based on Joni backend heartbeat (or mock fixture)

### P0: Draft Review Detail (Read-Only)
- **Draft Header**
  - Large post type badge with confidence % (e.g., "Story (94%)")
  - Sub-label: "Drafted in Tim's voice"
  - Clear timestamp

- **Draft Content**
  - Read-only formatted text (not editable; Joni owns generation)
  - Highlighted quotes or hashtags for visual scanning
  - Hook + angle summary inline

- **Evaluation Summary**
  - "Tone Analysis: Matches Tim's recent posts"
  - "Policy Fit: Safe to share on LinkedIn"
  - "Engagement Projection: Story posts average 2.5x engagement vs. tactical"

- **Explicit "NOT PUBLISHED" State**
  - Large yellow banner: "⚠️ This draft has NOT been published to LinkedIn. You must copy and paste it manually."
  - Reassures compliance: no auto-publish, no LinkedIn API mutation

- **Action Buttons**
  - "Copy to LinkedIn" (copies to clipboard)
  - "Share / Export" (PDF, text, share sheet)
  - "Mark for Rework" (soft archive)
  - "Discard Draft" (hard delete with confirmation)
  - **NO "Post to LinkedIn" button** (enforces boundary)

### P0: Dashboard with Tab Navigation
- **Tab 1: Captures**
  - Queue list with state summary cards at top ("2 Processing", "3 Ready", "1 Error")
  - Swipe-to-delete, pull-to-refresh
  - Empty state: "No captures yet. Tap the microphone to start."

- **Tab 2: Drafts**
  - Filtered list showing: Ready, Awaiting Action, Archived
  - 2-line preview: post type + first 60 chars of draft
  - Quick-tap to open detail view

- **Tab 3: Activity**
  - Joni status indicator (🟢 Healthy, 🟡 Delayed, 🔴 Attention)
  - Timeline of recent events: "Capture received", "Transcription complete", "Draft ready"
  - Recent events list (last 20 events)

- **Tab 4: Analytics**
  - Stat cards: "Total Captures (This Week)", "Avg Time to Draft", "Most Common Post Type"
  - Fixture data with realistic timestamp variance
  - Clear disclaimer: "📊 Local analytics. Connect to live Joni ledger for real-time tracking."
  - Chart (or bar graph) showing post type distribution (Story 60%, Tactical 25%, Contrarian 15%)

- **Tab 5: Settings**
  - **Storage & Privacy Section**
    - "Local Storage Always On" toggle (disabled; always on)
    - "Delete All Captures" button with confirmation prompt
    - Usage stats: "X MB on device"
  
  - **Joni Ingestion Section**
    - "Use Joni for Drafting" toggle
    - Endpoint URL field (editable, no mask)
    - Auth token input (mask asterisks; stored in Keychain)
    - "Test Connection" button (shows ✓ or ✗ status)
    - Help text: "Optional. Leave blank to use local fixture data."
  
  - **Data & Export Section**
    - "Export All Data" button (generates ZIP with all captures, transcripts, drafts)
    - "Request Data Deletion" button (sends privacy request form)
  
  - **About Section**
    - App version, build number
    - "Privacy Policy" link (external)
    - "Terms of Service" link (external)
    - "Feedback" button (mailto support)

### P0: Interviewer Mode (Secondary Flow)
- **Session Capture Card**
  - Title field (editable, default "New Session")
  - Duration timer
  - State badge (Recording, Transcribing, Ready)

- **Session Detail View**
  - Top: Raw transcript (monospace, selectable, subdued gray color)
  - Bottom: Structured notes (collapsible sections)
    - Title (auto-filled, editable)
    - Thesis (2–3 sentence summary in Tim's voice)
    - Key Stories (bullets)
    - Key Phrases (highlighted in Tim's voice)
    - LinkedIn Angles (suggested post angles)
    - Follow-Up Questions (for next session)

- **Export Options**
  - Copy notes (to clipboard)
  - PDF export (with branding)
  - Transcript only
  - Notion page (if integration ready; defer for v1.1)

### P0: Quality & Reliability
- **Swift 6 Strict Concurrency** throughout
- **SwiftUI Native Components** + SwiftAIBoilerplatePro DesignSystem (SAIButton, SAICard, SAIListRow, SAITag, SAIMotion)
- **Data Persistence**: Core Data or SwiftData, tenant scope "tim"
- **Mock Joni Ingestion Client** returning realistic fixture data:
  - Sample Tim voice samples in fixture
  - Post type distribution: Story 60%, Tactical 25%, Contrarian 15%
  - Processing delays: 2–5 min (realistic, not instant)
  - Timestamps with variance (not all from same second)
- **Keychain Storage**: No hardcoded secrets; endpoint + token stored securely
- **Code Quality Gates**:
  - SwiftLint (all files <400 lines)
  - SwiftFormat (consistent style)
  - Qlty (static analysis)
  - Secret scanning (prevent credential leaks)
- **Accessibility**:
  - VoiceOver testing on all screens
  - State badges read naturally
  - Zoom support (min 1x, max 5x)
  - High-contrast mode tested
- **Dark Mode**: Full support
- **XCUITest Exploratory Coverage**:
  - Tap every reachable enabled button/control
  - Record capture flow
  - Navigate all dashboard tabs
  - Open draft detail
  - Submit to Joni + verify state transitions

### P0: App Store Compliance
- **No LinkedIn API Integration** (no publish, no mutate)
- **No Auto-Send** without explicit user action
- **No Background Syncing** without user permission
- **Privacy Policy** drafted and linked in app
- **Release Notes** reviewed for accuracy
- **Metadata** (keywords, category, screenshots) prepared
- **App Store 4.3 Compliance Checklist** completed

---

## Non-Goals

### Out of MVP Scope
- **Live LinkedIn Analytics Integration** (fixture-only for v1.0; real data in v1.1)
- **On-Device Voice Transcription ML Model** (too complex; use API or Apple Speech)
- **Joni Streaming UI** (if drafting is real-time; show static card for now)
- **Multi-User / Team Collaboration** (single-user only)
- **Video Capture** (audio-only initially)
- **Collaborative Comments** on drafts
- **Advanced Post-Type ML Training**
- **Notion Integration** (save as Notion page; defer)
- **Analytics Trends** (weekly/monthly patterns; defer until 2–3 weeks data)
- **Joni Health Indicators** beyond status badge

### Explicitly Rejected (Per Spec)
- **LinkedIn Publishing UI** (no auto-publish, no direct LinkedIn API mutation)
- **Account Linking** (no LinkedIn OAuth required)
- **Social Sharing** of drafts (drafts are private until approved)
- **AI Training Data Collection** (no model retraining from user captures)
- **Gamification or Streaks** (no "capture streak" badges)
- **Paid Subscription Tier** (v1 is free + demo mode; premium in v2)

---

## User Journeys

### Journey 1: Quick Idea Capture (Lock-Screen Path)
1. User is walking → idea strikes
2. Glance at phone, swipe up to lock screen
3. Tap Joni Capture widget microphone icon
4. Recording starts (visual + audio feedback)
5. Talk for 90 seconds about LinkedIn idea
6. Release / tap Stop
7. See transcript on lock screen summary ("The future of AI in founder...")
8. Swipe to open app or dismiss
9. If open: tap "Submit to Joni" 
10. See "✓ Submitted" confirmation badge
11. Leave app; comes back in 10 minutes
12. See draft ready: "Story (94%)" with preview
13. Tap "Copy to LinkedIn"
14. Open LinkedIn app, paste into composer
15. Review, adjust if needed, publish
16. Next day: return to app, see "1 published post" in Activity

### Journey 2: Longer Session Capture (Interviewer Mode)
1. User sits down with 20 minutes of deep thinking
2. Start "New Interview Session"
3. Title it "Founder lessons from hiring"
4. Talk continuously for 18 minutes (multiple tangents)
5. Hit Stop → transcript appears
6. See structured notes being generated (mock Joni output): thesis, stories, key phrases, angles
7. Edit title / thesis if needed
8. Export as PDF + email to self for future reference
9. Or: copy key phrases to clipboard for LinkedIn post idea

### Journey 3: Capture Queue Failure Scenario
1. User captures idea, submits to Joni
2. Network is down (airplane mode, WiFi drops)
3. See "✗ Failed to submit" red badge
4. "Retry" button visible; tap it
5. Network returns; submission succeeds
6. Badge turns to "✓ Submitted"
7. Later, draft is ready

### Journey 4: Settings & Privacy Review
1. User opens Settings
2. Sees "Local Storage Always On" + "X captures, Y MB on device"
3. Sees "Use Joni for Drafting" toggle
4. Enters Joni endpoint URL (optional)
5. Taps "Test Connection" → "✓ Connected"
6. Reviews "Export All Data" option
7. Closes settings confident that captures are local-first

---

## Acceptance Criteria

### Core Capture AC
- [ ] Lock-screen widget appears on iOS 17+ device; tapping starts recording
- [ ] Action Button (iPhone 15+) long-press starts/stops recording; graceful fallback on iOS 16
- [ ] In-app microphone button visible on Capture tab; tap to record
- [ ] Audio recording stops on 10-minute max (or user-tapped Stop)
- [ ] Audio file saved locally with timestamp; never auto-uploaded
- [ ] User can delete capture with confirmation

### Transcription AC
- [ ] Post-recording, transcript appears inline (within 3 seconds if Apple Speech, or ~2 min if API)
- [ ] User can edit transcript (word-by-word; undo supported)
- [ ] "Submit to Joni" button visible after transcript is finalized
- [ ] Transcript persisted locally before any network submission

### Queue & State AC
- [ ] Capture queue shows state transitions: captured → transcribing → queued → submitted → classifying → drafting → evaluating → ready
- [ ] Each state has visual badge (color + icon)
- [ ] Timestamps accurate to nearest second
- [ ] Pull-to-refresh re-fetches state from Joni backend
- [ ] Failed items show retry button; retries succeed if network restored
- [ ] Swipe-to-delete removes item with confirmation

### Draft Review AC
- [ ] Draft detail shows post type with confidence % (e.g., "Story 94%")
- [ ] Draft content is read-only (no inline editing)
- [ ] "NOT PUBLISHED" banner is prominent (yellow, top of detail)
- [ ] "Copy to LinkedIn" button copies exact draft text to clipboard
- [ ] "Share / Export" offers PDF, text, share sheet
- [ ] No "Post to LinkedIn" button exists
- [ ] User can mark draft as "For Rework" or "Discard"

### Dashboard AC
- [ ] Tab bar shows 5 tabs: Captures, Drafts, Activity, Analytics, Settings
- [ ] Captures tab shows queue list + summary cards
- [ ] Drafts tab shows filtered list (Ready, Awaiting, Archived)
- [ ] Activity tab shows Joni status + recent events
- [ ] Analytics tab shows stat cards + post type chart (fixture data)
- [ ] Settings tab shows all 4 sections (Storage, Joni, Data, About)
- [ ] Empty states are clear ("No captures yet")

### Interviewer Mode AC
- [ ] Session card shows title, duration, state
- [ ] Detail view shows raw transcript (top) + structured notes (bottom)
- [ ] Structured notes include: title, thesis, stories, phrases, angles, follow-ups
- [ ] Export options: copy, PDF, transcript
- [ ] User can edit title + thesis inline

### Accessibility AC
- [ ] VoiceOver reads all state badges naturally
- [ ] Recording button announces "Start recording"
- [ ] Tab navigation keyboard-accessible
- [ ] Zoom support tested (1x–5x)
- [ ] High-contrast mode toggle works
- [ ] No text smaller than 11pt default

### Privacy & Security AC
- [ ] No plaintext tokens visible anywhere
- [ ] Joni endpoint + token stored in Keychain (not UserDefaults or file)
- [ ] No hardcoded API keys in code
- [ ] Secret scanning gate passes (no credentials in git history)
- [ ] Settings show "Using local fixture data" when no endpoint configured
- [ ] "Delete All" button removes all captures + transcripts + drafts from Core Data

### App Store Compliance AC
- [ ] No LinkedIn API calls for publish/mutate
- [ ] No background fetch or silent push notifications
- [ ] Privacy policy linked and accurate
- [ ] Release notes describe features without false claims
- [ ] App name, icon, category, keywords match submission

---

## Analytics & Events

### Event Schema
Events are logged locally to SQLite; fixture mode shows mock events.

| Event Name | Fired When | Payload |
|---|---|---|
| `capture_started` | User taps record button | `{source: "lock_screen" \| "action_button" \| "in_app", timestamp}` |
| `capture_stopped` | User stops recording | `{duration_seconds: int, has_audio: bool}` |
| `transcript_generated` | Transcript ready | `{duration_seconds: int, transcript_length: int, error: null \| string}` |
| `transcript_edited` | User edits transcript | `{chars_added: int, chars_deleted: int}` |
| `capture_submitted` | User taps "Submit to Joni" | `{capture_id: uuid, timestamp}` |
| `capture_state_changed` | Queue state changes | `{capture_id: uuid, old_state: string, new_state: string, timestamp}` |
| `draft_received` | Joni draft ready | `{capture_id: uuid, post_type: string, confidence_pct: int}` |
| `draft_copied` | User taps "Copy to LinkedIn" | `{draft_id: uuid}` |
| `draft_exported` | User exports (PDF/text) | `{draft_id: uuid, format: "pdf" \| "text"}` |
| `draft_discarded` | User discards draft | `{draft_id: uuid}` |
| `settings_changed` | User toggles endpoint or changes URL | `{setting_key: string, new_value_hash: string}` |
| `test_connection` | User tests Joni endpoint | `{endpoint_url_hash: string, success: bool}` |
| `delete_all_requested` | User taps "Delete All" | `{confirmed: bool, count_deleted: int}` |

### Dashboard Metrics (Fixture-Based for v1.0)
- **Total Captures (This Week):** 12
- **Avg Time to Draft:** 2.5 minutes
- **Most Common Post Type:** Story (60%), Tactical (25%), Contrarian (15%)
- **Draft Publish Rate:** 70% of drafts copied to LinkedIn (fixture: 7/10)
- **Retry Success Rate:** 95% (fixture: 19/20 retries succeed)

### Retention Signals (Tracked Locally)
- Count of users returning >3 times in a week
- Average captures per session
- Post type distribution week-over-week (trend)

---

## Privacy & Security Requirements

### Data Storage
- **Captures stored locally** by default (Core Data or SwiftData)
- **Audio files** stored in app sandbox `DocumentsDirectory`
- **Transcripts** stored in Core Data; never replicated without explicit user action
- **Joni endpoint + token** stored in Keychain (never UserDefaults)
- **No analytics sent to third parties**

### Data Transmission
- **Captures never auto-sent** without explicit "Submit" button tap
- **Joni endpoint** is configurable; users can point to private servers
- **No background syncing** without user permission
- **TLS 1.3+** required for all network requests
- **Certificate pinning** optional (defer for v1.1)

### Data Deletion
- **"Delete All" button** removes all captures, transcripts, drafts, events
- **"Request Data Deletion" button** generates privacy form for legal compliance
- **Soft delete on "Discard Draft"** (moves to archive, not removed)

### Third-Party Dependencies
- **No Google Analytics** or similar tracking
- **No Crashlytics** with PII (fixture: no crashes expected)
- **RevenueCat** (not used in v1, free model)
- **Sentry** optional for error tracking (no auth tokens or PII)

### Compliance
- **GDPR:** EU users have data access + deletion rights
- **CCPA:** California users have data access + deletion rights
- **Privacy Policy:** Live on app website; linked in app
- **Data Processing Agreement:** Joni backend signs DPA if customer data flows there

---

## App Store 4.3 Differentiation Statement

### Headline
**"Joni Capture: The LinkedIn Creator's Voice App. Ramble → Draft → Review. In Tim's Voice."**

### 30-Second Pitch
For operator-founders and LinkedIn creators who want to turn half-baked ideas into polished posts, Joni Capture combines voice capture, AI transcription, and LinkedIn-aware drafting into a single mobile-first workflow. Unlike generic voice apps (Otter, Apple Notes) or generic AI writing tools (Draft, Notion), Joni Capture turns rambles into LinkedIn-ready drafts **in Tim's authentic voice**, with transparent activity tracking so you see what works and what doesn't. Capture in 2 seconds. Get a draft in 2 minutes. Build a habit.

### Core Differentiators (For App Store Copy)

1. **End-to-End Voice→LinkedIn Draft** (No competitor owns this)
   - Otter stops at transcription. Draft does generic writing. LinkedIn app doesn't capture ideas.
   - Joni Capture closes the gap: voice ramble → Joni classifies → drafts in Tim's voice → you review & export to LinkedIn.

2. **Tim's Voice as Quality Signal** (Strong Moat)
   - Drafts are explicitly "written by Tim's Joni agent"
   - Tim's personal credibility transfers to perceived quality
   - Users compare Joni's output to generic AI and choose authenticity

3. **Activity Transparency** (Visible Differentiation)
   - See every step: captured → transcribing → classifying → drafting → evaluating → ready
   - Competitors (Otter, Draft) process silently
   - Users build confidence through visibility

4. **Privacy-First Local Capture** (Trust Moat)
   - Captures stored locally by default; Joni endpoint optional
   - "Your ideas stay on your phone until you choose to share them"
   - No competitor owns privacy + AI drafting simultaneously

5. **Lock Screen + Action Button** (Table Stakes, Not Differentiator)
   - Expected by iOS users; removes friction vs. desktop-first tools
   - Competitive baseline; ships in v1

### Compliance Checklist
- ✓ **Guideline 1.1 (App Completeness):** Standalone app with core functionality; demo works without external dependencies
- ✓ **Guideline 2.1 (Information Accuracy):** All claims about drafting + Tim's voice demonstrated via fixture data; no false marketing
- ✓ **Guideline 4.1 (Physical Harm):** Not applicable
- ✓ **Guideline 5.1 (Legal):** No LinkedIn ToS violation (no auto-publish, no account hijacking); manual export only
- ✓ **Guideline 5.4 (Privacy):** Privacy-first; local storage; transparent settings; no tracking
- ✓ **Guideline 5.6 (Kids):** Not applicable (adult creators/operators)

---

## Appium Exploratory Testing Requirements

### Scope
- **Environment:** macOS lane (GitHub Actions or local Mac)
- **Device:** iPhone 15 simulator (iOS 17) + iPhone 12 simulator (iOS 16) for fallback testing
- **Framework:** XCUITest + Appium WebDriverAgent (or native XCUITest)
- **Coverage:** Exploratory tapper clicks every reachable enabled button/control

### Test Scenarios

#### Scenario 1: Lock-Screen Widget Capture
- [ ] Start app; go to Captures tab (initial state empty)
- [ ] Lock device
- [ ] Swipe to lock screen
- [ ] Tap Joni Capture widget microphone
- [ ] Verify recording UI appears
- [ ] Talk for 5 seconds
- [ ] Release; verify "Recording stopped" feedback
- [ ] Unlock device; return to app
- [ ] Verify capture in queue with state "Captured"

#### Scenario 2: In-App Capture Flow
- [ ] Open Captures tab
- [ ] Tap red microphone button
- [ ] Record 3 seconds
- [ ] Tap Stop
- [ ] Verify transcript appears (mock: "Hello world test message")
- [ ] Edit transcript (delete 1 word, add 1 word)
- [ ] Tap "Submit to Joni"
- [ ] Verify state transitions: Captured → Transcribing → Queued → Submitted
- [ ] Wait ~2 sec (mock delay)
- [ ] Verify state becomes "Ready" with draft preview

#### Scenario 3: Draft Review & Export
- [ ] From Drafts tab, tap a ready draft
- [ ] Verify detail view: post type, confidence %, draft text, "NOT PUBLISHED" banner
- [ ] Tap "Copy to LinkedIn"; verify system clipboard contains draft text
- [ ] Tap "Share / Export"; select "PDF"
- [ ] Verify PDF generation (no crash)
- [ ] Tap "Mark for Rework"; verify state changes to "Awaiting Action"
- [ ] Tap "Discard Draft"; confirm dialog appears; tap Discard
- [ ] Verify draft removed from list

#### Scenario 4: Dashboard Navigation
- [ ] Tap each tab (Captures, Drafts, Activity, Analytics, Settings)
- [ ] Verify tab bar updates
- [ ] Verify content populates (mock data for empty states)
- [ ] Swipe horizontally between tabs
- [ ] Return to Captures tab

#### Scenario 5: Settings Configuration
- [ ] Open Settings tab
- [ ] Verify Storage & Privacy section visible
- [ ] Tap "Delete All" button; confirm dialog appears; cancel
- [ ] Tap "Delete All" button again; confirm dialog; tap Delete
- [ ] Verify "No captures" message appears
- [ ] Toggle "Use Joni for Drafting"
- [ ] Enter test endpoint URL
- [ ] Tap "Test Connection"; verify ✓ or ✗ feedback
- [ ] Navigate to About; verify version number

#### Scenario 6: Interviewer Mode
- [ ] Open Captures tab; tap "Start Interview"
- [ ] Record 10 seconds of rambling
- [ ] Tap Stop
- [ ] Verify session card appears with title, duration
- [ ] Tap session card to open detail
- [ ] Verify transcript (top) + structured notes (bottom)
- [ ] Edit title field
- [ ] Tap "Export as PDF"; verify PDF generated
- [ ] Close detail; verify session in list

#### Scenario 7: Error Handling & Retry
- [ ] Manually set Joni endpoint to invalid URL (e.g., "http://invalid.test")
- [ ] Start capture; submit
- [ ] Verify "Failed to submit" state with red badge + "Retry" button
- [ ] Tap Retry; verify retry attempt (fails again with same endpoint)
- [ ] Go to Settings; update endpoint to valid mock URL
- [ ] Return to Captures; tap Retry again
- [ ] Verify retry succeeds; state becomes "Submitted"

#### Scenario 8: Accessibility (VoiceOver)
- [ ] Enable VoiceOver on device
- [ ] Open app; swipe through all elements
- [ ] Verify state badges read naturally (e.g., "Ready" instead of just icon)
- [ ] Tap record button; verify "Start recording" announcement
- [ ] Stop recording; verify "Stopped" announcement
- [ ] Navigate to draft detail; verify "Not published" banner reads correctly
- [ ] Tab through all buttons; verify all are reachable

#### Scenario 9: Dark Mode
- [ ] Set system appearance to Dark Mode
- [ ] Open each tab; verify colors readable (no contrast failures)
- [ ] Record and review draft
- [ ] Toggle system Light/Dark; verify app responds

#### Scenario 10: Performance Baseline
- [ ] Measure app launch time (<3 seconds)
- [ ] Measure tap-to-recording response (<500ms)
- [ ] Measure draft detail load (<500ms)
- [ ] Measure Settings open (<300ms)

### Test Artifact Requirements
- [ ] Screenshots of each screen + action
- [ ] XCUITest logs (pass/fail for each scenario)
- [ ] Performance profile (if Instruments data available)
- [ ] Accessibility audit report (VoiceOver + high-contrast)
- [ ] Error logs (none expected in passing run)

---

## SwiftAIBoilerplatePro Module Reuse Plan

### Reused Components

| Module | Usage | Rationale |
|---|---|---|
| **DesignSystem (DSColors, DSTypography, DSSpacing)** | All UI components | Consistent styling; no custom color definitions |
| **SAIButton, SAICard, SAIListRow** | Capture queue, draft list, stat cards | Semantic SwiftUI components; pre-built a11y |
| **SAITag** | State badges (captured, ready, failed) | Pre-styled labels for state indicators |
| **SAIStreamingBubble** | (Deferred) Draft preview in Activity tab | For later when Joni streaming is ready |
| **SAIMotion** | State transitions, tab switches | Respect `accessibilityReduceMotion` |
| **Networking (APIClient, URLSessionConfiguration)** | Joni endpoint communication | TLS defaults, timeout handling |
| **KeychainStorage** | Joni token + endpoint storage | Never plain UserDefaults |
| **Core Data / SwiftData Persistence** | Captures, transcripts, drafts | App-provided, not boilerplate; custom schema |
| **SwiftLint, SwiftFormat, Qlty Config** | Code quality gates | Pre-configured rules; no customization needed |
| **Secret Scanning (via pre-commit)** | Credential leak prevention | Standard .gitignore + rules |
| **XCUITest Harness** | Exploratory testing framework | Boilerplate test structure + helpers |

### Custom Modules (Not Reused)
- **JoniIngestionClient** (mock + real): Custom wrapper for Joni backend API
- **AudioRecordingManager**: Swift Concurrency wrapper for AVAudioEngine
- **TranscriptionService**: Abstraction for Apple Speech Recognition + configurable API endpoint
- **CaptureStateModel**: SwiftUI @Observable state machine for queue + draft lifecycle
- **InterviewerSessionModel**: Structured notes generation (depends on Joni backend)

### Architecture Pattern
```
App
├── Screens (SwiftUI Views)
│   ├── CaptureView (record UI)
│   ├── QueueView (dashboard Captures tab)
│   ├── DraftDetailView (read-only draft + actions)
│   ├── AnalyticsView (stat cards)
│   └── SettingsView (privacy + endpoint config)
├── Models (Observable state machines)
│   ├── CaptureStateModel
│   ├── DraftModel
│   └── AppSettingsModel
├── Services (Business logic)
│   ├── AudioRecordingManager
│   ├── TranscriptionService
│   ├── JoniIngestionClient
│   └── PersistenceService
└── DesignSystem (Reused from boilerplate)
    ├── DSColors
    ├── DSTypography
    └── SAI* Components
```

---

## Definition of Done

### Code Complete
- [ ] All 5 dashboard tabs functional (Captures, Drafts, Activity, Analytics, Settings)
- [ ] Lock-screen widget + Action Button working on iOS 17 simulator
- [ ] In-app capture button functional fallback for iOS 16
- [ ] Capture queue with full state machine (captured → transcribing → ... → ready)
- [ ] Draft detail view with "NOT PUBLISHED" banner and all action buttons
- [ ] Interviewer mode session capture + structured notes display
- [ ] Settings endpoint configuration + Keychain storage working
- [ ] Mock Joni Ingestion Client returning realistic fixture data
- [ ] All Swift files <400 lines
- [ ] No hardcoded secrets

### Quality Gates Passing
- [ ] SwiftLint: 0 errors, <5 warnings
- [ ] SwiftFormat: auto-formatted, consistent style
- [ ] Qlty: passing static analysis
- [ ] Secret scanning: no credentials in git history
- [ ] Swift 6 strict concurrency: no warnings on compile

### Testing Complete
- [ ] XCUITest exploratory tapper: all 10 scenarios passing
- [ ] VoiceOver accessibility: all screens readable
- [ ] Dark mode: all colors readable, no contrast failures
- [ ] Zoom support: 1x–5x scaling tested
- [ ] Performance: app launch <3sec, tap response <500ms
- [ ] Crash handling: simulated network failures, Joni endpoint errors; no hangs

### Build & Deployment Ready
- [ ] `xcodebuild build` succeeds on macOS lane
- [ ] `xcodebuild test` runs XCUITest suite; all pass
- [ ] Simulator builds: iOS 17 (iPhone 15) + iOS 16 (iPhone 12)
- [ ] No compiler warnings
- [ ] Signing certificate configured (TestFlight provisioning)
- [ ] IPA artifact generated

### App Store Submission Ready
- [ ] Privacy policy drafted + linked in app
- [ ] Release notes written (features, bugfixes)
- [ ] App metadata: name, icon, screenshots, keywords, category reviewed
- [ ] 4.3 compliance checklist completed
- [ ] Marketing copy approved (headline, pitch, differentiators)
- [ ] Localization (English only for v1; Spanish/French deferred)

### Documentation Complete
- [ ] README.md with build + run instructions
- [ ] ARCHITECTURE.md documenting module layout + patterns
- [ ] PRIVACY.md linking to privacy policy
- [ ] CONTRIBUTING.md for future maintainers
- [ ] Changelog for v1.0.0 released

### Launch Readiness
- [ ] Beta testers recruited (Tim + 5–10 operator-founders)
- [ ] TestFlight build uploaded
- [ ] Feedback mechanism in place (email + in-app "Feedback" button)
- [ ] Go/no-go decision made (no critical bugs, feature parity with spec)
- [ ] App Store review queue monitored

---

## Key Implementation Notes

### State Machine for Capture Lifecycle
```
Captured --[transcription starts]--> Transcribing
Transcribing --[transcript ready]--> Queued --[user taps submit]--> Submitted
Submitted --[Joni receives]--> Classifying
Classifying --[type identified]--> Drafting
Drafting --[draft generated]--> Evaluating
Evaluating --[eval complete]--> Ready
Ready --[user copies/exports]--> Archived
[Any state] --[network error/Joni down]--> Failed --[user taps retry]--> [previous state]
```

### Offline Guarantee
- Captures always persisted locally before network submission
- No data loss on app crash, network failure, or Joni outage
- Queue survives app restart

### Fixture Data Strategy
- Mock Joni client returns realistic responses:
  - Tim voice samples (pre-recorded or synthesized)
  - Post type distribution matching research (60% Story, 25% Tactical, 15% Contrarian)
  - Processing delays realistic (2–5 min) to simulate real Joni latency
  - Timestamps with variance (not all at :00 seconds)
- "Using local fixture data" label prominent in Settings when no real endpoint
- Early users can see workflow without Joni backend ready

---

## Summary: Haiku Model Candidate

This spec defines a **focused, ship-ready iPhone app** that directly solves Tim Keen's capture-to-publish workflow. The MVP prioritizes:

1. **Frictionless capture** (lock-screen widget + Action Button)
2. **Visible drafting workflow** (activity timeline with state transparency)
3. **Privacy-first architecture** (local storage, optional Joni endpoint)
4. **Authentic Tim voice** (drafts branded as "in Tim's voice")
5. **Robust offline queue** (no data loss, retry on failure)

**Differentiation thesis:** End-to-end voice→LinkedIn draft in Tim's voice with transparent activity tracking. No competitor owns this full stack. Privacy + AI drafting positioned simultaneously.

**Timeline to launch:** 2–3 weeks development + QA + TestFlight beta, assuming Joni backend fixture mode is ready. Market window is 6–12 months before larger players (Microsoft, Google, Apple) enter this space.

**Success metrics:** >70% of beta testers return >3 times in first week; >50% connect real Joni endpoint; >80% of captures become published posts within 2 weeks.

---

**Spec Status:** ✅ **Ready for consensus merge and development handoff**