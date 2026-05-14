import Auth
import Core
import FeatureChat
import FeatureRating
import Payments
import Storage
import SwiftUI

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
        authClient = compositionRoot.sessionManager
        paymentsClient = compositionRoot.paymentsClient
        conversationRepository = compositionRoot.conversationRepository
        messageRepository = compositionRoot.messageRepository
        settingsRepository = compositionRoot.settingsRepository
        llmClient = compositionRoot.llmClient
        ratingClient = compositionRoot.ratingClient
        proxyBaseURL = compositionRoot.proxyBaseURL
    }
}

public extension EnvironmentValues {
    // Access app environment from SwiftUI views
    @Entry var appEnv: AppEnvironment?
}

// MARK: - View Extension

public extension View {
    /// Inject app environment into view hierarchy
    func appEnvironment(_ environment: AppEnvironment) -> some View {
        self.environment(\.appEnv, environment)
    }
}
