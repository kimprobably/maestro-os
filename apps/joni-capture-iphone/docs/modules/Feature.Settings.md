# FeatureSettings Module

> **v2.0 — file split + Liquid Glass.**
> - `SettingsView.swift` (formerly 579 lines) is now a composition root. Every section lives under `Packages/FeatureSettings/Sources/FeatureSettings/Views/Settings/` as its own file (account, theme, notifications, memory, legal, etc.). 13 sibling files total.
> - `SettingsView` now uses `.formStyle(.grouped)`. Do **not** add back `.scrollContentBackground(.hidden)` or `DSColors.background.ignoresSafeArea()` — the v2.0 fighting-glass pass removed them.
> - `PaywallView` CTAs switched from hand-rolled `.background(DSColors.primary)` + `RoundedRectangle` to `.buttonStyle(.borderedProminent)` / `.buttonStyle(.bordered)` with `.controlSize(.large)` so the system adopts Liquid Glass automatically. Loading overlays use `.saiGlass(.regular, in:)` instead of `.background(.regularMaterial)`.
> - Theme extensions moved from inline cases inside `SettingsDTO` to `SettingsDTO+Theme.swift`.
> - `SettingsViewModel` / `PaywallViewModel` are `@Observable` + `@MainActor`.

Settings screen, paywall UI, and account management.

## Purpose

**What FeatureSettings owns:**
- Settings screen with theme picker
- Paywall view for subscriptions
- Account management UI
- Restore purchases flow
- Legal document views (terms, privacy)

**What FeatureSettings does NOT own:**
- Subscription logic (uses Payments module)
- Authentication logic (uses Auth module)
- Theme application (uses DesignSystem)
- Storage (uses Storage module)

## Public API

```swift
import FeatureSettings

// Settings View
SettingsView(
    viewModel: settingsViewModel,
    onShowPaywall: {
        // Present paywall
    }
)

// Paywall View
PaywallView(
    offerings: offerings,
    onPurchase: { offering in
        // Handle purchase
    },
    onRestore: {
        // Handle restore
    }
)

// Legal Document View
LegalDocumentView(
    title: "Privacy Policy",
    markdownFile: "privacy"
)
```

## Architecture

### Theme System

**Two-layer implementation:**

```
SettingsView (UI)
    ↓
SettingsViewModel.setTheme()
    ↓
ThemeManager.selected = newTheme (Core)
    ↓
AppRootView.onChange → DSColors.setTheme() (DesignSystem)
    ↓
.refreshOnThemeChange() recreates views with new tokens
```

**Layers:**
1. **ThemeManager**: iOS interface style (.light, .dark, .unspecified)
2. **DSColors**: Actual color values per theme (Aurora = peach, Obsidian = blue)

**Why not one layer:**
- ThemeManager: System-level (status bar, keyboard appearance)
- DSColors: App-level (button colors, backgrounds, text)
- Allows premium themes with custom palettes beyond light/dark

**Tab preservation:**
- Tab state hoisted to AppRootView (above .refreshOnThemeChange())
- Passed as @Binding to MainTabView
- Theme change recreates MainTabView, binding preserves tab
- User stays on Settings when changing theme ✅

## Setup

No environment variables. Configuration via Composition Root.

### Dependency Injection

```swift
// In CompositionRoot.swift
func makeSettingsViewModel() -> SettingsViewModel {
    SettingsViewModel(
        settingsRepository: settingsRepository,
        authClient: sessionManager,
        paymentsClient: paymentsClient
    )
}
```

### Flags

None. Settings are user-controlled at runtime.

## Example: Show Paywall and Purchase in 3 Steps

### Step 1: Load Offerings

```swift
import FeatureSettings
import Payments

@Observable
@MainActor
final class PaywallViewModel {
    var offerings: [PaymentsOffering] = []
    var isLoading = false
    var errorMessage: String?

    private let paymentsClient: any PaymentsClient

    init(paymentsClient: any PaymentsClient) {
        self.paymentsClient = paymentsClient
    }

    func loadOfferings() async {
        isLoading = true
        defer { isLoading = false }

        do {
            self.offerings = try await paymentsClient.getOfferings()
        } catch let error as AppError {
            self.errorMessage = error.userMessage
        }
    }
}
```

