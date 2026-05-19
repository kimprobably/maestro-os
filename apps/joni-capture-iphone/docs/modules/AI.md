# AI Module

> **v2.0 — File split + security hardening.** `ProxyLLMClient.swift` (formerly 459 lines) is now a thin client in `Clients/Proxy/` alongside `ProxyLLMRequestBuilder.swift` and `ProxyLLMStreamParser.swift`. The public `LLMClient` protocol and `ProxyLLMClient` initializer are unchanged. `ProxyLLMClient` dropped `@unchecked Sendable` (all properties are immutable `let`), and `MemoryRetrievalConfig` has explicit `Sendable` conformance.
>
> The Supabase Edge Function that backs `ProxyLLMClient` is now authenticated-only, with a model allowlist (`openai/gpt-3.5-turbo`, `openai/gpt-4o-mini`), message count + length bounds, a server-controlled system prompt, temperature clamping, and sanitized errors. Memory context is now injected as a separate delimited message rather than appended to the user's text. Details in `RELEASE_NOTES.md` and the v2.0.0 Supabase migration docs.

LLM client protocol and streaming response integration.

## Purpose

**What AI owns:**
- `LLMClient` protocol for provider abstraction
- `ProxyLLMClient` - calls Supabase Edge Function
- `EchoLLMClient` - testing/development fallback
- Streaming response handling (Server-Sent Events)
- Message types (`LLMMessage`)

**What AI does NOT own:**
- Chat UI (see FeatureChat)
- Message persistence (see Storage)
- Network layer (uses Networking)
- Proxy implementation (see `supabase/functions/ai/`)

## Public API

```swift
import AI

// Define messages
let messages = [
    LLMMessage(role: "system", content: "You are a helpful assistant"),
    LLMMessage(role: "user", content: "Hello!")
]

// Stream response
for try await chunk in llmClient.streamResponse(messages: messages) {
    print(chunk, terminator: "")
    // Output: "Hello! How can I help you today?"
}
```

## Setup

### Environment Variables

Configure in `Config/Secrets.xcconfig`:

```bash
# Supabase Edge Function URL
PROXY_BASE_URL = https://YOUR-PROJECT-REF.supabase.co/functions/v1
PROXY_PATH = /ai

# Optional: Custom headers (JSON object)
PROXY_DEFAULT_HEADERS = {"X-Custom-Header": "value"}
```

### Dependency Injection

```swift
// In CompositionRoot.swift
func createLLMClient(httpClient: HTTPClient) -> LLMClient {
    let env = ProcessInfo.processInfo.environment
    let proxyBaseURL = env["PROXY_BASE_URL"]
    
    guard let baseURLString = proxyBaseURL,
          let baseURL = URL(string: baseURLString) else {
        // Fallback to Echo client (for testing)
        return EchoLLMClient()
    }
    
    let proxyPath = env["PROXY_PATH"] ?? "/v1/chat/stream"
    
    let proxyClient = ProxyLLMClient(
        baseURL: baseURL,
        httpClient: httpClient,
        path: proxyPath,
        defaultHeaders: [:]
    )
    
    return proxyClient
}

self.llmClient = createLLMClient(httpClient: httpClient)
```

### Flags

**Echo mode (no API calls):**
```bash
# Don't set PROXY_BASE_URL in Config/Secrets.xcconfig
# App automatically uses EchoLLMClient
```

**Proxy mode (production):**
```bash
# Set PROXY_BASE_URL to your deployed Edge Function
PROXY_BASE_URL = https://YOUR-PROJECT-REF.supabase.co/functions/v1
```

## Example: Stream AI Response in 3 Steps

### Step 1: Prepare Messages

```swift
import AI

@Observable
@MainActor
final class ChatViewModel {
    var messages: [Message] = []
    var streamingText = ""

    private let llmClient: any LLMClient

    func sendMessage(_ text: String) async {
        // Add user message
        let userMessage = Message(role: .user, content: text)
        messages.append(userMessage)

        // Prepare for streaming assistant response
        streamingText = ""

        // Convert to LLM format
        let llmMessages = messages.map { message in
            LLMMessage(role: message.role.rawValue, content: message.content)
        }
        
        await streamResponse(llmMessages: llmMessages)
    }
}
```

### Step 2: Stream Response

```swift
private func streamResponse(llmMessages: [LLMMessage]) async {
    do {
        for try await chunk in llmClient.streamResponse(messages: llmMessages) {
            await MainActor.run {
                streamingText += chunk
            }
        }
        
        // Streaming complete
        await MainActor.run {
            let assistantMessage = Message(
                role: .assistant,
                content: streamingText
            )
            messages.append(assistantMessage)
            streamingText = ""
        }
        
    } catch let error as AppError {
        // Handle error
        print("Streaming failed: \(error.userMessage)")
    }
}
```

