# Localization Module

Type-safe string localization with compile-time safety and easy language management.

> **Design Philosophy:** One import, one namespace, full type-safety. No string typos, no missing translations at runtime.

> **v2.0 — file split.** `L10n.swift` (formerly 563 lines) is now a 44-line root enum plus one file per nested namespace: `L10n+Auth.swift`, `L10n+Chat.swift`, `L10n+Settings.swift`, `L10n+Theme.swift`, `L10n+Payments.swift`, `L10n+Onboarding.swift`, `L10n+Profile.swift`, `L10n+Common.swift`, `L10n+Error.swift`, `L10n+A11y.swift`. The public `L10n.Auth.tagline` / `L10n.Chat.messagesRemaining(_:)` surface is unchanged — callers do not need to change anything. When adding new keys, extend the matching `L10n+<Namespace>.swift` file rather than putting them in the root.

## Purpose

**What Localization owns:**
- Type-safe string keys (`L10n` namespace)
- String resources (`.strings` and `.stringsdict` files)
- Pluralization support
- Locale utilities

**What Localization does NOT own:**
- UI components (see DesignSystem)
- Runtime language switching UI (implement in Settings)
- Server-side translations (handle via API)

**Golden Rule:** Never use raw string literals for user-facing text. Always use `L10n.*`.

## Public API

```swift
import Localization

// Simple strings
Text(L10n.Auth.tagline)              // "Your AI assistant"
Text(L10n.Chat.placeholder)          // "Type a message..."
Text(L10n.Settings.theme)            // "Theme"

// Pluralized strings (automatic grammar)
Text(L10n.Chat.messagesRemaining(5)) // "5 messages remaining"
Text(L10n.Chat.messagesRemaining(1)) // "1 message remaining"
Text(L10n.Chat.messagesRemaining(0)) // "No messages remaining"

// Error messages
errorMessage = L10n.Error.networkOffline

// Accessibility labels
.accessibilityLabel(L10n.A11y.sendMessage)
.accessibilityHint(L10n.A11y.sendMessageHint)

// Locale utilities
let languages = L10n.supportedLanguages  // ["en", "es", ...]
let isSupported = L10n.isLanguageSupported("es")  // true
```

## Setup

No environment variables required. Localization works out of the box.

### Integration

```swift
// 1. Add to your Package.swift dependencies
.product(name: "Localization", package: "Localization")

// 2. Import in your code
import Localization

// 3. Use type-safe strings
Text(L10n.Common.ok)
```

### Add to Main App

```swift
// In SwiftAIBoilerplatePro.xcodeproj
// Add to Framework, Libraries, and Embedded Content:
// - Localization (from Packages/Localization)
```

## Example: Localize a Screen in 3 Steps

### Step 1: Replace Hardcoded Strings

**Before:**
```swift
struct SignInView: View {
    var body: some View {
        VStack {
            Text("Your AI assistant")  // ❌ Hardcoded
            Button("Sign in with Apple") { }  // ❌ Hardcoded
            Text("Use email instead")  // ❌ Hardcoded
        }
    }
}
```

**After:**
```swift
import Localization

struct SignInView: View {
    var body: some View {
        VStack {
            Text(L10n.Auth.tagline)  // ✅ Type-safe
            Button(L10n.Auth.signInApple) { }  // ✅ Type-safe
            Text(L10n.Auth.useEmail)  // ✅ Type-safe
        }
    }
}
```

### Step 2: Add Missing Strings (if needed)

If you need a new string:

```swift
// 1. Add to L10n.swift
public enum Auth {
    // ... existing strings ...
    
    /// "Welcome back!"
    public static var welcomeBack: String {
        String(localized: "auth.welcomeBack", bundle: bundle)
    }
}
```

```
// 2. Add to Localizable.strings (all languages)
"auth.welcomeBack" = "Welcome back!";
```

### Step 3: Test Different Languages

```swift
// In Xcode: Product → Scheme → Edit Scheme
// Run → Options → App Language → Spanish

// Or in Preview:
#Preview {
    SignInView()
        .environment(\.locale, Locale(identifier: "es"))
}
```

**Expected result:**
App displays in selected language automatically.

## String Categories

| Namespace | Purpose | Example |
|-----------|---------|---------|
| `L10n.Auth` | Sign in/out, passwords | `L10n.Auth.signInApple` |
| `L10n.Chat` | Messages, history | `L10n.Chat.placeholder` |
| `L10n.Settings` | Settings screens | `L10n.Settings.theme` |
| `L10n.Payments` | Subscriptions, paywall | `L10n.Payments.subscribe` |
| `L10n.Onboarding` | Onboarding flow | `L10n.Onboarding.getStarted` |
| `L10n.Profile` | User profile | `L10n.Profile.edit` |
| `L10n.Theme` | Theme names | `L10n.Theme.aurora` |
| `L10n.Common` | Shared (OK, Cancel) | `L10n.Common.cancel` |
| `L10n.Error` | Error messages | `L10n.Error.networkOffline` |
| `L10n.A11y` | Accessibility | `L10n.A11y.sendMessage` |

