# Auth Module Prompts

Ready-to-use prompts for common tasks in the Auth module.

## Add a New Auth Provider

> Add Google Sign-In alongside the existing Apple and email/password auth. Create a `GoogleSignInCoordinator` following the `AppleSignInCoordinator` pattern in `Packages/Auth/Sources/Auth/`. It should return credentials that `SessionManager` can exchange with Supabase. Update `CompositionRoot` to wire the new coordinator.

## Add a Password Reset Flow

> Add a "Forgot Password" flow that sends a reset email via Supabase Auth. Add a `resetPassword(email:)` method to the `AuthClient` protocol. Implement it in `SessionManager`. Create a `ForgotPasswordView` and `ForgotPasswordViewModel` following the existing View > ViewModel pattern.

## Add Auth State Persistence Check

> Add a method to `SessionManager` that checks on app launch whether the stored Keychain token is still valid. If expired, attempt a silent refresh. If the refresh fails, transition to `.unauthenticated` state. Follow the existing token refresh pattern with the 60-second proactive refresh window.
