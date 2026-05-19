import XCTest
@testable import FeatureSettings
import Storage
import Auth
import Payments
import Core

/// Shared base class for every `SettingsViewModel` test file. Provides a
/// fresh view model + fakes per test.
@MainActor
class SettingsViewModelTestCase: XCTestCase {

    var viewModel: SettingsViewModel!
    var fakeSettingsRepo: FakeSettingsRepository!
    var fakeAuthClient: FakeAuthClient!
    var fakePaymentsClient: FakePaymentsClient!

    override func setUp() {
        super.setUp()

        fakeSettingsRepo = FakeSettingsRepository()
        fakeAuthClient = FakeAuthClient()
        fakePaymentsClient = FakePaymentsClient()

        viewModel = SettingsViewModel(
            settingsRepository: fakeSettingsRepo,
            authClient: fakeAuthClient,
            paymentsClient: fakePaymentsClient
        )
    }

    override func tearDown() {
        viewModel = nil
        fakeSettingsRepo = nil
        fakeAuthClient = nil
        fakePaymentsClient = nil
        super.tearDown()
    }
}

// MARK: - Fakes

final class FakeSettingsRepository: SettingsRepository, @unchecked Sendable {
    var storedSettings: SettingsDTO?
    var shouldThrow = false

    func load() async throws -> SettingsDTO {
        if shouldThrow { throw StorageError.notFound }
        return storedSettings ?? SettingsDTO()
    }

    func save(_ settings: SettingsDTO) async throws {
        if shouldThrow { throw StorageError.validation("Test error") }
        storedSettings = settings
    }
}

final class FakeAuthClient: AuthClient, @unchecked Sendable {
    var currentAuthUser: AuthUser?
    var shouldFail = false

    private var stateContinuation: AsyncStream<AuthState>.Continuation?

    func signInWithApple() async throws -> AuthUser {
        if shouldFail { throw AuthError.invalidCredentials }
        let user = AuthUser(id: "123", email: "test@example.com")
        currentAuthUser = user
        return user
    }

    func signInWithGoogle() async throws -> AuthUser {
        if shouldFail { throw AuthError.invalidCredentials }
        let user = AuthUser(id: "123", email: "test@example.com")
        currentAuthUser = user
        return user
    }

    func signUpWithEmail(email: String, password: String) async throws -> AuthUser {
        if shouldFail { throw AuthError.invalidCredentials }
        let user = AuthUser(id: "123", email: email)
        currentAuthUser = user
        return user
    }

    func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        if shouldFail { throw AuthError.invalidCredentials }
        let user = AuthUser(id: "123", email: email)
        currentAuthUser = user
        return user
    }

    func resetPassword(email: String) async throws {
        if shouldFail { throw AuthError.invalidCredentials }
    }

    func signOut() async throws {
        if shouldFail { throw AuthError.server(code: 401, message: "Session expired") }
        currentAuthUser = nil
    }

    func currentUser() async -> AuthUser? {
        currentAuthUser
    }

    func authStates() -> AsyncStream<AuthState> {
        AsyncStream { continuation in
            self.stateContinuation = continuation
            let state: AuthState = currentAuthUser != nil ? .authenticated(currentAuthUser!) : .unauthenticated
            continuation.yield(state)
        }
    }

    func emitStateChange() {
        let state: AuthState = currentAuthUser != nil ? .authenticated(currentAuthUser!) : .unauthenticated
        stateContinuation?.yield(state)
    }

    func refreshIfNeeded() async throws {
        if shouldFail { throw AuthError.server(code: 401, message: "Session expired") }
    }
}

final class FakePaymentsClient: PaymentsClient, @unchecked Sendable {
    var isSubscribed = false
    var shouldFail = false
    var restoreReturnsSubscribed = false

    private var stateContinuation: AsyncStream<PaymentsState>.Continuation?

    func configure(_ config: PaymentsConfig) {}

    func states() -> AsyncStream<PaymentsState> {
        AsyncStream { continuation in
            self.stateContinuation = continuation
            continuation.yield(PaymentsState(isSubscribed: isSubscribed))
        }
    }

    func emitStateChange() {
        stateContinuation?.yield(PaymentsState(isSubscribed: isSubscribed))
    }

    func currentState() async -> PaymentsState {
        PaymentsState(isSubscribed: isSubscribed)
    }

    func purchase(productID: String) async throws {
        if shouldFail { throw PaymentsError.cancelled }
        isSubscribed = true
    }

    @discardableResult
    func restore() async throws -> PaymentsState {
        if shouldFail { throw PaymentsError.network(underlying: NSError(domain: "Test", code: -1)) }
        let restoredState = PaymentsState(isSubscribed: restoreReturnsSubscribed)
        isSubscribed = restoreReturnsSubscribed
        return restoredState
    }

    func prefetchOfferings() async {}

    func getOfferings() async throws -> [PaymentsOffering] {
        if shouldFail { throw PaymentsError.network(underlying: NSError(domain: "Test", code: -1)) }
        return []
    }
}
