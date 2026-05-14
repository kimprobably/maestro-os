# Changelog

All notable changes to SwiftAI Boilerplate Pro.

## [Unreleased]

### Added

- **App Store 4.3(a)** — `docs/checklists/APP_STORE_4_3_HARDENING.md` (binary audit, branding map, metadata, Review Notes, module removal, AI↔FeatureChat note); `docs/prompts/AppStore4_3Hardening.prompts.md`
- **Buyer onboarding** — `docs/buyers/POST_PURCHASE.md`, `docs/buyers/README.md` (welcome + 4.3 link + copy-paste post-purchase email)
- **Agent discovery** — root `AGENTS.md`; `RELEASE_NOTES_NEXT.md` (draft narrative for the next Git tag)
- **Cursor rules** — `.cursor/rules/app-store-differentiation.mdc`, `.cursor/rules/ios-platform-safety.mdc`; `swiftui-views.mdc` v2.0 `@Observable` note at top; `.cursor/README.md` updated

### Fixed

- **Swift 6 data race in `AppDelegate.uploadDeviceToken`** ([#4](https://github.com/SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution/issues/4)) — `DeviceTokenUploader` was constructed on the caller's isolation and then captured by a detached `Task`, which Swift 6 strict concurrency rejected (`Sending 'uploader' risks causing data races`). Construction is now inside the `Task` closure so nothing crosses the isolation boundary. Thanks to @MarcinKilarski for the report and the suggested patch.

### Changed

- **Docs cross-links** — `README.md`, `docs/INDEX.md`, `docs/CLAUDE.md`, `docs/BUILDING_YOUR_APP.md`, `docs/recipes/WhiteLabeling.md`, `docs/prompts/README.md`, `SKILLS.md`
- **Package READMEs** — all 11 packages: footer linking to 4.3 hardening / removal notes

## [2.0.0] - 2026-04-12 — Swift 6 & iOS 26 Liquid Glass

### Summary

Full Swift 6 migration, iOS 26 SDK readiness, and first-class Liquid Glass
adoption. All 11 SPM packages upgraded to swift-tools-version 6.2 with strict
concurrency. Privacy manifest added. Data races eliminated, deprecated APIs
replaced, modern Swift patterns adopted. Navigation, toolbars, floating
controls, toasts, rating prompts, and loading overlays all pick up the new
iOS 26 glass material — while still rendering cleanly on iOS 17+ via a
built-in material fallback.

A static application security testing (SAST) pass closed multiple issues end-to-end:
client paywall enforcement, SQL authorization on a stats RPC, hardened Supabase
edge AI function (validation, allowlists, sanitized errors), and defense-in-depth
changes in Swift and Postgres. See **Security & backend (SAST)** below.

### Security & backend (SAST)

- **Paywall / free tier** — `PaymentsStatusAdapter` is wired into `ChatViewModel` so the per-conversation free message limit is enforced (previously unused)
- **SQL IDOR** — Migration `20260408000000_fix_conversation_stats_auth.sql`: `get_conversation_with_stats` now requires `c.user_id = auth.uid()` so callers cannot read other users’ conversations
- **Edge function (`supabase/functions/ai/index.ts`)** — Authenticated users only; model allowlist (OpenRouter IDs, e.g. `openai/gpt-3.5-turbo`, `openai/gpt-4o-mini`); message count and per-message length bounds; only `user`/`assistant` roles from clients; server-controlled system prompt prepended; temperature clamped to 0.0–2.0; OpenRouter failures return generic client messages while details are logged server-side; top-level errors do not leak internal exception text
- **Swift client** — Memory context for the LLM is injected as a separate delimited message (not appended to the user’s text); chat deep links require a valid `conversationId` UUID; `SupabaseMessageRepository.page()` filters by `user_id` for defense-in-depth
- **Secrets workflow** — `.githooks/pre-commit` blocks commits of non-placeholder values in `Generated/Configuration.swift`; `scripts/update-config.sh` warns not to commit after injecting real keys (install hook: `git config core.hooksPath .githooks`)

### Added

- **PrivacyInfo.xcprivacy** — Privacy manifest declaring UserDefaults API usage (required for App Store)
- **DesignSystem `SAIGlass`** — New `Materials/SAIGlass.swift` with:
  - `SAIGlassStyle` (`.regular` / `.clear`) that maps to iOS 26 `Glass` and falls back to SwiftUI `Material` on iOS 17–25
  - `.saiGlass(_:in:interactive:)` view modifier — the one call site adopts Liquid Glass on iOS 26 and stays visually consistent on earlier releases
  - `SAIGlassContainer` — wraps multiple glass surfaces so iOS 26 can merge compositing via `GlassEffectContainer`; transparent passthrough on older OSes
  - `.saiScrollEdgeGlass(_:)` — opt-in `scrollEdgeEffectStyle(.hard, for:)` on iOS 26, no-op below
  - `.saiSidebarAdaptable()` + `.saiTabBarMinimize(_:)` — availability-gated wrappers for `tabViewStyle(.sidebarAdaptable)` and `tabBarMinimizeBehavior(_:)`

### Changed — Liquid Glass Adoption

- **App tab bar** — `MainTabView` now opts in to `.sidebarAdaptable` (iPad/Mac sidebar) and `.onScrollDown` tab-bar minimise behaviour on iOS 26
- **Chat input bars** — `SAIInputBar`, `ChatView`, and `ChatGPTStyleView` now float an interactive glass surface over the scroll view instead of sitting on an opaque `DSColors.background` strip. `.saiScrollEdgeGlass(.bottom)` keeps content legible where messages meet the glass
- **Toolbar actions** — `ChatHistoryView` "New Chat" button replaced a custom `Circle + strokeBorder` button with a standard `Label` `Button`, which now picks up Liquid Glass automatically
- **SAIToast** — toast card background migrated from `DSColors.surfaceElevated` to `saiGlass(.regular)`
- **RatingPromptView** — pre-prompt card background migrated to `saiGlass(.regular)`
- **Loading overlays** — `SettingsView` and `PaywallView` loading overlays now use `saiGlass(.regular)` instead of hard-coded `.regularMaterial` fills
- **PaywallView CTAs** — `Subscribe`, `Restore Purchases`, `Continue`, and `Manage Subscription` buttons switched from hand-rolled `.background(DSColors.primary) + RoundedRectangle` to `.buttonStyle(.borderedProminent)` / `.buttonStyle(.bordered)` + `.controlSize(.large)`, so the system adopts Liquid Glass for them on iOS 26
- **SettingsView Form** — added `.formStyle(.grouped)` so row heights, padding, and section corner radius match iOS 26 defaults

### Changed — Fighting-Glass Cleanup

- Removed `DSColors.background.ignoresSafeArea()` / `.background(DSColors.background)` overrides from `SettingsView`, `HomeView`, `ProfileView`, `ProfileView.editProfileSheet`, and `ChatHistoryView` — these were painting an opaque layer over the material SwiftUI already provides, breaking the new glass look
- Removed `.scrollContentBackground(.hidden)` from `SettingsView` — now handled by `.formStyle(.grouped)`
- Removed explicit `.safeAreaInset(edge: .bottom) { Color.clear.frame(height: 88) }` gutters from `HomeView` and `ProfileView` — the system tab bar already provides the correct safe-area insets under Liquid Glass
- `SAIInputBar` and `ChatGPTStyleView` prompt input: dropped `.background(DSColors.surface)` + `clipShape` stacks, letting the outer `saiGlass` wrapper own the surface

### Refactored — 400-line architecture rule

Production files that exceeded the workspace "never create files over 400 lines" rule were split structurally (no behavior changes) so every Swift source file in `Packages/` and `SwiftAIBoilerplatePro/` now stays under 400 lines:

- `ProfileView.swift` (729) → `AppShell/Profile/` subviews
- `SettingsView.swift` (579) → `Views/Settings/` section components
- `EmailSignUpView.swift` (496) → `AppShell/Auth/` form + scaffold
- `CompositionRoot.swift` (491) → per-feature extension files
- `SessionManager.swift` (512) → `SessionTokenRefresher` + `SessionPersistence` helpers
- `ChatViewModel.swift` (419) → `ChatPaginator` + `ChatDeepLinkHandler` helpers
- `ProxyLLMClient.swift` (459) → `Proxy/` request builder + stream parser
- `L10n.swift` (563) → per-namespace extension files
- `ProxyLLMClientTests.swift` (605) → `Proxy/` test files grouped by concern

Every split preserved the public API. See the `refactor:` commits in v2.0.0 history for per-file diffs.

### Infrastructure

- **CI** — Workflows bumped to `macos-15` runners with Xcode 26.2 (the first toolchain shipping the iOS 26 SDK). New `test-ios18-fallback` job builds on `iPhone 16 Pro / iOS 18.6` to validate the SwiftUI `Material` fallback path used when `SAIGlass` runs on pre-iOS-26 devices. Obsolete `package-tests` job removed (its `swift test` invocations targeted the host macOS and could not compile iOS-only SwiftUI — the app test suite already exercises package code).
- **`.xcode-version`** — New file pinning local dev Xcode to `26.3` (consumable by `xcodes` / `asdf-xcode`).
- **README** — Prerequisites now call out `macOS 15+ with Xcode 26.2+`; older-Xcode users are pointed at the `v1.9.0` tag.

### Hardening

- **Networking** — `URLSessionHTTPClient.applySyntheticTTL` no longer force-unwraps `urlRequest.url`; the URL is folded into the existing `guard` and the cached response path now short-circuits cleanly if the URL is somehow missing.

### Changed

- **Swift 6 Language Mode** — All 11 packages bumped to swift-tools-version 6.2; Xcode SWIFT_VERSION 5.0 → 6.0
- **Concurrency Safety** — `MessageRepositoryImpl`, `ConversationRepositoryImpl`, `SettingsRepositoryImpl` pinned to `@MainActor`, eliminating `nonisolated(unsafe)` data races on `ModelContext`
- **Existential Types** — Added `any` keyword to all protocol-typed properties and parameters across 20+ files
- **ObservableObject → @Observable** — Migrated `DeepLinkBus` and `ToastCenter`; updated consumers from `@ObservedObject`/`.onReceive($published)` to direct property access/`.onChange(of:)`
- **ProxyLLMClient** — Removed `@unchecked Sendable` (all properties are immutable `let`)
- **ReplyActionBus** — Added `@MainActor` isolation for thread-safe singleton access
- **MemoryRetrievalConfig** — Added explicit `Sendable` conformance
- **Structured Concurrency** — Replaced all `DispatchQueue.main.async`/`asyncAfter` with `Task`/`Task.sleep(for:)` in AppDelegate, SignInView, ChatView, ChatGPTStyleView
- **UIScreen.main.scale** → `@Environment(\.displayScale)` in ChatRowCard

### Fixed

- **Data Race (P0)** — Storage repositories accessed `ModelContext` across isolation boundaries — now properly `@MainActor`-isolated
- **Force Unwrap** — `SessionManager.saveSession()` force-unwrapped UTF-8 encoding — now uses `guard let`
- **Redundant Flag** — Removed `.enableUpcomingFeature("StrictConcurrency")` from Payments (redundant with 6.2)

### Migration Notes

- **Toolchain (required)** — `SAIGlass` names iOS 26 SDK symbols (`Glass`, `glassEffect`, `GlassEffectContainer`) at compile time, and `#available` only gates **runtime**. You **must** build v2.0.0 with **Xcode 26.2 or newer** (the first toolchain shipping the iOS 26 SDK). `.xcode-version` is pinned to `26.3` for `xcodes`/`asdf-xcode` users. If you cannot upgrade Xcode yet, stay on the `v1.9.0` tag until you can. Runtime still supports iOS 17+ via the SwiftUI `Material` fallback built into `saiGlass(...)`.
- **CI** — CI now runs on `macos-15` with Xcode 26.2 and an `iPhone 17 Pro / iOS 26.2` destination. A separate `test-ios18-fallback` job validates the Material fallback path on `iPhone 16 Pro / iOS 18.6`.
- **Supabase** — Apply migration `20260408000000_fix_conversation_stats_auth.sql` and deploy the updated `ai` edge function on every backend that ships this release
- NSLock in `KeychainStore`/`RevenueCatClient` preserved (Mutex requires iOS 18+)
- `@unchecked Sendable` on `KeychainStore`, `RevenueCatClient`, `ImageCache`, `URLSessionHTTPClient` justified — uses internal synchronization
- `nonisolated(unsafe)` on Task handles in ViewModels preserved — required for `deinit` cancellation

---

## [1.8.0] - 2026-03-01

### Summary

Claude Code skills integration for AI-assisted iOS development, documentation updates, and distribution email infrastructure. Install 4 curated skill repositories (180+ skills) to supercharge development with this boilerplate.

---

### Added

**Skills Integration (NEW):**
- New `SKILLS.md` with 4 curated Claude Code skill recommendations for iOS development
- Pre-installed skills: Axiom (161 skills), Apple Skills Collection (17 skills), iOS Simulator (1 skill), SwiftUI Best Practices (2 skills)
- `skills-lock.json` for reproducible skill installation via `npx skills experimental_install`
- `.agents/skills/` directory with all installed skills ready for buyers
- Skill-Module mapping showing which skills help with which boilerplate modules
- 0-shot project creation guide using boilerplate + skills + Claude Opus 4.6

**Documentation Updates:**
- Updated `docs/CLAUDE.md` with FeatureRating, Localization modules and skills integration section
- Updated `docs/INDEX.md` with Claude Code Skills quick link
- Updated `DISTRIBUTION_CHECKLIST.md` with 11-package count, skills verification phase, and email distribution

**Distribution Email:**
- New distribution news email infrastructure (managed in landing page repo)
- Email task added to `DISTRIBUTION_CHECKLIST.md`

### Changed

- Package count updated from 10 to 11 across all distribution files (Localization was missing)
- `DISTRIBUTION_CHECKLIST.md` now includes Phase 4.5 for skills verification
- `docs/CLAUDE.md` dependency graph updated to include Localization module

---

## [1.7.0] - 2026-02-10

### Summary

New FeatureRating module for smart, sentiment-based app rating prompts. Track positive and negative user actions, automatically show a beautiful pre-prompt popup at the right moment, and trigger the native App Store review dialog when users are happiest.

---

### Added

**FeatureRating Module (New Swift Package):**
- New `FeatureRating` Swift Package for configurable app rating/review prompts
- `RatingAction` model with positive/negative sentiment and configurable weights
- `RatingConfig` for thresholds, cooldowns, UI copy, and branding
- `RatingEngine` with sentiment scoring, time-based decay, and smart decision logic
- `RatingStorage` protocol with `UserDefaultsRatingStorage` implementation
- `RatingClient` protocol with `DefaultRatingClient` (production) and `MockRatingClient` (testing)
- `RatingPromptView` -- beautiful, themed pre-prompt popup using DesignSystem tokens
- `.ratingPrompt()` ViewModifier for automatic prompt presentation
- Pre-defined action templates (taskCompleted, milestoneReached, purchaseCompleted, etc.)
- `stopAskingAfterRating` config flag (default: `true`) -- permanently stops prompting after user taps "Rate on App Store"
- `userHasRated` persistence flag in `RatingStorage` to remember when a user has gone through the rating flow
- Configurable opt-out: set `stopAskingAfterRating: false` to rely solely on cooldowns and yearly limits
- 25+ unit tests covering scoring, decay, thresholds, cooldowns, yearly limits, stop-after-rating, and reset
- Full dark mode and accessibility support (VoiceOver labels, reduce motion)
- Works across all 5 themes (System, Light, Dark, Aurora, Obsidian)

**Integration:**
- Wired into `CompositionRoot` with configurable `RatingConfig`
- Exposed via `AppEnvironment.ratingClient` for view-level access
- `.ratingPrompt()` modifier attached to `AppRootView`
- Example `.record()` calls in `HomeViewModel` with CUSTOMIZE markers
- Commented examples for Interview Prep, Matchmaking, and Productivity apps

**Documentation:**
- `docs/modules/FeatureRating.md` -- complete module guide with API reference, examples by app type, and customization checklist
- `docs/prompts/Feature.Rating.prompts.md` -- LLM prompt pack for customizing the rating module
- `docs/recipes/UpstreamSync.md` -- guide for pulling boilerplate updates into derived apps

### Changed

- Package count updated from 9 to 10 across distribution files
- `CompositionRoot` now creates and owns `ratingClient`
- `AppEnvironment` exposes `ratingClient` for dependency injection
- `HomeViewModel` accepts optional `ratingClient` for recording actions
- Xcode project updated with `FeatureRating` package dependency

---

## [1.6.0] - 2026-01-04

### Summary

New Localization module and comprehensive Accessibility features. Type-safe localization with `L10n` enum and full accessibility support with `A11y` labels and modifiers for building inclusive apps.

---

### Added

**Localization Module (New Swift Package):**
- New `Localization` Swift Package for type-safe string localization
- `L10n` enum with nested namespaces for organized string access (`L10n.Auth.tagline`, `L10n.Chat.sendButton`, etc.)
- Built-in pluralization support via `.stringsdict` files
- English (`en.lproj`) and Spanish (`es.lproj`) translations included as examples
- Zero configuration required - just import and use
- Comprehensive documentation at `docs/modules/Localization.md`
- Example usage file at `docs/examples/LocalizationExamples.swift`

**Accessibility Features (DesignSystem Enhancement):**
- `A11yLabel` struct for type-safe accessibility labels with hints and traits
- `A11y` enum with pre-defined labels for common UI elements across all features
- New accessibility modifiers in `A11yModifiers.swift`:
  - `.saiAccessible(_:)` - Apply type-safe accessibility labels
  - `.saiAccessibilityHidden()` - Hide decorative elements from VoiceOver
  - `.saiAccessibilityGroup()` - Combine related elements
  - `.saiAccessibilityValue(_:)` - Dynamic value announcements
  - `.saiAccessibilitySortPriority(_:)` - Custom reading order
  - `.saiScaledFont(_:)` - Dynamic Type support
  - `.saiMotionAwareAnimation(_:)` - Respect Reduce Motion setting
  - `.saiHighContrastSupport(normal:highContrast:)` - High Contrast mode
  - `.saiFocusIndicator(_:)` - Visible focus rings for Switch Control
- `A11yAudit` debug tool for highlighting elements with missing labels
- Comprehensive documentation at `docs/modules/Accessibility.md`
- Example usage file at `docs/examples/AccessibilityExamples.swift`

**Documentation:**
- `docs/modules/Localization.md` - Complete localization guide with:
  - Type-safe API reference
  - Adding new strings and languages
  - Pluralization and formatting
  - Testing strategies
  - Troubleshooting guide
- `docs/modules/Accessibility.md` - Complete accessibility guide with:
  - VoiceOver best practices
  - Dynamic Type implementation
  - Reduce Motion and High Contrast support
  - Testing with Accessibility Inspector
  - Common issues and fixes
- `docs/examples/LocalizationExamples.swift` - Commented code examples for buyers
- `docs/examples/AccessibilityExamples.swift` - Commented code examples for buyers
- `MARKETING_FEATURES.md` - Marketing copy and code snippets for landing page

---

### Changed

**DesignSystem Module:**
- Added new `Accessibility/` directory with:
  - `A11y.swift` - Type-safe accessibility labels
  - `A11yModifiers.swift` - SwiftUI view modifiers
  - `A11yAudit.swift` - Debug auditing tools
- Updated `docs/modules/DesignSystem.md` with accessibility quick reference

**Documentation Index:**
- Updated `docs/INDEX.md` with links to new Localization and Accessibility docs
- Added example files section for quick reference

---

### For Upgrading Users

**To use Localization:**
1. Add `Localization` package dependency to your target
2. Import and use: `import Localization` then `L10n.Auth.tagline`
3. Add new strings to `Localizable.strings` and corresponding `L10n` enum cases
4. See `docs/modules/Localization.md` for complete guide

**To use Accessibility features:**
1. Already included in `DesignSystem` - no additional setup
2. Import: `import DesignSystem`
3. Apply labels: `.saiAccessible(A11y.Chat.sendButton)`
4. See `docs/modules/Accessibility.md` for complete guide

**Both features are optional** - existing code continues to work without changes.

---

## [1.5.0] - 2025-12-07

### Summary

Major update with OneSignal push notifications integration and critical session management fix. Users now stay logged in reliably across app restarts.

---

### Added

**OneSignal Push Notifications (Optional):**
- Complete OneSignal SDK integration for push notifications
- `OneSignalNotificationServiceExtension` target for rich notifications (images, buttons, badges)
- Confirmed delivery analytics support
- Secure configuration via `Config/Secrets.xcconfig` (ONESIGNAL_APP_ID)
- Comprehensive documentation at `docs/integrations/OneSignal.md`
- Graceful degradation - app works perfectly without configuration
- Easy opt-out: simply don't configure the App ID

**Documentation:**
- `docs/integrations/OneSignal.md` - Complete setup guide with:
  - Step-by-step OneSignal account and APNs configuration
  - SDK initialization details
  - Testing instructions
  - Troubleshooting guide
  - Complete removal instructions for users who don't want push notifications
  - Privacy & GDPR compliance guidance

---

### Fixed

**🔴 CRITICAL: Session Management Bug**

Users were being unexpectedly logged out when opening the app after the access token expired (~1 hour). This was a critical bug affecting user experience.

**Root Cause:**
The `loadInitialSession()` method in `SessionManager.swift` immediately cleared the session when the access token was expired, ignoring the still-valid refresh token.

**The Fix:**
- Added `attemptSessionRefresh()` method that tries to refresh using the refresh token (up to 3 retries)
- Shows `.refreshing` state during refresh attempts
- Only logs out user if ALL refresh attempts fail (refresh token expired/revoked)
- Proper handling of token rotation

**Before (Bug):**
| Scenario | Result |
|----------|--------|
| Open app after 2 hours | ❌ Logged out |
| Open app after 1 day | ❌ Logged out |

**After (Fixed):**
| Scenario | Result |
|----------|--------|
| Open app after 2 hours | ✅ Silent refresh, stays logged in |
| Open app after 3 days | ✅ Silent refresh, stays logged in |
| Open app after 14+ days | Graceful logout (refresh token expired) |

**Files Changed:**
- `Packages/Auth/Sources/Auth/Session/SessionManager.swift`

---

### Changed

**Configuration:**
- Updated `Config/Secrets.example.xcconfig` with OneSignal placeholder
- Updated `scripts/update-config.sh` to handle ONESIGNAL_APP_ID validation
- Updated `SwiftAIBoilerplatePro/Generated/Configuration.swift` with OneSignal support

**Documentation:**
- Updated `docs/INDEX.md` - Added OneSignal to integrations list
- Updated `docs/BUILDING_YOUR_APP.md` - Added OneSignal to setup guides
- Updated `docs/modules/Auth.md` - Enhanced session persistence documentation with:
  - Token lifespan table (access: 1hr, refresh: 7+ days)
  - Automatic session restoration flow diagram
  - New troubleshooting section for unexpected logout issues
- Updated `README.md` - Added push notifications to feature list

**App Initialization:**
- Updated `SwiftAIBoilerplatePro/AppDelegate.swift`:
  - OneSignal SDK initialization (before UNUserNotificationCenter delegate)
  - Automatic permission request through OneSignal
  - Verbose logging in DEBUG builds

---

### For Upgrading Users

**To get push notifications:**
1. Add `ONESIGNAL_APP_ID = your-app-id` to `Config/Secrets.xcconfig`
2. Run `bash scripts/update-config.sh`
3. Build and run on a real device (push doesn't work on simulator)

**To skip push notifications:**
- Do nothing - the app works fine without configuration

**Session fix is automatic:**
- Just update to this version
- Users will no longer be unexpectedly logged out

---

## [Documentation & Testing Overhaul] - 2025-10-13

### Summary

Complete documentation restructure with single-path, example-first approach. All legacy docs removed; everything now reachable from `docs/INDEX.md`. Comprehensive test suite added to achieve 85-90% coverage target with full CI integration.

---

### Added

**Core Documentation:**
- `README.md` - Complete rewrite with 10-minute Quick Start
- `docs/INDEX.md` - Central documentation hub linking to all resources
- `docs/architecture-overview.md` - System design with diagrams and data flow examples
- `docs/visual-consistency.md` - Prescriptive visual guide with token reference
- `docs/testing-guide.md` - Comprehensive testing guide with coverage measurement
- `CLAUDE.md` - Enhanced LLM navigation guide with code examples

**Module Documentation (10 modules):**
- `docs/Core.md` - Error handling, logging, utilities
- `docs/Networking.md` - HTTP client, interceptors, caching
- `docs/Storage.md` - SwiftData, Keychain, repositories
- `docs/Auth.md` - Authentication with Supabase and Apple Sign In
- `docs/Payments.md` - Subscription management with RevenueCat
- `docs/AI.md` - LLM integration and streaming
- `docs/FeatureChat.md` - Chat UI with dual styles
- `docs/FeatureSettings.md` - Settings and paywall
- `docs/DesignSystem.md` - UI components and theming
- `docs/Composition.md` - Dependency injection

**Migration Guides:**
- `docs/migrations/supabase.md` - Complete Supabase setup with step-by-step instructions
- `docs/migrations/revenuecat.md` - RevenueCat configuration with App Store Connect integration

**Testing Infrastructure:**

*App-Level Tests:*
- `SwiftAIBoilerplateProTests/CompositionRootTests.swift` - DI container tests (20+ tests)
  - Singleton initialization, factory methods, dependency wiring
  - Memory management, integration flows

*UI Tests:*
- `SwiftAIBoilerplateProUITests/AuthFlowUITests.swift` - Authentication flows (15+ tests)
- `SwiftAIBoilerplateProUITests/ChatFlowUITests.swift` - Chat functionality (18+ tests)
- `SwiftAIBoilerplateProUITests/PaywallFlowUITests.swift` - Payment flows (15+ tests)

*Package Error Scenario Tests:*
- `Packages/Networking/Tests/NetworkingTests/ErrorScenarioTests.swift` (20+ tests)
  - Network errors, HTTP status codes, decoding failures
- `Packages/Auth/Tests/AuthTests/AuthErrorScenarioTests.swift` (18+ tests)
  - Auth failures, token refresh, keychain errors
- `Packages/Payments/Tests/PaymentsTests/PaymentErrorScenarioTests.swift` (15+ tests)
  - Purchase errors, restore failures, subscription expiry
- `Packages/FeatureChat/Tests/FeatureChatTests/ChatViewRenderingTests.swift` (22+ tests)
  - View rendering in all states, edge cases
- `Packages/FeatureChat/Tests/FeatureChatTests/ChatHistoryViewTests.swift` (10+ tests)
  - Conversation management, search/filter

**CI/CD Configuration:**
- `.github/workflows/ci.yml` - Main CI pipeline with coverage enforcement
- `.github/workflows/coverage-report.yml` - Weekly comprehensive coverage reports
- `.swiftlint.yml` - Code quality and linting rules

**Testing Tools:**
- `scripts/run-tests.sh` - Local test runner with coverage measurement
  - HTML report generation
  - Threshold checking
  - Package-specific testing

**Total Added: ~150+ new tests**

---

### Changed

**Documentation Structure:**
- Single-path approach - one clear path for everyone
- Example-first - every page includes runnable code snippets
- Consistent formatting - all docs follow template structure
- Linked navigation - everything reachable from `docs/INDEX.md`

**Content Improvements:**
- Quick Start reduced from 30 minutes to 10 minutes
- All module docs include: Purpose, API, Setup, Examples, Customization, Troubleshooting
- Migration guides refined with exact commands and expected outputs
- Visual guide includes token reference tables and accessibility checklist

**Testing Coverage:**
- Comprehensive error scenario coverage across all critical modules
- UI test coverage for all major user flows
- Integration tests for DI container and component wiring
- Snapshot tests for UI consistency

---

### Removed

**Legacy Documentation:**
- `CHAT_UI_IMPLEMENTATION_SUMMARY.md` - Consolidated into `docs/FeatureChat.md`
- `CURRENT_STATUS.md` - No longer relevant
- `IMPLEMENTATION_SUMMARY.md` - Superseded by module docs
- `MIGRATION_COMPLETE.md` - Migration tracking doc
- `SIGNATURE_UI_KIT_SUMMARY.md` - Content moved to `docs/visual-consistency.md`
- `STATUS_AND_NEXT_STEPS.md` - No longer relevant
- `SUPABASE_OPENROUTER_MIGRATION.md` - Superseded by `docs/migrations/supabase.md`
- `THEMING_IMPLEMENTATION.md` - Content in `docs/visual-consistency.md`
- `docs/CHAT_UI_STYLES_QUICK_REF.md` - Duplicate content
- `docs/PAYMENTS_INTEGRATION_GUIDE.md` - Consolidated into `docs/Payments.md`
- `docs/README_TEMPLATE.md` - No longer needed
- `docs/SUBSCRIPTION_IMPLEMENTATION.md` - Consolidated into migration guide
- `docs/REVENUECAT_SETUP.md` - Moved to `docs/migrations/revenuecat.md`
- `SwiftAIBoilerplatePro/docs/ARCHITECTURE.md` - Superseded by `docs/architecture-overview.md`
- `SwiftAIBoilerplatePro/docs/roadmap.md` - No longer relevant
- `SwiftAIBoilerplatePro/docs/scope.md` - No longer relevant

---

## Testing Coverage Goals

### Target: 85-90% Overall Coverage

| Module | Target | Focus |
|--------|--------|-------|
| Core | 95%+ | Error handling, logging |
| Networking | 90%+ | HTTP client, interceptors, retry, error scenarios |
| Storage | 85%+ | Repositories, SwiftData, Keychain |
| Auth | 85%+ | Session management, token refresh, Apple Sign In |
| Payments | 80%+ | Purchase flows, restore, subscription management |
| AI | 85%+ | Streaming, error handling, proxy integration |
| FeatureChat | 75%+ | ViewModel, pagination, UI rendering |
| FeatureSettings | 70%+ | Settings management, paywall |
| **Overall** | **85-90%** | **CI Enforced** |

### Test Categories (338+ Total Tests)

1. **Unit Tests** - 251 tests
   - Component isolation
   - Mock dependencies
   - Fast execution
   
2. **Integration Tests** - 47 tests
   - Component interaction
   - Real dependency wiring
   - DI validation
   
3. **Snapshot Tests** - 12 tests
   - UI rendering verification
   - Light/dark mode
   - Accessibility states
   
4. **UI Tests** - 28 tests
   - End-to-end flows
   - User journeys
   - Critical paths

---

## CI/CD Integration

### Automated Testing
- Runs on every push to `main` / `develop`
- Runs on all pull requests
- **Coverage gate:** Builds fail if < 85%
- SwiftLint enforcement for code quality
- Parallel package testing for speed

### Coverage Reporting
- Automatic PR comments with coverage stats
- Weekly comprehensive reports
- HTML reports with detailed breakdowns
- Issue creation for low coverage modules

### Local Development
```bash
# Run tests with coverage
./scripts/run-tests.sh --coverage --open

# Test specific package
./scripts/run-tests.sh --package Core --coverage
```

---

## Developer Experience

### Improvements
- **Single source of truth:** All docs linked from `docs/INDEX.md`
- **Faster onboarding:** 10-minute Quick Start gets developers coding immediately
- **Better navigation:** Clear links between related docs
- **Troubleshooting:** Every module doc includes common issues and fixes
- **Examples:** Runnable code snippets in every guide
- **LLM-friendly:** Optimized for AI coding assistants (see `CLAUDE.md`)
- **Test confidence:** 85-90% coverage with CI enforcement
- **Quality gates:** Automated linting and testing prevent regressions

### Documentation Statistics
- **Total pages:** 16 (down from 24 scattered docs)
- **Module docs:** 10 comprehensive guides
- **Migration guides:** 2 step-by-step tutorials
- **Lines of documentation:** ~9,000 (organized and deduplicated)
- **Code examples:** 120+ runnable snippets
- **Test files:** 10+ comprehensive test suites

---

## Organization

### New Structure
```
SwiftAIBoilerplatePro/
├── README.md                    # 10-minute Quick Start
├── CLAUDE.md                    # LLM navigation guide
├── CHANGELOG.md                 # This file
├── docs/
│   ├── INDEX.md                 # Central hub
│   ├── architecture-overview.md # System design
│   ├── visual-consistency.md    # Visual guide
│   ├── testing-guide.md         # Testing & coverage
│   ├── Core.md                  # Module docs (10 total)
│   ├── Networking.md
│   ├── Storage.md
│   ├── Auth.md
│   ├── Payments.md
│   ├── AI.md
│   ├── FeatureChat.md
│   ├── FeatureSettings.md
│   ├── DesignSystem.md
│   ├── Composition.md
│   └── migrations/
│       ├── supabase.md
│       └── revenuecat.md
├── .github/
│   └── workflows/
│       ├── ci.yml               # Main CI pipeline
│       └── coverage-report.yml  # Weekly reports
├── scripts/
│   └── run-tests.sh             # Local test runner
└── Packages/
    └── */Tests/                 # Package tests
```

---

## Quality Standards

**All documentation now:**
- ✅ Follows single-path approach
- ✅ Includes runnable examples
- ✅ Has troubleshooting section
- ✅ Uses consistent formatting
- ✅ Links to related docs
- ✅ Accessible from `docs/INDEX.md`
- ✅ Includes exact commands and expected outputs
- ✅ Provides step-by-step instructions
- ✅ Uses plain quotes (no smart quotes)
- ✅ Avoids marketing fluff

**All code now:**
- ✅ Has comprehensive test coverage (85-90%)
- ✅ Includes error scenario tests
- ✅ Passes SwiftLint checks
- ✅ CI validated on every change
- ✅ Coverage gates prevent regressions

---

## For Buyers

### What This Means
- **Faster setup:** Get from clone to running app in 10 minutes
- **Clear customization:** Know exactly what to change and where
- **Better debugging:** Troubleshooting guides for common issues
- **Confident changes:** Examples show the right way to extend
- **Single path:** No confusion about which guide to follow
- **Quality assurance:** 85-90% test coverage with CI enforcement
- **Ship faster:** Automated testing catches bugs before production

---

## Next Steps

### For Users
1. Start with [README.md](README.md) Quick Start
2. Explore [docs/INDEX.md](docs/INDEX.md) for deeper dives
3. Follow migration guides for backend setup
4. Customize using module docs
5. Run tests to verify changes: `./scripts/run-tests.sh --coverage`

### For Contributors
1. Follow [CLAUDE.md](CLAUDE.md) guidelines
2. Update relevant module doc when changing code
3. Add tests for new features (maintain 85% coverage)
4. Add examples for new features
5. Keep troubleshooting sections current
6. Ensure CI passes before merging

---

**Documentation and testing now ship buyer-ready. One path. Example-first. High coverage. Production-ready. Easy for humans and LLMs.**
