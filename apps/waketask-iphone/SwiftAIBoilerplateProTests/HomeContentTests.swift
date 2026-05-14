import XCTest
@testable import SwiftAIBoilerplatePro

final class HomeContentTests: XCTestCase {
    
    // MARK: - FeatureItem Tests
    
    func testFeatureItem_initialization() {
        let id = UUID()
        let item = HomeContent.FeatureItem(
            id: id,
            title: "Test Feature",
            description: "Test Description",
            systemImage: "star.fill",
            accentColor: "blue"
        )
        
        XCTAssertEqual(item.id, id)
        XCTAssertEqual(item.title, "Test Feature")
        XCTAssertEqual(item.description, "Test Description")
        XCTAssertEqual(item.systemImage, "star.fill")
        XCTAssertEqual(item.accentColor, "blue")
    }
    
    func testFeatureItem_defaultAccentColor() {
        let item = HomeContent.FeatureItem(
            title: "Test",
            description: "Description",
            systemImage: "star"
        )
        
        XCTAssertEqual(item.accentColor, "blue")
    }
    
    func testFeatureItem_defaults_hasExpectedCount() {
        let defaults = HomeContent.FeatureItem.defaults
        
        XCTAssertEqual(defaults.count, 4)
    }
    
    func testFeatureItem_defaults_containsExpectedItems() {
        let defaults = HomeContent.FeatureItem.defaults
        let titles = defaults.map { $0.title }
        
        XCTAssertTrue(titles.contains("Adaptive Mission Rotation"))
        XCTAssertTrue(titles.contains("Post-Dismiss Wake Check"))
        XCTAssertTrue(titles.contains("Reliability Ledger"))
        XCTAssertTrue(titles.contains("First-Task Bridge"))
    }
    
    func testFeatureItem_equatable() {
        let id = UUID()
        let item1 = HomeContent.FeatureItem(id: id, title: "Test", description: "Desc", systemImage: "star")
        let item2 = HomeContent.FeatureItem(id: id, title: "Test", description: "Desc", systemImage: "star")
        
        XCTAssertEqual(item1, item2)
    }
    
    // MARK: - QuickAction Tests
    
    func testQuickAction_initialization() {
        let id = UUID()
        let action = HomeContent.QuickAction(
            id: id,
            title: "New Chat",
            systemImage: "plus.message.fill",
            accentColor: "blue",
            action: .newChat
        )
        
        XCTAssertEqual(action.id, id)
        XCTAssertEqual(action.title, "New Chat")
        XCTAssertEqual(action.systemImage, "plus.message.fill")
        XCTAssertEqual(action.accentColor, "blue")
        XCTAssertEqual(action.action, .newChat)
    }
    
    func testQuickAction_allActionTypes() {
        XCTAssertEqual(HomeContent.QuickAction.ActionType.newChat, .newChat)
        XCTAssertEqual(HomeContent.QuickAction.ActionType.history, .history)
        XCTAssertEqual(HomeContent.QuickAction.ActionType.upgrade, .upgrade)
        XCTAssertEqual(HomeContent.QuickAction.ActionType.settings, .settings)
    }
    
    func testQuickAction_defaults_hasExpectedCount() {
        let defaults = HomeContent.QuickAction.defaults
        
        XCTAssertEqual(defaults.count, 4)
    }
    
    func testQuickAction_defaults_containsAllActionTypes() {
        let defaults = HomeContent.QuickAction.defaults
        let actions = defaults.map { $0.action }
        
        XCTAssertTrue(actions.contains(.newChat))
        XCTAssertTrue(actions.contains(.history))
        XCTAssertTrue(actions.contains(.upgrade))
        XCTAssertTrue(actions.contains(.settings))
    }
    
    func testQuickAction_equatable() {
        let id = UUID()
        let action1 = HomeContent.QuickAction(id: id, title: "Test", systemImage: "star", action: .newChat)
        let action2 = HomeContent.QuickAction(id: id, title: "Test", systemImage: "star", action: .newChat)
        
        XCTAssertEqual(action1, action2)
    }
    
    func testQuickAction_differentActions_notEqual() {
        let id = UUID()
        let action1 = HomeContent.QuickAction(id: id, title: "Test", systemImage: "star", action: .newChat)
        let action2 = HomeContent.QuickAction(id: id, title: "Test", systemImage: "star", action: .history)
        
        XCTAssertNotEqual(action1, action2)
    }
    
    // MARK: - HomeContent Tests
    
    func testHomeContent_initialization() {
        let content = HomeContent(
            welcomeTitle: "Hello",
            welcomeSubtitle: "Welcome",
            featuredItems: [],
            quickActions: []
        )
        
        XCTAssertEqual(content.welcomeTitle, "Hello")
        XCTAssertEqual(content.welcomeSubtitle, "Welcome")
        XCTAssertEqual(content.featuredItems.count, 0)
        XCTAssertEqual(content.quickActions.count, 0)
    }
    
    func testHomeContent_defaultValues() {
        let content = HomeContent()
        
        XCTAssertEqual(content.welcomeTitle, "Ready For A Reliable Morning?")
        XCTAssertEqual(content.welcomeSubtitle, "Set your next alarm run and lock in your first task before bed.")
        XCTAssertEqual(content.featuredItems.count, 4)
        XCTAssertEqual(content.quickActions.count, 4)
    }
    
    func testHomeContent_customFeaturedItems() {
        let customItem = HomeContent.FeatureItem(
            title: "Custom",
            description: "Custom feature",
            systemImage: "custom"
        )
        
        let content = HomeContent(featuredItems: [customItem])
        
        XCTAssertEqual(content.featuredItems.count, 1)
        XCTAssertEqual(content.featuredItems.first?.title, "Custom")
    }
    
    func testHomeContent_customQuickActions() {
        let customAction = HomeContent.QuickAction(
            title: "Custom",
            systemImage: "custom",
            action: .newChat
        )
        
        let content = HomeContent(quickActions: [customAction])
        
        XCTAssertEqual(content.quickActions.count, 1)
        XCTAssertEqual(content.quickActions.first?.title, "Custom")
    }
}
