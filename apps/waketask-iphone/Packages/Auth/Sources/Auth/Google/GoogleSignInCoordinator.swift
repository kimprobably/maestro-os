import Foundation
#if canImport(GoogleSignIn)
import GoogleSignIn
#endif

/// Coordinates Google Sign In flow
/// Requires GoogleSignIn SDK: https://github.com/google/GoogleSignIn-iOS
@available(iOS 17.0, *)
@MainActor
public final class GoogleSignInCoordinator: NSObject {
    
    private let clientID: String
    
    /// Initialize with Google OAuth client ID
    /// Get this from: Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs
    /// For Supabase: Use the iOS client ID from your Google Cloud project
    public init(clientID: String) {
        self.clientID = clientID
        super.init()
    }
}

// MARK: - GoogleSignInProvider

@available(iOS 17.0, *)
extension GoogleSignInCoordinator: GoogleSignInProvider {
    
    public func requestIDToken() async throws -> String {
        #if canImport(GoogleSignIn)
        // Configure Google Sign In
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config
        
        // Get the presenting view controller
        guard let windowScene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first,
              let rootViewController = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
            throw AuthError.notConfigured
        }
        
        // Sign in with Google
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
        
        // Get ID token
        guard let idToken = result.user.idToken?.tokenString else {
            throw AuthError.invalidCredentials
        }
        
        return idToken
        #else
        throw AuthError.notConfigured
        #endif
    }
}

