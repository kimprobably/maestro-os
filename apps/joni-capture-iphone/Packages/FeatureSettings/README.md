# FeatureSettings

Settings screen, paywall presentation, and legal document views. Manages theme selection, notification preferences, account actions, and subscription state.

## Key Types

- `SettingsViewModel` (@Observable) -- loads/saves settings via `SettingsRepository`, observes auth and payments state streams, handles sign-in/sign-out and purchase/restore flows
- `PaywallViewModel` (@Observable) -- manages paywall display state and purchase interaction
- `SettingsView` -- settings screen with theme picker, toggles, account section
- `PaywallView` -- subscription paywall with product offerings
- `LegalDocumentView` -- renders terms, privacy policy, and subscription terms from bundled markdown

## Dependencies

- `Core` (AppError, AppLogger, ThemeManager)
- `Storage` (SettingsRepository, SettingsDTO)
- `Auth` (AuthClient for sign-in/sign-out, auth state observation)
- `Payments` (PaymentsClient for purchase/restore, payments state observation)
- `DesignSystem` (DSColors, DSSpacing, SAIButton, SAICard, ToastCenter)

## Pattern

View > ViewModel. The ViewModel layer handles all business logic:
- `SettingsViewModel` reads/writes settings via `SettingsRepository` (from Storage)
- Auth and payments state come from `AuthClient.authStates()` and `PaymentsClient.states()` async streams
- No dedicated Repository or Service layer in this package; it delegates to shared modules (Storage, Auth, Payments)

## Non-Obvious Decisions

- `SettingsViewModel` bridges two theme systems: it saves the user's choice to `SettingsRepository` (SwiftData) and also updates `ThemeManager.shared` for immediate UI application.
- Restore purchases is exposed as an explicit user action (not called on launch) to comply with App Store Guideline 3.1.1.
- Notification permission is requested only when the user toggles notifications on, not at app startup.

## Shipping your own app (App Store 4.3)

Settings and paywall surfaces are central to most forks. If you **strip** this package, replace navigation to `SettingsView` / `PaywallView` and reimplement account/legal URLs. See **[APP_STORE 4.3 hardening](../../docs/checklists/APP_STORE_4_3_HARDENING.md)** — **Removing: FeatureSettings**.