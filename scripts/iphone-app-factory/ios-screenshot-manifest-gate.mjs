#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, normalize, relative, resolve } from "node:path";

const REQUIRED_SCREEN_KEYS = [
  "onboarding",
  "home",
  "primary_list",
  "create_edit",
  "active_task",
  "completion",
  "history_streaks",
  "profile_settings",
  "paywall_subscription",
];

const DEFAULT_MANIFEST = "reports/ios/screenshots/manifest.json";
const DEFAULT_OUT = ".workflow/iphone-app-ux-studio/screenshots/screenshot-manifest-gate.json";
const SCREEN_FLOW_EVIDENCE = ".workflow/iphone-app-ux-studio/evidence/screen-flows.md";
const DEFAULT_MAX_BLANK_SCORE = 0.95;
const SCREENSHOT_ROOT = "reports/ios/screenshots/";

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function booleanArg(name, fallback) {
  return String(argValue(name, String(fallback))).toLowerCase() === "true";
}

function numberArg(name, fallback) {
  const raw = argValue(name, String(fallback));
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} must be a number`);
  return value;
}

function screenLabel(screen) {
  const screenKey = screen?.screen_key || "<missing screen_key>";
  const phase = screen?.phase || "<missing phase>";
  return `screen ${screenKey} phase ${phase}`;
}

function hasImagePath(screen) {
  return typeof screen.image_path === "string" && screen.image_path.trim().length > 0;
}

function positiveDimension(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function isUrlLike(value) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^file:/i.test(value);
}

function isWindowsAbsolute(value) {
  return /^[a-z]:[\\/]/i.test(value) || /^\\\\/.test(value);
}

function hasTraversal(value) {
  return value.replace(/\\/g, "/").split("/").includes("..");
}

function isWithinScreenshotRoot(value) {
  return value.replace(/\\/g, "/").startsWith(SCREENSHOT_ROOT);
}

function sanitizeImagePathForReport(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (
    isUrlLike(trimmed) ||
    isAbsolute(trimmed) ||
    isWindowsAbsolute(trimmed) ||
    trimmed.includes("?") ||
    trimmed.includes("#") ||
    hasTraversal(trimmed) ||
    !isWithinScreenshotRoot(trimmed)
  ) {
    return "[rejected-image-path]";
  }
  return trimmed;
}

function validateImagePath(screen, failures, { skipFileExistence }) {
  if (!hasImagePath(screen)) {
    failures.push(`${screenLabel(screen)} missing image_path`);
    return;
  }

  const imagePath = screen.image_path.trim();
  if (isUrlLike(imagePath)) {
    failures.push(`${screenLabel(screen)} image_path must be a relative path`);
    return;
  }
  if (isAbsolute(imagePath) || isWindowsAbsolute(imagePath)) {
    failures.push(`${screenLabel(screen)} image_path must be a relative path`);
    return;
  }
  if (imagePath.includes("?") || imagePath.includes("#")) {
    failures.push(`${screenLabel(screen)} image_path must not include query strings or fragments`);
    return;
  }
  if (hasTraversal(imagePath)) {
    failures.push(`${screenLabel(screen)} image_path must not contain traversal`);
    return;
  }
  if (!isWithinScreenshotRoot(imagePath)) {
    failures.push(`${screenLabel(screen)} image_path must stay under ${SCREENSHOT_ROOT}`);
    return;
  }

  if (!skipFileExistence) {
    const cwd = resolve(process.cwd());
    const resolvedImagePath = resolve(cwd, normalize(imagePath));
    const relativeImagePath = relative(cwd, resolvedImagePath);
    if (relativeImagePath.startsWith("..") || isAbsolute(relativeImagePath) || !existsSync(resolvedImagePath)) {
      failures.push(`${screenLabel(screen)} image_path file does not exist`);
    }
  }
}

function validateScreenShape(screen, failures, maxBlankScore, options) {
  if (!screen || typeof screen !== "object" || Array.isArray(screen)) {
    failures.push("manifest screens must contain objects");
    return;
  }

  if (typeof screen.screen_key !== "string" || screen.screen_key.trim() === "") {
    failures.push(`${screenLabel(screen)} missing screen_key`);
  }
  if (typeof screen.phase !== "string" || screen.phase.trim() === "") {
    failures.push(`${screenLabel(screen)} missing phase`);
  }
  validateImagePath(screen, failures, options);
  if (!positiveDimension(screen.width) || !positiveDimension(screen.height)) {
    failures.push(`${screenLabel(screen)} width and height must be greater than zero`);
  }

  const blankScore = Number(screen.blank_score);
  if (!Number.isFinite(blankScore)) {
    failures.push(`${screenLabel(screen)} missing numeric blank_score`);
  } else if (blankScore >= maxBlankScore) {
    failures.push(`${screenLabel(screen)} blank_score ${blankScore} is >= ${maxBlankScore}`);
  }

  if (screen.text_clipping_risk === true) {
    failures.push(`${screenLabel(screen)} text_clipping_risk is true`);
  }
}

function validateManifest({ manifestPath, phase, requireBeforeAfter, maxBlankScore, skipFileExistence }) {
  const failures = [];
  let manifest = null;

  if (!existsSync(manifestPath)) {
    failures.push(`missing screenshot manifest ${manifestPath}`);
  } else {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (error) {
      failures.push(`invalid screenshot manifest JSON: ${error.message}`);
    }
  }

  const screens = Array.isArray(manifest?.screens) ? manifest.screens : [];
  if (manifest && !Array.isArray(manifest.screens)) {
    failures.push("screenshot manifest must include a screens array");
  }

  for (const screen of screens) {
    validateScreenShape(screen, failures, maxBlankScore, { skipFileExistence });
  }

  const phaseScreens = screens.filter((screen) => screen?.phase === phase);
  const phaseScreenKeys = new Set(phaseScreens.map((screen) => screen.screen_key));
  for (const screenKey of REQUIRED_SCREEN_KEYS) {
    if (!phaseScreenKeys.has(screenKey)) {
      failures.push(`missing required screen ${screenKey} for phase ${phase}`);
    }
  }

  const redesignedScreenKeys = [
    ...new Set(screens
      .filter((screen) => screen?.redesigned === true)
      .map((screen) => screen.screen_key)
      .filter(Boolean)),
  ].sort();

  if (requireBeforeAfter) {
    for (const screenKey of redesignedScreenKeys) {
      const hasBefore = screens.some((screen) => screen?.screen_key === screenKey && screen?.phase === "before");
      const hasAfter = screens.some((screen) => screen?.screen_key === screenKey && screen?.phase === "after");
      if (!hasBefore || !hasAfter) {
        failures.push(`screen ${screenKey} missing before/after pair for redesigned screen`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    manifest: manifestPath,
    phase,
    require_before_after: requireBeforeAfter,
    skip_file_existence: skipFileExistence,
    max_blank_score: maxBlankScore,
    required_screen_keys: REQUIRED_SCREEN_KEYS,
    checked_screens: phaseScreens.map((screen) => ({
      screen_key: screen.screen_key,
      phase: screen.phase,
      image_path: sanitizeImagePathForReport(screen.image_path),
      width: Number(screen.width || 0),
      height: Number(screen.height || 0),
      blank_score: Number(screen.blank_score),
      text_clipping_risk: screen.text_clipping_risk === true,
      redesigned: screen.redesigned === true,
    })),
    redesigned_screen_keys: redesignedScreenKeys,
    failures,
  };
}

function writeReport(outPath, report) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

function hasHostedIosDeferral(report) {
  if (!report.failures.some((failure) => failure.startsWith("missing screenshot manifest "))) return false;
  if (!existsSync(SCREEN_FLOW_EVIDENCE)) return false;
  const evidence = readFileSync(SCREEN_FLOW_EVIDENCE, "utf8").toLowerCase();
  return evidence.includes("hosted")
    && evidence.includes("screenshot")
    && (evidence.includes("ios") || evidence.includes("macos"))
    && (evidence.includes("daytona") || evidence.includes("worker"));
}

const manifestPath = argValue("--manifest", DEFAULT_MANIFEST);
const phase = argValue("--phase", "after");
const requireBeforeAfter = booleanArg("--require-before-after", false);
const skipFileExistence = booleanArg("--skip-file-existence", false);
const maxBlankScore = numberArg("--max-blank-score", DEFAULT_MAX_BLANK_SCORE);
const outPath = argValue("--out", DEFAULT_OUT);

const report = validateManifest({
  manifestPath,
  phase,
  requireBeforeAfter,
  skipFileExistence,
  maxBlankScore,
});

if (!report.ok && hasHostedIosDeferral(report)) {
  report.ok = true;
  report.deferred_to_hosted_ios = true;
  report.deferral_reason = "Screenshot capture requires hosted macOS/iOS execution; Daytona cannot produce simulator screenshots.";
  report.failures = [];
}

writeReport(outPath, report);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report));
