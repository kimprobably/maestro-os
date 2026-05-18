#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

function normalize(value) {
  return String(value || "").trim();
}

const reportPath = argValue("--out", ".workflow/iphone-app-factory/run-input-gate.json");
const inputs = {
  app_type: normalize(argValue("--app-type")),
  target_audience: normalize(argValue("--target-audience")),
  app_name: normalize(argValue("--app-name")),
  bundle_id: normalize(argValue("--bundle-id")),
  app_dir: normalize(argValue("--app-dir")),
  spec_kitty_feature: normalize(argValue("--spec-kitty-feature")),
  ios_validation_mode: normalize(argValue("--ios-validation-mode", "github")),
  allow_macos_deferred: normalize(argValue("--allow-macos-deferred", "false")),
};

const failures = [];
if (!inputs.app_type || /consumer iPhone app in productivity|generated|default/i.test(inputs.app_type)) {
  failures.push("app_type must be run-specific");
}
if (!inputs.target_audience || /US consumer iPhone users$/i.test(inputs.target_audience)) {
  failures.push("target_audience must be run-specific");
}
if (!inputs.app_name || inputs.app_name === "Generated iPhone App") {
  failures.push("app_name must be run-specific");
}
if (!/^com\.[a-z0-9][a-z0-9.-]*\.[a-z0-9][a-z0-9-]*$/.test(inputs.bundle_id)) {
  failures.push("bundle_id must be lowercase reverse-DNS");
}
if (inputs.bundle_id === "com.maestro.generatediphoneapp") {
  failures.push("bundle_id must not use generic default");
}
if (!/^apps\/[a-z0-9-]+-iphone$/.test(inputs.app_dir)) {
  failures.push("app_dir must match apps/<slug>-iphone");
}
if (inputs.app_dir === "apps/generated-iphone-app") {
  failures.push("app_dir must not use generic default");
}
if (!/^[a-z0-9-]+-iphone-app$/.test(inputs.spec_kitty_feature)) {
  failures.push("spec_kitty_feature must match <slug>-iphone-app");
}
if (inputs.spec_kitty_feature === "iphone-app-factory") {
  failures.push("spec_kitty_feature must not use generic default");
}
if (inputs.ios_validation_mode !== "github") {
  failures.push("ios_validation_mode must be github for overnight iPhone runs");
}
if (inputs.allow_macos_deferred !== "false") {
  failures.push("allow_macos_deferred must be false for overnight iPhone runs");
}

const report = {
  ok: failures.length === 0,
  inputs: {
    ...inputs,
    target_audience: inputs.target_audience ? "[present]" : "",
    app_type: inputs.app_type ? "[present]" : "",
  },
  failures,
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report));
