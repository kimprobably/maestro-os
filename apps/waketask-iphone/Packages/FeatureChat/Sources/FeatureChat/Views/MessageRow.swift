import DesignSystem
import SwiftUI

/// Single message row component
public struct MessageRow: View {
    let message: ChatMessage

    public init(message: ChatMessage) {
        self.message = message
    }

    public var body: some View {
        HStack {
            if message.role == .user {
                Spacer()
                userBubble
            } else {
                assistantBubble
                Spacer()
            }
        }
    }

    // MARK: - Bubbles

    private var userBubble: some View {
        Text(message.text)
            .font(DSTypography.body)
            .foregroundStyle(.white)
            .padding(DSSpacing.lg)
            .background(DSGradient.primaryLinear)
            .cornerRadius(DSRadius.lg)
            .frame(maxWidth: 280, alignment: .trailing)
    }

    private var assistantBubble: some View {
        SAIStreamingBubble(
            text: message.text,
            isStreaming: message.isStreaming,
            isTyping: message.isStreaming && message.text.isEmpty
        )
        .frame(maxWidth: 320, alignment: .leading)
    }
}
