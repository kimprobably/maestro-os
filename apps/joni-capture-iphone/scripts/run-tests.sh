#!/bin/bash

# SwiftAI Boilerplate Pro - Test Runner with Coverage
# Usage: ./scripts/run-tests.sh [--coverage] [--open] [--package PACKAGE_NAME]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCHEME="SwiftAIBoilerplatePro"
DESTINATION="platform=iOS Simulator,name=iPhone 16,OS=18.6"
DERIVED_DATA_PATH=".build"
COVERAGE_THRESHOLD=85

# Flags
ENABLE_COVERAGE=false
OPEN_REPORT=false
PACKAGE_NAME=""
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      ENABLE_COVERAGE=true
      shift
      ;;
    --open)
      OPEN_REPORT=true
      shift
      ;;
    --package)
      PACKAGE_NAME="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --coverage         Enable code coverage measurement"
      echo "  --open             Open coverage report in browser"
      echo "  --package NAME     Test specific package only"
      echo "  --verbose          Show detailed output"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Functions
print_header() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Test specific package
test_package() {
  local package=$1
  print_header "Testing Package: $package"
  
  cd "Packages/$package"
  
  if [ "$ENABLE_COVERAGE" = true ]; then
    swift test --enable-code-coverage
  else
    swift test
  fi
  
  cd ../..
  print_success "Package tests passed: $package"
}

# Test app
test_app() {
  print_header "Testing App: $SCHEME"
  
  local coverage_flag=""
  if [ "$ENABLE_COVERAGE" = true ]; then
    coverage_flag="-enableCodeCoverage YES"
  fi
  
  if [ "$VERBOSE" = true ]; then
    xcodebuild test \
      -scheme "$SCHEME" \
      -destination "$DESTINATION" \
      -derivedDataPath "$DERIVED_DATA_PATH" \
      $coverage_flag
  else
    # Check if xcpretty is available
    if command -v xcpretty &> /dev/null; then
      xcodebuild test \
        -scheme "$SCHEME" \
        -destination "$DESTINATION" \
        -derivedDataPath "$DERIVED_DATA_PATH" \
        $coverage_flag \
        | xcpretty --color
    else
      # Run without xcpretty if not available
      xcodebuild test \
        -scheme "$SCHEME" \
        -destination "$DESTINATION" \
        -derivedDataPath "$DERIVED_DATA_PATH" \
        $coverage_flag
    fi
  fi
  
  print_success "App tests passed"
}

