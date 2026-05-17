# Verify UX Studio Phase

Independently verify the current UX Studio implementation phase for `{{ inputs.app_dir|default("apps/generated-iphone-app") }}`.

Read:

- `.workflow/iphone-app-ux-studio/implementation-plan.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.md`
- `.workflow/iphone-app-ux-studio/design/screen-spec.json`
- `.workflow/iphone-app-ux-studio/evidence/visual-system.md` when verifying `visual-system`
- `.workflow/iphone-app-ux-studio/evidence/screen-flows.md` when verifying `screen-flows`
- changed app source, tests, screenshot manifests, Appium identifiers, and relevant review notes

Use the current Fabro stage label or the immediately preceding implementation stage to identify the phase. If that is ambiguous, inspect pending verifier notes and update only one evidence file:

- `visual-system`: `.workflow/iphone-app-ux-studio/evidence/visual-system.md`
- `screen-flows`: `.workflow/iphone-app-ux-studio/evidence/screen-flows.md`

## Verify

Check that:

- the phase stayed inside its scope and did not rebuild auth, payments, entitlements, networking, storage, localization infrastructure, bundle ID, release configuration, or unrelated app behavior
- the evidence lists files changed, commands run, acceptance criteria, risks, and phase-specific notes
- implementation claims are visible in code, tests, previews, screenshots, Appium output, or other concrete artifacts
- `visual-system` has app-specific SwiftUI tokens/components, Dynamic Type behavior, VoiceOver support, and state coverage rather than generic styling
- `screen-flows` implements the selected direction across required screen ids or clearly documents absent screens without hiding gaps
- Appium identifiers remain stable or are intentionally changed with replacement identifiers documented
- screenshot states are captured or explicitly identified as still pending for the retry target
- Mobbin, Pageflows, competitor screenshots, competitor copy, brand identity, and proprietary interaction sequences are treated as abstract references only and are not copied
- no secrets, credentials, tokens, cookies, private keys, signed URLs, customer data, or environment values appear in evidence or logs

## Required Update

Update the same evidence file by replacing the current verifier decision under `## Verifier notes`.

You are the independent verifier for this phase. Updating verifier notes, verifier
reports, or the Codex stage output is not implementation work. If your verification
pass is read-only with respect to app source, tests, previews, and implementation
evidence, do not leave `- Pending independent verifier.` in the evidence file.
The phase evidence gate treats `- Pending independent verifier.` as a rejection
after this verifier stage.

If acceptable, write a concise verifier note that avoids the gate rejection phrases and includes concrete evidence, for example:

`- Accepted by independent verifier: reviewed files, commands, and screenshots; phase scope is acceptable to advance.`

If not acceptable, write a concise rejection note that includes the exact retry target, for example:

`- Rejected by independent verifier: retry visual-system because Dynamic Type evidence is missing.`

Keep only the current decision under `## Verifier notes`. Do not preserve older rejected,
pending, retry, or not-acceptable bullets in that section. If historical context is useful,
move it to `## Risks` or another evidence section so the gate can evaluate the latest verifier
decision unambiguously.

Do not self-approve implementation work you performed in the same stage. Only leave
`- Pending independent verifier.` if you directly changed app source, tests,
previews, screenshot manifests, Appium identifiers, or implementation evidence
beyond the verifier note itself; explain those implementation edits outside the
evidence file so a later verifier can review them.

## Output Rules

- Preserve the evidence headings and existing useful evidence.
- Do not delete risks; refine them if needed.
- Do not print secrets or environment values. If a source contains secret material, write only: `secret material omitted`.