### Step 3: Display in UI

```swift
struct ChatView: View {
    @State var viewModel: ChatViewModel
    
    var body: some View {
        ScrollView {
            ForEach(viewModel.messages) { message in
                MessageRow(message: message)
            }
            
            // Show streaming text
            if !viewModel.streamingText.isEmpty {
                MessageRow(
                    message: Message(
                        role: .assistant,
                        content: viewModel.streamingText
                    ),
                    isStreaming: true
                )
            }
        }
    }
}
```

**Expected result:**
1. User types "Hello!"
2. User message appears immediately
3. Assistant response appears word-by-word
4. Final message saved to storage

## Common Customizations

> **Quick Start:** These recipes show how to customize AI behavior. All follow the LLMClient protocol pattern.

### Change AI Model

**Task:** Switch from GPT-3.5 to GPT-4 or Claude.

**File:** Check your Supabase Edge Function or ProxyLLMClient

**For OpenRouter (via proxy):**
```typescript
// supabase/functions/ai/index.ts
const model = "openai/gpt-4o-mini"  // Change to:
const model = "anthropic/claude-3-5-sonnet"  // Claude Sonnet
// or
const model = "openai/gpt-4-turbo"  // GPT-4
```

**For direct client:**
```swift
struct StreamRequest {
    let model: String = "anthropic/claude-3-5-sonnet"  // Your choice
}
```

**LLM Prompt:**
```
Change the AI model from gpt-3.5-turbo to claude-3-5-sonnet. Update the model 
parameter in the Supabase Edge Function or ProxyLLMClient. Verify streaming 
still works correctly. See docs/AI.md#models for available options.
```

### Add System Prompt/Persona

**Task:** Give AI a specific personality or role.

**Steps:**
1. Add system message to ChatViewModel:
```swift
func sendMessage(_ text: String) async {
    let systemPrompt = LLMMessage(
        role: .system,
        content: "You are a helpful coding assistant specializing in Swift and iOS."
    )
    
    let messages = [systemPrompt] + conversationMessages + [userMessage]
    
    for try await chunk in llmClient.streamResponse(messages: messages) {
        // ... handle streaming
    }
}
```

2. Make it configurable per conversation

**LLM Prompt:**
```
Add a system prompt that makes the AI act as a coding tutor. The prompt should be:
"You are an expert Swift developer and patient tutor. Explain concepts clearly 
with code examples. Always follow iOS best practices."

Add this as the first message in every conversation. Later, make it selectable 
so users can choose different AI personas. Follow the message pattern in docs/AI.md.
```

### Adjust AI Temperature/Creativity

**Task:** Make AI more creative or more deterministic.

**File:** Edge function or client configuration

```swift
struct StreamRequest {
    let temperature: Double = 0.9  // More creative (0.0-2.0)
    // 0.0 = deterministic, 1.0 = balanced, 2.0 = very creative
}
```

**LLM Prompt:**
```
Make the AI more creative by setting temperature to 1.2 (currently 0.7). 
Update the streaming request in ProxyLLMClient or the Edge Function. 
Explain the temperature parameter to users in settings if made configurable.
```

### Add Token/Cost Tracking

**Task:** Track API usage and costs.

**Steps:**
1. Create Usage model:
```swift
@Model
class AIUsage {
    var promptTokens: Int
    var completionTokens: Int
    var totalCost: Decimal
    var timestamp: Date
}
```

2. Parse from response headers
3. Display in settings

**LLM Prompt:**
```
Add AI usage tracking that shows tokens used and estimated cost. Parse token 
counts from OpenRouter response headers. Store in SwiftData. Display total 
usage in Settings screen. Calculate cost based on model pricing from OpenRouter.
Follow the SwiftData pattern in docs/Storage.md.
```

---

## Customization (Advanced)

### Add Custom LLM Provider:
```swift
final class OpenAIDirectClient: LLMClient {
    private let apiKey: String
    private let baseURL = URL(string: "https://api.openai.com/v1")!
    
    func streamResponse(messages: [LLMMessage]) 
        -> AsyncThrowingStream<String, Error> {
        
        AsyncThrowingStream { continuation in
            Task {
                // Build request
                let request = // ... create URLRequest with OpenAI format
                
                // Stream response
                let (bytes, _) = try await URLSession.shared.bytes(for: request)
                
                for try await byte in bytes {
                    // Parse SSE format
                    // Yield chunks
                    continuation.yield(chunk)
                }
                
                continuation.finish()
            }
        }
    }
}

// In CompositionRoot:
self.llmClient = OpenAIDirectClient(apiKey: openAIKey)
```

