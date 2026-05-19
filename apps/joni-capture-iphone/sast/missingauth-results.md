# SAST Report: Missing Authentication & IDOR Vulnerabilities

**Scan Date:** 2026-04-08
**Scanner:** Claude Opus 4.6 SAST (Manual Code Review)
**Target:** SwiftAIBoilerplatePro-Distribution
**Branch:** feature/swift6-ios26-migration
**Categories:** Missing Authentication, Insecure Direct Object Reference (IDOR), Deep Link Security

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 3     |
| Medium   | 4     |
| Low      | 3     |
| **Total**| **11**|

The most critical finding is a `SECURITY DEFINER` function (`get_conversation_with_stats`) that bypasses Row Level Security and returns any user's conversation data given a UUID. Three high-severity findings relate to missing `user_id` filtering in the Supabase message pagination query, wildcard CORS on the edge function, and the lack of input validation on user-controlled LLM parameters passed to OpenRouter.

---

## Critical Findings

### CRIT-01: `get_conversation_with_stats` SECURITY DEFINER Bypasses RLS (IDOR)

**File:** `supabase/migrations/20241016000000_chat_sync.sql` lines 130-157
**CWE:** CWE-862 (Missing Authorization), CWE-639 (IDOR)

**Description:**
The function `get_conversation_with_stats` is declared as `SECURITY DEFINER`, which means it executes with the **privileges of the function owner** (typically the database superuser/postgres role), not the calling user. It accepts an arbitrary `conversation_uuid` parameter and returns conversation data **without any `auth.uid() = user_id` check**.

```sql
CREATE OR REPLACE FUNCTION get_conversation_with_stats(conversation_uuid UUID)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.user_id, c.title, ...
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.id = conversation_uuid   -- NO user_id filter!
    GROUP BY ...;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Because `SECURITY DEFINER` runs as the function owner, the RLS policies on `conversations` and `messages` are **completely bypassed**. Any authenticated user who knows (or brute-forces) a conversation UUID can call this function via `supabaseClient.rpc("get_conversation_with_stats", params: ...)` and retrieve another user's conversation title, persona name, message count, and last message timestamp.

**Impact:** Full IDOR -- any authenticated user can enumerate and read metadata of any other user's conversations.

**Remediation:**
Add an explicit `auth.uid()` check inside the function body:
```sql
WHERE c.id = conversation_uuid AND c.user_id = auth.uid()
```
Alternatively, change to `SECURITY INVOKER` (Postgres 15+) so that RLS policies are enforced on the calling user's role.

---

## High Findings

### HIGH-01: Supabase Message `page()` Query Missing `user_id` Filter

**File:** `Packages/Storage/Sources/Storage/Repositories/SupabaseMessageRepository.swift` lines 69-106
**CWE:** CWE-862 (Missing Authorization), CWE-639 (IDOR)

**Description:**
The `page(conversationID:after:limit:)` method queries messages by `conversation_id` only, without filtering by `user_id`:

```swift
var query = supabaseClient.database
    .from("messages")
    .select()
    .eq("conversation_id", value: conversationID.uuidString)
    // NO .eq("user_id", value: userId) filter
