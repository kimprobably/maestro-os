@testable import FeatureRating
import Foundation

/// In-memory storage for testing the rating engine.
/// All values are stored in properties -- no persistence.
final class MockRatingStorage: RatingStorage, @unchecked Sendable {
    var score: Double = 0
    var actions: Int = 0
    var lastAction: Date?
    var lastPrompt: Date?
    var yearlyPrompts: Int = 0
    var counterYear: Int = 0
    var hasRated: Bool = false

    func sentimentScore() -> Double {
        score
    }

    func setSentimentScore(_ score: Double) {
        self.score = score
    }

    func totalActionCount() -> Int {
        actions
    }

    func incrementActionCount() {
        actions += 1
    }

    func lastActionDate() -> Date? {
        lastAction
    }

    func setLastActionDate(_ date: Date) {
        lastAction = date
    }

    func lastPromptDate() -> Date? {
        lastPrompt
    }

    func setLastPromptDate(_ date: Date) {
        lastPrompt = date
    }

    func promptsThisYear() -> Int {
        yearlyPrompts
    }

    func incrementPromptsThisYear() {
        yearlyPrompts += 1
    }

    func resetPromptsThisYear() {
        yearlyPrompts = 0
    }

    func promptsCounterYear() -> Int {
        counterYear
    }

    func setPromptsCounterYear(_ year: Int) {
        counterYear = year
    }

    func userHasRated() -> Bool {
        hasRated
    }

    func setUserHasRated(_ value: Bool) {
        hasRated = value
    }

    func clearAll() {
        score = 0
        actions = 0
        lastAction = nil
        lastPrompt = nil
        yearlyPrompts = 0
        counterYear = 0
        hasRated = false
    }
}