## Adding a New Language

### Step 1: Create Language Folder

```bash
# Navigate to Resources
cd Packages/Localization/Sources/Localization/Resources

# Create new language folder (e.g., German)
mkdir de.lproj

# Copy English strings as template
cp en.lproj/Localizable.strings de.lproj/
cp en.lproj/Localizable.stringsdict de.lproj/  # If using plurals
```

### Step 2: Translate Strings

Edit `de.lproj/Localizable.strings`:

```
// MARK: - Auth
"auth.tagline" = "Dein KI-Assistent";
"auth.signIn.apple" = "Mit Apple anmelden";
"auth.signIn.google" = "Mit Google fortfahren";
// ... translate all strings
```

### Step 3: Update Plurals (if needed)

Edit `de.lproj/Localizable.stringsdict` for German plural rules:

```xml
<key>chat.messagesRemaining %lld</key>
<dict>
    <key>NSStringLocalizedFormatKey</key>
    <string>%#@count@</string>
    <key>count</key>
    <dict>
        <key>NSStringFormatSpecTypeKey</key>
        <string>NSStringPluralRuleType</string>
        <key>NSStringFormatValueTypeKey</key>
        <string>lld</string>
        <key>one</key>
        <string>1 Nachricht übrig</string>
        <key>other</key>
        <string>%lld Nachrichten übrig</string>
    </dict>
</dict>
```

### Step 4: Rebuild

```bash
# Clean and rebuild
xcodebuild clean build -scheme SwiftAIBoilerplatePro
```

**Expected result:**
New language appears in device Settings → App → Language.

## Adding New Strings

### Simple String

```swift
// 1. Add property to L10n.swift
public enum MyFeature {
    /// "Welcome to the feature"
    public static var welcome: String {
        String(localized: "myFeature.welcome", bundle: bundle)
    }
}

// 2. Add to ALL .strings files
// en.lproj/Localizable.strings
"myFeature.welcome" = "Welcome to the feature";

// es.lproj/Localizable.strings
"myFeature.welcome" = "Bienvenido a la función";
```

### String with Arguments

```swift
// L10n.swift
public enum MyFeature {
    /// "Hello, {name}!"
    public static func greeting(name: String) -> String {
        String(localized: "myFeature.greeting \(name)", bundle: bundle)
    }
}

// Localizable.strings
"myFeature.greeting %@" = "Hello, %@!";
```

### Pluralized String

```swift
// L10n.swift
public enum MyFeature {
    /// "{count} items"
    public static func itemCount(_ count: Int) -> String {
        String(localized: "myFeature.itemCount \(count)", bundle: bundle)
    }
}

// Localizable.stringsdict
<key>myFeature.itemCount %lld</key>
<dict>
    <key>NSStringLocalizedFormatKey</key>
    <string>%#@count@</string>
    <key>count</key>
    <dict>
        <key>NSStringFormatSpecTypeKey</key>
        <string>NSStringPluralRuleType</string>
        <key>NSStringFormatValueTypeKey</key>
        <string>lld</string>
        <key>zero</key>
        <string>No items</string>
        <key>one</key>
        <string>1 item</string>
        <key>other</key>
        <string>%lld items</string>
    </dict>
</dict>
```

## Customization

### Safe Changes

**Add new string categories:**
```swift
// L10n.swift
public enum MyNewFeature {
    public static var title: String {
        String(localized: "myNewFeature.title", bundle: bundle)
    }
}
```

**Add new languages:**
- Create folder, copy strings, translate
- No code changes required

**Modify existing strings:**
- Update `.strings` files only
- L10n.swift doesn't need changes

### Pitfalls

**Don't:**
- Use raw strings for user-facing text
- Forget to add strings to ALL language files
- Hardcode plural rules (use `.stringsdict`)
- Put translation logic in code
- Use machine translation without review

**Do:**
- Use type-safe `L10n.*` keys
- Test with real devices in target languages
- Use professional translators for production
- Test with long translations (German is ~30% longer)
- Test RTL languages (Arabic, Hebrew)

## Where Used

The Localization module can be imported by any module:

**Features:**
- `FeatureChat` - Chat strings, error messages
- `FeatureSettings` - Settings labels, theme names
- `AppShell` - UI screens, navigation

