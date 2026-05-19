import { existsSync, readFileSync } from "node:fs";
import { parseRegistryYaml } from "./eval-lib.mjs";

const ROLES = new Set(["parent", "child", "standalone"]);
const NATIVE_PROMPT_POLICIES = new Set(["none", "tracked_pending", "collector_required", "collected"]);

export function loadActiveWorkflowManifest(path = "evals/active-workflows.yaml") {
  return parseRegistryYaml(readFileSync(path, "utf8"));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateActiveWorkflowManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return ["active workflow manifest must be an object"];
  }
  if (manifest.version !== 1) errors.push("active workflow manifest version must be 1");
  if (!Array.isArray(manifest.groups) || manifest.groups.length === 0) {
    errors.push("active workflow manifest groups must be a non-empty array");
  }

  const groupIds = new Set();
  for (const [groupIndex, group] of (manifest.groups || []).entries()) {
    const label = nonEmptyString(group?.id) ? group.id : `groups[${groupIndex}]`;
    if (!nonEmptyString(group?.id)) errors.push(`${label} id must be a non-empty string`);
    if (groupIds.has(group?.id)) errors.push(`${label} duplicates active workflow group id ${group.id}`);
    if (nonEmptyString(group?.id)) groupIds.add(group.id);
    if (!nonEmptyString(group?.owner)) errors.push(`${label} owner must be a non-empty string`);
    if (!nonEmptyString(group?.outcome_eval_id)) errors.push(`${label} outcome_eval_id must be a non-empty string`);
    if (!Array.isArray(group?.workflows) || group.workflows.length === 0) {
      errors.push(`${label} workflows must be a non-empty array`);
    }

    const workflowPaths = new Set();
    for (const [workflowIndex, workflow] of (group.workflows || []).entries()) {
      const workflowLabel = nonEmptyString(workflow?.path) ? workflow.path : `${label}.workflows[${workflowIndex}]`;
      if (!nonEmptyString(workflow?.path)) errors.push(`${workflowLabel} path must be a non-empty string`);
      if (workflowPaths.has(workflow?.path)) errors.push(`${workflowLabel} duplicates workflow path in ${label}`);
      if (nonEmptyString(workflow?.path)) workflowPaths.add(workflow.path);
      if (!ROLES.has(workflow?.role)) {
        errors.push(`${workflowLabel} role must be one of ${Array.from(ROLES).join(", ")}`);
      }
      if (!nonEmptyString(workflow?.workflow_eval_id)) {
        errors.push(`${workflowLabel} workflow_eval_id must be a non-empty string`);
      }
      if (!NATIVE_PROMPT_POLICIES.has(workflow?.native_prompt_policy ?? "none")) {
        errors.push(
          `${workflowLabel} native_prompt_policy must be one of ${Array.from(NATIVE_PROMPT_POLICIES).join(", ")}`,
        );
      }
    }
  }

  return errors;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unescapeFabroString(value) {
  return value.replace(/\\"/g, '"');
}

function extractAttribute(block, name) {
  const match = block.match(new RegExp(`\\b${escapeRegExp(name)}\\s*=\\s*"((?:\\\\"|[^"])*)"`));
  return match ? unescapeFabroString(match[1]) : null;
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

function optionValueForCommand(command, option) {
  const tokens = tokenizeCommand(command);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === option) return tokens[index + 1] ?? null;
    if (token.startsWith(`${option}=`)) return token.slice(option.length + 1) || null;
  }
  return null;
}

export function analyzeFabroWorkflowText(text) {
  const nodeBlocks = [...text.matchAll(/(?:^|\n)\s*([A-Za-z0-9_:-]+)\s*\[([\s\S]*?)\]/g)];
  const codexPromptInvocations = [];
  const nativePromptNodes = [];
  const managerLoopChildren = [];

  for (const match of nodeBlocks) {
    const node = match[1];
    const body = match[2];
    const line = text.slice(0, match.index).split(/\r?\n/).length;
    const script = extractAttribute(body, "script");
    const prompt = extractAttribute(body, "prompt");
    const type = extractAttribute(body, "type");
    const childWorkflow = extractAttribute(body, "stack.child_workflow") ?? extractAttribute(body, "workflow");

    if (script?.includes("run-codex-prompt.mjs")) {
      for (const segment of splitShellCommands(script).filter((part) => part.includes("run-codex-prompt.mjs"))) {
        codexPromptInvocations.push({
          node,
          line,
          command: segment,
          eval_id: optionValueForCommand(segment, "--eval-id"),
          stage: optionValueForCommand(segment, "--stage"),
        });
      }
    }
    if (prompt?.startsWith("@")) nativePromptNodes.push({ node, line, prompt });
    if (type === "stack.manager_loop" && childWorkflow) {
      managerLoopChildren.push({ node, line, workflow: childWorkflow });
    }
  }

  return {
    codex_prompt_invocations: codexPromptInvocations,
    native_prompt_nodes: nativePromptNodes,
    manager_loop_children: managerLoopChildren,
  };
}

export function workflowFileExists(path) {
  return existsSync(path);
}
