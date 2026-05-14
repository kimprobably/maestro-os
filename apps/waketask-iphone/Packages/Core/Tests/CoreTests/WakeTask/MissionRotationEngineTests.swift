import XCTest
@testable import Core

final class MissionRotationEngineTests: XCTestCase {
    func testStrictModeAvoidsRecentModalitiesWhenPossible() {
        let alarm = WakeAlarm(
            title: "Weekday",
            hour: 7,
            minute: 0,
            strictness: .strict,
            wakeCheckWindowSeconds: 60,
            firstTaskTitle: "Drink water"
        )

        let recentRun = WakeRun(
            alarmID: alarm.id,
            scheduledAt: Date(),
            missions: [WakeMission(modality: .movement, prompt: "x")],
            events: []
        )

        let engine = DefaultWakeMissionRotationEngine(randomIndex: { _ in 0 })
        let missions = engine.missions(for: alarm, previousRuns: [recentRun], missionCount: 1)

        XCTAssertEqual(missions.count, 1)
        XCTAssertNotEqual(missions[0].modality, .movement)
    }

    func testBalancedModeGeneratesRequestedMissionCount() {
        let alarm = WakeAlarm(
            title: "Weekday",
            hour: 7,
            minute: 0,
            strictness: .balanced,
            wakeCheckWindowSeconds: 120,
            firstTaskTitle: "Open blinds"
        )

        let engine = DefaultWakeMissionRotationEngine(randomIndex: { _ in 0 })
        let missions = engine.missions(for: alarm, previousRuns: [], missionCount: 3)

        XCTAssertEqual(missions.count, 3)
        XCTAssertFalse(missions.map(\.prompt).contains(where: { $0.isEmpty }))
    }
}
