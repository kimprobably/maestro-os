# UX Design Direction Candidate

You are one branch in the UX Studio design direction tournament. The same prompt is run by multiple agents with one of these direction labels:

- `calm_accountability_direction`
- `hard_wake_direction`
- `gamified_streak_direction`
- `minimal_native_direction`

Use the assigned direction label from your run context. Do not invent a fifth direction and do not collapse directions together.

Read all available context:

- `.workflow/iphone-app-ux-studio/preflight.json`
- `.workflow/iphone-app-ux-studio/research/reference-gap-analysis.json`
- `.workflow/iphone-app-ux-studio/research/competitor-flows.md`
- `.workflow/iphone-app-ux-studio/research/app-store-review-mining.md`
- `.workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md`
- `.workflow/iphone-app-ux-studio/research/pageflows-research.md`
- `.workflow/iphone-app-ux-studio/research/apple-hig-research.md`
- `.workflow/iphone-app-ux-studio/research/behavioral-ux-research.md`
- `.workflow/iphone-app-ux-studio/research/design-opportunity-synthesis.md`
- `.workflow/iphone-app-ux-studio/research/reference-pack.json`
- any retrieved reference pack artifacts in `.workflow/iphone-app-ux-studio/design/`

Design a distinct iPhone UX direction for a wake/task app. Treat competitor and Mobbin/Pageflows material as pattern evidence only. Adapt principles, not assets, screenshots, branding, copy, or proprietary compositions.

If parallel research branch Markdown artifacts are absent, use `reference-pack.json` and `design-opportunity-synthesis.md` as the durable research contract. Do not retry or block solely because a branch sidecar Markdown file was not merged into the parent workspace.

## Required Output

Write your candidate to:

`.workflow/iphone-app-ux-studio/design/directions/<direction_label>.md`

The Markdown must include these headings exactly:

- `# Design Direction: <direction_label>`
- `## Target Emotion`
- `## Visual Principles`
- `## Colors And Tokens`
- `## Typography`
- `## Motion`
- `## Screen-By-Screen Implications`
- `## Monetization Implications`
- `## Accessibility Risks`
- `## Implementation Risks`
- `## Source List`
- `## What To Adapt`
- `## What Not To Copy`
- `## No Secret Output`

## Direction Requirements

Your candidate must define:

- target emotion: the feeling this direction should create in the first 10 seconds, in the wake state, and after task completion
- visual principles: layout density, contrast model, component shape language, information hierarchy, empty-state tone, and how this direction stays native to iOS
- colors and tokens: semantic token names, light/dark mode behavior, accent strategy, destructive states, success states, disabled states, and high-contrast fallback
- typography: Dynamic Type behavior, title/body/caption roles, numeric treatment, and minimum readable sizes
- motion: transition principles, reduce-motion behavior, haptics, animation timing ranges, and wake-state restraint
- screen-by-screen implications for onboarding, home, primary list, create/edit, active task, completion, history/streaks, profile/settings, and paywall/subscription
- monetization implications: what premium promise this direction supports, what should remain free, and how to avoid coercive dark patterns
- accessibility risks: VoiceOver, Dynamic Type, contrast, reduced motion, haptics-only feedback, cognitive load, and one-handed use
- implementation risks: SwiftUI complexity, custom component risk, animation risk, App Store risk, localization risk, and scope tradeoffs
- source list: every reference artifact or external source you used, with a short reason for relevance
- what_to_adapt: abstracted patterns, heuristics, or interaction ideas safe to adapt
- what_not_to_copy: specific visual layouts, assets, copy, brand systems, animations, or distinctive sequences that must not be cloned

## No Secret Output

Do not print, persist, summarize, or infer credentials, session tokens, private links, signed URLs, cookies, API keys, or user secrets. If a source contains secrets or private account information, write only: `secret material omitted`.

## Quality Bar

Make the direction opinionated enough that another agent can critique it adversarially. Avoid generic iOS advice. Every claim should connect to the app's wake-state use case, research evidence, or implementation constraints.
