#if DEBUG
    import Auth
    import Payments
    import Storage
    import SwiftUI

    @MainActor
    private func createPreviewViewModel() -> SettingsViewModel {
        SettingsViewModel(
            settingsRepository: MockSettingsRepository(),
            authClient: MockAuthClient(),
            paymentsClient: MockPaymentsClient()
        )
    }

    private final class MockSettingsRepository: SettingsRepository, @unchecked Sendable {
        func load() async throws -> SettingsDTO {
            SettingsDTO(theme: .system)
        }

        func save(_: SettingsDTO) async throws {}
    }

    private final class MockAuthClient: AuthClient, @unchecked Sendable {
        func signInWithGoogle() async throws -> Auth.AuthUser {
            Auth.AuthUser(id: "MockID")
        }

        func signUpWithEmail(email _: String, password _: String) async throws -> Auth.AuthUser {
            Auth.AuthUser(id: "MockID")
        }

        func signInWithEmail(email _: String, password _: String) async throws -> Auth.AuthUser {
            Auth.AuthUser(id: "MockID")
        }

        func resetPassword(email _: String) async throws {}
        func signInWithApple() async throws -> AuthUser {
            AuthUser(id: "preview", email: "preview@example.com")
        }

        func signOut() async throws {}
        func currentUser() async -> AuthUser? {
            nil
        }

        func authStates() -> AsyncStream<AuthState> {
            AsyncStream { $0.yield(.unauthenticated) }
        }

        func refreshIfNeeded() async throws {}
    }

    private final class MockPaymentsClient: PaymentsClient, @unchecked Sendable {
        func configure(_: PaymentsConfig) {}
        func states() -> AsyncStream<Payments.PaymentsState> {
            AsyncStream { $0.yield(Payments.PaymentsState(isSubscribed: false)) }
        }

        func currentState() async -> Payments.PaymentsState {
            Payments.PaymentsState(isSubscribed: false)
        }

        func purchase(productID _: String) async throws {}

        @discardableResult
        func restore() async throws -> Payments.PaymentsState {
            Payments.PaymentsState(isSubscribed: false)
        }

        func prefetchOfferings() async {}
        func getOfferings() async throws -> [PaymentsOffering] {
            []
        }
    }

    #Preview("Default") {
        NavigationStack {
            SettingsView(viewModel: createPreviewViewModel())
        }
    }

    #Preview("Pro User") {
        let vm = createPreviewViewModel()
        vm.isSubscribed = true
        return NavigationStack {
            SettingsView(viewModel: vm)
        }
    }

    #Preview("Error") {
        let vm = createPreviewViewModel()
        vm.errorMessage = "Something went wrong"
        vm.isLoading = false
        return NavigationStack {
            SettingsView(viewModel: vm)
        }
    }
#endif
