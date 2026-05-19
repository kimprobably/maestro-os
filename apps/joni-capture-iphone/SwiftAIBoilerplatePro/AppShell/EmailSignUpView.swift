import SwiftUI
import Auth
import DesignSystem

/// Email sign-up screen with validation and terms acceptance.
/// Form fields and the view model live alongside in `AppShell/Auth/`.
@available(iOS 17.0, *)
struct EmailSignUpView: View {

    @State private var viewModel: EmailSignUpViewModel
    @FocusState private var focusedField: EmailSignUpField?
    @State private var showTerms = false

    init(authClient: any AuthClient, onSuccess: @escaping () -> Void, onSwitchToLogin: @escaping () -> Void) {
        self.viewModel = EmailSignUpViewModel(
            authClient: authClient,
            onSuccess: onSuccess,
            onSwitchToLogin: onSwitchToLogin
        )
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: DSSpacing.xl) {
                    headerSection

                    EmailSignUpFormFields(
                        viewModel: viewModel,
                        focusedField: $focusedField
                    ) {
                        Task { await viewModel.signUp() }
                    }

                    termsSection
                    signUpButton
                    switchToLoginSection

                    if let successMessage = viewModel.successMessage {
                        successSection(successMessage)
                    }

                    if let errorMessage = viewModel.errorMessage {
                        errorSection(errorMessage)
                    }
                }
                .padding(DSSpacing.xl)
            }
            .navigationTitle("Sign Up")
            .navigationBarTitleDisplayMode(.large)
            .disabled(viewModel.isLoading)
            .contentShape(Rectangle())
            .onTapGesture {
                focusedField = nil
            }
            .sheet(isPresented: $showTerms) {
                LegalDocumentView.terms()
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: DSSpacing.md) {
            Text("Create Account")
                .font(.title)
                .fontWeight(.bold)

            Text("Sign up to get started")
                .font(.subheadline)
                .foregroundStyle(DSColors.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Terms

    private var termsSection: some View {
        HStack(alignment: .top, spacing: DSSpacing.md) {
            Toggle("", isOn: $viewModel.acceptedTerms)
                .labelsHidden()
                .fixedSize()

            VStack(alignment: .leading, spacing: DSSpacing.xs) {
                HStack(spacing: 4) {
                    Text("I agree to the")
                        .font(.subheadline)
                    Button("Terms & Privacy") {
                        showTerms = true
                    }
                    .font(.subheadline)
                    .foregroundStyle(DSColors.accentPrimary)
                }
                .fixedSize(horizontal: false, vertical: true)

                if viewModel.termsError != nil {
                    Text("You must accept the terms to continue")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Actions

    private var signUpButton: some View {
        SAIButton(
            viewModel.isLoading ? "Creating account..." : "Sign Up",
            style: .primary,
            size: .lg
        ) {
            Task { await viewModel.signUp() }
        }
        .disabled(!viewModel.isFormValid || viewModel.isLoading)
    }

    private var switchToLoginSection: some View {
        HStack {
            Text("Already have an account?")
                .foregroundStyle(DSColors.textSecondary)

            Button("Sign In") {
                viewModel.switchToLogin()
            }
            .foregroundStyle(DSColors.accentPrimary)
        }
        .font(.subheadline)
    }

    // MARK: - Success / Error

    private func successSection(_ message: String) -> some View {
        VStack(spacing: DSSpacing.md) {
            HStack(spacing: DSSpacing.md) {
                Image(systemName: "envelope.circle.fill")
                    .foregroundStyle(.green)
                    .font(.title2)

                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
            }
            .padding(DSSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.green.opacity(0.1))
            .cornerRadius(DSSpacing.sm)

            SAIButton("Go to Sign In", style: .secondary, size: .md) {
                viewModel.switchToLogin()
            }
        }
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
