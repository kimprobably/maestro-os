import SwiftUI
import Core
import Auth
import Storage

/// Manages app-level routing based on authentication and onboarding state
@MainActor
@available(iOS 17.0, *)
@Observable
public final class LaunchRouter {
    
    /// Current routing destination
    public enum Destination {
        case signIn
        case main
    }
    
    /// Current destination - starts at signIn, will switch to main if authenticated
    public private(set) var destination: Destination = .signIn
    
    /// Whether to show onboarding modal
    public private(set) var shouldShowOnboarding: Bool = false
    
    /// Auth client for state observation
    private let authClient: any AuthClient

    /// Settings repository to check onboarding status
    private let settingsRepository: any SettingsRepository
    
    /// Auth state observation task
    private nonisolated(unsafe) var authStateTask: Task<Void, Never>?
    
    /// Initialize router with dependencies
    public init(authClient: any AuthClient, settingsRepository: any SettingsRepository) {
        self.authClient = authClient
        self.settingsRepository = settingsRepository
    }
    
    /// Start routing logic
    public func start() async {
        // Check if user has seen onboarding
        do {
            let settings = try await settingsRepository.load()
            let hasSeenOnboarding = settings.hasSeenOnboarding
            
            AppLogger.info("LaunchRouter: hasSeenOnboarding = \(hasSeenOnboarding)", category: AppLogger.ui)
            
            if !hasSeenOnboarding {
                shouldShowOnboarding = true
                AppLogger.info("LaunchRouter: First launch, will show onboarding modal", category: AppLogger.ui)
            }
        } catch {
            // If no settings exist, treat as first launch
            AppLogger.info("LaunchRouter: No settings found, will show onboarding modal", category: AppLogger.ui)
            shouldShowOnboarding = true
        }
        
        // Check auth state and set destination
        let currentUser = await authClient.currentUser()
        AppLogger.info("LaunchRouter: Starting with current user: \(currentUser?.id ?? "nil")", category: AppLogger.ui)
        
        if currentUser != nil {
            destination = .main
            AppLogger.info("LaunchRouter: User authenticated, showing main", category: AppLogger.ui)
        } else {
            destination = .signIn
            AppLogger.info("LaunchRouter: No user, showing sign in", category: AppLogger.ui)
        }
        
        // Observe auth state changes
        observeAuthState()
    }
    
    /// Mark onboarding as complete and dismiss modal
    public func completeOnboarding() async {
        AppLogger.info("LaunchRouter: Marking onboarding as complete", category: AppLogger.ui)
        
        shouldShowOnboarding = false
        
        do {
            var settings = try await settingsRepository.load()
            settings = SettingsDTO(
                theme: settings.theme,
                preferredModel: settings.preferredModel,
                reduceMotion: settings.reduceMotion,
                hasSeenOnboarding: true,
                notificationsEnabled: settings.notificationsEnabled,
                createdAt: settings.createdAt,
                updatedAt: Date()
            )
            try await settingsRepository.save(settings)
        } catch {
            // If no settings exist, create new with onboarding complete
            let newSettings = SettingsDTO(hasSeenOnboarding: true)
            try? await settingsRepository.save(newSettings)
        }
        
        // Destination is already set in start(), no need to change it
        AppLogger.info("LaunchRouter: Onboarding complete, returning to app", category: AppLogger.ui)
    }
    
    /// Stop routing logic
    public func stop() {
        authStateTask?.cancel()
        authStateTask = nil
    }
    
    // MARK: - Private Helpers
    
    private func observeAuthState() {
        authStateTask?.cancel()
        
        // Get stream from nonisolated accessor
        let states = authClient.authStates()
        AppLogger.info("LaunchRouter: Starting auth state observation", category: AppLogger.ui)
        
        // Iterate and update on MainActor (since LaunchRouter is @MainActor)
        authStateTask = Task { @MainActor [weak self] in
            guard let self = self else { return }
            
            for await state in states {
                // Check for cancellation
                if Task.isCancelled {
                    AppLogger.debug("LaunchRouter: Auth state observation cancelled", category: AppLogger.ui)
                    break
                }
                
                AppLogger.info("LaunchRouter: Received auth state: \(state)", category: AppLogger.ui)
                
                // Update destination based on state
                switch state {
                case .authenticated(let user):
                    if self.destination != .main {
                        self.destination = .main
                        AppLogger.info("LaunchRouter: User authenticated (\(user.id)), navigating to main", category: AppLogger.ui)
                    }
                    
                case .unauthenticated:
                    if self.destination != .signIn {
                        self.destination = .signIn
                        AppLogger.info("LaunchRouter: User unauthenticated, navigating to sign in", category: AppLogger.ui)
                    }
                    
                case .refreshing:
                    AppLogger.debug("LaunchRouter: Token refreshing", category: AppLogger.ui)
                }
            }
        }
    }
    
    deinit {
        authStateTask?.cancel()
        authStateTask = nil
    }
}
