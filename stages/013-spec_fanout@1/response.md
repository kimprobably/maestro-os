Now I have all the context needed. Let me produce the complete spec.

---

# Joni Capture — iPhone App Specification (v1.0 MVP)

**Model:** DeepSeek V4 Pro | **Date:** 2026-05-19 | **Branch:** spec_deepseek

---

## 1. Problem Statement

Operator-founders and LinkedIn creators generate ideas constantly — during walks, between meetings, in the car, at 2 AM. These ideas rarely reach LinkedIn because the capture-to-publish pipeline is broken at four friction points:

1. **Ideation → Capture (30% loss):** Ideas happen off-desk. If the capture trigger takes more than 3 seconds, the idea is gone.
2. **Capture → Polish (50% loss):** Raw voice notes or transcripts are too rough to publish. Manual editing/rewriting is slow; many ideas never ship.
3. **Polish → Confidence (20% loss):** Even polished drafts feel generic or off-brand. No feedback on "did this post format work on LinkedIn?" creates uncertainty.
4. **Confidence → Habit Loop:** Without visible proof of ROI ("this post type gets 3x engagement"), creators stop capturing and eventually abandon the tool.

**No existing tool owns the full stack.** Otter stops at transcription. Apple Notes stops at capture. Draft and Notion do generic writing with no LinkedIn awareness. The LinkedIn app itself has zero mobile-first capture affordance. Joni Capture closes this gap by combining voice capture → AI transcription → LinkedIn-aware drafting in Tim's voice → transparent activity tracking into a single iPhone workflow.

---

## 2. Target User

### Primary: Tim Keen (Operator-Founder)
- Busy founder/operator, constant stream of ideas
- Captures on the move: walking, driving, between meetings
- Wants to build LinkedIn thought leadership but lacks time for consistent content creation
- Success: turn a 2-minute ramble into a publish-ready draft in <5 minutes, with visible confirmation

### Secondary: Operator-Founder Network
- Tim's peer group — creators, founders, LinkedIn influencers
- Trust Tim's taste and will adopt tools he vouches for
- Privacy-conscious; want ideas on-device until they choose to share
- Motivated by visible workflow results, not gamification

---

## 3. MVP Feature Set

### 3.1 Core Capture Flow (P0)

| Feature | Description | Key Constraint |
|---|---|---|
| **Lock Screen Widget** | Microphone icon + "Tap to capture" label. Launches capture immediately. iOS 17+. | Capture trigger <1.5s from unlock |
| **Action Button Support** | `@AppIntent` for iPhone 15+ Action Button. Graceful fallback to in-app button for iOS 16. | Never block on unavailable hardware |
| **In-App Capture UI** | Recording indicator (pulsing `DSColors.accentPrimary`), pause/stop controls, duration display. | Countdown starts on first syllable |
| **Local Audio Persistence** | SwiftData entity for audio captures. Persisted locally before any network call. | Never lose data; "Saved locally" confirmation |
| **Local Transcription** | Apple Speech Recognition for instant offline transcription. Status: transcribing → transcribed. | Show transcript inline; editable before Joni submission |
| **Transcript Editing** | Simple inline editing UI. Character count. Undo. No modal (stay in flow). | "Edit transcript before sending to Joni" |
| **Offline Queue** | Captures queue locally. Auto-submit when connectivity returns. | Crash-proof; resume on relaunch |
| **Retry + Error States** | Red badge on failed items + "Retry" button. Exponential backoff invisible to user. Error maps to user-actionable steps. | Never silently fail |

### 3.2 Joni Processing Pipeline (P0)

| Feature | Description | Key Constraint |
|---|---|---|
| **Capture Queue List** | Each row: timestamp, first 40 chars of transcript, state badge, retry/delete actions. | Swipe-to-delete; pull-to-refresh |
| **State Transitions** | captured → transcribing → queued → submitted → classifying → drafting → evaluating → ready | Every state visible in timeline |
| **Vertical Timeline UI** | Left edge: line with dots/checkmarks. Each step: icon, label, timestamp. Expandable details on tap. | Collapsible; late-binding fixture data |
| **Post-Type Classification** | Draft detail shows post type with confidence % (Story 94%, Tactical 4%, Contrarian 2%). | Fixture types: story, tactical, contrarian, founder-lesson, callout, question |
| **Draft Detail View** | Read-only draft with highlighted quotes/hashtags. Eval notes: voice consistency, tone analysis, policy fit. "Copy to LinkedIn" (clipboard only). "Share / Export." Explicit "NOT PUBLISHED" state. | NO "Post to LinkedIn" button |
| **Tim's Voice Drafting** | Fixture data includes Tim voice samples. Drafts marked "Drafted in Tim's voice." Eval notes emphasize tone matching. | Authenticity is the moat |

