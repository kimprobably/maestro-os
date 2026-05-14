# LLM Prompt Packs

Ready-to-paste prompts for customizing SwiftAI Boilerplate Pro with AI assistants (Cursor, Claude, etc.).

## How to Use Prompt Packs

1. **Select Context**: Use your IDE to select the relevant module or files
2. **Copy Prompt**: Copy the prompt from the pack
3. **Paste to AI**: Paste into Cursor, Claude, or your preferred AI assistant
4. **Review Changes**: Always review AI-generated code before running
5. **Test**: Build, run, and verify the changes work as expected
6. **Commit**: Commit with a clear message describing the change

## Safety Checklist

Before accepting AI changes:
- [ ] Code compiles without errors
- [ ] Tests pass (or new tests added)
- [ ] Follows existing patterns (MVVM, protocols, etc.)
- [ ] Uses design system tokens (not hardcoded values)
- [ ] Handles errors gracefully
- [ ] No sensitive data hardcoded
- [ ] Accessibility considered
- [ ] **If preparing App Store submission:** No template fingerprints in Release binary — see [APP_STORE_4_3_HARDENING.md](../checklists/APP_STORE_4_3_HARDENING.md) and [AppStore4_3Hardening.prompts.md](AppStore4_3Hardening.prompts.md)

## Available Prompt Packs

### Shipping & App Review
- [AppStore4_3Hardening.prompts.md](AppStore4_3Hardening.prompts.md) - Guideline **4.3(a)** differentiation (binary audit, module removal, Review Notes)

### Feature Modules
- [Feature.Chat.prompts.md](Feature.Chat.prompts.md) - Chat UI, streaming, limits
- [Feature.Settings.prompts.md](Feature.Settings.prompts.md) - Settings, paywall, theme
- [Feature.Payments.prompts.md](Feature.Payments.prompts.md) - Subscriptions, tiers, gates

### UI Modules
- [HomeViewModule.prompts.md](HomeViewModule.prompts.md) - Home screen customization
- [OnboardingModule.prompts.md](OnboardingModule.prompts.md) - Onboarding flow, steps

## Prompt Types

### Quick Prompts
Single-file changes, 5-15 minutes:
- Change colors or spacing
- Update text copy
- Modify simple logic

### Guided Prompts
Multi-file features, 30-60 minutes:
- Add new screens
- Implement new features
- Integrate services

### Snippet Prompts
Copy-paste code snippets:
- Ready-to-use components
- Utility functions
- Pattern examples

## Best Practices

### Context Selection
```
Good: Select entire module (Packages/FeatureChat/**)
Better: Select specific files if you know exactly what to change
```

### Prompt Clarity
```
Good: "Add a typing indicator to chat that shows while AI is responding"
Better: "Add a typing indicator to ChatView that shows animated dots while ChatViewModel.isStreaming is true. Use DSColors and DSTypography."
```

### Incremental Changes
```
Good: Make one feature change at a time
Bad: Ask AI to refactor 5 things simultaneously
```

## Example Workflow

```
1. Choose feature: "Add message reactions"
2. Read prompt pack: Feature.Chat.prompts.md
3. Select context: Packages/FeatureChat/**
4. Paste prompt: "Add emoji reactions to chat messages..."
5. Review changes: Check MessageDTO, ChatViewModel, ChatView
6. Test: Send message, long-press, add reaction
7. Commit: "Add emoji reactions to chat messages"
```

## Tips

- Start with Quick prompts to learn the patterns
- Reference architecture docs in complex prompts
- Ask AI to explain changes if unclear
- Test thoroughly before moving to next feature
- Keep CLAUDE.md open for AI assistant guidelines

## Related Docs

- [CLAUDE.md](../../CLAUDE.md) - Guidelines for AI assistants
- [BUILDING_YOUR_APP.md](../../BUILDING_YOUR_APP.md) - Manual + AI customization guide
- [docs/foundations/Architecture.md](../foundations/Architecture.md) - System patterns
