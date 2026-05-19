# FeatureRating Module

Smart, sentiment-based app rating prompt system. Tracks positive and negative user actions, calculates a sentiment score with time decay, and shows a configurable pre-prompt popup before triggering the native App Store review dialog.

> **v2.0.** The `RatingPromptView` pre-prompt card migrated from an opaque `DSColors.surfaceElevated` background to `.saiGlass(.regular, …)` so it picks up iOS 26 Liquid Glass automatically (falling back to SwiftUI `Material` on iOS 17–25 via `SAIGlass`). `RatingEngineTests.swift` was split into a `Fixtures/RatingEngineTestCase.swift` base class + sibling prompt-decision tests — the public `RatingClient` API is unchanged.

## Architecture

```
FeatureRating/
├── RatingClient.swift                 # Public protocol + DefaultRatingClient
├── Models/
│   ├── RatingAction.swift             # Action definitions (id, sentiment, weight)
│   └── RatingConfig.swift             # Thresholds, cooldowns, UI copy
├── Engine/
│   ├── RatingEngine.swift             # Scoring, decay, decision logic
│   └── RatingStorage.swift            # UserDefaults persistence (protocol + impl)
└── Views/
    ├── RatingPromptView.swift         # Beautiful pre-prompt popup
    └── RatingPromptModifier.swift     # .ratingPrompt() ViewModifier
```

**Dependencies:** Core (logging), DesignSystem (UI tokens and components)

## How It Works

1. **Define actions** -- positive events (task completed, match found, purchase made) and negative events (error, crash, paywall block)
2. **Record actions** -- call `ratingClient.record(action)` at key moments in your app
3. **Score accumulates** -- positive actions increase the score, negative actions decrease it, and the score decays daily
4. **Prompt triggers** -- when score exceeds threshold AND minimum actions met AND cooldown elapsed AND yearly limit not reached
5. **Pre-prompt popup** -- a beautiful themed popup asks "Enjoying the app?" before showing the native dialog
6. **Native review** -- if user taps "Rate", `SKStoreReviewController.requestReview()` fires
7. **Stop asking** -- by default, once the user taps "Rate", the system remembers and never prompts again (configurable via `stopAskingAfterRating`)

### Scoring Algorithm

- Each action contributes: `weight * sentiment_multiplier` (+1 for positive, -1 for negative)
- Score is floored at 0 (never goes negative)
- Daily decay: `score *= decayFactor ^ daysSinceLastAction`
- Default decay (0.95) means score halves in ~14 days of inactivity

### Prompt Conditions (ALL must be true)

| Condition | Default | Description |
|-----------|---------|-------------|
| User has not already rated | `stopAskingAfterRating: true` | Once user taps "Rate", never ask again |
| Score >= threshold | 5.0 | User has enough positive sentiment |
| Actions >= minimum | 5 | User has used the app enough |
| Days since last prompt >= cooldown | 30 | Not asking too frequently |
| Prompts this year < max | 3 | Apple's SKStoreReviewController limit |

## Quick Start

### 1. Configure (CompositionRoot.swift)

The rating client is already wired in `CompositionRoot`. Customize the config:

```swift
self.ratingClient = DefaultRatingClient(
    config: RatingConfig(
        positiveThreshold: 5.0,      // Score needed to trigger
        cooldownDays: 30,            // Days between prompts
        maxPromptsPerYear: 3,        // Apple's limit
        minimumActions: 5,           // Min actions before asking
        stopAskingAfterRating: true, // Stop forever once user taps "Rate"
        title: "Loving YourApp?",    // Pre-prompt title
        message: "Your feedback helps us build a better experience!",
        acceptTitle: "Rate YourApp",
        declineTitle: "Not now",
        icon: "star.bubble"          // SF Symbol
    )
)
```

### 2. Record Actions

Record actions at key moments in your ViewModels or Views:

```swift
// In a ViewModel (injected via init)
ratingClient.record(.positive("interview_completed", weight: 2.0))
ratingClient.record(.negative("recording_failed", weight: 1.5))

// In a SwiftUI View (via environment)
@Environment(\.appEnv) private var appEnv

Button("Complete") {
    appEnv?.ratingClient.record(.positive("task_done", weight: 1.5))
}
```

