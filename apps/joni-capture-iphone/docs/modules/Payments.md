# Payments Module

> **v2.0.** `PaymentsClient`, `PaymentsState`, and the RevenueCat-backed client are unchanged in public API. The v2.0 wiring plugs `PaymentsStatusAdapter` into `ChatViewModel` so the per-conversation free-message limit is now actually enforced (previously unused dead code). `PaywallView` CTAs (`Subscribe`, `Restore Purchases`, `Continue`, `Manage Subscription`) switched from hand-rolled `.background(DSColors.primary) + RoundedRectangle` to `.buttonStyle(.borderedProminent)` / `.buttonStyle(.bordered)` + `.controlSize(.large)` — the system adopts Liquid Glass automatically on iOS 26.

Subscription management with RevenueCat integration.

## Purpose

**What Payments owns:**
- Subscription purchase and restore flows
- `PaymentsClient` protocol and RevenueCat implementation
- Offering/product fetching
- Entitlement checking
- Subscription state management

**What Payments does NOT own:**
- Paywall UI (see FeatureSettings)
- In-app purchase configuration (App Store Connect)
- Business logic beyond payments

## Public API

```swift
import Payments

// Configure (call once at launch)
let config = PaymentsConfig(
    apiKey: "appl_YOUR_KEY",
    entitlementID: "pro"
)
paymentsClient.configure(config)

// Get offerings
let offerings = try await paymentsClient.getOfferings()

// Purchase
try await paymentsClient.purchase(productID: "premium_monthly")

// Restore purchases
try await paymentsClient.restore()

// Check subscription status
let state = await paymentsClient.currentState()
if state.isSubscribed {
    // User has active subscription
}

// Observe state changes
for await state in paymentsClient.states() {
    print("Subscribed: \(state.isSubscribed)")
}
```

## Setup

### Environment Variables

Configure in `Config/Secrets.xcconfig`:

```bash
REVENUECAT_API_KEY = appl_YOUR_KEY
RC_ENTITLEMENT_ID = pro
```

### Dependency Injection

```swift
// In CompositionRoot.swift
let paymentsConfig = PaymentsConfig(
    apiKey: ProcessInfo.processInfo.environment["REVENUECAT_API_KEY"]!,
    entitlementID: ProcessInfo.processInfo.environment["RC_ENTITLEMENT_ID"] ?? "pro"
)

let revenueCatClient = Payments.RevenueCatClient()
revenueCatClient.configure(paymentsConfig)

self.paymentsClient = revenueCatClient
```

### Flags

**Test mode:**
RevenueCat automatically detects sandbox environment. No flags needed.

## Example: Purchase Subscription in 3 Steps

### Step 1: Fetch Offerings

```swift
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
// offerings = [
//   PaymentsOffering(id: "premium_monthly", price: "$9.99", ...),
//   PaymentsOffering(id: "premium_annual", price: "$99.99", ...)
// ]
```

### Step 2: Show Paywall and Purchase

```swift
struct PaywallView: View {
    @State var viewModel: PaywallViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack {
            ForEach(viewModel.offerings, id: \.id) { offering in
                Button {
                    Task {
                        await viewModel.purchase(offering)
                    }
                } label: {
                    VStack {
                        Text(offering.title)
                        Text(offering.price)
                    }
                }
            }
        }
        .task {
            await viewModel.loadOfferings()
        }
    }
}

extension PaywallViewModel {
    func purchase(_ offering: PaymentsOffering) async {
        do {
            try await paymentsClient.purchase(productID: offering.id)
            // Success - dismiss paywall
        } catch let error as AppError {
            self.errorMessage = error.userMessage
        }
    }
}
```

### Step 3: Check Subscription Status

```swift
@Observable
@MainActor
final class ProfileViewModel {
    var isSubscribed = false

    private let paymentsClient: any PaymentsClient

    func checkSubscription() async {
        let state = await paymentsClient.currentState()
        self.isSubscribed = state.isSubscribed
    }

    func observeSubscription() {
        Task {
            for await state in paymentsClient.states() {
                self.isSubscribed = state.isSubscribed
            }
        }
    }
}
```

**Expected result:**
```swift
await viewModel.checkSubscription()
// isSubscribed = true (if user purchased)

// Use to gate features
if viewModel.isSubscribed {
    // Show premium feature
} else {
    // Show paywall
}
```

## Common Customizations

> **Quick Start:** These recipes show how to customize subscriptions and monetization. All follow the PaymentsClient protocol pattern.

### Change Subscription Tiers

**Task:** Update pricing and features for your subscription plans.

**Steps:**
1. Create products in App Store Connect
2. Add to RevenueCat offerings
3. Update PaywallView UI:
```swift
// Packages/FeatureSettings/Sources/FeatureSettings/Views/PaywallView.swift
struct PricingTier {
    let name: String
    let price: String
    let features: [String]
    let productID: String
}

let tiers = [
    PricingTier(
        name: "Basic",
        price: "$4.99/mo",
        features: ["50 messages/day", "GPT-3.5", "Email support"],
        productID: "basic_monthly"
    ),
    PricingTier(
        name: "Pro",
        price: "$9.99/mo",
        features: ["Unlimited messages", "All AI models", "Priority support"],
        productID: "pro_monthly"
    )
]
```

