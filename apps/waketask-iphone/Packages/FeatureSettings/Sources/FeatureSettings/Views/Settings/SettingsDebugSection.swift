#if DEBUG
    import Core
    import SwiftUI

    /// Debug-only section with local notification test hooks + an optional
    /// fatal-error trigger gated by `ENABLE_TEST_CRASH`.
    struct SettingsDebugSection: View {
        var body: some View {
            Section("Debug (Development)") {
                Button {
                    Task { await LocalNotificationTester.diagnostics() }
                } label: {
                    Label("Run Notification Diagnostics", systemImage: "stethoscope")
                }

                if ProcessInfo.processInfo.environment["ENABLE_TEST_CRASH"] == "true" {
                    Button {
                        fatalError("Test crash triggered from Settings")
                    } label: {
                        Label("Trigger Test Crash", systemImage: "exclamationmark.octagon")
                            .foregroundStyle(.red)
                    }
                }

                Button {
                    Task { await LocalNotificationTester.scheduleTest() }
                } label: {
                    Label("Send Test Notification", systemImage: "bell.badge")
                }

                Button {
                    Task { await LocalNotificationTester.quickTest() }
                } label: {
                    Label("Quick Test (with permission)", systemImage: "bell.badge.fill")
                }
            }
            .foregroundStyle(.secondary)
        }
    }
#endif
