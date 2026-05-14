@testable import Core
import XCTest

final class WakeContractEvaluatorTests: XCTestCase {
    func testMissedWakeCheckEscalates() {
        let evaluator = WakeContractEvaluator()
        let now = Date()

        var run = WakeRun(
            alarmID: UUID(),
            scheduledAt: now,
            missions: [WakeMission(modality: .cognitive, prompt: "x")],
            events: []
        )

        run = evaluator.dismiss(run, at: now, wakeCheckWindow: 60)
        let escalated = evaluator.evaluateEscalation(run, now: now.addingTimeInterval(61))

        XCTAssertEqual(escalated.state, .escalated)
        XCTAssertNotNil(escalated.escalationTriggeredAt)
        XCTAssertTrue(escalated.events.contains(where: { $0.kind == .escalationTriggered }))
    }

    func testVerifiedThenFirstTaskCompletesRun() {
        let evaluator = WakeContractEvaluator()
        let now = Date()

        var run = WakeRun(
            alarmID: UUID(),
            scheduledAt: now,
            missions: [WakeMission(modality: .movement, prompt: "x")],
            events: []
        )

        run = evaluator.completeWakeCheck(run, at: now)
        run = evaluator.completeFirstTask(run, at: now.addingTimeInterval(5))

        XCTAssertEqual(run.state, .completed)
        XCTAssertNotNil(run.firstTaskCompletedAt)
        XCTAssertTrue(run.events.contains(where: { $0.kind == .runCompleted }))
    }
}
