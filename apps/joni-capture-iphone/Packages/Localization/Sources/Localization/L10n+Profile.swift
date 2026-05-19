import Foundation

public extension L10n {
    /// Profile-screen strings.
    enum Profile {
        public static var title: String {
            String(localized: "profile.title", bundle: bundle)
        }

        public static var edit: String {
            String(localized: "profile.edit", bundle: bundle)
        }

        public static var changePhoto: String {
            String(localized: "profile.changePhoto", bundle: bundle)
        }

        public static var displayName: String {
            String(localized: "profile.displayName", bundle: bundle)
        }
    }
}
