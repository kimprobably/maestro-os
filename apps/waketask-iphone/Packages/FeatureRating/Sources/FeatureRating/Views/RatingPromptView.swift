import DesignSystem
import SwiftUI

/// A beautiful pre-prompt popup that asks the user if they'd like to rate the app.
///
/// This is shown BEFORE the native App Store dialog to improve conversion:
/// - Users who are happy will tap "Rate" and see the native dialog
/// - Users who aren't happy will tap "Not now" and avoid a negative review
///
/// The view uses DesignSystem tokens for consistent theming across all 5 themes.
public struct RatingPromptView: View {
    let config: RatingConfig
    let onAccept: () -> Void
    let onDecline: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isAppearing = false
    @State private var starScale: CGFloat = 0.5

    public init(
        config: RatingConfig,
        onAccept: @escaping () -> Void,
        onDecline: @escaping () -> Void
    ) {
        self.config = config
        self.onAccept = onAccept
        self.onDecline = onDecline
    }

    public var body: some View {
        ZStack {
            // Dimmed backdrop
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture { onDecline() }

            // Card
            promptCard
                .padding(.horizontal, DSSpacing.xl)
                .scaleEffect(isAppearing ? 1.0 : 0.85)
                .opacity(isAppearing ? 1.0 : 0)
        }
        .onAppear {
            withAnimation(reduceMotion ? .none : .spring(response: 0.45, dampingFraction: 0.75)) {
                isAppearing = true
            }
            withAnimation(reduceMotion ? .none : .spring(response: 0.6, dampingFraction: 0.5).delay(0.15)) {
                starScale = 1.0
            }
        }
        .accessibilityAddTraits(.isModal)
    }

    // MARK: - Card Content

    private var promptCard: some View {
        VStack(spacing: DSSpacing.lg) {
            // Icon
            iconView

            // Text content
            textContent

            // Buttons
            buttonStack
        }
        .padding(.vertical, DSSpacing.xl + DSSpacing.sm)
        .padding(.horizontal, DSSpacing.xl)
        .saiGlass(
            .regular,
            in: RoundedRectangle(cornerRadius: DSRadius.lg, style: .continuous)
        )
        .elevation(DSElevation.level3)
    }

    private var iconView: some View {
        ZStack {
            Circle()
                .fill(DSColors.surfaceTinted)
                .frame(width: 72, height: 72)

            Image(systemName: config.icon)
                .font(.system(size: 32, weight: .medium))
                .foregroundStyle(DSGradient.primaryLinear)
                .scaleEffect(starScale)
        }
        .accessibilityHidden(true)
    }

    private var textContent: some View {
        VStack(spacing: DSSpacing.sm) {
            Text(config.title)
                .font(DSTypography.titleL)
                .foregroundStyle(DSColors.textPrimary)
                .multilineTextAlignment(.center)

            Text(config.message)
                .font(DSTypography.body)
                .foregroundStyle(DSColors.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(DSTypography.bodyLineSpacing)
        }
    }

    private var buttonStack: some View {
        VStack(spacing: DSSpacing.md) {
            // Primary CTA
            SAIButton(config.acceptTitle, style: .primary, size: .lg, layout: .block) {
                onAccept()
            }
            .accessibilityLabel("Rate this app on the App Store")

            // Secondary decline
            SAIButton(config.declineTitle, style: .quiet, size: .md) {
                onDecline()
            }
            .accessibilityLabel("Dismiss rating prompt")
        }
        .padding(.top, DSSpacing.sm)
    }
}

// MARK: - Preview

#if DEBUG
    #Preview("Rating Prompt - Default") {
        ZStack {
            DSColors.background.ignoresSafeArea()

            RatingPromptView(
                config: .default,
                onAccept: {},
                onDecline: {}
            )
        }
    }

    #Preview("Rating Prompt - Custom") {
        ZStack {
            DSColors.background.ignoresSafeArea()

            RatingPromptView(
                config: RatingConfig(
                    title: "Loving Capishi?",
                    message: "You've been crushing your interviews! Help others discover Capishi by leaving a quick review.",
                    acceptTitle: "Rate Capishi",
                    declineTitle: "Maybe later",
                    icon: "hands.sparkles"
                ),
                onAccept: {},
                onDecline: {}
            )
        }
    }

    #Preview("Rating Prompt - Dark") {
        ZStack {
            DSColors.background.ignoresSafeArea()

            RatingPromptView(
                config: .default,
                onAccept: {},
                onDecline: {}
            )
        }
        .preferredColorScheme(.dark)
    }
#endif
