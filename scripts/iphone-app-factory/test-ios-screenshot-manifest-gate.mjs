#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const gate = join(repoRoot, "scripts/iphone-app-factory/ios-screenshot-manifest-gate.mjs");
const manifestPath = "reports/ios/screenshots/manifest.json";
const defaultOutPath = ".workflow/iphone-app-ux-studio/screenshots/screenshot-manifest-gate.json";
const requiredScreenKeys = [
  "onboarding",
  "home",
  "primary_list",
  "create_edit",
  "active_task",
  "completion",
  "history_streaks",
  "profile_settings",
  "paywall_subscription",
];

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "ios-screenshot-manifest-gate-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function screen(screenKey, overrides = {}) {
  return {
    screen_key: screenKey,
    phase: "after",
    image_path: `reports/ios/screenshots/after/${screenKey}.png`,
    width: 1179,
    height: 2556,
    blank_score: 0.05,
    text_clipping_risk: false,
    redesigned: false,
    ...overrides,
  };
}

function validManifest(overrides = {}) {
  return {
    screens: requiredScreenKeys.map((screenKey) => screen(screenKey)),
    ...overrides,
  };
}

function writeManifest(dir, manifest) {
  const absoluteManifestPath = join(dir, manifestPath);
  mkdirSync(dirname(absoluteManifestPath), { recursive: true });
  writeFileSync(absoluteManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeScreenshotFiles(dir, manifest) {
  for (const entry of manifest.screens || []) {
    if (typeof entry.image_path !== "string" || entry.image_path.trim() === "") continue;
    if (!entry.image_path.startsWith("reports/ios/screenshots/")) continue;
    if (entry.image_path.includes("..") || entry.image_path.includes("?") || entry.image_path.includes("#")) continue;
    const imagePath = join(dir, entry.image_path);
    mkdirSync(dirname(imagePath), { recursive: true });
    writeFileSync(imagePath, "screenshot fixture\n");
  }
}

function runGate(cwd, args = [], options = {}) {
  return spawnSync(process.execPath, [
    gate,
    "--manifest",
    manifestPath,
    "--phase",
    "after",
    ...args,
  ], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
}

function readDefaultReport(cwd) {
  return JSON.parse(readFileSync(join(cwd, defaultOutPath), "utf8"));
}

test("accepts a complete after screenshot manifest and writes the default gate report", () => {
  withTempDir((dir) => {
    const manifest = validManifest();
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.equal(result.status, 0, result.stderr);
    const report = readDefaultReport(dir);
    assert.equal(report.ok, true);
    assert.equal(report.phase, "after");
    assert.deepEqual(report.required_screen_keys, requiredScreenKeys);
    assert.equal(report.required_screen_keys.includes("history_streaks"), true);
    assert.equal(report.checked_screens.length, requiredScreenKeys.length);
    assert.deepEqual(report.failures, []);
  });
});

test("fails when a required after screen is missing", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys
        .filter((screenKey) => screenKey !== "completion")
        .map((screenKey) => screen(screenKey)),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing required screen completion/);
    assert.equal(readDefaultReport(dir).ok, false);
  });
});

test("fails when an image path is missing", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "home" ? screen(screenKey, { image_path: "" }) : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /home.*missing image_path/);
  });
});

test("fails when width or height is zero", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "active_task" ? screen(screenKey, { width: 0, height: 2556 }) : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /active_task.*width and height must be greater than zero/);
  });
});

test("fails when blank_score is at or above the default threshold", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "primary_list" ? screen(screenKey, { blank_score: 0.95 }) : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /primary_list.*blank_score 0\.95 is >= 0\.95/);
  });
});

test("allows a stricter blank_score threshold override", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "primary_list" ? screen(screenKey, { blank_score: 0.5 }) : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir, ["--max-blank-score", "0.5"]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /primary_list.*blank_score 0\.5 is >= 0\.5/);
  });
});

test("fails when text_clipping_risk is true", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "create_edit" ? screen(screenKey, { text_clipping_risk: true }) : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /create_edit.*text_clipping_risk is true/);
  });
});

test("fails when a redesigned screen has no before and after pair when required", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "paywall_subscription"
          ? screen(screenKey, { redesigned: true })
          : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir, ["--require-before-after", "true"]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /paywall_subscription.*missing before\/after pair/);
  });
});

test("accepts redesigned screens with before and after pairs when required", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: [
        ...requiredScreenKeys.map((screenKey) => (
          screenKey === "home" ? screen(screenKey, { redesigned: true }) : screen(screenKey)
        )),
        screen("home", {
          phase: "before",
          image_path: "reports/ios/screenshots/before/home.png",
          redesigned: true,
        }),
      ],
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir, ["--require-before-after", "true"]);

    assert.equal(result.status, 0, result.stderr);
    const report = readDefaultReport(dir);
    assert.equal(report.ok, true);
    assert.deepEqual(report.redesigned_screen_keys, ["home"]);
  });
});

