# HomeViewModule — LLM Prompt Pack

## How to use
Select `SwiftAIBoilerplatePro/AppShell/Home*` files. After changes:
- Run previews
- Verify layout and spacing
- Test navigation callbacks
- Commit with clear message

## Quick prompts

1) Change hero copy

Prompt:
"Update the welcome message in HomeView to 'Hello, [User]' with dynamic name from auth user. Change subtitle to 'What would you like to create today?'. Use DSColors.textPrimary and DSTypography."

2) Add streak counter

Prompt:
"Add a streak counter in the hero section showing consecutive days of app usage. Store in SwiftData. Display with fire emoji and count. Style with DSGradient and DSSpacing."

## Guided prompts

1) Add daily tip carousel

Prompt:
"Add a 'Daily Tip' section between Quick Actions and Recent Chats. Show tips about app features in a horizontal carousel. Tips should rotate daily. Store viewed tips to avoid repeats. Use FeatureCard style and DSColors."

2) Add favorites/pinned chats

Prompt:
"Add ability to pin favorite conversations. Show pinned chats in a separate section above Recent Chats. Add pin/unpin button in chat context menu. Store pin status in Conversation model. Use star icon and DSColors.warning for pinned badge."

## Snippet prompts

1) Quick action analytics

Prompt:
"Add analytics tracking to quick action taps. Log event name and timestamp. Create simple analytics manager. Store events in SwiftData. Add 'View Analytics' option in Settings."

2) Personalized greeting by time

Prompt:
"Change welcome message based on time of day: 'Good morning', 'Good afternoon', 'Good evening'. Use current time to determine greeting. Keep existing personalization with user name."
