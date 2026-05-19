import Foundation
import Core

@available(iOS 17.0, *)
extension SessionManager {

    // MARK: - SessionStore

    public func loadSession() throws -> AuthSession? {
        guard let accessToken = try keychain.getString(Keys.accessToken),
              let refreshToken = try keychain.getString(Keys.refreshToken),
              let expiresAtString = try keychain.getString(Keys.expiresAt),
              let expiresAtInterval = TimeInterval(expiresAtString),
              let userJSONString = try keychain.getString(Keys.userJSON),
              let userJSONData = userJSONString.data(using: .utf8) else {
            return nil
        }

        let expiresAt = Date(timeIntervalSince1970: expiresAtInterval)
        let user = try JSONDecoder().decode(AuthUser.self, from: userJSONData)

        return AuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: expiresAt,
            user: user
        )
    }

    public func saveSession(_ session: AuthSession) throws {
        try keychain.setString(session.accessToken, for: Keys.accessToken)
        try keychain.setString(session.refreshToken, for: Keys.refreshToken)
        try keychain.setString(String(session.expiresAt.timeIntervalSince1970), for: Keys.expiresAt)

        let userData = try JSONEncoder().encode(session.user)
        guard let userString = String(data: userData, encoding: .utf8) else {
            throw AuthError.unknown(underlying: NSError(
                domain: "Auth",
                code: -2,
                userInfo: [NSLocalizedDescriptionKey: "Failed to encode user data as UTF-8"]
            ))
        }
        try keychain.setString(userString, for: Keys.userJSON)
    }

    public func clearSession() throws {
        try? keychain.delete(Keys.accessToken)
        try? keychain.delete(Keys.refreshToken)
        try? keychain.delete(Keys.expiresAt)
        try? keychain.delete(Keys.userJSON)
    }

    // MARK: - Initial load (from deinit-safe init Task)

    func loadInitialSession() async {
        do {
            if let session = try loadSession() {
                if Date.now > session.expiresAt {
                    AppLogger.info("Access token expired, attempting refresh with refresh token", category: AppLogger.auth)

                    // Refresh tokens usually outlive access tokens by 7+ days —
                    // try the refresh token before signing the user out.
                    await attemptSessionRefresh(with: session)
                    return
                }

                currentSession = session
                emit(.authenticated(session.user))

                if session.needsRefresh {
                    AppLogger.debug("Session needs refresh soon, refreshing proactively", category: AppLogger.auth)
                    Task {
                        try? await refreshIfNeeded()
                    }
                } else {
                    scheduleRefresh(for: session)
                }
            }
        } catch {
            AppLogger.error("Failed to load initial session: \(error)", category: AppLogger.auth)
            try? clearSession()
        }
    }

    func persistSession(_ session: AuthSession) async throws {
        try saveSession(session)
    }
}
