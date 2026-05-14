# OnboardingModule — LLM Prompt Pack

## How to use
Select `SwiftAIBoilerplatePro/AppShell/Onboarding*` and related views. After changes:
- Run previews
- Verify steps order and transitions
- Commit with a clear message

## Quick prompts
1) Add a Privacy step linking to policy page

Prompt:
"Add a new final Onboarding step titled 'Privacy'. Include a short explanation and a link button to open `Resources/privacy.md` in a sheet."

## Guided prompts
1) Reskin onboarding with brand colors via DS tokens

Prompt:
"Apply brand colors using `DSColors`/`DSGradient`. Update background, button styles, and accent elements. Ensure text contrast remains accessible. Update snapshot tests."

## Snippet prompts
1) Analytics hooks for step start/complete

Prompt:
"Add analytics hooks in OnboardingViewModel: `trackStepStart(name:)` and `trackStepComplete(name:)`. Call them on step appear/continue. Write basic unit tests verifying events are fired."
