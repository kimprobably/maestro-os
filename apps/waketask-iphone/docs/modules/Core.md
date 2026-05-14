# Core Module

Foundation module providing error handling, logging, and shared utilities for all other modules.

> **v2.0 — `@Observable` cross-cutting buses.** `DeepLinkBus` and `ToastCenter` migrated from `ObservableObject` to `@Observable`. Consumers no longer use `.onReceive($x.published)` — read the properties directly from the environment or an `@State` binding and switch to `.onChange(of: x.published) { … }` when you need to react to changes. Public symbols are unchanged.

## Purpose

**What Core owns:**
- Typed error handling with user-friendly messages (`AppError`)
- PII-safe structured logging (`AppLogger`)
- Functional result patterns (`ResultOrError`)
- Theme preference types
- Deep linking types
- Notification permission handling

**What Core does NOT own:**
- Networking logic (see Networking)
- Storage logic (see Storage)
- UI components (see DesignSystem)
- Feature-specific logic (see Feature modules)

## Public API

```swift
import Core

// Error handling
let appError = AppError.network(code: 500, message: "Server error")
print(appError.userMessage)  // "Something went wrong. Please try again."

// Logging with PII redaction
AppLogger.debug("User logged in", category: AppLogger.auth)
AppLogger.error("API key: \(AppLogger.redacted(apiKey))")

// Functional results
let result: ResultOrError<User> = .value(user)
let transformed = result.map { $0.displayName }

// Theme preferences
let theme = UserThemePreference.aurora
print(theme.displayName)  // "Aurora"
```

## Setup

No configuration needed. Core has no external dependencies and no environment variables.

**Integration:**
```swift
// Add to Package.swift dependencies
.product(name: "Core", package: "Core")

// Import in your code
import Core
```

## Example: Error Handling in 3 Steps

### Step 1: Map System Errors

```swift
import Core

func fetchData() async throws -> Data {
    do {
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    } catch {
        // Automatically maps URLError, NSError to AppError
        throw AppError.from(error)
    }
}
```

**Expected result:**
```swift
// URLError.notConnectedToInternet → AppError.network
// User sees: "You're offline. Please check your internet connection."

// URLError.timedOut → AppError.timeout
// User sees: "Request timed out. Please try again."
```

### Step 2: Create Custom Errors

```swift
enum ValidationError: Error {
    case invalidEmail
    case passwordTooShort
}

func validate(email: String, password: String) throws {
    guard email.contains("@") else {
        throw AppError.validation(message: "Please enter a valid email address")
    }
    
    guard password.count >= 8 else {
        throw AppError.validation(message: "Password must be at least 8 characters")
    }
}
```

**Expected result:**
```swift
do {
    try validate(email: "invalid", password: "123")
} catch let error as AppError {
    print(error.userMessage)  
    // "Please enter a valid email address"
}
```

### Step 3: Present to User

```swift
@Observable
@MainActor
final class ViewModel {
    var errorMessage: String?

    func loadData() async {
        do {
            let data = try await fetchData()
            // Process data
        } catch let error as AppError {
            // Show friendly message to user
            self.errorMessage = error.userMessage
        } catch {
            // Fallback for unexpected errors
            self.errorMessage = "An unexpected error occurred"
        }
    }
}
```

**Expected result:**
User sees alert or banner with friendly error message.

## Customization

### Safe Changes

**Add custom error cases:**
```swift
// Define your domain-specific errors
throw AppError.custom(
    code: "FEATURE_DISABLED",
    userMessage: "This feature is not available in your region",
    debugInfo: "User region: \(userRegion)"
)
```

**Add custom logging categories:**
```swift
extension AppLogger.Category {
    static let myFeature = AppLogger.Category("myfeature")
}

AppLogger.info("Feature executed", category: .myFeature)
```

**Add custom theme:**
```swift
// In Core/Theme/UserThemePreference.swift
public enum UserThemePreference: String, Codable, CaseIterable {
    case system
    case light
    case dark
    case aurora
    case obsidian
    case myCustomTheme  // Add this
    
    public var displayName: String {
        switch self {
        case .myCustomTheme: return "My Theme"
        // ... other cases
        }
    }
}
```

### Pitfalls

**Don't:**
- Add business logic to Core (keep it domain-agnostic)
- Import other modules from Core (Core is the foundation)
- Use `print()` instead of `AppLogger`
- Expose force unwraps in public API
- Log sensitive data without redaction

**Do:**
- Keep Core types simple and focused
- Use `AppLogger.redacted()` for API keys, tokens, emails
- Map all errors to `AppError` at boundaries
- Add doc comments for public types

## Where Used

Core is imported by all other modules:

**Directly:**
- `Networking` - Uses AppError, AppLogger
- `Storage` - Uses AppError, AppLogger
- `Auth` - Uses AppError, AppLogger
- `Payments` - Uses AppError, AppLogger
- `AI` - Uses AppError, AppLogger
- `DesignSystem` - Uses UserThemePreference
- `FeatureChat` - Uses AppError, AppLogger
- `FeatureSettings` - Uses AppError, AppLogger, UserThemePreference

**Example usage in Networking:**
```swift
// Networking/HTTPClient.swift
import Core

func execute<R: HTTPRequest>(_ request: R) async throws -> R.Response {
    do {
        let (data, response) = try await session.data(for: urlRequest)
        // ... process response
    } catch {
        let appError = AppError.from(error)
        AppLogger.error("HTTP request failed: \(appError)", category: AppLogger.networking)
        throw appError
    }
}
```

