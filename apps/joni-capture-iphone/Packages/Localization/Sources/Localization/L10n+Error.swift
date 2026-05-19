import Foundation

public extension L10n {
    /// User-facing error messages surfaced by view models / toasts.
    enum Error {
        public static var generic: String {
            String(localized: "error.generic", bundle: bundle)
        }

        public static var networkOffline: String {
            String(localized: "error.networkOffline", bundle: bundle)
        }

        public static var timeout: String {
            String(localized: "error.timeout", bundle: bundle)
        }

        public static var invalidEmail: String {
            String(localized: "error.invalidEmail", bundle: bundle)
        }

        public static var passwordTooShort: String {
            String(localized: "error.passwordTooShort", bundle: bundle)
        }

        public static var passwordMismatch: String {
            String(localized: "error.passwordMismatch", bundle: bundle)
        }

        public static var authFailed: String {
            String(localized: "error.authFailed", bundle: bundle)
        }

        public static var purchaseFailed: String {
            String(localized: "error.purchaseFailed", bundle: bundle)
        }

        public static var loadFailed: String {
            String(localized: "error.loadFailed", bundle: bundle)
        }

        public static var saveFailed: String {
            String(localized: "error.saveFailed", bundle: bundle)
        }
    }
}
