import Foundation
import SwiftUI
import Core
import Storage

/// Free-tier message limit per conversation.
private let kFreeMessageLimit = 10

/// Protocol for checking payments/subscription status.
/// Allows ChatViewModel to check limits without a hard dependency on Payments.
public protocol PaymentsStatusProvider: Sendable {
    func currentState() async -> PaymentsState
}

public struct PaymentsState: Sendable {
    public let isSubscribed: Bool

    public init(isSubscribed: Bool) {
        self.isSubscribed = isSubscribed
    }
}

@MainActor
@Observable
public final class ChatViewModel {

    // MARK: - Published State

    public var messages: [ChatMessage] = []
    public var inputText: String = ""
    public var isSending: Bool = false
    public var paginatorState: InfinitePaginator.State = .idle
    public var errorMessage: String?
    public var retryAction: (() async -> Void)?

    // MARK: - Dependencies

    let conversationID: UUID
    let messageRepository: any MessageRepository
    let llmClient: any LLMClient
    let paymentsStatusProvider: (any PaymentsStatusProvider)?
    let memoryRepository: (any Storage.MemoryRepository)?
    let memoryRetriever: (any Storage.MemoryRetriever)?
    let memoryExtractor: (any Storage.MemoryExtractor)?
    private var paginator: InfinitePaginator
    private var streamTask: Task<Void, Never>?
    private var lastLoadTime: Date?
    private let debounceInterval: TimeInterval = 0.2
    private var didLoadFirstPage: Bool = false
    private var streamingMessageID: UUID?

    public init(
        conversationID: UUID,
        messageRepository: any MessageRepository,
        llmClient: any LLMClient,
        paymentsStatusProvider: (any PaymentsStatusProvider)? = nil,
        memoryRepository: (any Storage.MemoryRepository)? = nil,
        memoryRetriever: (any Storage.MemoryRetriever)? = nil,
        memoryExtractor: (any Storage.MemoryExtractor)? = nil,
        pageSize: Int = 50
    ) {
        self.conversationID = conversationID
        self.messageRepository = messageRepository
        self.llmClient = llmClient
        self.paymentsStatusProvider = paymentsStatusProvider
        self.memoryRepository = memoryRepository
        self.memoryRetriever = memoryRetriever
        self.memoryExtractor = memoryExtractor
        self.paginator = InfinitePaginator(pageSize: pageSize)
    }

    // MARK: - Public API

    public func appear() async {
        guard !didLoadFirstPage else { return }
        didLoadFirstPage = true
        await loadFirstPage()
    }

    public func loadMoreIfNeeded(currentIndex: Int) {
        guard paginator.shouldLoadMore(visibleIndex: currentIndex, totalCount: messages.count) else {
            return
        }

        Task {
            await loadNextPage()
        }
    }

    public func retryLast() async {
        if let action = retryAction {
            await action()
            retryAction = nil
        }
    }

    public func send() async {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            AppLogger.debug("Attempted to send empty message", category: AppLogger.feature)
            return
        }

        if let provider = paymentsStatusProvider {
            let state = await provider.currentState()
            if !state.isSubscribed {
                let userMessageCount = messages.filter { $0.role == .user }.count
                if userMessageCount >= kFreeMessageLimit {
                    errorMessage = "Free limit reached. Upgrade to Pro for unlimited messages."
                    AppLogger.info("Free message limit reached (\(kFreeMessageLimit))", category: AppLogger.feature)
                    return
                }
            }
        }

        streamTask?.cancel()

        isSending = true
        errorMessage = nil
        retryAction = nil

        let userText = inputText
        inputText = ""

        var memoryContext = ""
        if let retriever = memoryRetriever {
            do {
                let memories = try await retriever.retrieve(
                    for: userText,
                    conversationID: conversationID,
                    limit: 5
                )

                if !memories.isEmpty {
                    memoryContext = """

                    [Context about the user from previous conversations:]
                    \(memories.map { "- \($0.content)" }.joined(separator: "\n"))

                    """
                    AppLogger.debug("Injected \(memories.count) memories into context", category: AppLogger.feature)
                }
            } catch {
                AppLogger.error("Failed to retrieve memories: \(error)", category: AppLogger.feature)
                // Missing memory context must not block a send.
            }
        }

