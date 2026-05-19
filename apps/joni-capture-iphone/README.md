# SwiftAI Boilerplate Pro

Production-ready iOS boilerplate for building AI-powered apps with chat, auth, and subscriptions.

[![Swift](https://img.shields.io/badge/Swift-6.0-orange.svg)](https://swift.org)
[![Platform](https://img.shields.io/badge/Platform-iOS%2017+-blue.svg)](https://developer.apple.com/ios/)
[![Xcode](https://img.shields.io/badge/Xcode-26.2+-blue.svg)](https://developer.apple.com/xcode/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🚀 New user?** Read **[docs/buyers/POST_PURCHASE.md](docs/buyers/POST_PURCHASE.md)** (welcome + **App Store 4.3** checklist link + email you can send buyers). Then Mintlify **[Building Your App](/guides/building-your-app)** if you use the public docs site. For AI-assisted coding, keep **[docs/CLAUDE.md](docs/CLAUDE.md)** and root **[AGENTS.md](AGENTS.md)** handy.

## What You Get

Build a complete AI assistant app in weeks instead of months:

- **AI Chat** with streaming responses via OpenRouter (500+ models)
- **Authentication** via Supabase (Apple + Google + Email/Password)
- **Session Persistence** - users stay logged in automatically
- **Subscriptions** via RevenueCat with built-in paywall
- **Storage** with SwiftData for local persistence + optional cloud sync
- **Push Notifications** via OneSignal (optional)
- **Localization** with type-safe `L10n` keys and pluralization support
- **Accessibility** with VoiceOver, Dynamic Type, Reduce Motion support
- **Modular architecture** with 11 Swift Packages
- **Two chat UIs** - bubble style (WhatsApp) and centered style (ChatGPT)
- **Theme system** with 5 built-in themes and dark mode
- **115 tests** green on iPhone 17 Pro / iOS 26.2 (plus a Material-fallback smoke job on iPhone 16 Pro / iOS 18.6)
- **Comprehensive docs** with examples and LLM prompt packs

**Time saved: 400+ hours of development**

## 10-Minute Quick Start

### Prerequisites

- **macOS 15+ with Xcode 26.2+** — v2.0 uses the iOS 26 SDK to compile Liquid Glass APIs (`Glass`, `glassEffect`, `GlassEffectContainer`). Runtime still supports iOS 17+ via a SwiftUI `Material` fallback.
- [Supabase](https://supabase.com) account (free tier)
- [OpenRouter](https://openrouter.ai) account (pay-as-you-go, ~$0.10-2/1M tokens)
- [RevenueCat](https://revenuecat.com) account (free tier, optional)
- [SwiftLint](https://github.com/realm/SwiftLint) — `brew install swiftlint` (optional, matches the CI lint job)

> **Using older Xcode?** Stay on the [`v1.9.0`](https://github.com/yourusername/SwiftAIBoilerplatePro/releases/tag/v1.9.0) tag until you can upgrade. v2.0+ uses iOS 26 SDK symbols that older toolchains cannot compile, regardless of `#available` checks.

### 1. Clone and Open

```bash
git clone https://github.com/yourusername/SwiftAIBoilerplatePro.git
cd SwiftAIBoilerplatePro
open SwiftAIBoilerplatePro.xcodeproj
```

### 2. Run Immediately (Optional)

**You can skip configuration and run the app right now:**

```bash
# Just open and run - works with mock services!
open SwiftAIBoilerplatePro.xcodeproj
# Press ⌘R in Xcode
```

The app runs immediately with:
- MockAuthClient (no Supabase needed)
- EchoLLMClient (no API keys needed)  
- All features work for exploration

### 3. Configure for Production (When Ready)

To use real services, follow these steps:

#### Step-by-Step Configuration:

**1. Create your config file:**
```bash
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig
```

**2. Fill in your API keys:**

Open `Config/Secrets.xcconfig` and replace the placeholder values:

```bash
# Get from: https://app.supabase.com → Project Settings → API
SUPABASE_URL = https://your-project-ref.supabase.co
SUPABASE_ANON_KEY = eyJ...your-actual-key...

# Get from: https://app.revenuecat.com → Project Settings → API Keys
REVENUECAT_API_KEY = appl_your_key
RC_ENTITLEMENT_ID = pro

# Your Supabase Edge Function URL (after deploying)
PROXY_BASE_URL = https://your-project-ref.supabase.co/functions/v1
PROXY_PATH = /ai
```

**3. Update the app configuration:**
```bash
bash scripts/update-config.sh
```

You should see: `✅ Updated Configuration.swift with 6 values`

**4. Disable mock mode (Optional):**
- In Xcode: Product → Scheme → Edit Scheme → Run → Environment Variables
- Set `AUTH_BYPASS` to `0` (or delete it)

**5. Clean build and run:**
```bash
# In Xcode:
⌘ + Shift + K   # Clean
⌘ + B           # Build
⌘ + R           # Run
```

<Warning>
**Important:** Every time you change `Config/Secrets.xcconfig`, you must run:
```bash
bash scripts/update-config.sh
```
Then rebuild in Xcode. The configuration update is **not automatic**.
</Warning>

> **How it works:** Configuration.swift is committed with placeholder values for immediate clone-and-run. When you fill in real API keys, the update script reads Secrets.xcconfig and generates the production config. This approach is simple, reliable, and works in all build types.

### 4. Deploy AI Proxy (Supabase Edge Function)

Install Supabase CLI:

```bash
brew install supabase/tap/supabase
# or: npm install -g supabase
```

Deploy the AI proxy:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
supabase functions deploy ai
```

Get your function URL from the output and update `PROXY_BASE_URL` in `Config/Secrets.xcconfig`.

**Detailed guide:** See `docs/migrations/supabase.md`

### 5. Choose Your LLM Client

The app can run in two modes:

**Echo mode (no setup needed):**
- Leave `PROXY_BASE_URL` empty
- Uses `EchoLLMClient` that echoes your messages back
- Perfect for testing UI without API costs

**Proxy mode (production):**
- Set `PROXY_BASE_URL` and `PROXY_PATH` in `Config/Secrets.xcconfig`
- Uses `ProxyLLMClient` that calls your deployed Supabase Edge Function
- Real AI responses via OpenRouter

The app automatically selects the right client based on environment variables.

### 5. Run the App

Press `⌘ + R` in Xcode.

**First run:**
1. Sign in with email or Apple
2. Tap "Start Chat"
3. Send a message
4. See streaming AI response

**Auth bypass (DEBUG builds):**
- MockAuthClient **enabled by default** in DEBUG builds
- No Supabase setup required for local development
- Works with or without Xcode attached
- Tap "Debug Sign In" button to skip real authentication

**To use real auth in DEBUG:**
```bash
# Set in Xcode scheme → Arguments → Environment Variables
AUTH_BYPASS = 0  # Explicitly disable mock
```

**RELEASE builds:**
- Always use real auth (MockAuthClient never available)
- Requires Supabase configuration

## Project Map

```
SwiftAIBoilerplatePro/
├── SwiftAIBoilerplatePro/        # Main app
│   ├── AppShell/                  # UI screens (Home, Profile, Chat, etc.)
│   ├── Composition/               # Dependency injection (CompositionRoot)
│   └── Resources/                 # Assets, colors, legal docs
│
├── Packages/                      # Swift Package modules
│   ├── Core/                      # Errors, logging, utilities
│   ├── Networking/                # HTTP client with interceptors
│   ├── Storage/                   # SwiftData + Keychain
│   ├── Auth/                      # Supabase + Apple Sign In
│   ├── Payments/                  # RevenueCat integration
│   ├── AI/                        # LLM client protocol + providers
│   ├── Localization/              # Type-safe L10n strings
│   ├── FeatureChat/               # Chat UI + ViewModel
│   ├── FeatureSettings/           # Settings UI + paywall
│   ├── FeatureRating/             # Smart app rating prompts
│   └── DesignSystem/              # UI components + accessibility
│
├── supabase/                      # Backend (Edge Functions)
│   └── functions/ai/              # AI proxy function
│
├── Config/                        # Build configuration
│   ├── App.xcconfig               # General settings
│   └── Secrets.xcconfig           # API keys (gitignored)
│
└── docs/                          # Documentation
    └── INDEX.md                   # Start here
```

## Customize Your App

### App Store guideline 4.3(a) — differentiate before you ship

Apple may reject apps that look like **undifferentiated template uploads** (similar binary, metadata, or concept to other submissions). After you rebrand, run the checklist in **[`docs/checklists/APP_STORE_4_3_HARDENING.md`](docs/checklists/APP_STORE_4_3_HARDENING.md)** (`strings` audit on Release builds, remove dead demo files from the app target, module removal map) and use the prompts in **[`docs/prompts/AppStore4_3Hardening.prompts.md`](docs/prompts/AppStore4_3Hardening.prompts.md)**. AI assistants should read **[`docs/CLAUDE.md`](docs/CLAUDE.md)** for the same guidance.

### Branding

**App name and bundle ID:**
Edit `Config/App.xcconfig`:

```bash
PRODUCT_NAME = YourAppName
PRODUCT_BUNDLE_IDENTIFIER = com.yourcompany.yourapp
```

**App icon:**
Replace images in `SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/`

**Launch screen:**
Edit `SwiftAIBoilerplatePro/Launch Screen.storyboard`

**Colors:**
Edit `SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/`

### Themes

5 themes included: System, Light, Dark, Aurora, Obsidian

**Add your own theme:**
1. Create color set in `DesignSystemColors.xcassets/`
2. Add case to `UserThemePreference` in `Packages/Core/Sources/Core/Theme/UserThemePreference.swift`
3. Update `DSColors.swift` to map your theme

**See:** `docs/visual-consistency.md`

### Chat UI Style

**Choose between:**
- **Bubble style** (WhatsApp/iMessage) - Default
- **Centered style** (ChatGPT) - Professional
- **Both with switcher** - Let users choose

**Implementation:**
```swift
// In CompositionRoot.swift factory methods:

// Bubble only
return AnyView(ChatView(viewModel: viewModel))

// Centered only
return AnyView(ChatGPTStyleView(viewModel: viewModel))

// Both with switcher (current default)
return AnyView(DualStyleChatView(viewModel: viewModel))
```

**See:** `docs/FeatureChat.md` and `Packages/FeatureChat/CHAT_UI_STYLES.md`

### Authentication

**Built-in Support:**
- ✅ **Apple Sign In** - Native iOS authentication
- ✅ **Google Sign In** - OAuth via Google (optional)
- ✅ **Email/Password** - Traditional authentication
- ✅ **Session Persistence** - Users stay logged in automatically

**All via Supabase Auth** - Unified user management and token handling

**Setup:**
1. Configure social providers in Supabase Dashboard
2. Add credentials to `Config/Secrets.xcconfig`
3. For Google: Add GoogleSignIn SDK (optional)

**Customize:**
- Implement `AuthClient` protocol for other providers (Firebase, Auth0, etc.)
- Update `CompositionRoot.swift` to use your implementation

**See:** `docs-site/pages/guides/authentication.mdx` for complete setup guide

### Payment Providers

**Current:** RevenueCat

**Alternatives:**
- StoreKit 2 (native, no fees)
- Adapty
- Qonversion

**Customize:**
1. Implement `PaymentsClient` protocol in `Packages/Payments/`
2. Update `CompositionRoot.swift`

**See:** `docs/Payments.md` and `docs/migrations/revenuecat.md`

### Localization

Type-safe localization with the `L10n` enum:

```swift
import Localization

// Use type-safe keys
Text(L10n.Auth.tagline)
Text(L10n.Chat.sendButton)

// Pluralization support
Text(L10n.Chat.messagesRemaining(5))
```

**Add new strings:**
1. Add key-value to `Localizable.strings`
2. Add computed property to `L10n` enum
3. For new languages, create `xx.lproj/Localizable.strings`

**See:** `docs/modules/Localization.md`

### Accessibility

Built-in accessibility support with `A11y` labels:

```swift
import DesignSystem

// Apply type-safe accessibility labels
Button("Send") { }
    .saiAccessible(A11y.Chat.sendButton)

// Respect user preferences
Image("decorative")
    .saiAccessibilityHidden()

// Dynamic Type support
Text("Hello")
    .saiScaledFont(.body)
```

**Built-in support for:**
- VoiceOver with labels and hints
- Dynamic Type scaling
- Reduce Motion preferences
- High Contrast mode
- Focus indicators for Switch Control

**See:** `docs/modules/Accessibility.md`

### AI Models

Access any model from [openrouter.ai/models](https://openrouter.ai/models):

```swift
// In ChatViewModel or per-conversation
llmClient.streamResponse(
    messages: messages,
    model: "openai/gpt-4o-mini",  // or any model
    temperature: 0.7
)
```

**Popular models:**
- `openai/gpt-4o` - Best quality ($2/1M tokens)
- `openai/gpt-4o-mini` - Fast and cheap ($0.12/1M tokens)
- `anthropic/claude-3.7-sonnet` - Long context ($2.50/1M tokens)
- `google/gemini-2.5-pro` - Multimodal ($1.25/1M tokens)
- `meta-llama/llama-3.3-70b` - Open source ($0.60/1M tokens)

## AI-Assisted Development

This boilerplate includes **Cursor AI and Bolt AI configurations** to accelerate development with AI coding assistants.

### Cursor Rules (`.cursor/rules/`)

Cursor AI automatically follows these rules when working in your project:

- **`core.mdc`** - Architecture, MVVM, SPM, testing (applied to all Swift files)
- **`swiftui-views.mdc`** - View composition, state management, accessibility
- **`architecture.mdc`** - Protocol-based design, DI, repositories
- **`design-system.mdc`** - DesignSystem usage, colors, typography

**Benefits:**
✅ Consistent code quality and architecture
✅ Automatic DesignSystem usage
✅ Proper async/await patterns
✅ Protocol-based dependencies
✅ Comprehensive error handling

**Example prompts:**
```
"Create a new settings view using DesignSystem components"
"Add a profile ViewModel with sign-out functionality"
"Create a new feature package for Notifications"
"Refactor this to follow the repository pattern"
```

**See:** [.cursor/README.md](.cursor/README.md) for detailed usage

### Bolt AI Chat Modes (`.bolt/`)

12 specialized AI assistants for different tasks:

| Mode | Shortcut | Best For |
|------|----------|----------|
| iOS Developer | `/dev` | General SwiftUI development |
| Architecture | `/arch` | Modular design, packages |
| SwiftUI | `/ui` | Views, DesignSystem |
| Feature Dev | `/feature` | New feature modules |
| Integration | `/integration` | Supabase, RevenueCat |
| Testing | `/test` | Unit tests, mocks |
| Debug | `/debug` | Bug fixes, crashes |
| Performance | `/perf` | Optimization |
| Package Dev | `/package` | SPM packages |
| Deploy | `/deploy` | App Store, TestFlight |
| Accessibility | `/a11y` | VoiceOver, inclusive design |
| Documentation | `/doc` | Technical writing |

**See:** [.bolt/README.md](.bolt/README.md) for all modes

**Note:** No setup required - just open in Cursor or Bolt and start coding!

## Documentation

- 📖 **[BUILDING_YOUR_APP.md](docs/BUILDING_YOUR_APP.md)** - Step-by-step guide with ready-to-use LLM prompts
- 📖 [docs/INDEX.md](docs/INDEX.md) - Complete documentation hub
- 📖 [CLAUDE.md](docs/CLAUDE.md) - **Essential for AI-assisted development**

**Key guides:**
- [Architecture Overview](docs/architecture-overview.md) - System design and MVVM patterns
- [Supabase Setup](docs/migrations/supabase.md) - Backend deployment
- [RevenueCat Setup](docs/migrations/revenuecat.md) - Subscription configuration
- [Chat Sync Setup](docs/CHAT_SYNC_SETUP.md) - Optional cross-device sync
- [Profile Photo Setup](docs/PROFILE_PHOTO_SETUP.md) - Optional cloud storage

**All module docs** (with customization recipes):
- [FeatureChat](docs/FeatureChat.md), [Auth](docs/Auth.md), [Payments](docs/Payments.md), [AI](docs/AI.md)
- [Storage](docs/Storage.md), [DesignSystem](docs/DesignSystem.md), [Networking](docs/Networking.md)
- [Localization](docs/modules/Localization.md), [Accessibility](docs/modules/Accessibility.md)
- [See complete list](docs/INDEX.md#module-documentation)

## Testing

Run all tests:

```bash
⌘ + U  # in Xcode
```

Or from command line:

```bash
xcodebuild test \
  -scheme SwiftAIBoilerplatePro \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2'
```

**Test organization:**
- Unit tests: `Packages/*/Tests/`
- Snapshot tests: `*SnapshotTests.swift`
- UI tests: `SwiftAIBoilerplateProUITests/`

**Coverage target:** 80%

## Troubleshooting

### "Unauthorized" Error

**Cause:** Missing or incorrect Supabase credentials

**Fix:**
1. Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `Config/Secrets.xcconfig`
2. Verify user is signed in
3. Check auth logs in Supabase dashboard

### No AI Responses

**Cause:** Proxy not configured or OpenRouter API key missing

**Fix:**
1. Verify `PROXY_BASE_URL` is set correctly
2. Check Edge Function deployment: `supabase functions list`
3. Verify OpenRouter API key: `supabase secrets list`
4. Check OpenRouter account has credits
5. View Edge Function logs in Supabase dashboard

### Build Errors

**Fix:**
```bash
# Clean build
⌘ + Shift + K

# Reset packages
File → Packages → Reset Package Caches

# Update packages
File → Packages → Update to Latest Package Versions
```

### Debug Sign-In Not Appearing

**In DEBUG builds, MockAuthClient is enabled by default** - no setup needed!

If debug sign-in button doesn't appear:
1. Verify you're running a DEBUG build (not RELEASE)
2. Check scheme configuration (should be Debug, not Release)
3. Clean and rebuild (⌘ + Shift + K, then ⌘ + B)

**To test REAL auth in DEBUG:**
1. Open Xcode scheme (Product → Scheme → Edit Scheme)
2. Run → Arguments → Environment Variables
3. Add: `AUTH_BYPASS` = `0` (explicitly disable mock)
4. Configure Supabase in `Config/Secrets.xcconfig`
5. Restart app

### RevenueCat Errors

**Cause:** Missing API key or incorrect entitlement ID

**Fix:**
1. Check `REVENUECAT_API_KEY` in `Config/Secrets.xcconfig`
2. Verify `RC_ENTITLEMENT_ID` matches RevenueCat dashboard
3. See `docs/migrations/revenuecat.md`

## Deployment

### TestFlight

1. Archive for release: Product → Archive
2. Upload to App Store Connect
3. Add to TestFlight
4. Share link with testers

### Production

1. Complete App Store Connect listing
2. Create in-app purchases in App Store Connect
3. Link purchases to RevenueCat
4. Set up production Supabase project
5. Deploy Edge Function to production
6. Update `Config/Secrets.xcconfig` with production URLs
7. Submit for review

**Checklist:** See `docs/migrations/supabase.md` and `docs/migrations/revenuecat.md`

## Costs

### Development (Free Tier)

- Supabase: Free (50,000 monthly active users)
- OpenRouter: Pay-as-you-go, no subscription
- RevenueCat: Free (10,000 monthly tracked customers)
- Apple Developer: $99/year

### Production (1000 Active Users)

- Supabase Pro: $25/month (recommended)
- OpenRouter: ~$10-50/month (depends on usage)
- RevenueCat: Free (under 10K MTR)
- Apple Developer: $99/year

**Total: ~$40-100/month**

## Documentation Site

**Browse the beautiful Mintlify documentation site** for a better reading experience:

```bash
# Install Mintlify CLI
npm install -g mintlify

# Preview locally
cd docs-site
mintlify dev
```

Open http://localhost:3000 to view the docs site with:
- ✅ Searchable documentation
- ✅ Beautiful UI
- ✅ Organized navigation
- ✅ Code examples with syntax highlighting

**Or browse the markdown docs directly:**
- [docs/INDEX.md](docs/INDEX.md) - Documentation hub
- [docs/BUILDING_YOUR_APP.md](docs/BUILDING_YOUR_APP.md) - Complete customization guide
- [FEATURES.md](FEATURES.md) - Full feature breakdown

## Support

- **Documentation:** [docs/INDEX.md](docs/INDEX.md)
- **GitHub Issues:** [Create an issue](https://github.com/yourusername/SwiftAIBoilerplatePro/issues)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **OpenRouter Docs:** [openrouter.ai/docs](https://openrouter.ai/docs)
- **RevenueCat Docs:** [docs.revenuecat.com](https://docs.revenuecat.com)

## License

MIT License - see [LICENSE](LICENSE) for details.

### License and Usage Terms

You are granted a non-exclusive, non-transferable license to use and modify this boilerplate in your own projects.

By accessing this repository, you agree to the following:

1. **Redistribution Prohibited**  
   You may not redistribute, resell, upload, or share the source code in any form outside of your own organization.

2. **No Public Repositories**  
   You may not publish this source code, or any substantial portion of it, in a public GitHub repository or any public platform. Forks must remain private, and any derivative work must also remain private.

3. **Internal Use Only**  
   This license allows internal use for your own apps and projects. You may build unlimited apps using this boilerplate, but the boilerplate itself cannot be distributed.

4. **No Resale of the Template**  
   Selling the boilerplate, or any template derived primarily from it, is strictly prohibited.

5. **DMCA Enforcement**  
   Unauthorized sharing or publication may result in DMCA takedown requests and license termination.

### Important Notice About Forking

Forking is enabled for your convenience, so you can:

- Keep a private clone in your own GitHub account
- Maintain your own modifications
- Pull new updates from upstream easily

However, please note:

**Your fork must remain private at all times.**

Publishing the boilerplate or any fork of it in a public repository is strictly prohibited under the license terms.

If you accidentally make the fork public, please:

1. Immediately set the repository back to private
2. Contact the maintainer so they can verify that everything is safe

Thank you for helping keep the project secure for all customers. Happy building!

### FAQ: Using This Boilerplate

**Can I fork the repo?**  
Yes, private forks are allowed and encouraged. Forking helps you maintain your own version, keep your custom features, and pull future updates easily. Just keep your fork private.

**Can I make my fork public?**  
No. Public repositories containing the boilerplate are not allowed under the license.

**Can I use this boilerplate to build commercial apps?**  
Yes. You can build unlimited commercial or personal apps using it.

**Can I share the code with my team?**  
Yes, within your own organization and private repositories only.

**Can I redistribute or resell the boilerplate?**  
No. Redistribution, resale, or public posting of the boilerplate, or any derivative that exposes the boilerplate itself, is strictly forbidden.

**How do I get updates from the upstream repo?**  
Add this repository as an upstream remote and pull from it when you want to sync:

```bash
git remote add upstream https://github.com/AINativeCompany/SwiftAIBoilerplatePro.git
git pull upstream main
```

Replace `AINativeCompany/SwiftAIBoilerplatePro` with the actual GitHub path for this repository if different.

---

**Built for iOS developers and indie hackers who want to ship AI apps fast.**

Ready to customize? Start with [docs/INDEX.md](docs/INDEX.md)
