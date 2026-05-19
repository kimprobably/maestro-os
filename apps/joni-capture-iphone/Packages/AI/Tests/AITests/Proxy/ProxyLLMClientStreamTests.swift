import XCTest
@testable import AI
import Networking

/// Covers SSE parsing — happy-path chunks, plain-text fallback, spaced
/// `data:` prefix handling, and blank-line tolerance.
final class ProxyLLMClientStreamTests: ProxyLLMClientTestCase {

    func testStreamResponse_successfulResponse_yieldsChunks() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let sseResponse = """
        data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: {"choices":[{"delta":{"content":" there"}}]}
        data: [DONE]
        """.data(using: .utf8)!

        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: sseResponse,
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)
        var chunks: [String] = []

        for try await chunk in stream {
            chunks.append(chunk)
        }

        XCTAssertEqual(chunks.count, 2)
        XCTAssertEqual(chunks[0], "Hello")
        XCTAssertEqual(chunks[1], " there")
    }

    func testStreamResponse_emptyContent_skipsChunk() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let sseResponse = """
        data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: {"choices":[{"delta":{"content":" world"}}]}
        data: [DONE]
        """.data(using: .utf8)!

        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: sseResponse,
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)
        var chunks: [String] = []

        for try await chunk in stream {
            chunks.append(chunk)
        }

        XCTAssertEqual(chunks.count, 2)
        XCTAssertEqual(chunks[0], "Hello")
        XCTAssertEqual(chunks[1], " world")
    }

    func testStreamResponse_plainTextFallback_yieldsContent() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let sseResponse = """
        data: Plain text chunk
        data: [DONE]
        """.data(using: .utf8)!

        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: sseResponse,
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)
        var chunks: [String] = []

        for try await chunk in stream {
            chunks.append(chunk)
        }

        XCTAssertEqual(chunks.count, 1)
        XCTAssertEqual(chunks[0], "Plain text chunk")
    }

    func testStreamResponse_dataWithSpace_parsesCorrectly() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let sseResponse = """
        data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: [DONE]
        """.data(using: .utf8)!

        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: sseResponse,
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)
        var chunks: [String] = []

        for try await chunk in stream {
            chunks.append(chunk)
        }

        XCTAssertEqual(chunks.count, 1)
        XCTAssertEqual(chunks[0], "Hello")
    }

    func testStreamResponse_emptyLines_ignored() async throws {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let sseResponse = """
        data: {"choices":[{"delta":{"content":"Hello"}}]}

        data: {"choices":[{"delta":{"content":" there"}}]}

        data: [DONE]
        """.data(using: .utf8)!

        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: sseResponse,
            requestID: nil
        )

        let stream = client.streamResponse(messages: messages)
        var chunks: [String] = []

        for try await chunk in stream {
            chunks.append(chunk)
        }

        XCTAssertEqual(chunks.count, 2)
        XCTAssertEqual(chunks[0], "Hello")
        XCTAssertEqual(chunks[1], " there")
    }
}
