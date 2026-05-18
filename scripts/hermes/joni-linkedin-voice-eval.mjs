#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const BANNED_PATTERNS = [
  "Here's the thing",
  "Let me explain",
  "game-changer",
  "game changer",
  "At the end of the day",
  "In this article",
  "As a matter of fact",
  "It's important to note",
  "In conclusion",
  "Moving forward",
  "That being said",
  "Dive deep",
  "deep dive",
  "Unlock your potential",
  "Level up",
  "Take it to the next level",
  "Leverage",
  "synergy",
  "paradigm shift",
  "low-hanging fruit",
  "value proposition",
  "circle back",
  "touch base",
  "think outside the box",
  "drill down",
  "bandwidth",
  "unpack this",
  "double down",
  "at scale",
  "pivot",
  "disrupt",
  "ideate",
  "align on",
  "needle-moving",
  "mission-critical",
  "world-class",
  "best-in-class",
  "cutting-edge",
  "state-of-the-art",
  "next-generation",
  "holistic approach",
  "ecosystem",
  "robust",
  "seamless",
  "comprehensive",
];

const ROUGHNESS_PATTERNS = [
  /\bbc\b/gi,
  /\btbh\b/gi,
  /\btho\b/gi,
  /\bkinda\b/gi,
  /\brn\b/gi,
  /\bwanna\b/gi,
  /\bgonna\b/gi,
  /\bimo\b/gi,
  /\.{3,}/g,
];

function argValue(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) throw new Error(`missing value for ${name}`);
  return value;
}

async function readText(path) {
  if (!path) throw new Error("--file, --before, or --after is required");
  return readFile(path, "utf8");
}

