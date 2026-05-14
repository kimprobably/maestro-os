import Foundation

/// Represents the current payments/subscription state
public struct PaymentsState: Sendable, Equatable {
    /// Whether the user has an active subscription
    public let isSubscribed: Bool
    
    /// Set of active entitlement IDs
    public let activeEntitlementIDs: Set<String>
    
    /// Subscription expiry date (if available)
    public let expirationDate: Date?
    
    /// Product identifier (e.g., "monthly", "annual")
    public let productID: String?
    
    public init(
        isSubscribed: Bool,
        activeEntitlementIDs: Set<String> = [],
        expirationDate: Date? = nil,
        productID: String? = nil
    ) {
        self.isSubscribed = isSubscribed
        self.activeEntitlementIDs = activeEntitlementIDs
        self.expirationDate = expirationDate
        self.productID = productID
    }
    
    /// Convenience initializer for free state
    public static let free = PaymentsState(isSubscribed: false)
}
