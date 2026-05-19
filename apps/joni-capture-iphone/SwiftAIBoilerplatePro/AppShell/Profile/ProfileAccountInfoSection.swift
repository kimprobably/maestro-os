import SwiftUI
import DesignSystem

/// "Account" section with User ID and Account Type rows.
struct ProfileAccountInfoSection: View {

    let viewModel: ProfileViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            DSSectionHeader(title: "Account")

            VStack(spacing: 0) {
                userIDRow
                Divider().padding(.leading, 56)
                accountTypeRow
            }
            .background(DSColors.surface)
            .cornerRadius(DSRadius.md)
            .padding(.horizontal, DSSpacing.lg)
        }
    }

    private var userIDRow: some View {
        HStack {
            Image(systemName: "person.text.rectangle")
                .font(.title3)
                .foregroundStyle(DSColors.primary)
                .frame(width: 24)

            Text("User ID")
                .font(DSTypography.body)
                .foregroundStyle(DSColors.textPrimary)

            Spacer()

            Text(String(viewModel.user?.id.prefix(8) ?? "—") + "...")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
        .padding(DSSpacing.lg)
    }

    private var accountTypeRow: some View {
        let isActive = viewModel.subscriptionStatus?.isActive == true
        return HStack {
            Image(systemName: isActive ? "star.fill" : "person.fill")
                .font(.title3)
                .foregroundStyle(isActive ? Color.yellow : DSColors.primary)
                .frame(width: 24)

            Text("Account Type")
                .font(DSTypography.body)
                .foregroundStyle(DSColors.textPrimary)

            Spacer()

            Text(isActive ? "Pro" : "Free")
                .font(DSTypography.body)
                .fontWeight(.semibold)
                .foregroundStyle(isActive ? DSColors.primary : DSColors.textSecondary)
        }
        .padding(DSSpacing.lg)
    }
}
