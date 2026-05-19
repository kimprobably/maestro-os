import SwiftUI
import PhotosUI
import DesignSystem

/// Modal sheet for editing display name + avatar.
struct EditProfileSheet: View {

    @Bindable var viewModel: ProfileViewModel
    @FocusState private var isNameFieldFocused: Bool

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DSSpacing.xl) {
                    avatarSection
                        .padding(.top, DSSpacing.xl)

                    nameInputCard

                    if let email = viewModel.user?.email {
                        emailCard(email: email)
                    }
                }
                .padding(.bottom, DSSpacing.xl)
            }
            .contentShape(Rectangle())
            .onTapGesture { isNameFieldFocused = false }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { toolbarContent }
            .onChange(of: viewModel.selectedPhoto) { _, _ in
                Task { await viewModel.loadPhoto() }
            }
        }
    }

    // MARK: - Avatar

    private var avatarSection: some View {
        VStack(spacing: DSSpacing.md) {
            avatarPreview
            photoActions
        }
    }

    private var avatarPreview: some View {
        ZStack {
            if let imageData = viewModel.profileImageData,
               let uiImage = UIImage(data: imageData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 80, height: 80)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .strokeBorder(DSColors.accentPrimary, lineWidth: 2)
                    )
            } else {
                SAIAvatar(
                    name: viewModel.editingName.isEmpty ? "?" : viewModel.editingName,
                    size: .xl,
                    showsOnlineIndicator: false
                )
            }

            if viewModel.isLoadingPhoto {
                ZStack {
                    Circle().fill(Color.black.opacity(0.5))
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                }
                .frame(width: 80, height: 80)
            }
        }
    }

    private var photoActions: some View {
        VStack(spacing: DSSpacing.sm) {
            let hasPhoto = viewModel.profileImageData != nil

            PhotosPicker(
                selection: $viewModel.selectedPhoto,
                matching: .images,
                photoLibrary: .shared()
            ) {
                HStack(spacing: DSSpacing.sm) {
                    Image(systemName: "photo")
                        .font(.system(size: 14, weight: .medium))
                    Text(hasPhoto ? "Change Photo" : "Choose Photo")
                        .font(DSTypography.body)
                        .fontWeight(.medium)
                }
                .foregroundStyle(DSColors.accentPrimary)
                .padding(.horizontal, DSSpacing.md)
                .padding(.vertical, DSSpacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: DSRadius.md)
                        .strokeBorder(DSColors.accentPrimary, lineWidth: 1.5)
                )
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isLoadingPhoto)

            if hasPhoto {
                Button {
                    viewModel.removePhoto()
                } label: {
                    HStack(spacing: DSSpacing.sm) {
                        Image(systemName: "trash")
                            .font(.system(size: 14, weight: .medium))
                        Text("Remove Photo")
                            .font(DSTypography.body)
                            .fontWeight(.medium)
                    }
                    .foregroundStyle(.red)
                    .padding(.horizontal, DSSpacing.md)
                    .padding(.vertical, DSSpacing.sm)
                    .background(
                        RoundedRectangle(cornerRadius: DSRadius.md)
                            .strokeBorder(Color.red.opacity(0.5), lineWidth: 1.5)
                    )
                }
                .buttonStyle(.plain)
            }

            Text("Photos are compressed automatically. Use your Photos app to crop before selecting.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
                .multilineTextAlignment(.center)
        }
    }

    // MARK: - Name

    private var nameInputCard: some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            Text("Display Name")
                .font(DSTypography.titleM)
                .fontWeight(.semibold)
                .foregroundStyle(DSColors.textPrimary)

            TextField("Enter your name", text: $viewModel.editingName)
                .font(DSTypography.body)
                .foregroundStyle(DSColors.textPrimary)
                .textContentType(.name)
                .autocorrectionDisabled()
                .padding(DSSpacing.md)
                .background(DSColors.surface)
                .cornerRadius(DSRadius.md)
                .overlay(
                    RoundedRectangle(cornerRadius: DSRadius.md)
                        .strokeBorder(
                            isNameFieldFocused ? DSColors.accentPrimary.opacity(0.5) : DSColors.borderHairline,
                            lineWidth: isNameFieldFocused ? 2 : 1
                        )
                )
                .focused($isNameFieldFocused)

            Text("Your display name is visible to you only.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
        .padding(.horizontal, DSSpacing.lg)
    }

    // MARK: - Email

    private func emailCard(email: String) -> some View {
        VStack(alignment: .leading, spacing: DSSpacing.md) {
            Text("Email")
                .font(DSTypography.titleM)
                .fontWeight(.semibold)
                .foregroundStyle(DSColors.textPrimary)

            HStack {
                Text(email)
                    .font(DSTypography.body)
                    .foregroundStyle(DSColors.textSecondary)

                Spacer()

                Image(systemName: "lock.fill")
                    .font(.caption)
                    .foregroundStyle(DSColors.textSecondary.opacity(0.5))
            }
            .padding(DSSpacing.md)
            .background(DSColors.surface.opacity(0.5))
            .cornerRadius(DSRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: DSRadius.md)
                    .strokeBorder(DSColors.borderHairline, lineWidth: 1)
            )

            Text("Email cannot be changed after account creation.")
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
        .padding(.horizontal, DSSpacing.lg)
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .cancellationAction) {
            Button("Cancel") {
                viewModel.cancelEditing()
            }
            .foregroundStyle(DSColors.textSecondary)
        }

        ToolbarItem(placement: .confirmationAction) {
            Button("Save") {
                Task { await viewModel.saveProfile() }
            }
            .fontWeight(.semibold)
            .foregroundStyle(viewModel.canSave ? DSColors.accentPrimary : DSColors.textSecondary)
            .disabled(!viewModel.canSave || viewModel.isLoading)
        }
    }
}
