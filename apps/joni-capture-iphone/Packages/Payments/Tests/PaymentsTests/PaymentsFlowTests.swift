import XCTest
@testable import Payments

final class PaymentsFlowTests: XCTestCase {
    
    private var client: RevenueCatClient!
    private var fakePurchases: FakePurchases!
    private var config: PaymentsConfig!
    
    override func setUp() {
        super.setUp()
        
        fakePurchases = FakePurchases()
        let environment = RCEnvironment(purchases: fakePurchases)
        client = RevenueCatClient(environment: environment)
        
        config = PaymentsConfig(
            apiKey: "test_api_key",
            entitlementID: "premium"
        )
    }
    
    override func tearDown() {
        fakePurchases.reset()
        client = nil
        super.tearDown()
    }
    
    func testEndToEndPurchaseFlow() async throws {
        // Given
        client.configure(config)
        
        // Verify initially not subscribed
        var initialState = await client.currentState()
        XCTAssertFalse(initialState.isSubscribed)
        
        // When - Purchase
        try await client.purchase(productID: "premium")
        
        // Then - Should be subscribed immediately (no delay needed)
        let afterPurchase = await client.currentState()
        XCTAssertTrue(afterPurchase.isSubscribed)
    }
    
    func testRestoreFlow() async throws {
        // Given
        client.configure(config)
        fakePurchases.activeEntitlements = ["premium"]
        
        // When
        try await client.restore()
        
        // Then - Immediate update
        let state = await client.currentState()
        XCTAssertTrue(state.isSubscribed)
    }
    
    func testNetworkErrorMapping() async throws {
        // Given
        client.configure(config)
        fakePurchases.shouldThrowOnPurchase = true
        fakePurchases.purchaseError = NSError(domain: "RevenueCat.ErrorCode", code: 2)
        
        // When/Then
        do {
            try await client.purchase(productID: "premium")
            XCTFail("Should have thrown")
        } catch let error as PaymentsError {
            if case .network = error {
                // Correct
            } else {
                XCTFail("Wrong error type: \(error)")
            }
        }
    }
    
    func testServerErrorMapping() async throws {
        // Given
        client.configure(config)
        fakePurchases.shouldThrowOnPurchase = true
        fakePurchases.purchaseError = NSError(domain: "RevenueCat.ErrorCode", code: 10, userInfo: [
            NSLocalizedDescriptionKey: "Server error"
        ])
        
        // When/Then
        do {
            try await client.purchase(productID: "premium")
            XCTFail("Should have thrown")
        } catch let error as PaymentsError {
            if case let .server(message) = error {
                XCTAssertEqual(message, "Server error")
            } else {
                XCTFail("Wrong error type: \(error)")
            }
        }
    }
    
    func testPurchaseNotAllowedMapping() async throws {
        // Given
        client.configure(config)
        fakePurchases.shouldThrowOnPurchase = true
        fakePurchases.purchaseError = NSError(domain: "RevenueCat.ErrorCode", code: 8)
        
        // When/Then
        do {
            try await client.purchase(productID: "premium")
            XCTFail("Should have thrown")
        } catch let error as PaymentsError {
            XCTAssertEqual(error, .purchaseNotAllowed)
        }
    }
    
    func testAppErrorMapping() {
        // Test each PaymentsError maps to AppError correctly
        let errors: [(PaymentsError, String)] = [
            (.cancelled, "cancelled"),
            (.notConfigured, "payments"),
            (.purchaseNotAllowed, "payments"),
            (.network(underlying: URLError(.notConnectedToInternet)), "network"),
            (.server(message: "Test"), "payments"),
            (.unknown(underlying: NSError(domain: "Test", code: 1)), "unknown")
        ]
        
        for (paymentsError, expectedType) in errors {
            let appError = paymentsError.asAppError()
            
            switch expectedType {
            case "cancelled":
                if case .cancelled = appError { } else {
                    XCTFail("Expected cancelled for \(paymentsError)")
                }
            case "payments":
                if case .payments = appError { } else {
                    XCTFail("Expected payments for \(paymentsError)")
                }
            case "network":
                if case .network = appError { } else {
                    XCTFail("Expected network for \(paymentsError)")
                }
            case "unknown":
                if case .unknown = appError { } else {
                    XCTFail("Expected unknown for \(paymentsError)")
                }
            default:
                XCTFail("Unknown expected type: \(expectedType)")
            }
        }
    }
}
