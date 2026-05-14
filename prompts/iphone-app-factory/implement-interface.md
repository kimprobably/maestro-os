# Implement Interface Phase

Implement only the SwiftUI interface phase in `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Use:

- existing AppShell/navigation patterns
- DesignSystem tokens/components
- Localization where strings are user-visible
- accessibility labels for every tappable control
- Dynamic Type and VoiceOver friendly layouts

Do not make the first screen a marketing landing page. Build the actual app experience.

Also make sure the Appium exploratory tapper can discover buttons, tabs, cells, and navigation controls.

Write `.workflow/iphone-app-factory/evidence/interface.md` with:

- `Files changed`
- `Commands run`
- `Acceptance criteria`
- `Risks`
