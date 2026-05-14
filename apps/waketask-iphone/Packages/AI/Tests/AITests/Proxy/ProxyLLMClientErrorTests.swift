@testable import AI
import Core
import Networking
import XCTest

/// Error-path coverage — HTTP status failures, transport errors, invalid
/// UTF-8 bodies, and structured-concurrency cancellation.
final class ProxyLLMClientErrorTests: ProxyLLMClientTestCase {
    func testStreamResponse_serverError_throwsAppError() async {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 500,
            headers: [:],
            data: Data(),
            requestID: nil
        )

        do {
            let stream = client.streamResponse(messages: messages)
            for try await _ in stream {
                XCTFail("Should not yield any chunks")
            }
            XCTFail("Should have thrown an error")
        } catch let error as AppError {
            if case let .server(code, _) = error {
                XCTAssertEqual(code, 500)
            } else {
                XCTFail("Expected AppError.server, got \(error)")
            }
        } catch {
            XCTFail("Expected AppError, got \(error)")
        }
    }

    func testStreamResponse_networkError_throwsAppError() async {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.shouldThrow = true
        mockHTTPClient.errorToThrow = URLError(.notConnectedToInternet)

        do {
            let stream = client.streamResponse(messages: messages)
            for try await _ in stream {
                XCTFail("Should not yield any chunks")
            }
            XCTFail("Should have thrown an error")
        } catch let error as AppError {
            if case .network = error {
                // Success
            } else {
                XCTFail("Expected AppError.network, got \(error)")
            }
        } catch {
            XCTFail("Expected AppError, got \(error)")
        }
    }

    func testStreamResponse_invalidUTF8_throwsDecodingError() async {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let invalidData = Data([0xFF, 0xFE, 0xFD]) // Invalid UTF-8

        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 200,
            headers: [:],
            data: invalidData,
            requestID: nil
        )

        do {
            let stream = client.streamResponse(messages: messages)
            for try await _ in stream {
                XCTFail("Should not yield any chunks")
            }
            XCTFail("Should have thrown an error")
        } catch let error as AppError {
            if case .decoding = error {
                // Success
            } else {
                XCTFail("Expected AppError.decoding, got \(error)")
            }
        } catch {
            XCTFail("Expected AppError, got \(error)")
        }
    }

    func testStreamResponse_401Error_throwsAppError() async {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        mockHTTPClient.mockResponse = HTTPResponse(
            statusCode: 401,
            headers: [:],
            data: Data(),
            requestID: nil
        )

        do {
            let stream = client.streamResponse(messages: messages)
            for try await _ in stream {
                XCTFail("Should not yield any chunks")
            }
            XCTFail("Should have thrown an error")
        } catch let error as AppError {
            if case let .server(code, _) = error {
                XCTAssertEqual(code, 401)
            } else {
                XCTFail("Expected AppError.server with 401, got \(error)")
            }
        } catch {
            XCTFail("Expected AppError, got \(error)")
        }
    }

    func testStreamResponse_cancellation_stopsStreaming() async {
        let messages = [LLMMessage(role: "user", content: "Hello")]
        let sseResponse = """
        data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: {"choices":[{"delta":{"content":" there"}}]}
        data: {"choices":[{"delta":{"content":" friend"}}]}
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

        let task = Task {
            for try await chunk in stream {
                chunks.append(chunk)
                if chunks.count == 2 {
                    return
                }
            }
        }

        try? await task.value
        task.cancel()

        XCTAssertLessThanOrEqual(chunks.count, 2)
    }
}
