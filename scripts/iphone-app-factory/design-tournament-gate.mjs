#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const DEFAULT_CONSENSUS_PATH = ".workflow/iphone-app-ux-studio/design/tournament-consensus.json";
const DEFAULT_OUT_PATH = ".workflow/iphone-app-ux-studio/design/tournament-gate.json";

const REQUIRED_SCORES = [
  "differentiation",
  "native_ios_quality",
  "wake_state_usability",
  "conversion_potential",
  "accessibility",
  "implementation_risk",
  "visual_distinctiveness",
];

const REQUIRED_SCREEN_IDS = [
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

const SCREEN_ID_ALIASES = {
  onboarding: "onboarding",
  home: "home",
  "primary list": "primary_list",
  primary_list: "primary_list",
  "create/edit": "create_edit",
  create_edit: "create_edit",
  "active task": "active_task",
  active_task: "active_task",
  completion: "completion",
  "history/streaks": "history_streaks",
  history_streaks: "history_streaks",
  "profile/settings": "profile_settings",
  profile_settings: "profile_settings",
  "paywall/subscription": "paywall_subscription",
  paywall_subscription: "paywall_subscription",
};

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function readJson(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing consensus artifact: ${path}`);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in consensus artifact ${path}: ${error.message}`);
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.entries(value).map(([label, direction]) => ({
      label,
      ...(direction && typeof direction === "object" ? direction : { value: direction }),
    }));
  }
  return [];
}

function directionLabel(direction, index) {
  return direction?.label || direction?.direction || direction?.direction_label || direction?.name || `direction_${index + 1}`;
}

function winnerObject(consensus) {
  if (consensus.winner && typeof consensus.winner === "object" && !Array.isArray(consensus.winner)) {
    return consensus.winner;
  }
  return null;
}

function selectedDirections(directions) {
  return directions.filter((direction) => direction?.selected === true || direction?.is_selected === true);
}

function nonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeScreenId(value) {
  return SCREEN_ID_ALIASES[String(value).trim().toLowerCase()] || null;
}

function screenImplicationKeys(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return normalizeScreenId(entry);
        if (entry && typeof entry === "object") {
          return normalizeScreenId(entry.id || entry.screen || entry.screen_id || entry.name || "");
        }
        return null;
      })
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .map((key) => normalizeScreenId(key))
      .filter(Boolean);
  }

  return [];
}

function winnerScreenImplications(consensus) {
  const winner = winnerObject(consensus);
  return (
    winner?.screen_level_implications ||
    winner?.screen_implications ||
    winner?.screen_by_screen_implications ||
    winner?.screens ||
    null
  );
}

function rejectionReason(direction) {
  return (
    direction?.rejection_reason ||
    direction?.rejection_rationale ||
    direction?.why_rejected ||
    direction?.rejected_reason ||
    null
  );
}

function noCloneStatement(consensus) {
  return (
    consensus.no_clone_statement ||
    consensus.no_clone ||
    consensus.anti_clone_statement ||
    consensus.originality_statement ||
    null
  );
}

function validate(consensus) {
  const failures = [];
  const directions = asArray(consensus.directions || consensus.design_directions || consensus.considered_directions);
  const labels = directions.map(directionLabel);
  const winnerArtifact = winnerObject(consensus);
  const winner = winnerArtifact?.label || null;
  const selected = selectedDirections(directions);
  const selectedDirectionLabel = selected.length === 1 ? directionLabel(selected[0], directions.indexOf(selected[0])) : null;

  if (directions.length < 3) {
    failures.push(`at least three design directions must be considered; found ${directions.length}`);
  }

  directions.forEach((direction, index) => {
    const label = directionLabel(direction, index);
    const scores = direction?.scores;
    if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
      failures.push(`${label} missing scores object`);
      return;
    }

    for (const score of REQUIRED_SCORES) {
      const value = scores[score];
      if (value === undefined || value === null || value === "") {
        failures.push(`${label} missing score ${score}`);
      } else if (typeof value !== "number" || !Number.isFinite(value)) {
        failures.push(`${label} score ${score} must be a finite number from 1 to 5`);
      } else if (value < 1 || value > 5) {
        failures.push(`${label} score ${score} must be a number from 1 to 5`);
      }
    }
  });

  if (selected.length !== 1) {
    failures.push(`exactly one direction must be selected; found ${selected.length}`);
  }

  if (!winnerArtifact) {
    failures.push("top-level winner object is required");
  } else if (!nonEmptyText(winner)) {
    failures.push("winner.label is required");
  } else if (!labels.includes(winner)) {
    failures.push(`winner ${winner} is not one of the considered directions`);
  } else if (!nonEmptyText(winnerArtifact.rationale)) {
    failures.push("winner rationale is required");
  } else if (selectedDirectionLabel && selectedDirectionLabel !== winner) {
    failures.push(`selected direction ${selectedDirectionLabel} must match winner ${winner}`);
  }

  directions.forEach((direction, index) => {
    const label = directionLabel(direction, index);
    if (label === winner || direction?.selected === true || direction?.is_selected === true) return;
    if (!nonEmptyText(rejectionReason(direction))) {
      failures.push(`${label} rejected direction missing rejection reason`);
    }
  });

  const selectedScreenImplications = winnerScreenImplications(consensus);
  const selectedScreenIds = new Set(screenImplicationKeys(selectedScreenImplications));
  if (selectedScreenIds.size === 0) {
    failures.push("selected direction must include screen-level implications");
  }
  for (const screenId of REQUIRED_SCREEN_IDS) {
    if (!selectedScreenIds.has(screenId)) {
      failures.push(`winner missing screen-level implication ${screenId}`);
    }
  }

  if (!nonEmptyText(noCloneStatement(consensus))) {
    failures.push("consensus must include a no-clone statement");
  }

  return {
    ok: failures.length === 0,
    failures,
    directions,
    winner,
  };
}

function writeReport(path, report) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
}

const consensusPath = argValue("--consensus", DEFAULT_CONSENSUS_PATH);
const outPath = argValue("--out", DEFAULT_OUT_PATH);

let report;
try {
  const consensus = readJson(consensusPath);
  const validation = validate(consensus);
  report = {
    ok: validation.ok,
    consensus_path: consensusPath,
    out_path: outPath,
    direction_count: validation.directions.length,
    winner: validation.winner,
    required_scores: REQUIRED_SCORES,
    required_screen_ids: REQUIRED_SCREEN_IDS,
    failures: validation.failures,
  };
} catch (error) {
  report = {
    ok: false,
    consensus_path: consensusPath,
    out_path: outPath,
    direction_count: 0,
    winner: null,
    required_scores: REQUIRED_SCORES,
    required_screen_ids: REQUIRED_SCREEN_IDS,
    failures: [error.message],
  };
}

writeReport(outPath, report);

if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report));
