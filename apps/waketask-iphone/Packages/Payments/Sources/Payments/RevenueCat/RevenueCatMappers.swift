import Core
import Foundation
import OSLog

/// Mapping utilities for RevenueCat types to domain types
enum RevenueCatMappers {
    /// Map RCCustomerInfo to PaymentsState
    static func mapToState(customerInfo: RCCustomerInfo, entitlementID: String) -> PaymentsState {
        let activeIDs = customerInfo.activeEntitlementIDs
        let isSubscribed = activeIDs.contains(entitlementID)
        let expiryDate = customerInfo.expirationDate(for: entitlementID)

        return PaymentsState(
            isSubscribed: isSubscribed,
            activeEntitlementIDs: activeIDs,
            expirationDate: expiryDate,
            productID: nil // Could extract from customerInfo if needed
        )
    }

    /// Map RCPackage to PaymentsOffering
    static func mapToOffering(_ package: RCPackage) -> PaymentsOffering {
        let packageType = parsePackageType(package.packageType)
        let title = packageType.displayName

        return PaymentsOffering(
            id: package.identifier,
            title: title,
            price: package.localizedPriceString,
            pricePerMonth: nil, // Could be calculated for annual
            packageType: packageType
        )
    }

    /// Parse package type from string
    private static func parsePackageType(_ type: String) -> PaymentsOffering.PackageType {
        let lowercased = type.lowercased()

        if lowercased.contains("month") {
            return .monthly
        } else if lowercased.contains("annual") || lowercased.contains("year") {
            return .annual
        } else if lowercased.contains("lifetime") {
            return .lifetime
        } else {
            return .unknown
        }
    }

    /// Map RevenueCat errors to PaymentsError
    static func mapError(_ error: Error) -> PaymentsError {
        // Check for cancellation
        if error is CancellationError {
            return .cancelled
        }

        let nsError = error as NSError

        // Check for common RevenueCat error codes
        // RevenueCat errors are in domain "RevenueCat.ErrorCode"
        if nsError.domain.contains("RevenueCat") {
            switch nsError.code {
            case 1: // purchaseCancelledError (sometimes code 1)
                return .cancelled
            case 6: // purchaseCancelledError
                return .cancelled
            case 7: // storeProblemError
                return .purchaseNotAllowed
            case 8: // receiptInvalidError / receiptAlreadyInUseError
                // Check the underlying backend error code for more specific message
                if let underlyingError = nsError.userInfo["NSUnderlyingError"] as? NSError,
                   underlyingError.code == 7103
                {
                    // INVALID_RECEIPT - usually means RevenueCat credentials issue
                    return .server(message: "Unable to verify purchase. Please try again or contact support.")
                }
                // Receipt already in use by another account
                return .server(message: "This Apple ID has a subscription linked to another account. Try using 'Restore Purchases' or contact support.")
            case 2: // networkError
                return .network(underlying: error)
            case 3: // invalidReceiptError
                return .server(message: "Unable to verify your purchase receipt. Please try again.")
            case 10: // productNotAvailableForPurchaseError
                return .purchaseNotAllowed
            case 11: // purchaseInvalidError
                return .server(message: "This purchase is invalid. Please try again.")
            case 21: // invalidAppleSubscriptionKeyError
                return .server(message: "There's an issue with the app's payment configuration. Please contact support.")
            default:
                AppLogger.error("Unknown RevenueCat error code: \(nsError.code) - \(nsError.localizedDescription)", category: AppLogger.payments)
                return .server(message: nsError.localizedDescription)
            }
        }

        // Check for StoreKit errors
        if nsError.domain == "SKErrorDomain" {
            switch nsError.code {
            case 0: // unknown
                return .unknown(underlying: error)
            case 1: // clientInvalid
                return .purchaseNotAllowed
            case 2: // paymentCancelled
                return .cancelled
            case 3: // paymentInvalid
                return .server(message: "Payment information is invalid.")
            case 4: // paymentNotAllowed
                return .purchaseNotAllowed
            case 5: // storeProductNotAvailable
                return .server(message: "This product is not available in your region.")
            default:
                return .unknown(underlying: error)
            }
        }

        // Check for network errors
        if nsError.domain == NSURLErrorDomain {
            return .network(underlying: error)
        }

        // Default to unknown
        return .unknown(underlying: error)
    }
}

// MARK: - AppLogger Extension

extension AppLogger {
    static let payments = Logger(
        subsystem: AppLogger.subsystem,
        category: "payments"
    )
}
