#!/usr/bin/env bash
set -euo pipefail

SCHEME="SwiftAIBoilerplatePro"
PROJECT="SwiftAIBoilerplatePro.xcodeproj"
DESTINATION="platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2"

echo "[foundation] Resolve package dependencies"
xcodebuild -resolvePackageDependencies -project "$PROJECT"

echo "[foundation] Build"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  CODE_SIGNING_ALLOWED=NO \
  build

echo "[foundation] Test"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  CODE_SIGNING_ALLOWED=NO \
  test

if command -v swiftlint >/dev/null 2>&1; then
  echo "[foundation] SwiftLint"
  swiftlint lint --strict
else
  echo "[foundation] SwiftLint skipped (not installed on runner image)"
fi

if command -v swiftformat >/dev/null 2>&1; then
  echo "[foundation] SwiftFormat lint"
  swiftformat SwiftAIBoilerplatePro Packages --lint --cache ignore
else
  echo "[foundation] SwiftFormat skipped (not installed on runner image)"
fi

if command -v qlty >/dev/null 2>&1; then
  echo "[foundation] Qlty checks"
  scripts/ci/run-app-qlty.sh
else
  echo "[foundation] Qlty skipped (not installed on runner image)"
fi

echo "[foundation] Secret pattern scan"
if rg -n --hidden --glob '!**/.git/**' --glob '!**/.agents/**' --glob '!**/*.png' --glob '!**/*.pdf' --glob '!**/*.xcresult/**' '(api[_-]?key\s*=\s*["'\''A-Za-z0-9_\-]{20,}|sk_live_|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})' .; then
  echo "Potential secret-like content found. Inspect before release."
  exit 1
fi

echo "[foundation] Gates complete"
