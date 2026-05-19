import Foundation
import SwiftUI
import FeatureChat
import FeatureSettings

@available(iOS 17.0, *)
extension CompositionRoot {

    /// Create ChatViewModel with injected dependencies.
    public func makeChatViewModel(conversationID: UUID) -> ChatViewModel {
        ChatViewModel(
            conversationID: conversationID,
            messageRepository: messageRepository,
            llmClient: llmClient,
            paymentsStatusProvider: PaymentsStatusAdapter(paymentsClient: paymentsClient)
        )
    }

    /// Create DualStyleChatView with UI style switcher.
    public func makeDualStyleChatView(
        conversationID: UUID,
        onRequireSubscription: (() -> Void)? = nil
    ) -> DualStyleChatView {
        let viewModel = makeChatViewModel(conversationID: conversationID)

        return DualStyleChatView(
            viewModel: viewModel,
            onRequireSubscription: onRequireSubscription
        )
    }

    /// Create ChatGPTStyleView with ChatGPT-like UI.
    public func makeChatGPTStyleView(
        conversationID: UUID,
        onRequireSubscription: (() -> Void)? = nil
    ) -> ChatGPTStyleView {
        let viewModel = makeChatViewModel(conversationID: conversationID)

        return ChatGPTStyleView(
            viewModel: viewModel,
            onRequireSubscription: onRequireSubscription
        )
    }

    /// Create SettingsViewModel with injected dependencies.
    public func makeSettingsViewModel() -> SettingsViewModel {
        SettingsViewModel(
            settingsRepository: settingsRepository,
            authClient: sessionManager,
            paymentsClient: paymentsClient
        )
    }

    /// Create ChatHistoryViewModel with injected dependencies.
    public func makeChatHistoryViewModel() -> ChatHistoryViewModel {
        ChatHistoryViewModel(
            conversationRepository: conversationRepository
        ) { [weak self] conversationID, style in
            guard let self = self else { return AnyView(EmptyView()) }

            switch style {
            case .bubbles:
                let viewModel = self.makeChatViewModel(conversationID: conversationID)
                return AnyView(ChatView(viewModel: viewModel, onRequireSubscription: nil))

            case .centered:
                let viewModel = self.makeChatViewModel(conversationID: conversationID)
                return AnyView(ChatGPTStyleView(viewModel: viewModel, onRequireSubscription: nil))
            }
        }
    }

    /// Create HomeViewModel with injected dependencies.
    public func makeHomeViewModel() -> HomeViewModel {
        HomeViewModel(
            conversationRepository: conversationRepository,
            ratingClient: ratingClient
        )
    }

    /// Create ProfileViewModel with injected dependencies.
    public func makeProfileViewModel() -> ProfileViewModel {
        ProfileViewModel(
            authClient: sessionManager,
            paymentsClient: paymentsClient,
            photoStorageClient: profilePhotoStorageClient
        )
    }
}
