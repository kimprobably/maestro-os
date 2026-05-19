# Feature.Rating -- LLM Prompt Pack

## How to use
Paste prompts into your LLM (Cursor/Claude). Select the module context
(`Packages/FeatureRating/**`) and related app files. After changes:
- Build and run
- Verify behavior & snapshots
- Commit with a clear message

## Quick prompts

1) Customize rating config for your app

Prompt:
"Update the RatingConfig in CompositionRoot.swift with my app name '[YOUR_APP]'. Set the title to 'Loving [YOUR_APP]?', message to something that matches my app's tone, and acceptTitle to 'Rate [YOUR_APP]'. Choose an appropriate SF Symbol icon for the prompt."

2) Add rating actions to your feature

Prompt:
"I have a [DESCRIBE_FEATURE] feature. Add appropriate .record() calls for positive and negative moments. Positive: [LIST_POSITIVE_MOMENTS]. Negative: [LIST_NEGATIVE_MOMENTS]. Use appropriate weights (0.5-3.0) based on significance."

3) Change the pre-prompt popup style

Prompt:
"Modify RatingPromptView to use a bottom sheet style instead of center overlay. Keep the same DesignSystem tokens (DSColors, DSSpacing, DSRadius) and keep the card background on `.saiGlass(.regular, in:)` so it stays on iOS 26 Liquid Glass with the SwiftUI Material fallback below. Maintain accessibility labels and spring animation."

## Guided prompts

1) Add custom rating actions for an interview prep app

- Define actions for interview completion, good scores, streaks
- Define negative actions for recording failures, bad connections
- Wire into relevant ViewModels
- Set appropriate weights

Prompt:
"I'm building an interview prep app. Add rating actions: 'interview_completed' (weight 2.0), 'good_score_received' (weight 3.0), 'streak_day' (weight 1.0), 'practice_session_done' (weight 1.5). Negative: 'recording_failed' (weight 2.0), 'connection_error' (weight 1.0). Wire these into the relevant ViewModels. Update RatingConfig with title 'Crushing your interviews?' and icon 'hands.sparkles'."

2) Add a "feedback instead" option to the rating prompt

- Add a third button to the pre-prompt: "Give Feedback"
- Opens a feedback form or email composer
- Track this as a separate response type

Prompt:
"Add a 'Give Feedback' tertiary button to RatingPromptView below the decline button. When tapped, open a MFMailComposeViewController (or fallback to mailto: URL) pre-filled with app version and device info. Add feedbackEmail to RatingConfig. Track as a new response type in RatingEngine."

3) Add a mini thank-you animation after rating

Prompt:
"After the user taps 'Rate on App Store', show a brief confetti/sparkle animation with a 'Thank you!' message before dismissing. Use DesignSystem tokens. Respect accessibilityReduceMotion. The animation should last 1.5 seconds then auto-dismiss."

## Snippet prompts

1) Record rating action from a SwiftUI view via environment

Prompt:
"Show me how to record a rating action from a SwiftUI view using the appEnv environment. I want to record a positive action when the user completes [DESCRIBE_ACTION]."

2) Add debug controls for rating system

Prompt:
"Add a debug section in SettingsView (behind #if DEBUG) that shows current rating score, action count, last prompt date, and a 'Reset Rating Data' button. Use the ratingClient from appEnv."

3) Adjust scoring thresholds for a casual app

Prompt:
"My app is casual with short sessions. Adjust RatingConfig: lower positiveThreshold to 3.0, minimumActions to 3, increase decayFactor to 0.98 (slower decay), and cooldownDays to 14. Update the title to be more casual/friendly."
