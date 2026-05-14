#!/usr/bin/env bash
set -euo pipefail

REPORT_PATH="reports/ios/appium-exploratory-report.json"
mkdir -p "."

# Foundation placeholder only. This must never write a passing report.
# The real hosted macOS Appium/XCUITest traversal must replace this skeleton in the iOS validation phase.
cat > "" <<JSON
{
  "ok": false,
  "buttons_tapped": 0,
  "screens_visited": [],
  "crashes": 0,
  "failures": 1,
  "failures_detail": [
    "Foundation Appium placeholder only. Hosted macOS simulator traversal has not run, and allow_macos_deferred=false forbids treating this as pass evidence."
  ]
}
JSON

echo "Appium placeholder wrote non-passing report at "
exit 0
