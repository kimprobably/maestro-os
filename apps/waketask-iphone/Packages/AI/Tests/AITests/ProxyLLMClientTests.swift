import XCTest
@testable import AI

/// Initialization smoke tests for `ProxyLLMClient`. Request/stream/error
/// coverage lives in sibling `Proxy/` files.
final class ProxyLLMClientTests: ProxyLLMClientTestCase {

    func testInit_withDefaultPath() {
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: mockHTTPClient
        )

        XCTAssertNotNil(client)
    }

    func testInit_withCustomPath() {
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: mockHTTPClient,
            path: "/custom/endpoint"
        )

        XCTAssertNotNil(client)
    }

    func testInit_withDefaultHeaders() {
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: mockHTTPClient,
            defaultHeaders: ["X-API-Key": "test-key"]
        )

        XCTAssertNotNil(client)
    }
}
