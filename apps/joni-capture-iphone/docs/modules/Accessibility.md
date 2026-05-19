# Accessibility Module

Comprehensive accessibility support built into DesignSystem. Type-safe labels, SwiftUI modifiers, and debug tools for inclusive iOS apps.

> **Design Philosophy:** Accessibility by default. Every component works with VoiceOver, Dynamic Type, and Reduce Motion out of the box.

## Purpose

**What Accessibility owns:**
- Pre-defined accessibility labels (`A11y` namespace)
- SwiftUI view modifiers for accessibility
- Dynamic Type support utilities
- Reduced motion helpers
- High contrast support
- Debug audit tools (DEBUG only)

**What Accessibility does NOT own:**
- Localized strings (see Localization module)
- UI components (see DesignSystem)
- Business logic

**Location:** `Packages/DesignSystem/Sources/DesignSystem/Accessibility/`

## Public API

```swift
import DesignSystem

// Pre-defined labels
Button("Send") { }
    .saiAccessible(A11y.Chat.sendButton)

// Custom labels
Image(systemName: "gear")
    .saiAccessible(label: "Settings", hint: "Open settings")

// Hide decorative elements
Image("pattern")
    .saiAccessibilityHidden()

// Dynamic Type
Text("Scales")
    .saiScaledFont(size: 16, relativeTo: .body)

// Reduce Motion
view.saiReducedMotionAnimation(.spring())

// High contrast
Text("Adapts")
    .saiContrastAwareForeground(
        normal: DSColors.textSecondary,
        highContrast: DSColors.textPrimary
    )
```

## Setup

No configuration needed. Part of DesignSystem.

```swift
import DesignSystem

Button("Action") { }
    .saiAccessible(A11y.Common.dismiss)
```

## Pre-defined Labels

### A11y.Chat
```swift
A11y.Chat.sendButton        // "Send message" + hint
A11y.Chat.messageInput      // "Message input" + hint
A11y.Chat.userMessage       // "Your message" + copy hint
A11y.Chat.assistantMessage  // "Assistant message" + copy hint
A11y.Chat.newChat           // "New chat" + hint
A11y.Chat.historyList       // "Chat history"
A11y.Chat.copyAction        // "Copy" + hint
A11y.Chat.deleteAction      // "Delete chat" + hint
```

### A11y.Auth
```swift
A11y.Auth.signInApple       // "Sign in with Apple" + hint
A11y.Auth.signInGoogle      // "Continue with Google" + hint
A11y.Auth.emailInput        // "Email address" + hint
A11y.Auth.passwordInput     // "Password" + hint
A11y.Auth.signOut           // "Sign out" + hint
```

### A11y.Settings
```swift
A11y.Settings.themeSelector      // "Theme" + hint
A11y.Settings.notificationsToggle // "Push notifications" + hint
A11y.Settings.diagnosticsToggle   // "Share diagnostics" + hint
A11y.Settings.deleteAccount       // "Delete account" + warning hint
```

### A11y.Profile
```swift
A11y.Profile.photo          // "Profile photo" + change hint
A11y.Profile.displayName    // "Display name"
A11y.Profile.editButton     // "Edit profile" + hint
```

### A11y.Payments
```swift
A11y.Payments.subscribeButton  // "Subscribe" + hint
A11y.Payments.restoreButton    // "Restore purchases" + hint
A11y.Payments.planOption(name:price:)  // Dynamic plan description
A11y.Payments.subscriptionStatus(isSubscribed:)  // Current status
```

### A11y.Navigation
```swift
A11y.Navigation.back        // "Back" + hint
A11y.Navigation.close       // "Close" + hint
A11y.Navigation.menu        // "Menu" + hint
A11y.Navigation.tab(name:selected:)  // Tab with selection state
```

### A11y.Common
```swift
A11y.Common.loading         // "Loading"
A11y.Common.error(message:) // Dynamic error
A11y.Common.success(message:) // Dynamic success
A11y.Common.dismiss         // "Dismiss" + hint
```

## View Modifiers

### saiAccessible(_:)
```swift
Button("Submit") { }
    .saiAccessible(A11y.Chat.sendButton)
```

### saiAccessible(label:hint:traits:)
```swift
Image(systemName: "star.fill")
    .saiAccessible(
        label: "Favorite",
        hint: "Double tap to add to favorites",
        traits: .isButton
    )
```

### saiAccessibilityHidden()
```swift
Image("background-gradient")
    .saiAccessibilityHidden()
```

### saiAccessibilityCombine(label:)
```swift
HStack {
    AsyncImage(url: user.avatarURL)
    Text(user.name)
}
.saiAccessibilityCombine(label: "\(user.name), profile picture")
```

### saiScaledFont(_:) / saiScaledFont(size:weight:relativeTo:)
```swift
Text("Hello")
    .saiScaledFont(.body)

Text("Custom")
    .saiScaledFont(size: 20, weight: .bold, relativeTo: .headline)
```

### saiReducedMotionAnimation(_:)
```swift
view
    .scaleEffect(isPressed ? 0.95 : 1.0)
    .saiReducedMotionAnimation(.spring())
```

### saiContrastAwareForeground(normal:highContrast:)
```swift
Text("Subtle hint")
    .saiContrastAwareForeground(
        normal: DSColors.textSecondary,
        highContrast: DSColors.textPrimary
    )
```

### saiFocusIndicator(_:)
```swift
@FocusState private var isFocused: Bool

TextField("Name", text: $name)
    .focused($isFocused)
    .saiFocusIndicator(isFocused)
```

## Debug Tools (DEBUG only)

### Audit Overlay
```swift
#Preview {
    MyComplexView()
        .accessibilityAuditOverlay()
}
```

### Checklist
```swift
#if DEBUG
A11yChecklist.printChecklist()
#endif
```

## Customization

### Add Custom Labels
```swift
extension A11y {
    public enum MyFeature {
        public static let specialButton = A11yLabel(
            label: "Special action",
            hint: "Double tap to perform special action",
            traits: .isButton
        )
    }
}
```

### Pitfalls

**Don't:**
- Use generic labels ("button", "image")
- Duplicate visible text in labels
- Block animations without checking preference

**Do:**
- Use descriptive, action-oriented labels
- Test with VoiceOver on real device
- Respect Reduce Motion preference

## Testing

1. **VoiceOver:** Settings → Accessibility → VoiceOver
2. **Dynamic Type:** Settings → Display & Brightness → Text Size
3. **Reduce Motion:** Settings → Accessibility → Motion
4. **High Contrast:** Settings → Accessibility → Display & Text Size

## Related Modules

- [DesignSystem](DesignSystem.md) - UI components
- [Localization](Localization.md) - Localized strings

---

**Next steps:**
- Apply accessibility to custom views
- Test with VoiceOver on real device
- Run Accessibility Inspector in Xcode
