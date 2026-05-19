# Networking Module

HTTP client with interceptors, retry logic, and caching for API communication.

> **v2.0 — hardening.** `URLSessionHTTPClient.applySyntheticTTL` previously force-unwrapped `urlRequest.url!` when writing to the cache. The force-unwrap has been folded into the existing `guard` that short-circuits the cache write, so the method is now safe when `URL` construction fails. No public API change.

## Purpose

**What Networking owns:**
- `HTTPClient` protocol and `URLSessionHTTPClient` implementation
- Request/response types (`HTTPRequest`, `HTTPResponse`)
- Interceptors: Auth, Retry, Headers
- Caching strategies (URLCache + NSCache for images)
- Network error mapping

**What Networking does NOT own:**
- API endpoint definitions (defined in calling modules)
- Business logic (lives in ViewModels/Repositories)
- Storage (see Storage module)
- UI (see DesignSystem module)

## Public API

```swift
import Networking

// Define a request
struct FetchUserRequest: HTTPRequest {
    typealias Response = User
    
    var path: String { "/users/\(userID)" }
    var method: HTTPMethod { .get }
    
    let userID: String
}

// Execute with HTTPClient
let user: User = try await httpClient.execute(FetchUserRequest(userID: "123"))
```

## Setup

### Environment Variables

No direct environment variables. Configuration happens in `CompositionRoot`:

```swift
let httpClient = URLSessionHTTPClient(
    baseURL: URL(string: "https://api.example.com")!,
    session: .shared,
    defaultHeaders: ["Accept": "application/json"],
    interceptors: [headersInterceptor, authInterceptor, retryInterceptor]
)
```

### Dependency Injection

```swift
// In CompositionRoot.swift
let tokenProvider = Storage.KeychainTokenProvider(
    keychain: keychainStore,
    tokenKey: KeychainStore.Keys.authAccessToken
)

let authInterceptor = Networking.AuthInterceptor(tokenProvider: tokenProvider)
let retryInterceptor = Networking.RetryInterceptor(
    policy: Networking.RetryPolicy(maxAttempts: 3)
)
let headersInterceptor = Networking.HeadersInterceptor(
    appVersion: "1.0.0",
    platform: "iOS",
    extraHeaders: [:]
)

self.httpClient = Networking.URLSessionHTTPClient(
    baseURL: URL(string: "https://api.example.com")!,
    session: .shared,
    defaultHeaders: ["Accept": "application/json"],
    interceptors: [headersInterceptor, authInterceptor, retryInterceptor]
)
```

### Flags

Cache control:
```swift
// Per-request cache control
var cachePolicy: URLRequest.CachePolicy? { .reloadIgnoringLocalCacheData }

// Global URLCache configuration
let cache = URLCache(
    memoryCapacity: 20 * 1024 * 1024,  // 20 MB
    diskCapacity: 100 * 1024 * 1024     // 100 MB
)
URLCache.shared = cache
```

## Example: Make API Call in 3 Steps

### Step 1: Define Request

```swift
import Networking

struct CreatePostRequest: HTTPRequest {
    typealias Response = Post
    
    var path: String { "/posts" }
    var method: HTTPMethod { .post }
    var body: Data? { 
        try? JSONEncoder().encode(payload) 
    }
    var headers: [String: String] {
        ["Content-Type": "application/json"]
    }
    
    struct Payload: Encodable {
        let title: String
        let content: String
    }
    
    let payload: Payload
}
```

### Step 2: Execute Request

```swift
func createPost(title: String, content: String) async throws -> Post {
    let request = CreatePostRequest(
        payload: .init(title: title, content: content)
    )
    
    return try await httpClient.execute(request)
}
```

**Expected result:**
```swift
let post = try await createPost(title: "Hello", content: "World")
print(post.id)  // "post_123"
```

### Step 3: Handle Errors

```swift
import Core

func createPost(title: String, content: String) async throws -> Post {
    do {
        let request = CreatePostRequest(
            payload: .init(title: title, content: content)
        )
        return try await httpClient.execute(request)
    } catch {
        let appError = AppError.from(error)
        AppLogger.error("Create post failed: \(appError)", category: AppLogger.networking)
        throw appError
    }
}
```

**Expected result:**
- Network errors → `AppError.network`
- 401/403 → `AppError.unauthorized`
- 429 → `AppError.rateLimited`
- 500+ → `AppError.server`

## Customization

### Safe Changes

