# Storage Module

Data persistence with SwiftData models and Keychain for secure token storage.

> **💡 Cloud Sync Available:** This module includes optional Supabase sync for conversations and messages. See [CHAT_SYNC_SETUP.md](../CHAT_SYNC_SETUP.md) for cross-device sync setup.

> **v2.0 — `@MainActor` repositories.** `MessageRepositoryImpl`, `ConversationRepositoryImpl`, and `SettingsRepositoryImpl` are now pinned to `@MainActor` (P0 data-race fix). `ModelContext` is not thread-safe, and the old `nonisolated(unsafe)` annotation has been removed. **Creating or calling these repositories from non-main code requires `await`.** Public APIs and method signatures are unchanged — only the isolation is. `SupabaseMessageRepository.page()` now filters by `user_id` for defense-in-depth against the IDOR fix shipped in the same release.

## Purpose

**What Storage owns:**
- SwiftData models: `Conversation`, `Message`, `Settings`
- Repository protocols and implementations
- `KeychainStore` for secure credential storage
- Data migrations
- Batch operations
- Optional Supabase sync (hybrid repositories)

**What Storage does NOT own:**
- Business logic (lives in ViewModels)
- Network calls (see Networking)
- UI (see DesignSystem)
- API types (DTOs live in calling modules)

## Public API

```swift
import Storage

// SwiftData models
let conversation = Conversation(title: "New Chat")
let message = Message(
    role: .user, 
    content: "Hello!", 
    conversationID: conversation.id
)
let settings = Settings(theme: .aurora)

// Repositories
let conversations = try await conversationRepository.fetchAll()
try await messageRepository.save(message)
try await settingsRepository.update { $0.theme = .dark }

// Keychain
try keychainStore.save("secret_token", forKey: "auth_token")
let token = try keychainStore.load(forKey: "auth_token")
```

## Setup

### Environment Variables

None. Storage configuration happens in `CompositionRoot`.

### Dependency Injection

```swift
// In CompositionRoot.swift
let schema = Schema([
    Conversation.self,
    Message.self,
    Settings.self
])

let modelConfiguration = ModelConfiguration(
    schema: schema,
    isStoredInMemoryOnly: false  // false = persisted to disk
)

self.modelContainer = try ModelContainer(
    for: schema,
    configurations: [modelConfiguration]
)

let mainContext = modelContainer.mainContext

// Create repositories
self.conversationRepository = ConversationRepositoryImpl(
    modelContext: mainContext
)
self.messageRepository = MessageRepositoryImpl(
    modelContext: mainContext
)
self.settingsRepository = SettingsRepositoryImpl(
    modelContext: mainContext
)

// Create keychain
self.keychainStore = KeychainStore(accessGroup: nil)
```

### Flags

**In-memory storage (testing):**
```swift
let modelConfiguration = ModelConfiguration(
    schema: schema,
    isStoredInMemoryOnly: true  // Data not persisted
)
```

## Example: Save and Load Messages in 3 Steps

### Step 1: Create and Save Message

```swift
import Storage

func sendMessage(_ text: String, conversationID: UUID) async throws {
    let message = Message(
        role: .user,
        content: text,
        conversationID: conversationID
    )
    
    try await messageRepository.save(message)
}
```

**Expected result:**
```swift
try await sendMessage("Hello!", conversationID: conversation.id)
// Message saved to SwiftData store
```

### Step 2: Load Messages for Conversation

```swift
func loadMessages(conversationID: UUID) async throws -> [Message] {
    return try await messageRepository.fetchAll(conversationID: conversationID)
}
```

**Expected result:**
```swift
let messages = try await loadMessages(conversationID: conversation.id)
print(messages.count)  // All messages for this conversation
```

### Step 3: Update Existing Message

```swift
func updateMessage(id: UUID, newContent: String) async throws {
    guard let message = try await messageRepository.fetch(id: id) else {
        throw StorageError.notFound
    }
    
    message.content = newContent
    message.updatedAt = Date()
    
    try await messageRepository.save(message)
}
```

**Expected result:**
```swift
try await updateMessage(id: messageID, newContent: "Updated text")
// Message content updated in storage
```

## Common Customizations

> **Quick Start:** These recipes show how to extend data models and storage. All follow the repository pattern.

### Add a New SwiftData Model

