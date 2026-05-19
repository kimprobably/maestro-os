#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { loadRegistry, validateRegistry, writeNormalizedResult } from "./eval-lib.mjs";

const COVERAGE_LEVELS = new Set(["stage", "workflow", "product"]);
const ACTIVE_BLOCKING_STATES = new Set(["blocking", "ratcheted"]);

function parseArgs(argv) {
  const args = {
    registry: "evals/registry.yaml",
    workflows: [],
    evalId: null,
    workflowId: null,
    evalResultOut: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--registry") {
      args.registry = argv[++index];
    } else if (arg === "--workflow") {
      args.workflows.push(argv[++index]);
    } else if (arg === "--eval-id") {
      args.evalId = argv[++index];
    } else if (arg === "--workflow-id") {
      args.workflowId = argv[++index];
    } else if (arg === "--eval-result-out") {
      args.evalResultOut = argv[++index];
    } else {
      throw new Error(`unknown argument ${arg}`);
    }
  }

  if (!args.registry) throw new Error("--registry requires a path");
  if (args.workflows.some((workflow) => !workflow)) throw new Error("--workflow requires a path");
  if (args.workflows.length === 0) throw new Error("at least one --workflow path is required");
  if (args.evalResultOut && !args.evalId) throw new Error("--eval-result-out requires --eval-id");
  if (args.evalResultOut && !args.workflowId) throw new Error("--eval-result-out requires --workflow-id");
  return args;
}

function registrySubjectMatches(subjectPath, workflowPath) {
  if (subjectPath === workflowPath) return true;
  return resolve(subjectPath) === resolve(workflowPath);
}

function displayWorkflowPath(workflowPath) {
  const relativePath = relative(process.cwd(), resolve(workflowPath));
  return relativePath.startsWith("..") ? workflowPath : relativePath;
}

function extractCodexPromptCommands(text) {
  const commands = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!line.includes("run-codex-prompt.mjs")) return;

    const scriptMatch = line.match(/\bscript\s*=\s*"((?:\\"|[^"])*)"/);
    commands.push({
      line: index + 1,
      command: scriptMatch ? scriptMatch[1].replace(/\\"/g, '"') : line.trim(),
    });
  });

  return commands;
}

function splitShellCommands(command) {
  const segments = [];
  let current = "";
  let quote = null;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    const next = command[index + 1];
    if (char === "\\" && index + 1 < command.length) {
      current += char + next;
      index += 1;
      continue;
    }
    if ((char === "\"" || char === "'") && quote === null) {
      quote = char;
      current += char;
      continue;
    }
    if (char === quote) {
      quote = null;
      current += char;
      continue;
    }
    if (!quote && ((char === "&" && next === "&") || char === ";" || char === "\n")) {
      if (current.trim()) segments.push(current.trim());
      current = "";
      if (char === "&") index += 1;
      continue;
    }
    if (!quote && char === "|" && next === "|") {
      if (current.trim()) segments.push(current.trim());
      current = "";
      index += 1;
      continue;
    }
    current += char;
  }

  if (current.trim()) segments.push(current.trim());
  return segments;
}

function tokenizeCommand(command) {
  const tokens = [];
  const regex = /"((?:\\"|[^"])*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = regex.exec(command)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function evalIdForCommand(command) {
  const tokens = tokenizeCommand(command);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--eval-id") return tokens[index + 1] ?? null;
    if (token.startsWith("--eval-id=")) return token.slice("--eval-id=".length) || null;
  }
  return null;
}

function isActiveBlockingEval(entry) {
  return Boolean(entry?.blocking) && ACTIVE_BLOCKING_STATES.has(entry.state);
}

function codexPromptInvocations(command) {
  return splitShellCommands(command)
    .filter((segment) => segment.includes("run-codex-prompt.mjs"))
    .map((segment) => ({
      command: segment,
      eval_id: evalIdForCommand(segment),
    }));
}

function findWorkflowCoverage(registry, workflowPath) {
  return registry.evals.filter((entry) => {
    return (
      isActiveBlockingEval(entry) &&
      COVERAGE_LEVELS.has(entry.level) &&
      Array.isArray(entry.subject_paths) &&
      entry.subject_paths.some((subjectPath) => registrySubjectMatches(subjectPath, workflowPath))
    );
  });
}

function verifyWorkflowCoverage({ registry, workflows }) {
  const callEvalsById = new Map(
    registry.evals
      .filter((entry) => entry.level === "call" && isActiveBlockingEval(entry))
      .map((entry) => [entry.id, entry]),
  );
  const errors = [];
  const workflowSummaries = [];
  let codexPromptCalls = 0;

  for (const workflowPath of workflows) {
    const text = readFileSync(workflowPath, "utf8");
    const commands = extractCodexPromptCommands(text);
    const workflowLabel = displayWorkflowPath(workflowPath);
    codexPromptCalls += commands.length;

    for (const command of commands) {
      const invocations = codexPromptInvocations(command.command);
      for (const invocation of invocations) {
        const evalId = invocation.eval_id;
      if (!evalId) {
        errors.push(`${workflowLabel}:${command.line} run-codex-prompt.mjs command missing --eval-id <id>`);
        continue;
      }

      const entry = callEvalsById.get(evalId);
      if (!entry) {
        errors.push(`${workflowLabel}:${command.line} --eval-id ${evalId} is not registered with level: call`);
      }
      }
    }

    const coverage = findWorkflowCoverage(registry, workflowPath);
    if (coverage.length === 0) {
      errors.push(
        `${workflowLabel} missing registered stage/workflow/product eval with subject_paths including this workflow path`,
      );
    }

    workflowSummaries.push({
      path: workflowPath,
      codex_prompt_calls: commands.length,
      covering_eval_ids: coverage.map((entry) => entry.id),
    });
  }

  return {
    errors,
    summary: {
      ok: errors.length === 0,
      workflows_scanned: workflows.length,
      codex_prompt_calls: codexPromptCalls,
      workflows: workflowSummaries,
    },
  };
}

function writeCoverageEvalResult(args, summary, errors) {
  if (!args.evalResultOut) return null;
  return writeNormalizedResult(resolve(args.evalResultOut), {
    eval_id: args.evalId,
    level: "workflow",
    runner: "deterministic",
    workflow: args.workflowId,
    runner_status: errors.length === 0 ? "passed" : "failed",
    fallback_status: "not_used",
    waiver_status: "none",
    score: errors.length === 0 ? 1 : 0,
    failure_class: errors.length === 0 ? null : "eval_coverage",
    artifact_uris: [displayWorkflowPath(args.evalResultOut), ...args.workflows.map((workflow) => displayWorkflowPath(workflow))],
    metadata: {
      summary,
      errors,
    },
  });
}

try {
  const args = parseArgs(process.argv.slice(2));
  const registry = loadRegistry(args.registry);
  const registryErrors = validateRegistry(registry);
  if (registryErrors.length > 0) {
    console.error(JSON.stringify({ ok: false, errors: registryErrors }, null, 2));
    process.exit(1);
  }

  const { errors, summary } = verifyWorkflowCoverage({ registry, workflows: args.workflows });
  writeCoverageEvalResult(args, summary, errors);
  if (errors.length > 0) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, errors: [error.message] }, null, 2));
  process.exit(1);
}
