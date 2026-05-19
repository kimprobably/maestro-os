import XCTest
@testable import SwiftAIBoilerplatePro
import Auth
import Payments

@MainActor
final class ProfileViewModelTests: XCTestCase {
    
    fileprivate var mockAuthClient: MockAuthClient!
    fileprivate var mockPaymentsClient: MockPaymentsClient!
    var viewModel: ProfileViewModel!
    
    override func setUp() async throws {
        try await super.setUp()
        mockAuthClient = MockAuthClient()
        mockPaymentsClient = MockPaymentsClient()
        viewModel = ProfileViewModel(authClient: mockAuthClient, paymentsClient: mockPaymentsClient)
    }
    
    override func tearDown() async throws {
        mockAuthClient = nil
        mockPaymentsClient = nil
        viewModel = nil
        try await super.tearDown()
    }
    
    // MARK: - Initial State Tests
    
    func testInitialState() {
        XCTAssertNil(viewModel.user)
        XCTAssertNil(viewModel.subscriptionStatus)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.showSignOutConfirmation)
        XCTAssertFalse(viewModel.showDeleteAccountConfirmation)
    }
    
    // MARK: - Load Profile Tests
    
    func testLoadProfile_withUser_loadsUserAndSubscription() async {
        // Given
        let testUser = AuthUser(id: "123", email: "test@example.com", name: "Test User")
        mockAuthClient.mockUser = testUser
        mockPaymentsClient.mockState = PaymentsState(
            isSubscribed: true,
            activeEntitlementIDs: ["pro"],
            expirationDate: Date().addingTimeInterval(30 * 24 * 60 * 60) // 30 days
        )
        
        // When
        await viewModel.loadProfile()
        
        // Then
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertEqual(viewModel.user?.id, "123")
        XCTAssertEqual(viewModel.user?.email, "test@example.com")
        XCTAssertNotNil(viewModel.subscriptionStatus)
        XCTAssertTrue(viewModel.subscriptionStatus?.isActive ?? false)
        XCTAssertEqual(viewModel.subscriptionStatus?.planName, "Pro")
    }
    
    func testLoadProfile_withoutSubscription_showsFreeStatus() async {
        // Given
        let testUser = AuthUser(id: "456", email: "free@example.com")
        mockAuthClient.mockUser = testUser
        mockPaymentsClient.mockState = PaymentsState(
            isSubscribed: false,
            activeEntitlementIDs: [],
            expirationDate: nil
        )
        
        // When
        await viewModel.loadProfile()
        
        // Then
        XCTAssertNotNil(viewModel.subscriptionStatus)
        XCTAssertFalse(viewModel.subscriptionStatus?.isActive ?? true)
        XCTAssertEqual(viewModel.subscriptionStatus?.planName, "Free")
        XCTAssertNil(viewModel.subscriptionStatus?.expiryDate)
        XCTAssertFalse(viewModel.subscriptionStatus?.willRenew ?? true)
    }
    
    func testLoadProfile_noUser_completesWithoutError() async {
        // Given
        mockAuthClient.mockUser = nil
        
        // When
        await viewModel.loadProfile()
        
        // Then
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.user)
        XCTAssertNil(viewModel.errorMessage)
    }
    
    // MARK: - Sign Out Tests
    
    func testSignOut_success_completesWithoutError() async {
        // When
        await viewModel.signOut()
        
        // Then
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertTrue(mockAuthClient.signOutCalled)
    }
    
    func testSignOut_failure_setsErrorMessage() async {
        // Given
        mockAuthClient.shouldThrowError = true
        
        // When
        await viewModel.signOut()
        
        // Then
        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertEqual(viewModel.errorMessage, "Failed to sign out. Please try again.")
    }
    
}

// MARK: - Mock Auth Client

private final class MockAuthClient: @unchecked Sendable, AuthClient {
    var mockUser: AuthUser?
    var shouldThrowError = false
    var signOutCalled = false
    
    func currentUser() async -> AuthUser? {
        return mockUser
    }
    
    func signInWithApple() async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }
    
    func signInWithGoogle() async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }
    
    func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }
    
    func signUpWithEmail(email: String, password: String) async throws -> AuthUser {
        throw NSError(domain: "test", code: -1)
    }
    
    func signOut() async throws {
        signOutCalled = true
        if shouldThrowError {
            throw NSError(domain: "test", code: -1)
        }
    }
    
    func resetPassword(email: String) async throws {
        throw NSError(domain: "test", code: -1)
    }
    
    func refreshIfNeeded() async throws {
        // No-op for tests
    }
    
    func authStates() -> AsyncStream<AuthState> {
        AsyncStream { continuation in
            continuation.finish()
        }
    }
}

// MARK: - Mock Payments Client

private final class MockPaymentsClient: @unchecked Sendable, PaymentsClient {
    var mockState = PaymentsState(isSubscribed: false, activeEntitlementIDs: [], expirationDate: nil)
    var restoreReturnsSubscribed = false
    var shouldFailRestore = false
    
    func configure(_ config: PaymentsConfig) {
        // No-op for tests
    }
    
    func currentState() async -> PaymentsState {
        return mockState
    }
    
    func purchase(productID: String) async throws {
        throw NSError(domain: "test", code: -1)
    }
    
    @discardableResult
    func restore() async throws -> PaymentsState {
        if shouldFailRestore {
            throw NSError(domain: "test", code: -1)
        }
        return PaymentsState(isSubscribed: restoreReturnsSubscribed)
    }
    
    func prefetchOfferings() async {
        // No-op for tests
    }
    
    func getOfferings() async throws -> [PaymentsOffering] {
        return []
    }
    
    func states() -> AsyncStream<PaymentsState> {
        AsyncStream { continuation in
            continuation.yield(mockState)
            continuation.finish()
        }
    }
}

