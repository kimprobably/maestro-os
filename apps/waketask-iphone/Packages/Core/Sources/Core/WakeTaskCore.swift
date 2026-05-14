import Foundation
import Observation

public enum WakeMissionType: String, Codable, Sendable, CaseIterable {
    case math
    case memory
    case motion
    case scan

    public var isAlwaysAvailableFallback: Bool {
        self != .scan
    }
}

public struct WakeMissionChain: Codable, Sendable, Equatable {
    public let primary: WakeMissionType
    public let fallback: WakeMissionType

    public init(primary: WakeMissionType, fallback: WakeMissionType) {
        self.primary = primary
        self.fallback = fallback
    }

    public var supportsFallbackSafety: Bool {
        fallback.isAlwaysAvailableFallback
    }
}

public enum WakeProfile: String, Codable, Sendable, CaseIterable {
    case weekday
    case weekend
    case travel
}

public enum WakeCheckOutcome: String, Codable, Sendable, Equatable {
    case passed
    case failed
    case missed
}

public struct WakeCheckResult: Codable, Sendable, Equatable {
    public let offsetMinutes: Int
    public let outcome: WakeCheckOutcome
    public let checkedAt: Date

    public init(offsetMinutes: Int, outcome: WakeCheckOutcome, checkedAt: Date) {
        self.offsetMinutes = offsetMinutes
        self.outcome = outcome
        self.checkedAt = checkedAt
    }
}

public struct AlarmReliabilityRecord: Codable, Sendable, Equatable, Identifiable {
    public let id: UUID
    public let alarmScheduledAt: Date
    public var alarmFiredAt: Date?
    public var dismissedAt: Date?
    public var wakeCheckResults: [WakeCheckResult]
    public var fallbackUsed: Bool
    public let profileUsed: WakeProfile
    public let missionChain: WakeMissionChain

    public init(
        id: UUID = UUID(),
        alarmScheduledAt: Date,
        alarmFiredAt: Date? = nil,
        dismissedAt: Date? = nil,
        wakeCheckResults: [WakeCheckResult] = [],
        fallbackUsed: Bool = false,
        profileUsed: WakeProfile,
        missionChain: WakeMissionChain
    ) {
        self.id = id
        self.alarmScheduledAt = alarmScheduledAt
        self.alarmFiredAt = alarmFiredAt
        self.dismissedAt = dismissedAt
        self.wakeCheckResults = wakeCheckResults
        self.fallbackUsed = fallbackUsed
        self.profileUsed = profileUsed
        self.missionChain = missionChain
    }

    public var didRequireEscalation: Bool {
        wakeCheckResults.contains { $0.outcome != .passed }
    }

    public var didPassAllWakeChecks: Bool {
        let plannedOffsets = Set(WakeCheckSchedulePlanner.defaultOffsetsMinutes)
        let passedOffsets = Set(wakeCheckResults.filter { $0.outcome == .passed }.map(\.offsetMinutes))
        return plannedOffsets.isSubset(of: passedOffsets)
    }
}

public enum WakeTaskDomainError: LocalizedError, Equatable {
    case fallbackMissionUnavailable
    case noActiveSession
    case wakeCheckBeforeDismissal

    public var errorDescription: String? {
        switch self {
        case .fallbackMissionUnavailable:
            return "Fallback mission must be a non-scan mission."
        case .noActiveSession:
            return "No active wake session was found."
        case .wakeCheckBeforeDismissal:
            return "Wake checks can only be recorded after dismissal."
        }
    }
}

public protocol WakeTaskSessionRepository: Sendable {
    func upsert(record: AlarmReliabilityRecord) async throws
    func fetch(id: UUID) async throws -> AlarmReliabilityRecord?
    func listRecent(limit: Int) async throws -> [AlarmReliabilityRecord]
}

public enum WakeCheckSchedulePlanner {
    public static let defaultOffsetsMinutes = [3, 7, 12]

    public static func checkOffsets(for profile: WakeProfile) -> [Int] {
        // MVP keeps timing deterministic across profiles; profile affects mission strictness.
        defaultOffsetsMinutes
    }
}

@MainActor
@Observable
public final class WakeTaskSessionViewModel {
    public private(set) var currentRecord: AlarmReliabilityRecord?
    public private(set) var isLoading = false
    public private(set) var errorMessage: String?

    private let repository: any WakeTaskSessionRepository

    public init(repository: any WakeTaskSessionRepository) {
        self.repository = repository
    }

    public func startSession(scheduledAt: Date, profile: WakeProfile, missionChain: WakeMissionChain) async {
        guard missionChain.supportsFallbackSafety else {
            errorMessage = WakeTaskDomainError.fallbackMissionUnavailable.localizedDescription
            return
        }

        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            let record = AlarmReliabilityRecord(
                alarmScheduledAt: scheduledAt,
                profileUsed: profile,
                missionChain: missionChain
            )
            try await repository.upsert(record: record)
            currentRecord = record
        } catch {
            errorMessage = "Failed to create wake session"
            AppLogger.error("Failed to start wake session: \(error)", category: AppLogger.storage)
        }
    }

    public func markAlarmFired(at date: Date = Date()) async {
        await mutateCurrentRecord {
            $0.alarmFiredAt = date
        }
    }

    public func markDismissed(at date: Date = Date(), fallbackUsed: Bool) async {
        await mutateCurrentRecord {
            $0.dismissedAt = date
            $0.fallbackUsed = fallbackUsed
        }
    }

    public func recordWakeCheck(offsetMinutes: Int, outcome: WakeCheckOutcome, checkedAt: Date = Date()) async {
        guard let record = currentRecord else {
            errorMessage = WakeTaskDomainError.noActiveSession.localizedDescription
            return
        }

        guard record.dismissedAt != nil else {
            errorMessage = WakeTaskDomainError.wakeCheckBeforeDismissal.localizedDescription
            return
        }

        await mutateCurrentRecord { record in
            let updated = WakeCheckResult(offsetMinutes: offsetMinutes, outcome: outcome, checkedAt: checkedAt)
            record.wakeCheckResults.removeAll { $0.offsetMinutes == offsetMinutes }
            record.wakeCheckResults.append(updated)
            record.wakeCheckResults.sort { $0.offsetMinutes < $1.offsetMinutes }
        }
    }

    public var requiresEscalation: Bool {
        currentRecord?.didRequireEscalation ?? false
    }

    public var isSessionSuccessful: Bool {
        currentRecord?.didPassAllWakeChecks ?? false
    }

    private func mutateCurrentRecord(_ transform: (inout AlarmReliabilityRecord) -> Void) async {
        guard var record = currentRecord else {
            errorMessage = WakeTaskDomainError.noActiveSession.localizedDescription
            return
        }

        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        transform(&record)

        do {
            try await repository.upsert(record: record)
            currentRecord = record
        } catch {
            errorMessage = "Failed to update wake session"
            AppLogger.error("Failed to update wake session: \(error)", category: AppLogger.storage)
        }
    }
}
