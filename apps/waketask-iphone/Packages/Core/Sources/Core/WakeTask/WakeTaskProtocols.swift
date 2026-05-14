import Foundation

public protocol WakeAlarmRepository: Sendable {
    func listAlarms() async throws -> [WakeAlarm]
    func upsertAlarm(_ alarm: WakeAlarm) async throws
    func deleteAlarm(id: UUID) async throws
}

public protocol WakeRunRepository: Sendable {
    func saveRun(_ run: WakeRun) async throws
    func loadRun(id: UUID) async throws -> WakeRun?
    func listRuns(alarmID: UUID?, limit: Int) async throws -> [WakeRun]
}

public protocol WakeMissionRotationEngine: Sendable {
    func missions(for alarm: WakeAlarm, previousRuns: [WakeRun], missionCount: Int) -> [WakeMission]
}
