import Foundation

/// Protocol for persisting rating engine state.
///
/// Abstracted for testability -- production uses `UserDefaultsRatingStorage`,
/// tests use `MockRatingStorage`.
public protocol RatingStorage: Sendable {
    /// Current accumulated sentiment score
    func sentimentScore() -> Double

    /// Set the sentiment score
    func setSentimentScore(_ score: Double)

    /// Total number of recorded actions
    func totalActionCount() -> Int

    /// Increment total action count
    func incrementActionCount()

    /// Date of the last recorded action
    func lastActionDate() -> Date?

    /// Set the last action date
    func setLastActionDate(_ date: Date)

    /// Date of the last rating prompt shown
    func lastPromptDate() -> Date?

    /// Set the last prompt date
    func setLastPromptDate(_ date: Date)

    /// Number of prompts shown this calendar year
    func promptsThisYear() -> Int

    /// Increment the prompts-this-year counter
    func incrementPromptsThisYear()

    /// Reset prompts-this-year counter (called on new year)
    func resetPromptsThisYear()

    /// The year the prompts counter was last reset
    func promptsCounterYear() -> Int

    /// Set the prompts counter year
    func setPromptsCounterYear(_ year: Int)

    /// Whether the user has already tapped through to the App Store review dialog.
    /// Once true, the engine will stop asking (unless `stopAskingAfterRating` is disabled).
    func userHasRated() -> Bool

    /// Mark that the user has tapped through to the App Store review dialog
    func setUserHasRated(_ value: Bool)

    /// Clear all stored data (for testing/debug)
    func clearAll()
}

// MARK: - UserDefaults Implementation

/// Production storage using UserDefaults.
/// Lightweight persistence for rating state -- no SwiftData needed.
public final class UserDefaultsRatingStorage: RatingStorage, @unchecked Sendable {
    private let defaults: UserDefaults
    private let prefix: String

    private enum Keys {
        static let sentimentScore = "sentiment_score"
        static let totalActionCount = "total_action_count"
        static let lastActionDate = "last_action_date"
        static let lastPromptDate = "last_prompt_date"
        static let promptsThisYear = "prompts_this_year"
        static let promptsCounterYear = "prompts_counter_year"
        static let userHasRated = "user_has_rated"
    }

    /// Create storage with optional key prefix and UserDefaults suite
    /// - Parameters:
    ///   - prefix: Key prefix to avoid collisions (default: "sai_rating_")
    ///   - defaults: UserDefaults instance (default: .standard)
    public init(prefix: String = "sai_rating_", defaults: UserDefaults = .standard) {
        self.prefix = prefix
        self.defaults = defaults
    }

    private func key(_ name: String) -> String {
        "\(prefix)\(name)"
    }

    public func sentimentScore() -> Double {
        defaults.double(forKey: key(Keys.sentimentScore))
    }

    public func setSentimentScore(_ score: Double) {
        defaults.set(score, forKey: key(Keys.sentimentScore))
    }

    public func totalActionCount() -> Int {
        defaults.integer(forKey: key(Keys.totalActionCount))
    }

    public func incrementActionCount() {
        defaults.set(totalActionCount() + 1, forKey: key(Keys.totalActionCount))
    }

    public func lastActionDate() -> Date? {
        defaults.object(forKey: key(Keys.lastActionDate)) as? Date
    }

    public func setLastActionDate(_ date: Date) {
        defaults.set(date, forKey: key(Keys.lastActionDate))
    }

    public func lastPromptDate() -> Date? {
        defaults.object(forKey: key(Keys.lastPromptDate)) as? Date
    }

    public func setLastPromptDate(_ date: Date) {
        defaults.set(date, forKey: key(Keys.lastPromptDate))
    }

    public func promptsThisYear() -> Int {
        defaults.integer(forKey: key(Keys.promptsThisYear))
    }

    public func incrementPromptsThisYear() {
        defaults.set(promptsThisYear() + 1, forKey: key(Keys.promptsThisYear))
    }

    public func resetPromptsThisYear() {
        defaults.set(0, forKey: key(Keys.promptsThisYear))
    }

    public func promptsCounterYear() -> Int {
        defaults.integer(forKey: key(Keys.promptsCounterYear))
    }

    public func setPromptsCounterYear(_ year: Int) {
        defaults.set(year, forKey: key(Keys.promptsCounterYear))
    }

    public func userHasRated() -> Bool {
        defaults.bool(forKey: key(Keys.userHasRated))
    }

    public func setUserHasRated(_ value: Bool) {
        defaults.set(value, forKey: key(Keys.userHasRated))
    }

    public func clearAll() {
        let keys = [
            Keys.sentimentScore,
            Keys.totalActionCount,
            Keys.lastActionDate,
            Keys.lastPromptDate,
            Keys.promptsThisYear,
            Keys.promptsCounterYear,
            Keys.userHasRated,
        ]
        for k in keys {
            defaults.removeObject(forKey: key(k))
        }
    }
}
