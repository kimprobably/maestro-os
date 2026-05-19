# SAST Security Audit: Final Report

**Project:** SwiftAIBoilerplatePro-Distribution
**Date:** 2026-04-08
**Branch:** feature/swift6-ios26-migration
**Scanner:** SAST Skills (utkusen/sast-skills) + Claude Opus 4.6
**Scope:** Full codebase (11 Swift packages, Supabase Edge Function, SQL migrations)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **CRITICAL** | 4 |
| **HIGH** | 7 |
| **MEDIUM** | 7 |
| **LOW** | 7 |
| **INFO/PASS** | 4 |
| **Total** | **29** |

The audit identified **4 critical vulnerabilities** that require immediate attention. The most severe is a **complete paywall bypass** (BL-001) where the free tier message limit is dead code. Combined with **no server-side enforcement** on the AI edge function, any authenticated user has unlimited, unmetered access to the AI API. The third critical finding is an **IDOR in a SECURITY DEFINER function** that leaks any user's conversation metadata. The fourth is **error message information disclosure** in the edge function.

**Positive findings:** The codebase demonstrates strong security fundamentals -- Keychain token storage, PII redaction in logs, RLS on all database tables, no hardcoded secrets in committed code, proxy architecture keeping API keys server-side, and type-safe deserialization throughout.

---

## Critical Findings (Fix Immediately)

### 1. BL-001: Free Tier Message Limit is Dead Code (Paywall Bypass)

| | |
|---|---|
| **File** | `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift:310-316` |
| **CWE** | CWE-284 (Improper Access Control) |
| **Source** | Business Logic Scan |

`CompositionRoot.makeChatViewModel()` never passes `paymentsStatusProvider` to `ChatViewModel`. The parameter defaults to `nil`, so the `if let provider = paymentsStatusProvider` check at `ChatViewModel.swift:103` always fails. **All users get unlimited messages regardless of subscription status.**

The `PaymentsStatusAdapter` class exists but is never instantiated.

**Fix (1 line):**
```swift
// CompositionRoot.swift line 313 - add paymentsStatusProvider:
ChatViewModel(
    conversationID: conversationID,
    messageRepository: messageRepository,
    llmClient: llmClient,
    paymentsStatusProvider: PaymentsStatusAdapter(paymentsClient: paymentsClient)
)
```

---

### 2. BL-002: No Server-Side AI Usage Enforcement

| | |
|---|---|
| **File** | `supabase/functions/ai/index.ts` (entire file) |
| **CWE** | CWE-770 (Allocation of Resources Without Limits), CWE-284 |
| **Source** | Business Logic Scan |

The Supabase Edge Function only validates auth (JWT), then proxies directly to OpenRouter with:
- No message count/quota enforcement
- No rate limiting
- No subscription verification
- No model allowlist (users can request expensive models)
- No message array size validation

**Any authenticated user can `curl` the endpoint directly and consume unlimited AI API credits.**

**Fix:** Add server-side enforcement to the edge function:
```typescript
// 1. Model allowlist
const ALLOWED_MODELS = ['openai/gpt-3.5-turbo', 'openai/gpt-4o-mini'];
if (!ALLOWED_MODELS.includes(model)) return error(400, 'Invalid model');

// 2. Message array limits
if (messages.length > 50) return error(400, 'Too many messages');
for (const m of messages) {
    if (!['user', 'assistant'].includes(m.role)) return error(400, 'Invalid role');
    if (m.content.length > 10000) return error(400, 'Message too long');
}

// 3. Rate limiting via usage table
// 4. Subscription verification via RevenueCat server API or user_metadata
```

---

### 3. CRIT-01: IDOR via `get_conversation_with_stats` SECURITY DEFINER

| | |
|---|---|
| **File** | `supabase/migrations/20241016000000_chat_sync.sql:130-157` |
| **CWE** | CWE-639 (IDOR), CWE-862 (Missing Authorization) |
| **Source** | Missing Auth / IDOR Scan |