**Task:** Add a "SavedPrompt" feature for favorite prompts.

**Steps:**
1. Create model in `Packages/Storage/Sources/Storage/Models/`:
```swift
import SwiftData
import Foundation

@Model
public final class SavedPrompt {
    @Attribute(.unique) public var id: UUID
    public var title: String
    public var content: String
    public var createdAt: Date
    public var category: String?
    
    public init(title: String, content: String, category: String? = nil) {
        self.id = UUID()
        self.title = title
        self.content = content
        self.createdAt = Date()
        self.category = category
    }
}
```

2. Add to schema in CompositionRoot:
```swift
let schema = Schema([
    Conversation.self,
    Message.self,
    Settings.self,
    SavedPrompt.self  // Add here
])
```

3. Create repository following the pattern

**LLM Prompt:**
```
Add a SavedPrompt model to store user's favorite prompts. Include title, content, 
category, and createdAt fields. Create SavedPromptRepository following the pattern 
in ConversationRepository. Add to CompositionRoot schema. Follow the SwiftData 
patterns in docs/Storage.md.
```

### Enable Chat History Sync

**Task:** Sync conversations and messages across devices via Supabase.

**Follow:** [CHAT_SYNC_SETUP.md](CHAT_SYNC_SETUP.md) for complete guide.

**Quick steps:**
1. Run migration: `supabase/migrations/20241016000000_chat_sync.sql`
2. Set `FeatureFlags.chatSyncEnabled = true`
3. Uncomment Supabase repositories in Storage package
4. Wire up in CompositionRoot

**LLM Prompt:**
```
Enable Supabase chat sync following docs/CHAT_SYNC_SETUP.md. Run the migration, 
uncomment SupabaseConversationRepository and SupabaseMessageRepository, set the 
feature flag to true, and wire up HybridRepositories in CompositionRoot. Verify 
offline-first behavior is maintained.
```

### Add Data Export

**Task:** Let users export their chat history.

**Steps:**
1. Add to ConversationRepository:
```swift
func exportAll(format: ExportFormat) async throws -> Data {
    let conversations = try await list(limit: 1000, after: nil)
    // Convert to JSON or CSV
    return encoded Data
}
```

2. Add export button to ProfileView
3. Use FileExporter to save

**LLM Prompt:**
```
Add a "Download My Data" feature that exports all conversations and messages as 
JSON. Add an export button in ProfileView. Use ShareLink or FileExporter to let 
users save the file. Follow GDPR best practices for data export. Use the repository 
pattern from docs/Storage.md.
```

---

## Customization

### Safe Changes

**Add custom model:**
```swift
import SwiftData

@Model
public final class MyCustomModel {
    @Attribute(.unique) public var id: UUID
    public var name: String
    public var createdAt: Date
    
    public init(id: UUID = UUID(), name: String, createdAt: Date = Date()) {
        self.id = id
        self.name = name
        self.createdAt = createdAt
    }
}

// Add to schema in CompositionRoot
let schema = Schema([
    Conversation.self,
    Message.self,
    Settings.self,
    MyCustomModel.self  // Add this
])
```

**Add repository:**
```swift
public protocol MyCustomRepository {
    func fetchAll() async throws -> [MyCustomModel]
    func save(_ model: MyCustomModel) async throws
    func delete(id: UUID) async throws
}

@MainActor
public final class MyCustomRepositoryImpl: MyCustomRepository {
    private let modelContext: ModelContext
    
    public init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    public func fetchAll() async throws -> [MyCustomModel] {
        let descriptor = FetchDescriptor<MyCustomModel>()
        return try modelContext.fetch(descriptor)
    }
    
    public func save(_ model: MyCustomModel) async throws {
        modelContext.insert(model)
        try modelContext.save()
    }
    
    public func delete(id: UUID) async throws {
        let descriptor = FetchDescriptor<MyCustomModel>(
            predicate: #Predicate { $0.id == id }
        )
        let models = try modelContext.fetch(descriptor)
        for model in models {
            modelContext.delete(model)
        }
        try modelContext.save()
    }
}
```

**Add Keychain keys:**
```swift
extension KeychainStore.Keys {
    static let myCustomToken = "my_custom_token"
    static let myCustomSecret = "my_custom_secret"
}

// Use
try keychainStore.save(token, forKey: KeychainStore.Keys.myCustomToken)
let token = try keychainStore.load(forKey: KeychainStore.Keys.myCustomToken)
```

