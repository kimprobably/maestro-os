#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const outputDir = argValue("--out-dir", ".workflow/waketask-product-iteration");
const uxRoot = argValue("--ux-root", ".workflow/iphone-app-ux-studio");
const markdownPath = `${outputDir}/validation-postmortem.md`;
const jsonPath = `${outputDir}/validation-postmortem.json`;
const generatedAt = new Date().toISOString();

const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{12,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{12,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{12,}\b/g,
  /\b(token|password|secret|api[_-]?key|authorization)(\s*[:=]\s*)[^\s,;}]+/gi,
];

function redactString(value) {
  return String(value || "").replace(/\/\/[^/@\s]+@/g, "//[redacted]@").replace(
    new RegExp(secretPatterns.map((pattern) => pattern.source).join("|"), "gi"),
    (match) => {
      if (/^(token|password|secret|api[_-]?key|authorization)/i.test(match)) {
        return match.replace(/([:=]\s*)[^\s,;}]+/, "$1[redacted]");
      }
      return "[redacted]";
    },
  );
}

function sanitize(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]));
  }
  return value;
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return sanitize(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    return {
      parse_error: redactString(error.message),
    };
  }
}

function present(path) {
  return existsSync(path);
}

function summarizeArtifact(path, json = null, options = {}) {
  const available = present(path);
  return {
    path,
    required: options.required !== false,
    present: available,
    ok: typeof json?.ok === "boolean" ? json.ok : null,
    failure_classification: json?.failure_classification || null,
    failures: Array.isArray(json?.failures) ? json.failures.slice(0, 5).map((failure) => redactString(failure)) : [],
  };
}

const artifacts = {
  productSpec: readJson(`${outputDir}/product-spec.json`),
  referencePackGate: readJson(`${uxRoot}/research/reference-pack-gate.json`),
  designTournamentGate: readJson(`${uxRoot}/design/tournament-gate.json`),
  visualSystemGate: readJson(`${uxRoot}/evidence/visual-system-gate.json`),
  screenFlowsGate: readJson(`${uxRoot}/evidence/screen-flows-gate.json`),
  screenshotManifestGate: readJson(`${uxRoot}/screenshots/screenshot-manifest-gate.json`),
  iosRuntimePreflight: readJson(`${uxRoot}/ios-runtime-evidence-preflight.json`),
  publishBranch: readJson(`${uxRoot}/publish-existing-app-branch.json`),
  uxPostmortemGate: readJson(`${uxRoot}/postmortem-gate.json`),
};

const sourceList = [
  summarizeArtifact(`${outputDir}/product-spec.json`, artifacts.productSpec),
  summarizeArtifact(`${uxRoot}/research/reference-pack-gate.json`, artifacts.referencePackGate),
  summarizeArtifact(`${uxRoot}/design/tournament-gate.json`, artifacts.designTournamentGate),
  summarizeArtifact(`${uxRoot}/evidence/visual-system-gate.json`, artifacts.visualSystemGate),
  summarizeArtifact(`${uxRoot}/evidence/screen-flows-gate.json`, artifacts.screenFlowsGate),
  summarizeArtifact(`${uxRoot}/screenshots/screenshot-manifest-gate.json`, artifacts.screenshotManifestGate, { required: false }),
  summarizeArtifact(`${uxRoot}/ios-runtime-evidence-preflight.json`, artifacts.iosRuntimePreflight),
  summarizeArtifact(`${uxRoot}/publish-existing-app-branch.json`, artifacts.publishBranch),
  summarizeArtifact(`${uxRoot}/postmortem-gate.json`, artifacts.uxPostmortemGate),
  { path: `${uxRoot}/postmortem.md`, required: true, present: present(`${uxRoot}/postmortem.md`) },
  { path: `${uxRoot}/evidence/ios-runtime-blocker.md`, required: false, present: present(`${uxRoot}/evidence/ios-runtime-blocker.md`) },
];

const missingRequiredSources = sourceList.filter((source) => source.required && !source.present).map((source) => source.path);
const missingOptionalSources = sourceList.filter((source) => !source.required && !source.present).map((source) => source.path);
const failedGates = sourceList.filter((source) => source.present && source.ok === false);
const publish = artifacts.publishBranch || {};
const runtime = artifacts.iosRuntimePreflight || {};
const runtimeDeferred = Boolean(runtime && runtime.ok === false && runtime.blocker_path);
const branchPushed = Boolean(publish.pushed || (publish.commit_sha && publish.pushed_sha && publish.commit_sha === publish.pushed_sha));
const runBranch = publish.run_branch || process.env.UX_RUN_BRANCH || "unknown";
const pushedSha = publish.pushed_sha || publish.commit_sha || null;

function classifyFailure() {
  if (artifacts.publishBranch && !branchPushed) return "git/metadata";
  const hardGateFailure = failedGates.find((gate) => !gate.path.includes("ios-runtime-evidence-preflight.json"));
  if (hardGateFailure) return hardGateFailure.failure_classification || "quality gate";
  if (runtimeDeferred) return "infra";
  if (missingRequiredSources.length) return "prompt/context";
  return "none";
}

