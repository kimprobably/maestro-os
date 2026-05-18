import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const LEVELS = new Set(["call", "stage", "workflow", "product", "meta"]);
const STATES = new Set(["draft", "calibrating", "blocking", "ratcheted", "quarantined", "deprecated"]);
const RUNNERS = new Set(["promptfoo", "deterministic", "custom", "human-review", "ci"]);
const RESULT_REQUIRED_IDENTITY_FIELDS = ["eval_id", "level", "runner"];
const REQUIRED_WAIVER_FIELDS = [
  "waiver_id",
  "accepted_by",
  "reason",
  "risk_statement",
  "review_by",
  "compensating_control",
];
const REQUIRED_EVAL_FIELDS = [
  "id",
  "level",
  "state",
  "runner",
  "blocking",
  "subject_paths",
  "artifact_patterns",
  "owner",
  "waiver_policy",
];

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseScalar(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null" || trimmed === "~") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((part) => parseScalar(part));
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseRegistryYaml(text) {
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;

    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();

    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;

    if (line.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error(`YAML parse error: list item without list parent: ${rawLine}`);
      }
      const itemText = line.slice(2).trim();
      if (!itemText) {
        const item = {};
        parent.push(item);
        stack.push({ indent, value: item });
        continue;
      }
      const match = itemText.match(/^([A-Za-z_][A-Za-z0-9_]*):(?:\s+(.*)|\s*)$/);
      if (match) {
        const item = {};
        parent.push(item);
        const key = match[1].trim();
        const rest = (match[2] || "").trim();
        if (rest) {
          item[key] = parseScalar(rest);
        } else {
          item[key] = {};
          stack.push({ indent, value: item });
          stack.push({ indent: indent + 2, value: item[key] });
          continue;
        }
        stack.push({ indent, value: item });
        continue;
      }
      parent.push(parseScalar(itemText));
      continue;
    }

    const match = line.match(/^([^:]+):(.*)$/);
    if (!match || Array.isArray(parent)) {
      throw new Error(`YAML parse error: unsupported line: ${rawLine}`);
    }

    const key = match[1].trim();
    const rest = match[2].trim();
    if (rest) {
      parent[key] = parseScalar(rest);
      continue;
    }

    parent[key] = nextMeaningfulLineIsList(text, rawLine) ? [] : {};
    stack.push({ indent, value: parent[key] });
  }

  return root;
}

function nextMeaningfulLineIsList(text, currentRawLine) {
  const lines = text.split(/\r?\n/);
  const index = lines.indexOf(currentRawLine);
  const currentIndent = currentRawLine.match(/^ */)[0].length;
  for (let i = index + 1; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    const indent = raw.match(/^ */)[0].length;
    return indent > currentIndent && raw.trim().startsWith("- ");
  }
  return false;
}

export function loadRegistry(path = "evals/registry.yaml") {
  return parseRegistryYaml(readFileSync(path, "utf8"));
}

export function validateRegistry(registry) {
  const errors = [];
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    return ["registry must be an object"];
  }
  if (!Array.isArray(registry.evals)) {
    return ["registry.evals must be an array"];
  }
  if (registry.version !== 1) {
    errors.push("registry.version must be 1");
  }

  const ids = new Set();
  registry.evals.forEach((entry, index) => {
    const label = nonEmptyString(entry?.id) ? entry.id : `evals[${index}]`;
    if (!isObject(entry)) {
      errors.push(`evals[${index}] must be an object`);
      return;
    }

    for (const field of REQUIRED_EVAL_FIELDS) {
      if (!(field in entry)) errors.push(`${label} missing required field ${field}`);
    }
    if (!nonEmptyString(entry.id)) errors.push(`${label} id must be a non-empty string`);
    if (nonEmptyString(entry.id) && ids.has(entry.id)) errors.push(`${label} duplicates id ${entry.id}`);
    if (nonEmptyString(entry.id)) ids.add(entry.id);
    if (!LEVELS.has(entry.level)) errors.push(`${label} has invalid level ${entry.level}`);
    if (!STATES.has(entry.state)) errors.push(`${label} has invalid state ${entry.state}`);
    if (!RUNNERS.has(entry.runner)) errors.push(`${label} has invalid runner ${entry.runner}`);
    if (typeof entry.blocking !== "boolean") errors.push(`${label} blocking must be boolean`);
    if (!Array.isArray(entry.subject_paths) || entry.subject_paths.length === 0) {
      errors.push(`${label} subject_paths must be a non-empty array`);
    } else {
      entry.subject_paths.forEach((path, pathIndex) => {
        if (!nonEmptyString(path)) errors.push(`${label} subject_paths[${pathIndex}] must be a non-empty string`);
      });
    }
    if (!Array.isArray(entry.artifact_patterns) || entry.artifact_patterns.length === 0) {
      errors.push(`${label} artifact_patterns must be a non-empty array`);
    } else {
      entry.artifact_patterns.forEach((pattern, patternIndex) => {
        if (!nonEmptyString(pattern)) errors.push(`${label} artifact_patterns[${patternIndex}] must be a non-empty string`);
      });
    }
    if (!nonEmptyString(entry.owner)) errors.push(`${label} owner must be a non-empty string`);
    if (!isObject(entry.waiver_policy)) errors.push(`${label} waiver_policy must be an object`);
    if (entry.blocking && !entry.meta_eval_id && (!Array.isArray(entry.counterexamples) || entry.counterexamples.length === 0)) {
      errors.push(`${label} blocking eval must have meta_eval_id or counterexamples`);
    }
  });

  return errors;
}

