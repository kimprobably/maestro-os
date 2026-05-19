import Foundation

/// Protocol for Google Sign In provider
@available(iOS 17.0, *)
public protocol GoogleSignInProvider: Sendable {
    /// Request ID token from Google
    /// Returns the ID token that will be exchanged with Supabase
    func requestIDToken() async throws -> String
}

