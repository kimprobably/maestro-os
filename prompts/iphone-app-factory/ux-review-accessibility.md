# UX Accessibility Review

Review the UX Studio implementation in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}` for accessibility, Dynamic Type, contrast, motion, VoiceOver, target sizes, and automation discoverability.

Do not output secrets. If a source artifact contains credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values, write `secret material omitted` and reject the review.

Read:

- `.workflow/iphone-app-ux-studio/implementation-plan.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`
- `.workflow/iphone-app-ux-studio/evidence/visual-system.md`
- `.workflow/iphone-app-ux-studio/evidence/screen-flows.md`
- `reports/ios/screenshots/manifest.json`
- Appium/XCUITest reports, screenshot evidence, changed SwiftUI files, previews, and tests

## Required Output

Write:

`.workflow/iphone-app-ux-studio/reviews/accessibility.md`

## Required Headings

Use these headings exactly:

- `# UX Accessibility Review`
- `## Source List`
- `## Findings`
- `## Dynamic Type`
- `## VoiceOver`
- `## Contrast And Motion`
- `## Hit Targets And Reach`
- `## Automation Identifiers`
- `## Required Fixes`
- `## Verdict`

## Reject If

Reject if any of these are true:

- text clips, overlaps, truncates unexpectedly, or becomes unreadable at supported Dynamic Type sizes
- VoiceOver labels, hints, traits, or focus order are missing for primary actions, active task controls, paywall actions, navigation controls, task rows, or state banners
- color contrast is materially worse in light mode, dark mode, active task state, completion, loading, error, or disabled states
- reduced motion is ignored for nonessential animation
- tappable targets are too small or hard to reach on common iPhone widths
- Appium identifiers are missing or unstable for controls automation must discover
- screenshot evidence is missing for accessibility-relevant states
- auth, payment, networking, storage, localization infrastructure, bundle ID, or release configuration was rebuilt without an explicit later ADR
- Mobbin, Pageflows, competitor screenshots, layouts, copy, brand identity, assets, or proprietary interactions were copied rather than abstracted
- secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values appear in evidence or screenshots

End `.workflow/iphone-app-ux-studio/reviews/accessibility.md` with exactly one of these verdict lines:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
