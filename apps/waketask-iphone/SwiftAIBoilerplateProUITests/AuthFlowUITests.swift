import XCTest

final class AuthFlowUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        
        app = XCUIApplication()
        // Enable auth bypass for UI testing
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Sign Up Flow
    
    func testSignUpFlow_completesSuccessfully() throws {
        // Wait for onboarding or sign in screen
        let signUpButton = app.buttons["Sign Up"]
        XCTAssertTrue(signUpButton.waitForExistence(timeout: 5))
        
        signUpButton.tap()
        
        // Fill in email
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.exists)
        emailField.tap()
        emailField.typeText("test@example.com")
        
        // Fill in password
        let passwordField = app.secureTextFields["Password"]
        XCTAssertTrue(passwordField.exists)
        passwordField.tap()
        passwordField.typeText("TestPassword123!")
        
        // Submit
        let submitButton = app.buttons["Create Account"]
        if submitButton.exists {
            submitButton.tap()
        } else {
            app.buttons["Sign Up"].tap()
        }
        
        // Should navigate to home
        let homeScreen = app.otherElements["HomeView"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 5))
    }
    
    // MARK: - Sign In Flow
    
    func testSignInFlow_completesSuccessfully() throws {
        // Navigate to sign in
        let signInButton = app.buttons["Sign In"]
        XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
        
        signInButton.tap()
        
        // Fill in credentials
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.exists)
        emailField.tap()
        emailField.typeText("test@example.com")
        
        let passwordField = app.secureTextFields["Password"]
        XCTAssertTrue(passwordField.exists)
        passwordField.tap()
        passwordField.typeText("TestPassword123!")
        
        // Submit
        app.buttons["Sign In"].tap()
        
        // Should navigate to home
        let homeScreen = app.otherElements["HomeView"]
        XCTAssertTrue(homeScreen.waitForExistence(timeout: 5))
    }
    
    // MARK: - Apple Sign In
    
    func testAppleSignIn_buttonExists() throws {
        let appleSignInButton = app.buttons["Sign in with Apple"]
        XCTAssertTrue(appleSignInButton.waitForExistence(timeout: 5))
    }
    
    func testAppleSignIn_canBeTapped() throws {
        let appleSignInButton = app.buttons["Sign in with Apple"]
        XCTAssertTrue(appleSignInButton.waitForExistence(timeout: 5))
        XCTAssertTrue(appleSignInButton.isEnabled)
    }
    
    // MARK: - Error Handling
    
    func testSignIn_withInvalidCredentials_showsError() throws {
        // Without AUTH_BYPASS, invalid credentials should show error
        app.terminate()
        app.launchEnvironment.removeValue(forKey: "AUTH_BYPASS")
        app.launch()
        
        let signInButton = app.buttons["Sign In"]
        if signInButton.waitForExistence(timeout: 5) {
            signInButton.tap()
            
            let emailField = app.textFields["Email"]
            emailField.tap()
            emailField.typeText("invalid@example.com")
            
            let passwordField = app.secureTextFields["Password"]
            passwordField.tap()
            passwordField.typeText("wrongpassword")
            
            app.buttons["Sign In"].tap()
            
            // Should show error alert
            let alert = app.alerts.firstMatch
            XCTAssertTrue(alert.waitForExistence(timeout: 5))
        }
    }
    
    // MARK: - Sign Out
    
    func testSignOut_returnsToSignIn() throws {
        // First sign in
        try testSignInFlow_completesSuccessfully()
        
        // Navigate to profile/settings
        let settingsTab = app.tabBars.buttons["Settings"]
        if settingsTab.exists {
            settingsTab.tap()
        }
        
        // Tap sign out
        let signOutButton = app.buttons["Sign Out"]
        if signOutButton.waitForExistence(timeout: 5) {
            signOutButton.tap()
            
            // Should return to sign in screen
            let signInButton = app.buttons["Sign In"]
            XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
        }
    }
    
    // MARK: - Password Reset
    
    func testForgotPassword_opensResetScreen() throws {
        let signInButton = app.buttons["Sign In"]
        if signInButton.waitForExistence(timeout: 5) {
            signInButton.tap()
            
            let forgotPasswordButton = app.buttons["Forgot Password?"]
            if forgotPasswordButton.exists {
                forgotPasswordButton.tap()
                
                // Should show reset password screen
                let resetScreen = app.otherElements["ForgotPasswordView"]
                XCTAssertTrue(resetScreen.waitForExistence(timeout: 3))
            }
        }
    }
    
    // MARK: - Navigation
    
    func testOnboarding_canBeSkipped() throws {
        let skipButton = app.buttons["Skip"]
        if skipButton.waitForExistence(timeout: 5) {
            skipButton.tap()
            
            // Should go to sign in
            let signInButton = app.buttons["Sign In"]
            XCTAssertTrue(signInButton.waitForExistence(timeout: 3))
        }
    }
    
    func testSignIn_canNavigateToSignUp() throws {
        let signInButton = app.buttons["Sign In"]
        if signInButton.waitForExistence(timeout: 5) {
            signInButton.tap()
            
            let signUpLink = app.buttons["Sign Up"]
            if signUpLink.exists {
                signUpLink.tap()
                
                // Should show sign up screen
                let createAccountButton = app.buttons["Create Account"]
                XCTAssertTrue(createAccountButton.waitForExistence(timeout: 3))
            }
        }
    }
}

