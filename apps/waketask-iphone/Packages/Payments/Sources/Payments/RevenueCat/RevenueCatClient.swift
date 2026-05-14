import Core
import Foundation

/// RevenueCat-based payments client implementation
public final class RevenueCatClient: PaymentsClient, @unchecked Sendable {
    private let environment: RCEnvironment
    private let lock = NSLock()

    private var config: PaymentsConfig?
    private var currentPaymentsState: PaymentsState
    private var stateContinuations: [UUID: AsyncStream<PaymentsState>.Continuation] = [:]
    private var customerInfoTask: Task<Void, Never>?

    /// Create a RevenueCat client with optional environment override for testing
    public init(environment: RCEnvironment? = nil) {
        self.environment = environment ?? Self.liveEnvironment()
        currentPaymentsState = PaymentsState(isSubscribed: false)
    }

    deinit {
        customerInfoTask?.cancel()
        lock.withLock {
            stateContinuations.values.forEach { $0.finish() }
            stateContinuations.removeAll()
        }
    }

    // MARK: - PaymentsClient

    public func configure(_ config: PaymentsConfig) {
        lock.lock()

        // Idempotent: skip if already configured with same config
        if let existingConfig = self.config, existingConfig == config {
            lock.unlock()
            AppLogger.debug("Payments already configured", category: AppLogger.payments)
            return
        }

        self.config = config
        lock.unlock()

        let maskedKey = maskIdentifier(config.apiKey)
        AppLogger.info("Configuring RevenueCat with key: \(maskedKey)", category: AppLogger.payments)

        // Configure RevenueCat SDK
        environment.purchases.configure(apiKey: config.apiKey)

        // Start listening to customer info updates
        startCustomerInfoListener(entitlementID: config.entitlementID)
    }

    public func states() -> AsyncStream<PaymentsState> {
        AsyncStream { continuation in
            let id = UUID()

            lock.withLock {
                stateContinuations[id] = continuation
                // Replay current state immediately
                continuation.yield(currentPaymentsState)
            }

            continuation.onTermination = { [weak self] _ in
                _ = self?.lock.withLock {
                    self?.stateContinuations.removeValue(forKey: id)
                }
            }
        }
    }

    public func currentState() async -> PaymentsState {
        lock.withLock {
            currentPaymentsState
        }
    }

    public func purchase(productID: String) async throws {
        guard let config else {
            throw PaymentsError.notConfigured
        }

        let maskedID = maskIdentifier(productID)
        AppLogger.info("Purchasing product: \(maskedID)", category: AppLogger.payments)

        do {
            let customerInfo = try await environment.purchases.purchase(productID: productID)
            AppLogger.info("Purchase successful", category: AppLogger.payments)

            // Update state immediately and emit to all subscribers
            let newState = RevenueCatMappers.mapToState(
                customerInfo: customerInfo,
                entitlementID: config.entitlementID
            )
            emitState(newState)
        } catch is CancellationError {
            throw PaymentsError.cancelled
        } catch {
            let paymentsError = RevenueCatMappers.mapError(error)
            AppLogger.error("Purchase failed: \(paymentsError)", category: AppLogger.payments)
            throw paymentsError
        }
    }

    @discardableResult
    public func restore() async throws -> PaymentsState {
        guard let config else {
            throw PaymentsError.notConfigured
        }

        AppLogger.info("Restoring purchases", category: AppLogger.payments)

        do {
            let customerInfo = try await environment.purchases.restorePurchases()
            AppLogger.info("Restore successful", category: AppLogger.payments)

            // Map to state and emit to subscribers
            let newState = RevenueCatMappers.mapToState(
                customerInfo: customerInfo,
                entitlementID: config.entitlementID
            )
            emitState(newState)

            // Return the new state so callers don't have race conditions
            return newState
        } catch is CancellationError {
            throw PaymentsError.cancelled
        } catch {
            let paymentsError = RevenueCatMappers.mapError(error)
            AppLogger.error("Restore failed: \(paymentsError)", category: AppLogger.payments)
            throw paymentsError
        }
    }

    public func prefetchOfferings() async {
        do {
            let offerings = try await environment.purchases.getOfferings()
            let count = offerings?.availablePackages.count ?? 0
            AppLogger.debug("Prefetched \(count) offering packages", category: AppLogger.payments)
        } catch {
            AppLogger.debug("Failed to prefetch offerings: \(error)", category: AppLogger.payments)
        }
    }

    public func getOfferings() async throws -> [PaymentsOffering] {
        guard config != nil else {
            throw PaymentsError.notConfigured
        }

        AppLogger.debug("Fetching product offerings", category: AppLogger.payments)

        do {
            guard let offerings = try await environment.purchases.getOfferings() else {
                AppLogger.debug("No offerings available", category: AppLogger.payments)
                return []
            }

            let packages = offerings.availablePackages
            let mapped = packages.map { RevenueCatMappers.mapToOffering($0) }

            AppLogger.debug("Fetched \(mapped.count) offerings", category: AppLogger.payments)
            return mapped
        } catch {
            let paymentsError = RevenueCatMappers.mapError(error)
            AppLogger.error("Failed to fetch offerings: \(paymentsError)", category: AppLogger.payments)
            throw paymentsError
        }
    }

    // MARK: - Private Helpers

    private func startCustomerInfoListener(entitlementID: String) {
        customerInfoTask?.cancel()

        customerInfoTask = Task {
            let stream = environment.purchases.customerInfoStream()

            for await customerInfo in stream {
                guard !Task.isCancelled else { break }
                updateState(from: customerInfo, entitlementID: entitlementID)
            }
        }
    }

    private func updateState(from customerInfo: RCCustomerInfo, entitlementID: String) {
        let newState = RevenueCatMappers.mapToState(
            customerInfo: customerInfo,
            entitlementID: entitlementID
        )

        emitState(newState)
    }

    private func emitState(_ newState: PaymentsState) {
        lock.withLock {
            guard newState != currentPaymentsState else { return }

            currentPaymentsState = newState

            AppLogger.info("Subscription state updated: subscribed=\(newState.isSubscribed)", category: AppLogger.payments)

            // Emit to all subscribers
            for continuation in stateContinuations.values {
                continuation.yield(newState)
            }
        }
    }

    /// Mask sensitive identifiers for logging
    private func maskIdentifier(_ id: String) -> String {
        guard id.count > 4 else { return "***" }
        let prefix = id.prefix(2)
        let suffix = id.suffix(2)
        return "\(prefix)***\(suffix)"
    }

    // MARK: - Live Environment

    @available(iOS 17.0, *)
    private static func liveEnvironment() -> RCEnvironment {
        let liveAdapter = LiveRevenueCatAdapter()
        return RCEnvironment(purchases: liveAdapter)
    }
}
