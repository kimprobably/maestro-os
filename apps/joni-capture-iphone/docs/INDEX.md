# SwiftAI Boilerplate Pro — Documentation Index

Welcome to the in-repo documentation. This tier focuses on **customization, module internals, patterns, and LLM Prompt Packs**.

> **Toolchain:** v2.0.0 requires **Xcode 26.2+** and the iOS 26 SDK. The workspace is on **Swift 6** strict concurrency across all 11 SPM packages. Runtime still supports iOS 17+ via the SwiftUI `Material` fallback inside `SAIGlass`. See [RELEASE_NOTES.md](../RELEASE_NOTES.md) for the full v2.0.0 scope.

**For first-time setup, integrations, and publishing → Use the [Mintlify docs site](../docs-site/)**

## Documentation Tiers

### Tier 1: Mintlify (Setup & Publishing)
- Getting Started, Installation, Quick Start
- Integration guides (Supabase, RevenueCat, Crashlytics)
- Migration guides and troubleshooting
- Module overviews with examples

**Start here:** `docs-site/pages/index.mdx` or run `mintlify dev` in docs-site/

### Tier 2: /docs (Customization & Patterns)
- Module customization details
- Architecture and design patterns
- LLM Prompt Packs for rapid development
- Recipes for common tasks
- Technical deep-dives

**You are here!**

---

## Buyers (post-purchase)

- [POST_PURCHASE.md](buyers/POST_PURCHASE.md) — Welcome, **first App Store upload** checklist link, copy-paste email for your delivery workflow

---

## Foundations
High-level architecture, design principles, and testing strategy.

- [Architecture.md](foundations/Architecture.md) - MVVM, DI, data flow
- [DesignSystem.md](foundations/DesignSystem.md) - Token system overview
- [TestingStrategy.md](foundations/TestingStrategy.md) - Test patterns and coverage
- [Composition.md](foundations/Composition.md) - Dependency injection patterns

## Modules
Deep customization guides for each package.

### Core Packages
- [Core.md](modules/Core.md) - Error handling, logging, utilities
- [Networking.md](modules/Networking.md) - HTTP client, interceptors, retry
- [Storage.md](modules/Storage.md) - SwiftData, Keychain, repositories
- [Auth.md](modules/Auth.md) - Authentication (Apple, Google, Email)
- [Payments.md](modules/Payments.md) - RevenueCat subscriptions
- [AI.md](modules/AI.md) - LLM client, streaming, proxy

### Feature Packages
- [Feature.Chat.md](modules/Feature.Chat.md) - Chat UI (2 styles), streaming
- [Feature.Settings.md](modules/Feature.Settings.md) - Settings, paywall, theme picker
- [DesignSystem.md](modules/DesignSystem.md) - Tokens, components, themes
- [Localization.md](modules/Localization.md) - Type-safe strings, pluralization, multi-language
- [Accessibility.md](modules/Accessibility.md) - VoiceOver, Dynamic Type, Reduce Motion

### App Modules
- [HomeViewModule.md](modules/HomeViewModule.md) - Home screen, quick actions
- [OnboardingModule.md](modules/OnboardingModule.md) - Onboarding flow

## Integrations
Step-by-step setup for external services.

- [Supabase.md](integrations/Supabase.md) - Auth, storage, Edge Functions
- [RevenueCat.md](integrations/RevenueCat.md) - Subscription management
- [OneSignal.md](integrations/OneSignal.md) - Push notifications (optional)
- [Crashlytics.md](integrations/Crashlytics.md) - Crash reporting (optional)
- [ChatSync.md](integrations/ChatSync.md) - Cross-device chat sync (optional)
- [ProfilePhotos.md](integrations/ProfilePhotos.md) - Cloud profile photos (optional)

## Checklists
Verification checklists for complex integrations.

- [REVENUECAT_INTEGRATION.md](checklists/REVENUECAT_INTEGRATION.md) - Complete RevenueCat setup verification
- [APP_STORE_4_3_HARDENING.md](checklists/APP_STORE_4_3_HARDENING.md) - **Guideline 4.3(a)** template/spam differentiation: binary audit, branding map, module removal, Review Notes

