import FeatureChat
import FeatureSettings
import Foundation
import SwiftUI

@available(iOS 17.0, *)
public extension CompositionRoot {
    /// Create ChatViewModel with injected dependencies.
    func makeChatViewModel(conversationID: UUID) -> ChatViewModel {
        ChatViewModel(
            conversationID: conversationID,
            messageRepository: messageRepository,
            llmClient: llmClient,
            paymentsStatusProvider: PaymentsStatusAdapter(paymentsClient: paymentsClient)
        )
    }

    /// Create DualStyleChatView with UI style switcher.
    func makeDualStyleChatView(
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
    func makeChatGPTStyleView(
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
    func makeSettingsViewModel() -> SettingsViewModel {
        SettingsViewModel(
            settingsRepository: settingsRepository,
            authClient: sessionManager,
            paymentsClient: paymentsClient
        )
    }

    /// Create ChatHistoryViewModel with injected dependencies.
    func makeChatHistoryViewModel() -> ChatHistoryViewModel {
        ChatHistoryViewModel(
            conversationRepository: conversationRepository
        ) { [weak self] conversationID, style in
            guard let self else { return AnyView(EmptyView()) }

            switch style {
            case .bubbles:
                let viewModel = makeChatViewModel(conversationID: conversationID)
                return AnyView(ChatView(viewModel: viewModel, onRequireSubscription: nil))

            case .centered:
                let viewModel = makeChatViewModel(conversationID: conversationID)
                return AnyView(ChatGPTStyleView(viewModel: viewModel, onRequireSubscription: nil))
            }
        }
    }

    /// Create HomeViewModel with injected dependencies.
    func makeHomeViewModel() -> HomeViewModel {
        HomeViewModel(
            conversationRepository: conversationRepository,
            ratingClient: ratingClient
        )
    }

    /// Create WakeFlowViewModel with injected dependencies.
    func makeWakeFlowViewModel() -> WakeFlowViewModel {
        WakeFlowViewModel(
            alarmRepository: wakeAlarmRepository,
            runRepository: wakeRunRepository,
            missionEngine: wakeMissionEngine
        )
    }

    /// Create ProfileViewModel with injected dependencies.
    func makeProfileViewModel() -> ProfileViewModel {
        ProfileViewModel(
            authClient: sessionManager,
            paymentsClient: paymentsClient,
            photoStorageClient: profilePhotoStorageClient
        )
    }
}
