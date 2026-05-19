import Foundation
import Core

@available(iOS 17.0, *)
extension SessionManager {

    // MARK: - Proactive refresh

    public func refreshIfNeeded() async throws {
        guard !isRefreshing else {
            AppLogger.debug("Refresh already in progress, skipping", category: AppLogger.auth)
            return
        }

        guard let session = currentSession else {
            throw AuthError.notConfigured
        }

        if !session.needsRefresh {
            return
        }

        isRefreshing = true
        defer { isRefreshing = false }

        AppLogger.info("Token needs refresh", category: AppLogger.auth)
        emit(.refreshing)

        var lastError: Error?
        for attempt in 1...3 {
            do {
                let newSession = try await api.refresh(refreshToken: session.refreshToken)

                try await persistSession(newSession)
                currentSession = newSession

                emit(.authenticated(newSession.user))

                scheduleRefresh(for: newSession)

                AppLogger.info("Successfully refreshed token", category: AppLogger.auth)
                return
            } catch is CancellationError {
                throw AuthError.cancelled
            } catch let error as AuthError {
                lastError = error
                // Don't retry permanent auth failures
                if case .invalidCredentials = error {
                    break
                }
                if attempt < 3 {
                    AppLogger.debug("Refresh attempt \(attempt) failed, retrying", category: AppLogger.auth)
                    try? await sleeper.sleep(for: Double(attempt))
                }
            } catch {
                lastError = error
                if attempt < 3 {
                    try? await sleeper.sleep(for: Double(attempt))
                }
            }
        }

        AppLogger.error("Failed to refresh token after 3 attempts", category: AppLogger.auth)
        try? clearSession()
        currentSession = nil
        emit(.unauthenticated)
        throw lastError ?? AuthError.unknown(underlying: NSError(domain: "Auth", code: -1))
    }

    // MARK: - Expired session recovery

    /// Attempts to refresh an expired session using the refresh token.
    /// Only clears the session if the refresh token is also invalid.
    func attemptSessionRefresh(with expiredSession: AuthSession) async {
        // Keep the expired session in memory so the refresh call can read its refresh token
        currentSession = expiredSession

        emit(.refreshing)

        var lastError: Error?
        for attempt in 1...3 {
            do {
                AppLogger.debug("Session refresh attempt \(attempt)/3", category: AppLogger.auth)
                let newSession = try await api.refresh(refreshToken: expiredSession.refreshToken)

                try await persistSession(newSession)
                currentSession = newSession

                emit(.authenticated(newSession.user))

                scheduleRefresh(for: newSession)

                AppLogger.info("Successfully refreshed expired session", category: AppLogger.auth)
                return

            } catch let error as AuthError {
                lastError = error

                if case .invalidCredentials = error {
                    AppLogger.error("Refresh token is invalid or revoked", category: AppLogger.auth)
                    break
                }

                if attempt < 3 {
                    AppLogger.debug("Refresh attempt \(attempt) failed, retrying...", category: AppLogger.auth)
                    try? await sleeper.sleep(for: Double(attempt))
                }
            } catch {
                lastError = error
                if attempt < 3 {
                    try? await sleeper.sleep(for: Double(attempt))
                }
            }
        }

        AppLogger.error("Failed to refresh session after 3 attempts: \(String(describing: lastError))", category: AppLogger.auth)
        try? clearSession()
        currentSession = nil
        emit(.unauthenticated)
    }

    // MARK: - Scheduling

    func scheduleRefresh(for session: AuthSession) {
        refreshTask?.cancel()

        let refreshTime = session.expiresAt.addingTimeInterval(-60)
        let delay = max(0, refreshTime.timeIntervalSinceNow)

        refreshTask = Task {
            do {
                try await sleeper.sleep(for: delay)
                if !Task.isCancelled {
                    try await refreshIfNeeded()
                }
            } catch is CancellationError {
                // Task was cancelled, ignore
            } catch {
                AppLogger.error("Scheduled refresh failed: \(error)", category: AppLogger.auth)
            }
        }
    }
}
