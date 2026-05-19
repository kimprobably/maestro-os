# Documentation Guide

**SwiftAI Boilerplate Pro** uses a **three-tier documentation system** designed for rapid setup, deep customization, and API reference.

## Quick Start for New Buyers

### 1. First-Time Setup → Mintlify Docs

**Run locally:**
```bash
cd docs-site
npm install -g mintlify
mintlify dev
```

Then open http://localhost:3000

**What's in Mintlify:**
- ✅ Installation and quick start (10-minute setup)
- ✅ Integration guides (Supabase, RevenueCat, Crashlytics)
- ✅ Module overviews with code examples
- ✅ Troubleshooting and migrations
- ✅ Publishing to App Store

**Navigation:**
- Getting Started → Install, Quick Start, Building Your App
- Integrations → Supabase, RevenueCat, Crashlytics
- Modules → All 9 packages with time-saved estimates
- Reference → Config, Scripts, Changelog, Features

### 2. Customization & Patterns → /docs Folder

**Location:** `docs/` in project root

**What's in /docs:**
- ✅ Module deep-dives with customization recipes
- ✅ Architecture and design patterns
- ✅ LLM Prompt Packs for AI-assisted development
- ✅ Recipes (white-labeling, theming, app icons, deep links)
- ✅ Maintenance (changelog, release process)

**Structure:**
```
docs/
├── INDEX.md                    # Start here
├── foundations/                # Architecture, design, testing
├── modules/                    # Per-module customization
├── integrations/               # External service setup
├── migrations/                 # Version upgrades
├── recipes/                    # Common tasks
├── maintenance/                # Release process
└── prompts/                    # LLM Prompt Packs
```

## When to Use Which Tier

| Task | Use | Location |
|------|-----|----------|
| Initial setup | Mintlify | `docs-site/pages/installation.mdx` |
| Deploy Supabase | Mintlify | `docs-site/pages/integrations/supabase.md` |
| Customize chat UI | /docs | `docs/modules/Feature.Chat.md` |
| Change theme | /docs | `docs/recipes/Theming.md` |
| White-label app | /docs | `docs/recipes/WhiteLabeling.md` |
| Add new feature | /docs | `docs/foundations/Architecture.md` |
| Use AI prompts | /docs | `docs/prompts/` |
| Learn AuthClient API | Package README | `Packages/Auth/README.md` |
| Learn HTTPClient API | Package README | `Packages/Networking/README.md` |
| Implement custom LLM | Package README | `Packages/AI/README.md` |
| Troubleshoot | Mintlify | `docs-site/pages/troubleshooting.md` |
| Publish to App Store | Mintlify | `docs-site/pages/guides/deployment.mdx` |

## For AI-Assisted Development

### Essential Files

1. **[CLAUDE.md](CLAUDE.md)** - Guidelines for AI assistants
   - Architecture patterns
   - Code conventions  
   - Common pitfalls
   - Example snippets

2. **[docs/prompts/](docs/prompts/)** - Ready-to-paste LLM prompts
   - Feature.Chat.prompts.md
   - Feature.Settings.prompts.md
   - Feature.Payments.prompts.md
   - HomeViewModule.prompts.md
   - OnboardingModule.prompts.md

3. **[BUILDING_YOUR_APP.md](BUILDING_YOUR_APP.md)** - Manual + AI guide
   - 50+ ready-to-use prompts
   - Step-by-step customization
   - AI vs manual approaches

### Recommended Workflow

```
1. Read CLAUDE.md first (understand patterns)
2. Select module to customize
3. Open relevant prompt pack (docs/prompts/*)
4. Copy prompt and paste to Cursor/Claude
5. Review AI changes
6. Test and commit
```

## For Manual Development

### Essential Files

1. **[docs/INDEX.md](docs/INDEX.md)** - Documentation hub
2. **[docs/foundations/Architecture.md](docs/foundations/Architecture.md)** - System design
3. **Module docs** in `docs/modules/` - Customization recipes
4. **[BUILDING_YOUR_APP.md](BUILDING_YOUR_APP.md)** - Step-by-step guide

## Module Time Savings

Each module includes realistic time-saved estimates:

| Module | Time Saved | Key Features |
|--------|-----------|--------------|
| **Core** | 6-10 hrs | Error handling, logging |
| **Networking** | 12-20 hrs | HTTP client, interceptors, retry |
| **Storage** | 16-24 hrs | SwiftData, Keychain, repositories |
| **Auth** | 20-32 hrs | Apple + Google + Email via Supabase |
| **Payments** | 16-24 hrs | RevenueCat subscriptions |
| **AI** | 24-40 hrs | LLM streaming, proxy |
| **Feature Chat** | 40-60 hrs | 2 UI styles, pagination |
| **Settings** | 12-16 hrs | Theme picker, paywall |
| **Design System** | 20-32 hrs | 5 themes, tokens, components |

**Total: 166-258 hours** (6-10 weeks of development)

See methodology: `docs/maintenance/ReleaseProcess.md#estimations-method`

## Quick Links

### Setup
- [Installation](docs-site/pages/installation.mdx) - Mintlify
- [Quick Start](docs-site/pages/quickstart.mdx) - Mintlify
- [Building Your App](docs-site/pages/guides/building-your-app.mdx) - Mintlify

### Integration
- [Supabase](docs-site/pages/integrations/supabase.md) - Mintlify
- [RevenueCat](docs-site/pages/integrations/revenuecat.md) - Mintlify
- [Authentication Setup](docs-site/pages/guides/authentication.mdx) - Mintlify

### Customization
- [White Labeling](docs/recipes/WhiteLabeling.md) - /docs
- [Theming](docs/recipes/Theming.md) - /docs
- [Module Customization](docs/modules/) - /docs
- [LLM Prompts](docs/prompts/) - /docs

### Development
- [CLAUDE.md](CLAUDE.md) - AI guidelines
- [Architecture](docs/foundations/Architecture.md) - System design
- [Testing](docs/foundations/TestingStrategy.md) - Test strategy

## Navigation Validation

All links have been updated to point to the new structure:
- ✅ Mintlify pages reference `/docs/*` files
- ✅ README points to Mintlify and CLAUDE.md
- ✅ /docs/INDEX.md lists all available docs
- ✅ Cross-links verified
- ✅ Duplicates removed

## Support Resources

- 📖 [Documentation Hub](docs/INDEX.md)
- 🤖 [AI Development Guide](docs/CLAUDE.md)
- 📚 [Building Guide](docs/BUILDING_YOUR_APP.md)
- 🚀 [Mintlify Site](docs-site/) - Run `mintlify dev`

---

**Ready to build? Start with the [Mintlify docs](docs-site/) or dive into [customization guides](docs/INDEX.md).**