export function validateWaiverMetadata(metadata) {
  const errors = [];
  if (!isObject(metadata?.waiver)) {
    return ["metadata.waiver must be present when waiver_status is accepted"];
  }
  for (const field of REQUIRED_WAIVER_FIELDS) {
    if (!nonEmptyString(metadata.waiver[field])) {
      errors.push(`metadata.waiver.${field} must be a non-empty string`);
    }
  }
  return errors;
}

export function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function sha256File(path) {
  return existsSync(path) ? sha256Text(readFileSync(path)) : null;
}

export function normalizeEvalResult(input) {
  for (const field of RESULT_REQUIRED_IDENTITY_FIELDS) {
    if (!nonEmptyString(input[field])) {
      throw new Error(`normalized eval result missing required field ${field}`);
    }
  }
  if (!LEVELS.has(input.level)) throw new Error(`normalized eval result has invalid level ${input.level}`);
  if (!RUNNERS.has(input.runner)) throw new Error(`normalized eval result has invalid runner ${input.runner}`);

  const runnerStatus = input.runner_status || "not_run";
  const fallbackStatus = input.fallback_status || "not_used";
  const waiverStatus = input.waiver_status || "none";
  if (waiverStatus === "accepted") {
    const waiverErrors = validateWaiverMetadata(input.metadata || {});
    if (waiverErrors.length > 0) {
      throw new Error(`normalized eval result has invalid waiver metadata: ${waiverErrors.join("; ")}`);
    }
  }
  const runnerPassed = runnerStatus === "passed";
  const fallbackPassed = fallbackStatus === "passed";
  const gateStatus = runnerPassed
    ? "passed"
    : waiverStatus === "accepted"
      ? "waived"
      : fallbackPassed
        ? "fallback_only"
        : "failed";

  return {
    schema_version: input.schema_version ?? 1,
    eval_id: input.eval_id,
    level: input.level,
    runner: input.runner,
    fabro_run_id: input.fabro_run_id ?? process.env.FABRO_RUN_ID ?? null,
    workflow: input.workflow ?? null,
    fabro_node: input.fabro_node ?? null,
    git_sha: input.git_sha ?? process.env.GITHUB_SHA ?? null,
    model: input.model ?? null,
    prompt_version: input.prompt_version ?? null,
    dataset_sha256: input.dataset_sha256 ?? null,
    rubric_version: input.rubric_version ?? null,
    evaluator_version: input.evaluator_version ?? null,
    score: input.score ?? null,
    runner_status: runnerStatus,
    fallback_status: fallbackStatus,
    waiver_status: waiverStatus,
    gate_status: gateStatus,
    passed: gateStatus === "passed" || gateStatus === "waived",
    failure_class: input.failure_class ?? null,
    artifact_uris: input.artifact_uris || [],
    parent_eval_id: input.parent_eval_id ?? null,
    metadata: input.metadata || {},
    created_at: input.created_at || new Date().toISOString(),
  };
}

export function writeNormalizedResult(path, input) {
  const normalized = normalizeEvalResult(input);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

export function writeJsonFile(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
