# Chat History Sync - Complete Setup Guide

This guide explains how to enable Supabase backend sync for chat history (conversations and messages) so they sync across all user devices.

## Overview

The boilerplate includes a **production-ready chat sync system** with:

✅ **Offline-First** - Chat works without internet, syncs when online  
✅ **Hybrid Architecture** - Local SwiftData + optional Supabase sync  
✅ **Automatic Sync** - Background sync from other devices  
✅ **Conflict Resolution** - Last-write-wins strategy  
✅ **Graceful Fallback** - If sync fails, chat still works locally  
✅ **Feature Flag** - Easy to enable/disable  
✅ **Zero Breaking Changes** - Works locally by default  

---

## How It Works (Current State)

### Default: Local-Only Storage

**By default (no setup required):**
- ✅ Conversations save to SwiftData (on-device)
- ✅ Messages save to SwiftData (on-device)  
- ✅ Fast and reliable
- ✅ Works offline
- ❌ No sync across devices
- ❌ Data lost if app deleted

### Optional: Supabase Sync

**When enabled:**
- ✅ Writes to local SwiftData first (fast, offline-capable)
- ✅ Syncs to Supabase in background (cross-device)
- ✅ Pulls data from Supabase on app launch (get updates from other devices)
- ✅ If sync fails, chat still works (graceful degradation)
- ✅ Persistent across devices and app reinstalls

---

## Architecture

### Hybrid Repository Pattern

```
User Action (Create/Read/Update/Delete)
    ↓
HybridRepository (Coordinator)
    ↓
    ├─→ Local SwiftData (Always, Fast)
    │   ✓ Immediate UI update
    │   ✓ Offline support
    │
    └─→ Remote Supabase (Background, Optional)
        ✓ Sync to backend
        ✓ Pull from other devices
        ✓ Fails gracefully
```

### Components

```
Storage Package/
├── Repositories/
│   ├── ConversationRepository.swift           (Protocol)
│   ├── ConversationRepositoryImpl.swift       (SwiftData - local)
│   ├── SupabaseConversationRepository.swift   (Supabase - remote)
│   ├── HybridConversationRepository.swift     (Hybrid coordinator)
│   │
│   ├── MessageRepository.swift                (Protocol)
│   ├── MessageRepositoryImpl.swift            (SwiftData - local)
│   ├── SupabaseMessageRepository.swift        (Supabase - remote)
│   └── HybridMessageRepository.swift          (Hybrid coordinator)
│
└── DTOs/
    ├── ConversationDTO.swift
    └── MessageDTO.swift
```

---

## Enable Supabase Chat Sync

Follow these steps to enable cloud sync for chat history.

### Step 1: Run Database Migration

The migration creates tables and security policies for conversations and messages.

**Option A: Using Supabase CLI (Recommended)**

```bash
cd supabase
supabase db push --include-all
```

**Option B: Manual Migration**

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of:
   ```
   supabase/migrations/20241016000000_chat_sync.sql
   ```
4. Click **Run**
5. Verify tables created: `conversations` and `messages`

### Step 2: Verify Database Schema

Check that tables exist:

```sql
-- In Supabase SQL Editor
SELECT * FROM conversations LIMIT 1;
SELECT * FROM messages LIMIT 1;
```

Should return empty results (no errors).

### Step 3: Verify Row Level Security

Check that policies are active:

```sql
-- View policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('conversations', 'messages');
```

Should show 8 policies total (4 per table: SELECT, INSERT, UPDATE, DELETE).

### Step 4: Add Supabase Dependency to Storage Package

**Edit `Packages/Storage/Package.swift`:**

```swift
let package = Package(
    name: "Storage",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "Storage",
            targets: ["Storage"]
        )
    ],
    dependencies: [
        .package(path: "../Core"),
        .package(path: "../Networking"),
        // Add Supabase dependency:
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
    ],
    targets: [
        .target(
            name: "Storage",
            dependencies: [
                "Core",
                "Networking",
                // Add Supabase here:
                .product(name: "Supabase", package: "supabase-swift")
            ]
        ),
        .testTarget(
            name: "StorageTests",
            dependencies: ["Storage"]
        )
    ]
)
```