**Add migration:**
```swift
// When changing model schema
@Model
public final class Message {
    // Old schema:
    // public var content: String
    
    // New schema (v2):
    public var content: String
    public var metadata: [String: String]?  // New field
    
    // SwiftData handles lightweight migrations automatically
    // For complex migrations, implement SchemaMigrationPlan
}
```

### Pitfalls

**Don't:**
- Access ModelContext directly from Views
- Perform SwiftData operations off main actor
- Store sensitive data in SwiftData (use Keychain)
- Create model instances without Repository
- Forget to call `modelContext.save()`

**Do:**
- Always use repositories from ViewModels
- Mark repositories @MainActor
- Use Keychain for tokens, passwords, API keys
- Handle `StorageError` appropriately
- Test with in-memory storage for unit tests

## Where Used

**Conversation Repository:**
- `FeatureChat/ChatHistoryViewModel` - List all conversations
- `HomeViewModel` - Recent conversations
- `CompositionRoot` - Factory for chat views

**Message Repository:**
- `FeatureChat/ChatViewModel` - Load/save messages
- `FeatureChat/InfinitePaginator` - Pagination source

**Settings Repository:**
- `FeatureSettings/SettingsViewModel` - Load/save user preferences
- `ProfileViewModel` - Theme selection

**KeychainStore:**
- `Auth` module - Store access/refresh tokens
- `Networking/AuthInterceptor` - Load token for requests
- `CompositionRoot` - Token provider initialization

**Example from FeatureChat:**
```swift
// FeatureChat/ChatViewModel.swift
import Storage

@Observable
@MainActor
final class ChatViewModel {
    var messages: [Message] = []

    private let messageRepository: any MessageRepository
    private let conversationID: UUID

    func loadMessages() async {
        do {
            // messageRepository is @MainActor; the call runs inline on the main actor.
            self.messages = try await messageRepository.fetchAll(
                conversationID: conversationID
            )
        } catch {
            // Handle error
        }
    }
}
```

## Tests

### Run Tests

```bash
# All storage tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:StorageTests

# Specific test files
-only-testing:StorageTests/ConversationRepositoryTests
-only-testing:StorageTests/MessageRepositoryTests
-only-testing:StorageTests/KeychainStoreTests
-only-testing:StorageTests/MigrationTests
```

### What's Covered

**Repositories:**
- CRUD operations (create, read, update, delete)
- Fetch with predicates (filtering)
- Sorting and pagination
- Error handling (not found, constraint violations)
- Batch operations

**Keychain:**
- Save/load/delete operations
- Key uniqueness
- Error handling (item not found)
- Access control
- Data encoding/decoding

**Models:**
- Relationships (conversation ↔ messages)
- Unique constraints
- Default values
- Date handling

**Migrations:**
- Lightweight schema changes
- Data preservation
- Version upgrades

**Coverage:** 90%+ (data layer is critical)

### Example Test

```swift
import XCTest
@testable import Storage

@MainActor
final class MessageRepositoryTests: XCTestCase {
    var repository: MessageRepository!
    var modelContext: ModelContext!
    
    override func setUp() async throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(
            for: Message.self,
            configurations: [config]
        )
        modelContext = container.mainContext
        repository = MessageRepositoryImpl(modelContext: modelContext)
    }
    
    func testFetchAll_returnsOnlyMessagesForConversation() async throws {
        let conv1 = UUID()
        let conv2 = UUID()
        
        try await repository.save(Message(role: .user, content: "1", conversationID: conv1))
        try await repository.save(Message(role: .user, content: "2", conversationID: conv1))
        try await repository.save(Message(role: .user, content: "3", conversationID: conv2))
        
        let messages = try await repository.fetchAll(conversationID: conv1)
        
        XCTAssertEqual(messages.count, 2)
        XCTAssertTrue(messages.allSatisfy { $0.conversationID == conv1 })
    }
}
```

## Troubleshooting

### Issue: "Model not found in schema"

**Symptoms:** Runtime crash when accessing model

**Fixes:**
1. Verify model is in schema:
   ```swift
   let schema = Schema([
       Conversation.self,
       Message.self,
       Settings.self,
       YourModel.self  // Make sure it's here
   ])
   ```
