# AI Module Prompts

Ready-to-use prompts for common tasks in the AI module.

## Add a Direct OpenAI Client

> Create a new `DirectOpenAIClient` that conforms to the `LLMClient` protocol and calls the OpenAI API directly (without the Supabase proxy). Use the existing SSE streaming pattern from `ProxyLLMClient`. Add it as an option in `CompositionRoot` with a feature flag. Note: this means the API key will be in the app binary, so document the security tradeoff.

## Add System Prompt Configuration

> Add a configurable system prompt to `LLMClient.streamResponse()`. Extend the method signature to accept an optional `systemPrompt: String?` parameter. Update `ProxyLLMClient` to include it as the first message with role "system". Update `ChatViewModel` to pass a default persona prompt.

## Add Model Selection

> Add the ability for users to choose their AI model per conversation. Store the model ID in the conversation's metadata (extend `ConversationDTO`). Pass the model ID through to `LLMClient.streamResponse()`. Update the Supabase Edge Function to accept and forward the model parameter to OpenRouter.
