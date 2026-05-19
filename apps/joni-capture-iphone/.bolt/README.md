# Bolt AI Configuration

This directory contains configuration files for Bolt.new and Bolt AI tools.

## Files

### `config.json` - Project Configuration
Defines project metadata, structure, architecture, and integrations.

**Key sections**:
- **Project info**: Name, version, type (iOS)
- **Structure**: App target, packages, composition
- **Dependencies**: Supabase, RevenueCat, Firebase
- **Architecture**: MVVM, repository pattern, protocols
- **Quality standards**: Swift 5.9+, testing requirements
- **Integrations**: Auth, payments, backend, AI

### `settings.json` - Development Settings
Defines development environment, build configuration, and AI preferences.

**Key sections**:
- **Workspace**: Directories and file paths
- **Development**: Xcode version, simulator, testing
- **Build**: Configuration, optimization
- **AI preferences**: Code style, patterns, formatting
- **Testing**: Unit tests, coverage targets
- **Deployment**: Platform, minimum iOS version

### `chat-modes.json` - Specialized AI Assistants
Defines different AI "modes" for specific tasks.

**Available modes**:
- `ios-dev` - General iOS/SwiftUI development
- `ios-arch` - Architecture and modular design
- `ios-ui` - SwiftUI views and DesignSystem
- `ios-feature` - Feature module development
- `ios-integration` - Third-party integrations
- `ios-test` - Unit tests and mocks
- `ios-debug` - Bug diagnosis and fixes
- `ios-perf` - Performance optimization
- `ios-package` - Swift Package Manager
- `ios-deploy` - App Store deployment
- `ios-a11y` - Accessibility (VoiceOver)
- `ios-doc` - Documentation writing

## How to Use

### With Bolt AI

If using Bolt.new or Bolt AI tools:

1. **Open project in Bolt**
2. **Select a chat mode** (or use default `ios-dev`)
3. **AI will follow configuration automatically**

### Selecting Chat Modes

Use shortcuts in chat:
```
/arch - Architecture advisor
/ui - SwiftUI specialist
/test - Testing engineer
/debug - Debug specialist
/deploy - DevOps engineer
```

Or specify full mode name:
```
Switch to ios-integration mode
```

### Mode Selection Guide

**For new features**: Use `ios-feature` or `ios-dev`
**For UI work**: Use `ios-ui` 
**For integrations**: Use `ios-integration`
**For bugs**: Use `ios-debug`
**For tests**: Use `ios-test`
**For performance**: Use `ios-perf`
**For deployment**: Use `ios-deploy`

## Chat Mode Details

### `ios-dev` (Default)
**Best for**: General development tasks
**Context**: All code, docs, cursor rules
**Focus**: MVVM, async/await, protocol-based design

### `ios-arch`
**Best for**: Architecture decisions, package structure
**Context**: Architecture docs, Package.swift files
**Focus**: Modular design, dependency injection, clean architecture

### `ios-ui`
**Best for**: SwiftUI views, DesignSystem usage
**Context**: DesignSystem package, AppShell views
**Focus**: View composition, state management, accessibility

### `ios-feature`
**Best for**: Creating new feature modules
**Context**: Feature packages, module docs
**Focus**: Self-contained modules, protocol APIs, testing

### `ios-integration`
**Best for**: Supabase, RevenueCat, Firebase setup
**Context**: Integration docs, service packages
**Focus**: Third-party SDKs, error handling, edge cases

### `ios-test`
**Best for**: Writing unit tests
**Context**: Test files, testing strategy docs
**Focus**: XCTest, mocks, async testing, coverage

### `ios-debug`
**Best for**: Fixing bugs, analyzing crashes
**Context**: All code, test files
**Focus**: Bug identification, crash analysis, memory leaks

### `ios-perf`
**Best for**: Performance optimization
**Context**: All code, profiling
**Focus**: Memory management, lazy loading, efficient rendering

### `ios-package`
**Best for**: Creating/modifying packages
**Context**: Package.swift, package sources
**Focus**: SPM best practices, API design, dependencies

### `ios-deploy`
**Best for**: App Store submission, CI/CD
**Context**: Distribution docs, config files
**Focus**: TestFlight, provisioning, release process

### `ios-a11y`
**Best for**: Accessibility improvements
**Context**: Views, DesignSystem
**Focus**: VoiceOver, Dynamic Type, inclusive design

### `ios-doc`
**Best for**: Writing documentation
**Context**: Docs directory, README files
**Focus**: Technical writing, guides, API docs

## Customization

### Adding New Chat Modes

Edit `chat-modes.json`:

```json
{
  "chatModes": {
    "my-mode": {
      "name": "My Mode",
      "description": "What this mode does",
      "systemPrompt": "Instructions for AI",
      "context": ["paths/to/focus/on"],
      "tools": ["codeGeneration", "fileManagement"],
      "model": "claude-3.5-sonnet",
      "temperature": 0.1
    }
  },
  "shortcuts": {
    "mymode": "my-mode"
  }
}
```

### Modifying AI Preferences

Edit `settings.json` → `ai` section:

```json
{
  "ai": {
    "codeStyle": {
      "indentation": 2,
      "lineLength": 120
    },
    "preferences": {
      "architecture": "mvvm",
      "stateManagement": "observable-objects"
    }
  }
}
```

## Integration with Cursor Rules

Bolt configuration works alongside `.cursor/rules/`:

- **Cursor rules**: Define code patterns and quality standards
- **Bolt config**: Define project structure and AI behavior
- **Chat modes**: Provide specialized AI assistants

Together, they ensure AI-generated code follows your project standards.

## Troubleshooting

**AI not following rules?**
- Check if correct chat mode is active
- Verify `.cursor/rules/` files exist
- Restart Bolt/Cursor

**Need different behavior?**
- Switch chat mode: `/arch`, `/ui`, etc.
- Or ask explicitly: "Follow repository pattern"
- Or edit `chat-modes.json` for custom modes

## See Also

- [Cursor Rules README](../.cursor/README.md)
- [Architecture Documentation](../docs/foundations/Architecture.md)
- [Module Documentation](../docs/modules/)
- [Integration Guides](../docs/integrations/)

---

**Note**: These configurations are optional but recommended for AI-assisted development with Bolt.new or similar tools.