**Add custom request:**
```swift
struct MyAPIRequest: HTTPRequest {
    typealias Response = MyResponse
    
    var path: String { "/my-endpoint" }
    var method: HTTPMethod { .get }
    var queryParameters: [String: String]? {
        ["filter": filterValue]
    }
    
    let filterValue: String
}
```

**Add custom interceptor:**
```swift
public protocol RequestInterceptor {
    func intercept(_ request: URLRequest) async throws -> URLRequest
}

struct TelemetryInterceptor: RequestInterceptor {
    func intercept(_ request: URLRequest) async throws -> URLRequest {
        var mutableRequest = request
        mutableRequest.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-ID")
        return mutableRequest
    }
}

// Add to interceptors array in CompositionRoot
```

**Configure retry policy:**
```swift
let retryPolicy = RetryPolicy(
    maxAttempts: 5,
    baseDelay: 1.0,
    maxDelay: 30.0,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504]
)

let retryInterceptor = RetryInterceptor(policy: retryPolicy)
```

**Image caching:**
```swift
let imageCache = ImageCache.shared

// Store
imageCache.setImage(image, forKey: url.absoluteString)

// Retrieve
if let cachedImage = imageCache.image(forKey: url.absoluteString) {
    return cachedImage
}
```

### Pitfalls

**Don't:**
- Make network calls from Views (use ViewModels/Repositories)
- Ignore cancellation (check `Task.isCancelled`)
- Hardcode base URLs (use CompositionRoot configuration)
- Log request/response bodies without redacting PII
- Block main thread waiting for network calls

**Do:**
- Use `HTTPClient` protocol, not direct URLSession
- Map errors to `AppError` at boundaries
- Configure timeouts appropriately
- Use interceptors for cross-cutting concerns
- Respect cache control headers

## Where Used

**Direct users:**
- `AI` module - ProxyLLMClient calls Supabase Edge Function
- `Auth` module - SupabaseAuthClient for auth API calls
- `Payments` module - For API-based payment verification (if needed)

**Indirect users:**
- `FeatureChat` - Via AI module
- `FeatureSettings` - Via Auth/Payments modules

**Example from AI module:**
```swift
// AI/ProxyLLMClient.swift
import Networking

final class ProxyLLMClient: LLMClient {
    private let httpClient: HTTPClient
    private let baseURL: URL
    
    func streamResponse(messages: [LLMMessage]) 
        -> AsyncThrowingStream<String, Error> {
        
        AsyncThrowingStream { continuation in
            Task {
                do {
                    // Use HTTPClient to call proxy
                    let request = StreamRequest(
                        baseURL: baseURL,
                        messages: messages
                    )
                    // ... streaming logic
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}
```

## Tests

### Run Tests

```bash
# All networking tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:NetworkingTests

# Specific test file
-only-testing:NetworkingTests/HTTPClientTests
-only-testing:NetworkingTests/RetryInterceptorTests
-only-testing:NetworkingTests/CachePolicyTests
```

### What's Covered

**HTTPClient:**
- Request building (URL, headers, body)
- Response decoding (JSON → Codable)
- Error handling (network, HTTP status codes)
- Cancellation support

**Interceptors:**
- Auth token injection
- Retry with exponential backoff
- Custom header addition
- Interceptor ordering

**Caching:**
- URLCache integration
- Cache control header parsing
- Image cache (NSCache)
- Cache expiry

**Retry Logic:**
- Transient error detection
- Exponential backoff calculation
- Max attempts enforcement
- Retry-After header respect

**Coverage:** 90%+ (critical path testing)

### Example Test

```swift
import XCTest
@testable import Networking

final class RetryInterceptorTests: XCTestCase {
    func testRetry_transientError_retriesUpToMaxAttempts() async throws {
        var attemptCount = 0
        let mockClient = MockHTTPClient { _ in
            attemptCount += 1
            if attemptCount < 3 {
                throw URLError(.networkConnectionLost)
            }
            return Data()
        }
        
        let policy = RetryPolicy(maxAttempts: 3)
        let interceptor = RetryInterceptor(policy: policy)
        
        // Execute should retry and eventually succeed
        _ = try await mockClient.execute(TestRequest())
        
        XCTAssertEqual(attemptCount, 3)
    }
}
```

## Troubleshooting

### Issue: "Network request failed" Errors

**Symptoms:** All API calls fail with generic network error

**Fixes:**
1. Check internet connection
2. Verify base URL in `CompositionRoot`:
   ```swift
   print(httpClient.baseURL)  // Should be correct API URL
   ```
