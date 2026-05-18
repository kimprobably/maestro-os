#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function parseArgs(argv) {
  const args = {
    index: "reports/eval-index.json",
    out: "reports/eval-dashboard.md",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error(`unknown argument ${arg}`);
    const key = arg.slice(2);
    if (!(key in args)) throw new Error(`unknown argument ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);
    args[key] = value;
    index += 1;
  }

  return args;
}

function blockingIssues(index) {
  const issues = [];

  for (const missing of index.missing || []) {
    if (missing.blocking) {
      issues.push({ eval_id: missing.eval_id, reason: missing.reason || "missing blocking result" });
    }
  }

  for (const entry of index.evals || []) {
    if (!entry.blocking || !entry.result) continue;
    if (entry.result.gate_status === "waived" || entry.result.waiver_status === "accepted") continue;
    if (entry.result.gate_status === "fallback_only") {
      issues.push({ eval_id: entry.id, reason: "fallback_only without waiver" });
    } else if (entry.result.gate_status === "failed" || entry.result.passed !== true) {
      issues.push({ eval_id: entry.id, reason: entry.result.gate_status || "failed" });
    }
  }

  return issues;
}

function renderDashboard(index) {
  const summary = index.summary || {};
  const issues = blockingIssues(index);
  const issueLines = issues.length
    ? issues.map((issue) => `- ${issue.eval_id}: ${issue.reason}`)
    : ["No blocking issues."];

  return `# Eval Dashboard

Generated: ${index.created_at || ""}

## Summary

| Metric | Count |
| --- | ---: |
| Registered | ${summary.total_registered ?? 0} |
| Blocking | ${summary.blocking_registered ?? 0} |
| Present Results | ${summary.present_results ?? 0} |
| Passed | ${summary.passed ?? 0} |
| Failed | ${summary.failed ?? 0} |
| Fallback Only | ${summary.fallback_only ?? 0} |
| Waived | ${summary.waived ?? 0} |
| Missing Blocking | ${summary.missing_blocking ?? 0} |

## Blocking Issues

${issueLines.join("\n")}
`;
}

function writeTextFile(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const index = JSON.parse(readFileSync(args.index, "utf8"));
  writeTextFile(args.out, renderDashboard(index));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