## Tests

### Run Tests

```bash
# From repo root
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:CoreTests

# Or in Xcode
⌘ + U (run all tests)
```

### What's Covered

**AppError:**
- URLError mapping (offline, timeout, 4xx, 5xx)
- HTTP status code mapping
- Retry-After header parsing
- Custom error creation
- User message generation

**AppLogger:**
- Redaction of sensitive strings (API keys, tokens, emails)
- Category-based logging
- OSLog integration
- Privacy-safe defaults

**ResultOrError:**
- Map, flatMap, mapError, bimap operations
- Conversion to/from Swift.Result
- Equatable conformance
- Error propagation

**Coverage:** 95%+ (Core is foundational, needs high coverage)

### Example Test

```swift
import XCTest
@testable import Core

final class AppErrorTests: XCTestCase {
    func testURLError_notConnectedToInternet_mapsToNetworkError() {
        let urlError = URLError(.notConnectedToInternet)
        let appError = AppError.from(urlError)
        
        guard case .network = appError else {
            XCTFail("Expected network error")
            return
        }
        
        XCTAssertEqual(
            appError.userMessage, 
            "You're offline. Please check your internet connection."
        )
    }
}
```

## Troubleshooting

### Issue: Logs Not Appearing

**Symptoms:** `AppLogger` calls don't show output

**Fixes:**
1. Check Console.app (not Xcode console for OSLog)
2. Filter by subsystem: `com.yourapp.SwiftAIBoilerplatePro`
3. Filter by category: `auth`, `networking`, `feature`, etc.
4. Ensure log level is Debug or higher

### Issue: Errors Not Mapping Correctly

**Symptoms:** Generic "Something went wrong" instead of specific message

**Fixes:**
1. Ensure error is being mapped: `AppError.from(error)`
2. Check if error type is supported (URLError, NSError, HTTPStatusCode)
3. Add custom mapping if needed:
   ```swift
   if let myError = error as? MyError {
       throw AppError.custom(...)
   } else {
       throw AppError.from(error)
   }
   ```

### Issue: Redaction Not Working

**Symptoms:** Sensitive data appears in logs

**Fixes:**
1. Use `AppLogger.redacted()`:
   ```swift
   AppLogger.debug("Key: \(AppLogger.redacted(apiKey))")
   ```
2. Check patterns in `AppLogger.redacted()` implementation
3. Add custom patterns if needed

### Issue: Theme Not Changing

**Symptoms:** `UserThemePreference` set but UI doesn't update

**Cause:** Theme preference is just a model type; actual theme application happens in DesignSystem

**Fix:** See [DesignSystem.md](DesignSystem.md) for theme application

### Issue: Build Error "Cannot find Core"

**Symptoms:** `import Core` fails to compile

**Fixes:**
1. Clean build: `⌘ + Shift + K`
2. Reset packages: File → Packages → Reset Package Caches
3. Check Package.swift has Core in dependencies:
   ```swift
   .product(name: "Core", package: "Core")
   ```

## Advanced Usage

### HTTP Error Mapping

```swift
// Core automatically parses Retry-After headers
let response = HTTPURLResponse(
    url: url,
    statusCode: 429,
    httpVersion: nil,
    headerFields: ["Retry-After": "60"]
)

let error = AppError.from(response)
// User message includes retry time
```

### Functional Error Handling

```swift
func fetchUser() async -> ResultOrError<User> {
    do {
        let user = try await api.fetchUser()
        return .value(user)
    } catch {
        return .error(AppError.from(error))
    }
}

// Chain operations
let displayName = fetchUser()
    .map { $0.displayName }
    .mapError { _ in AppError.validation(message: "User not found") }
```

### Custom Log Categories

```swift
// Define in your module
extension AppLogger.Category {
    static let payments = AppLogger.Category("payments")
    static let analytics = AppLogger.Category("analytics")
}

// Use consistently
AppLogger.info("Purchase started", category: .payments)
AppLogger.debug("Event tracked: \(eventName)", category: .analytics)
```

## Related Modules

- [Networking](Networking.md) - Uses Core for errors and logging
- [Storage](Storage.md) - Uses Core for errors and logging
- [DesignSystem](DesignSystem.md) - Uses UserThemePreference
- [foundations/Architecture.md](../foundations/Architecture.md) - Shows Core in system design

---

## `@Observable` migration note (v2.0)

`DeepLinkBus` and `ToastCenter` are now `@Observable`. For consumers migrating from v1.9:

```swift
// ❌ v1.9 (ObservableObject)
@EnvironmentObject var deepLinks: DeepLinkBus
.onReceive(deepLinks.$pending) { link in handle(link) }

// ✅ v2.0 (@Observable)
@Environment(DeepLinkBus.self) private var deepLinks
.onChange(of: deepLinks.pending) { _, link in handle(link) }
```

Make sure the root view injects the bus with `.environment(DeepLinkBus.shared)` (no `EnvironmentObject`), and never re-wrap `@Observable` types in `ObservableObject` conformances.

---

**Next steps:**
- Explore [Networking](Networking.md) for HTTP client usage
- See [DesignSystem](DesignSystem.md) for theming
- Check [foundations/Architecture.md](../foundations/Architecture.md) for data flow

