import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(import.meta.dirname, "..", "..");
const phaseGate = join(repoRoot, "scripts/iphone-app-factory/phase-evidence-gate.mjs");
const bootstrap = join(repoRoot, "scripts/iphone-app-factory/bootstrap.mjs");

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "iphone-factory-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runNode(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

test("phase evidence gate rejects blocked phase evidence", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-factory/evidence/foundation.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Foundation Evidence

## Files changed
- .workflow/iphone-app-factory/evidence/foundation.md

## Commands run
- rg --files apps/waketask-iphone

## Acceptance criteria
- [ ] App name and bundle ID updated across project and targets.

Status: blocked by permissions before implementation.

## Risks
- Blocking: app files are not writable.
`
    );

    const result = runNode(phaseGate, ["foundation", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /blocked|unchecked acceptance/i);
  });
});

test("phase evidence gate requires verifier notes before advancing", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-factory/evidence/core.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Core Evidence

## Files changed
- apps/waketask-iphone/Packages/Core/Sources/Core/WakeTask.swift

## Commands run
- swift test

## Acceptance criteria
- [x] Domain models added.

## Risks
- None known.
`
    );

    const result = runNode(phaseGate, ["core", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Verifier notes/i);
  });
});

test("phase evidence gate accepts completed verified phase evidence", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-factory/evidence/interface.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Interface Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/WakeTaskView.swift

## Commands run
- swift test

## Acceptance criteria
- [x] WakeTask UI surfaces added.

## Risks
- None known.

## Verifier notes
- Scope is acceptable and complete for this phase.
`
    );

    const result = runNode(phaseGate, ["interface", "apps/waketask-iphone"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);
  });
});

test("phase evidence gate reads visual-system evidence from UX Studio evidence directory", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Visual System Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/DesignSystem/AppTheme.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Visual tokens and app-specific components are implemented.

## Risks
- None known.

## Verifier notes
- Scope is acceptable and complete for this phase.
`
    );

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);
    const gateReport = readFileSync(
      join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system-gate.json"),
      "utf8"
    );
    assert.match(gateReport, /"phase": "visual-system"/);
  });
});

test("phase evidence gate allows accepted evidence with nonblocking command failures", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Visual System Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/DesignSystem/AppTheme.swift

## Commands run
- swift test in apps/waketask-iphone/Packages/DesignSystem (failed: swift command not found in worker)

## Acceptance criteria
- [x] Visual tokens and app-specific components are implemented.

## Risks
- swift toolchain is unavailable in this worker, so package tests could not be executed locally in this pass.

## Verifier notes
- Accepted by independent verifier: reviewed DesignSystem diffs, evidence commands, and preview state coverage; phase scope is acceptable to advance.
`
    );

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);
  });
});

test("phase evidence gate uses latest verifier decision when retry history is preserved", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Visual System Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/DesignSystem/AppTheme.swift

## Commands run
- swift test in apps/waketask-iphone/Packages/DesignSystem (failed: swift command not found in worker)

## Acceptance criteria
- [x] Visual tokens and app-specific components are implemented.

## Risks
- swift toolchain is unavailable in this worker, so package tests could not be executed locally in this pass.

## Verifier notes
- Rejected by independent verifier: retry visual-system because Dynamic Type evidence is missing.
- Accepted by independent verifier: reviewed the retry evidence, resolved Dynamic Type coverage, and phase scope is acceptable to advance.
`
    );

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);
  });
});

test("phase evidence gate rejects when latest verifier decision is rejection", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Visual System Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/DesignSystem/AppTheme.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Visual tokens and app-specific components are implemented.

## Risks
- None known.

## Verifier notes
- Accepted by independent verifier: reviewed files and phase scope is acceptable to advance.
- Rejected by independent verifier: retry visual-system because VoiceOver evidence is missing.
`
    );

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /verifier notes reject phase/i);
  });
});

test("phase evidence gate reads screen-flows evidence from UX Studio evidence directory", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/screen-flows.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Screen Flows Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/Features/Tasks/TaskFlowView.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Selected UX direction is implemented across required screens.

## Risks
- None known.

## Verifier notes
- Scope is acceptable and complete for this phase.
`
    );

    const result = runNode(phaseGate, ["screen-flows", "apps/waketask-iphone"], dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok":true/);
    const gateReport = readFileSync(
      join(dir, ".workflow/iphone-app-ux-studio/evidence/screen-flows-gate.json"),
      "utf8"
    );
    assert.match(gateReport, /"phase": "screen-flows"/);
  });
});

test("phase evidence gate rejects UX Studio verifier notes that need another implementation pass", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Visual System Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/DesignSystem/AppTheme.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Visual tokens and app-specific components are implemented.

## Risks
- None known.

## Verifier notes
- Needs another implementation pass.
`
    );

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /verifier notes reject phase/i);
  });
});

test("phase evidence gate rejects verifier notes even when known deferred work exists", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/screen-flows.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Screen Flows Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/Features/Tasks/TaskFlowView.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Selected UX direction is implemented across required screens.

## Risks
- Known deferred: App Store screenshots will be generated by hosted macOS CI.

## Verifier notes
- Needs another implementation pass.
`
    );

    const result = runNode(phaseGate, ["screen-flows", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /verifier notes reject phase/i);
  });
});

