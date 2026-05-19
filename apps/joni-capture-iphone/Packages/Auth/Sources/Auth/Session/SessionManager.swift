import Foundation
import Networking
import Storage
import Core

/// Main session manager implementing AuthClient and SessionStore.
///
/// The surface area is split across sibling files:
/// - `SessionManager+SignIn.swift`       — AuthClient sign-in/out/reset + state stream
/// - `SessionManager+Refresh.swift`      — access-token refresh, retry, scheduling
/// - `SessionManager+Persistence.swift`  — keychain persistence + initial load
@available(iOS 17.0, *)
public actor SessionManager: @preconcurrency AuthClient, @preconcurrency SessionStore {

    // MARK: - Properties

    let httpClient: any HTTPClient
    let keychain: any SecureStore
    let apple: any AppleSignInProvider
    let google: (any GoogleSignInProvider)?
    let config: AuthConfig
    let sleeper: any Sleeper
    let api: SupabaseAuthAPI

    var currentSession: AuthSession?
    var refreshTask: Task<Void, Never>?
    var stateContinuations: [UUID: AsyncStream<AuthState>.Continuation] = [:]
    var isRefreshing = false

    // MARK: - Keychain Keys

    enum Keys {
        static let accessToken = "auth_access_token"
        static let refreshToken = "auth_refresh_token"
        static let expiresAt = "auth_expires_at"
        static let userJSON = "auth_user_json"
    }

    // MARK: - Initialization

    public init(
        httpClient: any HTTPClient,
        keychain: any SecureStore,
        apple: any AppleSignInProvider,
        google: (any GoogleSignInProvider)? = nil,
        config: AuthConfig
    ) {
        self.httpClient = httpClient
        self.keychain = keychain
        self.apple = apple
        self.google = google
        self.config = config
        self.sleeper = DefaultSleeper()
        self.api = SupabaseAuthAPI(httpClient: httpClient, config: config)

        Task {
            await loadInitialSession()
        }
    }

    /// Internal init for tests — injects a deterministic `Sleeper`.
    init(
        httpClient: any HTTPClient,
        keychain: any SecureStore,
        apple: any AppleSignInProvider,
        google: (any GoogleSignInProvider)? = nil,
        config: AuthConfig,
        sleeper: any Sleeper
    ) {
        self.httpClient = httpClient
        self.keychain = keychain
        self.apple = apple
        self.google = google
        self.config = config
        self.sleeper = sleeper
        self.api = SupabaseAuthAPI(httpClient: httpClient, config: config)

        Task {
            await loadInitialSession()
        }
    }

    deinit {
        for continuation in stateContinuations.values {
            continuation.finish()
        }
        refreshTask?.cancel()
    }

    // MARK: - Shared state helpers used across extension files

    func emit(_ state: AuthState) {
        for continuation in stateContinuations.values {
            continuation.yield(state)
        }
    }

    func currentAuthState() -> AuthState {
        if let user = currentSession?.user {
            return .authenticated(user)
        } else {
            return .unauthenticated
        }
    }
}
