import SwiftUI
import AuthenticationServices
import DesignSystem
import Auth
import Core

/// Premium sign-in screen with Apple-like aesthetic
/// Design: Clean, minimal, with generous whitespace
@MainActor
struct SignInView: View {
    
    @Environment(\.colorScheme) private var colorScheme
    @State private var viewModel: SignInViewModel
    @State private var showEmailLogin = false
    @State private var showEmailSignUp = false
    @State private var showForgotPassword = false
    @State private var hasAppeared = false
    
    init(authClient: any AuthClient) {
        self._viewModel = State(initialValue: SignInViewModel(authClient: authClient))
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    Spacer()
                        .frame(height: 100)
                    
                    // Hero section - quiet confidence
                    VStack(spacing: 16) {
                        // Soft atmospheric icon
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            DSColors.accentPrimary.opacity(0.08),
                                            DSColors.accentSecondary.opacity(0.05)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 90, height: 90)
                                .blur(radius: 20)
                            
                            Image(systemName: BrandConfig.avatarFallbackSymbol)
                                .font(.system(size: 42, weight: .light))
                                .foregroundStyle(DSColors.textPrimary.opacity(0.7))
                        }
                        .frame(height: 90)
                        
                        // Title - refined sizing and weight
                        Text(BrandConfig.appDisplayName)
                            .font(.system(size: 28, weight: .semibold, design: .rounded))
                            .foregroundStyle(DSColors.textPrimary)
                            .padding(.top, 8)
                        
                        // Tagline - subtle and elegant
                        Text("Your AI assistant")
                            .font(.system(size: 15, weight: .regular))
                            .foregroundStyle(DSColors.textSecondary.opacity(0.7))
                            .tracking(0.3)
                            .padding(.top, 2)
                    }
                    .frame(maxWidth: .infinity)
                    .opacity(hasAppeared ? 1 : 0)
                    .offset(y: hasAppeared ? 0 : 10)
                    
                    Spacer()
                        .frame(height: 64)
                
                    // Error message - soft and refined
                    if let msg = viewModel.errorMessage {
                        HStack(spacing: 10) {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundStyle(.red.opacity(0.7))
                                .font(.system(size: 15))
                            Text(msg)
                                .font(.system(size: 14, weight: .regular))
                                .foregroundStyle(DSColors.textPrimary.opacity(0.9))
                                .multilineTextAlignment(.leading)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(Color.red.opacity(0.04))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                                        .strokeBorder(Color.red.opacity(0.15), lineWidth: 0.5)
                                )
                        )
                        .padding(.horizontal, 32)
                        .padding(.bottom, 16)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                        .animation(.spring(response: 0.35, dampingFraction: 0.85), value: viewModel.errorMessage)
                    }
                    
                    // Primary auth container - refined and harmonious
                    VStack(spacing: 14) {
                        // Apple Sign In - Native (HIG compliant), primary action
                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.fullName, .email]
                        } onCompletion: { _ in
                            Task {
                                await viewModel.signInWithApple()
                            }
                        }
                        .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                        .frame(height: 50)
                        .frame(maxWidth: .infinity)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.3 : 0.08), radius: 12, x: 0, y: 4)
                        .disabled(viewModel.isLoading)
                        .opacity(viewModel.isLoading && viewModel.loadingMethod == .apple ? 0.7 : 1.0)
                        .overlay(
                            viewModel.isLoading && viewModel.loadingMethod == .apple ?
                            ProgressView()
                                .tint(colorScheme == .dark ? .black : .white)
                            : nil
                        )
                        .accessibilityLabel("Sign in with Apple")
                        .accessibilityHint("Double tap to sign in using your Apple ID")
                        
                        // Google Sign In - secondary, refined
                        Button {
                            Task {
                                await viewModel.signInWithGoogle()
                            }
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "g.circle.fill")
                                    .font(.system(size: 19))
                                    .foregroundStyle(DSColors.textPrimary.opacity(0.9))
                                Text(viewModel.isLoading && viewModel.loadingMethod == .google ? "Signing in..." : "Continue with Google")
                                    .font(.system(size: 16, weight: .medium))
                                    .foregroundStyle(DSColors.textPrimary.opacity(0.95))
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(DSColors.surface.opacity(0.6))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .strokeBorder(DSColors.borderSubtle.opacity(0.8), lineWidth: 0.5)
                                    )
                            )
                        }
                        .disabled(viewModel.isLoading)
                        .opacity(viewModel.isLoading && viewModel.loadingMethod == .google ? 0.6 : 1.0)
                        .shadow(color: Color.black.opacity(0.02), radius: 6, x: 0, y: 2)
                        
                        // Tertiary action - email (de-emphasized)
                        Button {
                            showEmailLogin = true
                        } label: {
                            Text("Use email instead")
                                .font(.system(size: 14, weight: .regular))
                                .foregroundStyle(DSColors.textSecondary.opacity(0.65))
                        }
                        .padding(.top, 12)
                        .disabled(viewModel.isLoading)
                        
                        #if DEBUG
                        Button {
                            viewModel.continueInDebug()
                        } label: {
                            Text("Debug: Mock Sign In")
                                .font(.system(size: 12, weight: .regular))
                                .foregroundStyle(DSColors.textSecondary.opacity(0.5))
                        }
                        .padding(.top, 8)
                        #endif
                    }
                    .frame(maxWidth: 380)
                    .padding(.horizontal, 32)
                    .opacity(hasAppeared ? 1 : 0)
                    .offset(y: hasAppeared ? 0 : 8)
                    
                    Spacer()
                        .frame(height: 80)
                    
                    // Legal - whisper quiet
                    Text("By continuing, you agree to our [Terms](https://example.com) and [Privacy Policy](https://example.com)")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(DSColors.textSecondary.opacity(0.55))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 48)
                        .tint(DSColors.accentPrimary.opacity(0.7))
                    
                    Spacer()
                        .frame(height: 48)
                }
            }
            .background(
                // Subtle gradient background for depth
                LinearGradient(
                    colors: [
                        DSColors.background,
                        DSColors.background,
                        DSColors.surface.opacity(0.3)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            )
            .onAppear {
                hasAppeared = true
            }
            .sheet(isPresented: $showEmailLogin) {
                EmailLoginView(
                    authClient: viewModel.authClient,
                    onSuccess: {
                        showEmailLogin = false
                    },
                    onSwitchToSignUp: {
                        showEmailLogin = false
                        Task {
                            try? await Task.sleep(for: .milliseconds(300))
                            showEmailSignUp = true
                        }
                    },
                    onForgotPassword: {
                        showEmailLogin = false
                        Task {
                            try? await Task.sleep(for: .milliseconds(300))
                            showForgotPassword = true
                        }
                    }
                )
            }
            .sheet(isPresented: $showEmailSignUp) {
                EmailSignUpView(
                    authClient: viewModel.authClient,
                    onSuccess: {
                        showEmailSignUp = false
                    },
                    onSwitchToLogin: {
                        showEmailSignUp = false
                        Task {
                            try? await Task.sleep(for: .milliseconds(300))
                            showEmailLogin = true
                        }
                    }
                )
            }
            .sheet(isPresented: $showForgotPassword) {
                ForgotPasswordView(
                    authClient: viewModel.authClient,
                    onBackToLogin: {
                        showForgotPassword = false
                        Task {
                            try? await Task.sleep(for: .milliseconds(300))
                            showEmailLogin = true
                        }
                    }
                )
            }
        }
    }
}