test("phase evidence gate requires verifier notes even when known deferred work exists", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/screen-flows.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Screen Flows Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/Features/Tasks/TaskFlowView.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Selected UX direction is implemented across required screens.

## Risks
- Known deferred: App Store screenshots will be generated by hosted macOS CI.
`
    );

    const result = runNode(phaseGate, ["screen-flows", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing Verifier notes/i);
  });
});

test("phase evidence gate rejects pending independent verifier notes", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    const evidence = join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system.md");
    mkdirSync(appDir, { recursive: true });
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(
      evidence,
      `# Visual System Evidence

## Files changed
- apps/waketask-iphone/SwiftAIBoilerplatePro/DesignSystem/AppTheme.swift

## Commands run
- xcodebuild test

## Acceptance criteria
- [x] Visual tokens and app-specific components are implemented.

## Risks
- None known.

## Verifier notes
- Pending independent verifier.
`
    );

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /verifier notes reject phase/i);
  });
});

test("phase evidence gate writes structured report when UX Studio evidence is missing", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    mkdirSync(appDir, { recursive: true });

    const result = runNode(phaseGate, ["visual-system", "apps/waketask-iphone"], dir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /missing evidence/i);
    const gateReport = readFileSync(
      join(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system-gate.json"),
      "utf8"
    );
    assert.match(gateReport, /"ok": false/);
    assert.match(gateReport, /missing evidence/);
  });
});

test("bootstrap normalizes extracted boilerplate permissions before rebrand", () => {
  withTempDir((dir) => {
    const archiveRoot = join(dir, "archive/SwiftAIBoilerplatePro-Distribution");
    const vendor = join(dir, "vendor");
    mkdirSync(join(archiveRoot, "Config"), { recursive: true });
    mkdirSync(join(archiveRoot, "SwiftAIBoilerplatePro.xcodeproj"), { recursive: true });
    for (const pkg of ["Core", "Networking", "Storage", "DesignSystem", "Localization"]) {
      mkdirSync(join(archiveRoot, "Packages", pkg), { recursive: true });
    }
    writeFileSync(
      join(archiveRoot, "Config/App.xcconfig"),
      "PRODUCT_NAME = BrandReadyAI\nPRODUCT_BUNDLE_IDENTIFIER = com.brandready.ai\n"
    );
    writeFileSync(join(archiveRoot, "Config/._App.xcconfig"), "appledouble");
    writeFileSync(join(archiveRoot, "SwiftAIBoilerplatePro.xcodeproj/project.pbxproj"), "// project\n");
    chmodSync(join(archiveRoot, "Config/App.xcconfig"), 0o444);

    mkdirSync(vendor, { recursive: true });
    const tarResult = spawnSync(
      "tar",
      [
        "-czf",
        join(vendor, "SwiftAIBoilerplatePro-Distribution.tar.gz"),
        "-C",
        join(dir, "archive"),
        "SwiftAIBoilerplatePro-Distribution"
      ],
      { encoding: "utf8" }
    );
    assert.equal(tarResult.status, 0, tarResult.stderr);

    const result = runNode(
      bootstrap,
      ["--app-dir", "apps/waketask-iphone", "--app-name", "WakeTask", "--bundle-id", "com.keen.waketask"],
      dir
    );

    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.appleDoubleCleanup.remaining_count, 0);
    const appConfig = readFileSync(join(dir, "apps/waketask-iphone/Config/App.xcconfig"), "utf8");
    assert.match(appConfig, /PRODUCT_NAME = WakeTask/);
    assert.match(appConfig, /PRODUCT_BUNDLE_IDENTIFIER = com\.keen\.waketask/);
  });
});

test("bootstrap removes AppleDouble files from an existing materialized app", () => {
  withTempDir((dir) => {
    const appDir = join(dir, "apps/waketask-iphone");
    mkdirSync(join(appDir, "Config"), { recursive: true });
    mkdirSync(join(appDir, "SwiftAIBoilerplatePro.xcodeproj"), { recursive: true });
    for (const pkg of ["Core", "Networking", "Storage", "DesignSystem", "Localization"]) {
      mkdirSync(join(appDir, "Packages", pkg), { recursive: true });
    }
    writeFileSync(
      join(appDir, "Config/App.xcconfig"),
      "PRODUCT_NAME = BrandReadyAI\nPRODUCT_BUNDLE_IDENTIFIER = com.brandready.ai\n"
    );
    writeFileSync(join(appDir, "Config/._App.xcconfig"), "appledouble");

    const result = runNode(
      bootstrap,
      ["--app-dir", "apps/waketask-iphone", "--app-name", "WakeTask", "--bundle-id", "com.keen.waketask"],
      dir
    );

    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.appleDoubleCleanup.removed_count, 1);
    assert.equal(report.appleDoubleCleanup.remaining_count, 0);
  });
});
