import Auth
import Core
import Foundation

@available(iOS 17.0, *)
@Observable
final class EmailSignUpViewModel {
    // MARK: - Form state

    //
    // `didSet` clears errors eagerly so the Sign Up button does not stay
    // disabled on a stale validation error the user has already corrected.

    var email = "" {
        didSet { emailError = nil; errorMessage = nil }
    }

    var password = "" {
        didSet { passwordError = nil; confirmPasswordError = nil; errorMessage = nil }
    }

    var confirmPassword = "" {
        didSet { confirmPasswordError = nil; errorMessage = nil }
    }

    var acceptedTerms = false {
        didSet { termsError = nil; errorMessage = nil }
    }

    var isLoading = false
    var errorMessage: String?
    var successMessage: String?

    // Validation errors
    var emailError: String?
    var passwordError: String?
    var confirmPasswordError: String?
    var termsError: String?

    // MARK: - Derived

    var passwordStrength: PasswordStrength {
        PasswordStrength.evaluate(password)
    }

    var isFormValid: Bool {
        !email.isEmpty &&
            !password.isEmpty &&
            !confirmPassword.isEmpty &&
            acceptedTerms &&
            emailError == nil &&
            passwordError == nil &&
            confirmPasswordError == nil
    }

    // MARK: - Dependencies

    private let authClient: any AuthClient
    private let onSuccess: () -> Void
    private let onSwitchToLogin: () -> Void

    init(authClient: any AuthClient, onSuccess: @escaping () -> Void, onSwitchToLogin: @escaping () -> Void) {
        self.authClient = authClient
        self.onSuccess = onSuccess
        self.onSwitchToLogin = onSwitchToLogin
    }

    // MARK: - Actions

    @MainActor
    func signUp() async {
        emailError = nil
        passwordError = nil
        confirmPasswordError = nil
        termsError = nil
        errorMessage = nil
        successMessage = nil

        guard validate() else { return }

        isLoading = true

        do {
            _ = try await authClient.signUpWithEmail(email: email, password: password)
            AppLogger.info("User signed up successfully", category: AppLogger.auth)
            onSuccess()
        } catch let authError as AuthError {
            if authError == .emailConfirmationRequired {
                AppLogger.info("Email confirmation required for signup", category: AppLogger.auth)
                successMessage = "Account created! Please check your email and click the confirmation link to activate your account. Once confirmed, you can sign in."
            } else {
                AppLogger.error("Sign up failed: \(authError)", category: AppLogger.auth)
                errorMessage = authError.asAppError().userMessage
            }
        } catch {
            AppLogger.error("Sign up failed: \(error.localizedDescription)", category: AppLogger.auth)
            errorMessage = AppError.from(error).userMessage
        }

        isLoading = false
    }

    func switchToLogin() {
        onSwitchToLogin()
    }

    // MARK: - Validation

    private func validate() -> Bool {
        var isValid = true

        if email.isEmpty {
            emailError = "Email is required"
            isValid = false
        } else if !email.isValidEmail {
            emailError = "Invalid email address"
            isValid = false
        } else {
            emailError = nil
        }

        if password.isEmpty {
            passwordError = "Password is required"
            isValid = false
        } else if password.count < 8 {
            passwordError = "Password must be at least 8 characters"
            isValid = false
        } else {
            passwordError = nil
        }

        if confirmPassword.isEmpty {
            confirmPasswordError = "Please confirm your password"
            isValid = false
        } else if password != confirmPassword {
            confirmPasswordError = "Passwords do not match"
            isValid = false
        } else {
            confirmPasswordError = nil
        }

        if !acceptedTerms {
            termsError = "Required"
            isValid = false
        } else {
            termsError = nil
        }

        return isValid
    }
}

// MARK: - Email validation

private extension String {
    var isValidEmail: Bool {
        let emailRegex = "^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: self)
    }
}
