#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appDir = arg("--app-dir", "apps/generated-iphone-app");
const appName = arg("--app-name", "Generated iPhone App");
const bundleId = arg("--bundle-id", "com.maestro.generatediphoneapp");
const boilerplateRepo = arg("--boilerplate-repo", "SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution");
const root = ".workflow/iphone-app-factory";

function installSecretShellGuards() {
  if (
    process.env.MAESTRO_INSTALL_SECRET_SHELL_GUARDS !== "1" &&
    !process.cwd().startsWith("/home/daytona/")
  ) {
    return { installed: false, reason: "not_daytona" };
  }

  const redactor = String.raw`/bin/sed -E 's/^([^=]*(TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL|AUTH|COOKIE|SESSION|PRIVATE|OAUTH|OPENROUTER|OPENAI|CLAUDE|CODEX|GITHUB|GH_TOKEN|APIFY|MOBBIN|DAYTONA|LINEAR|SLACK|FABRO)[^=]*=).*/\1[redacted]/I'`;
  const envWrapper = `#!/bin/sh
mask() { ${redactor}; }
if [ "$#" -eq 0 ]; then
  /usr/bin/env | mask
  exit $?
fi
for arg in "$@"; do
  case "$arg" in
    *=*) ;;
    *) exec /usr/bin/env "$@" ;;
  esac
done
/usr/bin/env "$@" | mask
`;
  const printenvWrapper = `#!/bin/sh
mask() { ${redactor}; }
if [ "$#" -eq 0 ]; then
  /usr/bin/printenv | mask
  exit $?
fi
status=0
for key in "$@"; do
  case "$key" in
    *TOKEN*|*KEY*|*SECRET*|*PASSWORD*|*CREDENTIAL*|*AUTH*|*COOKIE*|*SESSION*|*PRIVATE*|*OAUTH*|OPENROUTER*|OPENAI*|CLAUDE*|CODEX*|GITHUB*|GH_TOKEN|APIFY*|MOBBIN*|DAYTONA*|LINEAR*|SLACK*|FABRO*)
      if /usr/bin/printenv "$key" >/dev/null 2>&1; then
        printf '[redacted]\\n'
      else
        status=1
      fi
      ;;
    *)
      /usr/bin/printenv "$key" || status=$?
      ;;
  esac
done
exit "$status"
`;

  try {
    writeFileSync("/usr/local/bin/env", envWrapper, { mode: 0o755 });
    writeFileSync("/usr/local/bin/printenv", printenvWrapper, { mode: 0o755 });
    return { installed: true, path: "/usr/local/bin" };
  } catch (error) {
    return { installed: false, reason: error.message };
  }
}

mkdirSync(root, { recursive: true });
mkdirSync(`${root}/research`, { recursive: true });
mkdirSync(`${root}/evidence`, { recursive: true });
mkdirSync(`${root}/reviews`, { recursive: true });
mkdirSync(dirname(appDir), { recursive: true });
const secretShellGuards = installSecretShellGuards();

const qualityBar = {
  appDir,
  appName,
  bundleId,
  boilerplateRepo,
  target: "TestFlight-ready iPhone app handoff",
  required: [
    "research uses App Store reviews, Reddit, competitors, and iOS design references",
    "spec candidates are generated independently and merged conservatively",
    "Spec Kitty mission is recorded",
    "SwiftAIBoilerplatePro is extended instead of rebuilding platform infrastructure",
    "Swift 6 strict concurrency is preserved",
    "production and test Swift files stay under 400 lines",
    "SwiftLint, SwiftFormat, Qlty, and secret scanning are wired as blocking gates",
    "xcodebuild build and xcodebuild test run in the macOS lane",
    "Appium/XCUITest exploratory tapper clicks every reachable enabled button/control",
    "App Store 4.3 hardening checks release strings and metadata",
    "Mobbin, if used, is pattern research only and credentials remain in environment variables",
    "credential availability may be checked only as true/false presence; secret values must never be printed, logged, or written to artifacts",
    "agents must not run environment dump commands such as env, printenv, set, export, or declare -x",
    "final review fanout must approve product fidelity, iOS architecture, security, quality, QA, and release readiness"
  ],
  forbidden: [
    "hardcoded secrets",
    "printing environment variables or credential values in logs",
    "running env, printenv, set, export, declare -x, or echoing secret-like variables",
    "writing API tokens, passwords, cookies, OAuth credentials, or base64 auth blobs to workflow artifacts",
    "fake fixture-only research without marking the limitation",
    "rebuilding auth, payments, AI, storage, networking, localization, settings, or design system without ADR approval",
    "declaring iOS validation complete without macOS or GitHub Actions evidence",
    "skipping Appium exploratory evidence unless allow_macos_deferred is explicit"
  ]
};

writeFileSync(resolve(root, "quality-bar.json"), `${JSON.stringify(qualityBar, null, 2)}\n`);
writeFileSync(
  resolve(root, "context.md"),
  `# iPhone App Factory Context\n\nApp: ${appName}\nBundle ID: ${bundleId}\nOutput: ${appDir}\nBoilerplate: ${boilerplateRepo}\n\nUse the quality bar in quality-bar.json as blocking requirements.\n`
);

console.log(JSON.stringify({ ok: true, appDir, appName, bundleId, boilerplateRepo, secretShellGuards }));