**Example in ChatView:**
```swift
import Localization

struct ChatView: View {
    var body: some View {
        VStack {
            if messages.isEmpty {
                Text(L10n.Chat.emptyState)
                Text(L10n.Chat.emptyStateSubtitle)
            }
            
            SAIInputBar(
                text: $inputText,
                placeholder: L10n.Chat.placeholder,
                onSend: sendMessage
            )
        }
    }
}
```

## Tests

### Run Tests

```bash
# Run localization tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:LocalizationTests
```

### What's Covered

**String Resolution:**
- All namespaces return non-empty strings
- Keys resolve correctly
- Bundle loading works

**Pluralization:**
- Zero, one, many cases
- Language-specific rules

**Locale Utilities:**
- Supported languages list
- Language detection

**Coverage:** 90%+

### Example Test

```swift
import XCTest
@testable import Localization

final class L10nTests: XCTestCase {
    func testAuth_tagline_returnsNonEmpty() {
        XCTAssertFalse(L10n.Auth.tagline.isEmpty)
    }
    
    func testChat_messagesRemaining_pluralizes() {
        XCTAssertEqual(L10n.Chat.messagesRemaining(0), "No messages remaining")
        XCTAssertEqual(L10n.Chat.messagesRemaining(1), "1 message remaining")
        XCTAssertEqual(L10n.Chat.messagesRemaining(5), "5 messages remaining")
    }
}
```

## Troubleshooting

### Issue: Strings Show Keys Instead of Values

**Symptoms:** UI shows `"auth.tagline"` instead of `"Your AI assistant"`

**Fixes:**
1. Verify string exists in `.strings` file with exact key
2. Check bundle reference: `bundle: .module`
3. Rebuild: `⌘ + Shift + K`, then `⌘ + B`
4. Check file is in correct `.lproj` folder

### Issue: Plurals Not Working

**Symptoms:** Shows `"%lld messages"` or wrong plural form

**Fixes:**
1. Verify `.stringsdict` file exists and is valid XML
2. Check key matches exactly (including `%lld` suffix)
3. Verify plural categories for target language
4. Use correct format specifier (`%lld` for Int, `%@` for String)

### Issue: New Language Not Appearing

**Symptoms:** Language not available in device settings

**Fixes:**
1. Verify folder name matches language code (e.g., `de.lproj` not `german.lproj`)
2. Check folder is inside `Resources/`
3. Clean build folder and rebuild
4. Verify `Localizable.strings` filename is exact

### Issue: Wrong Language Displayed

**Symptoms:** App shows English when device is set to Spanish

**Fixes:**
1. Check device language settings (Settings → General → Language)
2. Verify app-specific language isn't overridden
3. Check all strings exist in target language file
4. Missing strings fall back to English

## Export for Translation

### Using Xcode

```bash
# Export all strings for translation
xcodebuild -exportLocalizations \
  -project SwiftAIBoilerplatePro.xcodeproj \
  -localizationPath ./translations

# Import translated strings
xcodebuild -importLocalizations \
  -project SwiftAIBoilerplatePro.xcodeproj \
  -localizationPath ./translations/de.xcloc
```

### Using genstrings (Manual)

```bash
# Extract strings from Swift files
find . -name "*.swift" | xargs genstrings -o ./strings

# Review and merge into Localizable.strings
```

## Best Practices

### String Key Naming

```
// Good: Hierarchical, descriptive
"auth.signIn.apple" = "Sign in with Apple";
"chat.messagesRemaining %lld" = "%lld messages remaining";
"error.network.offline" = "You're offline";

// Bad: Flat, ambiguous
"apple" = "Sign in with Apple";
"messages" = "%lld messages remaining";
"offline" = "You're offline";
```

### Context Comments

```
// Localizable.strings
/* Button title for Apple Sign In on login screen */
"auth.signIn.apple" = "Sign in with Apple";

/* Shown when user has limited messages, %lld is the count */
"chat.messagesRemaining %lld" = "%lld messages remaining";
```

### Testing Checklist

- [ ] All strings display correctly in base language
- [ ] Plurals work for 0, 1, 2+ cases
- [ ] Long translations don't break layout
- [ ] RTL languages display correctly
- [ ] Dynamic Type works with localized text
- [ ] Error messages are localized
- [ ] Accessibility labels are localized

## Related Modules

- [DesignSystem](DesignSystem.md) - UI components using localized strings
- [Accessibility](Accessibility.md) - Localized accessibility labels
- [FeatureSettings](Feature.Settings.md) - Language selection UI

---

**Next steps:**
- Add your app-specific strings to `L10n.swift`
- Translate to target languages
- Test with real devices
- Export for professional translation

