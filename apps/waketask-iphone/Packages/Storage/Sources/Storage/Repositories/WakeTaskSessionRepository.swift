import Foundation
import Core

public actor LocalWakeTaskSessionRepository: WakeTaskSessionRepository {
    private let userDefaults: UserDefaults
    private let storageKey: String
    private let maxRecords: Int

    public init(
        userDefaults: UserDefaults = .standard,
        storageKey: String = "waketask.reliability.records.v1",
        maxRecords: Int = 120
    ) {
        self.userDefaults = userDefaults
        self.storageKey = storageKey
        self.maxRecords = maxRecords
    }

    public func upsert(record: AlarmReliabilityRecord) async throws {
        var records = try loadRecords()

        if let index = records.firstIndex(where: { $0.id == record.id }) {
            records[index] = record
        } else {
            records.append(record)
        }

        records.sort { $0.alarmScheduledAt > $1.alarmScheduledAt }
        if records.count > maxRecords {
            records = Array(records.prefix(maxRecords))
        }

        try persist(records)
    }

    public func fetch(id: UUID) async throws -> AlarmReliabilityRecord? {
        try loadRecords().first { $0.id == id }
    }

    public func listRecent(limit: Int) async throws -> [AlarmReliabilityRecord] {
        let records = try loadRecords().sorted { $0.alarmScheduledAt > $1.alarmScheduledAt }
        return Array(records.prefix(max(0, limit)))
    }

    private func loadRecords() throws -> [AlarmReliabilityRecord] {
        guard let data = userDefaults.data(forKey: storageKey) else {
            return []
        }

        do {
            return try JSONDecoder().decode([AlarmReliabilityRecord].self, from: data)
        } catch {
            AppLogger.error("Failed to decode wake session records", category: AppLogger.storage)
            throw StorageError.underlying(error)
        }
    }

    private func persist(_ records: [AlarmReliabilityRecord]) throws {
        do {
            let data = try JSONEncoder().encode(records)
            userDefaults.set(data, forKey: storageKey)
        } catch {
            AppLogger.error("Failed to encode wake session records", category: AppLogger.storage)
            throw StorageError.underlying(error)
        }
    }
}
