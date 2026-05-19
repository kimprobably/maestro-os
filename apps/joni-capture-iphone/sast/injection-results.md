# SAST Security Scan Results: Injection, SSRF, Path Traversal, RCE

**Scan Date:** 2026-04-08
**Target:** SwiftAIBoilerplatePro-Distribution (iOS AI Chat App + Supabase Edge Function)
**Scanner:** Manual SAST review (Claude Code)
**Scope:** SSRF, Injection, Path Traversal, RCE

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1     |
| HIGH     | 3     |
| MEDIUM   | 3     |
| LOW      | 3     |
| INFO     | 2     |

---

## CRITICAL

### INJ-001: Edge Function Error Message Leaks Internal State
- **Category:** Information Disclosure / Injection Enabler
- **File:** `supabase/functions/ai/index.ts` (line 141)
- **Code:**
  ```typescript
  catch (error) {
      console.error('Function error:', error)
      return new Response(
          JSON.stringify({ error: error.message }),  // <-- CRITICAL
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
  ```
- **Risk:** The raw `error.message` from uncaught exceptions is returned directly to the client. This can leak:
  - Internal server paths and Deno runtime details
  - Database connection strings or configuration if a DB error propagates
  - Stack trace fragments that reveal framework versions
  - OpenRouter API key fragments if an auth error occurs during the `fetch()` call
- **Exploitation:** An attacker can craft malformed requests to trigger different exception paths, then use the error messages to map the server's internal architecture, dependency versions, and configuration.
- **Remediation:**
  ```typescript
  catch (error) {
      console.error('Function error:', error)
      return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }
  ```
  Log the full error server-side but return only a generic message to the client.

---

## HIGH

### INJ-002: No Model Parameter Validation Enables SSRF via OpenRouter
- **Category:** SSRF (Server-Side Request Forgery)
- **File:** `supabase/functions/ai/index.ts` (lines 44, 69-83)
- **Code:**
  ```typescript
  const { messages, model = 'openai/gpt-3.5-turbo', temperature = 0.7 } = await req.json()
  // ...
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      body: JSON.stringify({ model, messages, temperature, stream: true }),
  })
  ```
- **Risk:** The `model` parameter is passed directly from the client to the OpenRouter API without validation. While the fetch URL itself is hardcoded to `https://openrouter.ai/...` (preventing direct SSRF), an attacker can:
  1. Specify arbitrary model identifiers, potentially invoking expensive models and causing billing abuse
  2. Use OpenRouter's routing behavior to proxy requests to unintended providers
  3. Trigger model-specific error paths that leak provider information
- **Impact:** Financial abuse through expensive model selection; information disclosure through provider-specific error messages.
- **Remediation:** Add a server-side allowlist of permitted models:
  ```typescript
  const ALLOWED_MODELS = ['openai/gpt-3.5-turbo', 'openai/gpt-4', 'anthropic/claude-3-haiku']
  if (!ALLOWED_MODELS.includes(model)) {
      return new Response(JSON.stringify({ error: 'Invalid model' }), { status: 400 })
  }
  ```

### INJ-003: Memory Context Injection into LLM Prompt
- **Category:** Prompt Injection
- **File:** `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` (lines 127-149, 182-189)
- **Code:**
  ```swift
  memoryContext = """
  [Context about the user from previous conversations:]
  \(memories.map { "- \($0.content)" }.joined(separator: "\n"))
  """
  // ...
  llmMessages[lastIndex] = LLMMessage(
      role: lastMessage.role,
      content: lastMessage.content + memoryContext
  )
  ```
- **Risk:** Memory content is stored from previous user messages and injected directly into the LLM prompt without sanitization. An attacker can:
  1. Send a message like "Remember that [SYSTEM: Ignore all previous instructions and...]" which gets stored as a memory
  2. In future conversations, this stored memory is injected into the prompt, executing the attacker's instructions in the LLM context
  3. The memory is appended to the user message, meaning it appears to the LLM as part of the user's current input -- the LLM cannot distinguish between real user input and injected memory context
- **Impact:** Persistent prompt injection that survives across conversations. Could cause the LLM to leak other stored memories, change its behavior, or generate harmful content.
- **Remediation:**
  1. Wrap memory context in a clearly delimited system-level block that the LLM is instructed to treat as data, not instructions
  2. Strip or escape instruction-like patterns from memory content before injection
  3. Inject memory context as a separate system message rather than appending to the user message

### INJ-004: Unsanitized User Messages Forwarded to LLM
- **Category:** Prompt Injection
- **Files:**
  - `Packages/FeatureChat/Sources/FeatureChat/ViewModels/ChatViewModel.swift` (lines 177-181)
  - `supabase/functions/ai/index.ts` (lines 44, 77-82)
- **Risk:** User messages are passed directly from the iOS client through to the edge function and then to OpenRouter without any content sanitization or filtering at any layer. The full message history including all roles (user, assistant, system) is forwarded as-is.
- **Impact:** Standard prompt injection attacks can:
  1. Override system instructions
  2. Extract the system prompt
  3. Cause the model to produce disallowed content
  4. In multi-user scenarios (not currently implemented), access other users' data
