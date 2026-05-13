#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for ${name}`);
  return value;
}

const feedbackPath = resolve(argValue("--feedback", "feedback/consumer-radar-product-feedback.md"));
const outPath = resolve(argValue("--out", ".workflow/app-feedback/feedback-analysis.json"));
const text = readFileSync(feedbackPath, "utf8");
const bullets = text
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^[-*]\s+/.test(line))
  .map((line) => line.replace(/^[-*]\s+/, "").trim());

const lower = text.toLowerCase();
const acceptanceChecks = [
  {
    id: "growth-evidence-provenance",
    required: /apify|scrape|growth hypothesis/.test(lower),
    expectation: "Every growth hypothesis must disclose whether live social scraping ran and lower confidence for fixture-backed claims.",
  },
  {
    id: "visible-review-samples",
    required: /review/.test(lower),
    expectation: "The UI must surface representative App Store review samples for each opportunity.",
  },
  {
    id: "emerging-not-biggest-ranking",
    required: /biggest|fast-growing|fast growing/.test(lower),
    expectation: "Ranking must favor apps with recent velocity outside the top category leaders.",
  },
  {
    id: "visible-example-content",
    required: /example content|tiktok|instagram|content/.test(lower),
    expectation: "The app detail view must show social content examples and source status.",
  },
  {
    id: "add-app-research-seed",
    required: /add more apps|add.+app|get more/.test(lower),
    expectation: "The UI and API must support adding a new app as a research seed.",
  },
].filter((check) => check.required);

const analysis = {
  ok: bullets.length > 0 && acceptanceChecks.length > 0,
  feedback_path: feedbackPath,
  item_count: bullets.length,
  items: bullets,
  acceptance_checks: acceptanceChecks,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(analysis, null, 2)}\n`);
console.log(JSON.stringify(analysis, null, 2));
if (!analysis.ok) process.exit(1);
