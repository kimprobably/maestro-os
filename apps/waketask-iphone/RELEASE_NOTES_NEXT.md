# Release notes (draft) — next version

**Status:** Draft — **not shipped**. Replace this file’s content into `RELEASE_NOTES.md` (or merge sections) when you cut the git tag and GitHub release. Set the shipped date and final version number below.

**Planned version:** `v2.1.0` *(change to `v2.0.1` if you prefer a documentation-only patch bump)*  
**Shipped:** _TBD_

---

## Headline for buyers

1. **App Store Guideline 4.3(a) playbook** — First-party checklist for “template spam” rejections: Release **binary `strings` audit**, branding map, metadata, Review Notes template, and **per-module removal** guidance (including the **FeatureChat ↔ AI** coupling).
2. **Post-purchase onboarding** — `docs/buyers/POST_PURCHASE.md` with welcome steps, the 4.3 link, and **copy-paste email** text for your delivery workflow.
3. **AI / agent discovery** — Root `AGENTS.md` and updates to `docs/CLAUDE.md` so assistants consistently point buyers at the hardening doc before first upload.
4. **Cursor rules** — `app-store-differentiation.mdc` and `ios-platform-safety.mdc` (always-on); SwiftUI rules updated for **v2.0 `@Observable`** vs legacy `@StateObject` examples.

---

## Documentation & tooling

| Area | Change |
|------|--------|
| Checklist | `docs/checklists/APP_STORE_4_3_HARDENING.md` |
| Prompt pack | `docs/prompts/AppStore4_3Hardening.prompts.md` |
| Buyer hub | `docs/buyers/POST_PURCHASE.md`, `docs/buyers/README.md` |
| Index / journeys | `docs/INDEX.md`, `docs/BUILDING_YOUR_APP.md`, `README.md`, `SKILLS.md` |
| Recipes | `docs/recipes/WhiteLabeling.md` callout → 4.3 checklist |
| Prompts index | `docs/prompts/README.md` safety checklist + 4.3 prompts |
| Package READMEs | All 11 packages: “Shipping your own app (App Store 4.3)” footer → checklist |
| Cursor | `.cursor/rules/app-store-differentiation.mdc`, `ios-platform-safety.mdc`, `swiftui-views.mdc` (v2 observation note), `.cursor/README.md` |

---

## Bug fixes

- **Swift 6 data-race in `AppDelegate.uploadDeviceToken`** ([#4](https://github.com/SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution/issues/4)) — Fresh Xcode 26 / Swift 6 builds rejected `AppDelegate.swift:266` with `Sending 'uploader' risks causing data races`. `DeviceTokenUploader` is now constructed inside the fire-and-forget `Task` closure, so no value crosses an isolation boundary. Thanks to **@MarcinKilarski** for the report and the suggested patch.

---

## Not in this release

- No Swift feature changes, dependency bumps, or Xcode project version bumps in this documentation pass.
- GitHub **Releases** / tags: create when you finalize the version number and marketing.

---

## Checklist before you tag

- [ ] Move/rename this draft into `RELEASE_NOTES.md` (or append after v2.0.0 section).
- [ ] Collapse `CHANGELOG.md` **`[Unreleased]`** into a dated **`[x.y.z]`** section.
- [ ] Optional: bump `MARKETING_VERSION` / display version in Xcode if you expose it to testers.
- [ ] Publish GitHub Release with the same body as the top section of `RELEASE_NOTES.md`.
