import SwiftUI
import Core

/// ViewModifier that manages the rating prompt presentation lifecycle.
///
/// Attach this modifier to any view hierarchy (typically your root view)
/// and it will automatically show the rating prompt when conditions are met.
///
/// ## Usage
/// ```swift
/// // In your root view:
/// ContentView()
///     .ratingPrompt(client: ratingClient)
///
/// // Then record actions anywhere in your app:
/// ratingClient.record(.positive("task_completed", weight: 1.5))
/// ```
///
/// The modifier checks `shouldPrompt()` after each action and shows the
/// pre-prompt popup when all conditions are met. The popup uses a
/// `fullScreenCover`-style overlay to ensure it appears above all content.
struct RatingPromptModifier: ViewModifier {
    
    let client: any RatingClient
    @State private var showPrompt = false
    
    func body(content: Content) -> some View {
        content
            .overlay {
                if showPrompt {
                    RatingPromptView(
                        config: client.config,
                        onAccept: {
                            withAnimation(.easeOut(duration: 0.2)) {
                                showPrompt = false
                            }
                            client.userAcceptedPrompt()
                        },
                        onDecline: {
                            withAnimation(.easeOut(duration: 0.2)) {
                                showPrompt = false
                            }
                            client.userDeclinedPrompt()
                        }
                    )
                    .transition(.opacity)
                    .zIndex(9999)
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: .ratingPromptRequested)) { _ in
                guard client.shouldPrompt() else { return }
                withAnimation(.easeInOut(duration: 0.3)) {
                    showPrompt = true
                }
            }
    }
}

// MARK: - Notification

public extension Notification.Name {
    /// Posted by `DefaultRatingClient` after recording an action that may trigger a prompt.
    /// The `RatingPromptModifier` listens for this to evaluate and present the prompt.
    static let ratingPromptRequested = Notification.Name("SAIRatingPromptRequested")
}

// MARK: - View Extension

public extension View {
    /// Attach the rating prompt system to this view.
    ///
    /// The modifier listens for rating prompt requests and shows a beautiful
    /// pre-prompt popup when conditions are met. Attach to your root view.
    ///
    /// - Parameter client: The rating client that manages scoring and state
    /// - Returns: Modified view with rating prompt capability
    ///
    /// ## Example
    /// ```swift
    /// AppRootView()
    ///     .ratingPrompt(client: environment.ratingClient)
    /// ```
    func ratingPrompt(client: any RatingClient) -> some View {
        modifier(RatingPromptModifier(client: client))
    }
}
