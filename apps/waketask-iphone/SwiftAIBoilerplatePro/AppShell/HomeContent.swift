import Foundation

/// Home screen content configuration
/// Buyers can easily customize this to match their app's features and branding
public struct HomeContent {
    // MARK: - Models

    /// Featured content card in carousel
    public struct FeatureItem: Identifiable, Equatable, Sendable {
        public let id: UUID
        public let title: String
        public let description: String
        public let systemImage: String
        public let accentColor: String

        public init(
            id: UUID = UUID(),
            title: String,
            description: String,
            systemImage: String,
            accentColor: String = "blue"
        ) {
            self.id = id
            self.title = title
            self.description = description
            self.systemImage = systemImage
            self.accentColor = accentColor
        }
    }

    /// Quick action button
    public struct QuickAction: Identifiable, Equatable, Sendable {
        public let id: UUID
        public let title: String
        public let systemImage: String
        public let accentColor: String
        public let action: ActionType

        public enum ActionType: Equatable, Sendable {
            case newChat
            case history
            case upgrade
            case settings
        }

        public init(
            id: UUID = UUID(),
            title: String,
            systemImage: String,
            accentColor: String = "blue",
            action: ActionType
        ) {
            self.id = id
            self.title = title
            self.systemImage = systemImage
            self.accentColor = accentColor
            self.action = action
        }
    }

    // MARK: - Configuration

    public let welcomeTitle: String
    public let welcomeSubtitle: String
    public let featuredItems: [FeatureItem]
    public let quickActions: [QuickAction]

    public init(
        welcomeTitle: String = "Ready For A Reliable Morning?",
        welcomeSubtitle: String = "Set your next alarm run and lock in your first task before bed.",
        featuredItems: [FeatureItem] = FeatureItem.defaults,
        quickActions: [QuickAction] = QuickAction.defaults
    ) {
        self.welcomeTitle = welcomeTitle
        self.welcomeSubtitle = welcomeSubtitle
        self.featuredItems = featuredItems
        self.quickActions = quickActions
    }
}

// MARK: - Default Content

public extension HomeContent.FeatureItem {
    /// Default featured items for the boilerplate
    /// Buyers should customize these for their specific app
    static let defaults: [HomeContent.FeatureItem] = [
        HomeContent.FeatureItem(
            title: "Adaptive Mission Rotation",
            description: "WakeTask rotates cognitive, movement, and scan-style missions to prevent autopilot dismissals.",
            systemImage: "arrow.triangle.2.circlepath.circle.fill",
            accentColor: "orange"
        ),
        HomeContent.FeatureItem(
            title: "Post-Dismiss Wake Check",
            description: "A timed wake-check confirms you're still up. Miss it and escalation rules kick in automatically.",
            systemImage: "timer",
            accentColor: "red"
        ),
        HomeContent.FeatureItem(
            title: "Reliability Ledger",
            description: "See each alarm outcome with clear reasons so you can tune strictness and stop relapse patterns.",
            systemImage: "chart.line.uptrend.xyaxis",
            accentColor: "green"
        ),
        HomeContent.FeatureItem(
            title: "First-Task Bridge",
            description: "Finish one deliberate micro-task after wake verification before your morning run is marked complete.",
            systemImage: "checkmark.seal.fill",
            accentColor: "blue"
        ),
    ]
}

public extension HomeContent.QuickAction {
    /// Default quick actions for the boilerplate
    /// Buyers can customize or add more actions
    static let defaults: [HomeContent.QuickAction] = [
        HomeContent.QuickAction(
            title: "Start Wake Run",
            systemImage: "alarm.badge.checkmark",
            accentColor: "orange",
            action: .newChat
        ),
        HomeContent.QuickAction(
            title: "Reliability Log",
            systemImage: "list.bullet.clipboard",
            accentColor: "indigo",
            action: .history
        ),
        HomeContent.QuickAction(
            title: "WakeTask Pro",
            systemImage: "crown.fill",
            accentColor: "yellow",
            action: .upgrade
        ),
        HomeContent.QuickAction(
            title: "Settings",
            systemImage: "gearshape.fill",
            accentColor: "gray",
            action: .settings
        ),
    ]
}
