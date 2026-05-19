import SwiftUI
import DesignSystem

/// Individual onboarding page view
/// Displays icon, title, and description for a single onboarding step
struct OnboardingPageView: View {
    
    let page: OnboardingPage
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isVisible = false
    
    var body: some View {
        VStack(spacing: DSSpacing.xl) {
            Spacer()
            
            // Icon with gradient background
            // CUSTOMIZATION: Replace this ZStack with custom illustrations or animations
            // Example: Image(page.imageName ?? "default-illustration")
            ZStack {
                Circle()
                    .fill(DSGradient.primaryLinear.opacity(0.15))
                    .frame(width: 160, height: 160)
                
                if let imageName = page.imageName {
                    // Custom image from assets
                    Image(imageName)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 120, height: 120)
                } else {
                    // Default: SF Symbol
                    Image(systemName: page.systemImage)
                        .font(.system(size: 80))
                        .foregroundStyle(DSGradient.primaryLinear)
                        .symbolRenderingMode(.hierarchical)
                }
            }
            
            // Content Card
            SAICard(style: .tinted) {
                VStack(spacing: DSSpacing.lg) {
                    Text(page.title)
                        .font(DSTypography.titleL)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(DSColors.textPrimary)
                    
                    Text(page.description)
                        .font(DSTypography.body)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(DSColors.textSecondary)
                        .lineSpacing(4)
                }
                .padding(DSSpacing.xl)
            }
            .padding(.horizontal, DSSpacing.lg)
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        // Subtle fade and scale animation when page appears (respects Reduce Motion)
        .opacity(reduceMotion ? 1 : (isVisible ? 1 : 0.3))
        .scaleEffect(reduceMotion ? 1 : (isVisible ? 1 : 0.95))
        .animation(.easeOut(duration: 0.5), value: isVisible)
        .onAppear {
            isVisible = true
        }
        .onDisappear {
            isVisible = false
        }
        // Accessibility: Combine page content for better VoiceOver experience
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(page.title). \(page.description)")
    }
    
    // MARK: - Helpers
    
    private func colorForAccent(_ accent: String) -> Color {
        switch accent.lowercased() {
        case "blue": return .blue
        case "green": return .green
        case "purple": return .purple
        case "orange": return .orange
        case "red": return .red
        case "pink": return .pink
        case "yellow": return .yellow
        case "primary": return DSColors.primary
        default: return .blue
        }
    }
}

// MARK: - Preview

#if DEBUG
#Preview {
    OnboardingPageView(page: OnboardingPage.defaultPages[0])
}

#Preview("All Pages") {
    TabView {
        ForEach(OnboardingPage.defaultPages) { page in
            OnboardingPageView(page: page)
        }
    }
    .tabViewStyle(.page)
    .indexViewStyle(.page(backgroundDisplayMode: .always))
}
#endif

