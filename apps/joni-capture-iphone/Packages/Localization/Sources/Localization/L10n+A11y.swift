import Foundation

public extension L10n {
    /// VoiceOver accessibility labels and hints.
    enum A11y {
        public static var sendMessage: String {
            String(localized: "a11y.sendMessage", bundle: bundle)
        }

        public static var sendMessageHint: String {
            String(localized: "a11y.sendMessageHint", bundle: bundle)
        }

        public static var userMessage: String {
            String(localized: "a11y.userMessage", bundle: bundle)
        }

        public static var assistantMessage: String {
            String(localized: "a11y.assistantMessage", bundle: bundle)
        }

        public static var copyMessageHint: String {
            String(localized: "a11y.copyMessageHint", bundle: bundle)
        }

        public static var themeSelector: String {
            String(localized: "a11y.themeSelector", bundle: bundle)
        }

        public static var signInAppleHint: String {
            String(localized: "a11y.signInAppleHint", bundle: bundle)
        }

        public static var profilePhoto: String {
            String(localized: "a11y.profilePhoto", bundle: bundle)
        }

        public static var profilePhotoHint: String {
            String(localized: "a11y.profilePhotoHint", bundle: bundle)
        }
    }
}
