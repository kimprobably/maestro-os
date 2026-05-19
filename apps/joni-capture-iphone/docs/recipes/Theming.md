# Theming Guide

How to customize themes and create your own color palettes.

## Built-In Themes

The boilerplate includes 5 themes:

1. **System** - Follows iOS light/dark mode
2. **Light** - Always light
3. **Dark** - Always dark, OLED-optimized
4. **Aurora** - Premium light (teal/purple gradient)
5. **Obsidian** - Premium dark (deep blue/amber)

## How Themes Work

### Two-Layer System

**Layer 1: ThemeManager (Core)**
- Manages iOS interface style (.light, .dark, .unspecified)
- Persists user selection in SwiftData
- Triggers system-level changes (status bar, keyboard)

**Layer 2: DSColors (DesignSystem)**
- Resolves actual color values per theme
- Provides tokens like `textPrimary`, `background`, `accentPrimary`
- Updates when theme changes

### Theme Application Flow

```
User selects theme in Settings
    ↓
SettingsViewModel.updateTheme(.aurora)
    ↓
Save to SwiftData
    ↓
ThemeManager.selected = .aurora
    ↓
AppRootView.onChange → DSColors.setTheme("aurora", colorScheme)
    ↓
Views recreate with new colors
```

## Creating Custom Themes

### Step 1: Create Color Sets

1. Open `SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/`
2. Duplicate an existing theme folder (e.g., `Aurora/`)
3. Rename to your theme name (e.g., `Sunset/`)
4. Update colors in each `.colorset`:
   - `AccentPrimary`
   - `Background`
   - `Surface`
   - `TextPrimary`
   - `TextSecondary`
   - And all other tokens...

### Step 2: Add Theme Enum Case

**File:** `Packages/Core/Sources/Core/Theme/UserThemePreference.swift`

```swift
public enum UserThemePreference: String, Codable, CaseIterable {
    case system
    case light
    case dark
    case aurora
    case obsidian
    case sunset  // Add your theme
    
    public var displayName: String {
        switch self {
        case .sunset: return "Sunset"
        // ... other cases
        }
    }
}
```

### Step 3: Map Colors in DSColors

**File:** `Packages/DesignSystem/Sources/DesignSystem/Tokens/DSColors.swift`

```swift
internal enum ThemePalette {
    case system(colorScheme: ColorScheme)
    case light
    case dark
    case aurora
    case obsidian
    case sunset  // Add here
}

public static var accentPrimary: Color {
    switch activeTheme {
    case .system, .light, .dark:
        return named("AccentPrimary", fallback: defaultColor)
    case .aurora:
        return Color(red: 1.0, green: 0.45, blue: 0.6)
    case .obsidian:
        return Color(red: 0.4, green: 0.8, blue: 1.0)
    case .sunset:
        return Color(red: 1.0, green: 0.6, blue: 0.2)  // Your color
    }
}

// Repeat for all color tokens...
```

### Step 4: Update Theme Setter

**File:** `Packages/DesignSystem/Sources/DesignSystem/Tokens/DSColors.swift`

```swift
public static func setTheme(_ theme: String, colorScheme: ColorScheme) {
    switch theme {
    case "system":
        activeTheme = .system(colorScheme: colorScheme)
    case "light":
        activeTheme = .light
    case "dark":
        activeTheme = .dark
    case "aurora":
        activeTheme = .aurora
    case "obsidian":
        activeTheme = .obsidian
    case "sunset":
        activeTheme = .sunset  // Add here
    default:
        activeTheme = .system(colorScheme: colorScheme)
    }
}
```

### Step 5: Test Theme

1. Build and run app
2. Go to Settings
3. Select your new theme
4. Verify all screens update correctly
5. Test in light and dark mode

## Theme Checklist

When creating a theme, ensure you define:

- [ ] `AccentPrimary` - Main brand color
- [ ] `AccentSecondary` - Secondary actions
- [ ] `Background` - Page background
- [ ] `Surface` - Card backgrounds
- [ ] `TextPrimary` - Main text (WCAG AA contrast)
- [ ] `TextSecondary` - Captions, secondary text
- [ ] `BubbleUser` - User message bubbles
- [ ] `BubbleAssistant` - AI message bubbles
- [ ] `BorderHairline` - Thin borders
- [ ] `BorderSubtle` - Section dividers
- [ ] Test in all app screens
- [ ] Verify accessibility (contrast, Dynamic Type)

## Color Palette Generator

Use these tools to create cohesive palettes:

- [Coolors.co](https://coolors.co) - Palette generator
- [Color Hunt](https://colorhunt.co) - Curated palettes
- [Adobe Color](https://color.adobe.com) - Advanced tools
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - WCAG validation

## Best Practices

### Contrast Ratios
- Text on background: 4.5:1 minimum (AA)
- Large text: 3:1 minimum (AA)
- UI components: 3:1 minimum (AA)

### Color Meaning
- **Primary/Accent**: Brand identity, CTAs, user actions
- **Surface**: Cards, elevated elements
- **Semantic**: Success (green), Warning (orange), Danger (red)

### Dark Mode
- Avoid pure black (#000000), use dark gray
- Reduce saturation compared to light mode
- Test on OLED devices

## LLM Prompt

```
Create a new theme called "Ocean" with these colors:
- Primary: #0077BE (ocean blue)
- Secondary: #00A8E8 (sky blue)
- Background (light): #F0F8FF (alice blue)
- Background (dark): #001F3F (navy)
- Text Primary (light): #1A1A1A
- Text Primary (dark): #E8F4F8

Add to UserThemePreference enum, create color sets in DesignSystemColors.xcassets with light/dark variants, and map in DSColors.swift. Ensure WCAG AA contrast compliance. Test in both light and dark modes.

Follow the pattern in docs/recipes/Theming.md.
```

## Related Docs

- `docs/foundations/DesignSystem.md` - Token system overview
- `docs/modules/DesignSystem.md` - Complete token reference
- `docs/modules/Feature.Settings.md` - Theme picker UI
