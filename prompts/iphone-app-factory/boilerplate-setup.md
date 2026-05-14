# Clone And Rebrand SwiftAIBoilerplatePro

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/architecture.md`
- `.workflow/iphone-app-factory/adr.md`
- `.workflow/iphone-app-factory/quality-bar.json`

Create `{{ inputs.app_dir|default("apps/generated-iphone-app") }}` from `{{ inputs.boilerplate_repo|default("SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution") }}`.

Use the boilerplate as much as possible:

- do not recreate auth/payments/networking/storage/AI/settings/design system from scratch
- start with rebranding, app identity, and product-specific surfaces
- keep Swift 6 and package boundaries intact
- keep Xcode project and test targets functional

Read `AGENTS.md`, `DISTRIBUTION_README.md`, `docs/CLAUDE.md`, `docs/BUILDING_YOUR_APP.md`, and the App Store 4.3 checklist in the boilerplate.

Write `.workflow/iphone-app-factory/evidence/boilerplate-setup.md` with files changed, commands run, and unresolved risks.
