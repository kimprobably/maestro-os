import Foundation

public struct WakeContractEvaluator {
    public init() {}

    public func dismiss(_ run: WakeRun, at now: Date, wakeCheckWindow: TimeInterval) -> WakeRun {
        var updated = run
        updated.state = .dismissedAwaitingCheck
        updated.wakeCheckDeadline = now.addingTimeInterval(wakeCheckWindow)
        updated.events.append(WakeRunEvent(occurredAt: now, kind: .alarmDismissed))
        return updated
    }

    public func completeWakeCheck(_ run: WakeRun, at now: Date) -> WakeRun {
        var updated = run
        updated.state = .verified
        updated.wakeCheckCompletedAt = now
        updated.events.append(WakeRunEvent(occurredAt: now, kind: .wakeCheckPassed))
        return updated
    }

    public func evaluateEscalation(_ run: WakeRun, now: Date) -> WakeRun {
        guard run.state == .dismissedAwaitingCheck,
              let deadline = run.wakeCheckDeadline,
              now > deadline,
              run.wakeCheckCompletedAt == nil
        else {
            return run
        }

        var updated = run
        updated.state = .escalated
        updated.escalationTriggeredAt = now
        updated.events.append(
            WakeRunEvent(occurredAt: now, kind: .escalationTriggered, reason: "Wake check missed")
        )
        return updated
    }

    public func completeFirstTask(_ run: WakeRun, at now: Date) -> WakeRun {
        var updated = run
        updated.firstTaskCompletedAt = now
        updated.events.append(WakeRunEvent(occurredAt: now, kind: .firstTaskCompleted))

        if updated.state == .verified {
            updated.state = .completed
            updated.events.append(WakeRunEvent(occurredAt: now, kind: .runCompleted))
        }

        return updated
    }
}
