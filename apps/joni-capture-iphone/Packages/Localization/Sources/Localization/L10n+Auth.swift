import Foundation

public extension L10n {
    /// Authentication-related strings (sign-in, sign-up, legal copy).
    enum Auth {
        public static var tagline: String {
            String(localized: "auth.tagline", bundle: bundle)
        }

        public static var signInApple: String {
            String(localized: "auth.signIn.apple", bundle: bundle)
        }

        public static var signInGoogle: String {
            String(localized: "auth.signIn.google", bundle: bundle)
        }

        public static var useEmail: String {
            String(localized: "auth.useEmail", bundle: bundle)
        }

        public static var signIn: String {
            String(localized: "auth.signIn", bundle: bundle)
        }

        public static var createAccount: String {
            String(localized: "auth.createAccount", bundle: bundle)
        }

        public static var forgotPassword: String {
            String(localized: "auth.forgotPassword", bundle: bundle)
        }

        public static var signOut: String {
            String(localized: "auth.signOut", bundle: bundle)
        }

        public static var email: String {
            String(localized: "auth.email", bundle: bundle)
        }

        public static var password: String {
            String(localized: "auth.password", bundle: bundle)
        }

        public static var confirmPassword: String {
            String(localized: "auth.confirmPassword", bundle: bundle)
        }

        public static var legalDisclaimer: String {
            String(localized: "auth.legalDisclaimer", bundle: bundle)
        }
    }
}
