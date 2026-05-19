# Firebase Crashlytics Integration

Optional crash reporting and analytics using Firebase Crashlytics.

## Overview

Crashlytics provides:
- Crash reports with stack traces
- Non-fatal error tracking
- Custom logging
- User and session tracking
- Real-time alerts

**Optional:** This is not required for the app to function. Only add if you want crash analytics.

## Prerequisites

- Firebase project (free tier available)
- Firebase iOS SDK
- `GoogleService-Info.plist` from Firebase Console

## Step-by-Step Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name
4. Enable/disable Google Analytics (optional)
5. Create project

### 2. Add iOS App to Firebase

1. In Firebase Console → Project Overview → Add app → iOS
2. Enter bundle ID (from `Config/App.xcconfig`)
3. Download `GoogleService-Info.plist`
4. **Important:** Add to Xcode project:
   - Drag into `SwiftAIBoilerplatePro/` folder
   - ✅ Check "Copy items if needed"
   - ✅ Check "SwiftAIBoilerplatePro" target
   - ✅ Click "Add"

### 3. Add Firebase SDK (SPM)

Already configured in the boilerplate! Just verify:

1. Xcode → File → Packages → Resolve Package Versions
2. Firebase SDK should resolve automatically
3. Look for: `FirebaseCrashlytics` in dependencies

**Package.swift already includes:**
```swift
dependencies: [
    .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "10.0.0")
]
```

### 4. Enable Feature Flag

**File:** `SwiftAIBoilerplatePro/Composition/FeatureFlags.swift`

```swift
public static var crashlyticsEnabled: Bool {
    #if DEBUG
    return false  // Change to true to test in DEBUG
    #else
    return true   // Already enabled in RELEASE
    #endif
}
```

### 5. Verify Integration

**The boilerplate automatically:**
- Checks for `GoogleService-Info.plist`
- Initializes Crashlytics if available
- Sets up user tracking
- Respects diagnostics toggle in Settings

**From CompositionRoot.swift:**
```swift
// Automatic setup - no code changes needed
if FeatureFlags.crashlyticsEnabled && Self.checkCrashlyticsAvailable() {
    self.crashReporter = CrashlyticsCrashReporter()
    AppLogger.info("Crashlytics enabled", category: AppLogger.ui)
} else {
    self.crashReporter = NoOpCrashReporter()
    AppLogger.info("Crash reporting disabled (NoOp)", category: AppLogger.ui)
}
```

### 6. Configure User Consent

**The boilerplate respects user privacy:**

In Settings screen, users can toggle "Share Diagnostics":
- ✅ ON → Crash reports sent to Firebase
- ❌ OFF → No crash reports sent

**Implementation:**
```swift
// From SettingsViewModel
func toggleDiagnostics(_ enabled: Bool) async {
    shareDiagnostics = enabled
    await saveSettings()
    // CompositionRoot observes and updates crashReporter
}
```

## How It Works

### Crash Reporter Protocol

The boilerplate uses a protocol-based approach:

```swift
public protocol CrashReporter {
    func setEnabled(_ enabled: Bool)
    func setUser(id: String?, email: String?, name: String?)
    func recordError(_ error: Error, context: [String: String], isFatal: Bool)
    func log(message: String, level: LogLevel)
}
```

**Implementations:**
1. **CrashlyticsCrashReporter** - Real Firebase Crashlytics
2. **NoOpCrashReporter** - Does nothing (when disabled/unavailable)

### Automatic User Tracking

**Set automatically after auth:**
```swift
// From AppDelegate or CompositionRoot
crashReporter.setUser(
    id: user.id,           // User ID
    email: nil,            // Never send email (privacy)
    name: user.name        // Optional display name
)
```

### Error Recording

**Automatic error tracking:**
```swift
// Throughout the app
do {
    try await someOperation()
} catch {
    let appError = AppError.from(error)
    crashReporter.recordError(error, context: [:], isFatal: false)
    AppLogger.error("Operation failed: \(appError)", category: .feature)
}
```

## Privacy & GDPR Compliance

### PII Protection

The boilerplate **never sends email addresses** to Crashlytics:

```swift
public func setUser(id: String?, email: String?, name: String?) {
    if let id = id {
        crashlytics.setUserID(id)
    }
    
    // Never send email to comply with PII rules
    // Email is sensitive data under GDPR
    
    if let name = name {
        crashlytics.setCustomValue(name, forKey: "user_name")
    }
}
```

