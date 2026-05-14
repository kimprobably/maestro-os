import Core
import FeatureRating
import Foundation
import Storage
import SwiftUI

/// Home screen view model
/// Manages home screen state, content loading, and user interactions
@MainActor
@Observable
public final class HomeViewModel {
    // MARK: - State

    var content: HomeContent
    var recentConversations: [ConversationDTO] = []
    var isLoading = false
    var errorMessage: String?
    var userName: String?

    // MARK: - Dependencies

    private let conversationRepository: any ConversationRepository
    private let ratingClient: (any RatingClient)?

    // MARK: - Initialization

    public init(
        conversationRepository: any ConversationRepository,
        ratingClient: (any RatingClient)? = nil,
        content: HomeContent = HomeContent()
    ) {
        self.conversationRepository = conversationRepository
        self.ratingClient = ratingClient
        self.content = content
    }

    // MARK: - Public Methods

    /// Load home screen data
    public func loadData() async {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            // Load recent conversations
            let conversations = try await conversationRepository.list(limit: 3, after: nil)
            recentConversations = conversations

            AppLogger.debug("Loaded \(conversations.count) recent conversations", category: AppLogger.ui)

            // CUSTOMIZE: Record a positive rating action when user has activity
            // This is a mild positive signal -- the user is actively using the app.
            if !conversations.isEmpty {
                ratingClient?.record(.positive("home_loaded_with_activity", weight: 0.5))
            }
        } catch {
            errorMessage = "Failed to load recent activity"
            AppLogger.error("Failed to load home data: \(error)", category: AppLogger.ui)

            // CUSTOMIZE: Record a negative rating action on errors
            ratingClient?.record(.negative("home_load_error", weight: 1.0))
        }
    }

    /// Refresh home screen data (pull-to-refresh)
    public func refresh() async {
        await loadData()
    }

    /// Set user name for welcome message
    public func setUserName(_ name: String?) {
        userName = name
    }

    // MARK: - Quick Actions

    /// Handle quick action tap
    public func handleQuickAction(_ actionType: HomeContent.QuickAction.ActionType) {
        AppLogger.info("Quick action tapped: \(actionType)", category: AppLogger.ui)
        // Actions will be handled by the view via closures/navigation
    }

    // MARK: - Rating Examples

    //
    // CUSTOMIZE: Add .record() calls at key moments in your app.
    // The rating system tracks positive and negative actions to decide
    // when to ask for a review. Examples for common app types:
    //
    // Interview Prep App:
    //   ratingClient?.record(.positive("interview_completed", weight: 2.0))
    //   ratingClient?.record(.positive("good_score_received", weight: 3.0))
    //   ratingClient?.record(.negative("recording_failed", weight: 2.0))
    //
    // Matchmaking App:
    //   ratingClient?.record(.positive("got_match", weight: 3.0))
    //   ratingClient?.record(.positive("message_sent", weight: 0.5))
    //   ratingClient?.record(.negative("match_expired", weight: 1.0))
    //
    // Productivity App:
    //   ratingClient?.record(.positive("task_completed", weight: 1.5))
    //   ratingClient?.record(.positive("streak_maintained", weight: 2.0))
    //   ratingClient?.record(.negative("sync_failed", weight: 1.5))
    //
    // You can also record actions from SwiftUI views via the environment:
    //   @Environment(\.appEnv) private var appEnv
    //   appEnv?.ratingClient.record(.positive("feature_used", weight: 1.0))
}
