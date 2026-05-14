import Foundation

/// Defines the visual style of the chat interface
public enum ChatUIStyle: String, CaseIterable, Sendable, Codable {
    /// WhatsApp/iMessage-style with bubble messages
    case bubbles

    /// ChatGPT-style with centered prompt and full-width responses
    case centered

    public var displayName: String {
        switch self {
        case .bubbles: "Bubble Chat"
        case .centered: "Prompt Chat"
        }
    }

    public var icon: String {
        switch self {
        case .bubbles: "bubble.left.and.bubble.right.fill"
        case .centered: "text.aligncenter"
        }
    }

    public var description: String {
        switch self {
        case .bubbles:
            "WhatsApp-style chat with message bubbles"
        case .centered:
            "ChatGPT-style with centered prompt and responses"
        }
    }
}
