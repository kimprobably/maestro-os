import XCTest

final class IntegrationWakeExploratoryUITests: XCTestCase {

    private var app: XCUIApplication!

    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launch()
    }

    override func tearDownWithError() throws {
        app = nil
        try super.tearDownWithError()
    }

    func testExploratoryWakeTraversal() throws {
        let runsTab = app.tabBars.buttons["Runs"]
        XCTAssertTrue(runsTab.waitForExistence(timeout: 10))
        runsTab.tap()

        let wakeRoot = app.otherElements["wakeTabRoot"]
        XCTAssertTrue(wakeRoot.waitForExistence(timeout: 10))

        let addAlarmButton = app.buttons["wakeAddAlarmButton"]
        XCTAssertTrue(addAlarmButton.waitForExistence(timeout: 10))
        addAlarmButton.tap()

        let alarmNameField = app.textFields["wakeAlarmNameField"]
        XCTAssertTrue(alarmNameField.waitForExistence(timeout: 10))
        alarmNameField.tap()
        alarmNameField.typeText("Weekday")

        let firstTaskField = app.textFields["wakeFirstTaskField"]
        XCTAssertTrue(firstTaskField.exists)
        firstTaskField.tap()
        firstTaskField.typeText("Drink water")

        let saveButton = app.buttons["wakeAlarmSaveButton"]
        XCTAssertTrue(saveButton.exists)
        saveButton.tap()

        let alarmCell = app.otherElements.matching(NSPredicate(format: "identifier BEGINSWITH 'wakeAlarmCell-'")).firstMatch
        XCTAssertTrue(alarmCell.waitForExistence(timeout: 10))

        let profileTab = app.tabBars.buttons["Profile"]
        XCTAssertTrue(profileTab.exists)
        profileTab.tap()
        XCTAssertTrue(app.otherElements["profileTabRoot"].waitForExistence(timeout: 10))

        let homeTab = app.tabBars.buttons["Home"]
        XCTAssertTrue(homeTab.exists)
        homeTab.tap()
        XCTAssertTrue(app.otherElements["homeTabRoot"].waitForExistence(timeout: 10))
    }
}
