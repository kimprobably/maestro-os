#!/usr/bin/env node
import { readFileSync } from "node:fs";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function classifyFailure(text) {
  const source = String(text || "");
  const lowered = source.toLowerCase();
  const signatures = [];

  function seen(name, pattern) {
    if (pattern.test(source)) {
      signatures.push(name);
      return true;
    }
    return false;
  }

  const dns = seen("dns_or_resolution", /dns error|failed to lookup address|failed to resolve address|nodename nor servname/i);
  const daytona = seen("daytona_proxy_or_api", /proxy\.app\.daytona\.io|app\.daytona\.io|Daytona sandbox|sandbox stop failed/i);
  const githubNetwork = seen("github_network", /github\.com.*(network failure|failed to resolve|dns)/i);
  const promptFile = seen("prompt_file_write", /Failed to write prompt file/i);
  const workerExit = seen("worker_no_terminal_event", /Worker exited before emitting a terminal run event/i);
  const metadata = seen("metadata_push_failed", /metadata.*push.*failed|checkpoint_metadata_push_failed/i);
  const appium = seen("appium_evidence", /hardcoded Appium|telemetry_available.?false|Appium.*missing|appium-exploratory-report\.json.*missing/i);
  const rejected = seen("review_or_gate_rejected", /VERDICT:\s*REJECTED|blocking:|quality gate.*fail/i);
  const missingArtifact = seen("missing_artifact", /missing artifact|required.*artifact.*missing|artifact.*absent/i);

  if (workerExit) {
    return {
      failure_class: "control_plane",
      retry_guidance: "Start a clean new Railway run or recover from the latest pushed run branch; do not treat replay/fork history as a fresh run.",
      signatures,
    };
  }

  if (promptFile && (dns || daytona || metadata || lowered.includes("context"))) {
    return {
      failure_class: "control_plane",
      retry_guidance: "Preserve artifacts, reduce/compact prompt context if oversized, then restart from the latest pushed branch or closest retry target.",
      signatures,
    };
  }

  if (dns || daytona || githubNetwork || metadata) {
    return {
      failure_class: "transient_infra",
      retry_guidance: "Retry the same stage after server/network health checks; if retry budget is exhausted, launch a clean run from the latest pushed commit.",
      signatures,
    };
  }

  if (appium || rejected || missingArtifact) {
    return {
      failure_class: "quality_gate",
      retry_guidance: "Inspect the failing artifact or review, patch the smallest responsible surface, rerun the deterministic gate, then resume.",
      signatures,
    };
  }

  if (promptFile) {
    return {
      failure_class: "control_plane",
      retry_guidance: "Treat as orchestrator prompt materialization failure; preserve context and restart from a clean pushed commit.",
      signatures,
    };
  }

  return {
    failure_class: "unknown",
    retry_guidance: "Inspect Fabro events, run projection, git branch, and CI artifacts before retrying.",
    signatures,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const textArg = argValue("--text", null);
  const fileArg = argValue("--file", null);
  const input = textArg ?? (fileArg ? readFileSync(fileArg, "utf8") : readStdin());
  const result = classifyFailure(input);
  console.log(JSON.stringify(result, null, 2));
  if (result.failure_class === "unknown") process.exit(2);
}
