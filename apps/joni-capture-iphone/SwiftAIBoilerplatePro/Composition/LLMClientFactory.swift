import Foundation
import Core
import Networking
import AI

/// Creates an LLM client based on `AppConfiguration` (generated from
/// `Config/Secrets.xcconfig`). Returns `ProxyLLMClient` when a valid
/// `PROXY_BASE_URL` is configured, otherwise falls back to `EchoLLMClient`
/// so the app still runs against mock services.
@available(iOS 17.0, *)
func createLLMClient(httpClient: any HTTPClient) -> any LLMClient {
    guard let baseURL = URL(string: AppConfiguration.PROXY_BASE_URL),
          !AppConfiguration.PROXY_BASE_URL.contains("YOUR"),
          !AppConfiguration.PROXY_BASE_URL.contains("placeholder") else {
        AppLogger.info("LLM provider: EchoLLMClient (PROXY_BASE_URL not configured)", category: AppLogger.ai)
        return EchoLLMClient()
    }

    let proxyPath = AppConfiguration.PROXY_PATH

    var defaultHeaders: [String: String] = [:]
    if let headersJson = ProcessInfo.processInfo.environment["PROXY_DEFAULT_HEADERS"] {
        defaultHeaders = parseHeadersJSON(headersJson)
    }

    let proxyClient = ProxyLLMClient(
        baseURL: baseURL,
        httpClient: httpClient,
        path: proxyPath,
        defaultHeaders: defaultHeaders
    )

    AppLogger.info(
        "LLM provider: ProxyLLMClient (url=\(AppConfiguration.PROXY_BASE_URL), path=\(proxyPath))",
        category: AppLogger.ai
    )

    return proxyClient
}

/// Parses a `PROXY_DEFAULT_HEADERS` env var JSON string into a header dictionary.
/// Returns an empty dictionary on any parse failure — missing headers should
/// never crash the app at startup.
private func parseHeadersJSON(_ jsonString: String) -> [String: String] {
    guard let data = jsonString.data(using: .utf8) else {
        AppLogger.error("Failed to convert headers JSON to data", category: AppLogger.ai)
        return [:]
    }

    do {
        let headers = try JSONSerialization.jsonObject(with: data) as? [String: String] ?? [:]
        return headers
    } catch {
        AppLogger.error("Failed to parse headers JSON: \(error.localizedDescription)", category: AppLogger.ai)
        return [:]
    }
}

/// Echo LLM client — replays the last user message character-by-character
/// so the app behaves end-to-end without a backend. Used in development
/// and when `PROXY_BASE_URL` is unset.
final class EchoLLMClient: LLMClient {
    func streamResponse(messages: [LLMMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                let lastUserMessage = messages.last(where: { $0.role == "user" })
                let response = "Echo: \(lastUserMessage?.content ?? "Hello!")"

                for char in response {
                    try? await Task.sleep(nanoseconds: 50_000_000) // 50ms
                    continuation.yield(String(char))
                }

                continuation.finish()
            }
        }
    }
}
