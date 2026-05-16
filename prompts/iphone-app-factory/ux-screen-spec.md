# UX Screen Spec

Read:

- `.workflow/iphone-app-ux-studio/design/tournament-consensus.md`
- `.workflow/iphone-app-ux-studio/design/tournament-consensus.json`
- `.workflow/iphone-app-ux-studio/design/tournament-gate.json`
- all winning direction source material referenced by the tournament consensus

Convert the winning design direction into implementation-ready iPhone screen specs. Preserve the winning direction's target emotion, visual principles, tokens, accessibility commitments, monetization stance, and no-clone boundaries.

## Required Outputs

Write:

- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`

The Markdown is for implementation planning. The JSON is for downstream checks and screenshot review. Do not include Markdown fences in the JSON file.

## Required Screens

Create a spec for each screen:

- onboarding
- home
- primary list
- create/edit
- active task
- completion
- history/streaks
- profile/settings
- paywall/subscription

## Per-Screen Requirements

Every screen must include:

- purpose: the job this screen performs for the user
- hierarchy: ordered regions and the information priority from top to bottom
- primary action: the one action the screen optimizes for
- secondary actions: supporting actions and where they live
- empty state: what appears before user data exists
- loading state: what appears while data or entitlement state is loading
- error state: what appears when a save, sync, purchase, permission, or network operation fails
- copy direction: tone, example labels, avoided phrases, and localization constraints
- accessibility requirements: VoiceOver labels, focus order, Dynamic Type behavior, contrast, reduced motion, haptic alternatives, target sizes, and one-handed reach
- screenshot acceptance criteria: concrete visual checks a reviewer can apply to simulator screenshots

## Markdown Structure

`screen-spec.md` must include these headings exactly:

- `# UX Screen Spec`
- `## Winning Direction Summary`
- `## Global Visual System`
- `## Global Accessibility Requirements`
- `## Screens`
- `## Screenshot Acceptance Checklist`
- `## No-Clone Statement`
- `## No Secret Output`

Under `## Screens`, use one `###` subsection per required screen.

## JSON Schema

`screen-spec.json` must use this structure:

```json
{
  "winning_direction": "selected_direction_label",
  "global_visual_system": {
    "target_emotion": "Short summary.",
    "tokens": ["semantic token names"],
    "typography": "Dynamic Type and hierarchy summary.",
    "motion": "Motion and reduced-motion summary."
  },
  "screens": [
    {
      "id": "onboarding",
      "purpose": "The screen job.",
      "hierarchy": ["Top priority", "Second priority"],
      "primary_action": "Primary action label and behavior.",
      "secondary_actions": ["Secondary action and placement"],
      "states": {
        "empty": "Empty state behavior.",
        "loading": "Loading state behavior.",
        "error": "Error state behavior."
      },
      "copy_direction": "Tone, sample labels, avoided phrases, localization constraints.",
      "accessibility_requirements": ["Requirement"],
      "screenshot_acceptance_criteria": ["Concrete screenshot check"]
    }
  ],
  "no_clone_statement": "The screen specs adapt abstract patterns only and do not copy another app's assets, copy, brand, visual composition, screenshots, or proprietary interaction sequences."
}
```

Use the screen ids exactly: `onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, and `paywall_subscription`.

## Screenshot Acceptance Criteria Guidance

Acceptance criteria must be visible and testable from screenshots. Include checks for:

- the primary action is visible without scrolling on the intended screen
- text does not truncate at common Dynamic Type sizes unless explicitly allowed
- core status is understandable in dark mode and light mode
- no element depends on color alone
- loading and error states preserve layout stability
- paywall/subscription clearly separates free and premium value without dark patterns
- screens do not visually clone any named competitor or reference source

## No Secret Output

Do not print, persist, summarize, or infer credentials, session tokens, private links, signed URLs, cookies, API keys, or user secrets. If a source contains secrets or private account information, write only: `secret material omitted`.