### 3.3 Dashboard (P0 struct, P1 analytics)

| Feature | Description | Key Constraint |
|---|---|---|
| **Tab Navigation** | Captures | Drafts | Activity | Analytics | Settings | 5 tabs max |
| **Summary Stat Cards** | "2 processing", "3 ready for review", "1 needs attention" at top of each tab. | Always visible; pull-to-refresh |
| **Captures Tab** | Queue list with state badges. Swipe-to-delete. Empty state: "No captures yet." | Persistent local storage |
| **Drafts Tab** | Filtered list: Ready, Awaiting Action, Archived. 2-line preview per draft. | Drafts expand to full detail |
| **Activity Tab** | Joni status indicator (🟢 Healthy / 🟡 Delayed / 🔴 Attention). Timeline of recent events. | Local clock + fixture timestamps |
| **Analytics Tab** | Fixture-backed stat cards: "Total captures this week", "Avg time to draft", "Most common post type". Honest "demo" labeling. | Explicit: "Local analytics. Connect to live Joni ledger for real-time tracking." |

### 3.4 Interviewer Mode (P2 — secondary flow)

| Feature | Description | Key Constraint |
|---|---|---|
| **Session Card** | Dashboard card: title, duration, state. Tap to expand. | "Interviewer" badge distinct from "Capture" |
| **Interview Detail** | Raw transcript (top, monospace, scrollable) + structured notes (bottom): title, thesis, stories, key phrases in Tim's voice, LinkedIn angles, follow-ups. | Each section collapsible |
| **Export** | Copy notes, PDF, transcript-only, Notion page (future). | Share sheet integration |

### 3.5 Settings (P1)

| Section | Contents |
|---|---|
| **Storage & Privacy** | Local storage always on (toggle disabled), Delete All (with confirmation), usage stats |
| **Joni Ingestion** | Toggle (on/off), endpoint URL field, auth method token (Keychain, never plaintext), "Test Connection" button |
| **Data & Export** | Export all as ZIP, Request data deletion |
| **About** | Version, build, privacy policy link, terms link |
| **Fallback** | "Using local fixture data" when no endpoint configured |

### 3.6 Quality & Reliability (P0)

| Requirement | Detail |
|---|---|
| **Swift 6 strict concurrency** | Throughout; `any` keyword on protocol-typed properties |
| **SwiftUI native** | No UIKit views/controllers |
| **SwiftData persistence** | Tenant scope: "tim" |
| **Mock Joni Ingestion Client** | Realistic fixture data with configurable latency |
| **No hardcoded secrets** | Endpoint + token in Keychain |
| **Line count** | All Swift files <400 lines |
| **SwiftLint + SwiftFormat + Qlty** | Blocking gates |
| **Secret scanning** | Integrated |
| **VoiceOver** | All screens accessible |
| **Dark mode** | All screens tested |

---

## 4. Non-Goals (Explicitly Out of Scope)

### Deferred to v1.1
- Live LinkedIn Analytics integration (fixture-only for MVP)
- On-device voice transcription via local ML model (use Apple Speech or API)
- Joni streaming UI (`SAIStreamingBubble`; can add later)
- Multi-user / team collaboration
- Video capture (audio-only)
- Collaborative notes or comments
- Advanced post-type ML training
- Notion integration (save as Notion page)
- Analytics trends (weekly/monthly patterns)
- Joni health indicators beyond status badge

### Explicitly Rejected (Per Spec)
- LinkedIn Publishing UI (no auto-publish, no direct LinkedIn API mutation)
- Account linking (no LinkedIn OAuth required)
- Social sharing of drafts (drafts are private until user approves)
- AI training data collection
- Gamification, streaks, or points
- Paid subscription tier (v1 is free + demo mode)

---

## 5. User Journeys

### Journey 1: Quick Capture on the Move

```
Tim is walking to a meeting. An idea strikes.

1. Tim taps the lock-screen Joni widget (microphone icon).
2. App launches directly into capture mode.
3. Tim holds the Action Button and speaks: "What if LinkedIn posts that start with contrarian takes actually perform worse because people scroll past anger?"
4. Tim releases the button. App shows "Saved locally" with a green checkmark.
5. Tim puts phone back in pocket.

Post-condition: Capture is in local SwiftData store with status "captured." Transcription begins automatically (Apple Speech).
```

### Journey 2: Review and Submit to Joni

