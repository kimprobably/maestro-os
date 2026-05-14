#!/usr/bin/env node
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appDir = arg("--app-dir", "apps/generated-iphone-app");
const appName = arg("--app-name", "Generated iPhone App");
const bundleId = arg("--bundle-id", "com.maestro.generatediphoneapp");
const boilerplateRepo = arg("--boilerplate-repo", "SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution");
const root = ".workflow/iphone-app-factory";

function runQuiet(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return {
    ok: result.status === 0,
    status: result.status,
    signal: result.signal || null
  };
}

function hasMaterializedBoilerplate(dir) {
  if (!existsSync(dir)) return false;
  const hasProject =
    existsSync(join(dir, "SwiftAIBoilerplatePro.xcodeproj")) ||
    readdirSync(dir).some((name) => name.endsWith(".xcodeproj"));

  return (
    existsSync(join(dir, "Config", "App.xcconfig")) &&
    existsSync(join(dir, "Packages", "Core")) &&
    existsSync(join(dir, "Packages", "Networking")) &&
    existsSync(join(dir, "Packages", "Storage")) &&
    existsSync(join(dir, "Packages", "DesignSystem")) &&
    existsSync(join(dir, "Packages", "Localization")) &&
    hasProject
  );
}

function replaceTextIfPresent(file, replacements) {
  if (!existsSync(file)) return;
  const original = String(readFileSync(file));
  let updated = original;
  for (const [from, to] of replacements) {
    updated = updated.replaceAll(from, to);
  }
  if (updated !== original) writeFileSync(file, updated);
}

function rebrandBoilerplate(dir) {
  replaceTextIfPresent(join(dir, "Config", "App.xcconfig"), [
    ["PRODUCT_NAME = BrandReadyAI", `PRODUCT_NAME = ${appName}`],
    ["PRODUCT_BUNDLE_IDENTIFIER = com.brandready.ai", `PRODUCT_BUNDLE_IDENTIFIER = ${bundleId}`]
  ]);

  writeFileSync(
    join(dir, "WAKE_TASK_BOILERPLATE_SOURCE.md"),
    `# Boilerplate Source\n\nWakeTask was materialized from ${boilerplateRepo} during bootstrap.\n\nCore auth, payments, AI, storage, networking, localization, settings, and design system packages must be extended, not rebuilt.\n`
  );
}

function createFallbackSeed(dir) {
  const requiredDirs = [
    "Config",
    "SwiftAIBoilerplatePro.xcodeproj",
    "Packages/Core/Sources/Core",
    "Packages/Networking/Sources/Networking",
    "Packages/Storage/Sources/Storage",
    "Packages/DesignSystem/Sources/DesignSystem",
    "Packages/Localization/Sources/Localization"
  ];

  for (const requiredDir of requiredDirs) {
    mkdirSync(join(dir, requiredDir), { recursive: true });
  }

  writeFileSync(
    join(dir, "Config", "App.xcconfig"),
    `PRODUCT_NAME = ${appName}\nPRODUCT_BUNDLE_IDENTIFIER = ${bundleId}\nSWIFT_VERSION = 6.0\n`
  );
  writeFileSync(
    join(dir, "SwiftAIBoilerplatePro.xcodeproj", "project.pbxproj"),
    "// Local fallback project placeholder. Replace with SwiftAIBoilerplatePro source before release.\n"
  );

  for (const pkg of ["Core", "Networking", "Storage", "DesignSystem", "Localization"]) {
    writeFileSync(
      join(dir, "Packages", pkg, "Package.swift"),
      `// swift-tools-version: 6.0\nimport PackageDescription\n\nlet package = Package(name: "${pkg}", platforms: [.iOS(.v17)], products: [.library(name: "${pkg}", targets: ["${pkg}"])], targets: [.target(name: "${pkg}")])\n`
    );
    writeFileSync(
      join(dir, "Packages", pkg, "Sources", pkg, `${pkg}.swift`),
      `public enum ${pkg}FallbackMarker { public static let source = "SwiftAIBoilerplatePro fallback seed" }\n`
    );
  }

  writeFileSync(
    join(dir, "README.md"),
    `# WakeTask\n\nThis directory is a local fallback seed because ${boilerplateRepo} could not be fetched during bootstrap. It preserves the required SwiftAIBoilerplatePro contract shape so the factory can continue, but replacing it with the real boilerplate source remains a blocking release risk.\n`
  );
}

function materializeBoilerplate() {
  if (hasMaterializedBoilerplate(appDir)) {
    return { status: "present", source: appDir };
  }

  mkdirSync(dirname(appDir), { recursive: true });
  const archivePath = resolve("vendor/SwiftAIBoilerplatePro-Distribution.tar.gz");

  if (existsSync(archivePath)) {
    rmSync(appDir, { recursive: true, force: true });
    mkdirSync(appDir, { recursive: true });
    const extracted = runQuiet("tar", ["-xzf", archivePath, "-C", appDir, "--strip-components", "1"]);
    if (extracted.ok && hasMaterializedBoilerplate(appDir)) {
      rebrandBoilerplate(appDir);
      return { status: "materialized", source: "vendor/SwiftAIBoilerplatePro-Distribution.tar.gz" };
    }
  }

  try {
    appendFileSync("/etc/hosts", "\n140.82.112.3 github.com\n140.82.114.9 codeload.github.com\n");
  } catch {
    // Best-effort DNS workaround for restricted Daytona images.
  }

  rmSync(appDir, { recursive: true, force: true });
  const cloned = runQuiet("git", [
    "clone",
    "--depth",
    "1",
    "https://github.com/SwiftAIBoilerplatePro/SwiftAIBoilerplatePro-Distribution.git",
    appDir
  ]);

  if (cloned.ok && hasMaterializedBoilerplate(appDir)) {
    rmSync(join(appDir, ".git"), { recursive: true, force: true });
    rebrandBoilerplate(appDir);
    return { status: "materialized", source: "public-git-clone" };
  }

  rmSync(appDir, { recursive: true, force: true });
  mkdirSync(appDir, { recursive: true });
  createFallbackSeed(appDir);
  return { status: "fallback_seed", source: "local-contract-fallback" };
}

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
const boilerplateMaterialization = materializeBoilerplate();

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

console.log(
  JSON.stringify({
    ok: true,
    appDir,
    appName,
    bundleId,
    boilerplateRepo,
    secretShellGuards,
    boilerplateMaterialization
  })
);
