# UX Design Cross Critique

Read all design direction candidates in:

`.workflow/iphone-app-ux-studio/design/directions/`

Critique the candidates as an adversarial panel. Each role must evaluate every direction and call out tradeoffs that the consensus agent can score.

## Required Output

Write:

`.workflow/iphone-app-ux-studio/design/cross-critique.md`

Use these headings exactly:

- `# Design Cross Critique`
- `## Direction Coverage`
- `## Half-Asleep Usability Critic`
- `## Premium iOS Critic`
- `## Conversion Critic`
- `## Accessibility Critic`
- `## Anti-Clone Critic`
- `## Implementation Risk Critic`
- `## Scorecard Inputs`
- `## Consensus Recommendations`
- `## No Secret Output`

## Critic Roles

Half-asleep usability critic:

- Test whether the direction works for a user who is tired, impatient, and using the phone one-handed.
- Reject cleverness that slows recognition, task start, task completion, or recovery from mistakes.
- Flag small targets, dense decisions, excessive reading, ambiguous status, and motion that creates friction.

Premium iOS critic:

- Evaluate native iOS quality, fit with Apple Human Interface Guidelines, SwiftUI feasibility, polish, and restraint.
- Flag web-like navigation, custom controls that fight platform expectations, weak typography, weak dark mode, and visual noise.

Conversion critic:

- Evaluate whether the direction creates a credible premium promise without dark patterns.
- Flag paywall confusion, low perceived value, coercive streak mechanics, missing trust cues, and weak upgrade moments.

Accessibility critic:

- Evaluate VoiceOver, Dynamic Type, contrast, reduced motion, haptics alternatives, cognitive load, error recovery, and localization.
- Flag any direction that depends on color, motion, tiny type, sound, haptics, or speed as the only carrier of meaning.

Anti-clone critic:

- Identify any candidate that too closely follows a competitor, Mobbin/Pageflows example, Apple sample, or recognizable product.
- Separate safe pattern adaptation from unsafe copying of layouts, copy, assets, brand systems, screenshots, animation sequences, or proprietary flows.

Implementation risk critic:

- Evaluate SwiftUI scope, custom design system work, animation complexity, data dependencies, screenshot testability, and release risk.
- Flag ideas that would force broad boilerplate rewrites or distract from the core wake/task workflow.

## Scorecard Inputs

For each direction, provide notes that can support scores for:

- `differentiation`
- `native_ios_quality`
- `wake_state_usability`
- `conversion_potential`
- `accessibility`
- `implementation_risk`
- `visual_distinctiveness`

Do not select a final winner unless a role has a clear role-specific recommendation. The tournament consensus agent owns final selection.

## No Secret Output

Do not print, persist, summarize, or infer credentials, session tokens, private links, signed URLs, cookies, API keys, or user secrets. If a source contains secrets or private account information, write only: `secret material omitted`.
