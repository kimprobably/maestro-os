# FeatureRating

Sentiment-based app rating prompt system. Tracks positive and negative user actions, accumulates a score, and shows a pre-prompt before triggering the native `SKStoreReviewController` dialog.

## Key Types

- `RatingClient` (protocol) -- public API for recording actions and managing prompts
- `DefaultRatingClient` -- production implementation using `RatingEngine` and StoreKit
- `MockRatingClient` -- test/preview implementation that records actions without side effects
- `RatingEngine` -- core scoring logic: accumulates weighted actions, applies time decay, checks thresholds
- `RatingStorage` (protocol) -- persistence abstraction (default: `UserDefaultsRatingStorage`)
- `RatingAction` -- describes a user action with sentiment (.positive/.negative) and weight
- `RatingConfig` -- tunable thresholds: positiveThreshold, minimumActions, cooldownDays, maxPromptsPerYear, decayFactor
- `RatingPromptView` -- SwiftUI pre-prompt dialog
- `RatingPromptModifier` -- `.ratingPrompt()` view modifier that listens for prompt triggers

## Dependencies

- `Core` (AppLogger, AppError)
- `StoreKit` (SKStoreReviewController for the native review dialog)

## Pattern

This module uses an Engine + Client pattern rather than the typical View > ViewModel > Repository split:
- `RatingClient` is the service interface (injected via CompositionRoot)
- `RatingEngine` contains the scoring and decision logic
- `RatingStorage` provides persistence (UserDefaults-backed)
- `RatingPromptModifier` is the SwiftUI integration point

ViewModels in other modules call `ratingClient.record(action)` to track events. The modifier handles display automatically.

## Non-Obvious Decisions

- The pre-prompt dialog appears before the native StoreKit dialog. This avoids wasting Apple's per-year review request limit on users who would decline.
- Score decays over time (`decayFactor ^ daysSinceLastAction`) so stale positive sentiment does not trigger prompts weeks later.
- Yearly prompt counter resets on calendar year boundary, matching Apple's own per-year review limit behavior.

## Shipping your own app (App Store 4.3)

If you **remove** rating prompts, delete `RatingClient` wiring from `CompositionRoot` and remove `.ratingPrompt()` (or equivalent) from the root view. See **[APP_STORE 4.3 hardening](../../docs/checklists/APP_STORE_4_3_HARDENING.md)** — **Removing: FeatureRating**.