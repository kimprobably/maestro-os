# DesignSystem Module

UI components, design tokens, and theming system for visual consistency.

> **Design Philosophy:** Simple, calm, premium. Clean layouts with generous spacing, consistent visual hierarchy, accessible by default.

> **v2.0 — Liquid Glass.** v2.0.0 added `SAIGlass` as the single opinionated wrapper around iOS 26 Liquid Glass. It uses `Glass` / `glassEffect` / `GlassEffectContainer` on iOS 26 and falls back to SwiftUI `Material` on iOS 17–25. Chat input bars, the main tab bar, `SAIToast`, the rating prompt card, loading overlays, and paywall CTAs all adopt Liquid Glass through this one surface. See the new [Liquid Glass (SAIGlass)](#liquid-glass-saiglass) section below.

## Purpose

**What DesignSystem owns:**
- Design tokens (colors, spacing, typography, radius)
- Reusable UI components (buttons, inputs, cards, bubbles)
- Theme system (5 built-in themes)
- Haptics and motion utilities
- Accessibility helpers
- Visual consistency guidelines

**What DesignSystem does NOT own:**
- Feature-specific UI (see Feature modules)
- Business logic (see ViewModels)
- Data models (see Storage)
- Theme storage (uses Core/UserThemePreference)

**Golden Rule:** Never hardcode visual values. Always use design tokens.

## Public API

```swift
import DesignSystem

// Colors
Text("Hello")
    .foregroundStyle(DSColors.textPrimary)
    .background(DSColors.background)

// Spacing
VStack(spacing: DSSpacing.l) {
    // content
}
.padding(DSSpacing.xl)

// Typography
Text("Body text")
    .bodyText()  // Applies font + line spacing

// Components
SAIButton(title: "Submit", action: { /* action */ })
SAIInputBar(text: $text, placeholder: "Type...", onSend: { /* send */ })
ChatBubble(role: .assistant, text: "Hello!", isStreaming: false)

// Gradients
Rectangle()
    .fill(DSGradient.aurora)
```

## Setup

No environment variables. Design system is self-contained.

### Usage

```swift
// Import in any SwiftUI view
import DesignSystem

struct MyView: View {
    var body: some View {
        VStack(spacing: DSSpacing.m) {
            Text("Title")
                .headingText()
                .foregroundStyle(DSColors.textPrimary)
        }
        .padding(DSSpacing.l)
        .background(DSColors.background)
    }
}
```

### Flags

None. Theme selection happens at runtime via Settings.

## Example: Apply Theme in 3 Steps

### Step 1: Define Colors

```swift
// Already defined in DSColors.swift
public struct DSColors {
    // Primary
    public static var accentPrimary: Color { resolveColor(for: "AccentPrimary") }
    
    // Backgrounds
    public static var background: Color { resolveColor(for: "Background") }
    public static var secondaryBackground: Color { resolveColor(for: "SecondaryBackground") }
    
    // Text
    public static var textPrimary: Color { resolveColor(for: "TextPrimary") }
    public static var textSecondary: Color { resolveColor(for: "TextSecondary") }
    
    // Bubbles
    public static var bubbleUser: Color { resolveColor(for: "BubbleUser") }
    public static var bubbleAssistant: Color { resolveColor(for: "BubbleAssistant") }
    
    // Helper
    private static func resolveColor(for name: String) -> Color {
        // Load from asset catalog with light/dark variants
        Color(name, bundle: .module)
    }
}
```

### Step 2: Use Tokens in Views

```swift
struct MyView: View {
    var body: some View {
        VStack(spacing: DSSpacing.l) {
            Text("Title")
                .headingText()
                .foregroundStyle(DSColors.textPrimary)
            
            Text("Subtitle")
                .bodyText()
                .foregroundStyle(DSColors.textSecondary)
        }
        .padding(DSSpacing.xl)
        .background(DSColors.background)
        .cornerRadius(DSRadius.m)
    }
}
```

### Step 3: Change Theme

```swift
// User selects theme in Settings
await settingsViewModel.updateTheme(.aurora)

// Theme saved to Storage
// All views using DSColors automatically update
// Environment colorScheme changes
// Views re-render with new colors
```

**Expected result:**
Entire app updates to new theme instantly without restart.

## Themes

### Built-in Themes

**System** (default)
- Follows iOS Light/Dark mode
- Standard iOS colors
- Clean, familiar

**Light**
- Always light mode
- White backgrounds
- High contrast

**Dark**
- Always dark mode
- Black backgrounds
- OLED-friendly

**Aurora**
- Premium gradient theme
- Teal/Purple palette
- Modern, vibrant

**Obsidian**
- Sleek dark theme
- Charcoal with amber accents
- Professional

### Theme Tokens

Each theme defines these colors:

```swift
// Primary
AccentPrimary      // Brand color, buttons, user bubbles
AccentSecondary    // Secondary actions

// Backgrounds
Background         // Main background
SecondaryBackground // Cards, elevated surfaces
Surface            // Assistant bubbles

// Text
TextPrimary        // Main text
TextSecondary      // Captions, secondary text
TextTertiary       // Placeholders

// Semantic
Separator          // Dividers
Destructive        // Delete, remove actions
Success            // Success states
Warning            // Warning states
```

### Adding Custom Theme

1. **Create color set in asset catalog:**
   ```
   DesignSystemColors.xcassets/
   └── MyTheme.colorset/
       ├── Contents.json
       ├── AccentPrimary (Light)
       ├── AccentPrimary (Dark)
       └── ... (all tokens)
   ```

2. **Add to UserThemePreference:**
   ```swift
   // In Core/Theme/UserThemePreference.swift
   public enum UserThemePreference: String, Codable, CaseIterable {
       case system
       case light
       case dark
       case aurora
       case obsidian
       case myTheme  // Add this
       
       public var displayName: String {
           switch self {
           case .myTheme: return "My Theme"
           // ... other cases
           }
       }
   }
   ```

3. **Update DSColors:**
   ```swift
   // Map theme to colors
   private static func resolveColor(for name: String) -> Color {
       let theme = currentTheme  // From Settings
       let colorName: String
       
       switch theme {
       case .myTheme:
           colorName = "MyTheme_\(name)"
       default:
           colorName = name
       }
       
       return Color(colorName, bundle: .module)
   }
   ```

## Tokens

### Colors

```swift
DSColors.accentPrimary           // Primary brand color
DSColors.background              // Main background
DSColors.textPrimary             // Main text
DSColors.bubbleUser              // User message bubble
DSColors.bubbleAssistant         // Assistant message bubble
```

### Spacing

```swift
DSSpacing.xs = 2pt
DSSpacing.s = 4pt
DSSpacing.m = 8pt
DSSpacing.l = 12pt
DSSpacing.xl = 16pt
DSSpacing.xxl = 24pt
DSSpacing.xxxl = 32pt
```

### Typography

```swift
Text("Heading").headingText()     // 24pt, semibold
Text("Title").titleText()         // 20pt, semibold
Text("Body").bodyText()           // 16pt, regular, 4pt line spacing
Text("Caption").captionText()     // 14pt, regular
Text("Small").smallText()         // 12pt, regular
Text("Code").codeText()           // 14pt, monospaced
```

### Radius

```swift
DSRadius.s = 4pt
DSRadius.m = 8pt
DSRadius.l = 12pt
DSRadius.xl = 16pt
DSRadius.full = .infinity
```

### Gradients

```swift
DSGradient.aurora    // Teal → Purple
DSGradient.sunset    // Orange → Pink
DSGradient.ocean     // Blue → Cyan
DSGradient.forest    // Green → Teal
```

## Components

### SAIButton

```swift
SAIButton(
    title: "Submit",
    style: .primary,  // or .secondary, .destructive
    isLoading: false,
    action: {
        // Action
    }
)
```

### SAIInputBar

```swift
SAIInputBar(
    text: $inputText,
    placeholder: "Type a message...",
    isEnabled: true,
    onSend: {
        // Send message
    }
)
```

### ChatBubble

```swift
ChatBubble(
    role: .user,  // or .assistant, .system
    text: "Hello, world!",
    isStreaming: false
)
```

### SAICard

```swift
SAICard {
    VStack {
        Text("Card Title")
        Text("Card content")
    }
}
```

### SAITextField

```swift
SAITextField(
    text: $email,
    placeholder: "Email",
    keyboardType: .emailAddress
)
```

### SAISecureField

```swift
SAISecureField(
    text: $password,
    placeholder: "Password"
)
```

## Liquid Glass (SAIGlass)

**File:** `Packages/DesignSystem/Sources/DesignSystem/Materials/SAIGlass.swift`

`SAIGlass` is the single wrapper around iOS 26 Liquid Glass. Use these APIs — do **not** touch `Glass`, `.glassEffect`, or `GlassEffectContainer` directly. The wrappers automatically fall back to SwiftUI `Material` on iOS 17–25 so the same call site works on both paths. CI covers the fallback path via the `test-ios18-fallback` job on iPhone 16 Pro / iOS 18.6.

### SAIGlassStyle

```swift
public enum SAIGlassStyle {
    case regular   // Default, most common — maps to Glass.regular on iOS 26, .regularMaterial below
    case clear     // Lighter treatment — maps to Glass.clear on iOS 26, .ultraThinMaterial below
}
```

### `.saiGlass(_:in:interactive:)` — single glass surface

```swift
RoundedRectangle(cornerRadius: 16)
    .saiGlass(.regular, in: .rect(cornerRadius: 16))

Button("Subscribe") { … }
    .saiGlass(.regular, in: .capsule, interactive: true)
```

Use `interactive: true` when the surface is on a pressable control so iOS 26 can animate the glass on press. Default is `false`.

### `SAIGlassContainer` — merged compositing

Wrap multiple sibling glass surfaces so iOS 26 merges their compositing (no-op passthrough on older OS):

```swift
SAIGlassContainer {
    ChipA()
    ChipB()
    ChipC()
}
```

### `.saiScrollEdgeGlass(_:)`

Opts into `scrollEdgeEffectStyle(.hard, for:)` on iOS 26; no-op on iOS 17–25. Use it where scroll content meets a floating glass surface (e.g. `ChatView` bottom where messages meet the input bar):

```swift
ScrollView { … }
    .saiScrollEdgeGlass(.bottom)
```

### `.saiSidebarAdaptable()` / `.saiTabBarMinimize(_:)`

Availability-gated wrappers for `tabViewStyle(.sidebarAdaptable)` and `tabBarMinimizeBehavior(_:)`:

```swift
TabView { … }
    .saiSidebarAdaptable()                  // Sidebar on iPad/Mac on iOS 26
    .saiTabBarMinimize(.onScrollDown)       // Tab bar minimizes on scroll (iOS 26)
```

### Where v2.0 adopted Liquid Glass

- **Main tab bar** (`MainTabView`) — `.saiSidebarAdaptable()` + `.saiTabBarMinimize(.onScrollDown)`
- **Chat input bars** (`SAIInputBar`, `ChatView`, `ChatGPTStyleView`) — floating interactive glass hosted via `.safeAreaInset(edge: .bottom)`, plus `.saiScrollEdgeGlass(.bottom)` on the scroll view behind them
- **`ChatHistoryView` toolbar** — "New Chat" replaced a custom `Circle` composition with a standard `Label`-based `Button` so iOS 26 auto-adopts glass
- **`SAIToast`** — background migrated from `DSColors.surfaceElevated` to `.saiGlass(.regular, …)`
- **`RatingPromptView`** — pre-prompt card now uses `.saiGlass(.regular, …)`
- **Loading overlays** — `SettingsView`, `PaywallView`, and similar overlays use `.saiGlass(.regular, in:)` instead of `.background(.regularMaterial)`
- **`PaywallView` CTAs** — `.buttonStyle(.borderedProminent)` / `.bordered` + `.controlSize(.large)` so the system adopts glass automatically
- **`SettingsView` Form** — `.formStyle(.grouped)` so row heights, padding, and section radii match iOS 26 defaults

### Fighting-glass cleanup (don't reintroduce)

The v2.0 pass removed every override that was painting an opaque layer over the material SwiftUI already provides. Do not add them back:

- `DSColors.background.ignoresSafeArea()` / `.background(DSColors.background)` on `SettingsView`, `HomeView`, `ProfileView`, `ProfileView.editProfileSheet`, `ChatHistoryView`
- `.scrollContentBackground(.hidden)` on `SettingsView` — `.formStyle(.grouped)` is the replacement
- Explicit `.safeAreaInset(edge: .bottom) { Color.clear.frame(height: 88) }` gutters on `HomeView` / `ProfileView` — the system tab bar already provides the correct insets under Liquid Glass
- `.background(DSColors.surface)` + `clipShape` stacks on `SAIInputBar` and `ChatGPTStyleView` input — the outer `saiGlass` wrapper owns the surface now

If you host `SAIInputBar` outside of `.safeAreaInset(edge: .bottom) { … }` you will see the glass without its reflection — wrap it back, or add a parent container that owns the safe-area inset.

## Common Customizations

> **Quick Start:** These recipes show how to customize the design system. Changes here affect the entire app.

### Add a New Theme

**Task:** Create a "Midnight" theme with dark blue colors.

**Steps:**
1. Create color sets in `Packages/DesignSystem/Resources/DesignSystemColors.xcassets/`
2. Add to UserThemePreference enum:
```swift
// In Core module
public enum UserThemePreference: String, Codable, CaseIterable {
    case system
    case light
    case dark
    case aurora
    case obsidian
    case midnight  // Add this
    
    public var displayName: String {
        switch self {
        case .midnight: return "Midnight"
        // ... other cases
        }
    }
}
```

3. Map colors in DSColors (handled automatically if color sets named correctly)

**LLM Prompt:**
```
Create a new "Midnight" theme with these colors:
- Background: #0f1419 (very dark blue)
- Primary: #1da1f2 (Twitter blue)
- Accent: #8b9dc3 (light blue)
- Text Primary: #ffffff
- Text Secondary: #8899a6

Follow the theme creation pattern in docs/DesignSystem.md. Create all required 
color sets with light/dark variants.
```

### Change Default Spacing

**Task:** Make the app more compact or more spacious.

**File:** `Packages/DesignSystem/Sources/DesignSystem/Tokens/Spacing.swift`

```swift
public enum DSSpacing {
    public static let xs: CGFloat = 4   // was 4, try 2 for compact
    public static let sm: CGFloat = 8   // was 8, try 4 for compact
    public static let md: CGFloat = 12  // was 12, try 8 for compact
    public static let lg: CGFloat = 16  // was 16, try 12 for compact
    public static let xl: CGFloat = 24  // was 24, try 20 for compact
    public static let xxl: CGFloat = 32 // was 32, try 28 for compact
}
```

**LLM Prompt:**
```
Make the app spacing more compact by reducing all DSSpacing values by 25%. 
Update DSSpacing.swift and rebuild. Test that all screens still look good and 
nothing is cramped. Keep minimum touch target sizes at 44pt.
```

### Customize Typography

**Task:** Use a custom font throughout the app.

**Steps:**
1. Add custom font files to project
2. Update `Packages/DesignSystem/Sources/DesignSystem/Tokens/Typography.swift`:
```swift
public enum DSTypography {
    public static let body = Font.custom("YourCustomFont-Regular", size: 16)
    public static let titleL = Font.custom("YourCustomFont-Bold", size: 24)
    // ... map all typography tokens
}
```

**LLM Prompt:**
```
Replace the system font with SF Pro Rounded throughout the app. Update DSTypography
to use .rounded() variant. Make sure all text styles (body, heading, caption) use 
the rounded font. Test that it looks good across all screens.
```

---

## Customization (Advanced)

### Safe Changes

**Override token values:**
```swift
// Create custom spacing
extension DSSpacing {
    static let custom: CGFloat = 18
}
```

**Add custom components:**
```swift
public struct MyCustomButton: View {
    let title: String
    let action: () -> Void
    
    public var body: some View {
        Button(action: action) {
            Text(title)
                .bodyText()
                .foregroundStyle(DSColors.textPrimary)
                .padding(DSSpacing.m)
                .background(DSColors.accentPrimary)
                .cornerRadius(DSRadius.m)
        }
    }
}
```

**Extend typography:**
```swift
extension View {
    func largeHeadingText() -> some View {
        self.font(.system(size: 32, weight: .bold))
            .lineSpacing(4)
    }
}
```

**Custom haptics:**
```swift
extension DSHaptics {
    static func customFeedback() {
        let generator = UIImpactFeedbackGenerator(style: .rigid)
        generator.impactOccurred()
    }
}
```

### Pitfalls

**Don't:**
- Hardcode colors (use DSColors)
- Hardcode spacing (use DSSpacing)
- Hardcode fonts (use typography modifiers)
- Skip accessibility (Dynamic Type, VoiceOver)
- Create one-off components (reuse existing)

**Do:**
- Use tokens consistently
- Support light/dark mode
- Test with Dynamic Type
- Add VoiceOver labels
- Document custom components

## Where Used

**Everywhere:**
- All Views use DSColors for colors
- All layouts use DSSpacing for spacing
- All text uses typography modifiers
- All UI uses DesignSystem components

**Examples:**
- `FeatureChat/ChatView` - Uses ChatBubble, SAIInputBar
- `FeatureSettings/SettingsView` - Uses DSColors, SAICard
- `AppShell/SignInView` - Uses SAITextField, SAIButton
- `AppShell/HomeView` - Uses DSGradient, typography

## Tests

### Run Tests

```bash
# All DesignSystem tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:DesignSystemTests

# Specific tests
-only-testing:DesignSystemTests/TokenTests
-only-testing:DesignSystemTests/ChatBubbleSnapshotTests
```

### What's Covered

**Tokens:**
- Color resolution
- Spacing values
- Typography application
- Radius values

**Components:**
- Snapshot tests (light/dark/themes)
- Accessibility (VoiceOver, Dynamic Type)
- Interaction (button taps, input)
- States (loading, disabled, error)

**Coverage:** 80%+

### Example Test

```swift
import XCTest
import SnapshotTesting
@testable import DesignSystem

final class ChatBubbleSnapshotTests: XCTestCase {
    func testChatBubble_userRole_lightMode() {
        let bubble = ChatBubble(
            role: .user,
            text: "Hello, world!",
            isStreaming: false
        )
        
        assertSnapshot(
            of: bubble,
            as: .image(layout: .device(config: .iPhone13))
        )
    }
    
    func testChatBubble_assistantRole_darkMode() {
        let bubble = ChatBubble(
            role: .assistant,
            text: "Hi! How can I help?",
            isStreaming: false
        )
        .environment(\.colorScheme, .dark)
        
        assertSnapshot(
            of: bubble,
            as: .image(layout: .device(config: .iPhone13))
        )
    }
}
```

## Troubleshooting

### Issue: Colors Not Updating

**Symptoms:** Theme changes but some colors stay the same

**Fixes:**
1. Check views use DSColors, not hardcoded colors:
   ```swift
   // Good
   .foregroundStyle(DSColors.textPrimary)
   
   // Bad
   .foregroundStyle(.black)
   ```
2. Verify color set exists in asset catalog
3. Check light/dark appearances are defined
4. Restart app after asset changes

### Issue: Typography Not Applied

**Symptoms:** Text doesn't match design specs

**Fixes:**
1. Use typography modifiers:
   ```swift
   Text("Hello").bodyText()  // Not just .font(.body)
   ```
2. Check Dynamic Type support
3. Verify custom fonts are loaded

### Issue: Components Not Visible

**Symptoms:** UI elements missing or invisible

**Fixes:**
1. Check contrast (light text on light background)
2. Verify frame sizes:
   ```swift
   SAIButton(title: "Test", action: {})
       .frame(height: 44)  // Explicit height
   ```
3. Check z-index and layering
4. Test in both light and dark mode

### Issue: Haptics Not Working

**Symptoms:** No haptic feedback on interactions

**Fixes:**
1. Test on real device (simulator doesn't support haptics)
2. Check device haptic settings
3. Verify DSHaptics is called:
   ```swift
   DSHaptics.impact(.medium)
   ```

## Advanced Usage

### Animated Gradients

```swift
struct AnimatedGradientView: View {
    @State private var animateGradient = false
    
    var body: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [.blue, .purple],
                    startPoint: animateGradient ? .topLeading : .bottomLeading,
                    endPoint: animateGradient ? .bottomTrailing : .topTrailing
                )
            )
            .onAppear {
                withAnimation(.linear(duration: 3).repeatForever(autoreverses: true)) {
                    animateGradient = true
                }
            }
    }
}
```

### Dynamic Type Support

```swift
struct AccessibleText: View {
    @Environment(\.dynamicTypeSize) var dynamicTypeSize
    
    var body: some View {
        Text("Hello")
            .font(.system(size: baseFontSize))
            .lineSpacing(lineSpacing)
    }
    
    var baseFontSize: CGFloat {
        switch dynamicTypeSize {
        case ...(.large):
            return 16
        case .xLarge...(.xxxLarge):
            return 18
        default:
            return 20
        }
    }
    
    var lineSpacing: CGFloat {
        dynamicTypeSize >= .xxxLarge ? 6 : 4
    }
}
```

### Theme Preview

```swift
struct ThemePreview: View {
    var body: some View {
        HStack {
            ForEach(UserThemePreference.allCases, id: \.self) { theme in
                VStack {
                    Circle()
                        .fill(theme.primaryColor)
                        .frame(width: 40, height: 40)
                    
                    Text(theme.displayName)
                        .captionText()
                }
                .onTapGesture {
                    applyTheme(theme)
                }
            }
        }
    }
}
```

## Accessibility

DesignSystem includes comprehensive accessibility support. See [Accessibility.md](Accessibility.md) for full documentation.

### Quick Reference

```swift
import DesignSystem

// Apply pre-defined labels
Button("Send") { }
    .saiAccessible(A11y.Chat.sendButton)

// Custom labels
Image(systemName: "gear")
    .saiAccessible(label: "Settings", hint: "Open settings")

// Hide decorative elements
Image("pattern")
    .saiAccessibilityHidden()

// Dynamic Type support
Text("Scales with user preference")
    .saiScaledFont(size: 16, relativeTo: .body)

// Reduce Motion support
view
    .saiReducedMotionAnimation(.spring())

// High contrast support
Text("Adapts to contrast setting")
    .saiContrastAwareForeground(
        normal: DSColors.textSecondary,
        highContrast: DSColors.textPrimary
    )
```

### Pre-defined Labels

| Category | Example |
|----------|---------|
| `A11y.Chat` | `sendButton`, `messageInput`, `userMessage` |
| `A11y.Auth` | `signInApple`, `emailInput`, `signOut` |
| `A11y.Settings` | `themeSelector`, `deleteAccount` |
| `A11y.Profile` | `photo`, `displayName`, `editButton` |
| `A11y.Payments` | `subscribeButton`, `restoreButton` |
| `A11y.Navigation` | `back`, `close`, `menu` |
| `A11y.Common` | `loading`, `dismiss`, `error(message:)` |

## Related Modules

- [Core](Core.md) - UserThemePreference type
- [Accessibility](Accessibility.md) - Full accessibility documentation
- [Localization](Localization.md) - Localized strings for accessibility
- [FeatureChat](Feature.Chat.md) - Uses ChatBubble, SAIInputBar, Liquid Glass input hosting
- [FeatureSettings](Feature.Settings.md) - Theme picker, paywall CTAs adopting Liquid Glass

---

**Next steps:**
- See [Accessibility.md](Accessibility.md) for accessibility helpers
- Check [FeatureSettings](Feature.Settings.md) for theme switching + Liquid Glass adoption
- Explore component source code in `Packages/DesignSystem/Sources/`, especially `Materials/SAIGlass.swift`

