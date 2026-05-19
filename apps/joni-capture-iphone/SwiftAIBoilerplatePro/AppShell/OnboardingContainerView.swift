import SwiftUI
import DesignSystem
import Core

// MARK: - Onboarding Style

/// Navigation style for onboarding flow
enum OnboardingStyle {
    /// Swipe-only navigation with dots and CTA (modern, premium feel)
    case swipeOnly
    /// Traditional button navigation with Next/Back (classic style)
    case buttons
}

/// Onboarding container with page navigation
/// Shows a series of onboarding pages with dots indicator and navigation buttons
struct OnboardingContainerView: View {
    
    // MARK: - Properties
    
    let pages: [OnboardingPage]
    let style: OnboardingStyle
    let onComplete: () -> Void
    
    @State private var currentPage = 0
    
    init(
        pages: [OnboardingPage] = OnboardingPage.defaultPages,
        style: OnboardingStyle = .swipeOnly,
        onComplete: @escaping () -> Void
    ) {
        self.pages = pages
        self.style = style
        self.onComplete = onComplete
    }
    
    // MARK: - Body
    
    var body: some View {
        ZStack {
            // Background
            DSColors.background
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Skip button
                HStack {
                    Spacer()
                    Button("Skip") {
                        completeOnboarding()
                    }
                    .font(.body)
                    .foregroundStyle(DSColors.textSecondary)
                    .padding(.horizontal, DSSpacing.lg)
                    .padding(.top, DSSpacing.md)
                    .accessibilityLabel("Skip onboarding")
                    .accessibilityHint("Double tap to skip the onboarding and continue to the app")
                }
                .opacity(isLastPage ? 0 : 1)
                .accessibilityHidden(isLastPage)
                
                // Pages
                TabView(selection: $currentPage) {
                    ForEach(Array(pages.enumerated()), id: \.element.id) { index, page in
                        OnboardingPageView(page: page)
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentPage)
                .onChange(of: currentPage) { _, _ in
                    // Light haptic feedback on page change
                    let impact = UIImpactFeedbackGenerator(style: .light)
                    impact.impactOccurred()
                }
                
                // Bottom area: Dots + CTA
                VStack(spacing: DSSpacing.lg) {
                    // Custom page indicator dots with gradient
                    HStack(spacing: DSSpacing.sm) {
                        ForEach(0..<pages.count, id: \.self) { index in
                            Capsule()
                                .fill(index == currentPage ? DSGradient.primaryLinear : LinearGradient(colors: [DSColors.textSecondary.opacity(0.3)], startPoint: .leading, endPoint: .trailing))
                                .frame(width: index == currentPage ? 24 : 8, height: 8)
                                .animation(.spring(response: 0.3), value: currentPage)
                                .onTapGesture {
                                    withAnimation {
                                        currentPage = index
                                    }
                                }
                                .accessibilityLabel("Page \(index + 1) of \(pages.count)")
                                .accessibilityAddTraits(index == currentPage ? [.isSelected] : [])
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Page \(currentPage + 1) of \(pages.count)")
                    
                    // Navigation: swipeOnly or buttons style
                    Group {
                        if style == .swipeOnly {
                            // Swipe-only mode: Show CTA only on last page
                            if isLastPage {
                                SAIButton(
                                    "Get Started",
                                    style: .primary,
                                    size: .lg,
                                    icon: Image(systemName: "arrow.right")
                                ) {
                                    completeOnboarding()
                                }
                                .accessibilityLabel("Get Started")
                                .accessibilityHint("Double tap to complete onboarding and start using the app")
                            }
                        } else {
                            // Button mode: Traditional Next/Back buttons
                            navigationButtons
                        }
                    }
                }
                .padding(.horizontal, DSSpacing.lg)
                .padding(.bottom, DSSpacing.xl)
            }
        }
    }
    
    // MARK: - Subviews
    
    /// Traditional button navigation (used when style == .buttons)
    @ViewBuilder
    private var navigationButtons: some View {
        if currentPage == 0 {
            // First page: centered Next button
            SAIButton(
                "Next",
                style: .primary,
                size: .lg
            ) {
                withAnimation {
                    currentPage += 1
                }
            }
        } else {
            // Other pages: Back and Next with consistent widths
            HStack(spacing: DSSpacing.md) {
                SAIButton(
                    "Back",
                    style: .secondary,
                    size: .lg,
                    icon: Image(systemName: "chevron.left")
                ) {
                    withAnimation {
                        currentPage -= 1
                    }
                }
                
                SAIButton(
                    isLastPage ? "Get Started" : "Next",
                    style: .primary,
                    size: .lg,
                    icon: isLastPage ? Image(systemName: "arrow.right") : nil
                ) {
                    if isLastPage {
                        completeOnboarding()
                    } else {
                        withAnimation {
                            currentPage += 1
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Helpers
    
    private var isLastPage: Bool {
        currentPage == pages.count - 1
    }
    
    private func completeOnboarding() {
        // Success haptic feedback
        let notification = UINotificationFeedbackGenerator()
        notification.notificationOccurred(.success)
        
        AppLogger.info("Onboarding completed", category: AppLogger.ui)
        onComplete()
    }
}

// MARK: - Preview

#if DEBUG
#Preview("Swipe-Only (Default)") {
    OnboardingContainerView {
        print("Onboarding completed!")
    }
}

#Preview("Button Navigation") {
    OnboardingContainerView(style: .buttons) {
        print("Onboarding with buttons completed!")
    }
}

#Preview("Custom Pages") {
    let customPages = [
        OnboardingPage(
            title: "Welcome",
            description: "This is a custom onboarding flow",
            systemImage: "hand.wave",
            accentColor: "blue"
        ),
        OnboardingPage(
            title: "Custom Feature",
            description: "Showcase your unique features here",
            systemImage: "star",
            accentColor: "yellow"
        )
    ]
    
    return OnboardingContainerView(pages: customPages) {
        print("Custom onboarding completed!")
    }
}
#endif