```
Tim is at his desk 20 minutes later.

1. Opens Joni Capture. Dashboard shows "1 new capture" badge.
2. Taps Captures tab → sees the capture with status "transcribed."
3. Taps capture to see transcript. Reads: "What if LinkedIn posts that start with contrary takes actually..."
4. Edits "contrary" → "contrarian" inline. Taps "Submit to Joni."
5. Capture status changes to "queued → submitted → classifying."

Post-condition: Joni Ingestion Client receives the submit request (or fixture client simulates it). State transitions visible in Activity tab.
```

### Journey 3: Draft Review

```
2 minutes later. Joni has processed the capture.

1. Push notification: "Joni prepared a draft: 'The Contrarian Trap'"
2. Tim taps notification → Drafts tab → sees new draft with classification "Contrarian (92%)" and angle "The hidden engagement killer nobody talks about."
3. Tim taps to open draft detail. Reads the full draft, eval notes showing "Tone matches Tim's Q1 2026 posts."
4. Tim nods. Taps "Copy to LinkedIn."
5. App confirms "Copied! Paste into LinkedIn composer to review before posting."
6. Tim switches to LinkedIn app, pastes, reviews, and publishes manually.

Post-condition: Draft marked as "Ready for review → Copied" in local state. No LinkedIn API call was made.
```

### Journey 4: Interviewer Mode (Structured Ramble)

```
Tim has 15 minutes between calls and wants to explore a deeper topic.

1. Opens Joni Capture → taps "+" → selects "Interviewer Mode."
2. Starts recording: "So I've been thinking about why founders burn out on content. It's not the writing. It's the feedback loop being broken..."
3. Tim rambles for 8 minutes, occasionally adding structure cues: "New section: The Feedback Problem."
4. Stops recording. App transcribes the full session.
5. 5 minutes later, Joni returns structured notes:
   - Title: "Why Founders Burn Out on Content (And How to Fix It)"
   - Stories: 3 key anecdotes extracted
   - Key phrases in Tim's voice: 5 pull quotes identified
   - LinkedIn angles: "Post as a founder lesson," "Post as a contrarian take," "Post as a question to the community"
   - Follow-ups: 2 suggested deeper-dive topics

Post-condition: Interview session saved. Structured notes visible in detail screen. Export ready as PDF or clipboard text.
```

### Journey 5: Checking Activity & Analytics

```
Sunday evening. Tim wants to see if the workflow is working.

1. Opens Joni Capture → Analytics tab.
2. Sees stat cards: "This week: 7 captures → 4 drafts ready → 2 published on LinkedIn."
3. Most common post type: "Founder Lesson (43%)."
4. Disclaimer: "Local analytics. Connect to live Joni ledger for real-time tracking."
5. Tim sees pattern: contrarian takes are getting drafted but not published. Decides to adjust capture strategy next week.

Post-condition: Tim builds confidence in the habit loop. Returns Monday morning with intention to capture more founder-lesson-style ideas.
```

---

## 6. Acceptance Criteria

### AC-1: Capture Friction
- [ ] Lock-screen widget launches capture in <1.5 seconds from tap.
- [ ] Action Button starts/stops recording when configured.
- [ ] In-app capture button works on iOS 16 (graceful fallback).
- [ ] Recording persists locally even if app is force-quit mid-capture.
- [ ] "Saved locally" confirmation appears within 200ms of stop.

### AC-2: Transcription
- [ ] Apple Speech Recognition transcribes audio within 30 seconds for 2-minute recording.
- [ ] Transcript is editable inline. Edits persist before Joni submission.
- [ ] Character count visible. Undo supported.
- [ ] Transcription errors (e.g., "contrary" → "contrarian") can be fixed by user.

### AC-3: Joni Processing Pipeline
- [ ] All 8 states (captured → ready) are visible in capture queue.
- [ ] State transitions animate smoothly. Timestamps are real or realistic-fixture.
- [ ] Vertical timeline shows checkmarks for completed steps, spinner for in-progress.
- [ ] Tapping a completed step expands detail (classification rationale, draft preview, eval summary).
- [ ] Failed captures show red badge + "Retry" button. Retry resubmits.

### AC-4: Draft Review
- [ ] Draft detail shows post type with confidence %.
- [ ] Draft text is read-only with highlighted quotes/hashtags.
- [ ] Eval notes show voice consistency, tone analysis, policy fit.
- [ ] "Copy to LinkedIn" copies full draft text to clipboard with confirmation.
- [ ] "Share / Export" opens iOS share sheet with PDF and text options.
- [ ] No "Post to LinkedIn" button exists anywhere.
- [ ] "NOT PUBLISHED" state is prominently displayed.

