# UX Quality Review

Review the implemented UX Studio changes in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Read:

- `.workflow/iphone-app-ux-studio/implementation-plan.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`
- `.workflow/iphone-app-ux-studio/evidence/visual-system.md`
- `.workflow/iphone-app-ux-studio/evidence/screen-flows.md`
- `.workflow/iphone-app-ux-studio/reviews/screenshot-evidence.md` if present
- current app source, tests, screenshot manifest, screenshots, Appium report, and any UX review notes

Independently judge whether the implementation matches the selected direction, preserves existing behavior, and meets iPhone UX quality expectations.

## Required Output

Write:

`.workflow/iphone-app-ux-studio/reviews/ux-quality.md`

## Required Headings

Use these headings exactly:

- `# UX Quality Review`
- `## Source List`
- `## Findings`
- `## Screen Coverage`
- `## Visual System Quality`
- `## Behavior Preservation`
- `## Accessibility And Dynamic Type`
- `## Screenshot Evidence`
- `## No-Clone Review`
- `## Required Fixes`
- `## Verdict`

## Reject If

Reject the implementation if any of these are true:

- the UI is mostly generic `List` or `Form` boilerplate without a justified native iOS intent tied to the screen spec
- the active task or wake state is too calm, low contrast, or visually indistinct from setup/create/edit states
- setup mode is chaotic, overloaded, or visually louder than the active task state
- completion/accountability is missing, hidden, reduced to a disposable toast, or not tied to user progress
- screenshot evidence is missing, incomplete, blank, nearly blank, or does not include required before/after states where available
- Mobbin, Pageflows, competitor flows, screenshots, assets, copy, brand identity, visual compositions, or proprietary interaction sequences were copied rather than abstracted
- text clips, truncates unexpectedly, overlaps, becomes unreadable, or controls overlap/collide at supported Dynamic Type sizes or common iPhone widths
- tappable controls lack discoverable labels or stable Appium identifiers where automation needs them
- auth, payment, entitlement, networking, storage, localization infrastructure, bundle ID, or release configuration was rebuilt without an explicit later ADR
- dark mode, light mode, reduced motion, VoiceOver, one-handed reach, or contrast is materially worse than before
- evidence claims work that is not visible in code, screenshots, tests, or Appium output

## Review Expectations

- Prefer concrete findings with file paths, screen ids, screenshot paths, and test names.
- If rejecting, list exact required fixes and the retry target phase: `visual-system` or `screen-flows`.
- If approving, mention residual risks or follow-up checks, but do not add conditions after approval.
- Do not output secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values. If a source contains secrets or private account information, write only: `secret material omitted`.

End `.workflow/iphone-app-ux-studio/reviews/ux-quality.md` with exactly one of these verdict lines:

`VERDICT: APPROVED`

or

`VERDICT: REJECTED`
