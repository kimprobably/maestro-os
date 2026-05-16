# UX Implement Visual System

Implement only the visual system portion of the UX Studio direction in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Read:

- `.workflow/iphone-app-ux-studio/implementation-plan.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`
- existing app design system, theme, SwiftUI component, localization, accessibility, and test files

Focus on reusable app-specific SwiftUI building blocks that let the existing app express the selected direction without rebuilding app behavior.

## Scope

Implement or update:

- design tokens and semantic theme colors for light mode, dark mode, high contrast, disabled, destructive, success, warning, premium, and active task states
- typography wrappers that respect Dynamic Type and the existing localization strategy
- reusable SwiftUI components for cards, rows, status/progress, primary actions, secondary actions, empty states, loading states, error states, premium callouts, and completion feedback
- shape, spacing, divider, background, shadow, and material conventions needed by the screen specs
- VoiceOver labels, hints, traits, focus order helpers, target sizes, reduce-motion behavior, and haptic alternatives where component-level support is appropriate
- tests and previews that prove components scale across Dynamic Type, dark mode, and key states

## Constraints

- Preserve existing auth, payment, entitlement, networking, storage, navigation, and bundle ID behavior.
- Do not implement full screen flow rewrites in this phase. Only add the visual system and narrowly update call sites required to compile or demonstrate reusable components.
- Use existing app conventions before adding new abstractions.
- Keep components native to SwiftUI and justified by the selected direction. Avoid generic boilerplate styling with no app-specific purpose.
- Treat competitor and Mobbin/Pageflows references as abstract pattern evidence only. Do not copy assets, copy, screenshots, brand identity, layouts, or proprietary interaction sequences.
- Do not output secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values. If a source contains secrets or private account information, write only: `secret material omitted`.

## Required Evidence

Write `.workflow/iphone-app-ux-studio/evidence/visual-system.md` with these headings exactly:

- `# Visual System Evidence`
- `## Files changed`
- `## Commands run`
- `## Acceptance criteria`
- `## Component inventory`
- `## Accessibility notes`
- `## Screenshot states prepared`
- `## Risks`
- `## Verifier notes`

Under `## Verifier notes`, write exactly:

`- Pending independent verifier.`

## Acceptance Criteria

Evidence must show:

- design tokens and theme colors are defined or mapped to existing tokens
- reusable app-specific SwiftUI components are implemented instead of one-off styling
- typography wrappers support Dynamic Type without clipping at common sizes
- cards, rows, and progress/status components match the selected UX direction
- VoiceOver labels or helpers exist for tappable and stateful components
- tests, previews, or screenshot states cover light mode, dark mode, Dynamic Type, active task, completion, loading, error, and empty states where applicable
- existing behavior remains preserved
- verifier notes are left pending for a separate reviewer and are not self-approved by the implementation agent
