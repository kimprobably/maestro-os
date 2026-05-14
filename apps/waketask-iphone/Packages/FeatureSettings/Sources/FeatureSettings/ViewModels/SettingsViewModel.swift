import Auth
import Core
import DesignSystem
import Foundation
import Payments
import Storage
import SwiftUI
import UserNotifications

/// ViewModel for settings screen
@MainActor
@Observable
public final class SettingsViewModel {
    // MARK: - Published State

    public var theme: SettingsDTO.Theme = .system
    public var isAuthenticated: Bool = false
    public var isSubscribed: Bool = false
    public var notificationsEnabled: Bool = true
    public var notificationPermissionGranted: Bool = false
    public var shareDiagnostics: Bool = true
    public var hapticsEnabled: Bool = true
    public var reduceMotion: Bool = false
    public var errorMessage: String?
    public var isLoading: Bool = false

    // MARK: - Dependencies

    private let settingsRepository: any SettingsRepository
    private let authClient: any AuthClient
    private let paymentsClient: any PaymentsClient
    private let themeManager: ThemeManager

    // MARK: - Public Accessors

    /// Readonly access to payments client for paywall presentation
    public var paymentsClientAccessor: any PaymentsClient {
        paymentsClient
    }

    private nonisolated(unsafe) var paymentsStateTask: Task<Void, Never>?
    private nonisolated(unsafe) var authStateTask: Task<Void, Never>?

    // MARK: - Initialization

    public init(
        settingsRepository: any SettingsRepository,
        authClient: any AuthClient,
        paymentsClient: any PaymentsClient
    ) {
        self.settingsRepository = settingsRepository
        self.authClient = authClient
        self.paymentsClient = paymentsClient
        // Access ThemeManager.shared on MainActor
        themeManager = MainActor.assumeIsolated {
            ThemeManager.shared
        }
    }

    // MARK: - Public Methods

    /// Load settings and start observing states
    public func appear() async {
        await loadSettings()
        await checkAuthState()
        await checkNotificationPermission()
        observeAuthState()
        observePaymentsState()
    }

    /// Update theme preference
    public func setTheme(_ newTheme: SettingsDTO.Theme) async {
        theme = newTheme

        // Map SettingsDTO.Theme to ThemeManager.Theme and apply
        let managerTheme: ThemeManager.Theme = switch newTheme {
        case .system: .system
        case .light: .light
        case .dark: .dark
        case .aurora: .aurora
        case .obsidian: .obsidian
        }

        themeManager.selected = managerTheme
        await saveSettings()
    }

    /// Toggle notifications
    public func toggleNotifications(_ enabled: Bool) async {
        notificationsEnabled = enabled

        if enabled, !notificationPermissionGranted {
            await requestNotificationPermission()
        } else if !enabled {
            await saveSettings()
        }
    }

    /// Open system notification settings
    public func openSystemNotificationSettings() {
        guard !isRunningInTests else {
            AppLogger.debug("Skipping openSystemNotificationSettings in test environment", category: AppLogger.feature)
            return
        }

        guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
        Task { @MainActor in
            UIApplication.shared.open(url)
        }
    }

    /// Toggle diagnostics sharing
    public func toggleDiagnostics(_ enabled: Bool) async {
        shareDiagnostics = enabled
        await saveSettings()
        AppLogger.info("Diagnostics sharing: \(enabled)", category: AppLogger.feature)
    }

    /// Toggle haptics
    public func toggleHaptics(_ enabled: Bool) async {
        hapticsEnabled = enabled
        await saveSettings()
        AppLogger.info("Haptics: \(enabled)", category: AppLogger.feature)
    }

    /// Toggle reduce motion
    public func toggleReduceMotion(_ enabled: Bool) async {
        reduceMotion = enabled
        await saveSettings()
        AppLogger.info("Reduce motion: \(enabled)", category: AppLogger.feature)
    }

    // MARK: - Private Helpers

    private func saveSettings() async {
        do {
            var settings = try await settingsRepository.load()
            settings = SettingsDTO(
                theme: theme,
                preferredModel: settings.preferredModel,
                reduceMotion: reduceMotion,
                hasSeenOnboarding: settings.hasSeenOnboarding,
                notificationsEnabled: notificationsEnabled,
                shareDiagnostics: shareDiagnostics,
                hapticsEnabled: hapticsEnabled,
                createdAt: settings.createdAt,
                updatedAt: Date()
            )
            try await settingsRepository.save(settings)
            AppLogger.info("Settings saved", category: AppLogger.feature)
            errorMessage = nil
        } catch {
            let appError = AppError.from(error)
            errorMessage = appError.userMessage
            AppLogger.error("Failed to save settings: \(error)", category: AppLogger.feature)
        }
    }

