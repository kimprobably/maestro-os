@testable import Core
import OSLog
import XCTest

final class AppLoggerTests: XCTestCase {
    // MARK: - Smoke Tests

    func testLogging_DoesNotCrash() {
        // Test that logging methods don't crash and compile correctly
        XCTAssertNoThrow(AppLogger.debug("Debug message"))
        XCTAssertNoThrow(AppLogger.info("Info message"))
        XCTAssertNoThrow(AppLogger.error("Error message"))
    }

    func testLogging_WithCategory() {
        // Test logging with specific categories
        XCTAssertNoThrow(AppLogger.debug("Network debug", category: AppLogger.networking))
        XCTAssertNoThrow(AppLogger.info("AI info", category: AppLogger.ai))
        XCTAssertNoThrow(AppLogger.error("UI error", category: AppLogger.ui))
    }

    func testLoggerCategories_AreConfigured() {
        // Test that logger categories are properly configured
        XCTAssertNotNil(AppLogger.networking)
        XCTAssertNotNil(AppLogger.ai)
        XCTAssertNotNil(AppLogger.ui)
    }

    // MARK: - Redaction Tests

    func testRedacted_APIKeys() {
        let apiKey = RedactionFixtures.apiKey("sk")
        let redacted = AppLogger.redacted("API Key: \(apiKey)")

        XCTAssertEqual(redacted, "API Key: •••")
        XCTAssertFalse(redacted.contains(apiKey))
    }

    func testRedacted_PublicKeys() {
        let publicKey = RedactionFixtures.apiKey("pk")
        let redacted = AppLogger.redacted("Public Key: \(publicKey)")

        XCTAssertEqual(redacted, "Public Key: •••")
        XCTAssertFalse(redacted.contains(publicKey))
    }

    func testRedacted_BearerTokens() {
        let token = RedactionFixtures.bearerToken()
        let redacted = AppLogger.redacted("Authorization: \(token)")

        XCTAssertEqual(redacted, "Authorization: •••")
        XCTAssertFalse(redacted.contains("Bearer"))
        XCTAssertFalse(redacted.contains(RedactionFixtures.bearerPayload()))
    }

    func testRedacted_JWTTokens() {
        let jwt = RedactionFixtures.jwt()
        let redacted = AppLogger.redacted("Token: \(jwt)")

        XCTAssertEqual(redacted, "Token: •••")
        XCTAssertFalse(redacted.contains(RedactionFixtures.jwtHeader()))
    }

    func testRedacted_LongBase64Strings() {
        let longBase64 = RedactionFixtures.longBase64()
        let redacted = AppLogger.redacted("Data: \(longBase64)")

        XCTAssertEqual(redacted, "Data: •••")
        XCTAssertFalse(redacted.contains(longBase64))
    }

    func testRedacted_MultipleSecrets() {
        let secretKey = RedactionFixtures.shortApiKey("sk")
        let bearer = "Bearer " + "abc123def456"
        let publicKey = RedactionFixtures.shortApiKey("pk")
        let input = "API: \(secretKey) Token: \(bearer) Key: \(publicKey)"
        let redacted = AppLogger.redacted(input)

        XCTAssertEqual(redacted, "API: ••• Token: ••• Key: •••")
        XCTAssertFalse(redacted.contains(secretKey))
        XCTAssertFalse(redacted.contains(bearer))
        XCTAssertFalse(redacted.contains(publicKey))
    }

    func testRedacted_SafeStrings() {
        let safeString = "This is a safe string with no secrets"
        let redacted = AppLogger.redacted(safeString)

        XCTAssertEqual(redacted, safeString)
    }

    func testRedacted_ShortStrings() {
        // Short strings that might look like secrets but aren't long enough
        let shortString = "sk-123" // Too short to be a real API key
        let redacted = AppLogger.redacted(shortString)

        // Should still be redacted if it matches the pattern
        XCTAssertEqual(redacted, "•••")
    }

    func testRedacted_EmptyString() {
        let empty = ""
        let redacted = AppLogger.redacted(empty)

        XCTAssertEqual(redacted, "")
    }

    // MARK: - RedactedData Tests

    func testRedactedData_CustomStringConvertible() {
        struct TestData: CustomStringConvertible {
            var description: String {
                "API Key: \(RedactionFixtures.apiKey("sk"))"
            }
        }

        let data = TestData()
        let redacted = AppLogger.redactedData(data)

        XCTAssertEqual(redacted, "API Key: •••")
    }

    // MARK: - Query Parameter Redaction Tests

    func testRedacted_APIKeyQueryParam() {
        let secretKey = RedactionFixtures.apiKey("sk")
        let publicKey = RedactionFixtures.apiKey("pk")
        let url1 = "https://api.example.com/data?api_key=\(secretKey)&other=value"
        let url2 = "https://api.example.com/data?other=value&api_key=\(publicKey)"

        let redacted1 = AppLogger.redacted(url1)
        let redacted2 = AppLogger.redacted(url2)

        XCTAssertTrue(redacted1.contains("api_key=•••"))
        XCTAssertTrue(redacted2.contains("api_key=•••"))
        XCTAssertFalse(redacted1.contains(secretKey))
        XCTAssertFalse(redacted2.contains(publicKey))
    }