/// ViewModel for sign in screen
@MainActor
@Observable
final class SignInViewModel {
    enum AuthMethodType {
        case apple, google, email
    }
    
    var isLoading: Bool = false
    var loadingMethod: AuthMethodType? = nil
    var errorMessage: String?
    
    fileprivate let authClient: any AuthClient

    init(authClient: any AuthClient) {
        self.authClient = authClient
    }
    
    func signInWithApple() async {
        isLoading = true
        loadingMethod = .apple
        errorMessage = nil
        
        defer { 
            isLoading = false
            loadingMethod = nil
        }
        
        do {
            _ = try await authClient.signInWithApple()
            AppLogger.info("Apple sign in successful", category: AppLogger.ui)
            errorMessage = nil
            // Navigation handled by LaunchRouter observing auth state
        } catch {
            let appError = AppError.from(error)
            errorMessage = appError.userMessage
            AppLogger.error("Apple sign in failed: \(error)", category: AppLogger.ui)
            
            // Auto-dismiss error after 5 seconds
            Task {
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                if self.errorMessage == appError.userMessage {
                    self.errorMessage = nil
                }
            }
        }
    }
    
    func signInWithGoogle() async {
        isLoading = true
        loadingMethod = .google
        errorMessage = nil
        
        defer { 
            isLoading = false
            loadingMethod = nil
        }
        
        do {
            _ = try await authClient.signInWithGoogle()
            AppLogger.info("Google sign in successful", category: AppLogger.ui)
            errorMessage = nil
            // Navigation handled by LaunchRouter observing auth state
        } catch {
            let appError = AppError.from(error)
            errorMessage = appError.userMessage
            AppLogger.error("Google sign in failed: \(error)", category: AppLogger.ui)
            
            // Auto-dismiss error after 5 seconds
            Task {
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                if self.errorMessage == appError.userMessage {
                    self.errorMessage = nil
                }
            }
        }
    }
    
    #if DEBUG
    func continueInDebug() {
        Task {
            AppLogger.info("Debug sign-in started", category: AppLogger.auth)
            
            // Check if we're using MockAuthClient
            if type(of: authClient) == Auth.MockAuthClient.self {
                AppLogger.info("Using MockAuthClient - calling signInWithApple()", category: AppLogger.auth)
                do {
                    let user = try await authClient.signInWithApple()
                    AppLogger.info("Debug sign-in successful: \(user.id)", category: AppLogger.auth)
                } catch {
                    AppLogger.error("Debug sign-in failed: \(error)", category: AppLogger.auth)
                }
            } else {
                AppLogger.error("Debug button pressed but not using MockAuthClient. Set AUTH_BYPASS=1 in scheme.", category: AppLogger.auth)
                errorMessage = "Debug mode not enabled. Please set AUTH_BYPASS=1 in Xcode scheme environment variables."
            }
        }
    }
    #endif
}

#if DEBUG
#Preview("Default") {
    SignInView(authClient: PreviewComposition.mockAuthClient())
}

#Preview("With Error") {
    // Tap the button to see error state
    SignInView(authClient: PreviewMocks.FailingMockAuthClient())
}
#endif
