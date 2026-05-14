import Core
@testable import SwiftAIBoilerplatePro
import XCTest

@MainActor
final class WakeFlowViewModelTests: XCTestCase {
    func testTriggerDismissEscalationFlow() async {
        let alarmRepo = InMemoryWakeAlarmRepository()
        let runRepo = InMemoryWakeRunRepository()
        let now = TestClock(start: Date())

        let alarm = WakeAlarm(
            title: "Alarm",
            hour: 7,
            minute: 0,
            strictness: .strict,
            wakeCheckWindowSeconds: 60,
            firstTaskTitle: "Hydrate"
        )
        await alarmRepo.seed(alarm)

        let viewModel = WakeFlowViewModel(
            alarmRepository: alarmRepo,
            runRepository: runRepo,
            missionEngine: DefaultWakeMissionRotationEngine(randomIndex: { _ in 0 }),
            now: now.now
        )

        await viewModel.load()
        await viewModel.triggerAlarm(alarmID: alarm.id)
        for mission in viewModel.activeRun?.missions ?? [] {
            await viewModel.completeMission(missionID: mission.id)
        }
        await viewModel.dismissAlarm()

        XCTAssertEqual(viewModel.activeRun?.state, .dismissedAwaitingCheck)

        now.advance(seconds: 61)
        await viewModel.evaluateEscalationIfNeeded()
        XCTAssertEqual(viewModel.activeRun?.state, .escalated)
    }

    func testCompletionRequiresWakeCheckAndFirstTaskForConsistency() async {
        let alarmRepo = InMemoryWakeAlarmRepository()
        let runRepo = InMemoryWakeRunRepository()
        let now = TestClock(start: Date())

        let alarm = WakeAlarm(
            title: "Alarm",
            hour: 7,
            minute: 0,
            strictness: .balanced,
            wakeCheckWindowSeconds: 120,
            firstTaskTitle: "Open blinds"
        )
        await alarmRepo.seed(alarm)

        let viewModel = WakeFlowViewModel(
            alarmRepository: alarmRepo,
            runRepository: runRepo,
            missionEngine: DefaultWakeMissionRotationEngine(randomIndex: { _ in 0 }),
            now: now.now
        )

        await viewModel.load()
        await viewModel.triggerAlarm(alarmID: alarm.id)
        for mission in viewModel.activeRun?.missions ?? [] {
            await viewModel.completeMission(missionID: mission.id)
        }
        await viewModel.dismissAlarm()
        await viewModel.completeWakeCheck()
        XCTAssertEqual(viewModel.activeRun?.state, .verified)

        await viewModel.completeFirstTask()
        XCTAssertEqual(viewModel.activeRun?.state, .completed)
        XCTAssertEqual(viewModel.weeklyConsistency, 1)
    }

    func testDismissWaitsForMissionCompletion() async {
        let alarmRepo = InMemoryWakeAlarmRepository()
        let runRepo = InMemoryWakeRunRepository()
        let now = TestClock(start: Date())

        let alarm = WakeAlarm(
            title: "Alarm",
            hour: 7,
            minute: 0,
            strictness: .strict,
            wakeCheckWindowSeconds: 60,
            firstTaskTitle: "Hydrate"
        )
        await alarmRepo.seed(alarm)

        let viewModel = WakeFlowViewModel(
            alarmRepository: alarmRepo,
            runRepository: runRepo,
            missionEngine: DefaultWakeMissionRotationEngine(randomIndex: { _ in 0 }),
            now: now.now
        )

        await viewModel.load()
        await viewModel.triggerAlarm(alarmID: alarm.id)
        await viewModel.dismissAlarm()

        XCTAssertEqual(viewModel.activeRun?.state, .triggered)
    }

    func testUpdateAlarmPreservesIdentityAndUpdatesEditableFields() async {
        let alarmRepo = InMemoryWakeAlarmRepository()
        let runRepo = InMemoryWakeRunRepository()
        let now = TestClock(start: Date())

        let alarm = WakeAlarm(
            title: "Original",
            hour: 7,
            minute: 0,
            strictness: .balanced,
            wakeCheckWindowSeconds: 120,
            firstTaskTitle: "Hydrate"
        )
        await alarmRepo.seed(alarm)

        let viewModel = WakeFlowViewModel(
            alarmRepository: alarmRepo,
            runRepository: runRepo,
            missionEngine: DefaultWakeMissionRotationEngine(randomIndex: { _ in 0 }),
            now: now.now
        )

        await viewModel.load()
        await viewModel.updateAlarm(
            id: alarm.id,
            draft: WakeAlarmDraft(
                title: "Weekday",
                hour: 6,
                minute: 45,
                strictness: .strict,
                firstTaskTitle: "Drink water"
            )
        )

        XCTAssertEqual(viewModel.alarms.first?.id, alarm.id)
        XCTAssertEqual(viewModel.alarms.first?.title, "Weekday")
        XCTAssertEqual(viewModel.alarms.first?.hour, 6)
        XCTAssertEqual(viewModel.alarms.first?.minute, 45)
        XCTAssertEqual(viewModel.alarms.first?.wakeCheckWindowSeconds, 60)
    }
}

private actor InMemoryWakeAlarmRepository: WakeAlarmRepository {
    private var alarms: [WakeAlarm] = []

    func seed(_ alarm: WakeAlarm) {
        alarms.append(alarm)
    }

    func listAlarms() async throws -> [WakeAlarm] {
        alarms
    }

    func upsertAlarm(_ alarm: WakeAlarm) async throws {
        if let idx = alarms.firstIndex(where: { $0.id == alarm.id }) {
            alarms[idx] = alarm
        } else {
            alarms.append(alarm)
        }
    }

    func deleteAlarm(id: UUID) async throws {
        alarms.removeAll { $0.id == id }
    }
}

private actor InMemoryWakeRunRepository: WakeRunRepository {
    private var runs: [WakeRun] = []

    func saveRun(_ run: WakeRun) async throws {
        if let idx = runs.firstIndex(where: { $0.id == run.id }) {
            runs[idx] = run
        } else {
            runs.append(run)
        }
    }

    func loadRun(id: UUID) async throws -> WakeRun? {
        runs.first(where: { $0.id == id })
    }

    func listRuns(alarmID: UUID?, limit: Int) async throws -> [WakeRun] {
        runs
            .filter { alarmID == nil || $0.alarmID == alarmID }
            .sorted(by: { $0.scheduledAt > $1.scheduledAt })
            .prefix(limit)
            .map(\.self)
    }
}

private final class TestClock: @unchecked Sendable {
    private var value: Date

    init(start: Date) {
        value = start
    }

    func now() -> Date {
        value
    }

    func advance(seconds: TimeInterval) {
        value = value.addingTimeInterval(seconds)
    }
}