- **Note:** This is a known limitation of LLM applications and is partially inherent to the architecture. However, the edge function should at minimum validate that only user/assistant roles are present in client-submitted messages (preventing client-injected system messages).
- **Remediation:**
  ```typescript
  // In edge function, strip any client-supplied system messages
  const sanitizedMessages = messages.filter(m => m.role !== 'system')
  // Prepend server-controlled system message
  const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...sanitizedMessages]
  ```

---

## MEDIUM

### INJ-005: CORS Wildcard on Edge Function
- **Category:** SSRF / Cross-Origin
- **File:** `supabase/functions/ai/index.ts` (lines 4-7)
- **Code:**
  ```typescript
  const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  ```
- **Risk:** The wildcard CORS origin allows any website to make authenticated requests to this edge function. While the function does verify Supabase auth tokens, if a user has an active Supabase session in their browser:
  1. A malicious website could invoke the AI endpoint using the user's session cookie
  2. This would consume the user's API quota / billing
  3. The response (AI-generated content) could be read by the malicious site
- **Mitigating Factor:** The function requires an `Authorization` header with a valid Supabase JWT, which limits cookie-based CSRF. However, if the app has a web companion or if tokens are stored in localStorage, this becomes exploitable.
- **Remediation:** Replace `*` with the specific allowed origins:
  ```typescript
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://your-app.com'
  ```

### INJ-006: OpenRouter API Error Response Forwarded to Client
- **Category:** Information Disclosure
- **File:** `supabase/functions/ai/index.ts` (lines 85-93)
- **Code:**
  ```typescript
  if (!response.ok) {
      const error = await response.text()
      return new Response(
          JSON.stringify({ error: `OpenRouter API error: ${error}` }),
          { status: response.status, ... }
      )
  }
  ```
- **Risk:** The raw error response from OpenRouter is forwarded to the client. OpenRouter error messages may contain:
  - API key prefix or format hints
  - Provider-specific error details
  - Rate limit information revealing usage patterns
  - Internal routing information
- **Remediation:** Map OpenRouter errors to generic client-facing messages:
  ```typescript
  if (!response.ok) {
      console.error('OpenRouter error:', await response.text())
      const clientMessage = response.status === 429 ? 'Rate limited' : 'AI service unavailable'
      return new Response(JSON.stringify({ error: clientMessage }), { status: response.status })
  }
  ```

