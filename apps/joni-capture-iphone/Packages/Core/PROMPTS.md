# Core Module Prompts

Ready-to-use prompts for common tasks in the Core module.

## Add a New Error Case

> Add a new `AppError` case called `.rateLimited` with a user-facing message like "Too many requests. Please wait a moment and try again." Follow the existing `AppError` enum pattern in `Packages/Core/Sources/Core/AppError.swift`. Include the HTTP status code mapping in `AppError.from(_:)`.

## Add a New Logger Category

> Add a new `AppLogger` category called `rating` for the FeatureRating module. Follow the existing category pattern in `Packages/Core/Sources/Core/AppLogger.swift` (e.g., `static let networking`). Use it as `AppLogger.debug("message", category: AppLogger.rating)`.

## Add a New Deep Link Route

> Add a new deep link route to `DeepLinkBus` that opens a specific conversation by ID. Follow the existing deep link pattern in `Packages/Core/Sources/Core/DeepLink/`. The URL format should be `myapp://chat/{conversationID}`.