### AC-5: Dashboard
- [ ] 5 tabs render: Captures, Drafts, Activity, Analytics, Settings.
- [ ] Summary stat cards appear at top of each tab.
- [ ] Empty states show helpful guidance ("No captures yet. Tap the microphone to start.").
- [ ] Pull-to-refresh updates all states.

### AC-6: Settings & Privacy
- [ ] Joni endpoint URL and auth token are stored in Keychain (never UserDefaults or plaintext).
- [ ] "Test Connection" button verifies endpoint reachability.
- [ ] "Delete All" with confirmation dialog removes all local data.
- [ ] "Export all as ZIP" creates downloadable archive.
- [ ] Graceful fallback: no endpoint → "Using local fixture data" visible in Settings and Analytics.

### AC-7: Interviewer Mode
- [ ] Session card appears in Captures tab with distinct "Interviewer" badge.
- [ ] Detail screen shows raw transcript (scrollable, monospace) + structured notes (collapsible sections).
- [ ] Export options: copy notes, PDF, transcript-only.
- [ ] Structured notes sections: title, thesis, stories, key phrases, LinkedIn angles, follow-ups.

### AC-8: Offline & Error Resilience
- [ ] Capture works without network connectivity.
- [ ] Captures queue locally and auto-submit when connectivity returns.
- [ ] Network failure during submission shows explicit "Failed — tap Retry" state.
- [ ] App crash during capture recovers all locally-stored data on relaunch.

### AC-9: Accessibility
- [ ] All screens pass VoiceOver navigation.
- [ ] State badges have semantic labels ("Processing: classifying your idea").
- [ ] List rows have accessibility labels (timestamp + preview text + state).
- [ ] Dynamic Type support from xSmall to accessibilityExtraLarge.

### AC-10: Quality Gates
- [ ] All Swift files <400 lines.
- [ ] SwiftLint, SwiftFormat, Qlty pass with zero errors.
- [ ] Secret scanning passes (no tokens, keys, or passwords in source).
- [ ] `xcodebuild build` succeeds on iOS Simulator.
- [ ] `xcodebuild test` succeeds with ≥85% code coverage.

---

## 7. Analytics / Events

All events use the `AnalyticsService` protocol from the boilerplate. Implementation: `NoOpAnalytics` for v1 MVP (privacy-first), swappable to `TelemetryDeckAnalytics` later. No third-party analytics trackers in v1.

### Event Catalog

| Event Name | Trigger | Properties |
|---|---|---|
| `capture_started` | User begins recording | `source` (widget/action-button/in-app), `timestamp` |
| `capture_completed` | User stops recording | `duration_seconds`, `source`, `has_transcript` (bool) |
| `capture_deleted` | User deletes a capture | `capture_age_minutes`, `state_at_delete` |
| `transcript_edited` | User modifies transcript | `edit_count`, `characters_changed`, `time_to_edit_seconds` |
| `capture_submitted_to_joni` | User taps "Submit to Joni" | `transcript_length_chars`, `is_fixture_mode` (bool) |
| `capture_submission_failed` | Joni submission returns error | `error_type`, `retry_count` |
| `capture_submission_retried` | User taps "Retry" on failed capture | `previous_error_type`, `retry_attempt_number` |
| `draft_viewed` | User opens a draft detail | `post_type`, `confidence_pct`, `time_since_submission_seconds` |
| `draft_copied_to_linkedin` | User taps "Copy to LinkedIn" | `post_type`, `draft_length_chars` |
| `draft_exported` | User shares/export a draft | `export_format` (pdf/text), `post_type` |
| `draft_discarded` | User discards a draft | `post_type`, `time_since_draft_ready` |
| `interview_mode_started` | User starts structured interview capture | `source` |
| `interview_mode_completed` | User stops interview capture | `duration_seconds`, `sections_identified_count` |
| `interview_notes_exported` | User exports structured notes | `export_format` |
| `settings_endpoint_configured` | User sets Joni endpoint URL | `is_override` (bool, false for first setup) |
| `settings_connection_tested` | User taps "Test Connection" | `result` (success/failure/timeout) |
| `settings_data_deleted` | User confirms "Delete All" | `captures_deleted_count`, `drafts_deleted_count` |
| `dashboard_tab_viewed` | User switches dashboard tab | `tab_name`, `time_in_previous_tab_seconds` |
| `analytics_disclaimer_viewed` | User sees "Local analytics" disclaimer | (none) |