```

While this code is currently commented out (the Supabase repositories are not active), it is production-ready template code that will be uncommented when Supabase is enabled. The RLS policy on `messages` does enforce `auth.uid() = user_id`, which provides server-side protection. However, defense-in-depth requires the application layer to also filter by `user_id` to prevent accidental exposure if RLS is ever misconfigured or disabled during migration.

**Note:** The `deleteAll`, `batchDelete`, and `append` methods in the same file correctly include `.eq("user_id", value: userId)`. This inconsistency suggests the `page()` omission is a bug.

**Impact:** If RLS were disabled or misconfigured, an attacker who knows a conversation UUID could read all messages from that conversation. With RLS active, the server blocks this, but the code-level gap is a latent vulnerability.

**Remediation:**
Add `.eq("user_id", value: userId)` to the `page()` query for defense-in-depth consistency.

---

### HIGH-02: Wildcard CORS on Edge Function

**File:** `supabase/functions/ai/index.ts` lines 4-7
**CWE:** CWE-942 (Permissive Cross-domain Policy)

**Description:**
The edge function sets `Access-Control-Allow-Origin: '*'`, allowing any origin to make authenticated cross-origin requests:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

Since the `Authorization` header is in the allowed headers list, a malicious website can make cross-origin requests to this edge function using a user's JWT token (if obtained through XSS or token leakage). While mobile apps are not affected by CORS, if this edge function is also accessed via web clients, this is a direct vulnerability.

**Impact:** Enables cross-origin abuse of the AI chat endpoint from any domain. Could be used for unauthorized AI API consumption or abuse if tokens are compromised.

**Remediation:**
Restrict `Access-Control-Allow-Origin` to your specific domain(s) instead of `*`. For mobile-only endpoints, CORS headers can be removed entirely.

---

### HIGH-03: No Input Validation on User-Controlled `model` and `temperature` in Edge Function

**File:** `supabase/functions/ai/index.ts` line 44
**CWE:** CWE-20 (Improper Input Validation)

**Description:**
The edge function accepts `model` and `temperature` directly from the request body and forwards them to OpenRouter without validation:

```typescript
const { messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7 } = await req.json()
```

These values are passed directly to the OpenRouter API call on line 78-80. A malicious user can:
1. Specify expensive models (e.g., `openai/gpt-4-turbo`, `anthropic/claude-3-opus`) to inflate API costs.
2. Set `temperature` to extreme values to degrade output quality.
3. Potentially specify model identifiers that trigger unexpected behavior on OpenRouter.

**Impact:** Financial abuse through model selection, potential for unexpected API behavior.

**Remediation:**
Add an allowlist of permitted models and validate temperature range:
```typescript
const allowedModels = ['openai/gpt-3.5-turbo', 'openai/gpt-4'];
if (!allowedModels.includes(model)) { return error(400, 'Invalid model'); }
if (temperature < 0 || temperature > 2) { return error(400, 'Invalid temperature'); }
```

---

## Medium Findings

### MED-01: `cleanup_old_conversations` SECURITY DEFINER with `auth.uid()` Dependency

**File:** `supabase/migrations/20241016000000_chat_sync.sql` lines 160-175
**CWE:** CWE-863 (Incorrect Authorization)

**Description:**
The `cleanup_old_conversations` function is `SECURITY DEFINER` but correctly includes `AND user_id = auth.uid()` in its WHERE clause. However, `SECURITY DEFINER` functions run as the function owner, which means:
1. If called from a context where `auth.uid()` is NULL (e.g., service role, cron job, or direct database connection), the `auth.uid()` check returns NULL and the DELETE matches zero rows (safe due to NULL comparison semantics).
2. However, this is a fragile pattern. If the condition were accidentally changed to `user_id IS NULL` or the NULL-safety assumption changed, it could delete all users' data.

**Impact:** Currently safe but architecturally fragile. The function should not need `SECURITY DEFINER` since it only accesses the calling user's data.

**Remediation:**
Change to `SECURITY INVOKER` so RLS policies apply naturally, or remove `SECURITY DEFINER` and let the standard RLS DELETE policy handle authorization.

---

### MED-02: Deep Link Scheme Hijacking Risk (`sai://`)

**File:** `Packages/Core/Sources/Core/DeepLink/DeepLink.swift`
**CWE:** CWE-939 (Improper Authorization in Handler for Custom URL Scheme)

**Description:**
The app uses a custom URL scheme `sai://` for deep links. Custom URL schemes on iOS are not protected -- any app can register the same scheme, and iOS does not guarantee which app handles the URL. A malicious app installed on the same device could register `sai://` and intercept deep links intended for this app. The `conversationId` parameter would be leaked to the attacker.

Deep link format: `sai://chat?conversationId=<UUID>`

**Impact:** A malicious app could intercept deep links, learn conversation UUIDs, and potentially use them to attempt IDOR attacks against the Supabase backend.

**Remediation:**
1. Migrate to Universal Links (Associated Domains) which are cryptographically bound to your domain and cannot be hijacked.
2. If custom scheme must be retained, treat conversation IDs received via deep link as untrusted and validate ownership before acting on them.

