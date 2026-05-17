#!/usr/bin/env node
import { chmod, mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function envInt(name, fallback) {
  const raw = String(process.env[name] || "").trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function profileNames(home, baseProfile) {
  const names = new Set([baseProfile]);
  const profileRoot = path.join(home, "profiles");
  if (!existsSync(profileRoot)) return [...names].sort();

  for (const entry of await readdir(profileRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      names.add(entry.name);
    }
  }
  if (names.has("quincy")) {
    names.delete("fabro-operator");
  }
  return [...names].sort();
}

const aiPeerByProfile = new Map([
  ["maestro-operator", "miles"],
  ["quincy", "quincy"],
  ["smith", "smith"],
  ["johann", "johann"],
  ["quill", "quill"],
  ["joni", "joni"],
]);

const apiKeyPresent = Boolean(String(process.env.HONCHO_API_KEY || "").trim());
if (!apiKeyPresent) {
  process.exit(0);
}

const home = path.resolve(argValue("--home", process.env.HERMES_HOME || path.join(process.env.HOME || ".", ".hermes")));
const baseProfile = argValue("--base-profile", process.env.HERMES_PROFILE || "maestro-operator");
const workspace = String(process.env.HONCHO_WORKSPACE || "maestro").trim() || "maestro";
const environment = String(process.env.HONCHO_ENVIRONMENT || "production").trim() || "production";
const recallMode = String(process.env.HONCHO_RECALL_MODE || "hybrid").trim() || "hybrid";
const peerName = String(process.env.HONCHO_USER_PEER || "").trim();

const shared = {
  enabled: true,
  environment,
  workspace,
  recallMode,
  contextTokens: envInt("HONCHO_CONTEXT_TOKENS", 1200),
  contextCadence: envInt("HONCHO_CONTEXT_CADENCE", 1),
  dialecticCadence: envInt("HONCHO_DIALECTIC_CADENCE", 4),
  dialecticDepth: envInt("HONCHO_DIALECTIC_DEPTH", 1),
  dialecticReasoningLevel: String(process.env.HONCHO_DIALECTIC_REASONING_LEVEL || "low").trim() || "low",
  dialecticDynamic: true,
  dialecticMaxChars: envInt("HONCHO_DIALECTIC_MAX_CHARS", 600),
  writeFrequency: String(process.env.HONCHO_WRITE_FREQUENCY || "async").trim() || "async",
  saveMessages: true,
  observationMode: "directional",
  messageMaxChars: envInt("HONCHO_MESSAGE_MAX_CHARS", 12000),
  dialecticMaxInputChars: envInt("HONCHO_DIALECTIC_MAX_INPUT_CHARS", 6000),
  reasoningHeuristic: true,
  reasoningLevelCap: String(process.env.HONCHO_REASONING_LEVEL_CAP || "medium").trim() || "medium",
  sessionStrategy: String(process.env.HONCHO_SESSION_STRATEGY || "global").trim() || "global",
};
if (peerName) {
  shared.peerName = peerName;
}

const hosts = {};
for (const profile of await profileNames(home, baseProfile)) {
  const hostKey = `hermes.${profile}`;
  hosts[hostKey] = {
    ...shared,
    aiPeer: aiPeerByProfile.get(profile) || profile,
  };
}

const config = {
  ...shared,
  hosts,
};

await mkdir(home, { recursive: true, mode: 0o700 });
const outputPath = path.join(home, "honcho.json");
await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
await chmod(outputPath, 0o600);

console.error(`rendered Honcho config for ${Object.keys(hosts).length} profile host(s)`);