test("writes report to --out when provided", () => {
  withTempDir((dir) => {
    const outPath = "custom/screenshot-gate.json";
    const manifest = validManifest();
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir, ["--out", outPath]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(dir, outPath)), true);
    assert.equal(JSON.parse(readFileSync(join(dir, outPath), "utf8")).ok, true);
  });
});

test("fails when a referenced screenshot file is missing by default", () => {
  withTempDir((dir) => {
    const manifest = validManifest();
    writeManifest(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /onboarding.*image_path file does not exist/);
  });
});

test("fails when canonical history_streaks screen is missing", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys
        .filter((screenKey) => screenKey !== "history_streaks")
        .map((screenKey) => screen(screenKey)),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing required screen history_streaks/);
  });
});

test("allows missing screenshot files when --skip-file-existence true is explicit", () => {
  withTempDir((dir) => {
    const manifest = validManifest();
    writeManifest(dir, manifest);

    const result = runGate(dir, ["--skip-file-existence", "true"]);

    assert.equal(result.status, 0, result.stderr);
  });
});

test("accepts missing hosted iOS screenshots when deferred validation is explicit", () => {
  withTempDir((dir) => {
    const result = runGate(dir, ["--allow-deferred", "true"]);

    assert.equal(result.status, 0, result.stderr);
    const report = readDefaultReport(dir);
    assert.equal(report.ok, true);
    assert.equal(report.allow_deferred, true);
    assert.equal(report.deferred_to_hosted_ios, true);
    assert.match(report.deferral_reason, /hosted macOS\/iOS/);
    assert.deepEqual(report.failures, []);
  });
});

test("accepts missing hosted iOS screenshots when deferred validation is enabled by env despite templated false", () => {
  withTempDir((dir) => {
    const result = runGate(dir, ["--allow-deferred", "false"], {
      env: { FEATURE_ALLOW_CI_DEFERRED: "true" },
    });

    assert.equal(result.status, 0, result.stderr);
    const report = readDefaultReport(dir);
    assert.equal(report.ok, true);
    assert.equal(report.allow_deferred, true);
    assert.equal(report.deferred_to_hosted_ios, true);
    assert.deepEqual(report.failures, []);
  });
});

test("rejects URL image paths without reporting query or fragment secrets", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "home"
          ? screen(screenKey, { image_path: "https://user:secret@example.com/home.png?token=secret#frag" })
          : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /home.*image_path must be a relative path/);
    assert.doesNotMatch(result.stderr, /secret|token=|#frag/);
    assert.doesNotMatch(JSON.stringify(readDefaultReport(dir)), /secret|token=|#frag/);
  });
});

test("rejects image paths outside reports/ios/screenshots", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "primary_list"
          ? screen(screenKey, { image_path: "reports/ios/primary-list.png" })
          : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /primary_list.*image_path must stay under reports\/ios\/screenshots\//);
  });
});

test("rejects traversal in image paths", () => {
  withTempDir((dir) => {
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "completion"
          ? screen(screenKey, { image_path: "reports/ios/screenshots/after/../completion.png" })
          : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /completion.*image_path must not contain traversal/);
  });
});

test("rejects absolute image paths without leaking path contents", () => {
  withTempDir((dir) => {
    const secretPath = "/tmp/secret-token-abcdef/home.png";
    const manifest = validManifest({
      screens: requiredScreenKeys.map((screenKey) => (
        screenKey === "home"
          ? screen(screenKey, { image_path: secretPath })
          : screen(screenKey)
      )),
    });
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /home.*image_path must be a relative path/);
    assert.doesNotMatch(result.stderr, /secret-token-abcdef|\/tmp\/secret/);
    const reportText = readFileSync(join(dir, defaultOutPath), "utf8");
    assert.doesNotMatch(reportText, /secret-token-abcdef|\/tmp\/secret/);
    const report = JSON.parse(reportText);
    assert.equal(report.checked_screens.find((entry) => entry.screen_key === "home").image_path, "[rejected-image-path]");
  });
});

test("accepts valid existing screenshot files", () => {
  withTempDir((dir) => {
    const manifest = validManifest();
    writeManifest(dir, manifest);
    writeScreenshotFiles(dir, manifest);

    const result = runGate(dir);

    assert.equal(result.status, 0, result.stderr);
    const report = readDefaultReport(dir);
    assert.equal(report.ok, true);
    assert.equal(report.checked_screens.every((entry) => (
      entry.image_path.startsWith("reports/ios/screenshots/")
    )), true);
  });
});
