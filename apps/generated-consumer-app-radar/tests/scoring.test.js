import test from "node:test";
import assert from "node:assert/strict";
import { rankApps, scoreApp } from "../src/scoring.js";

test("score rewards acceleration and review/social velocity", () => {
  const fast = {
    rankDelta4w: 80,
    reviewDelta4w: 120,
    socialDelta4w: 200,
    rating: 4.8,
    reviewThemes: ["a", "b"],
    featureRequests: ["c"],
  };
  const slow = {
    rankDelta4w: 5,
    reviewDelta4w: 8,
    socialDelta4w: 12,
    rating: 4.9,
    reviewThemes: [],
    featureRequests: [],
  };
  assert.ok(scoreApp(fast) > scoreApp(slow));
});

test("rankApps sorts by opportunity score", () => {
  const ranked = rankApps([
    { id: "slow", rankDelta4w: 1 },
    { id: "fast", rankDelta4w: 90, reviewDelta4w: 90, socialDelta4w: 90 },
  ]);
  assert.equal(ranked[0].id, "fast");
});
