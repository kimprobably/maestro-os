# White Labeling Guide

> **App Store 4.3(a):** Rebranding is necessary but not sufficient. After white-labeling, run the [APP_STORE_4_3_HARDENING.md](../checklists/APP_STORE_4_3_HARDENING.md) checklist (binary `strings` audit, metadata, removing dead template files from the app target).

Complete checklist for rebranding this boilerplate as your own app.

## 1. App Identity

### App Name
**File:** `Config/App.xcconfig`
```bash
PRODUCT_NAME = YourAppName
PRODUCT_BUNDLE_IDENTIFIER = com.yourcompany.yourapp
```

### Display Name
**File:** `Packages/DesignSystem/Sources/DesignSystem/Tokens/BrandConfig.swift`
```swift
public static let appDisplayName = "Your App Name"
```

## 2. Visual Branding

### App Icon
**Location:** `SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/`

1. Generate icons at required sizes (1024x1024 base)
2. Replace PNG files in the set
3. Update `Contents.json` if needed

**Tools:**
- [App Icon Generator](https://appicon.co)
- Figma with iOS App Icon template

### Launch Screen
**File:** `SwiftAIBoilerplatePro/Launch Screen.storyboard`

Update:
- Launch logo image
- Background color
- Brand elements

### Colors
**Location:** `SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/`

Edit these color sets:
- `AccentPrimary.colorset` - Main brand color
- `AccentSecondary.colorset` - Secondary brand color
- `BubbleUser.colorset` - User message bubbles
- `BubbleAssistant.colorset` - AI message bubbles

Each color set needs Light and Dark appearances.

## 3. Onboarding

### Onboarding Content
**File:** `SwiftAIBoilerplatePro/AppShell/OnboardingPage.swift`

```swift
static let defaultPages: [OnboardingPage] = [
    OnboardingPage(
        title: "Your Value Prop",
        description: "Explain what makes your app special",
        systemImage: "star.fill",
        accentColor: "blue"
    ),
    // Add 2-3 more pages
]
```

### Onboarding Images
**Location:** `SwiftAIBoilerplatePro/Assets.xcassets/`

Add custom illustrations and reference in `OnboardingPage`:
```swift
imageName: "my-custom-illustration"
```

## 4. Legal Documents

### Privacy Policy
**File:** `SwiftAIBoilerplatePro/Resources/privacy.md`

Update with your:
- Company name
- Contact email
- Data collection practices
- Third-party services used

### Terms of Service
**File:** `SwiftAIBoilerplatePro/Resources/terms.md`

Update with your:
- Company/developer name
- Service description
- User obligations
- Liability disclaimers

### Subscription Terms
**File:** `SwiftAIBoilerplatePro/Resources/subscription_terms.md`

Update pricing and billing info.

## 5. Backend Configuration

### Supabase
**File:** `Config/Secrets.xcconfig`
```bash
SUPABASE_URL = https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY = eyJ...your-key...
```

See: `docs/integrations/Supabase.md`

### RevenueCat
**File:** `Config/Secrets.xcconfig`
```bash
REVENUECAT_API_KEY = appl_YOUR_KEY
RC_ENTITLEMENT_ID = your_entitlement_id
```

See: `docs/integrations/RevenueCat.md`

## 6. Metadata

### App Store Listing
Prepare these assets:
- App name (30 chars max)
- Subtitle (30 chars max)
- Description (4000 chars max)
- Keywords (100 chars max, comma-separated)
- Screenshots (6.7", 6.5", 5.5")
- App Preview videos (optional)

### Marketing URLs
**File:** `Config/App.xcconfig` or Info.plist

Add:
- Support URL
- Marketing URL
- Privacy Policy URL

## 7. Developer Accounts

### Apple Developer Account
- Team ID
- Bundle ID registration
- Certificates and provisioning profiles
- In-app purchase products

### Verification
```bash
# Check code signing
xcodebuild -showBuildSettings -scheme SwiftAIBoilerplatePro | grep CODE_SIGN
```

## 8. Analytics & Crash Reporting

### Optional: Firebase/Crashlytics
**File:** Add `GoogleService-Info.plist` to project

See: `docs/integrations/Crashlytics.md`

## Quick Checklist

- [ ] App name and bundle ID updated
- [ ] App icon replaced
- [ ] Launch screen customized
- [ ] Brand colors updated
- [ ] Onboarding content customized
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Supabase configured
- [ ] RevenueCat configured (if using)
- [ ] Developer account set up
- [ ] Code signing configured
- [ ] Legal docs reviewed by lawyer (recommended)

## LLM Prompt

Use this prompt with Cursor/Claude to automate most of the branding:

```
Rebrand this iOS app:
- App name: "MyAwesomeApp"
- Bundle ID: "com.mycompany.myawesomeapp"  
- Primary color: #6C5CE7 (purple)
- Accent color: #00D4AA (teal)
- Company: "My Company Inc."
- Support email: "support@mycompany.com"

Update:
1. Config/App.xcconfig with new bundle ID and name
2. BrandConfig.swift with new display name
3. DesignSystemColors.xcassets with new colors (light + dark)
4. OnboardingPage.swift with new value props
5. Privacy.md and terms.md with company info

Verify all references are updated and app builds successfully.
```

## Next Steps

After white-labeling:
1. Test the app thoroughly
2. Deploy to TestFlight
3. Gather beta feedback
4. Submit to App Store

See: `BUILDING_YOUR_APP.md` for complete launch checklist.
