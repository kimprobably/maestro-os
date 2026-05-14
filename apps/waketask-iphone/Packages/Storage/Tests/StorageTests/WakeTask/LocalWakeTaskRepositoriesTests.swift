import XCTest
@testable import Storage
import Core

final class LocalWakeTaskRepositoriesTests: XCTestCase {
    private var tempURL: URL!

    override func setUp() {
        super.setUp()
        tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension("json")
    }

    override func tearDown() {
        if let tempURL {
            try? FileManager.default.removeItem(at: tempURL)
        }
        super.tearDown()
    }

    func testAlarmUpsertAndListPersistAcrossInstances() async throws {
        let location = WakeTaskStoreLocation(fileURL: tempURL)
        let repoA = LocalWakeAlarmRepository(location: location)
        let repoB = LocalWakeAlarmRepository(location: location)

        let alarm = WakeAlarm(
            title: "Morning",
            hour: 6,
            minute: 45,
            strictness: .balanced,
            wakeCheckWindowSeconds: 120,
            firstTaskTitle: "Hydrate"
        )

        try await repoA.upsertAlarm(alarm)
        let alarms = try await repoB.listAlarms()

        XCTAssertEqual(alarms.count, 1)
        XCTAssertEqual(alarms[0].title, "Morning")
    }

    func testRunRepositoryStoresAndLoadsLedgerEvents() async throws {
        let location = WakeTaskStoreLocation(fileURL: tempURL)
        let runRepo = LocalWakeRunRepository(location: location)
        let alarmID = UUID()

        let run = WakeRun(
            alarmID: alarmID,
            scheduledAt: Date(),
            missions: [WakeMission(modality: .scanPhoto, prompt: "Bathroom mirror")],
            events: [WakeRunEvent(occurredAt: Date(), kind: .alarmTriggered)]
        )

        try await runRepo.saveRun(run)
        let loaded = try await runRepo.loadRun(id: run.id)

        XCTAssertNotNil(loaded)
        XCTAssertEqual(loaded?.events.count, 1)
        XCTAssertEqual(loaded?.events.first?.kind, .alarmTriggered)
    }
}
