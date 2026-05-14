import SwiftUI
import DesignSystem
import FeatureChat
import FeatureSettings

/// Main tab navigation view
@MainActor
struct MainTabView: View {
    
    @Binding var selectedTab: Tab
    @State private var showPaywall = false
    @State private var showSettings = false
    
    /// Tab selection callback for analytics
    let onTabChange: (Tab) -> Void
    
    /// Available tabs
    enum Tab: String, CaseIterable {
        case home
        case chat
        case profile
        
        var title: String {
            switch self {
            case .home: return "Home"
            case .chat: return "Runs"
            case .profile: return "Profile"
            }
        }
        
        var icon: String {
            switch self {
            case .home: return "house.fill"
            case .chat: return "alarm.fill"
            case .profile: return "person.fill"
            }
        }
    }
    
    let homeViewModel: HomeViewModel
    let wakeFlowViewModel: WakeFlowViewModel
    let settingsViewModel: SettingsViewModel
    let profileViewModel: ProfileViewModel
    
    init(
        selectedTab: Binding<Tab>,
        homeViewModel: HomeViewModel,
        wakeFlowViewModel: WakeFlowViewModel,
        settingsViewModel: SettingsViewModel,
        profileViewModel: ProfileViewModel,
        onTabChange: @escaping (Tab) -> Void = { _ in }
    ) {
        self._selectedTab = selectedTab
        self.homeViewModel = homeViewModel
        self.wakeFlowViewModel = wakeFlowViewModel
        self.settingsViewModel = settingsViewModel
        self.profileViewModel = profileViewModel
        self.onTabChange = onTabChange
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(
                viewModel: homeViewModel,
                onNewChat: {
                    selectedTab = .chat
                },
                onShowHistory: {
                    selectedTab = .chat
                },
                onShowUpgrade: {
                    showPaywall = true
                },
                onShowSettings: {
                    selectedTab = .profile
                },
                onSelectConversation: { _ in
                    // TODO: Navigate to specific conversation
                    selectedTab = .chat
                }
            )
                .accessibilityIdentifier("homeTabRoot")
                .tabItem {
                    Label(Tab.home.title, systemImage: Tab.home.icon)
                }
                .tag(Tab.home)
            
            WakeDashboardView(viewModel: wakeFlowViewModel)
                .accessibilityIdentifier("wakeTabRoot")
                .tabItem {
                    Label(Tab.chat.title, systemImage: Tab.chat.icon)
                }
                .tag(Tab.chat)
            
            ProfileView(
                viewModel: profileViewModel,
                settingsViewModel: settingsViewModel,
                onShowPaywall: {
                    showPaywall = true
                },
                onShowSettings: {
                    showSettings = true
                }
            )
                .accessibilityIdentifier("profileTabRoot")
                .tabItem {
                    Label(Tab.profile.title, systemImage: Tab.profile.icon)
                }
                .tag(Tab.profile)
        }
        .tint(DSColors.primary)
        .saiSidebarAdaptable()
        .saiTabBarMinimize(.onScrollDown)
        .onChange(of: selectedTab) { _, newValue in
            onTabChange(newValue)
        }
        .sheet(isPresented: $showPaywall) {
            PaywallView(paymentsClient: settingsViewModel.paymentsClientAccessor) {
                showPaywall = false
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(viewModel: settingsViewModel)
        }
    }
}

#if DEBUG
#Preview {
    @Previewable @State var selectedTab: MainTabView.Tab = .profile
    
    if #available(iOS 17.0, *) {
        let homeVM = HomeViewModel(
            conversationRepository: PreviewMocks.MockConversationRepository()
        )
        
        let profileVM = ProfileViewModel(
            authClient: PreviewMocks.MockAuthClient(),
            paymentsClient: PreviewMocks.MockPaymentsClient()
        )
        
        MainTabView(
            selectedTab: $selectedTab,
            homeViewModel: homeVM,
            wakeFlowViewModel: PreviewComposition.wakeFlowVM(),
            settingsViewModel: PreviewComposition.settingsVM(),
            profileViewModel: profileVM
        )
    }
}
#endif