### Privacy Note
- No IP address, device ID, advertising identifier, or fingerprint collected.
- All events are local-only in v1; no event data leaves the device.
- `AnalyticsService` is injected as `NoOpAnalytics` in `CompositionRoot`.
- Events can be replaced with `TelemetryDeckAnalytics` post-v1 if user consents via Settings toggle.

---

## 8. Privacy & Security Requirements

### Data Storage
| Data | Location | Encryption |
|---|---|---|
| Audio recordings | Local SwiftData (app sandbox) | iOS Data Protection (on by default) |
| Transcripts | Local SwiftData | iOS Data Protection |
| Drafts (Joni output) | Local SwiftData | iOS Data Protection |
| Joni endpoint URL | Keychain | Hardware-backed (Secure Enclave on supported devices) |
| Joni auth token | Keychain | Hardware-backed |
| Analytics events | In-memory only (v1) | N/A (never persisted) |

### Data Flow
```
User Voice → Apple Speech (on-device) → Transcript → [User Edits] → Joni Ingestion Client → Joni Backend
                                                                                  ↓ (if configured)
                                                                              Fixture Client (default)
```
- No data leaves the device without explicit user action (tap "Submit to Joni").
- No background syncing or auto-send.
- Joni endpoint is optional; fixture mode works fully offline.
- User can delete all local data with one tap (confirmed).

### Security Gates
- [ ] No hardcoded API keys, tokens, or passwords in source code.
- [ ] Keychain used for all secrets (endpoint URL token, future auth tokens).
- [ ] HTTPS enforced for all outbound network requests (ATS configured).
- [ ] No logging of plaintext tokens or PII (use `AppLogger.redacted()`).
- [ ] `Config/Secrets.xcconfig` is `.gitignore`-d.
- [ ] Secret scanning integrated into CI (truffleHog or gitleaks).
- [ ] No third-party analytics SDKs in v1 (no data leakage risk).
- [ ] Privacy policy linked in Settings → About and App Store metadata.
- [ ] App Transport Security (ATS) exceptions documented if any.

### User-Facing Privacy Commitments
- "Your captures stay on your phone until you choose to send them to Joni."
- "No tracking. No ad networks. No third-party analytics."
- "Delete all your data with one tap. No questions asked."
- "Joni integration is optional. The app works fully offline."
- "We never see your raw recordings. Only the transcript you choose to submit."

---

## 9. App Store 4.3 Differentiation Statement

### For Apple Review Team

**Joni Capture is a standalone, purpose-built iPhone app with zero overlap with generic "AI assistant" or "voice memo" apps.**

**What makes it different from a template or clone:**

1. **Unique workflow, not a generic AI chat wrapper.** Joni Capture doesn't expose a generic chat UI. It implements a bespoke state machine (captured → transcribing → queued → submitted → classifying → drafting → evaluating → ready) purpose-built for LinkedIn content creation. This workflow doesn't exist in any other app.

2. **LinkedIn-aware classification and drafting.** The app classifies rambled ideas into LinkedIn-optimized post types (Story, Tactical, Contrarian, Founder Lesson, Callout, Question) and generates drafts tailored to LinkedIn's content ecosystem. Generic AI writing tools (Draft, Notion AI, ChatGPT) have zero LinkedIn-specific intelligence.

3. **Tim's authentic voice as product core.** Drafts are explicitly positioned as "written in Tim's voice," with eval notes quantifying tone match. This authenticity layer is a bespoke integration, not a configurable system prompt. No template app ships with a principal's voice model.

4. **Privacy-first, local-only architecture.** Captures are stored exclusively on-device by default. The Joni backend is optional. No data leaves the device without explicit user action. The privacy posture is unique among AI-assisted creator tools.

5. **Single-purpose for a single audience.** Built for operator-founders capturing LinkedIn ideas on the move. Not a general-purpose note-taker, transcription tool, or AI chat client. Every screen, state transition, and UI element serves this narrow workflow.

6. **Custom DesignSystem integration.** While built on SwiftAIBoilerplatePro infrastructure (auth, networking, storage), the entire UI is custom — custom capture UI, custom vertical timeline, custom draft review with eval cards, custom interviewer mode. No boilerplate screens are shipped.

### Binary Differentiation
- All `SwiftAI`, `Boilerplate`, `EchoLLM` string references removed from binary.
- No boilerplate demo screens (chat, profile, onboarding pages) reachable in release build.
- Custom app icon, launch screen, and marketing metadata.
- Bundle ID: `com.maestro.jonicapture` — unique to this product.
- App name: "Joni Capture" (not "Swift AI Boilerplate" or any template-derived name).

