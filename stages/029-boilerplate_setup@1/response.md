Implemented the clone/rebrand step in `apps/waketask-iphone` using extension-only edits on top of SwiftAIBoilerplatePro, and wrote the required evidence file at [boilerplate-setup.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/boilerplate-setup.md).

Key updates:
- Rebranded app identity and launch/loading copy to WakeTask.
- Replaced onboarding and home content with WakeTask-specific differentiation messaging (wake missions, wake-check/escalation, reliability ledger, first-task bridge).
- Updated tab labels/icons to better match wake-run framing.
- Replaced placeholder legal docs with WakeTask-specific draft privacy/terms.
- Updated entitlement app-group string to WakeTask naming.
- Preserved existing Swift 6/project/package architecture and core boilerplate modules.

Main files changed:
- [BrandConfig.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/DesignSystem/Sources/DesignSystem/Tokens/BrandConfig.swift)
- [OnboardingPage.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/OnboardingPage.swift)
- [HomeContent.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/HomeContent.swift)
- [HomeView.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/HomeView.swift)
- [MainTabView.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/AppShell/MainTabView.swift)
- [SwiftAIBoilerplatePro.swift](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/SwiftAIBoilerplatePro.swift)
- [Launch Screen.storyboard](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Launch%20Screen.storyboard)
- [privacy.md](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Resources/privacy.md)
- [terms.md](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Resources/terms.md)
- [SwiftAIBoilerplatePro.entitlements](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/SwiftAIBoilerplatePro.entitlements)

Not run yet:
- `xcodebuild build`
- `xcodebuild test`

Natural next steps:
1. Run build/test and fix any regressions.
2. Continue implementing FR-01..FR-06 product behavior behind these rebranded surfaces.
3. Execute final App Store 4.3 Release `strings` audit and metadata hardening.