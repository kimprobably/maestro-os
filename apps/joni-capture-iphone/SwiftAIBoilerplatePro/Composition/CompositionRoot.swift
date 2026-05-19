import Foundation
import SwiftUI
import FeatureSettings
import SwiftData
import Core
import Networking
import Storage
import Auth
import Payments
import FeatureChat
import FeatureRating
import DesignSystem
import AI

/// Central dependency-injection container.
///
/// Owns app-wide singletons and wires every subsystem together.
/// View model factories live in `CompositionRoot+Factories.swift`.
/// The `SessionManager → AuthClient` adapter lives in `SessionManagerWrapper.swift`.
/// The LLM client factory lives in `LLMClientFactory.swift`.
@MainActor
@available(iOS 17.0, *)
public final class CompositionRoot {

    // MARK: - Singletons

    /// SwiftData model container
    public let modelContainer: ModelContainer

    /// HTTP client with interceptors
    public let httpClient: any HTTPClient

    /// Keychain storage
    public let keychainStore: KeychainStore

    /// Auth client (SessionManager or MockAuthClient)
    public let sessionManager: any AuthClient

    /// Payments client
    public let paymentsClient: any PaymentsClient

    /// LLM client (Proxy when configured, Echo otherwise)
    public let llmClient: any LLMClient

    /// Crash reporter for diagnostics
    public let crashReporter: any CrashReporter

    /// Rating client for app review prompts
    public let ratingClient: any RatingClient

    // MARK: - Repositories

    public let conversationRepository: any ConversationRepository
    public let messageRepository: any MessageRepository
    public let settingsRepository: any SettingsRepository

    /// Profile photo storage client (optional — Supabase or mock)
    public let profilePhotoStorageClient: (any ProfilePhotoStorageClient)?

    // MARK: - Configuration

    private let authConfig: AuthConfig
    private let paymentsConfig: PaymentsConfig

    /// Proxy base URL for device token uploads and AI requests
    public let proxyBaseURL: URL?

    // MARK: - Initialization

    public init(
        authConfig: AuthConfig,
        paymentsConfig: PaymentsConfig
    ) throws {
        self.authConfig = authConfig
        self.paymentsConfig = paymentsConfig

        if let proxyURL = URL(string: AppConfiguration.PROXY_BASE_URL),
           !AppConfiguration.PROXY_BASE_URL.contains("YOUR"),
           !AppConfiguration.PROXY_BASE_URL.contains("placeholder") {
            self.proxyBaseURL = proxyURL
        } else {
            self.proxyBaseURL = nil
        }

        AppLogger.info("Initializing CompositionRoot", category: AppLogger.ui)

        // 1. Storage: SwiftData model container
        let schema = Schema([
            Conversation.self,
            Message.self,
            Settings.self
        ])

        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false
        )

        self.modelContainer = try ModelContainer(
            for: schema,
            configurations: [modelConfiguration]
        )

        let mainContext = modelContainer.mainContext

        // 2. Keychain storage
        self.keychainStore = KeychainStore(accessGroup: nil)

        // 3. HTTP client with interceptors
        let tokenProvider = Storage.KeychainTokenProvider(
            keychain: keychainStore,
            tokenKey: KeychainStore.Keys.authAccessToken
        )

        let authInterceptor = Networking.AuthInterceptor(tokenProvider: tokenProvider)
        let retryInterceptor = Networking.RetryInterceptor(
            policy: Networking.RetryPolicy(maxAttempts: 3)
        )
        let headersInterceptor = Networking.HeadersInterceptor(
            appVersion: "1.0.0",
            platform: "iOS",
            extraHeaders: [:]
        )

        // TODO: Replace with actual API base URL
        self.httpClient = Networking.URLSessionHTTPClient(
            baseURL: URL(string: "https://api.example.com")!,
            session: .shared,
            defaultHeaders: ["Accept": "application/json"],
            interceptors: [headersInterceptor, authInterceptor, retryInterceptor]
        )

        // 4. Repositories (local SwiftData — always created for offline support)
        let localConversationRepo = ConversationRepositoryImpl(modelContext: mainContext)
        let localMessageRepo = MessageRepositoryImpl(modelContext: mainContext)
        self.settingsRepository = SettingsRepositoryImpl(modelContext: mainContext)

