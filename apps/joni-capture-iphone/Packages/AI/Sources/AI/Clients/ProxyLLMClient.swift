import Foundation
import Networking
import Core

/// LLM client that streams responses from a backend proxy server.
///
/// Designed to work with any AI provider (OpenAI, Anthropic, OpenRouter, …)
/// through a secure backend proxy so no API keys ship in the mobile app.
/// Request building and SSE parsing live in sibling files under `Proxy/`.
///
/// Operational details, endpoint contracts, and backend requirements are in
/// `Packages/AI/README.md`.
public final class ProxyLLMClient: LLMClient {

    let baseURL: URL
    let httpClient: any HTTPClient
    let path: String
    let defaultHeaders: [String: String]

    /// - Parameters:
    ///   - baseURL: Base URL of your proxy server (never the AI provider directly).
    ///   - httpClient: Shared `HTTPClient` — should carry auth and retry interceptors.
    ///   - path: Streaming endpoint path (default `/v1/chat/stream`).
    ///   - defaultHeaders: Additional headers merged into every request.
    public init(
        baseURL: URL,
        httpClient: any HTTPClient,
        path: String = "/v1/chat/stream",
        defaultHeaders: [String: String] = [:]
    ) {
        self.baseURL = baseURL
        self.httpClient = httpClient
        self.path = path
        self.defaultHeaders = defaultHeaders
    }

    /// Streams an LLM response for the given conversation history.
    ///
    /// The stream completes when the server sends `[DONE]` or the response
    /// body ends. Respects structured concurrency cancellation — cancelling
    /// the consuming task cancels the underlying request.
    public func streamResponse(
        messages: [LLMMessage],
        model: String? = nil,
        temperature: Double? = nil
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let request = try await buildRequest(
                        messages: messages,
                        model: model,
                        temperature: temperature
                    )

                    let logURLString = self.baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
                        + "/"
                        + self.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
                    AppLogger.debug(
                        "LLM request: \(request.method.rawValue) \(logURLString)",
                        category: AppLogger.ai
                    )

                    let response = try await httpClient.send(request)
                    try await handleResponse(response, continuation: continuation)

                } catch {
                    let appError = AppError.from(error)
                    AppLogger.error(
                        "LLM request failed: \(AppLogger.redacted(appError.userMessage))",
                        category: AppLogger.ai
                    )
                    continuation.finish(throwing: appError)
                }
            }
        }
    }
}

// MARK: - Legacy protocol entry point

extension ProxyLLMClient {
    /// `LLMClient` protocol requirement — shortcut for the default model +
    /// temperature. Prefer the fully-parameterised overload for new code.
    public func streamResponse(messages: [LLMMessage]) -> AsyncThrowingStream<String, Error> {
        streamResponse(messages: messages, model: nil, temperature: nil)
    }
}
