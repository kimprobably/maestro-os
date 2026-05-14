# FeatureSettings Module Prompts

Ready-to-use prompts for common tasks in the FeatureSettings module.

## Add a Custom Theme

> Add a new theme called "Midnight" with a deep purple palette. Add the case to `UserThemePreference` in Core, add color tokens to `DSColors` in DesignSystem, and add the option to the theme picker in `SettingsView`. Follow the existing Aurora/Obsidian theme implementation pattern.

## Add an Account Deletion Flow

> Add a "Delete Account" button to the settings screen. Create a confirmation dialog that explains data will be permanently removed. Call `authClient.deleteAccount()` (add this method to the `AuthClient` protocol). On success, clear local data via repositories and navigate to the sign-in screen. Follow the existing sign-out pattern in `SettingsViewModel`.

## Add a Data Export Feature

> Add an "Export My Data" option to the settings screen. Collect all conversations and messages from the repositories, serialize them to JSON, and present a share sheet. Follow the existing `SettingsViewModel` pattern for the business logic. Use `ShareLink` in the view.