3. Check if server is reachable:
   ```bash
   curl https://api.example.com/health
   ```
4. View logs for specific error:
   ```swift
   AppLogger.error("HTTP failed: \(error)", category: AppLogger.networking)
   ```

### Issue: Authentication Failures (401/403)

**Symptoms:** Requests fail with "Unauthorized"

**Fixes:**
1. Verify auth token is present:
   ```swift
   let token = try? await tokenProvider.token()
   print("Token: \(token ?? "nil")")
   ```
2. Check AuthInterceptor is in interceptors array
3. Ensure token is valid (not expired)
4. Check server logs for auth errors

### Issue: Requests Being Cached Inappropriately

**Symptoms:** Seeing stale data, changes not reflected

**Fixes:**
1. Set cache policy on request:
   ```swift
   var cachePolicy: URLRequest.CachePolicy? {
       .reloadIgnoringLocalCacheData
   }
   ```
2. Clear cache programmatically:
   ```swift
   URLCache.shared.removeAllCachedResponses()
   ```
3. Check Cache-Control headers from server
4. Use POST for mutations (never cached)

### Issue: Retry Loop (Too Many Attempts)

**Symptoms:** Requests taking very long, many retries

**Fixes:**
1. Check retry policy max attempts:
   ```swift
   let policy = RetryPolicy(maxAttempts: 3)  // Reasonable default
   ```
2. Verify error is actually transient
3. Check if server returns 429 (rate limited)
4. Add circuit breaker if needed

### Issue: Request Timeout

**Symptoms:** Requests fail after long wait

**Fixes:**
1. Increase timeout in URLSession configuration:
   ```swift
   let config = URLSessionConfiguration.default
   config.timeoutIntervalForRequest = 30  // seconds
   config.timeoutIntervalForResource = 60
   let session = URLSession(configuration: config)
   ```
2. Check if server is slow (use curl to test)
3. Consider pagination for large responses

## Advanced Usage

### Streaming Responses

```swift
struct StreamingRequest: HTTPRequest {
    typealias Response = Never  // Won't use standard decoding
    
    var path: String { "/stream" }
    var method: HTTPMethod { .post }
}

func streamData() -> AsyncThrowingStream<Data, Error> {
    AsyncThrowingStream { continuation in
        Task {
            let request = // ... build URLRequest
            let (bytes, response) = try await session.bytes(for: request)
            
            for try await byte in bytes {
                continuation.yield(byte)
            }
            
            continuation.finish()
        }
    }
}
```

### Multipart Form Data

```swift
struct UploadImageRequest: HTTPRequest {
    typealias Response = UploadResponse
    
    var path: String { "/upload" }
    var method: HTTPMethod { .post }
    var body: Data? { createMultipartBody() }
    var headers: [String: String] {
        ["Content-Type": "multipart/form-data; boundary=\(boundary)"]
    }
    
    let image: Data
    let boundary = UUID().uuidString
    
    private func createMultipartBody() -> Data {
        var body = Data()
        // ... multipart encoding
        return body
    }
}
```

### Request Cancellation

```swift
class ViewModel {
    private var fetchTask: Task<Void, Never>?
    
    func fetchData() {
        fetchTask?.cancel()
        
        fetchTask = Task {
            do {
                let data = try await httpClient.execute(request)
                // ... handle data
            } catch is CancellationError {
                // Request was cancelled
            } catch {
                // Handle other errors
            }
        }
    }
    
    deinit {
        fetchTask?.cancel()
    }
}
```

### Custom Response Validation

```swift
struct ValidatedRequest: HTTPRequest {
    typealias Response = User
    
    var path: String { "/user" }
    var method: HTTPMethod { .get }
    
    func validate(_ response: HTTPURLResponse) throws {
        // Custom validation beyond status code
        guard let contentType = response.value(forHTTPHeaderField: "Content-Type"),
              contentType.contains("application/json") else {
            throw AppError.decoding
        }
    }
}
```

## Related Modules

- [Core](Core.md) - Uses AppError and AppLogger
- [Storage](Storage.md) - Provides KeychainTokenProvider for auth
- [AI](AI.md) - Uses HTTPClient for proxy calls
- [Auth](Auth.md) - Uses HTTPClient for Supabase API
- [architecture-overview.md](architecture-overview.md) - Shows Networking in system

---

**Next steps:**
- See [AI](AI.md) for streaming response handling
- Check [Auth](Auth.md) for AuthInterceptor integration
- Explore [architecture-overview.md](architecture-overview.md) for data flow

