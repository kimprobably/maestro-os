# Release Notes — v2.0.0 (Swift 6 & iOS 26 Liquid Glass)

Shipped **2026-04-12**.

> **Toolchain requirement — read first.** v2.0.0 requires **Xcode 26.2 or newer**. Liquid Glass APIs (`Glass`, `glassEffect`, `GlassEffectContainer`) are iOS 26 SDK symbols and cannot be compiled by older toolchains, regardless of `#available` checks. Runtime still supports iOS 17+ via a SwiftUI `Material` fallback built into `SAIGlass`. If you cannot upgrade Xcode yet, stay on the `v1.9.0` tag.

---

## Headline changes

1. **Swift 6 strict concurrency, everywhere.** All 11 SPM packages now build under Swift 6. One P0 data race fixed, several `@unchecked Sendable` and `nonisolated(unsafe)` hacks removed.
2. **First-class iOS 26 Liquid Glass adoption.** New `SAIGlass` design-system primitive with an automatic `Material` fallback; Chat input bars, toolbars, toasts, rating prompt, loading overlays, paywall CTAs, and Settings form all pick up the new material.
3. **Every production and test Swift file now ≤ 400 lines.** Nine files were over the workspace rule; all split structurally with no behavior changes.
4. **CI honest again.** Workflows bumped to `macos-15` + Xcode 26.2 + iPhone 17 Pro iOS 26.2, plus a new `test-ios18-fallback` job that validates the Material fallback path on iPhone 16 Pro iOS 18.6.
5. **Security hardening (SAST pass).** Paywall enforcement wired in, SQL IDOR fixed on the stats RPC, edge function validation + allowlists + sanitized errors, pre-commit secrets hook.

---

## Swift 6 strict concurrency

- **`swift-tools-version` 6.2** across all 11 packages. Xcode project `SWIFT_VERSION` 5.0 → 6.0.
- **P0 data race fixed** — Storage repositories (`MessageRepositoryImpl`, `ConversationRepositoryImpl`, `SettingsRepositoryImpl`) pinned to `@MainActor`, eliminating `nonisolated(unsafe)` access to `ModelContext` across isolation boundaries.
- **Existential types** — `any` keyword added to every protocol-typed property and parameter across 20+ files (repositories, clients, view models, composition root).
- **`ObservableObject` → `@Observable`** — `DeepLinkBus` and `ToastCenter` migrated; consumers updated from `@ObservedObject`/`.onReceive($published)` to direct property access + `.onChange(of:)`.
- **Structured concurrency** — every `DispatchQueue.main.async` / `asyncAfter` replaced with `Task` / `Task.sleep(for:)` in `AppDelegate`, `SignInView`, `ChatView`, `ChatGPTStyleView`.
- **`UIScreen.main.scale` → `@Environment(\.displayScale)`** in `ChatRowCard`.
- **`ProxyLLMClient`** — dropped `@unchecked Sendable` (all properties are immutable `let`).
- **`ReplyActionBus`** — `@MainActor` isolation for thread-safe singleton access.
- **`MemoryRetrievalConfig`** — explicit `Sendable` conformance.

### Force-unwrap fix

- `SessionManager.saveSession()` force-unwrapped UTF-8 encoding → now `guard let` with typed `AuthError.unknown`.
- `URLSessionHTTPClient.applySyntheticTTL` force-unwrapped `urlRequest.url!` → now folded into the existing `guard` that short-circuits the cache write.

### Migration notes retained for next release

- `NSLock` kept in `KeychainStore` / `RevenueCatClient` (`Mutex` requires iOS 18+, we still target iOS 17).
- `@unchecked Sendable` on `KeychainStore`, `RevenueCatClient`, `ImageCache`, `URLSessionHTTPClient` is justified — each owns internal synchronization.
- `nonisolated(unsafe)` on `Task` handles in view models is required for `deinit` cancellation.

---

## iOS 26 Liquid Glass adoption

### New: DesignSystem `SAIGlass`

`Packages/DesignSystem/Sources/DesignSystem/Materials/SAIGlass.swift`:

- `SAIGlassStyle` enum (`.regular`, `.clear`) maps to iOS 26 `Glass` and falls back to SwiftUI `Material` on iOS 17–25.
- `.saiGlass(_:in:interactive:)` view modifier — single call site adopts Liquid Glass on iOS 26 and stays visually consistent below.
- `SAIGlassContainer` — wraps multiple glass surfaces so iOS 26 can merge compositing via `GlassEffectContainer`; transparent passthrough on older OSes.
- `.saiScrollEdgeGlass(_:)` — opt-in `scrollEdgeEffectStyle(.hard, for:)` on iOS 26, no-op below.
- `.saiSidebarAdaptable()` + `.saiTabBarMinimize(_:)` — availability-gated wrappers for `tabViewStyle(.sidebarAdaptable)` and `tabBarMinimizeBehavior(_:)`.

