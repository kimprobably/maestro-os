@testable import SwiftAIBoilerplatePro
import SwiftUI
import XCTest

@MainActor
final class AppShellSnapshotTests: XCTestCase {
    func testHomeContentCanBeInitialized() {
        let view = HomeContent()
        XCTAssertEqual(String(describing: type(of: view)), "HomeContent")
    }

    func testMainTabMetadataReflectsWakeTaskRunsSurface() {
        XCTAssertEqual(MainTabView.Tab.home.title, "Home")
        XCTAssertEqual(MainTabView.Tab.chat.title, "Runs")
        XCTAssertEqual(MainTabView.Tab.chat.icon, "alarm.fill")
        XCTAssertEqual(MainTabView.Tab.profile.title, "Profile")
    }

    func testMainTabViewCanBeInitializedWithWakeDependencies() {
        let view = MainTabView(
            selectedTab: .constant(.chat),
            homeViewModel: HomeViewModel(
                conversationRepository: PreviewMocks.MockConversationRepository()
            ),
            wakeFlowViewModel: PreviewComposition.wakeFlowVM(),
            settingsViewModel: PreviewComposition.settingsVM(),
            profileViewModel: ProfileViewModel(
                authClient: PreviewMocks.MockAuthClient(),
                paymentsClient: PreviewMocks.MockPaymentsClient()
            )
        )

        XCTAssertEqual(String(describing: type(of: view)), "MainTabView")
    }
}
