import Core
import Foundation
import RevenueCat

/// Live adapter wrapping the real RevenueCat Purchases SDK
@available(iOS 17.0, *)
final class LiveRevenueCatAdapter: RCPurchases, @unchecked Sendable {
    init() {
        // Don't access Purchases.shared yet - wait for configure()
    }

    func configure(apiKey: String) {
        Purchases.configure(withAPIKey: apiKey)
        AppLogger.info("RevenueCat SDK configured", category: AppLogger.payments)
    }

    /// Access to configured Purchases instance
    private var purchases: Purchases {
        Purchases.shared
    }

    func customerInfoStream() -> AsyncStream<RCCustomerInfo> {
        AsyncStream { continuation in
            // Set up the customer info update handler
            purchases.getCustomerInfo { customerInfo, error in
                if let error {
                    AppLogger.error("Failed to get initial customer info: \(error)", category: AppLogger.payments)
                    return
                }

                if let customerInfo {
                    continuation.yield(LiveCustomerInfoAdapter(customerInfo: customerInfo))
                }
            }

            // Listen for updates
            // RevenueCat doesn't have a built-in stream, but we can poll or use delegate
            // For MVP, we'll just emit once and rely on purchase/restore to update
            // In production, you might use NotificationCenter or delegate pattern
        }
    }

    func purchase(productID: String) async throws -> RCCustomerInfo {
        AppLogger.info("Starting purchase for productID: \(productID)", category: AppLogger.payments)

        return try await withCheckedThrowingContinuation { continuation in
            purchases.getOfferings { offerings, error in
                if let error {
                    AppLogger.error("Failed to get offerings for purchase: \(error)", category: AppLogger.payments)
                    continuation.resume(throwing: error)
                    return
                }

                guard let offerings else {
                    let error = NSError(domain: "Payments", code: 404, userInfo: [
                        NSLocalizedDescriptionKey: "No offerings available",
                    ])
                    AppLogger.error("No offerings returned", category: AppLogger.payments)
                    continuation.resume(throwing: error)
                    return
                }

                // Log all available packages for debugging
                let allPackages = offerings.all.values.flatMap(\.availablePackages)
                let packageIdentifiers = allPackages.map { "\($0.identifier) (\($0.packageType))" }.joined(separator: ", ")
                AppLogger.debug("Available packages: \(packageIdentifiers)", category: AppLogger.payments)

                // Find the package by identifier
                guard let package = allPackages.first(where: { $0.identifier == productID }) else {
                    let availableIDs = allPackages.map(\.identifier).joined(separator: ", ")
                    let error = NSError(domain: "Payments", code: 404, userInfo: [
                        NSLocalizedDescriptionKey: "Product not found: \(productID). Available: \(availableIDs)",
                    ])
                    AppLogger.error("Product not found: \(productID). Available packages: \(availableIDs)", category: AppLogger.payments)
                    continuation.resume(throwing: error)
                    return
                }

                AppLogger.info("Found package: \(package.identifier), starting StoreKit purchase", category: AppLogger.payments)

                self.purchases.purchase(package: package) { _, customerInfo, error, cancelled in
                    if cancelled {
                        AppLogger.info("Purchase cancelled by user", category: AppLogger.payments)
                        let cancelError = NSError(domain: "RevenueCat.ErrorCode", code: 1, userInfo: [
                            NSLocalizedDescriptionKey: "Purchase was cancelled",
                        ])
                        continuation.resume(throwing: cancelError)
                        return
                    }

                    if let error {
                        let nsError = error as NSError
                        AppLogger.error("StoreKit purchase error: code=\(nsError.code), domain=\(nsError.domain), desc=\(nsError.localizedDescription)", category: AppLogger.payments)
                        continuation.resume(throwing: error)
                        return
                    }

                    if let customerInfo {
                        let activeEntitlements = customerInfo.entitlements.active.keys.joined(separator: ", ")
                        AppLogger.info("Purchase completed successfully. Active entitlements: \(activeEntitlements)", category: AppLogger.payments)
                        continuation.resume(returning: LiveCustomerInfoAdapter(customerInfo: customerInfo))
                    } else {
                        let unknownError = NSError(domain: "Payments", code: -1, userInfo: [
                            NSLocalizedDescriptionKey: "Purchase completed but no customer info returned",
                        ])
                        AppLogger.error("No customer info after purchase", category: AppLogger.payments)
                        continuation.resume(throwing: unknownError)
                    }
                }
            }
        }
    }

    func restorePurchases() async throws -> RCCustomerInfo {
        try await withCheckedThrowingContinuation { continuation in
            purchases.restorePurchases { customerInfo, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                if let customerInfo {
                    continuation.resume(returning: LiveCustomerInfoAdapter(customerInfo: customerInfo))
                } else {
                    let unknownError = NSError(domain: "Payments", code: -1)
                    continuation.resume(throwing: unknownError)
                }
            }
        }
    }

    func getOfferings() async throws -> RCOfferings? {
        try await withCheckedThrowingContinuation { continuation in
            purchases.getOfferings { offerings, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                if let offerings {
                    continuation.resume(returning: LiveOfferingsAdapter(offerings: offerings))
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
}

// MARK: - Live Adapters

/// Adapter for RevenueCat CustomerInfo
@available(iOS 17.0, *)
struct LiveCustomerInfoAdapter: RCCustomerInfo {
    private let customerInfo: CustomerInfo

    init(customerInfo: CustomerInfo) {
        self.customerInfo = customerInfo
    }

    var activeEntitlementIDs: Set<String> {
        Set(customerInfo.entitlements.active.keys)
    }

    func expirationDate(for entitlementID: String) -> Date? {
        customerInfo.entitlements.active[entitlementID]?.expirationDate
    }
}

/// Adapter for RevenueCat Offerings
@available(iOS 17.0, *)
struct LiveOfferingsAdapter: RCOfferings {
    private let offerings: Offerings

    init(offerings: Offerings) {
        self.offerings = offerings
    }

    var availablePackages: [RCPackage] {
        offerings.all.values.flatMap { offering in
            offering.availablePackages.map { LivePackageAdapter(package: $0) }
        }
    }
}

/// Adapter for RevenueCat Package
@available(iOS 17.0, *)
struct LivePackageAdapter: RCPackage {
    private let package: Package

    init(package: Package) {
        self.package = package
    }

    var identifier: String {
        package.identifier
    }

    var packageType: String {
        // Map RevenueCat PackageType to string
        switch package.packageType {
        case .monthly: return "monthly"
        case .annual: return "annual"
        case .lifetime: return "lifetime"
        case .sixMonth: return "sixMonth"
        case .threeMonth: return "threeMonth"
        case .twoMonth: return "twoMonth"
        case .weekly: return "weekly"
        case .custom: return "custom"
        case .unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    var localizedPriceString: String {
        package.storeProduct.localizedPriceString
    }

    var localizedIntroductoryPriceString: String? {
        package.storeProduct.introductoryDiscount?.localizedPriceString
    }
}
