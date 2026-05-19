import SwiftUI
import DesignSystem

/// Fields currently focused in the sign-up form.
enum EmailSignUpField: Hashable {
    case email, password, confirmPassword
}

/// Email + password + confirm-password fields with live validation errors
/// and a password-strength indicator.
struct EmailSignUpFormFields: View {

    @Bindable var viewModel: EmailSignUpViewModel
    var focusedField: FocusState<EmailSignUpField?>.Binding
    let onSubmit: () -> Void

    var body: some View {
        VStack(spacing: DSSpacing.lg) {
            emailField
            passwordField
            confirmPasswordField
        }
    }

    // MARK: - Email

    private var emailField: some View {
        VStack(alignment: .leading, spacing: DSSpacing.sm) {
            Text("Email")
                .font(.subheadline)
                .fontWeight(.medium)

            TextField("your@email.com", text: $viewModel.email)
                .textFieldStyle(.roundedBorder)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .focused(focusedField, equals: .email)
                .submitLabel(.next)
                .onSubmit { focusedField.wrappedValue = .password }

            if let error = viewModel.emailError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    // MARK: - Password

    private var passwordField: some View {
        VStack(alignment: .leading, spacing: DSSpacing.sm) {
            Text("Password")
                .font(.subheadline)
                .fontWeight(.medium)

            SecureField("At least 8 characters", text: $viewModel.password)
                .textFieldStyle(.roundedBorder)
                .textContentType(.newPassword)
                .focused(focusedField, equals: .password)
                .submitLabel(.next)
                .onSubmit { focusedField.wrappedValue = .confirmPassword }

            if !viewModel.password.isEmpty {
                passwordStrengthView
            }

            if let error = viewModel.passwordError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    private var passwordStrengthView: some View {
        VStack(spacing: DSSpacing.xs) {
            HStack(spacing: DSSpacing.sm) {
                ForEach(0..<4, id: \.self) { index in
                    Capsule()
                        .fill(index < viewModel.passwordStrength.rawValue ? strengthColor : Color.gray.opacity(0.3))
                        .frame(height: 4)
                }
            }

            HStack {
                Text(viewModel.passwordStrength.label)
                    .font(.caption2)
                    .foregroundStyle(strengthColor)
                Spacer()
            }
        }
    }

    private var strengthColor: Color {
        switch viewModel.passwordStrength {
        case .weak: return .red
        case .fair: return .orange
        case .good: return .yellow
        case .strong: return .green
        }
    }

    // MARK: - Confirm password

    private var confirmPasswordField: some View {
        VStack(alignment: .leading, spacing: DSSpacing.sm) {
            Text("Confirm Password")
                .font(.subheadline)
                .fontWeight(.medium)

            SecureField("Re-enter password", text: $viewModel.confirmPassword)
                .textFieldStyle(.roundedBorder)
                .textContentType(.newPassword)
                .focused(focusedField, equals: .confirmPassword)
                .submitLabel(.done)
                .onSubmit(onSubmit)

            if let error = viewModel.confirmPasswordError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }
}

// MARK: - Password strength

enum PasswordStrength: Int {
    case weak = 1
    case fair = 2
    case good = 3
    case strong = 4

    var label: String {
        switch self {
        case .weak: return "Weak"
        case .fair: return "Fair"
        case .good: return "Good"
        case .strong: return "Strong"
        }
    }

    static func evaluate(_ password: String) -> PasswordStrength {
        var score = 0

        if password.count >= 8 { score += 1 }
        if password.count >= 12 { score += 1 }

        if password.range(of: "[A-Z]", options: .regularExpression) != nil { score += 1 }
        if password.range(of: "[a-z]", options: .regularExpression) != nil { score += 1 }
        if password.range(of: "[0-9]", options: .regularExpression) != nil { score += 1 }
        if password.range(of: "[^A-Za-z0-9]", options: .regularExpression) != nil { score += 1 }

        let normalized = min(max(score / 2, 1), 4)
        return PasswordStrength(rawValue: normalized) ?? .weak
    }
}
