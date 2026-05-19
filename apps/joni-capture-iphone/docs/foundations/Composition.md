# Composition Module

Dependency injection and application composition root.

## Purpose

**What Composition owns:**
- `CompositionRoot` class that creates all dependencies
- Factory methods for ViewModels
- Environment-based configuration
- Dependency lifetime management

**What Composition does NOT own:**
- Business logic (lives in ViewModels/Repositories)
- UI (lives in AppShell and Feature modules)
- Data models (live in Storage/Core)

## Public API

```swift
import Composition

// Create composition root at app launch
let authConfig = AuthConfig(supabaseURL: url, supabaseAnonKey: key)
let paymentsConfig = PaymentsConfig(apiKey: key, entitlementID: "pro")

let composition = try CompositionRoot(
    authConfig: authConfig,
    paymentsConfig: paymentsConfig
)

// Access singletons
composition.httpClient
composition.sessionManager
composition.paymentsClient
composition.llmClient

// Create ViewModels
let chatVM = composition.makeChatViewModel(conversationID: id)
let settingsVM = composition.makeSettingsViewModel()
let homeVM = composition.makeHomeViewModel()
```

## Setup

### Configuration System

All configuration comes from `Config/Secrets.xcconfig`:

```bash
# Auth
SUPABASE_URL = https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY = eyJ...

# Payments
REVENUECAT_API_KEY = appl_...
RC_ENTITLEMENT_ID = pro

# AI Proxy
PROXY_BASE_URL = https://YOUR-PROJECT-REF.supabase.co/functions/v1
PROXY_PATH = /ai
```

**How it works:**
1. `Configuration.swift` is committed with placeholder values for immediate clone-and-run
2. Users fill in `Config/Secrets.xcconfig` with real API keys (gitignored)
3. Run `bash scripts/update-config.sh` to generate production config
4. Your app imports and uses the `AppConfiguration` enum

**Simple, reliable, no build phases or complexity.** Works in ALL build types (Debug, Release, Archive, TestFlight, App Store).

### Usage in App

```swift
import SwiftUI
import Composition

@main
struct MyApp: App {
    @State private var composition: CompositionRoot?
    
    init() {
        do {
            // Load configuration from AppConfiguration (generated from Config/Secrets.xcconfig)
            let authConfig = AuthConfig(
                supabaseURL: URL(string: AppConfiguration.SUPABASE_URL)!,
                supabaseAnonKey: AppConfiguration.SUPABASE_ANON_KEY
            )
            
            let paymentsConfig = PaymentsConfig(
                apiKey: AppConfiguration.REVENUECAT_API_KEY,
                entitlementID: AppConfiguration.RC_ENTITLEMENT_ID
            )
            
            self.composition = try CompositionRoot(
                authConfig: authConfig,
                paymentsConfig: paymentsConfig
            )
        } catch {
            fatalError("Failed to initialize app: \(error)")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            LaunchRouter(composition: composition)
                .modelContainer(composition.modelContainer)
        }
    }
}
```

## Example: Create ViewModel with Dependencies in 3 Steps

### Step 1: Define ViewModel

```swift
@Observable
@MainActor
final class MyFeatureViewModel {
    var data: [Item] = []

    private let repository: any ItemRepository
    private let authClient: any AuthClient

    init(repository: any ItemRepository, authClient: any AuthClient) {
        self.repository = repository
        self.authClient = authClient
    }

    func loadData() async {
        let items = try? await repository.fetchAll()
        self.data = items ?? []
    }
}
```

All v2.0 ViewModels are `@Observable` + `@MainActor` with `any` on existential protocol properties. Do not reach for `ObservableObject` / `@Published` in new code.

### Step 2: Add Factory to CompositionRoot

```swift
extension CompositionRoot {
    func makeMyFeatureViewModel() -> MyFeatureViewModel {
        MyFeatureViewModel(
            repository: itemRepository,
            authClient: sessionManager
        )
    }
}
```

### Step 3: Use in View

```swift
struct MyFeatureView: View {
    @State var viewModel: MyFeatureViewModel
    
    var body: some View {
        List(viewModel.data) { item in
            Text(item.name)
        }
        .task {
            await viewModel.loadData()
        }
    }
}

// Create from composition
let viewModel = composition.makeMyFeatureViewModel()
MyFeatureView(viewModel: viewModel)
```

**Expected result:**
- ViewModel has all dependencies injected
- No global singletons
- Easy to test with mocks

## Structure

### Singletons

Created once at app launch:

```swift
@MainActor
public final class CompositionRoot {
    // Storage
    public let modelContainer: ModelContainer
    public let keychainStore: KeychainStore

    // Networking
    public let httpClient: any HTTPClient

    // Services (v2.0 split: see SessionManagerWrapper.swift + LLMClientFactory.swift)
    public let sessionManager: any AuthClient
    public let paymentsClient: any PaymentsClient
    public let llmClient: any LLMClient

    // Repositories (all @MainActor-pinned)
    public let conversationRepository: any ConversationRepository
    public let messageRepository: any MessageRepository
    public let settingsRepository: any SettingsRepository
}
```

