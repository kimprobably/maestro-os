# UX Apple HIG Research

Research Apple Human Interface Guidelines and relevant Apple developer guidance for this app type, then write the artifact to `.workflow/iphone-app-ux-studio/research/apple-hig-research.md`.

## Source Policy

- Use official Apple Human Interface Guidelines and official Apple developer documentation as primary sources.
- Use secondary sources only to locate the relevant Apple page, not as authority.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not clone proprietary third-party screens, exact layouts, UI copy, brand identity, screenshots, or assets.

## Required Headings

Use these exact headings:

1. `# Apple HIG Research`
2. `## Source Policy`
3. `## Source List`
4. `## Applicable HIG Constraints`
5. `## Interaction And Motion Guidance`
6. `## Accessibility Guidance`
7. `## Notification And Interruption Guidance`
8. `## Screen Type Implications`
9. `## what_to_adapt`
10. `## what_not_to_copy`

## Required Content

- Include direct Apple source links or exact Apple source names under `## Source List`.
- Translate each HIG constraint into an implication for the current app screens.
- Under `## what_to_adapt`, identify Apple-native principles to apply in SwiftUI.
- Under `## what_not_to_copy`, identify patterns that would violate platform expectations, accessibility, privacy, or interruption norms.