### Step 5: Enable Supabase Repository Implementations

**Edit `Packages/Storage/Sources/Storage/Repositories/SupabaseConversationRepository.swift`:**

Uncomment:
```swift
// Change:
// import Supabase  // ← Uncomment when Supabase dependency is added

// To:
import Supabase

// Then remove /* and */ to uncomment the entire class
```

**Edit `Packages/Storage/Sources/Storage/Repositories/SupabaseMessageRepository.swift`:**

Same as above - uncomment Supabase import and uncomment the class.

### Step 6: Enable Feature Flag

**Edit `SwiftAIBoilerplatePro/Composition/FeatureFlags.swift`:**

```swift
public static var chatSyncEnabled: Bool {
    #if DEBUG
    return true  // ← Change to true for testing
    #else
    return ProcessInfo.processInfo.environment["CHAT_SYNC_ENABLED"] == "true"
    #endif
}
```

**Or use environment variable (production):**

```bash
# Add to Xcode scheme environment variables:
CHAT_SYNC_ENABLED = true
```

### Step 7: Wire Up in CompositionRoot

**Edit `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`:**

Find this section:

```swift
// 4a. Chat Sync Repositories (hybrid: local + optional remote)
if FeatureFlags.chatSyncEnabled && !shouldUseMock {
    AppLogger.info("Chat sync enabled - using hybrid repositories", category: AppLogger.storage)
    // TODO: Uncomment when Supabase is configured
    // let remoteConversationRepo = SupabaseConversationRepository(...)
```

Uncomment the implementation (requires getting Supabase client from SessionManager):

```swift
if FeatureFlags.chatSyncEnabled && !shouldUseMock {
    AppLogger.info("Chat sync enabled - using hybrid repositories", category: AppLogger.storage)
    
    // Get current user ID and Supabase client
    if let currentUser = await sessionManager.currentUser(),
       let sessionManager = (self.sessionManager as? SessionManagerWrapper) {
        let supabaseClient = sessionManager.getSupabaseClient()
        
        let remoteConversationRepo = SupabaseConversationRepository(
            supabaseClient: supabaseClient,
            userId: currentUser.id
        )
        let remoteMessageRepo = SupabaseMessageRepository(
            supabaseClient: supabaseClient,
            userId: currentUser.id
        )
        
        self.conversationRepository = HybridConversationRepository(
            local: localConversationRepo,
            remote: remoteConversationRepo
        )
        self.messageRepository = HybridMessageRepository(
            local: localMessageRepo,
            remote: remoteMessageRepo
        )
    } else {
        // No user logged in yet, use local-only
        self.conversationRepository = localConversationRepo
        self.messageRepository = localMessageRepo
    }
}
```

**Note:** You'll need to expose the Supabase client from SessionManagerWrapper:

```swift
// In SessionManagerWrapper class
func getSupabaseClient() -> SupabaseClient {
    return sessionManager.supabaseClient
}
```

### Step 8: Test It!

1. **Test Sync Works:**
   - Run app on Device A
   - Create a conversation
   - Send some messages
   - Open Supabase Dashboard → Database → conversations table
   - You should see your conversation!

2. **Test Cross-Device Sync:**
   - Run app on Device B (same user)
   - Pull to refresh chat history
   - Conversation from Device A should appear!

3. **Test Offline:**
   - Turn off WiFi
   - Create conversation/send messages
   - Works locally ✅
   - Turn WiFi back on
   - Background sync happens automatically ✅

---

## How Sync Works

### Write Operations (Create, Update, Delete)

```
1. User action (e.g., create conversation)
   ↓
2. HybridRepository receives request
   ↓
3. Write to local SwiftData FIRST
   ↓  (UI updates immediately - fast!)
4. Return success to user
   ↓
5. Background Task: Sync to Supabase
   ↓
   ├─ Success: Logged, nothing else needed
   └─ Failure: Logged, local data preserved
```

**Result:** User always gets fast response, sync happens in background.

### Read Operations (List, Fetch)

```
1. User opens chat history
   ↓
2. HybridRepository fetches from local SwiftData
   ↓
3. Return local data immediately (fast!)
   ↓
4. Background Task: Fetch from Supabase
   ↓
5. Compare with local data
   ↓
6. Merge new items from remote
   ↓
7. UI updates automatically via @Observable
```

