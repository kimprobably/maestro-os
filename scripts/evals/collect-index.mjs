#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { loadRegistry, normalizeEvalResult, validateRegistry, writeJsonFile } from "./eval-lib.mjs";

function parseArgs(argv) {
  const args = {
    registry: "evals/registry.yaml",
    root: ".",
    out: "reports/eval-index.json",
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

function emptyIndex() {
  return {
    schema_version: 1,
    created_at: new Date().toISOString(),
    summary: {
      total_registered: 0,
      blocking_registered: 0,
      present_results: 0,
      passed: 0,
      failed: 0,
      fallback_only: 0,
      waived: 0,
      missing_blocking: 0,
    },
    evals: [],
    missing: [],
    issues: [],
  };
}

function findJsonFiles(dir) {
  if (!existsSync(dir)) return [];

  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...findJsonFiles(path));
    } else if (stats.isFile() && path.endsWith(".json")) {
      files.push(path);
    }
  }

  return files.sort();
}

function isLaterResult(candidate, current) {
  if (candidate.created_at && current.created_at) {
    return candidate.created_at > current.created_at;
  }
  return candidate.path > current.path;
}

function parseResultFile(path, root, issues) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    issues.push({
      type: "malformed_result_json",
      path: relative(root, path),
      message: error.message,
    });
    return null;
  }

  try {
    const normalized = normalizeEvalResult(parsed);
    return {
      ...normalized,
      created_at: typeof parsed.created_at === "string" ? parsed.created_at : null,
      filepath: path,
      path: relative(root, path),
    };
  } catch (error) {
    issues.push({
      type: "invalid_normalized_result",
      path: relative(root, path),
      message: error.message,
    });
    return null;
  }
}

function escapeRegex(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegex(pattern) {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];
    if (char === "*" && next === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else {
      source += escapeRegex(char);
    }
  }
  return new RegExp(`(^|/)${source}$`);
}

function valueVariants(value, root) {
  const variants = new Set([String(value)]);
  const absoluteRoot = resolve(root);
  const absoluteValue = resolve(String(value));
  if (absoluteValue.startsWith(`${absoluteRoot}/`)) {
    variants.add(relative(absoluteRoot, absoluteValue));
  }
  return [...variants];
}

function patternMatchesValue(pattern, value, root) {
  const regex = globToRegex(pattern);
  return valueVariants(value, root).some((variant) => regex.test(variant));
}

function resultMatchesRegistry(entry, result, root) {
  const errors = [];
  if (result.level !== entry.level) errors.push(`level mismatch: registry=${entry.level} result=${result.level}`);
  if (result.runner !== entry.runner) errors.push(`runner mismatch: registry=${entry.runner} result=${result.runner}`);
  if (entry.workflow && result.workflow !== entry.workflow) {
    errors.push(`workflow mismatch: registry=${entry.workflow} result=${result.workflow || "missing"}`);
  }
  if (entry.fabro_node && result.fabro_node !== entry.fabro_node) {
    errors.push(`fabro_node mismatch: registry=${entry.fabro_node} result=${result.fabro_node || "missing"}`);
  }

  const artifactValues = [result.path, ...(result.artifact_uris || [])].filter(Boolean);
  const hasMatchingArtifact = (entry.artifact_patterns || []).some((pattern) => {
    return artifactValues.some((value) => patternMatchesValue(pattern, value, root));
  });
  if (!hasMatchingArtifact) {
    errors.push("no result path or artifact_uri matches registry artifact_patterns");
  }

  return errors;
}

function buildIndex(registry, root, issues) {
  const index = emptyIndex();
  index.issues = issues;
  index.summary.total_registered = registry.evals.length;
  index.summary.blocking_registered = registry.evals.filter((entry) => entry.blocking).length;

  const resultsByEvalId = new Map();
  for (const file of findJsonFiles(join(root, "reports", "evals"))) {
    const result = parseResultFile(file, root, index.issues);
    if (!result) continue;
    const results = resultsByEvalId.get(result.eval_id) || [];
    results.push(result);
    resultsByEvalId.set(result.eval_id, results);
  }

  for (const entry of registry.evals) {
    let result = null;
    for (const candidate of resultsByEvalId.get(entry.id) || []) {
      const matchErrors = resultMatchesRegistry(entry, candidate, root);
      if (matchErrors.length > 0) {
        index.issues.push({
          type: "result_registry_mismatch",
          eval_id: entry.id,
          path: candidate.path,
          messages: matchErrors,
        });
        continue;
      }
      if (!result || isLaterResult(candidate, result)) result = candidate;
    }
    const item = {
      id: entry.id,
      level: entry.level,
      runner: entry.runner,
      blocking: entry.blocking,
      state: entry.state,
      owner: entry.owner,
      result: result
        ? {
            path: result.path,
            created_at: result.created_at,
            gate_status: result.gate_status,
            passed: result.passed,
            runner_status: result.runner_status,
            fallback_status: result.fallback_status,
            waiver_status: result.waiver_status,
            artifact_uris: result.artifact_uris,
          }
        : null,
    };

    if (!result) {
      item.status = "missing";
      if (entry.blocking) {
        index.summary.missing_blocking += 1;
        index.missing.push({
          eval_id: entry.id,
          blocking: true,
          reason: "missing blocking result",
        });
      }
      index.evals.push(item);
      continue;
    }

    index.summary.present_results += 1;
    if (result.gate_status === "passed") index.summary.passed += 1;
    if (result.gate_status === "failed") index.summary.failed += 1;
    if (result.gate_status === "fallback_only") index.summary.fallback_only += 1;
    if (result.gate_status === "waived" || result.waiver_status === "accepted") index.summary.waived += 1;

    item.status = result.gate_status;
    index.evals.push(item);
  }

  return index;
}

function hasBlockingFailure(index) {
  return index.evals.some((entry) => {
    if (!entry.blocking) return false;
    if (!entry.result) return true;
    if (entry.result.gate_status === "waived" || entry.result.waiver_status === "accepted") return false;
    return entry.result.gate_status === "failed" || entry.result.gate_status === "fallback_only" || entry.result.passed !== true;
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const issues = [];
  let registry;

  try {
    registry = loadRegistry(args.registry);
  } catch (error) {
    const index = emptyIndex();
    index.issues.push({
      type: "registry_load_error",
      path: args.registry,
      message: error.message,
    });
    writeJsonFile(args.out, index);
    return 1;
  }

  const registryErrors = validateRegistry(registry);
  if (registryErrors.length > 0) {
    const index = emptyIndex();
    index.issues.push(
      ...registryErrors.map((message) => ({
        type: "registry_validation_error",
        path: args.registry,
        message,
      })),
    );
    if (Array.isArray(registry.evals)) {
      index.summary.total_registered = registry.evals.length;
      index.summary.blocking_registered = registry.evals.filter((entry) => entry?.blocking).length;
    }
    writeJsonFile(args.out, index);
    return 1;
  }

  const index = buildIndex(registry, args.root, issues);
  writeJsonFile(args.out, index);
  return hasBlockingFailure(index) ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
