#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(new URL("../..", import.meta.url).pathname);
const gate = join(repoRoot, "scripts/iphone-app-factory/spec-gate.mjs");

function makeRoot() {
  const root = join(tmpdir(), `spec-gate-${process.pid}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(root, ".workflow/iphone-app-factory"), { recursive: true });
  return root;
}

function writeValidFiles(root, specExtra = "", dodExtra = "") {
  const workflowRoot = join(root, ".workflow/iphone-app-factory");
  writeFileSync(join(workflowRoot, "research-synthesis.md"), "# Research\nEvidence summary.\n");
  writeFileSync(join(workflowRoot, "spec-consensus.md"), "# Consensus\nMerged candidate notes.\n");
  writeFileSync(join(workflowRoot, "spec-red-team.md"), "# Red Team\nVERDICT: APPROVED\n");
  writeFileSync(
    join(workflowRoot, "spec.md"),
    `# Product Spec

## Research Evidence
Joni Capture is grounded in the existing Joni agent, the iPhone factory, and the validated no-publish LinkedIn boundary. The app captures rambled ideas, stores them locally, sends explicit non-secret metadata through a configurable ingestion client, and tracks Joni's draft preparation state.

## User Journeys
Tim can launch capture from the lock screen, Action Button, Shortcut, or in-app capture control. A capture creates a local record, transcribes or queues it, submits it to Joni when configured, and shows status from captured through ready for review. A longer interviewer mode captures conversations and produces structured notes in Tim's voice.

## MVP Scope
The MVP includes local audio capture, transcript lifecycle, queue and retry states, fixture and hosted ingestion clients, draft review, Joni activity, analytics snapshots, privacy settings, and interviewer notes. LinkedIn publishing, commenting, direct messages, connections, and account mutation are out of scope.

## Boilerplate Reuse
The implementation must extend SwiftAIBoilerplatePro for app shell, design system, persistence, networking, settings, and secure configuration. It should add Joni-specific modules rather than replacing authentication, networking, storage, localization, or reusable components.

## Design Direction
The first screen is the capture/dashboard tool, with a compact operator-focused interface. Navigation should expose capture queue, drafts, activity, analytics, interviewer mode, and settings without marketing copy or decorative landing-page structure.

## Acceptance Criteria
- Captures can be started from app intent, shortcut/action-button path, and in-app control.
- Capture records persist locally with tenant scope.
- Transcript states include pending, failed, queued, submitted, classifying, drafting, evaluating, ready, and needs attention.
- Draft detail displays post type, angle, hook, draft, eval notes, evidence, and explicit approval state.
- Analytics are labeled fixture/local unless live sources are configured.
- Hosted endpoints and tokens are configurable without committed secrets.

## Appium Exploratory QA
The exploratory pass must launch the iOS app, traverse tabs and reachable controls, exercise capture, retry, draft detail, export/share, analytics, interviewer mode, and settings, then write a JSON report with screens visited, controls tapped, crashes, failures, and failure details.

## App Store Readiness
The app differentiates as a private Joni-linked creator workflow rather than a generic recorder or AI wrapper. It must not include copied competitor visuals, misleading live LinkedIn claims, unsafe account mutation, or template legal/release copy.

## Definition of Done
Release readiness requires implemented capture and dashboard flows, honest analytics labeling, no LinkedIn mutation, SwiftAIBoilerplatePro reuse evidence, Swift 6 build/test evidence, lint/format/quality checks, secret scan, Appium/XCUITest report, App Store hardening report, and final review approval.

${specExtra}
`.repeat(2),
  );
  writeFileSync(
    join(workflowRoot, "definition-of-done.md"),
    `# Definition of Done

- Product spec maps to implemented capture, draft, analytics, interviewer, and settings flows.
- Joni ingestion has fixture and hosted-configurable clients, with no committed secrets.
- Local persistence survives app restart and failed submission retry.
- SwiftAIBoilerplatePro app shell, design system, networking, persistence, and settings remain in use.
- SwiftFormat, SwiftLint, Qlty, xcodebuild build, xcodebuild test, and secret scanning are recorded as blocking evidence.
- Appium or XCUITest exploratory automation taps every reachable enabled control and records no crashes.
- App Store 4.3 hardening verifies differentiated copy, no template strings, and no fake live LinkedIn claims.
- Final reviews approve product fidelity, architecture, security/privacy, code quality, QA evidence, and release readiness.

${dodExtra}
`.repeat(2),
  );
}

test("spec gate accepts complete consensus artifacts", () => {
  const root = makeRoot();
  writeValidFiles(root);
  const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("spec gate rejects placeholder consensus artifacts", () => {
  const root = makeRoot();
  writeValidFiles(root, "placeholder content", "");
  const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  const report = JSON.parse(readFileSync(join(root, ".workflow/iphone-app-factory/spec-gate.json"), "utf8"));
  assert.match(report.failures.join("\n"), /placeholder language/);
});
