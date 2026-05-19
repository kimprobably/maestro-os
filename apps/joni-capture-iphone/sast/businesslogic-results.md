# SAST Business Logic Security Scan Results

**Project:** SwiftAIBoilerplatePro  
**Scan Date:** 2026-04-08  
**Scanner:** Manual SAST - Business Logic Analysis  
**Scope:** Paywall bypass, race conditions, auth bypass, subscription validation, edge function security

---

## CRITICAL Severity

### BL-001: Free Tier Message Limit Completely Unenforced (Paywall Bypass)

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift` (line 310-316)  
**Related:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` (lines 43, 58, 103-113)

**Description:**  
The `makeChatViewModel` factory method in `CompositionRoot` does **not** pass a `paymentsStatusProvider` to `ChatViewModel`. The parameter defaults to `nil`. In `ChatViewModel.send()` (line 103), the limit check is:

```swift
if let provider = paymentsStatusProvider {
    // ... check limit
}
```

Because `paymentsStatusProvider` is always `nil`, the `if let` unwrap fails and the entire free tier limit (10 messages/conversation) is **never enforced**. All users effectively have unlimited messages regardless of subscription status.

The `PaymentsStatusAdapter` class exists at `SwiftAIBoilerplatePro/Composition/PaymentsStatusAdapter.swift` but is **never instantiated or passed** to the view model factory.

**Impact:** Complete paywall bypass. Free users can send unlimited messages. The 10-message limit is dead code.

**Remediation:**  
```swift
// CompositionRoot.swift - makeChatViewModel should inject the adapter:
public func makeChatViewModel(conversationID: UUID) -> ChatViewModel {
    ChatViewModel(
        conversationID: conversationID,
        messageRepository: messageRepository,
        llmClient: llmClient,
        paymentsStatusProvider: PaymentsStatusAdapter(paymentsClient: paymentsClient)
    )
}
```

---

### BL-002: Message Limit is Client-Side Only (No Server Enforcement)

