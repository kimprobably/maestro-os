import XCTest
@testable import Storage
import Core

final class WakeTaskSessionRepositoryTests: XCTestCase {
    func testUpsertAndFetch() async throws {
        let suiteName = "WakeTaskSessionRepositoryTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let repository = LocalWakeTaskSessionRepository(
            userDefaults: defaults,
            storageKey: "test.records",
            maxRecords: 5
        )

        let record = AlarmReliabilityRecord(
            alarmScheduledAt: Date(),
            profileUsed: .weekday,
            missionChain: WakeMissionChain(primary: .math, fallback: .memory)
        )

        try await repository.upsert(record: record)
        let fetched = try await repository.fetch(id: record.id)

        XCTAssertEqual(fetched?.id, record.id)
        XCTAssertEqual(fetched?.profileUsed, .weekday)
    }

    func testListRecentIsOrderedAndPruned() async throws {
        let suiteName = "WakeTaskSessionRepositoryTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }

        let repository = LocalWakeTaskSessionRepository(
            userDefaults: defaults,
            storageKey: "test.records",
            maxRecords: 2
        )

        let base = Date()
        for offset in [0.0, 120.0, 240.0] {
            let record = AlarmReliabilityRecord(
                alarmScheduledAt: base.addingTimeInterval(offset),
                profileUsed: .weekend,
                missionChain: WakeMissionChain(primary: .motion, fallback: .math)
            )
            try await repository.upsert(record: record)
        }

        let records = try await repository.listRecent(limit: 10)

        XCTAssertEqual(records.count, 2)
        XCTAssertGreaterThan(records[0].alarmScheduledAt, records[1].alarmScheduledAt)
    }
}
