#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const DEFAULT_POSTMORTEM_PATH = ".workflow/iphone-app-ux-studio/postmortem.md";
const DEFAULT_OUT_PATH = ".workflow/iphone-app-ux-studio/postmortem-gate.json";

const REQUIRED_SECTIONS = [
  "Run Summary",
  "What Worked",
  "What Failed",
  "Where Agents Needed Steering",
  "Gate Effectiveness",
  "Prompt Improvements",
  "Workflow Improvements",
  "Design Corpus Additions",
  "Next-Run Recommendations",
].map((label) => ({
  label,
  slug: sectionSlug(label),
}));

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function secretQueryParameterName(name) {
  let decoded = String(name).replace(/\+/g, " ");
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = String(name);
  }
  const normalized = decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized
    .split("_")
    .some((part) => ["auth", "authorization", "credential", "key", "password", "secret", "signature", "token"].includes(part));
}

function redactString(value) {
  return String(value)
    .replace(/\b([a-z][a-z0-9+.-]*:\/\/)([^/?#\s"'<>@]+@)/gi, "$1[redacted]@")
    .replace(/([?#&])([^=&#\s]+)=([^&#\s]*)/g, (match, separator, name) => {
      if (!secretQueryParameterName(name)) return match;
      return `${separator}${name}=[redacted]`;
    })
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/xox[baprs]-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/xapp-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/lin_api_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/apify_api_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, "Bearer [redacted]")
    .replace(
      /\b(?:api[_-]?key|secret|password|passwd|token|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{8,}/gi,
      "[redacted]",
    );
}

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redact(child)]));
  }
  if (typeof value === "string") return redactString(value);
  return value;
}

function sectionSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[`*_~[\](){}:;,.!?'"\\/]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function markdownSectionSlugs(markdown) {
  const slugs = new Set();
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const slug = sectionSlug(match[2]);
    if (slug) slugs.add(slug);
  }
  return slugs;
}

function secretFindings(markdown) {
  const patterns = [
    /\b(?:api[_-]?key|secret|password|passwd|token|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=:@-]{8,}/gi,
    /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
    /\b(?:sk|pk|rk|xox[baprs]|gh[pousr])-[A-Za-z0-9_-]{10,}/gi,
    /\bapify_api_[A-Za-z0-9_-]+/gi,
    /\blin_api_[A-Za-z0-9_-]+/gi,
  ];
  return patterns.flatMap((pattern) => Array.from(markdown.matchAll(pattern), (match) => match[0]));
}

function validatePostmortem(postmortemPath) {
  const failures = [];
  let secretFindingCount = 0;
  if (!existsSync(postmortemPath)) {
    failures.push("missing postmortem artifact");
    return {
      ok: false,
      postmortem_present: false,
      present_sections: [],
      missing_sections: REQUIRED_SECTIONS.map((section) => section.label),
      secret_finding_count: secretFindingCount,
      failures,
    };
  }

  let markdown = "";
  try {
    markdown = readFileSync(postmortemPath, "utf8");
  } catch {
    failures.push("postmortem artifact could not be read");
    return {
      ok: false,
      postmortem_present: true,
      present_sections: [],
      missing_sections: REQUIRED_SECTIONS.map((section) => section.label),
      secret_finding_count: secretFindingCount,
      failures,
    };
  }

  secretFindingCount = secretFindings(markdown).length;
  if (secretFindingCount > 0) {
    failures.push("postmortem contains secret-looking value");
  }

  const detectedSlugs = markdownSectionSlugs(markdown);
  const presentSections = REQUIRED_SECTIONS.filter((section) => detectedSlugs.has(section.slug)).map((section) => section.label);
  const missingSections = REQUIRED_SECTIONS.filter((section) => !detectedSlugs.has(section.slug)).map((section) => section.label);
  for (const section of missingSections) {
    failures.push(`missing required postmortem section: ${section}`);
  }

  return {
    ok: failures.length === 0,
    postmortem_present: true,
    present_sections: presentSections,
    missing_sections: missingSections,
    secret_finding_count: secretFindingCount,
    failures,
  };
}

function writeReport(path, report) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(redact(report), null, 2)}\n`);
}

const postmortemPath = argValue("--postmortem", DEFAULT_POSTMORTEM_PATH);
const outPath = argValue("--out", DEFAULT_OUT_PATH);
const validation = validatePostmortem(postmortemPath);
const report = {
  ok: validation.ok,
  postmortem_path: redactString(postmortemPath),
  out_path: redactString(outPath),
  required_sections: REQUIRED_SECTIONS,
  postmortem_present: validation.postmortem_present,
  present_sections: validation.present_sections,
  missing_sections: validation.missing_sections,
  secret_finding_count: validation.secret_finding_count,
  failures: validation.failures,
};

writeReport(outPath, report);

if (!report.ok) {
  console.error(JSON.stringify(redact(report), null, 2));
  process.exit(1);
}

console.log(JSON.stringify(redact(report)));
