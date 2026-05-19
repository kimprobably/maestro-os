// This file is auto-generated from Config/Secrets.xcconfig
// Run 'bash scripts/update-config.sh' after updating Secrets.xcconfig
// Default placeholder values allow clone-and-run with MockAuthClient and EchoLLMClient

import Foundation

/// Application configuration loaded from Config/Secrets.xcconfig
/// This ensures configs work in all build types (Debug, Release, Archive, TestFlight, App Store)
enum AppConfiguration {
    static let SUPABASE_URL = "https://placeholder.supabase.co"
    static let SUPABASE_ANON_KEY = "placeholder-key-for-debug-mode"
    static let REVENUECAT_API_KEY = "placeholder_rc_key"
    static let RC_ENTITLEMENT_ID = "pro"
    static let PROXY_BASE_URL = "https://placeholder.supabase.co/functions/v1"
    static let PROXY_PATH = "/ai"
    static let ONESIGNAL_APP_ID = "placeholder_onesignal_app_id"
    
    /// Check if a configuration value is available (not a placeholder)
    static func isConfigured(_ key: String) -> Bool {
        switch key {
        case "SUPABASE_URL": return !SUPABASE_URL.contains("placeholder") && !SUPABASE_URL.contains("YOUR")
        case "SUPABASE_ANON_KEY": return !SUPABASE_ANON_KEY.contains("placeholder") && !SUPABASE_ANON_KEY.contains("YOUR")
        case "REVENUECAT_API_KEY": return !REVENUECAT_API_KEY.contains("placeholder") && !REVENUECAT_API_KEY.contains("YOUR")
        case "PROXY_BASE_URL": return !PROXY_BASE_URL.contains("placeholder") && !PROXY_BASE_URL.contains("YOUR")
        case "ONESIGNAL_APP_ID": return !ONESIGNAL_APP_ID.contains("placeholder") && !ONESIGNAL_APP_ID.contains("YOUR")
        default: return true
        }
    }
}
