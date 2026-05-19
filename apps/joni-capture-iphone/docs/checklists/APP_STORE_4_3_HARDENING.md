# App Store Guideline 4.3(a) — Differentiation & “Template Spam” Hardening

This checklist helps you **ship an app that is clearly your product**, not an undifferentiated copy of SwiftAI Boilerplate Pro. Apple cites **Guideline 4.3(a)** when an app’s **binary, metadata, and/or concept** look too similar to other submissions (including other template-based apps).

**This is not legal advice.** It is an engineering and product checklist aligned with common App Review patterns.

---

## What Apple is actually evaluating

Review combines **human judgment** with **similarity signals**:

| Signal | What to do |
|--------|------------|
| **Binary** — shared literals, unused views, identical branding strings | Audit with `strings` on a **Release** build; delete dead Swift files from the app target |
| **Metadata** — generic “AI chat app” story, stock screenshots | Lead with **your** hero feature; screenshots must match **your** primary UI |
| **Concept** — same primary experience as many other template uploads | Change **navigation, hero screen, and value prop** — config-only tweaks are not enough |
| **Ecosystem** — many near-duplicate apps (sometimes across accounts) | One distinct product per listing; honest Review Notes |

**Using this boilerplate is allowed.** Failing to **differentiate the shipped product and listing** is what triggers 4.3.

---

## Phase 1 — Binary & string audit (before every App Store upload)

1. **Archive** with a **Release** configuration (not Debug).
2. Export or inspect the app binary:
   ```bash
   # Replace with your .app path inside the .ipa Payload
   strings -a "YourApp.app/YourApp" | sort -u | less
   ```
3. **Search for forbidden template fingerprints** (add your own banned list after rebranding):

   - `SwiftAI`, `Boilerplate`, `EchoLLM`, `MockAuth`
   - `Start Chat` (if you removed chat)
   - Obvious placeholder copy: `Coming soon`, `Packages coming next`, `Lorem`, `TODO` in user-visible strings

4. **Remove or rewrite** every hit that is not essential. Common leak sources:
   - Unused `ContentView`-style files still **compiled** into the app target
   - Preview-only copy accidentally in production targets
   - Generated `Configuration.swift` headers mentioning dev-only clients
   - **OSLog subsystem fallback** — see [Core package](../../Packages/Core/README.md) (`AppLogger.subsystem`); ensure extensions/widgets use a real bundle ID where needed

5. **UITests** — remove or rename tests that still describe template flows (e.g. “Start Chat”) if those flows no longer exist.

---

## Phase 2 — Where to change identity (code & assets)

Use these **canonical locations** (also covered in [White Labeling](../recipes/WhiteLabeling.md)):

| Concern | Primary location |
|---------|------------------|
| Product name / bundle ID | `Config/App.xcconfig` |
| User-visible app name (many surfaces) | `Packages/DesignSystem/Sources/DesignSystem/Tokens/BrandConfig.swift` |
| App icon | `SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/` |
| Launch screen | `SwiftAIBoilerplatePro/Launch Screen.storyboard` |
| Semantic colors / themes | `SwiftAIBoilerplatePro/Resources/DesignSystemColors.xcassets/` |
| Onboarding copy | `SwiftAIBoilerplatePro/AppShell/OnboardingPage.swift` |
| Legal URLs & body | `SwiftAIBoilerplatePro/Resources/privacy.md`, `terms.md` (paths vary — search in app target) |
| Paywall marketing strings | `Packages/FeatureSettings/` + Localization |
| Type-safe UI strings | `Packages/Localization/` |

**Rule:** After rebranding, grep the repo for `SwiftAI`, product codenames from this template, and your old working title.

---

## Phase 3 — App Store Connect (metadata)

- **Subtitle & first paragraph:** Describe **your** problem domain (not “all-in-one AI boilerplate”).
- **Keywords:** Specific to your audience; avoid stuffing generic “AI assistant, chatbot, GPT” if chat is not the hero.
- **Screenshots & preview:** **First** screens should be your differentiated UI (e.g. map, feed, tracker — not only Settings/Paywall).
- **Privacy Nutrition Label:** Must match actual behavior after you remove modules (e.g. no chat sync if chat is gone).

---

## Phase 4 — App Review Notes (template)

Paste and customize:

```text
Primary purpose: [One sentence — your product, not “SwiftAI Boilerplate”.]

Hero experience: [Main screen / flow — e.g. map, journal, marketplace.]

This build is not a duplicate of our other apps: [If applicable, name differences or state single product.]

Data / backend: [What is unique — your datasets, rules, geography, accounts.]

Test account (if required): [Credentials]

Notes: We removed template demo routes and rebranded all user-visible strings. Happy to clarify any flow.
```

---

## Phase 5 — Removing a Swift package (high level)

**Always:**