**Expected result:**
```swift
await viewModel.loadOfferings()
// offerings = [monthly, annual] with real pricing
```

### Step 2: Show Paywall UI

```swift
struct PaywallSheet: View {
    @State var viewModel: PaywallViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack {
            Text("Unlock Premium")
                .font(.largeTitle)
            
            ForEach(viewModel.offerings, id: \.id) { offering in
                Button {
                    Task {
                        await viewModel.purchase(offering)
                    }
                } label: {
                    VStack {
                        Text(offering.title)
                        Text(offering.price)
                        if let monthly = offering.pricePerMonth {
                            Text("\(monthly)/month")
                                .font(.caption)
                        }
                    }
                    .padding()
                    .background(DSColors.accentPrimary)
                    .foregroundStyle(.white)
                    .cornerRadius(DSRadius.m)
                }
            }
            
            Button("Restore Purchases") {
                Task {
                    await viewModel.restore()
                }
            }
            .font(.caption)
        }
        .task {
            await viewModel.loadOfferings()
        }
    }
}
```

### Step 3: Handle Purchase

```swift
extension PaywallViewModel {
    func purchase(_ offering: PaymentsOffering) async {
        do {
            try await paymentsClient.purchase(productID: offering.id)
            // Success - dismiss paywall
            dismiss()
        } catch let error as AppError {
            self.errorMessage = error.userMessage
        }
    }
    
    func restore() async {
        do {
            try await paymentsClient.restore()
            
            // Check if subscribed after restore
            let state = await paymentsClient.currentState()
            if state.isSubscribed {
                dismiss()
            } else {
                errorMessage = "No purchases found to restore"
            }
        } catch let error as AppError {
            self.errorMessage = error.userMessage
        }
    }
}
```

**Expected result:**
1. User taps offering
2. Apple purchase sheet appears
3. Payment processed
4. Paywall dismisses
5. Premium features unlocked

## Customization

### Safe Changes

**Customize paywall copy:**
```swift
struct PaywallView: View {
    var body: some View {
        VStack {
            // Change these
            Text("Go Premium")
            Text("Unlock unlimited chats, faster models, and priority support")
            
            // Custom feature list
            FeatureRow(icon: "checkmark", text: "Unlimited conversations")
            FeatureRow(icon: "checkmark", text: "GPT-4 access")
            FeatureRow(icon: "checkmark", text: "Priority support")
        }
    }
}
```

**Add custom settings:**
```swift
struct SettingsView: View {
    @State var viewModel: SettingsViewModel
    
    var body: some View {
        Form {
            Section("Appearance") {
                ThemePicker(selectedTheme: $viewModel.selectedTheme)
            }
            
            Section("Chat") {
                Toggle("Show timestamps", isOn: $viewModel.showTimestamps)
                Toggle("Markdown rendering", isOn: $viewModel.enableMarkdown)
                Picker("Default model", selection: $viewModel.defaultModel) {
                    // Model options
                }
            }
            
            Section("Account") {
                Button("Sign Out") {
                    Task {
                        await viewModel.signOut()
                    }
                }
            }
        }
    }
}
```

**Customize theme picker:**
```swift
import Core

struct ThemePicker: View {
    @Binding var selectedTheme: UserThemePreference
    
    var body: some View {
        Picker("Theme", selection: $selectedTheme) {
            ForEach(UserThemePreference.allCases, id: \.self) { theme in
                HStack {
                    Circle()
                        .fill(theme.previewColor)
                        .frame(width: 20, height: 20)
                    Text(theme.displayName)
                }
                .tag(theme)
            }
        }
    }
}

extension UserThemePreference {
    var previewColor: Color {
        switch self {
        case .light: return .white
        case .dark: return .black
        case .aurora: return .purple
        case .obsidian: return Color(hex: "1C1C1E")
        default: return .gray
        }
    }
}
```

