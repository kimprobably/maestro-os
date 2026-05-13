import { readFileSync } from "node:fs";
import { rankApps } from "./scoring.js";
import { saveApps } from "./repository.js";

const allowedModes = new Set(["fixture", "live-smoke"]);

export function loadFixtureApps() {
  try {
    return JSON.parse(
      readFileSync(new URL("../fixtures/apps.json", import.meta.url), "utf8"),
    );
  } catch (error) {
    throw new Error(
      "Fixture apps unavailable: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

export async function refreshApps({ mode = "fixture" } = {}) {
  if (!allowedModes.has(mode))
    throw new Error("Unsupported refresh mode: " + mode);
  const apps = loadFixtureApps();
  const ranked = rankApps(apps).map((app, index) => ({
    ...app,
    radarRank: index + 1,
    dataMode: mode,
  }));
  saveApps(ranked);
  return ranked;
}

if (process.argv[1] && process.argv[1].endsWith("ingest.js")) {
  const apps = await refreshApps({
    mode: process.argv.includes("--live") ? "live-smoke" : "fixture",
  });
  console.log(JSON.stringify({ ok: true, apps: apps.length }, null, 2));
}
