import Foundation

/// Main payments client protocol
public protocol PaymentsClient: Sendable {
    /// Configure the payments system. Call once at app start. Idempotent.
    func configure(_ config: PaymentsConfig)

    /// Stream of subscription state changes
    func states() -> AsyncStream<PaymentsState>

    /// Get current subscription state immediately (cached)
    func currentState() async -> PaymentsState

    /// Purchase a product by ID
    func purchase(productID: String) async throws

    /// Restore previous purchases
    /// Returns the resulting PaymentsState after restore completes
    @discardableResult
    func restore() async throws -> PaymentsState

    /// Prefetch offerings for paywall (optional optimization)
    func prefetchOfferings() async

    /// Get available product offerings with pricing
    func getOfferings() async throws -> [PaymentsOffering]
}
