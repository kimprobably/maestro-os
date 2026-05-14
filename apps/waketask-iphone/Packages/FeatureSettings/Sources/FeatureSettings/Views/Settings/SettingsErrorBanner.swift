import DesignSystem
import SwiftUI

/// Inline error banner used as the `header` of a hidden `Section` at the top
/// of the Settings form.
struct SettingsErrorBanner: View {
    let message: String

    var body: some View {
        HStack(spacing: DSSpacing.md) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
            Text(message)
                .font(DSTypography.caption)
                .foregroundStyle(.red)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(DSSpacing.md)
        .background(
            RoundedRectangle(cornerRadius: DSSpacing.md)
                .fill(Color.red.opacity(0.12))
        )
        .accessibilityLabel("Error")
        .accessibilityAddTraits(.updatesFrequently)
        .animation(.easeInOut, value: message)
    }
}
