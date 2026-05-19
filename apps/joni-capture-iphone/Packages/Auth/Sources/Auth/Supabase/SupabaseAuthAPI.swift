import Foundation
import Networking
import Core
import OSLog

/// Supabase GoTrue REST client.
///
/// Direct HTTP calls — no third-party SDK. The injected `HTTPClient` is
/// configured with the Supabase project URL from `AuthConfig`. The supabase
/// `anonKey` is a publishable key and safe to ship in the app.
///
/// Decoding (`mapToAuthSession`), error translation (`mapError`), and
/// `URLError` wrapping live in `SupabaseAuthAPI+Mapping.swift`.
@available(iOS 17.0, *)
struct SupabaseAuthAPI {
    let httpClient: any HTTPClient
    let config: AuthConfig

    // MARK: - Social identity exchanges

    /// POST /auth/v1/token?grant_type=id_token&provider=apple
    func exchangeAppleIDToken(idToken: String, nonce: String) async throws -> AuthSession {
        let bodyData = try JSONEncoder().encode(AppleSignInRequest(id_token: idToken, nonce: nonce))

        let request = HTTPRequest(
            path: "/auth/v1/token",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Authorization": "Bearer \(config.supabaseAnonKey)",
                "Content-Type": "application/json"
            ],
            query: ["grant_type": "id_token", "provider": "apple"],
            body: bodyData
        )