**Add legal documents:**
```swift
// Create markdown files in Resources/
// - terms.md
// - privacy.md
// - subscription_terms.md

struct SettingsView: View {
    var body: some View {
        Section("Legal") {
            NavigationLink("Terms of Service") {
                LegalDocumentView(
                    title: "Terms of Service",
                    markdownFile: "terms"
                )
            }
            
            NavigationLink("Privacy Policy") {
                LegalDocumentView(
                    title: "Privacy Policy",
                    markdownFile: "privacy"
                )
            }
        }
    }
}
```

### Pitfalls

**Don't:**
- Make payment calls directly from Views
- Store subscription state in UserDefaults
- Skip restore functionality (Apple requires it)
- Hardcode pricing (fetch from PaymentsClient)
- Forget to handle purchase cancellation

**Do:**
- Always provide restore option
- Show clear pricing and terms
- Handle all error cases
- Test with sandbox accounts
- Follow App Store guidelines

## Where Used

**SettingsView:**
- Accessible from Settings tab
- Shows theme picker, account info, legal links

**PaywallView:**
- Presented when user tries premium feature
- Shown from "Go Premium" button in Profile
- Triggered by feature gates throughout app

**ProfileView:**
- Shows subscription status
- "Go Premium" or "Manage Subscription" button
- Account information

**LegalDocumentView:**
- Terms of Service
- Privacy Policy
- Subscription Terms

**Example from ProfileView:**
```swift
// AppShell/ProfileView.swift
struct ProfileView: View {
    @State var viewModel: ProfileViewModel
    @State private var showPaywall = false
    
    var body: some View {
        VStack {
            if viewModel.isSubscribed {
                SubscriptionStatusCard(
                    expiryDate: viewModel.expiryDate
                )
            } else {
                Button("Go Premium") {
                    showPaywall = true
                }
            }
        }
        .sheet(isPresented: $showPaywall) {
            PaywallSheet(
                viewModel: PaywallViewModel(
                    paymentsClient: paymentsClient
                )
            )
        }
    }
}
```

## Tests

### Run Tests

```bash
# All FeatureSettings tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:FeatureSettingsTests

# Specific tests
-only-testing:FeatureSettingsTests/SettingsViewModelTests
-only-testing:FeatureSettingsTests/PaywallSnapshotTests
```

### What's Covered

**SettingsViewModel:**
- Load settings
- Update theme
- Sign out flow
- Subscription status
- Error handling

**PaywallView:**
- Snapshot tests (light/dark)
- Different offering configurations
- Loading states
- Error states

**Integration:**
- Full purchase flow
- Restore flow
- Theme change propagation

**Coverage:** 80%+

### Example Test

```swift
import XCTest
@testable import FeatureSettings

@MainActor
final class SettingsViewModelTests: XCTestCase {
    func testUpdateTheme_savesToRepository() async throws {
        let mockRepo = MockSettingsRepository()
        let viewModel = SettingsViewModel(
            settingsRepository: mockRepo,
            authClient: MockAuthClient(),
            paymentsClient: MockPaymentsClient()
        )
        
        await viewModel.updateTheme(.aurora)
        
        let settings = try await mockRepo.load()
        XCTAssertEqual(settings?.theme, .aurora)
    }
    
    func testSignOut_callsAuthClient() async throws {
        let mockAuth = MockAuthClient()
        let viewModel = SettingsViewModel(
            settingsRepository: MockSettingsRepository(),
            authClient: mockAuth,
            paymentsClient: MockPaymentsClient()
        )
        
        try await viewModel.signOut()
        
        XCTAssertTrue(mockAuth.signOutCalled)
    }
}
```

## Troubleshooting

### Issue: Paywall Not Showing Prices

**Symptoms:** Offerings array is empty or shows placeholder prices

**Fixes:**
1. Check RevenueCat configuration
2. Verify products in App Store Connect
3. Ensure API key is correct
4. Test with TestFlight build
5. See [Payments.md](Payments.md) for detailed troubleshooting

### Issue: Theme Not Changing

**Symptoms:** Theme picker updates but UI doesn't change

