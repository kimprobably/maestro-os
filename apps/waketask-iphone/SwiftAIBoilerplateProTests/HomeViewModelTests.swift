import XCTest
@testable import SwiftAIBoilerplatePro
import Storage

@MainActor
final class HomeViewModelTests: XCTestCase {
    
    fileprivate var mockRepository: MockConversationRepository!
    var viewModel: HomeViewModel!
    
    override func setUp() async throws {
        try await super.setUp()
        mockRepository = MockConversationRepository()
        viewModel = HomeViewModel(conversationRepository: mockRepository)
    }
    
    override func tearDown() async throws {
        mockRepository = nil
        viewModel = nil
        try await super.tearDown()
    }
    
    // MARK: - Initial State Tests
    
    func testInitialState() {
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertTrue(viewModel.recentConversations.isEmpty)
        XCTAssertNil(viewModel.userName)
    }
    
    // MARK: - Load Data Tests
    
    func testLoadData_success_populatesConversations() async {
        // Given
        let conversation1 = ConversationDTO(
            id: UUID(),
            title: "Chat 1",
            createdAt: Date(),
            updatedAt: Date(),
            personaName: nil
        )
        let conversation2 = ConversationDTO(
            id: UUID(),
            title: "Chat 2",
            createdAt: Date(),
            updatedAt: Date(),
            personaName: "Assistant"
        )
        mockRepository.conversations = [conversation1, conversation2]
        
        // When
        await viewModel.loadData()
        
        // Then
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertEqual(viewModel.recentConversations.count, 2)
        XCTAssertEqual(viewModel.recentConversations[0].title, "Chat 1")
        XCTAssertEqual(viewModel.recentConversations[1].title, "Chat 2")
    }
    
    func testLoadData_failure_setsErrorMessage() async {
        // Given
        mockRepository.shouldThrowError = true
        
        // When
        await viewModel.loadData()
        
        // Then
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertEqual(viewModel.errorMessage, "Failed to load recent activity")
        XCTAssertTrue(viewModel.recentConversations.isEmpty)
    }
    
    func testLoadData_setsLoadingState() async {
        // Given
        let conversation = ConversationDTO(
            id: UUID(),
            title: "Chat",
            createdAt: Date(),
            updatedAt: Date(),
            personaName: nil
        )
        mockRepository.conversations = [conversation]
        
        // When
        let task = Task {
            await viewModel.loadData()
        }
        
        // Give time for loading state to be set
        try? await Task.sleep(nanoseconds: 10_000_000) // 10ms
        
        await task.value
        
        // Then - loading should be false after completion
        XCTAssertFalse(viewModel.isLoading)
    }
    
    // MARK: - Refresh Tests
    
    func testRefresh_reloadsData() async {
        // Given
        let conversation = ConversationDTO(
            id: UUID(),
            title: "New Chat",
            createdAt: Date(),
            updatedAt: Date(),
            personaName: nil
        )
        mockRepository.conversations = [conversation]
        
        // When
        await viewModel.refresh()
        
        // Then
        XCTAssertEqual(viewModel.recentConversations.count, 1)
        XCTAssertEqual(viewModel.recentConversations[0].title, "New Chat")
    }
    
    // MARK: - User Name Tests
    
    func testSetUserName_updatesUserName() {
        // Given
        let name = "John Doe"
        
        // When
        viewModel.setUserName(name)
        
        // Then
        XCTAssertEqual(viewModel.userName, name)
    }
    
    func testSetUserName_canSetToNil() {
        // Given
        viewModel.setUserName("Initial Name")
        
        // When
        viewModel.setUserName(nil)
        
        // Then
        XCTAssertNil(viewModel.userName)
    }
    
    // MARK: - Quick Actions Tests
    
    func testHandleQuickAction_logsAction() {
        // When - This should not crash
        viewModel.handleQuickAction(.newChat)
        viewModel.handleQuickAction(.history)
        viewModel.handleQuickAction(.settings)
        
        // Then - no assertion needed, just verifying no crash
    }
}

// MARK: - Mock Repository

private final class MockConversationRepository: @unchecked Sendable, ConversationRepository {
    var conversations: [ConversationDTO] = []
    var shouldThrowError = false
    
    func create(title: String, personaName: String?) async throws -> ConversationDTO {
        if shouldThrowError {
            throw NSError(domain: "test", code: -1)
        }
        let conversation = ConversationDTO(
            id: UUID(),
            title: title,
            createdAt: Date(),
            updatedAt: Date(),
            personaName: personaName
        )
        conversations.append(conversation)
        return conversation
    }
    
    func rename(id: UUID, title: String) async throws {
        if shouldThrowError {
            throw NSError(domain: "test", code: -1)
        }
    }
    
    func delete(id: UUID) async throws {
        if shouldThrowError {
            throw NSError(domain: "test", code: -1)
        }
        conversations.removeAll { $0.id == id }
    }
    
    func list(limit: Int, after: Date?) async throws -> [ConversationDTO] {
        if shouldThrowError {
            throw NSError(domain: "test", code: -1)
        }
        return Array(conversations.prefix(limit))
    }
}

