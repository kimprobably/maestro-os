import XCTest
@testable import SwiftAIBoilerplatePro
import Storage

@MainActor
final class SwiftAIBoilerplateProTests: XCTestCase {

    func testMainTabOrderKeepsWakeRunsBetweenHomeAndProfile() {
        XCTAssertEqual(MainTabView.Tab.allCases.map(\.title), ["Home", "Runs", "Profile"])
    }

    func testWakeTaskStoreLocationUsesDedicatedApplicationSupportFile() {
        let location = WakeTaskStoreLocation.default()

        XCTAssertEqual(location.fileURL.lastPathComponent, "wake-task-store.json")
        XCTAssertEqual(location.fileURL.deletingLastPathComponent().lastPathComponent, "waketask")
    }
}