**LLM Prompt:**
```
Update the subscription tiers to Basic ($4.99/mo) and Pro ($9.99/mo) with different 
feature sets. Update the PaywallView UI to show both tiers side-by-side with 
feature lists. Add visual distinction (Pro should have gradient border). Follow 
docs/Payments.md patterns and use DSColors.
```

### Add Lifetime Purchase Option

**Task:** Offer one-time purchase instead of subscription.

**Steps:**
1. Create in-app purchase in App Store Connect (type: Non-Consumable)
2. Add to RevenueCat as one-time purchase
3. Update PaywallView with "Buy Once" option
4. Handle in PaymentsClient

**LLM Prompt:**
```
Add a lifetime purchase option for $49.99 alongside monthly subscription. 
Create a "Buy Once, Own Forever" button in PaywallView. Handle the purchase 
in RevenueCatClient and check entitlement correctly. Show "Lifetime Member" 
badge in profile. Follow docs/Payments.md#entitlements.
```

---

## Customization (Advanced)

### Switch to StoreKit 2:
```swift
final class StoreKit2Client: PaymentsClient {
    func configure(_ config: PaymentsConfig) {
        // StoreKit 2 doesn't need API key
    }
    
    func purchase(productID: String) async throws {
        guard let product = try await Product.products(for: [productID]).first else {
            throw PaymentsError.productNotFound
        }
        
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            // Handle verification
            break
        case .userCancelled:
            throw PaymentsError.cancelled
        case .pending:
            throw PaymentsError.pending
        @unknown default:
            throw PaymentsError.unknown(underlying: nil)
        }
    }
    
    // ... implement other methods
}

// In CompositionRoot:
self.paymentsClient = StoreKit2Client()
```

**Add custom entitlements:**
```bash
# Config/Secrets.xcconfig
RC_ENTITLEMENT_ID = pro
RC_PREMIUM_PLUS_ENTITLEMENT_ID = premium_plus
```

```swift
func hasEntitlement(_ id: String) async -> Bool {
    let state = await paymentsClient.currentState()
    return state.activeEntitlementIDs.contains(id)
}
```

**Custom offering presentation:**
```swift
struct PaymentsOffering {
    let id: String
    let title: String
    let price: String
    let pricePerMonth: String?
    let packageType: PackageType
    
    var displayText: String {
        switch packageType {
        case .monthly:
            return "\(price)/month"
        case .annual:
            return "\(price)/year (\(pricePerMonth ?? "")/month)"
        default:
            return price
        }
    }
}
```

### Pitfalls

**Don't:**
- Call `purchase()` without user interaction (Apple rejects)
- Store subscription state in UserDefaults (use PaymentsClient state)
- Make assumptions about pricing (fetch from API)
- Skip restore functionality
- Hardcode product IDs in UI

**Do:**
- Always call `restore()` on app launch
- Handle all purchase result cases (success, cancelled, pending)
- Show clear pricing and terms
- Test with sandbox accounts
- Implement proper error handling

## Where Used

**Direct users:**
- `FeatureSettings/PaywallView` - Purchase UI
- `ProfileViewModel` - Subscription status display
- `SettingsViewModel` - Restore purchases button

**Feature gates:**
- Any ViewModel that needs to check subscription status

**Example from FeatureSettings:**
```swift
// FeatureSettings/SettingsViewModel.swift
import Payments

@Observable
@MainActor
final class SettingsViewModel {
    var isSubscribed = false

    private let paymentsClient: any PaymentsClient

    func loadSubscriptionStatus() async {
        let state = await paymentsClient.currentState()
        self.isSubscribed = state.isSubscribed
    }

    func restorePurchases() async {
        do {
            try await paymentsClient.restore()
            await loadSubscriptionStatus()
        } catch let error as AppError {
            // Show error
        }
    }
}
```

## Tests

### Run Tests

```bash
# All payments tests
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2' \
  -only-testing:PaymentsTests

# Specific tests
-only-testing:PaymentsTests/PaymentsFlowTests
-only-testing:PaymentsTests/RevenueCatClientTests
```

### What's Covered

**Purchase Flow:**
- Successful purchase
- User cancellation
- Pending purchase (Ask to Buy)
- Already owned
- Payment failed

**Restore Flow:**
- Restore with active subscription
- Restore with no purchases
- Restore error handling

**State Management:**
- Subscription active → inactive transitions
- Entitlement updates
- Expiry handling

**Offerings:**
- Fetch products
- Parse pricing
- Package type detection

**Coverage:** 85%+ (payments are critical)

### Example Test