1. **Plan dependency order** — see table below. Removing a package that others depend on requires **refactoring or stubbing** first.
2. In **Xcode** → app target → **Frameworks, Libraries, and Embedded Content** / **Link Binary**: remove the package product.
3. **Project/workspace** — remove the local SPM reference if the package is deleted entirely.
4. **`CompositionRoot.swift`** (+ `CompositionRoot+Factories.swift`, `LLMClientFactory.swift`, `SessionManagerWrapper.swift`) — remove imports, properties, and initialization.
5. **`AppShell`** — remove navigation (`NavigationLink`, tabs, `LaunchRouter`, deep links).
6. **Tests** — delete or rewrite tests that import the removed module.
7. **Config** — remove unused keys from `Secrets.xcconfig` / `Configuration.swift` generation (e.g. `PROXY_*` if AI is gone).
8. **Backend** — remove unused Supabase functions / tables (e.g. `supabase/functions/ai/`) from **your** project when applicable.

### Dependency gotcha (read before removing chat or AI)

In this repository, **`LLMClient` and `LLMMessage` live in `FeatureChat`**, and **`AI` re-exports `FeatureChat`** (`Packages/AI/Sources/AI/AI.swift`).  

**You cannot delete `FeatureChat` alone** without first **moving** `LLMClient` / `LLMMessage` into `AI` or `Core` and updating `Packages/AI/Package.swift` to drop the `FeatureChat` dependency.

---

## Removing: specific modules

Below: **entry points** to search from. Full APIs live in each package’s `README.md` and `docs/modules/*.md`.

### Core

- **Docs:** [Core module](../modules/Core.md), `Packages/Core/README.md`
- **Remove:** Usually **never** — almost everything depends on `Core`.
- **4.3 note:** Customize `AppLogger` fallback subsystem string if `Bundle.main.bundleIdentifier` is unavailable in some targets; search literals for `SwiftAI`.

### Networking

- **Docs:** [Networking module](../modules/Networking.md), `Packages/Networking/README.md`
- **Remove:** Only if the app has **no** HTTP usage; then remove interceptors from `CompositionRoot`, delete `httpClient`, and strip dependent repositories/clients.

### Storage

- **Docs:** [Storage module](../modules/Storage.md), `Packages/Storage/README.md`
- **Remove:** Rare; requires replacing SwiftData stack in `CompositionRoot` and every `*Repository`.
- **If slimming:** Remove unused `@Model` types from `Schema([...])` and migrations.

### Auth

- **Docs:** [Auth module](../modules/Auth.md), `Packages/Auth/README.md`
- **Remove:** Replace `AuthClient` usage with a stub or remove sign-in flows; update `FeatureSettings` (account rows), `LaunchRouter`, Sign In views, Keychain token providers on `HTTPClient`.

### Payments

- **Docs:** [Payments module](../modules/Payments.md), `Packages/Payments/README.md`
- **Remove:** Drop `PaymentsClient` from `CompositionRoot`, paywall entry points, `FeatureSettings` subscription section; see `Packages/FeatureSettings` for paywall surfaces.

### AI

- **Docs:** [AI module](../modules/AI.md), `Packages/AI/README.md`
- **Remove:** Remove `llmClient`, `LLMClientFactory`, proxy config; **first** resolve the `FeatureChat` coupling (see above).

### FeatureChat

- **Docs:** [Feature.Chat module](../modules/Feature.Chat.md), `Packages/FeatureChat/README.md`
- **Remove:** Chat screens, `Conversation`/`Message` models (if unused), chat repositories, chat routing; **must** relocate `LLMClient` types if AI stays. Clean SwiftData schema and Supabase sync docs if used.

### FeatureSettings

- **Docs:** [Feature.Settings module](../modules/Feature.Settings.md), `Packages/FeatureSettings/README.md`
- **Remove:** Settings tab/sheets, paywall hooks — often replaced by a **minimal** custom settings view; many apps **keep** a slim settings surface.

### FeatureRating

- **Docs:** [FeatureRating module](../modules/FeatureRating.md), `Packages/FeatureRating/README.md`
- **Remove:** Remove `RatingClient` / modifiers from root view; see `AppRootView` and composition factories.

### DesignSystem

- **Docs:** [DesignSystem module](../modules/DesignSystem.md), `Packages/DesignSystem/README.md`
- **Remove:** Impractical wholesale; instead **retheme** (`BrandConfig`, colors). Removing requires replacing every `DSColors` / component usage.

### Localization

- **Docs:** [Localization module](../modules/Localization.md), `Packages/Localization/README.md`
- **Remove:** Only if you replace with String Catalogs elsewhere; update all `L10n` call sites.

---

## LLM-assisted hardening

- **In this repo (buyers extending the template):** [CLAUDE.md](../CLAUDE.md) + [App Store 4.3 prompt pack](../prompts/AppStore4_3Hardening.prompts.md)
- **Prompt packs index:** [prompts/README.md](../prompts/README.md)

---

## Related docs

- [White Labeling](../recipes/WhiteLabeling.md) — rename, assets, legal
- [App Icons & Branding](../recipes/AppIconsAndBranding.md)
- [Architecture](../foundations/Architecture.md) — where DI and features meet
- [docs/INDEX.md](../INDEX.md) — full module map
