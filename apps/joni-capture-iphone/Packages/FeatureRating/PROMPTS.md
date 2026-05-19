# FeatureRating Module Prompts

Ready-to-use prompts for common tasks in the FeatureRating module.

## Integrate Rating Tracking into a Feature

> Add rating action tracking to the chat feature. After a user receives a successful AI response, record a positive action: `ratingClient.record(.positive("chat_response_received", weight: 1.0))`. After a network error, record a negative action: `ratingClient.record(.negative("chat_error", weight: 1.5))`. Wire `RatingClient` into `ChatViewModel` via `CompositionRoot`.

## Customize Rating Thresholds

> Adjust the rating configuration so the prompt appears after at least 10 positive interactions (not the default). Create a custom `RatingConfig` with `positiveThreshold: 8.0`, `minimumActions: 10`, `cooldownDays: 30`, `maxPromptsPerYear: 2`. Pass it to `DefaultRatingClient(config:)` in `CompositionRoot`.

## Add a Custom Pre-Prompt Design

> Replace the default `RatingPromptView` with a custom design that matches my app's branding. Create a new SwiftUI view using `DSColors`, `SAIButton`, and `SAICard` from the DesignSystem module. Use the `.ratingPrompt()` modifier's existing callback pattern; only replace the view, not the logic.
