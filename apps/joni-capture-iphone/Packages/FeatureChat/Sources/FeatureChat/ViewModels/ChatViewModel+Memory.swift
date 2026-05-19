import Foundation
import Core
import Storage

@available(iOS 17.0, *)
extension ChatViewModel {

    /// Extract and persist memories from recent conversation.
    /// Called after a successful message exchange without blocking it.
    func extractAndSaveMemories() async {
        guard let extractor = memoryExtractor,
              let repository = memoryRepository else {
            return
        }

        let recentMessages = Array(messages.prefix(10))

        let messagesForExtraction = recentMessages.map { message in
            Storage.ChatMessageForExtraction(
                role: Storage.MessageRole(rawValue: message.role.rawValue) ?? .user,
                text: message.text,
                createdAt: message.createdAt
            )
        }

        let extracted = await extractor.extractMemories(from: messagesForExtraction)

        guard !extracted.isEmpty else {
            AppLogger.debug("No memories extracted from recent conversation", category: AppLogger.feature)
            return
        }

        for memory in extracted {
            do {
                // High-importance memories (personal info / preferences) can contradict
                // earlier ones — e.g. "my name is Eric" then "my name is Jessica" should
                // drop the earlier fact. Cross-reference keywords before writing the new row.
                if memory.importance >= 7 {
                    try await repository.deleteConflicting(
                        keywords: memory.keywords,
                        excludingContent: memory.content,
                        conversationID: conversationID
                    )
                }

                _ = try await repository.create(
                    content: memory.content,
                    keywords: memory.keywords,
                    importance: memory.importance,
                    conversationID: conversationID
                )
                AppLogger.debug("Saved memory: \(memory.content)", category: AppLogger.feature)
            } catch {
                AppLogger.error("Failed to save memory: \(error)", category: AppLogger.feature)
                // Best-effort: keep saving the rest of the batch.
            }
        }

        AppLogger.info("Extracted and saved \(extracted.count) memories", category: AppLogger.feature)
    }
}
