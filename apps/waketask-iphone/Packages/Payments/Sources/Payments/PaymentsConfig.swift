import Foundation

/// Configuration for payments and subscriptions
public struct PaymentsConfig: Sendable, Equatable {
    /// RevenueCat public SDK key
    public let apiKey: String

    /// Single entitlement ID for premium features
    public let entitlementID: String

    public init(apiKey: String, entitlementID: String) {
        self.apiKey = apiKey
        self.entitlementID = entitlementID
    }
}
