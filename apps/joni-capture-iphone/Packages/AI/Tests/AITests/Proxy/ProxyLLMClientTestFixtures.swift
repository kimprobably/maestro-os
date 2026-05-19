import XCTest
@testable import AI
import Networking

/// Shared base class for every `ProxyLLMClient` test file. Provides a fresh
/// `MockHTTPClient` and client per test plus a shared `baseURL`.
class ProxyLLMClientTestCase: XCTestCase {

    var mockHTTPClient: MockHTTPClient!
    var client: ProxyLLMClient!
    let baseURL = URL(string: "https://api.example.com")!

    override func setUp() {
        super.setUp()
        mockHTTPClient = MockHTTPClient()
        client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: mockHTTPClient,
            path: "/v1/chat/stream"
        )
    }

    override func tearDown() {
        client = nil
        mockHTTPClient = nil
        super.tearDown()
    }
}

/// In-memory `HTTPClient` double: records sent requests and replays a canned
/// response (or throws a canned error) to the caller.
final class MockHTTPClient: HTTPClient, @unchecked Sendable {
    var mockResponse: HTTPResponse?
    var shouldThrow = false
    var errorToThrow: Error = URLError(.unknown)
    var sentRequests: [HTTPRequest] = []

    func send(_ request: HTTPRequest) async throws -> HTTPResponse {
        sentRequests.append(request)

        if shouldThrow {
            throw errorToThrow
        }

        guard let response = mockResponse else {
            throw URLError(.badServerResponse)
        }

        return response
    }
}
