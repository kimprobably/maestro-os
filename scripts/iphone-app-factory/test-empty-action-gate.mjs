#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const gate = "scripts/iphone-app-factory/empty-action-gate.mjs";

function write(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function runGate(appDir, root) {
  try {
    const stdout = execFileSync("node", [gate, appDir], {
      cwd: process.cwd(),
      env: { ...process.env, FEATURE_WORKFLOW_ROOT: root },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, report: JSON.parse(readFileSync(join(root, "validation/empty-action-gate.json"), "utf8")) };
  } catch (error) {
    return {
      status: error.status,
      stderr: error.stderr?.toString() || "",
      report: JSON.parse(readFileSync(join(root, "validation/empty-action-gate.json"), "utf8")),
    };
  }
}

test("empty action gate ignores inherited docs, design previews, and profile boilerplate", () => {
  const temp = mkdtempSync(join(tmpdir(), "empty-action-gate-"));
  try {
    const appDir = join(temp, "apps/waketask-ios");
    const root = join(temp, ".workflow/existing-app-feature");
    write(join(appDir, "docs/examples/Examples.swift"), "import SwiftUI\nButton(\"Demo\") {}\n");
    write(join(appDir, "Packages/DesignSystem/Sources/DesignSystem/Components/Preview.swift"), "import SwiftUI\nButton(\"Preview\") {}\n");
    write(join(appDir, "SwiftAIBoilerplatePro/AppShell/ProfileView.swift"), "import SwiftUI\nButton(\"Profile\") {}\n");
    write(join(appDir, "SwiftAIBoilerplatePro/AppShell/Wake/WakeDashboardView.swift"), "import SwiftUI\nButton(\"Start\") {}\n");

    const result = runGate(appDir, root);

    assert.equal(result.status, 1);
    assert.equal(result.report.findings.length, 1);
    assert.match(result.report.findings[0].path, /WakeDashboardView\.swift$/);
    assert.equal(result.report.ignored.length, 3);
  } finally {
    rmSync(temp, { force: true, recursive: true });
  }
});

test("empty action gate passes when app-specific controls are wired", () => {
  const temp = mkdtempSync(join(tmpdir(), "empty-action-gate-"));
  try {
    const appDir = join(temp, "apps/waketask-ios");
    const root = join(temp, ".workflow/existing-app-feature");
    write(join(appDir, "docs/examples/Examples.swift"), "import SwiftUI\nButton(\"Demo\") {}\n");
    write(join(appDir, "SwiftAIBoilerplatePro/AppShell/Wake/WakeDashboardView.swift"), "import SwiftUI\nButton(\"Start\") { startMission() }\nfunc startMission() {}\n");

    const result = runGate(appDir, root);

    assert.equal(result.status, 0);
    assert.equal(result.report.findings.length, 0);
    assert.equal(result.report.ignored.length, 1);
  } finally {
    rmSync(temp, { force: true, recursive: true });
  }
});
