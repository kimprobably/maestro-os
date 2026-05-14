import Core
import Foundation

@available(iOS 17.0, *)
extension SupabaseAuthAPI {
    /// Decode a GoTrue `/token` response into an `AuthSession`. Handles
    /// rotating refresh tokens and the signup-confirmation edge case where
    /// the access token is missing until the user clicks the email link.
    func mapToAuthSession(from data: Data, existingRefreshToken: String? = nil) throws -> AuthSession {
        do {
            let payload = try JSONDecoder().decode(SessionPayload.self, from: data)

            guard let accessToken = payload.access_token, !accessToken.isEmpty else {
                AppLogger.info("Signup succeeded but email confirmation required", category: AppLogger.auth)
                throw AuthError.emailConfirmationRequired
            }

            let user = AuthUser(
                id: payload.user.id,
                email: payload.user.email,
                name: payload.user.user_metadata?.full_name,
                avatarURL: payload.user.user_metadata?.avatar_url.flatMap(URL.init)
            )

            let expiresIn = payload.expires_in ?? 3600
            let expiresAt = Date.now.addingTimeInterval(TimeInterval(expiresIn))

            // Refresh-token rotation: use the server's new token if it sent one,
            // otherwise keep the existing value the caller passed in.
            let refreshToken: String
            if let newRefreshToken = payload.refresh_token {
                refreshToken = newRefreshToken
            } else if let existing = existingRefreshToken {
                refreshToken = existing
                AppLogger.debug("No new refresh token in response, keeping existing", category: AppLogger.auth)
            } else {
                AppLogger.error("No refresh token available", category: AppLogger.auth)
                throw AuthError.parsing
            }

            return AuthSession(
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: expiresAt,
                user: user
            )
        } catch let error as AuthError {
            throw error
        } catch {
            AppLogger.error("Failed to decode auth session: \(error)", category: AppLogger.auth)
            throw AuthError.parsing
        }
    }

    /// Convert a non-2xx GoTrue response into a typed `AuthError`.
    /// Special-cases invalid credentials and email-confirmation-required errors.
    func mapError(statusCode: Int, data: Data) -> AuthError {
        let dataString = String(data: data, encoding: .utf8) ?? "<empty>"
        AppLogger.debug("Supabase error (status \(statusCode)): \(dataString)", category: AppLogger.auth)

        var message: String?
        if let errorResponse = try? JSONDecoder().decode(SupabaseErrorResponse.self, from: data) {
            AppLogger.debug("Parsed error response - error: \(errorResponse.error ?? "nil"), error_description: \(errorResponse.error_description ?? "nil"), message: \(errorResponse.message ?? "nil"), msg: \(errorResponse.msg ?? "nil"), code: \(errorResponse.code ?? "nil")", category: AppLogger.auth)

            message = errorResponse.error_description ??
                errorResponse.message ??
                errorResponse.msg ??
                errorResponse.error
        } else {
            AppLogger.debug("Failed to decode SupabaseErrorResponse from data", category: AppLogger.auth)
        }

        if let msg = message?.lowercased() {
            if msg.contains("email not confirmed") ||
                msg.contains("confirm your email") ||
                msg.contains("email confirmation")
            {
                AppLogger.info("Email confirmation required", category: AppLogger.auth)
                return .emailConfirmationRequired
            }
        }

        switch statusCode {
        case 400:
            // A 400 from /auth in context usually means invalid credentials.
            if let msg = message?.lowercased() {
                if msg.contains("invalid") ||
                    msg.contains("credentials") ||
                    msg.contains("password") ||
                    msg.contains("wrong") ||
                    msg.contains("user not found")
                {
                    return .invalidCredentials
                }
            } else {
                AppLogger.debug("400 error with no message, treating as invalid credentials", category: AppLogger.auth)
                return .invalidCredentials
            }
            return .server(code: statusCode, message: message)
        case 401, 403:
            return .invalidCredentials
        case 422:
            return .server(code: statusCode, message: message ?? "Invalid input")
        default:
            return .server(code: statusCode, message: message)
        }
    }

    func mapNetworkError(_ error: Error) -> AuthError {
        if let urlError = error as? URLError {
            return .network(underlying: urlError)
        }
        return .unknown(underlying: error)
    }
}
