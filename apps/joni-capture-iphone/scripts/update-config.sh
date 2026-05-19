#!/bin/bash
# Update Configuration.swift from Secrets.xcconfig
# Run this manually after filling in your API keys: bash scripts/update-config.sh

set -e

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SECRETS_FILE="${PROJECT_ROOT}/Config/Secrets.xcconfig"
OUTPUT_FILE="${PROJECT_ROOT}/SwiftAIBoilerplatePro/Generated/Configuration.swift"

echo "📝 Updating Configuration.swift from Secrets.xcconfig..."
echo "⚠️  WARNING: This writes real API keys into a committed file."
echo "   Do NOT commit Configuration.swift after running this script."
echo "   Install the pre-commit hook: git config core.hooksPath .githooks"
echo ""

# Check if Secrets.xcconfig exists
if [ ! -f "$SECRETS_FILE" ]; then
    echo "❌ Error: Config/Secrets.xcconfig not found"
    echo "   Run: cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig"
    echo "   Then fill in your API keys and run this script again"
    exit 1
fi

# Create Generated directory
mkdir -p "${PROJECT_ROOT}/SwiftAIBoilerplatePro/Generated"

# Start building file content
cat > "$OUTPUT_FILE" << 'HEADER'
// This file is auto-generated from Config/Secrets.xcconfig
// Run 'bash scripts/update-config.sh' after updating Secrets.xcconfig
// Default placeholder values allow clone-and-run with MockAuthClient and EchoLLMClient

import Foundation

/// Application configuration loaded from Config/Secrets.xcconfig
/// This ensures configs work in all build types (Debug, Release, Archive, TestFlight, App Store)
enum AppConfiguration {
HEADER

# Parse using pure bash
config_count=0
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty and comment lines
    [[ -z "${line// }" ]] && continue
    [[ "$line" =~ ^[[:space:]]*// ]] && continue
    
    # Extract key=value
    if [[ "$line" =~ ^[[:space:]]*([A-Z_]+)[[:space:]]*=[[:space:]]*(.+)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        value="${value%%[[:space:]]*}"  # trim
        
        [[ -z "$key" || -z "$value" ]] && continue
        
        # Skip placeholders
        if [[ "$value" == *"YOUR"* ]]; then
            echo "    // $key: Not configured (contains placeholder)" >> "$OUTPUT_FILE"
            continue
        fi
        
        echo "    static let $key = \"$value\"" >> "$OUTPUT_FILE"
        ((config_count++))
    fi
done < "$SECRETS_FILE"

# Add isConfigured function
cat >> "$OUTPUT_FILE" << 'FOOTER'
    
    /// Check if a configuration value is available (not a placeholder)
    static func isConfigured(_ key: String) -> Bool {
        switch key {
        case "SUPABASE_URL": return !SUPABASE_URL.contains("placeholder") && !SUPABASE_URL.contains("YOUR")
        case "SUPABASE_ANON_KEY": return !SUPABASE_ANON_KEY.contains("placeholder") && !SUPABASE_ANON_KEY.contains("YOUR")
        case "REVENUECAT_API_KEY": return !REVENUECAT_API_KEY.contains("placeholder") && !REVENUECAT_API_KEY.contains("YOUR")
        case "PROXY_BASE_URL": return !PROXY_BASE_URL.contains("placeholder") && !PROXY_BASE_URL.contains("YOUR")
        case "ONESIGNAL_APP_ID": return !ONESIGNAL_APP_ID.contains("placeholder") && !ONESIGNAL_APP_ID.contains("YOUR")
        default: return true
        }
    }
}
FOOTER

if [ "$config_count" -gt 0 ]; then
    echo "✅ Updated Configuration.swift with $config_count values"
    echo "   Build your app in Xcode to use the new configuration"
else
    echo "⚠️  No valid configuration found"
    echo "   Fill in Config/Secrets.xcconfig with real API keys"
    exit 1
fi

