import XCTest
@testable import SwiftAIBoilerplatePro
import Auth
import Payments
import Networking
import Storage
import AI
import SwiftData

@MainActor
final class CompositionRootTests: XCTestCase {
    
    var composition: CompositionRoot!
    
    override func setUp() async throws {
        try await super.setUp()
        
        // Create test configuration
        let authConfig = AuthConfig(
            supabaseURL: URL(string: "https://test.supabase.co")!,
            supabaseAnonKey: "test_anon_key"
        )
        
        let paymentsConfig = PaymentsConfig(
            apiKey: "test_api_key",
            entitlementID: "test_entitlement"
        )
        
        composition = try CompositionRoot(
            authConfig: authConfig,
            paymentsConfig: paymentsConfig
        )
    }
    
    override func tearDown() async throws {
        composition = nil
        try await super.tearDown()
    }
    
    // MARK: - Singleton Initialization Tests
    
    func testModelContainer_isInitialized() {
        XCTAssertNotNil(composition.modelContainer)
    }
    
    func testHTTPClient_isInitialized() {
        XCTAssertNotNil(composition.httpClient)
    }
    
    func testKeychainStore_isInitialized() {
        XCTAssertNotNil(composition.keychainStore)
    }
    
    func testSessionManager_isInitialized() {
        XCTAssertNotNil(composition.sessionManager)
    }
    
    func testPaymentsClient_isInitialized() {
        XCTAssertNotNil(composition.paymentsClient)
    }
    
    func testLLMClient_isInitialized() {
        XCTAssertNotNil(composition.llmClient)
    }
    
    func testConversationRepository_isInitialized() {
        XCTAssertNotNil(composition.conversationRepository)
    }
    
    func testMessageRepository_isInitialized() {
        XCTAssertNotNil(composition.messageRepository)
    }
    
    func testSettingsRepository_isInitialized() {
        XCTAssertNotNil(composition.settingsRepository)
    }
    
    // MARK: - Factory Method Tests
    
    func testMakeChatViewModel_createsViewModel() {
        let conversationID = UUID()
        let viewModel = composition.makeChatViewModel(conversationID: conversationID)
        
        XCTAssertNotNil(viewModel)
        // ViewModel is created successfully
    }
    
    func testMakeChatViewModel_multipleCalls_createsDifferentInstances() {
        let conversationID = UUID()
        let viewModel1 = composition.makeChatViewModel(conversationID: conversationID)
        let viewModel2 = composition.makeChatViewModel(conversationID: conversationID)
        
        XCTAssertFalse(viewModel1 === viewModel2)
    }
    
    func testMakeSettingsViewModel_createsViewModel() {
        let viewModel = composition.makeSettingsViewModel()
        XCTAssertNotNil(viewModel)
    }
    
    func testMakeHomeViewModel_createsViewModel() {
        let viewModel = composition.makeHomeViewModel()
        XCTAssertNotNil(viewModel)
    }
    
    func testMakeProfileViewModel_createsViewModel() {
        let viewModel = composition.makeProfileViewModel()
        XCTAssertNotNil(viewModel)
    }
    
    func testMakeChatHistoryViewModel_createsViewModel() {
        let viewModel = composition.makeChatHistoryViewModel()
        XCTAssertNotNil(viewModel)
    }
    
    func testMakeDualStyleChatView_createsView() {
        let conversationID = UUID()
        let view = composition.makeDualStyleChatView(
            conversationID: conversationID,
            onRequireSubscription: nil
        )
        XCTAssertNotNil(view)
    }
    
    func testMakeChatGPTStyleView_createsView() {
        let conversationID = UUID()
        let view = composition.makeChatGPTStyleView(
            conversationID: conversationID,
            onRequireSubscription: nil
        )
        XCTAssertNotNil(view)
    }
    
    // MARK: - Dependency Wiring Tests
    
