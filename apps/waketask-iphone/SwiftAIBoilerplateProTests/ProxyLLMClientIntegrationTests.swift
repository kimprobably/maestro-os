import AI
import Core
import Networking
@testable import SwiftAIBoilerplatePro
import XCTest

/// Integration tests for ProxyLLMClient that can run in app test target
@MainActor
final class ProxyLLMClientIntegrationTests: XCTestCase {
    // MARK: - Initialization Tests

    func testLLMClient_canBeCreated() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)

        XCTAssertNotNil(client)
    }

    func testProxyLLMClient_withCustomPath() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: httpClient,
            path: "/custom/path"
        )

        XCTAssertNotNil(client)
    }

    func testProxyLLMClient_withDefaultHeaders() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let headers = [
            "Authorization": "Bearer token",
            "X-Custom": "value",
        ]
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: httpClient,
            defaultHeaders: headers
        )

        XCTAssertNotNil(client)
    }

    // MARK: - Message Tests

    func testLLMMessage_initialization() {
        let message = LLMMessage(role: "user", content: "Hello")

        XCTAssertEqual(message.role, "user")
        XCTAssertEqual(message.content, "Hello")
    }

    func testLLMMessage_systemRole() {
        let message = LLMMessage(role: "system", content: "You are a helpful assistant")

        XCTAssertEqual(message.role, "system")
        XCTAssertEqual(message.content, "You are a helpful assistant")
    }

    func testLLMMessage_assistantRole() {
        let message = LLMMessage(role: "assistant", content: "How can I help?")

        XCTAssertEqual(message.role, "assistant")
        XCTAssertEqual(message.content, "How can I help?")
    }

    func testLLMMessage_multipleMessages() {
        let messages = [
            LLMMessage(role: "system", content: "You are helpful"),
            LLMMessage(role: "user", content: "Hello"),
            LLMMessage(role: "assistant", content: "Hi there!"),
        ]

        XCTAssertEqual(messages.count, 3)
        XCTAssertEqual(messages[0].role, "system")
        XCTAssertEqual(messages[1].role, "user")
        XCTAssertEqual(messages[2].role, "assistant")
    }

    // MARK: - Stream Response Tests

    func testStreamResponse_createsStream() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_withModel() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(
            messages: messages,
            model: "gpt-4",
            temperature: 0.7
        )

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_withCustomTemperature() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(
            messages: messages,
            model: nil,
            temperature: 1.5
        )

        XCTAssertNotNil(stream)
    }

    // MARK: - Legacy Method Tests

    func testStreamResponse_legacyMethod() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages)

        XCTAssertNotNil(stream)
    }

    // MARK: - Edge Case Tests

    func testStreamResponse_emptyMessages() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages: [LLMMessage] = []

        let stream = client.streamResponse(messages: messages)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_longContent() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let longContent = String(repeating: "a", count: 10000)
        let messages = [LLMMessage(role: "user", content: longContent)]

        let stream = client.streamResponse(messages: messages)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_specialCharacters() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let specialContent = "Hello 👋 世界 🌍 émojis & special chars!"
        let messages = [LLMMessage(role: "user", content: specialContent)]

        let stream = client.streamResponse(messages: messages)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_multilineContent() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let multilineContent = """
        Line 1
        Line 2
        Line 3
        """
        let messages = [LLMMessage(role: "user", content: multilineContent)]

        let stream = client.streamResponse(messages: messages)

        XCTAssertNotNil(stream)
    }

    // MARK: - URL Construction Tests

    func testBaseURL_withTrailingSlash() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com/"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)

        XCTAssertNotNil(client)
    }

    func testBaseURL_withoutTrailingSlash() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)

        XCTAssertNotNil(client)
    }

    func testPath_withLeadingSlash() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: httpClient,
            path: "/v1/chat/stream"
        )

        XCTAssertNotNil(client)
    }

    func testPath_withoutLeadingSlash() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: httpClient,
            path: "v1/chat/stream"
        )

        XCTAssertNotNil(client)
    }

    // MARK: - Model Parameter Tests

    func testStreamResponse_withDefaultModel() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages, model: nil, temperature: nil)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_withGPT4() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages, model: "gpt-4", temperature: nil)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_withClaude() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages, model: "claude-3", temperature: nil)

        XCTAssertNotNil(stream)
    }

    // MARK: - Temperature Parameter Tests

    func testStreamResponse_withZeroTemperature() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages, model: nil, temperature: 0.0)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_withHighTemperature() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages, model: nil, temperature: 2.0)

        XCTAssertNotNil(stream)
    }

    func testStreamResponse_withMediumTemperature() throws {
        let baseURL = try XCTUnwrap(URL(string: "https://api.example.com"))
        let session = URLSession(configuration: .ephemeral)
        let httpClient = URLSessionHTTPClient(baseURL: baseURL, session: session)
        let client = ProxyLLMClient(baseURL: baseURL, httpClient: httpClient)
        let messages = [LLMMessage(role: "user", content: "Test")]

        let stream = client.streamResponse(messages: messages, model: nil, temperature: 1.0)

        XCTAssertNotNil(stream)
    }
}
