Implemented the interface phase for `apps/waketask-iphone` with a real WakeTask app experience (not a landing page), and wrote the required evidence doc.

### What I changed
- Added a full Wake interface screen with real workflow:
  - Alarm list
  - Create alarm sheet
  - Strictness selection
  - Start run
  - Complete missions
  - Complete wake check
  - Complete first task
  - Dismiss alarm
- Wired this screen into existing AppShell tab navigation and composition root.
- Added type-safe localization for all new visible text and accessibility copy (`L10n.Wake`) with EN + ES keys.
- Added accessibility labels/hints/identifiers for tappable controls and list cells.
- Added preview support for Wake flow via preview mocks.

### Key files
- [WakeDashboardView.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/Wake/WakeDashboardView.swift)
- [MainTabView.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/MainTabView.swift)
- [AppRootView.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/AppRootView.swift)
- [L10n+Wake.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/Localization/Sources/Localization/L10n+Wake.swift)
- [Localizable.strings (en)](/home/daytona/workspace/apps/waketask-iphone/Packages/Localization/Sources/Localization/Resources/en.lproj/Localizable.strings)
- `apps/waketask-iphone/Packages/Localization/Sources/Localization/Resources/es.lproj/Localizable.strings`
- [PreviewComposition.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Previews/PreviewComposition.swift)
- [PreviewMocks.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Previews/PreviewMocks.swift)

### Evidence file
- [interface.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/interface.md)

### Validation note
- Could not run iOS build verification here because `xcodebuild` is unavailable in this environment.  
- Appium placeholder script is still non-executing, but interface controls now expose identifiers for traversal (buttons/cells/navigation roots).