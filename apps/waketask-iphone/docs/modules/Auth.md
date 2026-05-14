# Auth Module

Authentication with Supabase backend and Apple Sign In integration.

> **v2.0 — File split.** `SessionManager.swift` (formerly 512 lines) is now a composition root plus `SessionManager+SignIn.swift`, `SessionManager+Refresh.swift`, and `SessionManager+Persistence.swift`. `SupabaseAuthAPI.swift` (formerly 442 lines) is similarly split into a core + `SupabaseAuthAPI+Mapping.swift` with new `runAuthExchange` / `runAuthSideEffect` helpers that deduplicate the try/catch pattern across eight endpoints. The public `AuthClient` API is unchanged — the session manager, Apple Sign In coordinator, and Supabase API still resolve from the same types.
>
> **Swift 6.** `SessionManager.saveSession()` no longer force-unwraps UTF-8 encoding — it uses `guard let` with a typed `AuthError.unknown`. `AuthClient` is `Sendable`, all protocol-typed properties carry the `any` keyword.

## Purpose

**What Auth owns:**
- User authentication (sign in, sign up, sign out)
- Apple Sign In coordination
- Email/password authentication
- Session management with automatic token refresh
- `AuthClient` protocol and implementations

**What Auth does NOT own:**
- Token storage (uses Storage/KeychainStore)
- UI screens (see AppShell)
- Network calls (uses Networking/HTTPClient)
- Business logic beyond authentication

## Public API

```swift
import Auth

// Sign in with Apple
let user = try await authClient.signInWithApple()

// Email authentication
let user = try await authClient.signInWithEmail(
    email: "user@example.com",
    password: "password123"
)

try await authClient.signUpWithEmail(
    email: "user@example.com",
    password: "password123"
)

// Password reset
try await authClient.resetPassword(email: "user@example.com")

// Sign out
try await authClient.signOut()

// Check current user
let currentUser = await authClient.currentUser()

// Observe auth state
for await state in authClient.authStates() {
    switch state {
    case .authenticated(let user):
        print("User signed in: \(user.email)")
    case .unauthenticated:
        print("User signed out")
    }
}
```

## Setup

### Environment Variables

Configure in `Config/Secrets.xcconfig`:

```bash
SUPABASE_URL = https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY = eyJ...your-anon-key...
```

### Dependency Injection

```swift
// In CompositionRoot.swift
let authConfig = AuthConfig(
    supabaseURL: URL(string: ProcessInfo.processInfo.environment["SUPABASE_URL"]!)!,
    supabaseAnonKey: ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]!
)

let supabaseHTTPClient = Auth.SupabaseHTTPClient(
    baseURL: authConfig.supabaseURL,
    session: .shared
)

let appleSignInCoordinator = Auth.AppleSignInCoordinator()

let sessionManager = Auth.SessionManager(
    httpClient: supabaseHTTPClient,
    keychain: keychainStore,
    apple: appleSignInCoordinator,
    config: authConfig
)

self.sessionManager = sessionManager
```

### Flags

**Auth bypass for testing (Simplified in DEBUG builds):**

**DEBUG builds (default):**
- MockAuthClient **enabled by default**
- No Supabase configuration needed
- Works with or without Xcode attached
- Debug sign-in button appears on sign-in screen

**To use REAL auth in DEBUG:**
```swift
// Xcode scheme → Run → Arguments → Environment Variables
AUTH_BYPASS = 0  // Explicitly disable mock
```

**RELEASE builds:**
- Always use real auth (MockAuthClient never available)
- Requires Supabase configuration

**Implementation:**
```swift
#if DEBUG
let shouldUseMock = ProcessInfo.processInfo.environment["AUTH_BYPASS"] != "0"
#else
let shouldUseMock = false
#endif

if shouldUseMock {
    self.sessionManager = Auth.MockAuthClient()  // Debug only
} else {
    self.sessionManager = // ... real Supabase auth
}
```

**Benefits:**
- ✅ Test app without Xcode attached
- ✅ No Supabase setup required for local development
- ✅ Run on device/simulator standalone
- ✅ Faster iteration cycles
- ✅ Safe: Production builds never use mock

## Example: Sign In with Apple in 3 Steps

### Step 1: Trigger Sign In

