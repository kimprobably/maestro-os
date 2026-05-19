import Foundation

/// Minimal abstraction of RevenueCat Purchases SDK for testing
public protocol RCPurchases: Sendable {
    /// Configure RevenueCat with API key
    func configure(apiKey: String)
    
    /// Get customer info stream
    func customerInfoStream() -> AsyncStream<RCCustomerInfo>
    
    /// Purchase a product
    func purchase(productID: String) async throws -> RCCustomerInfo
    
    /// Restore purchases
    func restorePurchases() async throws -> RCCustomerInfo
    
    /// Get offerings (for paywall)
    func getOfferings() async throws -> RCOfferings?
}

/// Minimal abstraction of RevenueCat CustomerInfo
public protocol RCCustomerInfo: Sendable {
    /// Set of active entitlement IDs
    var activeEntitlementIDs: Set<String> { get }
    
    /// Get expiry date for a specific entitlement
    func expirationDate(for entitlementID: String) -> Date?
}

/// Minimal abstraction of RevenueCat Offerings
public protocol RCOfferings: Sendable {
    /// Available packages
    var availablePackages: [RCPackage] { get }
}

/// Minimal abstraction of RevenueCat Package
public protocol RCPackage: Sendable {
    /// Package identifier
    var identifier: String { get }
    
    /// Package type (monthly, annual, etc.)
    var packageType: String { get }
    
    /// Localized price string (e.g. "$9.99")
    var localizedPriceString: String { get }
    
    /// Localized introductory price (if available)
    var localizedIntroductoryPriceString: String? { get }
}

/// Environment holding RevenueCat dependencies
public struct RCEnvironment: Sendable {
    let purchases: RCPurchases
    
    public init(purchases: RCPurchases) {
        self.purchases = purchases
    }
}
