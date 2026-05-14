import Foundation

/// Configuration for the app rating prompt system.
///
/// Customize thresholds, cooldowns, and UI copy to match your app's needs.
///
/// ## Usage
/// ```swift
/// // Use defaults
/// let config = RatingConfig.default
///
/// // Customize for your app
/// let config = RatingConfig(
///     positiveThreshold: 8.0,
///     cooldownDays: 45,
///     title: "Enjoying Capishi?",
///     message: "Your feedback helps us build a better interview prep experience!",
///     acceptTitle: "Rate Capishi",
///     icon: "star.bubble"
/// )
/// ```
public struct RatingConfig: Sendable {
    // MARK: - Scoring Thresholds

    /// Minimum sentiment score needed to trigger a prompt (default: 5.0)
    /// A higher threshold means the user needs more positive actions before being asked.
    public let positiveThreshold: Double

    /// Minimum number of recorded actions before prompting (default: 5)
    /// Prevents prompting users who have barely used the app.
    public let minimumActions: Int

    /// Daily decay factor applied to the sentiment score (default: 0.95)
    /// Score decays as: `score *= decayFactor ^ daysSinceLastAction`
    /// - 0.95 = gentle decay (score halves in ~14 days)
    /// - 0.90 = moderate decay (score halves in ~7 days)
    /// - 0.80 = aggressive decay (score halves in ~3 days)
    public let decayFactor: Double

    // MARK: - Rate Limiting

    /// Minimum days between rating prompts (default: 30)
    /// Apple recommends not asking too frequently.
    public let cooldownDays: Int

    /// Maximum number of prompts per calendar year (default: 3)
    /// Apple limits `SKStoreReviewController` to 3 displays per year.
    public let maxPromptsPerYear: Int

    /// Whether to permanently stop asking after the user taps "Rate on App Store" (default: true)
    ///
    /// When `true`, once a user taps the accept button in the pre-prompt popup,
    /// the system will never show the prompt again. This is the recommended behavior
    /// because Apple's `SKStoreReviewController` does not report whether the user
    /// actually submitted a review -- tapping "Rate" is the best signal we have.
    ///
    /// Set to `false` if you prefer to rely solely on the cooldown, yearly limit,
    /// and score threshold to naturally gate re-prompting. This can be useful if
    /// your app ships major updates and you want a chance to collect fresh reviews.
    public let stopAskingAfterRating: Bool

    // MARK: - Pre-Prompt UI Copy

    /// Title shown in the pre-prompt popup (default: "Enjoying the app?")
    public let title: String

    /// Message shown below the title (default: "Your feedback helps us improve...")
    public let message: String

    /// Accept button title (default: "Rate on App Store")
    public let acceptTitle: String

    /// Decline button title (default: "Not now")
    public let declineTitle: String

    /// SF Symbol name for the prompt icon (default: "star.bubble")
    public let icon: String

    // MARK: - Initialization

    /// Create a rating configuration
    /// - Parameters:
    ///   - positiveThreshold: Score needed to trigger prompt (default: 5.0)
    ///   - cooldownDays: Days between prompts (default: 30)
    ///   - maxPromptsPerYear: Max prompts per year (default: 3)
    ///   - minimumActions: Min actions before prompting (default: 5)
    ///   - decayFactor: Daily score decay factor (default: 0.95)
    ///   - stopAskingAfterRating: Stop forever after user taps "Rate" (default: true)
    ///   - title: Pre-prompt title
    ///   - message: Pre-prompt message
    ///   - acceptTitle: Accept button text
    ///   - declineTitle: Decline button text
    ///   - icon: SF Symbol name for the icon
    public init(
        positiveThreshold: Double = 5.0,
        cooldownDays: Int = 30,
        maxPromptsPerYear: Int = 3,
        minimumActions: Int = 5,
        decayFactor: Double = 0.95,
        stopAskingAfterRating: Bool = true,
        title: String = "Enjoying the app?",
        message: String = "Your feedback helps us improve and build new features. Would you mind leaving a quick rating?",
        acceptTitle: String = "Rate on App Store",
        declineTitle: String = "Not now",
        icon: String = "star.bubble"
    ) {
        self.positiveThreshold = max(0, positiveThreshold)
        self.cooldownDays = max(0, cooldownDays)
        self.maxPromptsPerYear = max(0, maxPromptsPerYear)
        self.minimumActions = max(0, minimumActions)
        self.decayFactor = min(1.0, max(0, decayFactor))
        self.stopAskingAfterRating = stopAskingAfterRating
        self.title = title
        self.message = message
        self.acceptTitle = acceptTitle
        self.declineTitle = declineTitle
        self.icon = icon
    }

    /// Default configuration suitable for most apps
    public static let `default` = RatingConfig()
}
