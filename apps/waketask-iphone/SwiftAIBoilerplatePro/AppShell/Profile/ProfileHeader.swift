import DesignSystem
import SwiftUI

/// Profile screen header: avatar with edit badge + name + email + tap hint.
struct ProfileHeader: View {
    let viewModel: ProfileViewModel

    var body: some View {
        Button {
            viewModel.startEditingProfile()
        } label: {
            VStack(spacing: DSSpacing.md) {
                avatar
                    .overlay(alignment: .bottomTrailing) { editBadge }

                if let name = viewModel.user?.name {
                    Text(name)
                        .font(DSTypography.titleL)
                        .fontWeight(.bold)
                        .foregroundStyle(DSColors.textPrimary)
                }

                if let email = viewModel.user?.email {
                    Text(email)
                        .font(DSTypography.body)
                        .foregroundStyle(DSColors.textSecondary)
                }

                Text("Tap to edit profile")
                    .font(DSTypography.caption)
                    .foregroundStyle(DSColors.primary)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, DSSpacing.lg)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var avatar: some View {
        if let imageData = viewModel.profileImageData,
           let uiImage = UIImage(data: imageData)
        {
            Image(uiImage: uiImage)
                .resizable()
                .scaledToFill()
                .frame(width: 100, height: 100)
                .clipShape(Circle())
        } else {
            SAIAvatar(
                name: viewModel.user?.name ?? "User",
                size: .xl,
                showsOnlineIndicator: true
            )
            .scaleEffect(1.25)
        }
    }

    private var editBadge: some View {
        ZStack {
            Circle()
                .fill(DSColors.primary)
                .frame(width: 32, height: 32)

            Image(systemName: "pencil")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(DSColors.background)
        }
        .offset(x: 4, y: 4)
    }
}
