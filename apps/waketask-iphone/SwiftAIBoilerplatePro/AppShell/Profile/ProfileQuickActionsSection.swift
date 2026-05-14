import Core
import DesignSystem
import SwiftUI

/// "Quick Actions" section: Settings, Help & Support, Privacy Policy, Terms of Service.
struct ProfileQuickActionsSection: View {
    let onShowSettings: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "Quick Actions")

            VStack(spacing: 0) {
                row(title: "Settings", icon: "gearshape") {
                    onShowSettings()
                }

                Divider().padding(.leading, 56)

                row(title: "Help & Support", icon: "questionmark.circle") {
                    AppLogger.info("Help tapped", category: AppLogger.ui)
                }

                Divider().padding(.leading, 56)

                row(title: "Privacy Policy", icon: "hand.raised") {
                    AppLogger.info("Privacy tapped", category: AppLogger.ui)
                }

                Divider().padding(.leading, 56)

                row(title: "Terms of Service", icon: "doc.text") {
                    AppLogger.info("Terms tapped", category: AppLogger.ui)
                }
            }
            .background(DSColors.surface)
            .cornerRadius(DSRadius.md)
            .padding(.horizontal, DSSpacing.lg)
        }
    }

    private func row(title: String, icon: String, onTap: @escaping () -> Void) -> some View {
        SAIListRow(
            title: title,
            leading: Image(systemName: icon)
        ) {
            Image(systemName: "chevron.right")
                .font(.system(size: 14))
                .foregroundStyle(DSColors.textSecondary)
        }
        .onTap(action: onTap)
    }
}
