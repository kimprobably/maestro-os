import XCTest

final class SwiftAIBoilerplateProUITests: XCTestCase {

    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
    }

    func testLaunchShowsWakeTaskTabs() throws {
        let app = XCUIApplication()
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launch()

        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10))
        XCTAssertTrue(tabBar.buttons["Home"].exists)
        XCTAssertTrue(tabBar.buttons["Runs"].exists)
        XCTAssertTrue(tabBar.buttons["Profile"].exists)
    }

    func testLaunchPerformance() throws {
        if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 7.0, *) {
            measure(metrics: [XCTApplicationLaunchMetric()]) {
                let app = XCUIApplication()
                app.launchEnvironment["AUTH_BYPASS"] = "1"
                app.launch()
            }
        }
    }
}
