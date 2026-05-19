import Foundation

public extension L10n {
    /// Common strings shared by multiple screens (dialog buttons, loaders, etc.).
    enum Common {
        public static var ok: String {
            String(localized: "common.ok", bundle: bundle)
        }

        public static var cancel: String {
            String(localized: "common.cancel", bundle: bundle)
        }

        public static var done: String {
            String(localized: "common.done", bundle: bundle)
        }

        public static var save: String {
            String(localized: "common.save", bundle: bundle)
        }

        public static var delete: String {
            String(localized: "common.delete", bundle: bundle)
        }

        public static var edit: String {
            String(localized: "common.edit", bundle: bundle)
        }

        public static var close: String {
            String(localized: "common.close", bundle: bundle)
        }

        public static var loading: String {
            String(localized: "common.loading", bundle: bundle)
        }

        public static var tryAgain: String {
            String(localized: "common.tryAgain", bundle: bundle)
        }

        public static var learnMore: String {
            String(localized: "common.learnMore", bundle: bundle)
        }
    }
}