        AppLogger.debug("Exchanging Apple ID token with Supabase", category: AppLogger.auth)
        return try await runAuthExchange(request, operation: "Exchange Apple ID token")
    }

    /// POST /auth/v1/token?grant_type=id_token&provider=google
    func exchangeGoogleIDToken(idToken: String) async throws -> AuthSession {
        let bodyData = try JSONEncoder().encode(GoogleSignInRequest(id_token: idToken))

        let request = HTTPRequest(
            path: "/auth/v1/token",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Authorization": "Bearer \(config.supabaseAnonKey)",
                "Content-Type": "application/json"
            ],
            query: ["grant_type": "id_token", "provider": "google"],
            body: bodyData
        )

        AppLogger.debug("Exchanging Google ID token with Supabase", category: AppLogger.auth)
        return try await runAuthExchange(request, operation: "Exchange Google ID token")
    }

    // MARK: - Token refresh

    /// POST /auth/v1/token?grant_type=refresh_token
    func refresh(refreshToken: String) async throws -> AuthSession {
        let bodyData = try JSONEncoder().encode(RefreshTokenRequest(refresh_token: refreshToken))

        let request = HTTPRequest(
            path: "/auth/v1/token",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Content-Type": "application/json"
            ],
            query: ["grant_type": "refresh_token"],
            body: bodyData
        )

        AppLogger.debug("Refreshing auth token", category: AppLogger.auth)

        do {
            let response = try await httpClient.send(request)

            if (200..<300).contains(response.statusCode) {
                // Passing the existing refresh token lets the decoder handle
                // server responses that rotate only access tokens.
                let session = try mapToAuthSession(from: response.data, existingRefreshToken: refreshToken)
                AppLogger.info("Successfully refreshed auth token", category: AppLogger.auth)
                return session
            } else {
                throw mapError(statusCode: response.statusCode, data: response.data)
            }
        } catch is CancellationError {
            throw AuthError.cancelled
        } catch let error as AuthError {
            throw error
        } catch {
            throw mapNetworkError(error)
        }
    }

    // MARK: - Email/password flows

    /// POST /auth/v1/signup
    func signUpWithEmail(email: String, password: String) async throws -> AuthSession {
        let bodyData = try JSONEncoder().encode(EmailSignUpRequest(email: email, password: password))

        let request = HTTPRequest(
            path: "/auth/v1/signup",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Content-Type": "application/json"
            ],
            body: bodyData
        )

        AppLogger.debug("Signing up with email", category: AppLogger.auth)
        return try await runAuthExchange(request, operation: "Sign up with email")
    }

    /// POST /auth/v1/token?grant_type=password
    func signInWithEmail(email: String, password: String) async throws -> AuthSession {
        let bodyData = try JSONEncoder().encode(EmailSignInRequest(email: email, password: password))

        let request = HTTPRequest(
            path: "/auth/v1/token",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Content-Type": "application/json"
            ],
            query: ["grant_type": "password"],
            body: bodyData
        )

        AppLogger.debug("Signing in with email", category: AppLogger.auth)
        return try await runAuthExchange(request, operation: "Sign in with email")
    }

    /// POST /auth/v1/recover
    func resetPassword(email: String) async throws {
        let bodyData = try JSONEncoder().encode(PasswordResetRequest(email: email))

        let request = HTTPRequest(
            path: "/auth/v1/recover",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Content-Type": "application/json"
            ],
            body: bodyData
        )

        AppLogger.debug("Requesting password reset", category: AppLogger.auth)
        try await runAuthSideEffect(request, successMessage: "Password reset email sent")
    }

    /// PUT /auth/v1/user — caller must pass a valid access token.
    func updatePassword(newPassword: String, accessToken: String) async throws {
        let bodyData = try JSONEncoder().encode(PasswordUpdateRequest(password: newPassword))

        let request = HTTPRequest(
            path: "/auth/v1/user",
            method: .put,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Authorization": "Bearer \(accessToken)",
                "Content-Type": "application/json"
            ],
            body: bodyData
        )

        AppLogger.debug("Updating password", category: AppLogger.auth)
        try await runAuthSideEffect(request, successMessage: "Password updated successfully")
    }

    /// POST /auth/v1/logout — best-effort; local session is cleared even if
    /// this call fails (e.g. offline) so users always see the sign-out take.
    func revoke(accessToken: String) async throws {
        let request = HTTPRequest(
            path: "/auth/v1/logout",
            method: .post,
            headers: [
                "apikey": config.supabaseAnonKey,
                "Authorization": "Bearer \(accessToken)"
            ]
        )

        AppLogger.debug("Revoking auth token", category: AppLogger.auth)

        do {
            let response = try await httpClient.send(request)

            if (200..<300).contains(response.statusCode) {
                AppLogger.info("Successfully revoked auth token", category: AppLogger.auth)
            } else {
                AppLogger.error("Failed to revoke token: HTTP \(response.statusCode)", category: AppLogger.auth)
            }
        } catch is CancellationError {
            throw AuthError.cancelled
        } catch {
            AppLogger.error("Failed to revoke token: \(error)", category: AppLogger.auth)
        }
    }

    // MARK: - Shared request plumbing

    /// Runs a token-returning POST and maps the response through
    /// `mapToAuthSession`. Used by every "log in" variant where the success
    /// path returns a full `AuthSession`.
    private func runAuthExchange(_ request: HTTPRequest, operation: String) async throws -> AuthSession {
        do {
            let response = try await httpClient.send(request)

            if (200..<300).contains(response.statusCode) {
                let session = try mapToAuthSession(from: response.data)
                AppLogger.info("Successfully completed: \(operation)", category: AppLogger.auth)
                return session
            } else {
                throw mapError(statusCode: response.statusCode, data: response.data)
            }
        } catch is CancellationError {
            throw AuthError.cancelled
        } catch let error as AuthError {
            throw error
        } catch {
            throw mapNetworkError(error)
        }
    }

    /// Runs a side-effect POST (reset password, update password) that does
    /// not return a session — asserts the status code is 2xx.
    private func runAuthSideEffect(_ request: HTTPRequest, successMessage: String) async throws {
        do {
            let response = try await httpClient.send(request)

            if (200..<300).contains(response.statusCode) {
                AppLogger.info(successMessage, category: AppLogger.auth)
            } else {
                throw mapError(statusCode: response.statusCode, data: response.data)
            }
        } catch is CancellationError {
            throw AuthError.cancelled
        } catch let error as AuthError {
            throw error
        } catch {
            throw mapNetworkError(error)
        }
    }
}

// MARK: - AppLogger Extension

extension AppLogger {
    static let auth = Logger(
        subsystem: AppLogger.subsystem,
        category: "auth"
    )
}
