import Foundation

/// Onboarding page content configuration
/// See docs/OnboardingModule.md for customization guide
struct OnboardingPage: Identifiable, Equatable {
    let id: UUID
    let title: String
    let description: String
    let systemImage: String
    let imageName: String? // Optional: Custom image from assets to replace SF Symbol
    let accentColor: String // Hex color or system color name
    
    init(
        id: UUID = UUID(),
        title: String,
        description: String,
        systemImage: String,
        imageName: String? = nil,
        accentColor: String = "blue"
    ) {
        self.id = id
        self.title = title
        self.description = description
        self.systemImage = systemImage
        self.imageName = imageName
        self.accentColor = accentColor
    }
}

// MARK: - Default Content

extension OnboardingPage {
    
    /// Default onboarding pages for the boilerplate
    /// Buyers should customize these for their specific app
    static let defaultPages: [OnboardingPage] = [
        OnboardingPage(
            title: "AI-Powered Conversations",
            description: "Have natural conversations with advanced AI. Get answers, ideas, and assistance instantly.",
            systemImage: "brain.head.profile",
            accentColor: "blue"
        ),
        OnboardingPage(
            title: "Your Data, Secure",
            description: "All conversations are encrypted and stored securely. Your privacy is our priority.",
            systemImage: "lock.shield",
            accentColor: "green"
        ),
        OnboardingPage(
            title: "Seamless Experience",
            description: "Pick up where you left off on any device. Your chat history syncs automatically.",
            systemImage: "arrow.triangle.2.circlepath",
            accentColor: "purple"
        )
    ]
}

