import SwiftUI
import DesignSystem

/// "Privacy & Diagnostics" section: one opt-in toggle for crash/usage sharing.
struct SettingsPrivacySection: View {

    let viewModel: SettingsViewModel

    var body: some View {
        Section {
            Toggle("Share Diagnostics", isOn: Binding(
                get: { viewModel.shareDiagnostics },
                set: { newValue in
                    Task { await viewModel.toggleDiagnostics(newValue) }
                }
            ))
            .tint(DSColors.primary)
        } header: {
            Text("Privacy & Diagnostics")
        } footer: {
            Text("Help improve the app by sharing crash reports and usage statistics. No personal information is collected.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
    }
}