### Where glass lands

- **App tab bar** (`MainTabView`) → `.sidebarAdaptable` on iPad/Mac, `.onScrollDown` tab-bar minimize.
- **Chat input bars** (`SAIInputBar`, `ChatView`, `ChatGPTStyleView`) → floating interactive glass via `.safeAreaInset(edge: .bottom)` instead of the old opaque `DSColors.background` strip. `.saiScrollEdgeGlass(.bottom)` keeps content legible where messages meet the glass.
- **Toolbar actions** — `ChatHistoryView` "New Chat" button replaced a custom `Circle + strokeBorder` composition with a standard `Label` + `Button`, which picks up Liquid Glass automatically.
- **`SAIToast`** — background migrated from `DSColors.surfaceElevated` to `saiGlass(.regular)`.
- **`RatingPromptView`** — pre-prompt card background migrated to `saiGlass(.regular)`.
- **Loading overlays** — `SettingsView` and `PaywallView` loading overlays use `saiGlass(.regular)` instead of hard-coded `.regularMaterial`.
- **`PaywallView` CTAs** — `Subscribe`, `Restore Purchases`, `Continue`, `Manage Subscription` buttons switched from hand-rolled `.background(DSColors.primary) + RoundedRectangle` to `.buttonStyle(.borderedProminent)` / `.buttonStyle(.bordered)` + `.controlSize(.large)`, so the system adopts Liquid Glass automatically on iOS 26.
- **`SettingsView` Form** — `.formStyle(.grouped)` so row heights, padding, and section corner radius match iOS 26 defaults.

### Fighting-glass cleanup

Every override that was painting an opaque layer over the material SwiftUI already provides was removed:

- `DSColors.background.ignoresSafeArea()` / `.background(DSColors.background)` dropped from `SettingsView`, `HomeView`, `ProfileView`, `ProfileView.editProfileSheet`, and `ChatHistoryView`.
- `.scrollContentBackground(.hidden)` removed from `SettingsView` (now handled by `.formStyle(.grouped)`).
- Explicit `.safeAreaInset(edge: .bottom) { Color.clear.frame(height: 88) }` gutters dropped from `HomeView` and `ProfileView` — the system tab bar already provides the correct safe-area insets under Liquid Glass.
- `SAIInputBar` and `ChatGPTStyleView` prompt input: dropped `.background(DSColors.surface)` + `clipShape` stacks; the outer `saiGlass` wrapper owns the surface now.

---

## 400-line architecture rule enforcement

Every production Swift file in `Packages/` and `SwiftAIBoilerplatePro/` now stays ≤ 400 lines. Nine files exceeded the workspace rule; all split structurally with no behavioral refactors:

| File | Before → After | Split into |
|---|---|---|
| `ProfileView.swift` | 729 → 134 | `AppShell/Profile/` (7 subviews) |
| `SettingsView.swift` | 579 → 122 | `Views/Settings/` (13 files) |
| `EmailSignUpView.swift` | 496 → 171 | `AppShell/Auth/` (form + VM) |
| `CompositionRoot.swift` | 491 → 247 | `SessionManagerWrapper`, `+Factories`, `LLMClientFactory` |
| `SessionManager.swift` | 512 → 105 | `+SignIn`, `+Refresh`, `+Persistence` extensions |
| `ChatViewModel.swift` | 419 → 330 | `+Memory` extension + narrating-comment cleanup |
| `ProxyLLMClient.swift` | 459 → 88 | `Proxy/ProxyLLMRequestBuilder`, `Proxy/ProxyLLMStreamParser` + doc-comment trim |
| `L10n.swift` | 563 → 44 | `L10n+Auth/Chat/Settings/Theme/Payments/Onboarding/Profile/Common/Error/A11y.swift` |
| `ProxyLLMClientTests.swift` | 605 → 36 | `Proxy/Init/Request/Stream/Error` test files + shared `TestFixtures` |

Four additional files the original audit missed:

| File | Before → After | Change |
|---|---|---|
| `SupabaseAuthAPI.swift` | 442 → 264 | `+Mapping` extension + `runAuthExchange`/`runAuthSideEffect` helpers that deduplicate the try/catch pattern across 8 endpoints |
| `SettingsViewModelTests.swift` | 530 → 163 | Fakes → `Fixtures/SettingsViewModelTestFixtures.swift`, observation tests → sibling file |
| `SessionManagerTests.swift` | 443 → 390 | Mocks → `Fakes/SessionManagerTestMocks.swift` |
| `RatingEngineTests.swift` | 432 → 141 | `Fixtures/RatingEngineTestCase.swift` base class + prompt-decision tests → sibling file |

Public APIs are unchanged. Some `private` members were relaxed to `internal` so sibling-file extensions could see them — none escape the module boundary.

---

## Infrastructure

