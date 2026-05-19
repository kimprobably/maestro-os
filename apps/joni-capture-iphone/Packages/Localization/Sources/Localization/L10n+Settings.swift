import Foundation

public extension L10n {
    /// Settings-screen strings (sections, toggles, legal links).
    enum Settings {
        public static var title: String {
            String(localized: "settings.title", bundle: bundle)
        }

        public static var appearance: String {
            String(localized: "settings.appearance", bundle: bundle)
        }

        public static var theme: String {
            String(localized: "settings.theme", bundle: bundle)
        }

        public static var notifications: String {
            String(localized: "settings.notifications", bundle: bundle)
        }

        public static var pushNotifications: String {
            String(localized: "settings.pushNotifications", bundle: bundle)
        }

        public static var privacy: String {
            String(localized: "settings.privacy", bundle: bundle)
        }

        public static var shareDiagnostics: String {
            String(localized: "settings.shareDiagnostics", bundle: bundle)
        }

        public static var shareDiagnosticsSubtitle: String {
            String(localized: "settings.shareDiagnosticsSubtitle", bundle: bundle)
        }

        public static var account: String {
            String(localized: "settings.account", bundle: bundle)
        }

        public static var deleteAccount: String {
            String(localized: "settings.deleteAccount", bundle: bundle)
        }

        public static var legal: String {
            String(localized: "settings.legal", bundle: bundle)
        }

        public static var termsOfService: String {
            String(localized: "settings.termsOfService", bundle: bundle)
        }

        public static var privacyPolicy: String {
            String(localized: "settings.privacyPolicy", bundle: bundle)
        }

        public static var about: String {
            String(localized: "settings.about", bundle: bundle)
        }

        public static var version: String {
            String(localized: "settings.version", bundle: bundle)
        }
    }
}
