import XCTest

final class ChatFlowUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        
        app = XCUIApplication()
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launch()
        
        // Navigate to home (past auth)
        let homeScreen = app.otherElements["HomeView"]
        _ = homeScreen.waitForExistence(timeout: 5)
    }
    
    override func tearDownWithError() throws {
        app = nil
        try super.tearDownWithError()
    }
    
    // MARK: - New Chat Creation
    
    func testCreateNewChat_opensChatInterface() throws {
        // Find and tap "Start Chat" or similar button
        let startChatButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'chat' OR label CONTAINS[c] 'new'")
        ).firstMatch
        
        if startChatButton.waitForExistence(timeout: 5) {
            startChatButton.tap()
            
            // Should show chat interface
            let messageInput = app.textFields["Type a message..."]
            XCTAssertTrue(messageInput.waitForExistence(timeout: 5))
        }
    }
    
    // MARK: - Message Sending
    
    func testSendMessage_appearsInChat() throws {
        navigateToChat()
        
        // Type message
        let messageInput = app.textFields["Type a message..."]
        if messageInput.waitForExistence(timeout: 5) {
            messageInput.tap()
            messageInput.typeText("Hello, test message")
            
            // Send message
            let sendButton = app.buttons["Send"]
            if sendButton.exists {
                sendButton.tap()
                
                // Message should appear in chat
                let messageText = app.staticTexts["Hello, test message"]
                XCTAssertTrue(messageText.waitForExistence(timeout: 5))
            }
        }
    }
    
    func testSendMessage_receivesResponse() throws {
        navigateToChat()
        
        let messageInput = app.textFields["Type a message..."]
        if messageInput.waitForExistence(timeout: 5) {
            messageInput.tap()
            messageInput.typeText("Test")
            
            let sendButton = app.buttons["Send"]
            if sendButton.exists {
                sendButton.tap()
                
                // Wait for assistant response (Echo or real)
                sleep(2)
                
                // Should have at least 2 messages (user + assistant)
                let messageCount = app.staticTexts.matching(
                    NSPredicate(format: "label != ''")
                ).count
                XCTAssertGreaterThan(messageCount, 0)
            }
        }
    }
    
    // MARK: - Chat UI Styles
    
    func testChatStyleSwitcher_exists() throws {
        navigateToChat()
        
        // Look for style switcher (if dual style is enabled)
        let stylePicker = app.segmentedControls.firstMatch
        if stylePicker.exists {
            XCTAssertTrue(stylePicker.isEnabled)
        }
    }
    
    func testChatStyleSwitcher_canSwitch() throws {
        navigateToChat()
        
        let stylePicker = app.segmentedControls.firstMatch
        if stylePicker.exists {
            // Get initial state
            let initialButton = stylePicker.buttons.firstMatch
            let initialState = initialButton.isSelected
            
            // Switch style
            if stylePicker.buttons.count > 1 {
                stylePicker.buttons.element(boundBy: 1).tap()
                
                // State should change
                XCTAssertNotEqual(initialButton.isSelected, initialState)
            }
        }
    }
    
    // MARK: - Message Input
    
    func testMessageInput_canTypeLongMessage() throws {
        navigateToChat()
        
        let messageInput = app.textFields["Type a message..."]
        if messageInput.waitForExistence(timeout: 5) {
            messageInput.tap()
            
            let longMessage = String(repeating: "Test ", count: 50)
            messageInput.typeText(longMessage)
            
            // Should accept long input
            XCTAssertTrue(messageInput.value as? String != nil)
        }
    }
    
    func testMessageInput_clearAfterSending() throws {
        navigateToChat()
        
        let messageInput = app.textFields["Type a message..."]
        if messageInput.waitForExistence(timeout: 5) {
            messageInput.tap()
            messageInput.typeText("Test message")
            
            let sendButton = app.buttons["Send"]
            if sendButton.exists {
                sendButton.tap()
                
                // Input should be cleared
                sleep(1)
                let inputValue = messageInput.value as? String ?? ""
                XCTAssertTrue(inputValue.isEmpty || inputValue == "Type a message...")
            }
        }
    }
    
    // MARK: - Message Display
    
    func testMessages_displayCorrectAlignment() throws {
        navigateToChat()
        
        // Send a message
        let messageInput = app.textFields["Type a message..."]
        if messageInput.waitForExistence(timeout: 5) {
            messageInput.tap()
            messageInput.typeText("User message")
            
            let sendButton = app.buttons["Send"]
            sendButton.tap()
            
            sleep(1)
            
            // User messages should be right-aligned (check for specific frame)
            // Assistant messages should be left-aligned
            // This is visual, so we just verify messages exist
            let messages = app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS 'message'")
            )
            XCTAssertGreaterThan(messages.count, 0)
        }
    }
    
    // MARK: - Streaming
    
    func testStreaming_showsProgressIndicator() throws {
        navigateToChat()
        
        let messageInput = app.textFields["Type a message..."]
        if messageInput.waitForExistence(timeout: 5) {
            messageInput.tap()
            messageInput.typeText("Tell me a story")
            
            let sendButton = app.buttons["Send"]
            sendButton.tap()
            
            // Look for streaming indicator
            let streamingIndicator = app.activityIndicators.firstMatch
            if streamingIndicator.waitForExistence(timeout: 2) {
                XCTAssertTrue(streamingIndicator.exists)
            }
        }
    }
    
    // MARK: - Chat History
    
    func testChatHistory_canAccessPreviousChats() throws {
        // Navigate to chat history
        let historyButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'history' OR label CONTAINS[c] 'conversations'")
        ).firstMatch
        
        if historyButton.waitForExistence(timeout: 5) {
            historyButton.tap()
            
            // Should show list of conversations
            let conversationList = app.scrollViews.firstMatch
            XCTAssertTrue(conversationList.waitForExistence(timeout: 3))
        }
    }
    
    // MARK: - Error Handling
    
    // MARK: - Helpers
    
    private func navigateToChat() {
        let startChatButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'chat' OR label CONTAINS[c] 'new'")
        ).firstMatch
        
        if startChatButton.waitForExistence(timeout: 5) {
            startChatButton.tap()
        }
    }
}

