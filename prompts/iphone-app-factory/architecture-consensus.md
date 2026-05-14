# Architecture And ADR Consensus

Read:

- `.workflow/iphone-app-factory/spec.md`
- `.workflow/iphone-app-factory/definition-of-done.md`
- all architecture candidates in context
- `.workflow/iphone-app-factory/quality-bar.json`

Write:

- `.workflow/iphone-app-factory/architecture.md`
- `.workflow/iphone-app-factory/adr.md`

The architecture must explicitly map the product to SwiftAIBoilerplatePro:

- `SwiftAIBoilerplatePro.xcodeproj`
- `Config/App.xcconfig`
- `Packages/Core`
- `Packages/Networking`
- `Packages/Storage`
- `Packages/Auth`
- `Packages/Payments`
- `Packages/AI`
- `Packages/FeatureSettings`
- `Packages/Localization`
- `Packages/DesignSystem`
- `CompositionRoot`

If any module is removed, the ADR must explain dependency order and App Store 4.3 consequences.