    private func requestNotificationPermission() async {
        // Skip notification request in test environment
        guard !isRunningInTests else {
            AppLogger.debug("Skipping notification permission request in test environment", category: AppLogger.feature)
            notificationPermissionGranted = false
            return
        }

        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
            notificationPermissionGranted = granted
            if granted {
                await saveSettings()
            }
            AppLogger.info("Notification permission: \(granted)", category: AppLogger.feature)
        } catch {
            AppLogger.error("Notification permission request failed: \(error)", category: AppLogger.feature)
            notificationPermissionGranted = false
        }
    }

    /// Sign in with Apple
    public func signInWithApple() async {
        isLoading = true
        errorMessage = nil

        do {
            _ = try await authClient.signInWithApple()
            AppLogger.info("Sign in successful", category: AppLogger.feature)
            errorMessage = nil
            isLoading = false

        } catch {
            let appError = AppError.from(error)
            errorMessage = "Sign in failed: \(appError.userMessage)"
            AppLogger.error("Sign in failed: \(error)", category: AppLogger.feature)
            isLoading = false
        }
    }

    /// Sign out
    public func signOut() async {
        isLoading = true
        errorMessage = nil

        do {
            try await authClient.signOut()
            AppLogger.info("Sign out successful", category: AppLogger.feature)
            errorMessage = nil
            isLoading = false

        } catch {
            let appError = AppError.from(error)
            errorMessage = "Sign out failed: \(appError.userMessage)"
            AppLogger.error("Sign out failed: \(error)", category: AppLogger.feature)
            isLoading = false
        }
    }

    /// Purchase subscription
    public func purchase() async {
        isLoading = true
        errorMessage = nil

        do {
            // Use default product ID (could be configurable)
            try await paymentsClient.purchase(productID: "pro_monthly")
            AppLogger.info("Purchase successful", category: AppLogger.feature)
            errorMessage = nil
            isLoading = false

        } catch {
            let appError = AppError.from(error)
            errorMessage = "Purchase failed: \(appError.userMessage)"
            AppLogger.error("Purchase failed: \(error)", category: AppLogger.feature)
            isLoading = false
        }
    }

    /// Restore purchases - App Store Guideline 3.1.1 Compliance
    /// Must be user-initiated only (NOT called automatically on launch)
    public func restorePurchases() async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            // restore() returns the state directly - no race condition
            let restoredState = try await paymentsClient.restore()
            AppLogger.info("Restore successful, isSubscribed: \(restoredState.isSubscribed)", category: AppLogger.feature)

            // Update local subscription status immediately
            isSubscribed = restoredState.isSubscribed

            if restoredState.isSubscribed {
                // Show success feedback
                ToastCenter.shared.show(ToastMessage(
                    title: "Purchases Restored",
                    message: "Your subscription is now active!",
                    style: .success,
                    duration: 3.0
                ))
            } else {
                errorMessage = "No active subscription found to restore."
            }
        } catch {
            let appError = AppError.from(error)
            errorMessage = "Restore failed: \(appError.userMessage)"
            AppLogger.error("Restore failed: \(error)", category: AppLogger.feature)
        }
    }

    private func loadSettings() async {
        do {
            let settings = try await settingsRepository.load()
            theme = settings.theme
            notificationsEnabled = settings.notificationsEnabled
            shareDiagnostics = settings.shareDiagnostics
            hapticsEnabled = settings.hapticsEnabled
            reduceMotion = settings.reduceMotion
            AppLogger.debug("Settings loaded: theme=\(theme.rawValue)", category: AppLogger.feature)

        } catch {
            // If no settings exist, use defaults
            AppLogger.debug("No settings found, using defaults", category: AppLogger.feature)
            theme = .system
            notificationsEnabled = true
            shareDiagnostics = true
            hapticsEnabled = true
            reduceMotion = false
        }
    }

    private func checkNotificationPermission() async {
        // Skip notification check in test environment
        guard !isRunningInTests else {
            AppLogger.debug("Skipping notification permission check in test environment", category: AppLogger.feature)
            notificationPermissionGranted = false
            return
        }

        let settings = await UNUserNotificationCenter.current().notificationSettings()
        notificationPermissionGranted = settings.authorizationStatus == .authorized
        AppLogger.debug("Notification permission: \(notificationPermissionGranted)", category: AppLogger.feature)
    }

    private var isRunningInTests: Bool {
        NSClassFromString("XCTestCase") != nil
    }

    private func checkAuthState() async {
        if await authClient.currentUser() != nil {
            isAuthenticated = true
        } else {
            isAuthenticated = false
        }
        AppLogger.debug("Auth state checked: isAuthenticated=\(isAuthenticated)", category: AppLogger.feature)
    }

    private func observeAuthState() {
        authStateTask?.cancel()

        // Get stream from nonisolated accessor
        let states = authClient.authStates()

        authStateTask = Task { @MainActor [weak self] in
            guard let self else { return }

            for await state in states {
                if Task.isCancelled {
                    AppLogger.debug("Auth state observation cancelled", category: AppLogger.feature)
                    break
                }

                switch state {
                case .authenticated:
                    isAuthenticated = true
                    AppLogger.debug("Auth state: authenticated", category: AppLogger.feature)

                case .unauthenticated:
                    isAuthenticated = false
                    AppLogger.debug("Auth state: unauthenticated", category: AppLogger.feature)

                case .refreshing:
                    AppLogger.debug("Auth state: refreshing", category: AppLogger.feature)
                }
            }
        }
    }

    private func observePaymentsState() {
        paymentsStateTask?.cancel()

        // Get stream (non-throwing AsyncStream)
        let states = paymentsClient.states()

        paymentsStateTask = Task { @MainActor [weak self] in
            guard let self else { return }

            for await state in states {
                if Task.isCancelled {
                    AppLogger.debug("Payments state observation cancelled", category: AppLogger.feature)
                    break
                }

                isSubscribed = state.isSubscribed
                AppLogger.debug("Payments state: isSubscribed=\(isSubscribed)", category: AppLogger.feature)
            }
        }
    }

    deinit {
        authStateTask?.cancel()
        authStateTask = nil
        paymentsStateTask?.cancel()
        paymentsStateTask = nil
    }
}