The `get_conversation_with_stats` function is `SECURITY DEFINER` (bypasses RLS) and has **no `auth.uid()` filter**. Any authenticated user can call `supabaseClient.rpc("get_conversation_with_stats", { conversation_uuid: "..." })` with any UUID and retrieve another user's conversation title, persona name, message count, and timestamps.

**Fix:**
```sql
WHERE c.id = conversation_uuid AND c.user_id = auth.uid()
```

---

### 4. INJ-001: Error Message Leaks Internal Server State

| | |
|---|---|
| **File** | `supabase/functions/ai/index.ts:138-147` |
| **CWE** | CWE-209 (Information Exposure Through Error Messages) |
| **Source** | Injection Scan |

The catch block returns `error.message` directly to the client, potentially leaking server paths, configuration, Deno runtime details, and OpenRouter API key fragments.

**Fix (5 min):**
```typescript
catch (error) {
    console.error('Function error:', error)
    return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}
```

---

## High Findings (Fix This Sprint)

### 5. BL-003: No Model Parameter Validation (Cost Escalation)
- **File:** `supabase/functions/ai/index.ts:44,78`
- **Risk:** Users can specify expensive models (GPT-4-32k, Claude Opus) to drain API credits
- **Fix:** Add model allowlist in edge function

### 6. BL-004: No Rate Limiting on Edge Function
- **File:** `supabase/functions/ai/index.ts`
- **Risk:** Unlimited request frequency enables rapid cost abuse
- **Fix:** Implement per-user rate limiting via Supabase usage table

### 7. BL-005: Unbounded Messages Array (Token Stuffing)
- **File:** `supabase/functions/ai/index.ts:44-53`
- **Risk:** Thousands of messages can be sent per request, maximizing token consumption
- **Fix:** Cap messages array length and individual message length

### 8. BL-006: Per-Conversation Limit Bypassed by Creating New Conversations
- **File:** `ChatViewModel.swift:106`, `ChatHistoryViewModel.swift`
- **Risk:** Free users create unlimited conversations, each with a fresh 10-message limit
- **Fix:** Change to global per-user limit, enforce server-side

### 9. BL-007: Subscription Status Validated Client-Side Only
- **File:** `PaymentsStatusAdapter.swift`, Edge function
- **Risk:** Jailbroken devices can spoof RevenueCat responses
- **Fix:** Add server-side subscription verification in edge function

### 10. INJ-003: Persistent Prompt Injection via Memory System
- **File:** `ChatViewModel.swift:127-149, 182-189`
- **Risk:** Malicious text stored as "memories" persists across conversations and gets injected into LLM prompts
- **Fix:** Inject memories as a separate system message; sanitize stored memory content

### 11. INJ-004: Client Can Inject System Messages to LLM
- **File:** `supabase/functions/ai/index.ts:44`
- **Risk:** Client can submit messages with `role: "system"`, overriding intended behavior
- **Fix:** Filter out system role messages server-side; prepend server-controlled system prompt

---

## Medium Findings (Fix Next Sprint)

| # | ID | Finding | File |
|---|---|---|---|
| 12 | HS-006 | `update-config.sh` writes real secrets into committed `Configuration.swift` | `scripts/update-config.sh` |
| 13 | MED-01 | `cleanup_old_conversations` fragile SECURITY DEFINER pattern | `chat_sync.sql:160-175` |
| 14 | MED-02 | Custom `sai://` URL scheme hijackable | DeepLink.swift |
| 15 | MED-03 | Deep link `conversationId` not validated as UUID | DeepLink.swift |
| 16 | MED-04 | DeviceTokenUploader has no standalone auth dependency | DeviceTokenUploader.swift |
| 17 | INJ-005 | Wildcard CORS on edge function | `ai/index.ts:5` |
| 18 | INJ-006 | OpenRouter error responses forwarded to client | `ai/index.ts:85-93` |

---

## Low Findings (Backlog)

