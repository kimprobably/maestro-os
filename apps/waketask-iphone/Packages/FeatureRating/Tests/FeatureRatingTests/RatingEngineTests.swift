@testable import FeatureRating
import XCTest

/// Scoring, decay, and edge-case coverage for `RatingEngine`.
/// Prompt-decision, yearly-limit, and user-response coverage lives in
/// `RatingEnginePromptTests.swift`.
final class RatingEngineTests: RatingEngineTestCase {
    // MARK: - Scoring

    func testPositiveActionIncreasesScore() {
        let engine = makeEngine()

        engine.record(.positive("test", weight: 2.0))

        XCTAssertEqual(storage.score, 2.0, accuracy: 0.01)
        XCTAssertEqual(storage.actions, 1)
    }

    func testNegativeActionDecreasesScore() {
        let engine = makeEngine()

        engine.record(.positive("good", weight: 3.0))
        engine.record(.negative("bad", weight: 1.0))

        XCTAssertEqual(storage.score, 2.0, accuracy: 0.01)
        XCTAssertEqual(storage.actions, 2)
    }

    func testScoreFlooredAtZero() {
        let engine = makeEngine()

        engine.record(.negative("bad", weight: 5.0))

        XCTAssertEqual(storage.score, 0.0, accuracy: 0.01,
                       "Score should not go below zero")
    }

    func testMultiplePositiveActionsAccumulate() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 1.0))
        engine.record(.positive("b", weight: 2.0))
        engine.record(.positive("c", weight: 1.5))

        XCTAssertEqual(storage.score, 4.5, accuracy: 0.01)
        XCTAssertEqual(storage.actions, 3)
    }

    // MARK: - Decay

    func testScoreDecaysOverTime() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 5.0,
            decayFactor: 0.90
        ))

        engine.record(.positive("test", weight: 10.0))
        XCTAssertEqual(storage.score, 10.0, accuracy: 0.01)

        advanceDays(1)
        // Zero-weight action triggers the decay calculation without adding
        // new score, so we can assert on the decayed value directly.
        engine.record(.positive("test2", weight: 0.0))

        XCTAssertEqual(storage.score, 9.0, accuracy: 0.01)
    }

    func testScoreDecaysMultipleDays() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 5.0,
            decayFactor: 0.50
        ))

        engine.record(.positive("test", weight: 8.0))

        advanceDays(3)
        engine.record(.positive("trigger", weight: 0.0))

        // 8.0 * 0.5^3 = 1.0
        XCTAssertEqual(storage.score, 1.0, accuracy: 0.01)
    }

    func testNoDecayOnSameDay() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 5.0))
        engine.record(.positive("b", weight: 3.0))

        XCTAssertEqual(storage.score, 8.0, accuracy: 0.01)
    }

    // MARK: - Edge cases + config defaults

    func testRecordReturnsWhetherShouldPrompt() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 3.0,
            cooldownDays: 0,
            minimumActions: 2
        ))

        let first = engine.record(.positive("a", weight: 2.0))
        XCTAssertFalse(first, "First action shouldn't trigger (below minimum actions)")

        let second = engine.record(.positive("b", weight: 2.0))
        XCTAssertTrue(second, "Second action should trigger (score=4.0 >= 3.0, actions=2 >= 2)")
    }

    func testDefaultConfigValues() {
        let config = RatingConfig.default

        XCTAssertEqual(config.positiveThreshold, 5.0)
        XCTAssertEqual(config.cooldownDays, 30)
        XCTAssertEqual(config.maxPromptsPerYear, 3)
        XCTAssertEqual(config.minimumActions, 5)
        XCTAssertEqual(config.decayFactor, 0.95)
        XCTAssertTrue(config.stopAskingAfterRating)
        XCTAssertFalse(config.title.isEmpty)
        XCTAssertFalse(config.message.isEmpty)
        XCTAssertFalse(config.acceptTitle.isEmpty)
        XCTAssertFalse(config.declineTitle.isEmpty)
        XCTAssertFalse(config.icon.isEmpty)
    }

    func testRatingActionConvenienceInitializers() {
        let positive = RatingAction.positive("test", weight: 2.5)
        XCTAssertEqual(positive.id, "test")
        XCTAssertEqual(positive.sentiment, .positive)
        XCTAssertEqual(positive.weight, 2.5)

        let negative = RatingAction.negative("error", weight: 1.0)
        XCTAssertEqual(negative.id, "error")
        XCTAssertEqual(negative.sentiment, .negative)
        XCTAssertEqual(negative.weight, 1.0)
    }

    func testNegativeWeightClampedToZero() {
        let action = RatingAction(id: "test", sentiment: .positive, weight: -5.0)
        XCTAssertEqual(action.weight, 0.0, "Negative weights should be clamped to 0")
    }
}
