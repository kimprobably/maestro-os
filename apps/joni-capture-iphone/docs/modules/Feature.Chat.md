# FeatureChat Module

> **v2.0.**
> - `ChatViewModel` is `@Observable` + `@MainActor`. An extension file `ChatViewModel+Memory.swift` splits out the memory-context plumbing so the base file stays under 400 lines.
> - Chat input bars (`SAIInputBar`, `ChatView`, `ChatGPTStyleView`) are now hosted via `.safeAreaInset(edge: .bottom)` and pick up Liquid Glass via `SAIGlass`. The scroll view above uses `.saiScrollEdgeGlass(.bottom)` so messages stay legible where they meet the glass.
> - `ChatHistoryView` toolbar "New Chat" button replaced a custom `Circle` / `strokeBorder` composition with a standard `Label` + `Button`, which picks up Liquid Glass automatically on iOS 26.
> - `SupabaseMessageRepository.page()` filters by `user_id` for defense-in-depth against the SQL IDOR fix; chat deep links now require a valid `conversationId` UUID.
> - Memory context is sent to the LLM as a **separate delimited message**, not appended to the user's text — this matches the edge-function sanitization and keeps prompts auditable.

Chat interface with dual UI styles, streaming responses, and infinite scroll pagination.

## Purpose

**What FeatureChat owns:**
- Chat UI components (bubble style and centered style)
- `ChatViewModel` with streaming and state management
- `InfinitePaginator` for message history
- Conversation list (ChatHistoryView)
- UI style switcher (DualStyleChatView)

**What FeatureChat does NOT own:**
- LLM API calls (uses AI module)
- Message persistence (uses Storage module)
- Design tokens (uses DesignSystem)
- Authentication (uses Auth module)

## Public API

```swift
import FeatureChat

// Create ViewModel
let viewModel = ChatViewModel(
    conversationID: conversationID,
    messageRepository: messageRepository,
    llmClient: llmClient
)

// Bubble style (WhatsApp/iMessage)
ChatView(viewModel: viewModel, onRequireSubscription: nil)

// Centered style (ChatGPT)
ChatGPTStyleView(viewModel: viewModel, onRequireSubscription: nil)

// Both with switcher
DualStyleChatView(viewModel: viewModel, onRequireSubscription: nil)

// Conversation list
ChatHistoryView(
    viewModel: chatHistoryViewModel,
    onConversationTap: { conversationID in
        // Navigate to chat
    }
)
```

## Setup

No environment variables. Configuration via Composition Root.

### Dependency Injection

```swift
// In CompositionRoot.swift
func makeChatViewModel(conversationID: UUID) -> ChatViewModel {
    ChatViewModel(
        conversationID: conversationID,
        messageRepository: messageRepository,
        llmClient: llmClient
    )
}

func makeChatHistoryViewModel() -> ChatHistoryViewModel {
    ChatHistoryViewModel(
        conversationRepository: conversationRepository
    ) { [weak self] conversationID, style in
        guard let self = self else { return AnyView(EmptyView()) }
        
        switch style {
        case .bubbles:
            let vm = self.makeChatViewModel(conversationID: conversationID)
            return AnyView(ChatView(viewModel: vm))
        case .centered:
            let vm = self.makeChatViewModel(conversationID: conversationID)
            return AnyView(ChatGPTStyleView(viewModel: vm))
        }
    }
}
```

### Flags

None. UI style is selected at runtime.

## Common Customizations

> **Quick Start:** Copy these recipes to customize the chat experience. All follow MVVM pattern and use DesignSystem tokens.

### Change Chat Bubble Colors

**Task:** Make user bubbles purple gradient, AI bubbles light gray.

