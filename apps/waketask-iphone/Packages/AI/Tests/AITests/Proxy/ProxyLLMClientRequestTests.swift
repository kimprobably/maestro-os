@testable import AI
import Networking
import XCTest

/// Verifies the request body, headers, and path that `ProxyLLMClient` emits
/// for each code path (explicit model/temperature, defaults, legacy entry
/// point, default headers, multi-message history, custom path).
final class ProxyLLMClientRequestTests: ProxyLLMClientTestCase {
    func testStreamResponse_withModel_includesModelInRequest() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = client.streamResponse(
            messages: messages,
            model: "gpt-4",
            temperature: 0.7
        )

        for try await _ in stream {}

        XCTAssertEqual(mockHTTPClient.sentRequests.count, 1)
        let request = mockHTTPClient.sentRequests[0]

        if let body = request.body,
           let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any]
        {
            XCTAssertEqual(json["model"] as? String, "gpt-4")
            XCTAssertEqual(json["temperature"] as? Double, 0.7)
        } else {
            XCTFail("Request body should contain model and temperature")
        }
    }

    func testStreamResponse_withoutModel_usesDefault() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)

        for try await _ in stream {}

        XCTAssertEqual(mockHTTPClient.sentRequests.count, 1)
        let request = mockHTTPClient.sentRequests[0]

        if let body = request.body,
           let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any]
        {
            XCTAssertEqual(json["model"] as? String, "default")
            XCTAssertEqual(json["temperature"] as? Double, 0.2)
        } else {
            XCTFail("Request body should contain default model and temperature")
        }
    }

    func testStreamResponse_legacyMethod_usesDefaults() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)

        for try await _ in stream {}

        XCTAssertEqual(mockHTTPClient.sentRequests.count, 1)
        let request = mockHTTPClient.sentRequests[0]

        if let body = request.body,
           let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any]
        {
            XCTAssertEqual(json["model"] as? String, "default")
            XCTAssertEqual(json["temperature"] as? Double, 0.2)
        }
    }

    func testStreamResponse_setsCorrectHeaders() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)

        for try await _ in stream {}

        XCTAssertEqual(mockHTTPClient.sentRequests.count, 1)
        let request = mockHTTPClient.sentRequests[0]

        XCTAssertEqual(request.headers["Accept"], "text/event-stream")
        XCTAssertEqual(request.headers["Content-Type"], "application/json")
    }

    func testStreamResponse_withDefaultHeaders_mergesHeaders() async throws {
        let customClient = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: mockHTTPClient,
            defaultHeaders: ["X-Custom": "value"]
        )

        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = customClient.streamResponse(messages: messages)

        for try await _ in stream {}

        let request = mockHTTPClient.sentRequests[0]
        XCTAssertEqual(request.headers["X-Custom"], "value")
        XCTAssertEqual(request.headers["Accept"], "text/event-stream")
    }

    func testStreamResponse_multipleMessages_encodesCorrectly() async throws {
        let messages = [
            LLMMessage(role: "system", content: "You are helpful"),
            LLMMessage(role: "user", content: "Hello"),
            LLMMessage(role: "assistant", content: "Hi there!"),
        ]

        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)

        for try await _ in stream {}

        let request = mockHTTPClient.sentRequests[0]

        if let body = request.body,
           let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any],
           let messagesArray = json["messages"] as? [[String: String]]
        {
            XCTAssertEqual(messagesArray.count, 3)
            XCTAssertEqual(messagesArray[0]["role"], "system")
            XCTAssertEqual(messagesArray[0]["content"], "You are helpful")
            XCTAssertEqual(messagesArray[1]["role"], "user")
            XCTAssertEqual(messagesArray[1]["content"], "Hello")
            XCTAssertEqual(messagesArray[2]["role"], "assistant")
            XCTAssertEqual(messagesArray[2]["content"], "Hi there!")
        } else {
            XCTFail("Request body should contain messages array")
        }
    }

    func testStreamResponse_usesCorrectPath() async throws {
        let customClient = ProxyLLMClient(
            baseURL: baseURL,
            httpClient: mockHTTPClient,
            path: "/custom/stream"
        )

        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = try HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: XCTUnwrap("data: [DONE]".data(using: .utf8)),
            requestID: nil
        )

        let stream = customClient.streamResponse(messages: messages)

        for try await _ in stream {}

        XCTAssertEqual(mockHTTPClient.sentRequests.count, 1)
        let request = mockHTTPClient.sentRequests[0]
        XCTAssertEqual(request.path, "/custom/stream")
    }
}
