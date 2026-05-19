# Architecture: SwiftAIBoilerplatePro

## Technology Stack

| Category | Details |
|---|---|
| Languages | Swift 5.10, TypeScript (Deno for edge functions), SQL |
| Frameworks | SwiftUI, SwiftData, UIKit (AppDelegate), Combine (implicit via async/await) |
| Databases | SwiftData (local, SQLite-backed), Supabase PostgreSQL (remote, optional) |
| Auth mechanism | Supabase GoTrue (Apple Sign In, Google Sign In, Email/Password), Keychain token storage |
| Payments | RevenueCat SDK for StoreKit subscriptions |
| Push Notifications | OneSignal SDK, APNs |
| Infrastructure | Supabase (Auth, Database, Edge Functions, Storage), OpenRouter AI proxy |
| External services | OpenRouter (LLM API), RevenueCat, OneSignal, Apple App Store |
| Package architecture | 11 local Swift packages (modular monolith): AI, Auth, Core, DesignSystem, FeatureChat, FeatureRating, FeatureSettings, Localization, Networking, Payments, Storage |

## Architecture Overview

Modular monolith iOS app using local Swift packages for separation of concerns. Single app target (`SwiftAIBoilerplatePro`) with a `CompositionRoot` for dependency injection. All modules communicate through protocols, enabling mock/real swapping (e.g., `MockAuthClient` in DEBUG, real `SessionManager` in RELEASE).

Key modules:
- **Auth**: Supabase GoTrue authentication (Apple, Google, Email), session/token management via Keychain
- **Networking**: Generic HTTP client with interceptor chain (Auth, Retry, Headers)
- **Storage**: SwiftData persistence for conversations/messages/settings, Keychain for secrets
- **AI**: Proxy-based LLM client streaming via SSE from Supabase Edge Function -> OpenRouter
- **FeatureChat**: Chat UI with message streaming, pagination, memory extraction
- **Payments**: RevenueCat wrapper for subscription management
- **Core**: Shared utilities (DeepLinkBus, ReplyActionBus, Notifications, AppLogger)

## Data Flow

### Authentication Flow
1. User initiates sign-in (Apple/Google/Email)
2. `SessionManager` -> `SupabaseAuthAPI` -> Supabase GoTrue `/auth/v1/token`
3. Response contains access_token + refresh_token
4. Tokens persisted to Keychain via `SecureStore`
5. `AuthInterceptor` automatically attaches Bearer token to subsequent requests
6. Proactive token refresh scheduled 60 seconds before expiry

### Chat/AI Flow
1. User types message in `ChatViewModel`
2. Free tier limit checked (10 messages per conversation for non-subscribers)
3. Message persisted to SwiftData via `MessageRepository`
4. LLM message history built (all conversation messages)
5. Optional: Memory context injected from `MemoryRetriever`
6. `ProxyLLMClient` sends POST to Supabase Edge Function (`/functions/v1/ai`)
7. Edge function validates JWT, forwards to OpenRouter API
8. SSE stream parsed and yielded to UI chunk-by-chunk
9. Final response persisted to SwiftData
10. Memory extraction runs asynchronously

### Deep Link / Notification Reply Flow
1. Push notification arrives via OneSignal/APNs
2. User replies via notification action
3. Reply text stored in `ReplyActionBus` (in-memory)
4. Deep link `sai://chat?conversationId=X` opened
5. `ChatViewModel.handleDeepLink` retrieves reply text and calls `send()`

## Entry Points

| Entry Point | Type | Auth Required | Description |
|---|---|---|---|
| `SwiftAIBoilerplatePro.swift` | App entry | No | SwiftUI App lifecycle |
| `AppDelegate` | UIKit delegate | No | APNs registration, OneSignal init, notification handling |
| `sai://chat?conversationId=X` | Deep link | Implicit (app-local) | Navigate to specific conversation |
| `supabase/functions/ai` | HTTP Edge Function | Yes (JWT) | AI proxy - forwards to OpenRouter |
| Supabase GoTrue `/auth/v1/*` | HTTP API | Varies | Authentication endpoints |

## Trust Boundaries

1. **Mobile App <-> Supabase**: All API calls use Bearer JWT tokens. Auth tokens stored in Keychain. Supabase anon key is public (by design).
2. **Supabase Edge Function <-> OpenRouter**: Server-to-server, API key stored in Supabase environment variables (never on device).
3. **User Input <-> SwiftData**: User messages stored locally via SwiftData ORM (no raw SQL in app code).
4. **Notification Content <-> App**: `conversationId` from notification `userInfo` used to build deep links. Reply text from `UNTextInputNotificationResponse` sent to LLM.
5. **Config/Secrets <-> Binary**: Secrets loaded from `xcconfig` -> generated `Configuration.swift` with placeholders. Real values injected at build time.

## Sensitive Data Inventory

| Data Type | Where Stored | How Accessed | Protection |
|---|---|---|---|
| Access Token (JWT) | iOS Keychain | `KeychainTokenProvider` | Keychain encryption, auto-refresh |
| Refresh Token | iOS Keychain | `SessionManager.loadSession()` | Keychain encryption |
| User email/name | SwiftData + Keychain (JSON) | `AuthUser` model | App sandbox |
| Chat messages | SwiftData (local SQLite) | `MessageRepository` | App sandbox, optional Supabase sync (RLS) |
| Conversation history | SwiftData (local SQLite) | `ConversationRepository` | App sandbox |
| Supabase Anon Key | Compiled in binary (`Configuration.swift`) | `AppConfiguration.SUPABASE_ANON_KEY` | Public by design (RLS enforced) |
| RevenueCat API Key | Compiled in binary (`Configuration.swift`) | `AppConfiguration.REVENUECAT_API_KEY` | Public key (server validates) |
| OpenRouter API Key | Supabase environment variable | Edge function only | Never on device |
| OneSignal App ID | Compiled in binary | `AppConfiguration.ONESIGNAL_APP_ID` | Public identifier |
| Device push token | Sent to backend `/v1/device/register` | `DeviceTokenUploader` | TLS in transit |
| User settings/preferences | SwiftData (local) | `SettingsRepository` | App sandbox |
| Extracted memories | SwiftData (local) | `MemoryRepository` | App sandbox |