**Steps:**
1. Open `Packages/DesignSystem/Resources/DesignSystemColors.xcassets/`
2. Edit `BubbleUser.colorset` → Set to purple (#6C5CE7)
3. Edit `BubbleAssistant.colorset` → Set to light gray (#F5F5F5)
4. Build and run - all chat screens update automatically

**LLM Prompt:**
```
Change chat bubble colors to purple gradient for user messages and light gray for 
AI messages. Use DSColors.bubbleUser and DSColors.bubbleAssistant tokens. 
Follow the color system in docs/DesignSystem.md.
```

### Add Typing Indicator

**Task:** Show "AI is typing..." while waiting for response.

**Steps:**
1. Add to `ChatViewModel` (remember `ChatViewModel` is `@Observable` — no `@Published`):
```swift
var isAITyping = false

func sendMessage(_ text: String) async {
    // ... append user message ...
    isAITyping = true
    defer { isAITyping = false }

    // ... stream response ...
}
```

2. Add to ChatView:
```swift
if viewModel.isAITyping {
    HStack {
        Text("AI is typing")
        ProgressView()
    }
    .padding()
}
```

**LLM Prompt:**
```
Add a typing indicator that shows "AI is typing..." with animated dots while 
the AI is generating a response. Use DSColors and DSTypography. Show it below 
the message list in ChatView.
```

### Add Message Reactions

**Task:** Let users react to messages with emoji.

**Steps:**
1. Add to Message model:
```swift
@Model
public final class Message {
    // ... existing properties ...
    public var reactions: [String: Int] = [:]  // emoji: count
}
```

2. Add to MessageRow:
```swift
.contextMenu {
    Button("👍") { viewModel.addReaction(messageID: message.id, emoji: "👍") }
    Button("❤️") { viewModel.addReaction(messageID: message.id, emoji: "❤️") }
    Button("😂") { viewModel.addReaction(messageID: message.id, emoji: "😂") }
}
```

**LLM Prompt:**
```
Add emoji reactions to chat messages. Users should long-press a message to see 
reaction options (👍 ❤️ 😂 🎉). Store reactions in the Message model and display 
them below each message. Follow the SwiftData model pattern in docs/Storage.md.
```

### Limit Free User Messages

**Task:** Allow only 10 messages/day for free users.

**Steps:**
1. Add to ChatViewModel (remember it's `@Observable` — no `@Published`):
```swift
var messageLimit: MessageLimit?

func checkMessageLimit() async {
    let state = await paymentsClient.currentState()
    if !state.isSubscribed {
        let todayCount = try? await messageRepository.countToday(userID: currentUserID)
        if (todayCount ?? 0) >= 10 {
            messageLimit = MessageLimit(remaining: 0, total: 10)
        }
    }
}
```

2. Show limit reached UI and paywall trigger

**LLM Prompt:**
```
Implement message limits for free users: 10 messages/day. Show a banner when 
they reach 8/10, and show the paywall when limit reached. Track count per day 
using MessageRepository. Follow the paywall pattern in docs/FeatureSettings.md.
```

### Switch to Different Chat Style

**Task:** Change default from bubble to centered style.

**File:** `SwiftAIBoilerplatePro/AppShell/HomeView.swift`

```swift
// Find:
navigation Path.append(.chat(conversationID: id, style: .bubbles))

// Change to:
navigationPath.append(.chat(conversationID: id, style: .centered))
```

**LLM Prompt:**
```
Change the default chat UI style from bubble style to centered (ChatGPT) style. 
Update all navigation calls that create new chats. Maintain the ability to 
switch styles if using DualStyleChatView.
```

---

## Example: Send Message with Streaming in 3 Steps

### Step 1: Set Up Chat View

```swift
struct ContentView: View {
    @State var viewModel: ChatViewModel
    
    var body: some View {
        ChatView(
            viewModel: viewModel,
            onRequireSubscription: {
                // Show paywall if needed
            }
        )
    }
}
```

### Step 2: Send Message

```swift
// User types in input bar and taps send
// ChatView calls:
viewModel.sendMessage("Hello, how are you?")

// ViewModel handles:
// 1. Append the user message to the observable `messages` array
// 2. Start streaming from LLMClient
// 3. Update streamingMessageContent as chunks arrive
// 4. Save complete assistant message to Storage
```

### Step 3: Display Streaming Response

```swift
// ChatView automatically shows:
ForEach(viewModel.messages) { message in
    MessageRow(
        message: message,
        isStreaming: false
    )
}

// Show streaming bubble
if !viewModel.streamingMessageContent.isEmpty {
    MessageRow(
        message: Message(
            role: .assistant,
            content: viewModel.streamingMessageContent
        ),
        isStreaming: true
    )
}
```

**Expected result:**
1. User message appears instantly
2. Assistant response streams word-by-word
3. Streaming indicator shows progress
4. Complete message saved to history

## UI Styles

### Bubble Style (ChatView)

**Features:**
- Messages as rounded bubbles
- User messages on right (blue)
- Assistant messages on left (gray)
- Compact input bar at bottom
- Auto-scroll to latest message

**When to use:**
- Messaging-style apps
- Multi-turn conversations
- Familiar chat UX
- Compact mobile layout

**Preview:**
```
┌─────────────────────────────┐
│  ┌────────────────┐          │
│  │ Hello!         │          │
│  └────────────────┘          │
│                              │
│         ┌────────────────┐   │
│         │ Hi! How can I  │   │
│         │ help?          │   │
│         └────────────────┘   │
│ ┌─────────────────────────┐ │
│ │ Type message...      [>]│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Centered Style (ChatGPTStyleView)

**Features:**
- Full-width centered layout
- "You" and "Assistant" headers
- Large TextEditor for input
- Professional appearance
- Clean, document-like

**When to use:**
- Writing assistants
- Code generation tools
- Research/analysis apps
- Professional/productivity tools

**Preview:**
```
┌─────────────────────────────┐
│ You                          │
│ ──────────────────────────   │
│ Hello!                       │
│                              │
│ Assistant                    │
│ ──────────────────────────   │
│ Hi! How can I help you?      │
│                              │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │ Write your prompt...    │ │
│ │                         │ │
│ └─────────────────────────┘ │
│              [Send]          │
└─────────────────────────────┘
```

### Dual Style (DualStyleChatView)

**Features:**
- Style picker at top
- Switches between Bubble and Centered
- Same data, different presentation
- User preference saved

**When to use:**
- Give users choice
- Different use cases in same app
- Feature differentiation

## Customization

### Safe Changes

**Choose UI style:**
```swift
// Bubble only
return ChatView(viewModel: viewModel)

// Centered only
return ChatGPTStyleView(viewModel: viewModel)

// Both with switcher
return DualStyleChatView(viewModel: viewModel)
```

**Customize bubble colors:**
```swift
// In DesignSystem/DSColors.swift
public static var accentPrimary: Color  // User bubble color
public static var surface: Color        // Assistant bubble color
```

**Customize input placeholder:**
```swift
// In ChatView.swift
TextField("Type your message...", text: $inputText)

// In ChatGPTStyleView.swift
TextEditor(text: $promptText)
    .placeholder("Write your prompt here...")
```

**Add message actions:**
```swift
struct MessageRow: View {
    let message: Message
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(message.content)
            
            HStack {
                Button("Copy") {
                    UIPasteboard.general.string = message.content
                }
                Button("Share") {
                    // Share action
                }
            }
        }
    }
}
```

**Configure pagination:**
```swift
// In ChatViewModel
let paginator = InfinitePaginator(
    pageSize: 50,  // Messages per page
    source: messageSource
)
```

### Pitfalls

**Don't:**
- Put business logic in Views
- Make LLMClient calls directly from Views
- Forget to cancel streaming tasks on dismiss
- Block main thread during streaming
- Hardcode UI strings (support localization)

**Do:**
- Use ViewModels for all logic
- Handle cancellation properly
- Show loading/streaming states
- Test with EchoLLMClient first
- Respect accessibility settings

## Where Used

**ChatView:**
- Default chat interface
- Used in bubble-only configuration
- Part of DualStyleChatView

**ChatGPTStyleView:**
- Alternative chat interface
- Used in centered-only configuration
- Part of DualStyleChatView

**DualStyleChatView:**
- Main entry point with style switcher
- Used in HomeView for new chats
- Used in ChatHistoryView for existing conversations

**ChatHistoryView:**
- Conversation list screen
- Accessible from Home tab
- Shows all user conversations

**Example from HomeView:**
```swift
// AppShell/HomeView.swift
struct HomeView: View {
    let composition: CompositionRoot
    
    var body: some View {
        Button("Start Chat") {
            let conversation = createConversation()
            let chatView = composition.makeDualStyleChatView(
                conversationID: conversation.id,
                onRequireSubscription: {
                    showPaywall = true
                }
            )
            // Navigate to chatView
        }
    }
}
```

## Tests

### Run Tests

```bash
# All FeatureChat tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:FeatureChatTests

# Specific tests
-only-testing:FeatureChatTests/ChatViewModelTests
-only-testing:FeatureChatTests/InfinitePaginatorTests
```

### What's Covered

**ChatViewModel:**
- Send message flow
- Streaming response handling
- Message persistence
- Error handling
- Cancellation

**InfinitePaginator:**
- Load initial page
- Load more on scroll
- End reached detection
- Error retry
- Debouncing

**Views:**
- Snapshot tests for ChatView
- Snapshot tests for ChatGPTStyleView
- Bubble rendering (light/dark)
- Streaming indicators

**Coverage:** 85%+

### Example Test

```swift
import XCTest
@testable import FeatureChat

@MainActor
final class ChatViewModelTests: XCTestCase {
    func testSendMessage_addsUserMessageAndStreamsResponse() async throws {
        let mockLLM = MockLLMClient(response: "Hello!")
        let viewModel = ChatViewModel(
            conversationID: testID,
            messageRepository: MockMessageRepository(),
            llmClient: mockLLM
        )
        
        await viewModel.sendMessage("Hi")
        
        // User message added
        XCTAssertEqual(viewModel.messages.count, 1)
        XCTAssertEqual(viewModel.messages[0].content, "Hi")
        
        // Wait for streaming
        try await Task.sleep(nanoseconds: 100_000_000)
        
        // Assistant message added
        XCTAssertEqual(viewModel.messages.count, 2)
        XCTAssertEqual(viewModel.messages[1].content, "Hello!")
    }
}
```

## Troubleshooting

### Issue: Messages Not Loading

**Symptoms:** Empty chat view, no history

**Fixes:**
1. Check conversation ID is valid
2. Verify messageRepository is initialized
3. Check Storage module setup
4. Look for errors in logs:
   ```swift
   AppLogger.debug("Loading messages for: \(conversationID)")
   ```

### Issue: Streaming Not Working

**Symptoms:** No response or complete response appears at once

**Fixes:**
1. Verify LLMClient is ProxyLLMClient, not EchoLLMClient
2. Check PROXY_BASE_URL is set
3. Test Edge Function deployment
4. Check for streaming errors:
   ```swift
   do {
       for try await chunk in stream {
           // ...
       }
   } catch {
       print("Streaming error: \(error)")
   }
   ```

### Issue: UI Not Updating During Streaming

**Symptoms:** Response appears all at once after completion

**Fixes:**
1. `ChatViewModel` is already `@MainActor` + `@Observable`, so chunks can be applied inline:
   ```swift
   for try await chunk in stream {
       streamingText += chunk
   }
   ```
   Do not wrap the update in `MainActor.run {}` or reach for `DispatchQueue.main` — the Task inherits main-actor isolation.
2. Read properties directly in `body` — the `@Observable` macro handles re-renders. There is no `@Published` / `$`-prefixed binding on v2.0 ViewModels.
3. Store the ViewModel with `@State`:
   ```swift
   @State var viewModel: ChatViewModel  // @State, not let or @ObservedObject
   ```

### Issue: Memory Leak in Long Conversations

**Symptoms:** App crashes or slows down after many messages

**Fixes:**
1. Implement pagination (already included)
2. Limit message context sent to LLM:
   ```swift
   let recentMessages = messages.suffix(20)
   ```
3. Cancel tasks on dismiss:
   ```swift
   deinit {
       streamTask?.cancel()
   }
   ```

### Issue: Input Bar Covered by Keyboard

**Symptoms:** Keyboard hides input field

**Fixes:**
1. Use `.scrollDismissesKeyboard(.interactively)`
2. Add keyboard padding:
   ```swift
   .padding(.bottom, keyboardHeight)
   ```
3. Scroll to bottom when keyboard appears

**Note:** Both `ChatView` and `ChatGPTStyleView` support keyboard dismissal by tapping outside the input area. The message list has `.contentShape(Rectangle())` + `.onTapGesture { isInputFocused = false }` to enable tap-to-dismiss.

## Chat Limits Based on Subscription

### Free Tier Limits

By default, free users are limited to **10 messages per conversation**. This encourages upgrades while allowing trial usage.

**✨ This is fully customizable!** You can:
- Change the limit (e.g., 5, 20, 100 messages)
- Disable limits entirely
- Create custom limit logic (daily, monthly, per-user)
- Switch between per-conversation or global limits

**How it works:**
1. `ChatViewModel` checks `paymentsStatusProvider` before sending
2. Counts user messages in current conversation
3. Blocks send if limit reached and user not subscribed
4. Shows error: "Free limit reached. Upgrade to Pro for unlimited messages."

### Customizing Message Limits

**📍 Quick Reference:**
- **1-line change:** Edit `kFreeMessageLimit` constant → [Option 1](#option-1-change-the-limit-number)
- **Disable limits:** Pass `nil` to `paymentsStatusProvider` → [Option 2](#option-2-disable-limits-entirely)
- **Custom logic:** Implement `PaymentsStatusProvider` → [Option 3](#option-3-custom-limit-logic)
- **Global limits:** See [Per-App vs Per-Conversation](#per-app-vs-per-conversation-limits)

---

#### Option 1: Change the Limit Number

**Quick change (1 line):**

```swift
// In Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift
// Line ~7
private let kFreeMessageLimit = 20  // Change from 10 to 20
```

**Examples:**
- `5` - Very restrictive (forces quick upgrades)
- `10` - Default (balanced trial experience)
- `50` - Generous (extended trial)
- `100` - Very generous (almost unlimited trial)

#### Option 2: Disable Limits Entirely

**Allow unlimited free messages:**

```swift
// In your CompositionRoot where you create ChatViewModel
ChatViewModel(
    conversationID: conversationID,
    messageRepository: messageRepository,
    llmClient: llmClient,
    paymentsStatusProvider: nil  // ⚠️ Passing nil = no limits at all
)
```

**When to use:** If you want to monetize differently (ads, one-time purchase, etc.)

#### Option 3: Custom Limit Logic

```swift
// Create custom provider
final class CustomPaymentsProvider: PaymentsStatusProvider {
    func currentState() async -> PaymentsState {
        // Your custom logic
        let isSubscribed = checkCustomSubscriptionStatus()
        return PaymentsState(isSubscribed: isSubscribed)
    }
}

// Use in ChatViewModel
let customProvider = CustomPaymentsProvider()
ChatViewModel(
    conversationID: conversationID,
    messageRepository: messageRepository,
    llmClient: llmClient,
    paymentsStatusProvider: customProvider
)
```

### Integration with Payments Module

**Connect to RevenueCat:**

```swift
// In CompositionRoot.swift
import Payments
import FeatureChat

// Create adapter
let paymentsAdapter = PaymentsStatusAdapter(
    paymentsClient: paymentsClient
)

// Pass to ChatViewModel
func makeChatViewModel(conversationID: UUID) -> ChatViewModel {
    ChatViewModel(
        conversationID: conversationID,
        messageRepository: messageRepository,
        llmClient: llmClient,
        paymentsStatusProvider: paymentsAdapter  // Enable limits
    )
}
```

**The adapter bridges modules:**

```swift
// PaymentsStatusAdapter.swift (in Composition/)
final class PaymentsStatusAdapter: PaymentsStatusProvider {
    private let paymentsClient: PaymentsClient
    
    init(paymentsClient: PaymentsClient) {
        self.paymentsClient = paymentsClient
    }
    
    func currentState() async -> FeatureChat.PaymentsState {
        let state = await paymentsClient.currentState()
        return FeatureChat.PaymentsState(isSubscribed: state.isSubscribed)
    }
}
```

### Per-App vs Per-Conversation Limits

**Current:** Limits are per-conversation (10 messages in each chat).

**To make global limits:**

```swift
// Add to ChatViewModel
private static var globalMessageCount = 0

public func send() async {
    // Check global count instead
    if let provider = paymentsStatusProvider {
        let state = await provider.currentState()
        if !state.isSubscribed {
            if Self.globalMessageCount >= kFreeMessageLimit {
                errorMessage = "Free limit reached..."
                return
            }
        }
    }
    
    // After successful send
    Self.globalMessageCount += 1
}
```

**To persist across app launches:**

```swift
UserDefaults.standard.integer(forKey: "totalMessagesSent")
```

## Removed Features

### Pro Button (Removed)

**Previous behavior:** Chat views showed a "Pro" star button in top-right toolbar.

**Why removed:** Button looked like a "favorite" feature, causing confusion. No favoriting exists.

**If you need subscription prompts:**

```swift
// Show paywall when limit reached (already built-in)
// Or add custom UI in your composition:

struct ChatContainer: View {
    var body: some View {
        VStack {
            if !isSubscribed {
                SubscriptionBanner()
            }
            ChatView(viewModel: viewModel)
        }
    }
}
```

## Press Animations & Swipe Actions

### Chat Row Press Animation

Chat history rows use a **List-based implementation** with **swipe actions** for edit/delete and smooth press feedback.

**How it works:**
1. `List` + `ForEach` → Native swipe actions support
2. `@State var isPressed` tracks visual press feedback via `.onLongPressGesture`
3. Unified container: `.background()` → `.clipShape()` → `.compositingGroup()` → `.shadow()`
4. Scale/opacity applied to **entire clipped container** (not inner content)
5. Spring animation (response: 0.25, damping: 0.9) ensures smooth transitions
6. `.buttonStyle(.plain)` → No default button highlight
7. Delete requires confirmation (confirmation dialog at ChatHistoryView level)

**Modifier order (critical):**
```swift
.buttonStyle(.plain)                                     // 1. Disable default highlight
.clipShape(RoundedRectangle(..., style: .continuous))   // 2. Clip to rounded shape
.compositingGroup()                                      // 3. Flatten for shadow
.shadow(...)                                             // 4. Shadow on clipped shape
.scaleEffect(isPressed ? 0.97 : 1.0)                    // 5. Scale entire container
.animation(.spring(...), value: isPressed)               // 6. Animate press state
.onLongPressGesture(minimumDuration: 0.01, pressing: { isPressed = $0 }, perform: {})  // 7. Visual feedback only
.swipeActions(...)                                       // 8. Rename/delete actions
```

**Why List instead of ScrollView + VStack?**
- ✅ Native swipe actions support (no custom implementation needed)
- ✅ Better performance with large conversation lists
- ✅ Automatic keyboard dismissal on scroll
- ✅ Pull-to-refresh works seamlessly
- ✅ Delete animations handled by system

**Swipe Actions:**
- **Swipe right:** Rename (blue) → Shows alert with text field
- **Swipe left:** Delete (red) → Shows confirmation dialog
- **Delete confirmation:** Prevents accidental deletions

**Implementation Details:**

```swift
// ChatHistoryView level
@State private var deletingConversation: UUID?

// In List
ForEach(conversations) { conversation in
    ChatRowCard(...)
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                deletingConversation = conversation.id  // Triggers confirmation
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
}
.confirmationDialog("Delete this conversation?", isPresented: ...) {
    Button("Delete", role: .destructive) {
        await viewModel.deleteConversation(id: deletingConversation)
    }
}
```

**Customization:**

```swift
// In ChatHistoryView.swift - ChatRowCard

// Change press appearance
.scaleEffect(isPressed ? 0.95 : 1.0)  // More dramatic (from 0.97)
.opacity(isPressed ? 0.8 : 1.0)       // More fade (from 0.9)

// Change animation feel
.animation(.spring(response: 0.2, dampingFraction: 0.8), value: isPressed)

// Add/modify swipe actions
.swipeActions(edge: .leading) {
    Button { /* custom action */ } label: {
        Label("Action", systemImage: "star")
    }
    .tint(.purple)
}
```

**Values explained:**
- **Scale:** `0.97` = subtle (default), `0.95` = dramatic, `0.98` = barely noticeable
- **Opacity:** `0.9` = light fade (default), `0.7` = strong fade, `1.0` = no fade
- **Spring response:** `0.2` = snappy, `0.25` = smooth (default), `0.4` = slow
- **Damping:** `0.9` = no bounce (default), `0.7` = slight bounce, `0.5` = bouncy

**Why this pattern prevents square corners:**
- ✅ `.clipShape()` applied **before** scale → corners always rounded
- ✅ `.compositingGroup()` flattens to single layer → shadow respects clip
- ✅ `.onLongPressGesture` only for visual feedback → no gesture conflicts
- ✅ All transforms on outer container → background/content scale together
- ✅ `.continuous` corner style → premium smooth curves
- ✅ Button tap works reliably (no gesture interference)
- ✅ Works flawlessly in Debug and Release builds

## Advanced Usage

### Custom Message Types

```swift
enum MessageType {
    case text(String)
    case image(URL)
    case code(String, language: String)
}

struct RichMessage {
    let role: MessageRole
    let type: MessageType
    let timestamp: Date
}

// Render in MessageRow
switch message.type {
case .text(let content):
    Text(content)
case .image(let url):
    AsyncImage(url: url)
case .code(let code, let language):
    CodeBlock(code: code, language: language)
}
```

### Message Actions

```swift
struct MessageRow: View {
    let message: Message
    @State private var showActions = false
    
    var body: some View {
        HStack {
            Text(message.content)
            
            if showActions {
                Button("Copy") { copy() }
                Button("Regenerate") { regenerate() }
                Button("Edit") { edit() }
            }
        }
        .onLongPressGesture {
            showActions = true
        }
    }
}
```

### Typing Indicators

```swift
// ChatViewModel is @Observable — no @Published required
var isTyping = false

func showTypingIndicator() {
    isTyping = true

    Task {
        try await Task.sleep(for: .seconds(2))
        isTyping = false
    }
}

// In View
if viewModel.isTyping {
    TypingIndicator()
}
```

### Voice Input

```swift
import Speech

class VoiceInputManager {
    func startRecording() async throws -> String {
        // Request permission
        // Start audio engine
        // Recognize speech
        // Return transcription
    }
}

// In ViewModel
func sendVoiceMessage() async {
    do {
        let transcription = try await voiceInput.startRecording()
        sendMessage(transcription)
    } catch {
        // Handle error
    }
}
```

## Related Modules

- [AI](AI.md) - LLMClient for streaming responses
- [Storage](Storage.md) - Message persistence
- [DesignSystem](DesignSystem.md) - UI components and tokens
- [architecture-overview.md](architecture-overview.md) - Chat flow diagram

**Full UI guide:** `Packages/FeatureChat/CHAT_UI_STYLES.md`

---

**Next steps:**
- Choose UI style: Bubble, Centered, or Both
- See [AI](AI.md) for streaming details
- Check [Storage](Storage.md) for persistence
- Read full UI guide: `Packages/FeatureChat/CHAT_UI_STYLES.md`

