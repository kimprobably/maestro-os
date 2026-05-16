# UX Design Tournament Consensus

Read:

- `.workflow/iphone-app-ux-studio/design/directions/calm_accountability_direction.md`
- `.workflow/iphone-app-ux-studio/design/directions/hard_wake_direction.md`
- `.workflow/iphone-app-ux-studio/design/directions/gamified_streak_direction.md`
- `.workflow/iphone-app-ux-studio/design/directions/minimal_native_direction.md`
- `.workflow/iphone-app-ux-studio/design/cross-critique.md`
- `.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json`
- `.workflow/iphone-app-ux-studio/research/competitor-flows.md`
- `.workflow/iphone-app-ux-studio/research/app-store-review-mining.md`
- `.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md`
- all available research and reference artifacts in `.workflow/iphone-app-ux-studio/research/` and `.workflow/iphone-app-ux-studio/design/`

Run an adversarial design tournament. Consider at least three directions and prefer the direction that is most differentiated, native to iOS, usable in a wake state, convertible without dark patterns, accessible, feasible, and visually distinct without cloning another product.

## Required Outputs

Write both files:

- `.workflow/iphone-app-ux-studio/design/tournament-consensus.md`
- `.workflow/iphone-app-ux-studio/design/tournament-consensus.json`

The JSON output is gate-enforced by `scripts/iphone-app-factory/design-tournament-gate.mjs`. It must be valid JSON with no Markdown fences.

## Markdown Structure

`tournament-consensus.md` must include these headings exactly:

- `# Design Tournament Consensus`
- `## Directions Considered`
- `## Scorecard`
- `## Winner`
- `## Rejected Directions`
- `## Screen-Level Implications`
- `## Monetization Implications`
- `## Accessibility Commitments`
- `## Implementation Risks`
- `## No-Clone Statement`
- `## Source List`
- `## No Secret Output`

## JSON Schema

`tournament-consensus.json` must use this structure:

```json
{
  "directions": [
    {
      "label": "calm_accountability_direction",
      "scores": {
        "differentiation": 1,
        "native_ios_quality": 1,
        "wake_state_usability": 1,
        "conversion_potential": 1,
        "accessibility": 1,
        "implementation_risk": 1,
        "visual_distinctiveness": 1
      },
      "score_rationale": {
        "differentiation": "Short evidence-backed rationale.",
        "native_ios_quality": "Short evidence-backed rationale.",
        "wake_state_usability": "Short evidence-backed rationale.",
        "conversion_potential": "Short evidence-backed rationale.",
        "accessibility": "Short evidence-backed rationale.",
        "implementation_risk": "Short evidence-backed rationale.",
        "visual_distinctiveness": "Short evidence-backed rationale."
      },
      "selected": false,
      "rejection_reason": "Required for every non-selected direction.",
      "screen_level_implications": {
        "onboarding": "Screen-level design consequence.",
        "home": "Screen-level design consequence.",
        "primary_list": "Screen-level design consequence.",
        "create_edit": "Screen-level design consequence.",
        "active_task": "Screen-level design consequence.",
        "completion": "Screen-level design consequence.",
        "history_streaks": "Screen-level design consequence.",
        "profile_settings": "Screen-level design consequence.",
        "paywall_subscription": "Screen-level design consequence."
      }
    }
  ],
  "winner": {
    "label": "selected_direction_label",
    "rationale": "Why this direction wins after adversarial critique.",
    "screen_level_implications": {
      "onboarding": "Selected direction implication.",
      "home": "Selected direction implication.",
      "primary_list": "Selected direction implication.",
      "create_edit": "Selected direction implication.",
      "active_task": "Selected direction implication.",
      "completion": "Selected direction implication.",
      "history_streaks": "Selected direction implication.",
      "profile_settings": "Selected direction implication.",
      "paywall_subscription": "Selected direction implication."
    }
  },
  "no_clone_statement": "Explicit statement that the winning UX adapts abstract patterns only and does not copy another app's assets, copy, branding, visual composition, screenshots, or proprietary interaction sequences.",
  "source_list": [
    {
      "source": "Artifact or external source name.",
      "used_for": "What evidence it contributed."
    }
  ]
}
```

Scores must be finite numbers from 1 to 5, where 5 is strongest. For `implementation_risk`, 5 means low implementation risk and 1 means high implementation risk.

## Hard Requirements

- Include at least three directions in `directions`.
- Include all seven score keys for every direction: `differentiation`, `native_ios_quality`, `wake_state_usability`, `conversion_potential`, `accessibility`, `implementation_risk`, and `visual_distinctiveness`.
- Select exactly one winner and mark only that direction with `"selected": true`.
- Every rejected direction must include a concrete `rejection_reason`.
- The winner must include screen-level implications for onboarding, home, primary list, create/edit, active task, completion, history/streaks, profile/settings, and paywall/subscription.
- Include a direct `no_clone_statement` in the JSON and Markdown.
- Do not leak credentials, cookies, signed URLs, private account details, API keys, or secrets. If a source contains secrets or private account information, write only: `secret material omitted`.
