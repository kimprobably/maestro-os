import Foundation

public extension L10n {
    /// Paywall + subscription-management strings.
    enum Payments {
        public static var upgradeToPro: String {
            String(localized: "payments.upgradeToPro", bundle: bundle)
        }

        public static var restore: String {
            String(localized: "payments.restore", bundle: bundle)
        }

        public static var subscribe: String {
            String(localized: "payments.subscribe", bundle: bundle)
        }

        public static var freeTrial: String {
            String(localized: "payments.freeTrial", bundle: bundle)
        }

        public static var perMonth: String {
            String(localized: "payments.perMonth", bundle: bundle)
        }

        public static var perYear: String {
            String(localized: "payments.perYear", bundle: bundle)
        }

        public static var bestValue: String {
            String(localized: "payments.bestValue", bundle: bundle)
        }

        public static var cancelAnytime: String {
            String(localized: "payments.cancelAnytime", bundle: bundle)
        }

        public static var subscribed: String {
            String(localized: "payments.subscribed", bundle: bundle)
        }

        public static var manageSubscription: String {
            String(localized: "payments.manageSubscription", bundle: bundle)
        }
    }
}
