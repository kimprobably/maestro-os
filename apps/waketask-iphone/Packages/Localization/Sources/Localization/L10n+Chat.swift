import Foundation

public extension L10n {
    /// Chat-screen strings (input, history, empty state, pluralised counts).
    enum Chat {
        public static var placeholder: String {
            String(localized: "chat.placeholder", bundle: bundle)
        }

        public static var newChat: String {
            String(localized: "chat.newChat", bundle: bundle)
        }

        public static var history: String {
            String(localized: "chat.history", bundle: bundle)
        }

        public static var deleteChat: String {
            String(localized: "chat.deleteChat", bundle: bundle)
        }

        public static var deleteAll: String {
            String(localized: "chat.deleteAll", bundle: bundle)
        }

        public static var emptyState: String {
            String(localized: "chat.emptyState", bundle: bundle)
        }

        public static var emptyStateSubtitle: String {
            String(localized: "chat.emptyStateSubtitle", bundle: bundle)
        }

        public static var thinking: String {
            String(localized: "chat.thinking", bundle: bundle)
        }

        public static var copy: String {
            String(localized: "chat.copy", bundle: bundle)
        }

        public static var copied: String {
            String(localized: "chat.copied", bundle: bundle)
        }

        public static var retry: String {
            String(localized: "chat.retry", bundle: bundle)
        }

        /// Pluralised "N messages remaining" — driven by `stringsdict`.
        public static func messagesRemaining(_ count: Int) -> String {
            String(localized: "chat.messagesRemaining \(count)", bundle: bundle)
        }

        public static var today: String {
            String(localized: "chat.today", bundle: bundle)
        }

        public static var yesterday: String {
            String(localized: "chat.yesterday", bundle: bundle)
        }
    }
}
