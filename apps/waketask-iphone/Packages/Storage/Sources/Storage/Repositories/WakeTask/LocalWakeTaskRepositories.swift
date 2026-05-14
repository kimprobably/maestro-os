import Core
import Foundation

public struct WakeTaskStoreLocation: Sendable {
    public let fileURL: URL

    public init(fileURL: URL) {
        self.fileURL = fileURL
    }

    public static func `default`() -> WakeTaskStoreLocation {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return WakeTaskStoreLocation(fileURL: base.appendingPathComponent("waketask/wake-task-store.json"))
    }
}

public final class LocalWakeAlarmRepository: WakeAlarmRepository, @unchecked Sendable {
    private let store: WakeTaskLocalStore

    public init(location: WakeTaskStoreLocation = .default()) {
        store = WakeTaskLocalStore(fileURL: location.fileURL)
    }

    public func listAlarms() async throws -> [WakeAlarm] {
        let snapshot = try await store.load()
        return snapshot.alarms.sorted { lhs, rhs in
            if lhs.hour == rhs.hour {
                return lhs.minute < rhs.minute
            }
            return lhs.hour < rhs.hour
        }
    }

    public func upsertAlarm(_ alarm: WakeAlarm) async throws {
        var snapshot = try await store.load()
        if let index = snapshot.alarms.firstIndex(where: { $0.id == alarm.id }) {
            snapshot.alarms[index] = alarm
        } else {
            snapshot.alarms.append(alarm)
        }
        try await store.save(snapshot)
    }

    public func deleteAlarm(id: UUID) async throws {
        var snapshot = try await store.load()
        snapshot.alarms.removeAll { $0.id == id }
        snapshot.runs.removeAll { $0.alarmID == id }
        try await store.save(snapshot)
    }
}

public final class LocalWakeRunRepository: WakeRunRepository, @unchecked Sendable {
    private let store: WakeTaskLocalStore

    public init(location: WakeTaskStoreLocation = .default()) {
        store = WakeTaskLocalStore(fileURL: location.fileURL)
    }

    public func saveRun(_ run: WakeRun) async throws {
        var snapshot = try await store.load()
        if let index = snapshot.runs.firstIndex(where: { $0.id == run.id }) {
            snapshot.runs[index] = run
        } else {
            snapshot.runs.append(run)
        }
        try await store.save(snapshot)
    }

    public func loadRun(id: UUID) async throws -> WakeRun? {
        let snapshot = try await store.load()
        return snapshot.runs.first(where: { $0.id == id })
    }

    public func listRuns(alarmID: UUID?, limit: Int) async throws -> [WakeRun] {
        let snapshot = try await store.load()
        let filtered = snapshot.runs.filter { run in
            guard let alarmID else { return true }
            return run.alarmID == alarmID
        }

        return filtered
            .sorted(by: { $0.scheduledAt > $1.scheduledAt })
            .prefix(max(1, limit))
            .map(\.self)
    }
}