---

### MED-03: Deep Link `conversationId` Not Validated as UUID

**File:** `Packages/Core/Sources/Core/DeepLink/DeepLink.swift` lines 22-23, `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` lines 336-339
**CWE:** CWE-20 (Improper Input Validation)

**Description:**
The `conversationId` from deep links is stored as a `String` and compared against `conversationID.uuidString` in `ChatViewModel.handleDeepLink()`. The `DeepLink.parse` method only checks for non-empty string, not UUID format:

```swift
if let conversationId = components.queryItems?.first(where: { $0.name == "conversationId" })?.value,
   !conversationId.isEmpty {
    return .chat(conversationId: conversationId)
}
```

While the current code path compares against a valid UUID string (so garbage input simply won't match), there is no format validation to reject malformed input early. If the deep link handling is later extended to pass this string directly to a database query, it could become an injection vector.

**Impact:** Low immediate risk due to string comparison, but a latent injection point if code evolves.

**Remediation:**
Validate that `conversationId` is a valid UUID before accepting it:
```swift
guard let _ = UUID(uuidString: conversationId) else { return nil }
```

---

### MED-04: DeviceTokenUploader Does Not Independently Verify Auth

**File:** `Packages/Networking/Sources/Networking/DeviceTokenUploader.swift`
**CWE:** CWE-306 (Missing Authentication for Critical Function)

**Description:**
The `DeviceTokenUploader` constructs an `HTTPRequest` without setting an `Authorization` header. It relies on the `httpClient` having an `AuthInterceptor` attached. From the `CompositionRoot` (line 258 of AppDelegate), the uploader reuses `environment.compositionRoot.httpClient`, which does have `AuthInterceptor` configured.

However, the `DeviceTokenUploader` itself has no knowledge of or dependency on authentication. If it is ever instantiated with a plain `HTTPClient` without the interceptor (e.g., in a different composition context or test), the device token would be uploaded without authentication, allowing unauthenticated token registration.

Additionally, the request body contains no user identifier -- only `token` and `platform`. This means the backend must infer the user from the JWT. If the backend endpoint does not validate the JWT, anyone could register arbitrary push tokens.

**Impact:** Depends entirely on backend validation. If the backend `/v1/device/register` endpoint does not require auth, arbitrary token registration is possible.

**Remediation:**
1. Add explicit `Authorization` header in `DeviceTokenUploader` or document the auth requirement in the API contract.
2. Ensure the backend endpoint validates the JWT and associates the token with the authenticated user.

---

## Low Findings

### LOW-01: Local SwiftData Repositories Have No Auth/Ownership Checks

**File:** `Packages/Storage/Sources/Storage/Repositories/ConversationRepositoryImpl.swift`
**CWE:** CWE-862 (Missing Authorization)

**Description:**
Local SwiftData repositories (`ConversationRepositoryImpl`, `MessageRepositoryImpl`) have no user ownership checks. Any conversation or message can be accessed, modified, or deleted by ID alone. This is by design for a single-user local database, but if the app ever supports multiple local profiles or shared devices, this becomes a vulnerability.

**Impact:** No impact in the current single-user architecture. Noted for awareness if multi-user features are added.

**Remediation:**
No immediate action needed. Document the single-user assumption. If multi-user support is added, introduce user scoping at the repository level.

---

### LOW-02: Notification Reply Text Not Sanitized

**File:** `Packages/Core/Sources/Core/Notifications/ReplyActionBus.swift`, `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` lines 341-345
**CWE:** CWE-20 (Improper Input Validation)

**Description:**
When a user replies from a notification, the reply text is stored in `ReplyActionBus` and later set as `inputText` in `ChatViewModel`, which triggers `send()`. The text passes through the standard chat pipeline (LLM client) without any special sanitization. Since the text originates from the user's own notification reply (not a remote attacker), the risk is minimal. However, if an attacker could craft a notification with a pre-filled reply (e.g., via push notification payload manipulation), they could inject arbitrary text into the chat.

**Impact:** Minimal -- requires attacker control over push notification payloads, which implies a compromised backend.

**Remediation:**
Trim and length-limit reply text before use. Ensure push notification payloads cannot embed pre-filled reply text.

---

### LOW-03: Conversation IDs Use UUIDv4 (Not Predictable -- Positive Finding)

**File:** `supabase/migrations/20241016000000_chat_sync.sql` line 13, `Packages/Storage/Sources/Storage/Models/Conversation.swift` line 8
**CWE:** N/A (Positive finding)

**Description:**
Both the Supabase database (`uuid_generate_v4()`) and SwiftData model (`UUID()`) use UUIDv4 for conversation and message identifiers. UUIDv4 generates 122 bits of randomness, making brute-force enumeration infeasible (~5.3 x 10^36 possible values).

**Impact:** Positive -- IDOR via ID enumeration is not feasible for random access.

**Remediation:** None needed. This is a correct design choice.

---

## Detailed Analysis Results

### Missing Auth Check Analysis

| Component | Auth Present? | Mechanism | Notes |
|-----------|--------------|-----------|-------|
| Edge Function (`ai/index.ts`) | YES | `supabaseClient.auth.getUser()` validates JWT | Returns 401 on failure. Correct. |
| DeviceTokenUploader | INDIRECT | Relies on `AuthInterceptor` in HTTP client pipeline | No standalone auth. See MED-04. |
| Supabase RLS (conversations) | YES | `auth.uid() = user_id` on SELECT/INSERT/UPDATE/DELETE | Complete coverage. Correct. |
| Supabase RLS (messages) | YES | `auth.uid() = user_id` on SELECT/INSERT/UPDATE/DELETE | Complete coverage. Correct. |
| `get_conversation_with_stats` | **NO** | `SECURITY DEFINER` bypasses RLS, no `auth.uid()` check | **CRIT-01** |
| `cleanup_old_conversations` | YES (fragile) | `SECURITY DEFINER` with `auth.uid()` in WHERE clause | See MED-01. |
| Local SwiftData repos | N/A | Single-user local DB, no auth needed | See LOW-01. |

### IDOR Analysis

| Vector | Exploitable? | Protection | Notes |
|--------|-------------|------------|-------|
| Deep link with other user's conversationId | No (locally) | Local SwiftData only has own data; comparison uses UUID string match | If Supabase sync enabled, RLS blocks remote access |
| `get_conversation_with_stats` RPC | **YES** | None -- SECURITY DEFINER bypasses RLS | **CRIT-01** |
| `page()` in SupabaseMessageRepository | Blocked by RLS | RLS on `messages` table enforces `user_id` | Code-level gap exists (HIGH-01) |
| Brute-force conversation UUIDs | Infeasible | UUIDv4 (122-bit randomness) | LOW-03 (positive) |
| `cleanup_old_conversations` | No | `user_id = auth.uid()` in function body | Scoped to own data |

### Deep Link Security Analysis

| Risk | Severity | Status |
|------|----------|--------|
| Scheme hijacking (`sai://`) | Medium | Custom schemes are inherently hijackable. See MED-02. |
| conversationId validation | Medium | Not validated as UUID format. See MED-03. |
| Reply text injection | Low | Requires compromised push infrastructure. See LOW-02. |

---

## Recommendations Summary (Priority Order)

1. **[CRITICAL]** Add `AND c.user_id = auth.uid()` to `get_conversation_with_stats` or change to `SECURITY INVOKER`.
2. **[HIGH]** Add `.eq("user_id", value: userId)` to `SupabaseMessageRepository.page()` for defense-in-depth.
3. **[HIGH]** Replace wildcard CORS `*` with specific allowed origins in the edge function.
4. **[HIGH]** Add model allowlist and temperature range validation in the edge function.
5. **[MEDIUM]** Change `cleanup_old_conversations` from `SECURITY DEFINER` to `SECURITY INVOKER`.
6. **[MEDIUM]** Migrate from `sai://` custom scheme to Universal Links.
7. **[MEDIUM]** Validate `conversationId` as UUID format in `DeepLink.parse()`.
8. **[MEDIUM]** Add explicit auth requirement documentation/enforcement to `DeviceTokenUploader`.