# Generate coverage report
generate_coverage() {
  print_header "Generating Coverage Report"
  
  # Find the xcresult file
  XCRESULT=$(find "$DERIVED_DATA_PATH/Logs/Test" -name "*.xcresult" -print -quit)
  
  if [ -z "$XCRESULT" ]; then
    print_error "No test results found"
    exit 1
  fi
  
  # Generate text report
  echo "Coverage Report:" > coverage-report.txt
  echo "Generated: $(date)" >> coverage-report.txt
  echo "" >> coverage-report.txt
  xcrun xccov view --report "$XCRESULT" >> coverage-report.txt
  
  # Display summary
  echo ""
  echo -e "${BLUE}Coverage Summary:${NC}"
  echo ""
  xcrun xccov view --report "$XCRESULT" | head -20
  
  # Extract overall coverage
  COVERAGE=$(xcrun xccov view --report "$XCRESULT" | grep -E "^\s+$SCHEME.app" | awk '{print $2}' | sed 's/%//')
  
  if [ -n "$COVERAGE" ]; then
    echo ""
    echo -e "${BLUE}Overall Coverage: ${COVERAGE}%${NC}"
    
    # Compare to threshold
    if (( $(echo "$COVERAGE >= $COVERAGE_THRESHOLD" | bc -l) )); then
      print_success "Coverage meets threshold (${COVERAGE_THRESHOLD}%)"
    else
      print_warning "Coverage below threshold (${COVERAGE_THRESHOLD}%). Current: ${COVERAGE}%"
    fi
  fi
  
  # Generate HTML report
  print_header "Generating HTML Report"
  
  cat > coverage-report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Coverage Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f7;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1d1d1f;
      margin-top: 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card.high {
      background: #d1f2eb;
      color: #0f5257;
    }
    .stat-card.medium {
      background: #fff3cd;
      color: #856404;
    }
    .stat-card.low {
      background: #f8d7da;
      color: #721c24;
    }
    .stat-value {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-label {
      font-size: 14px;
      text-transform: uppercase;
      opacity: 0.8;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
    }
    th {
      background: #007aff;
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e5e5e5;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .coverage-high {
      color: #34c759;
      font-weight: bold;
    }
    .coverage-medium {
      color: #ff9500;
      font-weight: bold;
    }
    .coverage-low {
      color: #ff3b30;
      font-weight: bold;
    }
    .timestamp {
      color: #86868b;
      font-size: 14px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Test Coverage Report</h1>
    <p class="timestamp">Generated: TIMESTAMP_PLACEHOLDER</p>
    
    <div id="stats"></div>
    <div id="details"></div>
  </div>
  
  <script>
    // Parse coverage data
    const coverageData = `COVERAGE_DATA_PLACEHOLDER`;
    
    const lines = coverageData.split('\n').filter(l => l.trim());
    const modules = [];
    
    lines.forEach(line => {
      const match = line.match(/^\s*(\S+\.(?:app|framework)):\s*([\d.]+)%/);
      if (match) {
        const name = match[1];
        const coverage = parseFloat(match[2]);
        modules.push({ name, coverage });
      }
    });
    
    // Calculate stats
    const overallCoverage = modules.find(m => m.name.includes('.app'))?.coverage || 0;
    const passedModules = modules.filter(m => m.coverage >= THRESHOLD_PLACEHOLDER).length;
    const totalModules = modules.length;
    
    // Render stats
    const statsDiv = document.getElementById('stats');
    const statusClass = overallCoverage >= THRESHOLD_PLACEHOLDER ? 'high' : overallCoverage >= 70 ? 'medium' : 'low';
    
    statsDiv.innerHTML = `
      <div class="stats">
        <div class="stat-card ${statusClass}">
          <div class="stat-label">Overall Coverage</div>
          <div class="stat-value">${overallCoverage.toFixed(1)}%</div>
        </div>
        <div class="stat-card ${passedModules === totalModules ? 'high' : 'medium'}">
          <div class="stat-label">Modules Passing</div>
          <div class="stat-value">${passedModules}/${totalModules}</div>
        </div>
        <div class="stat-card ${overallCoverage >= THRESHOLD_PLACEHOLDER ? 'high' : 'low'}">
          <div class="stat-label">Target</div>
          <div class="stat-value">THRESHOLD_PLACEHOLDER%</div>
        </div>
      </div>
    `;
    
    // Render details table
    const detailsDiv = document.getElementById('details');
    const rows = modules.map(m => {
      const cssClass = m.coverage >= THRESHOLD_PLACEHOLDER ? 'coverage-high' : m.coverage >= 70 ? 'coverage-medium' : 'coverage-low';
      const status = m.coverage >= THRESHOLD_PLACEHOLDER ? '✅' : m.coverage >= 70 ? '⚠️' : '❌';
      return `<tr>
        <td>${m.name}</td>
        <td class="${cssClass}">${m.coverage.toFixed(1)}%</td>
        <td>${status}</td>
      </tr>`;
    }).join('');
    
    detailsDiv.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Module</th>
            <th>Coverage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  </script>
</body>
</html>
EOF
  
  # Inject data
  COVERAGE_DATA=$(xcrun xccov view --report "$XCRESULT" | grep -E "\.app|\.framework")
  sed -i '' "s|TIMESTAMP_PLACEHOLDER|$(date)|g" coverage-report.html
  sed -i '' "s|COVERAGE_DATA_PLACEHOLDER|$COVERAGE_DATA|g" coverage-report.html
  sed -i '' "s|THRESHOLD_PLACEHOLDER|$COVERAGE_THRESHOLD|g" coverage-report.html
  
  print_success "Reports generated:"
  echo "  - coverage-report.txt"
  echo "  - coverage-report.html"
  
  # Open report if requested
  if [ "$OPEN_REPORT" = true ]; then
    open coverage-report.html
    print_success "Opened coverage report in browser"
  fi
}

# Main execution
main() {
  print_header "SwiftAI Boilerplate Pro - Test Runner"
  
  # Check if running from project root
  if [ ! -f "SwiftAIBoilerplatePro.xcodeproj/project.pbxproj" ]; then
    print_error "Must be run from project root"
    exit 1
  fi
  
  # Test specific package or app
  if [ -n "$PACKAGE_NAME" ]; then
    test_package "$PACKAGE_NAME"
  else
    test_app
  fi
  
  # Generate coverage if requested
  if [ "$ENABLE_COVERAGE" = true ] && [ -z "$PACKAGE_NAME" ]; then
    generate_coverage
  fi
  
  echo ""
  print_success "All tests completed successfully!"
  echo ""
}

# Run main
main