        do {
            let userMessageDTO = try await messageRepository.append(
                conversationID: conversationID,
                role: .user,
                text: userText,
                createdAt: Date()
            )

            let userMessage = ChatMappers.toChatMessage(userMessageDTO)
            messages.insert(userMessage, at: 0)

            AppLogger.debug("User message sent: \(AppLogger.redacted(userText))", category: AppLogger.feature)

            let assistantMessage = ChatMessage(
                role: .assistant,
                text: "",
                createdAt: Date(),
                isStreaming: true
            )
            messages.insert(assistantMessage, at: 0)
            streamingMessageID = assistantMessage.id

            var llmMessages = messages
                .filter { !($0.role == .assistant && $0.text.isEmpty) }
                .reversed()
                .map { LLMMessage(from: $0) }

            // Inject memory context under the "user" role because the edge
            // function strips "system" messages for security.
            if !memoryContext.isEmpty {
                llmMessages.insert(
                    LLMMessage(role: "user", content: "[Context from previous conversations:]\n\(memoryContext)\n[End of context]"),
                    at: 0
                )
            }

            var accumulatedText = ""
            let stream = llmClient.streamResponse(messages: llmMessages)

            streamTask = Task { @MainActor in
                do {
                    for try await chunk in stream {
                        try Task.checkCancellation()

                        accumulatedText += chunk
                        if let index = messages.firstIndex(where: { $0.id == streamingMessageID }) {
                            messages[index].text = accumulatedText
                        }
                    }

                    if let index = messages.firstIndex(where: { $0.id == streamingMessageID }) {
                        messages[index].isStreaming = false
                    }

                    _ = try await messageRepository.append(
                        conversationID: conversationID,
                        role: .assistant,
                        text: accumulatedText,
                        createdAt: Date()
                    )

                    AppLogger.debug("Assistant message completed", category: AppLogger.feature)

                    // Memory extraction runs async so it never blocks the UI.
                    Task {
                        await extractAndSaveMemories()
                    }

                    streamingMessageID = nil
                    isSending = false

                } catch is CancellationError {
                    AppLogger.debug("Message streaming cancelled", category: AppLogger.feature)
                    if let streamingID = streamingMessageID {
                        messages.removeAll { $0.id == streamingID }
                        streamingMessageID = nil
                    }
                    isSending = false
                } catch {
                    AppLogger.error("Failed to stream LLM response: \(error)", category: AppLogger.feature)
                    let appError = AppError.from(error)
                    errorMessage = appError.chatUserMessage

                    if let streamingID = streamingMessageID {
                        messages.removeAll { $0.id == streamingID }
                        streamingMessageID = nil
                    }

                    retryAction = { [weak self] in
                        await self?.retryLastMessage(userText)
                    }

                    isSending = false
                }
            }

            await streamTask?.value

        } catch {
            AppLogger.error("Failed to send message: \(error)", category: AppLogger.feature)
            isSending = false

            let appError: AppError
            if let storageError = error as? StorageError {
                appError = storageError.asAppError()
            } else {
                appError = AppError.from(error)
            }

            errorMessage = appError.chatUserMessage

            // Restore the user's draft so they don't lose typing when persistence fails.
            inputText = userText
        }
    }

    // MARK: - Deep links

    /// Handles a deep link that lands on this conversation — if the link carries
    /// a pending quick-reply payload, fire it as if the user typed it.
    public func handleDeepLink(_ deepLink: DeepLink) {
        switch deepLink {
        case .chat(let conversationId):
            let currentConversationId = conversationID.uuidString
            if conversationId == currentConversationId {
                if let replyText = ReplyActionBus.shared.take(for: conversationId) {
                    AppLogger.info("Handling reply from notification: \(replyText)", category: AppLogger.notifications)
                    inputText = replyText
                    Task {
                        await send()
                    }
                } else {
                    AppLogger.debug("No pending reply for conversation: \(conversationId)", category: AppLogger.notifications)
                }
            } else {
                AppLogger.debug("Deep link for different conversation: \(conversationId), current: \(currentConversationId)", category: AppLogger.notifications)
            }
        }
    }

    // MARK: - Pagination helpers

    private func loadFirstPage() async {
        paginator.reset()
        messages.removeAll()
        lastLoadTime = nil
        await loadNextPage()
    }

    private func loadNextPage() async {
        // Debounce: prevent thrashing the repository on fast scroll.
        let now = Date()
        if let lastLoad = lastLoadTime, now.timeIntervalSince(lastLoad) < debounceInterval {
            AppLogger.debug("Load request debounced", category: AppLogger.feature)
            return
        }
        lastLoadTime = now

        let result = await paginator.loadNext { cursor in
            try await messageRepository.page(
                conversationID: conversationID,
                after: cursor,
                limit: paginator.pageSize
            )
        }

        switch result {
        case .success(let newMessages):
            messages.append(contentsOf: newMessages)
            paginatorState = paginator.state
            errorMessage = nil

        case .failure(let error):
            errorMessage = error.chatUserMessage
            paginatorState = paginator.state
        }
    }

    private func retryLastMessage(_ text: String) async {
        inputText = text
        await send()
    }
}
