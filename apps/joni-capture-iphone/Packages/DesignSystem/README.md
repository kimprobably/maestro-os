# DesignSystem

Token-based design system with reusable components, accessibility helpers, and theme support for 5 built-in themes.

## Key Types

**Tokens (design language):**
- `DSColors` -- theme-aware color tokens (accent, surface, text, semantic)
- `DSTypography` -- type scale (titleXL, body, caption, code) with Dynamic Type
- `DSSpacing` -- spacing scale (xs through xl: 4, 8, 12, 16, 24pt)
- `DSRadius` -- corner radius scale (xs through xl: 8, 12, 16, 24, 32pt)
- `DSElevation` -- shadow styles (soft, level1, level2, level3)
- `DSGradient` -- brand gradients (primaryLinear, shimmer, glassOverlay)
- `DSLayout` -- layout constants (readableMaxWidth: 420pt)

**Components (prefixed with SAI):**
- `SAIButton` -- primary/secondary/quiet styles, sm/md/lg sizes, haptic feedback
- `SAICard` -- elevated/outline/tinted styles with optional tap interaction
- `SAIChip` -- selection chip with loading state and shimmer
- `ChatBubble` -- user/assistant/system roles with streaming indicator
- `SAIInputBar`, `SAIAvatar`, `SAITag`, `SAIListRow`, `SAISectionHeader`
- `SAISkeleton` -- loading placeholder
- `SAIToast` -- toast notifications via `ToastCenter`

**Accessibility:**
- `A11y` -- type-safe accessibility labels organized by feature (Chat, Auth, Settings, etc.)
- `A11yModifiers` -- `.saiAccessible()`, `.saiAccessibilityHidden()`, `.saiScaledFont()`, `.saiReducedMotionAnimation()`
- `A11yAudit` -- validation utilities for accessibility testing

**Motion and Haptics:**
- `SAIMotion` -- animation timings that respect Reduce Motion (quick, standard, smooth, spring)
- `HapticsClient` -- tap, success, error, warning, impact feedback

## Dependencies

None. DesignSystem depends only on SwiftUI. It is a leaf dependency used by all feature modules.

## Pattern

Token-based: define tokens once, apply everywhere. Components consume tokens internally. Feature modules never hardcode colors, spacing, or font sizes; they use `DSColors.textPrimary`, `DSSpacing.lg`, `DSTypography.body`, etc.

## Non-Obvious Decisions

- `DSColors` uses a static `activeTheme` property rather than SwiftUI environment because tokens need to be accessible from non-view contexts (e.g., computed properties in components).
- Theme changes trigger a `DSColorsDidChange` notification. The `.refreshOnThemeChange()` modifier listens for this and forces a view identity change so all tokens re-resolve.
- `BrandConfig` centralizes app display name and accent color for white-labeling.

## Shipping your own app (App Store 4.3)

You will almost always **keep** DesignSystem; differentiate via `BrandConfig`, colors, and components. Wholesale removal requires replacing all `DSColors` / `DSSpacing` usage. See **[APP_STORE 4.3 hardening](../../docs/checklists/APP_STORE_4_3_HARDENING.md)** — **Removing: DesignSystem**.