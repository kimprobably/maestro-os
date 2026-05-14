import Core
import Foundation

/// Core scoring and decision engine for app rating prompts.
///
/// The engine maintains a sentiment score based on user actions:
/// - Positive actions increase the score (weight * +1)
/// - Negative actions decrease the score (weight * -1)
/// - Score decays daily based on `config.decayFactor`
///
/// A rating prompt is triggered when ALL conditions are met:
/// 1. User has not already rated (if `stopAskingAfterRating` is enabled)
/// 2. Score >= `positiveThreshold`
/// 3. Total actions >= `minimumActions`
/// 4. Days since last prompt >= `cooldownDays`
/// 5. Prompts this year < `maxPromptsPerYear`
public final class RatingEngine: @unchecked Sendable {
    private let storage: RatingStorage
    private let config: RatingConfig
    private let calendar: Calendar
    private let dateProvider: @Sendable () -> Date

    /// Create a rating engine
    /// - Parameters:
    ///   - storage: Persistence layer for rating state
    ///   - config: Rating configuration (thresholds, cooldowns, etc.)
    ///   - calendar: Calendar for date calculations (injectable for testing)
    ///   - dateProvider: Current date provider (injectable for testing)
    public init(
        storage: RatingStorage,
        config: RatingConfig,
        calendar: Calendar = .current,
        dateProvider: @escaping @Sendable () -> Date = { Date() }
    ) {
        self.storage = storage
        self.config = config
        self.calendar = calendar
        self.dateProvider = dateProvider
    }

    // MARK: - Public API

    /// Record a user action and update the sentiment score
    /// - Parameter action: The action to record
    /// - Returns: Whether the engine recommends showing a rating prompt now
    @discardableResult
    public func record(_ action: RatingAction) -> Bool {
        let now = dateProvider()

        // Apply time decay to existing score
        applyDecay(now: now)

        // Calculate score delta
        let multiplier: Double = action.sentiment == .positive ? 1.0 : -1.0
        let delta = action.weight * multiplier

        // Update score (floor at 0 to avoid deep negatives)
        let currentScore = storage.sentimentScore()
        let newScore = max(0, currentScore + delta)
        storage.setSentimentScore(newScore)

        // Update action tracking
        storage.incrementActionCount()
        storage.setLastActionDate(now)

        // Reset yearly counter if we crossed into a new year
        resetYearlyCounterIfNeeded(now: now)

        AppLogger.debug(
            "Rating: recorded '\(action.id)' (\(action.sentiment.rawValue), w=\(action.weight)). Score: \(String(format: "%.2f", newScore)), actions: \(storage.totalActionCount())",
            category: AppLogger.ui
        )

        return shouldPrompt()
    }

    /// Check if all conditions are met to show a rating prompt
    /// - Returns: `true` if a prompt should be shown
    public func shouldPrompt() -> Bool {
        let score = storage.sentimentScore()
        let actionCount = storage.totalActionCount()
        let now = dateProvider()

        // Reset yearly counter if needed
        resetYearlyCounterIfNeeded(now: now)

        // 1. If user already tapped "Rate" and stopAskingAfterRating is on, never ask again
        if config.stopAskingAfterRating, storage.userHasRated() {
            return false
        }

        // 2. Score must meet threshold
        guard score >= config.positiveThreshold else { return false }

        // 3. Minimum actions must be met
        guard actionCount >= config.minimumActions else { return false }

        // 4. Cooldown must have elapsed
        if let lastPrompt = storage.lastPromptDate() {
            let daysSincePrompt = calendar.dateComponents([.day], from: lastPrompt, to: now).day ?? 0
            guard daysSincePrompt >= config.cooldownDays else { return false }
        }

        // 5. Must not exceed yearly prompt limit
        guard storage.promptsThisYear() < config.maxPromptsPerYear else { return false }

        return true
    }

    /// Mark that a prompt was shown and the user accepted (will see App Store dialog)
    public func userAcceptedPrompt() {
        let now = dateProvider()
        storage.setLastPromptDate(now)
        storage.incrementPromptsThisYear()

        // Mark that the user has gone through to the App Store review dialog.
        // When stopAskingAfterRating is enabled, this permanently stops future prompts.
        storage.setUserHasRated(true)

        // Reset score to avoid re-prompting quickly
        storage.setSentimentScore(0)

        AppLogger.info("Rating: user accepted prompt (hasRated=true). Prompts this year: \(storage.promptsThisYear())", category: AppLogger.ui)
    }

    /// Mark that a prompt was shown and the user declined
    public func userDeclinedPrompt() {
        let now = dateProvider()
        storage.setLastPromptDate(now)
        storage.incrementPromptsThisYear()

        // Halve the score (partial reset) so they need to earn it again
        let currentScore = storage.sentimentScore()
        storage.setSentimentScore(currentScore * 0.5)

        AppLogger.info("Rating: user declined prompt. Score halved to \(String(format: "%.2f", currentScore * 0.5))", category: AppLogger.ui)
    }

    /// Current sentiment score (for debugging/diagnostics)
    public var currentScore: Double {
        storage.sentimentScore()
    }

    /// Total recorded action count (for debugging/diagnostics)
    public var actionCount: Int {
        storage.totalActionCount()
    }

    /// Whether the user has previously tapped "Rate on App Store" (for debugging/diagnostics)
    public var hasRated: Bool {
        storage.userHasRated()
    }

    /// Clear all rating data (for debug/testing)
    public func reset() {
        storage.clearAll()
        AppLogger.info("Rating: all data cleared", category: AppLogger.ui)
    }

    // MARK: - Private Helpers

    /// Apply time-based decay to the sentiment score
    private func applyDecay(now: Date) {
        guard let lastAction = storage.lastActionDate() else { return }

        let daysSinceLastAction = calendar.dateComponents([.day], from: lastAction, to: now).day ?? 0
        guard daysSinceLastAction > 0 else { return }

        let currentScore = storage.sentimentScore()
        let decayMultiplier = pow(config.decayFactor, Double(daysSinceLastAction))
        let decayedScore = currentScore * decayMultiplier

        // Floor very small values to zero
        let finalScore = decayedScore < 0.01 ? 0 : decayedScore
        storage.setSentimentScore(finalScore)
    }

    /// Reset the yearly prompt counter if we've entered a new calendar year
    private func resetYearlyCounterIfNeeded(now: Date) {
        let currentYear = calendar.component(.year, from: now)
        let storedYear = storage.promptsCounterYear()

        if storedYear == 0 || storedYear != currentYear {
            storage.resetPromptsThisYear()
            storage.setPromptsCounterYear(currentYear)
        }
    }
}
