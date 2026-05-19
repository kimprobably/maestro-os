# FeatureChat Module Prompts

Ready-to-use prompts for common tasks in the FeatureChat module.

## Add Image Attachment Support

> Add image attachment support to the chat. Extend `ChatMessage` with an optional `imageURL: URL?` field. Update `MessageRow` to display inline image previews when present. Add a photo picker button to `SAIInputBar`. Follow the existing `ChatMessage` model and `MessageRow` view patterns.

## Add a Conversation Title Generator

> After the first assistant reply in a new conversation, automatically generate a short title using the LLM. Add a `generateTitle(from:)` method to `ChatViewModel` that sends the first exchange to the LLM with a prompt like "Summarize this conversation in 4 words." Save the title to `ConversationDTO` via the repository.

## Add Message Search

> Add full-text search across all messages in a conversation. Use the existing `ChatSearchBar` component. Filter `ChatViewModel.messages` based on the search query. Highlight matching text in `MessageRow`. Follow the existing `@Observable` state pattern in `ChatViewModel`.

## Add Typing Indicator

> Show a typing indicator bubble while the assistant is streaming a response. Use the existing `SAIStreamingBubble` component. Display it at the bottom of the message list when `isSending` is true but before the first chunk arrives. Remove it once content starts streaming into the assistant message.
