import Auth
import Core
import DesignSystem
import Payments
import SwiftUI
import UserNotifications

@main
@available(iOS 17.0, *)
struct SwiftAIBoilerplateProApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var compositionRoot: CompositionRoot?
    @State private var environment: AppEnvironment?
    @State private var initError: Error?

    init() {
        // Setup theme system
        DSColors.observeThemeChanges()
        ThemeManager.shared.applyTheme()
    }

    var body: some Scene {
        WindowGroup {
            ZStack {
                if let env = environment {
                    AppRootView(environment: env)
                        .environment(ThemeManager.shared)
                        .transition(.opacity)
                } else if let error = initError {
                    ErrorView(error: error)
                        .transition(.opacity)
                } else {
                    // Clean loading state that matches launch screen
                    LaunchScreenStyle()
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: environment != nil)
            .task {
                await initialize()
            }
            .onOpenURL { url in
                if let deepLink = DeepLink.parse(url) {
                    DeepLinkBus.shared.publish(deepLink)
                }
            }
            #if DEBUG
            .onAppear {
                    // Quick test notification for development
                    Task {
                        await LocalNotificationTester.quickTest()
                    }
                }
            #endif
        }
    }

    // MARK: - Initialization

    private func initialize() async {
        do {
            AppLogger.info("App starting...", category: AppLogger.ui)

            // Load configuration from Config/
            let authConfig = try loadAuthConfig()
            let paymentsConfig = try loadPaymentsConfig()

            // Build dependency graph
            let root = try CompositionRoot(
                authConfig: authConfig,
                paymentsConfig: paymentsConfig
            )

            compositionRoot = root
            environment = AppEnvironment(compositionRoot: root)

            // Set environment in AppDelegate for device token uploads
            appDelegate.setEnvironment(environment!)

            AppLogger.info("App initialized successfully", category: AppLogger.ui)

            // Request notification permissions on first launch
            await requestNotificationPermissionsIfNeeded()

        } catch {
            AppLogger.error("App initialization failed: \(error)", category: AppLogger.ui)
            initError = error
        }
    }

    // MARK: - Notification Permissions

    /**
     * Requests notification permissions if not already granted
     *
     * This method checks the current authorization status and only requests
     * permissions if the user hasn't been asked before (notDetermined status)
     */
    private func requestNotificationPermissionsIfNeeded() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()

        // Only request permissions if user hasn't been asked before
        guard settings.authorizationStatus == .notDetermined else {
            AppLogger.info(
                "Notification permissions already determined: \(settings.authorizationStatus.rawValue)",
                category: AppLogger.ui
            )
            return
        }

        // Request permissions using NotificationPermissionClient
        let client = DefaultNotificationPermissionClient()
        _ = try? await client.requestAuthorization()
    }

    // MARK: - Configuration Loading

    private func loadAuthConfig() throws -> AuthConfig {
        // Load from generated AppConfiguration (created at build time from Config/Secrets.xcconfig)
        #if DEBUG
            // In DEBUG with AUTH_BYPASS, return placeholder config (CompositionRoot uses MockAuthClient)
            if ProcessInfo.processInfo.environment["AUTH_BYPASS"] == "1" {
                AppLogger.info("DEBUG: Using mock auth (AUTH_BYPASS=1), placeholder config returned", category: AppLogger.auth)
                return AuthConfig(
                    supabaseURL: URL(string: "https://placeholder.supabase.co")!,
                    supabaseAnonKey: "placeholder-key-for-debug-mode"
                )
            }
        #endif

        guard let url = URL(string: AppConfiguration.SUPABASE_URL) else {
            throw AppError.validation(message: "Invalid SUPABASE_URL in Config/Secrets.xcconfig. Please check your configuration.")
        }

        guard !AppConfiguration.SUPABASE_ANON_KEY.isEmpty else {
            throw AppError.validation(message: "Missing SUPABASE_ANON_KEY. Add to Config/Secrets.xcconfig")
        }

        AppLogger.info("Loaded auth config from AppConfiguration", category: AppLogger.auth)

        return AuthConfig(
            supabaseURL: url,
            supabaseAnonKey: AppConfiguration.SUPABASE_ANON_KEY
        )
    }

    private func loadPaymentsConfig() throws -> PaymentsConfig {
        // Load from generated AppConfiguration (created at build time from Config/Secrets.xcconfig)
        #if DEBUG
            // In DEBUG with AUTH_BYPASS, return placeholder config (PaymentsClient gets mock offerings)
            if ProcessInfo.processInfo.environment["AUTH_BYPASS"] == "1" {
                AppLogger.info("DEBUG: Using mock mode (AUTH_BYPASS=1), placeholder payments config returned", category: AppLogger.payments)
                return PaymentsConfig(
                    apiKey: "debug_mode_placeholder_key",
                    entitlementID: "pro"
                )
            }
        #endif

        guard !AppConfiguration.REVENUECAT_API_KEY.isEmpty else {
            throw AppError.validation(message: "Missing REVENUECAT_API_KEY. Add to Config/Secrets.xcconfig")
        }

        let entitlementID = AppConfiguration.RC_ENTITLEMENT_ID

        AppLogger.info("Loaded payments config from AppConfiguration", category: AppLogger.payments)

        return PaymentsConfig(
            apiKey: AppConfiguration.REVENUECAT_API_KEY,
            entitlementID: entitlementID
        )
    }
}

// MARK: - Loading & Error Views

/// Loading view that matches launch screen design with progress indicator
struct LaunchScreenStyle: View {
    var body: some View {
        ZStack {
            DSColors.background
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Image(systemName: "sparkles")
                    .font(.system(size: 48, weight: .medium))
                    .foregroundStyle(DSColors.accentPrimary)

                Text("WakeTask")
                    .font(.system(size: 30, weight: .semibold))
                    .foregroundStyle(DSColors.textPrimary)

                Text("Wake · Verify · Act")
                    .font(.system(size: 16))
                    .foregroundStyle(DSColors.textSecondary)

                Spacer()
                    .frame(height: 40)

                // Loading indicator
                VStack(spacing: 12) {
                    ProgressView()
                        .tint(DSColors.accentPrimary)
                        .scaleEffect(1.1)

                    Text("Initializing...")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(DSColors.textSecondary)
                }
            }
        }
    }
}

struct ErrorView: View {
    let error: Error

    var body: some View {
        ZStack {
            DSColors.background
                .ignoresSafeArea()

            VStack(spacing: 20) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 60))
                    .foregroundStyle(.red)

                Text("Initialization Error")
                    .font(.title)
                    .foregroundStyle(DSColors.textPrimary)

                Text(error.localizedDescription)
                    .font(.body)
                    .foregroundStyle(DSColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding()
            }
            .padding()
        }
    }
}
