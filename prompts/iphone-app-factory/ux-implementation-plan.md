# UX Implementation Plan

Create the implementation plan for applying the UX Studio screen specs to the existing iPhone app in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Read:

- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`
- `.workflow/iphone-app-ux-studio/design/tournament-consensus.md`
- `.workflow/iphone-app-ux-studio/research/existing-app-intake.md`
- the existing SwiftUI app source, tests, Appium identifiers, and current screenshot manifest

Map the selected UX direction to exact files in the existing app repository. This is a planning task only. Do not edit app source.

## Required Output

Write:

`.workflow/iphone-app-ux-studio/implementation-plan.md`

## Required Headings

Use these headings exactly:

- `# UX Implementation Plan`
- `## Source List`
- `## Existing App File Map`
- `## Screen Spec To File Mapping`
- `## Expected SwiftUI Components`
- `## Tests To Update`
- `## Screenshot States To Capture`
- `## Appium Identifier Changes`
- `## Phase Breakdown`
- `## Acceptance Criteria`
- `## Explicit Non-Goals`
- `## Risks`
- `## No Secret Output`

## Required Content

Under `## Existing App File Map`, list every existing app file inspected and its role.

Under `## Screen Spec To File Mapping`, map every screen id from `screen-spec.json` to the exact Swift files, asset files, localization files, test files, and Appium identifiers that should change. Use the screen ids exactly: `onboarding`, `home`, `primary_list`, `create_edit`, `active_task`, `completion`, `history_streaks`, `profile_settings`, and `paywall_subscription`.

Under `## Expected SwiftUI Components`, list the reusable app-specific components expected from the implementation, including design token wrappers, theme colors, typography helpers, cards, rows, progress/status components, primary actions, empty/error/loading states, and accessibility wrappers.

Under `## Tests To Update`, list exact unit, UI, snapshot, Appium, or screenshot-manifest tests that should be updated or added. Include what each test proves.

Under `## Screenshot States To Capture`, list exact before/after screenshot states for every required screen, including empty, loading, error, success, active task, completion, paywall/subscription, Dynamic Type, dark mode, and any state named in `screen-spec.json`.

Under `## Appium Identifier Changes`, list existing identifiers to preserve, identifiers to add, and identifiers to rename. Explain how automation will still discover buttons, tabs, cells, navigation controls, paywall actions, and task actions.

Under `## Phase Breakdown`, divide work into:

- `visual-system`
- `screen-flows`
- `ux-quality-review`

Keep each phase scoped and testable.

Under `## Explicit Non-Goals`, include these non-goals verbatim:

- No auth rebuild.
- No payment rebuild.
- No networking/storage rewrite.
- No bundle ID changes.
- No copied competitor assets.

Also add any additional non-goals needed to protect existing app behavior.

## Constraints

- Preserve existing auth, payment, entitlement, networking, storage, localization, bundle ID, and release configuration unless a later ADR explicitly approves a change.
- Treat Mobbin, Pageflows, App Store reviews, competitor screenshots, and competitor flows as research references only. Abstract principles; do not copy assets, copy, screenshots, layouts, brand identity, or proprietary interaction sequences.
- Do not output secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values. If a source contains secrets or private account information, write only: `secret material omitted`.