### 3. That's It

The `.ratingPrompt()` modifier is already attached to `AppRootView`. It listens for prompt-worthy events and shows the popup automatically.

## API Reference

### RatingAction

```swift
public struct RatingAction: Sendable, Codable, Equatable {
    public let id: String              // Unique action identifier
    public let sentiment: Sentiment    // .positive or .negative
    public let weight: Double          // Impact weight (default: 1.0)
    
    // Convenience initializers
    static func positive(_ id: String, weight: Double = 1.0) -> RatingAction
    static func negative(_ id: String, weight: Double = 1.0) -> RatingAction
}
```

**Pre-defined templates:**

| Action | Sentiment | Weight | Description |
|--------|-----------|--------|-------------|
| `.taskCompleted` | positive | 1.5 | Core task completed |
| `.milestoneReached` | positive | 2.0 | Milestone or streak |
| `.positiveResult` | positive | 2.5 | Good outcome (match, score) |
| `.purchaseCompleted` | positive | 3.0 | Purchase or subscription |
| `.onboardingCompleted` | positive | 1.0 | Finished onboarding |
| `.contentShared` | positive | 1.5 | Shared app content |
| `.errorEncountered` | negative | 1.0 | Non-fatal error |
| `.crashRecovery` | negative | 3.0 | Crash or recovery |
| `.networkFailure` | negative | 1.0 | Network request failed |
| `.paywallBlocked` | negative | 0.5 | Blocked by paywall |

### RatingConfig

```swift
public struct RatingConfig: Sendable {
    // Scoring
    let positiveThreshold: Double      // Default: 5.0
    let minimumActions: Int            // Default: 5
    let decayFactor: Double            // Default: 0.95
    
    // Rate limiting
    let cooldownDays: Int              // Default: 30
    let maxPromptsPerYear: Int         // Default: 3
    let stopAskingAfterRating: Bool    // Default: true (see below)
    
    // UI copy
    let title: String                  // "Enjoying the app?"
    let message: String                // "Your feedback helps us..."
    let acceptTitle: String            // "Rate on App Store"
    let declineTitle: String           // "Not now"
    let icon: String                   // "star.bubble"
}
```

### RatingClient Protocol

```swift
@MainActor
public protocol RatingClient: AnyObject {
    @discardableResult
    func record(_ action: RatingAction) -> Bool
    func shouldPrompt() -> Bool
    func userAcceptedPrompt()
    func userDeclinedPrompt()
    func reset()
    var config: RatingConfig { get }
}
```

### ViewModifier

```swift
// Attach to any view (typically root)
ContentView()
    .ratingPrompt(client: ratingClient)
```

## Examples by App Type

### Interview Prep App (e.g., Capishi)

```swift
let config = RatingConfig(
    positiveThreshold: 6.0,
    minimumActions: 4,
    title: "Loving Capishi?",
    message: "You've been crushing your interviews! Help others discover Capishi.",
    acceptTitle: "Rate Capishi",
    icon: "hands.sparkles"
)

// Record actions:
ratingClient.record(.positive("interview_completed", weight: 2.0))
ratingClient.record(.positive("good_score", weight: 3.0))
ratingClient.record(.positive("streak_day", weight: 1.0))
ratingClient.record(.negative("recording_failed", weight: 2.0))
```

### Matchmaking App

```swift
let config = RatingConfig(
    positiveThreshold: 8.0,
    cooldownDays: 45,
    title: "Finding great matches?",
    message: "A quick review helps more people find meaningful connections.",
    acceptTitle: "Leave a Review",
    icon: "heart.circle"
)

// Record actions:
ratingClient.record(.positive("got_match", weight: 3.0))
ratingClient.record(.positive("conversation_started", weight: 1.5))
ratingClient.record(.positive("date_scheduled", weight: 4.0))
ratingClient.record(.negative("match_expired", weight: 1.0))
```

### Productivity / Task App

