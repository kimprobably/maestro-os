import Foundation

/// Represents a subscription product offering
public struct PaymentsOffering: Sendable, Identifiable, Equatable {
    public let id: String
    public let title: String
    public let price: String
    public let pricePerMonth: String?
    public let packageType: PackageType

    public init(
        id: String,
        title: String,
        price: String,
        pricePerMonth: String? = nil,
        packageType: PackageType
    ) {
        self.id = id
        self.title = title
        self.price = price
        self.pricePerMonth = pricePerMonth
        self.packageType = packageType
    }

    /// Package type for common subscription periods
    public enum PackageType: String, Sendable, Equatable {
        case monthly
        case annual
        case lifetime
        case unknown

        public var displayName: String {
            switch self {
            case .monthly: "Monthly"
            case .annual: "Annual"
            case .lifetime: "Lifetime"
            case .unknown: "Subscription"
            }
        }
    }
}
