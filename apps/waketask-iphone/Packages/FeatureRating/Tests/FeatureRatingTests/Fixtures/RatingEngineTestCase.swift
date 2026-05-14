@testable import FeatureRating
import XCTest

/// Shared base class for every `RatingEngine` test file. Provides a fresh
/// in-memory storage, a mutable virtual clock, and helpers to build engines
/// with arbitrary config + fast-forward days.
class RatingEngineTestCase: XCTestCase {
    var storage: MockRatingStorage!
    var currentDate: Date!
    let calendar = Calendar.current

    override func setUp() {
        super.setUp()
        storage = MockRatingStorage()
        currentDate = Date()
    }

    // MARK: - Factory

    func makeEngine(
        config: RatingConfig = RatingConfig(
            positiveThreshold: 5.0,
            cooldownDays: 30,
            maxPromptsPerYear: 3,
            minimumActions: 3,
            decayFactor: 0.95
        )
    ) -> RatingEngine {
        RatingEngine(
            storage: storage,
            config: config,
            calendar: calendar,
            dateProvider: { [unowned self] in currentDate }
        )
    }

    // MARK: - Virtual clock

    func advanceDays(_ days: Int) {
        currentDate = calendar.date(byAdding: .day, value: days, to: currentDate)!
    }

    func advanceToNextYear() {
        let year = calendar.component(.year, from: currentDate)
        var components = DateComponents()
        components.year = year + 1
        components.month = 1
        components.day = 15
        currentDate = calendar.date(from: components)!
    }
}
