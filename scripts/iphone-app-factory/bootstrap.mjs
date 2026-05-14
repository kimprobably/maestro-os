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

mkdirSync(root, { recursive: true });
mkdirSync(`${root}/research`, { recursive: true });
mkdirSync(`${root}/evidence`, { recursive: true });
mkdirSync(`${root}/reviews`, { recursive: true });
mkdirSync(dirname(appDir), { recursive: true });

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
    "final review fanout must approve product fidelity, iOS architecture, security, quality, QA, and release readiness"
  ],
  forbidden: [
    "hardcoded secrets",
    "printing environment variables or credential values in logs",
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

console.log(JSON.stringify({ ok: true, appDir, appName, bundleId, boilerplateRepo }));
