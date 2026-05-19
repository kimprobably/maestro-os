# Hardcoded Secrets Scan Results

**Scan Date:** 2026-04-08
**Tool:** Manual SAST (pattern-based search across all source files)
**Scope:** All `.swift`, `.ts`, `.sql`, `.xcconfig`, `.plist`, `.json`, `.entitlements` files
**Project:** SwiftAIBoilerplatePro-Distribution (11 Swift packages + Supabase Edge Function)

## Summary

**12 findings: 0 vulnerable, 2 likely vulnerable, 5 not vulnerable, 5 needs review**

The project follows strong secrets management practices overall. `Config/Secrets.xcconfig` is gitignored. `Configuration.swift` is committed with only placeholder values. No real API keys, tokens, or passwords were found in committed source code.

---

## Findings

### Finding 1: OneSignal App ID in Documentation Example
- **File**: `docs/integrations/OneSignal.md:83`
- **Classification**: NEEDS MANUAL REVIEW
- **Evidence**:
  ```
  ONESIGNAL_APP_ID = 6a84ad07-853f-4595-9377-383892951ed2
  ```
- **Risk**: If this is a real OneSignal App ID from an actual project, it could be used to send unsolicited push notifications or enumerate subscribers. OneSignal App IDs are semi-public but should still not be shared unnecessarily.
- **Remediation**: Confirm whether this is a real App ID or a fabricated example. If real, replace with a clearly fake UUID like `00000000-0000-0000-0000-000000000000` and add a comment saying "Replace with your own App ID."

---

### Finding 2: JWT Token in Test File (Well-Known Test Token)
- **File**: `Packages/Core/Tests/CoreTests/AppLoggerTests.swift:58`
- **Classification**: NOT VULNERABLE
- **Evidence**:
  ```swift
  let jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  ```
- **Risk**: None. This is the canonical example JWT from jwt.io, widely used in documentation and tests. The payload contains `{"sub":"1234567890","name":"John Doe","iat":1516239022}`. It is signed with the well-known secret "secret".
- **Remediation**: No action needed. Test is verifying the AppLogger redaction feature works correctly on JWT-shaped strings.

---

### Finding 3: Bearer Token Fragments in Test File
- **File**: `Packages/Core/Tests/CoreTests/AppLoggerTests.swift:49,150`
- **Classification**: NOT VULNERABLE
- **Evidence**:
  ```swift
  let token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  ```
- **Risk**: None. This is a truncated, non-functional JWT header used purely to test the AppLogger redaction pattern. Not a complete or real token.
- **Remediation**: No action needed.

---

### Finding 4: Test API Key Pattern in Logger Tests
- **File**: `Packages/Core/Tests/CoreTests/AppLoggerTests.swift:33`
- **Classification**: NOT VULNERABLE
- **Evidence**:
  ```swift
  let apiKey = "sk-1234567890abcdef"
  ```
- **Risk**: None. This is a fabricated test value used to verify the `AppLogger.redacted()` function correctly masks strings matching the `sk-` pattern.
- **Remediation**: No action needed.

---

### Finding 5: Configuration.swift Committed with Placeholder Values
- **File**: `SwiftAIBoilerplatePro/Generated/Configuration.swift:10-16`
- **Classification**: NOT VULNERABLE
- **Evidence**:
  ```swift
  static let SUPABASE_URL = "https://placeholder.supabase.co"
  static let SUPABASE_ANON_KEY = "placeholder-key-for-debug-mode"
  static let REVENUECAT_API_KEY = "placeholder_rc_key"
  static let PROXY_BASE_URL = "https://placeholder.supabase.co/functions/v1"
  static let ONESIGNAL_APP_ID = "placeholder_onesignal_app_id"
  ```
- **Risk**: None currently. Values are explicit placeholders. The `isConfigured()` function checks for "placeholder" and "YOUR" substrings to prevent accidental use. However, the `scripts/update-config.sh` script writes real values into this file, and if a developer forgets to check `.gitignore`, real secrets could be committed.
- **Remediation**: No immediate action needed. The `.gitignore` does NOT ignore `Configuration.swift` (by design, for clone-and-run). Developers should be warned that running `update-config.sh` writes real keys into a committed file. Consider adding a pre-commit hook that scans `Configuration.swift` for non-placeholder values.

---

