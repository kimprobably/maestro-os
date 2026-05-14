import SwiftUI
import DesignSystem

/// "Notifications" section: enable toggle + "open iOS Settings" escape hatch
/// when permission is revoked.
struct SettingsNotificationsSection: View {

    let viewModel: SettingsViewModel

    var body: some View {
        Section("Notifications") {
            Toggle("Enable Notifications", isOn: Binding(
                get: { viewModel.notificationsEnabled },
                set: { newValue in
                    Task { await viewModel.toggleNotifications(newValue) }
                }
            ))
            .tint(DSColors.primary)

            if !viewModel.notificationPermissionGranted && viewModel.notificationsEnabled {
                Button {
                    viewModel.openSystemNotificationSettings()
                } label: {
                    HStack {
                        Image(systemName: "exclamationmark.triangle")
                            .foregroundStyle(.orange)
                        Text("Grant Permission in Settings")
                            .foregroundStyle(DSColors.textPrimary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(DSColors.textSecondary)
                    }
                }
            }
        }
    }
}
