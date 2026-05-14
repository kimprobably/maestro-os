import Foundation

/// Feature flags for optional capabilities
public enum FeatureFlags {
    /// Master switch for diagnostics (MetricKit always enabled)
    public static var diagnosticsEnabled: Bool {
        #if DEBUG
            return true
        #else
            return ProcessInfo.processInfo.environment["DIAGNOSTICS_ENABLED"] == "true"
        #endif
    }

    /// Enable Firebase Crashlytics
    public static var crashlyticsEnabled: Bool {
        #if DEBUG
            return false // Off by default in debug
        #else
            return ProcessInfo.processInfo.environment["CRASHLYTICS_ENABLED"] == "true"
        #endif
    }

    /// Enable Supabase chat history sync
    /// When true, conversations and messages sync to Supabase backend
    /// When false (default), chat data stays local-only in SwiftData
    /// See docs/CHAT_SYNC_SETUP.md for setup instructions
    public static var chatSyncEnabled: Bool {
        #if DEBUG
            return false // Off by default in debug
        #else
            return ProcessInfo.processInfo.environment["CHAT_SYNC_ENABLED"] == "true"
        #endif
    }
}
