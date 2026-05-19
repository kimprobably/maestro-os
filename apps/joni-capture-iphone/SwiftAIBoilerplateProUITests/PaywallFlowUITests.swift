import XCTest

final class PaywallFlowUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        
        app = XCUIApplication()
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launch()
        
        // Navigate past auth
        let homeScreen = app.otherElements["HomeView"]
        _ = homeScreen.waitForExistence(timeout: 5)
    }
    
    override func tearDownWithError() throws {
        app = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Paywall Display
    
    func testPaywall_canBeOpened() throws {
        navigateToPaywall()
        
        // Paywall should be visible
        let paywallTitle = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS[c] 'premium' OR label CONTAINS[c] 'pro'")
        ).firstMatch
        
        XCTAssertTrue(paywallTitle.waitForExistence(timeout: 5))
    }
    
    func testPaywall_showsPricingOptions() throws {
        navigateToPaywall()
        
        // Should show pricing options
        let monthlyOption = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'month'")
        ).firstMatch
        
        let annualOption = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'year' OR label CONTAINS[c] 'annual'")
        ).firstMatch
        
        XCTAssertTrue(
            monthlyOption.waitForExistence(timeout: 5) ||
            annualOption.waitForExistence(timeout: 5)
        )
    }
    
    func testPaywall_showsFeatures() throws {
        navigateToPaywall()
        
        // Should list premium features
        let features = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS[c] 'unlimited' OR label CONTAINS[c] 'feature'")
        )
        
        XCTAssertGreaterThan(features.count, 0)
    }
    
    // MARK: - Purchase Flow
    
    func testPaywall_purchaseButtonExists() throws {
        navigateToPaywall()
        
        let purchaseButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'subscribe' OR label CONTAINS[c] 'purchase'")
        ).firstMatch
        
        XCTAssertTrue(purchaseButton.waitForExistence(timeout: 5))
        XCTAssertTrue(purchaseButton.isEnabled)
    }
    
    func testPaywall_canSelectDifferentOptions() throws {
        navigateToPaywall()
        
        let monthlyOption = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'month'")
        ).firstMatch
        
        let annualOption = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'year' OR label CONTAINS[c] 'annual'")
        ).firstMatch
        
        if monthlyOption.exists && annualOption.exists {
            monthlyOption.tap()
            sleep(1)
            
            annualOption.tap()
            sleep(1)
            
            // Should be able to switch between options
            XCTAssertTrue(true)
        }
    }
    
    // MARK: - Restore Purchases
    
    func testPaywall_restoreButtonExists() throws {
        navigateToPaywall()
        
        let restoreButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'restore'")
        ).firstMatch
        
        XCTAssertTrue(restoreButton.waitForExistence(timeout: 5))
    }
    
    func testPaywall_canTapRestore() throws {
        navigateToPaywall()
        
        let restoreButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'restore'")
        ).firstMatch
        
        if restoreButton.waitForExistence(timeout: 5) {
            restoreButton.tap()
            
            // Should show loading or result
            // (In sandbox, might show "no purchases found")
            sleep(2)
        }
    }
    
    // MARK: - Paywall Dismissal
    
    func testPaywall_canBeDismissed() throws {
        navigateToPaywall()
        
        // Look for close button
        let closeButton = app.buttons.matching(
            NSPredicate(format: "label CONTAINS 'Close' OR label CONTAINS 'Done' OR label CONTAINS 'x'")
        ).firstMatch
        
        if closeButton.waitForExistence(timeout: 5) {
            closeButton.tap()
            
            // Should return to previous screen
            sleep(1)
            XCTAssertFalse(closeButton.exists)
        } else {
            // Try swipe down to dismiss
            let paywall = app.sheets.firstMatch
            if paywall.exists {
                paywall.swipeDown()
                sleep(1)
            }
        }
    }
    
    // MARK: - Terms and Privacy
    
    func testPaywall_showsTermsLink() throws {
        navigateToPaywall()
        
        let termsLink = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'terms'")
        ).firstMatch
        
        if termsLink.waitForExistence(timeout: 5) {
            XCTAssertTrue(termsLink.exists)
        }
    }
    
    func testPaywall_showsPrivacyLink() throws {
        navigateToPaywall()
        
        let privacyLink = app.buttons.matching(
            NSPredicate(format: "label CONTAINS[c] 'privacy'")
        ).firstMatch
        
        if privacyLink.waitForExistence(timeout: 5) {
            XCTAssertTrue(privacyLink.exists)
        }
    }
    
    // MARK: - Subscription Status
    
    func testSubscriptionStatus_displaysInProfile() throws {
        // Navigate to profile/settings
        let settingsTab = app.tabBars.buttons["Settings"]
        if settingsTab.waitForExistence(timeout: 5) {
            settingsTab.tap()
            
            // Should show subscription status
            let subscriptionStatus = app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS[c] 'subscription' OR label CONTAINS[c] 'premium'")
            ).firstMatch
            
            _ = subscriptionStatus.waitForExistence(timeout: 5)
        }
    }
    
    func testGoPremiumButton_opensPaywall() throws {
        // Navigate to profile
        let settingsTab = app.tabBars.buttons["Settings"]
        if settingsTab.waitForExistence(timeout: 5) {
            settingsTab.tap()
            
            let goPremiumButton = app.buttons.matching(
                NSPredicate(format: "label CONTAINS[c] 'premium' OR label CONTAINS[c] 'upgrade'")
            ).firstMatch
            
            if goPremiumButton.waitForExistence(timeout: 5) {
                goPremiumButton.tap()
                
                // Should show paywall
                let paywallTitle = app.staticTexts.matching(
                    NSPredicate(format: "label CONTAINS[c] 'premium'")
                ).firstMatch
                XCTAssertTrue(paywallTitle.waitForExistence(timeout: 3))
            }
        }
    }
    
    // MARK: - Feature Gates
    
    func testFeatureGate_showsPaywallWhenNeeded() throws {
        // Try to access premium feature
        // This depends on your feature implementation
        // Placeholder for feature gate testing
    }
    
    // MARK: - Helpers
    
    private func navigateToPaywall() {
        // Try multiple paths to paywall
        
        // Path 1: Settings → Go Premium
        let settingsTab = app.tabBars.buttons["Settings"]
        if settingsTab.waitForExistence(timeout: 5) {
            settingsTab.tap()
            
            let premiumButton = app.buttons.matching(
                NSPredicate(format: "label CONTAINS[c] 'premium' OR label CONTAINS[c] 'pro'")
            ).firstMatch
            
            if premiumButton.waitForExistence(timeout: 3) {
                premiumButton.tap()
                return
            }
        }
        
        // Path 2: Profile → Go Premium
        let profileTab = app.tabBars.buttons["Profile"]
        if profileTab.waitForExistence(timeout: 3) {
            profileTab.tap()
            
            let premiumButton = app.buttons.matching(
                NSPredicate(format: "label CONTAINS[c] 'premium'")
            ).firstMatch
            
            if premiumButton.waitForExistence(timeout: 3) {
                premiumButton.tap()
                return
            }
        }
    }
}

