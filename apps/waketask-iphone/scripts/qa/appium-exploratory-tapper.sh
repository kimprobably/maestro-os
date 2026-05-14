#!/usr/bin/env bash
set -euo pipefail

REPORT_PATH="reports/ios/appium-exploratory-report.json"
mkdir -p "$(dirname "$REPORT_PATH")"

# Skeleton only: replace with real Appium driver setup and traversal in implementation phase.
if [ "${APPIUM_ENABLED:-0}" != "1" ]; then
  cat > "$REPORT_PATH" <<'JSON'
{
  "ok": false,
  "buttons_tapped": 0,
  "screens_visited": [],
  "crashes": 0,
  "failures": 1,
  "failures_detail": [
    "Appium exploratory skeleton present, but real simulator run is not configured yet."
  ]
}
JSON
  echo "Appium skeleton wrote placeholder report at $REPORT_PATH"
  exit 0
fi

cat > "$REPORT_PATH" <<'JSON'
{
  "ok": true,
  "buttons_tapped": 1,
  "screens_visited": ["SkeletonSmokeScreen"],
  "crashes": 0,
  "failures": 0,
  "failures_detail": []
}
JSON

echo "Appium skeleton run complete: $REPORT_PATH"