---

## 10. Appium Exploratory Testing Requirements

### Coverage Goal
Appium XCUITest exploratory tapper must click every reachable, enabled button and interactive control across all screens. The tapper validates that no control crashes the app, triggers an unhandled error state, or navigates to a dead end.

### Screens Under Test

| Screen | Interactive Controls to Exercise |
|---|---|
| **Dashboard — Captures Tab** | Tab bar buttons (×5), capture list rows (tap to expand), swipe-to-delete, pull-to-refresh, FAB/`+` button for new capture, empty-state guidance |
| **Dashboard — Drafts Tab** | Draft list rows (tap to expand), filter segments (Ready / Awaiting Action / Archived), pull-to-refresh |
| **Dashboard — Activity Tab** | Timeline rows (tap to expand event details), Joni status indicator (non-interactive but must not crash when tapped) |
| **Dashboard — Analytics Tab** | Stat cards (non-interactive but must not crash when tapped), disclaimer text |
| **Dashboard — Settings Tab** | All toggle switches, text fields (endpoint URL, auth token), "Test Connection" button, "Delete All" button, export/delete buttons, About links (privacy policy, terms) |
| **Capture Screen** | Record button (start/stop/pause), discard button, save button, duration label |
| **Transcript Edit Screen** | Text field (edit), character count, undo button, "Submit to Joni" button, cancel button |
| **Draft Detail Screen** | Expandable classification details, eval notes cards, "Copy to LinkedIn" button, "Share / Export" button, "Discard Draft" button, "NOT PUBLISHED" badge |
| **Interviewer Mode** | Start/stop recording, section break button, raw transcript scroll, structured notes collapsible sections, export buttons |
| **Lock Screen Widget** | Widget tap (launches app), recording indicator, stop button |
| **Action Button Intent** | Start recording, stop recording (verify state transitions) |

### Edge Cases
- [ ] Rapid double-tap on all buttons (no race conditions).
- [ ] Pull-to-refresh during active capture (no data loss).
- [ ] App backgrounding mid-recording (resume without crash).
- [ ] App force-quit mid-recording (data recovered on relaunch).
- [ ] Low storage warning (graceful handling, no crash).
- [ ] Network off → capture → network on → queue drain.
- [ ] Network off → submit → network on → retry.
- [ ] Joni endpoint unreachable → error state → retry.
- [ ] Empty endpoint URL → fixture mode → verify "Using local fixture data" label.
- [ ] Rapid tab switching (no animation glitch or state corruption).
- [ ] VoiceOver navigation across all screens (accessibility labels correct).

### Automation Integration
- XCUITest target: `SwiftAIBoilerplateProUITests`
- Tapper runner: `ExploratoryTapper.swift` (included in UI test target)
- Runs as part of CI: `xcodebuild test -scheme SwiftAIBoilerplatePro -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2'`
- Failure threshold: zero crashes, zero unhandled exceptions, zero navigation dead-ends

---

## 11. SwiftAIBoilerplatePro Module Reuse Plan

### Modules Used (Directly)

| Module | How Joni Capture Uses It | Changes Needed |
|---|---|---|
| **Core** | `AppError`, `AppLogger`, `ToastCenter`, `DeepLinkBus` | No changes. Use as-is. |
| **Networking** | `HTTPClient` protocol for Joni Ingestion Client (real and mock). `AuthInterceptor`, `RetryInterceptor` for backend calls. | No changes. Joni client conforms to existing patterns. |
| **Storage** | `SwiftData` model container for Capture, Draft, Interview entities. `KeychainStore` for endpoint token. Repository pattern for persistence. | Add Capture, Draft, Interview models to schema. Add repositories. |
| **DesignSystem** | `DSColors` (accentPrimary for recording, success for ready, error for failed), `DSSpacing`, `DSTypography`, `SAIButton`, `SAICard`, `SAIListRow`, `SAITag`, `SAIGlass` for overlay materials. | No changes. Consume tokens and components. |
| **Localization** | Type-safe `L10n` strings for all user-facing text. | Add `L10n+JoniCapture.swift` with capture/draft/activity strings. |
| **FeatureSettings** | Settings screen pattern. SettingsRow component. AppSettings storage. | Extend with Joni-specific sections (endpoint config, privacy controls, data export). |
| **Auth** | `KeychainManager` for secure token storage (used by Joni endpoint auth, not for user login). | No changes. Use KeychainStore directly. |
| **FeatureRating** | Rating prompts (adaptive: prompt after 5 captures completed). | No changes. Configure rating config values. |

