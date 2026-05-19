import SwiftUI
import DesignSystem

/// "Accessibility & Feel" section: reduce motion + haptic feedback toggles.
struct SettingsAccessibilitySection: View {

    let viewModel: SettingsViewModel

    var body: some View {
        Section {
            Toggle("Reduce Motion", isOn: Binding(
                get: { viewModel.reduceMotion },
                set: { newValue in
                    Task { await viewModel.toggleReduceMotion(newValue) }
                }
            ))
            .tint(DSColors.primary)

            Toggle("Haptic Feedback", isOn: Binding(
                get: { viewModel.hapticsEnabled },
                set: { newValue in
                    Task { await viewModel.toggleHaptics(newValue) }
                }
            ))
            .tint(DSColors.primary)
        } header: {
            Text("Accessibility & Feel")
        } footer: {
            Text("Reduce animations and control haptic feedback for a more comfortable experience.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
    }
}