const failureClassification = classifyFailure();
const workflowSucceeded = branchPushed && !failedGates.some((gate) => !gate.path.includes("ios-runtime-evidence-preflight.json"));
const nextAction = workflowSucceeded
  ? "Hermes should monitor Fabro/Hermes ledgers, summarize any blockers, and avoid a full restart unless a green parent status is explicitly required."
  : "Inspect the missing or failed source artifacts, fix the indicated stage, and restart only the smallest justified workflow segment.";

const worked = [
  artifacts.productSpec
    ? "WakeTask product direction was captured as a durable product-spec artifact before implementation."
    : "Product-spec artifact evidence is absent in this workspace.",
  artifacts.referencePackGate?.ok
    ? "UX research passed through the reference-pack gate before design selection."
    : "Reference-pack gate success evidence is absent or incomplete.",
  artifacts.visualSystemGate?.ok
    ? "The visual-system implementation phase passed verifier-backed evidence gating."
    : "Visual-system gate success evidence is absent or incomplete.",
  artifacts.screenFlowsGate?.ok
    ? "The screen-flows implementation phase passed verifier-backed evidence gating."
    : "Screen-flows gate success evidence is absent or incomplete.",
  branchPushed
    ? `The nested WakeTask app checkout was published to ${runBranch}${pushedSha ? ` at ${pushedSha}` : ""}.`
    : "Published app-branch evidence is absent or incomplete.",
];

const failed = [];
if (runtimeDeferred) {
  failed.push(
    "Hosted macOS/iOS runtime screenshot validation was deferred because the runtime lacked reusable screenshot evidence or required Xcode simulator tools.",
  );
}
for (const gate of failedGates) {
  failed.push(`${gate.path} reported failure${gate.failures.length ? `: ${gate.failures.join("; ")}` : "."}`);
}
if (missingRequiredSources.length) {
  failed.push(`Missing required source artifacts: ${missingRequiredSources.join(", ")}.`);
}
if (missingOptionalSources.length) {
  failed.push(`Optional source artifacts not found: ${missingOptionalSources.join(", ")}.`);
}
if (!failed.length) {
  failed.push("No failing UX stage evidence was found in the available artifacts.");
}

const manualVersusFabro = [
  "Fabro-executed: staged product spec, UX research fanout, design tournament, implementation phases, phase gates, branch publishing, and UX postmortem where artifacts are present.",
  "Manual/operator-executed: Hermes handoff, live run classification, turn-limit verification, and restart decisions.",
  runtimeDeferred
    ? "Deferred/manual follow-up: hosted macOS/iOS Appium simulator screenshot validation remains outside the current worker runtime."
    : "No hosted iOS runtime deferral evidence was found.",
];

const workflowChanges = [
  "Keep deterministic writers for required parent contract artifacts so postmortem capture cannot loop on missing files.",
  "Preserve staged child workflows with explicit contracts, artifacts, gates, and postmortem output.",
  "Restart only the smallest justified stage after classifying failures as infra, prompt/context, quality gate, git/metadata, app build/test, or product-spec issue.",
];

const productBacklog = [
  "Validate WakeTask on a hosted macOS/iOS runner with Xcode, Simulator, screenshots, and Appium evidence.",
  "Continue polishing Apple Clock-like alarm setup while avoiding literal copying.",
  "Expand real dismiss missions, loud/ramping/randomized sounds, completion rewards, and shareable result moments.",
  "Keep accountability friend confirmation as a later backlog flow.",
];

const report = {
  ok: true,
  generated_at: generatedAt,
  workflow_succeeded: workflowSucceeded,
  failure_classification: failureClassification,
  missing_sources: missingRequiredSources,
  missing_optional_sources: missingOptionalSources,
  failed_gates: failedGates,
  source_list: sourceList,
  run_branch: runBranch,
  pushed_sha: pushedSha,
  runtime_deferred: runtimeDeferred,
  contract: {
    artifact: markdownPath,
    gate: "validation-postmortem",
    next_action: nextAction,
    failure_classification: failureClassification,
  },
  waketask: {
    postmortem: markdownPath,
    product_status: workflowSucceeded ? "ux_iteration_published" : "needs_operator_review",
    run_branch: runBranch,
    pushed_sha: pushedSha,
  },
};

const markdown = `# WakeTask Validation Postmortem

Generated at: ${generatedAt}

## Source List

${sourceList.map((source) => `- ${source.present ? "Present" : "Missing"}: ${source.path}`).join("\n")}

## What Worked

${worked.map((item) => `- ${redactString(item)}`).join("\n")}

## What Failed

${failed.map((item) => `- ${redactString(item)}`).join("\n")}

## Manual Versus Fabro Executed

${manualVersusFabro.map((item) => `- ${redactString(item)}`).join("\n")}

## Workflow Changes Needed

${workflowChanges.map((item) => `- ${redactString(item)}`).join("\n")}

## Product Backlog

${productBacklog.map((item) => `- ${redactString(item)}`).join("\n")}

## Next Operator Action

- ${redactString(nextAction)}

## No Secrets

No secrets, tokens, cookies, private keys, session values, or environment variable values were intentionally printed or stored in this validation postmortem.
`;

mkdirSync(dirname(markdownPath), { recursive: true });
writeFileSync(markdownPath, markdown, "utf8");
writeFileSync(jsonPath, `${JSON.stringify(sanitize(report), null, 2)}\n`, "utf8");
