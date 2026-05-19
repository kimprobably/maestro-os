import SwiftUI
import DesignSystem
import Storage

/// "Appearance" section: theme picker rows with a premium-theme footer hint.
struct SettingsAppearanceSection: View {

    let viewModel: SettingsViewModel

    var body: some View {
        Section {
            ForEach(SettingsDTO.Theme.allCases, id: \.self) { theme in
                ThemeOptionRow(
                    theme: theme,
                    isSelected: viewModel.theme == theme
                ) {
                    Task {
                        await viewModel.setTheme(theme)
                    }
                }
            }
        } header: {
            Text("Appearance")
        } footer: {
            if viewModel.theme == .aurora || viewModel.theme == .obsidian {
                Text("Premium themes provide unique color palettes and visual styles.")
                    .font(DSTypography.caption)
                    .foregroundStyle(DSColors.textSecondary)
            }
        }
    }
}

// MARK: - Theme Option Row

private struct ThemeOptionRow: View {
    let theme: SettingsDTO.Theme
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: DSSpacing.md) {
                icon
                labelBlock
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title3)
                        .foregroundStyle(DSColors.accentPrimary)
                }
            }
            .padding(DSSpacing.md)
            .background(isSelected ? DSColors.surfaceTinted : DSColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: DSRadius.md))
            .overlay(
                RoundedRectangle(cornerRadius: DSRadius.md)
                    .strokeBorder(
                        isSelected ? DSColors.accentPrimary.opacity(0.5) : DSColors.borderHairline,
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private var icon: some View {
        Image(systemName: theme.symbolName)
            .font(.title3)
            .foregroundStyle(iconColor)
            .frame(width: 40, height: 40)
            .background(iconBackground)
            .clipShape(RoundedRectangle(cornerRadius: DSRadius.sm))
    }

    private var labelBlock: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: DSSpacing.xs) {
                Text(theme.displayName)
                    .font(DSTypography.body)
                    .fontWeight(.medium)
                    .foregroundStyle(DSColors.textPrimary)

                if theme.isPremium {
                    Text("PRO")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(DSGradient.primaryLinear)
                        .clipShape(Capsule())
                }
            }

            Text(theme.description)
                .font(DSTypography.caption)
                .foregroundStyle(DSColors.textSecondary)
        }
    }

    private var iconColor: Color {
        switch theme {
        case .system: return DSColors.accentPrimary
        case .light: return .orange
        case .dark: return .indigo
        case .aurora: return Color(red: 1.0, green: 0.45, blue: 0.6)
        case .obsidian: return Color(red: 0.4, green: 0.8, blue: 1.0)
        }
    }

    private var iconBackground: Color {
        iconColor.opacity(0.12)
    }
}
