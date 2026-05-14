import Core
import Foundation
import Observation

@MainActor
@Observable
public final class WakeFlowViewModel {
    public private(set) var alarms: [WakeAlarm] = []
    public private(set) var activeRun: WakeRun?
    public private(set) var recentRuns: [WakeRun] = []
    public private(set) var weeklyConsistency: Double = 0
    public private(set) var isLoading = false
    public private(set) var errorMessage: String?

    private let alarmRepository: any WakeAlarmRepository
    private let runRepository: any WakeRunRepository
    private let missionEngine: any WakeMissionRotationEngine
    private let contractEvaluator: WakeContractEvaluator
    private let now: @Sendable () -> Date

    public init(
        alarmRepository: any WakeAlarmRepository,
        runRepository: any WakeRunRepository,
        missionEngine: any WakeMissionRotationEngine,
        contractEvaluator: WakeContractEvaluator = WakeContractEvaluator(),
        now: @escaping @Sendable () -> Date = Date.init
    ) {
        self.alarmRepository = alarmRepository
        self.runRepository = runRepository
        self.missionEngine = missionEngine
        self.contractEvaluator = contractEvaluator
        self.now = now
    }

    public func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            alarms = try await alarmRepository.listAlarms()
            recentRuns = try await runRepository.listRuns(alarmID: nil, limit: 10)
            weeklyConsistency = try await computeWeeklyConsistency()
        } catch {
            errorMessage = "Failed to load wake data"
            AppLogger.error("Wake load failed: \(AppLogger.redacted(error.localizedDescription))", category: AppLogger.feature)
        }
    }

    public func createAlarm(title: String, hour: Int, minute: Int, strictness: WakeStrictness, firstTaskTitle: String) async {
        let draft = WakeAlarmDraft(
            title: title,
            hour: hour,
            minute: minute,
            strictness: strictness,
            firstTaskTitle: firstTaskTitle
        )
        await createAlarm(draft)
    }

    public func createAlarm(_ draft: WakeAlarmDraft) async {
        await upsertAlarm(
            id: UUID(),
            draft: draft,
            enabled: true,
            createdAt: now()
        )
    }

    public func updateAlarm(id: UUID, draft: WakeAlarmDraft) async {
        guard let existing = alarms.first(where: { $0.id == id }) else { return }
        await upsertAlarm(
            id: id,
            draft: draft,
            enabled: existing.enabled,
            createdAt: existing.createdAt
        )
    }

    private func upsertAlarm(
        id: UUID,
        draft: WakeAlarmDraft,
        enabled: Bool,
        createdAt: Date
    ) async {
        let window: TimeInterval = switch draft.strictness {
        case .relaxed: 180
        case .balanced: 120
        case .strict: 60
        }

        let alarm = WakeAlarm(
            id: id,
            title: draft.title,
            hour: draft.hour,
            minute: draft.minute,
            enabled: enabled,
            strictness: draft.strictness,
            wakeCheckWindowSeconds: window,
            firstTaskTitle: draft.firstTaskTitle,
            createdAt: createdAt,
            updatedAt: now()
        )

        do {
            try await alarmRepository.upsertAlarm(alarm)
            alarms = try await alarmRepository.listAlarms()
        } catch {
            errorMessage = "Failed to save alarm"
        }
    }

    public func setAlarmEnabled(id: UUID, enabled: Bool) async {
        guard var alarm = alarms.first(where: { $0.id == id }) else { return }
        alarm.enabled = enabled
        alarm.updatedAt = now()

        do {
            try await alarmRepository.upsertAlarm(alarm)
            alarms = try await alarmRepository.listAlarms()
        } catch {
            errorMessage = "Failed to update alarm"
        }
    }

    public func triggerAlarm(alarmID: UUID) async {
        guard let alarm = alarms.first(where: { $0.id == alarmID }) else { return }

        do {
            let previousRuns = try await runRepository.listRuns(alarmID: alarmID, limit: 7)
            let missions = missionEngine.missions(for: alarm, previousRuns: previousRuns, missionCount: 3)
            let run = WakeRun(
                alarmID: alarmID,
                scheduledAt: now(),
                missions: missions,
                events: [
                    WakeRunEvent(occurredAt: now(), kind: .scheduled),
                    WakeRunEvent(occurredAt: now(), kind: .alarmTriggered),
                ]
            )
            try await runRepository.saveRun(run)
            activeRun = run
            recentRuns = try await runRepository.listRuns(alarmID: nil, limit: 10)
        } catch {
            errorMessage = "Failed to start alarm"
        }
    }

    public func completeMission(missionID: UUID) async {
        guard var run = activeRun else { return }
        run.completedMissionIDs.insert(missionID)
        run.events.append(WakeRunEvent(occurredAt: now(), kind: .missionCompleted))

        do {
            try await runRepository.saveRun(run)
            activeRun = run
        } catch {
            errorMessage = "Failed to update mission"
        }
    }

    public func dismissAlarm() async {
        guard let run = activeRun,
              let alarm = alarms.first(where: { $0.id == run.alarmID }),
              run.allMissionsCompleted else { return }

        let updated = contractEvaluator.dismiss(run, at: now(), wakeCheckWindow: alarm.wakeCheckWindowSeconds)
        await persistActiveRun(updated)
    }

    public func completeWakeCheck() async {
        guard let run = activeRun,
              run.state == .dismissedAwaitingCheck || run.state == .escalated else { return }
        let updated = contractEvaluator.completeWakeCheck(run, at: now())
        await persistActiveRun(updated)
    }

    public func completeFirstTask() async {
        guard let run = activeRun,
              run.state == .verified else { return }
        let updated = contractEvaluator.completeFirstTask(run, at: now())
        await persistActiveRun(updated)
        do {
            weeklyConsistency = try await computeWeeklyConsistency()
        } catch {
            errorMessage = "Failed to update consistency"
        }
    }

    public func evaluateEscalationIfNeeded() async {
        guard let run = activeRun else { return }
        let updated = contractEvaluator.evaluateEscalation(run, now: now())
        if updated != run {
            await persistActiveRun(updated)
        }
    }

    private func persistActiveRun(_ run: WakeRun) async {
        do {
            try await runRepository.saveRun(run)
            activeRun = run
            recentRuns = try await runRepository.listRuns(alarmID: nil, limit: 10)
        } catch {
            errorMessage = "Failed to update run"
        }
    }

    private func computeWeeklyConsistency() async throws -> Double {
        let runs = try await runRepository.listRuns(alarmID: nil, limit: 50)
        let oneWeekAgo = now().addingTimeInterval(-7 * 24 * 60 * 60)
        let weekly = runs.filter { $0.scheduledAt >= oneWeekAgo }
        guard !weekly.isEmpty else { return 0 }

        let completed = weekly.count(where: { $0.state == .completed })
        return Double(completed) / Double(weekly.count)
    }
}