**File:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` (lines 102-113)  
**File:** `supabase/functions/ai/index.ts` (entire file)

**Description:**  
Even if BL-001 is fixed, the 10-message limit is checked **only in the client-side ViewModel**. The Supabase Edge Function (`supabase/functions/ai/index.ts`) performs zero server-side enforcement:

- No message count check per user or conversation
- No rate limiting of any kind
- No usage tracking or quota enforcement
- The function only checks `auth.getUser()` for authentication, then immediately proxies to OpenRouter

A user with a valid auth token can call the edge function directly (e.g., via `curl`) and bypass the client-side limit entirely. The `messages` array in the request body is forwarded directly to OpenRouter without any size validation.

**Impact:** Any authenticated user can consume unlimited AI API credits by calling the edge function directly, completely circumventing the paywall.

**Remediation:**  
Add server-side enforcement in the edge function:
1. Query a `usage` table to count messages per user/conversation
2. Check subscription status server-side (e.g., via RevenueCat server-side API or Supabase `user_metadata`)
3. Enforce rate limits (e.g., X requests per minute per user)
4. Validate and cap the `messages` array length

---

### BL-003: Edge Function - No Model Parameter Validation (Cost Escalation)

**File:** `supabase/functions/ai/index.ts` (line 44, line 78)

**Description:**  
The `model` parameter is accepted from the client request and forwarded directly to OpenRouter without any validation or allowlist:

```typescript
const { messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7 } = await req.json()
// ...
body: JSON.stringify({ model, messages, temperature, stream: true })
```

An authenticated user can specify any model available on OpenRouter, including expensive ones like `anthropic/claude-opus-4-0-20250514` or `openai/gpt-4-32k`, leading to dramatically higher API costs.

**Impact:** Cost escalation attack. An attacker can specify expensive models and consume the project's OpenRouter API credits at a much higher rate than intended.

**Remediation:**  
Add a model allowlist in the edge function:
```typescript
const ALLOWED_MODELS = ['openai/gpt-3.5-turbo', 'openai/gpt-4o-mini'];
if (!ALLOWED_MODELS.includes(model)) {
    return new Response(JSON.stringify({ error: 'Invalid model' }), { status: 400 });
}
```

---

## HIGH Severity

### BL-004: Edge Function - No Rate Limiting

**File:** `supabase/functions/ai/index.ts`

**Description:**  
The edge function has no rate limiting mechanism. An authenticated user can send unlimited requests in rapid succession. There is no:
- Per-user request throttling
- Per-IP rate limiting
- Concurrent request limiting
- Daily/monthly usage caps

Combined with BL-002 and BL-003, this allows rapid, unlimited consumption of expensive AI API credits.

**Impact:** Denial of wallet / cost abuse. An attacker can rapidly drain the OpenRouter API budget.

**Remediation:**  
Implement rate limiting using Supabase's built-in capabilities or a rate limiting table:
- Track requests per user in a `usage` table
- Enforce per-minute and per-day limits
- Return HTTP 429 when limits are exceeded

---

### BL-005: Edge Function - Unbounded Messages Array (Prompt Injection / Cost Abuse)

**File:** `supabase/functions/ai/index.ts` (lines 44-53, 77-83)

**Description:**  
The `messages` array from the request body is validated only for existence and being an array (line 46). There is no validation of:
- Maximum number of messages (an attacker can send thousands of messages in the history)
- Maximum length of individual message content
- Role values (only "user"/"assistant"/"system" should be allowed)
- Total token count

This allows:
1. **Token stuffing:** Sending extremely long messages or many messages to maximize token consumption (and cost)
2. **System prompt injection:** Injecting arbitrary `system` role messages to override behavior
3. **Context window abuse:** Filling the entire context window to degrade model performance

**Impact:** Cost abuse through token stuffing; potential prompt injection via crafted system messages.

**Remediation:**  
Add input validation:
```typescript
if (messages.length > 50) return errorResponse('Too many messages', 400);
const validRoles = ['user', 'assistant', 'system'];
for (const msg of messages) {
    if (!validRoles.includes(msg.role)) return errorResponse('Invalid role', 400);
    if (msg.content.length > 10000) return errorResponse('Message too long', 400);
}
```

---

### BL-006: Conversation Reset Bypasses Per-Conversation Limit

**File:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` (line 106)  
**File:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatHistoryViewModel.swift` (line 37-41)

**Description:**  
The message limit (if it were enforced, see BL-001) counts messages **per conversation**:

```swift
let userMessageCount = messages.filter { $0.role == .user }.count
if userMessageCount >= kFreeMessageLimit { ... }
```

A free user can trivially bypass this by creating a new conversation via `ChatHistoryViewModel.createNewConversation()`, which has no limits on conversation creation. This resets the counter to 0, giving another 10 free messages. This can be repeated indefinitely.

**Impact:** Even with BL-001 fixed, the limit provides no meaningful restriction since conversations are unlimited and free to create.

**Remediation:**  
Change the limit to be global (per user, per day/month) rather than per conversation. Ideally enforce this server-side (see BL-002).

---

### BL-007: Subscription Status Validated Client-Side Only (RevenueCat Spoofing)

**File:** `Packages/Payments/Sources/Payments/RevenueCat/RevenueCatClient.swift`  
**File:** `SwiftAIBoilerplatePro/Composition/PaymentsStatusAdapter.swift`  
**File:** `supabase/functions/ai/index.ts`

**Description:**  
Subscription status is checked entirely on the client via RevenueCat SDK. The edge function does not verify subscription status server-side. The flow is:

1. RevenueCat SDK checks entitlements locally
2. `PaymentsStatusProvider.currentState()` returns `isSubscribed`
3. `ChatViewModel` uses this to decide whether to enforce limits

There is no server-side subscription verification. On a jailbroken device, the RevenueCat SDK response can be intercepted (via tools like Frida, MITM proxies, or runtime hooks) to always return `isSubscribed: true`, bypassing any client-side paywall checks.

The edge function only checks Supabase auth -- it has zero awareness of subscription status.

**Impact:** Subscription status can be spoofed on jailbroken/modified devices to bypass all paywall restrictions.

**Remediation:**  
Add server-side subscription verification:
1. Use RevenueCat's server-side REST API or webhooks to sync subscription status to a Supabase `subscriptions` table
2. Check this table in the edge function before proxying AI requests
3. Include subscription tier in the JWT custom claims

---

## MEDIUM Severity

### BL-008: Race Condition - Concurrent Sends Can Bypass Message Limit

**File:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` (lines 95-118)

**Description:**  
The `send()` method checks the message count at line 106, then proceeds to send without locking. Although `ChatViewModel` is `@MainActor` (which serializes access), the `send()` method contains multiple `await` suspension points. Between the limit check (line 106) and the actual message persistence (line 153), other calls to `send()` could be queued and execute their limit checks before the first message is persisted.

The `isSending` flag (line 118) is set **after** the limit check, not before, so it does not serve as a concurrency guard for the limit:

```swift
// Line 102-118:
if let provider = paymentsStatusProvider {        // Check limit
    let state = await provider.currentState()      // await suspension point
    if !state.isSubscribed {
        let userMessageCount = messages.filter { ... }.count
        if userMessageCount >= kFreeMessageLimit { ... }
    }
}
// ... lines later:
isSending = true                                   // Guard set AFTER check
```

While `@MainActor` provides some protection, the `await` suspension points allow interleaving. Multiple rapid taps could queue multiple `send()` calls that all pass the limit check before any increments the count.

**Impact:** Minor bypass of message limit by 1-2 messages via rapid concurrent sends. Low practical impact since BL-001 means limits are not enforced anyway.

**Remediation:**  
Move `isSending = true` (and a guard check) before the limit check, or use a dedicated `isCheckingLimit` flag.

---

### BL-009: Temperature Parameter Not Validated in Edge Function

**File:** `supabase/functions/ai/index.ts` (line 44)

**Description:**  
The `temperature` parameter is accepted from the client and forwarded to OpenRouter without validation:

```typescript
const { messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7 } = await req.json()
```

While not a direct security vulnerability, invalid temperature values (negative, extremely high) could cause unexpected behavior or errors from the upstream API.

