import SwiftUI
import Core
import Storage
import FeatureChat
import FeatureSettings
import FeatureRating
import DesignSystem

/// Root view that manages app-level routing and theme
@available(iOS 17.0, *)
struct AppRootView: View {
    
    @State private var router: LaunchRouter
    @State private var selectedTab: MainTabView.Tab = .home
    @Environment(ThemeManager.self) private var themeManager
    
    private let environment: AppEnvironment
    
    init(environment: AppEnvironment) {
        self.environment = environment
        self.router = LaunchRouter(
            authClient: environment.authClient,
            settingsRepository: environment.settingsRepository
        )
    }
    
    private var theme: SettingsDTO.Theme {
        switch themeManager.selected {
        case .system: return .system
        case .light: return .light
        case .dark: return .dark
        case .aurora: return .aurora
        case .obsidian: return .obsidian
        }
    }
    
    var body: some View {
        Group {
            switch router.destination {
            case .signIn:
                SignInView(authClient: environment.authClient)
                    .transition(.opacity)
                
            case .main:
                MainTabView(
                    selectedTab: $selectedTab,
                    homeViewModel: environment.compositionRoot.makeHomeViewModel(),
                    wakeFlowViewModel: environment.compositionRoot.makeWakeFlowViewModel(),
                    settingsViewModel: environment.compositionRoot.makeSettingsViewModel(),
                    profileViewModel: environment.compositionRoot.makeProfileViewModel()
                )
                .transition(.opacity)
            }
        }
        .appEnvironment(environment)
        .ratingPrompt(client: environment.ratingClient)
        .preferredColorScheme(colorScheme)
        .refreshOnThemeChange()
        .fullScreenCover(isPresented: Binding(
            get: { router.shouldShowOnboarding },
            set: { _ in }
        )) {
            OnboardingContainerView {
                Task {
                    await router.completeOnboarding()
                }
            }
        }
        .task {
            await loadTheme()
            await router.start()
        }
        .onDisappear {
            router.stop()
        }
        .onChange(of: router.destination) { _, newDestination in
            // Reset to home tab when navigating to main (after login)
            if case .main = newDestination {
                selectedTab = .home
            }
        }
        .onChange(of: themeManager.selected) { _, _ in
            applyThemeToDesignSystem(theme)
        }
        .onAppear {
            // Ensure theme is applied on first appearance
            applyThemeToDesignSystem(theme)
        }
    }
    
    // MARK: - Theme Handling
    
    private var colorScheme: ColorScheme? {
        switch theme {
        case .system: return nil
        case .light, .aurora: return .light
        case .dark, .obsidian: return .dark
        }
    }
    
    private func loadTheme() async {
        do {
            let settings = try await environment.settingsRepository.load()
            
            // Map to ThemeManager theme
            let managerTheme: ThemeManager.Theme
            switch settings.theme {
            case .system: managerTheme = .system
            case .light: managerTheme = .light
            case .dark: managerTheme = .dark
            case .aurora: managerTheme = .aurora
            case .obsidian: managerTheme = .obsidian
            }
            
            themeManager.selected = managerTheme
            AppLogger.debug("Theme loaded: \(settings.theme.rawValue)", category: AppLogger.ui)
        } catch {
            // Use default if settings don't exist
            themeManager.selected = .system
            AppLogger.debug("No theme settings, using system default", category: AppLogger.ui)
        }
    }
    
    private func applyThemeToDesignSystem(_ theme: SettingsDTO.Theme) {
        let scheme: ColorScheme
        switch theme {
        case .system:
            scheme = UITraitCollection.current.userInterfaceStyle == .dark ? .dark : .light
        case .light, .aurora:
            scheme = .light
        case .dark, .obsidian:
            scheme = .dark
        }
        
        DSColors.setTheme(theme.rawValue, colorScheme: scheme)
        AppLogger.debug("Applied theme to design system: \(theme.rawValue)", category: AppLogger.ui)
    }
}
