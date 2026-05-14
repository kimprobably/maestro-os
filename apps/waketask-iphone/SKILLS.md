# SKILLS.md - Claude Code Skills for SwiftAI Boilerplate Pro

**Supercharge your iOS development with curated Claude Code skills.**

This boilerplate ships with `docs/CLAUDE.md` for project-specific AI guidelines (architecture, module boundaries, abstractions). Skills add **general iOS/SwiftUI best practices** on top — debugging, App Store guidelines, simulator automation, performance profiling, and more.

Together, they enable near-zero-shot project creation: describe your app idea to Claude, and it builds it correctly because it has both your boilerplate's structure and iOS best practices.

---

## Quick Install

Run this from the project root to install all recommended skills:

```bash
npx skills add CharlesWiltgen/Axiom --all
npx skills add rshankras/claude-code-apple-skills --all
npx skills add conorluddy/ios-simulator-skill --all
npx skills add AvdLee/SwiftUI-Agent-Skill --all
```

---

## Recommended Skills

| Skill | Repository | What It Does | Best For |
|-------|-----------|-------------|----------|
| **Axiom** | `CharlesWiltgen/Axiom` | Battle-tested xOS development: SwiftUI debugging, concurrency patterns, iOS 26 features, App Intents, memory leak detection, performance profiling with Instruments | Debugging, performance, modern iOS APIs |
| **Apple Skills Collection** | `rshankras/claude-code-apple-skills` | 148 skills across 23 categories: code generators, App Store submission, testing strategies, HIG compliance, product lifecycle | App Store, testing, generators, product |
| **iOS Simulator** | `conorluddy/ios-simulator-skill` | 21 scripts for simulator automation with semantic navigation. 96% token reduction vs raw tools. Build, test, analyze without leaving the terminal | Automated testing, CI/CD, build workflows |
| **SwiftUI Best Practices** | `AvdLee/SwiftUI-Agent-Skill` | State management (@State, @Binding, @Observable), view architecture, performance optimization, accessibility, animations, Liquid Glass (iOS 26) | UI development, state management |
| **iOS Dev Guide** | `keskinonur/claude-code-ios-dev-guide` | PRD-driven workflows, Swift 6 concurrency patterns, project organization, XcodeBuildMCP integration. **Reference repo** — read for patterns, not installable as a skill. | Project structure, modern Swift patterns |

---

## How Skills + CLAUDE.md Work Together

Think of it as two layers:

| Layer | File | Scope | Examples |
|-------|------|-------|----------|
| **Project-specific** | `docs/CLAUDE.md` | This boilerplate only | Use `HTTPClient` protocol, follow MVVM, inject via `CompositionRoot`, use `DSColors` tokens, **[4.3 differentiation](docs/checklists/APP_STORE_4_3_HARDENING.md)** before App Store |
| **Domain-wide** | Skills (`.agents/skills/`) | Any iOS project | SwiftUI state management, App Store guidelines, simulator workflows, performance profiling |

**CLAUDE.md** ensures Claude follows *your* architecture. **Skills** ensure Claude follows *iOS best practices*. You need both.

---

## Skill-Module Mapping

Which skills help most when working on each boilerplate module:

| Module | Best Skills | Why |
|--------|------------|-----|
| **FeatureChat** | SwiftUI Best Practices, Axiom | View architecture, state management, SwiftUI debugging |
| **Auth** | Apple Skills, iOS Dev Guide | App Store review guidelines, security patterns |
| **Payments** | Apple Skills | In-app purchase guidelines, subscription compliance |
| **AI** | Axiom, iOS Dev Guide | Async/await patterns, streaming, concurrency |
| **Storage** | Axiom | SwiftData best practices, migration strategies |
| **DesignSystem** | SwiftUI Best Practices | Accessibility, Dynamic Type, theming patterns |
| **FeatureRating** | Apple Skills | App Store review API guidelines, SKStoreReviewController |
| **Localization** | Apple Skills, SwiftUI Best Practices | L10n best practices, pluralization, VoiceOver |
| **Networking** | Axiom, iOS Dev Guide | HTTP client patterns, retry logic, interceptors |
| **Core** | iOS Dev Guide | Error handling, logging, Swift 6 concurrency |
| **FeatureSettings** | SwiftUI Best Practices | Settings UI patterns, UserDefaults, preferences |
| **Testing** | iOS Simulator, Apple Skills | Simulator automation, snapshot testing, CI/CD |

---

## 0-Shot Project Creation

With the boilerplate + skills + Claude Opus 4.6, you can create production-quality iOS apps with minimal prompting.

**What makes it work:**

1. **CLAUDE.md** tells Claude about your architecture (MVVM, protocols, DI, module boundaries)
2. **Skills** give Claude iOS best practices (SwiftUI patterns, App Store rules, testing strategies)
3. **The boilerplate itself** provides 11 working modules as reference implementations
4. **Claude Opus 4.6** has the reasoning capability to combine all three

**Example prompt:**

```
Build me a recipe sharing app. Users should be able to:
- Sign in with Apple
- Create and share recipes with photos
- Subscribe for premium features (unlimited recipes)
- Get AI-powered recipe suggestions

Use the existing Auth, Payments, AI, and Storage modules.
Add a new FeatureRecipes package following the FeatureChat pattern.
```

Claude will:
- Follow MVVM from `docs/CLAUDE.md`
- Use proper SwiftUI patterns from SwiftUI Best Practices skill
- Handle App Store compliance from Apple Skills
- Wire everything through `CompositionRoot`
- Write tests following existing test patterns

**Tips for best results:**

- Be specific about which existing modules to use
- Reference existing patterns ("follow the FeatureChat pattern")
- Let Claude read `docs/CLAUDE.md` and the relevant module docs first
- Start with the architecture, then iterate on UI

---

## Managing Skills

```bash
# List installed skills
npx skills list

# Add a specific skill
npx skills add <owner>/<repo> --all

# Remove a skill
npx skills remove <skill-name>

# Update all skills
npx skills update

# Restore from lock file (after cloning)
npx skills experimental_install
```

---

## Creating Custom Skills

You can create project-specific skills by adding a `SKILL.md` file in `.agents/skills/<skill-name>/`:

```yaml
---
name: my-custom-skill
description: When to trigger this skill
---

# Skill content here
Your custom instructions for Claude...
```

See the [official skills documentation](https://github.com/anthropics/skills) for the full specification.

---

## Resources

- **[docs/CLAUDE.md](docs/CLAUDE.md)** — Project-specific AI guidelines
- **[docs/prompts/](docs/prompts/)** — Ready-to-paste LLM prompts for common tasks
- **[docs/INDEX.md](docs/INDEX.md)** — Documentation hub
- **[Official Claude Code Skills](https://github.com/anthropics/skills)** — Skill specification and templates
