import Auth
@testable import FeatureSettings
import Storage
import XCTest

/// Core happy-path tests for `SettingsViewModel`: initial state, theme,
/// auth, payments, errors, accessor. Observation + toggle coverage lives
/// in sibling files.
@MainActor
final class SettingsViewModelTests: SettingsViewModelTestCase {
    func testInitialState() {
        XCTAssertEqual(viewModel.theme, .system)
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertFalse(viewModel.isSubscribed)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testAppearLoadsSettings() async {
        fakeSettingsRepo.storedSettings = SettingsDTO(theme: .dark)

        await viewModel.appear()

        XCTAssertEqual(viewModel.theme, .dark)
    }

    func testSetThemeUpdatesAndPersists() async {
        await viewModel.appear()

        await viewModel.setTheme(.light)

        XCTAssertEqual(viewModel.theme, .light)
        XCTAssertEqual(fakeSettingsRepo.storedSettings?.theme, .light)
        XCTAssertNil(viewModel.errorMessage)
    }

    // MARK: - Auth

    func testSignInSuccess() async {
        await viewModel.signInWithApple()

        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testSignInFailure() async {
        fakeAuthClient.shouldFail = true

        await viewModel.signInWithApple()

        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testSignOutSuccess() async {
        fakeAuthClient.currentAuthUser = AuthUser(id: "123", email: "test@example.com")
        await viewModel.appear()

        await viewModel.signOut()

        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    // MARK: - Payments

    func testPurchaseSuccess() async {
        await viewModel.purchase()

        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testPurchaseFailure() async {
        fakePaymentsClient.shouldFail = true

        await viewModel.purchase()

        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testRestoreSuccess() async {
        await viewModel.restorePurchases()

        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testRestoreFailure() async {
        fakePaymentsClient.shouldFail = true

        await viewModel.restorePurchases()

        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    // MARK: - Error Handling

    func testSetTheme_withSaveError() async {
        fakeSettingsRepo.shouldThrow = true

        await viewModel.setTheme(.dark)

        XCTAssertEqual(viewModel.theme, .dark)
        XCTAssertNotNil(viewModel.errorMessage)
    }

    func testLoadSettings_withNoSettings_usesDefaults() async {
        fakeSettingsRepo.storedSettings = nil
        fakeSettingsRepo.shouldThrow = true

        await viewModel.appear()

        XCTAssertEqual(viewModel.theme, .system)
        XCTAssertTrue(viewModel.notificationsEnabled)
    }

    func testErrorHandling_settingsSaveFails_showsUserMessage() async throws {
        fakeSettingsRepo.shouldThrow = true
        await viewModel.appear()

        await viewModel.setTheme(.dark)

        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(try XCTUnwrap(viewModel.errorMessage?.isEmpty))
    }

    // MARK: - ThemeManager integration

    func testSetTheme_updatesThemeManager() async {
        let themeManager = ThemeManager.shared

        await viewModel.setTheme(.dark)

        XCTAssertEqual(themeManager.selected, ThemeManager.Theme.dark)
    }

    func testSetTheme_allThemeVariants() async {
        await viewModel.setTheme(.system)
        XCTAssertEqual(ThemeManager.shared.selected, ThemeManager.Theme.system)

        await viewModel.setTheme(.light)
        XCTAssertEqual(ThemeManager.shared.selected, ThemeManager.Theme.light)

        await viewModel.setTheme(.dark)
        XCTAssertEqual(ThemeManager.shared.selected, ThemeManager.Theme.dark)

        await viewModel.setTheme(.aurora)
        XCTAssertEqual(ThemeManager.shared.selected, ThemeManager.Theme.aurora)

        await viewModel.setTheme(.obsidian)
        XCTAssertEqual(ThemeManager.shared.selected, ThemeManager.Theme.obsidian)
    }

    // MARK: - Accessor

    func testPaymentsClientAccessor_returnsCorrectClient() {
        let accessor = viewModel.paymentsClientAccessor
        XCTAssertNotNil(accessor)
    }
}
