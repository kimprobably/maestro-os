#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function boolArg(name, fallback = false) {
  const raw = String(argValue(name, String(fallback))).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(raw);
}

function repoRoot() {
  return path.resolve(import.meta.dirname, "../..");
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCaseSlug(slug) {
  return slug.split("-").filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function csv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function containsSecretish(value) {
  return /(xox[baprs]-|github_pat_|ghp_|lin_api_|hch-|sk-[a-z0-9]|AQ\.)/i.test(String(value || ""));
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function requestFromArgs(root) {
  const name = argValue("--name", process.env.AGENT_NAME || "").trim();
  const profile = slugify(argValue("--profile", process.env.AGENT_PROFILE || name));
  const role = argValue("--role", process.env.AGENT_ROLE || "").trim();
  const owns = csv(argValue("--owns", process.env.AGENT_OWNS || ""));
  const currentFocus = argValue("--current-focus", process.env.AGENT_CURRENT_FOCUS || "").trim();
  const interfaceKind = argValue("--interface", process.env.AGENT_INTERFACE || "internal Hermes profile").trim();
  const slackBot = boolArg("--slack-bot", ["1", "true", "yes", "on"].includes(String(process.env.AGENT_SLACK_BOT || "").toLowerCase()));
  const allowNewName = boolArg("--allow-new-name", false);
  const reportingChannel = argValue("--reporting-channel", process.env.AGENT_REPORTING_CHANNEL || "").trim();
  const safeName = name || titleCaseSlug(profile);

  return {
    root,
    name: safeName,
    profile: profile || slugify(safeName),
    role,
    owns,
    current_focus: currentFocus,
    interface: interfaceKind,
    slack_bot: slackBot,
    allow_new_name: allowNewName,
    reporting_channel: reportingChannel,
  };
}

async function namePoolNames(root) {
  const text = await readFile(path.join(root, "hermes/agents/name-pool.md"), "utf8");
  const names = new Set();
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*-\s+([A-Za-z][A-Za-z0-9-]*)\b/);
    if (match) names.add(match[1].toLowerCase());
  }
  return { text, names };
}

async function validateRequest(request) {
  const errors = [];
  if (!request.name) errors.push("missing --name");
  if (!request.profile) errors.push("missing --profile or slugifiable --name");
  if (!/^[a-z][a-z0-9-]*$/.test(request.profile)) errors.push("profile must be lowercase kebab-case");
  if (request.profile !== slugify(request.name)) errors.push("profile must match the musician first name slug");
  if (!request.role) errors.push("missing --role");
  if (request.owns.length === 0) errors.push("missing --owns");
  if (!request.current_focus) errors.push("missing --current-focus");

  for (const [key, value] of Object.entries(request)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (containsSecretish(item)) errors.push(`${key} contains a secret-like value`);
      }
    } else if (containsSecretish(value)) {
      errors.push(`${key} contains a secret-like value`);
    }
  }

  const { names } = await namePoolNames(request.root);
  if (!names.has(request.name.toLowerCase()) && !request.allow_new_name) {
    errors.push(`${request.name} is not in name pool; add it first or pass --allow-new-name true`);
  }

  if (errors.length > 0) {
    const message = errors.join("; ");
    throw new Error(message);
  }

  await writeJson(path.join(request.root, ".workflow/hermes-agent-bootstrap/request.json"), request);
  console.log(`agent_request_valid ${request.name} (${request.profile})`);
}

function soulMarkdown(request) {
  const owns = request.owns.map((item) => `- ${item}`).join("\n");
  return `# ${request.name}

You are ${request.name}, ${request.role} for Maestro.

Your job is to build deep operating judgment in your domain, complete delegated work with evidence, and improve the Maestro operating system when repeated patterns emerge.

## Scope

Own:

${owns}

Do not own:

- Broad business strategy unless explicitly delegated by Miles.
- Payments, production deploys, outbound sends/imports, customer data operations, or public publishing unless your profile-specific rules explicitly allow it.
- Secret handling beyond presence-only checks.

## Default Loop

1. Clarify objective, current state, allowed actions, forbidden actions, and exit criteria.
2. Inspect existing ledgers, docs, skills, and linked artifacts before acting.
3. Use deterministic scripts, workflows, and gates where available.
4. Persist durable state in the right ledger/doc, not just chat.
5. Report concise status, evidence, decision, next action, and risks.
6. Convert repeated work into a skill or Fabro workflow proposal.

## Trust Boundary

- Never print secrets or run broad environment dumps.
- Do not claim work is complete without verification evidence.
- Escalate when approval, missing credentials, ambiguous ownership, or material risk blocks progress.
- Prefer internal handoff through Miles unless this profile has its own Slack gateway.

## Learning

Use Honcho for cross-session domain judgment and user preferences. Use ledgers for operational state. Use repo docs and skills for procedures. Do not store logs, secrets, customer data, or full run histories in memory.
`;
}

