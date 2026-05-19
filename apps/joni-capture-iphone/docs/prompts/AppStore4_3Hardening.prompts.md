# App Store 4.3(a) — Differentiation Prompt Pack

Use these prompts in **your fork** (the app you ship), not necessarily in the upstream boilerplate repo.

**Prerequisite reading (in this boilerplate):** [APP_STORE_4_3_HARDENING.md](../checklists/APP_STORE_4_3_HARDENING.md)

---

## Prompt A — Full hardening pass (code + metadata outline)

Copy everything below the line into your AI assistant with your **app repository** as context.

```markdown
You are helping me ship an iOS app built from SwiftAI Boilerplate Pro. Apple rejected (or might reject) under Guideline 4.3(a) “spam / template similarity.”

Read the boilerplate checklist mindset (binary similarity + metadata + concept):
- Remove template strings from the **Release** binary (unused Swift files still compile in).
- Rebrand identity (bundle name, display name, icons, onboarding, legal).
- Ensure primary UX and App Store story match **my** product, not generic “AI chat.”

Tasks:
1. Search the codebase for literals: SwiftAI, Boilerplate, EchoLLM, MockAuth, “Start Chat,” and any placeholder/demo copy. Fix or delete. Flag `AppLogger` subsystem fallbacks that still say SwiftAI.
2. List Swift files in the **app target** that are never presented in the UI (dead demo views). Recommend removing them from the target or deleting.
3. If I removed FeatureChat and/or AI, verify there are no orphaned imports, tests, or UI tests describing chat.
4. Summarize edits for: CompositionRoot, LaunchRouter, MainTabView (or equivalent), Settings/paywall entry points.
5. Give me a **post-build verification** shell recipe using `strings` on the Release .app binary.

Constraints: minimal diff, follow existing Swift 6 / SwiftUI patterns, no broad refactors unless required to remove a module.

My app’s one-sentence purpose: [FILL IN]
```

---

## Prompt B — Module removal (name the module)

```markdown
I want to remove Swift package dependency **[MODULE_NAME]** from my fork of SwiftAI Boilerplate Pro.

Using the repo’s CompositionRoot, AppShell navigation, Xcode target linkage, and Package.swift graph:
1. List every file and symbol I must delete or rewrite.
2. Warn about **reverse dependencies** (e.g. AI currently depends on FeatureChat for LLMMessage/LLMClient).
3. Give an ordered checklist: SPM → CompositionRoot → Views → tests → config secrets.

Module to remove: [MODULE_NAME]
My app still needs these features: [LIST]
```

---

## Prompt C — App Review Notes only

```markdown
Write concise App Review Notes (max ~400 words) for App Store Connect explaining why my app is **not** duplicate/spam under 4.3. Include: primary purpose, hero screen, unique data or geography, what changed vs a generic template, and test credentials if login is required.

Facts about my app:
- Name:
- Primary user:
- Hero feature / main screen:
- Backend / data:
- Other apps I ship (if any):
```
