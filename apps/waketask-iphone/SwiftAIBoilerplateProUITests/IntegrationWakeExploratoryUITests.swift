import XCTest

final class IntegrationWakeExploratoryUITests: XCTestCase {
    private var app: XCUIApplication!
    private var telemetry = ExploratoryTelemetry()

    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        telemetry = ExploratoryTelemetry()
        app = XCUIApplication()
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launchEnvironment["DISABLE_NOTIFICATION_PROMPT"] = "1"
        app.launch()
        enterMainAppIfNeeded()
        telemetry.visit("Home")
    }

    override func tearDownWithError() throws {
        try telemetry.writeIfRequested()
        app = nil
        try super.tearDownWithError()
    }

    func testExploratoryWakeTraversal() {
        let runsTab = app.tabBars.buttons["Runs"]
        XCTAssertTrue(runsTab.waitForExistence(timeout: 10))
        telemetry.tap(runsTab, id: "Runs")

        let wakeRoot = app.otherElements["wakeTabRoot"]
        XCTAssertTrue(wakeRoot.waitForExistence(timeout: 10))
        telemetry.visit("Runs")

        let addAlarmButton = app.buttons["wakeAddAlarmButton"]
        XCTAssertTrue(addAlarmButton.waitForExistence(timeout: 10))
        telemetry.tap(addAlarmButton, id: "wakeAddAlarmButton")
        telemetry.visit("WakeCreateAlarm")

        let alarmNameField = app.textFields["wakeAlarmNameField"]
        XCTAssertTrue(alarmNameField.waitForExistence(timeout: 10))
        telemetry.enterText(alarmNameField, id: "wakeAlarmNameField", text: "Weekday")

        let firstTaskField = app.textFields["wakeFirstTaskField"]
        XCTAssertTrue(firstTaskField.exists)
        telemetry.enterText(firstTaskField, id: "wakeFirstTaskField", text: "Drink water")

        let saveButton = app.buttons["wakeAlarmSaveButton"]
        XCTAssertTrue(saveButton.exists)
        telemetry.tap(saveButton, id: "wakeAlarmSaveButton")

        let alarmCell = app.otherElements.matching(NSPredicate(format: "identifier BEGINSWITH 'wakeAlarmCell-'")).firstMatch
        XCTAssertTrue(alarmCell.waitForExistence(timeout: 10))

        let startRunButton = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'wakeStartRunButton-'")).firstMatch
        XCTAssertTrue(startRunButton.waitForExistence(timeout: 10))
        telemetry.tap(startRunButton, id: startRunButton.identifier)
        telemetry.visit("WakeActiveRun")

        let missionButtons = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'wakeMissionButton-'"))
        var tappedMissions = 0
        while missionButtons.count > 0, tappedMissions < 5 {
            let missionButton = missionButtons.firstMatch
            XCTAssertTrue(missionButton.waitForExistence(timeout: 10))
            telemetry.tap(missionButton, id: missionButton.identifier)
            tappedMissions += 1
            waitForUIUpdate()
        }
        XCTAssertEqual(missionButtons.count, 0)

        let dismissButton = app.buttons["wakeDismissAlarmButton"]
        XCTAssertTrue(dismissButton.waitForExistence(timeout: 10))
        XCTAssertTrue(waitUntilEnabled(dismissButton))
        telemetry.tap(dismissButton, id: "wakeDismissAlarmButton")

        let wakeCheckButton = app.buttons["wakeCompleteWakeCheckButton"]
        XCTAssertTrue(wakeCheckButton.waitForExistence(timeout: 10))
        XCTAssertTrue(waitUntilEnabled(wakeCheckButton))
        telemetry.tap(wakeCheckButton, id: "wakeCompleteWakeCheckButton")

        let firstTaskButton = app.buttons["wakeCompleteFirstTaskButton"]
        XCTAssertTrue(firstTaskButton.waitForExistence(timeout: 10))
        XCTAssertTrue(waitUntilEnabled(firstTaskButton))
        telemetry.tap(firstTaskButton, id: "wakeCompleteFirstTaskButton")

        let profileTab = app.tabBars.buttons["Profile"]
        XCTAssertTrue(profileTab.exists)
        telemetry.tap(profileTab, id: "Profile")
        XCTAssertTrue(app.otherElements["profileTabRoot"].waitForExistence(timeout: 10))
        telemetry.visit("Profile")

        let homeTab = app.tabBars.buttons["Home"]
        XCTAssertTrue(homeTab.exists)
        telemetry.tap(homeTab, id: "Home")
        XCTAssertTrue(app.otherElements["homeTabRoot"].waitForExistence(timeout: 10))
        telemetry.visit("Home")
    }

    private func waitUntilEnabled(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
        let deadline = Date().addingTimeInterval(timeout)
        while Date() < deadline {
            if element.exists, element.isEnabled {
                return true
            }
            waitForUIUpdate()
        }

        return element.exists && element.isEnabled
    }

    private func enterMainAppIfNeeded(timeout: TimeInterval = 30) {
        let deadline = Date().addingTimeInterval(timeout)
        let runsTab = app.tabBars.buttons["Runs"]
        let skipOnboardingButton = app.buttons["Skip onboarding"]
        let debugSignInButton = app.buttons["Debug: Mock Sign In"]

        while Date() < deadline {
            if runsTab.exists {
                return
            }

            dismissSystemAlertIfNeeded()

            if skipOnboardingButton.exists, skipOnboardingButton.isHittable {
                telemetry.tap(skipOnboardingButton, id: "Skip onboarding")
                waitForUIUpdate()
                continue
            }

            if debugSignInButton.exists, debugSignInButton.isHittable {
                telemetry.tap(debugSignInButton, id: "Debug: Mock Sign In")
                waitForUIUpdate()
                continue
            }

            waitForUIUpdate()
        }
    }

    private func dismissSystemAlertIfNeeded() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let alert = springboard.alerts.firstMatch
        guard alert.exists else {
            return
        }

        for title in ["Allow", "OK", "Continue", "Don't Allow", "Don’t Allow"] {
            let button = alert.buttons[title]
            if button.exists {
                button.tap()
                return
            }
        }

        let firstButton = alert.buttons.firstMatch
        if firstButton.exists {
            firstButton.tap()
        }
    }

    private func waitForUIUpdate() {
        RunLoop.current.run(until: Date().addingTimeInterval(0.2))
    }
}

private struct ExploratoryTelemetry: Codable {
    private(set) var buttonsTapped: [String] = []
    private(set) var textFieldsEdited: [String] = []
    private(set) var screensVisited: [String] = []

    mutating func tap(_ element: XCUIElement, id: String) {
        buttonsTapped.append(id)
        element.tap()
    }

    mutating func enterText(_ element: XCUIElement, id: String, text: String) {
        textFieldsEdited.append(id)
        element.tap()
        element.typeText(text)
    }

    mutating func visit(_ screen: String) {
        if !screensVisited.contains(screen) {
            screensVisited.append(screen)
        }
    }

    func writeIfRequested() throws {
        guard let path = ProcessInfo.processInfo.environment["WAKE_EXPLORATORY_TELEMETRY_PATH"],
              !path.isEmpty
        else {
            return
        }

        let url = URL(fileURLWithPath: path)
        let data = try JSONEncoder().encode(self)
        try data.write(to: url)
    }
}
