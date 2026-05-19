# AI UI Explorer

Run or complete the automated exploratory UI pass for `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

The target behavior is: launch the iOS app in simulator through Appium/XCUITest and tap every reachable enabled button/control across the MVP flows.

The explorer should:

- record each screen source or screenshot
- identify buttons, tabs, cells, navigation controls, and primary actions
- tap controls breadth-first with a bounded depth
- recover with back/navigation when possible
- detect crashes, blank screens, stuck spinners, and unhandled error screens
- produce `reports/ios/appium-exploratory-report.json`

The report JSON must include:

```json
{
  "ok": true,
  "buttons_tapped": 0,
  "screens_visited": 0,
  "crashes": 0,
  "failures": 0,
  "failures_detail": []
}
```

Do not mark the pass complete unless a real simulator/Appium run happened, unless the workflow explicitly allows macOS deferral.

When `allow_macos_deferred=false`, the explorer/handoff must point to hosted macOS or simulator evidence, not workflow-only claims. Record the GitHub Actions run id, commit SHA, successful conclusion, artifact names, and any controls skipped. When deferral is allowed, write an explicit risk note and do not call the app TestFlight-ready.
