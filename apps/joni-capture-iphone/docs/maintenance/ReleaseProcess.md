# Release Process

This document describes how we prepare, version, and publish releases.

## Versioning
- We use SemVer: MAJOR.MINOR.PATCH
- Breaking changes increment MAJOR
- Backwards-compatible features increment MINOR
- Fixes and docs updates increment PATCH

## Steps
1. Update `docs/maintenance/Changelog.md`
2. Add/update any migration guide under `docs/migrations/`
3. Verify tests pass and lints are clean
4. Update Mintlify `docs-site/docs.json` if navigation changes
5. Tag the release in git: `git tag vX.Y.Z && git push --tags`

## Estimations method
We estimate saved hours and cost using:
- Average development time of each module
- Number of test cases
- Integration complexity

Assumed developer rate: $75–$120/hr.

Typical savings range: **6–10 weeks**, **$15,000–$35,000** compared to building from scratch.

## Buyer-facing notes
- Keep `CLAUDE.md` in repo for AI-assisted workflows
- Direct new buyers to the Mintlify site for setup/publishing
- Use `/docs` for customization and prompt packs
