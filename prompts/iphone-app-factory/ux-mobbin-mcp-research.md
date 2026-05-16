# UX Mobbin MCP Research

Research iOS pattern references through Mobbin and write the artifact to `.workflow/iphone-app-ux-studio/research/mobbin-mcp-research.md`.

## Source Policy

- Prefer the official Mobbin MCP when it is available in the environment.
- If official Mobbin MCP is unavailable, fallback to Mobbin native email/password web login only.
- Do not use Google OAuth or any social OAuth path for Mobbin.
- If Mobbin access is unavailable after the allowed paths, use non-Mobbin public references and clearly label them as fallback public references.
- Do not output secrets, credentials, tokens, cookies, private keys, session values, email values, password values, or environment variable values.
- Do not clone proprietary screens, exact layouts, UI copy, brand identity, screenshots, or assets.
- Raw Mobbin assets are private-only evidence and must never be treated as reusable app assets.

## Required Headings

Use these exact headings:

1. `# Mobbin MCP Research`
2. `## Source Policy`
3. `## Source List`
4. `## Access Path Used`
5. `## Pattern References`
6. `## Screen Type Coverage`
7. `## Raw Asset Privacy`
8. `## what_to_adapt`
9. `## what_not_to_copy`
10. `## Fallback Notes`

## Required Content

- State whether the source path was official Mobbin MCP, Mobbin native email/password web login, or non-Mobbin public fallback. Do not print credential values.
- Include at least four Mobbin or fallback pattern references when available.
- For each reference, include product name, source path, screen type, pattern summary, `what_to_adapt`, and `what_not_to_copy`.
- Mark every captured raw asset as `private_only=true` in the notes so downstream synthesis can preserve that flag.
