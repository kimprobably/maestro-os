#if DEBUG
    import Foundation
    import Payments

    /// Deterministic payments client for DEBUG builds and hosted CI.
    final class DebugPaymentsClient: PaymentsClient, @unchecked Sendable {
        private let lock = NSLock()
        private var configuredEntitlementID = "premium"
        private var state = PaymentsState.free

        func configure(_ config: PaymentsConfig) {
            lock.lock()
            configuredEntitlementID = config.entitlementID
            state = PaymentsState.free
            lock.unlock()
        }

        func states() -> AsyncStream<PaymentsState> {
            let snapshot = currentStateSnapshot()
            return AsyncStream { continuation in
                continuation.yield(snapshot)
                continuation.finish()
            }
        }

        func currentState() async -> PaymentsState {
            currentStateSnapshot()
        }

        func purchase(productID: String) async throws {
            lock.lock()
            state = PaymentsState(
                isSubscribed: true,
                activeEntitlementIDs: [configuredEntitlementID],
                productID: productID
            )
            lock.unlock()
        }

        @discardableResult
        func restore() async throws -> PaymentsState {
            currentStateSnapshot()
        }

        func prefetchOfferings() async {}

        func getOfferings() async throws -> [PaymentsOffering] {
            [
                PaymentsOffering(
                    id: "$rc_monthly",
                    title: "Monthly",
                    price: "$9.99",
                    pricePerMonth: "$9.99/month",
                    packageType: .monthly
                ),
                PaymentsOffering(
                    id: "$rc_annual",
                    title: "Annual",
                    price: "$99.99",
                    pricePerMonth: "$8.33/month",
                    packageType: .annual
                ),
            ]
        }

        private func currentStateSnapshot() -> PaymentsState {
            lock.lock()
            defer { lock.unlock() }
            return state
        }
    }
#endif
