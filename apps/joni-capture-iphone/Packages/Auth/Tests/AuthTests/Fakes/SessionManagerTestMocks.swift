import Foundation
@testable import Auth
import Networking
import Core

/// In-memory `HTTPClient` double shared by all SessionManager test files.
/// Captures every request and replays a canned response/error.
final class MockHTTPClient: HTTPClient, @unchecked Sendable {
    var requests: [HTTPRequest] = []
    var mockResponseData: Data = Data()
    var mockStatusCode: Int = 200
    var shouldThrow = false
    var errorToThrow: Error = NSError(domain: "test", code: -1)

    func send(_ request: HTTPRequest) async throws -> HTTPResponse {
        requests.append(request)

        if shouldThrow {
            throw errorToThrow
        }

        return HTTPResponse(
            statusCode: mockStatusCode,
            headers: [:],
            data: mockResponseData,
            requestID: nil
        )
    }
}

/// Records whether `requestIDToken` was called and returns a canned token
/// pair — or throws a canned error — for SessionManager's Apple Sign In path.
final class MockAppleProvider: AppleSignInProvider, @unchecked Sendable {
    var requestIDTokenCalled = false
    var mockIDToken: String?
    var mockNonce: String?
    var shouldThrow = false
    var errorToThrow: Error = NSError(domain: "test", code: -1)

    func requestIDToken(originalNonce: String, hashedNonce: String) async throws -> (idToken: String, nonce: String) {
        requestIDTokenCalled = true

        if shouldThrow {
            throw errorToThrow
        }

        guard let token = mockIDToken, let nonce = mockNonce else {
            throw NSError(
                domain: "MockAppleProvider",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "No mock ID token set"]
            )
        }

        return (token, nonce)
    }
}

/// No-op `Sleeper` so refresh retry paths don't actually delay tests.
final class MockSleeper: Sleeper, @unchecked Sendable {
    func sleep(for seconds: TimeInterval) async throws {}
}
