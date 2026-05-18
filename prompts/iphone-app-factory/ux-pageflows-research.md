# UX Page Flows Research

Research Page Flows or comparable public flow references and write the artifact to `.workflow/iphone-app-ux-studio/research/pageflows-research.md`.

## Source Policy

- Use Page Flows when available through permitted access, then public product videos, App Store previews, public websites, and public support docs as fallback.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, or environment variable values.
- Do not clone proprietary screens, exact layouts, UI copy, brand identity, screenshots, or assets.
- Raw flow captures are private-only evidence unless the source explicitly permits reuse.

## Required Headings

Use these exact headings:

1. `# Page Flows Research`
2. `## Source Policy`
3. `## Source List`
4. `## Flow References`
5. `## Screen Type Coverage`
6. `## Transition And State Patterns`
7. `## what_to_adapt`
8. `## what_not_to_copy`
9. `## Raw Asset Privacy`

## Required Content

- Include product, source URL or source description, flow name, screen types, observed transitions, empty/error states, `what_to_adapt`, and `what_not_to_copy` for each reference.
- Prefer references that clarify multi-screen behavior rather than static visual style.
- Mark every captured raw asset as `private_only=true` in the notes so downstream synthesis can preserve that flag.
