import Foundation
import Core

struct WakeTaskStoreSnapshot: Codable, Sendable {
    var alarms: [WakeAlarm]
    var runs: [WakeRun]

    static let empty = WakeTaskStoreSnapshot(alarms: [], runs: [])
}

actor WakeTaskLocalStore {
    private let fileURL: URL
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(fileURL: URL) {
        self.fileURL = fileURL
        self.encoder = JSONEncoder()
        self.decoder = JSONDecoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.decoder.dateDecodingStrategy = .iso8601
    }

    func load() throws -> WakeTaskStoreSnapshot {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return .empty
        }

        let data = try Data(contentsOf: fileURL)
        return try decoder.decode(WakeTaskStoreSnapshot.self, from: data)
    }

    func save(_ snapshot: WakeTaskStoreSnapshot) throws {
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let data = try encoder.encode(snapshot)
        try data.write(to: fileURL, options: .atomic)
    }
}
