import SwiftUI
import DesignSystem

/// Optional "AI" section that reveals the AI Memories manager when the host
/// wires an `onShowMemoryManagement` callback.
struct SettingsAISection: View {

    let onShowMemoryManagement: () -> Void

    var body: some View {
        Section {
            Button {
                onShowMemoryManagement()
            } label: {
                HStack {
                    Image(systemName: "brain")
                        .foregroundStyle(DSColors.accentPrimary)
                    Text("AI Memories")
                        .foregroundStyle(DSColors.textPrimary)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(DSColors.textSecondary)
                }
            }
            .buttonStyle(.plain)
        } header: {
            Text("AI")
        } footer: {
            Text("View and manage facts the AI has learned about you from conversations.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
    }
}
