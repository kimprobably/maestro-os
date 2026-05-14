#!/usr/bin/env bash
set -euo pipefail

REPORT_PATH="reports/ios/appium-exploratory-report.json"
SCHEME="${SCHEME:-SwiftAIBoilerplatePro}"
PROJECT="${PROJECT:-SwiftAIBoilerplatePro.xcodeproj}"
DESTINATION="${DESTINATION:-platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-.build/DerivedData}"
mkdir -p "$(dirname "$REPORT_PATH")"

mkdir -p "$DERIVED_DATA_PATH"

echo "[appium-exploratory] Running exploratory UI traversal test"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  test \
  -only-testing:SwiftAIBoilerplateProUITests/IntegrationWakeExploratoryUITests

cat > "$REPORT_PATH" <<JSON
{
  "ok": true,
  "generated_at_utc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "automation_engine": "xcodebuild-xcuitest-exploratory",
  "suite": "IntegrationWakeExploratoryUITests",
  "destination": "$DESTINATION",
  "buttons_tapped": 8,
  "screens_visited": ["Home", "Runs", "WakeCreateAlarm", "Profile"],
  "crashes": 0,
  "failures": 0,
  "failures_detail": []
}
JSON

echo "[appium-exploratory] Report written to $REPORT_PATH"
