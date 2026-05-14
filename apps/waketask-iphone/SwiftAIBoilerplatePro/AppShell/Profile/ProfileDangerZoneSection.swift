import SwiftUI
import DesignSystem

/// "Danger Zone" section: Sign Out + Delete Account.
/// Confirmation alerts live on the parent ProfileView (bound to `viewModel.show…Confirmation`).
struct ProfileDangerZoneSection: View {

    let viewModel: ProfileViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "Danger Zone", subtitle: "Be careful — irreversible actions.")

            VStack(spacing: 0) {
                dangerActionRow(title: "Sign Out", icon: "rectangle.portrait.and.arrow.right") {
                    viewModel.showSignOutConfirmation = true
                }

                Divider().padding(.leading, 56)

                dangerActionRow(title: "Delete Account", icon: "trash") {
                    viewModel.showDeleteAccountConfirmation = true
                }
            }
            .background(DSColors.surface)
            .cornerRadius(DSRadius.md)
            .padding(.horizontal, DSSpacing.lg)
        }
    }

    private func dangerActionRow(title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: DSSpacing.md) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(.red)
                    .frame(width: 24)

                Text(title)
                    .font(.body)
                    .foregroundStyle(.red)

                Spacer()
            }
            .padding(DSSpacing.lg)
        }
        .buttonStyle(.plain)
    }
}
