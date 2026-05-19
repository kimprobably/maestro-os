# Welcome — SwiftAI Boilerplate Pro

Thank you for purchasing. This file is safe to **bundle in your delivery zip** and to reuse as **post-purchase email** copy.

---

## Before your first App Store upload (required)

**App Store Guideline 4.3(a)** rejects apps that look like undifferentiated template spam (similar **binary**, **metadata**, or **concept** to other submissions). Using this codebase is fine; shipping it **without** meaningful differentiation is not.

**Read this first:**

→ **[APP_STORE_4_3_HARDENING.md](../checklists/APP_STORE_4_3_HARDENING.md)**

That checklist covers: Release **`strings`** audit on your `.app`, where to rebrand, removing dead demo files from the app target, module removal, and App Review Notes. Prompt pack: [`docs/prompts/AppStore4_3Hardening.prompts.md`](../prompts/AppStore4_3Hardening.prompts.md).

---

## Quick start after unzip

1. Open `SwiftAIBoilerplatePro.xcodeproj` in **Xcode 26.2+** (see `README.md` for toolchain).
2. Run once with mocks — no API keys required.
3. Follow **`README.md`** → configure `Config/Secrets.xcconfig` when you are ready for real Auth / AI / Payments.
4. Keep **`docs/CLAUDE.md`** open for AI-assisted development (Cursor, Claude Code, etc.).
5. **Before submit:** complete the hardening checklist above.

---

## Copy-paste email (post-purchase)

**Subject:** SwiftAI Boilerplate Pro — your download + one thing before the App Store

**Body:**

```text
Hi,

Thanks for your purchase. Your boilerplate includes full source, 11 SPM packages, docs, and Cursor rules.

Quick links:
• Getting started: see README.md in the project root
• AI-assisted development: docs/CLAUDE.md

Required before your first App Store submission:
→ docs/checklists/APP_STORE_4_3_HARDENING.md

Apple sometimes flags “template similarity” (Guideline 4.3). That guide walks you through a Release binary audit, rebranding, metadata, and what to remove if you drop modules (e.g. chat/AI).

If anything fails to build, check Xcode version (26.2+) and RELEASE_NOTES.md.

—
```

Replace the sign-off with your support channel as needed.

---

## Support materials in this repo

| Resource | Purpose |
|----------|---------|
| [`docs/INDEX.md`](../INDEX.md) | Full documentation map |
| [`docs/BUILDING_YOUR_APP.md`](../BUILDING_YOUR_APP.md) | Boilerplate → App Store journey |
| [`docs/recipes/WhiteLabeling.md`](../recipes/WhiteLabeling.md) | Rebrand (pair with 4.3 checklist) |
| [`AGENTS.md`](../../AGENTS.md) | Cursor / agent entry point (repo root) |
