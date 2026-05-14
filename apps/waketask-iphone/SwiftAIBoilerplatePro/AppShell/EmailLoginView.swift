import Auth
import Core
import DesignSystem
import SwiftUI

/// Email login screen with password reset link
@available(iOS 17.0, *)
struct EmailLoginView: View {
    // MARK: - Properties

    @State private var viewModel: EmailLoginViewModel
    @FocusState private var focusedField: Field?

    private enum Field: Hashable {
        case email, password
    }

    // MARK: - Initialization

    init(
        authClient: any AuthClient,
        onSuccess: @escaping () -> Void,
        onSwitchToSignUp: @escaping () -> Void,
        onForgotPassword: @escaping () -> Void
    ) {
        viewModel = EmailLoginViewModel(
            authClient: authClient,
            onSuccess: onSuccess,
            onSwitchToSignUp: onSwitchToSignUp,
            onForgotPassword: onForgotPassword
        )
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DSSpacing.xl) {
                    // Header
                    headerSection

                    // Form
                    formSection

                    // Forgot password link
                    forgotPasswordLink

                    // Login button
                    loginButton

                    // Switch to sign up
                    switchToSignUpSection

                    // Error display
                    if let errorMessage = viewModel.errorMessage {
                        errorSection(errorMessage)
                    }
                }
                .padding(DSSpacing.xl)
            }
            .navigationTitle("Sign In")
            .navigationBarTitleDisplayMode(.large)
            .disabled(viewModel.isLoading)
            .contentShape(Rectangle())
            .onTapGesture {
                focusedField = nil
            }
        }
    }

    // MARK: - Subviews

    private var headerSection: some View {
        VStack(spacing: DSSpacing.md) {
            Text("Welcome Back")
                .font(.title)
                .fontWeight(.bold)

            Text("Sign in to continue")
                .font(.subheadline)
                .foregroundStyle(DSColors.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var formSection: some View {
        VStack(spacing: DSSpacing.lg) {
            // Email field
            VStack(alignment: .leading, spacing: DSSpacing.sm) {
                Text("Email")
                    .font(.subheadline)
                    .fontWeight(.medium)

                TextField("your@email.com", text: $viewModel.email)
                    .textFieldStyle(.roundedBorder)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .focused($focusedField, equals: .email)
                    .submitLabel(.next)
                    .onSubmit {
                        focusedField = .password
                    }

                if let error = viewModel.emailError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            // Password field
            VStack(alignment: .leading, spacing: DSSpacing.sm) {
                Text("Password")
                    .font(.subheadline)
                    .fontWeight(.medium)

                HStack {
                    if viewModel.showPassword {
                        TextField("Enter your password", text: $viewModel.password)
                            .textContentType(.password)
                            .focused($focusedField, equals: .password)
                            .submitLabel(.done)
                            .onSubmit {
                                Task {
                                    await viewModel.signIn()
                                }
                            }
                    } else {
                        SecureField("Enter your password", text: $viewModel.password)
                            .textContentType(.password)
                            .focused($focusedField, equals: .password)
                            .submitLabel(.done)
                            .onSubmit {
                                Task {
                                    await viewModel.signIn()
                                }
                            }
                    }

                    Button {
                        viewModel.showPassword.toggle()
                    } label: {
                        Image(systemName: viewModel.showPassword ? "eye.slash" : "eye")
                            .foregroundStyle(.secondary)
                    }
                }
                .textFieldStyle(.roundedBorder)

                if let error = viewModel.passwordError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }
        }
    }

    private var forgotPasswordLink: some View {
        HStack {
            Spacer()
            Button("Forgot Password?") {
                viewModel.forgotPassword()
            }
            .font(.subheadline)
            .foregroundStyle(DSColors.accentPrimary)
        }
    }

    private var loginButton: some View {
        SAIButton(
            viewModel.isLoading ? "Signing in..." : "Sign In",
            style: .primary,
            size: .lg
        ) {
            Task {
                await viewModel.signIn()
            }
        }
        .disabled(!viewModel.isFormValid || viewModel.isLoading)
    }

    private var switchToSignUpSection: some View {
        HStack {
            Text("Don't have an account?")
                .foregroundStyle(DSColors.textSecondary)

            Button("Sign Up") {
                viewModel.switchToSignUp()
            }
            .foregroundStyle(DSColors.accentPrimary)
        }
        .font(.subheadline)
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
final class EmailLoginViewModel {
    // MARK: - Published State

    // Note: Using didSet to clear errors when user edits fields
    // This prevents the validation deadlock where errors disable the button
    // but errors can only be cleared by submitting (which requires the button)

    var email = "" {
        didSet { emailError = nil; errorMessage = nil }
    }

    var password = "" {
        didSet { passwordError = nil; errorMessage = nil }
    }

    var showPassword = false

    var isLoading = false
    var errorMessage: String?

    // Validation errors
    var emailError: String?
    var passwordError: String?

    // MARK: - Computed Properties

    var isFormValid: Bool {
        !email.isEmpty &&
            !password.isEmpty &&
            emailError == nil &&
            passwordError == nil
    }

    // MARK: - Dependencies

    private let authClient: any AuthClient
    private let onSuccess: () -> Void
    private let onSwitchToSignUp: () -> Void
    private let onForgotPassword: () -> Void

    // MARK: - Initialization

    init(
        authClient: any AuthClient,
        onSuccess: @escaping () -> Void,
        onSwitchToSignUp: @escaping () -> Void,
        onForgotPassword: @escaping () -> Void
    ) {
        self.authClient = authClient
        self.onSuccess = onSuccess
        self.onSwitchToSignUp = onSwitchToSignUp
        self.onForgotPassword = onForgotPassword
    }

    // MARK: - Actions

    @MainActor
    func signIn() async {
        // Clear previous errors
        emailError = nil
        passwordError = nil
        errorMessage = nil

        // Validate
        guard validate() else { return }

        isLoading = true

        do {
            _ = try await authClient.signInWithEmail(email: email, password: password)
            AppLogger.info("User signed in successfully", category: AppLogger.auth)
            onSuccess()
        } catch let authError as AuthError {
            // Handle AuthError specifically for better error messages
            AppLogger.error("Sign in failed: \(authError)", category: AppLogger.auth)
            errorMessage = authError.asAppError().userMessage
        } catch {
            // Handle other errors
            AppLogger.error("Sign in failed: \(error.localizedDescription)", category: AppLogger.auth)
            errorMessage = AppError.from(error).userMessage
        }

        isLoading = false
    }

    func switchToSignUp() {
        onSwitchToSignUp()
    }

    func forgotPassword() {
        onForgotPassword()
    }

    // MARK: - Validation

    private func validate() -> Bool {
        var isValid = true

        // Email validation
        if email.isEmpty {
            emailError = "Email is required"
            isValid = false
        } else if !email.isValidEmail {
            emailError = "Invalid email address"
            isValid = false
        }

        // Password validation
        if password.isEmpty {
            passwordError = "Password is required"
            isValid = false
        }

        return isValid
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