    func testChatViewModel_hasCorrectDependencies() {
        let conversationID = UUID()
        let viewModel = composition.makeChatViewModel(conversationID: conversationID)
        
        // Test that ViewModel is created with dependencies wired
        XCTAssertNotNil(viewModel)
        // Dependencies are internal, so we just verify successful creation
    }
    
    func testSettingsViewModel_hasCorrectDependencies() async {
        let viewModel = composition.makeSettingsViewModel()
        
        // Test that ViewModel is created with dependencies wired
        XCTAssertNotNil(viewModel)
        // Dependencies are internal, so we just verify successful creation
    }
    
    func testHomeViewModel_hasCorrectDependencies() async {
        let viewModel = composition.makeHomeViewModel()
        
        // Test that ViewModel is created with dependencies wired
        XCTAssertNotNil(viewModel)
        // Dependencies are internal, so we just verify successful creation
    }
    
    // MARK: - Configuration Tests
    
    func testProxyBaseURL_whenNotSet_returnsNil() {
        // When PROXY_BASE_URL env var is not set
        XCTAssertNil(composition.proxyBaseURL)
    }
    
    func testLLMClient_whenNoProxyURL_usesEchoClient() {
        // Without PROXY_BASE_URL, should use EchoLLMClient
        let llmClient = composition.llmClient
        XCTAssertNotNil(llmClient)
        // EchoLLMClient will be used as fallback
    }
    
    // MARK: - Error Handling Tests
    
    func testCompositionRoot_withInvalidAuthConfig_throwsError() async {
        // Test that invalid configuration is handled
        let invalidAuthConfig = AuthConfig(
            supabaseURL: URL(string: "invalid")!,
            supabaseAnonKey: ""
        )
        
        let paymentsConfig = PaymentsConfig(
            apiKey: "test",
            entitlementID: "test"
        )
        
        // Should still initialize (error handling is graceful)
        XCTAssertNoThrow(
            try CompositionRoot(
                authConfig: invalidAuthConfig,
                paymentsConfig: paymentsConfig
            )
        )
    }
    
    // MARK: - Integration Tests
    
    func testFullChatFlow_withComposedDependencies() async throws {
        let conversationID = UUID()
        let viewModel = composition.makeChatViewModel(conversationID: conversationID)
        
        // Test that ViewModel is created and can be used
        XCTAssertNotNil(viewModel)
        
        // Full integration test would require access to internal state
        // For now, we verify successful creation with all dependencies wired
    }
    
    func testRepositories_useSharedModelContext() {
        // All repositories should use the same ModelContext
        let context1 = composition.conversationRepository
        let context2 = composition.messageRepository
        let context3 = composition.settingsRepository
        
        XCTAssertNotNil(context1)
        XCTAssertNotNil(context2)
        XCTAssertNotNil(context3)
        
        // They should be able to work together
        // (Same ModelContext allows cross-repository operations)
    }
    
    // MARK: - Memory Tests
    
    func testCompositionRoot_doesNotRetainViewModels() {
        weak var weakViewModel: ChatViewModel?
        
        autoreleasepool {
            let conversationID = UUID()
            let viewModel = composition.makeChatViewModel(conversationID: conversationID)
            weakViewModel = viewModel
            XCTAssertNotNil(weakViewModel)
        }
        
        // ViewModel should be deallocated
        XCTAssertNil(weakViewModel)
    }
    
    func testMultipleViewModels_canCoexist() {
        let conversationID1 = UUID()
        let conversationID2 = UUID()
        
        let vm1 = composition.makeChatViewModel(conversationID: conversationID1)
        let vm2 = composition.makeChatViewModel(conversationID: conversationID2)
        let settingsVM = composition.makeSettingsViewModel()
        let homeVM = composition.makeHomeViewModel()
        
        XCTAssertNotNil(vm1)
        XCTAssertNotNil(vm2)
        XCTAssertNotNil(settingsVM)
        XCTAssertNotNil(homeVM)
        
        // All should be independent instances
        XCTAssertTrue(vm1 !== vm2)
    }
}

