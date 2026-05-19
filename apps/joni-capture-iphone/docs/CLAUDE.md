# CLAUDE.md - AI Development Guidelines

**For AI assistants (Claude, Cursor, ChatGPT, etc.) helping buyers build production apps on this boilerplate.**

> **Toolchain requirement.** This boilerplate is on **Swift 6 strict concurrency** with **Xcode 26.2+** and the **iOS 26 SDK** (Liquid Glass). `Packages/*/Package.swift` is pinned to `swift-tools-version: 6.2`; the Xcode project uses `SWIFT_VERSION = 6.0`. Runtime still supports iOS 17+ via a SwiftUI `Material` fallback built into `SAIGlass`. See `RELEASE_NOTES.md` for the full v2.0.0 scope.

## Context for AI Assistants

You're helping a developer build a **production iOS app** using this **pre-built boilerplate**. Your job is to:

✅ **Help extend the app** with new features
✅ **Maintain code quality** and existing patterns
✅ **Follow established architecture** (MVVM, protocols, DI)
✅ **Use existing abstractions** (don't reinvent the wheel)

❌ **Don't refactor the boilerplate itself** unless explicitly asked
❌ **Don't change core architecture** without strong reason
❌ **Don't introduce new patterns** when existing ones work

## Environment Detection

This project supports two development contexts. The agent should detect which context it is in and adapt accordingly.

**Detecting context:** Check for the `CLAUDE_CONFIG_DIR` environment variable. When the agent runs through Xcode's MCP bridge, this variable points to the Xcode-managed config directory. When running in a terminal via `claude`, it points to the CLI config.

### Xcode MCP Context

When running through Xcode MCP (e.g., via `xcrun mcpbridge`), use Xcode MCP tools directly:

- **Build:** `BuildProject` (uses the active scheme automatically)
- **Test:** `RunAllTests`
- **Preview:** `RenderPreview`
- **Errors:** `GetBuildErrors`
- **Scheme info:** `GetActiveScheme`

No need for `xcodebuild` CLI commands in this context. Xcode manages the scheme, destination, and build settings.

**Setup command:**
```bash
claude mcp add --transport stdio xcode -- xcrun mcpbridge
```

### CLI Context (Claude Code in Terminal)

When running in a terminal, use `xcodebuild` directly:

```bash
# Build
xcodebuild build \
  -project SwiftAIBoilerplatePro.xcodeproj \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -skipPackagePluginValidation

# Test
xcodebuild test \
  -project SwiftAIBoilerplatePro.xcodeproj \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -skipPackagePluginValidation

# Clean
xcodebuild clean \
  -project SwiftAIBoilerplatePro.xcodeproj \
  -scheme SwiftAIBoilerplatePro
```

The project file is `SwiftAIBoilerplatePro.xcodeproj` and the scheme is `SwiftAIBoilerplatePro`. Always specify `-project` and a simulator destination for iOS builds. If the named simulator is not available, use `xcrun simctl list devices available` to find one.

---

## Quick Reference for Common Tasks

**Before coding, check:**
1. **[docs/prompts/](prompts/)** - Ready-made prompts for common tasks
2. **[docs/recipes/](recipes/)** - Guides for white-labeling, theming, etc.
3. **[docs/modules/](modules/)** - Module-specific customization guides
4. **[docs/foundations/Architecture.md](foundations/Architecture.md)** - System design

## What This Boilerplate Provides

### Production-Ready Modules
- ✅ **Auth** - Apple + Google + Email (via Supabase), session persistence
- ✅ **AI** - Streaming LLM (500+ models via proxy)
- ✅ **Chat** - 2 professional UI styles, pagination, limits
- ✅ **Payments** - RevenueCat subscriptions, paywall UI
- ✅ **Storage** - SwiftData repositories, Keychain, optional cloud sync
- ✅ **Design System** - 5 themes, tokens, components
- ✅ **Networking** - HTTP client, interceptors, retry
- ✅ **Localization** - Type-safe L10n strings, pluralization, multi-language
- ✅ **FeatureRating** - Smart sentiment-based app rating prompts
- ✅ **Core** - Error handling, logging, utilities

### What Buyers Will Ask You To Do
- Customize branding (app name, colors, icons)
- Add new features (not core functionality)
- Modify UI (using existing design system)
- Integrate additional services
- White-label the app
- Add custom AI personas
- Extend data models

### When buyers ship to the App Store (Guideline 4.3)

Apple sometimes flags **4.3(a) — Spam** when an app’s **binary, metadata, or concept** looks too similar to other submissions (including other template-based apps). **Using this boilerplate is fine**; **shipping it unchanged** (or with only trivial config edits) is not.

When a buyer asks for help before submission or after a 4.3 rejection:

1. **Read** [docs/checklists/APP_STORE_4_3_HARDENING.md](checklists/APP_STORE_4_3_HARDENING.md) — branding map, `strings` audit, module removal, Review Notes template.
2. **Prompt packs:** [docs/prompts/AppStore4_3Hardening.prompts.md](prompts/AppStore4_3Hardening.prompts.md).
3. **Architectural gotcha:** `LLMClient` / `LLMMessage` currently live in **FeatureChat**; the **AI** package re-exports FeatureChat. Removing chat without moving those types **will break** `Packages/AI` until `Package.swift` and sources are refactored — call this out before deleting packages.
4. **Action:** Help remove **dead** Swift files from the app target, scrub template literals (`SwiftAI`, `Boilerplate`, `EchoLLM`, demo taglines), and align **App Store** copy with the buyer’s **primary** screen — not generic “AI assistant” positioning unless that is truly the product.

Do **not** tell buyers that “shared architecture alone” guarantees approval. Differentiation is **product + listing + binary**.

## Golden Rules

### Architecture

**MVVM pattern:**
```
View (SwiftUI) → ViewModel (@Observable) → Repository/Client → Data Source
```

- Views are stateless, render observable state via `@State var viewModel: MyViewModel` (where `MyViewModel` is `@Observable`)
- ViewModels orchestrate business logic; annotate them `@Observable` and usually `@MainActor`
- Repositories abstract data access (SwiftData, Keychain). Storage repositories are `@MainActor` — call them with `await` from non-main actors.
- Clients handle external communication (HTTP, LLM, Auth, Payments) and should be `Sendable`

**Single Responsibility:**
- Each type has one clear purpose
- **Keep every production and test Swift file ≤ 400 lines.** This is enforced for the whole workspace; split structurally into sibling files (`+Extension.swift`, subdirectories) before approaching the limit
- Extract helpers/subviews when needed

**No business logic in Views:**
- Views call ViewModel methods
- Views read observable state directly (no `$`-prefixed publishers)
- No inline URLSession, no inline database access

### Concurrency

**Use async/await and structured concurrency:**
```swift
@MainActor
func loadData() async throws {
    let data = try await repository.fetch()
    self.data = data
}
```

Do not use `DispatchQueue.main.async` / `asyncAfter` in new code. Use `Task { @MainActor in … }` and `try await Task.sleep(for: .seconds(1))` instead — the v2.0 migration removed every `DispatchQueue.main` call from production code.

**Cancellation-aware:**
```swift
func streamResponse() {
    task?.cancel()
    task = Task {
        for try await chunk in stream {
            guard !Task.isCancelled else { return }
            // process chunk
        }
    }
}
```

**@MainActor for UI:**
- `@Observable` ViewModels should be `@MainActor`
- Storage repositories (`MessageRepositoryImpl`, `ConversationRepositoryImpl`, `SettingsRepositoryImpl`) are `@MainActor` — creating or calling them from non-main code requires `await`
- Clients are `Sendable` where possible

**Swift 6 `any` keyword:**
Every stored property or parameter typed as an existential protocol must carry `any`. The v2.0 migration added this across the codebase; follow the pattern in new code.

```swift
// ✅ Swift 6
private let httpClient: any HTTPClient
init(httpClient: any HTTPClient) { … }
```

### Existing Abstractions

**Always use these instead of creating new ones:**

**Networking:**
```swift
// Use HTTPClient protocol
let response: User = try await httpClient.execute(request)

// Don't: URLSession.shared.data(from: url)
```

**Storage:**
```swift
// Use Repositories
let messages = try await messageRepository.fetchAll(conversationID: id)

// Don't: Direct SwiftData ModelContext access from Views
```

**AI:**
```swift
// Use LLMClient protocol
for try await chunk in llmClient.streamResponse(messages: messages) {
    // process chunk
}

// Don't: Direct API calls to OpenAI/Anthropic
```

**Pagination:**
```swift
// Use InfinitePaginator
let paginator = InfinitePaginator(pageSize: 20, source: source)

// Don't: Roll your own pagination logic
```

### Error Handling

**Map to AppError:**
```swift
do {
    return try await someOperation()
} catch {
    let appError = AppError.from(error)
    AppLogger.error("Operation failed: \(appError.userMessage)")
    throw appError
}
```

**Present to user:**
```swift
@Observable
@MainActor
final class MyViewModel {
    var errorMessage: String?

    func doSomething() async {
        do {
            try await operation()
        } catch let error as AppError {
            self.errorMessage = error.userMessage
        }
    }
}
```

### Logging

**Use AppLogger, never print:**
```swift
AppLogger.debug("User signed in", category: AppLogger.auth)
AppLogger.error("API failed: \(error)", category: AppLogger.networking)
AppLogger.info("Chat message sent", category: AppLogger.feature)
```

**Redact PII:**
```swift
AppLogger.debug("URL: \(AppLogger.redacted(urlString))")
// Output: "URL: https://api.com/users?api_key=■REDACTED■"
```

### Testing

**Write tests first for core logic:**
- Unit tests for ViewModels, Repositories, Clients
- Snapshot tests for Views (light/dark, accessibility)
- Integration tests for critical flows (auth, purchase, streaming)

**Coverage target:** 85-90% overall, 95%+ for Core/Networking/Storage

**Update snapshots on UI changes:**
```bash
# Record new snapshots
xcodebuild test -scheme SwiftAIBoilerplatePro RECORD_MODE=1
```

## Project Structure

```
SwiftAIBoilerplatePro/
├── SwiftAIBoilerplatePro/     # Main app target
│   ├── AppShell/               # UI screens (Views only, no logic)
│   │   ├── Profile/            # ProfileView.swift + 7 sibling subviews
│   │   ├── Auth/               # EmailSignUpView.swift + form/VM
│   │   └── …
│   ├── Composition/            # DI root (CompositionRoot + SessionManagerWrapper, +Factories, LLMClientFactory)
│   └── Resources/              # Assets, colors, legal
│
├── Packages/                   # 11 Swift Package modules
│   ├── Core/                   # Foundation (errors, logging, DeepLinkBus, ToastCenter — all @Observable)
│   ├── Networking/             # HTTP client + interceptors
│   ├── Storage/                # SwiftData + Keychain (repositories pinned to @MainActor)
│   ├── Auth/                   # Supabase + Apple Sign In (SessionManager + +SignIn/+Refresh/+Persistence)
│   ├── Payments/               # RevenueCat
│   ├── AI/                     # LLM client protocol (ProxyLLMClient split into Clients/Proxy/*)
│   ├── FeatureChat/            # Chat UI + ViewModel (+Memory extension)
│   ├── FeatureRating/          # App rating prompts (Liquid Glass pre-prompt card)
│   ├── FeatureSettings/        # Settings + paywall (sections under Views/Settings/)
│   ├── Localization/           # L10n root + L10n+<Namespace>.swift siblings
│   └── DesignSystem/           # UI tokens + components (incl. Materials/SAIGlass.swift)
│
├── supabase/                   # Backend
│   └── functions/ai/           # AI proxy (Edge Function)
│
├── Config/
│   ├── App.xcconfig
│   └── Secrets.xcconfig        # API keys (gitignored)
│
└── docs/                       # Documentation
    ├── INDEX.md                # Start here
    ├── architecture-overview.md
    ├── visual-consistency.md
    ├── <Module>.md             # One doc per module
    └── migrations/             # Setup guides
```

## Module Boundaries

**Dependency graph:**
```
App → Features → (Storage, Auth, Payments, AI) → Networking → Core
              └─> DesignSystem → Core
              └─> Localization → Core
```

**Rules:**
- Core has no dependencies
- Networking depends only on Core
- Features import what they need (Storage, Auth, etc.)
- No circular dependencies
- Use protocols for cross-module communication

**Example:**
```swift
// Good: FeatureChat imports what it needs
import Core
import Storage
import AI
import DesignSystem

// Bad: Don't import unrelated features
import FeatureSettings  // ❌ Features don't depend on each other
```

## Integration Details

### Supabase
- **Auth:** `SessionManager` wraps Supabase GoTrue for Apple Sign In, Google Sign In, and email/password. Tokens are stored in Keychain via `KeychainStore`. Session refresh happens proactively (60s before expiry).
- **Edge Functions:** The AI proxy runs as a Supabase Edge Function (`supabase/functions/ai/`). The app calls this function; it forwards requests to OpenRouter. The OpenRouter API key never leaves the server.
- **Config:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `Config/Secrets.xcconfig`, injected via `Configuration.swift`.

### RevenueCat
- **Protocol:** `PaymentsClient` (in Payments module) abstracts RevenueCat. `SubscriptionManager` is the concrete implementation.
- **State:** `PaymentsState` (a simple struct with `isSubscribed: Bool`) is published via `AsyncStream`. ViewModels observe this stream.
- **Config:** `REVENUECAT_API_KEY` and `RC_ENTITLEMENT_ID` in `Config/Secrets.xcconfig`.
- **Restore:** `restore()` is user-initiated only (App Store Guideline 3.1.1).

### OpenRouter
- **Protocol:** `LLMClient` (in AI module) defines `streamResponse(messages:) -> AsyncThrowingStream<String, Error>`.
- **Proxy pattern:** `ProxyLLMClient` sends requests to the Supabase Edge Function, which forwards to OpenRouter. The app never calls OpenRouter directly.
- **Fallback:** `EchoLLMClient` echoes messages back for development without API keys.
- **Config:** `PROXY_BASE_URL` and `PROXY_PATH` in `Config/Secrets.xcconfig`. When empty, the app uses `EchoLLMClient` automatically.

## How to Navigate Code

### Finding Where Something Lives

**Use docs/INDEX.md first:**
- Links to all module docs
- Each module doc explains what it owns
- Examples show usage patterns

**Module ownership:**
- **Core**: AppError, AppLogger, theme types
- **Networking**: HTTPClient, interceptors, caching
- **Storage**: SwiftData models, Keychain, repositories
- **Auth**: Sign in/out, session management
- **Payments**: Purchase/restore, subscription state
- **AI**: LLM client protocol, streaming
- **FeatureChat**: Chat UI, ChatViewModel, pagination
- **FeatureSettings**: Settings UI, paywall
- **DesignSystem**: Colors, typography, components
- **Localization**: L10n strings, pluralization, stringsdict
- **FeatureRating**: Rating engine, sentiment scoring, pre-prompt popup
- **Composition**: CompositionRoot (DI)

### Finding Examples

**Every module doc has examples:**
1. Read `docs/<Module>.md`
2. Look for "Example" or "Usage" sections
3. Check `Packages/<Module>/README.md` for more
4. Look at Preview code in Views

**Common patterns:**
- ViewModel usage: Check existing ViewModels in AppShell/
- Repository usage: Check FeatureChat/ChatViewModel
- Client usage: Check CompositionRoot initialization
- UI components: Check DesignSystem previews

### Understanding Data Flow

**Read architecture-overview.md first:**
- Shows complete flow diagrams
- Example: "Send Chat Message" flow
- Example: "Authentication" flow
- Example: "Purchase Subscription" flow

**Then trace through code:**
1. Start at View (user action)
2. Follow to ViewModel method
3. See Repository/Client call
4. Check data source (SwiftData, HTTP, etc.)

## Making Changes

### Propose Safe Changes

**Before editing:**
1. Find similar existing code
2. Follow the same pattern
3. Use existing abstractions
4. Don't introduce new patterns without reason

**Example - Adding a new screen:**
```swift
// 1. Create View + ViewModel (follow existing pattern)
struct MyFeatureView: View {
    @State var viewModel: MyFeatureViewModel
    // Follow ChatView pattern
}

@Observable
@MainActor
final class MyFeatureViewModel {
    var state: State = .idle
    // Follow ChatViewModel pattern (all ViewModels are @Observable in v2.0)
}

// 2. Add factory to CompositionRoot
extension CompositionRoot {
    func makeMyFeatureViewModel() -> MyFeatureViewModel {
        MyFeatureViewModel(
            repository: someRepository  // Inject dependencies
        )
    }
}

// 3. Add navigation
NavigationLink("My Feature") {
    MyFeatureView(
        viewModel: composition.makeMyFeatureViewModel()
    )
}
```

### What NOT to Do

**Never:**
- Business logic in Views
- Force unwraps (`!`) in production code
- Global singletons in domain logic
- Blocking main thread
- Inline URLSession calls from UI (use the Networking module's `HTTPClient`)
- Direct SwiftData access from Views (use Repository protocols in Storage)
- Committing secrets (check .gitignore)
- Using `print()` instead of AppLogger
- **UIKit views or controllers.** This is a SwiftUI-only codebase. No `UIViewController`, `UIView`, or `UITableView`. The only UIKit usage is `UIApplication` for system URLs and `UIWindowScene` for StoreKit review requests.
- **`ObservableObject` in new code.** Use the `@Observable` macro instead. Every ViewModel and every cross-cutting bus (`ChatViewModel`, `SettingsViewModel`, `PaywallViewModel`, `DeepLinkBus`, `ToastCenter`) is `@Observable` after the v2.0 migration. Do not add new `ObservableObject` types.
- **`@Published`, `@ObservedObject`, `@StateObject`.** These property wrappers are dead in this codebase. Use `@State` with `@Observable` types and let SwiftUI do the tracking.
- **`DispatchQueue.main.async` / `asyncAfter`.** The v2.0 migration replaced every call site with structured concurrency. Use `Task { @MainActor in … }` and `try await Task.sleep(for:)`.
- **Raw `URLSession` calls.** Always use the `HTTPClient` protocol from the Networking module. It handles auth headers, retry, caching, and error mapping automatically.

**Avoid:**
- Creating new patterns when existing ones work
- Large files (> 400 lines — the workspace-wide rule). Before you approach the limit, split into sibling files or extensions
- Complex nested logic (extract helpers)
- Ignoring cancellation
- Swallowing errors silently
- `@StateObject` or `@ObservedObject` (use `@State` with `@Observable` types instead)

### When Adding Features

**Follow this flow:**

1. **Identify module:**
   - New UI screen → AppShell/
   - New business logic → Appropriate Package/
   - New domain concept → Consider new Package

2. **Check abstractions:**
   - Need networking? Use HTTPClient
   - Need storage? Use Repository
   - Need external service? Create protocol + implementation

3. **Write interface first:**
   ```swift
   // Protocol defines what, not how
   protocol MyServiceClient {
       func doSomething() async throws -> Result
   }
   ```

4. **Implement:**
   ```swift
   final class MyServiceClientImpl: MyServiceClient {
       func doSomething() async throws -> Result {
           // Implementation
       }
   }
   ```

5. **Wire in CompositionRoot:**
   ```swift
   final class CompositionRoot {
       let myServiceClient: any MyServiceClient

       init(...) {
           self.myServiceClient = MyServiceClientImpl(...)
       }
   }
   ```
   Remember the Swift 6 `any` keyword on every protocol-typed stored property. `CompositionRoot.swift` is now a composition root split across `SessionManagerWrapper.swift`, `CompositionRoot+Factories.swift`, and `LLMClientFactory.swift` — add factories to the extension file, not the root.

6. **Add tests:**
   ```swift
   func testMyService_doSomething_returnsExpectedResult() async throws {
       let client = MyServiceClientImpl()
       let result = try await client.doSomething()
       XCTAssertEqual(result, expectedValue)
   }
   ```

7. **Update docs:**
   - Add to relevant module doc under `docs/modules/`
   - Update `docs/foundations/Architecture.md` if introducing a new concept
   - Add example usage

### When Changing UI

**Run the test suite on an iOS 26.2 simulator:**
```bash
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2'
```

CI also runs a dedicated `test-ios18-fallback` job on iPhone 16 Pro / iOS 18.6 to validate the SwiftUI `Material` fallback path inside `SAIGlass`. If you touch anything that reads `Glass` directly, run that destination locally too.

**Check Liquid Glass + accessibility:**
- Host chat input bars via `.safeAreaInset(edge: .bottom)`, not inside a VStack
- Loading overlays use `.saiGlass(.regular, in: .rect(cornerRadius: ...))`, not `.background(.regularMaterial)`
- Do not paint `DSColors.background` over a Liquid Glass surface
- Dynamic Type support
- VoiceOver labels
- High contrast compatibility
- Reduced motion respect

**Use DesignSystem tokens:**
```swift
// Good: Use tokens
.foregroundStyle(DSColors.textPrimary)
.padding(DSSpacing.l)

// Bad: Hardcode values
.foregroundStyle(Color.black)
.padding(16)
```

**Liquid Glass (iOS 26) via `SAIGlass`:**
`Packages/DesignSystem/Sources/DesignSystem/Materials/SAIGlass.swift` is the one hop for Liquid Glass. It picks up the iOS 26 `Glass` / `glassEffect` / `GlassEffectContainer` APIs when available and falls back to SwiftUI `Material` on iOS 17–25. Use these wrappers — do not touch `Glass` or `.glassEffect` directly:

```swift
// Single glass surface
content.saiGlass(.regular, in: .rect(cornerRadius: 16))

// Merged compositing (iOS 26) for multiple glass siblings
SAIGlassContainer { ChipA(); ChipB(); ChipC() }

// Scroll-edge accent on iOS 26, no-op below
ScrollView { … }.saiScrollEdgeGlass(.bottom)

// Sidebar-adaptable tabs + minimize-on-scroll
TabView { … }
    .saiSidebarAdaptable()
    .saiTabBarMinimize(.onScrollDown)
```

**Never "fight glass."** Do not add `DSColors.background.ignoresSafeArea()`, `.background(DSColors.background)`, or `.scrollContentBackground(.hidden)` to cover up the system material — the v2.0 pass removed every one of these. Host chat input bars via `.safeAreaInset(edge: .bottom) { SAIInputBar(…) }` so the system tab bar / scroll edge can read the surface underneath. Loading overlays should use `.saiGlass(.regular, in:)`, not `.background(.regularMaterial)`. Buttons that should adopt Liquid Glass automatically want `.buttonStyle(.borderedProminent)` / `.bordered` + `.controlSize(.large)` — avoid hand-rolled `RoundedRectangle` backgrounds.

## Common Tasks

### Add a New API Endpoint

```swift
// 1. Define request in Networking module
struct FetchUserRequest: HTTPRequest {
    typealias Response = User
    
    var path: String { "/users/\(userID)" }
    var method: HTTPMethod { .get }
    
    let userID: String
}

// 2. Use in Repository
func fetchUser(id: String) async throws -> User {
    let request = FetchUserRequest(userID: id)
    return try await httpClient.execute(request)
}

// 3. Call from ViewModel
func loadUser() async {
    do {
        self.user = try await repository.fetchUser(id: currentUserID)
    } catch let error as AppError {
        self.errorMessage = error.userMessage
    }
}
```

### Add a New SwiftData Model

```swift
// 1. Define model in Storage module
@Model
public final class MyModel {
    @Attribute(.unique) public var id: UUID
    public var name: String
    public var createdAt: Date
    
    public init(id: UUID, name: String, createdAt: Date) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
    }
}

// 2. Add to schema in CompositionRoot
let schema = Schema([
    Conversation.self,
    Message.self,
    Settings.self,
    MyModel.self  // Add here
])

// 3. Create repository
protocol MyModelRepository: Sendable {
    func fetchAll() async throws -> [MyModel]
    func save(_ model: MyModel) async throws
}

@MainActor
final class MyModelRepositoryImpl: MyModelRepository {
    private let modelContext: ModelContext

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func fetchAll() async throws -> [MyModel] {
        let descriptor = FetchDescriptor<MyModel>()
        return try modelContext.fetch(descriptor)
    }

    func save(_ model: MyModel) async throws {
        modelContext.insert(model)
        try modelContext.save()
    }
}

// 4. Add to CompositionRoot (use the `any` keyword on the stored property)
@MainActor
final class CompositionRoot {
    let myModelRepository: any MyModelRepository

    init(...) {
        self.myModelRepository = MyModelRepositoryImpl(
            modelContext: modelContainer.mainContext
        )
    }
}
```

Storage repositories in this codebase are `@MainActor`-pinned (see the v2.0 P0 data race fix). Any call site that is not already on the main actor has to `await` into the repository.

### Add a New Theme

```swift
// 1. Add color set in DesignSystemColors.xcassets/
// Create folder: MyTheme.colorset with Light/Dark appearances

// 2. Add case to UserThemePreference
public enum UserThemePreference: String, Codable, CaseIterable {
    case system
    case light
    case dark
    case aurora
    case obsidian
    case myTheme  // Add this
    
    public var displayName: String {
        switch self {
        // ... existing cases ...
        case .myTheme: return "My Theme"
        }
    }
}

// 3. Update DSColors to use your theme
// (Check DesignSystem.md for details)
```

### Swap a Provider

```swift
// Example: Replace Supabase with Firebase

// 1. Implement AuthClient protocol
final class FirebaseAuthClient: AuthClient, Sendable {
    func signInWithApple() async throws -> AuthUser {
        // Firebase implementation
    }
    
    func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        // Firebase implementation
    }
    
    // ... implement all protocol methods
}

// 2. Update CompositionRoot
init(...) {
    // Old:
    // self.sessionManager = SupabaseAuthClient(...)
    
    // New:
    self.sessionManager = FirebaseAuthClient(...)
    
    // All ViewModels and Views work unchanged
}
```

## Debugging Tips

### Enable Verbose Logging

```swift
// Logs use OSLog categories
AppLogger.debug("Detailed info", category: AppLogger.networking)
AppLogger.info("Normal operation", category: AppLogger.feature)
AppLogger.error("Something failed", category: AppLogger.auth)
```

**View logs in Console.app:**
- Filter by subsystem: `com.yourapp.SwiftAIBoilerplatePro`
- Filter by category: `networking`, `auth`, `feature`, etc.

### Test Auth Bypass

```swift
// In Xcode scheme:
// Run → Arguments → Environment Variables
AUTH_BYPASS = 1

// Uses MockAuthClient instead of real Supabase
```

### Test Echo LLM

```swift
// Don't set PROXY_BASE_URL in Config/Secrets.xcconfig
// App will use EchoLLMClient that echoes messages back
```

### View Network Requests

```swift
// HTTPClient logs all requests/responses
// Check Console.app for:
// - Request URL, method, headers
// - Response status, body (redacted)
// - Retry attempts
```

## Code Style

### Naming

**Clear and explicit:**
```swift
// Good
func fetchConversationMessages(conversationID: UUID) async throws -> [Message]

// Bad
func getConvMsgs(_ id: UUID) async throws -> [Message]
```

**No abbreviations in public API:**
```swift
// Good
public protocol AuthenticationClient

// Bad
public protocol AuthClient  // OK for internal use
```

### Comments

**Explain intent and tradeoffs:**
```swift
// Good
// Use cursor-based pagination because message IDs are not sequential
// and we need consistent ordering across updates
let paginator = InfinitePaginator(pageSize: 20, source: source)

// Bad
// Create paginator
let paginator = InfinitePaginator(pageSize: 20, source: source)
```

**Doc comments for public APIs:**
```swift
/// Streams AI response chunks as they arrive from the LLM provider.
///
/// - Parameter messages: Conversation history including the new user message
/// - Returns: AsyncThrowingStream yielding text chunks
/// - Throws: AppError.network if the request fails
public func streamResponse(messages: [LLMMessage]) 
    -> AsyncThrowingStream<String, Error>
```

### File Organization

**Naming patterns by role:**
- ViewModels: `*ViewModel.swift` (e.g., `ChatViewModel.swift`, `SettingsViewModel.swift`)
- Views: Named after the screen (e.g., `ChatView.swift`, `PaywallView.swift`)
- Protocols: Named after the capability (e.g., `LLMClient.swift`, `AuthClient.swift`)
- Implementations: Protocol name + suffix (e.g., `ProxyLLMClient`, `SessionManager`)
- DTOs: `*DTO.swift` (e.g., `ConversationDTO.swift`, `MessageDTO.swift`)
- Repositories: `*Repository.swift` protocol, `*RepositoryImpl` implementation
- Error extensions: `AppError+ModuleName.swift` (e.g., `AppError+Chat.swift`)

**Folder structure within feature packages:**
```
Sources/FeatureX/
  Views/           # SwiftUI views
  ViewModels/      # @Observable ViewModels
  Models/          # DTOs, enums, value types
  Integration/     # Mappers, error extensions
```

**Folder structure within infrastructure packages:**
```
Sources/ModuleName/
  (flat or grouped by concern)
```

Utility packages (Core, Networking, DesignSystem) use a flat or concern-grouped layout rather than the View/ViewModel split.

### Formatting

**Use SwiftFormat/SwiftLint rules:**
- 4-space indentation
- Max line length: 120 characters
- Blank line between functions
- Group by // MARK: comments

## Skills Integration

This boilerplate is designed to work with Claude Code skills for the best AI-assisted development experience.

See **[SKILLS.md](../SKILLS.md)** for recommended skills and installation instructions.

**How CLAUDE.md and Skills work together:**
- **CLAUDE.md** (this file): Boilerplate-specific rules — architecture, abstractions, module boundaries, code patterns
- **Skills** (`.agents/skills/`): General iOS/SwiftUI best practices — debugging, testing, App Store guidelines, performance profiling

CLAUDE.md ensures Claude follows *your* architecture. Skills ensure Claude follows *iOS best practices*. Together they enable near-zero-shot project creation.

**Pre-installed skills:**
- Axiom — SwiftUI debugging, concurrency, iOS 26 features
- Apple Skills Collection — App Store, testing, generators, product lifecycle
- iOS Simulator — Build, test, and analyze without leaving the terminal
- SwiftUI Best Practices — State management, view architecture, accessibility

## Resources

**Documentation:**
- [docs/INDEX.md](INDEX.md) - Central hub
- [docs/foundations/Architecture.md](foundations/Architecture.md) - System design
- [docs/modules/](modules/) - Module documentation
- [docs/buyers/POST_PURCHASE.md](buyers/POST_PURCHASE.md) - Buyer welcome + App Store 4.3 link + email template
- [AGENTS.md](../AGENTS.md) - Repo root agent entry (Cursor, etc.)
- [RELEASE_NOTES.md](../RELEASE_NOTES.md) - v2.0.0 release notes (Swift 6, Liquid Glass)

**External:**
- [Swift.org](https://swift.org) - Swift language guide
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)

## For AI Assistants: Response Guidelines

### When Asked to Add a Feature

1. **Check if it exists:** Search docs/ and existing code first
2. **Find similar pattern:** Look for analogous features
3. **Propose architecture:** Show how it fits into existing structure
4. **Use existing abstractions:** Don't reinvent HTTPClient, Repository, etc.
5. **Write tests:** Include unit tests for new logic
6. **Update docs:** Note what documentation to update

### When Asked to Customize UI

1. **Use DSColors tokens:** Never hardcode colors
2. **Use DSSpacing:** Never hardcode padding/margins
3. **Check existing components:** Reuse SAIButton, SAICard, etc.
4. **Maintain accessibility:** Dynamic Type, VoiceOver
5. **Reference [docs/recipes/Theming.md](recipes/Theming.md)** for color changes

### When Asked to Integrate a Service

1. **Create protocol first:** Define clean interface
2. **Implement:** Keep external dependencies isolated
3. **Wire in CompositionRoot:** Add to dependency injection
4. **Add to .gitignore:** If it has secrets
5. **Document:** Add to [docs/integrations/](integrations/)

### When Unsure

**Ask the developer:**
- "Should this be a new module or extend existing one?"
- "Do you want this behind a feature flag?"
- "Should I add tests for this?"
- "Do you want docs updated?"

**Check these first:**
- [docs/prompts/README.md](prompts/README.md) - Maybe there's a ready prompt
- [docs/recipes/](recipes/) - Maybe there's a recipe for this
- [Packages/*/README.md](../Packages/) - API reference

## Common Pitfalls to Avoid

### Don't Break Existing Patterns

❌ **Bad:** Create new global singleton
```swift
class MyService {
    static let shared = MyService()  // DON'T
}
```

✅ **Good:** Use dependency injection
```swift
protocol MyServiceClient { ... }
// Add to CompositionRoot, inject into ViewModels
```

### Don't Bypass Abstractions

❌ **Bad:** Direct API calls from View
```swift
struct MyView: View {
    func loadData() {
        URLSession.shared.data(from: url)  // DON'T
    }
}
```

✅ **Good:** Use HTTPClient via ViewModel
```swift
class MyViewModel {
    func loadData() async {
        try await httpClient.execute(request)
    }
}
```

### Don't Ignore Testing

❌ **Bad:** Add feature without tests
```swift
// New feature with no tests
```

✅ **Good:** Add tests for new logic
```swift
func testMyFeature_whenCondition_expectedResult() {
    // Arrange, Act, Assert
}
```

## Quick Wins for Buyers

These are safe, common customizations AI can help with:

### Branding (5 minutes)
- Change app name in `Config/App.xcconfig` and `BrandConfig.swift`
- Update colors in `DesignSystemColors.xcassets`
- Replace app icon images

### Onboarding (10 minutes)
- Edit `OnboardingPage.swift` defaultPages array
- Change titles, descriptions, icons

### Chat Colors (5 minutes)
- Edit `BubbleUser.colorset` and `BubbleAssistant.colorset`
- All chat screens update automatically

### Add AI Persona (15 minutes)
- Modify LLM system prompt in ChatViewModel
- Make it configurable per conversation

## Resources for AI Assistants

**Architecture & Patterns:**
- [docs/foundations/Architecture.md](foundations/Architecture.md) - MVVM, DI, data flow
- [docs/BUILDING_YOUR_APP.md](BUILDING_YOUR_APP.md) - Step-by-step guide

**Ready-to-Use Prompts:**
- [docs/prompts/](prompts/) - 30+ tested prompts for common tasks

**Module Details:**
- [docs/modules/](modules/) - 11 comprehensive guides

**Skills:**
- [SKILLS.md](../SKILLS.md) - Recommended Claude Code skills for iOS development

**Package APIs:**
- `Packages/*/README.md` - Technical reference for each package

---

**Remember:** This boilerplate is production-ready. Your job is to help the developer extend it, not refactor it. Follow existing patterns, use existing abstractions, write tests, and maintain the quality bar.
