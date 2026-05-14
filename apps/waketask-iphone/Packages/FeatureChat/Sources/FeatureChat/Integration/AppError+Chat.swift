import Core
import Foundation

/// Chat-specific error message helpers
public extension AppError {
    /// User-friendly message for chat context
    var chatUserMessage: String {
        switch self {
        case .network:
            "Unable to send message. Check your connection and try again."
        case .cancelled:
            "Message sending was cancelled."
        case .rateLimited:
            "Too many requests. Please wait a moment and try again."
        default:
            userMessage
        }
    }
}