### INJ-007: SECURITY DEFINER Functions Bypass RLS
- **Category:** SQL Injection / Privilege Escalation
- **File:** `supabase/migrations/20241016000000_chat_sync.sql` (lines 130-175)
- **Code:**
  ```sql
  CREATE OR REPLACE FUNCTION get_conversation_with_stats(conversation_uuid UUID)
  RETURNS TABLE (...) AS $$
  BEGIN
      RETURN QUERY SELECT ... FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.id = conversation_uuid
      ...
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
- **Risk:** Both `get_conversation_with_stats` and `cleanup_old_conversations` are declared `SECURITY DEFINER`, meaning they execute with the privileges of the function owner (typically `postgres`), bypassing Row Level Security policies.
  - `get_conversation_with_stats`: Takes a UUID parameter and returns conversation data. Any authenticated user can query ANY conversation by UUID, because RLS is bypassed.
  - `cleanup_old_conversations`: Correctly filters by `auth.uid()` inside the function body, which partially mitigates the RLS bypass.
- **Impact:** `get_conversation_with_stats` is an **IDOR vulnerability** -- any authenticated user can read any other user's conversation metadata (title, persona_name, message count, timestamps) by guessing or enumerating UUIDs.
- **Remediation:** Add `auth.uid()` filtering inside the SECURITY DEFINER function, or change to `SECURITY INVOKER`:
  ```sql
  -- Option 1: Add user check (keep SECURITY DEFINER)
  WHERE c.id = conversation_uuid AND c.user_id = auth.uid()
  
  -- Option 2: Use SECURITY INVOKER (RLS applies naturally)
  $$ LANGUAGE plpgsql SECURITY INVOKER;
  ```

---

## LOW

### PTR-001: Profile Photo Storage Path Uses Unsanitized userId
- **Category:** Path Traversal
- **File:** `Packages/Storage/Sources/Storage/SupabaseProfilePhotoStorageClient.swift` (lines 34-35)
- **Code:**
  ```swift
  let filename = "\(userId)_\(timestamp).jpg"
  let path = "avatars/\(filename)"
  ```
- **Risk:** The `userId` is interpolated directly into the storage path without sanitization. If `userId` contained path traversal characters (e.g., `../../../etc/passwd`), it could potentially write to unintended storage paths.
- **Mitigating Factors:**
  1. The code is currently commented out (disabled)
  2. The `userId` comes from Supabase Auth, which generates UUIDs -- format is controlled server-side
  3. Supabase Storage SDK likely sanitizes paths internally
- **Remediation:** When enabling this code, add path sanitization:
  ```swift
  let safeUserId = userId.replacingOccurrences(of: "..", with: "").replacingOccurrences(of: "/", with: "")
  ```

### PTR-002: Conversation Title and Persona Name Not Sanitized for Display
- **Category:** Path Traversal / Injection (Low risk)
- **Files:**
  - `Packages/Storage/Sources/Storage/Repositories/ConversationRepository.swift` (line 23)
  - `Packages/FeatureChat/Sources/FeatureChat/Views/Components/ChatRowCard.swift` (lines 38-39)
- **Risk:** Conversation titles and persona names are stored and displayed without sanitization. While SwiftUI's `Text` view is not vulnerable to XSS, if these values were ever used in:
  1. File paths for export
  2. URLs for sharing
  3. HTML rendering (e.g., WKWebView)
  
  Path traversal or injection could occur.
- **Mitigating Factors:**
  1. SQL migration has a length check: `CHECK (char_length(title) <= 500)`
  2. SwiftUI Text rendering is safe against injection
  3. No file I/O or HTML rendering uses these values currently
- **Remediation:** Informational -- no immediate action required. Add sanitization if these values are ever used in file paths or URLs.

### INJ-008: JSONSerialization Used for Header Parsing
- **Category:** Injection
- **File:** `SwiftAIBoilerplatePro/Composition/CompositionRoot.swift` (line 458)
- **Code:**
  ```swift
  let headers = try JSONSerialization.jsonObject(with: data) as? [String: String] ?? [:]
  ```
- **Risk:** `JSONSerialization.jsonObject` is used to parse the `PROXY_DEFAULT_HEADERS` configuration value. While this is a compile-time constant (not user input), `JSONSerialization` can process deeply nested or very large JSON objects, potentially causing CPU or memory exhaustion if the value were ever sourced from user input.
- **Mitigating Factor:** The input comes from `AppConfiguration`, which is a generated compile-time constant, not user-controlled.
- **Remediation:** No action required for current usage. If this ever accepts dynamic input, add size limits or use `JSONDecoder` with strict types.

---

## INFO

### INFO-001: No NSKeyedUnarchiver / Unsafe Deserialization Found
- **Category:** RCE
- **Scan Result:** PASS
- **Details:** No instances of `NSKeyedUnarchiver`, `NSCoding`, or `unarchiveTopLevelObject` were found in any production Swift code under `Packages/`. The codebase exclusively uses `Codable`/`JSONDecoder` for deserialization, which is type-safe and not vulnerable to object injection attacks.

### INFO-002: No eval(), exec(), Process(), or Shell Execution Found
- **Category:** RCE
- **Scan Result:** PASS
- **Details:** No instances of `eval()`, `exec()`, `Process()`, `NSTask`, or `CommandLine` usage were found in production code. All matches were in `.agents/skills/` documentation templates (not compiled code) and are not exploitable.

---

## File Operations Assessment

No `FileManager`, `createFile`, `write(to:)`, or direct file I/O operations were found in any production package code under `Packages/`. The app uses:
- **SwiftData** for local persistence (sandboxed by iOS)
- **Supabase Storage SDK** for remote file storage (server-managed paths)
- **UserDefaults** for profile photo data (key-value, no path traversal risk)
- **Keychain** for tokens (secure enclave, no file paths)

This is a positive security posture -- the absence of direct file operations eliminates an entire class of path traversal vulnerabilities.

---

## Architecture-Level Observations

### Positive Security Patterns
1. **Proxy Architecture:** API keys are server-side only; the iOS app never holds LLM provider keys
2. **Supabase Auth:** JWT-based auth with token refresh; tokens stored in Keychain
3. **Row Level Security:** All tables have RLS policies filtering by `auth.uid()`
4. **Type-Safe Deserialization:** Exclusive use of `Codable`/`JSONDecoder`
5. **Error Redaction:** `AppLogger.redacted()` is used extensively to prevent PII leakage in logs
6. **PII Sanitizer:** `PIISanitizer` exists in Core for filtering sensitive data

### Areas for Improvement
1. **No input validation layer** exists between the client and the edge function for message content
2. **No rate limiting** is implemented in the edge function (relies entirely on OpenRouter's limits)
3. **No request size limit** on the edge function -- large message arrays could cause memory issues
4. **Memory system lacks content sanitization** -- stored memories could contain prompt injection payloads

---

## Remediation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 (Immediate) | INJ-001: Error message leakage | 5 min |
| 2 (Immediate) | INJ-007: SECURITY DEFINER IDOR | 10 min |
| 3 (This Sprint) | INJ-002: Model allowlist | 15 min |
| 4 (This Sprint) | INJ-006: OpenRouter error forwarding | 10 min |
| 5 (This Sprint) | INJ-004: System message filtering | 20 min |
| 6 (Next Sprint) | INJ-003: Memory injection | 2-4 hrs |
| 7 (Next Sprint) | INJ-005: CORS restriction | 10 min |
| 8 (Backlog) | PTR-001: Photo path sanitization | 5 min |
| 9 (Backlog) | PTR-002: Title/persona sanitization | 15 min |
| 10 (Backlog) | INJ-008: Header parsing | N/A |
