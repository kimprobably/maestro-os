import Core
import Foundation
import StoreKit

/// Protocol for the app rating prompt system.
///
/// Provides a clean interface for recording user actions and managing
/// the rating prompt lifecycle. Use `DefaultRatingClient` in production
/// or create a mock for testing.
///
/// ## Usage
/// ```swift
/// // Record positive actions
/// await ratingClient.record(.positive("completed_task", weight: 1.5))
///
/// // Record negative actions
/// await ratingClient.record(.negative("network_error", weight: 1.0))
///
/// // Check if prompt should show (usually done automatically by the ViewModifier)
/// let shouldShow = await ratingClient.shouldPrompt()
/// ```
@MainActor
public protocol RatingClient: AnyObject {
    /// Record a user action and check if a prompt should be shown
    /// - Parameter action: The action to record
    /// - Returns: Whether a rating prompt should be shown
    @discardableResult
    func record(_ action: RatingAction) -> Bool

    /// Check if all conditions are met to show a rating prompt
    func shouldPrompt() -> Bool

    /// User accepted the pre-prompt -- trigger the native App Store review dialog
    func userAcceptedPrompt()

    /// User declined the pre-prompt -- update cooldown and decay score
    func userDeclinedPrompt()

    /// Clear all rating data (for debug/testing)
    func reset()

    /// The rating configuration
    var config: RatingConfig { get }
}

// MARK: - Default Implementation

/// Production implementation of `RatingClient`.
///
/// Uses `RatingEngine` for scoring logic and `SKStoreReviewController`
/// for the native App Store review dialog.
@MainActor
public final class DefaultRatingClient: RatingClient {
    private let engine: RatingEngine
    public let config: RatingConfig

    /// Create a default rating client
    /// - Parameters:
    ///   - config: Rating configuration
    ///   - storage: Persistence layer (default: UserDefaults)
    public init(
        config: RatingConfig = .default,
        storage: RatingStorage = UserDefaultsRatingStorage()
    ) {
        self.config = config
        engine = RatingEngine(storage: storage, config: config)
    }

    @discardableResult
    public func record(_ action: RatingAction) -> Bool {
        let shouldShow = engine.record(action)

        // Notify the ViewModifier that it should evaluate prompt conditions
        if shouldShow {
            NotificationCenter.default.post(name: .ratingPromptRequested, object: nil)
        }

        return shouldShow
    }

    public func shouldPrompt() -> Bool {
        engine.shouldPrompt()
    }

    public func userAcceptedPrompt() {
        engine.userAcceptedPrompt()
        requestStoreReview()
    }

    public func userDeclinedPrompt() {
        engine.userDeclinedPrompt()
    }

    public func reset() {
        engine.reset()
    }

    // MARK: - Private

    /// Request the native App Store review dialog via StoreKit
    private func requestStoreReview() {
        guard let scene = UIApplication.shared
            .connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive })
        else {
            AppLogger.error("Rating: no active window scene for review request", category: AppLogger.ui)
            return
        }

        SKStoreReviewController.requestReview(in: scene)
        AppLogger.info("Rating: requested App Store review", category: AppLogger.ui)
    }
}

// MARK: - Mock Implementation

/// Mock rating client for SwiftUI previews and testing.
/// Records all actions but never triggers the App Store dialog.
@MainActor
public final class MockRatingClient: RatingClient {
    public let config: RatingConfig
    public private(set) var recordedActions: [RatingAction] = []
    public var shouldPromptValue: Bool = false
    public private(set) var acceptedCount: Int = 0
    public private(set) var declinedCount: Int = 0

    public init(config: RatingConfig = .default) {
        self.config = config
    }

    @discardableResult
    public func record(_ action: RatingAction) -> Bool {
        recordedActions.append(action)
        return shouldPromptValue
    }

    public func shouldPrompt() -> Bool {
        shouldPromptValue
    }

    public func userAcceptedPrompt() {
        acceptedCount += 1
    }

    public func userDeclinedPrompt() {
        declinedCount += 1
    }

    public func reset() {
        recordedActions.removeAll()
        acceptedCount = 0
        declinedCount = 0
        shouldPromptValue = false
    }
}
