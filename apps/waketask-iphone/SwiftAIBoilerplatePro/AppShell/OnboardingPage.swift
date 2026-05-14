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
            title: "Wake With Intent",
            description: "Build alarms with strictness, mission stacks, and a wake-check that keeps you moving after dismissal.",
            systemImage: "alarm.fill",
            accentColor: "orange"
        ),
        OnboardingPage(
            title: "Proof You Actually Woke Up",
            description: "Every alarm run is logged in a reliability timeline: trigger, mission completion, wake-check status, and escalation.",
            systemImage: "checklist.checked",
            accentColor: "green"
        ),
        OnboardingPage(
            title: "Private By Default",
            description: "Wake validation runs on-device for MVP. No ad interruptions appear in the critical wake path.",
            systemImage: "hand.raised.shield",
            accentColor: "indigo"
        )
    ]
}
