import Foundation

public enum WakeStrictness: String, Codable, Sendable, CaseIterable {
    case relaxed
    case balanced
    case strict
}

public enum WakeMissionModality: String, Codable, Sendable, CaseIterable {
    case cognitive
    case movement
    case scanPhoto
}

public struct WakeAlarm: Identifiable, Codable, Sendable, Equatable {
    public let id: UUID
    public var title: String
    public var hour: Int
    public var minute: Int
    public var enabled: Bool
    public var strictness: WakeStrictness
    public var wakeCheckWindowSeconds: TimeInterval
    public var firstTaskTitle: String
    public var createdAt: Date
    public var updatedAt: Date

    public init(
        id: UUID = UUID(),
        title: String,
        hour: Int,
        minute: Int,
        enabled: Bool = true,
        strictness: WakeStrictness,
        wakeCheckWindowSeconds: TimeInterval,
        firstTaskTitle: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.title = title
        self.hour = hour
        self.minute = minute
        self.enabled = enabled
        self.strictness = strictness
        self.wakeCheckWindowSeconds = wakeCheckWindowSeconds
        self.firstTaskTitle = firstTaskTitle
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

public struct WakeAlarmDraft: Sendable, Equatable {
    public var title: String
    public var hour: Int
    public var minute: Int
    public var strictness: WakeStrictness
    public var firstTaskTitle: String

    public init(title: String, hour: Int, minute: Int, strictness: WakeStrictness, firstTaskTitle: String) {
        self.title = title
        self.hour = hour
        self.minute = minute
        self.strictness = strictness
        self.firstTaskTitle = firstTaskTitle
    }
}

public struct WakeMission: Identifiable, Codable, Sendable, Equatable {
    public let id: UUID
    public let modality: WakeMissionModality
    public let prompt: String

    public init(id: UUID = UUID(), modality: WakeMissionModality, prompt: String) {
        self.id = id
        self.modality = modality
        self.prompt = prompt
    }
}

public enum WakeRunState: String, Codable, Sendable {
    case triggered
    case dismissedAwaitingCheck
    case verified
    case escalated
    case completed
}

public struct WakeRunEvent: Identifiable, Codable, Sendable, Equatable {
    public enum Kind: String, Codable, Sendable {
        case scheduled
        case alarmTriggered
        case missionCompleted
        case alarmDismissed
        case wakeCheckPassed
        case escalationTriggered
        case firstTaskCompleted
        case runCompleted
    }

    public let id: UUID
    public let occurredAt: Date
    public let kind: Kind
    public let reason: String?

    public init(id: UUID = UUID(), occurredAt: Date, kind: Kind, reason: String? = nil) {
        self.id = id
        self.occurredAt = occurredAt
        self.kind = kind
        self.reason = reason
    }
}

public struct WakeRun: Identifiable, Codable, Sendable, Equatable {
    public let id: UUID
    public let alarmID: UUID
    public let scheduledAt: Date
    public var state: WakeRunState
    public var wakeCheckDeadline: Date?
    public var wakeCheckCompletedAt: Date?
    public var escalationTriggeredAt: Date?
    public var firstTaskCompletedAt: Date?
    public var missions: [WakeMission]
    public var completedMissionIDs: Set<UUID>
    public var events: [WakeRunEvent]

    public init(
        id: UUID = UUID(),
        alarmID: UUID,
        scheduledAt: Date,
        state: WakeRunState = .triggered,
        wakeCheckDeadline: Date? = nil,
        wakeCheckCompletedAt: Date? = nil,
        escalationTriggeredAt: Date? = nil,
        firstTaskCompletedAt: Date? = nil,
        missions: [WakeMission],
        completedMissionIDs: Set<UUID> = [],
        events: [WakeRunEvent]
    ) {
        self.id = id
        self.alarmID = alarmID
        self.scheduledAt = scheduledAt
        self.state = state
        self.wakeCheckDeadline = wakeCheckDeadline
        self.wakeCheckCompletedAt = wakeCheckCompletedAt
        self.escalationTriggeredAt = escalationTriggeredAt
        self.firstTaskCompletedAt = firstTaskCompletedAt
        self.missions = missions
        self.completedMissionIDs = completedMissionIDs
        self.events = events
    }

    public var allMissionsCompleted: Bool {
        !missions.isEmpty && missions.allSatisfy { completedMissionIDs.contains($0.id) }
    }

    public var isFirstTaskCompleted: Bool {
        firstTaskCompletedAt != nil
    }
}
