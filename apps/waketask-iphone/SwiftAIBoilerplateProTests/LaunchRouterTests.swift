import Auth
import Storage
@testable import SwiftAIBoilerplatePro
import XCTest

@MainActor
final class LaunchRouterTests: XCTestCase {
    fileprivate var mockAuthClient: MockAuthClient!
    fileprivate var mockSettingsRepository: MockSettingsRepository!
    var router: LaunchRouter!

    override func setUp() async throws {
        try await super.setUp()
        mockAuthClient = MockAuthClient()
        mockSettingsRepository = MockSettingsRepository()
        router = LaunchRouter(authClient: mockAuthClient, settingsRepository: mockSettingsRepository)
    }

    override func tearDown() async throws {
        router.stop()
        mockAuthClient = nil
        mockSettingsRepository = nil
        router = nil
        try await super.tearDown()
    }

    // MARK: - Initial State Tests

    func testInitialState() {
        XCTAssertEqual(router.destination, .signIn)
        XCTAssertFalse(router.shouldShowOnboarding)
    }

    // MARK: - Start with Authenticated User Tests

    func testStart_withAuthenticatedUser_setsMainDestination() async {
        // Given
        let testUser = AuthUser(id: "123", email: "test@example.com")
        mockAuthClient.mockUser = testUser
        mockSettingsRepository.mockSettings = SettingsDTO(hasSeenOnboarding: true)

        // When
        await router.start()

        // Then
        XCTAssertEqual(router.destination, .main)
        XCTAssertFalse(router.shouldShowOnboarding)
    }

    func testStart_withUnauthenticatedUser_setsSignInDestination() async {
        // Given
        mockAuthClient.mockUser = nil
        mockSettingsRepository.mockSettings = SettingsDTO(hasSeenOnboarding: true)

        // When
        await router.start()

        // Then
        XCTAssertEqual(router.destination, .signIn)
        XCTAssertFalse(router.shouldShowOnboarding)
    }

    // MARK: - Onboarding Tests

    func testStart_firstLaunch_showsOnboarding() async {
        // Given
        mockAuthClient.mockUser = nil
        mockSettingsRepository.mockSettings = SettingsDTO(hasSeenOnboarding: false)

        // When
        await router.start()

        // Then
        XCTAssertTrue(router.shouldShowOnboarding)
        XCTAssertEqual(router.destination, .signIn)
    }

    func testStart_noSettings_showsOnboarding() async {
        // Given
        mockAuthClient.mockUser = nil
        mockSettingsRepository.shouldThrowError = true

        // When
        await router.start()

        // Then
        XCTAssertTrue(router.shouldShowOnboarding)
        XCTAssertEqual(router.destination, .signIn)
    }

    func testCompleteOnboarding_hidesOnboarding() async {
        // Given
        mockSettingsRepository.mockSettings = SettingsDTO(hasSeenOnboarding: false)
        await router.start()
        XCTAssertTrue(router.shouldShowOnboarding)

        // When
        await router.completeOnboarding()

        // Then
        XCTAssertFalse(router.shouldShowOnboarding)
        XCTAssertTrue(mockSettingsRepository.savedSettings?.hasSeenOnboarding ?? false)
    }

    func testCompleteOnboarding_noExistingSettings_createsNewSettings() async {
        // Given
        mockSettingsRepository.shouldThrowError = true
        await router.start()
        mockSettingsRepository.shouldThrowError = false // Allow save

        // When
        await router.completeOnboarding()

        // Then
        XCTAssertFalse(router.shouldShowOnboarding)
        XCTAssertNotNil(mockSettingsRepository.savedSettings)
        XCTAssertTrue(mockSettingsRepository.savedSettings?.hasSeenOnboarding ?? false)
    }

    // MARK: - Auth State Observation Tests

    func testAuthStateChange_toAuthenticated_updatesDestination() async {
        // Given
        mockAuthClient.mockUser = nil
        await router.start()
        XCTAssertEqual(router.destination, .signIn)

        // When
        let testUser = AuthUser(id: "new-user", email: "new@example.com")
        mockAuthClient.emitAuthState(.authenticated(testUser))

        // Give time for async state observation
        try? await Task.sleep(nanoseconds: 50_000_000) // 50ms

        // Then
        XCTAssertEqual(router.destination, .main)
    }

    func testAuthStateChange_toUnauthenticated_updatesDestination() async {
        // Given
        let testUser = AuthUser(id: "123", email: "test@example.com")
        mockAuthClient.mockUser = testUser
        await router.start()
        XCTAssertEqual(router.destination, .main)

        // When
        mockAuthClient.emitAuthState(.unauthenticated)

        // Give time for async state observation
        try? await Task.sleep(nanoseconds: 50_000_000) // 50ms

        // Then
        XCTAssertEqual(router.destination, .signIn)
    }

    func testAuthStateChange_refreshing_doesNotChangeDestination() async {
        // Given
        let testUser = AuthUser(id: "123", email: "test@example.com")
        mockAuthClient.mockUser = testUser
        await router.start()
        let initialDestination = router.destination

        // When
        mockAuthClient.emitAuthState(.refreshing)

        // Give time for async state observation
        try? await Task.sleep(nanoseconds: 50_000_000) // 50ms

        // Then
        XCTAssertEqual(router.destination, initialDestination)
    }

    // MARK: - Stop Tests

    func testStop_cancelsAuthStateObservation() async {
        // Given
        await router.start()

        // When
        router.stop()

        // Then - Should not crash or leak
        // Verify by trying to emit state after stop
        mockAuthClient.emitAuthState(.unauthenticated)
        try? await Task.sleep(nanoseconds: 50_000_000) // 50ms
        // No assertion needed - just verifying no crash
    }
}

// MARK: - Mock Auth Client

private final class MockAuthClient: @unchecked Sendable, AuthClient {
    var mockUser: AuthUser?
    private var continuation: AsyncStream<AuthState>.Continuation?

    func currentUser() async -> AuthUser? {
        mockUser
    }

    func signInWithApple() async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }

    func signInWithGoogle() async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }

    func signInWithEmail(email _: String, password _: String) async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }

    func signUpWithEmail(email _: String, password _: String) async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }

    func signOut() async throws {
        throw NSError(domain: "test", code: -1)
    }

    func resetPassword(email _: String) async throws {
        throw NSError(domain: "test", code: -1)
    }

    func refreshIfNeeded() async throws {
        // No-op
    }

    func authStates() -> AsyncStream<AuthState> {
        AsyncStream { continuation in
            self.continuation = continuation
        }
    }

    func emitAuthState(_ state: AuthState) {
        continuation?.yield(state)
    }
}

// MARK: - Mock Settings Repository

private final class MockSettingsRepository: @unchecked Sendable, SettingsRepository {
    var mockSettings: SettingsDTO?
    var savedSettings: SettingsDTO?
    var shouldThrowError = false

    func load() async throws -> SettingsDTO {
        if shouldThrowError {
            throw NSError(domain: "test", code: -1, userInfo: [NSLocalizedDescriptionKey: "No settings found"])
        }
        guard let settings = mockSettings else {
            throw NSError(domain: "test", code: -1, userInfo: [NSLocalizedDescriptionKey: "No settings found"])
        }
        return settings
    }

    func save(_ settings: SettingsDTO) async throws {
        if shouldThrowError {
            throw NSError(domain: "test", code: -1)
        }
        savedSettings = settings
    }
}
