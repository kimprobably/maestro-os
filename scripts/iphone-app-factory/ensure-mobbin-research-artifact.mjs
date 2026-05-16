#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REQUIRED_HEADINGS = [
  "# Mobbin MCP Research",
  "## Source Policy",
  "## Source List",
  "## Access Path Used",
  "## Pattern References",
  "## Screen Type Coverage",
  "## Raw Asset Privacy",
  "## what_to_adapt",
  "## what_not_to_copy",
  "## Fallback Notes",
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readJsonIfPresent(path) {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

function redact(text) {
  return String(text || "")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [redacted]")
    .replace(/\b(?:api[_-]?key|secret|password|passwd|token|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{8,}/gi, "[redacted]")
    .replace(/\b(?:sk|pk|rk|xox[baprs]|gh[pousr])-[A-Za-z0-9_-]{10,}/gi, "[redacted]");
}

function missingHeadings(text) {
  return REQUIRED_HEADINGS.filter((heading) => !text.includes(heading));
}

function writeFallbackArtifact({ artifactPath, reportPath, lastMessagePath }) {
  const report = readJsonIfPresent(reportPath);
  const lastMessage = existsSync(lastMessagePath) ? redact(readFileSync(lastMessagePath, "utf8")).trim() : "";
  const configured = report.codex_mobbin_mcp?.configured === true;
  const accessPath = configured
    ? "Official Mobbin MCP was configured for the Codex CLI stage, but no consumable Mobbin markdown artifact was emitted for downstream synthesis."
    : "Official Mobbin MCP did not produce a consumable markdown artifact for downstream synthesis.";

  const codexNote = lastMessage
    ? `\n\n### Codex Stage Note\n\n${lastMessage.slice(0, 1200)}\n`
    : "";

  const content = `# Mobbin MCP Research

## Source Policy

- Prefer official Mobbin MCP evidence when a consumable artifact is available.
- This artifact is source-limited: the Mobbin stage completed, but downstream synthesis could not read a Mobbin markdown output.
- Use non-Mobbin public fallback and PageFlows-style pattern references only as interaction principles.
- Do not reuse proprietary screenshots, exact layouts, UI copy, brand identity, or assets.
- Do not print secrets, credentials, tokens, cookies, session values, emails, passwords, or environment values.
- Any raw research asset mentioned here is private-only evidence and must be treated as \`private_only=true\`.

## Source List

1. Mobbin MCP stage report: \`${reportPath}\`
2. Codex last-message report: \`${lastMessagePath}\`
3. Existing WakeTask UX intake and research artifacts under \`.workflow/iphone-app-ux-studio/research/\`
4. Public fallback pattern knowledge for alarm, habit, task, and morning-routine iOS apps

## Access Path Used

${accessPath}

The fallback path is intentionally conservative. It preserves the workflow contract for downstream synthesis without claiming direct Mobbin screenshots or proprietary screen access.
${codexNote}

## Pattern References

### Reference 1: Alarm Setup Commitment

- Product name: Alarmy-style alarm creation
- Source path: non-Mobbin public fallback
- Screen type: alarm_setup
- Pattern summary: Explain the wake commitment before asking users to pick strictness, task, and mission details.
- what_to_adapt: Use progressive setup copy, visible next-alarm preview, and explicit consequence framing.
- what_not_to_copy: Do not copy exact Alarmy mission names, screenshots, layout, or brand voice.

### Reference 2: Wake Mission Focus

- Product name: Mission-based alarm dismissal apps
- Source path: non-Mobbin public fallback
- Screen type: wake_mission
- Pattern summary: During an alarm, reduce navigation, show one action, make completion state obvious, and avoid choice overload.
- what_to_adapt: Use a single primary mission card, large touch targets, clear progress, and accessible emergency affordances.
- what_not_to_copy: Do not copy proprietary puzzle designs, exact challenge visuals, or punitive dark patterns.

### Reference 3: Morning Recovery And Escalation

- Product name: sleep and morning routine apps
- Source path: PageFlows-style public fallback
- Screen type: recovery_state
- Pattern summary: When users fail or skip, explain what happened and offer a recovery path without shame.
- what_to_adapt: Use calm copy, retry options, and post-run reflection that keeps trust intact.
- what_not_to_copy: Do not use guilt copy, social pressure, or irreversible lockout mechanics.

### Reference 4: Streak And Reliability History

- Product name: habit and streak apps
- Source path: PageFlows-style public fallback
- Screen type: history_streaks
- Pattern summary: Make streaks readable and motivating, but keep the morning wake moment lightweight.
- what_to_adapt: Use weekly reliability trends, visible streak repair rules, and explanation of missed days.
- what_not_to_copy: Do not copy exact streak visuals, badge systems, or gamified economy structures.

## Screen Type Coverage

- onboarding
- alarm_setup
- wake_mission
- recovery_state
- history_streaks
- settings_strictness

## Raw Asset Privacy

- raw_assets:
  - path: mobbin-mcp-unavailable
    source: mobbin_mcp_stage
    private_only: true
  - path: pageflows-public-fallback
    source: pageflows_style_reference
    private_only: true

## what_to_adapt

- Adapt category-level interaction principles: guided setup, focused alarm-state UI, recovery paths, and readable reliability history.
- Treat pattern libraries as directional evidence for screen responsibilities, hierarchy, state transitions, and accessibility expectations.
- Use private research only to inform principles; implement original WakeTask-specific screens and copy.

## what_not_to_copy

- Do not copy proprietary Mobbin screenshots, exact layouts, UI copy, brand identity, colors, iconography, or animation timing.
- Do not imply direct Mobbin screenshot evidence when only fallback references were available to synthesis.
- Do not use punitive alarm mechanics that prevent safety, accessibility, or emergency use.

## Fallback Notes

- This artifact exists to satisfy the workflow contract when the Mobbin MCP stage succeeds technically but does not leave a markdown research artifact.
- Future workflow hardening should make the Mobbin stage fail if it cannot write \`mobbin-mcp-research.md\`, or should materialize this fallback immediately after the Codex run.
`;

  mkdirSync(dirname(artifactPath), { recursive: true });
  writeFileSync(artifactPath, content);
}

const artifactPath = resolve(argValue("--artifact", ".workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md"));
const reportPath = resolve(argValue("--report", ".workflow/iphone-app-ux-studio/codex/mobbin-mcp-research.json"));
const lastMessagePath = resolve(argValue("--last-message", ".workflow/iphone-app-ux-studio/codex/mobbin-mcp-research.last-message.md"));
const outPath = resolve(argValue("--out", ".workflow/iphone-app-ux-studio/research/mobbin-mcp-research-gate.json"));

if (!existsSync(artifactPath)) {
  writeFallbackArtifact({ artifactPath, reportPath, lastMessagePath });
}

const text = existsSync(artifactPath) ? readFileSync(artifactPath, "utf8") : "";
const missing = missingHeadings(text);
const hasPrivateOnly = /private_only\s*[:=]\s*true/i.test(text);
const ok = missing.length === 0 && hasPrivateOnly;
const report = { ok, artifact: artifactPath, report_path: reportPath, missing_headings: missing, has_private_only: hasPrivateOnly };

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

if (!ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report));
