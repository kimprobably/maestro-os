# RevenueCat Setup & Configuration

Complete guide for setting up subscriptions with RevenueCat and App Store Connect.

## Prerequisites

- Apple Developer account ($99/year)
- App Store Connect access
- Xcode with project opened
- RevenueCat account (free tier: 10K monthly tracked customers)

## Step 1: Create RevenueCat Account

1. Go to [revenuecat.com](https://www.revenuecat.com/)
2. Click "Get Started" or "Sign Up"
3. Sign up with email or GitHub
4. Verify email address

## Step 2: Create RevenueCat Project

1. Dashboard → "Create New Project"
2. Name: `my-ai-app`
3. Click "Create"

## Step 3: Get API Key

1. Project Settings → API Keys
2. Copy **Public iOS API Key** (starts with `appl_...`)
3. Keep handy for later

**Note:** This is a public key, safe to include in app.

## Step 4: Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/)
2. My Apps → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Your app name
   - Primary Language: English
   - Bundle ID: Your bundle ID
   - SKU: Unique identifier (e.g., `com.yourcompany.yourapp`)
4. Click "Create"

## Step 5: Create In-App Purchases

### Create Subscription Group

1. In your app: Features → In-App Purchases
2. Click "+" → "Auto-Renewable Subscription"
3. Create Subscription Group: `Premium Access`
4. Click "Create"

### Add Monthly Subscription

1. Click "+" to add subscription to group
2. Fill in:
   - Reference Name: `Premium Monthly`
   - **Product ID:** `premium_monthly` (must match code!)
   - Subscription Duration: 1 Month
3. Click "Create"

4. **Add pricing:**
   - Subscription Pricing → "+"
   - Select Base Territory (your country)
   - Enter price: $9.99
   - Click "Next" → "Create"

5. **Add localization:**
   - Subscription Display Name: "Premium Monthly"
   - Description: "Unlock all features with monthly billing"
   - Add screenshot or use app icon
   - Click "Save"

### Add Annual Subscription (Recommended)

Repeat above with:
- Product ID: `premium_annual`
- Duration: 1 Year
- Price: $99.99 (~17% discount)
- Display Name: "Premium Annual"
- Description: "Best value! Unlock all features with annual billing"

**Expected result:**
Two products in subscription group, ready to test in sandbox.

## Step 6: Connect RevenueCat to App Store

### Option A: Shared Secret (Simple)

1. App Store Connect → My Apps → Your App
2. App Information → "App-Specific Shared Secret"
3. Click "Generate"
4. Copy secret
5. RevenueCat Dashboard → Project Settings → Apple App Store
6. Paste shared secret
7. Enter Bundle ID
8. Click "Save"

### Option B: App Store Connect API (Recommended for Production)

1. App Store Connect → Users and Access → Keys
2. Click "+"
3. Name: `RevenueCat`
4. Access: App Manager
5. Generate key
6. Download `.p8` file (only one chance!)
7. Note Issuer ID and Key ID
8. RevenueCat Dashboard → Project Settings → Apple App Store
9. Upload `.p8` file
10. Enter Issuer ID and Key ID
11. Click "Save"

## Step 7: Create Entitlements in RevenueCat

1. RevenueCat Dashboard → Entitlements
2. Click "+ New"
3. Enter:
   - Identifier: `pro` (must match `RC_ENTITLEMENT_ID`)
   - Display Name: "Pro Access"
4. Click "Save"

**Expected result:**
Entitlement `pro` created.

## Step 8: Link Products to Entitlements

1. RevenueCat → Products
2. Click "+ New"
3. For monthly:
   - Identifier: `premium_monthly`
   - Store: App Store
   - Type: Subscription
   - App Store Product ID: `premium_monthly` (must match Step 5)
4. Click "Save"
5. Click product → "Attach Entitlements"
6. Select `pro`
7. Click "Save"

8. Repeat for annual:
   - Identifier: `premium_annual`
   - App Store Product ID: `premium_annual`
   - Attach to `pro` entitlement

**Expected result:**
Both products linked to `pro` entitlement.

## Step 9: Create Offerings

Offerings group products for display in paywall.

1. RevenueCat → Offerings
2. Click "+ New"
3. Name: `default`
4. Set as "Current Offering"
5. Add packages:
   - **Package 1:**
     - Identifier: `monthly`
     - Product: `premium_monthly`
     - Type: Monthly
   - **Package 2:**
     - Identifier: `annual`
     - Product: `premium_annual`
     - Type: Annual
6. Click "Save"

**Expected result:**
Default offering with two packages ready.

## Step 10: Configure iOS App

1. Open `Config/Secrets.xcconfig`
2. Update:

```bash
REVENUECAT_API_KEY = appl_YOUR_KEY_FROM_STEP_3
RC_ENTITLEMENT_ID = pro
```

3. Clean build: `⌘ + Shift + K`
4. Run app: `⌘ + R`

## Step 11: Configure StoreKit for Simulator Testing

### Why This Step Matters

When testing in the **iOS Simulator**, App Store Connect is not available. The StoreKit Configuration file provides local product definitions for testing in the simulator without needing a real device or App Store Connect connection.

### Prerequisites

- ✅ Products created in App Store Connect (Step 5)
- ✅ Products configured in RevenueCat (Step 8-9)
- ✅ Product IDs match exactly between:
  - App Store Connect
  - RevenueCat Dashboard
  - StoreKit Configuration file

### Setup Steps

#### 1. Update StoreKit Configuration File

1. Open your Xcode project
2. In Project Navigator, locate: `SwiftAIBoilerplatePro/Resources/StoreKitConfiguration.storekit`
3. Open the file in Xcode
4. Update the product IDs to match your App Store Connect products

**Important:** Replace the example product IDs with your actual product IDs from App Store Connect.

**Default Configuration (Update These):**
```
com.yourcompany.yourapp.monthly
com.yourcompany.yourapp.annual
```

**Update to match your App Store Connect products:**
```
com.mycompany.myapp.monthly (replace with your monthly product ID)
com.mycompany.myapp.annual (replace with your annual product ID)
```

#### 2. Verify Product ID Matching

**Critical:** Product IDs must match EXACTLY across all three places:

| Location | Example Product ID | Where to Check |
|----------|-------------------|----------------|
| **App Store Connect** | `com.mycompany.myapp.monthly` | App Store Connect → Your App → In-App Purchases |
| **RevenueCat Product** | `com.mycompany.myapp.monthly` | RevenueCat Dashboard → Products |
| **RevenueCat Offering Package** | Attached to above product | RevenueCat Dashboard → Offerings → Package |
| **StoreKit Configuration** | `com.mycompany.myapp.monthly` | `StoreKitConfiguration.storekit` → `productID` field |

#### 3. Verify Xcode Scheme Configuration

The scheme is already configured in the boilerplate, but you can verify:

1. In Xcode: **Product** → **Scheme** → **Edit Scheme...**
2. Select **Run** in the left sidebar
3. Go to the **Options** tab
4. Under **StoreKit Configuration**, verify `StoreKitConfiguration.storekit` is selected
5. Click **Close**

#### 4. Test in Simulator

1. Clean Build: **⌘ + Shift + K**
2. Build: **⌘ + B**
3. Run on simulator: **⌘ + R**
4. Navigate to Settings → Subscription screen
5. Check Xcode console logs

**Expected success logs:**
```
DEBUG: ℹ️ No existing products cached, starting store products request
DEBUG: ℹ️ Store products request finished
DEBUG: ℹ️ Fetched offerings
```

**Error logs (if failing):**
```
ERROR: 🍎‼️ Error fetching offerings - There's a problem with your configuration.
None of the products registered in the RevenueCat dashboard could be fetched.
```

### Troubleshooting

#### Products Not Loading in Simulator

**Symptom:** Empty offerings, error about configuration problem

**Fixes:**

1. **Verify Product ID Matching (Most Common Issue)**
   - Check Xcode console for: `"starting store products request for: [...]"`
   - These IDs must EXACTLY match StoreKit Configuration product IDs
   - Check RevenueCat Dashboard → Offerings → Verify packages are attached to correct products

2. **Verify StoreKit Configuration**
   - Open `StoreKitConfiguration.storekit` in Xcode
   - Ensure product IDs are updated from the defaults
   - Ensure product IDs match App Store Connect exactly (case-sensitive)

3. **Clean and Rebuild**
   - Close Xcode completely
   - Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
   - Reopen project
   - Clean Build (⌘⇧K) and rebuild

4. **Verify Scheme File Path (Advanced)**
   If products still don't load, verify the scheme file path:
   
   ```bash
   # Check the scheme file:
   cat SwiftAIBoilerplatePro.xcodeproj/xcshareddata/xcschemes/SwiftAIBoilerplatePro.xcscheme | grep -A1 StoreKitConfiguration
   
   # Should output:
   # <StoreKitConfigurationFileReference
   #    identifier = "../../../SwiftAIBoilerplatePro/Resources/StoreKitConfiguration.storekit">
   ```

#### Products Work on Simulator but Not Real Device

**Symptom:** Simulator works, real device shows empty offerings

**This is expected!** Real devices need:

1. Products in "Ready to Submit" state in App Store Connect
2. Sandbox tester account (see Step 12 below)
3. Wait 1-2 hours for App Store Connect sync after creating products

### Real Device Testing (Alternative to Simulator)

If simulator testing is problematic, test on a real device:

1. **No StoreKit Configuration needed** - App Store Connect products are used
2. **Must sign out of personal Apple ID** on the device
3. **Must use Sandbox tester account** (create in Step 12)
4. Products must be in **"Ready to Submit"** state minimum

## Step 12: Test with Sandbox

### Create Sandbox Test Account

1. App Store Connect → Users and Access → Sandbox Testers
2. Click "+"
3. Fill in:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com (can be fake)
   - Password: TestPassword123!
   - Secret Question/Answer
4. Click "Create"

### Test in App

1. **Sign out** of App Store on device:
   - Settings → App Store → Sign Out
2. **Run app** from Xcode
3. **Navigate to paywall**
4. **Tap subscription**
5. **Sign in with sandbox account** when prompted
6. **Confirm purchase** (free in sandbox)
7. **Check subscription active** in app

**Expected result:**
- Purchase completes
- App shows "Subscribed" status
- Premium features unlocked

### Verify in RevenueCat

1. RevenueCat Dashboard → Customers
2. Find your test user (by Apple ID)
3. Should show active subscription

## Troubleshooting

### Issue: "Product Not Found" in Paywall

**Symptoms:** Offerings array is empty

**Fixes:**
1. Wait 24 hours after creating products in App Store Connect
2. Verify product IDs match exactly:
   ```
   App Store Connect: premium_monthly
   RevenueCat: premium_monthly (in Products)
   ```
3. Check products are in "Ready to Submit" state
4. Test with TestFlight build (simulator can be unreliable)

### Issue: "Invalid API Key"

**Symptoms:** RevenueCat configure fails

**Fixes:**
1. Verify API key in Secrets.xcconfig
2. Use **Public iOS** key (starts with `appl_`)
3. Not Secret key or Android key
4. Clean build: `⌘ + Shift + K`

### Issue: Purchase Succeeds but isSubscribed Stays False

**Symptoms:** Payment goes through, but app doesn't recognize subscription

**Fixes:**
1. Check entitlement ID matches:
   ```bash
   RC_ENTITLEMENT_ID = pro
   ```
2. Verify products are linked to `pro` entitlement in RevenueCat
3. Check RevenueCat Dashboard → Customers shows active subscription
4. Call `paymentsClient.currentState()` to refresh:
   ```swift
   let state = await paymentsClient.currentState()
   print("Subscribed: \(state.isSubscribed)")
   ```

### Issue: "Restore Purchases" Finds Nothing

**Symptoms:** User has subscription but restore doesn't find it

**Fixes:**
1. Use same Apple ID for purchase and restore
2. Check sandbox account in Settings → App Store
3. Verify purchase completed (check email)
4. Wait a few minutes (can take time to sync)
5. Try signing out and back into App Store

### Issue: Sandbox Account "Already Used"

**Symptoms:** Can't test with sandbox account

**Fixes:**
1. Create new sandbox tester in App Store Connect
2. Can't reuse accounts after certain actions
3. Each tester can only subscribe once per product

### Issue: Real Purchases in Development

**Symptoms:** Charged real money during testing

**Fixes:**
1. **Always use sandbox accounts** for testing
2. Sign out of real Apple ID before testing
3. Verify sandbox account is signed in: Settings → App Store
4. Sandbox purchases are **always free**

## Production Checklist

Before submitting to App Store:

- [ ] Products created in App Store Connect
- [ ] Products submitted for review (with app)
- [ ] RevenueCat connected to App Store (API key method)
- [ ] All products linked to entitlements
- [ ] Default offering configured
- [ ] Tested full purchase flow in TestFlight
- [ ] Tested restore flow
- [ ] Subscription terms clearly displayed in app
- [ ] Privacy policy and terms of service linked
- [ ] App Store Connect agreements signed

## Pricing Recommendations

**Monthly:**
- $9.99 - Standard
- $4.99 - Budget-friendly
- $19.99 - Premium

**Annual:**
- Discount: 15-25% off monthly × 12
- Example: $9.99/mo → $99.99/year (17% off)

**Free Trial:**
- 3 days - Quick evaluation
- 7 days - Full evaluation (recommended)
- 14 days - Extended trial

**Configure in App Store Connect:**
- Product → Subscription Pricing → Free Trial: 7 days

## Analytics

RevenueCat provides built-in analytics:

**Dashboard → Overview:**
- Active subscriptions
- Monthly recurring revenue (MRR)
- Churn rate
- Trial conversion rate

**Dashboard → Customers:**
- Individual customer history
- Subscription status
- Purchase dates
- Expiry dates

**Dashboard → Charts:**
- Revenue over time
- Active subscribers
- Trials started
- Conversions

## Webhooks (Advanced)

Set up webhooks to sync subscription status with your backend:

1. RevenueCat → Project Settings → Webhooks
2. Enter webhook URL: `https://your-backend.com/webhooks/revenuecat`
3. Select events:
   - Initial Purchase
   - Renewal
   - Cancellation
   - Expiration
4. Save

**Events sent:**
```json
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "user_123",
    "product_id": "premium_monthly",
    "entitlement_ids": ["pro"]
  }
}
```

## Related Docs

- [Payments.md](../Payments.md) - Payments module
- [FeatureSettings.md](../FeatureSettings.md) - Paywall UI
- [architecture-overview.md](../architecture-overview.md) - Purchase flow
- [RevenueCat Docs](https://docs.revenuecat.com)

---

**Questions?** Check RevenueCat dashboard logs first, then [support](https://docs.revenuecat.com).