```swift
let config = RatingConfig(
    positiveThreshold: 5.0,
    minimumActions: 8,
    title: "Getting things done?",
    message: "Your review helps us build better productivity tools.",
    acceptTitle: "Rate the App",
    icon: "checkmark.circle"
)

// Record actions:
ratingClient.record(.positive("task_completed", weight: 1.5))
ratingClient.record(.positive("streak_maintained", weight: 2.0))
ratingClient.record(.positive("project_completed", weight: 3.0))
ratingClient.record(.negative("sync_failed", weight: 1.5))
```

## Testing

### Unit Tests

The `RatingEngine` is fully testable with `MockRatingStorage`:

```swift
func testPositiveActionIncreasesScore() {
    let storage = MockRatingStorage()
    let engine = RatingEngine(storage: storage, config: .default)
    
    engine.record(.positive("test", weight: 2.0))
    
    XCTAssertEqual(storage.score, 2.0)
}
```

### Mock Client for Previews

```swift
let mockClient = MockRatingClient()
mockClient.shouldPromptValue = true  // Force prompt for testing

ContentView()
    .ratingPrompt(client: mockClient)
```

### Debug Reset

```swift
#if DEBUG
Button("Reset Rating Data") {
    appEnv?.ratingClient.reset()
}
#endif
```

## Customization Checklist

- [ ] Update `RatingConfig` in `CompositionRoot.swift` with your app name and copy
- [ ] Add `.record()` calls at 3-5 key positive moments in your app
- [ ] Add `.record()` calls at 2-3 key negative moments
- [ ] Adjust `positiveThreshold` and `minimumActions` based on your app's usage patterns
- [ ] Test the pre-prompt popup appearance in all 5 themes
- [ ] Verify the popup looks good in both light and dark mode
- [ ] Test with VoiceOver enabled (accessibility labels are built-in)

## Stop Asking After Rating

By default, the module **permanently stops asking** once a user taps "Rate on App Store" in the pre-prompt popup. This is controlled by the `stopAskingAfterRating` config flag.

### Why this exists

Apple's `SKStoreReviewController.requestReview()` does **not** provide any callback or return value indicating whether the user actually left a review. There is also no App Store API to check if a specific user has reviewed your app. This means:

- We cannot know for certain if the user submitted a review
- Tapping "Rate on App Store" is the **best available signal** that the user intended to leave a review
- Asking again after they already went through the flow is annoying and a bad UX

So when the user taps "Rate on App Store" in the pre-prompt, the engine sets a `userHasRated` flag in storage. On subsequent calls to `shouldPrompt()`, if `stopAskingAfterRating` is `true` and `userHasRated` is `true`, the method returns `false` immediately -- no matter how high the score gets.

### How to disable it

If you want the system to keep asking periodically (relying only on cooldown, yearly limit, and score thresholds), set `stopAskingAfterRating` to `false`:

```swift
// In CompositionRoot.swift
self.ratingClient = DefaultRatingClient(
    config: RatingConfig(
        stopAskingAfterRating: false,  // Allow re-prompting after major updates
        // ... other config ...
    )
)
```

**When you might disable it:**
- Your app ships major version updates and you want fresh reviews for the new version
- You have a very long-lived app where reviews from years ago may be stale
- You want to maximize review volume and are comfortable with a more aggressive approach

**When you should keep it enabled (default):**
- You want the best possible user experience (recommended)
- Your app is in its initial growth phase and you want to avoid annoying early adopters
- You prioritize quality of reviews over quantity

### Resetting the flag

The `userHasRated` flag is cleared when you call `ratingClient.reset()`. This is useful for:

- Debug builds (add a "Reset Rating Data" button in Settings)
- After a major app update where you intentionally want to re-collect reviews

```swift
#if DEBUG
Button("Reset Rating Data (incl. hasRated)") {
    appEnv?.ratingClient.reset()
}
#endif
```

## Apple Guidelines

- Apple limits `SKStoreReviewController` to 3 displays per 365-day period
- The `maxPromptsPerYear` config defaults to 3 to respect this
- The pre-prompt popup (our custom UI) is not limited -- only the native dialog
- Apple recommends asking after positive moments, never after negative ones
- The sentiment scoring system naturally handles this requirement
