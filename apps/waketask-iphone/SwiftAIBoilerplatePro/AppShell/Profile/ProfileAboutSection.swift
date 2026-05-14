import DesignSystem
import SwiftUI

/// "About" section: version + build rows.
struct ProfileAboutSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "About")

            VStack(spacing: 0) {
                infoRow(label: "Version", value: Bundle.main.appVersion)
                Divider().padding(.leading, DSSpacing.lg)
                infoRow(label: "Build", value: Bundle.main.buildNumber)
            }
            .background(DSColors.surface)
            .cornerRadius(DSRadius.md)
            .padding(.horizontal, DSSpacing.lg)
        }
    }

    private func infoRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(DSTypography.body)
                .foregroundStyle(DSColors.textPrimary)

            Spacer()

            Text(value)
                .font(DSTypography.body)
                .foregroundStyle(DSColors.textSecondary)
        }
        .padding(DSSpacing.lg)
    }
}

extension Bundle {
    var appVersion: String {
        infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    var buildNumber: String {
        infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }
}
