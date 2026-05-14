import Core
import Foundation
import Networking

// MARK: - OpenRouter SSE chunk shape

/// Minimal decoder for OpenRouter / OpenAI-compatible SSE chunks:
/// `{"choices":[{"delta":{"content":"text"}}]}`
struct OpenRouterChunk: Codable {
    let choices: [OpenRouterChoice]
}

struct OpenRouterChoice: Codable {
    let delta: OpenRouterDelta
}

struct OpenRouterDelta: Codable {
    let content: String?
}

// MARK: - Parser

extension ProxyLLMClient {
    /// Validates the HTTP response and dispatches to the SSE parser on success.
    func handleResponse(
        _ response: HTTPResponse,
        continuation: AsyncThrowingStream<String, Error>.Continuation
    ) async throws {
        if Task.isCancelled {
            continuation.finish()
            return
        }

        guard (200 ... 299).contains(response.statusCode) else {
            let error = AppError.server(
                code: response.statusCode,
                message: "LLM request failed with status \(response.statusCode)"
            )
            AppLogger.error(
                "LLM server error: \(response.statusCode)",
                category: AppLogger.ai
            )
            continuation.finish(throwing: error)
            return
        }

        try await parseSSEResponse(response.data, continuation: continuation)
    }

    /// Streams text chunks from an OpenRouter / OpenAI-compatible SSE body.
    /// Falls back to yielding the raw line content if JSON parsing fails so
    /// plain-text servers still work.
    func parseSSEResponse(
        _ data: Data,
        continuation: AsyncThrowingStream<String, Error>.Continuation
    ) async throws {
        guard let responseText = String(data: data, encoding: .utf8) else {
            continuation.finish(throwing: AppError.decoding)
            return
        }

        let lines = responseText.components(separatedBy: .newlines)

        for line in lines {
            if Task.isCancelled {
                continuation.finish()
                return
            }

            guard line.hasPrefix("data:") else { continue }

            let content = line.dropFirst("data:".count)
                .trimmingCharacters(in: .whitespaces)

            if content == "[DONE]" {
                continuation.finish()
                return
            }

            if content.isEmpty { continue }

            if let jsonData = content.data(using: .utf8),
               let json = try? JSONDecoder().decode(OpenRouterChunk.self, from: jsonData),
               let deltaContent = json.choices.first?.delta.content,
               !deltaContent.isEmpty
            {
                continuation.yield(deltaContent)
            } else {
                // Fallback: treat as plain text so non-OpenRouter backends work.
                continuation.yield(content)
            }
        }

        // Stream ended without an explicit [DONE] marker.
        continuation.finish()
    }
}
