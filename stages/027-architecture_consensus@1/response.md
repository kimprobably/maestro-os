Created both requested files:

- [architecture.md](/home/daytona/workspace/.workflow/iphone-app-factory/architecture.md)
- [adr.md](/home/daytona/workspace/.workflow/iphone-app-factory/adr.md)

What’s included:
- Explicit product-to-boilerplate mapping for all required modules:
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
- Dependency order and composition strategy.
- ADR decision is extension-first with **no module removals**, plus App Store 4.3 consequence analysis if modules were removed/rebuilt.