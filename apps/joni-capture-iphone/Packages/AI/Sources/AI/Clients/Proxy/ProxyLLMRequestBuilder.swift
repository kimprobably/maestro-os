import Foundation
import Networking

// MARK: - Wire models

/// Request payload sent to the proxy. Matches OpenAI's chat completions shape.
struct ProxyChatStreamRequest: Codable {
    let model: String
    let messages: [ProxyChatMessage]
    let temperature: Double
}

struct ProxyChatMessage: Codable {
    let role: String
    let content: String
}

// MARK: - Builder

extension ProxyLLMClient {

    /// Builds the POST request for the chat streaming endpoint.
    /// Defaults: `model = "default"`, `temperature = 0.2`.
    func buildRequest(
        messages: [LLMMessage],
        model: String?,
        temperature: Double?
    ) async throws -> HTTPRequest {
        let requestBody = ProxyChatStreamRequest(
            model: model ?? "default",
            messages: messages.map { message in
                ProxyChatMessage(role: message.role, content: message.content)
            },
            temperature: temperature ?? 0.2
        )

        let bodyData = try JSONEncoder().encode(requestBody)

        var headers = defaultHeaders
        headers["Accept"] = "text/event-stream"
        headers["Content-Type"] = "application/json"

        return HTTPRequest(
            path: path,
            method: .post,
            headers: headers,
            body: bodyData
        )
    }
}
