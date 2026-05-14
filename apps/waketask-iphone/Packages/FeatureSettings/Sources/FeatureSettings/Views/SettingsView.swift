import DesignSystem
import SwiftUI

/// Settings screen. Composition only — each section lives in `Views/Settings/`.
public struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: SettingsViewModel
    @State private var showPaywall = false
    @State private var showTerms = false
    @State private var showPrivacy = false
    @State private var showSubscriptionTerms = false

    let onShowMemoryManagement: (() -> Void)?

    public init(
        viewModel: SettingsViewModel,
        onShowMemoryManagement: (() -> Void)? = nil
    ) {
        self.viewModel = viewModel
        self.onShowMemoryManagement = onShowMemoryManagement
    }

    public var body: some View {
        NavigationStack {
            ZStack {
                form
                    .formStyle(.grouped)
                    .navigationTitle("Settings")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar { doneToolbarItem }
                    .task { await viewModel.appear() }

                if viewModel.isLoading {
                    loadingOverlay
                }
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView(paymentsClient: viewModel.paymentsClientAccessor) {
                    showPaywall = false
                }
            }
            .sheet(isPresented: $showTerms) {
                LegalDocumentView.terms()
            }
            .sheet(isPresented: $showPrivacy) {
                LegalDocumentView.privacy()
            }
            .sheet(isPresented: $showSubscriptionTerms) {
                LegalDocumentView.subscriptionTerms()
            }
        }
        .refreshOnThemeChange()
        .toastContainer()
    }

    // MARK: - Form

    private var form: some View {
        Form {
            if let error = viewModel.errorMessage {
                Section {
                    EmptyView()
                } header: {
                    SettingsErrorBanner(message: error)
                }
            }

            SettingsAppearanceSection(viewModel: viewModel)

            SettingsSubscriptionSection(viewModel: viewModel) {
                showPaywall = true
            }

            if let showMemory = onShowMemoryManagement {
                SettingsAISection(onShowMemoryManagement: showMemory)
            }

            SettingsNotificationsSection(viewModel: viewModel)
            SettingsAccessibilitySection(viewModel: viewModel)
            SettingsPrivacySection(viewModel: viewModel)
            SettingsLegalSection(
                onShowPrivacy: { showPrivacy = true },
                onShowTerms: { showTerms = true },
                onShowSubscriptionTerms: { showSubscriptionTerms = true }
            )
            SettingsAboutSection()

            #if DEBUG
                SettingsDebugSection()
            #endif
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var doneToolbarItem: some ToolbarContent {
        ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
                dismiss()
            }
            .fontWeight(.semibold)
        }
    }

    // MARK: - Loading

    private var loadingOverlay: some View {
        Color.black.opacity(0.2)
            .ignoresSafeArea()
            .overlay {
                ProgressView()
                    .scaleEffect(1.2)
                    .padding(DSSpacing.xl)
                    .saiGlass(
                        .regular,
                        in: RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous)
                    )
            }
    }
}