        // 5. Auth: real Supabase+Apple+Email or MockAuthClient in DEBUG
        #if DEBUG
        let authBypassValue = ProcessInfo.processInfo.environment["AUTH_BYPASS"]
        let shouldUseMock = authBypassValue != "0"  // Use mock unless explicitly disabled
        #else
        let shouldUseMock = false  // Never use mock in production
        #endif

        AppLogger.info("DEBUG build: \(shouldUseMock ? "Using MockAuthClient" : "Using real auth")", category: AppLogger.auth)

        if shouldUseMock {
            AppLogger.info("MockAuthClient enabled - no backend required", category: AppLogger.auth)
            self.sessionManager = Auth.MockAuthClient()
        } else {
            AppLogger.info("Using real authentication (Supabase + Apple + Email)", category: AppLogger.auth)
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

            self.sessionManager = SessionManagerWrapper(sessionManager)
        }

        // 4a. Chat sync (hybrid local + optional remote)
        // Enable by setting FeatureFlags.chatSyncEnabled = true (see docs/CHAT_SYNC_SETUP.md)
        if FeatureFlags.chatSyncEnabled && !shouldUseMock {
            AppLogger.info("Chat sync enabled - using hybrid repositories", category: AppLogger.storage)
            // TODO: wire Supabase remote repos once a signed-in user id is available
            self.conversationRepository = localConversationRepo
            self.messageRepository = localMessageRepo
        } else {
            AppLogger.info("Chat sync disabled - using local-only repositories", category: AppLogger.storage)
            self.conversationRepository = localConversationRepo
            self.messageRepository = localMessageRepo
        }

        // 5a. Profile photo storage (optional — requires Supabase setup)
        if !shouldUseMock {
            // TODO: wire SupabaseProfilePhotoStorageClient when bucket is configured
            self.profilePhotoStorageClient = nil
        } else {
            self.profilePhotoStorageClient = MockProfilePhotoStorageClient()
        }

        // 6. Payments: RevenueCat
        let revenueCatClient = Payments.RevenueCatClient()
        revenueCatClient.configure(paymentsConfig)
        self.paymentsClient = revenueCatClient

        // 7. LLM client: Proxy or Echo, decided by PROXY_BASE_URL
        self.llmClient = createLLMClient(httpClient: httpClient)

        // 8. Crash reporter: Crashlytics if configured, otherwise NoOp
        if FeatureFlags.crashlyticsEnabled && Self.checkCrashlyticsAvailable() {
            self.crashReporter = CrashlyticsCrashReporter()
            AppLogger.info("Crashlytics enabled", category: AppLogger.ui)
        } else {
            self.crashReporter = NoOpCrashReporter()
            AppLogger.info("Crash reporting disabled (NoOp)", category: AppLogger.ui)
        }

        // 9. Rating client: customise copy/thresholds to match your app
        self.ratingClient = DefaultRatingClient(
            config: RatingConfig(
                positiveThreshold: 5.0,
                cooldownDays: 30,
                maxPromptsPerYear: 3,
                minimumActions: 5,
                title: "Enjoying the app?",
                message: "Your feedback helps us improve and build new features. Would you mind leaving a quick rating?",
                acceptTitle: "Rate on App Store",
                declineTitle: "Not now",
                icon: "star.bubble"
            )
        )

        AppLogger.info("CompositionRoot initialized successfully", category: AppLogger.ui)

        #if DEBUG
        _ = DSColors.textPrimary // touch colors to trigger sanity warnings once
        #endif
    }

    // MARK: - Crash reporter lifecycle

    /// Update crash reporter based on user settings
    public func updateCrashReporterFromSettings() async {
        do {
            let settings = try await settingsRepository.load()
            crashReporter.setEnabled(settings.shareDiagnostics)
            AppLogger.info("Crash reporter enabled: \(settings.shareDiagnostics)", category: AppLogger.ui)
        } catch {
            AppLogger.error("Failed to load settings for crash reporter: \(error)", category: AppLogger.ui)
        }
    }

    /// Check if Firebase Crashlytics is available (presence of GoogleService-Info.plist)
    static func checkCrashlyticsAvailable() -> Bool {
        Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil
    }
}