The v2.0 refactor split `CompositionRoot.swift` into a root + `SessionManagerWrapper.swift`, `CompositionRoot+Factories.swift`, and `LLMClientFactory.swift` under `SwiftAIBoilerplatePro/Composition/`. Public API is unchanged; add new factories to the `+Factories` extension file to stay under the 400-line rule.

### Factories

Create new instances on demand:

```swift
extension CompositionRoot {
    public func makeChatViewModel(conversationID: UUID) -> ChatViewModel {
        ChatViewModel(
            conversationID: conversationID,
            messageRepository: messageRepository,
            llmClient: llmClient
        )
    }
    
    public func makeSettingsViewModel() -> SettingsViewModel {
        SettingsViewModel(
            settingsRepository: settingsRepository,
            authClient: sessionManager,
            paymentsClient: paymentsClient
        )
    }
    
    public func makeHomeViewModel() -> HomeViewModel {
        HomeViewModel(
            conversationRepository: conversationRepository
        )
    }
}
```

### Configuration

Environment-based provider selection:

```swift
// LLM Client — see LLMClientFactory.swift for the production implementation.
func createLLMClient(httpClient: any HTTPClient) -> any LLMClient {
    let proxyBaseURL = ProcessInfo.processInfo.environment["PROXY_BASE_URL"]

    guard let baseURLString = proxyBaseURL,
          let baseURL = URL(string: baseURLString) else {
        // No proxy configured - use echo client
        return EchoLLMClient()
    }

    // Proxy configured - use real client
    return ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
}

// Auth Client
if ProcessInfo.processInfo.environment["AUTH_BYPASS"] == "1" {
    self.sessionManager = MockAuthClient()
} else {
    self.sessionManager = SessionManager(
        httpClient: supabaseHTTPClient,
        keychain: keychainStore,
        config: authConfig
    )
}
```

## Customization

### Safe Changes

**Add new singleton:**
```swift
extension CompositionRoot {
    public let analyticsClient: AnalyticsClient
    
    public init(...) {
        // ... existing init
        
        self.analyticsClient = AnalyticsClientImpl(
            apiKey: ProcessInfo.processInfo.environment["ANALYTICS_API_KEY"]!
        )
    }
}
```

**Add new repository:**
```swift
extension CompositionRoot {
    public let customRepository: CustomRepository
    
    public init(...) {
        // ... existing init
        
        self.customRepository = CustomRepositoryImpl(
            modelContext: modelContainer.mainContext
        )
    }
}
```

**Add new ViewModel factory:**
```swift
extension CompositionRoot {
    public func makeCustomViewModel() -> CustomViewModel {
        CustomViewModel(
            repository: customRepository,
            httpClient: httpClient
        )
    }
}
```

**Swap provider:**
```swift
// Example: Replace Supabase with Firebase
public init(...) {
    // Old:
    // self.sessionManager = SupabaseSessionManager(...)
    
    // New:
    self.sessionManager = FirebaseAuthClient(config: authConfig)
    
    // All ViewModels continue to work unchanged
}
```

### Pitfalls

**Don't:**
- Create dependencies outside CompositionRoot
- Use global singletons (except CompositionRoot itself)
- Store mutable state in CompositionRoot
- Create circular dependencies
- Hardcode configuration (use environment variables)

**Do:**
- Create all dependencies in `init`
- Use protocols for all services/clients
- Pass CompositionRoot to root view
- Use factories for short-lived objects
- Document environment variables

## Where Used

**App entry point:**
```swift
// SwiftAIBoilerplatePro.swift
@main
struct SwiftAIBoilerplateProApp: App {
    let composition: CompositionRoot
    
    var body: some Scene {
        WindowGroup {
            LaunchRouter(composition: composition)
                .modelContainer(composition.modelContainer)
        }
    }
}
```

**Root views:**
```swift
// AppShell/LaunchRouter.swift
struct LaunchRouter: View {
    let composition: CompositionRoot
    
    var body: some View {
        Group {
            switch authState {
            case .authenticated:
                HomeView(composition: composition)
            case .unauthenticated:
                SignInView(composition: composition)
            }
        }
    }
}
```

**ViewModel creation:**
```swift
// AppShell/HomeView.swift
struct HomeView: View {
    let composition: CompositionRoot
    @State private var viewModel: HomeViewModel?
    
    var body: some View {
        // content
    }
    .task {
        self.viewModel = composition.makeHomeViewModel()
    }
}
```

## Tests

### Unit Tests

Mock CompositionRoot for testing:

```swift
extension CompositionRoot {
    static func mock() throws -> CompositionRoot {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: Conversation.self, Message.self, Settings.self,
            configurations: [config]
        )
        
        let authConfig = AuthConfig(
            supabaseURL: URL(string: "https://test.supabase.co")!,
            supabaseAnonKey: "test_key"
        )
        
        let paymentsConfig = PaymentsConfig(
            apiKey: "test_key",
            entitlementID: "test"
        )
        
        return try CompositionRoot(
            authConfig: authConfig,
            paymentsConfig: paymentsConfig
        )
    }
}

// In tests
func testViewModel() async throws {
    let composition = try CompositionRoot.mock()
    let viewModel = composition.makeChatViewModel(conversationID: testID)
    
    // Test ViewModel
}
```

### Preview Mocks

```swift
// Previews/PreviewComposition.swift
extension CompositionRoot {
    @MainActor
    static let preview: CompositionRoot = {
        do {
            return try CompositionRoot.mock()
        } catch {
            fatalError("Failed to create preview composition: \(error)")
        }
    }()
}

// In previews
#Preview {
    ChatView(
        viewModel: CompositionRoot.preview.makeChatViewModel(
            conversationID: UUID()
        )
    )
}
```

## Troubleshooting

### Issue: "Missing Configuration"

**Symptoms:** Build fails with "Config/Secrets.xcconfig not found" or app crashes on launch

**Fixes:**
1. Ensure `Config/Secrets.xcconfig` exists:
   ```bash
   cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig
   ```
2. Fill in all required keys in `Config/Secrets.xcconfig`:
   ```bash
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = your_anon_key
   REVENUECAT_API_KEY = your_rc_key
   PROXY_BASE_URL = https://your-project.supabase.co/functions/v1
   ```
3. Clean build folder: `⌘ + Shift + K`
4. Build again - the script will auto-generate `Configuration.swift`
5. Check build phase "Generate Configuration" exists and runs before "Compile Sources"

### Issue: "Cannot Resolve Dependencies"

**Symptoms:** Circular dependency or initialization order issues

**Fixes:**
1. Review dependency graph
2. Break circular dependencies with protocols
3. Reorder initialization in CompositionRoot
4. Use lazy initialization if needed:
   ```swift
   public lazy var dependentService: Service = {
       ServiceImpl(dependency: otherService)
   }()
   ```

### Issue: ViewModels Not Updating

**Symptoms:** UI doesn't reflect data changes

**Fixes:**
1. Ensure the ViewModel is `@Observable` (not `ObservableObject`):
   ```swift
   @Observable
   @MainActor
   final class ViewModel {
       var data: [Item] = []
   }
   ```
2. Use `@State` in views, no `@ObservedObject` / `@StateObject`:
   ```swift
   @State var viewModel: ViewModel
   ```
3. Read properties directly inside `body`. Do not use `$`-prefixed publishers — they do not exist on `@Observable` types.

### Issue: Memory Leaks

**Symptoms:** Memory grows over time

**Fixes:**
1. Use `[weak self]` in closures:
   ```swift
   Task { [weak self] in
       await self?.doWork()
   }
   ```
2. Cancel tasks on deinit:
   ```swift
   deinit {
       task?.cancel()
   }
   ```
3. Check for retain cycles with Instruments

## Advanced Usage

### Multi-Environment Support

```swift
enum Environment {
    case development
    case staging
    case production
    
    static var current: Environment {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }
    
    var supabaseURL: URL {
        switch self {
        case .development:
            return URL(string: "https://dev.supabase.co")!
        case .staging:
            return URL(string: "https://staging.supabase.co")!
        case .production:
            return URL(string: AppConfiguration.SUPABASE_URL)!
        }
    }
}
```

### Feature Flags

```swift
struct FeatureFlags {
    static var enableNewChatUI: Bool {
        ProcessInfo.processInfo.environment["FEATURE_NEW_CHAT_UI"] == "1"
    }
    
    static var enableAnalytics: Bool {
        ProcessInfo.processInfo.environment["FEATURE_ANALYTICS"] == "1"
    }
}

// In CompositionRoot
if FeatureFlags.enableAnalytics {
    self.analyticsClient = AnalyticsClientImpl()
} else {
    self.analyticsClient = NoOpAnalyticsClient()
}
```

### Dependency Override (Testing)

```swift
extension CompositionRoot {
    func withMockAuth(_ mockAuth: any AuthClient) -> CompositionRoot {
        var copy = self
        copy.sessionManager = mockAuth
        return copy
    }

    func withMockLLM(_ mockLLM: any LLMClient) -> CompositionRoot {
        var copy = self
        copy.llmClient = mockLLM
        return copy
    }
}

// In tests
let composition = try CompositionRoot.mock()
    .withMockAuth(MockAuthClient())
    .withMockLLM(MockLLMClient())
```

## Related Modules

- [Architecture.md](Architecture.md) - Shows CompositionRoot in the system diagram
- All module docs - Every module is initialized here

---

**Next steps:**
- See [Architecture.md](Architecture.md) for dependency flow
- Check individual module docs for what dependencies they need
- Review `SwiftAIBoilerplatePro/Composition/` — the root now lives alongside `SessionManagerWrapper.swift`, `CompositionRoot+Factories.swift`, and `LLMClientFactory.swift`