**Configure model parameters:**
```swift
// In ProxyLLMClient or custom client
struct StreamRequest {
    let messages: [LLMMessage]
    let model: String = "openai/gpt-4o-mini"
    let temperature: Double = 0.7
    let maxTokens: Int? = nil
    let topP: Double? = nil
}
```

**Add retry logic:**
```swift
func streamResponseWithRetry(messages: [LLMMessage], maxRetries: Int = 3) 
    -> AsyncThrowingStream<String, Error> {
    
    AsyncThrowingStream { continuation in
        Task {
            var attempts = 0
            
            while attempts < maxRetries {
                do {
                    for try await chunk in llmClient.streamResponse(messages: messages) {
                        continuation.yield(chunk)
                    }
                    continuation.finish()
                    return
                } catch {
                    attempts += 1
                    if attempts >= maxRetries {
                        continuation.finish(throwing: error)
                    }
                    try await Task.sleep(nanoseconds: UInt64(pow(2.0, Double(attempts)) * 1_000_000_000))
                }
            }
        }
    }
}
```

### Pitfalls

**Don't:**
- Make direct API calls to LLM providers (use proxy)
- Embed API keys in app (security risk)
- Ignore streaming errors (handle gracefully)
- Block main thread waiting for response
- Forget to cancel tasks on view dismiss

**Do:**
- Always use `LLMClient` protocol
- Handle network errors gracefully
- Show loading/streaming indicators
- Support cancellation
- Test with EchoLLMClient first

## Where Used

**Direct users:**
- `FeatureChat/ChatViewModel` - Streaming chat responses
- `FeatureChat/DualStyleChatView` - Chat UI with streaming
- `FeatureChat/ChatGPTStyleView` - Alternative chat UI

**Example from FeatureChat:**
```swift
// FeatureChat/ChatViewModel.swift
import AI

@Observable
@MainActor
final class ChatViewModel {
    var streamingMessageContent = ""

    private let llmClient: any LLMClient
    private var streamTask: Task<Void, Never>?

    func sendMessage(_ text: String) {
        streamTask?.cancel()

        streamTask = Task {
            do {
                let llmMessages = convertToLLMMessages(messages)

                for try await chunk in llmClient.streamResponse(messages: llmMessages) {
                    guard !Task.isCancelled else { return }
                    streamingMessageContent += chunk
                }

                // Save complete message
                await saveMessage(content: streamingMessageContent)

            } catch {
                handleError(error)
            }
        }
    }

    deinit {
        streamTask?.cancel()
    }
}
```

## Tests

### Run Tests

```bash
# All AI tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:AITests

# Specific tests
-only-testing:AITests/ProxyLLMClientTests
```

### What's Covered

**ProxyLLMClient:**
- Request building (messages → JSON)
- SSE parsing (data: lines)
- Chunk yielding
- Error handling (network, parsing)
- Cancellation support

**EchoLLMClient:**
- Message echoing
- Streaming simulation
- Character-by-character output

**Integration:**
- Full streaming flow (request → chunks → completion)
- Error scenarios (timeout, invalid response)

**Coverage:** 85%+

### Example Test

```swift
import XCTest
@testable import AI

final class ProxyLLMClientTests: XCTestCase {
    func testStreamResponse_yieldsChunks() async throws {
        let client = ProxyLLMClient(
            baseURL: mockURL,
            httpClient: mockHTTPClient,
            path: "/ai"
        )
        
        let messages = [LLMMessage(role: "user", content: "Hello")]
        var chunks: [String] = []
        
        for try await chunk in client.streamResponse(messages: messages) {
            chunks.append(chunk)
        }
        
        XCTAssertEqual(chunks.joined(), "Hello! How can I help?")
    }
    
    func testStreamResponse_cancellation_stopsStreaming() async throws {
        let stream = client.streamResponse(messages: messages)
        
        let task = Task {
            for try await _ in stream {
                // Cancel after first chunk
                Task.cancel()
            }
        }
        
        _ = await task.result
        
        // Should not throw cancellation error
    }
}
```

## Troubleshooting

### Issue: No AI Responses

**Symptoms:** Streaming never starts or fails immediately

**Fixes:**
1. Check proxy URL:
   ```swift
   print(ProcessInfo.processInfo.environment["PROXY_BASE_URL"])
   ```
2. Verify Edge Function deployed:
   ```bash
   supabase functions list
   # Should show "ai" function
   ```
