# Agent instructions (Cursor, Claude Code, Codex, etc.)

This repository is **SwiftAI Boilerplate Pro** — a Swift 6 / SwiftUI iOS app with modular SPM packages.

## Read first

- **`docs/CLAUDE.md`** — Architecture, MVVM, `Composition`/`CompositionRoot`, module boundaries, Liquid Glass (`SAIGlass`), and how to extend the app without rewriting core patterns.
- **`docs/INDEX.md`** — Map to module docs, recipes, and integrations.

## App Store submission

- Before the first upload (or after a **Guideline 4.3** rejection), follow **`docs/checklists/APP_STORE_4_3_HARDENING.md`** — Release binary `strings` audit, branding locations, metadata, module removal, and Review Notes. Buyers often forget **dead Swift files** still compiled into the app target; scrub template literals (`SwiftAI`, `Boilerplate`, demo copy).

## Cursor

Project rules live in **`.cursor/rules/*.mdc`**. They complement `docs/CLAUDE.md`, not replace it.