### User Consent

**Users control crash reporting:**
- Settings → "Share Diagnostics" toggle
- Default: ON (but can be disabled)
- Persists across sessions
- Immediate effect (no app restart needed)

### Data Retention

Configure in Firebase Console:
1. Project Settings → Crashlytics
2. Set data retention period
3. Recommended: 90 days

## Testing Crashlytics

### Test in DEBUG Mode

```swift
// 1. Enable in FeatureFlags.swift
crashlyticsEnabled = true

// 2. Add GoogleService-Info.plist

// 3. Trigger test crash
Button("Test Crash") {
    fatalError("Test crash")
}

// 4. Restart app
// Crash appears in Firebase Console within 5 minutes
```

### Test Non-Fatal Errors

```swift
// Trigger in your code
crashReporter.recordError(
    TestError(),
    context: ["screen": "settings"],
    isFatal: false
)
```

### View in Firebase Console

1. Firebase Console → Crashlytics
2. Should see crashes within 5 minutes
3. View stack traces, user info, device info

## Customization

### Add Custom Keys

```swift
// Set custom attributes
crashReporter.setAttributes([
    "subscription_tier": user.isSubscribed ? "pro" : "free",
    "theme": settings.theme.rawValue,
    "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
])
```

### Log Custom Events

```swift
// Log breadcrumbs
crashReporter.log(message: "User opened chat screen", level: .info)
crashReporter.log(message: "Message limit reached", level: .warning)
```

### Disable in DEBUG

```swift
// In FeatureFlags.swift (default)
public static var crashlyticsEnabled: Bool {
    #if DEBUG
    return false  // Disabled in DEBUG to avoid test crashes
    #else
    return true   // Enabled in production
    #endif
}
```

## Troubleshooting

### "GoogleService-Info.plist not found"

**Fix:**
1. Download from Firebase Console → Project Settings → Your App
2. Add to Xcode (drag and drop into project)
3. Ensure it's in SwiftAIBoilerplatePro target membership
4. Clean and rebuild

### Crashes Not Appearing

**Checklist:**
- [ ] GoogleService-Info.plist added correctly
- [ ] Feature flag enabled (`crashlyticsEnabled = true`)
- [ ] App built in RELEASE mode
- [ ] Crash occurred (not just error logged)
- [ ] App restarted after crash
- [ ] Wait 5-10 minutes for processing

### "Share Diagnostics" Toggle Not Working

**Check:**
1. Settings saved to SwiftData
2. CompositionRoot observes settings changes
3. `updateCrashReporterFromSettings()` called
4. crashReporter.setEnabled() called

## Alternative: Disable Completely

If you don't want Crashlytics:

**1. Remove from AppDelegate:**
```swift
// Don't initialize Firebase
```

**2. Set feature flag:**
```swift
public static var crashlyticsEnabled: Bool {
    return false  // Always disabled
}
```

**3. Remove GoogleService-Info.plist**

**4. NoOpCrashReporter is used automatically**

## Best Practices

### When to Use
- ✅ Production apps with users
- ✅ Beta testing (TestFlight)
- ✅ Need crash analytics
- ✅ Want proactive bug fixes

### When to Skip
- ❌ Solo development (Xcode crash logs sufficient)
- ❌ Privacy-focused app (no external analytics)
- ❌ MVP testing (not needed yet)

### Privacy Recommendations

1. **Be transparent:**
   - Mention in privacy policy
   - Let users opt-out (Settings toggle)

2. **Minimize data:**
   - Don't send emails
   - Redact PII in context
   - Use anonymized user IDs

3. **Set retention:**
   - Don't keep crash data forever
   - 90 days is reasonable

## Cost

**Firebase Free Tier:**
- Unlimited crash reports
- 30-day data retention
- Basic analytics

**Blaze Plan (Pay as you go):**
- Extended data retention
- More features
- Very low cost for most apps

## Related Docs

- `SwiftAIBoilerplatePro/Composition/CrashlyticsCrashReporter.swift` - Implementation
- `SwiftAIBoilerplatePro/Composition/FeatureFlags.swift` - Enable/disable flag
- `Packages/Core/Sources/Core/Diagnostics/CrashReporter.swift` - Protocol definition

## Support

If you have issues with Crashlytics integration, email: berkinsili@gmail.com
