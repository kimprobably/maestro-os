import Foundation

public extension L10n {
    /// Onboarding flow strings.
    enum Onboarding {
        public static var welcome: String {
            String(localized: "onboarding.welcome", bundle: bundle)
        }

        public static var getStarted: String {
            String(localized: "onboarding.getStarted", bundle: bundle)
        }

        public static var continueButton: String {
            String(localized: "onboarding.continue", bundle: bundle)
        }

        public static var skip: String {
            String(localized: "onboarding.skip", bundle: bundle)
        }

        public static var next: String {
            String(localized: "onboarding.next", bundle: bundle)
        }
    }
}