    func testRedacted_AuthorizationQueryParam() {
        let url = "https://api.example.com/data?Authorization=Bearer_token123&other=value"
        let redacted = AppLogger.redacted(url)

        // The entire "Authorization=Bearer_token123" is replaced with "•••"
        XCTAssertTrue(redacted.contains("•••"))
        XCTAssertFalse(redacted.contains("Bearer_token123"))
    }

    // MARK: - Case-Insensitive Tests

    func testRedacted_CaseInsensitiveBearerToken() {
        let payload = RedactionFixtures.bearerPayload()
        let token1 = "bearer " + payload
        let token2 = "BEARER " + payload
        let token3 = "Bearer " + payload

        let redacted1 = AppLogger.redacted("Authorization: \(token1)")
        let redacted2 = AppLogger.redacted("Authorization: \(token2)")
        let redacted3 = AppLogger.redacted("Authorization: \(token3)")

        XCTAssertEqual(redacted1, "Authorization: •••")
        XCTAssertEqual(redacted2, "Authorization: •••")
        XCTAssertEqual(redacted3, "Authorization: •••")
    }

    func testRedacted_CaseInsensitiveAuthorizationHeader() {
        let header1 = "authorization: bearer_token123"
        let header2 = "AUTHORIZATION: bearer_token123"
        let header3 = "Authorization: bearer_token123"

        let redacted1 = AppLogger.redacted(header1)
        let redacted2 = AppLogger.redacted(header2)
        let redacted3 = AppLogger.redacted(header3)

        XCTAssertEqual(redacted1, "•••")
        XCTAssertEqual(redacted2, "•••")
        XCTAssertEqual(redacted3, "•••")
    }

    // MARK: - Enhanced Assertion Tests

    func testRedacted_LongBase64Strings_ContainsAssertion() {
        let longBase64 = RedactionFixtures.longBase64()
        let input = "Data payload: \(longBase64) end"
        let redacted = AppLogger.redacted(input)

        XCTAssertTrue(redacted.contains("•••"))
        XCTAssertFalse(redacted.contains(longBase64))
        XCTAssertTrue(redacted.contains("Data payload:"))
        XCTAssertTrue(redacted.contains("end"))
    }

    func testRedacted_MultipleSecrets_DoesNotContain() {
        let secretKey = RedactionFixtures.shortApiKey("sk")
        let bearerPayload = "abc123def456"
        let publicKey = RedactionFixtures.shortApiKey("pk")
        let input = "API: \(secretKey) Token: Bearer \(bearerPayload) Key: \(publicKey)"
        let redacted = AppLogger.redacted(input)

        XCTAssertFalse(redacted.contains(secretKey))
        XCTAssertFalse(redacted.contains(bearerPayload))
        XCTAssertFalse(redacted.contains(publicKey))
        XCTAssertTrue(redacted.contains("•••"))
    }

    // MARK: - Performance Tests

    func testRedacted_Performance() {
        let longString = String(repeating: "This is a test string with \(RedactionFixtures.apiKey("sk")) and Bearer token123 ", count: 100)

        measure {
            _ = AppLogger.redacted(longString)
        }
    }
}

private enum RedactionFixtures {
    static func apiKey(_ prefix: String) -> String {
        prefix + "-" + "1234567890abcdef"
    }

    static func shortApiKey(_ prefix: String) -> String {
        prefix + "-" + "1234567890"
    }

    static func bearerToken() -> String {
        "Bearer " + bearerPayload()
    }

    static func bearerPayload() -> String {
        jwtHeader()
    }

    static func jwt() -> String {
        [jwtHeader(), jwtPayload(), jwtSignature()].joined(separator: ".")
    }

    static func jwtHeader() -> String {
        ["eyJhbGciOiJI", "UzI1NiIsInR5", "cCI6IkpXVCJ9"].joined()
    }

    static func jwtPayload() -> String {
        ["eyJzdWIiOiIx", "MjM0NTY3ODkw", "IiwibmFtZSI6", "IkpvaG4gRG9l", "IiwiaWF0Ijox", "NTE2MjM5MDIy", "fQ"].joined()
    }

    static func jwtSignature() -> String {
        ["SflKxwRJSMeK", "KF2QT4fwpM", "eJf36POk6y", "JV_adQssw5c"].joined()
    }

    static func longBase64() -> String {
        ["dGhpc2lzYXZl", "cnlsb25nYmFz", "ZTY0ZW5jb2Rl", "ZHN0cmluZ3Ro", "YXRzaG91bGRi", "ZXJlZGFjdGVk"].joined()
    }
}