**Impact:** Low. Mostly a robustness concern.

**Remediation:**  
Validate temperature is within the expected range (0.0 to 2.0).

---

### BL-010: CORS Allows All Origins on Edge Function

**File:** `supabase/functions/ai/index.ts` (line 5)

**Description:**  
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
```

The edge function allows requests from any origin. While the auth token requirement mitigates unauthorized access, the wildcard CORS policy means any website can make authenticated requests if it obtains a user's token (e.g., via XSS on another domain).

**Impact:** Medium. Widens the attack surface for token-based attacks. In a mobile-only context this is less critical, but if tokens are ever exposed via web views, any site could use them.

**Remediation:**  
Restrict `Access-Control-Allow-Origin` to specific trusted origins, or remove CORS headers entirely if the function is only called from mobile clients.

---

## LOW Severity

### BL-011: Mock Auth Properly Gated to DEBUG (Confirmed Safe)

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift` (lines 190-195)

**Description:**  
The mock auth bypass uses Swift's compile-time `#if DEBUG` directive:

```swift
#if DEBUG
let authBypassValue = ProcessInfo.processInfo.environment["AUTH_BYPASS"]
let shouldUseMock = authBypassValue != "0"
#else
let shouldUseMock = false  // Never use mock in production
#endif
```

This is a **compile-time** check. In RELEASE builds, the `shouldUseMock` variable is hard-coded to `false` and the mock auth code is stripped by the compiler. The `AUTH_BYPASS` environment variable cannot affect production builds.

**Status:** PASS - No vulnerability.

---

### BL-012: Environment Variable Feature Flags in Release Builds

**File:** `SwiftAIBoilerplatePro/Composition/FeatureFlags.swift` (lines 10, 19, 31)

**Description:**  
In RELEASE builds, feature flags like `DIAGNOSTICS_ENABLED`, `CRASHLYTICS_ENABLED`, and `CHAT_SYNC_ENABLED` are read from `ProcessInfo.processInfo.environment`. While environment variables cannot typically be set on a production iOS device (they require Xcode scheme configuration or jailbreak), this pattern is unconventional. On jailbroken devices, environment variables could theoretically be injected at launch.

However, none of these flags control security-sensitive behavior (diagnostics, crash reporting, chat sync). The chat sync flag currently has no effect since the sync code is commented out.

**Impact:** Minimal. No security-sensitive flags exposed via environment variables in release mode.

**Remediation:**  
Consider using compile-time flags (`#if`) or server-driven feature flags for release builds instead of environment variables.

---

### BL-013: Auth Token Refresh Race Condition (Mitigated by Actor)

**File:** `Packages/Auth/Sources/Auth/Session/SessionManager.swift` (lines 264-268)

**Description:**  
The `SessionManager` uses an `isRefreshing` boolean flag to prevent concurrent refresh attempts:

```swift
guard !isRefreshing else { return }
```

Because `SessionManager` is declared as an `actor`, all access is serialized through the actor's executor, making this check thread-safe. The `AuthInterceptor` does not auto-retry 401s (line 38 of AuthInterceptor.swift: "does not handle retries"), so there is no retry-loop race between token refresh and API calls.

**Status:** PASS - Properly mitigated by actor isolation.

---

### BL-014: PROXY_DEFAULT_HEADERS from Environment in Release Builds

**File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift` (lines 429-430)

**Description:**  
```swift
if let headersJson = ProcessInfo.processInfo.environment["PROXY_DEFAULT_HEADERS"] {
    defaultHeaders = parseHeadersJSON(headersJson)
}
```

This code reads custom headers from environment variables without a `#if DEBUG` guard. In theory, on a jailbroken device, an attacker could inject custom headers into LLM proxy requests. However, the practical risk is low since the AuthInterceptor adds the Bearer token separately and takes precedence.

**Impact:** Low. Could allow injection of arbitrary HTTP headers into AI proxy requests on jailbroken devices.

**Remediation:**  
Wrap in `#if DEBUG` or remove environment-based header injection for release builds.

---

## Summary

| Severity | Count | IDs |
|----------|-------|-----|
| CRITICAL | 3 | BL-001, BL-002, BL-003 |
| HIGH | 4 | BL-004, BL-005, BL-006, BL-007 |
| MEDIUM | 3 | BL-008, BL-009, BL-010 |
| LOW | 4 | BL-011 (pass), BL-012, BL-013 (pass), BL-014 |

### Priority Remediation Order

1. **BL-001** (CRITICAL): Wire up `PaymentsStatusAdapter` in `makeChatViewModel` -- one-line fix to enable the existing dead-code limit
2. **BL-002** (CRITICAL): Add server-side usage enforcement in the edge function
3. **BL-003** (CRITICAL): Add model allowlist in the edge function
4. **BL-004** (HIGH): Add rate limiting to the edge function
5. **BL-005** (HIGH): Validate messages array bounds in the edge function
6. **BL-006** (HIGH): Change message limit from per-conversation to per-user global
7. **BL-007** (HIGH): Add server-side subscription verification
8. **BL-008** (MEDIUM): Fix send() race condition by moving guard before limit check
