import XCTest
@testable import Core

@MainActor
final class WakeTaskSessionViewModelTests: XCTestCase {
    func testStartSessionRejectsScanFallback() async {
        let repo = InMemoryWakeTaskSessionRepository()
        let viewModel = WakeTaskSessionViewModel(repository: repo)

        await viewModel.startSession(
            scheduledAt: Date(),
            profile: .weekday,
            missionChain: WakeMissionChain(primary: .scan, fallback: .scan)
        )

        XCTAssertNil(viewModel.currentRecord)
        XCTAssertEqual(viewModel.errorMessage, WakeTaskDomainError.fallbackMissionUnavailable.localizedDescription)
    }

    func testRecordWakeCheckRequiresDismissal() async {
        let repo = InMemoryWakeTaskSessionRepository()
        let viewModel = WakeTaskSessionViewModel(repository: repo)

        await viewModel.startSession(
            scheduledAt: Date(),
            profile: .weekday,
            missionChain: WakeMissionChain(primary: .math, fallback: .motion)
        )

        await viewModel.recordWakeCheck(offsetMinutes: 3, outcome: .passed)

        XCTAssertEqual(viewModel.errorMessage, WakeTaskDomainError.wakeCheckBeforeDismissal.localizedDescription)
    }

    func testWakeChecksSetSuccessAndEscalation() async {
        let repo = InMemoryWakeTaskSessionRepository()
        let viewModel = WakeTaskSessionViewModel(repository: repo)
        let scheduled = Date()

        await viewModel.startSession(
            scheduledAt: scheduled,
            profile: .travel,
            missionChain: WakeMissionChain(primary: .scan, fallback: .memory)
        )
        await viewModel.markAlarmFired(at: scheduled.addingTimeInterval(1))
        await viewModel.markDismissed(at: scheduled.addingTimeInterval(2), fallbackUsed: true)

        await viewModel.recordWakeCheck(offsetMinutes: 3, outcome: .passed)
        await viewModel.recordWakeCheck(offsetMinutes: 7, outcome: .failed)

        XCTAssertTrue(viewModel.requiresEscalation)
        XCTAssertFalse(viewModel.isSessionSuccessful)

        await viewModel.recordWakeCheck(offsetMinutes: 7, outcome: .passed)
        await viewModel.recordWakeCheck(offsetMinutes: 12, outcome: .passed)

        XCTAssertFalse(viewModel.requiresEscalation)
        XCTAssertTrue(viewModel.isSessionSuccessful)

        let persisted = try? await repo.listRecent(limit: 1).first
        XCTAssertEqual(persisted?.fallbackUsed, true)
        XCTAssertEqual(persisted?.profileUsed, .travel)
    }
}

private actor InMemoryWakeTaskSessionRepository: WakeTaskSessionRepository {
    private var records: [UUID: AlarmReliabilityRecord] = [:]

    func upsert(record: AlarmReliabilityRecord) async throws {
        records[record.id] = record
    }

    func fetch(id: UUID) async throws -> AlarmReliabilityRecord? {
        records[id]
    }

    func listRecent(limit: Int) async throws -> [AlarmReliabilityRecord] {
        Array(records.values.sorted { $0.alarmScheduledAt > $1.alarmScheduledAt }.prefix(limit))
    }
}
