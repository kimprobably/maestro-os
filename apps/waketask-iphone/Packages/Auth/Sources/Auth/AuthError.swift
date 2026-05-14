import Foundation

/// Authentication-specific error cases
public enum AuthError: Error, Sendable, Equatable {
    /// Operation was cancelled
    case cancelled

    /// Auth service is not configured
    case notConfigured

    /// Invalid credentials provided
    case invalidCredentials

    /// Email confirmation required before sign in
    case emailConfirmationRequired

    /// Network error occurred
    case network(underlying: Error)

    /// Server returned an error
    case server(code: Int, message: String?)

    /// Failed to parse response
    case parsing

    /// Unknown error occurred
    case unknown(underlying: Error)

    public static func == (lhs: AuthError, rhs: AuthError) -> Bool {
        switch (lhs, rhs) {
        case (.cancelled, .cancelled):
            true
        case (.notConfigured, .notConfigured):
            true
        case (.invalidCredentials, .invalidCredentials):
            true
        case (.emailConfirmationRequired, .emailConfirmationRequired):
            true
        case let (.network(lErr), .network(rErr)):
            (lErr as NSError) == (rErr as NSError)
        case let (.server(lCode, lMsg), .server(rCode, rMsg)):
            lCode == rCode && lMsg == rMsg
        case (.parsing, .parsing):
            true
        case let (.unknown(lErr), .unknown(rErr)):
            (lErr as NSError) == (rErr as NSError)
        default:
            false
        }
    }
}
