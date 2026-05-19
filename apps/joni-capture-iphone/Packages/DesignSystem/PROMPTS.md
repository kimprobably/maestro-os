# DesignSystem Module Prompts

Ready-to-use prompts for common tasks in the DesignSystem module.

## Add a New Reusable Component

> Create a new `SAIBanner` component for showing promotional or informational banners at the top of screens. It should accept a title, message, optional icon, and a dismiss action. Use `DSColors.surfaceTinted` for the background, `DSSpacing.md` for padding, and `DSRadius.sm` for corners. Follow the existing `SAICard` component pattern. Include accessibility labels using the `A11y` system.

## Add a New Color Token

> Add a `textTertiary` color token to `DSColors` for placeholder and hint text. It should resolve correctly across all 5 themes (System, Light, Dark, Aurora, Obsidian). Follow the existing `textPrimary`/`textSecondary` implementation pattern with theme-aware switch statements.

## Customize Theme Colors for Branding

> Replace the Aurora theme colors with my brand palette. Update `DSColors.swift` to change `accentPrimary`, `accentSecondary`, `background`, `surface`, and `textPrimary` for the `.aurora` case. Update `DSGradient.primaryLinear` for the Aurora case as well. Test in both the theme picker and a chat screen.

## Add a New Accessibility Label Set

> Add accessibility labels for a new "Favorites" feature. Create a `Favorites` namespace inside `A11y` with labels for: favoriteButton, unfavoriteButton, favoritesList, emptyState. Follow the existing `A11y.Chat` and `A11y.Settings` pattern with appropriate traits and hints.
