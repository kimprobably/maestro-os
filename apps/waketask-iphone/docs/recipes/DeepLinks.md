# Deep Links Guide

Implement deep linking to navigate users to specific screens from URLs or push notifications.

## Overview

Deep linking allows external sources (emails, push notifications, web links) to open specific screens in your app.

## URL Scheme Setup

### 1. Configure URL Scheme

**File:** `SwiftAIBoilerplatePro.xcodeproj` → Target → Info → URL Types

Add:
- **Identifier:** `com.yourcompany.yourapp`
- **URL Schemes:** `yourapp`

### 2. Handle URLs

**File:** `SwiftAIBoilerplatePro/SwiftAIBoilerplatePro.swift`

```swift
@main
struct SwiftAIBoilerplateProApp: App {
    var body: some Scene {
        WindowGroup {
            AppRootView(composition: composition)
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }
    
    private func handleDeepLink(_ url: URL) {
        guard url.scheme == "yourapp" else { return }
        
        let path = url.host ?? ""
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        
        switch path {
        case "chat":
            if let conversationID = components?.queryItems?.first(where: { $0.name == "id" })?.value,
               let uuid = UUID(uuidString: conversationID) {
                // Navigate to chat with ID
                navigateToChat(uuid)
            }
        case "settings":
            // Navigate to settings
            navigateToSettings()
        default:
            break
        }
    }
}
```

## Universal Links (Recommended)

### 1. Configure Associated Domains

**File:** Target → Signing & Capabilities → Associated Domains

Add:
```
applinks:yourapp.com
applinks:www.yourapp.com
```

### 2. Create apple-app-site-association

Host this file at `https://yourapp.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.yourcompany.yourapp",
        "paths": [
          "/chat/*",
          "/settings",
          "/upgrade"
        ]
      }
    ]
  }
}
```

### 3. Handle Universal Links

```swift
.onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { userActivity in
    guard let url = userActivity.webpageURL else { return }
    handleDeepLink(url)
}
```

## Common Deep Link Patterns

### Open Specific Chat

URL: `yourapp://chat?id=CONVERSATION_UUID`

```swift
case "chat":
    if let id = queryParam("id"), let uuid = UUID(uuidString: id) {
        composition.navigationCoordinator.navigate(to: .chat(uuid))
    }
```

### Show Paywall

URL: `yourapp://upgrade`

```swift
case "upgrade":
    composition.navigationCoordinator.navigate(to: .paywall)
```

### Open Settings

URL: `yourapp://settings`

```swift
case "settings":
    composition.navigationCoordinator.navigate(to: .settings)
```

### Start New Chat with Prompt

URL: `yourapp://chat/new?prompt=Tell%20me%20a%20joke`

```swift
case "chat/new":
    if let prompt = queryParam("prompt") {
        let id = await createConversation()
        composition.navigationCoordinator.navigate(to: .chat(id))
        await sendMessage(prompt, to: id)
    }
```

## Push Notification Deep Links

### Notification Payload

```json
{
  "aps": {
    "alert": "New feature available!",
    "sound": "default"
  },
  "deeplink": "yourapp://settings?tab=features"
}
```

### Handle in App Delegate

```swift
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
) {
    let userInfo = response.notification.request.content.userInfo
    
    if let deeplinkString = userInfo["deeplink"] as? String,
       let url = URL(string: deeplinkString) {
        handleDeepLink(url)
    }
    
    completionHandler()
}
```

## Navigation Coordinator Pattern

Create a centralized navigation coordinator:

```swift
@MainActor
@Observable
class NavigationCoordinator {
    enum Destination {
        case chat(UUID)
        case settings
        case paywall
        case profile
    }
    
    var destination: Destination?
    
    func navigate(to destination: Destination) {
        self.destination = destination
    }
}

// In CompositionRoot
let navigationCoordinator = NavigationCoordinator()

// In AppRootView
.onChange(of: navigationCoordinator.destination) { _, newDestination in
    guard let destination = newDestination else { return }
    
    switch destination {
    case .chat(let id):
        // Navigate to chat
    case .settings:
        // Navigate to settings
    case .paywall:
        // Show paywall
    case .profile:
        // Navigate to profile
    }
}
```

## Testing Deep Links

### Simulator

```bash
xcrun simctl openurl booted "yourapp://chat?id=test-id"
```

### Device

1. Create test HTML file:
```html
<a href="yourapp://chat?id=test-id">Open Chat</a>
```
2. Email it to yourself
3. Tap link on device

### Universal Links Testing

```bash
# Validate apple-app-site-association
curl https://yourapp.com/.well-known/apple-app-site-association

# Test on device by tapping link in Notes app
```

## Security Considerations

- Validate all parameters before navigation
- Don't expose sensitive data in URLs
- Sanitize user input from deep links
- Require authentication for protected screens

```swift
private func handleDeepLink(_ url: URL) {
    // Validate scheme
    guard url.scheme == "yourapp" else { return }
    
    // Check authentication if needed
    guard let user = await authClient.currentUser() else {
        // Show sign-in screen
        return
    }
    
    // Validate and sanitize parameters
    // Navigate safely
}
```

## LLM Prompt

```
Implement deep linking for this app:

URL Scheme: "myapp"
Deep link patterns:
- myapp://chat?id=UUID → Open specific chat
- myapp://settings → Open settings
- myapp://upgrade → Show paywall

Tasks:
1. Add URL scheme to project Info
2. Implement .onOpenURL handler in main App struct
3. Create NavigationCoordinator for centralized navigation
4. Parse URL components and validate parameters
5. Navigate to appropriate screen
6. Add security checks (auth required for chats)
7. Test with simulator command

Follow the pattern in docs/recipes/DeepLinks.md.
```

## Related Docs

- `docs/foundations/Architecture.md` - Navigation patterns
- Apple's [Universal Links documentation](https://developer.apple.com/ios/universal-links/)
