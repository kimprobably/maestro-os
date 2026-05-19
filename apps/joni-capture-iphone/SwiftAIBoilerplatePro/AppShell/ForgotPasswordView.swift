import SwiftUI
import Auth
import Core
import DesignSystem

/// Password reset request screen
@available(iOS 17.0, *)
struct ForgotPasswordView: View {
    
    // MARK: - Properties
    
    @State private var viewModel: ForgotPasswordViewModel
    @FocusState private var isEmailFocused: Bool
    
    // MARK: - Initialization
    
    init(authClient: any AuthClient, onBackToLogin: @escaping () -> Void) {
        self.viewModel = ForgotPasswordViewModel(
            authClient: authClient,
            onBackToLogin: onBackToLogin
        )
    }
    
    // MARK: - Body
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DSSpacing.xl) {
                    // Header
                    headerSection
                    
                    if viewModel.isSuccess {
                        // Success state
                        successSection
                    } else {
                        // Form state
                        formSection
                        
                        // Send button
                        sendButton
                        
                        // Error display
                        if let errorMessage = viewModel.errorMessage {
                            errorSection(errorMessage)
                        }
                    }
                    
                    // Back to login
                    backToLoginSection
                }
                .padding(DSSpacing.xl)
            }
            .navigationTitle("Reset Password")
            .navigationBarTitleDisplayMode(.large)
            .disabled(viewModel.isLoading)
            .contentShape(Rectangle())
            .onTapGesture {
                isEmailFocused = false
            }
        }
    }
    
    // MARK: - Subviews
    
    private var headerSection: some View {
        VStack(spacing: DSSpacing.md) {
            Image(systemName: "lock.rotation")
                .font(.system(size: 60, weight: .light))
                .foregroundStyle(DSColors.accentPrimary.opacity(0.8))
            
            Text("Forgot Password?")
                .font(.title)
                .fontWeight(.bold)
                .foregroundStyle(DSColors.textPrimary)
            
            Text("Enter your email address and we'll send you instructions to reset your password")
                .font(.subheadline)
                .foregroundStyle(DSColors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
    
    private var formSection: some View {
        VStack(alignment: .leading, spacing: DSSpacing.sm) {
            Text("Email")
                .font(.subheadline)
                .fontWeight(.medium)
            
            TextField("your@email.com", text: $viewModel.email)
                .textFieldStyle(.roundedBorder)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .focused($isEmailFocused)
                .submitLabel(.send)
                .onSubmit {
                    Task {
                        await viewModel.sendResetLink()
                    }
                }
            
            if let error = viewModel.emailError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
    
    private var sendButton: some View {
        SAIButton(
            viewModel.isLoading ? "Sending..." : "Send Reset Link",
            style: .primary,
            size: .lg
        ) {
            Task {
                await viewModel.sendResetLink()
            }
        }
        .disabled(!viewModel.isFormValid || viewModel.isLoading)
    }
    
    private var successSection: some View {
        VStack(spacing: DSSpacing.lg) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(.green)
            
            Text("Check Your Email")
                .font(.title2)
                .fontWeight(.bold)
            
            Text("We've sent password reset instructions to")
                .font(.subheadline)
                .foregroundStyle(DSColors.textSecondary)
            
            Text(viewModel.email)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(DSColors.accentPrimary)
            
            Text("Please check your inbox and follow the instructions to reset your password")
                .font(.subheadline)
                .foregroundStyle(DSColors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(DSSpacing.xl)
        .background(DSColors.success.opacity(0.08))
        .cornerRadius(DSSpacing.md)
    }
    
    private var backToLoginSection: some View {
        HStack {
            Image(systemName: "arrow.left")
                .font(.system(size: 14))
            Button("Back to Sign In") {
                viewModel.backToLogin()
            }
        }
        .font(.subheadline)
        .foregroundStyle(DSColors.accentPrimary)
    }
    
    private func errorSection(_ message: String) -> some View {
        HStack(spacing: DSSpacing.md) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.red)
            
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.red)
        }
        .padding(DSSpacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.red.opacity(0.1))
        .cornerRadius(DSSpacing.sm)
    }
}

// MARK: - ViewModel

@available(iOS 17.0, *)
@Observable
final class ForgotPasswordViewModel {
    
    // MARK: - Published State
    
    var email = ""
    var isLoading = false
    var isSuccess = false
    var errorMessage: String?
    var emailError: String?
    
    // MARK: - Computed Properties
    
    var isFormValid: Bool {
        !email.isEmpty && emailError == nil
    }
    
    // MARK: - Dependencies
    
    private let authClient: any AuthClient
    private let onBackToLogin: () -> Void
    
    // MARK: - Initialization
    
    init(authClient: any AuthClient, onBackToLogin: @escaping () -> Void) {
        self.authClient = authClient
        self.onBackToLogin = onBackToLogin
    }
    
    // MARK: - Actions
    
    @MainActor
    func sendResetLink() async {
        // Clear previous errors
        emailError = nil
        errorMessage = nil
        
        // Validate
        guard validate() else { return }
        
        isLoading = true
        
        do {
            try await authClient.resetPassword(email: email)
            AppLogger.info("Password reset email sent", category: AppLogger.auth)
            isSuccess = true
        } catch {
            AppLogger.error("Password reset failed: \(error.localizedDescription)", category: AppLogger.auth)
            errorMessage = AppError.from(error).userMessage
        }
        
        isLoading = false
    }
    
    func backToLogin() {
        onBackToLogin()
    }
    
    // MARK: - Validation
    
    private func validate() -> Bool {
        if email.isEmpty {
            emailError = "Email is required"
            return false
        } else if !email.isValidEmail {
            emailError = "Invalid email address"
            return false
        }
        
        return true
    }
}

// MARK: - Email Validation Extension

private extension String {
    var isValidEmail: Bool {
        let emailRegex = "^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }
}

