import Foundation
@testable import Payments

/// Fake RevenueCat Purchases implementation for testing
final class FakePurchases: RCPurchases, @unchecked Sendable {
    var isConfigured = false
    var configuredAPIKey: String?
    var activeEntitlements: Set<String> = []
    var shouldThrowOnPurchase = false
    var shouldThrowOnRestore = false
    var purchaseError: Error?
    var customerInfoContinuation: AsyncStream<RCCustomerInfo>.Continuation?
    
    func configure(apiKey: String) {
        isConfigured = true
        configuredAPIKey = apiKey
    }
    
    func customerInfoStream() -> AsyncStream<RCCustomerInfo> {
        AsyncStream { continuation in
            self.customerInfoContinuation = continuation
            
            // Emit initial state
            let initialInfo = FakeCustomerInfo(activeEntitlementIDs: activeEntitlements)
            continuation.yield(initialInfo)
        }
    }
    
    func purchase(productID: String) async throws -> RCCustomerInfo {
        if shouldThrowOnPurchase {
            if let error = purchaseError {
                throw error
            }
            throw NSError(domain: "RevenueCat.ErrorCode", code: 6) // cancelled
        }
        
        // Simulate successful purchase by adding entitlement
        activeEntitlements.insert(productID)
        
        let customerInfo = FakeCustomerInfo(activeEntitlementIDs: activeEntitlements)
        
        // Emit update via stream
        customerInfoContinuation?.yield(customerInfo)
        
        return customerInfo
    }
    
    func restorePurchases() async throws -> RCCustomerInfo {
        if shouldThrowOnRestore {
            throw NSError(domain: "RevenueCat.ErrorCode", code: 2) // network error
        }
        
        let customerInfo = FakeCustomerInfo(activeEntitlementIDs: activeEntitlements)
        
        // Emit update via stream
        customerInfoContinuation?.yield(customerInfo)
        
        return customerInfo
    }
    
    func getOfferings() async throws -> RCOfferings? {
        return FakeOfferings(availablePackages: [
            FakePackage(identifier: "monthly"),
            FakePackage(identifier: "annual")
        ])
    }
    
    func reset() {
        isConfigured = false
        configuredAPIKey = nil
        activeEntitlements.removeAll()
        shouldThrowOnPurchase = false
        shouldThrowOnRestore = false
        purchaseError = nil
    }
}

/// Fake CustomerInfo
struct FakeCustomerInfo: RCCustomerInfo {
    let activeEntitlementIDs: Set<String>
    var entitlementExpiryDates: [String: Date] = [:]
    
    func expirationDate(for entitlementID: String) -> Date? {
        return entitlementExpiryDates[entitlementID]
    }
}

/// Fake Offerings
struct FakeOfferings: RCOfferings {
    let availablePackages: [RCPackage]
}

/// Fake Package
struct FakePackage: RCPackage {
    let identifier: String
    var packageType: String { identifier }
    var localizedPriceString: String { "$9.99" }
    var localizedIntroductoryPriceString: String? { nil }
}