function slackManifest(request) {
  return {
    display_information: {
      name: request.name,
    },
    features: {
      bot_user: {
        display_name: request.name,
        always_online: true,
      },
    },
    oauth_config: {
      scopes: {
        bot: [
          "app_mentions:read",
          "channels:history",
          "channels:read",
          "chat:write",
          "im:history",
          "im:read",
          "im:write",
          "users:read",
        ],
      },
    },
    settings: {
      interactivity: {
        is_enabled: true,
      },
      org_deploy_enabled: false,
      socket_mode_enabled: true,
      token_rotation_enabled: false,
    },
  };
}

async function writeSlackArtifacts(request) {
  const manifestPath = path.join(request.root, "hermes/agents/slack", `${request.profile}-manifest.json`);
  await writeJson(manifestPath, slackManifest(request));
  const setupPath = path.join(request.root, "docs/operator/agent-slack", `${request.profile}-setup.md`);
  await mkdir(path.dirname(setupPath), { recursive: true });
  await writeFile(setupPath, `# ${request.name} Slack Bot Setup

Status: generated, not installed.

Use the manifest at \`hermes/agents/slack/${request.profile}-manifest.json\`.

Required human/admin steps:

1. Create a separate Slack app for ${request.name}.
2. Import or mirror the generated manifest.
3. Enable Socket Mode.
4. Install the app to the workspace.
5. Create or clone a separate Railway service for the ${request.profile} gateway.
6. Store the ${request.name}-specific bot token and app-level token in that service.
7. Restrict allowed users and channels before making it live.

Minimum Railway variables for the dedicated bot service:

\`\`\`dotenv
HERMES_GATEWAY_PROFILE=${request.profile}
HERMES_HOME=/data/.hermes
SLACK_BOT_TOKEN=
SLACK_APP_TOKEN=
SLACK_HOME_CHANNEL=
SLACK_ALLOWED_USERS=
GATEWAY_ALLOW_ALL_USERS=false
HARVEST_API_KEY=
FABRO_SERVER=https://fabro-maestro-production.up.railway.app/api/v1
HONCHO_WORKSPACE=maestro
HONCHO_ENVIRONMENT=production
HONCHO_RECALL_MODE=hybrid
\`\`\`

Do not reuse Miles' Slack app identity for ${request.name}.
`);
}

