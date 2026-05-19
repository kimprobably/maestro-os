# Testing Guide

Complete guide for running tests and measuring coverage in **SwiftAI Boilerplate Pro**.

> **Toolchain:** v2.0.0 uses **Xcode 26.2+** with the iOS 26 SDK. The primary CI destination is **iPhone 17 Pro / iOS 26.2**. CI also runs a dedicated `test-ios18-fallback` job on **iPhone 16 Pro / iOS 18.6** to validate the SwiftUI `Material` fallback path inside `SAIGlass`. The old `package-tests` matrix was removed — `swift test` cannot build iOS-only SwiftUI against the macOS host, so package code is exercised through the app test suite (**115 tests, 0 failures** on iPhone 17 Pro / iOS 26.2).

---

## Quick Start

### Run All Tests
```bash
# Via Xcode
⌘ + U

# Via command line
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2'
```

### Run Tests with Coverage
```bash
./scripts/run-tests.sh --coverage
```

### Run Specific Test Suite
```bash
# Unit tests only
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:SwiftAIBoilerplateProTests

# UI tests only
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:SwiftAIBoilerplateProUITests
```

---

## Test Structure

### Test Targets

```
SwiftAIBoilerplateProTests/          # Unit & integration tests
├── CompositionRootTests.swift       # DI container tests
├── AppShellSnapshotTests.swift      # Snapshot tests
└── SwiftAIBoilerplateProTests.swift # General tests

SwiftAIBoilerplateProUITests/        # UI automation tests
├── AuthFlowUITests.swift            # Auth flow tests
├── ChatFlowUITests.swift            # Chat UI tests
├── PaywallFlowUITests.swift         # Paywall tests
└── SwiftAIBoilerplateProUITests.swift # Launch tests

Packages/*/Tests/                    # Package-level tests
├── Core/Tests/CoreTests/
├── Networking/Tests/NetworkingTests/
├── Storage/Tests/StorageTests/
├── Auth/Tests/AuthTests/
├── Payments/Tests/PaymentsTests/
├── AI/Tests/AITests/
├── FeatureChat/Tests/FeatureChatTests/
└── FeatureSettings/Tests/FeatureSettingsTests/
```

---

## Test Categories

### 1. Unit Tests
Test individual components in isolation.

**Examples:**
- `HTTPClientTests.swift` — HTTP client logic
- `InfinitePaginatorTests.swift` — Pagination logic
- `AppErrorTests.swift` — Error handling
- `KeychainStoreTests.swift` — Keychain operations

**Run:**
```bash
swift test --filter CoreTests
```

### 2. Integration Tests
Test interactions between components.

**Examples:**
- `CompositionRootTests.swift` — DI wiring
- `AuthIntegrationTests.swift` — Auth flow with networking
- `ChatIntegrationTests.swift` — Chat with LLM client

**Run:**
```bash
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -only-testing:SwiftAIBoilerplateProTests/CompositionRootTests
```

### 3. Snapshot Tests
Verify UI rendering matches expected snapshots.

**Examples:**
- `AppShellSnapshotTests.swift` — App shell views
- `PaywallSnapshotTests.swift` — Paywall UI
- `SettingsSnapshotTests.swift` — Settings UI

**Note:** Snapshots are recorded on the first run. Update with:
```swift
record = true  // In test file
```

### 4. UI Tests
End-to-end automation tests.

**Examples:**
- `AuthFlowUITests.swift` — Sign in/up flows
- `ChatFlowUITests.swift` — Send messages, streaming
- `PaywallFlowUITests.swift` — Purchase flows

**Run:**
```bash
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -only-testing:SwiftAIBoilerplateProUITests
```

---

## Coverage Measurement

### Target: **85–90%** overall

### Generate Coverage Locally
```bash
# Run tests with coverage
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -enableCodeCoverage YES \
  -derivedDataPath .build

# View coverage report
xcrun xccov view --report .build/Logs/Test/*.xcresult
```