```swift
import Auth

@Observable
@MainActor
final class SignInViewModel {
    var user: AuthUser?
    var errorMessage: String?

    private let authClient: any AuthClient

    init(authClient: any AuthClient) {
        self.authClient = authClient
    }

    func signInWithApple() async {
        do {
            self.user = try await authClient.signInWithApple()
        } catch let error as AppError {
            self.errorMessage = error.userMessage
        }
    }
}
```

### Step 2: Show Sign In Sheet

```swift
import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @Environment(\.colorScheme) private var colorScheme
    @State var viewModel: SignInViewModel
    
    var body: some View {
        VStack(spacing: 16) {
            // Native Apple button (HIG compliant)
            SignInWithAppleButton(.signIn) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                Task {
                    await viewModel.signInWithApple()
                }
            }
            .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
            .frame(height: 50)
            
            // Error handling
            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.caption)
            }
        }
    }
}
```

### Step 3: Navigate on Success

```swift
struct LaunchRouter: View {
    @State var authClient: AuthClient
    @State private var authState: AuthState = .unauthenticated
    
    var body: some View {
        Group {
            switch authState {
            case .authenticated(let user):
                HomeView(user: user)
            case .unauthenticated:
                SignInView(viewModel: SignInViewModel(authClient: authClient))
            }
        }
        .task {
            for await state in authClient.authStates() {
                self.authState = state
            }
        }
    }
}
```

**Expected result:**
1. User taps native Apple button
2. System Apple Sign In sheet appears
3. User authenticates with Face ID/Touch ID
4. Access token saved to Keychain
5. App automatically navigates to main screen

**Note:** The boilerplate uses the native `SignInWithAppleButton` from `AuthenticationServices` to comply with Apple's Human Interface Guidelines and App Store requirements. Always use this native button, never custom-styled alternatives.

## Common Customizations

> **Quick Start:** These recipes show how to customize authentication. All follow the AuthClient protocol pattern.

### Add Google Sign In

**Task:** Add "Sign in with Google" alongside Apple.

**Steps:**
1. Add GoogleSignIn SDK via SPM
2. Implement in AuthClient extension or new client:
```swift
import GoogleSignIn

extension SupabaseAuthClient {
    func signInWithGoogle(presenting: UIViewController) async throws -> AuthUser {
        let result = try await GIDSignIn.sharedInstance.signIn(
            withPresenting: presenting
        )
        
        let user = result.user
        let idToken = user.idToken?.tokenString
        
        // Sign in to Supabase with Google token
        let response = try await supabaseClient.auth.signInWithIdToken(
            credentials: .init(provider: .google, idToken: idToken ?? "")
        )
        
        return mapToAuthUser(response.user)
    }
}
```

3. Add button to SignInView

**LLM Prompt:**
```
Add Google Sign In to the auth flow following the Apple Sign In pattern. 
Use GoogleSignIn SDK, add button to SignInView below Apple button, and handle 
the OAuth flow. Store tokens in Keychain like Apple auth does. Follow the 
AuthClient protocol pattern in docs/Auth.md.
```

### Switch to Firebase Authentication

**Task:** Replace Supabase with Firebase as auth backend.