async function updateNamePool(request) {
  const file = path.join(request.root, "hermes/agents/name-pool.md");
  let text = await readFile(file, "utf8");
  const activeLine = `- ${request.name} - ${request.role}`;
  const availablePattern = new RegExp(`\\n- ${request.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[^\\n]*`, "i");
  text = text.replace(availablePattern, "");
  if (!text.includes(activeLine)) {
    text = text.replace(/(## Active\n\n)/, `$1${activeLine}\n`);
  }
  await writeFile(file, text);
}

async function updateInstaller(request) {
  const file = path.join(request.root, "hermes/scripts/install-worker-profiles.sh");
  let text = await readFile(file, "utf8");
  const line = `install_worker ${request.profile}`;
  if (!text.includes(line)) {
    if (text.includes("retire_legacy_profile")) {
      text = text.replace(/\nretire_legacy_profile /, `\n${line}\nretire_legacy_profile `);
    } else {
      text = text.replace(/\nprintf 'worker profiles installed\\n'/, `\n${line}\n\nprintf 'worker profiles installed\\n'`);
    }
  }
  await writeFile(file, text);
}

async function updateRegistry(request) {
  const file = path.join(request.root, "hermes/agents/registry.json");
  const registry = await readJson(file);
  const handoff = `timeout 900 hermes -p ${request.profile} chat -q "<task brief>"`;
  const entry = {
    name: request.name,
    profile: request.profile,
    status: "active",
    interface: request.slack_bot ? "Slack gateway candidate" : request.interface,
    role: request.role,
    owns: request.owns,
    memory_peer: request.profile,
    current_focus: request.current_focus,
    handoff,
  };

  const idx = registry.agents.findIndex((agent) => agent.profile === request.profile || agent.name.toLowerCase() === request.name.toLowerCase());
  if (idx >= 0) registry.agents[idx] = { ...registry.agents[idx], ...entry };
  else registry.agents.push(entry);
  registry.updated = new Date().toISOString().slice(0, 10);
  await writeJson(file, registry);
}

async function writeSlackPack(request) {
  await validateRequest({ ...request, slack_bot: true });

  const soulPath = path.join(request.root, "hermes/profiles", request.profile, "SOUL.md");
  if (!existsSync(soulPath)) {
    throw new Error(`missing existing profile SOUL for ${request.profile}; run materialize before slack-pack`);
  }

  await updateRegistry({ ...request, slack_bot: true });
  await writeSlackArtifacts({ ...request, slack_bot: true });
  console.log(`agent_slack_pack_written ${request.name} (${request.profile})`);
}

async function materialize(request) {
  await validateRequest(request);

  const soulPath = path.join(request.root, "hermes/profiles", request.profile, "SOUL.md");
  await mkdir(path.dirname(soulPath), { recursive: true });
  await writeFile(soulPath, soulMarkdown(request));

  await updateRegistry(request);
  await updateNamePool(request);
  await updateInstaller(request);

  if (request.slack_bot) {
    await writeSlackArtifacts(request);
  }

  console.log(`agent_materialized ${request.name} (${request.profile})`);
}

async function writePlan(request) {
  await validateRequest(request);
  const outPath = path.join(request.root, ".workflow/hermes-agent-bootstrap/plan.md");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `# Agent Bootstrap Plan: ${request.name}

- Profile: \`${request.profile}\`
- Role: ${request.role}
- Owns: ${request.owns.join(", ")}
- Current focus: ${request.current_focus}
- Slack bot requested: ${request.slack_bot}

## Deterministic Outputs

- \`hermes/profiles/${request.profile}/SOUL.md\`
- \`hermes/agents/registry.json\`
- \`hermes/agents/name-pool.md\`
- \`hermes/scripts/install-worker-profiles.sh\`
- \`hermes/agents/slack/${request.profile}-manifest.json\` when Slack bot is requested

## Verification

Run \`node scripts/hermes/bootstrap-agent.mjs verify --name ${request.name} --role "${request.role}" --owns "${request.owns.join(",")}" --current-focus "${request.current_focus}"${request.slack_bot ? " --slack-bot true" : ""}\`.
`);
  console.log(`agent_plan_written ${outPath}`);
}

async function verify(request) {
  const registry = await readJson(path.join(request.root, "hermes/agents/registry.json"));
  const soulPath = path.join(request.root, "hermes/profiles", request.profile, "SOUL.md");
  const installerText = await readFile(path.join(request.root, "hermes/scripts/install-worker-profiles.sh"), "utf8");
  const manifestPath = path.join(request.root, "hermes/agents/slack", `${request.profile}-manifest.json`);
  const checks = {
    profile: existsSync(soulPath),
    registry: registry.agents.some((agent) => agent.profile === request.profile && agent.name === request.name),
    name_pool: (await readFile(path.join(request.root, "hermes/agents/name-pool.md"), "utf8")).includes(`- ${request.name} -`),
    installer: installerText.includes(`install_worker ${request.profile}`),
    slack_manifest: request.slack_bot ? existsSync(manifestPath) : true,
  };
  const ok = Object.values(checks).every(Boolean);
  const report = { ok, agent: { name: request.name, profile: request.profile }, checks };
  await writeJson(path.join(request.root, ".workflow/hermes-agent-bootstrap/verify.json"), report);
  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
}

async function writeHandoff(request) {
  const verifyPath = path.join(request.root, ".workflow/hermes-agent-bootstrap/verify.json");
  const verifyReport = existsSync(verifyPath) ? JSON.parse(await readFile(verifyPath, "utf8")) : { ok: false };
  const outPath = path.join(request.root, ".workflow/hermes-agent-bootstrap/handoff.md");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `# Agent Bootstrap Handoff: ${request.name}

- Profile: \`${request.profile}\`
- Verification: ${verifyReport.ok ? "pass" : "not confirmed"}
- Internal handoff: \`timeout 900 hermes -p ${request.profile} chat -q "<task brief>"\`
- Slack bot requested: ${request.slack_bot}

${request.slack_bot ? `Slack bot setup pack:

- \`hermes/agents/slack/${request.profile}-manifest.json\`
- \`docs/operator/agent-slack/${request.profile}-setup.md\`

Install is intentionally gated and should use a separate Slack app, separate Railway service, and restricted allowed users/channels.
` : "No separate Slack bot requested."}
`);
  console.log(`agent_handoff_written ${outPath}`);
}

const command = process.argv[2] || "validate";
const root = path.resolve(argValue("--root", process.cwd() === "/app" ? "/app" : repoRoot()));
const request = requestFromArgs(root);

try {
  if (command === "validate") await validateRequest(request);
  else if (command === "plan") await writePlan(request);
  else if (command === "materialize") await materialize(request);
  else if (command === "slack-pack") await writeSlackPack(request);
  else if (command === "verify") await verify(request);
  else if (command === "handoff") await writeHandoff(request);
  else {
    console.error("usage: bootstrap-agent.mjs <validate|plan|materialize|slack-pack|verify|handoff> --name <Name> --role <role> --owns <a,b> --current-focus <text> [--slack-bot true]");
    process.exit(2);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
