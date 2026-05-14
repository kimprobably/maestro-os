import Foundation

/// Represents a user action that influences the app rating prompt decision.
///
/// Actions have a sentiment (positive or negative) and a weight that determines
/// how much they contribute to the overall sentiment score.
///
/// ## Usage
/// ```swift
/// // Define positive actions for your app
/// let completedTask = RatingAction.positive("completed_task", weight: 1.5)
/// let gotMatch = RatingAction.positive("got_match", weight: 3.0)
///
/// // Define negative actions
/// let networkError = RatingAction.negative("network_error", weight: 1.0)
/// let crashRecovery = RatingAction.negative("crash_recovery", weight: 2.0)
/// ```
public struct RatingAction: Sendable, Codable, Equatable {
    /// Unique identifier for this action type (e.g., "completed_interview", "network_error")
    public let id: String

    /// Whether this action is positive or negative for the user experience
    public let sentiment: Sentiment

    /// How much this action contributes to the sentiment score (default: 1.0)
    /// Higher weights mean the action has more impact on the rating decision.
    public let weight: Double

    /// The sentiment direction of an action
    public enum Sentiment: String, Sendable, Codable, Equatable {
        case positive
        case negative
    }

    /// Create a rating action
    /// - Parameters:
    ///   - id: Unique identifier for this action type
    ///   - sentiment: Whether this is a positive or negative action
    ///   - weight: Impact weight (default: 1.0)
    public init(id: String, sentiment: Sentiment, weight: Double = 1.0) {
        self.id = id
        self.sentiment = sentiment
        self.weight = max(0, weight) // Ensure non-negative
    }

    /// Create a positive action
    /// - Parameters:
    ///   - id: Unique identifier (e.g., "completed_interview", "got_match")
    ///   - weight: Impact weight (default: 1.0). Higher = more impactful.
    /// - Returns: A positive rating action
    public static func positive(_ id: String, weight: Double = 1.0) -> RatingAction {
        RatingAction(id: id, sentiment: .positive, weight: weight)
    }

    /// Create a negative action
    /// - Parameters:
    ///   - id: Unique identifier (e.g., "network_error", "crash_recovery")
    ///   - weight: Impact weight (default: 1.0). Higher = more impactful.
    /// - Returns: A negative rating action
    public static func negative(_ id: String, weight: Double = 1.0) -> RatingAction {
        RatingAction(id: id, sentiment: .negative, weight: weight)
    }
}

// MARK: - Common Action Templates

/// Pre-defined action templates that app creators can use as-is or as inspiration.
/// These are optional convenience helpers -- you can always create custom actions.
public extension RatingAction {
    // MARK: Positive Actions

    /// User completed a core task successfully
    static let taskCompleted = RatingAction.positive("task_completed", weight: 1.5)

    /// User achieved a milestone or streak
    static let milestoneReached = RatingAction.positive("milestone_reached", weight: 2.0)

    /// User received a positive result (match, good score, bonus)
    static let positiveResult = RatingAction.positive("positive_result", weight: 2.5)

    /// User completed a purchase or subscription
    static let purchaseCompleted = RatingAction.positive("purchase_completed", weight: 3.0)

    /// User completed onboarding
    static let onboardingCompleted = RatingAction.positive("onboarding_completed", weight: 1.0)

    /// User shared content from the app
    static let contentShared = RatingAction.positive("content_shared", weight: 1.5)

    // MARK: Negative Actions

    /// User encountered a non-fatal error
    static let errorEncountered = RatingAction.negative("error_encountered", weight: 1.0)

    /// User experienced a crash or recovered from one
    static let crashRecovery = RatingAction.negative("crash_recovery", weight: 3.0)

    /// Network request failed
    static let networkFailure = RatingAction.negative("network_failure", weight: 1.0)

    /// User was blocked by a paywall
    static let paywallBlocked = RatingAction.negative("paywall_blocked", weight: 0.5)
}
