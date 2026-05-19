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

The architecture must also define the recovery/evidence lane:

- how generated app, `.workflow/iphone-app-factory`, `.github/workflows`, and `reports/ios` artifacts survive control-plane failures;
- where GitHub Actions hosted macOS run id, commit SHA, successful conclusion, and artifact names are recorded when `allow_macos_deferred=false`;
- how metadata branch push failures are classified and retried from the pushed run branch instead of being treated as successful completion;
- how `allow_macos_deferred` changes Appium/XCUITest evidence requirements, including explicit accepted-risk notes only when deferral is true.
