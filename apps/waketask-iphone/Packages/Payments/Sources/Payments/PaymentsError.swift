import Foundation

/// Payments-specific error cases
public enum PaymentsError: Error, Sendable, Equatable {
    /// Purchase was cancelled by user
    case cancelled

    /// Payments system is not configured
    case notConfigured

    /// User is not allowed to make purchases
    case purchaseNotAllowed

    /// Network error occurred
    case network(underlying: Error)

    /// Server or RevenueCat error
    case server(message: String?)

    /// Unknown error occurred
    case unknown(underlying: Error)

    public static func == (lhs: PaymentsError, rhs: PaymentsError) -> Bool {
        switch (lhs, rhs) {
        case (.cancelled, .cancelled):
            true
        case (.notConfigured, .notConfigured):
            true
        case (.purchaseNotAllowed, .purchaseNotAllowed):
            true
        case let (.network(lErr), .network(rErr)):
            (lErr as NSError) == (rErr as NSError)
        case let (.server(lMsg), .server(rMsg)):
            lMsg == rMsg
        case let (.unknown(lErr), .unknown(rErr)):
            (lErr as NSError) == (rErr as NSError)
        default:
            false
        }
    }
}