### Modules NOT Used (Removed from Release Build)

| Module | Reason |
|---|---|
| **FeatureChat** | No chat UI in Joni Capture. Remove from app target. |
| **AI** | No LLM streaming in-app. Drafting happens on Joni backend. Remove (or keep for future Joni streaming, deferred to v1.1). |
| **Payments** | No subscriptions in v1. Remove from app target. |
| **Auth (full)** | No user login/signup. `KeychainStore` is the only dependency from Auth. Remove `SessionManager`, `AppleSignInCoordinator`, `SupabaseHTTPClient` from app target. |
| **FeatureChat sync** | Not applicable. |

### New Package (JoniCaptureFeature)

A new local Swift Package `Packages/FeatureJoniCapture/` following the pattern of `FeatureChat`:

```
Packages/FeatureJoniCapture/
├── Package.swift
├── Sources/
│   ├── Models/
│   │   ├── Capture.swift              // SwiftData model
│   │   ├── Draft.swift                // SwiftData model
│   │   ├── InterviewSession.swift     // SwiftData model
│   │   ├── CaptureState.swift         // State enum (captured → ready)
│   │   ├── PostType.swift             // Enum (story, tactical, contrarian, etc.)
│   │   └── JoniIngestionRequest.swift // DTO for Joni backend
│   ├── Repository/
│   │   ├── CaptureRepository.swift         // Protocol
│   │   ├── CaptureRepositoryImpl.swift     // SwiftData impl
│   │   ├── DraftRepository.swift           // Protocol
│   │   ├── DraftRepositoryImpl.swift       // SwiftData impl
│   │   ├── InterviewRepository.swift       // Protocol
│   │   └── InterviewRepositoryImpl.swift   // SwiftData impl
│   ├── Client/
│   │   ├── JoniIngestionClient.swift       // Protocol
│   │   ├── JoniIngestionClientImpl.swift   // HTTP client impl
│   │   ├── MockJoniIngestionClient.swift   // Fixture data impl
│   │   └── JoniIngestionError.swift        // Error types
│   ├── ViewModels/
│   │   ├── CaptureQueueViewModel.swift
│   │   ├── CaptureViewModel.swift
│   │   ├── DraftListViewModel.swift
│   │   ├── DraftDetailViewModel.swift
│   │   ├── ActivityViewModel.swift
│   │   ├── AnalyticsViewModel.swift
│   │   ├── SettingsViewModel.swift
│   │   └── InterviewViewModel.swift
│   └── Views/
│       ├── Capture/
│       │   ├── CaptureView.swift
│       │   ├── CaptureButton.swift
│       │   └── TranscriptEditView.swift
│       ├── Queue/
│       │   ├── CaptureQueueView.swift
│       │   ├── CaptureRowView.swift
│       │   └── ProcessingTimelineView.swift
│       ├── Drafts/
│       │   ├── DraftListView.swift
│       │   ├── DraftRowView.swift
│       │   ├── DraftDetailView.swift
│       │   └── EvalNotesCard.swift
│       ├── Activity/
│       │   ├── ActivityView.swift
│       │   └── ActivityTimelineRow.swift
│       ├── Analytics/
│       │   ├── AnalyticsView.swift
│       │   └── StatCardView.swift
│       ├── Interviewer/
│       │   ├── InterviewerView.swift
│       │   ├── InterviewSessionCard.swift
│       │   └── StructuredNotesView.swift
│       ├── Settings/
│       │   ├── JoniCaptureSettingsView.swift
│       │   ├── StoragePrivacySection.swift
│       │   ├── JoniIngestionSection.swift
│       │   └── DataExportSection.swift
│       └── Shared/
│           ├── StateBadge.swift
│           └── EmptyStateView.swift
```

### CompositionRoot Integration

```swift
// CompositionRoot+JoniCaptureFactories.swift
extension CompositionRoot {
    func makeCaptureQueueViewModel() -> CaptureQueueViewModel {
        CaptureQueueViewModel(
            captureRepository: captureRepository,
            ingestionClient: joniIngestionClient,
            analyticsService: analyticsService
        )
    }
    
    func makeCaptureViewModel() -> CaptureViewModel {
        CaptureViewModel(
            captureRepository: captureRepository,
            speechRecognizer: speechRecognizer,
            analyticsService: analyticsService
        )
    }
    
    // ... (one factory per ViewModel)
}
```

### Lock Screen Widget & Action Button
- **Widget:** `JoniCaptureWidget` target using `WidgetKit`. Configured in `JoniCaptureWidget.swift`. Uses `@AppIntent` to launch in-app capture.
- **Action Button:** `StartJoniCaptureIntent` conforming to `AppIntent`. Registered in `Info.plist` for `UIApplicationShortcutItem` mapping.