### Finding 6: Risk of Real Secrets in Configuration.swift After update-config.sh
- **File**: `scripts/update-config.sh:60-61`
- **Classification**: LIKELY VULNERABLE
- **Evidence**:
  ```bash
  echo "    static let $key = \"$value\"" >> "$OUTPUT_FILE"
  ```
  The script reads `Config/Secrets.xcconfig` (gitignored) and writes real values directly into `SwiftAIBoilerplatePro/Generated/Configuration.swift` (committed). If a developer runs `bash scripts/update-config.sh` with real API keys in `Secrets.xcconfig`, then commits, real secrets will enter version control.
- **Risk**: HIGH. Real API keys (Supabase anon key, RevenueCat key, proxy URL) could be committed to git. The `.gitignore` does not exclude `Configuration.swift` because the project is designed to commit it with placeholders.
- **Remediation**: Add a **pre-commit hook** (or CI check) that rejects commits where `Configuration.swift` contains values not matching known placeholder patterns. Alternatively, add `Configuration.swift` to `.gitignore` and generate it at build time via a Run Script build phase.

---

### Finding 7: Test Passwords in Auth Test Files
- **File**: `Packages/Auth/Tests/AuthTests/SessionManagerTests.swift:55,88,104,116,143,212,244,337,375`
- **Classification**: NOT VULNERABLE
- **Evidence**:
  ```swift
  let password = "password123"
  _ = try await manager.signUpWithEmail(email: "test@example.com", password: "password123")
  _ = try await manager.signInWithEmail(email: "wrong@example.com", password: "wrong")
  ```
- **Risk**: None. These are test-only passwords used with a `MockAuthClient` in unit tests. No connection to any real backend occurs. The email addresses (`test@example.com`) are also clearly fabricated.
- **Remediation**: No action needed.

---

### Finding 8: Wildcard CORS in Edge Function
- **File**: `supabase/functions/ai/index.ts:5`
- **Classification**: NEEDS MANUAL REVIEW
- **Evidence**:
  ```typescript
  'Access-Control-Allow-Origin': '*',
  ```
- **Risk**: The wildcard CORS policy allows any origin to call the AI proxy edge function. While the function requires authentication (JWT verification via `supabaseClient.auth.getUser()`), the open CORS could facilitate token-replay attacks from malicious websites if a user's JWT is compromised. This is a common pattern for mobile-first APIs but warrants review.
- **Remediation**: Consider restricting `Access-Control-Allow-Origin` to your specific app domain(s) in production. For a mobile-only app with no web client, CORS is less relevant, but tightening it is still best practice.

---

### Finding 9: SECURITY DEFINER Functions in SQL Migration
- **File**: `supabase/migrations/20241016000000_chat_sync.sql:157,175`
- **Classification**: NEEDS MANUAL REVIEW
- **Evidence**:
  ```sql
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
  Used on `get_conversation_with_stats` and `cleanup_old_conversations` functions.
- **Risk**: `SECURITY DEFINER` functions execute with the privileges of the function owner (typically the database superuser), not the calling user. If there is a SQL injection vulnerability in the function body, it could escalate privileges. In this case, both functions use parameterized queries and include `auth.uid()` checks, reducing risk. However, `get_conversation_with_stats` does NOT filter by `auth.uid()`, meaning any authenticated user could query stats for any conversation UUID.
- **Remediation**: Add `WHERE c.user_id = auth.uid()` to `get_conversation_with_stats` to enforce row-level authorization within the function. Consider changing to `SECURITY INVOKER` if RLS policies should apply.

---

### Finding 10: Config/Secrets.xcconfig Contains Partial URL Patterns
- **File**: `Config/Secrets.xcconfig:4,5,8,13`
- **Classification**: NEEDS MANUAL REVIEW
- **Evidence**:
  ```
  SUPABASE_URL = https://...
  SUPABASE_ANON_KEY = ...
  REVENUECAT_API_KEY = ...
  PROXY_BASE_URL = https://.../functions/v1
  ```
- **Risk**: The file is gitignored (confirmed in `.gitignore` line 34), but it exists on disk with ellipsis placeholders rather than the `YOUR_*` placeholder pattern. The values `https://...` and `...` could be partially-filled real values left by a developer. If the `.gitignore` rule is accidentally removed, these could be committed.
- **Remediation**: Verify that the current values in `Config/Secrets.xcconfig` are truly placeholders and not partial real values. The ellipsis format differs from the `Secrets.example.xcconfig` pattern (`YOUR_*`), which could confuse the `isConfigured()` validation logic.

