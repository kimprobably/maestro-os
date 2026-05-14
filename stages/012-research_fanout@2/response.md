Created the required file:

- [design-patterns.md](/home/daytona/workspace/.fabro/scratch/01KRJY9F9PKV1P01YH46A57WTS/parallel/research_fanout/design_pattern_research/.workflow/iphone-app-factory/research/design-patterns.md)

What I did:
- Used WakeTask context from workflow config (`task-alarm`, target audience, app type).
- Mapped six differentiated iOS patterns to SwiftUI implementation and `SwiftAIBoilerplatePro` DesignSystem tokens/components.
- Included all requested fields per pattern:
  - pattern name
  - source app/design reference
  - why it fits
  - what to adapt
  - what not to copy
  - likely DesignSystem components/tokens
- Followed the no-clone constraint explicitly.

Mobbin handling:
- Credential presence check only (true/false) was performed safely.
- Authenticated Mobbin browser session could not be validated in this environment, so I used fallback sources (Apple HIG + local DesignSystem docs), as instructed.

Note:
- This addresses only `design-patterns.md`. The evidence gate will still fail until the other missing required artifacts are present.