2. Clean build: `⌘ + Shift + K`
3. Check model has `@Model` macro

### Issue: "Failed to save" Errors

**Symptoms:** Save operations throw errors

**Fixes:**
1. Check for constraint violations:
   ```swift
   @Attribute(.unique) public var id: UUID  // Must be unique
   ```
2. Verify all required fields have values
3. Check modelContext is on main actor:
   ```swift
   @MainActor
   func save(_ model: Model) async throws {
       // ...
   }
   ```
4. Call `modelContext.save()` after changes

### Issue: Keychain Item Not Found

**Symptoms:** `KeychainStore.load()` throws `itemNotFound`

**Fixes:**
1. Verify key was saved first:
   ```swift
   try keychainStore.save("value", forKey: "key")
   let value = try keychainStore.load(forKey: "key")
   ```
2. Check key spelling (case-sensitive)
3. Keychain is cleared when app is uninstalled
4. Use `loadOptional()` if item may not exist:
   ```swift
   let token = try? keychainStore.load(forKey: "token")
   ```

### Issue: Migration Failure

**Symptoms:** App crashes after schema change

**Fixes:**
1. For breaking changes, implement `SchemaMigrationPlan`
2. Delete app and reinstall (dev only)
3. Test migrations before release:
   ```swift
   // Create test with old schema
   // Run migration
   // Verify data integrity
   ```
4. Back up data before complex migrations

### Issue: Memory Growth with Large Datasets

**Symptoms:** App uses too much memory when loading many models

**Fixes:**
1. Use pagination:
   ```swift
   let descriptor = FetchDescriptor<Message>(
       predicate: #Predicate { $0.conversationID == id },
       sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
   )
   descriptor.fetchLimit = 50  // Load in batches
   ```
2. Use fetch requests instead of loading all:
   ```swift
   let count = try modelContext.fetchCount(descriptor)
   ```
3. Delete old data periodically
4. Use background context for large operations

## Advanced Usage

### Batch Operations

```swift
func deleteOldMessages(olderThan date: Date) async throws {
    let descriptor = FetchDescriptor<Message>(
        predicate: #Predicate { $0.createdAt < date }
    )
    
    let oldMessages = try modelContext.fetch(descriptor)
    
    for message in oldMessages {
        modelContext.delete(message)
    }
    
    try modelContext.save()
}
```

### Complex Queries

```swift
func searchMessages(query: String, conversationID: UUID) async throws -> [Message] {
    let descriptor = FetchDescriptor<Message>(
        predicate: #Predicate { message in
            message.conversationID == conversationID &&
            message.content.localizedStandardContains(query)
        },
        sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
    )
    
    return try modelContext.fetch(descriptor)
}
```

### Relationships

```swift
@Model
public final class Conversation {
    @Relationship(deleteRule: .cascade, inverse: \Message.conversation)
    public var messages: [Message]?
    
    // When conversation is deleted, messages are automatically deleted
}

@Model
public final class Message {
    public var conversation: Conversation?
}
```

### Background Context

```swift
func performHeavyOperation() async throws {
    // Create background context
    let backgroundContext = ModelContext(modelContainer)
    
    await backgroundContext.perform {
        // Heavy operation on background
        let descriptor = FetchDescriptor<Message>()
        let messages = try backgroundContext.fetch(descriptor)
        
        // Process messages...
        
        try backgroundContext.save()
    }
}
```

### Keychain Access Control

```swift
// Require biometric authentication to access
let keychainStore = KeychainStore(
    accessGroup: nil,
    accessControl: .userPresence  // Touch ID / Face ID required
)

try keychainStore.save(sensitiveData, forKey: "sensitive_key")

// Access requires biometric authentication
let data = try keychainStore.load(forKey: "sensitive_key")
```

## Related Modules

- [Core](Core.md) - Uses AppError for error handling
- [Networking](Networking.md) - KeychainTokenProvider for auth
- [FeatureChat](FeatureChat.md) - Uses repositories for messages
- [FeatureSettings](FeatureSettings.md) - Uses Settings repository
- [architecture-overview.md](architecture-overview.md) - Shows Storage in system

---

**Next steps:**
- See [FeatureChat](FeatureChat.md) for repository usage examples
- Check [Auth](Auth.md) for Keychain token storage
- Explore [architecture-overview.md](architecture-overview.md) for data flow