function words(text) {
  return text.match(/[A-Za-z0-9']+/g) || [];
}

function wordCount(text) {
  return words(text).length;
}

function firstNonEmptyLine(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
}

function openingText(text, maxWords = 85) {
  return words(text).slice(0, maxWords).join(" ");
}

function regexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseAppears(text, phrase) {
  const normalized = String(phrase || "").trim();
  if (!normalized) return true;
  return new RegExp(`\\b${regexEscape(normalized).replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
}

function countMatches(text, patterns) {
  let count = 0;
  const markers = [];
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    count += matches.length;
    for (const match of matches) markers.push(match[0]);
  }
  return { count, markers };
}

function roughnessBand(count) {
  if (count < 90) return { min: 0, max: 1 };
  if (count < 110) return { min: 0, max: 2 };
  if (count < 281) return { min: 1, max: 2 };
  return { min: 1, max: 3 };
}

function scoreHook(hook) {
  let score = 5;
  const strengths = [];
  const weaknesses = [];
  const add = (name, value) => {
    score += value;
    strengths.push(name);
  };
  const subtract = (name, value) => {
    score -= value;
    weaknesses.push(name);
  };

  if (/\$?\d[\d,.]*%?/.test(hook)) add("hasNumbers", 2);
  if (/\d+\s*(days?|weeks?|months?|years?|hours?)/i.test(hook)) add("hasSpecificTimeframe", 1.5);
  if (hook.length <= 90) add("isShort", 1);
  if (/\b(but|instead|not|never|stop|quit|wrong|mistake|until|before)\b/i.test(hook)) add("hasContrast", 1.5);
  if (/\b(I|my|me|we|our|you're|you)\b/i.test(hook)) add("hasFirstPersonOrDirectAddress", 1);
  if (/\?/.test(hook)) add("hasQuestion", 0.5);
  if (/\b(surprising|unexpected|weird|strange|one thing|single)\b/i.test(hook)) add("hasCuriosity", 1.5);
  if (/\b(revenue|profit|sales|customers|followers|growth|doubled|tripled|increased|pipeline|calls|deals)\b/i.test(hook)) add("hasOutcome", 2);

  if (/^(Tips for|Thoughts on|Some thoughts|How to|Ways to|Things to|Ideas for)\b/i.test(hook)) {
    subtract("isGeneric", 2);
  }
  if (/\b(better|improve|great|good|important|essential|key|must)\b/i.test(hook) && !/\d/.test(hook)) {
    subtract("isVague", 1.5);
  }
  if (hook.length > 120) subtract("isTooLong", 1);
  if (!/\d/.test(hook) && !/\b(I|my|me|we|our|you're|you)\b/i.test(hook)) subtract("lacksSpecificity", 1.5);

  return {
    text: hook,
    score: Math.max(1, Math.min(10, Number(score.toFixed(1)))),
    strengths,
    weaknesses,
  };
}

function hasUnclearHook(hook) {
  const lower = hook.toLowerCase();
  if (/\bthe handoff\b/.test(lower) && !/(follow-up|content|sales|pipeline|after the post|handoff from)/.test(lower)) {
    return true;
  }
  if (/^(the tool|the handoff|the loop|the system)\b/i.test(hook) && !/\b(B2B|founder|pipeline|LinkedIn|sales|post|content)\b/i.test(hook)) {
    return true;
  }
  return false;
}

function bannedMatches(text) {
  return BANNED_PATTERNS.filter((phrase) => phraseAppears(text, phrase));
}

function hasEmoji(text) {
  return /\p{Extended_Pictographic}/u.test(text);
}

function stackedShortLineRun(text) {
  let run = 0;
  let maxRun = 0;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      run = 0;
      continue;
    }
    if (wordCount(trimmed) <= 4 && !/[.?!:]$/.test(trimmed)) {
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 0;
    }
  }
  return maxRun;
}

function repeatedDiagnosticQuestions(text) {
  return text.split(/\r?\n/).filter((line) => line.trim().endsWith("?")).length;
}

function lintText(text, options = {}) {
  const issues = [];
  const count = wordCount(text);
  const hook = scoreHook(firstNonEmptyLine(text));
  const opening = openingText(text);
  const rough = countMatches(text, ROUGHNESS_PATTERNS);
  const band = roughnessBand(count);
  const banned = bannedMatches(text);
  const shortLineRun = stackedShortLineRun(text);
  const diagnosticQuestions = repeatedDiagnosticQuestions(text);
  const target = String(options.target || "").trim();
  const pain = String(options.pain || "").trim();

  const checks = {
    banned_patterns: { passes: banned.length === 0, matches: banned },
    em_dash: { passes: !/[—]/.test(text) },
    emoji: { passes: !hasEmoji(text) },
    hashtags: { passes: !/(^|\s)#[A-Za-z0-9_]+/.test(text) },
    markdown_artifacts: { passes: !/```|^\s*#{1,6}\s|\*\*/m.test(text) },
    stacked_short_lines: { passes: shortLineRun < 3, max_run: shortLineRun },
    diagnostic_questions: { passes: diagnosticQuestions < 4, count: diagnosticQuestions },
    target_reader: { passes: phraseAppears(opening, target), target },
    pain_point: { passes: phraseAppears(opening, pain), pain },
    hook_clarity: { passes: !hasUnclearHook(hook.text), hook: hook.text },
    hook_strength: { passes: hook.score >= 6.5, score: hook.score },
    roughness: {
      passes: rough.count >= band.min && rough.count <= band.max,
      count: rough.count,
      markers: rough.markers,
      min: band.min,
      max: band.max,
    },
  };

  for (const [name, check] of Object.entries(checks)) {
    if (check.passes) continue;
    if (name === "roughness" && rough.count < band.min) {
      issues.push(`roughness too low: found ${rough.count}, expected ${band.min}-${band.max}`);
    } else if (name === "roughness") {
      issues.push(`roughness too high: found ${rough.count}, expected ${band.min}-${band.max}`);
    } else if (name === "target_reader") {
      issues.push(`target reader missing early: ${target || "not provided"}`);
    } else if (name === "pain_point") {
      issues.push(`pain point missing early: ${pain || "not provided"}`);
    } else if (name === "hook_clarity") {
      issues.push("hook is unclear without hidden context");
    } else if (name === "banned_patterns") {
      issues.push(`banned patterns: ${banned.join(", ")}`);
    } else {
      issues.push(`${name} failed`);
    }
  }

  const passes = Object.values(checks).every((check) => check.passes);
  return {
    command: "lint",
    passes,
    word_count: count,
    hook,
    roughness: checks.roughness,
    checks,
    issues,
    summary: passes ? "voice_lint_passed" : "voice_lint_failed",
  };
}

function compareTexts(before, after, options = {}) {
  const beforeLint = lintText(before, options);
  const afterLint = lintText(after, options);
  const issues = [...afterLint.issues];

  const hookScoreDrop = beforeLint.hook.score - afterLint.hook.score;
  const hookClarityRegression = beforeLint.checks.hook_clarity.passes && !afterLint.checks.hook_clarity.passes;
  const hookRegression = hookClarityRegression || hookScoreDrop >= 1.5;
  const targetRegression = beforeLint.checks.target_reader.passes && !afterLint.checks.target_reader.passes;
  const painRegression = beforeLint.checks.pain_point.passes && !afterLint.checks.pain_point.passes;
  const roughnessRegression = beforeLint.checks.roughness.passes && !afterLint.checks.roughness.passes;

  const checks = {
    after_lint: { passes: afterLint.passes },
    hook_regression: {
      passes: !hookRegression,
      before_score: beforeLint.hook.score,
      after_score: afterLint.hook.score,
      clarity_regressed: hookClarityRegression,
    },
    target_reader_regression: { passes: !targetRegression },
    pain_point_regression: { passes: !painRegression },
    roughness_regression: { passes: !roughnessRegression },
  };

  if (hookRegression) issues.push("hook regressed during edit");
  if (targetRegression) issues.push("target reader regressed during edit");
  if (painRegression) issues.push("pain point regressed during edit");
  if (roughnessRegression) issues.push("roughness regressed during edit");

  const passes = Object.values(checks).every((check) => check.passes);
  return {
    command: "compare",
    passes,
    before: beforeLint,
    after: afterLint,
    checks,
    issues: [...new Set(issues)],
    summary: passes ? "edit_regression_passed" : "edit_regression_failed",
  };
}

function printResult(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(payload.passes ? 0 : 1);
}

async function main() {
  const command = process.argv[2] || "";
  const options = {
    target: argValue("--target", ""),
    pain: argValue("--pain", ""),
  };

  if (command === "lint") {
    const text = await readText(argValue("--file"));
    printResult(lintText(text, options));
  }

  if (command === "compare") {
    const before = await readText(argValue("--before"));
    const after = await readText(argValue("--after"));
    printResult(compareTexts(before, after, options));
  }

  throw new Error("usage: joni-linkedin-voice-eval.mjs lint --file <path> | compare --before <path> --after <path>");
}

main().catch((error) => {
  const payload = {
    command: "error",
    passes: false,
    issues: [String(error.message || error)],
  };
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(1);
});
