import XCTest
@testable import FeatureSettings
import Storage
import Auth

/// Tests for notification toggles, live auth/payment state observation,
/// settings toggles (diagnostics/haptics/reduce motion), and rapid
/// concurrent state updates.
@MainActor
final class SettingsViewModelObservationTests: SettingsViewModelTestCase {

    // MARK: - Notification toggles

    func testToggleNotifications_enableWithoutPermission() async {
        await viewModel.appear()

        await viewModel.toggleNotifications(true)

        XCTAssertTrue(viewModel.notificationsEnabled)
        XCTAssertFalse(viewModel.notificationPermissionGranted)
    }

    func testToggleNotifications_disable() async {
        await viewModel.appear()

        await viewModel.toggleNotifications(false)

        XCTAssertFalse(viewModel.notificationsEnabled)
        XCTAssertEqual(fakeSettingsRepo.storedSettings?.notificationsEnabled, false)
    }

    func testOpenSystemNotificationSettings_doesNotCrashInTests() {
        viewModel.openSystemNotificationSettings()
    }

    // MARK: - Auth + payment stream observation

    func testAppear_observesAuthStateChanges() async {
        fakeAuthClient.currentAuthUser = nil

        await viewModel.appear()

        XCTAssertFalse(viewModel.isAuthenticated)

        fakeAuthClient.currentAuthUser = AuthUser(id: "123", email: "test@example.com")
        fakeAuthClient.emitStateChange()

        // Let the async stream deliver the yield before assertion.
        try? await Task.sleep(nanoseconds: 100_000_000)

        XCTAssertTrue(viewModel.isAuthenticated)
    }

    func testAppear_observesPaymentsStateChanges() async {
        fakePaymentsClient.isSubscribed = false

        await viewModel.appear()

        XCTAssertFalse(viewModel.isSubscribed)

        fakePaymentsClient.isSubscribed = true
        fakePaymentsClient.emitStateChange()

        try? await Task.sleep(nanoseconds: 100_000_000)

        XCTAssertTrue(viewModel.isSubscribed)
    }

    func testConcurrentStateObservation_handlesMultipleUpdates() async {
        await viewModel.appear()

        fakeAuthClient.currentAuthUser = AuthUser(id: "1", email: "a@test.com")
        fakeAuthClient.emitStateChange()

        fakeAuthClient.currentAuthUser = nil
        fakeAuthClient.emitStateChange()

        fakeAuthClient.currentAuthUser = AuthUser(id: "2", email: "b@test.com")
        fakeAuthClient.emitStateChange()

        try? await Task.sleep(nanoseconds: 100_000_000)

        XCTAssertTrue(viewModel.isAuthenticated)
    }

    // MARK: - Settings persistence toggles

    func testToggleDiagnostics_enablesAndPersists() async {
        await viewModel.appear()

        await viewModel.toggleDiagnostics(true)

        XCTAssertTrue(viewModel.shareDiagnostics)
        XCTAssertTrue(fakeSettingsRepo.storedSettings?.shareDiagnostics ?? false)
    }

    func testToggleDiagnostics_disablesAndPersists() async {
        await viewModel.appear()

        await viewModel.toggleDiagnostics(false)

        XCTAssertFalse(viewModel.shareDiagnostics)
        XCTAssertFalse(fakeSettingsRepo.storedSettings?.shareDiagnostics ?? true)
    }

    func testToggleHaptics_enablesAndPersists() async {
        await viewModel.appear()

        await viewModel.toggleHaptics(true)

        XCTAssertTrue(viewModel.hapticsEnabled)
        XCTAssertTrue(fakeSettingsRepo.storedSettings?.hapticsEnabled ?? false)
    }

    func testToggleReduceMotion_enablesAndPersists() async {
        await viewModel.appear()

        await viewModel.toggleReduceMotion(true)

        XCTAssertTrue(viewModel.reduceMotion)
        XCTAssertTrue(fakeSettingsRepo.storedSettings?.reduceMotion ?? false)
    }

    func testAppear_loadsAllSettingsProperties() async {
        let settings = SettingsDTO(
            theme: .aurora,
            preferredModel: "gpt-4",
            reduceMotion: true,
            hasSeenOnboarding: true,
            notificationsEnabled: false,
            shareDiagnostics: false,
            hapticsEnabled: false,
            createdAt: Date(),
            updatedAt: Date()
        )
        fakeSettingsRepo.storedSettings = settings

        await viewModel.appear()

        XCTAssertEqual(viewModel.theme, .aurora)
        XCTAssertTrue(viewModel.reduceMotion)
        XCTAssertFalse(viewModel.notificationsEnabled)
        XCTAssertFalse(viewModel.shareDiagnostics)
        XCTAssertFalse(viewModel.hapticsEnabled)
    }
}
