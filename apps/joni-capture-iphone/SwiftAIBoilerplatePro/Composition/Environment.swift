import SwiftUI
import Core
import Auth
import Payments
import Storage
import FeatureChat
import FeatureRating

/// App-wide environment exposing dependencies to SwiftUI views
@MainActor
@available(iOS 17.0, *)
public struct AppEnvironment {
    
    /// Auth client for authentication flows
    public let authClient: any AuthClient

    /// Payments client for subscription management
    public let paymentsClient: any PaymentsClient

    /// Conversation repository
    public let conversationRepository: any ConversationRepository

    /// Message repository
    public let messageRepository: any MessageRepository

    /// Settings repository
    public let settingsRepository: any SettingsRepository

    /// LLM client for AI interactions
    public let llmClient: any LLMClient

    /// Rating client for app review prompts
    public let ratingClient: any RatingClient
    
    /// Composition root for creating view models
    public let compositionRoot: CompositionRoot
    
    /// Proxy base URL for device token uploads
    public let proxyBaseURL: URL?
    
    /// Initialize environment from composition root
    public init(compositionRoot: CompositionRoot) {
        self.compositionRoot = compositionRoot
        self.authClient = compositionRoot.sessionManager
        self.paymentsClient = compositionRoot.paymentsClient
        self.conversationRepository = compositionRoot.conversationRepository
        self.messageRepository = compositionRoot.messageRepository
        self.settingsRepository = compositionRoot.settingsRepository
        self.llmClient = compositionRoot.llmClient
        self.ratingClient = compositionRoot.ratingClient
        self.proxyBaseURL = compositionRoot.proxyBaseURL
    }
}

// MARK: - SwiftUI Environment Key

private struct AppEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppEnvironment? = nil
}

extension EnvironmentValues {
    /// Access app environment from SwiftUI views
    public var appEnv: AppEnvironment? {
        get { self[AppEnvironmentKey.self] }
        set { self[AppEnvironmentKey.self] = newValue }
    }
}

// MARK: - View Extension

extension View {
    /// Inject app environment into view hierarchy
    public func appEnvironment(_ environment: AppEnvironment) -> some View {
        self.environment(\.appEnv, environment)
    }
}
