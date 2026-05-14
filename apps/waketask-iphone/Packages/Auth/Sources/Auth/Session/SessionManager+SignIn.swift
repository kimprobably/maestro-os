import Foundation
import Core

@available(iOS 17.0, *)
extension SessionManager {

    // MARK: - AuthClient: sign in

    public func signInWithApple() async throws -> AuthUser {
        let originalNonce = Nonce.random()
        let hashedNonce = Nonce.sha256(originalNonce)

        AppLogger.info("Starting Apple Sign In flow", category: AppLogger.auth)

        let (idToken, returnedNonce) = try await apple.requestIDToken(
            originalNonce: originalNonce,
            hashedNonce: hashedNonce
        )

        let session = try await api.exchangeAppleIDToken(idToken: idToken, nonce: returnedNonce)

        try await persistSession(session)
        currentSession = session

        emit(.authenticated(session.user))

        scheduleRefresh(for: session)

        AppLogger.info("Successfully signed in with Apple", category: AppLogger.auth)
        return session.user
    }

    public func signInWithGoogle() async throws -> AuthUser {
        guard let google = google else {
            throw AuthError.notConfigured
        }

        AppLogger.info("Starting Google Sign In flow", category: AppLogger.auth)

        let idToken = try await google.requestIDToken()

        let session = try await api.exchangeGoogleIDToken(idToken: idToken)

        try await persistSession(session)
        currentSession = session

        emit(.authenticated(session.user))

        scheduleRefresh(for: session)

        AppLogger.info("Successfully signed in with Google", category: AppLogger.auth)
        return session.user
    }

    public func signUpWithEmail(email: String, password: String) async throws -> AuthUser {
        AppLogger.info("Starting email sign up", category: AppLogger.auth)

        let session = try await api.signUpWithEmail(email: email, password: password)

        try await persistSession(session)
        currentSession = session

        emit(.authenticated(session.user))

        scheduleRefresh(for: session)

        AppLogger.info("Successfully signed up with email", category: AppLogger.auth)
        return session.user
    }

    public func signInWithEmail(email: String, password: String) async throws -> AuthUser {
        AppLogger.info("Starting email sign in", category: AppLogger.auth)

        let session = try await api.signInWithEmail(email: email, password: password)

        try await persistSession(session)
        currentSession = session

        emit(.authenticated(session.user))

        scheduleRefresh(for: session)

        AppLogger.info("Successfully signed in with email", category: AppLogger.auth)
        return session.user
    }

    public func resetPassword(email: String) async throws {
        AppLogger.info("Requesting password reset", category: AppLogger.auth)
        try await api.resetPassword(email: email)
        AppLogger.info("Password reset email sent", category: AppLogger.auth)
    }

    // MARK: - AuthClient: sign out + user

    public func signOut() async throws {
        AppLogger.info("Starting sign out", category: AppLogger.auth)

        refreshTask?.cancel()
        refreshTask = nil

        if let accessToken = currentSession?.accessToken {
            try? await api.revoke(accessToken: accessToken)
        }

        try clearSession()
        currentSession = nil

        AppLogger.info("Emitting unauthenticated state to \(self.stateContinuations.count) subscriber(s)", category: AppLogger.auth)
        emit(.unauthenticated)

        AppLogger.info("Successfully signed out", category: AppLogger.auth)
    }

    public func currentUser() async -> AuthUser? {
        currentSession?.user
    }

    // MARK: - State stream

    nonisolated public func authStates() -> AsyncStream<AuthState> {
        AsyncStream { [weak self] continuation in
            guard let self = self else {
                continuation.finish()
                return
            }

            let id = UUID()

            Task {
                await self.registerStateContinuation(continuation, id: id)
                let state = await self.currentAuthState()
                continuation.yield(state)
            }

            continuation.onTermination = { @Sendable [weak self] _ in
                Task {
                    await self?.removeStateContinuation(id: id)
                }
            }
        }
    }

    func registerStateContinuation(_ continuation: AsyncStream<AuthState>.Continuation, id: UUID) {
        stateContinuations[id] = continuation
        AppLogger.debug("Registered auth state subscriber (total: \(self.stateContinuations.count))", category: AppLogger.auth)
    }

    func removeStateContinuation(id: UUID) {
        stateContinuations.removeValue(forKey: id)
        AppLogger.debug("Removed auth state subscriber (remaining: \(self.stateContinuations.count))", category: AppLogger.auth)
    }
}