## Migrations
Version-specific upgrade guides.

- [1.0.0.md](migrations/1.0.0.md) - Initial release notes
- **v2.0.0** — see [RELEASE_NOTES.md](../RELEASE_NOTES.md) and the [v2.0.0 handoff pack](release/v2.0.0/INDEX.md) for the Swift 6 / Liquid Glass migration. Downstream forks applying v2.0: run the Supabase migration `20260408000000_fix_conversation_stats_auth.sql` and redeploy the `ai` edge function — see [integrations/Supabase.md](integrations/Supabase.md).

## Recipes
Thematic guides for common customization tasks.

- [WhiteLabeling.md](recipes/WhiteLabeling.md) - Complete rebranding checklist (pair with [4.3 hardening](checklists/APP_STORE_4_3_HARDENING.md) before App Store submission)
- [Theming.md](recipes/Theming.md) - Create custom themes
- [AppIconsAndBranding.md](recipes/AppIconsAndBranding.md) - Icons and brand assets
- [DeepLinks.md](recipes/DeepLinks.md) - Deep linking and navigation
- [UpstreamSync.md](recipes/UpstreamSync.md) - Pulling upstream boilerplate updates into your fork (incl. v2.0.0 conflicts)

## Maintenance
Release process, changelog, and estimation methodology.

- [Changelog.md](maintenance/Changelog.md) - Version history
- [ReleaseProcess.md](maintenance/ReleaseProcess.md) - Release workflow and estimations

## LLM Prompt Packs
Ready-to-paste prompts for AI-assisted development.

- [README.md](prompts/README.md) - How to use prompt packs
- [Feature.Chat.prompts.md](prompts/Feature.Chat.prompts.md) - Chat customization prompts
- [Feature.Settings.prompts.md](prompts/Feature.Settings.prompts.md) - Settings prompts
- [Feature.Payments.prompts.md](prompts/Feature.Payments.prompts.md) - Payment prompts
- [AppStore4_3Hardening.prompts.md](prompts/AppStore4_3Hardening.prompts.md) - **Guideline 4.3(a)** differentiation prompts for buyer forks
- [HomeViewModule.prompts.md](prompts/HomeViewModule.prompts.md) - Home screen prompts
- [OnboardingModule.prompts.md](prompts/OnboardingModule.prompts.md) - Onboarding prompts

---

## Quick Links

### For Setup & Publishing
→ See `docs-site/` (Mintlify)

### For Claude Code Skills
→ See [SKILLS.md](../SKILLS.md) — Recommended skills for iOS development with this boilerplate

### For AI-Assisted Development
→ See [CLAUDE.md](CLAUDE.md)
→ See [prompts/](prompts/)

### For Manual Customization
→ See [BUILDING_YOUR_APP.md](BUILDING_YOUR_APP.md)  
→ See modules/ and recipes/

### For Architecture Understanding
→ See [foundations/Architecture.md](foundations/Architecture.md)  
→ See [CLAUDE.md](CLAUDE.md)

### For Package API Reference
→ See `Packages/*/README.md` for technical API docs:
- `Packages/Auth/README.md` - AuthClient protocol, session management
- `Packages/AI/README.md` - LLMClient protocol, streaming patterns
- `Packages/Networking/README.md` - HTTPClient, interceptors
- `Packages/Storage/README.md` - Repositories, SwiftData, Keychain
- `Packages/Payments/README.md` - PaymentsClient, RevenueCat
- `Packages/FeatureChat/README.md` - ChatViewModel, pagination
- `Packages/Localization/README.md` - L10n strings, pluralization
- And more...

## Examples
Code examples with detailed comments.

- [LocalizationExamples.swift](examples/LocalizationExamples.swift) - 10 localization patterns
- [AccessibilityExamples.swift](examples/AccessibilityExamples.swift) - 14 accessibility patterns

---

**Happy building! 🚀**
EOF