**Result:** User sees local data instantly, remote updates appear shortly after.

### Conflict Resolution

**Strategy: Last-Write-Wins**

```swift
if remote.updatedAt > local.updatedAt {
    // Remote is newer - update local
    updateLocal(from: remote)
} else {
    // Local is newer - keep local
    // (will sync to remote on next write)
}
```

Simple and effective for most use cases.

---

## Database Schema

### Conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    persona_name TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    device_id TEXT,
    synced_at TIMESTAMPTZ
);
```

**Indexes:**
- `user_id` - Fast lookup of user's conversations
- `updated_at DESC` - Sorted by most recent
- `(user_id, updated_at DESC)` - Combined for efficient queries

### Messages Table

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    device_id TEXT,
    synced_at TIMESTAMPTZ
);
```

**Indexes:**
- `conversation_id` - Fast lookup of messages in conversation
- `timestamp DESC` - Chronological ordering
- `(conversation_id, timestamp ASC)` - Efficient pagination

### Row Level Security

**All tables protected:**
- Users can only see/modify their own data
- `auth.uid()` automatically enforced
- No way to access other users' chats

---

## Performance Considerations

### Local-First Design

**Why it's fast:**
1. All reads from local SwiftData (milliseconds)
2. All writes to local first (immediate UI update)
3. Remote sync happens in background (non-blocking)
4. No loading spinners needed

### Sync Behavior

**When sync happens:**
- ✅ On app launch (pull remote changes)
- ✅ After each write (push local changes)
- ✅ On pull-to-refresh (manual sync trigger)
- ❌ NOT on every read (would be slow)

**Sync is smart:**
- Only syncs on initial list load (not pagination)
- Uses Task for background execution
- Errors don't block user
- Local data always available

### Data Size Management

**For large chat histories:**

```sql
-- Optional: Clean up old conversations (90+ days)
SELECT cleanup_old_conversations(90);

-- Returns number of conversations deleted
```

Add this to a maintenance script or let users manage it.

---

## Migration Guide

### Migrating Existing Local Data to Supabase

If users already have local chat history and you enable sync:

**Option 1: Fresh Start (Simple)**
- Enable sync
- New chats sync automatically
- Old local chats stay on device only

**Option 2: Migrate Existing Data (Advanced)**

Add a migration function to HybridConversationRepository:

```swift
func migrateLocalToRemote() async throws {
    let localConversations = try await local.list(limit: 1000, after: nil)
    
    for conversation in localConversations {
        do {
            // Upload each conversation
            _ = try await remote?.create(
                title: conversation.title,
                personaName: conversation.personaName
            )
            
            // Upload its messages
            let messages = try await local.page(
                conversationID: conversation.id,
                after: nil,
                limit: 1000
            )
            
            for message in messages.items {
                _ = try await remoteMessageRepo?.append(
                    conversationID: conversation.id,
                    role: message.role,
                    text: message.text,
                    createdAt: message.createdAt
                )
            }
            
        } catch {
            AppLogger.error("Failed to migrate conversation \(conversation.id): \(error)")
        }
    }
}
```

Call this once after enabling sync:

```swift
// In app startup or settings
Task {
    try await composition.conversationRepository.migrateLocalToRemote()
}
```

---

## API Reference

### ConversationRepository Protocol

```swift
protocol ConversationRepository: Sendable {
    /// Create new conversation
    func create(title: String, personaName: String?) async throws -> ConversationDTO
    
    /// Rename existing conversation
    func rename(id: UUID, title: String) async throws
    
    /// Delete conversation (and all its messages via CASCADE)
    func delete(id: UUID) async throws
    
    /// List conversations with pagination
    func list(limit: Int, after: Date?) async throws -> [ConversationDTO]
}
```

### MessageRepository Protocol

```swift
protocol MessageRepository: Sendable {
    /// Append message to conversation
    func append(conversationID: UUID, role: MessageDTO.Role, text: String, createdAt: Date) async throws -> MessageDTO
    
    /// Fetch messages with cursor-based pagination
    func page(conversationID: UUID, after: MessageCursor?, limit: Int) async throws -> (items: [MessageDTO], next: MessageCursor?)
    
    /// Delete all messages in conversation
    func deleteAll(in conversationID: UUID) async throws
    
    /// Delete specific messages by ID
    func batchDelete(messageIDs: [UUID]) async throws
}
```