3. Check Edge Function logs in Supabase dashboard
4. Test proxy with curl:
   ```bash
   curl -X POST https://YOUR-PROJECT-REF.supabase.co/functions/v1/ai \
     -H "Authorization: Bearer YOUR_JWT" \
     -H "Content-Type: application/json" \
     -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"Hi"}]}'
   ```

### Issue: Streaming Stops Mid-Response

**Symptoms:** Response cuts off unexpectedly

**Fixes:**
1. Check timeout settings in URLSession
2. Verify OpenRouter account has credits
3. Check model token limits
4. Look for errors in Edge Function logs
5. Test with different model:
   ```swift
   // Try faster model
   model = "openai/gpt-4o-mini"
   ```

### Issue: "Invalid API Key" from Proxy

**Symptoms:** 401/403 errors from Edge Function

**Fixes:**
1. Check OpenRouter API key in Supabase secrets:
   ```bash
   supabase secrets list
   # Should show OPENROUTER_API_KEY
   ```
2. Verify key is valid at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Check Supabase auth token is being sent:
   ```swift
   // AuthInterceptor should add Authorization header
   ```

### Issue: Echo Client Being Used Instead of Proxy

**Symptoms:** Responses echo user input instead of AI

**Fixes:**
1. Set `PROXY_BASE_URL` in `Config/Secrets.xcconfig`
2. Clean build: `⌘ + Shift + K`
3. Check CompositionRoot logs:
   ```swift
   AppLogger.info("LLM provider: \(client)", category: AppLogger.ai)
   // Should say "ProxyLLMClient" not "EchoLLMClient"
   ```

### Issue: Memory Leak During Streaming

**Symptoms:** App memory grows during long conversations

**Fixes:**
1. Cancel tasks properly:
   ```swift
   deinit {
       streamTask?.cancel()
   }
   ```
2. Don't accumulate large strings:
   ```swift
   // Bad: Keep entire conversation in memory
   var fullConversation = ""
   
   // Good: Store individual messages
   var messages: [Message] = []
   ```
3. Limit conversation history sent to LLM:
   ```swift
   let recentMessages = messages.suffix(20)  // Last 20 messages only
   ```

## Advanced Usage

### Custom Model Selection

```swift
enum LLMModel: String {
    case gpt4o = "openai/gpt-4o"
    case gpt4oMini = "openai/gpt-4o-mini"
    case claude = "anthropic/claude-3.7-sonnet"
    case gemini = "google/gemini-2.5-pro"
    
    var displayName: String {
        switch self {
        case .gpt4o: return "GPT-4o"
        case .gpt4oMini: return "GPT-4o Mini"
        case .claude: return "Claude 3.7"
        case .gemini: return "Gemini 2.5 Pro"
        }
    }
}

// Pass model to proxy
func streamResponse(messages: [LLMMessage], model: LLMModel) 
    -> AsyncThrowingStream<String, Error> {
    // Include model in request body
}
```

### Function Calling

```swift
struct FunctionDefinition {
    let name: String
    let description: String
    let parameters: [String: Any]
}

func streamWithFunctions(
    messages: [LLMMessage],
    functions: [FunctionDefinition]
) -> AsyncThrowingStream<String, Error> {
    // Include functions in request
    // Parse function call responses
    // Execute functions and continue conversation
}
```

### Conversation Context Management

```swift
func buildContextWindow(
    messages: [Message],
    maxTokens: Int = 4000
) -> [LLMMessage] {
    // Estimate tokens (rough: 1 token ≈ 4 chars)
    var totalChars = 0
    var contextMessages: [LLMMessage] = []
    
    // Always include system message
    if let systemMessage = messages.first(where: { $0.role == .system }) {
        contextMessages.append(LLMMessage(
            role: "system",
            content: systemMessage.content
        ))
        totalChars += systemMessage.content.count
    }
    
    // Add recent messages until limit
    for message in messages.reversed() {
        let charCount = message.content.count
        if totalChars + charCount > maxTokens * 4 {
            break
        }
        contextMessages.insert(
            LLMMessage(role: message.role.rawValue, content: message.content),
            at: 1  // After system message
        )
        totalChars += charCount
    }
    
    return contextMessages
}
```

## Related Modules

- [Networking](Networking.md) - HTTPClient for proxy calls
- [FeatureChat](FeatureChat.md) - Uses LLMClient for chat
- [architecture-overview.md](architecture-overview.md) - SSE streaming flow
- [migrations/supabase.md](migrations/supabase.md) - Deploy Edge Function

---

**Next steps:**
- Deploy Edge Function: [migrations/supabase.md](migrations/supabase.md)
- See [FeatureChat](FeatureChat.md) for UI integration
- Check [architecture-overview.md](architecture-overview.md) for streaming flow

