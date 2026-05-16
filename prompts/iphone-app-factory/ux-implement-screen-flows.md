# UX Implement Screen Flows

Implement the selected UX Studio direction across the existing iPhone app screens in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Read:

- `.workflow/iphone-app-ux-studio/implementation-plan.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`
- `.workflow/iphone-app-ux-studio/evidence/visual-system.md`
- current app source, tests, Appium identifiers, screenshot manifest, and previews

Use the visual system components from the `visual-system` phase. Preserve existing behavior while changing the interface to match the selected screen specs.

## Required Screens

Implement the selected direction across these screen ids:

- `onboarding`
- `home`
- `primary_list`
- `create_edit`
- `active_task`
- `completion`
- `history_streaks`
- `profile_settings`
- `paywall_subscription`

If the existing app combines two screen ids into one view, keep the current navigation model and document the shared file mapping in evidence.

## Scope

For each screen:

- preserve existing data flow, persistence, auth, entitlements, networking, payment behavior, navigation destinations, and bundle ID
- implement hierarchy, primary action, secondary actions, empty/loading/error/success states, copy direction, and accessibility requirements from `screen-spec.json`
- keep Appium identifiers stable where possible and add new identifiers for new controls, tabs, cells, state banners, paywall actions, active task controls, and completion actions
- ensure Dynamic Type, VoiceOver, dark mode, light mode, reduced motion, one-handed reach, target sizes, and contrast remain acceptable
- update tests, previews, screenshot manifests, or Appium flows needed to prove the redesigned states

## Constraints

- Do not rebuild auth, payments, networking, storage, localization infrastructure, settings infrastructure, or release configuration.
- Do not use generic `List` or `Form` boilerplate as the primary visual solution unless the implementation plan explicitly justifies native intent for that screen.
- The active task/wake state must be visually distinct and appropriately urgent for the selected direction.
- Setup/create modes must remain calm and structured, not chaotic.
- Completion/accountability must be visible and not treated as a throwaway toast.
- Treat competitor and Mobbin/Pageflows references as abstract pattern evidence only. Do not copy assets, copy, screenshots, brand identity, layouts, or proprietary interaction sequences.
- Do not output secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values. If a source contains secrets or private account information, write only: `secret material omitted`.

## Required Evidence

Write `.workflow/iphone-app-ux-studio/evidence/screen-flows.md` with these headings exactly:

- `# Screen Flows Evidence`
- `## Files changed`
- `## Commands run`
- `## Acceptance criteria`
- `## Screen implementation notes`
- `## Behavior preservation notes`
- `## Appium identifier changes`
- `## Screenshot states captured`
- `## Risks`
- `## Verifier notes`

Under `## Verifier notes`, write exactly:

`- Pending independent verifier.`

## Acceptance Criteria

Evidence must show:

- every required screen id is implemented, mapped to exact files, or explicitly documented as not present in the existing app
- existing behavior is preserved for auth, payments, entitlements, networking, storage, navigation, settings, and bundle ID
- expected states are implemented or captured for empty, loading, error, success, active task, completion, and paywall/subscription flows
- Appium identifiers are preserved or updated intentionally
- screenshot evidence is ready for UX review and includes before/after states where available
- tests or verification commands cover the changed screen flows
- verifier notes are left pending for a separate reviewer and are not self-approved by the implementation agent
