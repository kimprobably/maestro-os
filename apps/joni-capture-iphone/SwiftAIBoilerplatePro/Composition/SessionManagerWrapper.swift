import Foundation
import Auth

/// Adapts the actor-isolated `SessionManager` to the sync-friendly
/// `AuthClient` protocol the rest of the app consumes.
@available(iOS 17.0, *)
final class SessionManagerWrapper: AuthClient, Sendable {

    private let sessionManager: SessionManager

    init(_ sessionManager: SessionManager) {
        self.sessionManager = sessionManager
    }

    func signInWithApple() async throws -> AuthUser {
        try await sessionManager.signInWithApple()
    }

    func signInWithGoogle() async throws -> AuthUser {
        try await sessionManager.signInWithGoogle()
    }

    func signUpWithEmail(email: String, password: String) async throws -> AuthUser {
        try await sessionManager.signUpWithEmail(email: email, password: password)
    }

    func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        try await sessionManager.signInWithEmail(email: email, password: password)
    }

    func resetPassword(email: String) async throws {
        try await sessionManager.resetPassword(email: email)
    }

    func signOut() async throws {
        try await sessionManager.signOut()
    }

    func currentUser() async -> AuthUser? {
        await sessionManager.currentUser()
    }

    func authStates() -> AsyncStream<AuthState> {
        sessionManager.authStates()
    }

    func refreshIfNeeded() async throws {
        try await sessionManager.refreshIfNeeded()
    }
}