```swift
import XCTest
@testable import Payments

final class PaymentsFlowTests: XCTestCase {
    func testPurchase_success_updatesSubscriptionState() async throws {
        let mockClient = MockRevenueCatClient()
        mockClient.purchaseResult = .success
        
        try await mockClient.purchase(productID: "premium_monthly")
        
        let state = await mockClient.currentState()
        XCTAssertTrue(state.isSubscribed)
        XCTAssertTrue(state.activeEntitlementIDs.contains("pro"))
    }
    
    func testPurchase_userCancelled_throwsCancelledError() async throws {
        let mockClient = MockRevenueCatClient()
        mockClient.purchaseResult = .cancelled
        
        do {
            try await mockClient.purchase(productID: "premium_monthly")
            XCTFail("Expected cancelled error")
        } catch let error as PaymentsError {
            XCTAssertEqual(error, .cancelled)
        }
    }
}
```

## Troubleshooting

### Issue: "Product Not Found"

**Symptoms:** Offerings array is empty or purchase fails

**Fixes:**
1. Check App Store Connect:
   - In-app purchases created
   - Status is "Ready to Submit"
   - At least one price set
2. Check RevenueCat dashboard:
   - Products configured
   - Linked to App Store Connect
3. Wait up to 24 hours after creating products
4. Test with TestFlight build (not always reliable in simulator)

### Issue: "Invalid API Key"

**Symptoms:** Configure fails or all operations fail

**Fixes:**
1. Verify API key in `Config/Secrets.xcconfig`
2. Check RevenueCat dashboard:
   - Project Settings → API Keys
   - Copy iOS key (starts with `appl_`)
3. Clean build: `⌘ + Shift + K`
4. Restart Xcode

### Issue: Purchase Succeeds but State Doesn't Update

**Symptoms:** Purchase completes but `isSubscribed` stays false

**Fixes:**
1. Ensure observing state:
   ```swift
   Task {
       for await state in paymentsClient.states() {
           self.isSubscribed = state.isSubscribed
       }
   }
   ```
2. Call `currentState()` after purchase:
   ```swift
   try await paymentsClient.purchase(productID: id)
   let state = await paymentsClient.currentState()
   self.isSubscribed = state.isSubscribed
   ```
3. Check entitlement ID matches:
   ```swift
   print(config.entitlementID)  // Should match RevenueCat dashboard
   ```

### Issue: Restore Not Finding Purchases

**Symptoms:** "No purchases to restore"

**Fixes:**
1. Use same Apple ID for purchase and restore
2. Check sandbox account in Settings → App Store
3. Verify purchase completed (check email)
4. Try signing out and back into App Store
5. Wait a few minutes (can take time to sync)

### Issue: Sandbox Testing Problems

**Symptoms:** Can't test purchases in simulator

**Fixes:**
1. Use real device for testing
2. Create sandbox test account in App Store Connect
3. Sign in with sandbox account in Settings → App Store
4. Check StoreKit configuration file:
   - Xcode → File → New → StoreKit Configuration File
   - Add products manually for local testing
5. Select configuration in scheme: Run → Options → StoreKit Configuration

## Advanced Usage

### Feature Gating

```swift
extension PaymentsClient {
    func requiresSubscription() async -> Bool {
        let state = await currentState()
        return !state.isSubscribed
    }
}

// In ViewModel
func accessPremiumFeature() async {
    if await paymentsClient.requiresSubscription() {
        // Show paywall
        showPaywall = true
    } else {
        // Allow access
        performPremiumAction()
    }
}
```

### Grace Period Handling

```swift
func subscriptionStatus() async -> SubscriptionStatus {
    let state = await paymentsClient.currentState()
    
    guard let expiryDate = state.expirationDate else {
        return state.isSubscribed ? .active : .inactive
    }
    
    let now = Date()
    
    if expiryDate > now {
        return .active
    } else if now.timeIntervalSince(expiryDate) < 86400 * 3 {  // 3 days
        return .gracePeriod
    } else {
        return .expired
    }
}

enum SubscriptionStatus {
    case active
    case gracePeriod
    case expired
    case inactive
}
```

### Promotional Offers

```swift
func purchaseWithPromo(productID: String, promoID: String) async throws {
    // RevenueCat handles promotional offers
    // Configure in dashboard first
    try await paymentsClient.purchase(productID: productID)
}
```

### A/B Testing Paywalls

```swift
enum PaywallVariant: String {
    case control
    case testA
    case testB
}

func showPaywall(variant: PaywallVariant) {
    switch variant {
    case .control:
        // Show standard paywall
        break
    case .testA:
        // Show variant A (different copy)
        break
    case .testB:
        // Show variant B (different pricing display)
        break
    }
}
```

## Related Modules

- [Core](Core.md) - Uses AppError for error handling
- [FeatureSettings](FeatureSettings.md) - Paywall UI
- [architecture-overview.md](architecture-overview.md) - Payments in system
- [migrations/revenuecat.md](migrations/revenuecat.md) - RevenueCat setup

---

**Next steps:**
- Set up RevenueCat: [migrations/revenuecat.md](migrations/revenuecat.md)
- See [FeatureSettings](FeatureSettings.md) for paywall UI
- Check [architecture-overview.md](architecture-overview.md) for purchase flow

