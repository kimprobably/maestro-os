#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const writer = join(repoRoot, "scripts/iphone-app-factory/write-waketask-validation-postmortem.mjs");

function writeJson(root, relativePath, value) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(root, relativePath, value) {
  const path = join(root, relativePath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, "utf8");
}

test("WakeTask validation postmortem writer captures published UX branch and runtime deferral", () => {
  const dir = mkdtempSync(join(tmpdir(), "waketask-validation-postmortem-"));
  try {
    writeJson(dir, ".workflow/waketask-product-iteration/product-spec.json", {
      app_name: "WakeTask",
      next_action: "run UX workflow",
    });
    writeJson(dir, ".workflow/iphone-app-ux-studio/research/reference-pack-gate.json", { ok: true });
    writeJson(dir, ".workflow/iphone-app-ux-studio/design/tournament-gate.json", { ok: true });
    writeJson(dir, ".workflow/iphone-app-ux-studio/evidence/visual-system-gate.json", { ok: true });
    writeJson(dir, ".workflow/iphone-app-ux-studio/evidence/screen-flows-gate.json", { ok: true });
    writeJson(dir, ".workflow/iphone-app-ux-studio/ios-runtime-evidence-preflight.json", {
      ok: false,
      blocker_path: ".workflow/iphone-app-ux-studio/evidence/ios-runtime-blocker.md",
      failures: ["missing screenshot manifest and no hosted macOS/iOS runtime tools are available"],
    });
    writeJson(dir, ".workflow/iphone-app-ux-studio/publish-existing-app-branch.json", {
      ok: true,
      pushed: true,
      run_branch: "ux-studio/waketask-product-iteration-20260517",
      pushed_sha: "e2bc34353d364c4ac81a8ba467712ae02671103f",
    });
    writeJson(dir, ".workflow/iphone-app-ux-studio/postmortem-gate.json", { ok: true });
    writeText(dir, ".workflow/iphone-app-ux-studio/postmortem.md", "# UX Postmortem\n");
    writeText(dir, ".workflow/iphone-app-ux-studio/evidence/ios-runtime-blocker.md", "# Runtime Blocker\n");

    const result = spawnSync(process.execPath, [writer], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const markdownPath = join(dir, ".workflow/waketask-product-iteration/validation-postmortem.md");
    const jsonPath = join(dir, ".workflow/waketask-product-iteration/validation-postmortem.json");
    assert.ok(existsSync(markdownPath), "Expected validation postmortem Markdown");
    assert.ok(existsSync(jsonPath), "Expected validation postmortem JSON");

    const markdown = readFileSync(markdownPath, "utf8");
    for (const heading of [
      "Source List",
      "What Worked",
      "What Failed",
      "Manual Versus Fabro Executed",
      "Workflow Changes Needed",
      "Product Backlog",
      "Next Operator Action",
      "No Secrets",
    ]) {
      assert.match(markdown, new RegExp(`## ${heading}`));
    }
    assert.match(markdown, /ux-studio\/waketask-product-iteration-20260517/);
    assert.match(markdown, /e2bc34353d364c4ac81a8ba467712ae02671103f/);

    const report = JSON.parse(readFileSync(jsonPath, "utf8"));
    assert.equal(report.failure_classification, "infra");
    assert.equal(report.runtime_deferred, true);
    assert.equal(report.waketask.product_status, "ux_iteration_published");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
