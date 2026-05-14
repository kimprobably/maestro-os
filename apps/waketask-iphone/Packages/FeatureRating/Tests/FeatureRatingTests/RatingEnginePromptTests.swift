import XCTest
@testable import FeatureRating

/// Prompt-decision, yearly-limit, user-response, and `stopAskingAfterRating`
/// + reset coverage for `RatingEngine`. Scoring/decay/edge-case coverage
/// lives in `RatingEngineTests.swift`.
final class RatingEnginePromptTests: RatingEngineTestCase {

    // MARK: - shouldPrompt decision

    func testShouldPromptWhenAllConditionsMet() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 3.0,
            cooldownDays: 0,
            maxPromptsPerYear: 3,
            minimumActions: 2
        ))

        engine.record(.positive("a", weight: 2.0))
        engine.record(.positive("b", weight: 2.0))

        XCTAssertTrue(engine.shouldPrompt(),
                      "Should prompt when score >= threshold and actions >= minimum")
    }

    func testShouldNotPromptBelowThreshold() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 10.0,
            minimumActions: 1
        ))

        engine.record(.positive("a", weight: 2.0))

        XCTAssertFalse(engine.shouldPrompt(),
                       "Should not prompt when score is below threshold")
    }

    func testShouldNotPromptBelowMinimumActions() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            minimumActions: 5
        ))

        engine.record(.positive("a", weight: 10.0))

        XCTAssertFalse(engine.shouldPrompt(),
                       "Should not prompt when action count < minimum")
    }

    func testShouldNotPromptDuringCooldown() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            cooldownDays: 30,
            minimumActions: 1
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()

        advanceDays(5)
        engine.record(.positive("b", weight: 5.0))
        engine.record(.positive("c", weight: 5.0))

        XCTAssertFalse(engine.shouldPrompt(),
                       "Should not prompt during cooldown period")
    }

    func testShouldPromptAfterCooldownExpires() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 3.0,
            cooldownDays: 7,
            maxPromptsPerYear: 10,
            minimumActions: 1
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()

        advanceDays(8)
        engine.record(.positive("b", weight: 5.0))

        XCTAssertTrue(engine.shouldPrompt(),
                      "Should prompt after cooldown expires")
    }

    // MARK: - Yearly limit

    func testShouldNotPromptWhenYearlyLimitReached() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            cooldownDays: 0,
            maxPromptsPerYear: 2,
            minimumActions: 1
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()

        engine.record(.positive("b", weight: 5.0))
        engine.userAcceptedPrompt()

        engine.record(.positive("c", weight: 5.0))

        XCTAssertFalse(engine.shouldPrompt(),
                       "Should not prompt when yearly limit is reached")
    }

    func testYearlyCounterResetsOnNewYear() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            cooldownDays: 0,
            maxPromptsPerYear: 1,
            minimumActions: 1
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()

        advanceToNextYear()
        engine.record(.positive("b", weight: 5.0))

        XCTAssertTrue(engine.shouldPrompt(),
                      "Yearly counter should reset in new year")
    }

    // MARK: - User response

    func testUserAcceptedResetsScore() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 10.0))
        engine.userAcceptedPrompt()

        XCTAssertEqual(storage.score, 0.0, accuracy: 0.01,
                       "Score should reset to 0 after user accepts")
        XCTAssertEqual(storage.yearlyPrompts, 1)
        XCTAssertNotNil(storage.lastPrompt)
    }

    func testUserAcceptedSetsHasRatedFlag() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 10.0))
        XCTAssertFalse(storage.hasRated, "hasRated should be false initially")

        engine.userAcceptedPrompt()

        XCTAssertTrue(storage.hasRated, "hasRated should be true after user accepts")
    }

    func testUserDeclinedHalvesScore() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 10.0))
        let scoreBefore = storage.score
        engine.userDeclinedPrompt()

        XCTAssertEqual(storage.score, scoreBefore * 0.5, accuracy: 0.01,
                       "Score should be halved after user declines")
        XCTAssertEqual(storage.yearlyPrompts, 1)
    }

    func testUserDeclinedDoesNotSetHasRatedFlag() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 10.0))
        engine.userDeclinedPrompt()

        XCTAssertFalse(storage.hasRated,
                       "hasRated should remain false after user declines")
    }

    // MARK: - Stop asking after rating

    func testStopAskingAfterRatingPreventsRePrompting() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            cooldownDays: 0,
            maxPromptsPerYear: 10,
            minimumActions: 1,
            stopAskingAfterRating: true
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()

        engine.record(.positive("b", weight: 10.0))
        engine.record(.positive("c", weight: 10.0))

        XCTAssertFalse(engine.shouldPrompt(),
                       "Should never prompt again after user has rated (stopAskingAfterRating=true)")
    }

    func testStopAskingAfterRatingDisabledAllowsRePrompting() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            cooldownDays: 0,
            maxPromptsPerYear: 10,
            minimumActions: 1,
            stopAskingAfterRating: false
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()

        engine.record(.positive("b", weight: 10.0))

        XCTAssertTrue(engine.shouldPrompt(),
                      "Should allow re-prompting when stopAskingAfterRating is disabled")
    }

    func testResetClearsHasRatedFlag() {
        let engine = makeEngine(config: RatingConfig(
            positiveThreshold: 1.0,
            cooldownDays: 0,
            minimumActions: 1,
            stopAskingAfterRating: true
        ))

        engine.record(.positive("a", weight: 5.0))
        engine.userAcceptedPrompt()
        XCTAssertTrue(storage.hasRated)

        engine.reset()
        XCTAssertFalse(storage.hasRated,
                       "reset() should clear the hasRated flag")
    }

    // MARK: - Reset

    func testResetClearsAllData() {
        let engine = makeEngine()

        engine.record(.positive("a", weight: 5.0))
        engine.record(.positive("b", weight: 3.0))
        engine.userAcceptedPrompt()

        engine.reset()

        XCTAssertEqual(storage.score, 0)
        XCTAssertEqual(storage.actions, 0)
        XCTAssertNil(storage.lastAction)
        XCTAssertNil(storage.lastPrompt)
        XCTAssertEqual(storage.yearlyPrompts, 0)
        XCTAssertFalse(storage.hasRated)
    }
}