### HybridConversationRepository

```swift
/// Hybrid repository with local + remote sync
init(
    local: ConversationRepository,  // SwiftData implementation
    remote: ConversationRepository? // Supabase implementation (optional)
)
```

**Behavior:**
- All methods write to local first
- Then sync to remote in background
- Reads always from local (with background sync)

---

## Troubleshooting

### Chat Not Syncing

**Checklist:**
1. ✅ Migration run successfully?
2. ✅ Tables exist in Supabase?
3. ✅ RLS policies configured?
4. ✅ Supabase dependency added to Package.swift?
5. ✅ Implementations uncommented?
6. ✅ `FeatureFlags.chatSyncEnabled = true`?
7. ✅ CompositionRoot wired up correctly?
8. ✅ User is authenticated?

**Check logs:**
```swift
// Look for these log messages:
"Chat sync enabled - using hybrid repositories"  // ✅ Good
"Chat sync disabled - using local-only repositories"  // ❌ Still disabled
"Synced new conversation to remote"  // ✅ Sync working
"Failed to sync conversation to remote"  // ❌ Sync failing
```

### RLS Policy Errors

**Error:** "new row violates row-level security policy"

**Solution:** Verify policies allow INSERT:

```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'conversations';

-- Re-run migration if policies missing
```

### Duplicate Messages

**Cause:** Message created locally and on remote with same ID

**Prevention:** The hybrid repository already handles this:
- Local write uses local ID
- Remote write uses same ID
- Conflict resolution picks one

### Slow Performance

**Cause:** Syncing too much data on every read

**Solution:** Sync is already optimized:
- Only syncs on initial load (not pagination)
- Runs in background Task
- Doesn't block UI

**Optional:** Reduce sync frequency:

```swift
// In HybridConversationRepository.list()
if after == nil && !hasSyncedThisSession {
    // Only sync once per app session
    Task { await syncFromRemote() }
    hasSyncedThisSession = true
}
```

### Data Not Appearing on Other Device

**Debugging:**

1. **Check Supabase Dashboard:**
   - Database → conversations table
   - Is data there? ✅ Backend works
   - Not there? ❌ Check sync logs

2. **Check Device B:**
   - Pull to refresh
   - Check logs for "Synced message from remote to local"
   - If not appearing, check user IDs match

3. **Verify same user on both devices:**
   ```swift
   print(await authClient.currentUser()?.id)
   // Should be identical on both devices
   ```

---

## Advanced Configuration

### Custom Sync Strategy

**Change conflict resolution:**

```swift
// In HybridConversationRepository.syncRemoteToLocal()

// Instead of last-write-wins:
if remote.updatedAt > local.updatedAt {
    updateLocal(from: remote)
}

// Try: Keep both, let user choose:
if remote.updatedAt != local.updatedAt {
    // Mark as conflict
    local.markAsConflicted()
    // Show UI to let user pick which version
}
```

### Sync Indicators

**Show user when sync is active:**

```swift
// Add to an @Observable ViewModel backing HybridConversationRepository
@Observable
@MainActor
final class SyncStateModel {
    var isSyncing = false
}

// In the repository, flip the flag via the view model
func list(...) async throws -> [...] {
    syncState.isSyncing = true
    defer { syncState.isSyncing = false }

    // ... sync logic ...
}

// In UI
if viewModel.syncState.isSyncing {
    ProgressView()
}
```

Do not reach for `@Published` — v2.0 is `@Observable`-only.

### Selective Sync

**Only sync recent conversations:**

```swift
// In HybridConversationRepository
let remoteConversations = try await remote.list(limit: 50, after: nil)  // ← Only last 50

// Older conversations stay local-only (saves bandwidth)
```

### Manual Sync Button

**Add to ChatHistoryView:**

```swift
.toolbar {
    ToolbarItem(placement: .topBarLeading) {
        Button {
            Task {
                await viewModel.syncNow()
            }
        } label: {
            Image(systemName: "arrow.triangle.2.circlepath")
        }
    }
}

// In ChatHistoryViewModel
func syncNow() async {
    // Force immediate sync
    await conversationRepository.syncFromRemote()
}
```

