# Building & Launching Your App

**Complete step-by-step guide from boilerplate to App Store.** Each section includes detailed technical instructions AND optional LLM prompts for AI-assisted development.

> **💡 Choose your workflow:**
> - **Manual:** Follow the step-by-step instructions with exact file paths
> - **AI-Assisted:** Use the LLM prompts with Cursor/Claude

## Prerequisites (v2.0.0)

- **macOS 15 (Sequoia) or newer**
- **Xcode 26.2 or newer** — v2.0.0 uses the iOS 26 SDK to compile Liquid Glass APIs (`Glass`, `glassEffect`, `GlassEffectContainer`). Older toolchains cannot build this boilerplate, regardless of `#available` checks. Runtime still supports **iOS 17+** via a SwiftUI `Material` fallback inside `SAIGlass`.
- **Swift 6** — all 11 SPM packages are pinned to `swift-tools-version: 6.2` with strict concurrency. Xcode project `SWIFT_VERSION = 6.0`.
- **Supabase CLI** (for deploying the AI Edge Function)
- Optional: `brew install swiftlint` (matches the CI lint job)

If you cannot move off older Xcode yet, stay on the `v1.9.0` tag — it is the supported line for Xcode 15 / 16 teams.

---

## Table of Contents

1. [Initial Setup & First Run](#initial-setup--first-run)
2. [Branding & Customization](#branding--customization)
3. [Backend Configuration](#backend-configuration)
4. [Feature Customization](#feature-customization)
5. [Legal & Compliance](#legal--compliance)
6. [Testing & Quality](#testing--quality)
7. [App Store Preparation](#app-store-preparation)
8. [Launch Checklist](#launch-checklist)

---

## Initial Setup & First Run

### Step 1: Clone and Run

**What you're doing:** Getting the app running on your device.

**Manual Steps:**

```bash
# 1. Clone repository
git clone <your-repo>
cd SwiftAIBoilerplatePro

# 2. Open project
open SwiftAIBoilerplatePro.xcodeproj

# 3. Run immediately - no configuration needed!
# Uses MockAuthClient and EchoLLMClient - explore all features without setup

# 4. (Optional) To use real services later:
#
# a) Copy the config template:
#    cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig
#
# b) Fill in your API keys in Config/Secrets.xcconfig
#
# c) IMPORTANT: Run the update script:
#    bash scripts/update-config.sh
#
# d) Clean and rebuild in Xcode (⌘⇧K then ⌘B)
#
# NOTE: You must run step (c) EVERY TIME you change Secrets.xcconfig
#       The update is NOT automatic - it's a manual command

# 5. Build and run (⌘R)
```

**What you'll see:**
- Onboarding flow → Sign in → Home screen → Chat working with echo responses

**Verification:**
- ✅ App builds without errors
- ✅ Can navigate through onboarding
- ✅ Can sign in with any email/password (mock mode)
- ✅ Chat shows echo responses

---

## Branding & Customization

### Change App Name

**What you're doing:** Renaming from "SwiftAI Boilerplate Pro" to your app name.

**Manual Steps:**

1. **In Xcode:**
   - Select project in navigator (top item)
   - Select target "SwiftAIBoilerplatePro"
   - Under **General** tab:
     - **Display Name:** `Your App Name`
     - **Bundle Identifier:** `com.yourcompany.yourapp`

2. **Update launch screen text:**
   - File: `SwiftAIBoilerplatePro/Launch Screen.storyboard`
   - Select label
   - Change text to your app name

3. **Update navigation titles:**
   - Search project for `"SwiftAI Boilerplate Pro"` (⌘⇧F)
   - Replace with your app name in user-facing strings

**AI-Assisted Alternative:**

```
Change the app name from 'SwiftAI Boilerplate Pro' to 'MyAwesomeApp' everywhere. 
Update display name, bundle identifier (to com.mycompany.myawesomeapp), and all 
user-facing text. Don't change code identifiers or file names. Follow CLAUDE.md 
guidelines.
```

---

### Replace App Icon

**What you're doing:** Adding your custom app icon.

**Manual Steps:**

1. **Prepare icon:**
   - Create 1024×1024 PNG (use [appicon.co](https://appicon.co) for sizing)
   - Name it `AppIcon.png`

2. **Add to project:**
   - Navigate to `SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/`
   - Drag your 1024×1024 icon into the asset catalog
   - Xcode generates all required sizes automatically

3. **Verify:**
   - Build and run
   - Check home screen and app switcher show your icon

**AI-Assisted Alternative:**

```
I have a 1024×1024 app icon at ~/Desktop/my-app-icon.png. Please add it to 
Assets.xcassets/AppIcon.appiconset and verify all required sizes are generated.
```

---

### Customize App Colors

**What you're doing:** Changing primary and accent colors to match your brand.

**Manual Steps:**

1. **Navigate to colors:**
   ```
   SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/
   ```

2. **Edit Primary color:**
   - Open `Primary.colorset/Contents.json`
   - Or use Xcode: Select color set → Inspector → set your color
   - Set Light Appearance: Your brand color
   - Set Dark Appearance: Lighter or same

3. **Edit AccentPrimary (call-to-action color):**
   - Open `AccentPrimary.colorset`
   - Set your CTA color (buttons, links)

4. **Test in both modes:**
   - Run app
   - Settings → Theme → Try Light/Dark/System
   - Verify colors look good in all modes

**Files to modify:**
```
SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/
├── Primary.colorset/
├── AccentPrimary.colorset/
├── Background.colorset/ (optional)
└── TextPrimary.colorset/ (optional)
```

**AI-Assisted Alternative:**

```
Change the primary color to #6C5CE7 (purple) and accent color to #00D4AA (teal). 
Update Primary.colorset and AccentPrimary.colorset in DesignSystemColors.xcassets. 
Make sure they work in both light and dark mode. Test across all screens.
```

---

### Customize Onboarding

**What you're doing:** Changing the 3 onboarding pages users see first time.

**Manual Steps:**

1. **Edit onboarding content:**
   ```
   File: SwiftAIBoilerplatePro/AppShell/OnboardingPage.swift
   ```

2. **Find this code:**
   ```swift
   static let pages: [OnboardingPage] = [
       OnboardingPage(
           title: "Welcome to SwiftAI",
           description: "Your AI-powered assistant...",
           systemImage: "sparkles"
       ),
       // ... more pages
   ]
   ```

3. **Replace with your content:**
   ```swift
   static let pages: [OnboardingPage] = [
       OnboardingPage(
           title: "Welcome to YourApp",
           description: "Your custom description here",
           systemImage: "rocket"  // Any SF Symbol
       ),
       OnboardingPage(
           title: "Second Page Title",
           description: "Second page description",
           systemImage: "bubble.left.and.bubble.right"
       ),
       OnboardingPage(
           title: "Final Page Title",
           description: "Final page description",
           systemImage: "checkmark.shield"
       )
   ]
   ```

4. **Build and test:**
   - Delete app from simulator
   - Run again to see onboarding

**AI-Assisted Alternative:**

```
Update onboarding with these 3 pages:
1. "Welcome to MyApp" - "AI-powered productivity assistant" (icon: sparkles)
2. "Chat Naturally" - "Ask anything, get instant answers" (icon: bubble.left.and.bubble.right)
3. "Secure & Private" - "Your data stays private and encrypted" (icon: lock.shield)

Edit SwiftAIBoilerplatePro/AppShell/OnboardingPage.swift following the existing pattern.
```

---

## Backend Configuration

### Supabase Setup (Required for Production)

**What you're doing:** Setting up authentication and AI proxy backend.

**Manual Steps:**

#### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it (e.g., "my-app-production")
4. Choose region close to your users
5. Set database password (save it!)
6. Wait for project to provision (~2 minutes)

#### 2. Get Your API Credentials

1. In Supabase Dashboard → Project Settings → API
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   Anon/Public Key: eyJhbGc...
   ```

#### 3. Configure App

**Edit:** `Config/Secrets.xcconfig`

```bash
# Supabase Configuration
SUPABASE_URL = https://your-project-ref.supabase.co
SUPABASE_ANON_KEY = eyJ... your anon key ...

# RevenueCat (optional - skip if not using subscriptions)
REVENUECAT_API_KEY = appl_YOUR_KEY
RC_ENTITLEMENT_ID = pro

# AI Proxy (set after deploying Edge Function below)
PROXY_BASE_URL = https://your-project-ref.supabase.co/functions/v1
PROXY_PATH = /ai
```

#### 4. Deploy AI Proxy Edge Function

**Prerequisites:**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase
```

**Deploy steps:**

```bash
# 1. Login
supabase login

# 2. Link your project
cd SwiftAIBoilerplatePro/supabase
supabase link --project-ref your-project-ref

# 3. Get OpenRouter API key from https://openrouter.ai/keys

# 4. Set secret
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE

# 5. Deploy function
supabase functions deploy ai

# 6. Copy the function URL from output:
# https://your-project-ref.supabase.co/functions/v1/ai
```

#### 5. Update Config with Function URL

**Edit:** `Config/Secrets.xcconfig`

```bash
PROXY_BASE_URL = https://your-project-ref.supabase.co/functions/v1
PROXY_PATH = /ai
```

#### 6. **CRITICAL:** Regenerate Configuration

**Every time** you edit `Config/Secrets.xcconfig`, you must run:

```bash
cd /path/to/SwiftAIBoilerplatePro
bash scripts/update-config.sh
```

**Expected output:**
```
✅ Updated Configuration.swift with 6 values
   Build your app in Xcode to use the new configuration
```

**Then in Xcode:**
```
⌘ + Shift + K    # Clean build folder
⌘ + B            # Build
```

<Warning>
**This step is NOT automatic!** The configuration update script must be run manually after ANY changes to Secrets.xcconfig. If you forget this step, your app will continue using old/placeholder values.
</Warning>

#### 6. Enable Real Auth

**In Xcode:**
- Select scheme → Edit Scheme → Run → Arguments
- **Remove** environment variable: `AUTH_BYPASS`
- (Or delete from scheme entirely)

**Result:** App now uses real Supabase auth instead of MockAuthClient

#### 7. Test Real Backend

1. Build and run
2. Sign up with real email
3. Check email for confirmation
4. Sign in
5. Send chat message
6. Should get real AI response (not echo)

**Verification:**
- ✅ Can sign up with email
- ✅ Receive confirmation email
- ✅ Can sign in
- ✅ Chat gets real AI responses
- ✅ Check Supabase Dashboard → Authentication → Users (your user appears)

**Detailed guide:** See [integrations/Supabase.md](integrations/Supabase.md)

**AI-Assisted Alternative:**

```
I have my Supabase credentials:
- URL: https://xxx.supabase.co
- Anon Key: eyJ...

Please:
1. Update Config/Secrets.xcconfig with these values
2. Remove AUTH_BYPASS from scheme environment variables
3. Help me deploy the Edge Function (I have Supabase CLI installed)
4. Verify the app switches from MockAuthClient to real auth
5. Test that sign up and chat work with real backend

Follow docs/migrations/supabase.md for the deployment steps.
```

---

### RevenueCat Setup (Optional - For Subscriptions)

**What you're doing:** Enabling in-app subscriptions and paywall.

**Manual Steps:**

#### 1. Create App Store Connect Products

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Your app → Features → In-App Purchases
3. Click **+** to create products
4. Create these products:
   ```
   Product ID: monthly_subscription
   Type: Auto-Renewable Subscription
   Price: $9.99/month
   
   Product ID: annual_subscription  
   Type: Auto-Renewable Subscription
   Price: $79.99/year
   ```
5. Set subscription group
6. Save and submit for review

#### 2. Create RevenueCat Account

1. Go to [app.revenuecat.com](https://app.revenuecat.com)
2. Create free account
3. Create new project: "YourApp"
4. Add app:
   - Platform: iOS
   - Bundle ID: `com.yourcompany.yourapp`
   - App Store Connect App-Specific Shared Secret

#### 3. Configure Products in RevenueCat

1. RevenueCat Dashboard → Products
2. Import from App Store Connect
3. Create Offering: "default"
4. Add packages:
   - Monthly: Link to `monthly_subscription`
   - Annual: Link to `annual_subscription`
5. Create Entitlement: "pro"
6. Attach products to entitlement

#### 4. Get API Keys

1. RevenueCat → Settings → API Keys
2. Copy **Public API Key** (starts with `appl_` for Apple)

#### 5. Configure App

**Edit:** `Config/Secrets.xcconfig`

```bash
REVENUECAT_API_KEY = appl_YOUR_PUBLIC_KEY_HERE
RC_ENTITLEMENT_ID = pro
```

#### 6. Test Subscriptions

1. In Xcode → Signing → Enable sandbox environment
2. Create sandbox tester in App Store Connect
3. Build and run
4. Go to Settings → Tap "Go Premium"
5. Paywall should show your products
6. Test purchase with sandbox account

**Verification:**
- ✅ Paywall shows correct prices
- ✅ Can purchase subscription
- ✅ Subscription status shows in Profile
- ✅ Can restore purchases

**Detailed guide:** See [integrations/RevenueCat.md](integrations/RevenueCat.md)

**AI-Assisted Alternative:**

```
Set up RevenueCat subscriptions:
1. I've created products in App Store Connect (monthly_sub, annual_sub)
2. Created RevenueCat project and imported products
3. My API key is: appl_XXX
4. Entitlement ID is: pro

Update Config/Secrets.xcconfig with these values. Verify PaywallView displays 
products correctly. Test purchase flow. Follow docs/migrations/revenuecat.md.
```

---

## Feature Customization

### Customize Home Screen

**What you're doing:** Changing the feature cards and quick actions.

**Manual Steps:**

#### 1. Edit Hero Section

**File:** `SwiftAIBoilerplatePro/AppShell/HomeContent.swift`

```swift
// Find this struct:
public struct HeroData {
    public let greeting: String
    public let tagline: String
}

// Update the greeting in HomeViewModel:
let greeting = "Welcome back"  // Change to: "Hello, \(userName)!"
let tagline = "Ready to create?"  // Change to your tagline
```

#### 2. Change Feature Cards

**File:** `SwiftAIBoilerplatePro/AppShell/HomeContent.swift`

```swift
// Find this array:
public let features: [FeatureData] = [
    FeatureData(
        icon: "message.badge.filled.fill",
        title: "AI Chat",
        description: "Start chatting",
        tag: "New"
    ),
    // Add your features...
]
```

**Replace with your features:**

```swift
public let features: [FeatureData] = [
    FeatureData(
        icon: "sparkles",  // SF Symbol name
        title: "AI Assistant",
        description: "Get instant help",
        tag: "Popular"
    ),
    FeatureData(
        icon: "book.fill",
        title: "Saved Prompts",
        description: "Your favorites",
        tag: nil
    ),
    FeatureData(
        icon: "chart.line.uptrend.xyaxis",
        title: "Analytics",
        description: "Track usage",
        tag: "New"
    ),
]
```

#### 3. Change Quick Actions

**File:** `SwiftAIBoilerplatePro/AppShell/HomeContent.swift`

```swift
// Find:
public let quickActions: [QuickActionData] = [
    QuickActionData(
        icon: "plus.circle.fill",
        title: "New Chat",
        action: .startChat
    ),
    // ...
]
```

**Update actions:**

```swift
public let quickActions: [QuickActionData] = [
    QuickActionData(
        icon: "plus.circle.fill",
        title: "New Chat",
        action: .startChat  // Keep this
    ),
    QuickActionData(
        icon: "clock.fill",
        title: "Recent",
        action: .viewHistory  // Or custom action
    ),
    QuickActionData(
        icon: "gear",
        title: "Settings",
        action: .openSettings  // Add your action
    ),
]
```

#### 4. Add Action Handler

**File:** `SwiftAIBoilerplatePro/AppShell/HomeView.swift`

```swift
// Find the action handler:
private func handleQuickAction(_ action: QuickActionType) {
    switch action {
    case .startChat:
        // Existing code...
    case .viewHistory:
        // Existing code...
    case .openSettings:  // Add your new action
        // Navigate to settings or your feature
        break
    }
}
```

**Colors and styling automatically use DesignSystem tokens** - no additional changes needed!

**AI-Assisted Alternative:**

```
Customize the home screen:
1. Change hero greeting to "Welcome to [MyApp]!"
2. Replace feature cards with:
   - "AI Assistant" (sparkles icon)
   - "Saved Prompts" (book icon)  
   - "Usage Stats" (chart icon)
3. Change quick actions to:
   - "New Chat"
   - "Browse History"
   - "Settings"

Follow the HomeContent model pattern and use DesignSystem tokens. Update 
HomeView.swift action handlers for new actions.
```

---

### Customize Chat Experience

**What you're doing:** Changing chat UI, colors, or behavior.

**Manual Steps:**

#### 1. Change Chat Bubble Colors

**Files:**
```
SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/
├── BubbleUser.colorset/
└── BubbleAssistant.colorset/
```

**Steps:**
1. Open `BubbleUser.colorset` in Xcode
2. Change color for Light Appearance (e.g., purple #6C5CE7)
3. Change color for Dark Appearance (same or lighter)
4. Repeat for `BubbleAssistant.colorset` (e.g., gray #F5F5F5)
5. Build → All chat screens update automatically

#### 2. Change Default Chat Style

**What to change:** Switch from bubble style (WhatsApp) to centered style (ChatGPT)

**File:** `SwiftAIBoilerplatePro/AppShell/MainTabView.swift` or wherever chat is launched

**Find:**
```swift
navigationPath.append(.chat(conversationID: id, style: .bubbles))
```

**Change to:**
```swift
navigationPath.append(.chat(conversationID: id, style: .centered))
```

**Effect:** All new chats open in ChatGPT-style instead of bubble style

#### 3. Add Custom AI Persona

**What you're doing:** Make AI act as a specific character (e.g., "Coding Tutor")

**File:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift`

**Find the `sendMessage` method:**

```swift
public func sendMessage(_ text: String) async {
    // ... existing code ...
    
    // Before streaming, add system prompt:
    let systemPrompt = LLMMessage(
        role: .system,
        content: """
        You are an expert Swift and iOS developer. Provide clear, concise answers 
        with code examples. Always follow SwiftUI best practices and Apple's 
        Human Interface Guidelines.
        """
    )
    
    let messages = [systemPrompt] + conversationHistory + [userMessage]
    
    // Stream with system prompt included
    for try await chunk in llmClient.streamResponse(messages: messages) {
        // ... existing streaming code ...
    }
}
```

**Make it selectable:**
- Add `persona: String?` to Conversation model
- Store persona choice
- Use different system prompts based on persona

#### 4. Change AI Model

**File:** `supabase/functions/ai/index.ts`

```typescript
// Find:
const model = "openai/gpt-4o-mini";

// Change to any OpenRouter model:
const model = "anthropic/claude-3-5-sonnet";  // Claude
const model = "openai/gpt-4o";  // GPT-4
const model = "google/gemini-2.5-pro";  // Gemini
```

**After changing:**
```bash
supabase functions deploy ai
```

**Popular models:** See [openrouter.ai/models](https://openrouter.ai/models)

**AI-Assisted Alternative:**

```
Customize the chat experience:
1. Change bubble colors to purple (user) and light gray (AI)
2. Add a system prompt: "You are a professional coding tutor..."
3. Change AI model to claude-3-5-sonnet
4. Add typing indicator while AI responds

Follow patterns in docs/FeatureChat.md and docs/AI.md. Use DesignSystem colors.
```

---

### Enable Chat History Sync (Optional)

**What you're doing:** Sync conversations and messages across all user devices via Supabase.

**Manual Steps:**

#### 1. Run Database Migration

**Option A - Supabase CLI:**
```bash
cd supabase
supabase db push
```

**Option B - Manual:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20241016000000_chat_sync.sql`
3. Paste and run
4. Verify tables created: conversations, messages

#### 2. Enable Feature Flag

**File:** `SwiftAIBoilerplatePro/Composition/FeatureFlags.swift`

```swift
public static var chatSyncEnabled: Bool {
    #if DEBUG
    return true  // ← Change from false to true
    #else
    return ProcessInfo.processInfo.environment["CHAT_SYNC_ENABLED"] == "true"
    #endif
}
```

#### 3. Add Supabase Dependency (If Not Already Added)

**File:** `Packages/Storage/Package.swift`

```swift
dependencies: [
    .package(path: "../Core"),
    .package(path: "../Networking"),
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")  // Add this
],
targets: [
    .target(
        name: "Storage",
        dependencies: [
            "Core",
            "Networking",
            .product(name: "Supabase", package: "supabase-swift")  // Add this
        ]
    ),
    // ...
]
```

#### 4. Uncomment Supabase Implementations

**File:** `Packages/Storage/Sources/Storage/Repositories/SupabaseConversationRepository.swift`

```swift
// Change:
// import Supabase  // ← Uncomment when...

// To:
import Supabase  // ✅ Now enabled

// Remove /* at line 15 and */ at end of file
```

**Repeat for:** `SupabaseMessageRepository.swift`

#### 5. Wire Up in CompositionRoot

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`

**Find section around line 216:**

```swift
// 4a. Chat Sync Repositories
if FeatureFlags.chatSyncEnabled && !shouldUseMock {
    // TODO: Uncomment when Supabase is configured
```

**Uncomment and implement:**

```swift
if FeatureFlags.chatSyncEnabled && !shouldUseMock {
    AppLogger.info("Chat sync enabled", category: AppLogger.storage)
    
    if let currentUser = await sessionManager.currentUser() {
        // Create remote repositories
        let remoteConversationRepo = SupabaseConversationRepository(
            supabaseClient: supabaseClient,  // Get from SessionManager
            userId: currentUser.id
        )
        let remoteMessageRepo = SupabaseMessageRepository(
            supabaseClient: supabaseClient,
            userId: currentUser.id
        )
        
        // Use hybrid repositories (local + remote sync)
        self.conversationRepository = HybridConversationRepository(
            local: localConversationRepo,
            remote: remoteConversationRepo
        )
        self.messageRepository = HybridMessageRepository(
            local: localMessageRepo,
            remote: remoteMessageRepo
        )
    } else {
        // No user yet, use local only
        self.conversationRepository = localConversationRepo
        self.messageRepository = localMessageRepo
    }
} else {
    self.conversationRepository = localConversationRepo
    self.messageRepository = localMessageRepo
}
```

#### 6. Test Sync

1. Run app on Device A → Create conversation → Send messages
2. Check Supabase Dashboard → Database → conversations table (data should appear)
3. Run app on Device B (same user) → Pull to refresh → Conversation appears!

**Detailed guide:** See [integrations/ChatSync.md](integrations/ChatSync.md)

**AI-Assisted Alternative:**

```
Enable chat history sync across devices using Supabase. Follow integrations/ChatSync.md:
1. Run the migration: supabase/migrations/20241016000000_chat_sync.sql
2. Set FeatureFlags.chatSyncEnabled = true
3. Uncomment SupabaseConversationRepository and SupabaseMessageRepository
4. Wire up HybridRepositories in CompositionRoot
5. Test that conversations sync between devices

Ensure offline-first behavior is preserved (writes go to local first).
```

---

### Enable Profile Photo Cloud Storage (Optional)

**What you're doing:** Store profile photos in Supabase Storage (syncs across devices).

**Manual Steps:**

#### 1. Create Storage Bucket

1. Supabase Dashboard → Storage
2. Click "New bucket"
3. Settings:
   - Name: `profile-photos`
   - Public: ✅ Enable
   - Click "Create bucket"

#### 2. Set Storage Policies

In Supabase Dashboard → Storage → profile-photos → Policies:

**Click "New Policy" → Create these 4 policies:**

```sql
-- Policy 1: Upload
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Read (public)
CREATE POLICY "Photos are public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 3: Update own
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 4: Delete own
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

#### 3. Uncomment Storage Client

**File:** `Packages/Storage/Sources/Storage/SupabaseProfilePhotoStorageClient.swift`

```swift
// Line 2: Uncomment
import Supabase  // ✅

// Line 15: Remove /*
// Line 119: Remove */
```

#### 4. Enable in CompositionRoot

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`

**Find around line 247:**

```swift
// 5a. Profile Photo Storage
if !shouldUseMock {
    // TODO: Uncomment when...
```

**Replace with:**

```swift
if !shouldUseMock {
    self.profilePhotoStorageClient = SupabaseProfilePhotoStorageClient(
        supabaseClient: supabaseClient,  // Get from SessionManager
        bucketName: "profile-photos"
    )
}
```

#### 5. Test Photo Upload

1. Run app → Profile → Edit → Choose Photo
2. Select a photo → Save
3. Check Supabase Dashboard → Storage → profile-photos → avatars/
4. Your photo should appear!
5. Run on another device → Photo syncs automatically

**Detailed guide:** See [integrations/ProfilePhotos.md](integrations/ProfilePhotos.md)

**AI-Assisted Alternative:**

```
Enable Supabase storage for profile photos following integrations/ProfilePhotos.md:
1. I've created the 'profile-photos' bucket with policies
2. Uncomment SupabaseProfilePhotoStorageClient implementation
3. Enable it in CompositionRoot
4. Test that photos upload and sync across devices

Maintain fallback to local storage if upload fails.
```

---

### Customize Subscription Paywall

**What you're doing:** Changing pricing tiers, features, or design.

**Manual Steps:**

#### 1. Update Pricing Display

**File:** `Packages/FeatureSettings/Sources/FeatureSettings/Views/PaywallView.swift`

**Find the subscription options:**

```swift
// Current code shows packages from RevenueCat
// To customize display:

VStack(spacing: DSSpacing.lg) {
    // Basic Tier
    PricingCard(
        name: "Basic",
        price: "$4.99",
        period: "month",
        features: [
            "100 messages/day",
            "GPT-3.5 Turbo",
            "Email support"
        ],
        isPopular: false,
        action: { await viewModel.purchase(productID: "basic_monthly") }
    )
    
    // Pro Tier
    PricingCard(
        name: "Pro",
        price: "$9.99",
        period: "month",
        features: [
            "Unlimited messages",
            "All AI models (GPT-4, Claude)",
            "Priority support",
            "Early access to features"
        ],
        isPopular: true,
        action: { await viewModel.purchase(productID: "pro_monthly") }
    )
}
```

#### 2. Create PricingCard Component

**Add to same file:**

```swift
struct PricingCard: View {
    let name: String
    let price: String
    let period: String
    let features: [String]
    let isPopular: Bool
    let action: () async -> Void
    
    var body: some View {
        VStack(spacing: DSSpacing.md) {
            // Header
            if isPopular {
                Text("Most Popular")
                    .font(DSTypography.caption)
                    .foregroundStyle(DSColors.primary)
            }
            
            Text(name)
                .font(DSTypography.titleL)
                .fontWeight(.bold)
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(price)
                    .font(DSTypography.titleXL)
                    .fontWeight(.bold)
                Text("/ \(period)")
                    .font(DSTypography.body)
                    .foregroundStyle(DSColors.textSecondary)
            }
            
            // Features
            VStack(alignment: .leading, spacing: DSSpacing.sm) {
                ForEach(features, id: \.self) { feature in
                    HStack(spacing: DSSpacing.sm) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(DSColors.primary)
                        Text(feature)
                            .font(DSTypography.body)
                    }
                }
            }
            
            // CTA Button
            Button {
                Task { await action() }
            } label: {
                Text("Subscribe")
                    .font(DSTypography.body)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isPopular ? DSColors.primary : DSColors.surface)
                    .foregroundStyle(isPopular ? .white : DSColors.textPrimary)
                    .cornerRadius(DSRadius.md)
            }
        }
        .padding(DSSpacing.lg)
        .background(DSColors.surface)
        .cornerRadius(DSRadius.lg)
        .overlay(
            RoundedRectangle(cornerRadius: DSRadius.lg)
                .strokeBorder(isPopular ? DSColors.primary : Color.clear, lineWidth: 2)
        )
    }
}
```

#### 3. Update Products in RevenueCat

1. Create new products in App Store Connect
2. Import to RevenueCat
3. Update product IDs in code
4. Test with sandbox account

**AI-Assisted Alternative:**

```
Redesign the paywall to show two tiers side-by-side:
- Basic: $4.99/mo (100 msg/day, GPT-3.5, email support)
- Pro: $9.99/mo (unlimited, all models, priority support)

Create a PricingCard component using DesignSystem tokens. Pro tier should have 
gradient border and "Most Popular" badge. Follow the design patterns in 
docs/Payments.md and docs/DesignSystem.md.
```

---

## Legal & Compliance

### Update Privacy Policy

**What you're doing:** Customizing the privacy policy template with your app details.

**Manual Steps:**

**File:** `SwiftAIBoilerplatePro/Resources/privacy.md`

**Find and replace these placeholders:**

```markdown
# Privacy Policy for [Your App Name]

**Effective Date:** [Date]  
**Last Updated:** [Date]

## Who We Are

[Your Company Name] ("we", "us", "our") operates [Your App Name]...

## Contact Information

Email: support@yourapp.com  ← Your real email
Address: [Your company address]

## Data We Collect

### Data You Provide
- Email address (for account creation)
- Display name (optional)
- Profile photo (optional)
- Chat messages and conversations

### Automatically Collected
- Device information (iOS version, device model)
- App usage analytics
- Crash reports (if enabled in settings)

## Third-Party Services

We use these services to operate the app:

1. **Supabase** (Backend & Authentication)
   - Purpose: User accounts, data storage
   - Data shared: Email, profile data
   - Policy: https://supabase.com/privacy

2. **RevenueCat** (Subscription Management)
   - Purpose: In-app purchases
   - Data shared: Purchase history, subscription status
   - Policy: https://www.revenuecat.com/privacy

3. **OpenRouter** (AI Processing)
   - Purpose: Chat responses
   - Data shared: Chat messages
   - Policy: https://openrouter.ai/privacy
   - Note: Messages processed but not stored by OpenRouter

## Your Rights (GDPR)

You have the right to:
- Access your data
- Delete your account and data
- Export your data
- Opt out of analytics

To exercise these rights, contact: support@yourapp.com
```

**Verify:**
- ✅ All placeholders replaced
- ✅ Accurate data collection list
- ✅ Correct third-party services
- ✅ Valid contact information

---

### Update Terms of Service

**File:** `SwiftAIBoilerplatePro/Resources/terms.md`

**Replace:**
- `[Your App Name]` → Your actual app name
- `[Your Company Name]` → Your company/developer name
- `[Contact Email]` → Your support email
- `[Date]` → Today's date

**Key sections to customize:**

```markdown
## Acceptable Use

You agree not to:
- Use the service for illegal purposes
- Abuse or spam the AI features
- [Add your specific restrictions]

## Subscription Terms

- Subscriptions auto-renew unless cancelled
- Cancel anytime in App Store settings
- Prices: $9.99/month or $79.99/year  ← Your actual prices
- [Add your specific terms]

## Limitation of Liability

[Your Company Name] is not liable for:
- AI-generated content accuracy
- Service interruptions
- [Your specific limitations]
```

---

### Update Subscription Terms

**File:** `SwiftAIBoilerplatePro/Resources/subscription_terms.md`

**Update with your pricing:**

```markdown
# Subscription Terms

## Plans Available

**Monthly Subscription**
- Price: $9.99/month  ← Your price
- Auto-renews monthly
- Cancel anytime

**Annual Subscription**
- Price: $79.99/year  ← Your price  
- Auto-renews yearly
- 2 months free vs monthly

## What's Included

Pro subscription includes:
- [List your actual features]
- Unlimited AI messages
- All AI models
- Priority support
- [Your features]

## Cancellation

- Cancel in iOS Settings → Subscriptions
- Access continues until end of period
- No refunds for partial periods
```

---

### Add Required Info.plist Entries

**What you're doing:** Adding privacy descriptions required by App Store.

**File:** `SwiftAIBoilerplatePro/Info.plist` (or project settings)

**Required if using:**

**Camera (for photo upload):**
```xml
<key>NSCameraUsageDescription</key>
<string>Take a profile photo</string>
```

**Photo Library (already handled by iOS 17+ PhotosPicker):**
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Choose a profile photo from your library</string>
```

**Face ID (if using):**
```xml
<key>NSFaceIDUsageDescription</key>
<string>Secure access to your account</string>
```

**Microphone (if adding voice features):**
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Record voice messages</string>
```

**In Xcode:**
1. Select project → Target → Info tab
2. Click **+** to add keys
3. Type key name (auto-completes)
4. Set value to user-facing description

---

## Testing & Quality

### Run Full Test Suite

**What you're doing:** Verifying all functionality works correctly.

**Manual Steps:**

```bash
# In Xcode
⌘ + U  # Run all tests

# Or command line:
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2'
```

> CI also runs a `test-ios18-fallback` job on `iPhone 16 Pro / OS=18.6` to validate the SwiftUI `Material` fallback path inside `SAIGlass`. If you touched anything that reads `Glass` directly, run that destination locally too.


**Fix any failures before proceeding.**

---

### Test Critical User Flows

**Manual testing checklist:**

#### Authentication Flow
- [ ] Sign up with email → Check email → Verify link works
- [ ] Sign in with email/password
- [ ] Sign in with Apple (on real device)
- [ ] Sign out → Returns to onboarding
- [ ] Forgot password → Receive reset email

#### Chat Flow
- [ ] Create new conversation
- [ ] Send message → Receive AI response
- [ ] Streaming works (text appears gradually)
- [ ] Switch chat styles (bubble ↔ centered)
- [ ] Delete conversation → Confirmation shown
- [ ] Rename conversation → Name updates

#### Subscription Flow (if using RevenueCat)
- [ ] Tap "Go Premium" → Paywall appears
- [ ] See correct product prices
- [ ] Purchase subscription (sandbox)
- [ ] Subscription status shows in Profile
- [ ] Restore purchases works
- [ ] Cancel subscription → Access continues until expiry

#### Profile Flow
- [ ] Edit name → Saves correctly
- [ ] Upload photo → Compresses and displays
- [ ] Remove photo → Returns to initials
- [ ] Changes persist after app restart

#### Settings Flow
- [ ] Change theme → Updates immediately
- [ ] Toggle crash reporting
- [ ] All settings persist

---

### Test on Real Devices

**Devices to test:**
- [ ] iPhone (smallest screen - iPhone SE)
- [ ] iPhone (largest screen - Pro Max)
- [ ] iPad (if supporting)
- [ ] Different iOS versions (17.0+)

**Test in both orientations (if supporting landscape)**

---

## App Store Preparation

### Guideline 4.3(a) — differentiate before submit

Apple rejects **spam / template similarity** when your **binary, metadata, or primary concept** looks too close to other apps. Complete **[checklists/APP_STORE_4_3_HARDENING.md](checklists/APP_STORE_4_3_HARDENING.md)** before upload: Release `strings` audit, branding map, module removal notes, Review Notes template. Prompt pack: **[prompts/AppStore4_3Hardening.prompts.md](prompts/AppStore4_3Hardening.prompts.md)**.

### Create App Store Connect Listing

**Manual Steps:**

#### 1. Create App Record

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → **+** → New App
3. Fill in:
   - Platform: iOS
   - Name: Your App Name
   - Primary Language: English
   - Bundle ID: com.yourcompany.yourapp
   - SKU: yourapp-ios (any unique string)

#### 2. Write App Description

**Tips:**
- Lead with benefits, not features
- Use bullet points (scannable)
- Include keywords naturally (ASO)
- Keep under 4,000 characters

**Template:**

```
[Your App] is an AI-powered [category] that helps you [main benefit].

FEATURES:
• AI Chat - Get instant answers with advanced AI models
• Smart Conversations - Chat history saved and searchable
• Premium Themes - Beautiful dark mode and custom themes
• Cross-Device Sync - Access from all your devices
• Privacy-First - Your data stays secure

PERFECT FOR:
• [Your target audience]
• [Another user type]
• [Another use case]

PREMIUM FEATURES:
• Unlimited AI messages
• Access to GPT-4 and Claude
• Priority support
• [Your unique features]

[Your Company] is committed to [your values].

Privacy Policy: https://yourapp.com/privacy
Terms of Service: https://yourapp.com/terms
```

#### 3. Prepare Screenshots

**Required sizes:**
- 6.9" (iPhone 17 Pro Max): 1320 × 2868 pixels — required for current App Store submissions
- 6.5" (older Pro Max): 1284 × 2778 pixels
- 5.5" (older Plus): 1242 × 2208 pixels
- 12.9" iPad Pro: 2048 × 2732 pixels (if supporting iPad)

**Recommended tool:** Use Xcode simulator → ⌘S to capture

**Best practices:**
- 4-10 screenshots per device size
- Show key features (onboarding, chat, settings, paywall)
- Add text overlay explaining features
- Use consistent style/theme
- First screenshot is most important (shows in search)

#### 4. Create App Preview Video (Optional)

**Specs:**
- 15-30 seconds
- Portrait orientation
- Same sizes as screenshots
- No audio required (but nice to have)

**Content:**
- Show app in use (not just screens)
- Highlight unique features
- Keep it snappy

---

### Configure App Metadata

**Manual Steps in App Store Connect:**

#### 1. App Information

- **Category:** Productivity / Utilities / Education (choose one)
- **Secondary Category:** (optional)
- **Content Rights:** "Does not use third-party content"

#### 2. Pricing & Availability

- **Price:** Free (subscription monetization)
- **Availability:** All countries or select specific ones

#### 3. Age Rating

**Answer questionnaire honestly:**
- Medical/Treatment Information? Usually "No"
- Unrestricted Web Access? "Yes" (if app uses web views)
- Usually results in: **4+** or **12+** rating

#### 4. App Privacy

**Click "Get Started"** and answer:

**Do you collect data?**
- ✅ Yes

**Data types collected:**
- **Contact Info:** Email address (for account)
- **Identifiers:** User ID (for backend)
- **Usage Data:** App interactions (if analytics enabled)
- **User Content:** Chat messages, profile data

**For each, specify:**
- [ ] Linked to identity
- [ ] Used for tracking
- Purpose: App functionality

#### 5. Export Compliance

**Does your app use encryption?**
- Select "Yes" (all iOS apps use HTTPS)
- Select "No" for custom encryption

**Result:** Usually exempt (standard HTTPS)

---

## Launch Checklist

### Pre-Submission Checklist

**Code Quality:**
- [ ] All tests pass (`⌘U`)
- [ ] No warnings in build
- [ ] App runs on real device (not just simulator)
- [ ] Tested on iPhone and iPad (if universal)
- [ ] No crashes in common flows
- [ ] Performance is smooth (no lag)

**Configuration:**
- [ ] Config/Secrets.xcconfig created and filled with real API keys
- [ ] Ran `bash scripts/update-config.sh` to generate production config
- [ ] Verified Configuration.swift contains real values (not placeholders)
- [ ] Real backend configured (not Mock/Echo clients)
- [ ] Bundle ID matches App Store Connect
- [ ] Version number set (e.g., 1.0.0)
- [ ] Build number set (start at 1)

**Legal:**
- [ ] Privacy policy updated with your info
- [ ] Terms of service updated with your info
- [ ] Subscription terms updated with pricing
- [ ] Privacy policy URL works (host on website)
- [ ] Terms URL works

**App Store Assets:**
- [ ] Screenshots for all required sizes
- [ ] App icon (1024×1024)
- [ ] App description written
- [ ] Keywords added (100 character limit)
- [ ] Support URL set
- [ ] Marketing URL set (optional)
- [ ] App preview video (optional)

**Subscriptions (if using):**
- [ ] Products created in App Store Connect
- [ ] Products configured in RevenueCat
- [ ] Paywall shows correct prices
- [ ] Tested purchase with sandbox account
- [ ] Tested restore purchases
- [ ] Subscription terms clearly displayed

**Privacy:**
- [ ] App Privacy questionnaire completed
- [ ] Privacy manifest accurate
- [ ] Info.plist permissions justified
- [ ] No tracking without consent

---

### Build for Release

**Manual Steps:**

#### 1. Archive Build

```
1. Xcode → Product → Archive
2. Wait for archive to complete
3. Organizer window opens
```

#### 2. Validate Archive

```
In Organizer:
1. Select your archive
2. Click "Validate App"
3. Choose options:
   - [ ] Upload symbols (yes)
   - [ ] Manage Version and Build Number (no)
4. Click "Validate"
5. Fix any errors
```

#### 3. Upload to App Store

```
In Organizer:
1. Click "Distribute App"
2. Choose "App Store Connect"
3. Next → Upload
4. Wait for processing (~5-10 minutes)
```

#### 4. Submit for Review

```
In App Store Connect:
1. Your app → TestFlight tab
2. Verify build appears
3. Test in TestFlight (recommended)
4. When ready: App Store tab → Version → Submit for Review
```

**Review time:** Typically 24-48 hours

---

### TestFlight Beta (Recommended)

**Before submitting to App Store, test with real users:**

#### 1. Enable TestFlight

1. App Store Connect → TestFlight
2. Your build should appear
3. Fill in "What to Test" notes

#### 2. Add Internal Testers

1. TestFlight → Internal Testing
2. Add team members (up to 100)
3. They receive email invite
4. Install via TestFlight app

#### 3. Add External Testers (Optional)

1. Create group: "Beta Testers"
2. Add email addresses (up to 10,000)
3. Requires beta review (1-2 days)
4. Public link available

#### 4. Gather Feedback

- Ask testers to test all flows
- Fix critical bugs before App Store submission
- Iterate with new builds as needed

---

## Production Deployment

### Final Configuration

**What you're doing:** Switching from development/staging to production.

**Manual Steps:**

#### 1. Remove Debug Flags

**File:** `SwiftAIBoilerplatePro/Composition/FeatureFlags.swift`

**For production builds:**

```swift
public static var crashlyticsEnabled: Bool {
    #if DEBUG
    return false
    #else
    return true  // ← Enable in production
    #endif
}
```

**In Xcode Scheme:**
- Edit Scheme → Run → Arguments → Environment Variables
- **Remove all debug flags:**
  - ❌ Delete `AUTH_BYPASS` (if present)
  - ❌ Delete any test flags

#### 2. Verify Production Config

**File:** `Config/Secrets.xcconfig`

**Checklist:**
- [ ] SUPABASE_URL points to production (not staging)
- [ ] SUPABASE_ANON_KEY is production key
- [ ] REVENUECAT_API_KEY is production key (not sandbox)
- [ ] PROXY_BASE_URL is production Edge Function
- [ ] No test/mock values

#### 3. Set App Version

**In Xcode:**
- Select project → Target → General
- **Version:** `1.0.0` (semantic versioning)
- **Build:** `1` (increment for each upload)

**For updates:**
- Bump version: `1.0.0` → `1.1.0` (new features) or `1.0.1` (bug fixes)
- Increment build: `1` → `2` → `3` ...

#### 4. Configure Build Settings for Release

**In Xcode:**
- Select project → Target → Build Settings
- Search for "Optimization Level"
- Verify Release = "Optimize for Speed [-O]"
- Search for "Debug Information Format"
- Verify Release = "DWARF with dSYM"

---

### Post-Launch

#### 1. Monitor Crashlytics (if enabled)

- Check Firebase Console → Crashlytics
- Fix critical crashes immediately
- Release hotfix if needed

#### 2. Monitor Reviews

- Check App Store Connect daily
- Respond to user feedback
- Fix reported bugs in updates

#### 3. Track Metrics

- App Store Connect → Analytics
- RevenueCat → Dashboard (subscription metrics)
- Supabase → API usage

#### 4. Plan Updates

- Collect feature requests
- Prioritize based on user feedback
- Release updates regularly (every 2-4 weeks ideal)

---

## Common Customization Recipes

### Add New Feature to Home Screen

**Task:** Add a "Saved Prompts" feature card.

**Manual Steps:**

1. **Add to HomeContent:**

**File:** `SwiftAIBoilerplatePro/AppShell/HomeContent.swift`

```swift
public let features: [FeatureData] = [
    // ... existing features ...
    FeatureData(
        icon: "bookmark.fill",
        title: "Saved Prompts",
        description: "Your favorite prompts",
        tag: "New"
    ),
]
```

2. **Handle tap action:**

**File:** `SwiftAIBoilerplatePro/AppShell/HomeView.swift`

```swift
// Find where features are tapped:
.onTapGesture {
    switch feature.title {
    case "AI Chat":
        // existing...
    case "Saved Prompts":
        // Navigate to your new feature
        navigationPath.append(.savedPrompts)
    default:
        break
    }
}
```

3. **Create the feature** (if it doesn't exist yet - see "Add New SwiftData Model" below)

**AI-Assisted Alternative:**

```
Add a "Saved Prompts" feature card to the home screen:
1. Add FeatureData with bookmark icon
2. Handle tap to navigate to SavedPromptsView
3. Use DesignSystem tokens for styling

Follow the pattern in HomeContent.swift and HomeView.swift.
```

---

### Add New SwiftData Model

**Task:** Add "SavedPrompt" model for storing favorite prompts.

**Manual Steps:**

#### 1. Create Model

**Create file:** `Packages/Storage/Sources/Storage/Models/SavedPrompt.swift`

```swift
import Foundation
import SwiftData

@Model
public final class SavedPrompt {
    @Attribute(.unique) public var id: UUID
    public var title: String
    public var content: String
    public var category: String?
    public var createdAt: Date
    public var isFavorite: Bool
    
    public init(
        title: String,
        content: String,
        category: String? = nil
    ) {
        self.id = UUID()
        self.title = title
        self.content = content
        self.category = category
        self.createdAt = Date()
        self.isFavorite = false
    }
}

// DTO for passing data
public struct SavedPromptDTO: Identifiable, Sendable {
    public let id: UUID
    public let title: String
    public let content: String
    public let category: String?
    public let createdAt: Date
    public let isFavorite: Bool
    
    public init(_ model: SavedPrompt) {
        self.id = model.id
        self.title = model.title
        self.content = model.content
        self.category = model.category
        self.createdAt = model.createdAt
        self.isFavorite = model.isFavorite
    }
}
```

#### 2. Add to Schema

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`

**Find:**
```swift
let schema = Schema([
    Conversation.self,
    Message.self,
    Settings.self
])
```

**Change to:**
```swift
let schema = Schema([
    Conversation.self,
    Message.self,
    Settings.self,
    SavedPrompt.self  // Add this
])
```

#### 3. Create Repository

**Create file:** `Packages/Storage/Sources/Storage/Repositories/SavedPromptRepository.swift`

```swift
import Foundation
import SwiftData
import Core

public protocol SavedPromptRepository: Sendable {
    func create(title: String, content: String, category: String?) async throws -> SavedPromptDTO
    func list(category: String?) async throws -> [SavedPromptDTO]
    func delete(id: UUID) async throws
    func toggleFavorite(id: UUID) async throws
}

@available(iOS 17.0, *)
@MainActor
public final class SavedPromptRepositoryImpl: SavedPromptRepository {
    private let modelContext: ModelContext

    public init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    // NOTE: Storage repositories are @MainActor-pinned under Swift 6 (v2.0 P0 data-race fix).
    // Callers from non-main code must `await` into the repository. Do not reintroduce
    // `nonisolated(unsafe)` on `modelContext` — `ModelContext` is not thread-safe.
    
    public func create(title: String, content: String, category: String?) async throws -> SavedPromptDTO {
        let prompt = SavedPrompt(title: title, content: content, category: category)
        modelContext.insert(prompt)
        
        do {
            try modelContext.save()
            AppLogger.debug("Created saved prompt: \(prompt.id)", category: AppLogger.storage)
            return SavedPromptDTO(prompt)
        } catch {
            AppLogger.error("Failed to create prompt: \(error)", category: AppLogger.storage)
            throw StorageError.underlying(error)
        }
    }
    
    public func list(category: String?) async throws -> [SavedPromptDTO] {
        var descriptor = FetchDescriptor<SavedPrompt>(
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        
        if let category = category {
            descriptor.predicate = #Predicate { $0.category == category }
        }
        
        do {
            let prompts = try modelContext.fetch(descriptor)
            return prompts.map(SavedPromptDTO.init)
        } catch {
            AppLogger.error("Failed to list prompts: \(error)", category: AppLogger.storage)
            throw StorageError.underlying(error)
        }
    }
    
    public func delete(id: UUID) async throws {
        let descriptor = FetchDescriptor<SavedPrompt>(
            predicate: #Predicate { $0.id == id }
        )
        
        guard let prompt = try modelContext.fetch(descriptor).first else {
            throw StorageError.notFound
        }
        
        modelContext.delete(prompt)
        try modelContext.save()
    }
    
    public func toggleFavorite(id: UUID) async throws {
        let descriptor = FetchDescriptor<SavedPrompt>(
            predicate: #Predicate { $0.id == id }
        )
        
        guard let prompt = try modelContext.fetch(descriptor).first else {
            throw StorageError.notFound
        }
        
        prompt.isFavorite.toggle()
        try modelContext.save()
    }
}
```

#### 4. Add to CompositionRoot

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`

**Add property:**
```swift
// MARK: - Repositories
public let conversationRepository: ConversationRepository
public let messageRepository: MessageRepository
public let settingsRepository: SettingsRepository
public let savedPromptRepository: SavedPromptRepository  // Add this
```

**Initialize in init():**
```swift
// 4. Repositories
self.conversationRepository = ConversationRepositoryImpl(modelContext: mainContext)
self.messageRepository = MessageRepositoryImpl(modelContext: mainContext)
self.settingsRepository = SettingsRepositoryImpl(modelContext: mainContext)
self.savedPromptRepository = SavedPromptRepositoryImpl(modelContext: mainContext)  // Add this
```

#### 5. Create ViewModel

**Create file:** `SwiftAIBoilerplatePro/AppShell/SavedPromptsViewModel.swift`

```swift
import Foundation
import Storage
import Core

@MainActor
@Observable
public final class SavedPromptsViewModel {
    var prompts: [SavedPromptDTO] = []
    var isLoading = false
    var errorMessage: String?
    
    private let repository: SavedPromptRepository
    
    public init(repository: SavedPromptRepository) {
        self.repository = repository
    }
    
    public func loadPrompts() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            prompts = try await repository.list(category: nil)
        } catch {
            errorMessage = "Failed to load prompts"
            AppLogger.error("Load prompts failed: \(error)", category: AppLogger.ui)
        }
    }
    
    public func deletePrompt(id: UUID) async {
        do {
            try await repository.delete(id: id)
            await loadPrompts()
        } catch {
            errorMessage = "Failed to delete prompt"
            AppLogger.error("Delete prompt failed: \(error)", category: AppLogger.ui)
        }
    }
}
```

#### 6. Create View

**Create file:** `SwiftAIBoilerplatePro/AppShell/SavedPromptsView.swift`

```swift
import SwiftUI
import DesignSystem
import Storage

struct SavedPromptsView: View {
    @State private var viewModel: SavedPromptsViewModel
    
    init(viewModel: SavedPromptsViewModel) {
        self.viewModel = viewModel
    }
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.prompts) { prompt in
                    VStack(alignment: .leading, spacing: DSSpacing.sm) {
                        Text(prompt.title)
                            .font(DSTypography.titleM)
                            .foregroundStyle(DSColors.textPrimary)
                        
                        Text(prompt.content)
                            .font(DSTypography.body)
                            .foregroundStyle(DSColors.textSecondary)
                            .lineLimit(2)
                    }
                    .padding(.vertical, DSSpacing.sm)
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        Task {
                            await viewModel.deletePrompt(id: viewModel.prompts[index].id)
                        }
                    }
                }
            }
            .navigationTitle("Saved Prompts")
            .task {
                await viewModel.loadPrompts()
            }
        }
    }
}
```

#### 7. Wire Up Factory

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift`

**Add factory method:**

```swift
// Add after other factory methods:
public func makeSavedPromptsViewModel() -> SavedPromptsViewModel {
    SavedPromptsViewModel(repository: savedPromptRepository)
}
```

#### 8. Navigate from Home

**File:** `SwiftAIBoilerplatePro/AppShell/HomeView.swift`

```swift
// Add to navigation handling:
case "Saved Prompts":
    let viewModel = composition.makeSavedPromptsViewModel()
    navigationPath.append(SavedPromptsView(viewModel: viewModel))
```

**AI-Assisted Alternative:**

```
Create a SavedPrompt feature following the repository pattern:
1. Create SavedPrompt model in Storage (id, title, content, category, createdAt)
2. Create SavedPromptRepository protocol and implementation
3. Add to SwiftData schema in CompositionRoot
4. Create SavedPromptsViewModel (@Observable, @MainActor)
5. Create SavedPromptsView (List with delete swipe action)
6. Wire up in CompositionRoot factory method
7. Navigate from home screen feature card

Follow patterns in docs/Storage.md and maintain <300 lines per file.
```

---

## LLM Prompts Library

**Quick reference of ready-to-use prompts for common tasks.**

### Branding
```
Change primary color to #FF6B6B (red) and test in light/dark mode
```

```
Replace app icon with ~/Desktop/icon.png and verify all sizes generated
```

### UI Customization
```
Add animated gradient background to onboarding screens using DSGradient
```

```
Change chat input bar to have rounded corners (24pt) and subtle shadow
```

```
Add pull-to-refresh to chat history view
```

### Features
```
Add voice message recording to chat using AVAudioRecorder. Show waveform while recording.
```

```
Add image upload to chat messages using PhotosPicker pattern from ProfileView
```

```
Add search bar to chat history that filters by conversation title and content
```

### Backend
```
Enable Supabase chat sync following docs/CHAT_SYNC_SETUP.md completely
```

```
Add Google Analytics tracking for: app opens, chats started, messages sent
```

### Monetization
```
Add usage limits: 20 messages/day for free users, unlimited for Pro
```

```
Create 3-tier paywall: Free, Basic ($4.99), Pro ($9.99) with feature comparison
```

---

## Troubleshooting

### App Won't Build

**Check:**
- [ ] Config/Secrets.xcconfig exists (not .example)
- [ ] All required fields filled in Secrets.xcconfig
- [ ] Clean build folder (⌘⇧K)
- [ ] Dependencies resolved (File → Packages → Resolve)

**Common errors:**
- "Missing Config/Secrets.xcconfig" → Copy from Secrets.example.xcconfig
- "SUPABASE_URL not set" → Fill in Secrets.xcconfig
- "Cannot find AppConfiguration" → Configuration.swift missing from target, re-add it
- Package resolution fails → Check internet, retry

### Auth Not Working

**Check:**
- [ ] Removed AUTH_BYPASS environment variable
- [ ] SUPABASE_URL and SUPABASE_ANON_KEY correct
- [ ] Supabase project is active
- [ ] Auth enabled in Supabase Dashboard → Authentication

**Test:**
- Try signing up → Check Supabase Dashboard → Authentication → Users
- User should appear in table

### Chat Not Getting Responses

**Check:**
- [ ] PROXY_BASE_URL set correctly
- [ ] PROXY_PATH set to `/ai`
- [ ] Edge Function deployed: `supabase functions list`
- [ ] OPENROUTER_API_KEY secret set
- [ ] OpenRouter account has credits

**Test:**
- Check logs for ProxyLLMClient errors
- Try Edge Function directly: `curl https://your-url/functions/v1/ai`

### Paywall Not Showing Products

**Check:**
- [ ] Products created in App Store Connect
- [ ] Products synced to RevenueCat
- [ ] REVENUECAT_API_KEY correct
- [ ] Tested on real device (not simulator for first time)

**Test:**
- Check RevenueCat Dashboard → Customers (your test user should appear)
- Verify offerings configured correctly

---

## Resources

### Documentation

**Essential reading:**
- [CLAUDE.md](CLAUDE.md) - Coding guidelines (for AI assistants)
- [INDEX.md](INDEX.md) - Complete documentation hub
- [foundations/Architecture.md](foundations/Architecture.md) - System design

**Setup guides:**
- [integrations/Supabase.md](integrations/Supabase.md) - Backend deployment
- [integrations/RevenueCat.md](integrations/RevenueCat.md) - Subscription setup
- [integrations/OneSignal.md](integrations/OneSignal.md) - Push notifications (optional)
- [integrations/ChatSync.md](integrations/ChatSync.md) - Cross-device sync
- [integrations/ProfilePhotos.md](integrations/ProfilePhotos.md) - Cloud photo storage

**Module documentation:**
All modules have customization recipes - see [INDEX.md](INDEX.md)

### External Services

- [Supabase Dashboard](https://app.supabase.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [OpenRouter Dashboard](https://openrouter.ai/dashboard)
- [Firebase Console](https://console.firebase.google.com) (optional - Crashlytics)

### Tools

- [appicon.co](https://appicon.co) - Generate app icons
- [SF Symbols](https://developer.apple.com/sf-symbols/) - Browse icons
- [Figma](https://figma.com) - Design screenshots

---

## Quick Launch Path

**Fastest way to production:**

### Phase 1: Setup & Run
1. ✅ Clone and run app (mock mode)
2. ✅ Understand architecture ([docs/architecture-overview.md](docs/architecture-overview.md))

### Phase 2: Branding
1. ✅ Change app name
2. ✅ Replace app icon
3. ✅ Customize colors
4. ✅ Update onboarding

### Phase 3: Backend
1. ✅ Create Supabase project
2. ✅ Deploy Edge Function
3. ✅ Configure API keys
4. ✅ Test real auth and chat

### Phase 4: Customize
1. ✅ Modify home screen
2. ✅ Customize chat experience
3. ✅ Add your unique features
4. ✅ Configure subscriptions (if using)

### Phase 5: Legal
1. ✅ Update privacy policy
2. ✅ Update terms of service
3. ✅ Update subscription terms
4. ✅ Add Info.plist descriptions

### Phase 6: Launch
1. ✅ Run full test suite
2. ✅ Test on real devices
3. ✅ Prepare App Store assets
4. ✅ Submit for review
5. ✅ Launch! 🚀

---

## Success Tips

### For Manual Development
- ✅ Follow file paths exactly as written
- ✅ Use ⌘⇧F to search for code snippets
- ✅ Keep files under 300 lines (extract components if needed)
- ✅ Test after each change
- ✅ Commit to git frequently

### For AI-Assisted Development
- ✅ Always include "Follow patterns in [docs/Module.md]"
- ✅ Reference CLAUDE.md in prompts
- ✅ Ask for tests after implementation
- ✅ Request verification that changes compile
- ✅ One feature at a time (incremental)

### General
- ✅ Start simple, add features gradually
- ✅ Test on real device early and often
- ✅ Use TestFlight before App Store submission
- ✅ Listen to beta tester feedback
- ✅ Keep documentation updated

---

**Ready to build? Start with Phase 1 above, then work through each phase at your own pace!**

Questions? Check [INDEX.md](INDEX.md) for complete documentation.