**Fixes:**
1. Verify theme is saved to Settings:
   ```swift
   let settings = try await settingsRepository.load()
   print("Current theme: \(settings?.theme)")
   ```
2. Check DesignSystem is observing theme changes
3. Ensure views use DSColors, not hardcoded colors
4. See [DesignSystem.md](DesignSystem.md) for theme application

### Issue: Sign Out Not Working

**Symptoms:** User stays signed in after tapping sign out

**Fixes:**
1. Check AuthClient.signOut() is called:
   ```swift
   try await authClient.signOut()
   ```
2. Verify tokens are cleared from Keychain
3. Check auth state updates to `.unauthenticated`
4. Ensure LaunchRouter observes auth state changes

### Issue: Restore Purchases Says "Nothing Found"

**Symptoms:** User has subscription but restore fails

**Fixes:**
1. Use same Apple ID for purchase and restore
2. Check sandbox account in Settings → App Store
3. Wait a few minutes (sync can be slow)
4. Try signing out and back into App Store
5. See [Payments.md](Payments.md#issue-restore-not-finding-purchases)

### Issue: Legal Documents Not Loading

**Symptoms:** Blank screen or "File not found" error

**Fixes:**
1. Verify markdown files exist in Resources/
2. Check file names match exactly:
   ```swift
   LegalDocumentView(markdownFile: "privacy")  // Looks for privacy.md
   ```
3. Ensure files are included in target
4. Check file encoding is UTF-8

## Advanced Usage

### Custom Paywall Variants

```swift
enum PaywallStyle {
    case minimal
    case detailed
    case urgency
}

struct AdaptivePaywall: View {
    let style: PaywallStyle
    
    var body: some View {
        switch style {
        case .minimal:
            MinimalPaywall()
        case .detailed:
            DetailedPaywall()
        case .urgency:
            UrgencyPaywall()
        }
    }
}
```

### Subscription Status Card

```swift
struct SubscriptionStatusCard: View {
    let state: PaymentsState
    
    var body: some View {
        VStack(alignment: .leading) {
            Label("Premium Active", systemImage: "checkmark.circle.fill")
                .foregroundStyle(.green)
            
            if let expiry = state.expirationDate {
                Text("Renews \(expiry, format: .dateTime)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Button("Manage Subscription") {
                openSubscriptionManagement()
            }
            .font(.caption)
        }
        .padding()
        .background(DSColors.secondaryBackground)
        .cornerRadius(DSRadius.m)
    }
    
    func openSubscriptionManagement() {
        if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
            UIApplication.shared.open(url)
        }
    }
}
```

### Settings Sections

```swift
struct SettingsView: View {
    @State var viewModel: SettingsViewModel
    
    var body: some View {
        Form {
            AppearanceSection(viewModel: viewModel)
            ChatSection(viewModel: viewModel)
            AccountSection(viewModel: viewModel)
            AboutSection()
            LegalSection()
        }
    }
}

struct AppearanceSection: View {
    @State var viewModel: SettingsViewModel
    
    var body: some View {
        Section("Appearance") {
            ThemePicker(selectedTheme: $viewModel.selectedTheme)
            Toggle("Dynamic Type", isOn: $viewModel.useDynamicType)
        }
    }
}
```

### Export/Import Settings

```swift
extension SettingsViewModel {
    func exportSettings() async -> Data? {
        guard let settings = try? await settingsRepository.load() else {
            return nil
        }
        
        return try? JSONEncoder().encode(settings)
    }
    
    func importSettings(from data: Data) async throws {
        let settings = try JSONDecoder().decode(Settings.self, from: data)
        try await settingsRepository.save(settings)
    }
}
```

## Related Modules

- [Payments](Payments.md) - Subscription logic
- [Auth](Auth.md) - Authentication
- [Storage](Storage.md) - Settings persistence
- [DesignSystem](DesignSystem.md) - Theme application
- [architecture-overview.md](architecture-overview.md) - Settings in system

---

**Next steps:**
- Set up RevenueCat: [migrations/revenuecat.md](migrations/revenuecat.md)
- See [Payments](Payments.md) for subscription details
- Check [DesignSystem](DesignSystem.md) for theme customization

