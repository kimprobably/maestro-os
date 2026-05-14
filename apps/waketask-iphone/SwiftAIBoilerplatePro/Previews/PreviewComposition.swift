#if DEBUG
    import Auth
    import Core
    import FeatureChat
    import FeatureSettings
    import Foundation
    import Storage
    import SwiftUI

    /// Composition helpers for SwiftUI previews
    @MainActor
    enum PreviewComposition {
        /// Create ChatViewModel with preview mocks
        static func chatVM() -> ChatViewModel {
            ChatViewModel(
                conversationID: UUID(),
                messageRepository: PreviewMocks.MockMessageRepository(),
                llmClient: PreviewMocks.MockLLMClient()
            )
        }

        /// Create ChatHistoryViewModel with preview mocks
        @available(iOS 17.0, *)
        static func chatHistoryVM() -> ChatHistoryViewModel {
            ChatHistoryViewModel(
                conversationRepository: PreviewMocks.MockConversationRepository()
            ) { _, style in
                let vm = chatVM()
                // Return appropriate view based on style
                switch style {
                case .bubbles:
                    return AnyView(ChatView(viewModel: vm, onRequireSubscription: nil))
                case .centered:
                    return AnyView(ChatGPTStyleView(viewModel: vm, onRequireSubscription: nil))
                }
            }
        }

        /// Create SettingsViewModel with preview mocks
        static func settingsVM() -> SettingsViewModel {
            SettingsViewModel(
                settingsRepository: PreviewMocks.MockSettingsRepository(),
                authClient: PreviewMocks.MockAuthClient(),
                paymentsClient: PreviewMocks.MockPaymentsClient()
            )
        }

        static func wakeFlowVM() -> WakeFlowViewModel {
            WakeFlowViewModel(
                alarmRepository: PreviewMocks.MockWakeAlarmRepository(),
                runRepository: PreviewMocks.MockWakeRunRepository(),
                missionEngine: PreviewMocks.MockWakeMissionEngine()
            )
        }

        /// Create mock AuthClient for previews
        static func mockAuthClient() -> AuthClient {
            PreviewMocks.MockAuthClient()
        }
    }
#endif
