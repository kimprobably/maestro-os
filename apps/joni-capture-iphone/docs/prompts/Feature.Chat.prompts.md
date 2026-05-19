# Feature.Chat — LLM Prompt Pack

## How to use
Paste prompts into your LLM (Cursor/Claude). Select the module context
(`Packages/FeatureChat/**`) and related UI files. After changes:
- Build and run
- Verify behavior & snapshots
- Commit with a clear message

## Quick prompts
1) Switch chat UI to centered layout with adjustable bubble radius (DS tokens)

Prompt:
"Switch chat UI to centered layout. Use Design System spacing/tokens. Expose a `centeredLayoutEnabled` toggle in Settings. Respect DSRadius for bubble rounding. Update snapshot tests."

2) Add subtle typing indicator

Prompt:
"Add a minimal dots-based typing indicator that appears beneath the last assistant message while streaming. Throttle state updates to 600ms."

## Guided prompts
1) Add tool-calling message type with streaming UI updates

- Create a new message role `tool`
- Render a tool section with steps/progress
- Stream updates in real time
- Add tests and sample data

Prompt:
"Introduce a `tool` message role with a compact step list view. Stream chunked updates from the ViewModel. Animate inserts. Add tests verifying step updates and finalization states."

2) Multi-conversation quick switch

Prompt:
"Add a top nav switcher to jump between recent conversations. Persist selection. Ensure search still filters. Add basic tests."

## Snippet prompts
1) Typing indicator view + throttled state updates

Prompt:
"Create `TypingIndicatorView` with three animating dots. Wire to `ChatViewModel.isTyping`. Throttle state changes to 600ms. Ensure smooth appear/disappear."

2) Quick message actions

Prompt:
"Add Copy/Regenerate/Delete actions to message context menu, and unit tests for regenerate logic."
