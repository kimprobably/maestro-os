The `selected-spec.md` has been written with the final consensus. Here's a summary:

**Selected spec**: `fallback-data-truth.md` — chosen because it anchors on the user's primary concern: "How do you know what the growth hypothesis is if the Apify key is not set?"

**5 acceptance gates**, each mapped to product feedback, capability gaps, and existing deterministic tests:

| Gate | Feedback | Deterministic Test |
|------|----------|-------------------|
| growth-evidence-provenance | "Did you actually scrape?" | `feedback-surface.test.js` + new real-mode rejection test |
| visible-review-samples | "Can I see the reviews?" | `feedback-surface.test.js` (reviewSamples ≥ 2, frontend markers) |
| emerging-not-biggest-ranking | "Not the biggest in category" | `feedback-surface.test.js` (emerging beats leader) |
| visible-example-content | "Can I see example content?" | `feedback-surface.test.js` (exampleContent ≥ 2, source provenance) |
| add-app-research-seed | "Can I add more apps?" | `feedback-surface.test.js` (POST /api/apps produces ranked seed) |

**Score**: 1.0 (6/6 rubric), +0.22 above the 0.78 baseline — no regression.

**Next stages needed**: architecture and workflow candidate generation, followed by their contract/model evals, then a simplification pass on the app code.

**VERDICT: APPROVED**