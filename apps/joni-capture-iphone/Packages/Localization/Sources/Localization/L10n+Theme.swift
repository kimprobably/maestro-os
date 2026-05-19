import Foundation

public extension L10n {
    /// Display names for the five built-in themes.
    enum Theme {
        public static var system: String {
            String(localized: "theme.system", bundle: bundle)
        }

        public static var light: String {
            String(localized: "theme.light", bundle: bundle)
        }

        public static var dark: String {
            String(localized: "theme.dark", bundle: bundle)
        }

        public static var aurora: String {
            String(localized: "theme.aurora", bundle: bundle)
        }

        public static var obsidian: String {
            String(localized: "theme.obsidian", bundle: bundle)
        }
    }
}