| # | ID | Finding | File |
|---|---|---|---|
| 19 | HS-011 | Debug bypass uses `placeholder.supabase.co` (domain squatting risk) | `SwiftAIBoilerplatePro.swift` |
| 20 | BL-008 | Race condition in send() limit check | `ChatViewModel.swift:95-118` |
| 21 | BL-014 | `PROXY_DEFAULT_HEADERS` read from env in release | `CompositionRoot.swift:429` |
| 22 | LOW-01 | Local SwiftData repos have no auth checks | ConversationRepositoryImpl.swift |
| 23 | LOW-02 | Notification reply text not sanitized | ReplyActionBus.swift |
| 24 | PTR-001 | Profile photo path uses unsanitized userId | SupabaseProfilePhotoStorageClient.swift |
| 25 | PTR-002 | Conversation title/persona not sanitized for display | ChatRowCard.swift |

---

## Positive Security Findings (PASS)

| # | Finding | Details |
|---|---|---|
| P1 | No hardcoded secrets in committed code | `Secrets.xcconfig` gitignored; `Configuration.swift` uses placeholders |
| P2 | No RCE vectors | No `eval()`, `exec()`, `Process()`, `NSKeyedUnarchiver` in production code |
| P3 | Auth tokens stored in iOS Keychain | Proper use of `SecureStore` for access/refresh tokens |
| P4 | RLS enabled on all database tables | Proper `auth.uid() = user_id` policies on SELECT/INSERT/UPDATE/DELETE |
| P5 | UUIDv4 for all identifiers | Brute-force enumeration infeasible (122-bit randomness) |
| P6 | PII redaction in logging | `AppLogger.redacted()` masks JWT, Bearer tokens, API keys |
| P7 | Proxy architecture | LLM API keys never leave the server |
| P8 | Actor-isolated SessionManager | Thread-safe token refresh with proper concurrency |
| P9 | Debug mock auth gated by `#if DEBUG` | Compile-time guard, not present in release builds |
| P10 | Type-safe deserialization | Exclusive `Codable`/`JSONDecoder` usage, no unsafe unarchiving |

---

## Remediation Priority Matrix

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| **P0 (Today)** | BL-001: Wire up PaymentsStatusAdapter | 5 min | Enables paywall enforcement |
| **P0 (Today)** | INJ-001: Generic error messages in edge function | 5 min | Stops info leakage |
| **P0 (Today)** | CRIT-01: Add auth.uid() to get_conversation_with_stats | 10 min | Fixes IDOR |
| **P1 (This Week)** | BL-003: Model allowlist in edge function | 15 min | Prevents cost abuse |
| **P1 (This Week)** | INJ-004: Strip client system messages | 20 min | Prevents prompt override |
| **P1 (This Week)** | INJ-006: Sanitize OpenRouter errors | 10 min | Stops info leakage |
| **P1 (This Week)** | BL-005: Validate messages array bounds | 15 min | Prevents token stuffing |
| **P2 (This Sprint)** | BL-002: Server-side usage tracking | 2-4 hrs | Enables real enforcement |
| **P2 (This Sprint)** | BL-004: Rate limiting | 2-4 hrs | Prevents abuse |
| **P2 (This Sprint)** | BL-007: Server-side subscription check | 4-8 hrs | Prevents spoofing |
| **P3 (Next Sprint)** | BL-006: Global per-user message limit | 2-4 hrs | Proper metering |
| **P3 (Next Sprint)** | INJ-003: Memory injection mitigation | 2-4 hrs | Prevents persistent prompt injection |
| **P3 (Next Sprint)** | HS-006: Pre-commit hook for Configuration.swift | 1 hr | Prevents secret leaks |
| **P4 (Backlog)** | MED-02: Migrate to Universal Links | 4-8 hrs | Prevents scheme hijacking |
| **P4 (Backlog)** | INJ-005: Restrict CORS | 10 min | Defense in depth |

---

## Scan Artifacts

| File | Description |
|---|---|
| `sast/architecture.md` | Technology stack, data flows, trust boundaries |
| `sast/hardcodedsecrets-results.md` | Hardcoded secrets scan (12 findings) |
| `sast/businesslogic-results.md` | Business logic scan (14 findings) |
| `sast/missingauth-results.md` | Missing auth & IDOR scan (11 findings) |
| `sast/injection-results.md` | Injection, SSRF, path traversal, RCE scan (12 findings) |
| `sast/final-report.md` | This consolidated report |