---

### Finding 11: Debug Mode Placeholder Keys in Production Code Path
- **File**: `SwiftAIBoilerplatePro/SwiftAIBoilerplatePro.swift:127-128,156`
- **Classification**: LIKELY VULNERABLE
- **Evidence**:
  ```swift
  #if DEBUG
  if ProcessInfo.processInfo.environment["AUTH_BYPASS"] == "1" {
      return AuthConfig(
          supabaseURL: URL(string: "https://placeholder.supabase.co")!,
          supabaseAnonKey: "placeholder-key-for-debug-mode"
      )
  }
  #endif
  ```
  And:
  ```swift
  #if DEBUG
  if ProcessInfo.processInfo.environment["AUTH_BYPASS"] == "1" {
      return PaymentsConfig(
          apiKey: "debug_mode_placeholder_key",
          entitlementID: "pro"
      )
  }
  #endif
  ```
- **Risk**: MEDIUM. These placeholders are guarded by `#if DEBUG` and an environment variable check, so they will not appear in release builds. However, in debug builds with `AUTH_BYPASS=1`, the app connects to `https://placeholder.supabase.co` with a fake key. If someone registers `placeholder.supabase.co`, they could potentially intercept debug auth requests. More practically, this is a development convenience pattern that is safe if developers understand it.
- **Remediation**: Consider using `localhost` or `127.0.0.1` instead of `placeholder.supabase.co` for debug bypass mode to avoid any risk of domain squatting. Add a comment warning that these URLs should never resolve to a real server.

---

### Finding 12: Documentation Contains Example Key Patterns
- **File**: Multiple documentation files (`docs/modules/Payments.md`, `docs/BUILDING_YOUR_APP.md`, `README.md`, etc.)
- **Classification**: NEEDS MANUAL REVIEW
- **Evidence**:
  ```
  REVENUECAT_API_KEY = appl_YOUR_KEY
  SUPABASE_ANON_KEY = eyJ...YOUR_ANON_KEY...
  supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
  ```
- **Risk**: LOW. All documentation values contain obvious `YOUR_*` placeholder patterns. No real keys are present in any documentation file. The `eyJ...` prefix mimics JWT format but is clearly truncated with `...` and `YOUR_*` markers.
- **Remediation**: No action needed. The placeholder patterns are clear and consistent.

---

## Architecture Assessment

### Positive Security Patterns Found

1. **Secrets.xcconfig is gitignored** (`.gitignore` line 34) - Primary secrets file is properly excluded from version control.
2. **Configuration.swift uses placeholders** - Committed file contains only non-functional placeholder values.
3. **`isConfigured()` validation** - Runtime checks prevent accidental use of placeholder values.
4. **AppLogger.redacted()** - Comprehensive PII/secret redaction in logging (tested for `sk-`, `pk-`, Bearer tokens, JWTs).
5. **RevenueCat key masking** - API key is masked before logging (`maskIdentifier()`).
6. **No `.env` files committed** - No environment files found in the repository.
7. **Edge Function uses environment variables** - `Deno.env.get('OPENROUTER_API_KEY')` keeps the OpenRouter key server-side only.
8. **RLS enabled on all database tables** - Row-Level Security policies enforce user isolation.
9. **JWT verification in Edge Function** - `supabaseClient.auth.getUser()` validates tokens before processing requests.
10. **No private keys or certificates committed** - No `.p12`, `.pem`, `.cer`, or `.pfx` files found.

### Primary Risk

The single most significant risk is **Finding 6**: the `update-config.sh` script writes real secrets into a committed file (`Configuration.swift`). A developer who runs the script and then does `git add -A` or `git add .` will commit real API keys. This is a design tension between "clone-and-run" convenience and secret safety.

### Recommended Priority Actions

| Priority | Action | Finding |
|----------|--------|---------|
| **P1** | Add pre-commit hook to detect non-placeholder values in `Configuration.swift` | #6 |
| **P2** | Add `auth.uid()` check to `get_conversation_with_stats` SQL function | #9 |
| **P2** | Verify OneSignal App ID in docs is not real | #1 |
| **P3** | Use `127.0.0.1` instead of `placeholder.supabase.co` in debug bypass | #11 |
| **P3** | Restrict CORS in production Edge Function | #8 |