### Quick Coverage Script
```bash
./scripts/run-tests.sh --coverage --open
```

This will:
1. Run all tests
2. Generate coverage report
3. Open HTML report in browser

### Coverage by Module

| Module | Target | Critical |
|--------|--------|----------|
| Core | 95%+ | Error handling, logging |
| Networking | 90%+ | HTTPClient, interceptors, retry |
| Storage | 85%+ | Repositories, migrations |
| Auth | 85%+ | Session management, refresh |
| Payments | 80%+ | Purchase paths, restore |
| AI | 85%+ | Streaming, error handling |
| FeatureChat | 75%+ | ViewModel, pagination |
| FeatureSettings | 70%+ | Settings management |
| UI Views | 60%+ | Snapshot coverage |

---

## Writing New Tests

### Unit Test Template
```swift
import XCTest
@testable import MyModule

final class MyFeatureTests: XCTestCase {
    
    var sut: MyFeature!
    var mockDependency: MockDependency!
    
    override func setUp() async throws {
        try await super.setUp()
        mockDependency = MockDependency()
        sut = MyFeature(dependency: mockDependency)
    }
    
    override func tearDown() async throws {
        sut = nil
        mockDependency = nil
        try await super.tearDown()
    }
    
    func testFeature_whenCondition_expectedResult() async throws {
        // Given
        mockDependency.setupState()
        
        // When
        let result = try await sut.performAction()
        
        // Then
        XCTAssertEqual(result, expectedValue)
    }
}
```

### Snapshot Test Template
```swift
import XCTest
import SnapshotTesting
@testable import MyFeature

@MainActor
final class MyViewSnapshotTests: XCTestCase {
    
    func testView_defaultState() {
        let view = MyView(viewModel: mockViewModel)
        assertSnapshot(matching: view, as: .image(layout: .device(config: .iPhone13)))
    }
    
    func testView_darkMode() {
        let view = MyView(viewModel: mockViewModel)
            .preferredColorScheme(.dark)
        assertSnapshot(matching: view, as: .image(layout: .device(config: .iPhone13)))
    }
}
```

### UI Test Template
```swift
import XCTest

final class MyFeatureUITests: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        
        app = XCUIApplication()
        app.launchEnvironment["AUTH_BYPASS"] = "1"
        app.launch()
    }
    
    func testFeature_userFlow() throws {
        // Navigate to feature
        let button = app.buttons["Feature Button"]
        XCTAssertTrue(button.waitForExistence(timeout: 5))
        button.tap()
        
        // Verify result
        let result = app.staticTexts["Expected Result"]
        XCTAssertTrue(result.exists)
    }
}
```

---

## Best Practices

### Test Naming
```swift
// Good
func testSendMessage_whenNetworkFails_showsErrorAlert()
func testPurchase_withValidProduct_completesSuccessfully()

// Avoid
func testSendMessage()
func test1()
```

### Arrange-Act-Assert
```swift
func testExample() {
    // Arrange (Given)
    let input = "test"
    mockService.setupResponse(expected)
    
    // Act (When)
    let result = sut.process(input)
    
    // Assert (Then)
    XCTAssertEqual(result, expected)
}
```

### Mock Dependencies
- Create protocol for dependency
- Implement mock conforming to protocol
- Inject mock in tests

```swift
protocol LLMClient {
    func streamResponse(messages: [LLMMessage]) -> AsyncThrowingStream<String, Error>
}

class MockLLMClient: LLMClient {
    var responseToReturn = "Mock response"
    
    func streamResponse(messages: [LLMMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            continuation.yield(responseToReturn)
            continuation.finish()
        }
    }
}
```

### Test Async Code
```swift
func testAsyncOperation() async throws {
    let result = try await sut.performAsyncOperation()
    XCTAssertNotNil(result)
}
```

