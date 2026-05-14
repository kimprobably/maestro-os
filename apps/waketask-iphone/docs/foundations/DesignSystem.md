# Design System Foundation

## Philosophy

Simple, calm, premium. Clean layouts with generous spacing, consistent visual hierarchy, accessible by default.

## Core Principles

### 1. Token-Based Design
Never hardcode visual values. Always use design tokens.

```swift
// Good
.foregroundStyle(DSColors.textPrimary)
.padding(DSSpacing.lg)

// Bad
.foregroundStyle(.black)
.padding(20)
```

### 2. Theme Support
All components adapt to 5 built-in themes:
- System (follows iOS)
- Light
- Dark
- Aurora (premium light)
- Obsidian (premium dark)

### 3. Accessibility First
- Dynamic Type support
- VoiceOver labels
- Minimum contrast ratios (WCAG AA)
- Reduce Motion respect

## Token System

### Colors (DSColors)
- `textPrimary` / `textSecondary` - Text hierarchy
- `background` / `surface` - Backgrounds
- `accentPrimary` / `accentSecondary` - Brand colors
- `borderHairline` / `borderSubtle` - Separators

### Spacing (DSSpacing)
- `xs` (8pt) → `sm` (12pt) → `md` (16pt) → `lg` (20pt) → `xl` (24pt)

### Typography
- `.titleText()` / `.bodyText()` / `.captionText()` - Consistent text styles

### Components
- `SAIButton` - Buttons with states
- `SAICard` - Container with elevation
- `ChatBubble` - Message bubbles
- `SAIInputBar` - Text input with send

### Liquid Glass (iOS 26) via `SAIGlass`
v2.0 adds `Packages/DesignSystem/Sources/DesignSystem/Materials/SAIGlass.swift` — a single wrapper around iOS 26 Liquid Glass with an automatic SwiftUI `Material` fallback for iOS 17–25:

- `SAIGlassStyle` — `.regular`, `.clear`
- `.saiGlass(_:in:interactive:)` — single glass surface
- `SAIGlassContainer { … }` — merged compositing for sibling glass surfaces
- `.saiScrollEdgeGlass(_:)` — opt-in `scrollEdgeEffectStyle(.hard, for:)` on iOS 26
- `.saiSidebarAdaptable()` / `.saiTabBarMinimize(_:)` — availability-gated

Use these wrappers instead of touching `Glass` / `.glassEffect` / `GlassEffectContainer` directly. Do **not** paint `DSColors.background` over a glass surface — the v2.0 "fighting glass" pass removed every such override.

## Complete Reference
See: `docs/modules/DesignSystem.md` for the full token reference, component catalog, and the detailed `SAIGlass` API.
