import Foundation

public extension L10n {
    enum Wake {
        public static var title: String { String(localized: "wake.title", bundle: bundle) }
        public static var addAlarm: String { String(localized: "wake.addAlarm", bundle: bundle) }
        public static var alarms: String { String(localized: "wake.alarms", bundle: bundle) }
        public static var activeRun: String { String(localized: "wake.activeRun", bundle: bundle) }
        public static var noAlarms: String { String(localized: "wake.noAlarms", bundle: bundle) }
        public static var thisWeek: String { String(localized: "wake.thisWeek", bundle: bundle) }
        public static var consistency: String { String(localized: "wake.consistency", bundle: bundle) }
        public static var startRun: String { String(localized: "wake.startRun", bundle: bundle) }
        public static var completeWakeCheck: String { String(localized: "wake.completeWakeCheck", bundle: bundle) }
        public static var completeFirstTask: String { String(localized: "wake.completeFirstTask", bundle: bundle) }
        public static var dismissAlarm: String { String(localized: "wake.dismissAlarm", bundle: bundle) }
        public static var newAlarm: String { String(localized: "wake.newAlarm", bundle: bundle) }
        public static var alarmName: String { String(localized: "wake.alarmName", bundle: bundle) }
        public static var time: String { String(localized: "wake.time", bundle: bundle) }
        public static var strictnessLabel: String { String(localized: "wake.strictnessLabel", bundle: bundle) }
        public static var firstTask: String { String(localized: "wake.firstTask", bundle: bundle) }
        public static var relaxed: String { String(localized: "wake.relaxed", bundle: bundle) }
        public static var balanced: String { String(localized: "wake.balanced", bundle: bundle) }
        public static var strict: String { String(localized: "wake.strict", bundle: bundle) }
        public static var errorTitle: String { String(localized: "wake.errorTitle", bundle: bundle) }

        public static func strictness(_ value: String) -> String {
            String(format: String(localized: "wake.strictness %@", bundle: bundle), value)
        }

        public static func runState(_ value: String) -> String {
            String(format: String(localized: "wake.runState %@", bundle: bundle), value)
        }
    }
}

public extension L10n.Wake {
    enum A11y {
        public static var addAlarmLabel: String { String(localized: "wake.a11y.addAlarmLabel", bundle: L10n.bundle) }
        public static var addAlarmHint: String { String(localized: "wake.a11y.addAlarmHint", bundle: L10n.bundle) }
        public static var startRunHint: String { String(localized: "wake.a11y.startRunHint", bundle: L10n.bundle) }
        public static var completeWakeCheckLabel: String { String(localized: "wake.a11y.completeWakeCheckLabel", bundle: L10n.bundle) }
        public static var completeWakeCheckHint: String { String(localized: "wake.a11y.completeWakeCheckHint", bundle: L10n.bundle) }
        public static var completeFirstTaskLabel: String { String(localized: "wake.a11y.completeFirstTaskLabel", bundle: L10n.bundle) }
        public static var completeFirstTaskHint: String { String(localized: "wake.a11y.completeFirstTaskHint", bundle: L10n.bundle) }
        public static var dismissAlarmLabel: String { String(localized: "wake.a11y.dismissAlarmLabel", bundle: L10n.bundle) }
        public static var dismissAlarmHint: String { String(localized: "wake.a11y.dismissAlarmHint", bundle: L10n.bundle) }
        public static var alarmNameField: String { String(localized: "wake.a11y.alarmNameField", bundle: L10n.bundle) }
        public static var alarmTimeField: String { String(localized: "wake.a11y.alarmTimeField", bundle: L10n.bundle) }
        public static var strictnessPicker: String { String(localized: "wake.a11y.strictnessPicker", bundle: L10n.bundle) }
        public static var firstTaskField: String { String(localized: "wake.a11y.firstTaskField", bundle: L10n.bundle) }

        public static func weeklyConsistency(_ value: String) -> String {
            String(format: String(localized: "wake.a11y.weeklyConsistency %@", bundle: L10n.bundle), value)
        }

        public static func startRun(_ title: String) -> String {
            String(format: String(localized: "wake.a11y.startRun %@", bundle: L10n.bundle), title)
        }

        public static func enableAlarm(_ title: String) -> String {
            String(format: String(localized: "wake.a11y.enableAlarm %@", bundle: L10n.bundle), title)
        }

        public static func completeMission(_ title: String) -> String {
            String(format: String(localized: "wake.a11y.completeMission %@", bundle: L10n.bundle), title)
        }
    }
}