### Test Error Cases
```swift
func testOperation_whenNetworkFails_throwsError() async throws {
    mockClient.shouldFail = true
    
    do {
        _ = try await sut.performOperation()
        XCTFail("Should throw error")
    } catch let error as AppError {
        XCTAssertEqual(error, .network)
    }
}
```

---

## CI Integration

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

### CI Coverage Gate
- **Minimum:** 85%
- Builds fail if coverage drops below threshold
- Coverage report posted as PR comment

### Workflow Files
```
.github/workflows/
├── ci.yml                  # macos-15 + Xcode 26.2, main test job (iPhone 17 Pro / iOS 26.2)
├── ios-ci.yml              # macos-15 + Xcode 26.2, incl. `test-ios18-fallback` job on iPhone 16 Pro / iOS 18.6
└── coverage-report.yml     # Weekly coverage report
```

All three workflows pin `Xcode_26.2` and run on `macos-15`. The `package-tests` matrix was dropped — see the Package Tests troubleshooting entry below.

### View CI Results
1. Navigate to **Actions** tab on GitHub
2. Select workflow run
3. Download `coverage-report` artifact

---

## Troubleshooting

### Tests Fail Locally but Pass in CI
- Ensure simulator matches CI (**iPhone 17 Pro, iOS 26.2** for the main job; **iPhone 16 Pro, iOS 18.6** for the `test-ios18-fallback` job)
- Clean build folder: `⇧⌘K` in Xcode
- Reset simulator: `xcrun simctl erase all`

### Snapshot Tests Fail After UI Change
- Update snapshots: Set `record = true` in test
- Run test once to record
- Set `record = false` and commit new snapshots

### Coverage Lower Than Expected
- Check for untested code paths (error cases, edge cases)
- Add tests for private functions via public API
- Use `xccov view --file <file>` to see line-level coverage

### UI Tests Are Flaky
- Add explicit waits: `XCTAssertTrue(element.waitForExistence(timeout: 5))`
- Disable animations: `app.launchEnvironment["ANIMATION_SPEED"] = "0"`
- Use accessibility identifiers instead of UI text

### Package Tests Won't Run
Running `swift test` inside `Packages/<PackageName>` is **not supported** — iOS-only SwiftUI packages cannot compile against the macOS host toolchain, which is why the v2.0 CI drop removed the `package-tests` matrix. Package code is exercised by the app test suite (`xcodebuild test` on an iOS 26.2 simulator). If you need to run a package in isolation, create a host target inside a test plan instead.

---

## Coverage Report Examples

### Good Coverage (92%)
```
SwiftAIBoilerplatePro.app: 92.3%
├── Core.framework: 96.7%
├── Networking.framework: 93.4%
├── Storage.framework: 88.1%
├── Auth.framework: 87.9%
├── Payments.framework: 82.5%
├── AI.framework: 91.2%
├── FeatureChat.framework: 78.3%
└── FeatureSettings.framework: 74.1%
```

### Needs Improvement (78%)
```
SwiftAIBoilerplatePro.app: 78.2%
├── Core.framework: 96.7%
├── Networking.framework: 93.4%
├── Storage.framework: 65.1% ⚠️
├── Auth.framework: 59.3% ❌
├── Payments.framework: 51.2% ❌
└── ...
```

**Action:** Focus on Storage and Auth modules.

---

## Additional Resources

- [XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [SnapshotTesting Library](https://github.com/pointfreeco/swift-snapshot-testing)
- [UI Testing Guide](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/testing_with_xcode/chapters/09-ui_testing.html)
- [Code Coverage Best Practices](https://developer.apple.com/videos/play/wwdc2022/110361/)

---

## Summary Checklist

- [ ] All tests pass locally
- [ ] Coverage ≥ 85%
- [ ] New features have tests
- [ ] Error cases tested
- [ ] UI changes have snapshot tests
- [ ] Critical paths have integration tests
- [ ] CI passing
- [ ] No flaky tests

**Target achieved = Ship with confidence 🚀**