---

## 12. Definition of Done

### 12.1 Feature Completeness
- [ ] All MVP features in §3 are implemented and pass manual QA.
- [ ] All acceptance criteria in §6 are verified.
- [ ] All user journeys in §5 can be completed end-to-end.
- [ ] Lock-screen widget + Action Button work on iOS 17+ physical device.
- [ ] iOS 16 fallback (in-app button only) works without crash.

### 12.2 Architecture
- [ ] MVVM pattern followed: Views are stateless → ViewModels `@Observable @MainActor` → Repositories abstract data → Clients handle I/O.
- [ ] All ViewModels injected via `CompositionRoot`.
- [ ] No business logic in Views.
- [ ] No `UIKit` views or `UIViewController` subclasses (SwiftUI-only).
- [ ] No `DispatchQueue.main.async`; structured concurrency only.
- [ ] No `@ObservableObject` / `@StateObject`; `@Observable` only.
- [ ] `any` keyword on all protocol-typed properties (Swift 6).

### 12.3 Persistence
- [ ] `Capture`, `Draft`, `InterviewSession` models in `SwiftData` schema.
- [ ] Repositories wrap `ModelContext`, exposed as protocols.
- [ ] `KeychainStore` used for Joni endpoint token.
- [ ] Joni endpoint URL stored in `AppSettings` (UserDefaults-backed, no secrets).

### 12.4 Client Layer
- [ ] `JoniIngestionClient` protocol with `submit(capture:) async throws -> Draft`.
- [ ] `JoniIngestionClientImpl` using `HTTPClient` for real backend.
- [ ] `MockJoniIngestionClient` returning fixture data with configurable delay (default 60-120 seconds to simulate real processing).
- [ ] Fixture data includes realistic Tim voice samples, classification distribution, eval notes.
- [ ] `MockJoniIngestionClient` is default when no endpoint configured.

### 12.5 UI & Design
- [ ] All colors use `DSColors` tokens (no hardcoded values).
- [ ] All spacing uses `DSSpacing` tokens.
- [ ] All typography uses `DSTypography`.
- [ ] Dark mode renders correctly on all screens.
- [ ] Dynamic Type works from xSmall to accessibilityExtraLarge.
- [ ] VoiceOver labels on all interactive elements.
- [ ] Reduced motion respected (no unnecessary animations when setting is on).

### 12.6 Quality Gates
- [ ] All Swift files <400 lines.
- [ ] `swiftlint` passes with zero errors and zero warnings.
- [ ] `swiftformat` passes.
- [ ] `qlty` passes.
- [ ] Secret scanning passes (zero findings).
- [ ] `xcodebuild build -scheme SwiftAIBoilerplatePro -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2'` succeeds.
- [ ] `xcodebuild test ...` succeeds with ≥85% code coverage.

### 12.7 Testing
- [ ] Unit tests for all ViewModels (happy path, error path, edge cases).
- [ ] Unit tests for all Repositories (CRUD operations, error handling).
- [ ] Unit tests for `JoniIngestionClient` (mock and real).
- [ ] Integration tests for capture → submit → draft flow.
- [ ] Integration tests for offline → online queue drain.
- [ ] Integration tests for retry failure → retry success.
- [ ] Snapshot tests for key screens (light/dark, multiple Dynamic Type sizes).
- [ ] Appium XCUITest exploratory tapper passes (zero crashes, zero dead-ends).

### 12.8 App Store Readiness
- [ ] App Store 4.3 differentiation statement verified (binary + metadata audit).
- [ ] All boilerplate string references removed from release binary.
- [ ] Custom app icon (1024×1024).
- [ ] Launch screen matches brand.
- [ ] Privacy policy hosted and linked in Settings → About and App Store metadata.
- [ ] Release notes drafted.
- [ ] Screenshots (6.9" and 6.5" displays) showing core workflows.
- [ ] App Store description: "The LinkedIn Creator's Voice App. Ramble → Draft → Review. In Tim's Voice."

### 12.9 Documentation
- [ ] `docs/modules/FeatureJoniCapture.md` written following existing module doc patterns.
- [ ] `docs/foundations/Architecture.md` updated with Joni Capture data flow.
- [ ] `AGENTS.md` updated with Joni-specific development notes.
- [ ] `README.md` updated with app description and build instructions.

---

**Spec Status:** Complete. Ready for development handoff and consensus merge.

**Model:** DeepSeek V4 Pro