#!/usr/bin/env bash
set -euo pipefail

SCHEME="${SCHEME:-SwiftAIBoilerplatePro}"
PROJECT="${PROJECT:-SwiftAIBoilerplatePro.xcodeproj}"
DESTINATION="${DESTINATION:-platform=iOS Simulator,name=iPhone 17 Pro,OS=26.2}"
REPORT_PATH="${REPORT_PATH:-reports/ios/ios-quality-report.json}"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-.build/DerivedData}"
RESULT_BUNDLE_PATH="${RESULT_BUNDLE_PATH:-.build/TestResults/ios-quality.xcresult}"

mkdir -p "$(dirname "$REPORT_PATH")" "$(dirname "$RESULT_BUNDLE_PATH")" "$DERIVED_DATA_PATH"

print_secret_presence() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    echo "secret:$key present=true"
  else
    echo "secret:$key present=false"
  fi
}

require_required_secrets_if_enabled() {
  local required=("SUPABASE_URL" "SUPABASE_ANON_KEY" "REVENUECAT_API_KEY")
  local missing=0
  for key in "${required[@]}"; do
    print_secret_presence "$key"
    if [[ "${IOS_QUALITY_REQUIRE_SECRETS:-0}" == "1" && -z "${!key:-}" ]]; then
      missing=1
    fi
  done
  if [[ "$missing" -eq 1 ]]; then
    echo "Required secrets are missing while IOS_QUALITY_REQUIRE_SECRETS=1"
    exit 1
  fi
}

require_tool() {
  local tool="$1"
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "[ios-quality] Required tool unavailable: $tool"
    exit 1
  fi
}

run_app_store_string_audit() {
  echo "[ios-quality] App Store string audit"
  local output_dir=".build/Release-iphonesimulator"
  rm -rf "$output_dir"

  xcodebuild \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination "$DESTINATION" \
    -derivedDataPath "$DERIVED_DATA_PATH" \
    CODE_SIGNING_ALLOWED=NO \
    build >/tmp/ios-quality-release-build.log

  local app_binary
  app_binary="$(find "$DERIVED_DATA_PATH/Build/Products" -path "*Release-iphonesimulator/*.app/SwiftAIBoilerplatePro" | head -n1 || true)"
  if [[ -z "$app_binary" ]]; then
    echo "Release app binary not found for strings audit"
    exit 1
  fi

  if strings "$app_binary" | rg -n "(SwiftAI Boilerplate Pro|Brand-Ready AI Assistant|PLACEHOLDER_APP_NAME)" >/tmp/ios-quality-strings-audit.log; then
    echo "App Store strings audit failed: template fingerprint found in Release binary"
    exit 1
  fi
}

run_secret_scan() {
  echo "[ios-quality] Secret scan"
  if command -v gitleaks >/dev/null 2>&1; then
    gitleaks detect --no-banner --redact --source .
    return
  fi
  if command -v trufflehog >/dev/null 2>&1; then
    trufflehog filesystem --no-update --fail --json . >/tmp/ios-quality-trufflehog.json
    return
  fi
  if rg -n --hidden --glob '!**/.git/**' --glob '!**/*.png' --glob '!**/*.pdf' --glob '!**/*.xcresult/**' \
    '(sk_live_[A-Za-z0-9]+|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[0-9A-Za-z_\\-]{35})' .; then
    echo "Potential committed secret detected"
    exit 1
  fi
}

require_tool xcodebuild
require_tool rg
require_tool strings
require_tool swiftlint
require_tool swiftformat
require_tool qlty

echo "[ios-quality] Resolve package dependencies"
xcodebuild -resolvePackageDependencies -project "$PROJECT"

echo "[ios-quality] Build"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  build

echo "[ios-quality] Test"
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -resultBundlePath "$RESULT_BUNDLE_PATH" \
  CODE_SIGNING_ALLOWED=NO \
  test \
  -only-testing:SwiftAIBoilerplateProTests

echo "[ios-quality] SwiftLint"
swiftlint lint --strict

echo "[ios-quality] SwiftFormat"
swiftformat SwiftAIBoilerplatePro Packages --lint --cache ignore

echo "[ios-quality] Qlty"
qlty check --all --jobs 2 --no-progress --summary --no-upgrade-check

require_required_secrets_if_enabled
run_secret_scan
run_app_store_string_audit

cat > "$REPORT_PATH" <<JSON
{
  "ok": true,
  "generated_at_utc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "scheme": "$SCHEME",
  "destination": "$DESTINATION",
  "checks": {
    "xcodebuild_build": true,
    "xcodebuild_test": true,
    "swiftlint": true,
    "swiftformat": true,
    "qlty": true,
    "secret_scan": true,
    "app_store_string_audit": true
  },
  "result_bundle_path": "$RESULT_BUNDLE_PATH"
}
JSON

echo "[ios-quality] Report written to $REPORT_PATH"