- **CI runners** — `macos-14` → `macos-15` (first runner shipping Xcode 26.x).
- **Xcode pin** — all three workflows (`ci.yml`, `ios-ci.yml`, `coverage-report.yml`) select `Xcode_26.2`.
- **Simulator destination** — `iPhone 15 / OS=17.5` → `iPhone 17 Pro / OS=26.2`.
- **New job: `test-ios18-fallback`** — builds + tests on `iPhone 16 Pro / OS=18.6` to catch regressions in the SwiftUI `Material` fallback path. No coverage gate; this job exists as a safety net.
- **Dropped `package-tests` matrix** — its `cd Packages/X && swift test` invocations targeted the host macOS and could not compile iOS-only SwiftUI. Package code is still exercised by the app test suite (115 tests).
- **Action versions** — `actions/cache@v3` → `@v4`, `actions/upload-artifact@v3` → `@v4` (v3 was deprecated in 2024).
- **`.xcode-version`** — new file pinning local dev Xcode to `26.3` (consumable by `xcodes` / `asdf-xcode`).
- **README** — new `Xcode-26.2+` badge, Swift badge bumped to `6.0`, Prerequisites updated, "Using older Xcode?" paragraph pointing at `v1.9.0`, optional `brew install swiftlint` hint matching the CI lint job.

---

## Security & backend (SAST pass)

- **Paywall / free tier** — `PaymentsStatusAdapter` is wired into `ChatViewModel` so the per-conversation free message limit is actually enforced (previously unused dead code).
- **SQL IDOR** — Migration `20260408000000_fix_conversation_stats_auth.sql`: `get_conversation_with_stats` now requires `c.user_id = auth.uid()` so callers cannot read other users' conversations.
- **Edge function (`supabase/functions/ai/index.ts`)** — Authenticated users only; model allowlist (`openai/gpt-3.5-turbo`, `openai/gpt-4o-mini`); message count and per-message length bounds; only `user`/`assistant` roles accepted from clients; server-controlled system prompt prepended; temperature clamped to 0.0–2.0; OpenRouter failures return generic client messages while details are logged server-side; top-level errors do not leak internal exception text.
- **Swift client** — Memory context for the LLM is injected as a separate delimited message (not appended to the user's text); chat deep links require a valid `conversationId` UUID; `SupabaseMessageRepository.page()` filters by `user_id` for defense-in-depth.
- **Secrets workflow** — `.githooks/pre-commit` blocks commits of non-placeholder values in `Generated/Configuration.swift`; `scripts/update-config.sh` warns not to commit after injecting real keys (install hook with `git config core.hooksPath .githooks`).

Full SAST findings are in `sast/final-report.md`.

---

## Upgrading from v1.9.x

1. **Install Xcode 26.2+** (first toolchain shipping the iOS 26 SDK). `.xcode-version` is pinned to `26.3` for `xcodes`/`asdf-xcode` users.
2. Pull the `v2.0.0` tag and let SPM re-resolve.
3. Apply the Supabase migration: `supabase migration up` (or `psql` the `20260408000000_fix_conversation_stats_auth.sql` file).
4. Redeploy the `ai` edge function: `supabase functions deploy ai`.
5. Install the secrets pre-commit hook: `git config core.hooksPath .githooks`.
6. Your downstream customisations of `ProfileView`, `SettingsView`, etc. will need to be reapplied to the new split subviews. The public APIs are unchanged; the sections are just in sibling files now.
7. If you see `DSColors.background.ignoresSafeArea()` in your own views, remove it — SwiftUI's default background is the one SAIGlass needs to reflect through.
8. If you hard-coded `.background(.regularMaterial)` on loading overlays, switch to `.saiGlass(.regular, in:)` for consistent Liquid Glass behaviour on iOS 26.

## Not upgrading? Stay on v1.9.0

The `v1.9.0` tag is the supported line for teams that cannot move off Xcode 15/16 yet. We'll accept critical security patches on a `release/1.9` branch but will not backport new features.

---

## Breaking changes

None for direct consumers. Public APIs are preserved. Structural changes:

- Several files moved into subdirectories (`AppShell/Profile/`, `AppShell/Auth/`, `Views/Settings/`, `Proxy/`, etc.). If you have raw-file git merges against v1.9.x that touch these paths, you'll see conflicts — the types and symbols are unchanged.
- `SAIInputBar` no longer draws its own opaque background; if you host it outside of `.safeAreaInset(...)` you may need to add a parent wrapper.

---

## Verification

- ✅ **115 tests, 0 failures** on iPhone 17 Pro / iOS 26.2 (`xcodebuild test`)
- ✅ **BUILD SUCCEEDED** on iPhone 16 Pro / iOS 18.6 (Material fallback path)
- ✅ **No Swift file over 400 lines** in `Packages/` or `SwiftAIBoilerplatePro/`
