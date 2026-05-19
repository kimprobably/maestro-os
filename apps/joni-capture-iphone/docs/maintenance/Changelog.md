# Changelog

All notable changes to this project will be documented here. See `docs/maintenance/ReleaseProcess.md` for process and estimation method.

## [1.9.0] - 2026-03-06

### Added
- Environment-aware CLAUDE.md with Xcode MCP and CLI context detection (CLAUDE_CONFIG_DIR)
- Module-level READMEs for all 11 packages (added DesignSystem, FeatureRating, FeatureSettings)
- LLM-ready PROMPTS.md in every package (2-4 prompts each, referencing real types and patterns)
- File organization patterns and naming conventions section in CLAUDE.md
- Integration details section in CLAUDE.md (Supabase, RevenueCat, OpenRouter specifics)
- Expanded anti-patterns section: no UIKit, no ObservableObject (use @Observable), no raw URLSession

### Fixed
- EchoLLMClient not activating in debug mode: guard in createLLMClient() now checks for "placeholder" in PROXY_BASE_URL (previously only checked for "YOUR", but the default value contains "placeholder")

## [Unreleased]
### Added
- Two-tier documentation system (Mintlify + /docs)
- Unified authentication (Apple + Google + Email) via Supabase
- Prompt Packs for Feature.Chat and Onboarding
- Build with AI sections in Mintlify
- Integrations pages (Supabase, RevenueCat, Crashlytics)
- Troubleshooting and Migrations index pages

### Changed
- Refined welcome hero, credibility, and stats
- Updated navigation to docs-site/docs.json
- README now points to Mintlify and CLAUDE.md

### Fixed
- Protocol conformance for all AuthClient implementations

