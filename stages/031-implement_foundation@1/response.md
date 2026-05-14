Implemented the foundation phase in `apps/waketask-iphone` and wrote the required evidence doc.

Key outcomes:
- Bundle/app identity aligned to WakeTask:
  - Updated bundle IDs in [project.pbxproj](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro.xcodeproj/project.pbxproj) to `com.keen.waketask` (+ test/UITest/extension variants).
  - Refined visible brand config in [BrandConfig.swift](/home/daytona/workspace/apps/waketask-iphone/Packages/DesignSystem/Sources/DesignSystem/Tokens/BrandConfig.swift).
- Brand token wiring:
  - Added explicit accent color value in [AccentColor.colorset/Contents.json](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Assets.xcassets/AccentColor.colorset/Contents.json).
- Placeholder launch/icon assets normalized:
  - Renamed placeholder asset files and updated references in:
    - [AppIcon Contents.json](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Assets.xcassets/AppIcon.appiconset/Contents.json)
    - [LaunchLogo Contents.json](/home/daytona/workspace/apps/waketask-iphone/SwiftAIBoilerplatePro/Assets.xcassets/LaunchLogo.imageset/Contents.json)
- Secrets template hardened (placeholders only, no credentials):
  - [Secrets.example.xcconfig](/home/daytona/workspace/apps/waketask-iphone/Config/Secrets.example.xcconfig)
- GitHub macOS CI skeleton added:
  - [foundation-macos.yml](/home/daytona/workspace/apps/waketask-iphone/.github/workflows/foundation-macos.yml)
  - [run-foundation-gates.sh](/home/daytona/workspace/apps/waketask-iphone/scripts/ci/run-foundation-gates.sh)
- Appium exploratory tapper skeleton added:
  - [appium-exploratory-tapper.sh](/home/daytona/workspace/apps/waketask-iphone/scripts/qa/appium-exploratory-tapper.sh)
  - Generates `reports/ios/appium-exploratory-report.json` with required schema.

Required evidence file created:
- [foundation.md](/home/daytona/workspace/.workflow/iphone-app-factory/evidence/foundation.md)

Notes:
- I validated script syntax and executed the Appium skeleton locally (it intentionally emits a placeholder `ok=false` report until real Appium traversal is implemented).
- I did not run full `xcodebuild`/lint/format/qlty gates in this pass.