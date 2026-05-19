# Feature.Settings — LLM Prompt Pack

## How to use
Select `Packages/FeatureSettings/**` and related UI files. After changes:
- Build and run
- Test theme switching and settings persistence
- Commit with clear message

## Quick prompts

1) Add notification settings toggle

Prompt:
"Add a 'Push Notifications' toggle in Settings. Store the preference in SettingsDTO. Show it under an 'App' section. Use DSColors and follow existing toggle patterns."

2) Add model selection preference

Prompt:
"Add a model picker in Settings that lets users choose their preferred AI model (GPT-4o, GPT-4o-mini, Claude). Store in SettingsDTO. Pass to ChatViewModel when creating conversations."

## Guided prompts

1) Add usage statistics dashboard

Prompt:
"Create a 'Usage' section in Settings showing:
- Total messages sent
- Total conversations
- Subscription status
- Account creation date

Fetch from repositories. Display with SAICard. Add icons using SF Symbols. Follow the section pattern in SettingsView."

2) Add export data feature

Prompt:
"Add 'Download My Data' button in Settings that exports all conversations and messages as JSON. Use FileExporter to let users save the file. Add confirmation dialog. Follow GDPR best practices. Use repository.fetchAll() methods."

## Snippet prompts

1) Account deletion flow

Prompt:
"Add 'Delete Account' button in Settings under 'Account' section. Show confirmation dialog with warning text. Call authClient.deleteAccount() (you'll need to implement this). Clear all local data. Navigate to sign-in screen."

2) Custom theme preview

Prompt:
"Add theme preview circles above the theme picker showing each theme's primary color. Make them tappable to switch themes. Arrange in horizontal scroll. Use DSSpacing for layout."