**Steps:**
1. Keep AuthClient protocol (don't change it!)
2. Create FirebaseAuthClient:
```swift
final class FirebaseAuthClient: AuthClient {
    func signInWithApple() async throws -> AuthUser {
        // Firebase implementation
    }
    
    func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        let result = try await Auth.auth().signIn(withEmail: email, password: password)
        return mapToAuthUser(result.user)
    }
    
    // ... implement all protocol methods
}
```

3. Update CompositionRoot:
```swift
self.sessionManager = FirebaseAuthClient()
```

4. All ViewModels work unchanged!

**LLM Prompt:**
```
Replace Supabase authentication with Firebase Auth while keeping the AuthClient 
protocol unchanged. Implement FirebaseAuthClient following the same pattern as 
SupabaseAuthClient. Update CompositionRoot to use it. All ViewModels should 
continue working without any changes. See docs/Auth.md#custom-providers.
```

### Add Email Verification Flow

**Task:** Require email verification before allowing sign in.

**Steps:**
1. Add to SignUpView:
```swift
.alert("Verify Email", isPresented: $showVerificationAlert) {
    Button("OK") { }
} message: {
    Text("Check your email for verification link")
}
```

2. Update SessionManager:
```swift
func signUpWithEmail(email: String, password: String) async throws -> AuthUser {
    let user = try await httpClient.signUp(email: email, password: password)
    
    // Check if email verified
    guard user.emailVerified else {
        throw AppError.emailNotVerified
    }
    
    return user
}
```

**LLM Prompt:**
```
Add email verification requirement to sign up flow. After sign up, show an alert 
telling users to check their email. Don't allow sign in until email is verified. 
Add proper error handling and user feedback. Follow the error handling pattern in 
docs/Auth.md.
```

### Customize Session Duration

**Task:** Change token refresh timing or session expiry.

**File:** `Packages/Auth/Sources/Auth/SessionManager.swift`

```swift
// Change refresh threshold
private let refreshThreshold: TimeInterval = 600  // 10 minutes (was 5 minutes)

// Or disable auto-refresh and refresh manually
func refreshIfNeeded() async throws {
    // Custom refresh logic
}
```

**LLM Prompt:**
```
Increase the session refresh threshold from 5 minutes to 15 minutes before token 
expiry. Update the SessionManager refreshIfNeeded() logic. Ensure tokens are 
still refreshed before they expire. Test with mock tokens.
```

---

## Customization (Advanced)

### Add Custom Auth Provider
```swift
final class FirebaseAuthClient: AuthClient {
    func signInWithApple() async throws -> AuthUser {
        // Firebase implementation
        let credential = // ... get Apple credential
        let result = try await Auth.auth().signIn(with: credential)
        
        return AuthUser(
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName
        )
    }
    
    func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        let result = try await Auth.auth().signIn(
            withEmail: email,
            password: password
        )
        
        return AuthUser(
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName
        )
    }
    
    // ... implement other protocol methods
}

// In CompositionRoot:
self.sessionManager = FirebaseAuthClient()
```

**Add social providers:**
```swift
extension AuthClient {
    func signInWithGoogle() async throws -> AuthUser {
        // Google Sign In implementation
    }
    
    func signInWithGitHub() async throws -> AuthUser {
        // GitHub OAuth implementation
    }
}
```

**Customize token refresh:**
```swift
// In SessionManager
private let refreshThreshold: TimeInterval = 300  // 5 minutes before expiry

func refreshIfNeeded() async throws {
    guard let expiresAt = await getTokenExpiry(),
          expiresAt.timeIntervalSinceNow < refreshThreshold else {
        return
    }
    
    try await refresh Token()
}
```

### Pitfalls

**Don't:**
- Store tokens in UserDefaults (use Keychain)
- Make auth calls from Views (use ViewModels)
- Ignore session refresh (tokens expire)
- Hardcode Supabase credentials
- Log tokens/passwords

**Do:**
- Use AuthClient protocol, not concrete implementations
- Handle auth errors gracefully
- Observe auth state changes
- Refresh tokens proactively
- Test with MockAuthClient

## Where Used

**Direct users:**
- `AppShell/LaunchRouter` - Route based on auth state
- `AppShell/SignInView` - Sign in UI
- `ProfileViewModel` - Sign out, user info
- `SettingsViewModel` - Account management

**Indirect users:**
- `Networking/AuthInterceptor` - Attaches auth token to requests
- All API calls automatically authenticated

**Example from LaunchRouter:**
```swift
// AppShell/LaunchRouter.swift
import Auth

@MainActor
struct LaunchRouter: View {
    let composition: CompositionRoot
    
    @State private var authState: AuthState = .unauthenticated
    
    var body: some View {
        Group {
            switch authState {
            case .authenticated(let user):
                MainTabView(user: user, composition: composition)
            case .unauthenticated:
                OnboardingContainerView(composition: composition)
            }
        }
        .task {
            for await state in composition.sessionManager.authStates() {
                self.authState = state
            }
        }
    }
}
```

## Tests

### Run Tests

```bash
# All auth tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:AuthTests

# Specific test files
-only-testing:AuthTests/SessionManagerTests
-only-testing:AuthTests/AppleSignInCoordinatorTests
-only-testing:AuthTests/AuthFlowIntegrationTests
```

### What's Covered

**SessionManager:**
- Sign in flows (Apple, email)
- Sign up flow
- Sign out
- Token refresh logic
- Auth state transitions
- Error handling

**AppleSignInCoordinator:**
- Apple credential generation
- Nonce creation
- Error mapping

**SupabaseAuthClient:**
- API calls (sign in, sign up, refresh)
- Response parsing
- Token storage/retrieval

**Integration:**
- Full auth flow (sign in → token save → authenticated state)
- Token refresh before expiry
- Sign out (clear tokens + state)

**Coverage:** 85%+ (auth is critical)

### Example Test

```swift
import XCTesting
@testable import Auth

final class SessionManagerTests: XCTestCase {
    func testSignInWithEmail_success_savesTokensAndEmitsAuthenticatedState() async throws {
        let mockHTTPClient = MockSupabaseHTTPClient(
            signInResponse: .success(user: testUser, accessToken: "token123")
        )
        let mockKeychain = MockKeychainStore()
        
        let sessionManager = SessionManager(
            httpClient: mockHTTPClient,
            keychain: mockKeychain,
            config: testConfig
        )
        
        let user = try await sessionManager.signInWithEmail(
            email: "test@example.com",
            password: "password"
        )
        
        XCTAssertEqual(user.id, testUser.id)
        XCTAssertEqual(mockKeychain.savedTokens["auth_access_token"], "token123")
        
        // Check auth state
        let states = sessionManager.authStates()
        for await state in states {
            if case .authenticated(let authUser) = state {
                XCTAssertEqual(authUser.id, user.id)
                break
            }
        }
    }
}
```

## Troubleshooting

### Issue: "Unauthorized" on Sign In

**Symptoms:** Sign in fails with 401/403

**Fixes:**
1. Verify Supabase credentials:
   ```swift
   print(authConfig.supabaseURL)
   print(authConfig.supabaseAnonKey.prefix(10))
   ```
2. Check Supabase dashboard:
   - Authentication → Providers → Email enabled
   - Authentication → Providers → Apple Sign In configured
3. Verify user exists (for sign in)
4. Check Supabase logs

### Issue: Apple Sign In Not Working

**Symptoms:** Apple Sign In sheet doesn't appear or fails

**Fixes:**
1. Enable "Sign in with Apple" capability:
   - Xcode → Target → Signing & Capabilities
   - Add "Sign in with Apple"
2. Configure in Supabase:
   - Dashboard → Authentication → Providers
   - Enable Apple
   - Add Service ID and key
3. Test on real device (simulator has limitations)
4. Check Apple Developer account

### Issue: Token Expired Errors

**Symptoms:** API calls fail with "Token expired"

**Fixes:**
1. Ensure automatic refresh is enabled:
   ```swift
   try await authClient.refreshIfNeeded()
   ```
2. Call refresh before long-running operations
3. Handle refresh failures (sign out and re-authenticate):
   ```swift
   do {
       try await authClient.refreshIfNeeded()
   } catch {
       try? await authClient.signOut()
       // Navigate to sign in
   }
   ```

### Issue: Keychain Errors

**Symptoms:** "Failed to save token" or "Item not found"

**Fixes:**
1. Check keychain access group (should be nil for default)
2. Keychain is cleared on app uninstall
3. Test on device (simulator can have issues)
4. Check keychain entitlements

### Issue: Auth State Not Updating

**Symptoms:** UI doesn't update after sign in/out

**Fixes:**
1. Ensure observing auth state:
   ```swift
   .task {
       for await state in authClient.authStates() {
           self.authState = state
       }
   }
   ```
2. Check state lives on an `@Observable` ViewModel read via `@State`
3. Verify SessionManager emits state changes

### Issue: User Logged Out Unexpectedly

**Symptoms:** User was logged in yesterday, but logged out today when opening the app

**Cause:** This should NOT happen with properly configured session management. The app should automatically refresh expired access tokens using the refresh token.

**Fixes:**
1. Verify `loadInitialSession()` in SessionManager attempts refresh when token expired:
   ```swift
   if Date.now > session.expiresAt {
       // Should call attemptSessionRefresh(), NOT clearSession()
       await attemptSessionRefresh(with: session)
   }
   ```

2. Check refresh token is being persisted:
   ```swift
   // In saveSession()
   try keychain.setString(session.refreshToken, for: Keys.refreshToken)
   ```

3. Verify Supabase refresh endpoint is working:
   - Check Supabase dashboard → Logs
   - Verify `/auth/v1/token?grant_type=refresh_token` endpoint

4. Check refresh token hasn't expired:
   - Supabase default: 7 days (configurable in Supabase dashboard)
   - Authentication → Settings → JWT Expiry

**Debugging:**
```swift
// Add to loadInitialSession()
AppLogger.debug("Session expiresAt: \(session.expiresAt), now: \(Date.now)", category: AppLogger.auth)
AppLogger.debug("Refresh token present: \(!session.refreshToken.isEmpty)", category: AppLogger.auth)
```

## Advanced Usage

### Custom Token Refresh Strategy

```swift
actor TokenRefresher {
    private var refreshTask: Task<Void, Error>?
    
    func scheduleRefresh(expiresAt: Date) {
        refreshTask?.cancel()
        
        let delay = expiresAt.timeIntervalSinceNow - 300  // 5 min before
        
        refreshTask = Task {
            try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            try await sessionManager.refreshToken()
        }
    }
}
```

### Biometric Authentication

```swift
import LocalAuthentication

func signInWithBiometrics() async throws -> AuthUser {
    let context = LAContext()
    var error: NSError?
    
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
        throw AuthError.biometricsUnavailable
    }
    
    let success = try await context.evaluatePolicy(
        .deviceOwnerAuthenticationWithBiometrics,
        localizedReason: "Authenticate to access your account"
    )
    
    guard success else {
        throw AuthError.biometricsFailed
    }
    
    // Load saved credentials from keychain
    let email = try keychainStore.load(forKey: "saved_email")
    let password = try keychainStore.load(forKey: "saved_password")
    
    return try await signInWithEmail(email: email, password: password)
}
```

### Multi-Factor Authentication

```swift
func signInWithMFA(email: String, password: String, code: String) async throws -> AuthUser {
    // Step 1: Initial auth
    let challengeToken = try await initiateAuth(email: email, password: password)
    
    // Step 2: Verify MFA code
    let user = try await verifyMFA(challengeToken: challengeToken, code: code)
    
    return user
}
```

### Session Persistence & Automatic Restoration

The boilerplate includes robust session persistence that keeps users logged in across app restarts:

**How it works:**
1. **On sign in:** Access token, refresh token, expiry date, and user data are stored in Keychain
2. **On app launch:** Session is automatically restored from Keychain
3. **If access token expired:** The app automatically refreshes using the refresh token
4. **Only logs out if:** Refresh token is also invalid/revoked (typically after 7+ days of inactivity)

**Token Lifespans:**
| Token | Lifespan | Purpose |
|-------|----------|---------|
| Access Token | ~1 hour | API authentication |
| Refresh Token | 7+ days | Get new access tokens |

**Automatic Session Restoration (in SessionManager):**

```swift
private func loadInitialSession() async {
    if let session = try loadSession() {
        if Date.now > session.expiresAt {
            // Access token expired - try to refresh (don't log out immediately!)
            await attemptSessionRefresh(with: session)
        } else {
            // Token still valid
            currentSession = session
            scheduleRefresh(for: session)
        }
    }
}

private func attemptSessionRefresh(with expiredSession: AuthSession) async {
    // Try up to 3 times to refresh using the refresh token
    for attempt in 1...3 {
        do {
            let newSession = try await api.refresh(refreshToken: expiredSession.refreshToken)
            // Success! User stays logged in
            try await persistSession(newSession)
            return
        } catch {
            // Retry on transient failures
        }
    }
    // Only clear session if all refresh attempts failed
    try? clearSession()
}
```

**Key behavior:**
- ✅ User opens app after 2 hours → Refreshes silently → Still logged in
- ✅ User opens app after 2 days → Refreshes silently → Still logged in  
- ❌ User opens app after 14+ days → Refresh fails → Must sign in again

**Manual session restoration:**

```swift
func restoreSession() async -> AuthUser? {
    guard let accessToken = try? keychainStore.load(forKey: "auth_access_token"),
          let refreshToken = try? keychainStore.load(forKey: "auth_refresh_token") else {
        return nil
    }
    
    // Verify token is still valid
    do {
        try await refreshIfNeeded()
        return await currentUser()
    } catch {
        // Tokens invalid, clear and return nil
        try? await signOut()
        return nil
    }
}
```

## Related Modules

- [Storage](Storage.md) - KeychainStore for token storage
- [Networking](Networking.md) - AuthInterceptor uses tokens
- [architecture-overview.md](architecture-overview.md) - Auth in system flow
- [migrations/supabase.md](migrations/supabase.md) - Supabase setup

---

**Next steps:**
- Set up Supabase: [migrations/supabase.md](migrations/supabase.md)
- See [Networking](Networking.md) for AuthInterceptor integration
- Check [architecture-overview.md](architecture-overview.md) for auth flow

