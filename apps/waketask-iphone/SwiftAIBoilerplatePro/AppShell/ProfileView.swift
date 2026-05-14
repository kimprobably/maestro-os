import DesignSystem
import FeatureSettings
import SwiftUI

/// Profile tab — owns navigation, alerts, and sheet presentation.
/// Visual sections live in `AppShell/Profile/`.
struct ProfileView: View {
    @State private var viewModel: ProfileViewModel
    @State private var settingsViewModel: SettingsViewModel
    @State private var showSettings = false

    let onShowPaywall: () -> Void
    let onShowSettings: () -> Void

    init(
        viewModel: ProfileViewModel,
        settingsViewModel: SettingsViewModel,
        onShowPaywall: @escaping () -> Void,
        onShowSettings: @escaping () -> Void = {}
    ) {
        self.viewModel = viewModel
        self.settingsViewModel = settingsViewModel
        self.onShowPaywall = onShowPaywall
        self.onShowSettings = onShowSettings
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DSSpacing.xl) {
                    ProfileHeader(viewModel: viewModel)

                    ProfileAccountInfoSection(viewModel: viewModel)

                    if let subscription = viewModel.subscriptionStatus {
                        ProfileSubscriptionSection(
                            subscription: subscription,
                            viewModel: viewModel,
                            onShowPaywall: onShowPaywall
                        )
                    }

                    ProfileQuickActionsSection {
                        showSettings = true
                    }

                    ProfileDangerZoneSection(viewModel: viewModel)

                    ProfileAboutSection()
                }
                .padding(.vertical, DSSpacing.lg)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundStyle(DSColors.textPrimary)
                    }
                }
            }
            .task {
                await viewModel.loadProfile()
            }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {
                    viewModel.errorMessage = nil
                }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
            .alert("Success", isPresented: Binding(
                get: { viewModel.successMessage != nil },
                set: { if !$0 { viewModel.successMessage = nil } }
            )) {
                Button("OK", role: .cancel) {
                    viewModel.successMessage = nil
                }
            } message: {
                Text(viewModel.successMessage ?? "")
            }
            .alert("Sign Out", isPresented: $viewModel.showSignOutConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task { await viewModel.signOut() }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .alert("Delete Account", isPresented: $viewModel.showDeleteAccountConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task { await viewModel.deleteAccount() }
                }
            } message: {
                Text("This action cannot be undone. All your data will be permanently deleted.")
            }
            .sheet(isPresented: $viewModel.showEditProfile) {
                EditProfileSheet(viewModel: viewModel)
            }
            .sheet(isPresented: $showSettings) {
                SettingsView(viewModel: settingsViewModel)
            }
        }
    }
}

#if DEBUG
    #Preview {
        if #available(iOS 17.0, *) {
            let viewModel = ProfileViewModel(
                authClient: PreviewMocks.MockAuthClient(),
                paymentsClient: PreviewMocks.MockPaymentsClient()
            )

            return ProfileView(
                viewModel: viewModel,
                settingsViewModel: PreviewComposition.settingsVM(),
                onShowPaywall: {
                    print("Show paywall tapped")
                }
            )
        } else {
            return Text("iOS 17+ required")
        }
    }
#endif
