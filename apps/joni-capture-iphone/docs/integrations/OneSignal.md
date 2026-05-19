# OneSignal Push Notifications Integration

Optional push notification service using OneSignal for cross-platform messaging.

## Overview

OneSignal provides:
- Push notifications (APNs integration)
- Rich notifications (images, buttons, badges)
- Confirmed delivery analytics
- User segmentation
- In-app messaging
- Real-time delivery tracking

**Optional:** This is not required for the app to function. Only add if you want push notifications via OneSignal.

## Prerequisites

- Apple Developer account ($99/year)
- OneSignal account (free tier: 10K subscribers)
- Xcode project with Push Notifications capability (already configured in boilerplate)
- APNs Key (.p8) or Certificate (.p12) from Apple Developer Portal

## Architecture

The boilerplate uses a **secure configuration pattern**:

```
Config/Secrets.xcconfig          → Store ONESIGNAL_APP_ID (git-ignored)
Config/Secrets.example.xcconfig  → Template for documentation
SwiftAIBoilerplatePro/Generated/Configuration.swift → Access in code
AppDelegate.swift                → SDK initialization
```

## Step-by-Step Setup

### 1. Create OneSignal Account

1. Go to [onesignal.com](https://onesignal.com)
2. Click "Sign Up" (free tier available)
3. Create a new app in the dashboard
4. Select "Apple iOS (APNs)" platform

### 2. Configure APNs in OneSignal

**Option A: APNs Key (Recommended)**

1. Apple Developer Portal → Certificates, Identifiers & Profiles
2. Keys → "+" → Enable "Apple Push Notifications service (APNs)"
3. Download `.p8` file (only one chance!)
4. Note the Key ID and Team ID
5. OneSignal Dashboard → Settings → Platforms → Apple iOS
6. Upload `.p8` file
7. Enter Key ID and Team ID
8. Click "Save"

**Option B: APNs Certificate**

1. Apple Developer Portal → Certificates → "+" → Apple Push Notification service SSL
2. Select your App ID
3. Generate and download certificate
4. Export as `.p12` from Keychain Access
5. Upload to OneSignal Dashboard

### 3. Get Your App ID

1. OneSignal Dashboard → Settings → Keys & IDs
2. Copy your **OneSignal App ID** (UUID format)
3. Keep handy for next step

### 4. Configure iOS App

**File:** `Config/Secrets.xcconfig`

```bash
# OneSignal Configuration
# Get from: https://onesignal.com → Settings → Keys & IDs
ONESIGNAL_APP_ID = your-app-id-here
```

**Example with real value:**
```bash
ONESIGNAL_APP_ID = 6a84ad07-853f-4595-9377-383892951ed2
```

### 5. Update Configuration.swift

Run the update script to regenerate configuration:

```bash
bash scripts/update-config.sh
```

Or manually verify the App ID is in `SwiftAIBoilerplatePro/Generated/Configuration.swift`:

```swift
static let ONESIGNAL_APP_ID = "your-app-id-here"
```

### 6. Verify Xcode Setup

The boilerplate already includes the necessary setup:

**Capabilities (Already Configured):**
- ✅ Push Notifications
- ✅ Background Modes → Remote notifications
- ✅ App Groups → `group.YOUR_BUNDLE_ID.onesignal`

**Notification Service Extension (Already Configured):**
- ✅ `OneSignalNotificationServiceExtension` target
- ✅ Same App Group as main app
- ✅ OneSignalExtension framework linked

**SPM Dependencies (Already Configured):**
```swift
.package(url: "https://github.com/OneSignal/OneSignal-XCFramework", from: "5.0.0")
```

### 7. Build and Run

1. Clean build: `⌘ + Shift + K`
2. Build: `⌘ + B`
3. Run on real device: `⌘ + R` (push notifications don't work on simulator)
4. Accept notification permission when prompted

**Expected console output:**
```
ℹ️ OneSignal SDK initialized successfully
```

## How It Works

### SDK Initialization

**From AppDelegate.swift:**

```swift
private func initializeOneSignal(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    let appId = AppConfiguration.ONESIGNAL_APP_ID
    
    // Validate configuration
    guard AppConfiguration.isConfigured("ONESIGNAL_APP_ID") else {
        AppLogger.warning(
            "OneSignal App ID not configured - push notifications disabled",
            category: AppLogger.notifications
        )
        return
    }
    
    #if DEBUG
    OneSignal.Debug.setLogLevel(.LL_VERBOSE)
    #endif
    
    OneSignal.initialize(appId, withLaunchOptions: launchOptions)
    
    AppLogger.info("OneSignal SDK initialized successfully", category: AppLogger.notifications)
}
```

### Notification Service Extension

The `OneSignalNotificationServiceExtension` enables:
- Rich notifications (images, buttons)
- Confirmed delivery tracking
- Badge management

**From OneSignalNotificationServiceExtension/NotificationService.swift:**

```swift
override func didReceive(_ request: UNNotificationRequest, 
                         withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    // OneSignal handles rich notification processing
    OneSignalExtension.didReceiveNotificationExtensionRequest(
        self.receivedRequest, 
        with: bestAttemptContent, 
        withContentHandler: self.contentHandler
    )
}
```

## Testing Push Notifications

### Send Test Push

1. OneSignal Dashboard → Messages → New Push
2. Audience: "Send to yourself" or select Test Users segment
3. Message content: "Test notification"
4. Click "Send"

### Verify Delivery

1. OneSignal Dashboard → Delivery → View message stats
2. Check **Confirmed** stat (device received push)
3. Audience Activity shows per-device confirmation

### Debug Logging

In DEBUG builds, verbose logging is enabled automatically:
```swift
#if DEBUG
OneSignal.Debug.setLogLevel(.LL_VERBOSE)
#endif
```

Check Xcode console for detailed logs.

## Advanced Features

### Request Permission Manually

Instead of automatic prompt, control when to request:

```swift
// In your onboarding flow or appropriate place
OneSignal.Notifications.requestPermission { accepted in
    print("User accepted notifications: \(accepted)")
}
```

### Set External User ID

Link OneSignal user to your backend user:

```swift
// After user authentication
OneSignal.login("your-backend-user-id")
```

### Add Tags for Segmentation

```swift
// Tag users for targeted messaging
OneSignal.User.addTag(key: "subscription_tier", value: "pro")
OneSignal.User.addTag(key: "last_active", value: Date().ISO8601Format())
```

### Handle Notification Clicks

```swift
// In AppDelegate or dedicated handler
OneSignal.Notifications.addClickListener { event in
    let notification = event.notification
    let additionalData = notification.additionalData
    
    // Navigate based on notification data
    if let conversationId = additionalData?["conversationId"] as? String {
        // Navigate to conversation
    }
}
```

## Disabling OneSignal (If You Don't Want Push Notifications)

If you prefer not to use OneSignal or want to use a different push notification service:

### Option A: Keep Code, Skip Configuration (Recommended)

Simply don't configure the App ID. The SDK gracefully handles this:

**File:** `Config/Secrets.xcconfig`

```bash
# Leave commented out or with placeholder
# ONESIGNAL_APP_ID = YOUR_ONESIGNAL_APP_ID
```

**Result:** 
- App runs normally without push notifications
- No crashes or errors
- Warning log: "OneSignal App ID not configured - push notifications disabled"

### Option B: Remove OneSignal Completely

**Step 1: Remove from AppDelegate.swift**

```swift
// Remove this import
// import OneSignalFramework

// Remove or comment out initializeOneSignal call
func application(_ application: UIApplication,
                 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    
    // REMOVED: initializeOneSignal(launchOptions: launchOptions)
    
    // ... rest of method
    return true
}

// Remove the entire initializeOneSignal method
```

**Step 2: Remove Notification Service Extension**

1. In Xcode, select `OneSignalNotificationServiceExtension` target
2. Delete target (File → Delete)
3. Delete the `OneSignalNotificationServiceExtension/` folder

**Step 3: Remove SPM Dependency**

1. Xcode → Project → Package Dependencies
2. Select `OneSignal-XCFramework`
3. Click "-" to remove

**Step 4: Remove Configuration**

Remove from `Config/Secrets.xcconfig`:
```bash
# Delete these lines
# ONESIGNAL_APP_ID = ...
```

Remove from `Configuration.swift`:
```swift
// Delete this line
// static let ONESIGNAL_APP_ID = "..."
```

**Step 5: Clean Build**

```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean build
# ⌘ + Shift + K in Xcode
```

### Option C: Use Different Push Service

The boilerplate's notification architecture supports alternatives:

1. **Firebase Cloud Messaging (FCM):**
   - Replace OneSignal with FirebaseMessaging
   - Update AppDelegate initialization
   - Configure in Firebase Console

2. **Native APNs Only:**
   - The boilerplate already handles APNs token registration
   - Use `DeviceTokenUploader` to send tokens to your backend
   - Send pushes from your own server

3. **Other Services (Pusher, Amazon SNS, etc.):**
   - Replace SDK and initialization
   - Follow similar patterns

## Troubleshooting

### "OneSignal App ID not configured"

**Cause:** App ID missing or invalid in configuration

**Fix:**
1. Check `Config/Secrets.xcconfig` has valid `ONESIGNAL_APP_ID`
2. Run `bash scripts/update-config.sh`
3. Clean and rebuild

### Notifications Not Received

**Checklist:**
- [ ] Testing on real device (not simulator)
- [ ] APNs key/certificate uploaded to OneSignal
- [ ] Push Notifications capability enabled in Xcode
- [ ] App Group configured identically on both targets
- [ ] User granted notification permission
- [ ] Device not in Do Not Disturb mode

### "No valid aps-environment entitlement"

**Cause:** Push Notifications capability not enabled

**Fix:**
1. Xcode → Target → Signing & Capabilities
2. Click "+ Capability"
3. Add "Push Notifications"
4. Clean and rebuild

### Notification Service Extension Not Running

**Symptoms:** No images in notifications, no confirmed delivery

**Checklist:**
- [ ] Extension target has same deployment target as main app
- [ ] Extension is in same App Group
- [ ] Extension builds without errors
- [ ] `mutable-content: 1` set in push payload (OneSignal does this automatically)

### Permission Not Requested

**Cause:** User may have already responded to permission prompt

**Fix:**
Check current status:
```swift
let settings = await UNUserNotificationCenter.current().notificationSettings()
print("Authorization status: \(settings.authorizationStatus)")
```

Guide user to Settings app if denied:
```swift
if let settingsURL = URL(string: UIApplication.openSettingsURLString) {
    UIApplication.shared.open(settingsURL)
}
```

## Privacy & Compliance

### Data Collected by OneSignal

- Device token (required for push)
- Device info (OS version, app version)
- IP address (for geolocation, optional)
- User tags (if you set them)

### GDPR Compliance

OneSignal provides consent management:

```swift
// Require consent before collecting data
OneSignal.setConsentRequired(true)

// After user consents
OneSignal.setConsentGiven(true)
```

### Privacy Policy

If using OneSignal, mention in your privacy policy:
- Push notification service provider
- Data collected for notifications
- User's right to opt-out (via device settings)

## Cost

**OneSignal Free Tier:**
- 10,000 mobile subscribers
- Unlimited push notifications
- Basic analytics
- Email support

**Growth Plan ($9/month):**
- Unlimited subscribers
- Advanced segmentation
- A/B testing
- Priority support

**Professional Plan:**
- Custom pricing
- Advanced analytics
- Dedicated support

## Related Docs

- `SwiftAIBoilerplatePro/AppDelegate.swift` - SDK initialization
- `OneSignalNotificationServiceExtension/NotificationService.swift` - Rich notifications
- `Config/Secrets.xcconfig` - Configuration storage
- [OneSignal iOS SDK Setup](https://documentation.onesignal.com/docs/en/ios-sdk-setup) - Official docs

## Support

If you have issues with OneSignal integration:
1. Check OneSignal Dashboard → Delivery for delivery status
2. Enable verbose logging and check Xcode console
3. Verify APNs configuration in OneSignal Dashboard

For boilerplate-specific questions, email: berkinsili@gmail.com