---

## Testing Strategy

### Unit Tests

```swift
func testHybridRepository_create_syncsToRemote() async throws {
    let local = MockConversationRepository()
    let remote = MockConversationRepository()
    let hybrid = HybridConversationRepository(local: local, remote: remote)
    
    _ = try await hybrid.create(title: "Test", personaName: nil)
    
    // Verify wrote to local
    XCTAssertEqual(local.conversations.count, 1)
    
    // Wait for background sync
    try await Task.sleep(for: .milliseconds(100))
    
    // Verify synced to remote
    XCTAssertEqual(remote.conversations.count, 1)
}
```

### Integration Tests

```swift
func testChatSync_createdOnDeviceA_appearsOnDeviceB() async throws {
    // Device A: Create conversation
    let deviceA = CompositionRoot(...)
    let conversation = try await deviceA.conversationRepository.create(title: "Hello")
    
    // Device B: Fetch conversations (simulating another device)
    let deviceB = CompositionRoot(...) // Same user
    let conversations = try await deviceB.conversationRepository.list(limit: 10, after: nil)
    
    // Should contain conversation from Device A
    XCTAssertTrue(conversations.contains { $0.id == conversation.id })
}
```

---

## Monitoring

### Supabase Dashboard

**Track usage:**
1. Dashboard → Database → Tables
2. Click `conversations` or `messages`
3. See all data (filtered by user in production due to RLS)

**Check stats:**
1. Dashboard → Database → Query Performance
2. See slow queries
3. Optimize indexes if needed

### App Logs

**Enable verbose logging:**

```swift
// Check for these messages:
AppLogger.debug("Synced new conversation to remote")  // Write sync
AppLogger.debug("Created local conversation from remote")  // Read sync
AppLogger.error("Failed to sync to remote (local saved)")  // Graceful failure
```

**Filter in Console.app:**
- Subsystem: `com.yourapp.SwiftAIBoilerplatePro`
- Category: `storage`

---

## Cost Considerations

### Supabase Free Tier Limits

**Database:**
- 500MB storage
- Unlimited API requests
- RLS enabled

**Estimations for 1000 active users:**

```
Average per user:
- 20 conversations × 0.5KB = 10KB
- 100 messages × 1KB = 100KB
- Total per user: ~110KB

1000 users × 110KB = ~110MB
Well within 500MB free tier ✅
```

**To reduce storage:**
- Add retention policy (delete old chats)
- Compress message content
- Limit history depth

---

## Security

### Row Level Security (RLS)

**All tables protected:**
- Users can only access their own data
- `auth.uid()` enforced at database level
- No way to query other users' chats

**Policy checks:**
```sql
-- Every query automatically filtered:
WHERE user_id = auth.uid()

-- Enforced by Postgres, not app code
```

### Data Privacy

**What's synced:**
- Conversation titles
- Message content
- Timestamps
- Persona names

**What's NOT synced:**
- Other users' data (RLS prevents it)
- Deleted conversations (CASCADE deletes messages)
- Device identifiers (optional metadata only)

---

## Next Steps

**For Development:**
- Keep `chatSyncEnabled = false` (local-only is simpler)
- Use SwiftData for fast iteration
- No backend dependency

**For Production:**
- Enable Supabase sync following steps above
- Test multi-device scenarios
- Monitor Supabase dashboard for issues
- Set up retention policies if needed

**Optional Enhancements:**
- Add real-time subscriptions (Supabase Realtime)
- Add typing indicators
- Add read receipts
- Add message encryption
- Add media message support

---

## Summary

✅ **Works immediately** - Local-only by default, no setup required  
✅ **Easy to enable** - Clear 8-step setup process  
✅ **Offline-first** - Chat works without internet  
✅ **Graceful sync** - Background sync doesn't block UI  
✅ **Production-ready** - RLS, indexes, conflict resolution  
✅ **Well-documented** - Complete setup and troubleshooting guide  
✅ **Test-friendly** - Mock implementations included  

You can ship with local-only chat and enable cloud sync when ready!

